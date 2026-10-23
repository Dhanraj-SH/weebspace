import { lazy } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { RequireAdmin, RequireAuth } from './components/RouteGuards'

const AdminChaptersPage = lazy(() => import('./features/admin/AdminChaptersPage').then((module) => ({ default: module.AdminChaptersPage })))
const AdminLayout = lazy(() => import('./features/admin/AdminLayout').then((module) => ({ default: module.AdminLayout })))
const AdminMangaPage = lazy(() => import('./features/admin/AdminMangaPage').then((module) => ({ default: module.AdminMangaPage })))
const AdminUsersPage = lazy(() => import('./features/admin/AdminUsersPage').then((module) => ({ default: module.AdminUsersPage })))
const AuthPage = lazy(() => import('./features/auth/AuthPage').then((module) => ({ default: module.AuthPage })))
const AuthCallbackPage = lazy(() => import('./features/auth/AuthPage').then((module) => ({ default: module.AuthCallbackPage })))
const BrowsePage = lazy(() => import('./features/manga/BrowsePage').then((module) => ({ default: module.BrowsePage })))
const MangaDetailPage = lazy(() => import('./features/manga/MangaDetailPage').then((module) => ({ default: module.MangaDetailPage })))
const SearchPage = lazy(() => import('./features/manga/SearchPage').then((module) => ({ default: module.SearchPage })))
const LibraryPage = lazy(() => import('./features/library/LibraryPage').then((module) => ({ default: module.LibraryPage })))
const ProfilePage = lazy(() => import('./features/profile/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const ReaderPage = lazy(() => import('./features/reader/ReaderPage').then((module) => ({ default: module.ReaderPage })))

function ReaderRoute() { const { chapterId = '' } = useParams(); return <ReaderPage key={chapterId} chapterId={chapterId}/> }
function NotFound() { return <main className="content-page not-found"><span className="section-kicker">404 · LOST BETWEEN THE PAGES</span><h1>We couldn’t find that story.</h1><p>The link may be old, or the chapter has moved.</p><a className="button button-orange" href="/">Back to discovery</a></main> }

export default function App() {
  return <Routes><Route element={<AppLayout/>}>
    <Route index element={<BrowsePage/>}/>
    <Route path="login" element={<AuthPage mode="login"/>}/>
    <Route path="register" element={<AuthPage mode="register"/>}/>
    <Route path="auth/callback" element={<AuthCallbackPage/>}/>
    <Route path="manga/:mangaId" element={<MangaDetailPage/>}/>
    <Route path="search" element={<SearchPage/>}/>
    <Route path="read/:chapterId" element={<ReaderRoute/>}/>
    <Route element={<RequireAuth/>}>
      <Route path="library" element={<LibraryPage/>}/>
      <Route path="profile" element={<ProfilePage/>}/>
      <Route element={<RequireAdmin/>}>
        <Route path="admin" element={<AdminLayout/>}>
          <Route index element={<Navigate to="manga" replace/>}/>
          <Route path="manga" element={<AdminMangaPage/>}/>
          <Route path="manga/:mangaId/chapters" element={<AdminChaptersPage/>}/>
          <Route path="users" element={<AdminUsersPage/>}/>
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<NotFound/>}/>
  </Route></Routes>
}
