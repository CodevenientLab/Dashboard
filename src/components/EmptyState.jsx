export default function EmptyState({ label, hint, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-glyph">◇</div>
      <p className="empty-label">{label}</p>
      {hint && <p className="empty-hint">{hint}</p>}
      {actionLabel && (
        <button type="button" className="action-button" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  )
}
