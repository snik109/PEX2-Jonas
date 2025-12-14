import { useState, useEffect } from 'react'
import { fetchWithAuth } from '../utils/auth'
import './Settings.css'

export default function Settings() {
    const [settings, setSettings] = useState({
        theme: localStorage.getItem('theme') || 'auto',
        notifications: true
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)
    const [passwordChange, setPasswordChange] = useState({ old: '', new: '', confirm: '' })
    const [changingPassword, setChangingPassword] = useState(false)
    const [passwordError, setPasswordError] = useState(null)
    const [passwordSuccess, setPasswordSuccess] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    async function fetchSettings() {
        try {
            const res = await fetchWithAuth('/api/v1.0.0/accounts/profile', {
                method: 'GET'
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.message || 'Failed to load settings')
                return
            }
            setSettings({
                theme: data.theme || 'light',
                notifications: data.notifications !== false
            })
        } catch (err) {
            setError('Network error loading settings')
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        setSaving(true)
        setError(null)
        setSuccess(false)
        try {
            const res = await fetchWithAuth('/api/v1.0.0/accounts/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    theme: settings.theme,
                    notifications: settings.notifications
                })
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.message || 'Failed to save settings')
                return
            }
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
            // Apply theme change to document
            applyTheme(settings.theme)
        } catch (err) {
            setError('Network error saving settings')
        } finally {
            setSaving(false)
        }
    }

    async function handleChangePassword() {
        setPasswordError(null)
        setPasswordSuccess(false)
        
        if (passwordChange.new !== passwordChange.confirm) {
            setPasswordError('Passordene samsvarer ikke')
            return
        }
        
        if (!passwordChange.old || !passwordChange.new) {
            setPasswordError('Fyll inn alle feltene')
            return
        }
        
        setChangingPassword(true)
        try {
            const res = await fetchWithAuth('/api/v1.0.0/accounts/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPassword: passwordChange.old, newPassword: passwordChange.new })
            })
            const data = await res.json()
            if (!res.ok) {
                setPasswordError(data.message || 'Kunne ikke endre passord')
                return
            }
            setPasswordSuccess(true)
            setPasswordChange({ old: '', new: '', confirm: '' })
            setTimeout(() => setPasswordSuccess(false), 3000)
        } catch (err) {
            setPasswordError('Nettverksfeil')
        } finally {
            setChangingPassword(false)
        }
    }

    function applyTheme(theme) {
        let resolvedTheme = theme
        if (theme === 'auto') {
            resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
        }
        localStorage.setItem('theme', theme)
        document.documentElement.setAttribute('data-theme', resolvedTheme)
    }

    useEffect(() => {
        // Apply theme when the settings theme value is updated
        if (settings && settings.theme) {
            applyTheme(settings.theme)
        }
    }, [settings.theme])

    if (loading) return <div className="settingsPage"><p>Laster innstillinger...</p></div>

    return (
        <div className="settingsPage">
            <div className="settingsCard">
                <h2>Innstillinger</h2>

                {error && <div className="error">{error}</div>}
                {success && <div className="success">Innstillinger lagret!</div>}

                <div className="settingsSection">
                    <h3>Tema</h3>
                    <select 
                        value={settings.theme} 
                        onChange={e => setSettings({ ...settings, theme: e.target.value })}
                        className="themSelect"
                    >
                        <option value="light">Lys</option>
                        <option value="dark">Mørk</option>
                        <option value="auto">Automatisk</option>
                    </select>
                </div>

                <div className="settingsSection">
                    <h3>Varsler</h3>
                    <label className="checkboxLabel">
                        <input
                            type="checkbox"
                            checked={settings.notifications}
                            onChange={e => setSettings({ ...settings, notifications: e.target.checked })}
                        />
                        Aktiver varsler
                    </label>
                </div>

                <div className="settingsSection">
                    <h3>Språk</h3>
                    <select className="themSelect" disabled>
                        <option>Norsk</option>
                    </select>
                    <p className="hint">Flere språk kommer snart</p>
                </div>

                <div className="settingsSection">
                    <h3>Endre Passord</h3>
                    {passwordError && <div className="error">{passwordError}</div>}
                    {passwordSuccess && <div className="success">Passord endret!</div>}
                    <input
                        type="password"
                        placeholder="Gammelt passord"
                        value={passwordChange.old}
                        onChange={e => setPasswordChange({ ...passwordChange, old: e.target.value })}
                        className="inputField"
                    />
                    <input
                        type="password"
                        placeholder="Nytt passord"
                        value={passwordChange.new}
                        onChange={e => setPasswordChange({ ...passwordChange, new: e.target.value })}
                        className="inputField"
                    />
                    <input
                        type="password"
                        placeholder="Bekreft passord"
                        value={passwordChange.confirm}
                        onChange={e => setPasswordChange({ ...passwordChange, confirm: e.target.value })}
                        className="inputField"
                    />
                    <button className="saveBtn" onClick={handleChangePassword} disabled={changingPassword}>
                        {changingPassword ? 'Endrer...' : 'Endre Passord'}
                    </button>
                </div>

                <div className="buttonGroup">
                    <button className="saveBtn" onClick={handleSave} disabled={saving}>
                        {saving ? 'Lagrer...' : 'Lagre Innstillinger'}
                    </button>
                </div>
            </div>
        </div>
    )
}
