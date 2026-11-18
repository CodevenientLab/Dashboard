export function fillDocumentPlaceholders(body, client, project) {
  const replacements = {
    "Client name": client?.name,
    "Client contact": client?.contact,
    "Client email": client?.email,
    "Client phone": client?.phone,
    "Project name": project?.name,
  };
  return (body || "").replace(/\[([^\][\r\n]+)\]/g, (token, name) =>
    Object.hasOwn(replacements, name) && replacements[name] ? replacements[name] : token
  );
}

export function documentPlaceholders(document, fields) {
  const text = fields.map(field => document[field]).join("\n");
  return [...new Set(text.match(/\[[^\][\r\n]+\]/g) || [])];
}

export function clientPdfFilename(client, title) {
  const slug = value => (value || "").trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
  const prefix = (slug(client) || "Codevenient").slice(0, 50);
  const suffix = (slug(title) || "Document").slice(0, 85);
  return `${prefix}-${suffix}.pdf`;
}
