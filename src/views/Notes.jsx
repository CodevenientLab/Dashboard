import { useState } from "react";
import { Plus } from "lucide-react";
import Panel from "../components/Panel.jsx";
import NoteEditorModal from "../components/NoteEditorModal.jsx";
import { useStore } from "../store.jsx";
import { parseMarkdownLite } from "../markdownLite.js";
import { exportDocumentPdf } from "../docPdf.js";

const TAG_COLORS = {
  Pricing: "text-glow-blue border-glow-blue/40",
  Brand: "text-glow-purple border-glow-purple/40",
  Outreach: "text-amber border-amber/40",
  General: "text-ink-dim border-line",
};

// Strips markdown syntax markers for the plain-text card preview, so raw
// "##", "**", "|" characters don't show up in the truncated teaser.
function stripMarkdownForPreview(text) {
  if (!text) return "";
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^\|.*\|$/gm, "")
    .replace(/^[*-]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .trim();
}

async function exportNotePdf(note) {
  const blocks = parseMarkdownLite(note.body);
  await exportDocumentPdf({
    filename: `Codevenient-Note-${note.title.replace(/\s+/g, "-")}.pdf`,
    headerTitle: "Note",
    docTitle: note.title,
    docSubtitle: note.tag,
    docMeta: note.date ? `${note.date}` : "",
    blocks,
  });
}

export default function Notes() {
  const { state, dispatch } = useStore();
  const [query,setQuery] = useState("");
  const [modal, setModal] = useState(null); // null | "new" | note object

  function todayLabel() {
    return new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
  }

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-glow-blue mb-2">YOUR IDEAS, ORGANISED</p>
          <h1 className="font-display text-2xl uppercase tracking-wide">Notes</h1>
        </div>
        <button
          onClick={() => setModal("new")}
          className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-glow-blue border border-glow-blue/30 rounded-sm px-4 py-2.5 hover:bg-glow-blue/10 transition-colors"
        >
          <Plus size={14} /> New note
        </button>
      </div>

      <div className="records-toolbar"><input className="project-search" aria-label="Search notes" placeholder="Search notes…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
      {state.notes.filter(n=>`${n.title} ${n.body}`.toLowerCase().includes(query.toLowerCase())).length === 0 ? (
        <Panel>
          <p className="text-sm text-ink-dim">No notes yet. Start logging what matters — pricing decisions, brand calls, anything worth remembering.</p>
        </Panel>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {state.notes.filter(n=>`${n.title} ${n.body}`.toLowerCase().includes(query.toLowerCase())).map((n, i) => (
            <button
              key={n.id}
              onClick={() => setModal(n)}
              className="text-left group"
            >
              <div className="relative overflow-hidden rounded-sm p-1 -m-1">
                <div
                  className={`notepad rounded-sm shadow-lg border border-paper-ink/10 pl-9 pr-5 pt-5 pb-5 transition-transform duration-200 group-hover:-translate-y-0.5 ${
                    i % 2 === 0 ? "rotate-[-0.6deg]" : "rotate-[0.5deg]"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`font-mono text-[9px] uppercase tracking-wide border rounded-full px-2 py-0.5 ${TAG_COLORS[n.tag] || TAG_COLORS.General} bg-[#F7F5EF]`}>
                      {n.tag}
                    </span>
                    <span className="font-mono text-[9px] text-paper-ink-soft/70">{n.date}</span>
                  </div>
                  <h3 className="font-doc text-lg font-medium text-paper-ink mb-2">{n.title}</h3>
                  <p className="text-[13px] text-paper-ink-soft leading-[23px] line-clamp-4 whitespace-pre-line">{stripMarkdownForPreview(n.body)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {modal === "new" && (
        <NoteEditorModal
          initial={{ tag: "General" }}
          onClose={() => setModal(null)}
          onSave={(values) => dispatch({ type: "ADD_NOTE", payload: { ...values, date: todayLabel() } })}
        />
      )}
      {modal && modal !== "new" && (
        <NoteEditorModal
          initial={modal}
          onClose={() => setModal(null)}
          onSave={(values) => dispatch({ type: "UPDATE_NOTE", id: modal.id, payload: values })}
          onDelete={() => dispatch({ type: "DELETE_NOTE", id: modal.id })}
          onExport={() => exportNotePdf(modal)}
        />
      )}
    </div>
  );
}
