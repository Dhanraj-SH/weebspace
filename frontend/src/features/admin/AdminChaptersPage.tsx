import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ErrorMessage, FieldError, PageState } from '../../components/Feedback'
import { api, type Chapter, type Manga } from '../../lib/api'
import { GenrePicker } from './GenrePicker'

const MAX_COVER = 5 * 1024 * 1024
const MAX_PAGE = 10 * 1024 * 1024
const acceptedType = (file: File) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
const isMangaStatus = (value: string): value is Manga['status'] => value === 'ongoing' || value === 'completed' || value === 'hiatus'

async function uploadFile(file: File, purpose: 'cover' | 'page', mangaId: string, chapterId?: string) {
  if (!acceptedType(file)) throw new Error('Choose a JPEG, PNG, or WebP image.')
  if (file.size > (purpose === 'cover' ? MAX_COVER : MAX_PAGE)) throw new Error(`This file exceeds the ${purpose === 'cover' ? '5 MB cover' : '10 MB page'} limit.`)
  const presigned = await api.uploads.presign(purpose === 'cover' ? { purpose, mangaId, contentType: file.type, size: file.size } : { purpose, mangaId, chapterId: chapterId!, contentType: file.type, size: file.size })
  await api.uploads.put(presigned.uploadUrl, file, presigned.requiredHeaders)
  return presigned.key
}

