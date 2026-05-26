from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/characters", tags=["characters"])

# Listas de habilidades por clase (validadas contra el reglamento)
_CLASS_SKILLS = {
    'bárbaro': ['animal-handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'],
    'bardo': ['acrobatics', 'animal-handling', 'arcana', 'athletics', 'deception', 'history', 'insight',
              'intimidation', 'investigation', 'medicine', 'nature', 'perception', 'performance',
              'persuasion', 'religion', 'sleight-of-hand', 'stealth', 'survival'],
    'clérigo': ['history', 'insight', 'medicine', 'persuasion', 'religion'],
    'druida': ['animal-handling', 'arcana', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'],
    'guerrero': ['acrobatics', 'animal-handling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'],
    'monje': ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'],
    'paladín': ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'],
    'explorador': ['animal-handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'],
    'pícaro': ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception',
               'performance', 'persuasion', 'sleight-of-hand', 'stealth'],
    'hechicero': ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'],
    'brujo': ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'],
    'mago': ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'],
    'artífice': ['arcana', 'history', 'insight', 'investigation', 'medicine', 'perception', 'sleight-of-hand'],
}

_CLASS_SKILL_COUNT = {
    'bárbaro': 2, 'bardo': 3, 'clérigo': 2, 'druida': 2, 'guerrero': 2, 'monje': 2,
    'paladín': 2, 'explorador': 3, 'pícaro': 4, 'hechicero': 2, 'brujo': 2, 'mago': 2,
    'artífice': 2
}


def _validate_skills(stats: dict, class_name: Optional[str]):
    """Valida que las competencias del personaje cumplan con el reglamento."""
    if not class_name:
        return
    cn = class_name.lower().strip()
    options = _CLASS_SKILLS.get(cn, [])
    limit = _CLASS_SKILL_COUNT.get(cn, 2)
    bg_skills = stats.get('background_skills', []) or []
    profs = stats.get('skillProficiencies', []) or []
    expertise = stats.get('expertise', []) or []

    # Contar competencias de clase (excluyendo trasfondo)
    class_count = 0
    for s in profs:
        if s in options and s not in bg_skills:
            class_count += 1
        elif s not in options and s not in bg_skills:
            # Intentar coincidencia por nombre traducido
            name_match = False
            for bg in bg_skills:
                if isinstance(bg, str) and bg.lower() in s.lower() or s.lower() in bg.lower():
                    name_match = True
                    break
            if not name_match:
                raise HTTPException(status_code=400,
                    detail=f'"{s}" no es una opción válida para {class_name}')

    if class_count > limit:
        raise HTTPException(status_code=400,
            detail=f'Máximo {limit} competencias de clase para {class_name}, tienes {class_count}')

    # Pericias solo para Pícaro y Bardo
    if expertise and cn not in ('pícaro', 'bardo'):
        raise HTTPException(status_code=400,
            detail='Solo los pícaros y bardos pueden tener pericias')


@router.post("", response_model=schemas.CharacterResponse)
def create_character(data: schemas.CharacterCreate, db: Session = Depends(get_db),
                     current_user: models.User = Depends(get_current_user)):
    """Crear un nuevo personaje."""
    # Validar competencias antes de crear
    try:
        stats_obj = json.loads(data.stats) if isinstance(data.stats, str) else data.stats
        cls = db.query(models.Class).filter(models.Class.id == data.class_id).first()
        _validate_skills(stats_obj, cls.name if cls else None)
    except json.JSONDecodeError:
        pass

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
        portrait_url=data.portrait_url,
        personality=data.personality or "",
        ideals=data.ideals or "",
        bonds=data.bonds or "",
        flaws=data.flaws or ""
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
    
    # Validar competencias si se están actualizando stats
    if 'stats' in update_data:
        try:
            stats_obj = json.loads(update_data['stats']) if isinstance(update_data['stats'], str) else update_data['stats']
            cls = db.query(models.Class).filter(models.Class.id == character.class_id).first()
            _validate_skills(stats_obj, cls.name if cls else None)
        except json.JSONDecodeError:
            pass
    
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
    bg = db.query(models.Background).filter(models.Background.id == char.background_id).first() if char.background_id else None
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
        class_name=cls.name if cls else "",
        background_name=bg.name if bg else "",
        personality=char.personality or "",
        ideals=char.ideals or "",
        bonds=char.bonds or "",
        flaws=char.flaws or ""
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


