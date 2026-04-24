from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

import models
from database import engine

# Create all tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="D&D 5E Nexus API",
    description="API para gestionar campañas, personajes y compendio de D&D 5ª Edición en español.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder for images
base_dir = os.path.dirname(__file__)
images_dir = os.path.join(base_dir, "static", "images")
os.makedirs(images_dir, exist_ok=True)
app.mount("/images", StaticFiles(directory=images_dir), name="images")

# Register routers
from routers.auth import router as auth_router
from routers.campaigns import router as campaigns_router
from routers.characters import router as characters_router
from routers.compendium import router as compendium_router
from routers.dm_tools import router as dm_tools_router

app.include_router(auth_router)
app.include_router(campaigns_router)
app.include_router(characters_router)
app.include_router(compendium_router)
app.include_router(dm_tools_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "app": "D&D 5E Nexus", "version": "2.0.0"}


# ═══════════════════════════════════════════════════════
# SERVE BUILT FRONTEND (production)
# ═══════════════════════════════════════════════════════
frontend_dist = os.path.join(os.path.dirname(__file__), "dist")
if os.path.isdir(frontend_dist):
    from fastapi.responses import FileResponse

    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="frontend-assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
