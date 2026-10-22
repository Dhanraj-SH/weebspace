# Weebspace frontend

React, Vite, and TypeScript frontend for the Weebspace API. The app uses React Router for page routes, TanStack Query for server state, and a typed API layer.

## Run locally

1. Start the backend on port `3000`.
2. Copy `.env.example` to `.env.local` and set `VITE_API_URL` if using a different API host. The client adds `/api/v1` when it is omitted.
3. From this directory, run `npm install` and `npm run dev`.

The Vite app runs at `http://localhost:5173`. The backend `FRONTEND_URL` and `CORS_ORIGINS` should include that exact origin. Browser uploads also need the same origin in the Cloudflare R2 bucket CORS policy.

## Architecture

- `src/app`: app-level providers and query configuration.
- `src/components`: shared layout, route guards, feedback, pagination, and manga cards.
- `src/features`: auth, manga, reader, library, profile, and admin screens grouped by domain.
- `src/lib/api.ts`: typed API contracts, response envelopes, refresh-cookie flow, and endpoint methods.
- `src/App.tsx`: route composition.

Access tokens remain in memory. On startup the app calls `/auth/refresh`, then `/auth/me`; API requests include cookies and a bearer token. A failed refresh clears the session and protected routes return to sign-in.

## Routes

`/` browse · `/login` · `/register` · `/auth/callback` · `/manga/:mangaId` · `/read/:chapterId` · `/library` · `/profile` · `/admin/manga` · `/admin/manga/:mangaId/chapters` · `/admin/users`
