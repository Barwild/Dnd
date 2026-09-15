"""
Utilidades para calcular estadísticas de equipo (armaduras y armas)
"""

import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session


def is_medium_armor(name: str) -> bool:
    if not name:
        return False
    name_low = name.lower()
    # Spanish keywords
    if any(k in name_low for k in ['pieles', 'camisote', 'escamas', 'coraza', 'media armadura']):
        return True
    # English keywords
    if any(k in name_low for k in ['hide', 'chain shirt', 'scale mail', 'breastplate', 'half plate']):
        return True
    return False


def is_heavy_armor(name: str) -> bool:
    if not name:
        return False
    name_low = name.lower()
    # Spanish keywords
    if any(k in name_low for k in ['anillas', 'cota de mallas', 'bandas', 'armadura de placas', 'placas completas']):
        return True
    # English keywords
    if any(k in name_low for k in ['ring mail', 'chain mail', 'splint', 'plate']):
        return True
    return False


def check_armor_proficiency(character, equipped_items: dict, items_db: dict, db: Session) -> Optional[str]:
    # 1. Obtener la clase del personaje
    from models import Class
    cls = db.query(Class).filter(Class.id == character.class_id).first()
    if not cls:
        return None
    
    try:
        class_profs = json.loads(cls.proficiencies or '[]')
    except Exception:
        class_profs = []
        
    class_name = cls.name.lower()
    
    # 2. Extraer competencias de armadura (normalizadas)
    has_light = any(x in ["light armor", "all armor", "armadura ligera", "todas las armaduras"] for x in [p.lower() for p in class_profs])
    has_medium = any(x in ["medium armor", "all armor", "armadura media", "todas las armaduras"] for x in [p.lower() for p in class_profs])
    has_heavy = any(x in ["all armor", "armadura pesada", "todas las armaduras"] for x in [p.lower() for p in class_profs])
    has_shields = any(x in ["shields", "escudos"] for x in [p.lower() for p in class_profs])
    
    # Soporte especial para Artífice
    if "artifice" in class_name or "artífice" in class_name:
        has_light = True
        has_medium = True
        has_shields = True
        
    # Verificar competencias otorgadas por la subclase/dominio (ej. clérigos de Vida, Forja, Guerra, etc.)
    if character.subclass_id:
        from models import Subclass
        subclass = db.query(Subclass).filter(Subclass.id == character.subclass_id).first()
        if subclass:
            sc_name = subclass.name.lower()
            if any(domain in sc_name for domain in ["vida", "guerra", "tempestad", "forja", "crepúsculo", "life", "war", "tempest", "forge", "twilight"]):
                has_heavy = True
            if any(sc in sc_name for sc in ["valor", "swords", "espadas"]):
                has_medium = True
                has_shields = True
                
    # 3. Comprobar armadura equipada
    armor_id = equipped_items.get('armor')
    if armor_id:
        armor = items_db.get(str(armor_id)) or items_db.get(armor_id)
        if armor and armor.armor_class_base and armor.category in ['Armor', 'Armadura']:
            if is_heavy_armor(armor.name):
                if not has_heavy:
                    return f"No tienes competencia con armaduras pesadas ({armor.name}). Tienes desventaja en tiradas de Fuerza/Destreza y no puedes lanzar conjuros."
            elif is_medium_armor(armor.name):
                if not has_medium:
                    return f"No tienes competencia con armaduras medias ({armor.name}). Tienes desventaja en tiradas de Fuerza/Destreza y no puedes lanzar conjuros."
            else:
                # Light Armor
                if not has_light:
                    return f"No tienes competencia con armaduras ligeras ({armor.name}). Tienes desventaja en tiradas de Fuerza/Destreza y no puedes lanzar conjuros."
                    
    # 4. Comprobar escudo equipado
    shield_id = equipped_items.get('shield')
    if shield_id:
        shield = items_db.get(str(shield_id)) or items_db.get(shield_id)
        if shield and (shield.category in ['Shield', 'Escudo'] or 'escudo' in shield.name.lower() or 'shield' in shield.name.lower()):
            if not has_shields:
                return f"No tienes competencia con escudos ({shield.name}). Tienes desventaja en tiradas de Fuerza/Destreza y no puedes lanzar conjuros."
                
    return None


