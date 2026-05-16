from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/characters", tags=["characters"])


@router.post("", response_model=schemas.CharacterResponse)
def create_character(data: schemas.CharacterCreate, db: Session = Depends(get_db),
                     current_user: models.User = Depends(get_current_user)):
    """Crear un nuevo personaje."""
    character = models.Character(
        name=data.name.strip(),
        level=data.level,
        race_id=data.race_id,
        class_id=data.class_id,
        subclass_id=data.subclass_id,
        background_id=data.background_id,
        campaign_id=data.campaign_id,
        user_id=current_user.id,
        stats=data.stats,
        equipment=data.equipment,
        starting_equipment=data.starting_equipment or data.equipment,
        equipped_items=data.equipped_items,
        spell_list=data.spell_list,
        notes=data.notes,
        portrait_url=data.portrait_url
    )
    db.add(character)
    db.commit()
    db.refresh(character)
    
    try:
        from utils.equipment_fixer import fix_character_equipment
        fix_character_equipment(character, db)
    except Exception as e:
        print("Error fixing equipment on creation:", e)
        
    return _char_response(character, db)


@router.get("", response_model=List[schemas.CharacterResponse])
def get_characters(campaign_id: int = None, db: Session = Depends(get_db),
                   current_user: models.User = Depends(get_current_user)):
    """Obtener personajes. Si campaign_id se pasa, el DM ve todos, jugadores ven los suyos."""
    q = db.query(models.Character)
    if campaign_id is not None:
        q = q.filter(models.Character.campaign_id == campaign_id)
        # Check if user is DM of this campaign
        campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
        is_dm = campaign and campaign.dm_user_id == current_user.id
        if not is_dm:
            q = q.filter(models.Character.user_id == current_user.id)
    else:
        # Only show user's own characters when not filtering by campaign
        q = q.filter(models.Character.user_id == current_user.id)
    
    characters = q.all()
    return [_char_response(c, db) for c in characters]


