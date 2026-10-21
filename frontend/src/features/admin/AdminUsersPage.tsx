import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ErrorMessage, PageState } from '../../components/Feedback'
import { Pagination } from '../../components/Pagination'
import { api, type User } from '../../lib/api'

export function AdminUsersPage() {
  const [search, setSearch] = useState(''); const [query, setQuery] = useState(''); const [page, setPage] = useState(1); const client = useQueryClient()
  const result = useQuery({ queryKey: ['admin-users', query, page], queryFn: () => api.admin.users({ q: query, page, limit: 20 }) })
  const update = useMutation({ mutationFn: ({ id, role }: { id: string; role: User['role'] }) => api.admin.updateRole(id, role), onSuccess: () => void client.invalidateQueries({ queryKey: ['admin-users'] }) })
  return <section className="admin-list"><div className="subsection-heading"><div><span className="section-kicker">ACCOUNT ACCESS</span><h3>Manage users</h3></div></div><form className="admin-search" onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(search.trim()) }}><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, username, email…"/><button className="button button-outline button-small">Search</button></form><ErrorMessage error={update.error}/>{result.isLoading ? <PageState>Loading users…</PageState> : result.isError ? <PageState error={result.error}/> : result.data?.data.length ? <div className="admin-table">{result.data.data.map((person) => <article className="admin-table-row user-row" key={person.id}><span className="user-avatar">{person.name.slice(0, 1).toUpperCase()}</span><div className="admin-table-title"><b>{person.name} <small>@{person.username}</small></b><small>{person.email}</small></div><span className="role-badge">{person.role}</span><select value={person.role} aria-label={`Role for ${person.username}`} onChange={(event) => update.mutate({ id: person.id, role: event.target.value as User['role'] })}><option value="user">User</option><option value="moderator">Moderator</option><option value="admin">Admin</option></select></article>)}</div> : <div className="empty-inline">No users matched your search.</div>}<Pagination page={page} data={result.data?.meta?.pagination} onChange={setPage}/></section>
}
