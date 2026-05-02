from sqlalchemy.orm import Session
from api.database import SessionLocal
from api.models import Race, Class, Subclass
import json

def add_phb_content():
    session: Session = SessionLocal()

    # Races and Subraces
    races = [
        {
            "name": "Humano",
            "speed": 30,
            "ability_bonuses": json.dumps([{"STR": 1}, {"DEX": 1}, {"CON": 1}, {"INT": 1}, {"WIS": 1}, {"CHA": 1}]),
            "subraces": json.dumps([]),
        },
        {
            "name": "Elfo",
            "speed": 30,
            "ability_bonuses": json.dumps([{"DEX": 2}]),
            "subraces": json.dumps([
                {"name": "Alto Elfo", "ability_bonuses": [{"INT": 1}]},
                {"name": "Elfo Silvano", "ability_bonuses": [{"WIS": 1}]}
            ]),
        },
        # Añadir más razas aquí
    ]

    for race in races:
        new_race = Race(
            name=race["name"],
            speed=race["speed"],
            ability_bonuses=race["ability_bonuses"],
            subraces=race["subraces"],
        )
        session.add(new_race)

    # Classes
    classes = [
        {
            "name": "Guerrero",
            "hit_die": 10,
            "proficiencies": json.dumps(["Armaduras Ligeras", "Armaduras Medias", "Armaduras Pesadas"]),
            "spellcasting": json.dumps({}),
        },
        {
            "name": "Mago",
            "hit_die": 6,
            "proficiencies": json.dumps(["Bastones", "Varitas"]),
            "spellcasting": json.dumps({"level": 1, "spell_slots": [2]}),
        },
        # Añadir más clases aquí
    ]

    for char_class in classes:
        new_class = Class(
            name=char_class["name"],
            hit_die=char_class["hit_die"],
            proficiencies=char_class["proficiencies"],
            spellcasting=char_class["spellcasting"],
        )
        session.add(new_class)

    # Subclasses
    subclasses = [
        {
            "name": "Campeón",
            "class_id": 1,  # ID del Guerrero
            "features": json.dumps(["Mejora Crítica", "Atleta Sobresaliente"]),
        },
        {
            "name": "Evocador",
            "class_id": 2,  # ID del Mago
            "features": json.dumps(["Evocación Potente", "Esculpir Conjuros"]),
        },
        # Añadir más subclases aquí
    ]

    for subclass in subclasses:
        new_subclass = Subclass(
            name=subclass["name"],
            class_id=subclass["class_id"],
            features=subclass["features"],
        )
        session.add(new_subclass)

    session.commit()
    session.close()

if __name__ == "__main__":
    add_phb_content()