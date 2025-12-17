import { useState, useEffect } from 'react'
import { fetchWithAuth } from '../utils/auth'
import './Tickets.css'
import Aside from '../components/aside/aside.jsx'

export default function Tickets() {
    const [tickets, setTickets] = useState([])
    const [userProfile, setUserProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [view, setView] = useState('mine') // 'mine' or 'all'
    const [filter, setFilter] = useState('all')
    const [tagFilter, setTagFilter] = useState(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [creating, setCreating] = useState(false)
    const [selectedTicket, setSelectedTicket] = useState(null)
    const [editingTicket, setEditingTicket] = useState(false)
    const [ticketEdits, setTicketEdits] = useState({})
    const [newComment, setNewComment] = useState('')
    const [submittingComment, setSubmittingComment] = useState(false)
    const [newTicket, setNewTicket] = useState({
        ticketName: '',
        description: '',
        priority: 'low',
        tags: []
    })
    const [searchQuery, setSearchQuery] = useState('')
    const [availableTags, setAvailableTags] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('availableTags') || '[]')
        } catch (e) {
            return []
        }
    })
    const [tagInput, setTagInput] = useState('')

    useEffect(() => {
        fetchUserProfile()
        fetchTickets()
    }, [])

    function addAvailableTag(tag) {
        if (!tag) return
        tag = tag.trim()
        if (!tag) return
        setAvailableTags(prev => {
            if (prev.includes(tag)) return prev
            const next = [...prev, tag]
            try { localStorage.setItem('availableTags', JSON.stringify(next)) } catch (e) { }
            return next
        })
    }

    function addTagToNewTicket(tag) {
        if (!tag) return
        tag = tag.trim()
        if (!tag) return
        if ((newTicket.tags || []).includes(tag)) return
        setNewTicket({ ...newTicket, tags: [...(newTicket.tags || []), tag] })
        addAvailableTag(tag)
        setTagInput('')
    }

    function removeTagFromNewTicket(tag) {
        setNewTicket({ ...newTicket, tags: (newTicket.tags || []).filter(t => t !== tag) })
    }

    function addTagToEdit(tag) {
        if (!tag) return
        tag = tag.trim()
        if (!tag) return
        const current = ticketEdits.tags ?? selectedTicket.tags ?? []
        if (current.includes(tag)) return
        setTicketEdits({ ...ticketEdits, tags: [...current, tag] })
        addAvailableTag(tag)
        setTagInput('')
    }

    function removeTagFromEdit(tag) {
        const current = ticketEdits.tags ?? selectedTicket.tags ?? []
        const next = current.filter(t => t !== tag)
        setTicketEdits({ ...ticketEdits, tags: next })
    }

    async function fetchUserProfile() {
        try {
            const res = await fetchWithAuth('/api/v1.0.0/accounts/profile')
            const data = await res.json()
            if (res.ok) {
                setUserProfile(data)
            }
        } catch (err) {
            console.error('Error fetching profile:', err)
        }
    }

    async function fetchTickets() {
        try {
            const res = await fetchWithAuth('/api/v1.0.0/tickets', {
                method: 'GET'
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.message || 'Failed to load tickets')
                return
            }
            const loaded = data.tickets || []
            setTickets(loaded)
            // merge tags from loaded tickets into availableTags
            try {
                const allTags = new Set([...(availableTags || [])])
                loaded.forEach(t => (t.tags || []).forEach(tag => allTags.add(tag)))
                const merged = Array.from(allTags)
                setAvailableTags(merged)
                localStorage.setItem('availableTags', JSON.stringify(merged))
            } catch (e) {
                // ignore
            }
        } catch (err) {
            setError('Network error loading tickets')
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateTicket() {
        if (!newTicket.ticketName.trim()) {
            setError('Tittel er påkrevd')
            return
        }

        setCreating(true)
        setError(null)
        try {
            const res = await fetchWithAuth('/api/v1.0.0/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTicket)
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.message || 'Failed to create ticket')
                return
            }
            setTickets([data.ticket, ...tickets])
            // merge new ticket tags into availableTags
            try {
                const mergedSet = new Set([...(availableTags || [])])
                    ; (data.ticket.tags || []).forEach(t => mergedSet.add(t))
                const merged = Array.from(mergedSet)
                setAvailableTags(merged)
                localStorage.setItem('availableTags', JSON.stringify(merged))
            } catch (e) { }
            setShowCreateModal(false)
            setNewTicket({ ticketName: '', description: '', priority: 'low', tags: [] })
        } catch (err) {
            setError('Network error creating ticket')
        } finally {
            setCreating(false)
        }
    }

    async function handleSaveTicket() {
        try {
            // Ensure unchanged fields like ticketName are sent
            const payload = { ...ticketEdits }
            if (payload.ticketName === undefined || payload.ticketName === null) {
                payload.ticketName = selectedTicket.ticketName
            }
            // ensure tags are included
            if (payload.tags === undefined) {
                payload.tags = ticketEdits.tags ?? selectedTicket.tags ?? []
            }

            const res = await fetchWithAuth(`/api/v1.0.0/tickets/${selectedTicket.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.message || 'Failed to update ticket')
                return
            }
            setSelectedTicket(data.ticket)
            setTickets(tickets.map(t => t.id === data.ticket.id ? data.ticket : t))
            setEditingTicket(false)
            setTicketEdits({})
            // merge updated ticket tags into availableTags
            try {
                const mergedSet = new Set([...(availableTags || [])])
                    ; (data.ticket.tags || []).forEach(t => mergedSet.add(t))
                const merged = Array.from(mergedSet)
                setAvailableTags(merged)
                localStorage.setItem('availableTags', JSON.stringify(merged))
            } catch (e) { }
        } catch (err) {
            setError('Network error updating ticket')
        }
    }

    async function handleAddComment() {
        if (!newComment.trim()) return

        setSubmittingComment(true)
        try {
            const res = await fetchWithAuth(`/api/v1.0.0/tickets/${selectedTicket.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newComment })
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.message || 'Failed to add comment')
                return
            }
            setSelectedTicket({
                ...selectedTicket,
                comments: [...(selectedTicket.comments || []), data.comment]
            })
            setNewComment('')
        } catch (err) {
            setError('Network error adding comment')
        } finally {
            setSubmittingComment(false)
        }
    }

    async function deleteTicket(id) {
        try {
            if (!window.confirm('Er du sikker på at du vil slette denne saken? Denne handlingen kan ikke angres.')) {
                return
            }
            const res = await fetchWithAuth(`/api/v1.0.0/tickets/${id}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.message || 'Failed to delete ticket')
                return
            }
            setTickets(tickets.filter(t => t.id !== id))
            setSelectedTicket(null)
        } catch (err) {
            setError('Network error deleting ticket')
        }
    }

    const displayedTickets = view === 'mine' && userProfile
        ? tickets.filter(t => t.owner === userProfile.username)
        : tickets

    // compute stats for aside
    const stats = {
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in-progress').length,
        closed: tickets.filter(t => t.status === 'resolved').length,
    }

    let filteredTickets = filter === 'all'
        ? displayedTickets
        : displayedTickets.filter(t => t.status === filter)

    if (tagFilter) {
        filteredTickets = filteredTickets.filter(t => (t.tags || []).includes(tagFilter))
    }

    window.addEventListener("ticketSearch", (e) => {
        setSearchQuery(e.detail);
    });

    const searchLower = searchQuery.toLowerCase().trim();
    if (searchLower) {
        filteredTickets = filteredTickets.filter(t =>
            t.ticketName.toLowerCase().includes(searchLower)
        );
    }

    if (loading) return <div className="ticketsPage"><p>Laster saker...</p></div>

    return (
        <div className="ticketsPage">
            <div className="ticketsMainRow">
                <div className="ticketsContainer">
                    <div className="ticketsHeader">
                        <h2>Saker</h2>
                        <button className="newTicketBtn" onClick={() => setShowCreateModal(true)}>Ny Sak</button>
                    </div>

                    {error && <div className="error">{error}</div>}

                    <div className="viewToggle">
                        <button
                            className={`viewBtn ${view === 'mine' ? 'active' : ''}`}
                            onClick={() => setView('mine')}
                        >
                            Dine Saker ({userProfile ? tickets.filter(t => t.owner === userProfile.username).length : 0})
                        </button>
                        <button
                            className={`viewBtn ${view === 'all' ? 'active' : ''}`}
                            onClick={() => setView('all')}
                        >
                            Alle Saker ({tickets.length})
                        </button>
                    </div>

                    <div className="filterGroup">
                        <button
                            className={`filterBtn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            Alle ({displayedTickets.length})
                        </button>
                        <button
                            className={`filterBtn ${filter === 'open' ? 'active' : ''}`}
                            onClick={() => setFilter('open')}
                        >
                            Åpne ({displayedTickets.filter(t => t.status === 'open').length})
                        </button>
                        <button
                            className={`filterBtn ${filter === 'in-progress' ? 'active' : ''}`}
                            onClick={() => setFilter('in-progress')}
                        >
                            Pågår ({displayedTickets.filter(t => t.status === 'in-progress').length})
                        </button>
                        <button
                            className={`filterBtn ${filter === 'resolved' ? 'active' : ''}`}
                            onClick={() => setFilter('resolved')}
                        >
                            Løst ({displayedTickets.filter(t => t.status === 'resolved').length})
                        </button>
                    </div>

                    <div className="ticketsList">
                        {filteredTickets.length === 0 ? (
                            <div className="emptyState">
                                <p>Ingen saker å vise</p>
                            </div>
                        ) : (
                            filteredTickets.map(ticket => (
                                <div
                                    key={ticket.id}
                                    className="ticketCard"
                                    onClick={() => {
                                        setSelectedTicket(ticket)
                                        setTicketEdits({})
                                        setEditingTicket(false)
                                        setNewComment('')
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="ticketHeader">
                                        <h3>{ticket.ticketName}</h3>
                                        <span className={`ticketStatus status-${ticket.status}`}>
                                            {ticket.status === 'open' && 'Åpen'}
                                            {ticket.status === 'in-progress' && 'Pågår'}
                                            {ticket.status === 'resolved' && 'Løst'}
                                        </span>
                                    </div>
                                    <p className="ticketDescription">{ticket.description}</p>
                                    <div className="ticketMeta">
                                        <span className={`ticketPriority priority-${ticket.priority || 'low'}`}>
                                            {ticket.priority === 'high' && 'Høy prioritet'}
                                            {ticket.priority === 'medium' && 'Medium prioritet'}
                                            {ticket.priority === 'low' && 'Lav prioritet'}
                                        </span>
                                        <span className="ticketDate">
                                            {new Date(ticket.createdAt).toLocaleDateString('nb-NO')}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <Aside
                    availableTags={availableTags}
                    onSelectTag={tag => setTagFilter(tag)}
                    selectedTag={tagFilter}
                    onClearTag={() => setTagFilter(null)}
                    stats={stats}
                    searchBar={true}
                />

                {showCreateModal && (
                    <div className="ticketModal">
                        <div className="ticketModalContent">
                            <h3>Opprett Ny Sak</h3>
                            {error && <div className="error">{error}</div>}
                            <form onSubmit={(e) => { e.preventDefault(); handleCreateTicket() }}>
                                <input
                                    type="text"
                                    placeholder="Tittel"
                                    value={newTicket.ticketName}
                                    onChange={e => setNewTicket({ ...newTicket, ticketName: e.target.value })}
                                />
                                <textarea
                                    placeholder="Beskrivelse"
                                    value={newTicket.description}
                                    onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                                    rows="4"
                                ></textarea>
                                <select
                                    value={newTicket.priority}
                                    onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
                                >
                                    <option value="low">Lav prioritet</option>
                                    <option value="medium">Medium prioritet</option>
                                    <option value="high">Høy prioritet</option>
                                </select>

                                <div className="tagsInputRow">
                                    <input
                                        type="text"
                                        placeholder="Legg til tag og trykk Enter"
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTagToNewTicket(tagInput) } }}
                                    />
                                    <button type="button" onClick={() => addTagToNewTicket(tagInput)}>Legg til</button>
                                </div>

                                <div className="tagsContainer">
                                    {(newTicket.tags || []).map(t => (
                                        <button key={t} className="tagPill" onClick={() => removeTagFromNewTicket(t)}>{t} ×</button>
                                    ))}
                                </div>

                                <div className="availableTagsQuick">
                                    <small>Tilgjengelige tags:</small>
                                    <div className="tagsList">
                                        {availableTags.map(t => (
                                            <button key={t} className="tagPill" type="button" onClick={() => addTagToNewTicket(t)}>{t}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="modalButtons">
                                    <button type="submit" disabled={creating}>
                                        {creating ? 'Oppretter...' : 'Opprett Sak'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        style={{ background: 'var(--text-secondary)' }}
                                    >
                                        Avbryt
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {selectedTicket && (
                    <div className="ticketModal">
                        <div className="ticketModalContent ticketDetailModal">
                            <div className="ticketDetailHeader">
                                <h3>{selectedTicket.ticketName}</h3>
                                <button
                                    className="closeBtn"
                                    onClick={() => setSelectedTicket(null)}
                                >
                                    ×
                                </button>
                            </div>

                            {error && <div className="error">{error}</div>}

                            <div className="ticketDetailBody">
                                {!editingTicket ? (
                                    <>
                                        <div className="detailSection">
                                            <h4>Status</h4>
                                            <p>
                                                <span className={`ticketStatus status-${selectedTicket.status}`}>
                                                    {selectedTicket.status === 'open' && 'Åpen'}
                                                    {selectedTicket.status === 'in-progress' && 'Pågår'}
                                                    {selectedTicket.status === 'resolved' && 'Løst'}
                                                </span>
                                            </p>
                                        </div>

                                        <div className="detailSection">
                                            <h4>Prioritet</h4>
                                            <p className={`ticketPriority priority-${selectedTicket.priority || 'low'}`}>
                                                {selectedTicket.priority === 'high' && 'Høy prioritet'}
                                                {selectedTicket.priority === 'medium' && 'Medium prioritet'}
                                                {selectedTicket.priority === 'low' && 'Lav prioritet'}
                                            </p>
                                        </div>

                                        <div className="detailSection">
                                            <h4>Beskrivelse</h4>
                                            <p>{selectedTicket.description}</p>
                                        </div>

                                        {selectedTicket.owner && (
                                            <div className="detailSection">
                                                <h4>Ansvarlig</h4>
                                                <p>{selectedTicket.owner}</p>
                                            </div>
                                        )}

                                        {selectedTicket.customer && (
                                            <div className="detailSection">
                                                <h4>Kunde</h4>
                                                <p>{selectedTicket.customer}</p>
                                            </div>
                                        )}

                                        {selectedTicket.deadline && (
                                            <div className="detailSection">
                                                <h4>Frist</h4>
                                                <p>{new Date(selectedTicket.deadline).toLocaleDateString('nb-NO')}</p>
                                            </div>
                                        )}

                                        <div className="detailSection">
                                            <h4>Opprettet</h4>
                                            <p>{new Date(selectedTicket.createdAt).toLocaleDateString('nb-NO')} {new Date(selectedTicket.createdAt).toLocaleTimeString('nb-NO')}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="editSection">
                                            <label>Tittel</label>
                                            <input
                                                type="text"
                                                value={ticketEdits.ticketName ?? selectedTicket.ticketName}
                                                onChange={e => setTicketEdits({ ...ticketEdits, ticketName: e.target.value })}
                                            />
                                        </div>

                                        <div className="editSection">
                                            <label>Beskrivelse</label>
                                            <textarea
                                                value={ticketEdits.description ?? selectedTicket.description}
                                                onChange={e => setTicketEdits({ ...ticketEdits, description: e.target.value })}
                                                rows="4"
                                            ></textarea>
                                        </div>

                                        <div className="editSection">
                                            <label>Status</label>
                                            <select
                                                value={ticketEdits.status ?? selectedTicket.status}
                                                onChange={e => setTicketEdits({ ...ticketEdits, status: e.target.value })}
                                            >
                                                <option value="open">Åpen</option>
                                                <option value="in-progress">Pågår</option>
                                                <option value="resolved">Løst</option>
                                            </select>
                                        </div>

                                        <div className="editSection">
                                            <label>Prioritet</label>
                                            <select
                                                value={ticketEdits.priority ?? selectedTicket.priority}
                                                onChange={e => setTicketEdits({ ...ticketEdits, priority: e.target.value })}
                                            >
                                                <option value="low">Lav prioritet</option>
                                                <option value="medium">Medium prioritet</option>
                                                <option value="high">Høy prioritet</option>
                                            </select>
                                        </div>

                                        <div className="editSection">
                                            <label>Kunde</label>
                                            <input
                                                type="text"
                                                value={ticketEdits.customer ?? selectedTicket.customer ?? ''}
                                                onChange={e => setTicketEdits({ ...ticketEdits, customer: e.target.value })}
                                            />
                                        </div>

                                        <div className="editSection">
                                            <label>Frist</label>
                                            <input
                                                type="date"
                                                value={ticketEdits.deadline !== undefined ? (ticketEdits.deadline ? ticketEdits.deadline.split('T')[0] : '') : (selectedTicket.deadline ? selectedTicket.deadline.split('T')[0] : '')}
                                                onChange={e => setTicketEdits({ ...ticketEdits, deadline: e.target.value ? new Date(e.target.value + 'T00:00:00Z').toISOString() : null })}
                                            />
                                        </div>

                                        <div className="editSection">
                                            <label>Tags</label>
                                            <div className="tagsInputRow">
                                                <input
                                                    type="text"
                                                    placeholder="Legg til tag og trykk Enter"
                                                    value={tagInput}
                                                    onChange={e => setTagInput(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTagToEdit(tagInput) } }}
                                                />
                                                <button type="button" onClick={() => addTagToEdit(tagInput)}>Legg til</button>
                                            </div>
                                            <div className="tagsContainer">
                                                {(ticketEdits.tags ?? selectedTicket.tags ?? []).map(t => (
                                                    <button key={t} className="tagPill" onClick={() => removeTagFromEdit(t)}>{t} ×</button>
                                                ))}
                                            </div>
                                            <div className="availableTagsQuick">
                                                <small>Tilgjengelige tags:</small>
                                                <div className="tagsList">
                                                    {availableTags.map(t => (
                                                        <button key={t} className="tagPill" type="button" onClick={() => addTagToEdit(t)}>{t}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="commentsSection">
                                    <h4>Kommentarer ({(selectedTicket.comments || []).length})</h4>
                                    <div className="commentsList">
                                        {(selectedTicket.comments || []).map(comment => (
                                            <div key={comment.commentId} className="comment">
                                                <div className="commentHeader">
                                                    <strong>{comment.author}</strong>
                                                    <span className="commentDate">
                                                        {new Date(comment.createdAt).toLocaleDateString('nb-NO')} {new Date(comment.createdAt).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="commentContent">{comment.content}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="commentForm">
                                        <textarea
                                            placeholder="Legg til kommentar..."
                                            value={newComment}
                                            onChange={e => setNewComment(e.target.value)}
                                            rows="2"
                                        ></textarea>
                                        <button
                                            onClick={handleAddComment}
                                            disabled={submittingComment || !newComment.trim()}
                                        >
                                            {submittingComment ? 'Legger til...' : 'Legg til kommentar'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="ticketDetailFooter">
                                {!editingTicket ? (
                                    <>
                                        <button className="editBtn" onClick={() => setEditingTicket(true)}>
                                            Rediger
                                        </button>
                                        <button
                                            className="closeBtn"
                                            onClick={() => setSelectedTicket(null)}
                                        >
                                            Lukk
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button className="saveBtn" onClick={handleSaveTicket}>
                                            Lagre
                                        </button>
                                        <button
                                            className="cancelBtn"
                                            onClick={() => {
                                                setEditingTicket(false)
                                                setTicketEdits({})
                                            }}
                                        >
                                            Avbryt
                                        </button>
                                        <button className="deleteBtn" onClick={() => deleteTicket(selectedTicket.id)}>
                                            Slett Sak
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
