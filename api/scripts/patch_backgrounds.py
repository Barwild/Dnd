"""
Add missing backgrounds and fix subclass descriptions.
The D&D 5E SRD API only contains the Acolyte background.
We add the other PHB backgrounds as hardcoded data.
Run: python scripts/patch_backgrounds.py
"""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, SessionLocal, Base
import models

db = SessionLocal()

# ═══════════════════════════════════════════════════════
# PHB BACKGROUNDS (the SRD only has Acolyte)
# ═══════════════════════════════════════════════════════
BACKGROUNDS = [
    {
        "index": "acolyte", "name": "Acólito",
        "skill_proficiencies": ["Perspicacia", "Religión"],
        "tool_proficiencies": [],
        "languages": ["Dos a elección"],
        "equipment": ["Símbolo sagrado", "Devocionario", "5 varitas de incienso", "Vestimentas", "Ropa común", "15 po"],
        "feature_name": "Refugio de los Fieles",
        "feature_desc": "Como acólito, recibes el respeto de quienes comparten tu fe. Tú y tus compañeros pueden esperar recibir curación gratuita en un templo, santuario u otra presencia establecida de tu fe, aunque debes proporcionar los componentes materiales de los hechizos."
    },
    {
        "index": "charlatan", "name": "Charlatán",
        "skill_proficiencies": ["Engaño", "Juego de Manos"],
        "tool_proficiencies": ["Kit de disfraz", "Kit de falsificación"],
        "languages": [],
        "equipment": ["Ropa fina", "Kit de disfraz", "Herramientas de estafa", "15 po"],
        "feature_name": "Identidad Falsa",
        "feature_desc": "Has creado una segunda identidad que incluye documentación, contactos establecidos y disfraces que te permiten asumir esa persona."
    },
    {
        "index": "criminal", "name": "Criminal",
        "skill_proficiencies": ["Engaño", "Sigilo"],
        "tool_proficiencies": ["Juego (un tipo)", "Herramientas de ladrón"],
        "languages": [],
        "equipment": ["Palanca", "Ropa oscura con capucha", "15 po"],
        "feature_name": "Contacto Criminal",
        "feature_desc": "Tienes un contacto fiable y de confianza que actúa como enlace con una red de otros criminales."
    },
    {
        "index": "entertainer", "name": "Animador",
        "skill_proficiencies": ["Acrobacias", "Interpretación"],
        "tool_proficiencies": ["Kit de disfraz", "Instrumento musical (uno)"],
        "languages": [],
        "equipment": ["Instrumento musical", "Favor de un admirador", "Disfraz", "15 po"],
        "feature_name": "A Petición del Público",
        "feature_desc": "Siempre puedes encontrar un lugar donde actuar, generalmente en una posada o taberna. Recibes alojamiento y comida gratuitos a cambio de tu actuación."
    },
    {
        "index": "folk-hero", "name": "Héroe del Pueblo",
        "skill_proficiencies": ["Supervivencia", "Trato con Animales"],
        "tool_proficiencies": ["Herramientas de artesano (un tipo)", "Vehículos (tierra)"],
        "languages": [],
        "equipment": ["Herramientas de artesano", "Pala", "Olla de hierro", "Ropa común", "10 po"],
        "feature_name": "Hospitalidad Rústica",
        "feature_desc": "La gente común te protegerá y te dará refugio, aunque no arriesgarán sus vidas por ti."
    },
    {
        "index": "guild-artisan", "name": "Artesano del Gremio",
        "skill_proficiencies": ["Perspicacia", "Persuasión"],
        "tool_proficiencies": ["Herramientas de artesano (un tipo)"],
        "languages": ["Una a elección"],
        "equipment": ["Herramientas de artesano", "Carta de presentación del gremio", "Ropa de viajero", "15 po"],
        "feature_name": "Membresía del Gremio",
        "feature_desc": "Tu gremio te ofrece alojamiento y comida si es necesario, y paga por tu funeral. En algunas ciudades, un salón del gremio ofrece un lugar central para conocer otros miembros."
    },
    {
        "index": "hermit", "name": "Ermitaño",
        "skill_proficiencies": ["Medicina", "Religión"],
        "tool_proficiencies": ["Kit de herboristería"],
        "languages": ["Una a elección"],
        "equipment": ["Estuche con pergaminos", "Manta de invierno", "Ropa común", "Kit de herboristería", "5 po"],
        "feature_name": "Descubrimiento",
        "feature_desc": "Tu apartamiento te dio acceso a un descubrimiento único y poderoso. El DM determinará la naturaleza exacta de esta revelación."
    },
    {
        "index": "noble", "name": "Noble",
        "skill_proficiencies": ["Historia", "Persuasión"],
        "tool_proficiencies": ["Juego (un tipo)"],
        "languages": ["Una a elección"],
        "equipment": ["Ropa fina", "Anillo de sello", "Pergamino de linaje", "25 po"],
        "feature_name": "Posición Privilegiada",
        "feature_desc": "La gente te trata con deferencia debido a tu noble cuna. Eres bienvenido en la alta sociedad y la gente asume que tienes derecho a estar donde quiera que estés."
    },
    {
        "index": "outlander", "name": "Forastero",
        "skill_proficiencies": ["Atletismo", "Supervivencia"],
        "tool_proficiencies": ["Instrumento musical (uno)"],
        "languages": ["Una a elección"],
        "equipment": ["Bastón", "Trampa de caza", "Trofeo animal", "Ropa de viajero", "10 po"],
        "feature_name": "Viajero",
        "feature_desc": "Tienes una memoria excelente para mapas y geografía. Siempre puedes recordar el trazado general del terreno, asentamientos y otros rasgos a tu alrededor. Puedes encontrar comida y agua fresca para ti y hasta cinco personas cada día."
    },
    {
        "index": "sage", "name": "Sabio",
        "skill_proficiencies": ["Arcanos", "Historia"],
        "tool_proficiencies": [],
        "languages": ["Dos a elección"],
        "equipment": ["Tinta", "Pluma", "Cuchillo pequeño", "Carta de un colega con una pregunta sin responder", "Ropa común", "10 po"],
        "feature_name": "Investigador",
        "feature_desc": "Cuando intentas aprender o recordar algo, si no sabes esa información, a menudo sabes dónde y de quién puedes obtenerla."
    },
    {
        "index": "sailor", "name": "Marinero",
        "skill_proficiencies": ["Atletismo", "Percepción"],
        "tool_proficiencies": ["Herramientas de navegante", "Vehículos (agua)"],
        "languages": [],
        "equipment": ["Garrote (porra)", "50 pies de cuerda de seda", "Amuleto de la suerte", "Ropa común", "10 po"],
        "feature_name": "Pasaje en Barco",
        "feature_desc": "Puedes conseguir pasaje gratuito en un barco de vela para ti y tus compañeros. Como pagaste tu deuda o tienes amigos marineros, no puedes estar seguro de un horario fijo."
    },
    {
        "index": "soldier", "name": "Soldado",
        "skill_proficiencies": ["Atletismo", "Intimidación"],
        "tool_proficiencies": ["Juego (un tipo)", "Vehículos (tierra)"],
        "languages": [],
        "equipment": ["Insignia de rango", "Trofeo de un enemigo caído", "Juego de dados", "Ropa común", "10 po"],
        "feature_name": "Rango Militar",
        "feature_desc": "Los soldados de tu antigua organización militar aún te reconocen. Puedes invocar tu rango para ejercer influencia sobre otros soldados y requisar equipo simple o caballos para uso temporal."
    },
    {
        "index": "urchin", "name": "Huérfano",
        "skill_proficiencies": ["Juego de Manos", "Sigilo"],
        "tool_proficiencies": ["Kit de disfraz", "Herramientas de ladrón"],
        "languages": [],
        "equipment": ["Cuchillo pequeño", "Mapa de la ciudad", "Ratón mascota", "Recuerdo de los padres", "Ropa común", "10 po"],
        "feature_name": "Secretos de la Ciudad",
        "feature_desc": "Conoces los patrones secretos y el flujo de las ciudades. Cuando no estás en combate, tú y tus compañeros podéis viajar entre dos ubicaciones de la ciudad al doble de la velocidad normal."
    },
]

