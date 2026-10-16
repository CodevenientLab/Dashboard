import { Capacitor, registerPlugin } from "@capacitor/core";

const InvoiceDownloads = registerPlugin("InvoiceDownloads");

export async function saveInvoicePdf(doc, filename) {
  if (Capacitor.getPlatform() === "android" && Capacitor.isNativePlatform()) {
    const dataUri = doc.output("datauristring");
    const separatorIndex = dataUri.indexOf(",");
    if (separatorIndex < 0) {
      throw new Error("Could not prepare the invoice PDF for download.");
    }
    await InvoiceDownloads.save({
      filename,
      data: dataUri.slice(separatorIndex + 1),
    });
    return;
  }

  doc.save(filename);
}

export async function savePdf(doc, filename) {
  if (!Capacitor.isNativePlatform()) {
    doc.save(filename);
    return;
  }

  const [{ Directory, Filesystem }, { Share }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
  ]);
  const safeFilename = filename.replace(/[\\/:*?"<>|]/g, "-");
  const dataUri = doc.output("datauristring");
  const separatorIndex = dataUri.indexOf(",");
  if (separatorIndex < 0) {
    throw new Error("Could not prepare the PDF for saving.");
  }
  const base64 = dataUri.slice(separatorIndex + 1);
  const { uri } = await Filesystem.writeFile({
    path: safeFilename,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  });

  await Share.share({
    title: safeFilename,
    files: [uri],
    dialogTitle: "Save or share PDF",
  });
}
