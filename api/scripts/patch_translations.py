"""
Patch the existing database with missing Spanish translations.
This script translates in-place without re-fetching from the API.
Run: python scripts/patch_translations.py
"""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, SessionLocal, Base
import models
from scripts.translations import (
    CONDITIONS, DAMAGE_TYPES, EQUIPMENT_CATEGORIES, WEAPON_PROPERTIES,
    translate, translate_text_block
)

db = SessionLocal()

# ═══════════════════════════════════════════════════════
# EQUIPMENT / ITEMS — Spanish translations
# ═══════════════════════════════════════════════════════
ITEMS_ES = {
    # ── Armas Simples Cuerpo a Cuerpo ──
    "club": "Garrote",
    "dagger": "Daga",
    "greatclub": "Gran Garrote",
    "handaxe": "Hacha de Mano",
    "javelin": "Jabalina",
    "light-hammer": "Martillo Ligero",
    "mace": "Maza",
    "quarterstaff": "Bastón",
    "sickle": "Hoz",
    "spear": "Lanza",
    # ── Armas Simples a Distancia ──
    "crossbow-light": "Ballesta Ligera",
    "dart": "Dardo",
    "shortbow": "Arco Corto",
    "sling": "Honda",
    # ── Armas Marciales Cuerpo a Cuerpo ──
    "battleaxe": "Hacha de Batalla",
    "flail": "Mangual",
    "glaive": "Guja",
    "greataxe": "Gran Hacha",
    "greatsword": "Espada Larga de Dos Manos",
    "halberd": "Alabarda",
    "lance": "Lanza de Caballería",
    "longsword": "Espada Larga",
    "maul": "Mazo",
    "morningstar": "Lucero del Alba",
    "pike": "Pica",
    "rapier": "Estoque",
    "scimitar": "Cimitarra",
    "shortsword": "Espada Corta",
    "trident": "Tridente",
    "war-pick": "Pico de Guerra",
    "warhammer": "Martillo de Guerra",
    "whip": "Látigo",
    # ── Armas Marciales a Distancia ──
    "blowgun": "Cerbatana",
    "crossbow-hand": "Ballesta de Mano",
    "crossbow-heavy": "Ballesta Pesada",
    "longbow": "Arco Largo",
    "net": "Red",
    # ── Armaduras ──
    "padded-armor": "Armadura Acolchada",
    "leather-armor": "Armadura de Cuero",
    "studded-leather-armor": "Armadura de Cuero Tachonado",
    "hide-armor": "Armadura de Pieles",
    "chain-shirt": "Camisote de Mallas",
    "scale-mail": "Cota de Escamas",
    "breastplate": "Coraza",
    "half-plate-armor": "Media Armadura de Placas",
    "ring-mail": "Cota de Anillas",
    "chain-mail": "Cota de Mallas",
    "splint-armor": "Armadura de Bandas",
    "plate-armor": "Armadura de Placas",
    "shield": "Escudo",
    # ── Equipo de Aventurero ──
    "abacus": "Ábaco",
    "acid-vial": "Ácido (frasco)",
    "alchemists-fire-flask": "Fuego de Alquimista",
    "alchemists-supplies": "Suministros de Alquimista",
    "arrow": "Flecha",
    "backpack": "Mochila",
    "ball-bearings-bag-of-1000": "Bolsa de Rodamientos (1000)",
    "barrel": "Barril",
    "basket": "Cesta",
    "bedroll": "Saco de Dormir",
    "bell": "Campana",
    "blanket": "Manta",
    "block-and-tackle": "Polea",
    "blowgun-needle": "Aguja de Cerbatana",
    "bolt": "Virote",
    "book": "Libro",
    "bottle-glass": "Botella de Cristal",
    "brewers-supplies": "Suministros de Cervecero",
    "bucket": "Cubo",
    "burglars-pack": "Pack de Ladrón",
    "calligraphers-supplies": "Suministros de Calígrafo",
    "caltrops": "Abrojos",
    "candle": "Vela",
    "carpenters-tools": "Herramientas de Carpintero",
    "cartographers-tools": "Herramientas de Cartógrafo",
    "chain-10-feet": "Cadena (3 m)",
    "chalk-1-piece": "Tiza (1 pieza)",
    "chest": "Cofre",
    "climbers-kit": "Kit de Escalador",
    "cobblers-tools": "Herramientas de Zapatero",
    "component-pouch": "Bolsa de Componentes",
    "cooks-utensils": "Utensilios de Cocinero",
    "crowbar": "Palanca",
    "crossbow-bolt-case": "Carcaj de Virotes",
    "crystal": "Cristal",
    "dice-set": "Juego de Dados",
    "diplomats-pack": "Pack de Diplomático",
    "disguise-kit": "Kit de Disfraz",
    "dragonchess-set": "Juego de Ajedrez Dragón",
    "drum": "Tambor",
    "dulcimer": "Dulcémele",
    "dungeoneers-pack": "Pack de Explorador de Mazmorras",
    "emblem": "Emblema",
    "entertainers-pack": "Pack de Entretenedor",
    "explorers-pack": "Pack de Explorador",
    "fishing-tackle": "Equipo de Pesca",
    "flask-or-tankard": "Frasco o Jarra",
    "flute": "Flauta",
    "forgery-kit": "Kit de Falsificación",
    "glassbowers-tools": "Herramientas de Soplador de Vidrio",
    "glassblowers-tools": "Herramientas de Soplador de Vidrio",
    "grappling-hook": "Gancho de Escalada",
    "hammer": "Martillo",
    "hammer-sledge": "Mazo de Herrero",
    "healers-kit": "Kit de Sanador",
    "herbalism-kit": "Kit de Herboristería",
    "holy-water-flask": "Agua Bendita (frasco)",
    "hourglass": "Reloj de Arena",
    "hunting-trap": "Trampa de Caza",
    "ink-1-ounce-bottle": "Tinta (frasco de 30 ml)",
    "ink-pen": "Pluma de Tinta",
    "iron-pot": "Olla de Hierro",
    "iron-spikes-10": "Clavos de Hierro (10)",
    "jewelers-tools": "Herramientas de Joyero",
    "jug-or-pitcher": "Jarra",
    "ladder-10-foot": "Escalera (3 m)",
    "lamp": "Lámpara",
    "lantern-bullseye": "Linterna de Ojo de Buey",
    "lantern-hooded": "Linterna Encapuchada",
    "leatherworkers-tools": "Herramientas de Peletero",
    "lock": "Cerradura",
    "lute": "Laúd",
    "lyre": "Lira",
    "magnifying-glass": "Lupa",
    "manacles": "Grilletes",
    "map-or-scroll-case": "Estuche para Mapas",
    "masons-tools": "Herramientas de Albañil",
    "mess-kit": "Kit de Comida",
    "mirror-steel": "Espejo de Acero",
    "navigators-tools": "Herramientas de Navegante",
    "oil-flask": "Aceite (frasco)",
    "orb": "Orbe",
    "painters-supplies": "Suministros de Pintor",
    "pan-flute": "Flauta de Pan",
    "paper-one-sheet": "Papel (una hoja)",
    "parchment-one-sheet": "Pergamino (una hoja)",
    "perfume-vial": "Perfume (frasco)",
    "pick-miners": "Pico de Minero",
    "piton": "Pitón",
    "playing-card-set": "Baraja de Cartas",
    "poison-basic-vial": "Veneno Básico (frasco)",
    "poisoners-kit": "Kit de Envenenador",
    "pole-10-foot": "Pértiga (3 m)",
    "pot-iron": "Olla de Hierro",
    "potters-tools": "Herramientas de Alfarero",
    "potion-of-healing": "Poción de Curación",
    "pouch": "Bolsita",
    "priests-pack": "Pack de Sacerdote",
    "quiver": "Carcaj",
    "ram-portable": "Ariete Portátil",
    "rations-1-day": "Raciones (1 día)",
    "reliquary": "Relicario",
    "robes": "Túnica",
    "rod": "Vara",
    "rope-hempen-50-feet": "Cuerda de Cáñamo (15 m)",
    "rope-silk-50-feet": "Cuerda de Seda (15 m)",
    "sack": "Saco",
    "scholars-pack": "Pack de Erudito",
    "sealing-wax": "Cera de Sellar",
    "shawm": "Chirimía",
    "shovel": "Pala",
    "signal-whistle": "Silbato",
    "signet-ring": "Anillo de Sello",
    "sling-bullet": "Proyectil de Honda",
    "smiths-tools": "Herramientas de Herrero",
    "soap": "Jabón",
    "spellbook": "Libro de Hechizos",
    "spike-iron-10": "Clavos de Hierro (10)",
    "sprig-of-mistletoe": "Rama de Muérdago",
    "spyglass": "Catalejo",
    "staff": "Bastón",
    "string-10-feet": "Cordel (3 m)",
    "tent-two-person": "Tienda de Campaña (2 personas)",
    "thieves-tools": "Herramientas de Ladrón",
    "three-dragon-ante-set": "Juego Tres Dragones",
    "tinderbox": "Pedernal",
    "tinkers-tools": "Herramientas de Hojalatero",
    "torch": "Antorcha",
    "totem": "Tótem",
    "vial": "Frasco",
    "viol": "Viola",
    "waterskin": "Odre",
    "wand": "Varita",
    "weavers-tools": "Herramientas de Tejedor",
    "whetstone": "Piedra de Afilar",
    "woodcarvers-tools": "Herramientas de Tallador",
    "wooden-staff": "Bastón de Madera",
    "yew-wand": "Varita de Tejo",
    # ── Monturas y Vehículos ──
    "camel": "Camello",
    "donkey-or-mule": "Burro o Mula",
    "elephant": "Elefante",
    "horse-draft": "Caballo de Tiro",
    "horse-riding": "Caballo de Montar",
    "mastiff": "Mastín",
    "pony": "Poni",
    "warhorse": "Caballo de Guerra",
    "carriage": "Carruaje",
    "cart": "Carro",
    "chariot": "Carro de Guerra",
    "galley": "Galera",
    "keelboat": "Bote de Quilla",
    "longship": "Drakkar",
    "rowboat": "Bote de Remos",
    "sailing-ship": "Barco de Vela",
    "sled": "Trineo",
    "wagon": "Vagón",
    "warship": "Barco de Guerra",
    # ── Munición ──
    "arrows-20": "Flechas (20)",
    "blowgun-needles-50": "Agujas de Cerbatana (50)",
    "crossbow-bolts-20": "Virotes de Ballesta (20)",
    "sling-bullets-20": "Proyectiles de Honda (20)",
    # ── Equipo básico extra ──
    "bit-and-bridle": "Brida y Bocado",
    "barding-leather": "Barda de Cuero",
    "barding-studded-leather": "Barda de Cuero Tachonado",
    "barding-chain-mail": "Barda de Cota de Mallas",
    "barding-plate": "Barda de Placas",
    "feed-per-day": "Pienso (por día)",
    "saddle-exotic": "Silla de Montar Exótica",
    "saddle-military": "Silla de Montar Militar",
    "saddle-pack": "Silla de Carga",
    "saddle-riding": "Silla de Montar",
    "saddlebags": "Alforjas",
    "stabling-per-day": "Establo (por día)",
    "antitoxin-vial": "Antídoto (frasco)",
    "clothes-common": "Ropa Común",
    "clothes-costume": "Disfraz",
    "clothes-fine": "Ropa Fina",
    "clothes-travelers": "Ropa de Viajero",
}

