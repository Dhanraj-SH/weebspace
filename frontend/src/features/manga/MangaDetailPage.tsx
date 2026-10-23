import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { PageState } from '../../components/Feedback'
import { api, type LibraryEntry } from '../../lib/api'
import { useAuth } from '../auth/useAuth'
import { Comments, Reviews } from './Discussion'

export function MangaDetailPage() {
  const { mangaId = '' } = useParams(); const { user } = useAuth(); const client = useQueryClient(); const [notice, setNotice] = useState(''); const [chapterSearch, setChapterSearch] = useState('')
  const mangaQuery = useQuery({ queryKey: ['manga', mangaId], queryFn: () => api.manga.get(mangaId), enabled: Boolean(mangaId) })
  const viewedMangaId = useRef('')
  const chapterQuery = useQuery({ queryKey: ['chapters', mangaId], queryFn: () => api.manga.chapters(mangaId), enabled: Boolean(mangaId) })
  const ratingQuery = useQuery({ queryKey: ['rating-summary', mangaId], queryFn: () => api.ratings.summary(mangaId), enabled: Boolean(mangaId) })
  const mineQuery = useQuery({ queryKey: ['my-rating', mangaId], queryFn: () => api.ratings.mine(mangaId), enabled: Boolean(user && mangaId), retry: false })
  const libraryQuery = useQuery({ queryKey: ['library-entry', mangaId], queryFn: async () => {
    const result = await api.library.list(undefined, 1)
    return result.data.find((entry) => (typeof entry.mangaId === 'string' ? entry.mangaId : entry.mangaId._id) === mangaId)
  }, enabled: Boolean(user && mangaId) })
  const addToLibrary = useMutation({ mutationFn: (status: LibraryEntry['status']) => libraryQuery.data ? api.library.update(mangaId, status) : api.library.add(mangaId, status), onSuccess: () => { setNotice('Your shelf is updated.'); void client.invalidateQueries({ queryKey: ['library-entry', mangaId] }); void client.invalidateQueries({ queryKey: ['library'] }) }, onError: (error) => setNotice(error instanceof Error ? error.message : 'Could not update your shelf.') })
  const saveRating = useMutation({ mutationFn: (value: number) => api.ratings.save(mangaId, value), onSuccess: () => { void client.invalidateQueries({ queryKey: ['my-rating', mangaId] }); void client.invalidateQueries({ queryKey: ['rating-summary', mangaId] }) } })
  const deleteRating = useMutation({ mutationFn: () => api.ratings.remove(mangaId), onSuccess: () => { void client.invalidateQueries({ queryKey: ['my-rating', mangaId] }); void client.invalidateQueries({ queryKey: ['rating-summary', mangaId] }) } })

  useEffect(() => {
    if (!mangaId || !mangaQuery.data || viewedMangaId.current === mangaId) return
    viewedMangaId.current = mangaId
    void api.manga.recordView(mangaId).then(({ data }) => {
      client.setQueryData<typeof mangaQuery.data>(['manga', mangaId], (current) => current ? { ...current, viewCount: data.viewCount } : current)
    }).catch((error: unknown) => {
      setNotice(error instanceof Error ? `View count could not be updated: ${error.message}` : 'View count could not be updated.')
    })
  }, [client, mangaId, mangaQuery.data])

  if (mangaQuery.isLoading) return <main className="content-page"><PageState>Loading manga…</PageState></main>
  if (mangaQuery.isError || !mangaQuery.data) return <main className="content-page"><PageState error={mangaQuery.error}/></main>
  const manga = mangaQuery.data
  const hasRated = Boolean(mineQuery.data?.value)
  const chapterSearchTerm = chapterSearch.trim()
  const visibleChapters = (chapterQuery.data ?? []).filter((chapter) => String(chapter.chapterNumber).includes(chapterSearchTerm))
  return <main className="content-page"><Link className="back-link" to="/">← Browse manga</Link><section className="detail-hero"><div className="detail-cover" style={manga.coverImage ? { backgroundImage: `url("${manga.coverImage}")` } : undefined}>{!manga.coverImage && <span>{manga.title.slice(0, 1)}</span>}</div><div className="detail-copy"><div className="genre-tags">{manga.genres.map((item) => <span className="tag" key={item}>{item}</span>)}</div><span className="status-label">{manga.status}</span><h1>{manga.title}</h1><p className="detail-author">{[...manga.authors, ...manga.artists].filter(Boolean).join(' · ') || 'Independent creator'}</p><p className="detail-description">{manga.description}</p><div className="detail-stats"><div><strong>★ {manga.ratingAverage ? manga.ratingAverage.toFixed(1) : '—'}</strong><span>{ratingQuery.data?.count ?? manga.ratingCount} ratings</span></div><div><strong>{chapterQuery.data?.length ?? '—'}</strong><span>chapters</span></div><div><strong>{(manga.viewCount ?? 0).toLocaleString()}</strong><span>views</span></div><div><strong className="capitalize">{manga.status}</strong><span>publication</span></div></div><div className="detail-actions"><Link className="button button-orange" to={chapterQuery.data?.[0] ? `/read/${chapterQuery.data[0]._id}` : '#chapters'}>{chapterQuery.data?.length ? 'Start reading' : 'Chapters coming soon'} <span>→</span></Link>{user && <select className="shelf-select" value={libraryQuery.data?.status || ''} disabled={addToLibrary.isPending} onChange={(event) => event.target.value && addToLibrary.mutate(event.target.value as LibraryEntry['status'])} aria-label="Add manga to my shelf"><option value="">＋ Add to my shelf</option><option value="reading">Reading</option><option value="planToRead">Plan to read</option><option value="completed">Completed</option><option value="dropped">Dropped</option></select>}</div>{notice && <p className="notice-text">{notice}</p>}</div></section>
    <div className="detail-columns"><section id="chapters" className="panel chapters-panel"><div className="subsection-heading"><div><span className="section-kicker">THE JOURNEY</span><h3>Chapters <span className="count-pill">{chapterQuery.data?.length ?? 0}</span></h3></div>{chapterQuery.data?.[0] && <Link className="text-link" to={`/read/${chapterQuery.data[0]._id}`}>Read from start →</Link>}</div>{chapterQuery.data && chapterQuery.data.length > 0 && <label className="chapter-search"><span aria-hidden="true">⌕</span><input type="search" inputMode="decimal" value={chapterSearch} onChange={(event) => setChapterSearch(event.target.value)} placeholder="Search by chapter number..." aria-label="Search chapters by number"/>{chapterSearch && <button type="button" onClick={() => setChapterSearch('')} aria-label="Clear chapter search">×</button>}</label>}{chapterQuery.isLoading ? <div className="chapter-loading" role="status" aria-label="Loading chapters"><i/><i/><i/></div> : chapterQuery.isError ? <PageState error={chapterQuery.error}/> : chapterQuery.data?.length ? visibleChapters.length ? <div className="chapter-list">{[...visibleChapters].reverse().map((chapter) => <Link className="chapter-row" to={`/read/${chapter._id}`} key={chapter._id}><span className="chapter-number">CH. {chapter.chapterNumber}</span><span className="chapter-title">{chapter.title || `Chapter ${chapter.chapterNumber}`}</span><span className="chapter-date">{chapter.publishedAt ? new Date(chapter.publishedAt).toLocaleDateString() : 'Read now'}</span><span className="chapter-arrow">→</span></Link>)}</div> : <div className="empty-inline">No chapters match “{chapterSearchTerm}”.</div> : <div className="empty-inline">No chapters have been published yet.</div>}</section>
      <aside className="panel rating-panel"><span className="section-kicker">YOUR TAKE</span><h3>Rate this story</h3><p>Your rating helps fellow readers find their next favorite.</p>{user ? <><div className="rating-picker" aria-label="Set your rating">{[1,2,3,4,5].map((value) => <button key={value} className={value <= (mineQuery.data?.value || 0) ? 'star active' : 'star'} onClick={() => saveRating.mutate(value)} aria-label={`${value} stars`}>★</button>)}</div>{hasRated && <button className="text-link" onClick={() => deleteRating.mutate()}>Remove my rating</button>}</> : <Link to="/login" className="text-link">Sign in to rate →</Link>}<div className="rating-distribution">{[5,4,3,2,1].map((star) => { const count = ratingQuery.data?.distribution?.[String(star)] || 0; const total = ratingQuery.data?.count || 0; return <div className="distribution-row" key={star}><span>{star} ★</span><span className="distribution-track"><i style={{ width: `${total ? count / total * 100 : 0}%` }}/></span><small>{count}</small></div> })}</div></aside></div>
    <Reviews mangaId={mangaId}/><Comments scope="manga" scopeId={mangaId}/>
  </main>
}
