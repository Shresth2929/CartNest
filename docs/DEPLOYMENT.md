# Production deployment integration

## Vercel

Configure the project with:

- **Root Directory:** `frontend`
- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variable:** `VITE_API_URL=https://cartnest-wlg9.onrender.com/api` for Production and Preview deployments.

The frontend includes the supplied Render API as a production fallback, but setting `VITE_API_URL` explicitly in Vercel is recommended so the build target is visible and can be changed without source edits. Vite embeds `VITE_*` values at build time; redeploy after changing them.

`frontend/vercel.json` rewrites client-side routes to `index.html`, so refreshing routes such as `/shop`, `/products/:slug`, and `/admin` returns the SPA entry point.

## Render

Set these backend environment variables in the Render service:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon PostgreSQL connection string, kept only in Render's secret environment settings |
| `JWT_SECRET` | A unique random secret of at least 32 characters, kept only in Render's secret environment settings |
| `JWT_EXPIRES_IN` | Optional; defaults to `7d` |
| `CLIENT_URL` | Exact Vercel origin(s), comma-separated if more than one, e.g. `https://cartnest.vercel.app,https://cartnest-git-main-team.vercel.app` |
| `PORT` | Leave to Render; the backend reads Render's assigned port |

Use the actual Vercel Production domain and any Preview domains that need API access. Origins must be exact `https://` origins with no path or wildcard. The backend does not allow unrestricted CORS. Once `CLIENT_URL` is changed in Render, redeploy/restart the service for the allow list to take effect.

The backend uses JWT bearer headers from the frontend and does not issue authentication cookies. The API client therefore does not need `credentials: 'include'`; the API's CORS credentials option remains enabled but does not permit unlisted origins.

## Live verification and current data state

The supplied Render `/api/health`, `/api/products`, and `/api/categories` endpoints responded successfully during integration work. The health endpoint reported PostgreSQL connected, but the live database currently reports zero users and zero products; the list endpoints consequently returned empty arrays. No production data was created or modified.

The live preflight response currently advertises `http://localhost:5173` rather than the Vercel origin. Set Render's `CLIENT_URL` to the actual Vercel domain before expecting browser API calls from Vercel to pass CORS. The Vercel project domain was not available in the workspace, and dashboard settings cannot be changed from this repository.

## Post-configuration smoke checks

After redeploying both services:

1. Open `https://<your-vercel-domain>/api` only if a Vercel API proxy is configured; otherwise frontend requests should go directly to the Render API host configured by `VITE_API_URL`.
2. Verify `https://cartnest-wlg9.onrender.com/api/health` reports `healthy`.
3. In browser DevTools, verify `GET /api/products` and `GET /api/categories` are sent to the Render origin and the response's `Access-Control-Allow-Origin` exactly matches the Vercel origin.
4. Verify direct refresh of `/shop` and `/admin` returns the Vite SPA, then test customer/admin flows using controlled accounts and populated data.
