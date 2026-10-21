import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageState } from '../../components/Feedback'
import { api, type LibraryEntry, type Manga, type ReadingProgress } from '../../lib/api'
import { useAuth } from '../auth/useAuth'

const tabs: { value: string; label: string }[] = [{ value: '', label: 'Everything' }, { value: 'reading', label: 'Reading' }, { value: 'planToRead', label: 'Plan to read' }, { value: 'completed', label: 'Completed' }, { value: 'dropped', label: 'Dropped' }]
const getManga = (entry: LibraryEntry) => typeof entry.mangaId === 'string' ? null : entry.mangaId as Manga
const getProgressManga = (item: ReadingProgress) => typeof item.mangaId === 'string' ? null : item.mangaId as Manga

export function LibraryPage() {
  const [status, setStatus] = useState(''); const client = useQueryClient(); const { user } = useAuth()
  const list = useQuery({ queryKey: ['library', status], queryFn: () => api.library.list(status || undefined) })
  const progress = useQuery({ queryKey: ['reading-progress'], queryFn: () => api.progress.list() })
  const remove = useMutation({ mutationFn: api.library.remove, onSuccess: () => void client.invalidateQueries({ queryKey: ['library'] }) })
  const update = useMutation({ mutationFn: ({ mangaId, next }: { mangaId: string; next: LibraryEntry['status'] }) => api.library.update(mangaId, next), onSuccess: () => void client.invalidateQueries({ queryKey: ['library'] }) })
  if (!user) return null
  const items = list.data?.data || []
  return <main className="content-page library-page"><div className="page-title-row"><div><span className="section-kicker">YOUR PERSONAL SHELF</span><h1>My library</h1><p>All your stories, right where you left them.</p></div><Link className="button button-outline" to="/">＋ Discover manga</Link></div>
    <section className="continue-section"><div className="subsection-heading"><div><span className="section-kicker">PICK UP WHERE YOU LEFT OFF</span><h3>Continue reading</h3></div></div>{progress.isLoading ? <div className="empty-inline">Loading your reading progress…</div> : progress.isError ? <PageState error={progress.error}/> : progress.data?.data.length ? <div className="continue-grid">{progress.data.data.map((item) => { const manga = getProgressManga(item); const chapter = typeof item.chapterId === 'string' ? null : item.chapterId; if (!manga || !chapter) return null; return <Link className="continue-card" to={`/read/${chapter._id}`} key={item._id}><div className="continue-cover" style={manga.coverImage ? { backgroundImage: `url("${manga.coverImage}")` } : undefined}>{!manga.coverImage && manga.title.slice(0, 1)}</div><div><span className="section-kicker">CHAPTER {chapter.chapterNumber} · PAGE {item.pageNumber}</span><h4>{manga.title}</h4><span className="text-link">Continue →</span></div></Link> })}</div> : <div className="empty-inline">Your reading progress will show up here.</div>}</section>
    <section className="shelf-section"><div className="library-tabs" role="tablist">{tabs.map((tab) => <button key={tab.value} className={status === tab.value ? 'library-tab active' : 'library-tab'} onClick={() => setStatus(tab.value)}>{tab.label}</button>)}</div>{list.isLoading ? <PageState>Loading your shelf…</PageState> : list.isError ? <PageState error={list.error}/> : items.length ? <div className="shelf-list">{items.map((entry) => { const manga = getManga(entry); if (!manga) return null; return <article className="shelf-row" key={entry._id}><Link to={`/manga/${manga._id}`} className="shelf-cover" style={manga.coverImage ? { backgroundImage: `url("${manga.coverImage}")` } : undefined}>{!manga.coverImage && manga.title.slice(0, 1)}</Link><div className="shelf-info"><Link to={`/manga/${manga._id}`}><h3>{manga.title}</h3></Link><span className="shelf-meta">★ {manga.ratingAverage?.toFixed(1) || '—'} · {manga.status}</span></div><select aria-label={`Change ${manga.title} shelf status`} value={entry.status} onChange={(event) => update.mutate({ mangaId: manga._id, next: event.target.value as LibraryEntry['status'] })}><option value="reading">Reading</option><option value="planToRead">Plan to read</option><option value="completed">Completed</option><option value="dropped">Dropped</option></select><button className="quiet-button danger-text" onClick={() => remove.mutate(manga._id)}>Remove</button></article> })}</div> : <div className="state-panel"><b>Your shelf is empty.</b><span>Add manga from a story page to start building your library.</span><Link to="/" className="text-link">Explore manga →</Link></div>}</section>
  </main>
}
