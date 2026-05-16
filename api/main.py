from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from sqlalchemy import inspect, text

import models
from database import engine

# Create all tables
models.Base.metadata.create_all(bind=engine)

# Sync reference/compendium data from SQLite to the active database
try:
    from sync_data import sync_reference_data
    sync_reference_data(engine)
except Exception as e:
    print(f"[startup] Data sync skipped: {e}")

# Ensure database schema contains the starting_equipment column for characters
inspector = inspect(engine)
if 'characters' in inspector.get_table_names():
    columns = [c['name'] for c in inspector.get_columns('characters')]
    if 'starting_equipment' not in columns:
        try:
            with engine.connect() as connection:
                connection.execute(text("ALTER TABLE characters ADD COLUMN starting_equipment TEXT DEFAULT '[]'"))
                connection.commit()
        except Exception:
            pass
    if 'equipped_items' not in columns:
        try:
            with engine.connect() as connection:
                connection.execute(text("ALTER TABLE characters ADD COLUMN equipped_items TEXT DEFAULT '{}'"))
                connection.commit()
        except Exception:
            pass
    if 'calculated_stats' not in columns:
        try:
            with engine.connect() as connection:
                connection.execute(text("ALTER TABLE characters ADD COLUMN calculated_stats TEXT DEFAULT '{}'"))
                connection.commit()
        except Exception:
            pass

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
