import { X, FileDown } from "lucide-react";
import { useState } from "react";
import { exportDocumentPdf } from "../docPdf.js";

function SectionTable({ table }) {
  return (
    <table className="w-full text-xs my-4 border border-line">
      <thead>
        <tr className="bg-panel-raised">
          {table.headers.map((h) => (
            <th key={h} className="text-left font-mono uppercase tracking-wide text-ink-dim px-3 py-2 border-b border-line">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row, i) => (
          <tr key={i} className="border-t border-line/60">
            {row.map((cell, j) => (
              <td key={j} className="px-3 py-2 text-ink-dim align-top">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function BusinessPlanModal({ onClose, plan }) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    const blocks = [];
    plan.sections.forEach((section) => {
      blocks.push({ type: "heading", text: section.heading });
      section.body.forEach((paragraph) => blocks.push({ type: "paragraph", text: paragraph }));
      if (section.table) blocks.push({ type: "table", headers: section.table.headers, rows: section.table.rows });
      if (section.yearTable) blocks.push({ type: "table", headers: section.yearTable.headers, rows: section.yearTable.rows });
      if (section.note) blocks.push({ type: "note", text: section.note });
    });
    try {
      await exportDocumentPdf({
        filename: "Codevenient-Business-Plan.pdf",
        headerTitle: "Business Plan",
        docTitle: plan.title,
        docSubtitle: plan.subtitle,
        docMeta: plan.meta,
        blocks,
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8 overflow-y-auto">
      <div className="absolute inset-0 bg-void/80" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-panel border border-line rounded-sm shadow-2xl w-full max-w-3xl my-8 bracket">
        <div className="sticky top-0 bg-panel border-b border-line px-6 md:px-10 py-5 flex items-start justify-between z-10 gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-glow-purple mb-1">{plan.ask}</p>
            <h2 className="font-display text-xl uppercase tracking-wide">{plan.title}</h2>
            <p className="text-xs text-ink-dim mt-1">{plan.subtitle}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wide text-glow-blue border border-glow-blue/30 rounded-sm px-3 py-2 hover:bg-glow-blue/10 transition-colors disabled:opacity-50"
            >
              <FileDown size={13} /> {exporting ? "Preparing…" : "Download PDF"}
            </button>
            <button onClick={onClose} className="text-ink-dim hover:text-ink transition-colors" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-6 md:px-10 py-8">
          <p className="font-mono text-[10px] text-ink-dim/70 mb-8">{plan.meta}</p>
          {plan.sections.map((section) => (
            <div key={section.heading} className="mb-8">
              <h3 className="font-display text-sm uppercase tracking-wide text-glow-blue mb-3">{section.heading}</h3>
              {section.body.map((paragraph, index) => (
                <p key={index} className="text-sm text-ink-dim leading-relaxed mb-3">{paragraph}</p>
              ))}
              {section.table && <SectionTable table={section.table} />}
              {section.yearTable && <SectionTable table={section.yearTable} />}
              {section.note && <p className="text-xs text-ink-dim/80 italic mt-2">{section.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
