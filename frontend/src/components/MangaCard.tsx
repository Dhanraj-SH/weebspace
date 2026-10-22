import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Manga } from '../lib/api'

export function MangaCard({ manga, rank }: { manga: Manga; rank?: number }) {
  const [imageFailed, setImageFailed] = useState(false)

  return <article className="manga-card">
    <Link className={`cover${!manga.coverImage || imageFailed ? ' cover-placeholder' : ''}`} to={`/manga/${manga._id}`} aria-label={`Read ${manga.title}`}>
      {manga.coverImage && !imageFailed
        ? <img className="cover-image" src={manga.coverImage} alt="" loading="lazy" onError={() => setImageFailed(true)}/>
        : <span className="cover-letter">{manga.title.slice(0, 1)}</span>}
      {rank !== undefined && <span className="cover-rank">{String(rank).padStart(2, '0')}</span>}
      <span className="cover-status">{manga.status}</span>
      <span className="cover-open">Read story</span>
    </Link>
    <div className="card-info"><div className="card-title-row"><Link to={`/manga/${manga._id}`}><h3>{manga.title}</h3></Link><span className="rating">★ {manga.ratingAverage ? manga.ratingAverage.toFixed(1) : '—'}</span></div><p>{manga.genres?.slice(0, 2).join(' · ') || 'New arrival'} · {manga.ratingCount} ratings</p></div>
  </article>
}
