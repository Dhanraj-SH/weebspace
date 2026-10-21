import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, type Comment, type Review } from '../../lib/api'
import { useAuth } from '../auth/useAuth'
import { ErrorMessage, PageState } from '../../components/Feedback'
import { Pagination } from '../../components/Pagination'

const readerName = (id: string) => `reader_${id.slice(-5)}`

export function Reviews({ mangaId }: { mangaId: string }) {
  const { user } = useAuth(); const client = useQueryClient(); const [page, setPage] = useState(1); const [content, setContent] = useState(''); const [rating, setRating] = useState(''); const [error, setError] = useState<unknown>(null)
  const queryKey = ['reviews', mangaId, page]
  const result = useQuery({ queryKey, queryFn: () => api.reviews.list(mangaId, page) })
  const create = useMutation({ mutationFn: () => api.reviews.create(mangaId, { content, ...(rating ? { rating: Number(rating) } : {}) }), onSuccess: () => { setContent(''); setRating(''); setError(null); void client.invalidateQueries({ queryKey: ['reviews', mangaId] }); void client.invalidateQueries({ queryKey: ['rating-summary', mangaId] }) }, onError: setError })
  const remove = useMutation({ mutationFn: api.reviews.remove, onSuccess: () => void client.invalidateQueries({ queryKey: ['reviews', mangaId] }) })
  const like = useMutation({ mutationFn: api.reviews.like, onSuccess: () => void client.invalidateQueries({ queryKey }) })
  const unlike = useMutation({ mutationFn: api.reviews.unlike, onSuccess: () => void client.invalidateQueries({ queryKey }) })
  function submit(event: FormEvent) { event.preventDefault(); setError(null); create.mutate() }
  return <section className="discussion-section"><div className="subsection-heading"><div><span className="section-kicker">READER NOTES</span><h3>Reviews <span className="count-pill">{result.data?.meta?.pagination?.total ?? ''}</span></h3></div></div>
    {user ? <form className="review-form" onSubmit={submit}><textarea maxLength={5000} required value={content} onChange={(event) => setContent(event.target.value)} placeholder="Share what you thought of this story…"/><div className="form-row"><label className="inline-field">Your rating <select value={rating} onChange={(event) => setRating(event.target.value)}><option value="">Skip rating</option>{[5,4,3,2,1].map((value) => <option key={value} value={value}>{value} stars</option>)}</select></label><small>{content.length}/5000</small><button className="button button-orange button-small" disabled={create.isPending}>Post review</button></div><ErrorMessage error={error}/></form> : <p className="signin-nudge">Want to leave a review? <Link to="/login">Sign in</Link> to join the conversation.</p>}
    <ErrorMessage error={like.error || unlike.error}/>{result.isLoading ? <PageState>Loading reviews…</PageState> : result.isError ? <PageState error={result.error}/> : result.data?.data.length ? <div className="review-list">{result.data.data.map((review) => <ReviewItem key={review._id} review={review} canLike={Boolean(user)} isOwner={user?.id === review.userId} canModerate={user?.role === 'admin' || user?.role === 'moderator'} onLike={() => like.mutateAsync(review._id)} onUnlike={() => unlike.mutateAsync(review._id)} onDelete={() => remove.mutate(review._id)}/>)}</div> : <div className="empty-inline">No reviews yet. Be the first reader to share a thought.</div>}
    <Pagination page={page} data={result.data?.meta?.pagination} onChange={setPage}/>
  </section>
}

function ReviewItem({ review, canLike, isOwner, canModerate, onLike, onUnlike, onDelete }: { review: Review; canLike: boolean; isOwner: boolean; canModerate: boolean; onLike: () => Promise<unknown>; onUnlike: () => Promise<unknown>; onDelete: () => void }) {
  const client = useQueryClient(); const [liked, setLiked] = useState(false); const [editing, setEditing] = useState(false); const [content, setContent] = useState(review.content)
  const update = useMutation({ mutationFn: () => api.reviews.update(review._id, { content }), onSuccess: () => { setEditing(false); void client.invalidateQueries({ queryKey: ['reviews', review.mangaId] }) } })
  async function toggleLike() { try { if (liked) { await onUnlike(); setLiked(false) } else { await onLike(); setLiked(true) } } catch { /* The parent shows the API error. */ } }
  return <article className="review-item"><div className="user-avatar">{readerName(review.userId).slice(-1).toUpperCase()}</div><div className="review-body"><div className="review-meta"><b>{readerName(review.userId)}</b><time>{new Date(review.createdAt).toLocaleDateString()}</time>{review.rating && <span className="rating">★ {review.rating}</span>}</div>{editing ? <form className="edit-inline" onSubmit={(event) => { event.preventDefault(); update.mutate() }}><textarea maxLength={5000} required value={content} onChange={(event) => setContent(event.target.value)}/><div className="review-actions"><button type="submit" disabled={update.isPending}>Save</button><button type="button" onClick={() => { setContent(review.content); setEditing(false) }}>Cancel</button></div><ErrorMessage error={update.error}/></form> : <p>{review.content}</p>}<div className="review-actions">{canLike ? <button onClick={() => void toggleLike()}>{liked ? '♥ Helpful' : `♡ Helpful · ${review.likesCount}`}</button> : <Link to="/login">Sign in to like</Link>}{isOwner && !editing && <button onClick={() => setEditing(true)}>Edit</button>}{(isOwner || canModerate) && <button className="danger-text" onClick={onDelete}>Delete</button>}</div></div></article>
}

