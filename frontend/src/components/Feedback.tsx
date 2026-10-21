import type { ReactNode } from 'react'
import { ApiError } from '../lib/api'

export function PageState({ children, error, action }: { children?: ReactNode; error?: unknown; action?: ReactNode }) {
  if (error) return <div className="state-panel error-panel"><b>We couldn’t load this page.</b><span>{error instanceof Error ? error.message : 'Please try again.'}</span>{action}</div>
  return <div className="state-panel">{children || 'Nothing here yet.'}</div>
}

export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null
  return <p className="form-error" role="alert">{error instanceof Error ? error.message : 'Something went wrong.'}{error instanceof ApiError && error.status === 429 ? ' Try again in a little while.' : ''}</p>
}

export function FieldError({ error, name }: { error: unknown; name: string }) {
  if (!(error instanceof ApiError)) return null
  const message = error.fieldErrors()[name]
  return message ? <span className="field-error">{message}</span> : null
}