# ═══════════════════════════════════════════════════════
# SUBCLASS DESCRIPTIONS in Spanish
# ═══════════════════════════════════════════════════════
SUBCLASS_DESC_ES = {
    "berserker": "Un camino de furia pura e incontenible. Mientras estás en tu ira, te conviertes en una fuerza imparable de destrucción, desatando un frenesí que arrasa con todo a tu paso.",
    "champion": "El arquetipo del Campeón se centra en el desarrollo de la pura potencia física perfeccionada hasta la perfección mortal. Aquellos que eligen esta vía se fortalecen hasta la excelencia atlética.",
    "devotion": "El juramento de Devoción vincula al paladín a los ideales más elevados de justicia, virtud y orden. A veces llamados caballeros santos o caballeros blancos, cumplen el ideal del caballero en armadura brillante.",
    "draconic": "Tu magia innata proviene de la sangre dracónica que se mezcló con la de tu familia hace generaciones. Posees rasgos dracónicos que se manifiestan físicamente a medida que canalizas tu poder.",
    "evocation": "Te centras en la magia que crea efectos elementales poderosos como un frío amargo, una llama abrasadora, un trueno retumbante, un relámpago crepitante y ácido ardiente.",
    "fiend": "Has hecho un pacto con un ser de los planos inferiores. Tu patrón puede ser un señor demonio, un archidiablo, un pit fiend o un balor particularmente poderoso.",
    "hunter": "Emular al arquetipo del Cazador significa aceptar tu lugar como bastión entre la civilización y los terrores de la naturaleza salvaje. El camino del Cazador es luchar contra las amenazas.",
    "land": "El Círculo de la Tierra está formado por místicos y sabios que custodian el conocimiento y los ritos ancestrales a través de una vasta tradición oral. La magia del círculo está influenciada por la tierra.",
    "life": "El dominio de la Vida se centra en la vibrante energía positiva, una de las fuerzas fundamentales del universo, que sostiene toda la vida. Los dioses de la vida promueven la vitalidad y la salud.",
    "lore": "Los bardos del Colegio del Saber conocen algo de casi todo, recopilando fragmentos de conocimiento de fuentes tan diversas como tomos académicos y cuentos de campesinos.",
    "open-hand": "Los monjes del Camino de la Mano Abierta son los maestros definitivos de las artes marciales. Perfeccionan su cuerpo como instrumento ideal de combate sin armas.",
    "thief": "Perfeccionas tus habilidades en las artes del sigilo. Ladrones, bandidos, carteristas y otros criminales suelen seguir este arquetipo, al igual que exploradores y aventureros.",
}

