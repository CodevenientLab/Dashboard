// Shared PDF document generator — used for the business plan and proposal
// exports. Renders a Codevenient letterhead (logo + name) on every page and
// a footer (tagline + page number), with automatic pagination for long
// flowing text and simple tables.
let jsPDF;
import logoIconUrl from "./assets/logo-icon.png";

const COLORS = {
  navy: [8, 24, 55],
  purple: [104, 32, 255],
  ink: [27, 42, 46],
  inkSoft: [61, 74, 77],
  paper: [237, 234, 225],
  paperDim: [226, 222, 210],
};

let logoDataUrlPromise = null;
function getLogoDataUrl() {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = fetch(logoIconUrl)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      );
  }
  return logoDataUrlPromise;
}

const MARGIN = 16;
const HEADER_H = 26;
const FOOTER_H = 14;

function newDoc() {
  return new jsPDF({ unit: "mm", format: "a4" });
}

async function drawHeader(doc, logoData, title) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(...COLORS.paper);
  doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), "F");
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageW, HEADER_H, "F");
  if (logoData) {
    doc.addImage(logoData, "PNG", MARGIN, 5, 16, 16);
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.text("Codevenient Consulting", MARGIN + 20, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(200, 210, 230);
  doc.text("Convenient Code. Infinite Potential!", MARGIN + 20, 17.5);
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(title, pageW - MARGIN, 15, { align: "right" });
}

function drawFooter(doc, pageNum, totalPages) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const y = pageH - FOOTER_H;
  doc.setDrawColor(...COLORS.inkSoft);
  doc.setLineWidth(0.1);
  doc.line(MARGIN, y, pageW - MARGIN, y);
  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.inkSoft);
  doc.text("Codevenient Consulting · Convenient Code. Infinite Potential!", MARGIN, y + 5);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageW - MARGIN, y + 5, { align: "right" });
}

