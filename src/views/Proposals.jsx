import { useState, useEffect } from "react";
import { Plus, FileText, Clock, Layers, FileDown, FileSignature, Share2, Trash2, Archive, RotateCcw } from "lucide-react";
import ShareDocumentDialog from "../components/ShareDocumentDialog.jsx";
import { saveInvoicePdf } from "../savePdf.js";
import Panel from "../components/Panel.jsx";
import EntityModal from "../components/EntityModal.jsx";
import BusinessPlanModal from "../components/BusinessPlanModal.jsx";
import ContractBuilderModal from "../components/ContractBuilderModal.jsx";
import { useStore } from "../store.jsx";
import { exportDocumentPdf } from "../docPdf.js";
import { parseLegalDocument } from "../documentParser.js";
import { clientPdfFilename, documentPlaceholders, fillDocumentPlaceholders } from "../lib/documentWorkflow.js";
import { ONBOARDING_TEMPLATES } from "../data/onboardingTemplates.js";

const CLIENT = "Client documents";
const TEMPLATES = "Templates";
const COMPANY = "Company documents";
const SECTIONS = [CLIENT, TEMPLATES, COMPANY];
const sectionFor = document => SECTIONS.includes(document.documentSection) ? document.documentSection : CLIENT;
const COMPANY_TEMPLATES = {
  "Meeting Notes": "1. Meeting details\nDate: [Date]\nAttendees: [Names]\n\n2. Decisions\n[Decisions and reasons]\n\n3. Actions\n[Action, owner and due date]",
  "Standard Operating Procedure": "1. Purpose\n[What this process achieves]\n\n2. Responsibilities\n[Owner and approver]\n\n3. Steps\n[Instructions in order]\n\n4. Review\n[Review date and revision notes]",
};
const DOC_TYPES = ["Case Study", "Contract", "Guide", "Document", ...Object.keys(ONBOARDING_TEMPLATES)];
const CASE_PDF_FIELDS = ["title", "target", "value", "duration", "note", "techStack", "phases", "deliverables"];
const TEXT_PDF_FIELDS = ["title", "target", "contractBody"];
const isTextDocument = (type) => DOC_TYPES.includes(type) && type !== "Case Study";
const displayStatus = status => !status || status === "Drafted" ? "Draft" : status;
const STATUS_OPTIONS = ["Draft", "Ready", "Sent"];
const STATUS_COLOR = {
  Draft: "text-ink-dim border-line",
  Ready: "text-glow-blue border-glow-blue/40",
  Drafted: "text-ink-dim border-line",
  Sent: "text-amber border-amber/40",
  Planned: "text-glow-purple border-glow-purple/40",
  Won: "text-glow-blue border-glow-blue/40",
  Signed: "text-glow-blue border-glow-blue/40",
  Active: "text-glow-blue border-glow-blue/40",
};

const FIELDS = [
  { key: "documentSection", label: "Save in", type: "select", options: SECTIONS },
  { key: "docType", label: "Document type", type: "select", options: DOC_TYPES,
    onChange: values => values.docType !== "Contract" && values.status === "Signed"
      ? { ...values, status: "Draft" } : values },
  { key: "title", label: "Title", placeholder: "e.g. Harbor View Guest House pitch site" },
  { key: "target", label: "Target / Party", placeholder: "Who this is for" },
  { key: "value", label: "Value", placeholder: "e.g. R22,000–R40,000 est., or a commission rate" },

  { key: "duration", label: "Duration", placeholder: "e.g. 3–4 weeks, or Ongoing / at-will", showIf: (v) => v.docType === "Case Study" || !v.docType },
  { key: "techStack", label: "Tech stack", placeholder: "e.g. React, Vite, Framer Motion", showIf: (v) => v.docType === "Case Study" || !v.docType },
  { key: "note", label: "Overview", type: "textarea", placeholder: "Short summary", showIf: (v) => v.docType === "Case Study" || !v.docType },
  { key: "phases", label: "Planning → production phases", type: "textarea", rows: 6, placeholder: "One phase per line, format: Phase name: detail", showIf: (v) => v.docType === "Case Study" || !v.docType },
  { key: "deliverables", label: "Deliverables", type: "textarea", placeholder: "Separate items with · ", showIf: (v) => v.docType === "Case Study" || !v.docType },
  {
    key: "contractBody", label: "Document text", type: "textarea", rows: 16,
    placeholder: "1. Section Heading\nLabel: value\nLabel: value\n\n2. Next Section\n...",
    showIf: (v) => isTextDocument(v.docType),
  },
];

