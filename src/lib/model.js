export const STORAGE_KEY = 'codevenient-dashboard-v1';
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const money = n => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 2 }).format(Number(n) || 0);
export const invoiceStatus = (i, date = today()) => i.status !== 'Paid' && i.status !== 'Draft' && /^\d{4}-\d{2}-\d{2}$/.test(i.dueDate) && i.dueDate < date ? 'Overdue' : i.status;
export const totals = (items, taxRate = 0) => {
  const subtotal = Math.round(items.reduce((s, i) => s + Math.round(Number(i.qty) * Number(i.rate) * 100), 0)) / 100;
  const tax = Math.round(subtotal * Number(taxRate)) / 100;
  return { subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100 };
};
export function validateState(s) {
  if (!s || typeof s !== 'object' || s.schemaVersion > 2) throw new Error('Unsupported backup format.');
  s = {...s};
  for (const key of ['projects','notes','proposals','invoices','clients','tasks','expenses']) {
    if (Array.isArray(s[key])) s[key] = s[key].map(row => row && Number.isSafeInteger(row.id) ? {...row,id:String(row.id)} : row);
  }
  for (const key of ['projects', 'notes', 'proposals', 'invoices']) {
    if (!Array.isArray(s[key]) || s[key].length > 10000) throw new Error(`Invalid ${key} data.`);
    const ids = new Set();
    for (const row of s[key]) {
      if (!row || typeof row.id !== 'string' || ids.has(row.id)) throw new Error(`Invalid or duplicate ${key} ID.`);
      ids.add(row.id);
      for (const value of Object.values(row)) if (typeof value === 'string' && value.length > 150000) throw new Error('Text field is too large.');
    }
  }
  for (const i of s.invoices) {
    if (!Array.isArray(i.items) || !['Draft','Sent','Paid','Overdue'].includes(i.status) || typeof i.client !== 'string') throw new Error('Invalid invoice.');
    if (!['subtotal','tax','total'].every(k => typeof i[k] === 'number' && Number.isFinite(i[k]) && i[k] >= 0)) throw new Error('Invalid invoice totals.');
    if (!i.items.every(it => typeof it.service === 'string' && Number.isFinite(Number(it.qty)) && Number(it.qty) > 0 && Number.isFinite(Number(it.rate)) && Number(it.rate) >= 0)) throw new Error('Invalid invoice items.');
  }
  for (const [key, field] of [['projects','name'], ['notes','title'], ['proposals','title']]) {
    if (s[key].some(r => typeof r[field] !== 'string')) throw new Error(`Invalid ${key} record.`);
  }
  for (const key of ['clients','tasks','expenses']) {
    if (s[key] != null && (!Array.isArray(s[key]) || s[key].length > 10000)) throw new Error(`Invalid ${key}.`);
    for (const r of s[key] || []) if (!r || typeof r.id !== 'string') throw new Error(`Invalid ${key} record.`);
  }
  const textFields = ['name','title','body','note','tag','date','dueDate','startDate','group','status','contact','email','phone','client','clientEmail','stack','target','value','duration','techStack','phases','deliverables','contractBody','docType','project','priority','category'];
  for (const collection of ['notes','projects','proposals','invoices','clients','tasks','expenses']) {
    const ids = new Set();
    for (const row of s[collection] || []) {
      if (ids.has(row.id)) throw new Error('Duplicate record IDs.');
      ids.add(row.id);
      for (const key of textFields) if (row[key] != null && (key === 'value' ? !['string','number'].includes(typeof row[key]) : typeof row[key] !== 'string')) throw new Error(`Invalid ${key} field.`);
      if (collection === 'clients' && typeof row.name !== 'string') throw new Error('Invalid client name.');
      if (['tasks','expenses'].includes(collection) && typeof row.title !== 'string') throw new Error('Invalid record title.');
      if (row.done != null && typeof row.done !== 'boolean') throw new Error('Invalid task state.');
    }
  }
  if(s.settings != null && (typeof s.settings !== 'object' || Array.isArray(s.settings))) throw new Error('Invalid settings.');
  if(s.settings?.payment != null) {
    if(typeof s.settings.payment !== 'object' || Array.isArray(s.settings.payment)) throw new Error('Invalid payment details.');
    for(const [key,value] of Object.entries(s.settings.payment)) if(typeof value !== 'string' || value.length > 500) throw new Error(`Invalid payment ${key}.`);
  }
  if(s.businessPlan != null) {
    const b=s.businessPlan;
    if(typeof b !== 'object'||!Array.isArray(b.sections)||b.sections.length>100) throw new Error('Invalid business plan.');
    for(const k of ['title','subtitle','meta','ask']) if(b[k]!=null&&typeof b[k]!=='string') throw new Error('Invalid business plan heading.');
    for(const section of b.sections) {
      if(typeof section.heading!=='string'||!Array.isArray(section.body)||section.body.some(v=>typeof v!=='string')) throw new Error('Invalid business plan section.');
      for(const k of ['table','yearTable']) if(section[k]&&(!Array.isArray(section[k].headers)||section[k].headers.some(v=>typeof v!=='string')||!Array.isArray(section[k].rows)||section[k].rows.some(r=>!Array.isArray(r)||r.some(v=>!['string','number'].includes(typeof v))))) throw new Error('Invalid plan table.');
    }
  }
  if (s.activity != null && (!Array.isArray(s.activity) || s.activity.length > 1000)) throw new Error('Invalid activity list.');
  if ((s.expenses || []).some(e => !Number.isFinite(Number(e.amount)) || Number(e.amount) < 0)) throw new Error('Invalid expense amount.');
  return { ...s, schemaVersion: 2, clients: s.clients || [], tasks: s.tasks || [], expenses: s.expenses || [], theme: s.theme === 'dark' ? 'dark' : 'light', nextInvoiceNumber: Math.max(Number(s.nextInvoiceNumber) || 1, ...s.invoices.map(i => (Number(i.id.replace('INV-', '')) || 0) + 1)) };
}
export function downloadBackup(state) {
  const blob = new Blob([JSON.stringify({ app: 'Codevenient Workspace', exportedAt: new Date().toISOString(), state }, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `codevenient-backup-${today()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
