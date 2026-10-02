import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {useAuth} from './components/AuthGate.jsx';
import {adapterFor,logout,friendlyError} from './lib/firebase.js';
import {SyncEngine} from './lib/sync-engine.js';
import {emptyWorkspace,applyAction} from './lib/workspace.js';
import {downloadBackup} from './lib/model.js';
const StoreContext=createContext(null);
export const useStore=()=>useContext(StoreContext);
export function StoreProvider({children}){
 const user=useAuth();const engine=useRef(null);const [sync,setSync]=useState({data:emptyWorkspace(),ready:false,status:'loading'});const [toast,setToast]=useState('');
 const cacheKey=`codevenient-cloud-${user.uid}`;
 useEffect(()=>{
  const cache={load:()=>{const raw=localStorage.getItem(cacheKey);return raw?JSON.parse(raw):null;},save:value=>localStorage.setItem(cacheKey,JSON.stringify(value))};
  const adapter=adapterFor(user.uid);const e=new SyncEngine({adapter,cache,onChange:setSync,online:navigator.onLine});engine.current=e;e.start();
  const net=()=>e.setOnline(navigator.onLine);const beforeClose=event=>{if(e.dirty){event.preventDefault();event.returnValue='';}};
  window.addEventListener('online',net);window.addEventListener('offline',net);window.addEventListener('beforeunload',beforeClose);
  return()=>{e.dispose();window.removeEventListener('online',net);window.removeEventListener('offline',net);window.removeEventListener('beforeunload',beforeClose);};
 },[cacheKey,user.uid]);
 useEffect(()=>{document.documentElement.classList.toggle('light',sync.data.theme!=='dark');},[sync.data.theme]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),4000);return()=>clearTimeout(t);},[toast]);
 function dispatch(action){try{const next=applyAction(engine.current.data,action);if(action.type==='RESTORE'&&engine.current.blocked){if(!engine.current.confirmed)throw new Error('Connect to the cloud before restoring a damaged draft.');engine.current.recover(next);}else engine.current.change(next);if(action.type!=='SET_THEME')setToast(navigator.onLine?'Saved on this device · syncing to cloud':'Saved on this device · waiting for connection');return true;}catch(e){setToast(friendlyError(e));return false;}}
 async function signOut(){const e=engine.current;if(e.saving){setToast('Wait for the current cloud save to finish before signing out.');return;}if(e.dirty){if(!confirm('There are unsynced changes. Download a backup and sign out? These changes will be removed from this device.'))return;downloadBackup(e.data);}clearTimeout(e.timer);clearTimeout(e.retry);try{await logout();localStorage.removeItem(cacheKey);}catch(err){setToast(friendlyError(err));e.schedule();}}
 const value={state:sync.data,dispatch,notify:setToast,storageError:sync.localError||'',tabConflict:false,sync,signOut,user,cacheKey,retrySync:()=>engine.current.flush(),useCloud:()=>{downloadBackup(engine.current.data);engine.current.useCloud();},keepLocal:()=>engine.current.keepLocal()};
 if(!sync.ready||sync.accessDenied)return <div className="cloud-opening"><div className="card"><h1>{sync.error?'Workspace unavailable':'Loading your workspace…'}</h1><p>{sync.error||'Connecting securely to your company records. First sign-in requires an internet connection.'}</p><div className="dialog-actions"><button className="btn primary" onClick={()=>location.reload()}>Retry connection</button><button className="btn subtle" onClick={signOut}>Sign out</button></div></div></div>;
 return <StoreContext.Provider value={value}>{children}{toast&&<div className="toast" role="status">{toast}</div>}</StoreContext.Provider>;
}
