// Client-side PDF export for Codevenient Ledger invoices.
// Draws a branded invoice document with jsPDF — no server needed.

import logoIconUrl from "./assets/logo-icon.png";


const COLORS = {
  paper: [237, 234, 225],
  paperDim: [226, 222, 210],
  ink: [27, 42, 46],
  inkSoft: [61, 74, 77],
  navy: [8, 24, 55],
  blue: [13, 158, 249],
  purple: [104, 32, 255],
  mustard: [214, 164, 25],
  rust: [177, 74, 46],
};

const STATUS_COLOR = {
  Draft: COLORS.inkSoft,
  Sent: COLORS.rust,
  Paid: COLORS.blue,
  Overdue: COLORS.rust,
};

function money(n) {
  return `R ${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

// Fetch the bundled logo asset and resolve it as a base64 data URL for jsPDF.
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

export async function exportInvoicePdf(invoice, PAYMENT_DETAILS = {}) {
  const {jsPDF} = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;

  // paper background
  doc.setFillColor(...COLORS.paper);
  doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), "F");

  // header band — brand navy
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageW, 34, "F");
  // gradient hint: a soft purple wash on the right edge of the band
  doc.setFillColor(...COLORS.purple);
  doc.setGState(new doc.GState({ opacity: 0.18 }));
  doc.rect(pageW - 70, 0, 70, 34, "F");
  doc.setGState(new doc.GState({ opacity: 1 }));

  // logo mark (real brand icon)
  try {
    const logoData = await getLogoDataUrl();
    doc.addImage(logoData, "PNG", margin, 8, 18, 18);
  } catch {
    // fallback: simple drawn mark if the image fails to load
    doc.setFillColor(...COLORS.blue);
    doc.circle(margin + 6, 17, 6, "F");
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("Codevenient Consulting", margin + 23, 15.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(200, 210, 230);
  doc.text("Convenient Code. Infinite Potential!", margin + 23, 21);

  doc.setFont("courier", "normal");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(invoice.id, pageW - margin, 15.5, { align: "right" });
  doc.setFontSize(8);
  doc.setTextColor(200, 210, 230);
  doc.text(`Issued ${invoice.date}  ·  Due ${invoice.dueDate}`, pageW - margin, 21, { align: "right" });

  let y = 46;

  // status stamp
  const statusColor = STATUS_COLOR[invoice.status] || COLORS.inkSoft;
  doc.setDrawColor(...statusColor);
  doc.setTextColor(...statusColor);
  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  const stampW = doc.getTextWidth(invoice.status.toUpperCase()) + 8;
  doc.roundedRect(pageW - margin - stampW, y - 6, stampW, 8, 1, 1);
  doc.text(invoice.status.toUpperCase(), pageW - margin - stampW / 2, y - 0.5, { align: "center" });

  // billed to
  doc.setTextColor(...COLORS.inkSoft);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("BILLED TO", margin, y);
  doc.setTextColor(...COLORS.ink);
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.text(invoice.client, margin, y + 6);
  if (invoice.clientEmail) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.inkSoft);
    doc.text(invoice.clientEmail, margin, y + 11);
  }
  if (invoice.recurring) {
    doc.setTextColor(...COLORS.blue);
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text("↻ Repeats monthly", margin, y + (invoice.clientEmail ? 16 : 11));
  }

  y += 26;

  // line items table header
  doc.setFillColor(...COLORS.navy);
  doc.rect(margin, y, pageW - margin * 2, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("SERVICE", margin + 3, y + 5.5);
  doc.text("QTY", pageW - margin - 55, y + 5.5, { align: "right" });
  doc.text("RATE", pageW - margin - 30, y + 5.5, { align: "right" });
  doc.text("AMOUNT", pageW - margin - 3, y + 5.5, { align: "right" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  invoice.items.forEach((it, i) => {
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(it.service, 88);
    const rowH = Math.max(8, lines.length * 4.5 + 4);
    if (y + rowH > 240) { doc.addPage(); y = 22; }

    if (i % 2 === 0) {
      doc.setFillColor(...COLORS.paperDim);
      doc.rect(margin, y, pageW - margin * 2, rowH, "F");
    }
    doc.setTextColor(...COLORS.ink);
    doc.text(lines, margin + 3, y + 5.5);
    doc.setFont("courier", "normal");
    doc.setTextColor(...COLORS.inkSoft);
    doc.text(String(it.qty), pageW - margin - 55, y + 5.5, { align: "right" });
    doc.text(money(it.rate), pageW - margin - 30, y + 5.5, { align: "right" });
    doc.setTextColor(...COLORS.ink);
    doc.text(money(it.qty * it.rate), pageW - margin - 3, y + 5.5, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += rowH;
  });

  if (y > 200) { doc.addPage(); y = 22; }
  y += 6;
  doc.setDrawColor(...COLORS.inkSoft);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(pageW - margin - 70, y, pageW - margin, y);
  doc.setLineDashPattern([], 0);
  y += 6;

  doc.setFont("courier", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.inkSoft);
  doc.text("Subtotal", pageW - margin - 70, y);
  doc.text(money(invoice.subtotal), pageW - margin, y, { align: "right" });
  y += 6;
  doc.text(`Tax (${invoice.taxRate ?? (invoice.subtotal ? Math.round(invoice.tax / invoice.subtotal * 100) : 0)}%)`, pageW - margin - 70, y);
  doc.text(money(invoice.tax), pageW - margin, y, { align: "right" });
  y += 9;

  doc.setDrawColor(...COLORS.ink);
  doc.line(pageW - margin - 70, y - 5, pageW - margin, y - 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.inkSoft);
  doc.text("TOTAL DUE", pageW - margin - 70, y);
  doc.setFont("times", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...COLORS.purple);
  doc.text(money(invoice.total), pageW - margin, y + 1, { align: "right" });

  // payment details
  y += 12;
  doc.setDrawColor(...COLORS.inkSoft);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, pageW - margin, y);
  doc.setLineDashPattern([], 0);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.inkSoft);
  doc.text("PAYMENT DETAILS", margin, y);
  y += 5;
  doc.setFont("courier", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.ink);
  doc.text(`${PAYMENT_DETAILS.bank || "Payment details not configured"} · ${PAYMENT_DETAILS.accountHolder || ""}`, margin, y);
  y += 4.5;
  doc.setTextColor(...COLORS.inkSoft);
  doc.text(`Acc ${PAYMENT_DETAILS.accountNumber || ""} (${PAYMENT_DETAILS.accountType || ""}) · Branch ${PAYMENT_DETAILS.branchCode || ""}`, margin, y);

  // footer
  const footerY = doc.internal.pageSize.getHeight() - 14;
  doc.setDrawColor(...COLORS.inkSoft);
  doc.setLineWidth(0.1);
  doc.line(margin, footerY, pageW - margin, footerY);
  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.inkSoft);
  doc.text("Codevenient Consulting · Convenient Code. Infinite Potential!", margin, footerY + 5);
  doc.text(invoice.id, pageW - margin, footerY + 5, { align: "right" });

  doc.save(`${invoice.id}-${invoice.client.replace(/\s+/g, "-")}.pdf`);
}
