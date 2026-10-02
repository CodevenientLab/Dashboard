// Used exclusively by vite.test.config.js; never referenced by the production build.
import {normalise} from '../../src/lib/workspace.js';
export const configured=true;
let callback;
const current=()=>sessionStorage.getItem('test-login')?{uid:'test-owner',email:'owner@example.com'}:null;
export function observeUser(next){callback=next;queueMicrotask(()=>next(current()));return()=>{callback=null;};}
export async function login(email,password){if(email!=='owner@example.com'||password!=='ExamplePass123'){const e=new Error('Incorrect credentials');e.code='auth/invalid-credential';throw e;}sessionStorage.setItem('test-login','yes');callback?.(current());}
export async function resetPassword(){return;}
export async function logout(){sessionStorage.removeItem('test-login');callback?.(null);}
export function friendlyError(e){return e.code==='auth/invalid-credential'?'The email or password is incorrect.':e.message;}
export function adapterFor(){const key='test-cloud';const get=()=>JSON.parse(localStorage.getItem(key)||'null');let notify;return {subscribe(fn){notify=fn;const listener=e=>{if(e.key===key&&navigator.onLine)fn(get());};window.addEventListener('storage',listener);const online=()=>fn(get());window.addEventListener('online',online);queueMicrotask(()=>{if(navigator.onLine)fn(get());});return()=>{window.removeEventListener('storage',listener);window.removeEventListener('online',online);};},async save(data,expected){if(!navigator.onLine)throw new Error('Offline');const current=get();if((current?.version||0)!==expected){const e=new Error('Conflict');e.code='sync/conflict';e.remote=current;throw e;}const record={data:normalise(data),version:expected+1};localStorage.setItem(key,JSON.stringify(record));notify(record);return record.version;}};}
