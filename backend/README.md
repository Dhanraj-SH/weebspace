# Weebspace API

## Deploy to Render

The repository includes a Render Blueprint at its root. Create a Blueprint from the GitHub repository and Render will configure the API service to use `backend/`, run `npm ci && npm run build`, start with `npm start`, and check `/health`.

Before the first deploy, add these required values in the Render service's Environment settings:

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Render provides `PORT`; the server binds to `0.0.0.0`. The Blueprint sets production mode, cross-site secure refresh cookies, and the current Vercel frontend URL. Update `FRONTEND_URL` and `CORS_ORIGINS` if the frontend domain changes. `CORS_ORIGINS` can contain comma-separated exact origins.

For Google sign-in, also set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL`. Set the callback to `https://<your-render-service>.onrender.com/api/v1/auth/google/callback` and register that exact URL in Google Cloud OAuth settings.

For uploads, set all of `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT`, and `R2_PUBLIC_URL`. Configure the bucket's CORS policy to allow the frontend origin and `PUT` requests.

Never commit `.env`; use Render's Environment settings for production credentials. `backend/.env.example` lists the supported settings for local setup.