function parsePhases(phasesText) {
  if (!phasesText) return [];
  return phasesText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return { name: line, detail: "" };
      return { name: line.slice(0, idx).trim(), detail: line.slice(idx + 1).trim() };
    });
}

function parseDeliverables(text) {
  if (!text) return [];
  return text.split("·").map((d) => d.trim()).filter(Boolean);
}

async function exportCaseStudy(p, output) {
  const phases = parsePhases(p.phases);
  const deliverables = parseDeliverables(p.deliverables);
  const blocks = [
    { type: "paragraph", text: `Prepared for: ${p.target}` },
    { type: "paragraph", text: `Estimated value: ${p.value}   ·   Duration: ${p.duration || "TBD"}` },
  ];
  if (p.note) {
    blocks.push({ type: "heading", text: "Overview" });
    blocks.push({ type: "paragraph", text: p.note });
  }
  if (p.techStack) {
    blocks.push({ type: "heading", text: "Tech Stack" });
    blocks.push({ type: "tags", items: p.techStack.split(",").map((t) => t.trim()).filter(Boolean) });
  }
  if (phases.length > 0) {
    blocks.push({ type: "heading", text: "Planning to Production" });
    phases.forEach((ph) => {
      blocks.push({ type: "paragraph", text: `${ph.name}${ph.detail ? ` — ${ph.detail}` : ""}` });
    });
  }
  if (deliverables.length > 0) {
    blocks.push({ type: "heading", text: "Deliverables" });
    blocks.push({ type: "tags", items: deliverables });
  }
  await exportDocumentPdf({
    filename: clientPdfFilename(p.target, p.title),
    headerTitle: "Project Proposal",
    docTitle: p.title,
    docSubtitle: p.target,
    docMeta: `Status: ${displayStatus(p.status)}`,
    blocks,
  }, output);
}

async function exportTextDocument(p, output) {
  const label = p.docType === "Contract" ? "Agreement" : p.docType;
  const parsed = parseLegalDocument(p.contractBody);
  await exportDocumentPdf({
    filename: clientPdfFilename(p.target, p.title),
    headerTitle: label,
    docTitle: p.title,
    docSubtitle: p.target,
    docMeta: `Status: ${displayStatus(p.status)}`,
    blocks: parsed,
  }, output);
}

function TextDocumentView({ p, projectName, actions }) {
  const blocks = parseLegalDocument(p.contractBody);
  return (
    <div className="relative overflow-hidden rounded-sm p-1 -m-1">
      <div className="bg-[#F7F5EF] text-paper-ink rounded-sm shadow-lg border border-paper-ink/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5 pb-4 border-b border-paper-ink/15">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wide text-paper-ink-soft mb-1">{p.docType === "Contract" ? "Agreement" : p.docType}</p>
            <h3 className="font-doc text-lg font-medium">{p.title}</h3>
            <p className="text-xs text-paper-ink-soft mt-0.5">{[p.target, projectName].filter(Boolean).join(" · ")}</p>
          </div>
          <span className={`text-[10px] font-mono uppercase tracking-wide border rounded-full px-2 py-0.5 shrink-0 ${STATUS_COLOR[p.status] || "border-paper-ink/20 text-paper-ink-soft"}`}>
            {displayStatus(p.status)}
          </span>
        </div>

        {blocks.length > 0 && <details>
          <summary className="cursor-pointer text-sm font-medium">Preview document</summary>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1 mt-3">
            {blocks.map((b, i) => {
              if (b.type === "heading") {
                return <h4 key={i} className="font-doc text-base font-medium mt-4 mb-1.5 first:mt-0">{b.text}</h4>;
              }
              if (b.type === "field") {
                return (
                  <p key={i} className="text-sm leading-relaxed">
                    <span className="font-medium">{b.label}:</span>                   <span className="text-paper-ink-soft">{b.value}</span>
                  </p>
                );
              }
              return <p key={i} className="text-sm text-paper-ink-soft leading-relaxed">{b.text}</p>;
            })}
          </div>
        </details>}

        <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-paper-ink/15">
          {actions}
        </div>
      </div>
    </div>
  );
}