# ═══════════════════════════════════════════════════════
# CONDITION DESCRIPTIONS in Spanish
# ═══════════════════════════════════════════════════════
CONDITIONS_DESC_ES = {
    "blinded": "Una criatura cegada no puede ver y falla automáticamente cualquier prueba de característica que requiera visión.\n- Las tiradas de ataque contra la criatura tienen ventaja, y las tiradas de ataque de la criatura tienen desventaja.",
    "charmed": "Una criatura encantada no puede atacar al encantador ni elegirlo como objetivo de habilidades o efectos mágicos dañinos.\n- El encantador tiene ventaja en las pruebas de característica para interactuar socialmente con la criatura.",
    "deafened": "Una criatura ensordecida no puede oír y falla automáticamente cualquier prueba de característica que requiera oído.",
    "exhaustion": "Algunos efectos especiales causan agotamiento. Se mide en seis niveles acumulativos:\n- Nivel 1: Desventaja en pruebas de característica\n- Nivel 2: Velocidad reducida a la mitad\n- Nivel 3: Desventaja en tiradas de ataque y salvaciones\n- Nivel 4: Puntos de golpe máximos reducidos a la mitad\n- Nivel 5: Velocidad reducida a 0\n- Nivel 6: Muerte",
    "frightened": "Una criatura asustada tiene desventaja en las pruebas de característica y tiradas de ataque mientras la fuente de su miedo esté dentro de su línea de visión.\n- La criatura no puede moverse voluntariamente hacia la fuente de su miedo.",
    "grappled": "La velocidad de una criatura agarrada se convierte en 0 y no puede beneficiarse de ningún bono a su velocidad.\n- La condición termina si el agarrador queda incapacitado o si un efecto aleja a la criatura fuera del alcance del agarrador.",
    "incapacitated": "Una criatura incapacitada no puede realizar acciones ni reacciones.",
    "invisible": "Es imposible ver a una criatura invisible sin ayuda mágica o sentidos especiales. La criatura está en gran medida oscurecida para propósitos de esconderse.\n- Las tiradas de ataque contra la criatura tienen desventaja, y las tiradas de ataque de la criatura tienen ventaja.",
    "paralyzed": "Una criatura paralizada queda incapacitada y no puede moverse ni hablar.\n- La criatura falla automáticamente las tiradas de salvación de Fuerza y Destreza.\n- Las tiradas de ataque contra ella tienen ventaja.\n- Cualquier ataque que la golpee dentro de 5 pies es un golpe crítico.",
    "petrified": "Una criatura petrificada se transforma, junto con cualquier objeto no mágico que lleve, en piedra sólida. Su peso se multiplica por diez y deja de envejecer.\n- Está incapacitada, no puede moverse ni hablar, y no es consciente de su entorno.\n- Tiene resistencia a todo el daño e inmunidad al veneno y las enfermedades.",
    "poisoned": "Una criatura envenenada tiene desventaja en las tiradas de ataque y pruebas de característica.",
    "prone": "La única opción de movimiento de una criatura derribada es arrastrarse, a menos que se levante.\n- Levantarse cuesta una cantidad de movimiento igual a la mitad de su velocidad.\n- La criatura tiene desventaja en tiradas de ataque.\n- Una tirada de ataque contra la criatura tiene ventaja si el atacante está a 5 pies, y desventaja en caso contrario.",
    "restrained": "La velocidad de una criatura apresada se convierte en 0 y no puede beneficiarse de ningún bono a su velocidad.\n- Las tiradas de ataque contra ella tienen ventaja, y sus tiradas de ataque tienen desventaja.\n- La criatura tiene desventaja en las tiradas de salvación de Destreza.",
    "stunned": "Una criatura aturdida queda incapacitada, no puede moverse y solo puede hablar con titubeos.\n- La criatura falla automáticamente las tiradas de salvación de Fuerza y Destreza.\n- Las tiradas de ataque contra ella tienen ventaja.",
    "unconscious": "Una criatura inconsciente está incapacitada, no puede moverse ni hablar y no es consciente de su entorno.\n- La criatura suelta lo que lleve y cae al suelo.\n- Falla automáticamente las tiradas de salvación de Fuerza y Destreza.\n- Las tiradas de ataque contra ella tienen ventaja.\n- Cualquier ataque dentro de 5 pies es un golpe crítico.",
}

