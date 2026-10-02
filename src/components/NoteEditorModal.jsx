import useStaleRecord from "./useStaleRecord.js";
import useNativeDialog from "./useNativeDialog.js";
import { useState } from "react";
import { X, Trash2, Check, FileDown } from "lucide-react";

const TAG_COLORS = {
  Pricing: "text-glow-blue border-glow-blue/40",
  Brand: "text-glow-purple border-glow-purple/40",
  Outreach: "text-amber border-amber/40",
  General: "text-paper-ink-soft border-paper-ink/20",
};

export default function NoteEditorModal({ initial, onSave, onDelete, onClose, onExport }) {
  const stale=useStaleRecord(initial);
  const dialogRef = useNativeDialog();
  const [title, setTitle] = useState(initial?.title || "");
  const [tag, setTag] = useState(initial?.tag || "General");
  const [body, setBody] = useState(initial?.body || "");

  function handleSave() {
    if(stale)return;
    const saved=onSave({ title: title || "Untitled note", tag, body });
    if(saved!==false)onClose();
  }

  return (
    <dialog ref={dialogRef} onCancel={onClose} className="legacy-dialog" aria-label="Document editor">

      <div className="relative w-full max-w-2xl my-8">
        <div className="relative overflow-hidden rounded-sm p-1 -m-1">
          <div className="notepad rounded-sm shadow-2xl border border-paper-ink/10 pl-9 pr-6 pt-6 pb-6 max-h-[calc(100vh-4rem)] flex flex-col">
            {stale&&<p role="alert" className="form-error">This note changed on another device. Close and reopen it before saving.</p>}<div className="flex items-start justify-between mb-4 shrink-0">
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className={`font-mono text-[10px] uppercase tracking-wide border rounded-full px-2.5 py-1 bg-[#F7F5EF] outline-none cursor-pointer ${TAG_COLORS[tag] || TAG_COLORS.General}`}
              >
                <option value="General">General</option>
                <option value="Pricing">Pricing</option>
                <option value="Brand">Brand</option>
                <option value="Outreach">Outreach</option>
              </select>
              <button onClick={onClose} className="text-paper-ink-soft hover:text-paper-ink transition-colors" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <input
              aria-label="Note title" maxLength={500} value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              className="w-full bg-transparent outline-none font-doc text-2xl font-medium text-paper-ink placeholder:text-paper-ink-soft/50 mb-4 shrink-0"
            />

            <textarea
              aria-label="Note body" maxLength={100000} value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your note…"
              rows={10}
              className="w-full flex-1 bg-transparent outline-none resize-none text-[13px] text-paper-ink-soft min-h-[200px]"
              style={{ lineHeight: "23px" }}
            />

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-paper-ink/10 shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSave} disabled={stale}
                  className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wide bg-paper-ink text-[#F7F5EF] rounded-full px-4 py-2 hover:bg-paper-ink/85 transition-colors"
                >
                  <Check size={13} /> Save note
                </button>
                {onExport && (
                  <button
                    onClick={onExport}
                    className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wide text-paper-ink-soft hover:text-paper-ink transition-colors"
                  >
                    <FileDown size={13} /> Download PDF
                  </button>
                )}
              </div>
              {onDelete && (
                <button
                  onClick={() => { if (!stale && confirm("Delete this note? This cannot be undone.")) { onDelete(); onClose(); } }}
                  className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wide text-warn hover:text-warn/80 transition-colors"
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