export default function Proposals({intent,onIntentHandled,onNavigate}) {
  const { state, dispatch, notify } = useStore();
  const [modal, setModal] = useState(null);
  const [draft, setDraft] = useState(null);
  const [section, setSection] = useState(CLIENT);
  const [query, setQuery] = useState("");
  const [review, setReview] = useState(null);
  const [archived, setArchived] = useState(false);
  const [projectFilter, setProjectFilter] = useState("");
  const project = state.projects.find(item => item.id === projectFilter);
  const editingStatus = modal && modal !== "new" ? displayStatus(modal.status) : "Draft";
  const options = (items, emptyLabel) => [
    { value: "", label: emptyLabel },
    ...items.map(item => ({ value: item.id, label: item.name })),
  ];
  const fields = [
    ...FIELDS.slice(0, 3),
    { key: "clientId", label: "Client", type: "select", default: "",
      options: options(state.clients, "No linked client"), showIf: v => v.documentSection === CLIENT,
      onChange: values => {
        const client = state.clients.find(item => item.id === values.clientId);
        return client ? { ...values, target: client.name } : values;
      } },
    { key: "projectId", label: "Project", type: "select", default: "",
      options: options(state.projects, "No linked project"), showIf: v => v.documentSection !== TEMPLATES },
    ...FIELDS.slice(3),
    { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS,
      optionsFor: v => [...new Set([...STATUS_OPTIONS, ...(v.docType === "Contract" ? ["Signed"] : []),
        ...(modal?.status && modal.status !== "Signed" ? [modal.status] : [])])],
      showIf: v => v.documentSection === CLIENT },
  ];
  const sectionDocuments = state.proposals.filter(p =>
    sectionFor(p) === section && Boolean(p.archivedAt) === archived &&
    (section === TEMPLATES || !project || p.projectId === project.id)
  );
  const documents = sectionDocuments.filter(p =>
    [p.title, p.target, p.docType, displayStatus(p.status), state.projects.find(item => item.id === p.projectId)?.name].some(value =>
      (value || "").toLowerCase().includes(query.trim().toLowerCase())
    )
  );

  function openSection(nextSection) {
    setSection(nextSection);
    setQuery("");
    setArchived(false);
  }

  function newDocument(values = {}) {
    setArchived(false);
    setDraft({
      status: "Draft",
      projectId: project?.id || "",
      docType: section === CLIENT ? "Case Study" : "Document",
      documentSection: section,
      ...values,
    });
    setModal("new");
  }

  function saveDocument(values, id) {
    const destination = sectionFor(values);
    const client = destination === CLIENT ? state.clients.find(item => item.id === values.clientId) : null;
    const linkedProject = destination !== TEMPLATES ? state.projects.find(item => item.id === values.projectId) : null;
    const payload = {
      ...values,
      status: values.status === "Signed" && values.docType !== "Contract" ? "Draft" : displayStatus(values.status),
      clientId: client?.id || "",
      projectId: linkedProject?.id || "",

    };
    if (destination !== TEMPLATES) {
      for (const key of isTextDocument(values.docType) ? TEXT_PDF_FIELDS : CASE_PDF_FIELDS) {
        payload[key] = fillDocumentPlaceholders(payload[key], client, linkedProject);
      }
    }
    const saved = dispatch({ type: id ? "UPDATE_PROPOSAL" : "ADD_PROPOSAL", id, payload });
    if (saved && destination !== section) openSection(destination);
    if (saved && destination !== TEMPLATES && project && payload.projectId !== project.id) setProjectFilter("");
    if (saved) setQuery("");
    return saved;
  }

  function exportPdf(document, output) {
    return isTextDocument(document.docType) ? exportTextDocument(document, output) : exportCaseStudy(document, output);
  }

  function deleteDocument(document) {
    if (window.confirm(`Delete “${document.title}” from Documents? This cannot be undone.`)) {
      dispatch({ type: "DELETE_PROPOSAL", id: document.id });
    }
  }

  function shareDocument(document) {
    const pdfFields = isTextDocument(document.docType) ? TEXT_PDF_FIELDS : CASE_PDF_FIELDS;
    setReview({ prepare: output => exportPdf(document, output), placeholders: documentPlaceholders(document, pdfFields) });
  }

  async function downloadDocument(document) {
    try {
      await exportPdf(document, saveInvoicePdf);
    } catch {
      notify("PDF export failed. Please try again.");
    }
  }
  const [showPlan, setShowPlan] = useState(false);
  const [showContractBuilder, setShowContractBuilder] = useState(false);
  useEffect(() => {
    if (intent === "contract") setShowContractBuilder(true);
    else if (intent?.projectId) {
      setSection(CLIENT);
      setArchived(false);
      setQuery("");
      setProjectFilter(intent.projectId);
    } else return;
    onIntentHandled();
  }, [intent, onIntentHandled]);

  async function handleContractGenerate(payload) {
    const agreement = { ...payload, status: displayStatus(payload.status), projectId: project?.id || "" };
    if (!dispatch({ type: "ADD_PROPOSAL", payload: agreement })) return false;
    setSection(CLIENT);
    setArchived(false);
    setQuery("");
    try {await exportTextDocument(agreement);}
    catch {notify('Agreement saved. PDF download failed; retry Download PDF from Documents.');}
    return true;
  }

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-5xl mx-auto">
      <div className="page-heading">
        <h1>Documents<span className="accent">.</span></h1>
        <button className="btn primary" onClick={() => newDocument()}>
          <Plus size={16} /> {section === TEMPLATES ? "New template" : "New document"}
        </button>
      </div>

      <nav aria-label="Document sections" className="flex flex-wrap gap-2 mb-6">
        {SECTIONS.map(item => (
          <button key={item} className={`btn ${section === item ? "primary" : "subtle"}`}
            aria-pressed={section === item} onClick={() => openSection(item)}>{item}</button>
        ))}
      </nav>

      {section === CLIENT && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button className="btn subtle" onClick={() => setShowContractBuilder(true)}><FileSignature size={16}/> New contract</button>
          <button className="btn subtle" onClick={() => onNavigate("ledger", "new")}>Create invoice</button>
        </div>
      )}

      {section === TEMPLATES && (
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <Panel>
            <h2 className="font-doc text-lg mb-3">Client templates</h2>
            <div className="flex flex-wrap gap-2">
              <button className="btn subtle" onClick={() => setShowContractBuilder(true)}>Client agreement</button>
              {Object.entries(ONBOARDING_TEMPLATES).map(([type, body]) => (
                <button key={type} className="btn subtle" onClick={() =>
                  newDocument({ docType: type, title: type, contractBody: body, documentSection: CLIENT })}>{type}</button>
              ))}
            </div>
          </Panel>
          <Panel>
            <h2 className="font-doc text-lg mb-3">Company templates</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(COMPANY_TEMPLATES).map(([title, body]) => (
                <button key={title} className="btn subtle" onClick={() =>
                  newDocument({ title, contractBody: body, documentSection: COMPANY })}>{title}</button>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {section === COMPANY && !archived && !project && state.businessPlan && <button onClick={() => setShowPlan(true)} className="w-full text-left group mb-6">
        <Panel padded={false} className="transition-all duration-200 group-hover:border-glow-purple/50">
          <div className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-sm bg-glow-purple/10 border border-glow-purple/30 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-glow-purple" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-sm uppercase tracking-wide mb-0.5">Seed funding business plan</h3>
              <p className="text-xs text-ink-dim">{state.businessPlan?.ask} · click to open</p>
            </div>
          </div>
        </Panel>
      </button>}

      {section !== TEMPLATES && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button className="btn subtle" aria-pressed={archived} onClick={() => setArchived(value => !value)}>
            <Archive size={16}/> {archived ? "Show active documents" : "Show archived documents"}
          </button>
          {project && <button className="btn subtle" onClick={() => setProjectFilter("")}>Clear project filter · {project.name}</button>}
        </div>
      )}
      {section === TEMPLATES && <h2 className="font-doc text-lg mb-3">Saved templates</h2>}
      {sectionDocuments.length > 0 && (
        <div className="records-toolbar">
          <input className="project-search" aria-label="Search documents" placeholder="Search documents…" value={query} onChange={event => setQuery(event.target.value)} />
        </div>
      )}
      {sectionDocuments.length > 0 && !documents.length && <p>No matching documents.</p>}
      {!sectionDocuments.length && !(section === COMPANY && !archived && !project && state.businessPlan) && (
        <div className="card empty-state"><h2>{archived ? "No archived documents" : section === TEMPLATES ? "No saved templates yet" : "No saved documents yet"}</h2></div>
      )}
      <div className="space-y-5">
        {documents.map((p) => {
          const projectName = state.projects.find(item => item.id === p.projectId)?.name;
          const actions = <>
            {section === TEMPLATES && (
              <button className="btn primary" onClick={() => {
                const { id: _id, ...values } = p;
                newDocument({ ...values, documentSection: CLIENT, status: "Draft", clientId: "", projectId: project?.id || "" });
              }}>Use template</button>
            )}
            <button className="btn subtle" onClick={() => setModal(p)}>Edit</button>
            {section !== TEMPLATES && (
              <button className="btn subtle" onClick={() => downloadDocument(p)}><FileDown size={14}/> Download PDF</button>
            )}
            {section === CLIENT && !archived && (
              <>
                <button className="btn subtle" onClick={() => shareDocument(p)}><Share2 size={14}/> Share with client</button>
                {["Draft", "Ready"].includes(displayStatus(p.status)) && (
                  <button className="btn subtle" onClick={() => dispatch({ type: "UPDATE_PROPOSAL", id: p.id, payload: { status: "Sent" } })}>Mark as sent</button>
                )}
              </>
            )}
            {section !== TEMPLATES && (
              <button className="btn subtle" onClick={() => dispatch({ type: "UPDATE_PROPOSAL", id: p.id,
                payload: { archivedAt: archived ? "" : new Date().toISOString() } })}>
                {archived ? <RotateCcw size={14}/> : <Archive size={14}/>} {archived ? "Restore" : "Archive"}
              </button>
            )}
            <button className="btn danger" onClick={() => deleteDocument(p)}><Trash2 size={14}/> Delete</button>
          </>;
          if (isTextDocument(p.docType)) {
            return <TextDocumentView key={p.id} p={p} projectName={projectName} actions={actions} />;
          }

          const phases = parsePhases(p.phases);
          const deliverables = parseDeliverables(p.deliverables);
          const techs = (p.techStack || "").split(",").map((t) => t.trim()).filter(Boolean);
          return (
            <Panel key={p.id} padded={false} className="group">
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-doc text-lg font-medium mb-1">{p.title}</h3>
                    <p className="text-xs text-ink-dim">{[p.target, projectName].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm text-ink">{p.value}</p>
                    <span className={`inline-block mt-2 font-mono text-[9px] uppercase tracking-wide border rounded-full px-2 py-0.5 ${STATUS_COLOR[p.status] || "text-ink-dim border-line"}`}>
                      {displayStatus(p.status)}
                    </span>
                  </div>
                </div>

                {p.note && <p className="text-sm text-ink-dim leading-relaxed mb-4 max-w-2xl">{p.note}</p>}

                <div className="flex flex-wrap gap-4 mb-4">
                  {p.duration && (
                    <span className="flex items-center gap-1.5 text-xs text-ink-dim font-mono">
                      <Clock size={13} className="text-glow-blue" /> {p.duration}
                    </span>
                  )}
                  {techs.length > 0 && (
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <Layers size={13} className="text-glow-purple" />
                      {techs.map((t) => (
                        <span key={t} className="text-[10px] font-mono uppercase tracking-wide border border-line rounded-full px-2 py-0.5 text-ink-dim">{t}</span>
                      ))}
                    </span>
                  )}
                </div>

                {phases.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] font-mono uppercase tracking-wide text-ink-dim mb-2">Planning → production</p>
                    <ol className="space-y-1.5">
                      {phases.map((ph, i) => (
                        <li key={i} className="text-xs text-ink-dim flex gap-2">
                          <span className="text-glow-blue shrink-0 mt-0.5">–</span>
                          <span><span className="text-ink font-medium">{ph.name}</span>{ph.detail && ` — ${ph.detail}`}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {deliverables.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {deliverables.map((d) => (
                      <span key={d} className="text-[10px] font-mono border border-glow-blue/30 text-glow-blue rounded-full px-2 py-0.5">{d}</span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4">
                  {actions}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {review && <ShareDocumentDialog {...review} onClose={() => setReview(null)} />}
      {modal === "new" && (
        <EntityModal
          title={draft.documentSection === TEMPLATES ? "New template" : "New document"}
          fields={fields}
          initial={draft}
          onClose={() => setModal(null)}
          onSave={values => saveDocument(values)}
          wide={true}
        />
      )}
      {modal && modal !== "new" && (
        <EntityModal
          title={section === TEMPLATES ? "Edit template" : "Edit document"}
          fields={fields.map(field => field.key === "status" ? { ...field, default: editingStatus } : field)}
          initial={modal}
          onClose={() => setModal(null)}
          onSave={values => saveDocument(values, modal.id)}
          onDelete={() => dispatch({ type: "DELETE_PROPOSAL", id: modal.id })}
          wide={true}
        />
      )}
      {showPlan && <BusinessPlanModal plan={state.businessPlan} onClose={() => setShowPlan(false)} />}
      {showContractBuilder && (
        <ContractBuilderModal
          onClose={() => setShowContractBuilder(false)}
          onGenerate={handleContractGenerate}
        />
      )}
    </div>
  );
}
