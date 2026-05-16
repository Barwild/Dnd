"""
Seed leveling_tables with all 13 D&D 5E classes (levels 1-20).
Run: python scripts/seed_leveling_tables.py
"""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, engine, Base
from models import LevelingTable

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────
def prof(level):
    if level <= 4: return 2
    if level <= 8: return 3
    if level <= 12: return 4
    if level <= 16: return 5
    return 6

def slot_dict(vals, max_level):
    return {str(i+1): {"max": v} for i, v in enumerate(vals) if v is not None and i < max_level}

def json_features(class_dict, level):
    return json.dumps(class_dict.get(level, []), ensure_ascii=False)

def json_spells_known(val):
    if val == 0:
        return "0"
    return json.dumps({"max": val})

# ──────────────────────────────────────────────
# SPELL SLOTS
# ──────────────────────────────────────────────

# Full caster: slot_levels 1-9
FULL = {
    1:  [2],
    2:  [3],
    3:  [4,2],
    4:  [4,3],
    5:  [4,3,2],
    6:  [4,3,3],
    7:  [4,3,3,1],
    8:  [4,3,3,2],
    9:  [4,3,3,3,1],
    10: [4,3,3,3,2],
    11: [4,3,3,3,2,1],
    12: [4,3,3,3,2,1],
    13: [4,3,3,3,2,1,1],
    14: [4,3,3,3,2,1,1],
    15: [4,3,3,3,2,1,1,1],
    16: [4,3,3,3,2,1,1,1],
    17: [4,3,3,3,2,1,1,1,1],
    18: [4,3,3,3,3,1,1,1,1],
    19: [4,3,3,3,3,2,1,1,1],
    20: [4,3,3,3,3,2,2,1,1],
}

def full_slots(lvl):
    return json.dumps(slot_dict(FULL[lvl], 9))

# Half caster: slot_levels 1-5
HALF = {
    1:  [],
    2:  [2],
    3:  [3],
    4:  [3],
    5:  [4,2],
    6:  [4,2],
    7:  [4,3],
    8:  [4,3],
    9:  [4,3,2],
    10: [4,3,2],
    11: [4,3,3],
    12: [4,3,3],
    13: [4,3,3,1],
    14: [4,3,3,1],
    15: [4,3,3,2],
    16: [4,3,3,2],
    17: [4,3,3,3,1],
    18: [4,3,3,3,1],
    19: [4,3,3,3,2],
    20: [4,3,3,3,2],
}

def half_slots(lvl):
    return json.dumps(slot_dict(HALF[lvl], 5))

def arti_slots(lvl):
    if lvl == 1:
        return json.dumps({"1": {"max": 2}})
    return half_slots(lvl)

def warlock_slots(lvl):
    if lvl <= 1:       return json.dumps({"pact": {"count": 1, "level": 1}})
    if lvl == 2:       return json.dumps({"pact": {"count": 2, "level": 1}})
    if lvl <= 4:       return json.dumps({"pact": {"count": 2, "level": 2}})
    if lvl <= 6:       return json.dumps({"pact": {"count": 2, "level": 3}})
    if lvl <= 8:       return json.dumps({"pact": {"count": 2, "level": 4}})
    if lvl <= 9:       return json.dumps({"pact": {"count": 2, "level": 5}})
    if lvl <= 16:      return json.dumps({"pact": {"count": 3, "level": 5}})
    return json.dumps({"pact": {"count": 4, "level": 5}})

# ──────────────────────────────────────────────
# CANTRIPS
# ──────────────────────────────────────────────
def cantrip_map(mapping, lvl):
    for (lo, hi), val in mapping.items():
        if lo <= lvl <= hi:
            return val
    return 0

