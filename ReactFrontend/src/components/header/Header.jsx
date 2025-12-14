import './Header.css';
import { useNavigate } from 'react-router-dom'
import { isLoggedIn, getToken, fetchWithAuth } from '../../utils/auth'
import { useState, useEffect } from 'react'
import logo from "../../assets/logocorner.jpg";
import placeholderPFP from "../../assets/placeholderPFP.jpg";

export default function Header() {
    const navigate = useNavigate()
    const [isAdmin, setIsAdmin] = useState(false)
    const [profilePicture, setProfilePicture] = useState(placeholderPFP)

    useEffect(() => {
        // Apply saved theme on load
        const savedTheme = localStorage.getItem('theme') || 'auto'
        applyTheme(savedTheme)

        if (isLoggedIn()) {
            fetchWithAuth('/api/v1.0.0/accounts/profile')
                .then(res => res.json())
                .then(data => {
                    if (data.isAdmin) setIsAdmin(true)
                    if (data.profilePicture) setProfilePicture(data.profilePicture)
                })
                .catch(() => {
                    setIsAdmin(false)
                })
        }
    }, [])

    function applyTheme(theme) {
        localStorage.setItem('theme', theme)
        document.documentElement.setAttribute('data-theme', theme)
    }

    function handleProfileClick() {
        if (isLoggedIn()) {
            navigate('/profile')
        } else {
            navigate('/login')
        }
    }

    function handleAdminClick() {
        navigate('/admin')
    }

    function handleLogoClick() {
        navigate('/')
    }

    return (
        <nav>
            <div className="fullNav">
                <div className="navLogo" onClick={handleLogoClick} style={{cursor: 'pointer'}}>
                    <img className="logo" alt="logo" src={logo}></img>
                    <h1>HelpIT</h1>
                </div>
                <div className="itemList">
                    <p onClick={() => navigate('/')} className="navText">Startside</p>
                    <p onClick={() => navigate('/tickets')} className="navText">Dine Saker</p>
                    <p onClick={() => navigate('/analytics')} className="navText">Analyse</p>
                    <p onClick={() => navigate('/settings')} className="navText">Innstillinger</p>
                    {isAdmin && <p onClick={handleAdminClick} className="navText">Admin</p>}
                </div>
                <div className="notificationsAndProfile">
                    <div className="profileContainer">
                        <img className="userProfile" onClick={handleProfileClick} src={profilePicture} style={{cursor:'pointer'}} />
                    </div>
                </div>
            </div>
        </nav>
    )
}