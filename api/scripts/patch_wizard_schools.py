"""
Add the missing PHB Wizard subclasses (Schools of Magic) to the database.
Run: python scripts/patch_wizard_schools.py
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import SessionLocal
import models

db = SessionLocal()

WIZARD_SCHOOLS = [
    {
        "name": "Abjuración",
        "index": "abjuration",
        "class_index": "wizard",
        "desc": "Te centras en la magia que bloquea, anula o protege. Los detractores de esta escuela dicen que trata sobre la negación en lugar de la afirmación positiva. Tú lo entiendes como la forma de acabar con la disputa, terminar con el dolor y proteger al mundo de influencias malignas."
    },
    {
        "name": "Conjuración",
        "index": "conjuration",
        "class_index": "wizard",
        "desc": "Como conjurador, te especializas en hechizos que producen objetos y criaturas de la nada. Puedes invocar nubes de veneno asesinas y monstruos de otros planos para que luchen por ti. A medida que aumenta tu maestría, aprendes conjuros de teletransporte."
    },
    {
        "name": "Adivinación",
        "index": "divination",
        "class_index": "wizard",
        "desc": "Te dedicas a comprender la magia de la adivinación, con la cual puedes discernir la verdad a largas distancias, observar lugares ocultos, escrutar objetos impenetrables y percibir el devenir del tiempo."
    },
    {
        "name": "Encantamiento",
        "index": "enchantment",
        "class_index": "wizard",
        "desc": "Tus estudios se centran en la magia que fascina, persuade o controla a los demás. Los magos especialistas en encantamiento seducen, manipulan mentes y doblegan la voluntad de las criaturas a su propio designio."
    },
    {
        "name": "Ilusión",
        "index": "illusion",
        "class_index": "wizard",
        "desc": "Concentras tus estudios en la magia que engaña a los sentidos, confunde en la mente y burla hasta a la persona más sabia. Tu magia es sutil, pero las ilusiones creadas por tu ágil mente hacen que lo imposible parezca real."
    },
    {
        "name": "Nigromancia",
        "index": "necromancy",
        "class_index": "wizard",
        "desc": "Exploras las fuerzas cósmicas de la vida, la muerte y la no muerte. Te centras en dominar la fuerza de la vida y canalizarla a tu voluntad, incluso extrayéndola de otras criaturas para potenciar tus propias habilidades o animando a los muertos."
    },
    {
        "name": "Transmutación",
        "index": "transmutation",
        "class_index": "wizard",
        "desc": "Eres un estudiante de aquellos conjuros que modifican la energía y la materia. Te fascina el proceso del cambio físico. Tus conjuros pueden alterar el estado físico de criaturas, objetos y entornos locales."
    }
]

def patch():
    print("Insertando escuelas de Mago...")
    wizard = db.query(models.Class).filter(models.Class.index == "wizard").first()
    if not wizard:
        print("Mago no encontrado.")
        return

    for school in WIZARD_SCHOOLS:
        existing = db.query(models.Subclass).filter(models.Subclass.index == school["index"]).first()
        if existing:
            print(f"La escuela {school['name']} ya existe. Actualizando...")
            existing.description = school["desc"]
            existing.class_id = wizard.id
            existing.class_index = "wizard"
        else:
            print(f"Insertando: {school['name']}")
            new_subclass = models.Subclass(
                index=school["index"],
                name=school["name"],
                class_id=wizard.id,
                class_index="wizard",
                description=school["desc"],
                features="[]"
            )
            db.add(new_subclass)
            
    db.commit()
    print("Todas las escuelas de Mago del PHB insertadas correctamente.")

if __name__ == "__main__":
    patch()
    db.close()
