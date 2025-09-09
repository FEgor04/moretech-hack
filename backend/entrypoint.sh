#!/usr/bin/env sh
set -e

echo "Starting backend service..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
until nc -z postgres 5432; do
  echo "Database is unavailable - sleeping"
  sleep 1
done
echo "Database is ready!"

# Run migrations
echo "Running database migrations..."
cd /app
if [ -x "/opt/venv/bin/alembic" ]; then
  /opt/venv/bin/alembic upgrade head
else
  alembic upgrade head
fi
echo "Migrations completed successfully!"

# Verify parsing schemas are working
echo "Verifying parsing schemas..."
if [ -x "/opt/venv/bin/python" ]; then
  /opt/venv/bin/python -c "from app.schemas.parsing import CVParsingSchema, VacancyParsingSchema; from app.services.pdf_parser import PDFParserService; service = PDFParserService(); cv_schema = service._get_cv_json_schema(); vacancy_schema = service._get_vacancy_json_schema(); print('✅ Parsing schemas verified successfully')"
else
  python -c "from app.schemas.parsing import CVParsingSchema, VacancyParsingSchema; from app.services.pdf_parser import PDFParserService; service = PDFParserService(); cv_schema = service._get_cv_json_schema(); vacancy_schema = service._get_vacancy_json_schema(); print('✅ Parsing schemas verified successfully')"
fi
echo "Schema verification completed!"

# Start server
echo "Starting FastAPI server..."
if [ -x "/opt/venv/bin/uvicorn" ]; then
  exec /opt/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
else
  exec uvicorn app.main:app --host 0.0.0.0 --port 8000
fi


