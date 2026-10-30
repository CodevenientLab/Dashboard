import {invoiceStatus, today} from './model.js';

export const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
export const compareDue = (a,b) => (validDate(a.dueDate)?a.dueDate:'9999').localeCompare(validDate(b.dueDate)?b.dueDate:'9999');
export function openInvoices(invoices, date=today()) {
  return invoices.filter(i=>['Sent','Overdue'].includes(invoiceStatus(i,date))).sort(compareDue);
}
export function attentionItems(state, date=today()) {
  return [
    ...openInvoices(state.invoices,date).filter(i=>invoiceStatus(i,date)==='Overdue').map(i=>({id:`invoice-${i.id}`,section:'ledger',title:`Follow up ${i.client}`,detail:`${i.id} · due ${i.dueDate || 'not recorded'}`,dueDate:i.dueDate})),
    ...state.projects.filter(p=>p.status==='In progress'&&validDate(p.dueDate)&&p.dueDate<date).map(p=>({id:`project-${p.id}`,section:'projects',title:`Review late project: ${p.name}`,detail:`Due ${p.dueDate}`,dueDate:p.dueDate})),
    ...state.tasks.filter(t=>!t.done&&((validDate(t.dueDate)&&t.dueDate<=date)||t.priority==='High')).map(t=>({id:`task-${t.id}`,section:'tasks',title:t.title,detail:`${t.priority || 'Normal'} priority · ${t.dueDate || 'no due date'}`,dueDate:t.dueDate})),
  ].sort(compareDue);
}
export function periodSummary(state, month) {
  const previous = new Date(Number(month.slice(0,4)),Number(month.slice(5,7))-2,1);
  const previousMonth = `${previous.getFullYear()}-${String(previous.getMonth()+1).padStart(2,'0')}`;
  const sum = period => ({
    collected: state.invoices.filter(i=>i.status==='Paid'&&validDate(i.paidDate)&&i.paidDate.startsWith(period)).reduce((s,i)=>s+i.total,0),
    expenses: state.expenses.filter(e=>validDate(e.date)&&e.date.startsWith(period)).reduce((s,e)=>s+Number(e.amount),0),
  });
  return {current:sum(month),previous:sum(previousMonth),previousMonth,undatedPayments:state.invoices.filter(i=>i.status==='Paid'&&!validDate(i.paidDate)).length};
}
export function saveStatus(sync) {
  if(sync.localError) return 'Device save failed · export a backup before closing';
  return ({synced:'Cloud synced · keep regular backups',saving:'Saved on this device · saving to cloud',pending:'Saved on this device · waiting to sync',offline:'Offline · saved on this device',conflict:'Sync conflict · review in Settings',error:'Cloud sync error · review in Settings',connecting:'Connecting to cloud',loading:'Loading workspace'})[sync.status] || 'Check workspace save status';
}