def calculate_armor_class(character_stats: Dict, equipped_items: Dict, items_db: Dict, class_index: str = "", subclass_index: str = "") -> Dict:
    """
    Calcula la Clase de Armadura (CA) del personaje según PHB Cap. 5
    Incluye: Armaduras, Escudos, Defensa sin Armadura, Armadura Natural, Resistencia Dracónica
    """
    dex_mod = (character_stats.get('DEX', 10) - 10) // 2
    con_mod = (character_stats.get('CON', 10) - 10) // 2
    wis_mod = (character_stats.get('WIS', 10) - 10) // 2
    
    armor_proficiency_issue = None
    has_armor = False
    ac = 10 + dex_mod  # Base sin armadura
    
    # Aplicar armadura equipada
    armor_id = equipped_items.get('armor')
    if armor_id:
        armor = items_db.get(str(armor_id)) or items_db.get(armor_id)
        if armor and armor.armor_class_base:
            has_armor = True
            ac = armor.armor_class_base
            # Armadura pesada: no suma DEX
            if is_heavy_armor(armor.name):
                pass
            # Armadura media: DEX hasta máximo +2
            elif is_medium_armor(armor.name):
                ac += min(dex_mod, 2)
            # Armadura ligera: DEX completo
            else:
                ac += dex_mod
    
    # Si NO lleva armadura, aplicar Defensa sin Armadura según clase (PHB)
    if not has_armor:
        cls = class_index.lower().strip() if class_index else ""
        if cls in ["barbarian", "bárbaro"]:
            # Bárbaro PHB p.48: 10 + DEX mod + CON mod
            unarmored_ac = 10 + dex_mod + con_mod
            ac = max(ac, unarmored_ac)
        elif cls in ["monk", "monje"]:
            # Monje PHB p.78: 10 + DEX mod + WIS mod
            unarmored_ac = 10 + dex_mod + wis_mod
            ac = max(ac, unarmored_ac)
        
        # Resistencia Dracónica (Hechicero - Linaje Dracónico)
        sc = subclass_index.lower().strip() if subclass_index else ""
        if cls in ["sorcerer", "hechicero"] and any(k in sc for k in ["draconic", "dracónico", "draconico", "dragon"]):
            # PHB p.102: 13 + DEX mod
            draconic_ac = 13 + dex_mod
            ac = max(ac, draconic_ac)
    
    # Aplicar escudo (+2 CA por PHB)
    shield_id = equipped_items.get('shield')
    if shield_id:
        shield = items_db.get(str(shield_id)) or items_db.get(shield_id)
        if shield and shield.armor_class_base:
            ac += shield.armor_class_base
    
    return {'ac': ac, 'armor_proficiency_issue': armor_proficiency_issue}


def calculate_weapon_damage(weapon_id: int, items_db: Dict) -> Dict[str, Any]:
    """
    Calcula el daño de un arma
    
    Args:
        weapon_id: ID del arma
        items_db: Base de datos de items
    
    Returns:
        Dict: Información del daño
    """
    weapon = items_db.get(str(weapon_id)) or items_db.get(weapon_id)
    if not weapon:
        return {"damage_dice": "", "damage_type": "", "name": "Unknown"}
    
    return {
        "damage_dice": weapon.damage_dice or "",
        "damage_type": weapon.damage_type or "",
        "name": weapon.name,
        "range": weapon.weapon_range or "",
        "properties": json.loads(weapon.properties) if weapon.properties else []
    }


def get_equipment_by_slot(equipped_items: Dict, items_db: Dict) -> Dict[str, Any]:
    """
    Organiza el equipo equipado por ranuras
    
    Args:
        equipped_items: Items equipados
        items_db: Base de datos de items
    
    Returns:
        Dict: Equipamiento organizado por ranuras
    """
    slots = {
        'armor': None,
        'shield': None,
        'weapon': None,
        'offhand': None,
        'head': None,
        'chest': None,
        'hands': None,
        'feet': None,
        'ring1': None,
        'ring2': None,
        'neck': None,
        'waist': None
    }
    
    for slot, item_id in equipped_items.items():
        if item_id:
            item = items_db.get(str(item_id)) or items_db.get(item_id)
            if item:
                slots[slot] = {
                    'id': item.id,
                    'name': item.name,
                    'category': item.category,
                    'cost': f"{item.cost_quantity} {item.cost_unit}",
                    'weight': item.weight,
                    'description': item.description
                }
                
                # Añadir propiedades específicas de armas y armaduras
                if item.category in ['Weapon', 'Arma', 'Armor', 'Armadura', 'Shield', 'Escudo']:
                    slots[slot].update({
                        'damage_dice': item.damage_dice,
                        'damage_type': item.damage_type,
                        'weapon_range': item.weapon_range,
                        'armor_class_base': item.armor_class_base,
                        'armor_class_dex_bonus': item.armor_class_dex_bonus,
                        'stealth_disadvantage': item.stealth_disadvantage,
                        'properties': json.loads(item.properties) if item.properties else []
                    })
    
    return slots


