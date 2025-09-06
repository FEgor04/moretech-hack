import logging
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

    # Attach Uvicorn error logger handlers to our app logger to reuse formatting
    if uvicorn_error_logger.handlers:
        app_logger.handlers = []
        for handler in uvicorn_error_logger.handlers:
            app_logger.addHandler(handler)

    app_logger.setLevel(logging.INFO)
    app_logger.propagate = False

    # Make sure child loggers under app.* inherit
    logging.getLogger("app.services").setLevel(logging.INFO)


_configure_logging()

app = FastAPI(title="AI HR Backend")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(candidates_router, prefix="/candidates", tags=["candidates"])
app.include_router(vacancies_router, prefix="/vacancies", tags=["vacancies"])
app.include_router(interviews_router, prefix="/interviews", tags=["interviews"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])
