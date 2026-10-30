import test from 'node:test';
import assert from 'node:assert/strict';
import {attentionItems,openInvoices,periodSummary,saveStatus} from '../src/lib/health.js';
import {applyAction,emptyWorkspace} from '../src/lib/workspace.js';
import {validateState,today,money} from '../src/lib/model.js';
import {CLIENT_AGREEMENT} from '../src/data/clientAgreement.js';

const invoice=(id,extra={})=>({id,client:'Client',status:'Sent',date:'2026-01-01',dueDate:'2026-10-10',items:[{service:'Website',qty:1,rate:100}],subtotal:100,tax:0,total:100,...extra});
test('follow-up shows oldest due first, excluding paid and drafts without mutating source',()=>{
 const invoices=[invoice('new'),invoice('old',{dueDate:'2026-09-01'}),invoice('paid',{status:'Paid'}),invoice('draft',{status:'Draft'}),invoice('no-date',{dueDate:''})];
 assert.deepEqual(openInvoices(invoices,'2026-10-30').map(i=>i.id),['old','new','no-date']);assert.equal(invoices[0].id,'new');
});
test('attention includes late work, today and high priority tasks; excludes delivered and completed work',()=>{
 const state={...emptyWorkspace(),invoices:[invoice('late'),invoice('future',{dueDate:'2026-11-01'})],projects:[{id:'p',name:'Late',status:'In progress',dueDate:'2026-10-01'},{id:'done',name:'Done',status:'Delivered',dueDate:'2026-10-01'}],tasks:[{id:'t',title:'Today',dueDate:'2026-10-30'},{id:'h',title:'High',priority:'High'},{id:'d',title:'Done',priority:'High',done:true}]};
 assert.deepEqual(attentionItems(state,'2026-10-30').map(i=>i.id),['project-p','invoice-late','task-t','task-h']);
});
test('monthly collections use actual payment date, count undated legacy records, and cross year boundary',()=>{
 const state={...emptyWorkspace(),invoices:[invoice('a',{status:'Paid',paidDate:'2026-01-03'}),invoice('b',{status:'Paid',paidDate:'2025-12-31',total:80}),invoice('legacy',{status:'Paid'}),invoice('unpaid')],expenses:[{date:'2026-01-04',amount:'20'},{date:'2025-12-04',amount:10}]};
 assert.deepEqual(periodSummary(state,'2026-01'),{current:{collected:100,expenses:20},previous:{collected:80,expenses:10},previousMonth:'2025-12',undatedPayments:1});
});
test('payment actions date new payments, preserve existing and unknown dates, and clear reopened payments',()=>{
 let state={...emptyWorkspace(),invoices:[invoice('a')]};
 state=applyAction(state,{type:'UPDATE_INVOICE',id:'a',payload:{status:'Paid'}});assert.equal(state.invoices[0].paidDate,today());
 state=applyAction(state,{type:'UPDATE_INVOICE',id:'a',payload:{paidDate:'2026-01-02'}});assert.equal(state.invoices[0].paidDate,'2026-01-02');
 state=applyAction(state,{type:'UPDATE_INVOICE',id:'a',payload:{client:'Edited'}});assert.equal(state.invoices[0].paidDate,'2026-01-02');
 state=applyAction(state,{type:'UPDATE_INVOICE',id:'a',payload:{status:'Sent'}});assert.equal(state.invoices[0].paidDate,null);
 state={...state,invoices:[invoice('a',{status:'Paid'})]};
 state=applyAction(state,{type:'UPDATE_INVOICE',id:'a',payload:{client:'Edited'}});assert.equal(state.invoices[0].paidDate,null);
 assert.throws(()=>validateState({...state,invoices:[invoice('a',{paidDate:'2026-02-30'})]}),/payment date/);
});
test('save messages never claim successful local saving after storage failure',()=>{
 for(const status of ['synced','offline','error','pending'])assert.match(saveStatus({status,localError:'quota'}),/Device save failed/);
 assert.match(saveStatus({status:'conflict'}),/conflict/);
});
test('client agreement includes commercial protections without treating generation as signature',()=>{
 const values=Object.fromEntries(CLIENT_AGREEMENT.fields.map(f=>[f.key,f.default||'Example']));Object.assign(values,{fee:'15000',depositPct:'50'});
 const text=CLIENT_AGREEMENT.build(values);
 for(const fragment of ['7. IMPORTANT','5. Revisions','8. Ownership','10. Confidentiality','12. Signatures','Silence is not acceptance','not automatically non-refundable','not a signature'])assert.ok(text.includes(fragment),fragment);
 assert.ok(text.includes(money(7500)));assert.ok(!text.includes('undefined'));assert.ok(!text.includes('NaN'));
});
