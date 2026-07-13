import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { PreviewRoot } from './components/rune-pages/PreviewRoot'

// The hidden window main uses to render a rune page for PNG capture loads the
// same bundle with ?view=preview. It renders outside StrictMode on purpose:
// double-invoked effects would fire the capture handshake twice.
const isPreview = new URLSearchParams(window.location.search).get('view') === 'preview'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  isPreview ? (
    <PreviewRoot />
  ) : (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
)
