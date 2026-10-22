import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { MangaCard } from '../../components/MangaCard'
import { PageState } from '../../components/Feedback'
import { Pagination } from '../../components/Pagination'
import { api } from '../../lib/api'

const genres = ['action', 'actionAdventure', 'adventure', 'animation', 'awardWinning', 'boysLove', 'cars', 'comedy', 'dementia', 'demons', 'drama', 'ecchi', 'erotica', 'fantasy', 'game', 'girlsLove', 'gourmet', 'harem', 'historical', 'horror', 'isekai', 'josei', 'kids', 'magic', 'mahouShoujo', 'martialArts', 'mecha', 'military', 'music', 'mystery', 'parody', 'police', 'psychological', 'romance', 'samurai', 'school', 'sciFi', 'sciFiFantasy', 'seinen', 'shoujo', 'shoujoAi', 'shounen', 'shounenAi', 'sliceOfLife', 'space', 'sports', 'superPower', 'supernatural', 'suspense', 'thriller', 'unknown', 'vampire']

function TopReadsCarousel() {
  const result = useQuery({
    queryKey: ['manga-shelf', 'reader-favorites'],
    queryFn: () => api.manga.list({ page: 1, limit: 5, sortBy: 'ratingCount', order: 'desc' }),
  })
  const [activeIndex, setActiveIndex] = useState(0)
  const stories = result.data?.data ?? []
  const activeStory = stories[activeIndex] ?? stories[0]

  if (result.isLoading) return null

  if (result.isError) {
    return <section className="top-reads-carousel">
      <div className="shelf-heading"><div><span className="section-kicker">READER FAVORITES</span><h2>Stories to stay up for</h2></div></div>
      <PageState error={result.error} action={<button className="text-link" onClick={() => void result.refetch()}>Try again →</button>}/>
    </section>
  }

  if (!activeStory) return null

  return <section className="manga-shelf">
    <div className="shelf-heading">
      <div><span className="section-kicker">READER FAVORITES</span><h2>Stories to stay up for</h2></div>
      <Link to="/?sortBy=ratingCount#browse" className="shelf-link">Browse all <span aria-hidden="true">↗</span></Link>
    </div>
    <div className="top-reads-carousel" aria-roledescription="carousel" aria-label="Popular manga">
      {activeStory.coverImage
        ? <img className="top-reads-backdrop" src={activeStory.coverImage} alt="" onError={(event) => { event.currentTarget.style.visibility = 'hidden' }}/>
        : <div className="top-reads-backdrop top-reads-backdrop-fallback" aria-hidden="true"/>}
      <div className="top-reads-overlay"/>
      <div className="top-reads-copy">
        <span className="top-reads-label">THIS WEEK'S READER PICK</span>
        <span className="top-reads-count">{String(activeIndex + 1).padStart(2, '0')} <i>/</i> {String(stories.length).padStart(2, '0')}</span>
        <h3>{activeStory.title}</h3>
        <p>{activeStory.description}</p>
        <div className="top-reads-meta"><span>{activeStory.genres?.slice(0, 2).join(' · ') || 'Worth the first chapter'}</span><span>{activeStory.ratingCount} reader ratings</span></div>
        <Link className="button button-light" to={`/manga/${activeStory._id}`}>Read now <span aria-hidden="true">→</span></Link>
      </div>
      <div className="top-reads-cover">
        <span className="top-reads-cover-letter">{activeStory.title.slice(0, 1)}</span>
        {activeStory.coverImage
          ? <img src={activeStory.coverImage} alt={`${activeStory.title} cover`} onError={(event) => { event.currentTarget.style.visibility = 'hidden' }}/>
          : null}
      </div>
      {stories.length > 1 && <div className="carousel-controls">
        <button type="button" aria-label="Previous manga" onClick={() => setActiveIndex((index) => (index - 1 + stories.length) % stories.length)}>←</button>
        {stories.map((story, index) => <button key={story._id} type="button" className={index === activeIndex ? 'carousel-dot active' : 'carousel-dot'} aria-label={`Show ${story.title}`} aria-pressed={index === activeIndex} onClick={() => setActiveIndex(index)}/>)}
        <button type="button" aria-label="Next manga" onClick={() => setActiveIndex((index) => (index + 1) % stories.length)}>→</button>
      </div>}
    </div>
  </section>
}

function NewReleases() {
  const result = useQuery({
    queryKey: ['manga-shelf', 'new-releases'],
    queryFn: () => api.manga.list({ page: 1, limit: 5, sortBy: 'createdAt', order: 'desc' }),
  })

  if (result.isLoading) return null

  return <section className="manga-shelf">
    <div className="shelf-heading">
      <div><span className="section-kicker">FRESH OFF THE PRESS</span><h2>New releases</h2></div>
      <Link to="/?sortBy=createdAt#browse" className="shelf-link">All releases <span aria-hidden="true">↗</span></Link>
    </div>
    {result.isError
      ? <PageState error={result.error} action={<button className="text-link" onClick={() => void result.refetch()}>Try again →</button>}/>
      : result.data?.data.length
        ? <div className="manga-grid shelf-grid">{result.data.data.map((manga) => <MangaCard key={manga._id} manga={manga}/>)}</div>
        : <PageState>No new stories yet. Check back soon.</PageState>}
  </section>
}

