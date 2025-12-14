import './App.css'
import Header from './components/header/Header.jsx'
import Main from './components/main/main.jsx'
import Login from './pages/Login.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import Tickets from './pages/Tickets.jsx'
import Admin from './pages/Admin.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Analysis from './pages/Analysis.jsx'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { setOnUnauthorizedCallback, isLoggedIn, fetchWithAuth } from './utils/auth'

function AppContent() {
  const navigate = useNavigate()
  
  useEffect(() => {
    // Set up the callback for when token is invalid/expired
    setOnUnauthorizedCallback(() => {
      navigate('/login')
    })
  }, [navigate])

  useEffect(() => {
    // Load user's theme preference on app startup
    if (isLoggedIn()) {
      fetchWithAuth('/api/v1.0.0/accounts/profile')
        .then(res => res.json())
        .then(data => {
          if (data.theme) {
            document.documentElement.setAttribute('data-theme', data.theme)
            localStorage.setItem('theme', data.theme)
          }
        })
        .catch(() => {
          // Fall back to localStorage theme if fetch fails
          const savedTheme = localStorage.getItem('theme') || 'auto'
          document.documentElement.setAttribute('data-theme', savedTheme)
        })
    } else {
      // Load theme from localStorage for non-logged-in users
      const savedTheme = localStorage.getItem('theme') || 'auto'
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
  }, [])

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><Admin /></ProtectedRoute>} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
export default App