# ═══════════════════════════════════════════════════════
# FEATS in Spanish
# ═══════════════════════════════════════════════════════
FEATS_ES = {
    "grappler": "Luchador",
    "war-caster": "Conjurador de Guerra",
    "alert": "Alerta",
    "athlete": "Atleta",
    "actor": "Actor",
    "charger": "Cargador",
    "crossbow-expert": "Experto con Ballesta",
    "defensive-duelist": "Duelista Defensivo",
    "dual-wielder": "Combate con Dos Armas",
    "dungeon-delver": "Explorador de Mazmorras",
    "durable": "Resistente",
    "elemental-adept": "Adepto Elemental",
    "great-weapon-master": "Maestro de Armas Grandes",
    "healer": "Sanador",
    "heavily-armored": "Competencia con Armadura Pesada",
    "heavy-armor-master": "Maestro de Armadura Pesada",
    "inspiring-leader": "Líder Inspirador",
    "keen-mind": "Mente Aguda",
    "lightly-armored": "Competencia con Armadura Ligera",
    "linguist": "Lingüista",
    "lucky": "Afortunado",
    "mage-slayer": "Matador de Magos",
    "magic-initiate": "Iniciado en la Magia",
    "martial-adept": "Adepto Marcial",
    "medium-armor-master": "Maestro de Armadura Media",
    "mobile": "Móvil",
    "moderately-armored": "Competencia con Armadura Media",
    "mounted-combatant": "Combatiente Montado",
    "observant": "Observador",
    "polearm-master": "Maestro de Armas de Asta",
    "resilient": "Resistente",
    "ritual-caster": "Lanzador de Rituales",
    "savage-attacker": "Atacante Salvaje",
    "sentinel": "Centinela",
    "sharpshooter": "Tirador Certero",
    "shield-master": "Maestro de Escudo",
    "skilled": "Habilidoso",
    "skulker": "Acechador",
    "spell-sniper": "Francotirador de Hechizos",
    "tavern-brawler": "Peleón de Taberna",
    "tough": "Duro",
    "weapon-master": "Maestro de Armas",
}


