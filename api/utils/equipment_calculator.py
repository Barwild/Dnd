"""
Utilidades para calcular estadísticas de equipo (armaduras y armas)
"""

import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session


def calculate_armor_class(character_stats: Dict, equipped_items: Dict, items_db: Dict) -> int:
    """
    Calcula la Clase de Armadura (CA) del personaje
    
    Args:
        character_stats: Estadísticas base del personaje
        equipped_items: Items equipados
        items_db: Base de datos de items
    
    Returns:
        int: Clase de Armadura calculada
    """
    # CA base = 10 + modificador de DEX
    dex_mod = (character_stats.get('DEX', 10) - 10) // 2
    ac = 10 + dex_mod
    
    # Aplicar armadura equipada
    armor_id = equipped_items.get('armor')
    if armor_id and str(armor_id) in items_db:
        armor = items_db[str(armor_id)]
        if armor.armor_class_base:
            ac = armor.armor_class_base
            
            # Aplicar bonificación de DEX si la armadura lo permite
            if armor.armor_class_dex_bonus:
                max_dex = 2 if armor.category == 'Medium Armor' else None
                if max_dex is not None:
                    ac += min(dex_mod, max_dex)
                else:
                    ac += dex_mod
    
    # Aplicar escudo
    shield_id = equipped_items.get('shield')
    if shield_id and str(shield_id) in items_db:
        shield = items_db[str(shield_id)]
        if shield.armor_class_base:
            ac += shield.armor_class_base
    
    return ac


def calculate_weapon_damage(weapon_id: int, items_db: Dict) -> Dict[str, Any]:
    """
    Calcula el daño de un arma
    
    Args:
        weapon_id: ID del arma
        items_db: Base de datos de items
    
    Returns:
        Dict: Información del daño
    """
    if str(weapon_id) not in items_db:
        return {"damage_dice": "", "damage_type": "", "name": "Unknown"}
    
    weapon = items_db[str(weapon_id)]
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
        if str(item_id) in items_db:
            item = items_db[str(item_id)]
            slots[slot] = {
                'id': item.id,
                'name': item.name,
                'category': item.category,
                'cost': f"{item.cost_quantity} {item.cost_unit}",
                'weight': item.weight,
                'description': item.description
            }
            
            # Añadir propiedades específicas de armas y armaduras
            if item.category in ['Weapon', 'Armor']:
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
    # Parsear estadísticas base
    base_stats = json.loads(character.stats) if character.stats else {}
    equipped_items = json.loads(character.equipped_items) if character.equipped_items else {}
    
    # Obtener todos los items del personaje
    from models import Item
    character_items = db.query(Item).filter(
        Item.id.in_([item['id'] for item in json.loads(character.equipment) if 'id' in item])
    ).all()
    items_db = {str(item.id): item for item in character_items}
    
    # Calcular CA
    armor_class = calculate_armor_class(base_stats, equipped_items, items_db)
    
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
    if armor_id and str(armor_id) in items_db:
        armor = items_db[str(armor_id)]
        stealth_disadvantage = armor.stealth_disadvantage
    
    return {
        'armor_class': armor_class,
        'weapon_damage': weapon_damage,
        'equipment_slots': equipment_slots,
        'stealth_disadvantage': stealth_disadvantage,
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
    item = db.query(Item).filter(Item.id == item_id).first()
    
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
        'armor': ['Armor'],
        'shield': ['Armor'],  # Escudos se consideran armadura
        'weapon': ['Weapon'],
        'offhand': ['Weapon', 'Tool'],
        'head': ['Armor', 'Wondrous Item'],
        'chest': ['Armor', 'Wondrous Item'],
        'hands': ['Armor', 'Tool', 'Wondrous Item'],
        'feet': ['Armor', 'Wondrous Item'],
        'ring1': ['Ring', 'Wondrous Item'],
        'ring2': ['Ring', 'Wondrous Item'],
        'neck': ['Wondrous Item', 'Amulet'],
        'waist': ['Wondrous Item', 'Belt']
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