C_BARDO     = {(1,3):2, (4,7):3, (8,13):4, (14,20):5}
C_CLERIGO   = {(1,3):3, (4,6):4, (7,10):5, (11,20):6}
C_DRUIDA    = {(1,3):2, (4,7):3, (8,13):4, (14,20):5}
C_HECHICERO = {(1,2):4, (3,4):5, (5,6):6, (7,8):7, (9,10):8, (11,12):9, (13,14):10, (15,16):11, (17,18):12, (19,20):13}
C_MAGO      = {(1,2):3, (3,4):4, (5,6):5, (7,8):6, (9,10):7, (11,12):8, (13,14):9, (15,16):10, (17,18):11, (19,20):12}
C_BRUJO     = {(1,2):2, (3,4):3, (5,6):4, (7,8):5, (9,10):6, (11,12):7, (13,14):8, (15,16):9, (17,18):10, (19,20):11}
C_ARTIFICE  = {(1,3):2, (4,6):3, (7,9):4, (10,12):5, (13,15):6, (16,18):7, (19,20):8}

def cantrip(cmap, lvl):
    return 0 if cmap is None else cantrip_map(cmap, lvl)

# ──────────────────────────────────────────────
# SPELLS KNOWN (max, per level index 0-19)
# ──────────────────────────────────────────────
SK_BARDO     = [4,5,6,7,8,9,10,11,12,14,15,15,16,18,19,19,20,22,22,22]
SK_HECHICERO = [2,3,4,5,6,7,8,9,10,11,12,12,13,13,14,14,15,15,15,15]
SK_BRUJO     = [2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15]
SK_MAGO      = [6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44]

def spells_known(arr, lvl, prepared=False):
    if prepared:
        return "0"
    return json.dumps({"max": arr[lvl-1]})

# ──────────────────────────────────────────────
# FEATURES per class per level (Spanish)
# ──────────────────────────────────────────────
F = {}

F['bárbaro'] = {
    1: ["Furia", "Defensa sin Armadura"],
    2: ["Ataque Temerario", "Sentido del Peligro"],
    3: ["Camino Primitivo", "Primitivo"],
    4: ["Mejora de Características"],
    5: ["Ataque Adicional", "Movimiento Rápido"],
    6: ["Opción de Camino Primitivo"],
    7: ["Instinto Salvaje"],
    8: ["Mejora de Características"],
    9: ["Crítico Brutal (1 dado)"],
    10: ["Opción de Camino Primitivo"],
    11: ["Furia Persistente"],
    12: ["Mejora de Características"],
    13: ["Crítico Brutal (2 dados)"],
    14: ["Opción de Camino Primitivo"],
    15: ["Furia Persistente"],
    16: ["Mejora de Características"],
    17: ["Crítico Brutal (3 dados)"],
    18: ["Furia Imparable"],
    19: ["Mejora de Características"],
    20: ["Campeón Primitivo"],
}

F['bardo'] = {
    1: ["Lanzamiento de Conjuros", "Inspiración de Bardo (d6)"],
    2: ["Palabra de Aliento", "Maestro de la Música"],
    3: ["Colegio de Bardos", "Experto"],
    4: ["Mejora de Características"],
    5: ["Inspiración de Bardo (d8)", "Fuente de Inspiración"],
    6: ["Contraprestación", "Opción de Colegio"],
    7: ["Inspiración de Bardo (d10)"],
    8: ["Mejora de Características"],
    9: ["Canción de Descanso (d12)"],
    10: ["Inspiración de Bardo (d12)", "Secretos Mágicos"],
    11: ["Inspiración de Bardo (d12)"],
    12: ["Mejora de Características"],
    13: ["Canción de Descanso (d12)"],
    14: ["Secretos Mágicos", "Opción de Colegio"],
    15: ["Inspiración de Bardo (d12)"],
    16: ["Mejora de Características"],
    17: ["Canción de Descanso (d12)"],
    18: ["Secretos Mágicos"],
    19: ["Mejora de Características"],
    20: ["Inspiración Superior"],
}

F['clérigo'] = {
    1: ["Lanzamiento de Conjuros", "Dominio Divino"],
    2: ["Canalizar Divinidad (1/descanso)"],
    3: ["Dominio Divino"],
    4: ["Mejora de Características"],
    5: ["Destruir No Muertos (CR 1/2)"],
    6: ["Canalizar Divinidad (2/descanso)", "Dominio Divino"],
    7: ["Dominio Divino"],
    8: ["Mejora de Características", "Destruir No Muertos (CR 1)"],
    9: ["Dominio Divino"],
    10: ["Intervención Divina"],
    11: ["Destruir No Muertos (CR 2)"],
    12: ["Mejora de Características"],
    13: ["Dominio Divino"],
    14: ["Destruir No Muertos (CR 3)"],
    15: ["Dominio Divino"],
    16: ["Mejora de Características"],
    17: ["Destruir No Muertos (CR 4)", "Dominio Divino"],
    18: ["Canalizar Divinidad (3/descanso)"],
    19: ["Mejora de Características"],
    20: ["Intervención Divina (mejorada)"],
}