@router.get("/{char_id}/export-pdf")
def export_character_pdf(char_id: int, db: Session = Depends(get_db),
                         current_user: models.User = Depends(get_current_user)):
    """Exportar ficha de personaje rellenando la plantilla PDF."""
    from fastapi.responses import StreamingResponse
    import io
    import pypdf
    import os
    
    # 1. Obtener personaje de la base de datos
    character = db.query(models.Character).filter(models.Character.id == char_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Personaje no encontrado")
        
    # Validar permisos
    is_owner = character.user_id == current_user.id
    is_dm = False
    if character.campaign_id:
        campaign = db.query(models.Campaign).filter(models.Campaign.id == character.campaign_id).first()
        is_dm = campaign and campaign.dm_user_id == current_user.id
        
    if not is_owner and not is_dm:
        raise HTTPException(status_code=403, detail="No tienes permiso para exportar este personaje")
        
    # 2. Extraer stats y compendio
    stats = {}
    if character.stats:
        try:
            stats = json.loads(character.stats) if isinstance(character.stats, str) else character.stats
        except Exception:
            pass
            
    class_name = character.char_class.name if character.char_class else ""
    race_name = character.race.name if character.race else ""
    subclass_name = character.subclass.name if character.subclass else ""
    background_name = character.background.name if character.background else ""
    
    # Atributos principales
    str_score = stats.get("STR", 10)
    dex_score = stats.get("DEX", 10)
    con_score = stats.get("CON", 10)
    int_score = stats.get("INT", 10)
    wis_score = stats.get("WIS", 10)
    cha_score = stats.get("CHA", 10)
    
    def get_mod(score):
        return (score - 10) // 2
        
    def get_mod_str(score):
        m = get_mod(score)
        return f"+{m}" if m >= 0 else str(m)
        
    str_mod = get_mod(str_score)
    dex_mod = get_mod(dex_score)
    con_mod = get_mod(con_score)
    int_mod = get_mod(int_score)
    wis_mod = get_mod(wis_score)
    cha_mod = get_mod(cha_score)
    
    # Nivel y bono de competencia
    level = character.level or 1
    prof_bonus = (level - 1) // 4 + 2
    
    # Determinar salvaciones competentes
    prof_saves = set()
    cn_lower = class_name.lower().strip()
    if cn_lower == 'guerrero' or cn_lower == 'bárbaro':
        prof_saves.update(['STR', 'CON'])
    elif cn_lower == 'monje' or cn_lower == 'explorador':
        prof_saves.update(['STR', 'DEX'])
    elif cn_lower == 'mago' or cn_lower == 'druida':
        prof_saves.update(['INT', 'WIS'])
    elif cn_lower == 'artífice':
        prof_saves.update(['CON', 'INT'])
    elif cn_lower in ['clérigo', 'paladín', 'brujo']:
        prof_saves.update(['WIS', 'CHA'])
    elif cn_lower == 'pícaro':
        prof_saves.update(['DEX', 'INT'])
    elif cn_lower == 'bardo':
        prof_saves.update(['DEX', 'CHA'])
    elif cn_lower == 'hechicero':
        prof_saves.update(['CON', 'CHA'])
        
    str_save = str_mod + (prof_bonus if 'STR' in prof_saves else 0)
    dex_save = dex_mod + (prof_bonus if 'DEX' in prof_saves else 0)
    con_save = con_mod + (prof_bonus if 'CON' in prof_saves else 0)
    int_save = int_mod + (prof_bonus if 'INT' in prof_saves else 0)
    wis_save = wis_mod + (prof_bonus if 'WIS' in prof_saves else 0)
    cha_save = cha_mod + (prof_bonus if 'CHA' in prof_saves else 0)
    
    # Habilidades
    skill_profs = stats.get("skillProficiencies", []) or []
    expertises = stats.get("expertise", []) or []
    
    skills_map = {
        'acrobatics': ('ACR', 'DEX', 'Acrobacias'),
        'animal-handling': ('ANI', 'WIS', 'Trato con Animales'),
        'arcana': ('ARC', 'INT', 'Arcanos'),
        'athletics': ('ATH', 'STR', 'Atletismo'),
        'deception': ('DEC', 'CHA', 'Engaño'),
        'history': ('HIS', 'INT', 'Historia'),
        'insight': ('INS', 'WIS', 'Perspicacia'),
        'intimidation': ('INTI', 'CHA', 'Intimidación'),
        'investigation': ('INV', 'INT', 'Investigación'),
        'medicine': ('MED', 'WIS', 'Medicina'),
        'nature': ('NAT', 'INT', 'Naturaleza'),
        'perception': ('PER', 'WIS', 'Percepción'),
        'performance': ('PERF', 'CHA', 'Interpretación'),
        'persuasion': ('PERSU', 'CHA', 'Persuasión'),
        'religion': ('REL', 'INT', 'Religión'),
        'sleight-of-hand': ('SLE', 'DEX', 'Juego de Manos'),
        'stealth': ('STE', 'DEX', 'Sigilo'),
        'survival': ('SUR', 'WIS', 'Supervivencia')
    }
    
    ac = 10 + dex_mod
    try:
        if character.calculated_stats:
            calc = json.loads(character.calculated_stats)
            ac = calc.get("ac", ac)
    except Exception:
        pass
        
    fields = {
        "Name": character.name,
        "Name0": character.name,
        "Clase": class_name,
        "Class0": class_name,
        "Subclase": subclass_name,
        "Subclass0": subclass_name,
        "Species": race_name,
        "Species0": race_name,
        "Background": background_name,
        "Background0": background_name,
        "Level": str(level),
        "Level0": str(level),
        
        "STR SCORE": str(str_score),
        "STR SCORE1": str(str_score),
        "STR SORE0": str(str_score),
        "STR SCORE0": str(str_score),
        "DEX SCORE": str(dex_score),
        "DEX SCORE1": str(dex_score),
        "DEX SCORE0": str(dex_score),
        "CON SCORE": str(con_score),
        "CON SCORE1": str(con_score),
        "CON SCORE0": str(con_score),
        "INT SCORE": str(int_score),
        "INT SCORE1": str(int_score),
        "INTR SCORE0": str(int_score),
        "WIS SCORE": str(wis_score),
        "WIS SCORE1": str(wis_score),
        "WIS SCORE0": str(wis_score),
        "CHA SCORE": str(cha_score),
        "CHA SCORE1": str(cha_score),
        "CHA SCORE0": str(cha_score),
        
        "STR MOD": get_mod_str(str_score),
        "STR MOD1": get_mod_str(str_score),
        "SRT MOD0": get_mod_str(str_score),
        "DEX MOD": get_mod_str(dex_score),
        "DEX MOD1": get_mod_str(dex_score),
        "DEX MOD0": get_mod_str(dex_score),
        "CON MOD": get_mod_str(con_score),
        "CON MOD1": get_mod_str(con_score),
        "CON MOD0": get_mod_str(con_score),
        "INT MOD": get_mod_str(int_score),
        "INT MOD1": get_mod_str(int_score),
        "INT MOD0": get_mod_str(int_score),
        "WIS MOD": get_mod_str(wis_score),
        "WIS MOD1": get_mod_str(wis_score),
        "WIS MOD0": get_mod_str(wis_score),
        "CHA MOD": get_mod_str(cha_score),
        "CHA MOD1": get_mod_str(cha_score),
        "CHA MOD0": get_mod_str(cha_score),
        
        "Prof Bonus": f"+{prof_bonus}",
        "Prof Bonus0": f"+{prof_bonus}",
        
        "CA": str(ac),
        "AC0": str(ac),
        
        "INIT": get_mod_str(dex_score),
        "INIT0": get_mod_str(dex_score),
        
        "SPEED": str(stats.get("speed", 30)),
        "SPEED0": str(stats.get("speed", 30)),
        
        "Current HP": str(stats.get("currHP", 8)),
        "Current HP0": str(stats.get("currHP", 8)),
        "Max HP": str(stats.get("maxHP", 8)),
        "Max HP0": str(stats.get("maxHP", 8)),
        
        "MAX HD": f"d{character.char_class.hit_die if character.char_class else 8}",
        "MAX HD0": f"d{character.char_class.hit_die if character.char_class else 8}",
        "Spent HD": str(stats.get("hitDiceUsed", 0)),
        "Spent HD0": str(stats.get("hitDiceUsed", 0)),
        
        "STR SAVE": f"+{str_save}" if str_save >= 0 else str(str_save),
        "STR SAVE1": f"+{str_save}" if str_save >= 0 else str(str_save),
        "DEX SAVE": f"+{dex_save}" if dex_save >= 0 else str(dex_save),
        "DEX SAVE0": f"+{dex_save}" if dex_save >= 0 else str(dex_save),
        "CON SAVE": f"+{con_save}" if con_save >= 0 else str(con_save),
        "CON SAVE0": f"+{con_save}" if con_save >= 0 else str(con_save),
        "INT SAVE": f"+{int_save}" if int_save >= 0 else str(int_save),
        "INT SAVE1": f"+{int_save}" if int_save >= 0 else str(int_save),
        "INT SAVE0": f"+{int_save}" if int_save >= 0 else str(int_save),
        "WIS SAVE": f"+{wis_save}" if wis_save >= 0 else str(wis_save),
        "WIS SAVE0": f"+{wis_save}" if wis_save >= 0 else str(wis_save),
        "CHA SAVE": f"+{cha_save}" if cha_save >= 0 else str(cha_save),
        "CHA SAVE0": f"+{cha_save}" if cha_save >= 0 else str(cha_save),
        
        "STR_SAVE": "/On" if 'STR' in prof_saves else "/Off",
        "CB-STRSAVE2": "/On" if 'STR' in prof_saves else "/Off",
        "DEX_SAVE": "/On" if 'DEX' in prof_saves else "/Off",
        "CB-DEXSAVE2": "/On" if 'DEX' in prof_saves else "/Off",
        "CON_SAVE": "/On" if 'CON' in prof_saves else "/Off",
        "CB-CONSAVE2": "/On" if 'CON' in prof_saves else "/Off",
        "INT_SAVE": "/On" if 'INT' in prof_saves else "/Off",
        "CB-INTSAVE2": "/On" if 'INT' in prof_saves else "/Off",
        "WIS_SAVE": "/On" if 'WIS' in prof_saves else "/Off",
        "CB-WISSAVE2": "/On" if 'WIS' in prof_saves else "/Off",
        "CHA_SAVE": "/On" if 'CHA' in prof_saves else "/Off",
        "CB-CHASAVE2": "/On" if 'CHA' in prof_saves else "/Off",
    }
    
    # Rellenar bonos y competencias de habilidades
    for skill_name, (prefix, ability, label) in skills_map.items():
        is_prof = skill_name in skill_profs
        is_expert = skill_name in expertises
        
        ab_score = stats.get(ability, 10)
        ab_mod = get_mod(ab_score)
        
        bonus = ab_mod + (prof_bonus * 2 if is_expert else prof_bonus if is_prof else 0)
        bonus_str = f"+{bonus}" if bonus >= 0 else str(bonus)
        
        fields[f"{prefix}_BONUS"] = bonus_str
        fields[f"{skill_name.upper()}"] = bonus_str
        fields[f"{skill_name.upper()}0"] = bonus_str
        
        fields[f"{prefix}_PROF1"] = "/On" if is_prof else "/Off"
        fields[f"{prefix}_PROF2"] = "/On" if is_expert else "/Off"
        
    # Inventario
    try:
        eq_list = json.loads(character.equipment) if isinstance(character.equipment, str) else (character.equipment or [])
        eq_lines = []
        for eq_item in eq_list:
            n_val = eq_item.get("name", "")
            c_val = eq_item.get("cost", "")
            qty = eq_item.get("quantity", 1)
            eq_lines.append(f"- {n_val} (x{qty}) {c_val}")
        fields["EQUIPMENT1"] = "\n".join(eq_lines)
    except Exception:
        pass
        
    # Armas equipadas
    try:
        weapons_data = []
        eq_list = json.loads(character.equipment) if isinstance(character.equipment, str) else (character.equipment or [])
        for item in eq_list:
            if item.get("category") in ['Weapon', 'Arma']:
                weapons_data.append(item)
        
        for idx, w in enumerate(weapons_data[:6]):
            w_name = w.get("name", "")
            atk_mod = str_mod
            props = [p.lower() for p in w.get("properties", [])]
            if "finesse" in props or w.get("weapon_range"):
                atk_mod = max(str_mod, dex_mod)
            atk_bonus = atk_mod + prof_bonus
            atk_bonus_str = f"+{atk_bonus}" if atk_bonus >= 0 else str(atk_bonus)
            dmg = w.get("damage_dice", "")
            dmg_type = w.get("damage_type", "")
            fields[f"WEAPON NAME {idx+1}"] = f"{w_name} ({atk_bonus_str} | {dmg} {dmg_type})"
    except Exception:
        pass
        
    # Monedas
    coins = stats.get("coins", {}) or {}
    fields["COIN1"] = str(coins.get("cp", 0))
    fields["COIN2"] = str(coins.get("sp", 0))
    fields["COIN3"] = str(coins.get("ep", 0))
    fields["COIN4"] = str(coins.get("gp", 0))
    fields["COIN5"] = str(coins.get("pp", 0))
    fields["COIN6"] = str(coins.get("cp", 0))
    fields["COIN7"] = str(coins.get("sp", 0))
    fields["COIN8"] = str(coins.get("ep", 0))
    fields["COIN9"] = str(coins.get("gp", 0))
    fields["COIN10"] = str(coins.get("pp", 0))
    
    # Rasgos y notas
    fields["TRAITS"] = character.notes or ""
    fields["TRAITS0"] = character.notes or ""
    
    # Idiomas y herramientas calculadas
    lines_langs = []
    if character.race and character.race.languages:
        try:
            langs = json.loads(character.race.languages)
            if isinstance(langs, list):
                lines_langs.extend(langs)
        except Exception:
            pass
    if character.background and character.background.languages:
        try:
            langs = json.loads(character.background.languages)
            if isinstance(langs, list):
                lines_langs.extend(langs)
        except Exception:
            pass
    unique_langs = sorted(list(set(lines_langs)))
    if unique_langs:
        fields["LANGUAGES"] = ", ".join(unique_langs)
        fields["LANGUAGES0"] = ", ".join(unique_langs)
        
    # 5. Cargar plantilla PDF, rellenar y enviar
    router_dir = os.path.dirname(os.path.abspath(__file__))
    api_dir = os.path.dirname(router_dir)
    pdf_path = os.path.join(api_dir, "static", "images", "Plantilla.pdf")
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=500, detail=f"Plantilla PDF no encontrada en el servidor. Ruta: {pdf_path}")
        
    try:
        reader = pypdf.PdfReader(pdf_path)
        writer = pypdf.PdfWriter()
        writer.append(reader)
        
        for page in writer.pages:
            writer.update_page_form_field_values(page, fields)
            
        out_buf = io.BytesIO()
        writer.write(out_buf)
        out_buf.seek(0)
        
        filename = f"{character.name.replace(' ', '_')}_hoja.pdf"
        return StreamingResponse(
            out_buf,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al rellenar el PDF: {e}")
