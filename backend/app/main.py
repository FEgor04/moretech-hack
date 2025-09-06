import logging
import sys
from fastapi import FastAPI

from app.api.routers.auth import router as auth_router
from app.api.routers.candidates import router as candidates_router
from app.api.routers.interviews import router as interviews_router
from app.api.routers.users import router as users_router
from app.api.routers.vacancies import router as vacancies_router

def _configure_logging() -> None:
    """Ensure application loggers use Uvicorn's handlers and INFO level.

    Without this, our module loggers (e.g. app.services.*) at INFO may not show
    because only Uvicorn's own loggers are configured by default.
    """
    app_logger = logging.getLogger("app")
    uvicorn_error_logger = logging.getLogger("uvicorn.error")

    # Reuse uvicorn handlers when available
    if uvicorn_error_logger.handlers:
        app_logger.handlers = []
        for handler in uvicorn_error_logger.handlers:
            app_logger.addHandler(handler)

    # Also add a direct stdout handler to be robust across environments
    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setLevel(logging.INFO)
    stdout_handler.setFormatter(
        logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
    )
    app_logger.addHandler(stdout_handler)

    app_logger.setLevel(logging.INFO)
    app_logger.propagate = False

    # Ensure child loggers are at INFO and have a handler path
    for name in [
        "app.services",
        "app.services.interviews",
        "app.services.interview_messages",
    ]:
        child = logging.getLogger(name)
        child.setLevel(logging.INFO)
        # Let them propagate to `app` which has handlers
        child.propagate = True


_configure_logging()

app = FastAPI(title="AI HR Backend")

# Emit a startup log to verify logging pipeline
logging.getLogger("app").info("Application logging configured and FastAPI initialized")


@app.get("/health")
async def health() -> dict[str, str]:
    logging.getLogger("app").info("Health check OK")
    return {"status": "ok"}


app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(candidates_router, prefix="/candidates", tags=["candidates"])
app.include_router(vacancies_router, prefix="/vacancies", tags=["vacancies"])
app.include_router(interviews_router, prefix="/interviews", tags=["interviews"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])