export function AdminChaptersPage() {
  const { mangaId = '' } = useParams(); const client = useQueryClient(); const mangaQuery = useQuery({ queryKey: ['manga', mangaId], queryFn: () => api.manga.get(mangaId), enabled: Boolean(mangaId) }); const chaptersQuery = useQuery({ queryKey: ['chapters', mangaId], queryFn: () => api.manga.chapters(mangaId), enabled: Boolean(mangaId) })
  const [titleOverride, setTitleOverride] = useState<string | null>(null); const [descriptionOverride, setDescriptionOverride] = useState<string | null>(null); const [genresOverride, setGenresOverride] = useState<string[] | null>(null); const [statusOverride, setStatusOverride] = useState<Manga['status'] | null>(null); const [chapterNumber, setChapterNumber] = useState(''); const [chapterTitle, setChapterTitle] = useState(''); const [coverFile, setCoverFile] = useState<File>(); const [pageFiles, setPageFiles] = useState<File[]>([]); const [selected, setSelected] = useState<Chapter | null>(null); const [notice, setNotice] = useState('')
  const title = titleOverride ?? mangaQuery.data?.title ?? ''
  const description = descriptionOverride ?? mangaQuery.data?.description ?? ''
  const genres = genresOverride ?? mangaQuery.data?.genres ?? []
  const status = statusOverride ?? mangaQuery.data?.status ?? 'ongoing'
  const updateManga = useMutation({ mutationFn: () => api.manga.update(mangaId, { title, description, genres, status }), onSuccess: (updated) => { setGenresOverride(updated.genres); setStatusOverride(updated.status); setNotice('Manga details saved.'); void client.invalidateQueries({ queryKey: ['manga', mangaId] }); void client.invalidateQueries({ queryKey: ['admin-manga'] }) } })
  const createChapter = useMutation({ mutationFn: async () => {
    const chapter = await api.chapters.create(mangaId, { chapterNumber: Number(chapterNumber), title: chapterTitle || undefined, pages: [] })
    if (pageFiles.length) {
      const keys: string[] = []
      for (const file of pageFiles) keys.push(await uploadFile(file, 'page', mangaId, chapter._id))
      await api.chapters.update(chapter._id, { pages: keys })
    }
    return chapter
  }, onSuccess: () => { setChapterNumber(''); setChapterTitle(''); setPageFiles([]); setNotice('Chapter created and saved.'); void client.invalidateQueries({ queryKey: ['chapters', mangaId] }) } })
  const uploadCover = useMutation({ mutationFn: async () => { if (!coverFile) throw new Error('Choose a cover image first.'); const key = await uploadFile(coverFile, 'cover', mangaId); return api.manga.update(mangaId, { coverImage: key }) }, onSuccess: () => { setCoverFile(undefined); setNotice('Cover uploaded and saved.'); void client.invalidateQueries({ queryKey: ['manga', mangaId] }) } })
  const deleteChapter = useMutation({ mutationFn: api.chapters.remove, onSuccess: () => { setSelected(null); void client.invalidateQueries({ queryKey: ['chapters', mangaId] }) } })
  if (mangaQuery.isLoading) return <div className="admin-content"><PageState>Loading manga…</PageState></div>
  if (mangaQuery.isError || !mangaQuery.data) return <div className="admin-content"><PageState error={mangaQuery.error}/></div>
  const manga = mangaQuery.data
  function saveManga(event: FormEvent) { event.preventDefault(); updateManga.mutate() }
  function saveChapter(event: FormEvent) { event.preventDefault(); createChapter.mutate() }
  return <div className="admin-content"><div className="admin-back-row"><Link className="back-link" to="/admin/manga">← Manga catalog</Link><h2>{manga.title}</h2></div>
    <div className="admin-editor-grid"><form className="panel form-stack" onSubmit={saveManga}><div><span className="section-kicker">BASIC DETAILS</span><h3>Manga information</h3></div><label>Title<input required maxLength={200} value={title} onChange={(event) => setTitleOverride(event.target.value)}/><FieldError error={updateManga.error} name="title"/></label><label>Description<textarea required value={description} onChange={(event) => setDescriptionOverride(event.target.value)}/><FieldError error={updateManga.error} name="description"/></label><GenrePicker value={genres} onChange={setGenresOverride}/><label>Publication status<select className="manga-status-select" value={status} onChange={(event) => { if (isMangaStatus(event.target.value)) setStatusOverride(event.target.value) }}><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="hiatus">Hiatus</option></select></label><ErrorMessage error={updateManga.error}/>{notice && <p className="success-message">{notice}</p>}<button className="button button-orange" disabled={updateManga.isPending}>Save details</button></form>
      <section className="panel form-stack"><div><span className="section-kicker">COVER ART</span><h3>Upload cover</h3><p>JPEG, PNG, or WebP. Up to 5 MB.</p></div>{manga.coverImage && <img className="admin-cover-preview" src={manga.coverImage} alt={`${manga.title} cover`}/>}<label className="file-picker">Choose cover image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setCoverFile(event.target.files?.[0])}/></label>{coverFile && <small>{coverFile.name} · {(coverFile.size / 1024 / 1024).toFixed(1)} MB</small>}<button className="button button-orange" disabled={!coverFile || uploadCover.isPending} onClick={() => uploadCover.mutate()}>{uploadCover.isPending ? 'Uploading…' : 'Upload cover'}</button><ErrorMessage error={uploadCover.error}/></section></div>
    <form className="panel form-stack chapter-create" onSubmit={saveChapter}><div><span className="section-kicker">CHAPTERS</span><h3>Add a chapter</h3><p>Create the chapter first, then its page files upload under its storage folder.</p></div><div className="chapter-fields"><label>Chapter number<input type="number" step="0.1" min="0" required value={chapterNumber} onChange={(event) => setChapterNumber(event.target.value)}/><FieldError error={createChapter.error} name="chapterNumber"/></label><label>Title <span className="optional-label">(optional)</span><input maxLength={200} value={chapterTitle} onChange={(event) => setChapterTitle(event.target.value)}/></label></div><label className="file-picker">Page images, in reading order<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => setPageFiles(Array.from(event.target.files || []))}/></label>{pageFiles.length > 0 && <small>{pageFiles.length} page files selected · each up to 10 MB</small>}<ErrorMessage error={createChapter.error}/><button className="button button-orange" disabled={createChapter.isPending}>{createChapter.isPending ? 'Creating and uploading…' : 'Create chapter'} <span>→</span></button></form>
    <section className="admin-list"><div className="subsection-heading"><div><span className="section-kicker">PUBLISHED MATERIAL</span><h3>Manage chapters</h3></div><span className="text-muted">{chaptersQuery.data?.length || 0} chapters</span></div>{chaptersQuery.isLoading ? <PageState>Loading chapters…</PageState> : chaptersQuery.isError ? <PageState error={chaptersQuery.error}/> : chaptersQuery.data?.length ? <div className="admin-table">{chaptersQuery.data.map((chapter) => <article className="admin-table-row" key={chapter._id}><span className="chapter-number">CH. {chapter.chapterNumber}</span><div className="admin-table-title"><b>{chapter.title || `Chapter ${chapter.chapterNumber}`}</b><small>{chapter.publishedAt ? new Date(chapter.publishedAt).toLocaleDateString() : 'Unscheduled'} · pages hidden from list API</small></div><button className="button button-outline button-small" onClick={() => setSelected(chapter)}>Edit pages</button><button className="quiet-button danger-text" onClick={() => { if (window.confirm(`Delete chapter ${chapter.chapterNumber}?`)) deleteChapter.mutate(chapter._id) }}>Delete</button></article>)}</div> : <div className="empty-inline">No chapters yet. Create the first chapter above.</div>}</section>
    {selected && <ChapterEditor chapterId={selected._id} mangaId={mangaId} onClose={() => setSelected(null)}/>}
  </div>
}

