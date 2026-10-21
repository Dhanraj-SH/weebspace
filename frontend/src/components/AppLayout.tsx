import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../features/auth/useAuth'

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  async function signOut() { await logout(); queryClient.clear(); navigate('/') }
  return <div className="app-frame">
    <header className="topbar"><Link className="brand" to="/"><span className="brand-mark">W</span><span>weeb<span className="brand-orange">space</span></span></Link>
      <nav className="main-nav"><NavLink to="/" end>Discover</NavLink><NavLink to="/library">My library</NavLink></nav>
      <div className="header-actions">{user ? <><Link className="profile-chip" to="/profile">{user.avatar ? <img src={user.avatar} alt="" /> : <span>{user.name.slice(0, 1).toUpperCase()}</span>}<b>{user.username}</b></Link>{user.role === 'admin' && <Link className="admin-link" to="/admin">Admin</Link>}<button className="quiet-button" onClick={() => void signOut()}>Log out</button></> : <><Link className="login-link" to="/login">Log in</Link><Link className="button button-orange button-small" to="/register">Join free <span>↗</span></Link></>}</div>
    </header>
    <Outlet />
    <footer className="footer"><Link className="brand" to="/"><span className="brand-mark">W</span><span>weeb<span className="brand-orange">space</span></span></Link><span>For the love of a good story.</span><span>© 2026 Weebspace</span></footer>
  </div>
}
