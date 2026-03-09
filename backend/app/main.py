from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
import app.models  # noqa: F401 — ensures all models are registered with Base.metadata
from app.routes.documents import router as documents_router


app = FastAPI(
    title=settings.APP_NAME,
    description="A system to manage legal document versions with full traceability.",
    version="1.0.0",
)

# CORS — allow the React frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(documents_router)


@app.get("/health", tags=["Health"])
def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy", "app": settings.APP_NAME}
