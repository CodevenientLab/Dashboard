import useNativeDialog from "./useNativeDialog.js";
import { useState } from "react";
import { X, FileDown, FileSignature } from "lucide-react";
import { CONTRACT_TEMPLATES } from "../data/contractTemplates.js";
import {today} from '../lib/model.js';

function todayISO() {
  return today();
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
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [preview,setPreview] = useState(false);

  function selectTemplate(id) {
    const next = CONTRACT_TEMPLATES.find((t) => t.id === id);
    setTemplateId(id);
    setValues(defaultsFor(next));
    setError('');setPreview(false);
  }

  function set(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function handleGenerate(event) {
    event.preventDefault();
    if (!values.name || !values.name.trim()) return;
    setError('');setBusy(true);
    try {
    if(template.fields.some(f=>f.required&&!String(values[f.key]??'').trim())){
      setError('Complete all required fields before generating the agreement.');return;
    }
    const contractBody = template.build(values);
    const summary = template.summary(values);
    const result = await onGenerate({
      docType: "Contract",
      status: "Drafted",
      techStack: "",
      note: "",
      phases: "",
      deliverables: "",
      contractBody,
      ...summary,
    });
    if(result !== false) onClose();
    else setError('The agreement could not be saved. Please check the workspace status and try again.');
    } catch {setError('The agreement could not be generated. Please try again.');}
    finally {setBusy(false);}
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

        <form className="p-6" onSubmit={handleGenerate}>
          <label htmlFor="contract-template" className="block text-[10px] font-mono uppercase tracking-wide text-ink-dim mb-1.5">Agreement type</label>
          <select
            id="contract-template"
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
                <label htmlFor={`contract-${f.key}`} className="block text-[10px] font-mono uppercase tracking-wide text-ink-dim mb-1.5">{f.label}{f.required ? ' *' : ''}</label>
                {f.type === 'textarea' ? <textarea id={`contract-${f.key}`} required={f.required} maxLength={10000} rows={4} value={values[f.key]??''} onChange={e=>set(f.key,e.target.value)} className="w-full bg-panel-raised border border-line rounded-sm px-3 py-2 text-sm"/> : <input
                  id={`contract-${f.key}`}
                  required={f.required || f.key === 'name'}
                  min={f.min} max={f.max} step={f.step || (f.type==='number'?'1':undefined)} maxLength={500}
                  type={f.type || "text"}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full bg-panel-raised border border-line rounded-sm px-3 py-2 text-sm outline-none focus:border-glow-blue transition-colors"
                />}
              </div>
            ))}
          </div>

          <p className="settings-help">Review the completed agreement before sending it. For South African use, have an attorney check the terms for your services and client type before first use. Generation does not sign the agreement.</p>
          <button type="button" className="btn subtle" onClick={()=>setPreview(!preview)}>{preview?'Hide agreement preview':'Preview agreement'}</button>
          {preview&&<pre style={{whiteSpace:'pre-wrap',fontFamily:'inherit',fontSize:12,marginTop:16,maxHeight:400,overflowY:'auto'}}>{template.build(values)}</pre>}
          {error&&<p role="alert" className="form-error">{error}</p>}
          <button type="submit" disabled={busy}
            className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-sm text-xs font-mono uppercase tracking-wide bg-glow-blue/10 text-glow-blue border border-glow-blue/40 hover:bg-glow-blue/20 transition-colors"
          >
            <FileDown size={14} /> {busy?'Saving…':'Generate & download'}
          </button>
          <p className="text-[10px] text-ink-dim text-center mt-3">
            Saves to Proposals and downloads a PDF ready to send for signature.
          </p>
        </form>
      </div>
    </dialog>
  );
}