F['druida'] = {
    1: ["Lanzamiento de Conjuros", "Druídico"],
    2: ["Forma Salvaje"],
    3: ["Círculo Druídico"],
    4: ["Mejora de Características", "Forma Salvaje (mejorada)"],
    5: ["Forma Salvaje (mejorada)"],
    6: ["Opción de Círculo Druídico"],
    7: ["Forma Salvaje (mejorada)"],
    8: ["Mejora de Características", "Forma Salvaje (mejorada)"],
    9: ["Forma Salvaje (mejorada)"],
    10: ["Opción de Círculo Druídico"],
    11: ["Forma Salvaje (mejorada)"],
    12: ["Mejora de Características"],
    13: ["Forma Salvaje (mejorada)"],
    14: ["Opción de Círculo Druídico"],
    15: ["Forma Salvaje (mejorada)"],
    16: ["Mejora de Características"],
    17: ["Forma Salvaje (mejorada)"],
    18: ["Cuerpo Atemporal", "Hechizos de Bestias"],
    19: ["Mejora de Características"],
    20: ["Arquidruida"],
}

F['guerrero'] = {
    1: ["Estilo de Combate", "Segunda Respiración"],
    2: ["Oleada de Acción (1 uso)"],
    3: ["Arquetipo Marcial"],
    4: ["Mejora de Características"],
    5: ["Ataque Adicional (1)"],
    6: ["Mejora de Características"],
    7: ["Arquetipo Marcial"],
    8: ["Mejora de Características"],
    9: ["Indomable (1 uso)"],
    10: ["Arquetipo Marcial"],
    11: ["Ataque Adicional (2)"],
    12: ["Mejora de Características"],
    13: ["Indomable (2 usos)"],
    14: ["Mejora de Características"],
    15: ["Arquetipo Marcial"],
    16: ["Mejora de Características"],
    17: ["Oleada de Acción (2 usos)", "Indomable (3 usos)"],
    18: ["Arquetipo Marcial"],
    19: ["Mejora de Características"],
    20: ["Ataque Adicional (3)"],
}

F['monje'] = {
    1: ["Defensa sin Armadura", "Artes Marciales"],
    2: ["Ki", "Movimiento sin Armadura"],
    3: ["Tradición Monástica", "Desvío de Proyectiles"],
    4: ["Mejora de Características", "Caída de los Sentidos"],
    5: ["Ataque Adicional", "Golpe Aturdidor"],
    6: ["Movimiento sin Armadura (mejorado)", "Opción de Tradición"],
    7: ["Evasión", "Quietud de la Mente"],
    8: ["Mejora de Características"],
    9: ["Movimiento sin Armadura (mejorado)"],
    10: ["Pureza Corporal"],
    11: ["Opción de Tradición"],
    12: ["Mejora de Características"],
    13: ["Lengua del Sol y la Luna"],
    14: ["Alma Diamantina"],
    15: ["Cuerpo Atemporal"],
    16: ["Mejora de Características"],
    17: ["Opción de Tradición"],
    18: ["Cuerpo Vacío"],
    19: ["Mejora de Características"],
    20: ["Maestro de los Puños"],
}

F['paladín'] = {
    1: ["Sentido Divino", "Imposición de Manos"],
    2: ["Lanzamiento de Conjuros", "Estilo de Combate", "Golpe Divino"],
    3: ["Salud Divina", "Juramento Sagrado"],
    4: ["Mejora de Características"],
    5: ["Ataque Adicional"],
    6: ["Aura de Protección"],
    7: ["Opción de Juramento"],
    8: ["Mejora de Características"],
    9: ["Aura de Valor"],
    10: ["Aura de Protección (mejorada)"],
    11: ["Golpe Divino (mejorado)"],
    12: ["Mejora de Características"],
    13: ["Opción de Juramento"],
    14: ["Toque Purificador"],
    15: ["Opción de Juramento"],
    16: ["Mejora de Características"],
    17: ["Aura de Valor (mejorada)"],
    18: ["Aura de Protección (mejorada)"],
    19: ["Mejora de Características"],
    20: ["Opción de Juramento"],
}

