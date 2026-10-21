import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ErrorMessage, FieldError, PageState } from '../../components/Feedback'
import { Pagination } from '../../components/Pagination'
import { api, type Manga } from '../../lib/api'

export function AdminMangaPage() {
  const client = useQueryClient(); const navigate = useNavigate(); const [page, setPage] = useState(1); const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [error, setError] = useState<unknown>(null)
  const list = useQuery({ queryKey: ['admin-manga', page], queryFn: () => api.manga.list({ page, limit: 20, sortBy: 'createdAt', order: 'desc' }) })
  const create = useMutation({ mutationFn: () => api.manga.create({ title, description }), onSuccess: (manga) => { setTitle(''); setDescription(''); setError(null); void client.invalidateQueries({ queryKey: ['admin-manga'] }); navigate(`/admin/manga/${manga._id}/chapters`) }, onError: setError })
  const remove = useMutation({ mutationFn: api.manga.remove, onSuccess: () => void client.invalidateQueries({ queryKey: ['admin-manga'] }) })
  function submit(event: FormEvent) { event.preventDefault(); create.mutate() }
  return <div className="admin-content"><form className="panel admin-create form-stack" onSubmit={submit}><div><span className="section-kicker">CATALOG</span><h2>Create a manga entry</h2><p>After creating the title, add chapters and upload art from its management page.</p></div><label>Title<input required maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)}/><FieldError error={error} name="title"/></label><label>Description<textarea required value={description} onChange={(event) => setDescription(event.target.value)}/><FieldError error={error} name="description"/></label><ErrorMessage error={error}/><button className="button button-orange" disabled={create.isPending}>{create.isPending ? 'Creating…' : 'Create manga'} <span>→</span></button></form>
    <section className="admin-list"><div className="subsection-heading"><div><span className="section-kicker">CONTENT</span><h3>Manga catalog</h3></div><span className="text-muted">{list.data?.meta?.pagination?.total || 0} titles</span></div>{list.isLoading ? <PageState>Loading the catalog…</PageState> : list.isError ? <PageState error={list.error}/> : list.data?.data.length ? <div className="admin-table">{list.data.data.map((manga: Manga) => <article key={manga._id} className="admin-table-row"><span className="admin-table-cover" style={manga.coverImage ? { backgroundImage: `url("${manga.coverImage}")` } : undefined}>{!manga.coverImage && manga.title.slice(0, 1)}</span><div className="admin-table-title"><b>{manga.title}</b><small>{manga.status} · {manga.genres.join(', ')}</small></div><Link className="button button-outline button-small" to={`/admin/manga/${manga._id}/chapters`}>Manage chapters</Link><button className="quiet-button danger-text" onClick={() => { if (window.confirm(`Delete “${manga.title}” and all its chapters?`)) remove.mutate(manga._id) }}>Delete</button></article>)}</div> : <PageState>No manga has been added yet.</PageState>}<Pagination page={page} data={list.data?.meta?.pagination} onChange={setPage}/></section>
  </div>
}
