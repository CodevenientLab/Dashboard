import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AuthGate, {useAuth} from './components/AuthGate.jsx'
import { StoreProvider } from './store.jsx'
function SignedWorkspace(){const user=useAuth();return <StoreProvider key={user.uid}><App/></StoreProvider>}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthGate><SignedWorkspace/></AuthGate>
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => console.warn('Offline mode could not be enabled.')));
}
