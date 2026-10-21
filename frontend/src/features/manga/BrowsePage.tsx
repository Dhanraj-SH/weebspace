import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { MangaCard } from '../../components/MangaCard'
import { PageState } from '../../components/Feedback'
import { Pagination } from '../../components/Pagination'
import { api } from '../../lib/api'

const genres = ['action', 'actionAdventure', 'adventure', 'animation', 'awardWinning', 'boysLove', 'cars', 'comedy', 'dementia', 'demons', 'drama', 'ecchi', 'erotica', 'fantasy', 'game', 'girlsLove', 'gourmet', 'harem', 'historical', 'horror', 'isekai', 'josei', 'kids', 'magic', 'mahouShoujo', 'martialArts', 'mecha', 'military', 'music', 'mystery', 'parody', 'police', 'psychological', 'romance', 'samurai', 'school', 'sciFi', 'sciFiFantasy', 'seinen', 'shoujo', 'shoujoAi', 'shounen', 'shounenAi', 'sliceOfLife', 'space', 'sports', 'superPower', 'supernatural', 'suspense', 'thriller', 'unknown', 'vampire']

export function BrowsePage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('q') || ''
  const genre = params.get('genre') || ''
  const status = params.get('status') || ''
  const page = Number(params.get('page') || 1)
  const sortBy = params.get('sortBy') || 'createdAt'
  const [searchInput, setSearchInput] = useState(search)
  const result = useQuery({ queryKey: ['manga', { search, genre, status, page, sortBy }], queryFn: () => api.manga.list({ q: search, genre, status, page, limit: 12, sortBy, order: sortBy === 'title' ? 'asc' : 'desc' }) })
  const setFilter = (key: string, value: string) => setParams((current) => { const next = new URLSearchParams(current); if (value) next.set(key, value); else next.delete(key); next.delete('page'); return next })
  function submit(event: FormEvent) { event.preventDefault(); setFilter('q', searchInput.trim()) }

  return <main>
    <section className="hero-banner"><div className="hero-copy"><span className="eyebrow"><span className="eyebrow-dot" /> YOUR NEXT OBSESSION STARTS HERE</span><h1>Stories worth<br />staying up <em>for.</em></h1><p>Find your next favorite manga. Explore new worlds, unforgettable characters, and stories that stay with you.</p><a className="button button-light" href="#browse">Explore the library <span>↓</span></a><div className="hero-note"><span className="note-icon">✦</span>Made for readers, by readers</div></div><div className="hero-art" aria-hidden="true"><div className="sun-disc"/><div className="book book-back"><div className="book-art art-blue"/><span>THE<br/>LAST<br/>ORBIT</span></div><div className="book book-front"><div className="book-art art-red"/><span>WILD<br/>HEARTS</span></div><div className="sparkle sparkle-one">✳</div><div className="sparkle sparkle-two">✦</div><div className="art-caption">VOL. 01 <b>—</b> NEW WORLDS AWAIT</div></div><div className="hero-index">01 <span>/</span> 04</div></section>
    <section id="browse" className="browse-section"><div className="section-heading"><div><span className="section-kicker">THE GOOD STUFF</span><h2>Find your next <em>favorite</em></h2></div><span className="text-muted">{result.data?.meta?.pagination?.total ?? '—'} stories to explore</span></div>
      <form className="search-row" onSubmit={submit}><label className="search-box"><span aria-hidden="true">⌕</span><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search titles, authors, worlds..." aria-label="Search manga"/><kbd>ENTER ↵</kbd></label><label className="sort-select"><span>Sort:</span><select value={sortBy} onChange={(event) => setFilter('sortBy', event.target.value)} aria-label="Sort manga"><option value="createdAt">Recently added</option><option value="ratingAverage">Top rated</option><option value="title">Title A–Z</option></select></label></form>
      <div className="genre-row"><button className={!genre ? 'chip selected' : 'chip'} onClick={() => setFilter('genre', '')}>All stories</button>{genres.map((item) => <button key={item} className={genre === item ? 'chip selected' : 'chip'} onClick={() => setFilter('genre', genre === item ? '' : item)}>{item === 'sciFi' ? 'Sci-fi' : item.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</button>)}<select className="status-filter" value={status} onChange={(event) => setFilter('status', event.target.value)} aria-label="Filter by status"><option value="">Any status</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="hiatus">Hiatus</option></select></div>
      <div className="results-label"><span>{search || genre || status ? 'MATCHING STORIES' : 'FRESHLY ADDED'}</span><span>{result.data?.meta?.pagination ? `PAGE ${page} OF ${result.data.meta.pagination.totalPages}` : 'CURATED FOR YOU'}</span></div>
      {result.isLoading ? <PageState>Loading the library…</PageState> : result.isError ? <PageState error={result.error} action={<button className="text-link" onClick={() => void result.refetch()}>Try again →</button>}/> : result.data?.data.length ? <div className="manga-grid">{result.data.data.map((item) => <MangaCard key={item._id} manga={item}/>)}</div> : <PageState><b>No stories found just yet.</b><span>Try another search or clear your filters.</span></PageState>}
      <Pagination page={page} data={result.data?.meta?.pagination} onChange={(value) => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(value)); return next })}/>
    </section>
    <section className="join-banner"><div><span className="section-kicker">YOUR SHELF IS WAITING</span><h2>Every great story<br/>starts with <em>you.</em></h2><p>Make a free account to keep your reading list, pick up where you left off, and find your people.</p></div><div className="join-actions"><Link className="button button-orange" to="/register">Create your account <span>↗</span></Link><Link className="button button-outline" to="/login">Already a member? Sign in</Link><small>Free to join. Always a good read.</small></div><span className="join-decoration" aria-hidden="true">W.</span></section>
  </main>
}
