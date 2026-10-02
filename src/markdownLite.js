// A small markdown-ish parser — enough for the kind of internal guides and
// playbooks Codevenient writes (headings, tables, blockquotes, lists, code
// blocks, bold text) without pulling in a full markdown library. Used for
// both on-screen rendering and PDF export so the two stay in sync.

function parseInline(text) {
  // Splits "some **bold** text" into [{bold:false,text:"some "},{bold:true,text:"bold"},{bold:false,text:" text"}]
  const parts = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ bold: false, text: text.slice(last, m.index) });
    parts.push({ bold: true, text: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ bold: false, text: text.slice(last) });
  return parts.length ? parts : [{ bold: false, text }];
}

function stripBold(text) {
  return text.replace(/\*\*(.+?)\*\*/g, "$1");
}

export function parseMarkdownLite(raw) {
  if (!raw) return [];
  // Collapse "<br>" (and any surrounding blank lines, common when a doc
  // converter breaks a table cell's bullets across physical lines) into a
  // single space, so a table row always stays on one physical line.
  const cleaned = raw.replace(/\s*<br\s*\/?>\s*/gi, " ");
  const lines = cleaned.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    // code fence
    if (trimmed.startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push({ type: "code", text: codeLines.join("\n") });
      continue;
    }

    // table (consecutive pipe-led lines)
    if (trimmed.startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const rows = tableLines
        .filter((l) => !/^\|[\s\-:|]+\|$/.test(l)) // drop separator row
        .map((l) =>
          l
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((cell) => stripBold(cell.trim()))
        );
      const [headers, ...dataRows] = rows;
      if (headers) blocks.push({ type: "table", headers, rows: dataRows });
      continue;
    }

    // heading
    if (/^#{1,3}\s+/.test(trimmed)) {
      blocks.push({ type: "heading", text: stripBold(trimmed.replace(/^#{1,3}\s+/, "")) });
      i++;
      continue;
    }

    // horizontal rule
    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // blockquote (collect consecutive > lines into one block)
    if (trimmed.startsWith(">")) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join(" ") });
      continue;
    }

    // numbered list item
    if (/^\d+\.\s+/.test(trimmed)) {
      blocks.push({ type: "ol-item", text: trimmed.replace(/^\d+\.\s+/, "") });
      i++;
      continue;
    }

    // bullet list item
    if (/^[*-]\s+/.test(trimmed)) {
      blocks.push({ type: "ul-item", text: trimmed.replace(/^[*-]\s+/, "") });
      i++;
      continue;
    }

    // plain paragraph
    blocks.push({ type: "paragraph", text: trimmed });
    i++;
  }

  return blocks;
}

export { parseInline, stripBold };
