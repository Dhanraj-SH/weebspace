# Weebspace frontend

React, Vite, and TypeScript frontend for the Weebspace API. The app uses React Router for page routes, TanStack Query for server state, and a typed API layer.

## Run locally

1. Copy `.env.example` to `.env.local`. It points the Vite development proxy at the hosted Render API by default.
2. From this directory, run `npm install` and `npm run dev`.

The Vite app runs at `http://localhost:5173` and proxies `/api/v1` through its dev server to `VITE_API_URL`, avoiding browser CORS errors while keeping API calls on the same origin. Set `VITE_API_URL=http://localhost:3000` only when you intentionally want to use a local backend. Production builds use the Vercel `/api/v1` rewrite to Render. Browser uploads go directly to Cloudflare R2, so its bucket CORS policy must allow the exact frontend origin, `PUT`, and the `Content-Type` request header (including `http://localhost:5173` for local uploads).

## Architecture

- `src/app`: app-level providers and query configuration.
- `src/components`: shared layout, route guards, feedback, pagination, and manga cards.
- `src/features`: auth, manga search and browse, reader, library, profile, and admin screens grouped by domain.
- `src/lib/api.ts`: typed API contracts, response envelopes, refresh-cookie flow, and endpoint methods.
- `src/App.tsx`: route composition.

Access tokens remain in memory. On startup the app calls `/auth/refresh`, then `/auth/me`; API requests include cookies and a bearer token. A failed refresh clears the session and protected routes return to sign-in.

## Routes

`/` browse · `/login` · `/register` · `/auth/callback` · `/manga/:mangaId` · `/read/:chapterId` · `/library` · `/profile` · `/admin/manga` · `/admin/manga/:mangaId/chapters` · `/admin/users`