def calculate_character_stats(character, db: Session) -> Dict[str, Any]:
    """
    Calcula todas las estadísticas del personaje incluyendo equipo
    
    Args:
        character: Objeto Character
        db: Sesión de base de datos
    
    Returns:
        Dict: Estadísticas calculadas
    """
    # Parsear estadísticas base de forma segura
    try:
        base_stats = json.loads(character.stats) if character.stats else {}
    except Exception:
        base_stats = {}
        
    try:
        equipped_items = json.loads(character.equipped_items) if character.equipped_items else {}
    except Exception:
        equipped_items = {}
        
    try:
        equip_list = json.loads(character.equipment) if character.equipment else []
        if not isinstance(equip_list, list):
            equip_list = []
    except Exception:
        equip_list = []
    
    # Obtener todos los IDs y indexes de items de la lista de equipo y de ranuras equipadas
    int_ids = []
    str_indexes = []
    
    for item in equip_list:
        if isinstance(item, dict):
            i_id = item.get('id')
            if i_id:
                if isinstance(i_id, int) or (isinstance(i_id, str) and i_id.isdigit()):
                    int_ids.append(int(i_id))
                else:
                    str_indexes.append(str(i_id))
            idx = item.get('item_index') or item.get('index')
            if idx:
                str_indexes.append(str(idx))
                
    for slot, item_id in equipped_items.items():
        if item_id:
            if isinstance(item_id, int) or (isinstance(item_id, str) and item_id.isdigit()):
                int_ids.append(int(item_id))
            else:
                str_indexes.append(str(item_id))
            
    # Obtener todos los items de la base de datos
    from models import Item
    from sqlalchemy import or_
    
    query_filters = []
    if int_ids:
        query_filters.append(Item.id.in_(int_ids))
    if str_indexes:
        query_filters.append(Item.index.in_(str_indexes))
        
    character_items = []
    if query_filters:
        character_items = db.query(Item).filter(or_(*query_filters)).all()
        
    items_db = {}
    for item in character_items:
        items_db[str(item.id)] = item
        items_db[item.id] = item
        if item.index:
            items_db[item.index] = item
    
    class_index = ""
    if getattr(character, "class_id", None):
        from models import Class
        cls = db.query(Class).filter(Class.id == character.class_id).first()
        if cls:
            class_index = cls.index
            
    subclass_index = ""
    if getattr(character, "subclass_id", None):
        from models import Subclass
        subclass = db.query(Subclass).filter(Subclass.id == character.subclass_id).first()
        if subclass:
            subclass_index = subclass.index

    # Calcular CA
    ac_result = calculate_armor_class(base_stats, equipped_items, items_db, class_index, subclass_index)
    armor_class = ac_result['ac']
    
    # Calcular daño del arma principal
    weapon_damage = None
    weapon_id = equipped_items.get('weapon')
    if weapon_id:
        weapon_damage = calculate_weapon_damage(weapon_id, items_db)
    
    # Organizar equipo por ranuras
    equipment_slots = get_equipment_by_slot(equipped_items, items_db)
    
    # Detectar penalizaciones
    stealth_disadvantage = False
    armor_id = equipped_items.get('armor')
    if armor_id:
        armor = items_db.get(str(armor_id)) or items_db.get(armor_id)
        if armor:
            stealth_disadvantage = armor.stealth_disadvantage
    
    armor_proficiency_issue = check_armor_proficiency(character, equipped_items, items_db, db)
    
    # Calcular peso total del equipo y capacidad de carga (PHB p.176)
    total_weight = 0.0
    for item in character_items:
        try:
            w = float(item.weight) if item.weight else 0.0
        except (ValueError, TypeError):
            w = 0.0
        # Contar cantidad si está en la lista de equipo
        count = 1
        for eq in equip_list:
            if isinstance(eq, dict):
                eq_id = eq.get('id') or eq.get('item_index') or eq.get('index')
                if str(eq_id) == str(item.id) or str(eq_id) == item.index:
                    count = eq.get('quantity', 1)
                    break
        total_weight += w * count
    
    str_score = base_stats.get('STR', 10)
    carrying_capacity = str_score * 15  # PHB p.176
    encumbered_threshold = str_score * 5  # Velocidad -10 pies (variante)
    heavily_encumbered_threshold = str_score * 10  # Velocidad -20 pies, desventaja (variante)
    
    encumbrance_status = "normal"
    if total_weight > carrying_capacity:
        encumbrance_status = "over_capacity"
    elif total_weight > heavily_encumbered_threshold:
        encumbrance_status = "heavily_encumbered"
    elif total_weight > encumbered_threshold:
        encumbrance_status = "encumbered"

    return {
        'armor_class': armor_class,
        'weapon_damage': weapon_damage,
        'equipment_slots': equipment_slots,
        'stealth_disadvantage': stealth_disadvantage,
        'armor_proficiency_issue': armor_proficiency_issue,
        'base_stats': base_stats,
        'equipped_items': equipped_items,
        'total_weight': round(total_weight, 1),
        'carrying_capacity': carrying_capacity,
        'encumbrance_status': encumbrance_status,
    }


