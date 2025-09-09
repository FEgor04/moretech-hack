# Use a Python image with uv pre-installed
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

# Install system dependencies for psycopg2 and Python
# TODO: we dont need this shit, can just use psycopg2-binary
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libpq-dev \
    netcat-openbsd \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install the project into `/app`
WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy from the cache instead of linking since it's a mounted volume
ENV UV_LINK_MODE=copy

# Place project environment outside /app to avoid bind-mount clobbering
ENV UV_PROJECT_ENVIRONMENT=/opt/venv
ENV VIRTUAL_ENV=/opt/venv
ENV PYTHONPATH=/app

# Install the project's dependencies using the lockfile and settings
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    sh -c 'uv venv "$VIRTUAL_ENV" && uv sync --frozen --no-install-project --no-dev --trusted-host pypi.org --trusted-host files.pythonhosted.org '

# Then, add the rest of the project source code and install it
# Installing separately from its dependencies allows optimal layer caching
ADD . /app
RUN --mount=type=cache,target=/root/.cache/uv \
    sh -c 'uv venv "$VIRTUAL_ENV" && uv sync --frozen --no-dev'

# Place executables in the environment at the front of the path
ENV PATH="/opt/venv/bin:/app/.venv/bin:$PATH"

# service startup script
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 CMD curl -f http://localhost:8000/health || exit 1