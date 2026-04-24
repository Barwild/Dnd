import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
import models
from scripts.translations import MONSTERS

db = SessionLocal()

print("Traduciendo Monstruos...")
monsters = db.query(models.Monster).all()
count = 0
for m in monsters:
    es_name = MONSTERS.get(m.index)
    if es_name and m.name != es_name:
        m.name = es_name
        count += 1

db.commit()
print(f"{count} monstruos traducidos.")
db.close()