F['explorador'] = {
    1: ["Enemigo Favorito", "Explorador Natural"],
    2: ["Estilo de Combate", "Lanzamiento de Conjuros"],
    3: ["Arquetipo de Explorador", "Conciencia Primigenia"],
    4: ["Mejora de Características"],
    5: ["Ataque Adicional"],
    6: ["Enemigo Favorito (mejorado)", "Explorador Natural (mejorado)"],
    7: ["Opción de Arquetipo"],
    8: ["Mejora de Características", "Paso Firme"],
    9: ["Explorador Natural (mejorado)"],
    10: ["Camuflaje Natural", "Ocultarse a Plena Vista"],
    11: ["Opción de Arquetipo"],
    12: ["Mejora de Características"],
    13: ["Explorador Natural (mejorado)"],
    14: ["Enemigo Favorito (mejorado)", "Paso Firme"],
    15: ["Opción de Arquetipo"],
    16: ["Mejora de Características"],
    17: ["Explorador Natural (mejorado)"],
    18: ["Sentir el Peligro"],
    19: ["Mejora de Características"],
    20: ["Cazador Implacable"],
}

F['pícaro'] = {
    1: ["Pericia", "Ataque Sigiloso (1d6)", "Jerga de Ladrones"],
    2: ["Acción Astuta"],
    3: ["Arquetipo de Pícaro"],
    4: ["Mejora de Características"],
    5: ["Ataque Adicional", "Ataque Sigiloso (3d6)"],
    6: ["Pericia"],
    7: ["Evasión", "Ataque Sigiloso (4d6)"],
    8: ["Mejora de Características"],
    9: ["Ataque Sigiloso (5d6)"],
    10: ["Mejora de Características"],
    11: ["Ataque Sigiloso (6d6)"],
    12: ["Mejora de Características"],
    13: ["Ataque Sigiloso (7d6)"],
    14: ["Sentir el Peligro"],
    15: ["Mente Esquiva", "Ataque Sigiloso (8d6)"],
    16: ["Mejora de Características"],
    17: ["Ataque Sigiloso (9d6)"],
    18: ["Esquivar Asombroso"],
    19: ["Mejora de Características"],
    20: ["Golpe Mortal"],
}

F['hechicero'] = {
    1: ["Lanzamiento de Conjuros", "Origen Hechicero"],
    2: ["Fuente de Magia"],
    3: ["Metamagia"],
    4: ["Mejora de Características"],
    5: ["Metamagia (mejorada)"],
    6: ["Origen Hechicero"],
    7: ["Metamagia (mejorada)"],
    8: ["Mejora de Características"],
    9: ["Metamagia (mejorada)"],
    10: ["Metamagia"],
    11: ["Origen Hechicero"],
    12: ["Mejora de Características"],
    13: ["Metamagia (mejorada)"],
    14: ["Origen Hechicero"],
    15: ["Metamagia (mejorada)"],
    16: ["Mejora de Características"],
    17: ["Metamagia (mejorada)"],
    18: ["Origen Hechicero"],
    19: ["Mejora de Características"],
    20: ["Recuperación Hechicera"],
}

F['brujo'] = {
    1: ["Lanzamiento de Pacto", "Beneficio de Patrono"],
    2: ["Invocaciones Místicas"],
    3: ["Don del Patrono", "Beneficio de Patrono"],
    4: ["Mejora de Características"],
    5: ["Invocaciones Místicas"],
    6: ["Beneficio de Patrono"],
    7: ["Invocaciones Místicas"],
    8: ["Mejora de Características"],
    9: ["Invocaciones Místicas"],
    10: ["Beneficio de Patrono"],
    11: ["Arcano Místico (6º nivel)"],
    12: ["Mejora de Características"],
    13: ["Arcano Místico (7º nivel)"],
    14: ["Beneficio de Patrono"],
    15: ["Arcano Místico (8º nivel)"],
    16: ["Mejora de Características"],
    17: ["Arcano Místico (9º nivel)"],
    18: ["Invocaciones Místicas"],
    19: ["Mejora de Características"],
    20: ["Maestro del Pacto"],
}

