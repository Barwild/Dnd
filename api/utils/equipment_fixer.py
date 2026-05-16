import json
import re
from sqlalchemy.orm import Session
import models

# EN_TO_ES obsolete since we use name_en

def extract_coins(item_name):
    match = re.match(r'^(\d+)\s*(po|gp|sp|pp|cp|ep|pc|pp|pe)\s*$', str(item_name).strip().lower())
    if match:
        amount = int(match.group(1))
        unit = match.group(2)
        if unit in ['po', 'gp']: return amount, 'gp'
        if unit in ['pc', 'cp']: return amount, 'cp'
        if unit in ['pp', 'sp']: return amount, 'sp'
        if unit == 'pe': return amount, 'ep'
        return amount, 'gp'
    return None, None

def process_equipment_list(eq_list, stats_coins, item_by_name):
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
        # No translation needed, we check name_en directly now
            
        db_item = item_by_name.get(search_name)
        
        # Búsqueda difusa
        if not db_item:
            for n, it in item_by_name.items():
                if search_name in n or n in search_name:
                    db_item = it
                    break
                    
        if db_item:
            item["id"] = db_item.id
            item["name"] = db_item.name
            item["category"] = db_item.category
            
        new_list.append(item)
        
    return new_list, gold_added

def auto_equip_items(character, db: Session):
    """Auto-equipa armas/armaduras/escudos del equipo a sus ranuras."""
    try:
        seq = json.loads(character.starting_equipment) if character.starting_equipment else []
    except:
        seq = []
    try:
        cur_equipped = json.loads(character.equipped_items) if character.equipped_items else {}
    except:
        cur_equipped = {}
    if not cur_equipped:
        cur_equipped = {}
    changed = False
    # Load items dict for category lookup if items lack category
    for item in seq:
        item_id = item.get('id')
        if not item_id:
            continue
        cat = (item.get('category') or '').lower()
        name = (item.get('name') or '').lower()
        if not cat:
            db_item = db.query(models.Item).filter(models.Item.id == item_id).first()
            if db_item:
                cat = (db_item.category or '').lower()
        if any(w in name for w in ['escudo', 'shield']):
            if 'shield' not in cur_equipped:
                cur_equipped['shield'] = item_id
                changed = True
        elif cat in ('arma', 'weapon'):
            if 'weapon' not in cur_equipped:
                cur_equipped['weapon'] = item_id
                changed = True
        elif cat in ('armadura', 'armor') and 'armor' not in cur_equipped:
            cur_equipped['armor'] = item_id
            changed = True
    if changed:
        character.equipped_items = json.dumps(cur_equipped)
    return changed


def fix_character_equipment(character, db: Session):
    """
    Auto-repara el equipo del personaje si tiene items sin ID o monedas como texto.
    Retorna True si hizo cambios.
    """
    try:
        stats = json.loads(character.stats) if character.stats else {}
    except:
        stats = {}
        
    if "coins" not in stats:
        stats["coins"] = {"gp": 0, "sp": 0, "cp": 0}
        
    try:
        eq = json.loads(character.equipment) if character.equipment else []
        if not isinstance(eq, list): eq = []
    except:
        eq = []
        
    needs_fix = False
    
    # Check if needs fix (has string coins or missing IDs)
    for item in eq:
        if isinstance(item, str) or (isinstance(item, dict) and not item.get("id")):
            needs_fix = True
            break
            
    if not needs_fix:
        # Check if there's "po" in starting_equipment that wasn't extracted
        if "po" in str(character.starting_equipment).lower() or "gp" in str(character.starting_equipment).lower():
            needs_fix = True
            
    if not needs_fix:
        # Still try to auto-equip even if no fix needed
        eq_changed = auto_equip_items(character, db)
        if eq_changed:
            db.commit()
        return eq_changed
        
    # Cargar diccionario de items para la búsqueda
    all_items = db.query(models.Item).all()
    item_by_name = {}
    for item in all_items:
        if item.name:
            item_by_name[item.name.lower()] = item
        if item.name_en:
            item_by_name[item.name_en.lower()] = item
        if item.index:
            item_by_name[item.index.replace('-', ' ').lower()] = item
            item_by_name[item.index.lower()] = item
    
    try:
        seq = json.loads(character.starting_equipment) if character.starting_equipment else []
        if not isinstance(seq, list): seq = []
    except:
        seq = []
        
    new_eq, gold1 = process_equipment_list(eq, stats["coins"], item_by_name)
    dummy_coins = {}
    new_seq, gold2 = process_equipment_list(seq, dummy_coins, item_by_name)
    
    # Eliminar duplicados
    seen = set()
    deduped_eq = []
    for item in new_eq:
        identifier = f"{item.get('id', '')}_{item.get('name', '')}"
        if identifier not in seen:
            seen.add(identifier)
            deduped_eq.append(item)
            
    character.stats = json.dumps(stats)
    character.equipment = json.dumps(deduped_eq)
    character.starting_equipment = json.dumps(new_seq)
    # Auto-equip ahora que los items tienen IDs
    auto_equip_items(character, db)

    from utils.equipment_calculator import calculate_character_stats
    new_calc_stats = calculate_character_stats(character, db)
    character.calculated_stats = json.dumps(new_calc_stats)
    
    db.commit()
    return True
