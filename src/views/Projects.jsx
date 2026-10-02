import { useState } from "react";
import { Plus, User, Calendar, Layers } from "lucide-react";
import Panel from "../components/Panel.jsx";
import EntityModal from "../components/EntityModal.jsx";
import { useStore } from "../store.jsx";

const GROUPS = ["Client", "Prospect", "Internal", "Personal"];
const GROUP_LABELS = { Client: "Client work", Prospect: "Prospects & pitches", Internal: "Internal & products", Personal: "Personal" };
const STATUS_OPTIONS = ["Delivered", "In progress", "Pitch built", "Pitch planned", "On hold"];

const STATUS_COLOR = {
  Delivered: "text-glow-blue border-glow-blue/40",
  "In progress": "text-amber border-amber/40",
  "Pitch built": "text-glow-purple border-glow-purple/40",
  "Pitch planned": "text-ink-dim border-line",
  "On hold": "text-warn border-warn/40",
};

const FIELDS = [
  { key: "name", label: "Project name", placeholder: "e.g. Willow & Wheat Bakery" },
  { key: "group", label: "Category", type: "select", options: GROUPS },
  { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  { key: "stack", label: "Stack", placeholder: "e.g. React/Vite" },
  { key: "contact", label: "Contact person", placeholder: "e.g. Thabo M." },
  { key: "dueDate", label: "Due date", type: "date" },
  { key: "startDate", label: "Start date", type: "date" },
  { key: "note", label: "Description", type: "textarea", rows: 4, placeholder: "What this project is / where it stands" },
];

export default function Projects() {
  const { state, dispatch } = useStore();
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-glow-blue mb-2">YOUR WORK, IN MOTION</p>
          <h1 className="font-display text-2xl uppercase tracking-wide">Projects</h1>
        </div>
        <button
          onClick={() => setModal("new")}
          className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-glow-blue border border-glow-blue/30 rounded-sm px-4 py-2.5 hover:bg-glow-blue/10 transition-colors"
        >
          <Plus size={14} /> New project
        </button>
      </div>

      <div className="records-toolbar"><input className="project-search" aria-label="Search projects" placeholder="Search projects…" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Filter projects" value={status} onChange={e=>setStatus(e.target.value)}>{["All",...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}</select></div>
      {!state.projects.some(p=>JSON.stringify(p).toLowerCase().includes(query.toLowerCase())&&(status==="All"||p.status===status))&&<div className="card empty-state"><h2>No matching projects</h2><p>Create a project or try another search.</p></div>}
      {GROUPS.map((group) => {
        const projects = state.projects.filter((p) => p.group === group && JSON.stringify(p).toLowerCase().includes(query.toLowerCase()) && (status === "All" || p.status === status));
        if (projects.length === 0) return null;
        return (
          <div key={group} className="mb-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim mb-3">{GROUP_LABELS[group]} · {projects.length}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {projects.map((p) => (
                <button key={p.id} onClick={() => setModal(p)} className="text-left group">
                  <Panel padded={false} className="transition-all duration-200 group-hover:border-glow-blue/50 h-full">
                    <div className="p-5 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-doc text-lg font-medium text-ink leading-snug">{p.name}</h3>
                        <span className={`font-mono text-[9px] uppercase tracking-wide border rounded-full px-2 py-0.5 whitespace-nowrap shrink-0 ${STATUS_COLOR[p.status] || "text-ink-dim border-line"}`}>
                          {p.status}
                        </span>
                      </div>
                      {p.note && <p className="text-sm text-ink-dim leading-relaxed mb-3 flex-1">{p.note}</p>}
                      <div className="flex flex-wrap items-center gap-3 mt-auto pt-2 border-t border-line/50 text-[11px] font-mono text-ink-dim">
                        {p.stack && (
                          <span className="flex items-center gap-1"><Layers size={11} className="text-glow-purple" /> {p.stack}</span>
                        )}
                        {p.contact && (
                          <span className="flex items-center gap-1"><User size={11} className="text-glow-blue" /> {p.contact}</span>
                        )}
                        {p.startDate && (
                          <span className="flex items-center gap-1"><Calendar size={11} className="text-amber" /> {p.startDate}</span>
                        )}
                      </div>
                    </div>
                  </Panel>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {modal === "new" && (
        <EntityModal
          title="New project"
          fields={FIELDS}
          initial={{ group: "Client", status: "In progress" }}
          onClose={() => setModal(null)}
          onSave={(values) => dispatch({ type: "ADD_PROJECT", payload: values })}
        />
      )}
      {modal && modal !== "new" && (
        <EntityModal
          title="Edit project"
          fields={FIELDS}
          initial={modal}
          onClose={() => setModal(null)}
          onSave={(values) => dispatch({ type: "UPDATE_PROJECT", id: modal.id, payload: values })}
          onDelete={() => dispatch({ type: "DELETE_PROJECT", id: modal.id })}
        />
      )}
    </div>
  );
}
