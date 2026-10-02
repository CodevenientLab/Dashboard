import { parseInline } from "../markdownLite.js";

function InlineText({ text }) {
  return parseInline(text).map((seg, i) =>
    seg.bold ? <strong key={i} className="font-semibold text-inherit">{seg.text}</strong> : <span key={i}>{seg.text}</span>
  );
}

// Renders parsed markdown-lite blocks (see markdownLite.js) with the app's
// typography. Shared between Notes and any other document-style content.
export default function MarkdownView({ blocks, tone = "dark" }) {
  const textClass = tone === "paper" ? "text-paper-ink-soft" : "text-ink-dim";
  const headingClass = tone === "paper" ? "text-paper-ink" : "text-ink";
  const codeClass = tone === "paper" ? "bg-paper-dim border-paper-ink/15 text-paper-ink" : "bg-panel-raised border-line text-ink";
  const tableHeadClass = tone === "paper" ? "bg-paper-dim text-paper-ink-soft border-paper-ink/15" : "bg-panel-raised text-ink-dim border-line";
  const tableRowClass = tone === "paper" ? "border-paper-ink/10" : "border-line/60";

  return (
    <div className="space-y-2">
      {blocks.map((b, i) => {
        if (b.type === "heading") {
          return <h4 key={i} className={`font-doc text-base font-medium mt-4 mb-1.5 first:mt-0 ${headingClass}`}><InlineText text={b.text} /></h4>;
        }
        if (b.type === "hr") {
          return <hr key={i} className={`my-3 ${tone === "paper" ? "border-paper-ink/15" : "border-line/60"}`} />;
        }
        if (b.type === "blockquote") {
          return (
            <p key={i} className={`text-sm italic border-l-2 border-glow-purple/50 pl-3 py-0.5 ${textClass}`}>
              <InlineText text={b.text} />
            </p>
          );
        }
        if (b.type === "code") {
          return (
            <pre key={i} className={`border rounded-sm p-3 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap ${codeClass}`}>
              {b.text}
            </pre>
          );
        }
        if (b.type === "ol-item" || b.type === "ul-item") {
          return (
            <p key={i} className={`text-sm flex gap-2 pl-1 ${textClass}`}>
              <span className={`shrink-0 ${b.type === "ol-item" ? "text-glow-blue" : "text-glow-purple"}`}>{b.type === "ol-item" ? "•" : "·"}</span>
              <span><InlineText text={b.text} /></span>
            </p>
          );
        }
        if (b.type === "table") {
          return (
            <div key={i} className="overflow-x-auto my-2">
              <table className="w-full text-xs border border-line">
                <thead>
                  <tr className={tableHeadClass}>
                    {b.headers.map((h, hi) => (
                      <th key={hi} className="text-left font-mono uppercase tracking-wide px-2.5 py-1.5 border-b whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((row, ri) => (
                    <tr key={ri} className={`border-t ${tableRowClass}`}>
                      {row.map((cell, ci) => (
                        <td key={ci} className={`px-2.5 py-1.5 align-top ${textClass}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return <p key={i} className={`text-sm leading-relaxed ${textClass}`}><InlineText text={b.text} /></p>;
      })}
    </div>
  );
}
