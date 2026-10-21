import { Link } from 'react-router-dom'
import type { Manga } from '../lib/api'

export function MangaCard({ manga }: { manga: Manga }) {
  return <article className="manga-card"><Link className="cover" to={`/manga/${manga._id}`} style={manga.coverImage ? { backgroundImage: `linear-gradient(180deg,transparent 50%,rgba(20,15,12,.4)),url("${manga.coverImage}")` } : undefined}>
    {!manga.coverImage && <span className="cover-letter">{manga.title.slice(0, 1)}</span>}<span className="cover-status">{manga.status}</span><span className="cover-open">↗</span>
  </Link><div className="card-info"><div className="card-title-row"><Link to={`/manga/${manga._id}`}><h3>{manga.title}</h3></Link><span className="rating">★ {manga.ratingAverage ? manga.ratingAverage.toFixed(1) : '—'}</span></div><p>{manga.genres?.slice(0, 2).join(' · ') || 'New arrival'} · {manga.ratingCount} ratings</p></div></article>
}
