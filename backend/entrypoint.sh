#!/usr/bin/env sh
set -e

# Run migrations
if [ -x "/opt/venv/bin/alembic" ]; then
  /opt/venv/bin/alembic upgrade head
else
  alembic upgrade head
fi

# Start server
if [ -x "/opt/venv/bin/uvicorn" ]; then
  exec /opt/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
else
  exec uvicorn app.main:app --host 0.0.0.0 --port 8000
fi


