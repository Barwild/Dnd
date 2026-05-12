import sys
import os
import json

# Add parent dir to path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, SessionLocal
import models

db = SessionLocal()

def add_human_races():
    humans_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'human_races.json')
    try:
        with open(humans_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading humans JSON: {e}")
        return

    races = data.get("races", [])
    for r in races:
        idx = r.get("index")
        
        # Check if exists
        exists = db.query(models.Race).filter_by(index=idx).first()
        if exists:
            print(f"Raza {r.get('name')} ya existe")
            continue

        bonuses = []
        stats = r.get("stats", {}).get("bonuses", {})
        for stat, val in stats.items():
            if val > 0:
                bonuses.append({"ability": stat, "bonus": val})

        traits = r.get("traits", [])
        
        new_race = models.Race(
            index=idx,
            name=r.get("name"),
            speed=r.get("speed", 30),
            ability_bonuses=json.dumps(bonuses, ensure_ascii=False),
            alignment=r.get("alignment", ""),
            age=json.dumps(r.get("age", {}), ensure_ascii=False),
            size=r.get("size", "Mediano"),
            size_description=r.get("description", ""),
            traits=json.dumps(traits, ensure_ascii=False),
            languages="[\"Común\"]",
            language_desc="Puedes hablar, leer y escribir Común.",
            subraces="[]"
        )
        db.add(new_race)
        print(f"Raza {r.get('name')} añadida.")

def main():
    add_human_races()
    db.commit()
    db.close()
    print("Razas humanas extra añadidas con éxito.")

if __name__ == "__main__":
    main()
