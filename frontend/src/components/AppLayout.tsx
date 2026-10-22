import { useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../features/auth/useAuth'

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  async function signOut() { await logout(); queryClient.clear(); navigate('/') }
  function search(event: FormEvent) {
    event.preventDefault()
    const query = searchInput.trim()
    if (query) navigate(`/search?q=${encodeURIComponent(query)}`)
  }
  return <div className="app-frame">
    <header className="topbar"><Link className="brand" to="/" aria-label="Weebspace home"><span className="brand-mark"><img src="/weebspace-logo.png" alt="Weebspace" /></span></Link>
      <nav className="main-nav"><NavLink to="/" end>Discover</NavLink><NavLink to="/library">My library</NavLink></nav>
      <form className="header-search" onSubmit={search} role="search"><div className="search-box"><span aria-hidden="true">⌕</span><input value={searchInput} maxLength={100} onChange={(event) => setSearchInput(event.target.value)} placeholder="Find a manga..." aria-label="Search manga" required/><button type="submit">Search</button></div></form>
      <div className="header-actions">{user ? <><Link className="profile-chip" to="/profile">{user.avatar ? <img src={user.avatar} alt="" /> : <span>{user.name.slice(0, 1).toUpperCase()}</span>}<b>{user.username}</b></Link>{user.role === 'admin' && <Link className="admin-link" to="/admin">Admin</Link>}<button className="quiet-button" onClick={() => void signOut()}>Log out</button></> : <><Link className="login-link" to="/login">Log in</Link><Link className="button button-orange button-small" to="/register">Join free <span>↗</span></Link></>}</div>
    </header>
    <Outlet />
    <footer className="footer"><Link className="brand" to="/" aria-label="Weebspace home"><span className="brand-mark"><img src="/weebspace-logo.png" alt="Weebspace" /></span></Link><span>For the love of a good story.</span><span>© 2026 Weebspace</span></footer>
  </div>
}
