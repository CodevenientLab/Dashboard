import { validateState } from './model.js';
export function emptyWorkspace(){return {schemaVersion:2,notes:[],projects:[],proposals:[],invoices:[],clients:[],tasks:[],expenses:[],activity:[],nextInvoiceNumber:1,theme:'light',importedRecords:false,settings:{company:'Codevenient Consulting',payment:{}}};}
export function normalise(data){return {...emptyWorkspace(),...validateState(data)};}
export function applyAction(state,action){
 let next={...state};const match=action.type.match(/^(ADD|UPDATE|DELETE)_(NOTE|PROJECT|PROPOSAL|INVOICE|CLIENT|TASK|EXPENSE)$/);
 if(action.type==='RESTORE')next=normalise(action.payload);
 else if(action.type==='SET_THEME')next.theme=action.payload;
 else if(action.type==='SET_SETTINGS')next.settings={...state.settings,...action.payload};
 else if(action.type==='VERIFY_RECORDS')next.importedRecords=false;
 else if(match){const [,verb,entity]=match;const key=entity.toLowerCase()+'s';
  if(verb==='ADD'){const id=entity==='INVOICE'?`INV-${String(state.nextInvoiceNumber).padStart(4,'0')}`:crypto.randomUUID();next[key]=[{...action.payload,id},...state[key]];if(entity==='INVOICE')next.nextInvoiceNumber++;}
  else if(verb==='UPDATE')next[key]=state[key].map(r=>r.id===action.id?{...r,...action.payload,id:r.id}:r);
  else next[key]=state[key].filter(r=>r.id!==action.id);
  next.activity=[{id:crypto.randomUUID(),text:`${entity.toLowerCase()} ${verb.toLowerCase()}`,at:new Date().toISOString()},...(state.activity||[])].slice(0,30);
 }else return state;
 next.revision=crypto.randomUUID();next.updatedAt=new Date().toISOString();return normalise(next);
}
export const MAX_WORKSPACE_BYTES=850000;
export function encodeWorkspace(data){const json=JSON.stringify(normalise(data));if(new TextEncoder().encode(json).length>MAX_WORKSPACE_BYTES)throw new Error('Workspace has reached the 850 KB sync limit. Export a backup and archive old records before adding more.');return json;}
