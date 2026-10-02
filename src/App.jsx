import { useState, useEffect, useCallback, Component } from 'react';
import Shell from './components/Shell.jsx';
import Dashboard from './views/Dashboard.jsx';
import Notes from './views/Notes.jsx';
import Projects from './views/Projects.jsx';
import Proposals from './views/Proposals.jsx';
import Ledger from './views/Ledger.jsx';
import Records from './views/Records.jsx';
import Settings from './views/Settings.jsx';
const VIEWS={dashboard:Dashboard,notes:Notes,projects:Projects,proposals:Proposals,ledger:Ledger,settings:Settings};
class ErrorBoundary extends Component {state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<div className="page card"><h1>Something went wrong.</h1><p>Your saved records are still on this device.</p><button className="btn primary" onClick={()=>location.reload()}>Reload workspace</button></div>:this.props.children;}}
export default function App(){const [active,setActive]=useState(()=>location.hash.slice(1)||'dashboard');const [intent,setIntent]=useState(null);const clear=useCallback(()=>setIntent(null),[]);const navigate=(id,action)=>{location.hash=id;setActive(id);setIntent(action||null);document.getElementById('content')?.scrollTo(0,0);};useEffect(()=>{const handler=()=>setActive(location.hash.slice(1)||'dashboard');window.addEventListener('hashchange',handler);return()=>window.removeEventListener('hashchange',handler);},[]);const View=VIEWS[active]||Dashboard;return <Shell active={active} onNavigate={navigate}><ErrorBoundary key={active}><div className="view-transition">{['clients','tasks','expenses'].includes(active)?<Records key={active} kind={active} intent={intent} onIntentHandled={clear}/>:<View onNavigate={navigate} intent={intent} onIntentHandled={clear}/>}</div></ErrorBoundary></Shell>;}
