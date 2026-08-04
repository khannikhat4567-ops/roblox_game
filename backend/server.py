"""
Python backend for Emberfall.

This server serves the frontend static files and implements the same
REST API endpoints used by the JavaScript frontend.

Run:
  cd backend
  python server.py
  -> open http://localhost:3000
"""

from __future__ import annotations

import datetime
import json
import os
import pathlib
import socketserver
import sys
import urllib.parse
from http.server import SimpleHTTPRequestHandler

BASE_DIR = pathlib.Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"
DATA_DIR = BASE_DIR / "data"
SCORES_FILE = DATA_DIR / "scores.json"
PORT = int(os.environ.get("PORT", "3000"))


def ensure_data_file() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not SCORES_FILE.exists():
        SCORES_FILE.write_text("[]", encoding="utf8")


def read_scores() -> list[dict]:
    ensure_data_file()
    try:
        return json.loads(SCORES_FILE.read_text(encoding="utf8"))
    except Exception:
        print("Warning: failed to read scores.json, resetting.", file=sys.stderr)
        return []


def write_scores(scores: list[dict]) -> None:
    ensure_data_file()
    SCORES_FILE.write_text(json.dumps(scores, indent=2), encoding="utf8")


class EmberfallRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND_DIR), **kwargs)

    def log_message(self, format: str, *args) -> None:
        sys.stdout.write("%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), format % args))

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/save":
            self.handle_save()
            return
        self.send_error(404, "Not Found")

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith("/api/"):
            if parsed.path == "/api/leaderboard":
                self.handle_leaderboard(parsed.query)
                return
            if parsed.path.startswith("/api/load/"):
                self.handle_load(parsed.path)
                return
            if parsed.path == "/api/health":
                self.send_json({"ok": True})
                return
            self.send_error(404, "Not Found")
            return

        target = self.translate_path(parsed.path)
        if not pathlib.Path(target).exists():
            self.path = "/index.html"
        super().do_GET()

    def handle_save(self) -> None:
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length).decode("utf-8") if length else ""
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            self.send_json({"error": "Invalid JSON."}, status=400)
            return

        name = data.get("name")
        level = data.get("level")
        kills = data.get("kills")
        xp = data.get("xp")

        if not name or not isinstance(name, str) or not name.strip():
            self.send_json({"error": "A non-empty \"name\" is required."}, status=400)
            return
        if not isinstance(level, (int, float)) or not isinstance(kills, (int, float)):
            self.send_json({"error": "\"level\" and \"kills\" must be numbers."}, status=400)
            return

        entry = {
            "name": name.strip()[:24],
            "level": max(1, int(level)),
            "kills": max(0, int(kills)),
            "xp": int(xp) if isinstance(xp, (int, float)) else 0,
            "savedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
        scores = read_scores()
        scores.append(entry)
        write_scores(scores)
        self.send_json({"ok": True, "entry": entry}, status=201)

    def handle_leaderboard(self, query: str) -> None:
        params = urllib.parse.parse_qs(query)
        limit = 10
        if "limit" in params:
            try:
                limit = min(50, max(1, int(params["limit"][0])))
            except (ValueError, TypeError):
                limit = 10

        scores = sorted(
            read_scores(),
            key=lambda s: (-int(s.get("level", 0)), -int(s.get("kills", 0)))
        )[:limit]
        self.send_json({"scores": scores})

    def handle_load(self, path: str) -> None:
        name = urllib.parse.unquote(path[len("/api/load/"):])
        if not name:
            self.send_json({"error": "No name provided."}, status=400)
            return

        scores = [
            s for s in read_scores()
            if str(s.get("name", "")).lower() == name.lower()
        ]
        if not scores:
            self.send_json({"error": "No save found for that name."}, status=404)
            return

        latest = max(scores, key=lambda s: s.get("savedAt", ""))
        self.send_json({"entry": latest})

    def send_json(self, obj: dict, status: int = 200) -> None:
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class ThreadingTCPServer(socketserver.ThreadingTCPServer):
    def handle_error(self, request, client_address):
        # Suppress ConnectionResetError/BrokenPipeError traceback dumps
        exc_type, _, _ = sys.exc_info()
        if exc_type is not None and issubclass(exc_type, (ConnectionResetError, ConnectionAbortedError, BrokenPipeError)):
            return
        super().handle_error(request, client_address)


def run(port: int = PORT) -> None:
    ensure_data_file()
    with ThreadingTCPServer(("0.0.0.0", port), EmberfallRequestHandler) as httpd:
        print(f"Emberfall Python server running at http://localhost:{port}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopping Emberfall server.")


if __name__ == "__main__":
    run()
