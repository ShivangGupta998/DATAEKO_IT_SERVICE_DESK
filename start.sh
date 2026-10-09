#!/usr/bin/env bash

# IT Service Desk - Unified Development Startup Script
# Starts FastAPI backend (port 8000) and ngrok tunnel concurrently.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
BACKEND_DIR="$ROOT_DIR/backend"

echo "================================================="
echo "   🚀 Starting IT Service Desk Backend & Tunnel  "
echo "================================================="

# Trap to kill background processes on exit
NGROK_PID=""
cleanup() {
    echo ""
    echo "Shutting down services..."
    if [ -n "$NGROK_PID" ] && kill -0 "$NGROK_PID" 2>/dev/null; then
        echo "Stopping ngrok (PID: $NGROK_PID)..."
        kill "$NGROK_PID" 2>/dev/null || true
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Check and Start ngrok
if command -v ngrok >/dev/null 2>&1; then
    NGROK_BIN="ngrok"
elif [ -x "/opt/homebrew/bin/ngrok" ]; then
    NGROK_BIN="/opt/homebrew/bin/ngrok"
elif [ -x "/usr/local/bin/ngrok" ]; then
    NGROK_BIN="/usr/local/bin/ngrok"
else
    NGROK_BIN=""
fi

if [ -n "$NGROK_BIN" ]; then
    if pgrep -f "ngrok http 8000" >/dev/null 2>&1; then
        echo "ℹ️  ngrok is already running and tunneling port 8000."
    else
        echo "🌐 Starting ngrok tunnel on port 8000..."
        "$NGROK_BIN" http 8000 > /dev/null 2>&1 &
        NGROK_PID=$!
        echo "✅ ngrok started in background (PID: $NGROK_PID)"
    fi

    # Wait briefly and retrieve public URL
    sleep 2
    PUBLIC_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*ngrok[^"]*' | head -n 1 || true)
    if [ -n "$PUBLIC_URL" ]; then
        echo "🔗 Public Tunnel URL : $PUBLIC_URL"
        echo "📩 Slack Events URL  : $PUBLIC_URL/slack/events"
        echo "👉 If this URL changed, update it in Slack App -> Event Subscriptions -> Request URL"
    fi
else
    echo "⚠️  ngrok is not found in PATH or standard locations."
    echo "   Continuing backend startup without tunnel."
    echo "   Install ngrok via: brew install ngrok"
fi

# 2. Select Uvicorn executable
if [ -x "$BACKEND_DIR/venv/bin/uvicorn" ]; then
    UVICORN_CMD="$BACKEND_DIR/venv/bin/uvicorn"
elif command -v uvicorn >/dev/null 2>&1; then
    UVICORN_CMD="uvicorn"
else
    echo "❌ uvicorn not found! Please activate your virtual environment or run:"
    echo "   cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# 3. Check Port 8000
if lsof -i :8000 >/dev/null 2>&1; then
    echo "ℹ️  FastAPI backend is already running on port 8000."
    echo "   ngrok tunnel is actively forwarding to it."
    echo "   Press Ctrl+C to stop the tunnel."
    while true; do sleep 2; done
else
    echo "⚡ Starting FastAPI backend on http://0.0.0.0:8000..."
    cd "$BACKEND_DIR"
    "$UVICORN_CMD" app.main:app --reload --host 0.0.0.0 --port 8000
fi

