import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './interface-typography.css'
import './result-ui.css'
import './review-polish.css'
import './interface-finish.css'
import './battle-encounter.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