@router.get("/{char_id}", response_model=schemas.CharacterResponse)
def get_character(char_id: int, db: Session = Depends(get_db),
                  current_user: models.User = Depends(get_current_user)):
    character = db.query(models.Character).filter(models.Character.id == char_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Personaje no encontrado")
        
    try:
        from utils.equipment_fixer import fix_character_equipment
        fix_character_equipment(character, db)
    except Exception as e:
        print("Error fixing equipment:", e)
        
    return _char_response(character, db)


@router.put("/{char_id}", response_model=schemas.CharacterResponse)
def update_character(char_id: int, data: schemas.CharacterUpdate, db: Session = Depends(get_db),
                     current_user: models.User = Depends(get_current_user)):
    character = db.query(models.Character).filter(models.Character.id == char_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Personaje no encontrado")
    
    # Allow owner or campaign DM to edit
    is_owner = character.user_id == current_user.id
    is_dm = False
    if character.campaign_id:
        campaign = db.query(models.Campaign).filter(models.Campaign.id == character.campaign_id).first()
        is_dm = campaign and campaign.dm_user_id == current_user.id
    
    if not is_owner and not is_dm:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar este personaje")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(character, key, value)
    
    db.commit()
    db.refresh(character)
    
    try:
        from utils.equipment_fixer import fix_character_equipment
        fix_character_equipment(character, db)
    except Exception as e:
        print("Error fixing equipment on update:", e)
    
    return _char_response(character, db)


@router.delete("/{char_id}")
def delete_character(char_id: int, db: Session = Depends(get_db),
                     current_user: models.User = Depends(get_current_user)):
    character = db.query(models.Character).filter(models.Character.id == char_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Personaje no encontrado")
        
    is_owner = character.user_id == current_user.id
    is_dm = False
    if character.campaign_id:
        campaign = db.query(models.Campaign).filter(models.Campaign.id == character.campaign_id).first()
        is_dm = campaign and campaign.dm_user_id == current_user.id
        
    if not is_owner and not is_dm:
        raise HTTPException(status_code=403, detail="Solo el dueño o el DM pueden eliminar el personaje")
        
    db.delete(character)
    db.commit()
    return {"message": "Personaje eliminado"}


def _char_response(char, db):
    owner = db.query(models.User).filter(models.User.id == char.user_id).first()
    race = db.query(models.Race).filter(models.Race.id == char.race_id).first()
    cls = db.query(models.Class).filter(models.Class.id == char.class_id).first()
    return schemas.CharacterResponse(
        id=char.id, name=char.name, level=char.level,
        race_id=char.race_id, class_id=char.class_id,
        subclass_id=char.subclass_id, background_id=char.background_id,
        campaign_id=char.campaign_id, user_id=char.user_id,
        stats=char.stats, equipment=char.equipment,
        starting_equipment=char.starting_equipment,
        equipped_items=char.equipped_items or "{}",
        spell_list=char.spell_list, notes=char.notes,
        portrait_url=char.portrait_url, created_at=char.created_at,
        owner_name=owner.display_name if owner else "",
        race_name=race.name if race else "",
        class_name=cls.name if cls else ""
    )


@router.get("/{character_id}/equipment")
def get_character_equipment(character_id: int, db: Session = Depends(get_db)):
    """Obtener equipo y estadísticas calculadas del personaje"""
    from utils.equipment_calculator import calculate_character_stats
    
    character = db.query(models.Character).filter(models.Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Personaje no encontrado")
    
    stats = calculate_character_stats(character, db)
    return {
        "character": {
            "id": character.id,
            "name": character.name,
            "level": character.level
        },
        "equipment_stats": stats
    }


@router.post("/{character_id}/equipment/equip")
def equip_item(character_id: int, request: dict, db: Session = Depends(get_db)):
    """Equipar un item al personaje"""
    from utils.equipment_calculator import apply_equipment_to_character
    
    item_id = request.get("item_id")
    slot = request.get("slot")
    
    if not item_id or not slot:
        raise HTTPException(status_code=400, detail="Se requieren item_id y slot")
    
    result = apply_equipment_to_character(character_id, item_id, slot, db)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/{character_id}/equipment/unequip")
def unequip_item(character_id: int, request: dict, db: Session = Depends(get_db)):
    """Desequipar un item del personaje"""
    from utils.equipment_calculator import remove_equipment_from_character
    
    slot = request.get("slot")
    
    if not slot:
        raise HTTPException(status_code=400, detail="Se requiere slot")
    
    result = remove_equipment_from_character(character_id, slot, db)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/{character_id}/weapons")
def get_character_weapons(character_id: int, db: Session = Depends(get_db)):
    """Obtener armas disponibles del personaje"""
    import json
    
    character = db.query(models.Character).filter(models.Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Personaje no encontrado")
    
    # Obtener items del personaje que son armas
    equipment = json.loads(character.equipment) if character.equipment else []
    weapon_ids = [item.get('id') for item in equipment if item.get('id')]
    
    if weapon_ids:
        weapons = db.query(models.Item).filter(
            models.Item.id.in_(weapon_ids),
            models.Item.category.in_(['Weapon', 'Arma'])
        ).all()
        return [ {
            "id": weapon.id,
            "name": weapon.name,
            "damage_dice": weapon.damage_dice,
            "damage_type": weapon.damage_type,
            "weapon_range": weapon.weapon_range,
            "properties": json.loads(weapon.properties) if weapon.properties else [],
            "cost": f"{weapon.cost_quantity} {weapon.cost_unit}",
            "weight": weapon.weight,
            "description": weapon.description
        } for weapon in weapons ]
    
    return []


@router.get("/{character_id}/armor")
def get_character_armor(character_id: int, db: Session = Depends(get_db)):
    """Obtener armaduras disponibles del personaje"""
    import json
    
    character = db.query(models.Character).filter(models.Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Personaje no encontrado")
    
    # Obtener items del personaje que son armaduras
    equipment = json.loads(character.equipment) if character.equipment else []
    armor_ids = [item.get('id') for item in equipment if item.get('id')]
    
    if armor_ids:
        armors = db.query(models.Item).filter(
            models.Item.id.in_(armor_ids),
            models.Item.category.in_(['Armor', 'Armadura', 'Shield', 'Escudo'])
        ).all()
        return [ {
            "id": armor.id,
            "name": armor.name,
            "armor_class_base": armor.armor_class_base,
            "armor_class_dex_bonus": armor.armor_class_dex_bonus,
            "stealth_disadvantage": armor.stealth_disadvantage,
            "properties": json.loads(armor.properties) if armor.properties else [],
            "cost": f"{armor.cost_quantity} {armor.cost_unit}",
            "weight": armor.weight,
            "description": armor.description
        } for armor in armors ]
    
    return []
