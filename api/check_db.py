import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models

# Use the same logic as database.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "dnd_nexus.db")
url = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")
if url.startswith("postgres://"):
    url = url.replace("postgres://", "postgresql://", 1)

engine = create_engine(url)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print(f"Checking campaign 4 characters in database: {url}")
chars = db.query(models.Character).filter(models.Character.campaign_id == 4).all()
print(f"Found {len(chars)} characters in campaign 4.")
for c in chars:
    print(f"- ID: {c.id}, Name: {c.name}, UserID: {c.user_id}")

db.close()
