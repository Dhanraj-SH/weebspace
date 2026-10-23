import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ErrorMessage, FieldError } from '../../components/Feedback'
import { getApiUrl } from '../../lib/api'
import { useAuth } from './useAuth'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth()
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [values, setValues] = useState({ name: '', username: '', email: '', identifier: '', password: '' })
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const isRegister = mode === 'register'
  const googleError = params.get('error')
  const destination = (location.state as { from?: string } | null)?.from || '/'
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(null); setBusy(true)
    try {
      if (isRegister) await register({ name: values.name, username: values.username, email: values.email, password: values.password })
      else await login(values.identifier, values.password)
      navigate(destination, { replace: true })
    } catch (reason) { setError(reason) } finally { setBusy(false) }
  }

  return <main className="auth-page"><div className="auth-art"><Link className="brand" to="/" aria-label="Weebspace home"><span className="brand-mark"><img src="/weebspace-logo.png" alt="Weebspace"/></span></Link><div className="auth-art-copy"><span className="section-kicker">A WHOLE WORLD BETWEEN THE COVERS</span><h1>Find your<br/>next <em>favorite.</em></h1><p>Great stories are better when you make them your own.</p><div className="auth-art-books"><span>✦</span><b>READ<br/>YOUR<br/>WAY</b></div></div></div><section className="auth-card"><span className="section-kicker">{isRegister ? 'START YOUR STORY' : 'WELCOME BACK'}</span><h2>{isRegister ? 'Create an account' : 'Good to see you again'}</h2><p className="auth-subtitle">{isRegister ? 'Save your progress and build your personal shelf.' : 'Pick up right where your last story left off.'}</p>{googleError && <p className="form-error">{googleError}</p>}
    <a className="google-button" href={`${getApiUrl()}/auth/google`}><strong>G</strong> Continue with Google</a><div className="or-divider"><span>or continue with email</span></div>
    <form className="form-stack" onSubmit={(event) => void submit(event)}>{isRegister && <><label>Display name<input autoComplete="name" required minLength={2} maxLength={50} value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })}/><FieldError error={error} name="name"/></label><label>Username<input autoComplete="username" required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]{3,20}" value={values.username} onChange={(e) => setValues({ ...values, username: e.target.value })}/><FieldError error={error} name="username"/></label></>}
      {isRegister ? <label>Email<input type="email" autoComplete="email" required value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })}/><FieldError error={error} name="email"/></label> : <label>Email or username<input autoComplete="username" required value={values.identifier} onChange={(e) => setValues({ ...values, identifier: e.target.value })}/><FieldError error={error} name="identifier"/></label>}
      <label>Password<input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 8 : 1} maxLength={50} value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })}/><FieldError error={error} name="password"/></label>
      <ErrorMessage error={error}/><button className="button button-orange full-button" disabled={busy}>{busy ? 'One moment…' : isRegister ? 'Create account' : 'Log in'} <span>→</span></button></form>
    <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to Weebspace?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link></p></section></main>
}

export function AuthCallbackPage() {
  const { refreshUser } = useAuth(); const navigate = useNavigate(); const [error, setError] = useState('')
  useEffect(() => { void refreshUser().then((restored) => restored ? navigate('/', { replace: true }) : navigate('/login?error=Could%20not%20restore%20your%20session', { replace: true })).catch(() => setError('Could not restore your session. Please sign in again.')) }, [refreshUser, navigate])
  return <div className="page-state"><span className="loader"/>{error || 'Finishing sign in…'}</div>
}
