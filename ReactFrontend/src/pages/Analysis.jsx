import { useEffect, useState } from 'react'
import { fetchWithAuth } from '../utils/auth'
import Aside from '../components/aside/aside.jsx'
import './Analysis.css'

export default function Analysis() {
  const [tickets, setTickets] = useState([])
  const [username, setUsername] = useState(null)
  const [personalTickets, setPersonalTickets] = useState([])

  useEffect(() => {
    async function load() {
      try {
        // Get current user profile
        const profileRes = await fetchWithAuth('/api/v1.0.0/accounts/profile')
        const profileData = await profileRes.json()
        if (profileRes.ok) {
          setUsername(profileData.username)
        }

        // Get all tickets
        const res = await fetchWithAuth('/api/v1.0.0/tickets')
        const data = await res.json()
        const allTickets = data.tickets || []
        setTickets(allTickets)

        // Filter to personal tickets if username available
        if (profileData.username) {
          const mine = allTickets.filter(t => t.owner === profileData.username)
          setPersonalTickets(mine)
        }
      } catch (e) {
        // ignore
      }
    }
    load()
  }, [])

  const personalStatusCounts = personalTickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {})

  const personalPriorityCounts = personalTickets.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1
    return acc
  }, {})

  return (
    <div className="analysisPage">
      <Aside stats={{
        open: personalStatusCounts.open || 0,
        inProgress: personalStatusCounts['in-progress'] || 0,
        closed: personalStatusCounts.resolved || 0
      }} showTags={false} />

      <main className="analysisMain">
        <h2>Min Analyse</h2>
        {username && <p className="analysisSubtitle">Statistikk for {username}</p>}
        
        <section className="analysisSection">
          <h3>Mine Statusfordeling</h3>
          <ul>
            <li>Åpne: {personalStatusCounts.open || 0}</li>
            <li>Pågår: {personalStatusCounts['in-progress'] || 0}</li>
            <li>Løst: {personalStatusCounts.resolved || 0}</li>
          </ul>
        </section>

        <section className="analysisSection">
          <h3>Mine Prioriteter</h3>
          <ul>
            <li>Høy: {personalPriorityCounts.high || 0}</li>
            <li>Medium: {personalPriorityCounts.medium || 0}</li>
            <li>Lav: {personalPriorityCounts.low || 0}</li>
          </ul>
        </section>

        <section className="analysisSection">
          <h3>Mine Nærmeste Frister</h3>
          <ul>
            {personalTickets
              .filter(t => t.deadline)
              .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
              .slice(0, 5)
              .map(t => (
                <li key={t.id}>{t.ticketName} — {new Date(t.deadline).toLocaleDateString('nb-NO')}</li>
              ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