def patch_items():
    """Translate item names from English to Spanish."""
    print("\n Traduciendo Objetos...")
    items = db.query(models.Item).all()
    count = 0
    for item in items:
        es_name = ITEMS_ES.get(item.index)
        if es_name and item.name != es_name:
            item.name = es_name
            count += 1
    db.commit()
    print(f"   {count} objetos traducidos")


def patch_magic_items():
    """Translate magic item names where possible (keep English in name_en)."""
    print("\n Traduciendo Objetos Mágicos...")
    # Magic items are very numerous and varied, they're hard to translate automatically
    # For now, just translate common patterns
    items = db.query(models.MagicItem).all()
    count = 0
    replacements = {
        "Armor": "Armadura", "Weapon": "Arma", "Potion": "Poción", "Ring": "Anillo",
        "Wand": "Varita", "Staff": "Bastón", "Rod": "Vara", "Shield": "Escudo",
        "Cloak": "Capa", "Belt": "Cinturón", "Boots": "Botas", "Bracers": "Brazales",
        "Gauntlets": "Guanteletes", "Helm": "Yelmo", "Necklace": "Collar",
        "Amulet": "Amuleto", "Cape": "Capa", "Robe": "Túnica",
        "Sword": "Espada", "Axe": "Hacha", "Bow": "Arco", "Hammer": "Martillo",
        "of Protection": "de Protección", "of Resistance": "de Resistencia",
        "of Healing": "de Curación", "of Speed": "de Velocidad",
        "of Strength": "de Fuerza", "of Giant Strength": "de Fuerza de Gigante",
        "of Flying": "de Vuelo", "of Invisibility": "de Invisibilidad",
        "of Fire Resistance": "de Resistencia al Fuego",
        "of Cold Resistance": "de Resistencia al Frío",
        "+1": "+1", "+2": "+2", "+3": "+3",
    }
    for item in items:
        new_name = item.name
        for en, es in replacements.items():
            if en in new_name:
                new_name = new_name.replace(en, es)
        if new_name != item.name:
            item.name = new_name
            count += 1
    db.commit()
    print(f"   {count} objetos mágicos traducidos")


def patch_conditions():
    """Translate condition descriptions to Spanish."""
    print("\n Traduciendo Condiciones...")
    conditions = db.query(models.Condition).all()
    count = 0
    for cond in conditions:
        es_desc = CONDITIONS_DESC_ES.get(cond.index)
        if es_desc:
            cond.description = es_desc
            count += 1
    db.commit()
    print(f"   {count} condiciones traducidas")


def patch_feats():
    """Translate feat names to Spanish."""
    print("\n Traduciendo Dotes...")
    feats = db.query(models.Feat).all()
    count = 0
    for feat in feats:
        es_name = FEATS_ES.get(feat.index)
        if es_name and feat.name != es_name:
            feat.name = es_name
            count += 1
    db.commit()
    print(f"   {count} dotes traducidas")


if __name__ == "__main__":
    print("=" * 60)
    print("Patch de Traducciones al Español")
    print("=" * 60)

    patch_items()
    patch_magic_items()
    patch_conditions()
    patch_feats()

    print(f"\n{'=' * 60}")
    print(" Patch completado")
    print(f"{'=' * 60}")

    db.close()
