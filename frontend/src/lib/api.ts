const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '')

export type User = { id: string; name: string; username: string; email?: string; avatar?: string; role: 'user' | 'moderator' | 'admin'; createdAt: string }
export type Manga = { _id: string; title: string; alternativeTitles: string[]; description: string; authors: string[]; artists: string[]; coverImage?: string; genres: string[]; status: 'ongoing' | 'completed' | 'hiatus'; ratingAverage: number; ratingCount: number; viewCount: number; createdAt: string }
export type Chapter = { _id: string; mangaId: string; chapterNumber: number; title?: string; pages: string[]; publishedAt?: string; prevChapterId?: string | null; nextChapterId?: string | null }
export type Pagination = { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean }
export type Envelope<T> = { data: T; message?: string; meta?: { pagination?: Pagination } }
export type RatingSummary = { average: number; count: number; distribution: Record<string, number> }
export type Review = { _id: string; userId: string; mangaId: string; content: string; rating: number | null; likesCount: number; createdAt: string; updatedAt: string }
export type Comment = { _id: string; userId: string; mangaId: string; chapterId?: string; parentCommentId?: string; content: string; createdAt: string; replies?: Comment[] }
export type LibraryEntry = { _id: string; mangaId: Manga | string; status: 'reading' | 'completed' | 'planToRead' | 'dropped'; updatedAt: string }
export type ReadingProgress = { _id: string; mangaId: Manga | string; chapterId: (Chapter & { chapterNumber: number }) | string; pageNumber: number; completed: boolean; updatedAt: string }
export type AdminUser = User & { updatedAt: string }

type ApiErrorDetail = { path?: (string | number)[]; message?: string } | string
export class ApiError extends Error {
  status: number
  code: string
  details: ApiErrorDetail[]
  constructor(status: number, code: string, message: string, details: ApiErrorDetail[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
  fieldErrors() {
    return Object.fromEntries(this.details.flatMap((detail) => typeof detail === 'string' || !detail.path?.length ? [] : [[String(detail.path[0]), detail.message || 'Invalid value']]))
  }
}

let accessToken: string | null = null
let refreshRequest: Promise<string | null> | null = null
export const setAccessToken = (token: string | null) => { accessToken = token }
export const getApiUrl = () => API_URL

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshRequest) {
    refreshRequest = fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) return null
        const result = await response.json() as Envelope<{ accessToken: string }>
        accessToken = result.data.accessToken
        return accessToken
      })
      .catch(() => null)
      .finally(() => { refreshRequest = null })
  }
  return refreshRequest
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown; retryAuth?: boolean }
async function request<T>(path: string, options: RequestOptions = {}): Promise<Envelope<T>> {
  const { retryAuth = true, ...init } = options
  const send = () => fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })

  let response = await send()
  if (response.status === 401 && retryAuth && !path.startsWith('/auth/')) {
    if (await refreshAccessToken()) response = await send()
    else {
      accessToken = null
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('weebspace:session-expired'))
    }
  }
  const payload = await response.json().catch(() => null) as Envelope<T> | { error?: { code?: string; message?: string; details?: ApiErrorDetail[] } } | null
  if (!response.ok) {
    const error = payload && 'error' in payload ? payload.error : undefined
    throw new ApiError(response.status, error?.code || 'REQUEST_FAILED', error?.message || 'Something went wrong. Please try again.', error?.details || [])
  }
  return payload as Envelope<T>
}

const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') search.set(key, String(value)) })
  return search.size ? `?${search.toString()}` : ''
}
const json = (method: string, body?: unknown): RequestOptions => ({ method, body })