def apply_equipment_to_character(character_id: int, item_id: int, slot: str, db: Session) -> Dict[str, Any]:
    """
    Aplica un item a una ranura específica del personaje
    
    Args:
        character_id: ID del personaje
        item_id: ID del item
        slot: Ranura donde equipar (armor, weapon, shield, etc.)
        db: Sesión de base de datos
    
    Returns:
        Dict: Resultado de la operación
    """
    from models import Character, Item
    
    # Obtener personaje y item
    character = db.query(Character).filter(Character.id == character_id).first()
    if isinstance(item_id, int) or (isinstance(item_id, str) and item_id.isdigit()):
        item = db.query(Item).filter(Item.id == int(item_id)).first()
    else:
        item = db.query(Item).filter(Item.index == str(item_id)).first()
    
    if not character or not item:
        return {"success": False, "error": "Personaje o item no encontrado"}
    
    # Validar que el item pueda ir en esa ranura
    if not can_equip_in_slot(item, slot):
        return {"success": False, "error": f"Este item no puede equiparse en la ranura {slot}"}
    
    # Actualizar items equipados
    equipped_items = json.loads(character.equipped_items) if character.equipped_items else {}
    equipped_items[slot] = item_id
    
    character.equipped_items = json.dumps(equipped_items)
    
    # Calcular nuevas estadísticas
    new_stats = calculate_character_stats(character, db)
    character.calculated_stats = json.dumps(new_stats)
    
    db.commit()
    
    return {
        "success": True,
        "new_stats": new_stats,
        "equipped_item": {
            "id": item.id,
            "name": item.name,
            "slot": slot
        }
    }


def can_equip_in_slot(item, slot: str) -> bool:
    """
    Verifica si un item puede equiparse en una ranura específica
    
    Args:
        item: Objeto Item
        slot: Ranura de equipamiento
    
    Returns:
        bool: True si puede equiparse
    """
    slot_rules = {
        'armor': ['Armor', 'Armadura'],
        'shield': ['Armor', 'Armadura', 'Shield', 'Escudo'],
        'weapon': ['Weapon', 'Arma'],
        'offhand': ['Weapon', 'Arma', 'Tool', 'Herramienta', 'Shield', 'Escudo'],
        'head': ['Armor', 'Armadura', 'Wondrous Item', 'Objeto Maravilloso'],
        'chest': ['Armor', 'Armadura', 'Wondrous Item', 'Objeto Maravilloso'],
        'hands': ['Armor', 'Armadura', 'Tool', 'Herramienta', 'Wondrous Item', 'Objeto Maravilloso'],
        'feet': ['Armor', 'Armadura', 'Wondrous Item', 'Objeto Maravilloso'],
        'ring1': ['Ring', 'Anillo', 'Wondrous Item', 'Objeto Maravilloso'],
        'ring2': ['Ring', 'Anillo', 'Wondrous Item', 'Objeto Maravilloso'],
        'neck': ['Wondrous Item', 'Objeto Maravilloso', 'Amulet', 'Amuleto'],
        'waist': ['Wondrous Item', 'Objeto Maravilloso', 'Belt', 'Cinturón']
    }
    
    valid_categories = slot_rules.get(slot, [])
    return item.category in valid_categories


def remove_equipment_from_character(character_id: int, slot: str, db: Session) -> Dict[str, Any]:
    """
    Remueve un item de una ranura del personaje
    
    Args:
        character_id: ID del personaje
        slot: Ranura a liberar
        db: Sesión de base de datos
    
    Returns:
        Dict: Resultado de la operación
    """
    from models import Character
    
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        return {"success": False, "error": "Personaje no encontrado"}
    
    equipped_items = json.loads(character.equipped_items) if character.equipped_items else {}
    
    if slot not in equipped_items:
        return {"success": False, "error": "No hay ningún item equipado en esa ranura"}
    
    removed_item_id = equipped_items.pop(slot)
    character.equipped_items = json.dumps(equipped_items)
    
    # Recalcular estadísticas
    new_stats = calculate_character_stats(character, db)
    character.calculated_stats = json.dumps(new_stats)
    
    db.commit()
    
    return {
        "success": True,
        "new_stats": new_stats,
        "removed_item_id": removed_item_id,
        "slot": slot
    }
