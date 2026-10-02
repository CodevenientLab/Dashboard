// Parses simple structured legal/contract text into blocks for rendering,
// both on-screen and in PDF exports. Convention (matches how people
// naturally type this kind of document):
//   "1. Section Heading"      -> heading
//   "Label: value text"       -> field (short label before a colon)
//   anything else non-blank   -> paragraph
// Blank lines are skipped (spacing handled by the renderer).

export function parseLegalDocument(text) {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (/^\d+\.\s+.+/.test(line)) {
        return { type: "heading", text: line };
      }
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0 && colonIdx <= 40) {
        const label = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim();
        // avoid treating full sentences that happen to contain an early colon as fields
        if (label.split(" ").length <= 6) {
          return { type: "field", label, value };
        }
      }
      return { type: "paragraph", text: line };
    });
}
