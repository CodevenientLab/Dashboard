import useNativeDialog from "./useNativeDialog.js";
import { useState } from "react";
import { X, FileDown, FileSignature } from "lucide-react";
import { CONTRACT_TEMPLATES } from "../data/contractTemplates.js";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function defaultsFor(template) {
  const v = {};
  template.fields.forEach((f) => {
    v[f.key] = f.type === "date" ? todayISO() : (f.default ?? "");
  });
  return v;
}

export default function ContractBuilderModal({ onClose, onGenerate }) {
  const dialogRef = useNativeDialog();
  const [templateId, setTemplateId] = useState(CONTRACT_TEMPLATES[0].id);
  const template = CONTRACT_TEMPLATES.find((t) => t.id === templateId);
  const [values, setValues] = useState(() => defaultsFor(template));

  function selectTemplate(id) {
    const next = CONTRACT_TEMPLATES.find((t) => t.id === id);
    setTemplateId(id);
    setValues(defaultsFor(next));
  }

  function set(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function handleGenerate() {
    if (!values.name || !values.name.trim()) return;
    const contractBody = template.build(values);
    const summary = template.summary(values);
    onGenerate({
      docType: "Contract",
      status: "Drafted",
      techStack: "",
      note: "",
      phases: "",
      deliverables: "",
      contractBody,
      ...summary,
    });
    onClose();
  }

  return (
    <dialog ref={dialogRef} onCancel={onClose} className="legacy-dialog" aria-label="Document editor">

      <div className="relative bg-panel border border-line rounded-sm shadow-2xl w-full max-w-lg my-8 bracket max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="flex items-start justify-between px-6 py-5 border-b border-line/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-glow-blue/10 border border-glow-blue/30 flex items-center justify-center shrink-0">
              <FileSignature size={16} className="text-glow-blue" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-glow-blue mb-0.5">New contract</p>
              <h2 className="font-display text-base uppercase tracking-wide">From template</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-dim hover:text-ink transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <label className="block text-[10px] font-mono uppercase tracking-wide text-ink-dim mb-1.5">Role</label>
          <select
            value={templateId}
            onChange={(e) => selectTemplate(e.target.value)}
            className="w-full bg-panel-raised border border-line rounded-sm px-3 py-2.5 text-sm outline-none focus:border-glow-blue transition-colors cursor-pointer mb-6"
          >
            {CONTRACT_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>

          <div className="space-y-4">
            {template.fields.map((f) => (
              <div key={f.key}>
                <label className="block text-[10px] font-mono uppercase tracking-wide text-ink-dim mb-1.5">{f.label}</label>
                <input
                  type={f.type || "text"}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full bg-panel-raised border border-line rounded-sm px-3 py-2 text-sm outline-none focus:border-glow-blue transition-colors"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-sm text-xs font-mono uppercase tracking-wide bg-glow-blue/10 text-glow-blue border border-glow-blue/40 hover:bg-glow-blue/20 transition-colors"
          >
            <FileDown size={14} /> Generate & download
          </button>
          <p className="text-[10px] text-ink-dim text-center mt-3">
            Saves to Proposals and downloads a PDF ready to send for signature.
          </p>
        </div>
      </div>
    </dialog>
  );
}
