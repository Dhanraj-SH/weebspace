import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../features/auth/useAuth'
import { Suspense } from 'react'

function PageLoading() {
  return <main className="route-loading" role="status"><span className="route-loading-spinner" aria-hidden="true"/><p>Loading page…</p></main>
}

export function AppLayout() {
  const { user, loading: authLoading, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [startupDelayElapsed, setStartupDelayElapsed] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => setStartupDelayElapsed(true), 3500)
    return () => window.clearTimeout(timeout)
  }, [])

  async function signOut() { await logout(); queryClient.clear(); navigate('/') }
  function search(event: FormEvent) {
    event.preventDefault()
    const query = searchInput.trim()
    if (query) navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  if (authLoading || !startupDelayElapsed) {
    return <main className="startup-loading" role="status" aria-live="polite">
      <div className="startup-panels" aria-hidden="true">
        <span className="startup-panel"/>
        <span className="startup-panel"/>
        <span className="startup-panel"/>
        <span className="startup-panel"/>
        <span className="startup-panel"/>
        <span className="startup-panel"/>
      </div>
      <div className="startup-content">
        <img className="startup-logo" src="/weebspace-logo.png" alt=""/>
        <p className="startup-message">Getting your stories ready</p>
        <div className="startup-progress" aria-hidden="true"><span/></div>
      </div>
    </main>
  }

  return <div className="app-frame">
    <header className="topbar"><Link className="brand" to="/" aria-label="Weebspace home"><span className="brand-mark"><img src="/weebspace-logo.png" alt="Weebspace" /></span></Link>
      <nav className="main-nav"><NavLink to="/" end>Discover</NavLink><NavLink to="/library">My library</NavLink></nav>
      <form className="header-search" onSubmit={search} role="search"><div className="search-box"><span aria-hidden="true">⌕</span><input value={searchInput} maxLength={100} onChange={(event) => setSearchInput(event.target.value)} placeholder="Find a manga..." aria-label="Search manga" required/><button type="submit">Search</button></div></form>
      <div className="header-actions">{user ? <><Link className="profile-chip" to="/profile">{user.avatar ? <img src={user.avatar} alt="" /> : <span>{user.name.slice(0, 1).toUpperCase()}</span>}<b>{user.username}</b></Link>{user.role === 'admin' && <Link className="admin-link" to="/admin">Admin</Link>}<button className="quiet-button" onClick={() => void signOut()}>Log out</button></> : <><Link className="login-link" to="/login">Log in</Link><Link className="button button-orange button-small" to="/register">Join free <span>↗</span></Link></>}</div>
    </header>
    <Suspense fallback={<PageLoading/>}><Outlet /></Suspense>
    <footer className="footer"><Link className="brand" to="/" aria-label="Weebspace home"><span className="brand-mark"><img src="/weebspace-logo.png" alt="Weebspace" /></span></Link><span>For the love of a good story.</span><span>© 2026 Weebspace</span></footer>
  </div>
}
