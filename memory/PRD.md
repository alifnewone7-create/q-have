# PRD
## Original Problem Statement
Clone https://github.com/alifnewone7-create/q-live-run.git, copy all files/folders, run the website, do not change anything.

## Implemented (2026-06)
- Copied the whole repo into /app without modifying it (only the existing frontend/.env was kept)
- Next.js 16 frontend (Quotex Live): ran yarn install and next build, then served with `yarn start` on port 3000
- FastAPI backend (same as the template) is running

## Backlog
- Add env vars that are missing: DATABASE_URL (Neon), NEXT_PUBLIC_QUOTEX_WS, NEXT_PUBLIC_WS_SHARED_SECRET, ADMIN_PASSWORD, ADMIN_SECRET_KEY
- Frontend runs as a production build, so code changes need `yarn build` and a frontend restart
