import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initAuth } from './utilities/pocketbase_route.js'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './App.css'

initAuth()
  .catch((error) => console.error('Error de autenticación:', error.message))
  .finally(() => {
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  })
