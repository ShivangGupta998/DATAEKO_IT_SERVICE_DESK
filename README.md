# IT Service Desk

A modern full-stack IT Service Desk solution with FastAPI backend and React frontend.

---

## 🚀 Quick Start (Backend + Ngrok Tunnel)

You can launch the FastAPI backend server and ngrok tunnel simultaneously on port 8000 with a single command using any of the following options:

### Option 1: Using `npm` (with `concurrently`)

```bash
# 1. Install root dependencies (first time only)
npm install

# 2. Start FastAPI and ngrok concurrently
npm run dev
```

> **Full-Stack Mode**: To start the backend, ngrok tunnel, and React frontend all at once, run:
> ```bash
> npm run dev:all
> ```

---

### Option 2: Using Shell Script (`start.sh` / `run.sh`)

No npm installation required at the root level:

```bash
./start.sh
# or
./run.sh
```

**Features:**
- Verifies if `ngrok` is installed (or located at `/opt/homebrew/bin/ngrok` / `/usr/local/bin/ngrok`).
- Automatically starts `ngrok http 8000` in the background if not already running.
- Uses `backend/venv/bin/uvicorn` automatically (or system uvicorn).
- Traps signals (`SIGINT` / `SIGTERM` / `EXIT`) to cleanly stop ngrok when you exit with `Ctrl+C`.

---

### Option 3: Using Python Script (`start.py`)

Cross-platform startup script:

```bash
python3 start.py
```

---

## 🔍 Service Ports & URLs

| Service | Address / URL | Description |
| :--- | :--- | :--- |
| **FastAPI Backend** | `http://localhost:8000` | Core API server |
| **API Documentation** | `http://localhost:8000/docs` | Interactive Swagger UI |
| **Ngrok Tunnel Inspector** | `http://127.0.0.1:4040` | View public tunnel URL & HTTP requests |
| **React Frontend** | `http://localhost:3000` | Web UI |

---

## 🛠️ Individual Service Commands

If you ever need to run services independently in separate terminals:

### Backend Only
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Or from root:
```bash
npm run dev:backend
```

### Tunnel Only
```bash
ngrok http 8000
```
Or from root:
```bash
npm run dev:tunnel
```

### Frontend Only
```bash
cd frontend
npm run dev
```
### Push Details
```bash
New Push
```

