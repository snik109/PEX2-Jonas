import { useState, useEffect } from 'react'
import { fetchWithAuth } from '../utils/auth'
import './Admin.css'

export default function Admin() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAccountForm, setNewAccountForm] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    isAdmin: false
  })
  const [addError, setAddError] = useState(null)

  useEffect(() => {
    fetchAccounts()
  }, [])

  async function fetchAccounts() {
    try {
      const res = await fetchWithAuth('/api/v1.0.0/accounts')
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Failed to load accounts')
        return
      }
      setAccounts(data)
    } catch (err) {
      setError('Network error loading accounts')
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(account) {
    setEditingId(account.id)
    setEditForm(account)
  }

  function handleCancel() {
    setEditingId(null)
    setEditForm({})
  }

  function handleProfilePictureChange(e) {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const maxSize = 400
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width)
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height)
              height = maxSize
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          const compressed = canvas.toDataURL('image/jpeg', 0.7)
          setEditForm({ ...editForm, profilePicture: compressed })
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleSave(account) {
    try {
      const res = await fetchWithAuth(`/api/v1.0.0/accounts/${editForm.username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })
      if (!res.ok) {
        setError('Failed to update account')
        return
      }
      setAccounts(accounts.map(a => a.id === account.id ? editForm : a))
      setEditingId(null)
      setError(null)
    } catch (err) {
      setError('Network error saving account')
    }
  }

  async function handleDelete(username) {
    if (!confirm(`Are you sure you want to delete ${username}?`)) return
    try {
      const res = await fetchWithAuth('/api/v1.0.0/accounts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usernames: [username] })
      })
      if (!res.ok) {
        setError('Failed to delete account')
        return
      }
      setAccounts(accounts.filter(a => a.username !== username))
      setError(null)
    } catch (err) {
      setError('Network error deleting account')
    }
  }

  async function handleAddAccount(e) {
    e.preventDefault()
    setAddError(null)

    if (!newAccountForm.username || !newAccountForm.password) {
      setAddError('Username and password are required')
      return
    }

    try {
      const res = await fetchWithAuth('/api/v1.0.0/accounts/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAccountForm)
      })
      const data = await res.json()
      if (!res.ok) {
        setAddError(data.message || 'Failed to create account')
        return
      }
      // Reset form and refetch accounts
      setNewAccountForm({
        username: '',
        password: '',
        email: '',
        fullName: '',
        isAdmin: false
      })
      setShowAddModal(false)
      fetchAccounts()
      setError(null)
    } catch (err) {
      setAddError('Network error creating account')
    }
  }

  if (loading) return <div className="adminPage"><p>Laster kontoer...</p></div>

  return (
    <div className="adminPage">
      <div className="adminContainer">
        <div className="adminHeader">
          <h2>Administrasjon - Kontoer</h2>
          <button className="addBtn" onClick={() => setShowAddModal(true)}>+ Legg til Konto</button>
        </div>
        {error && <div className="error">{error}</div>}

        {showAddModal && (
          <div className="adminModal">
            <div className="adminModalContent">
              <h3>Legg til ny konto</h3>
              {addError && <div className="error">{addError}</div>}
              <form onSubmit={handleAddAccount}>
                <input
                  type="text"
                  placeholder="Brukernavn *"
                  value={newAccountForm.username}
                  onChange={e => setNewAccountForm({ ...newAccountForm, username: e.target.value })}
                  required
                />
                <input
                  type="password"
                  placeholder="Passord *"
                  value={newAccountForm.password}
                  onChange={e => setNewAccountForm({ ...newAccountForm, password: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="E-post"
                  value={newAccountForm.email}
                  onChange={e => setNewAccountForm({ ...newAccountForm, email: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Fullt navn"
                  value={newAccountForm.fullName}
                  onChange={e => setNewAccountForm({ ...newAccountForm, fullName: e.target.value })}
                />
                <label className="checkboxLabel">
                  <input
                    type="checkbox"
                    checked={newAccountForm.isAdmin}
                    onChange={e => setNewAccountForm({ ...newAccountForm, isAdmin: e.target.checked })}
                  />
                  Administrator
                </label>
                <div className="modalButtons">
                  <button type="submit" className="saveBtn">Opprett</button>
                  <button type="button" className="cancelBtn" onClick={() => setShowAddModal(false)}>Avbryt</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="accountsList">
          {accounts.map(account => (
            <div key={account.id} className="accountCard">
              {editingId === account.id ? (
                <div className="editForm">
                  {editForm.profilePicture && (
                    <div className="profilePictureEditSection">
                      <img src={editForm.profilePicture} alt="Profil" className="profilePicturePreview" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    placeholder="Velg profilbilde"
                  />
                  <input
                    type="text"
                    value={editForm.fullName || ''}
                    onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                    placeholder="Full Name"
                  />
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="Email"
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={editForm.isAdmin || false}
                      onChange={e => setEditForm({ ...editForm, isAdmin: e.target.checked })}
                    />
                    Admin
                  </label>
                  <div className="buttonGroup">
                    <button className="saveBtn" onClick={() => handleSave(account)}>Save</button>
                    <button className="cancelBtn" onClick={handleCancel}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {account.profilePicture && (
                    <img src={account.profilePicture} alt={account.username} className="accountProfilePicture" />
                  )}
                  <div className="accountInfo">
                    <p><strong>Username:</strong> {account.username}</p>
                    <p><strong>Email:</strong> {account.email || 'N/A'}</p>
                    <p><strong>Full Name:</strong> {account.fullName || 'N/A'}</p>
                    <p><strong>Admin:</strong> {account.isAdmin ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="buttonGroup">
                    <button className="editBtn" onClick={() => handleEdit(account)}>Edit</button>
                    <button className="deleteBtn" onClick={() => handleDelete(account.username)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
                </div>
              </div>
            </div>
  )
}
