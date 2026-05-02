import json
import re
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Añadir el path padre para poder importar
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from models import Character, Item

Session = sessionmaker(bind=engine)
db = Session()

# Mapeo manual de nombres en inglés/español a sus IDs (basado en la BD)
# Para evitar muchas queries, cargamos todos los items
all_items = db.query(Item).all()
item_by_name = {item.name.lower(): item for item in all_items}
item_by_en_name = {}

# Mapeo manual de cosas comunes en inglés que aparecen en las clases
EN_TO_ES = {
    "dagger": "daga",
    "leather armor": "armadura de cuero",
    "chain mail": "cota de mallas",
    "explorer's pack": "paquete de explorador",
    "thieves' tools": "herramientas de ladrón",
    "longbow": "arco largo",
    "arrow": "flechas (20)",
    "javelin": "jabalina",
    "shield": "escudo",
    "dart": "dardo",
    "spellbook": "libro de conjuros",
    "rapier": "estoque",
    "shortsword": "espada corta",
    "shortbow": "arco corto",
    "scale mail": "cota de escamas",
    "handaxe": "hacha de mano",
    "light crossbow": "ballesta ligera",
    "mace": "maza",
    "warhammer": "martillo de guerra",
    "chain shirt": "camisote de mallas",
    "holy symbol": "símbolo sagrado"
}

def extract_coins(item_name):
    # Detecta si el item es dinero como "15 po", "10 gp", "5 pp"
    match = re.match(r'^(\d+)\s*(po|gp|sp|pp|cp|ep|pc|pp|pe)\s*$', str(item_name).strip().lower())
    if match:
        amount = int(match.group(1))
        unit = match.group(2)
        # Convertir a formato del juego (gp, sp, cp, ep, pp)
        if unit in ['po', 'gp']: return amount, 'gp'
        if unit in ['pc', 'cp']: return amount, 'cp'
        if unit in ['pp', 'sp']: return amount, 'sp' # Plata
        if unit == 'pe': return amount, 'ep' # Electro
        return amount, 'gp' # Fallback
    return None, None

def process_equipment_list(eq_list, stats_coins):
    new_list = []
    gold_added = 0
    for item in eq_list:
        if not isinstance(item, dict):
            item = {"name": str(item)}
            
        name = item.get("name", "")
        if not name:
            continue
            
        # 1. Chequear si es oro
        amount, unit = extract_coins(name)
        if amount is not None:
            if unit not in stats_coins:
                stats_coins[unit] = 0
            stats_coins[unit] += amount
            gold_added += amount
            continue
            
        # 2. Si ya tiene ID válido, dejarlo
        if "id" in item and item["id"]:
            new_list.append(item)
            continue
            
        # 3. Tratar de buscar el ID
        search_name = name.lower().strip()
        # Si está en inglés, traducirlo
        if search_name in EN_TO_ES:
            search_name = EN_TO_ES[search_name]
            
        db_item = item_by_name.get(search_name)
        
        # Búsqueda difusa si no se encontró
        if not db_item:
            for n, it in item_by_name.items():
                if search_name in n or n in search_name:
                    db_item = it
                    break
                    
        if db_item:
            # Enriquecer el item con el ID real
            item["id"] = db_item.id
            item["name"] = db_item.name
            item["category"] = db_item.category
            
            # Si era Dagger y ahora es Daga, y tenía quantity, preservarla
            
        new_list.append(item)
        
    return new_list, gold_added

characters = db.query(Character).all()
for char in characters:
    print(f"Procesando: {char.name} (ID: {char.id})")
    
    # Parsear stats
    try:
        stats = json.loads(char.stats) if char.stats else {}
    except:
        stats = {}
    
    if "coins" not in stats:
        stats["coins"] = {"gp": 0, "sp": 0, "cp": 0}
        
    # Parsear equipo
    try:
        eq = json.loads(char.equipment) if char.equipment else []
        if not isinstance(eq, list): eq = []
    except:
        eq = []
        
    try:
        seq = json.loads(char.starting_equipment) if char.starting_equipment else []
        if not isinstance(seq, list): seq = []
    except:
        seq = []
        
    # Procesar
    new_eq, gold1 = process_equipment_list(eq, stats["coins"])
    new_seq, gold2 = process_equipment_list(seq, stats["coins"])
    
    # Solo procesamos uno de los dos si son iguales o se solapan
    # Para simplificar, el equipo principal es el que manda
    
    # Eliminar duplicados en eq (ej: si tiene Dagger y Daga)
    seen = set()
    deduped_eq = []
    for item in new_eq:
        identifier = f"{item.get('id', '')}_{item.get('name', '')}"
        if identifier not in seen:
            seen.add(identifier)
            deduped_eq.append(item)
            
    # Guardar
    char.stats = json.dumps(stats)
    char.equipment = json.dumps(deduped_eq)
    char.starting_equipment = json.dumps(new_seq)
    
    # Recalcular calculated_stats para asegurar que la CA base funcione
    from utils.equipment_calculator import calculate_character_stats
    new_calc_stats = calculate_character_stats(char, db)
    char.calculated_stats = json.dumps(new_calc_stats)
    
    print(f"  -> Añadido {gold1}gp al monedero. Equipo limpio: {len(deduped_eq)} items.")

db.commit()
print("¡Migración de equipo completada!")