export const api = {
  auth: {
    refresh: refreshAccessToken,
    me: () => request<User>('/auth/me').then((r) => r.data),
    login: (body: { identifier: string; password: string }) => request<{ accessToken: string; user: User }>('/auth/login', json('POST', body)).then((r) => r.data),
    register: (body: { name: string; username: string; email: string; password: string }) => request<User>('/auth/register', json('POST', body)).then((r) => r.data),
    logout: () => request<null>('/auth/logout', json('POST')).then((r) => r.data),
  },
  manga: {
    list: (params: Record<string, string | number | undefined>) => request<Manga[]>(`/manga${query(params)}`),
    get: (id: string) => request<Manga>(`/manga/${id}`).then((r) => r.data),
    create: (body: Partial<Manga>) => request<Manga>('/manga', json('POST', body)).then((r) => r.data),
    update: (id: string, body: Partial<Manga>) => request<Manga>(`/manga/${id}`, json('PATCH', body)).then((r) => r.data),
    remove: (id: string) => request<Manga>(`/manga/${id}`, json('DELETE')).then((r) => r.data),
    chapters: (id: string) => request<Chapter[]>(`/manga/${id}/chapters`).then((r) => r.data),
  },
  chapters: {
    get: (id: string) => request<Chapter>(`/chapters/${id}`).then((r) => r.data),
    create: (mangaId: string, body: Partial<Chapter>) => request<Chapter>(`/manga/${mangaId}/chapters`, json('POST', body)).then((r) => r.data),
    update: (id: string, body: Partial<Chapter>) => request<Chapter>(`/chapters/${id}`, json('PATCH', body)).then((r) => r.data),
    remove: (id: string) => request<Chapter>(`/chapters/${id}`, json('DELETE')).then((r) => r.data),
  },
  ratings: {
    summary: (mangaId: string) => request<RatingSummary>(`/manga/${mangaId}/ratings`).then((r) => r.data),
    mine: (mangaId: string) => request<{ value: number }>(`/manga/${mangaId}/ratings/me`).then((r) => r.data),
    save: (mangaId: string, value: number) => request<{ value: number }>(`/manga/${mangaId}/ratings/me`, json('PUT', { value })).then((r) => r.data),
    remove: (mangaId: string) => request(`/manga/${mangaId}/ratings/me`, json('DELETE')).then((r) => r.data),
  },
  reviews: {
    list: (mangaId: string, page = 1) => request<Review[]>(`/manga/${mangaId}/reviews${query({ page, limit: 10 })}`),
    create: (mangaId: string, body: { content: string; rating?: number }) => request<Review>(`/manga/${mangaId}/reviews`, json('POST', body)).then((r) => r.data),
    update: (id: string, body: { content?: string; rating?: number }) => request<Review>(`/reviews/${id}`, json('PATCH', body)).then((r) => r.data),
    remove: (id: string) => request(`/reviews/${id}`, json('DELETE')).then((r) => r.data),
    like: (id: string) => request<Review>(`/reviews/${id}/like`, json('POST')).then((r) => r.data),
    unlike: (id: string) => request<Review>(`/reviews/${id}/like`, json('DELETE')).then((r) => r.data),
  },
  comments: {
    manga: (id: string, page = 1) => request<Comment[]>(`/manga/${id}/comments${query({ page, limit: 10 })}`),
    chapter: (id: string, page = 1) => request<Comment[]>(`/chapters/${id}/comments${query({ page, limit: 10 })}`),
    createManga: (id: string, content: string, parentCommentId?: string) => request<Comment>(`/manga/${id}/comments`, json('POST', { content, parentCommentId })).then((r) => r.data),
    createChapter: (id: string, content: string, parentCommentId?: string) => request<Comment>(`/chapters/${id}/comments`, json('POST', { content, parentCommentId })).then((r) => r.data),
    update: (id: string, content: string) => request<Comment>(`/comments/${id}`, json('PATCH', { content })).then((r) => r.data),
    remove: (id: string) => request<Comment>(`/comments/${id}`, json('DELETE')).then((r) => r.data),
  },
  library: {
    list: (status?: string, page = 1) => request<LibraryEntry[]>(`/library${query({ status, page, limit: 24 })}`),
    add: (mangaId: string, status: LibraryEntry['status']) => request<LibraryEntry>('/library', json('POST', { mangaId, status })).then((r) => r.data),
    update: (mangaId: string, status: LibraryEntry['status']) => request<LibraryEntry>(`/library/${mangaId}`, json('PATCH', { status })).then((r) => r.data),
    remove: (mangaId: string) => request<LibraryEntry>(`/library/${mangaId}`, json('DELETE')).then((r) => r.data),
  },
  progress: {
    list: (page = 1) => request<ReadingProgress[]>(`/reading-progress${query({ page, limit: 12 })}`),
    get: (mangaId: string) => request<ReadingProgress | null>(`/reading-progress/${mangaId}`).then((r) => r.data),
    save: (mangaId: string, chapterId: string, pageNumber: number) => request<ReadingProgress>(`/reading-progress/${mangaId}`, json('PUT', { chapterId, pageNumber })).then((r) => r.data),
    remove: (mangaId: string) => request(`/reading-progress/${mangaId}`, json('DELETE')).then((r) => r.data),
  },
  users: {
    updateMe: (body: { name?: string; username?: string; avatar?: string }) => request<User>('/users/me', json('PATCH', body)).then((r) => r.data),
    get: (id: string) => request<User>(`/users/${id}`).then((r) => r.data),
  },
  admin: {
    users: (params: Record<string, string | number | undefined>) => request<AdminUser[]>(`/admin/users${query(params)}`),
    updateRole: (id: string, role: User['role']) => request<AdminUser>(`/admin/users/${id}`, json('PATCH', { role })).then((r) => r.data),
  },
  uploads: {
    presign: (body: { purpose: 'cover'; mangaId: string; contentType: string; size: number } | { purpose: 'page'; mangaId: string; chapterId: string; contentType: string; size: number }) => request<{ uploadUrl: string; key: string; publicUrl: string; requiredHeaders: Record<string, string> }>('/uploads/presign', json('POST', body)).then((r) => r.data),
    put: async (url: string, file: File, headers: Record<string, string>) => {
      const response = await fetch(url, { method: 'PUT', headers, body: file })
      if (!response.ok) throw new Error(`Upload failed (${response.status}). Request a new upload link and try again.`)
    },
  },
}