F['mago'] = {
    1: ["Lanzamiento de Conjuros", "Recuperación Arcana"],
    2: ["Tradición Arcana"],
    3: ["Tradición Arcana"],
    4: ["Mejora de Características"],
    5: ["Tradición Arcana"],
    6: ["Tradición Arcana"],
    7: ["Tradición Arcana"],
    8: ["Mejora de Características"],
    9: ["Tradición Arcana"],
    10: ["Tradición Arcana"],
    11: ["Tradición Arcana"],
    12: ["Mejora de Características"],
    13: ["Tradición Arcana"],
    14: ["Tradición Arcana"],
    15: ["Tradición Arcana"],
    16: ["Mejora de Características"],
    17: ["Tradición Arcana"],
    18: ["Hechizos de Dominio"],
    19: ["Mejora de Características"],
    20: ["Hechizo Maestro"],
}

F['artífice'] = {
    1: ["Lanzamiento de Conjuros", "Infundir Objeto"],
    2: ["Infundir Objeto (mejorado)"],
    3: ["Especialista en Artilugios", "Herramientas del Oficio"],
    4: ["Mejora de Características"],
    5: ["Infundir Objeto (mejorado)"],
    6: ["Herramientas del Oficio (mejorado)"],
    7: ["Destello de Genio"],
    8: ["Mejora de Características"],
    9: ["Infundir Objeto (mejorado)"],
    10: ["Especialista en Artilugios"],
    11: ["Almacén de Hechizos"],
    12: ["Mejora de Características"],
    13: ["Infundir Objeto (mejorado)"],
    14: ["Especialista en Artilugios"],
    15: ["Infundir Objeto (mejorado)"],
    16: ["Mejora de Características"],
    17: ["Especialista en Artilugios"],
    18: ["Infundir Objeto (mejorado)"],
    19: ["Mejora de Características"],
    20: ["Alma de la Magia"],
}

# ──────────────────────────────────────────────
# CLASS CONFIG: (slots_fn, cantrip_map, spells_arr, prepared)
# ──────────────────────────────────────────────
CONFIG = {
    'bárbaro':    (None,        None,        None,    False),
    'bardo':      (full_slots,  C_BARDO,     SK_BARDO,     False),
    'clérigo':    (full_slots,  C_CLERIGO,   None,    True),
    'druida':     (full_slots,  C_DRUIDA,    None,    True),
    'guerrero':   (None,        None,        None,    False),
    'monje':      (None,        None,        None,    False),
    'paladín':    (half_slots,  None,        None,    True),
    'explorador': (half_slots,  None,        None,    True),
    'pícaro':     (None,        None,        None,    False),
    'hechicero':  (full_slots,  C_HECHICERO, SK_HECHICERO, False),
    'brujo':      (warlock_slots, C_BRUJO,   SK_BRUJO,     False),
    'mago':       (full_slots,  C_MAGO,      SK_MAGO,      False),
    'artífice':   (arti_slots,  C_ARTIFICE,  None,    True),
}

# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────
print("Clearing existing leveling_tables data...")
db.query(LevelingTable).delete()
db.commit()

total = 0
for class_name in sorted(CONFIG.keys()):
    slots_fn, cmap, sarr, prepared = CONFIG[class_name]
    for lvl in range(1, 21):
        sl = slots_fn(lvl) if slots_fn else "{}"
        ct = cantrip(cmap, lvl) if cmap else 0
        sk = spells_known(sarr, lvl, prepared) if sarr else ("0" if prepared else "{}")

        row = LevelingTable(
            class_name=class_name,
            level=lvl,
            proficiency_bonus=prof(lvl),
            features=json_features(F[class_name], lvl),
            spell_slots=sl,
            cantrips_known=ct,
            spells_known=sk,
        )
        db.add(row)
        total += 1

db.commit()
print(f"Inserted {total} rows (13 classes x 20 levels)")
db.close()
