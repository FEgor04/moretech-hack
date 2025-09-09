# MoreTech Hack Project

This project consists of a FastAPI backend and React frontend for an AI-powered interview and candidate management system.

## Architecture

- **Backend**: FastAPI with PostgreSQL database
- **Frontend**: React with Vite and TypeScript
- **AI Integration**: GigaChat for PDF parsing and interview assistance
- **Storage**: S3-compatible storage for documents
- **Speech**: Yandex Speech API for voice processing

## Development Setup

### Prerequisites

- Docker and Docker Compose
- Git

### Quick Start (Development)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd moretech-hack
   ```

2. **Set up environment variables**
   ```bash
   cp docker.env.example docker.env
   # Edit docker.env with your actual credentials
   ```

3. **Start development environment**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Backend API Docs: http://localhost:8000/docs
   - PostgreSQL: localhost:5432

### Development Features

The development setup includes:
- **Hot reload** for both frontend and backend
- **Exposed ports** for direct access to services
- **Volume mounts** for live code changes
- **Database persistence** with separate dev volume
- **Health checks** for reliable startup

### Available Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React development server |
| Backend | 8000 | FastAPI server with auto-reload |
| PostgreSQL | 5432 | Database server |

### Development Commands

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# Rebuild and start
docker-compose -f docker-compose.dev.yml up --build

# Stop services
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Access backend container
docker-compose -f docker-compose.dev.yml exec backend bash

# Access database
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d postgres
```

## Production Deployment

For production deployment, use the production docker-compose configuration:

```bash
docker-compose -f docker-compose.prod.yaml up -d
```

The production setup includes:
- Traefik reverse proxy with SSL
- No exposed ports (except 80/443)
- Optimized builds without development tools
- Let's Encrypt SSL certificates

## Environment Variables

Required environment variables in `docker.env`:

```env
GIGACHAT_CREDENTIALS=your_gigachat_credentials
YANDEX_SPEECH_KEY=your_yandex_speech_key
S3_ACCESS_KEY_ID=your_s3_access_key
S3_SECRET_ACCESS_KEY=your_s3_secret_key
S3_TENANT_ID=your_s3_tenant_id
HOST=your_domain.com  # For production
ACME_EMAIL=your_email@domain.com  # For SSL certificates
```

## Project Structure

```
├── backend/                 # FastAPI backend
│   ├── app/                # Application code
│   ├── alembic/            # Database migrations
│   ├── tests/              # Backend tests
│   └── Dockerfile          # Backend container
├── frontend/               # React frontend
│   ├── src/                # Source code
│   ├── public/             # Static assets
│   └── Dockerfile          # Frontend container
├── docker-compose.yml      # Base configuration
├── docker-compose.dev.yml  # Development setup
├── docker-compose.prod.yaml # Production setup
└── docker.env              # Environment variables
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database Migrations

Migrations are automatically run during container startup. To run manually:

```bash
docker-compose -f docker-compose.dev.yml exec backend alembic upgrade head
```

## Testing

Run backend tests:
```bash
docker-compose -f docker-compose.dev.yml exec backend uv run pytest
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3000, 8000, and 5432 are not in use
2. **Database connection**: Wait for the database health check to pass
3. **Environment variables**: Ensure all required variables are set in `docker.env`

### Logs

Check service logs:
```bash
docker-compose -f docker-compose.dev.yml logs backend
docker-compose -f docker-compose.dev.yml logs frontend
docker-compose -f docker-compose.dev.yml logs postgres
```

### Reset Development Environment

```bash
# Stop and remove containers, networks, and volumes
docker-compose -f docker-compose.dev.yml down -v

# Remove development database volume
docker volume rm moretech-hack_db-data-dev

# Start fresh
docker-compose -f docker-compose.dev.yml up --build
```