def patch_backgrounds():
    print("\n📜 Insertando trasfondos del PHB...")
    count = 0
    for bg_data in BACKGROUNDS:
        existing = db.query(models.Background).filter(models.Background.index == bg_data["index"]).first()
        bg = existing or models.Background(index=bg_data["index"])
        bg.name = bg_data["name"]
        bg.skill_proficiencies = json.dumps(bg_data["skill_proficiencies"], ensure_ascii=False)
        bg.tool_proficiencies = json.dumps(bg_data["tool_proficiencies"], ensure_ascii=False)
        bg.languages = json.dumps(bg_data["languages"], ensure_ascii=False)
        bg.equipment = json.dumps(bg_data["equipment"], ensure_ascii=False)
        bg.feature_name = bg_data["feature_name"]
        bg.feature_desc = bg_data["feature_desc"]
        if not existing:
            db.add(bg)
        count += 1
    db.commit()
    print(f"  ✅ {count} trasfondos insertados/actualizados")


def patch_subclass_descriptions():
    print("\n🛡️ Traduciendo descripciones de subclases...")
    subclasses = db.query(models.Subclass).all()
    count = 0
    for sc in subclasses:
        es_desc = SUBCLASS_DESC_ES.get(sc.index)
        if es_desc:
            sc.description = es_desc
            count += 1
    db.commit()
    print(f"  ✅ {count} subclases traducidas")


if __name__ == "__main__":
    print("=" * 60)
    print("Patch: Trasfondos y Subclases")
    print("=" * 60)

    patch_backgrounds()
    patch_subclass_descriptions()

    print(f"\n{'=' * 60}")
    print("Patch completado")
    print(f"{'=' * 60}")

    db.close()
