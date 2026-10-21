import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../auth/useAuth'
import { api } from '../../lib/api'
import { ErrorMessage, FieldError } from '../../components/Feedback'

export function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [username, setUsername] = useState(user?.username || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const update = useMutation({ mutationFn: () => api.users.updateMe({ name, username, ...(avatar ? { avatar } : {}) }), onSuccess: () => void refreshUser() })
  function submit(event: FormEvent) { event.preventDefault(); update.mutate() }
  return <main className="content-page"><div className="page-title-row"><div><span className="section-kicker">YOUR ACCOUNT</span><h1>Profile settings</h1><p>Keep your reader profile up to date.</p></div></div><div className="profile-layout"><aside className="profile-summary"><div className="profile-avatar-large">{user?.avatar ? <img src={user.avatar} alt=""/> : user?.name.slice(0, 1).toUpperCase()}</div><h2>{user?.name}</h2><span>@{user?.username}</span><p>Reader since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'today'}</p></aside><form className="panel profile-form form-stack" onSubmit={submit}><div><span className="section-kicker">PUBLIC DETAILS</span><h3>Edit your profile</h3></div><label>Display name<input required minLength={2} maxLength={50} value={name} onChange={(event) => setName(event.target.value)}/><FieldError error={update.error} name="name"/></label><label>Username<input required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]{3,20}" value={username} onChange={(event) => setUsername(event.target.value)}/><FieldError error={update.error} name="username"/></label><label>Avatar image URL<input type="url" value={avatar} onChange={(event) => setAvatar(event.target.value)} placeholder="https://…"/><FieldError error={update.error} name="avatar"/></label><label>Email address<input value={user?.email || ''} disabled/><small>Email changes are not available yet.</small></label><ErrorMessage error={update.error}/>{update.isSuccess && <p className="success-message">Profile saved.</p>}<button className="button button-orange" disabled={update.isPending}>{update.isPending ? 'Saving…' : 'Save changes'} <span>→</span></button></form></div></main>
}
