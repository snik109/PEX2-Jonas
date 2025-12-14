import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken } from '../utils/auth'
import './Login.css'

export default function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        setError(null)
        try {
            const res = await fetch('/api/v1.0.0/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.message || 'Login failed')
                return
            }
            // save token
            if (data.token) {
                setToken(data.token)
            }
            navigate('/')
            window.location.reload()
        } catch (err) {
            setError('Network error')
        }
    }

    return (
        <div className="loginPage">
            <form className="loginForm" onSubmit={handleSubmit}>
                <h2 className="colorFix">Logg inn</h2>
                {error && <div className="error">{error}</div>}
                <label className="colorFix">Brukernavn</label>
                <input value={username} onChange={e => setUsername(e.target.value)} />
                <label className="colorFix">Passord</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="submit">Logg inn</button>
            </form>
        </div>
    )
}