// Generic flowing-document exporter. `title` appears in the header on every
// page; `blocks` is a list of { type, ...} content blocks rendered in order.
export async function exportDocumentPdf({ filename, headerTitle, docTitle, docSubtitle, docMeta, blocks }) {
  ({jsPDF} = await import("jspdf"));
  const doc = newDoc();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - MARGIN * 2;
  const bottomLimit = pageH - FOOTER_H - 6;

  let logoData = null;
  try {
    logoData = await getLogoDataUrl();
  } catch {
    // fall back to no logo image if it fails to load
  }

  let y = HEADER_H + 12;
  await drawHeader(doc, logoData, headerTitle);

  function ensureSpace(neededHeight) {
    if (y + neededHeight > bottomLimit) {
      doc.addPage();
      y = HEADER_H + 12;
      // header is drawn synchronously here since logoData is already resolved
      drawHeaderSync();
    }
  }
  function drawHeaderSync() {
    doc.setFillColor(...COLORS.paper);
    doc.rect(0, 0, pageW, pageH, "F");
    doc.setFillColor(...COLORS.navy);
    doc.rect(0, 0, pageW, HEADER_H, "F");
    if (logoData) doc.addImage(logoData, "PNG", MARGIN, 5, 16, 16);
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.text("Codevenient Consulting", MARGIN + 20, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(200, 210, 230);
    doc.text("Convenient Code. Infinite Potential!", MARGIN + 20, 17.5);
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(headerTitle, pageW - MARGIN, 15, { align: "right" });
  }

  // Title block
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.ink);
  doc.text(docTitle, MARGIN, y);
  y += 7;
  if (docSubtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.inkSoft);
    doc.text(docSubtitle, MARGIN, y);
    y += 6;
  }
  if (docMeta) {
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.inkSoft);
    const metaLines = doc.splitTextToSize(docMeta, contentW);
    doc.text(metaLines, MARGIN, y);
    y += metaLines.length * 3.5 + 4;
  }

  let olCounter = 0;
  let lastWasOl = false;
  for (const block of blocks) {
    if (block.type === "ol-item") {
      block.resetIndex = !lastWasOl;
    }
    lastWasOl = block.type === "ol-item";
    if (block.type === "heading") {
      ensureSpace(10);
      y += 4;
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.navy);
      doc.text(block.text, MARGIN, y);
      y += 6;
    } else if (block.type === "paragraph") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...COLORS.inkSoft);
      const lines = doc.splitTextToSize(block.text, contentW);
      for (const line of lines) {
        ensureSpace(5);
        doc.text(line, MARGIN, y);
        y += 4.6;
      }
      y += 2.5;
    } else if (block.type === "table") {
      const colCount = block.headers.length;
      const colW = contentW / colCount;
      ensureSpace(9);
      doc.setFillColor(...COLORS.navy);
      doc.rect(MARGIN, y - 4.5, contentW, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      block.headers.forEach((h, i) => doc.text(h, MARGIN + i * colW + 2, y));
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      block.rows.forEach((row, ri) => {
        const cellLines = row.map((cell) => doc.splitTextToSize(String(cell), colW - 4));
        const rowHeight = Math.max(...cellLines.map((l) => l.length)) * 4 + 2;
        ensureSpace(rowHeight + 2);
        if (ri % 2 === 0) {
          doc.setFillColor(...COLORS.paperDim);
          doc.rect(MARGIN, y - 3.5, contentW, rowHeight, "F");
        }
        doc.setTextColor(...COLORS.inkSoft);
        cellLines.forEach((lines, i) => doc.text(lines, MARGIN + i * colW + 2, y));
        y += rowHeight;
      });
      y += 3;
    } else if (block.type === "field") {
      ensureSpace(6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...COLORS.ink);
      const labelText = `${block.label}: `;
      doc.text(labelText, MARGIN, y);
      const labelW = doc.getTextWidth(labelText);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.inkSoft);
      const valueLines = doc.splitTextToSize(block.value, contentW - labelW);
      doc.text(valueLines[0] || "", MARGIN + labelW, y);
      y += 4.6;
      for (let i = 1; i < valueLines.length; i++) {
        ensureSpace(5);
        doc.text(valueLines[i], MARGIN, y);
        y += 4.6;
      }
      y += 1.5;
    } else if (block.type === "blockquote") {
      ensureSpace(8);
      doc.setDrawColor(...COLORS.purple);
      doc.setLineWidth(0.8);
      doc.line(MARGIN, y - 3, MARGIN, y + 3);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.inkSoft);
      const lines = doc.splitTextToSize(block.text, contentW - 5);
      for (const line of lines) {
        ensureSpace(5);
        doc.text(line, MARGIN + 4, y);
        y += 4.4;
      }
      y += 2;
    } else if (block.type === "ol-item") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...COLORS.inkSoft);
      olCounter = block.resetIndex ? 1 : olCounter + 1;
      const prefix = `${olCounter}. `;
      const lines = doc.splitTextToSize(block.text, contentW - 6);
      ensureSpace(5);
      doc.text(prefix, MARGIN, y);
      doc.text(lines[0] || "", MARGIN + 6, y);
      y += 4.4;
      for (let i = 1; i < lines.length; i++) {
        ensureSpace(5);
        doc.text(lines[i], MARGIN + 6, y);
        y += 4.4;
      }
    } else if (block.type === "ul-item") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...COLORS.inkSoft);
      const lines = doc.splitTextToSize(block.text, contentW - 6);
      ensureSpace(5);
      doc.text("•", MARGIN, y);
      doc.text(lines[0] || "", MARGIN + 6, y);
      y += 4.4;
      for (let i = 1; i < lines.length; i++) {
        ensureSpace(5);
        doc.text(lines[i], MARGIN + 6, y);
        y += 4.4;
      }
    } else if (block.type === "code") {
      const codeLines = block.text.split("\n");
      const blockH = codeLines.length * 4.2 + 4;
      ensureSpace(blockH + 2);
      doc.setFillColor(...COLORS.paperDim);
      doc.rect(MARGIN, y - 3.5, contentW, blockH, "F");
      doc.setFont("courier", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.ink);
      codeLines.forEach((l) => {
        doc.text(l, MARGIN + 2, y);
        y += 4.2;
      });
      y += 3;
    } else if (block.type === "hr") {
      ensureSpace(5);
      doc.setDrawColor(...COLORS.inkSoft);
      doc.line(MARGIN, y, pageW - MARGIN, y);
      y += 5;
    } else if (block.type === "note") {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.inkSoft);
      const lines = doc.splitTextToSize(block.text, contentW);
      for (const line of lines) {
        ensureSpace(5);
        doc.text(line, MARGIN, y);
        y += 4.2;
      }
      y += 3;
    } else if (block.type === "tags") {
      ensureSpace(8);
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.navy);
      const text = block.items.join("   ·   ");
      const lines = doc.splitTextToSize(text, contentW);
      for (const line of lines) {
        ensureSpace(5);
        doc.text(line, MARGIN, y);
        y += 4.4;
      }
      y += 3;
    }
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPages);
  }

  doc.save(filename);
}
