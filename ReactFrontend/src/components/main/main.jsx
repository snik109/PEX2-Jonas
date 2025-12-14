import "./main.css";
import Aside from "../aside/aside.jsx";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "../../utils/auth";

export default function Main() {
    const [topTickets, setTopTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketDetails, setTicketDetails] = useState({});
    const [allTickets, setAllTickets] = useState([]);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetchWithAuth("/api/v1.0.0/tickets", { method: "GET" });
                const data = await res.json();
                const tickets = data.tickets || [];
                setAllTickets(tickets);

                // compute stats
                const s = {
                    open: tickets.filter(t => t.status === "open").length,
                    inProgress: tickets.filter(t => t.status === "in-progress").length,
                    closed: tickets.filter(t => t.status === "resolved").length,
                };
                setStats(s);

                // get current user from profile
                let username = null;
                try {
                    const p = await fetchWithAuth('/api/v1.0.0/accounts/profile');
                    const pd = await p.json();
                    if (p.ok) username = pd.username;
                } catch (e) {}

                // filter to user's tickets if username available
                let mine = tickets;
                if (username) mine = tickets.filter(t => t.owner === username);

                // priority order: high > medium > low
                const priorityRank = { high: 3, medium: 2, low: 1 };

                mine.sort((a, b) => {
                    const pa = priorityRank[a.priority || 'low'] || 0;
                    const pb = priorityRank[b.priority || 'low'] || 0;
                    if (pa !== pb) return pb - pa; // higher priority first
                    // then earliest deadline first (nulls last)
                    const da = a.deadline ? new Date(a.deadline) : null;
                    const db = b.deadline ? new Date(b.deadline) : null;
                    if (da && db) return da - db;
                    if (da && !db) return -1;
                    if (!da && db) return 1;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });

                setTopTickets(mine.slice(0, 3));
            } catch (err) {
                // ignore
            }
        }
        load();
    }, []);

    const renderTicketModal = () => {
        if (!selectedTicket) return null;
        const ticket = allTickets.find(t => t.id === selectedTicket);
        if (!ticket) return null;

        return (
            <div className="ticketModalOverlay" onClick={() => setSelectedTicket(null)}>
                <div className="ticketModalContent" onClick={e => e.stopPropagation()}>
                    <div className="ticketModalHeader">
                        <h2>{ticket.ticketName}</h2>
                        <button className="closeBtn" onClick={() => setSelectedTicket(null)}>×</button>
                    </div>
                    
                    <div className="ticketModalBody">
                        <div className="ticketModalSection">
                            <label>Status:</label>
                            <select value={ticket.status || 'open'} disabled className="statusSelect">
                                <option value="open">Åpen</option>
                                <option value="in-progress">Under behandling</option>
                                <option value="resolved">Løst</option>
                            </select>
                        </div>

                        <div className="ticketModalSection">
                            <label>Prioritet:</label>
                            <select value={ticket.priority || 'low'} disabled className="prioritySelect">
                                <option value="low">Lav</option>
                                <option value="medium">Medium</option>
                                <option value="high">Høy</option>
                            </select>
                        </div>

                        {ticket.deadline && (
                            <div className="ticketModalSection">
                                <label>Frist:</label>
                                <p>{new Date(ticket.deadline).toLocaleDateString('nb-NO')}</p>
                            </div>
                        )}

                        <div className="ticketModalSection">
                            <label>Beskrivelse:</label>
                            <p className="ticketDescription">{ticket.description}</p>
                        </div>

                        {ticket.tags && ticket.tags.length > 0 && (
                            <div className="ticketModalSection">
                                <label>Tagger:</label>
                                <div className="tagsList">
                                    {ticket.tags.map((tag, idx) => (
                                        <span key={idx} className="tagBadge">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {ticket.comments && ticket.comments.length > 0 && (
                            <div className="ticketModalSection">
                                <label>Kommentarer:</label>
                                <div className="commentsList">
                                    {ticket.comments.map((comment, idx) => (
                                        <div key={idx} className="comment">
                                            <strong>{comment.author}</strong>
                                            <p>{comment.text}</p>
                                            <small>{new Date(comment.timestamp).toLocaleString('nb-NO')}</small>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="mainContent">
            <Aside stats={stats} showTags={false} />
            <div className="mainInner">
                <div className="topTickets">
                    <h2 className="fixColor">Dine Viktigste Saker</h2>
                    {topTickets.length === 0 ? (
                        <p className="fixColor">Ingen prioriterte saker å vise.</p>
                    ) : (
                        topTickets.map(t => (
                            <div 
                                key={t.id} 
                                className="topTicketCard"
                                onClick={() => setSelectedTicket(t.id)}
                                style={{cursor: 'pointer'}}
                            >
                                <div className="topTicketHeader">
                                    <h3 className="fixColor">{t.ticketName}</h3>
                                    <span className={`ticketPriority priority-${t.priority || 'low'}`}>{t.priority}</span>
                                </div>
                                <p className="ticketDescription">{t.description}</p>
                                <div className="ticketMeta">
                                    {t.deadline && <span>Frist: {new Date(t.deadline).toLocaleDateString('nb-NO')}</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            {renderTicketModal()}
        </div>
    );
}