import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#131c27',
            color: '#e2e8f0',
            border: '1px solid rgba(91,164,245,0.18)',
            borderRadius: '10px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#4fd1c5', secondary: '#07090f' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#07090f' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
