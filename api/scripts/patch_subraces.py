"""
Add missing subraces to the race records.
The SRD only has 1 subrace per race; we add the missing PHB ones.
Run: python scripts/patch_subraces.py
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import SessionLocal
import models

db = SessionLocal()

# Full subrace list per race (with ability bonuses)
SUBRACES_DATA = {
    "dwarf": [
        {"name": "Enano de las Colinas", "index": "hill-dwarf",
         "ability_bonuses": [{"ability": "Sabiduría", "bonus": 1}],
         "desc": "Intuición aguda, sentidos afilados y una resistencia notable."},
        {"name": "Enano de las Montañas", "index": "mountain-dwarf",
         "ability_bonuses": [{"ability": "Fuerza", "bonus": 2}],
         "desc": "Fuerte y resistente, acostumbrado a la vida dura en terreno accidentado."},
    ],
    "elf": [
        {"name": "Alto Elfo", "index": "high-elf",
         "ability_bonuses": [{"ability": "Inteligencia", "bonus": 1}],
         "desc": "Mente aguda y dominio de la magia básica. Aprende un truco de mago adicional."},
        {"name": "Elfo del Bosque", "index": "wood-elf",
         "ability_bonuses": [{"ability": "Sabiduría", "bonus": 1}],
         "desc": "Sentidos agudos e intuición. Velocidad 35 ft. Máscara de la Naturaleza."},
        {"name": "Elfo Oscuro (Drow)", "index": "dark-elf",
         "ability_bonuses": [{"ability": "Carisma", "bonus": 1}],
         "desc": "Visión en la oscuridad superior (120 ft). Sensibilidad a la luz solar."},
    ],
    "gnome": [
        {"name": "Gnomo de las Rocas", "index": "rock-gnome",
         "ability_bonuses": [{"ability": "Constitución", "bonus": 1}],
         "desc": "Conocedor nato de inventos y dispositivos mecánicos."},
        {"name": "Gnomo del Bosque", "index": "forest-gnome",
         "ability_bonuses": [{"ability": "Destreza", "bonus": 1}],
         "desc": "Talento natural para la ilusión y la comunicación con animales pequeños."},
    ],
    "halfling": [
        {"name": "Mediano Piesligeros", "index": "lightfoot-halfling",
         "ability_bonuses": [{"ability": "Carisma", "bonus": 1}],
         "desc": "Naturalmente sigiloso. Puedes intentar esconderte detrás de criaturas más grandes."},
        {"name": "Mediano Fornido", "index": "stout-halfling",
         "ability_bonuses": [{"ability": "Constitución", "bonus": 1}],
         "desc": "Más resistente que la media. Ventaja en salvaciones contra veneno."},
    ],
}

def patch():
    print("Insertando subrazas...")
    for race_idx, subs in SUBRACES_DATA.items():
        race = db.query(models.Race).filter(models.Race.index == race_idx).first()
        if not race:
            print(f"  ! Raza {race_idx} no encontrada")
            continue
        
        # Build subraces JSON with bonuses
        subraces_json = []
        for s in subs:
            subraces_json.append({
                "name": s["name"],
                "index": s["index"],
                "ability_bonuses": s["ability_bonuses"],
                "desc": s["desc"]
            })
        
        race.subraces = json.dumps(subraces_json, ensure_ascii=False)
        print(f"  {race.name}: {[s['name'] for s in subs]}")
    
    db.commit()
    print("Completado")

if __name__ == "__main__":
    patch()
    db.close()
