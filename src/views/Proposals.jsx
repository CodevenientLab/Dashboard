import { useState } from "react";
import { Plus, FileText, Clock, Layers, FileDown, FileSignature } from "lucide-react";
import Panel from "../components/Panel.jsx";
import EntityModal from "../components/EntityModal.jsx";
import BusinessPlanModal from "../components/BusinessPlanModal.jsx";
import ContractBuilderModal from "../components/ContractBuilderModal.jsx";
import { useStore } from "../store.jsx";
import { exportDocumentPdf } from "../docPdf.js";
import { parseLegalDocument } from "../documentParser.js";

const DOC_TYPES = ["Case Study", "Contract"];
const STATUS_OPTIONS = ["Drafted", "Sent", "Planned", "Won", "Signed", "Active"];
const STATUS_COLOR = {
  Drafted: "text-ink-dim border-line",
  Sent: "text-amber border-amber/40",
  Planned: "text-glow-purple border-glow-purple/40",
  Won: "text-glow-blue border-glow-blue/40",
  Signed: "text-glow-blue border-glow-blue/40",
  Active: "text-glow-blue border-glow-blue/40",
};

const FIELDS = [
  { key: "docType", label: "Document type", type: "select", options: DOC_TYPES },
  { key: "title", label: "Title", placeholder: "e.g. Harbor View Guest House pitch site" },
  { key: "target", label: "Target / Party", placeholder: "Who this is for" },
  { key: "value", label: "Value", placeholder: "e.g. R22,000–R40,000 est., or a commission rate" },
  { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  { key: "duration", label: "Duration", placeholder: "e.g. 3–4 weeks, or Ongoing / at-will", showIf: (v) => v.docType === "Case Study" || !v.docType },
  { key: "techStack", label: "Tech stack", placeholder: "e.g. React, Vite, Framer Motion", showIf: (v) => v.docType === "Case Study" || !v.docType },
  { key: "note", label: "Overview", type: "textarea", placeholder: "Short summary", showIf: (v) => v.docType === "Case Study" || !v.docType },
  { key: "phases", label: "Planning → production phases", type: "textarea", rows: 6, placeholder: "One phase per line, format: Phase name: detail", showIf: (v) => v.docType === "Case Study" || !v.docType },
  { key: "deliverables", label: "Deliverables", type: "textarea", placeholder: "Separate items with · ", showIf: (v) => v.docType === "Case Study" || !v.docType },
  {
    key: "contractBody", label: "Agreement text", type: "textarea", rows: 16,
    placeholder: "1. Section Heading\nLabel: value\nLabel: value\n\n2. Next Section\n...",
    showIf: (v) => v.docType === "Contract",
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

async function exportCaseStudy(p) {
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
    filename: `Codevenient-Proposal-${p.title.replace(/\s+/g, "-")}.pdf`,
    headerTitle: "Project Proposal",
    docTitle: p.title,
    docSubtitle: p.target,
    docMeta: `Status: ${p.status}`,
    blocks,
  });
}

async function exportContract(p) {
  const parsed = parseLegalDocument(p.contractBody);
  await exportDocumentPdf({
    filename: `Codevenient-Agreement-${p.title.replace(/\s+/g, "-")}.pdf`,
    headerTitle: "Agreement",
    docTitle: p.title,
    docSubtitle: p.target,
    docMeta: `Status: ${p.status}`,
    blocks: parsed,
  });
}

function ContractView({ p, onEdit, onExport }) {
  const blocks = parseLegalDocument(p.contractBody);
  return (
    <div className="relative overflow-hidden rounded-sm p-1 -m-1">
      <div className="bg-[#F7F5EF] text-paper-ink rounded-sm shadow-lg border border-paper-ink/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5 pb-4 border-b border-paper-ink/15">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wide text-paper-ink-soft mb-1">Agreement</p>
            <h3 className="font-doc text-lg font-medium">{p.title}</h3>
            <p className="text-xs text-paper-ink-soft mt-0.5">{p.target}</p>
          </div>
          <span className={`text-[10px] font-mono uppercase tracking-wide border rounded-full px-2 py-0.5 shrink-0 ${STATUS_COLOR[p.status] || "border-paper-ink/20 text-paper-ink-soft"}`}>
            {p.status}
          </span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
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

        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-paper-ink/15">
          <button onClick={onEdit} className="text-[10px] font-mono uppercase tracking-wide text-paper-ink-soft hover:text-paper-ink transition-colors">
            Edit →
          </button>
          <button onClick={onExport} className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wide text-glow-blue hover:text-glow-purple transition-colors">
            <FileDown size={12} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}


export default function Proposals() {
  const { state, dispatch } = useStore();
  const [modal, setModal] = useState(null);
  const [showPlan, setShowPlan] = useState(false);
  const [showContractBuilder, setShowContractBuilder] = useState(false);

  function handleContractGenerate(payload) {
    dispatch({ type: "ADD_PROPOSAL", payload });
    // download immediately so it's ready to send for signature right away
    exportContract(payload);
  }

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-glow-blue mb-2">Business development</p>
          <h1 className="font-display text-2xl uppercase tracking-wide">Proposals & documents</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowContractBuilder(true)}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-glow-purple border border-glow-purple/30 rounded-sm px-4 py-2.5 hover:bg-glow-purple/10 transition-colors"
          >
            <FileSignature size={14} /> New contract
          </button>
          <button
            onClick={() => setModal("new")}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-glow-blue border border-glow-blue/30 rounded-sm px-4 py-2.5 hover:bg-glow-blue/10 transition-colors"
          >
            <Plus size={14} /> New document
          </button>
        </div>
      </div>

      {state.businessPlan && <button onClick={() => setShowPlan(true)} className="w-full text-left group mb-6">
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

      {!state.proposals.length && <div className="card empty-state"><h2>Your documents belong here</h2><p>Create a document or import your previous workspace in Settings.</p></div>}
      <div className="space-y-5">
        {state.proposals.filter((p) => p.docType !== "Guide").map((p) => {
          if (p.docType === "Contract") {
            return <ContractView key={p.id} p={p} onEdit={() => setModal(p)} onExport={() => exportContract(p)} />;
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
                    <p className="text-xs text-ink-dim">{p.target}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm text-ink">{p.value}</p>
                    <span className={`inline-block mt-2 font-mono text-[9px] uppercase tracking-wide border rounded-full px-2 py-0.5 ${STATUS_COLOR[p.status] || "text-ink-dim border-line"}`}>
                      {p.status}
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

                <button
                  onClick={() => setModal(p)}
                  className="text-[10px] font-mono uppercase tracking-wide text-ink-dim hover:text-glow-blue transition-colors opacity-0 group-hover:opacity-100"
                >
                  Edit proposal →
                </button>
                <button
                  onClick={() => exportCaseStudy(p)}
                  className="ml-4 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wide text-glow-blue hover:text-glow-purple transition-colors"
                >
                  <FileDown size={12} /> Download PDF
                </button>
              </div>
            </Panel>
          );
        })}
      </div>

      {modal === "new" && (
        <EntityModal
          title="New document"
          fields={FIELDS}
          initial={{ status: "Drafted", docType: "Case Study" }}
          onClose={() => setModal(null)}
          onSave={(values) => dispatch({ type: "ADD_PROPOSAL", payload: values })}
          wide={true}
        />
      )}
      {modal && modal !== "new" && (
        <EntityModal
          title="Edit document"
          fields={FIELDS}
          initial={modal}
          onClose={() => setModal(null)}
          onSave={(values) => dispatch({ type: "UPDATE_PROPOSAL", id: modal.id, payload: values })}
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
