import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
// 1. Import the AuthProvider we created
import { AuthProvider } from './AuthContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Wrap the <App /> component with the <AuthProvider> tags */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
