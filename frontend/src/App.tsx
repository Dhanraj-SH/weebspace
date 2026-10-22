import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { RequireAdmin, RequireAuth } from './components/RouteGuards'
import { AdminChaptersPage } from './features/admin/AdminChaptersPage'
import { AdminLayout } from './features/admin/AdminLayout'
import { AdminMangaPage } from './features/admin/AdminMangaPage'
import { AdminUsersPage } from './features/admin/AdminUsersPage'
import { AuthCallbackPage, AuthPage } from './features/auth/AuthPage'
import { BrowsePage } from './features/manga/BrowsePage'
import { MangaDetailPage } from './features/manga/MangaDetailPage'
import { SearchPage } from './features/manga/SearchPage'
import { LibraryPage } from './features/library/LibraryPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { ReaderPage } from './features/reader/ReaderPage'

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
