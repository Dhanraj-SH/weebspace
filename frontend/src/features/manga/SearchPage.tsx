import { useRef, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { PageState } from '../../components/Feedback'
import { MangaCard } from '../../components/MangaCard'
import { Pagination } from '../../components/Pagination'
import { api } from '../../lib/api'
import { formatGenre, genreOptions } from './genreOptions'

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('q')?.trim() || ''
  const requestedGenre = params.get('genre')
  const genre = genreOptions.find((option) => option === requestedGenre) || ''
  const requestedStatus = params.get('status')
  const status = requestedStatus === 'ongoing' || requestedStatus === 'completed' || requestedStatus === 'hiatus' ? requestedStatus : ''
  const requestedPage = Number(params.get('page') || 1)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const searchTooLong = search.length > 100
  const requestedSort = params.get('sortBy')
  const sortBy = requestedSort === 'ratingAverage' || requestedSort === 'title' ? requestedSort : 'createdAt'
  const hasCriteria = Boolean(search || genre || status)
  const searchInput = useRef<HTMLInputElement>(null)

  const result = useQuery({
    queryKey: ['manga-search', { search, genre, status, page, sortBy }],
    queryFn: () => api.manga.list({
      q: search || undefined,
      genre: genre || undefined,
      status: status || undefined,
      page,
      limit: 12,
      sortBy,
      order: sortBy === 'title' ? 'asc' : 'desc',
    }),
    enabled: hasCriteria && !searchTooLong,
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    const query = searchInput.current?.value.trim() || ''
    if (!query || query.length > 100) return
    setParams((current) => {
      const next = new URLSearchParams(current)
      next.set('q', query)
      next.delete('page')
      return next
    })
  }

  function changeFilter(key: 'genre' | 'status' | 'sortBy', value: string) {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (value) next.set(key, value)
      else next.delete(key)
      next.delete('page')
      return next
    })
  }

  function clearFilters() {
    setParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('genre')
      next.delete('status')
      next.delete('sortBy')
      next.delete('page')
      return next
    })
  }

  function changePage(value: number) {
    setParams((current) => {
      const next = new URLSearchParams(current)
      next.set('page', String(value))
      return next
    })
  }

  return <main className="search-results-page">
    <span className="section-kicker">THE WEEBSPACE LIBRARY</span>
    <h1>{search ? <>Results for <em>“{search}”</em></> : 'Search the library'}</h1>
    <p className="search-results-intro">Titles, authors, and alternate names — all in one place.</p>
    <form className="search-results-form" onSubmit={submit} role="search">
      <div className="search-box"><span aria-hidden="true">⌕</span><input key={search} ref={searchInput} defaultValue={search} maxLength={100} placeholder="Try a title or author..." aria-label="Search titles and authors" required/><button type="submit">Search</button></div>
      <div className="search-results-filters" aria-label="Filter search results">
        <label className="search-filter"><span>Genre</span><select value={genre} onChange={(event) => changeFilter('genre', event.target.value)} aria-label="Filter by genre"><option value="">All genres</option>{genreOptions.map((option) => <option key={option} value={option}>{formatGenre(option)}</option>)}</select></label>
        <label className="search-filter"><span>Status</span><select value={status} onChange={(event) => changeFilter('status', event.target.value)} aria-label="Filter by manga status"><option value="">Any status</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="hiatus">Hiatus</option></select></label>
        <label className="search-filter"><span>Sort</span><select value={sortBy} onChange={(event) => changeFilter('sortBy', event.target.value)} aria-label="Sort search results"><option value="createdAt">Recently added</option><option value="ratingAverage">Top rated</option><option value="title">Title A–Z</option></select></label>
        {(genre || status || params.has('sortBy')) && <button className="clear-search-filters" type="button" onClick={clearFilters}>Clear filters</button>}
      </div>
    </form>
    {searchTooLong
      ? <PageState>Search terms must be 100 characters or fewer.</PageState>
      : !hasCriteria
      ? <PageState>Search by title or author, or choose a genre or status to explore the library.</PageState>
      : result.isLoading
        ? <PageState>Searching the library…</PageState>
        : result.isError
          ? <PageState error={result.error} action={<button className="text-link" onClick={() => void result.refetch()}>Try again →</button>}/>
          : result.data?.data.length
            ? <>
                <div className="search-results-label"><span>{result.data.meta?.pagination?.total ?? result.data.data.length} stories found</span><span>PAGE {page} OF {result.data.meta?.pagination?.totalPages ?? 1}</span></div>
                <div className="manga-grid">{result.data.data.map((manga) => <MangaCard key={manga._id} manga={manga}/>)}</div>
                <Pagination page={page} data={result.data.meta?.pagination} onChange={changePage}/>
              </>
            : <PageState><b>{search ? `No stories found for “${search}”.` : 'No stories match these filters.'}</b><span>Try changing your search or clearing a filter.</span></PageState>}
  </main>
}
