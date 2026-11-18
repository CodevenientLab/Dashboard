import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { FileDown, Share2 } from "lucide-react";
import { saveInvoicePdf, savePdf } from "../savePdf.js";
import useNativeDialog from "./useNativeDialog.js";

export default function ShareDocumentDialog({ prepare, onClose }) {
  const dialog = useNativeDialog();
  const [pdf, setPdf] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    prepare((doc, filename) => {
      if (!active) return;
      const file = new File([doc.output("blob")], filename, { type: "application/pdf" });
      setPdf({ doc, file });
    }).catch(() => {
      if (active) setError("Could not prepare the PDF. Close this window and try again.");
    });
    return () => { active = false; };
  }, [prepare]);

  const native = Capacitor.isNativePlatform();
  const shareData = pdf ? { files: [pdf.file] } : null;
  const canShare = pdf && (native || (typeof navigator.share === "function" && navigator.canShare?.(shareData)));

  async function deliver(share) {
    setBusy(true);
    setError("");
    try {
      if (!share) await saveInvoicePdf(pdf.doc, pdf.file.name);
      else if (native) await savePdf(pdf.doc, pdf.file.name);
      else await navigator.share(shareData);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(share ? "Could not open sharing. Download the PDF and attach it manually." : "Could not download the PDF. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog ref={dialog} className="editor-dialog" onCancel={onClose} aria-labelledby="share-pdf-title">
      <div className="dialog-heading"><h2 id="share-pdf-title">Share with client</h2></div>
      <div className="form-fields">
        {pdf && <p className="break-all">{pdf.file.name}</p>}
        {pdf && <p>Share the PDF or download it and attach it to your email or WhatsApp message. Your client can open the attachment without signing in.</p>}
        {!pdf && !error && <p role="status">Preparing PDF…</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      <div className="dialog-actions">
        {canShare && <button className="btn primary" disabled={busy} onClick={() => deliver(true)}><Share2 size={16}/> Share PDF</button>}
        {pdf && <button className="btn subtle" disabled={busy} onClick={() => deliver(false)}><FileDown size={16}/> Download PDF</button>}
        <button className="btn subtle" onClick={onClose}>Close</button>
      </div>
    </dialog>
  );
}
