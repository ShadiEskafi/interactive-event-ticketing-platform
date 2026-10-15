import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { purgeClientDemoStorage } from './utils/cleanSlatePurge'

// Automatically purge demo data and previous sessions on fresh application launch
purgeClientDemoStorage();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
