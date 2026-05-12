import sys
import os
import json

# Add parent dir to path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, SessionLocal
import models

db = SessionLocal()

def add_aarakocra():
    # Check if exists
    exists = db.query(models.Race).filter_by(index="aarakocra").first()
    if exists:
        print("Aarakocra ya existe")
        return

    # Add Aarakocra
    bonuses = [{"ability": "DEX", "bonus": 2}, {"ability": "WIS", "bonus": 1}]
    traits = [
        {"name": "Vuelo", "desc": "Tienes una velocidad de vuelo de 50 pies. Para usar esta velocidad, no puedes estar usando armadura media o pesada."},
        {"name": "Garras", "desc": "Tus garras son armas naturales, con las que puedes hacer ataques desarmados. Si golpeas con ellas, infliges daño cortante igual a 1d4 + tu modificador de Fuerza, en lugar del daño contundente normal para un ataque desarmado."}
    ]
    
    aarakocra = models.Race(
        index="aarakocra",
        name="Aarakocra",
        speed=25,
        ability_bonuses=json.dumps(bonuses, ensure_ascii=False),
        alignment="La mayoría de los aarakocra son buenos y raramente eligen lados en disputas entre legales o caóticos.",
        age="Los aarakocra alcanzan la madurez a los 3 años y generalmente no viven más de 30 años.",
        size="Mediano",
        size_description="Mides aproximadamente 5 pies de altura y pesas entre 80 y 100 libras. Tu tamaño es Mediano.",
        traits=json.dumps(traits, ensure_ascii=False),
        languages=json.dumps(["Común", "Aarakocra", "Auran"], ensure_ascii=False),
        language_desc="Puedes hablar, leer y escribir Común, Aarakocra y Auran.",
        subraces="[]"
    )
    
    db.add(aarakocra)
    print("Aarakocra añadido")

def add_artificer():
    artificer_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'artificer_tasha_cauldron.json')
    try:
        with open(artificer_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading artificer JSON: {e}")
        return

    cls_data = data.get("class", {})
    if not cls_data:
        return
        
    idx = cls_data.get("index", "artificer")
    
    # Check if exists
    exists = db.query(models.Class).filter_by(index=idx).first()
    if exists:
        print("Artífice ya existe")
        return

    # Add Class
    artificer = models.Class(
        index=idx,
        name=cls_data.get("name", "Artífice"),
        hit_die=cls_data.get("hit_die", 8),
        proficiencies=json.dumps(cls_data.get("proficiencies", []), ensure_ascii=False),
        proficiency_choices=json.dumps(cls_data.get("proficiency_choices", []), ensure_ascii=False),
        saving_throws=json.dumps(cls_data.get("saving_throws", []), ensure_ascii=False),
        starting_equipment=json.dumps(cls_data.get("starting_equipment", []), ensure_ascii=False),
        starting_equipment_options=json.dumps(cls_data.get("starting_equipment_options", []), ensure_ascii=False),
        spellcasting=json.dumps(cls_data.get("spellcasting", {}), ensure_ascii=False),
        class_levels_url=cls_data.get("class_levels_url", "")
    )
    db.add(artificer)
    db.commit() # Commit to get the ID for subclasses
    
    print("Clase Artífice añadida.")

    # Add Subclasses
    subclasses = data.get("subclasses", [])
    for sc in subclasses:
        sc_idx = sc.get("index")
        sc_exists = db.query(models.Subclass).filter_by(index=sc_idx).first()
        if not sc_exists:
            new_sc = models.Subclass(
                index=sc_idx,
                name=sc.get("name"),
                class_id=artificer.id,
                class_index=idx,
                description=sc.get("description", ""),
                features=json.dumps(sc.get("features", []), ensure_ascii=False)
            )
            db.add(new_sc)
            print(f"Subclase {sc.get('name')} añadida.")

def main():
    add_aarakocra()
    add_artificer()
    db.commit()
    db.close()
    print("Contenido extra añadido con éxito.")

if __name__ == "__main__":
    main()
