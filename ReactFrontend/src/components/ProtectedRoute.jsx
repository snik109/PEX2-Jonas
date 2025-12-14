import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken, isLoggedIn } from '../utils/auth'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const navigate = useNavigate()
  const [isAuthorized, setIsAuthorized] = useState(null)

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login')
      return
    }

    if (requireAdmin) {
      // Fetch profile to check if admin
      fetch('/api/v1.0.0/accounts/profile', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.isAdmin) {
            setIsAuthorized(true)
          } else {
            setIsAuthorized(false)
            navigate('/')
          }
        })
        .catch(() => {
          setIsAuthorized(false)
          navigate('/')
        })
    } else {
      setIsAuthorized(true)
    }
  }, [navigate, requireAdmin])

  if (isAuthorized === null) return <div className="loading">Henter...</div>
  if (!isAuthorized) return null

  return children
}
