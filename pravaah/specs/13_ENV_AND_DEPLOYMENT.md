# PRAVAAH — ENVIRONMENT + DEPLOYMENT

## Local development

### Dashboard

```bash
cd dashboard
npm install
npm run dev
```

### Engine/API

```bash
cd engine
python -m venv .venv
# activate venv
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Exact commands may be adjusted to the generated repo.

## Environment variables

Never commit secrets.

Use `.env.example` for placeholders.

Example:

```text
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/live
```

## Free prototype deployment

Recommended split:

- dashboard -> Vercel
- FastAPI demo API -> Render or equivalent free/low-cost host

For a public demo, prefer simulator/mock events rather than uploading real venue CCTV.

## Real deployment

- edge compute node on-site
- local network
- cameras feed local analyzer
- local FastAPI/WebSocket
- optional remote telemetry only outside critical path

## Production security baseline

- HTTPS/WSS when remote
- network segmentation
- API authentication before external exposure
- rate limiting
- structured audit logs
- least privilege
- secure secret management
- no public exposure of raw CCTV endpoints
