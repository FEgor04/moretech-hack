#!/usr/bin/env sh
set -e

# Wait for DB if DATABASE_URL points to Postgres
if echo "$DATABASE_URL" | grep -qE '^postgres'; then
  python - <<'PY'
import os, time
import socket
from urllib.parse import urlparse

url = urlparse(os.environ.get('DATABASE_URL'))
host = url.hostname or 'localhost'
port = url.port or 5432

for _ in range(60):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        try:
            s.connect((host, port))
            break
        except OSError:
            time.sleep(1)
else:
    raise SystemExit('Database is not reachable')
PY
fi

# Run migrations
alembic upgrade head

# Start server
exec uvicorn app.main:app --host 0.0.0.0 --port 8000


