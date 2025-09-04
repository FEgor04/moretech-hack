from fastapi import FastAPI

from app.api.routers.auth import router as auth_router
from app.api.routers.candidates import router as candidates_router
from app.api.routers.interviews import router as interviews_router
from app.api.routers.users import router as users_router
from app.api.routers.vacancies import router as vacancies_router

app = FastAPI(title="AI HR Backend")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(candidates_router, prefix="/candidates", tags=["candidates"])
app.include_router(vacancies_router, prefix="/vacancies", tags=["vacancies"])
app.include_router(interviews_router, prefix="/interviews", tags=["interviews"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])
