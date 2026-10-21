import { NavLink, Outlet } from 'react-router-dom'

export function AdminLayout() {
  return <main className="content-page admin-page"><div className="page-title-row"><div><span className="section-kicker">WEebspace CONTROL ROOM</span><h1>Admin tools</h1><p>Manage the catalog and reader accounts.</p></div></div><nav className="admin-tabs"><NavLink to="/admin/manga">Manga & chapters</NavLink><NavLink to="/admin/users">Users</NavLink></nav><Outlet/></main>
}
