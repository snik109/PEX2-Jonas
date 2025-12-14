import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout, fetchWithAuth } from '../utils/auth'
import './Profile.css'

export default function Profile() {
    const navigate = useNavigate()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchProfile()
    }, [])

    async function fetchProfile() {
        try {
            const res = await fetchWithAuth('/api/v1.0.0/accounts/profile', {
                method: 'GET'
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.message || 'Failed to load profile')
                return
            }
            setProfile(data)
        } catch (err) {
            setError('Network error loading profile')
        } finally {
            setLoading(false)
        }
    }

    function handleLogout() {
        logout()
        navigate('/login')
        window.location.reload()
    }

    if (loading) return <div className="profilePage"><p>Laster profil...</p></div>

    return (
        <div className="profilePage">
            <div className="profileCard">
                <h2>Min Profil</h2>

                {error && <div className="error">{error}</div>}

                <div className="profilePictureSection">
                    {profile?.profilePicture && (
                        <img src={profile.profilePicture} alt="Profilbilde" className="profilePicturePreview" />
                    )}
                </div>

                <div className="profileSection">
                    <h3>Brukernavn</h3>
                    <p className="profileDisplay">{profile?.username || 'N/A'}</p>
                </div>

                <div className="profileSection">
                    <h3>Fullt navn</h3>
                    <p className="profileDisplay">{profile?.fullName || 'Ikke angitt'}</p>
                </div>

                <div className="profileSection">
                    <h3>E-post</h3>
                    <p className="profileDisplay">{profile?.email || 'Ikke angitt'}</p>
                </div>

                <div className="buttonGroup">
                    <button className="logoutBtn" onClick={handleLogout}>
                        Logg ut
                    </button>
                </div>
            </div>
        </div>
    )
}
