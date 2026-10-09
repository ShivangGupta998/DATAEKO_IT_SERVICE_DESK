#!/usr/bin/env python3
"""
IT Service Desk - Launch FastAPI Backend and ngrok tunnel concurrently.
"""
import os
import shutil
import signal
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"

def main():
    print("=" * 55)
    print("   🚀 Starting IT Service Desk Backend & Tunnel   ")
    print("=" * 55)

    # 1. Check ngrok
    ngrok_cmd = shutil.which("ngrok")
    if not ngrok_cmd:
        for candidate in [Path("/opt/homebrew/bin/ngrok"), Path("/usr/local/bin/ngrok")]:
            if candidate.exists() and os.access(candidate, os.X_OK):
                ngrok_cmd = str(candidate)
                break

    ngrok_proc = None
    if ngrok_cmd:
        if subprocess.run(["pgrep", "-f", "ngrok http 8000"], stdout=subprocess.DEVNULL).returncode == 0:
            print("ℹ️  ngrok is already running and tunneling port 8000.")
        else:
            print("🌐 Starting ngrok tunnel on port 8000 in background...")
            ngrok_proc = subprocess.Popen(
                [ngrok_cmd, "http", "8000"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            print(f"✅ ngrok started in background (PID: {ngrok_proc.pid})")
            
        import time
        import urllib.request
        import json
        time.sleep(2)
        try:
            with urllib.request.urlopen("http://127.0.0.1:4040/api/tunnels", timeout=3) as resp:
                data = json.loads(resp.read().decode())
                tunnels = data.get("tunnels", [])
                if tunnels:
                    pub_url = tunnels[0].get("public_url")
                    print(f"🔗 Public Tunnel URL : {pub_url}")
                    print(f"📩 Slack Events URL  : {pub_url}/slack/events")
                    print("👉 Update this Request URL in Slack API Dashboard -> Event Subscriptions if needed.")
        except Exception:
            print("   Tunnel web inspector: http://127.0.0.1:4040")
    else:
        print("⚠️  ngrok not found. Proceeding without tunnel.")

    def cleanup(*args):
        if ngrok_proc and ngrok_proc.poll() is None:
            print("\nShutting down ngrok tunnel...")
            ngrok_proc.terminate()
            try:
                ngrok_proc.wait(timeout=2)
            except subprocess.TimeoutExpired:
                ngrok_proc.kill()
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    # 2. Locate uvicorn
    venv_uvicorn = BACKEND_DIR / "venv" / "bin" / "uvicorn"
    uvicorn_cmd = str(venv_uvicorn) if venv_uvicorn.exists() else "uvicorn"

    # 3. Check Port 8000 / Start Backend
    res = subprocess.run(["lsof", "-i", ":8000"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if res.returncode == 0:
        print("ℹ️  FastAPI backend is already running on port 8000.")
        print("   Tunnel is active. Press Ctrl+C to stop.")
        try:
            signal.pause()
        except KeyboardInterrupt:
            pass
        finally:
            cleanup()
        return

    print("⚡ Starting FastAPI backend on http://0.0.0.0:8000...")
    try:
        subprocess.run(
            [uvicorn_cmd, "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
            cwd=str(BACKEND_DIR),
            check=True
        )
    except KeyboardInterrupt:
        pass
    finally:
        cleanup()


if __name__ == "__main__":
    main()
