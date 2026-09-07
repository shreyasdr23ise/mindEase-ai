# MindEase Admin Dashboard

A dedicated, separately deployable admin frontend for the MindEase AI platform.

- **Folder (this project):** `backend/admin/` (open this folder to run the Admin Dashboard)
- **Login:** own protected sign-in page (email + password entered at the page; the password is never stored or hardcoded here). Admin email: `shreyasde157@gmail.com`
- **Pages:** Dashboard (Overview) → Users → Activity Logs (centralized searchable table) → Analytics → User Details → Settings
- **Backend connection:** public HTTPS backend only — no LAN addresses, no database credentials, no secrets anywhere in this folder.

## Backend API URL

`https://mindease-backend-r87i.onrender.com`

Admin authorization (401/403) is enforced server-side by the backend on every
`/api/admin/*` endpoint — the frontend merely hides controls; it cannot grant access.

## Run locally

```bash
cd backend/admin
npm install
npm run dev        # http://localhost:8081
```

## Build (production)

```bash
cd backend/admin
npm run build      # outputs to backend/admin/dist
```

Set `VITE_API_URL` to override the backend base URL (defaults to the production backend):

```bash
# PowerShell
$env:VITE_API_URL="https://mindease-backend-r87i.onrender.com"
npm run build
```

## Deploy (Render static site)

1. Push the repo to GitHub (branch `master`).
2. On Render: **New → Static Site**, connect the repo.
3. Build command: `npm install && npm run build` (root dir set to `backend/admin`)
4. Publish directory: `backend/admin/dist`
5. Set env var `VITE_API_URL=https://mindease-backend-r87i.onrender.com` before build.
6. After the first deploy, on the Render **Dashboard → your static site**, open **Events → Trigger manual** deploy, or use the API:
   `POST https://api.render.com/v1/services/{SERVICE_ID}/deploys` with body `{}` and header `Authorization: Bearer {RENDER_API_KEY}`.

## Confirmations

1. **Admin folder location:** `C:\Users\SHREYAS D R\Desktop\mindEase-ai\backend\admin` (repo-relative `backend/admin/`)
2. **Admin Dashboard URL:** served by the Render static site (e.g. `https://<your-site>.onrender.com`) — the login page loads first
3. **Backend API URL:** `https://mindease-backend-r87i.onrender.com`
4. **Admin login:** open the dashboard URL → enter `shreyasde157@gmail.com` and the admin password you configured on the backend (in `backend/.env` → `ADMIN_PASSWORD`, set at setup time; never committed)
5. **Build/deploy:** see above
6. **Normal users cannot access:** every `/api/admin/*` call the dashboard makes returns `403 Forbidden` for non-admin roles, and `401` when signed out (verified live; enforced server-side)
7. **Talks to production backend:** the dashboard uses `VITE_API_URL` (default) = the production Render backend over HTTPS

## No secrets in this folder

`.gitignore` excludes `node_modules/`, `dist/`, and any `.env*`. The admin
password, database credentials, and JWT secret live only in `backend/.env`
(git-ignored) and the production database.