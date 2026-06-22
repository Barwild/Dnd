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


def calculate_armor_class(character_stats: Dict, equipped_items: Dict, items_db: Dict) -> Dict:
    """
    Calcula la Clase de Armadura (CA) del personaje
    """
    dex_mod = (character_stats.get('DEX', 10) - 10) // 2
    ac = 10 + dex_mod
    armor_proficiency_issue = None
    # Aplicar armadura equipada
    armor_id = equipped_items.get('armor')
    if armor_id:
        armor = items_db.get(str(armor_id)) or items_db.get(armor_id)
        if armor and armor.armor_class_base:
            ac = armor.armor_class_base
            # Si es armadura pesada, no sumamos modificador de DES
            if is_heavy_armor(armor.name):
                pass
            # Si es armadura media, sumamos modificador de DES hasta un máximo de +2
            elif is_medium_armor(armor.name):
                ac += min(dex_mod, 2) if dex_mod > 0 else dex_mod
            # Si es armadura ligera, sumamos el modificador completo de DES
            else:
                ac += dex_mod
    
    # Aplicar escudo
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
    
    # Calcular CA
    ac_result = calculate_armor_class(base_stats, equipped_items, items_db)
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
    
    return {
        'armor_class': armor_class,
        'weapon_damage': weapon_damage,
        'equipment_slots': equipment_slots,
        'stealth_disadvantage': stealth_disadvantage,
        'armor_proficiency_issue': armor_proficiency_issue,
        'base_stats': base_stats,
        'equipped_items': equipped_items
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
