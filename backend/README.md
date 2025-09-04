AI HR Backend (FastAPI)

Requirements
- Python 3.11+
- uv (package/deps manager)
- Docker (for integration tests with Testcontainers)

Setup
1. Install dependencies using uv:
   - `uv sync`
2. Run the API locally:
   - `uv run uvicorn app.main:app --reload`

Environment
- `DATABASE_URL` (default: `sqlite+aiosqlite:///./dev.db`)

Migrations
1. Create migration: `uv run alembic revision --autogenerate -m "message"`
2. Apply migrations: `uv run alembic upgrade head`

Testing
- Unit tests: `uv run pytest -q`
- Integration tests (requires Docker): `uv run pytest -q tests/integration`

Endpoints
- Health: `GET /health`
- Users: `CRUD /users`
- Candidates: `CRUD /candidates`
- Vacancies: `CRUD /vacancies`
- Interviews: `CRUD /interviews`


