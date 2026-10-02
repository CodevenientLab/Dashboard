export default function Panel({ title, eyebrow, right, className = "", children, padded = true }) {
  return (
    <div className={`bracket bg-panel/70 border border-line rounded-sm ${className}`}>
      {(title || eyebrow || right) && (
        <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3 border-b border-line/70 gap-2">
          <div className="min-w-0">
            {eyebrow && <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-glow-blue mb-0.5 truncate">{eyebrow}</p>}
            {title && <h3 className="font-display text-sm uppercase tracking-wide text-ink truncate">{title}</h3>}
          </div>
          {right}
        </div>
      )}
      <div className={padded ? "p-4 sm:p-5" : ""}>{children}</div>
    </div>
  );
}
