import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { PageState } from '../../components/Feedback'
import { api } from '../../lib/api'
import { useAuth } from '../auth/useAuth'
import { Comments } from '../manga/Discussion'

export function ReaderPage({ chapterId }: { chapterId: string }) {
  const { user } = useAuth(); const client = useQueryClient(); const navigate = useNavigate(); const [chosenPage, setChosenPage] = useState<number | null>(null)
  const chapterQuery = useQuery({ queryKey: ['chapter', chapterId], queryFn: () => api.chapters.get(chapterId), enabled: Boolean(chapterId) })
  const chapter = chapterQuery.data
  const progressQuery = useQuery({ queryKey: ['progress', chapter?.mangaId], queryFn: () => api.progress.get(chapter!.mangaId), enabled: Boolean(user && chapter?.mangaId), retry: false })
  const page = chosenPage ?? (user && !progressQuery.isFetched ? null : progressQuery.data?.chapterId === chapter?._id ? progressQuery.data?.pageNumber ?? 1 : 1)
  const { mutate: saveProgress, isPending: savingProgress } = useMutation({ mutationFn: (value: number) => api.progress.save(chapter!.mangaId, chapter!._id, value), onSuccess: () => void client.invalidateQueries({ queryKey: ['reading-progress'] }) })
  useEffect(() => {
    if (!user || !chapter || page === null || !progressQuery.isFetched || chapter.pages.length === 0) return
    const timeout = window.setTimeout(() => saveProgress(page), 800)
    return () => window.clearTimeout(timeout)
  }, [page, user, chapter, progressQuery.isFetched, saveProgress])

  if (chapterQuery.isLoading) return <main className="content-page"><PageState>Opening chapter…</PageState></main>
  if (chapterQuery.isError || !chapter) return <main className="content-page"><PageState error={chapterQuery.error}/></main>
  const total = chapter.pages.length
  if (page === null) return <main className="content-page"><PageState>Restoring your reading progress…</PageState></main>
  const move = (value: number) => { const next = Math.min(Math.max(1, value), total); setChosenPage(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  return <main className="reader-page"><div className="reader-toolbar"><Link to={`/manga/${chapter.mangaId}`} className="back-link">← Manga details</Link><div className="reader-chapter-label">Chapter {chapter.chapterNumber}{chapter.title ? ` · ${chapter.title}` : ''}</div><div className="reader-chapter-nav">{chapter.prevChapterId ? <button onClick={() => navigate(`/read/${chapter.prevChapterId}`)}>← Previous</button> : <button disabled>← Previous</button>}{chapter.nextChapterId ? <button onClick={() => navigate(`/read/${chapter.nextChapterId}`)}>Next →</button> : <button disabled>Next →</button>}</div></div>
    <div className="reader-content">{total ? <><div className="reader-progress-label">PAGE {page} OF {total}{user && <span>{savingProgress ? 'Saving…' : 'Progress saves automatically'}</span>}</div><img className="reader-image" src={chapter.pages[page - 1]} alt={`Page ${page} of chapter ${chapter.chapterNumber}`} onError={(event) => { event.currentTarget.alt = 'This page could not be loaded'; event.currentTarget.classList.add('broken-image') }}/><div className="reader-controls"><button disabled={page <= 1} onClick={() => move(page - 1)}>← Previous page</button><label>Page <input type="number" min={1} max={total} value={page} onChange={(event) => move(Number(event.target.value) || 1)}/> <span>of {total}</span></label><button disabled={page >= total} onClick={() => move(page + 1)}>Next page →</button></div></> : <div className="reader-empty"><span className="section-kicker">PAGES COMING SOON</span><h2>This chapter is not ready yet.</h2><p>There are no page images attached to this chapter.</p><Link to={`/manga/${chapter.mangaId}`} className="button button-orange">Back to manga</Link></div>}</div>
    {chapter.nextChapterId && total > 0 && page === total && <div className="next-chapter-callout"><div><span className="section-kicker">UP NEXT</span><h3>Keep the story going?</h3></div><button className="button button-orange" onClick={() => navigate(`/read/${chapter.nextChapterId}`)}>Next chapter →</button></div>}
    <Comments scope="chapter" scopeId={chapterId}/>
  </main>
}