export function Comments({ scope, scopeId }: { scope: 'manga' | 'chapter'; scopeId: string }) {
  const { user } = useAuth(); const client = useQueryClient(); const [page, setPage] = useState(1); const [content, setContent] = useState(''); const [replyTo, setReplyTo] = useState<string>(); const [error, setError] = useState<unknown>(null)
  const queryKey = ['comments', scope, scopeId, page]
  const result = useQuery({ queryKey, queryFn: () => scope === 'manga' ? api.comments.manga(scopeId, page) : api.comments.chapter(scopeId, page) })
  const create = useMutation({ mutationFn: () => scope === 'manga' ? api.comments.createManga(scopeId, content, replyTo) : api.comments.createChapter(scopeId, content, replyTo), onSuccess: () => { setContent(''); setReplyTo(undefined); setError(null); void client.invalidateQueries({ queryKey: ['comments', scope, scopeId] }) }, onError: setError })
  const remove = useMutation({ mutationFn: api.comments.remove, onSuccess: () => void client.invalidateQueries({ queryKey: ['comments', scope, scopeId] }) })
  const update = useMutation({ mutationFn: ({ id, value }: { id: string; value: string }) => api.comments.update(id, value), onSuccess: () => void client.invalidateQueries({ queryKey: ['comments', scope, scopeId] }) })
  const canDelete = (comment: Comment) => user?.id === comment.userId || user?.role === 'admin' || user?.role === 'moderator'
  function submit(event: FormEvent) { event.preventDefault(); create.mutate() }
  return <section className="discussion-section"><div className="subsection-heading"><div><span className="section-kicker">COMMUNITY</span><h3>Comments <span className="count-pill">{result.data?.meta?.pagination?.total ?? ''}</span></h3></div></div>
    {user ? <form className="comment-form" onSubmit={submit}>{replyTo && <div className="replying-to">Replying to a reader <button type="button" onClick={() => setReplyTo(undefined)}>Cancel</button></div>}<textarea required maxLength={500} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Add to the conversation…"/><div className="form-row"><small>{content.length}/500</small><button className="button button-orange button-small" disabled={create.isPending}>Post comment</button></div><ErrorMessage error={error}/></form> : <p className="signin-nudge"><Link to="/login">Sign in</Link> to join the conversation.</p>}
    <ErrorMessage error={remove.error}/>{result.isLoading ? <PageState>Loading comments…</PageState> : result.isError ? <PageState error={result.error}/> : result.data?.data.length ? <div className="comment-list">{result.data.data.map((comment) => <CommentThread key={comment._id} comment={comment} canEdit={(item) => user?.id === item.userId} canDelete={canDelete} onReply={setReplyTo} onUpdate={(id, value) => update.mutateAsync({ id, value })} onDelete={(id) => remove.mutate(id)}/>)}</div> : <div className="empty-inline">Nothing here yet. Start the conversation.</div>}
    <Pagination page={page} data={result.data?.meta?.pagination} onChange={setPage}/>
  </section>
}

function CommentThread({ comment, canEdit, canDelete, onReply, onUpdate, onDelete }: { comment: Comment; canEdit: (comment: Comment) => boolean; canDelete: (comment: Comment) => boolean; onReply: (id: string) => void; onUpdate: (id: string, value: string) => Promise<Comment>; onDelete: (id: string) => void }) {
  return <div className="comment-thread"><CommentItem item={comment} canEdit={canEdit} canDelete={canDelete} onReply={onReply} onUpdate={onUpdate} onDelete={onDelete}/>{comment.replies?.map((reply) => <CommentItem key={reply._id} item={reply} reply canEdit={canEdit} canDelete={canDelete} onReply={onReply} onUpdate={onUpdate} onDelete={onDelete}/>)}</div>
}

function CommentItem({ item, reply = false, canEdit, canDelete, onReply, onUpdate, onDelete }: { item: Comment; reply?: boolean; canEdit: (comment: Comment) => boolean; canDelete: (comment: Comment) => boolean; onReply: (id: string) => void; onUpdate: (id: string, value: string) => Promise<Comment>; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false); const [content, setContent] = useState(item.content); const [error, setError] = useState<unknown>(null)
  async function save(event: FormEvent) { event.preventDefault(); setError(null); try { await onUpdate(item._id, content); setEditing(false) } catch (reason) { setError(reason) } }
  return <div className={`comment-item ${reply ? 'comment-reply' : ''}`}><div className="user-avatar">{readerName(item.userId).slice(-1).toUpperCase()}</div><div className="comment-copy"><div className="review-meta"><b>{readerName(item.userId)}</b><time>{new Date(item.createdAt).toLocaleDateString()}</time></div>{editing ? <form className="edit-inline" onSubmit={(event) => void save(event)}><textarea required maxLength={500} value={content} onChange={(event) => setContent(event.target.value)}/><div className="review-actions"><button>Save</button><button type="button" onClick={() => { setContent(item.content); setEditing(false) }}>Cancel</button></div><ErrorMessage error={error}/></form> : <p>{item.content}</p>}<div className="review-actions">{!reply && <button onClick={() => onReply(item._id)}>Reply</button>}{canEdit(item) && !editing && <button onClick={() => setEditing(true)}>Edit</button>}{canDelete(item) && <button className="danger-text" onClick={() => onDelete(item._id)}>Delete</button>}</div></div></div>
}