function ChapterEditor({ chapterId, mangaId, onClose }: { chapterId: string; mangaId: string; onClose: () => void }) {
  const client = useQueryClient(); const detail = useQuery({ queryKey: ['chapter', chapterId], queryFn: () => api.chapters.get(chapterId) }); const [files, setFiles] = useState<File[]>([]); const [error, setError] = useState<unknown>(null); const [numberOverride, setNumberOverride] = useState<string | null>(null); const [titleOverride, setTitleOverride] = useState<string | null>(null)
  const chapterNumber = numberOverride ?? (detail.data ? String(detail.data.chapterNumber) : '')
  const title = titleOverride ?? detail.data?.title ?? ''
  const update = useMutation({ mutationFn: async () => {
    const chapter = detail.data
    if (!chapter) throw new Error('Chapter details are not ready.')
    const keys = files.length ? await Promise.all(files.map((file) => uploadFile(file, 'page', mangaId, chapterId))) : undefined
    return api.chapters.update(chapterId, { chapterNumber: Number(chapterNumber), title: title || undefined, ...(keys ? { pages: keys } : {}) })
  }, onSuccess: () => { void client.invalidateQueries({ queryKey: ['chapter', chapterId] }); void client.invalidateQueries({ queryKey: ['chapters', mangaId] }); onClose() }, onError: setError })
  return <div className="modal-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal-card form-stack" role="dialog" aria-modal="true" aria-labelledby="chapter-edit-title"><button className="modal-close" onClick={onClose} aria-label="Close">×</button><span className="section-kicker">CHAPTER EDITOR</span><h3 id="chapter-edit-title">Chapter {detail.data?.chapterNumber}</h3>{detail.isLoading ? <p>Loading chapter details…</p> : <><label>Chapter number<input type="number" min="0" step="0.1" required value={chapterNumber} onChange={(event) => setNumberOverride(event.target.value)}/></label><label>Title<input value={title} onChange={(event) => setTitleOverride(event.target.value)} placeholder="Optional chapter title"/></label><p>Current chapter has {detail.data?.pages.length || 0} page images. Selecting files replaces the page list in the order chosen.</p><label className="file-picker">Replace page images<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => setFiles(Array.from(event.target.files || []))}/></label>{files.length > 0 && <small>{files.length} files selected · up to 10 MB each</small>}<ErrorMessage error={error}/><button className="button button-orange" disabled={update.isPending} onClick={() => update.mutate()}>{update.isPending ? 'Saving…' : files.length ? 'Save chapter and replace pages' : 'Save chapter'}</button></>}</section></div>
}
