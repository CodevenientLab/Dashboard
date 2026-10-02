import useStaleRecord from "./useStaleRecord.js";
import { useState, useRef, useEffect } from "react";
import { X, Trash2 } from "lucide-react";

export default function EntityModal({ title, fields, initial, onSave, onDelete, onClose, wide = false }) {
  const stale = useStaleRecord(initial);
  const [values, setValues] = useState(() => Object.fromEntries(fields.map(f => [f.key, initial?.[f.key] ?? f.default ?? (f.type === "select" ? f.options[0] : "")])));
  const [confirm, setConfirm] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const before = document.activeElement;
    ref.current.showModal();
    return () => before?.focus();
  }, []);

  const set = (key, value) => setValues(current => ({ ...current, [key]: value }));

  return (
    <dialog ref={ref} onCancel={onClose} className={`editor-dialog ${wide ? "wide" : ""}`} aria-labelledby="editor-title">
      <form onSubmit={event => {
        event.preventDefault();
        if (stale) return;
        const result = onSave(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])));
        if (result !== false) onClose();
      }}>
        <div className="dialog-heading">
          <div><div className="eyebrow">WORKSPACE</div><h2 id="editor-title">{title}</h2></div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><X size={20}/></button>
        </div>
        {stale && <div className="system-banner" role="alert">This record changed on another device. Close and reopen it before saving.</div>}
        <div className="form-fields">
          {fields.filter(field => !field.showIf || field.showIf(values)).map(field => {
            return (
              <label key={field.key}>
                {field.label}{(field.required || ["name", "title"].includes(field.key)) && <span className="required"> *</span>}
                {field.type === "textarea"
                  ? <textarea rows={field.rows || 3} maxLength={100000} value={values[field.key]} onChange={event => set(field.key, event.target.value)} placeholder={field.placeholder}/>
                  : field.type === "select"
                    ? <select value={values[field.key]} onChange={event => set(field.key, event.target.value)}>{field.options.map(option => <option key={option}>{option}</option>)}</select>
                    : <input required={field.required || ["name", "title"].includes(field.key)} type={field.type || "text"} min={field.min} step={field.step} maxLength={500} value={values[field.key]} onChange={event => set(field.key, event.target.value)} placeholder={field.placeholder}/>}
              </label>
            );
          })}
        </div>
        <div className="dialog-actions">
          <button className="btn primary" type="submit" disabled={stale}>Save changes</button>
          {onDelete && <button className="btn danger" type="button" onClick={() => setConfirm(true)}><Trash2 size={15}/>Delete</button>}
          <button className="btn subtle" type="button" onClick={onClose}>Cancel</button>
        </div>
        {confirm && <div className="delete-confirm" role="alert"><p>Delete this record? This cannot be undone.</p><button type="button" className="btn danger" disabled={stale} onClick={() => { if (onDelete() !== false) onClose(); }}>Confirm delete</button><button type="button" className="btn subtle" onClick={() => setConfirm(false)}>Keep record</button></div>}
      </form>
    </dialog>
  );
}
