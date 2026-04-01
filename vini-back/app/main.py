from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.seed.seed_vehicles import seed


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    init_db()
    seed()
    yield


app = FastAPI(title="Vini Auto Parts", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

from app.routers import vehicles, parts, sellers  # noqa: E402

app.include_router(vehicles.router, prefix="/api/vehicles", tags=["vehicles"])
app.include_router(parts.router, prefix="/api/parts", tags=["parts"])
app.include_router(sellers.router, prefix="/api/sellers", tags=["sellers"])