function FeelingSpecial() {
  const result = useQuery({
    queryKey: ['manga-shelf', 'surprise-picks'],
    queryFn: async () => {
      const response = await api.manga.list({ page: 1, limit: 100, sortBy: 'createdAt', order: 'desc' })
      const stories = response.data
      return { stories, initialIndex: stories.length ? Math.floor(Math.random() * stories.length) : 0 }
    },
  })
  const [pickIndex, setPickIndex] = useState<number | null>(null)
  const stories = result.data?.stories ?? []
  const activeStory = stories[pickIndex ?? result.data?.initialIndex ?? 0]

  function pickAnother() {
    if (stories.length < 2) return
    const currentIndex = pickIndex ?? result.data?.initialIndex ?? 0
    const offset = 1 + Math.floor(Math.random() * (stories.length - 1))
    setPickIndex((currentIndex + offset) % stories.length)
  }

  if (result.isLoading) return null

  return <section className="feeling-special">
    <div className="special-copy">
      <span className="section-kicker">CAN'T PICK? WE'VE GOT YOU</span>
      <h2>Feeling <em>special?</em></h2>
      <p>Let the next great read find you. No scrolling required.</p>
      <button className="button button-light" type="button" onClick={pickAnother} disabled={stories.length < 2}>Surprise me <span aria-hidden="true">↻</span></button>
    </div>
    {result.isError
      ? <PageState error={result.error} action={<button className="text-link" onClick={() => void result.refetch()}>Try again →</button>}/>
      : activeStory
        ? <Link className="special-pick" to={`/manga/${activeStory._id}`}>
            <span className="special-letter">{activeStory.title.slice(0, 1)}</span>
            {activeStory.coverImage
              ? <img src={activeStory.coverImage} alt="" onError={(event) => { event.currentTarget.style.visibility = 'hidden' }}/>
              : null}
            <span className="special-pick-info"><small>YOUR UNEXPECTED NEXT READ</small><strong>{activeStory.title}</strong><span>Meet your next favorite <b aria-hidden="true">→</b></span></span>
          </Link>
        : <p className="special-empty">Add a few stories to the library and we’ll find you a good one.</p>}
  </section>
}

export function BrowsePage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('q') || ''
  const genre = params.get('genre') || ''
  const status = params.get('status') || ''
  const page = Number(params.get('page') || 1)
  const sortBy = params.get('sortBy') || 'createdAt'
  const [searchInput, setSearchInput] = useState(search)
  const result = useQuery({
    queryKey: ['manga', { search, genre, status, page, sortBy }],
    queryFn: () => api.manga.list({ q: search, genre, status, page, limit: 12, sortBy, order: sortBy === 'title' ? 'asc' : 'desc' }),
  })
  const setFilter = (key: string, value: string) => setParams((current) => {
    const next = new URLSearchParams(current)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    return next
  })
  function submit(event: FormEvent) {
    event.preventDefault()
    setFilter('q', searchInput.trim())
  }

  return <main className="discover-page">
    <div className="editorial-shelves">
      <TopReadsCarousel/>
      <NewReleases/>
      <FeelingSpecial/>
    </div>

    <section id="browse" className="browse-section">
      <div className="section-heading">
        <div><span className="section-kicker">THE FULL COLLECTION</span><h2>Find your next <em>favorite</em></h2></div>
        <span className="text-muted">{result.data?.meta?.pagination?.total ?? '—'} stories to explore</span>
      </div>
      <form className="search-row" onSubmit={submit}>
        <label className="search-box"><span aria-hidden="true">⌕</span><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search titles, authors, worlds..." aria-label="Search manga"/><kbd>ENTER ↵</kbd></label>
        <label className="sort-select"><span>Sort:</span><select value={sortBy} onChange={(event) => setFilter('sortBy', event.target.value)} aria-label="Sort manga"><option value="createdAt">Recently added</option><option value="ratingAverage">Top rated</option><option value="ratingCount">Most popular</option><option value="title">Title A–Z</option></select></label>
      </form>
      <div className="genre-row">
        <button className={!genre ? 'chip selected' : 'chip'} onClick={() => setFilter('genre', '')}>All stories</button>
        {genres.map((item) => <button key={item} className={genre === item ? 'chip selected' : 'chip'} onClick={() => setFilter('genre', genre === item ? '' : item)}>{item === 'sciFi' ? 'Sci-fi' : item.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase())}</button>)}
        <select className="status-filter" value={status} onChange={(event) => setFilter('status', event.target.value)} aria-label="Filter by status"><option value="">Any status</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="hiatus">Hiatus</option></select>
      </div>
      <div className="results-label"><span>{search || genre || status ? 'MATCHING STORIES' : 'FRESHLY ADDED'}</span><span>{result.data?.meta?.pagination ? `PAGE ${page} OF ${result.data.meta.pagination.totalPages}` : 'CURATED FOR YOU'}</span></div>
      {result.isLoading ? <PageState>Loading the library…</PageState> : result.isError ? <PageState error={result.error} action={<button className="text-link" onClick={() => void result.refetch()}>Try again →</button>}/> : result.data?.data.length ? <div className="manga-grid">{result.data.data.map((item) => <MangaCard key={item._id} manga={item}/>)}</div> : <PageState><b>No stories found just yet.</b><span>Try another search or clear your filters.</span></PageState>}
      <Pagination page={page} data={result.data?.meta?.pagination} onChange={(value) => setParams((current) => {
        const next = new URLSearchParams(current)
        next.set('page', String(value))
        return next
      })}/>
    </section>
    <section className="join-banner">
      <div><span className="section-kicker">YOUR SHELF IS WAITING</span><h2>Every great story<br/>starts with <em>you.</em></h2><p>Make a free account to keep your reading list, pick up where you left off, and find your people.</p></div>
      <div className="join-actions"><Link className="button button-orange" to="/register">Create your account <span aria-hidden="true">↗</span></Link><Link className="button button-outline" to="/login">Already a member? Sign in</Link><small>Free to join. Always a good read.</small></div>
      <span className="join-decoration" aria-hidden="true">W.</span>
    </section>
  </main>
}
