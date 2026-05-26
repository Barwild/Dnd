from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from database import get_db
import models
import schemas
from auth import get_current_user, security

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
def export_character_pdf(char_id: int, 
                         token: Optional[str] = None,
                         db: Session = Depends(get_db),
                         credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Exportar ficha de personaje rellenando la plantilla PDF."""
    from fastapi.responses import StreamingResponse
    import io
    import pypdf
    import os
    from auth import decode_token
    
    # 1. Autenticar usuario
    user_id = None
    if token:
        user_id = decode_token(token)
    elif credentials:
        user_id = decode_token(credentials.credentials)
        
    if not user_id:
        raise HTTPException(status_code=401, detail="No autorizado. Falta token de autenticación.")
        
    current_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not current_user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado.")
        
    # Obtener personaje de la base de datos
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
            
    cls = db.query(models.Class).filter(models.Class.id == character.class_id).first()
    race = db.query(models.Race).filter(models.Race.id == character.race_id).first()
    subclass = db.query(models.Subclass).filter(models.Subclass.id == character.subclass_id).first() if character.subclass_id else None
    bg = db.query(models.Background).filter(models.Background.id == character.background_id).first() if character.background_id else None

    class_name = cls.name if cls else ""
    race_name = race.name if race else ""
    subclass_name = subclass.name if subclass else ""
    background_name = bg.name if bg else ""
    
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
        'acrobatics': ('acroPROF', 'Acrobatics', 'DEX'),
        'animal-handling': ('anhanPROF', 'AnHan', 'WIS'),
        'arcana': ('arcanaPROF', 'Arcana', 'INT'),
        'athletics': ('athPROF', 'Athletics', 'STR'),
        'deception': ('decepPROF', 'Deception', 'CHA'),
        'history': ('histPROF', 'History', 'INT'),
        'insight': ('insightPROF', 'Insight', 'WIS'),
        'intimidation': ('intimPROF', 'Intimidation', 'CHA'),
        'investigation': ('investPROF', 'Investigation', 'INT'),
        'medicine': ('medPROF', 'Medicine', 'WIS'),
        'nature': ('naturePROF', 'Nature', 'INT'),
        'perception': ('perPROF', 'Perception', 'WIS'),
        'performance': ('perfPROF', 'Performance', 'CHA'),
        'persuasion': ('persPROF', 'Persuasion', 'CHA'),
        'religion': ('religPROF', 'Religion', 'INT'),
        'sleight-of-hand': ('sohPROF', 'SleightofHand', 'DEX'),
        'stealth': ('stealthPROF', 'Stealth', 'DEX'),
        'survival': ('survPROF', 'Survival', 'WIS')
    }
    
    ac = 10 + dex_mod
    try:
        if character.calculated_stats:
            calc = json.loads(character.calculated_stats)
            ac = calc.get("ac", ac)
    except Exception:
        pass
        
    # Traductores de texto (Inglés -> Español) para evitar textos en inglés en el PDF
    alignment_translations = {
        "chaotic good": "Caótico Bueno",
        "chaotic neutral": "Caótico Neutral",
        "chaotic evil": "Caótico Malvado",
        "lawful good": "Legal Bueno",
        "lawful neutral": "Legal Neutral",
        "lawful evil": "Legal Malvado",
        "neutral good": "Neutral Bueno",
        "neutral neutral": "Neutral Puro",
        "neutral": "Neutral Puro",
        "neutral evil": "Neutral Malvado",
    }
    damage_translations = {
        "slashing": "Cortante",
        "piercing": "Perforante",
        "bludgeoning": "Contundente",
        "acid": "Ácido",
        "cold": "Frío",
        "fire": "Fuego",
        "force": "Fuerza",
        "lightning": "Relámpago",
        "necrotic": "Necrótico",
        "poison": "Veneno",
        "psychic": "Psíquico",
        "radiant": "Radiante",
        "thunder": "Trueno",
    }

    align_val = stats.get("alignment", "").lower().strip()
    alignment_es = alignment_translations.get(align_val, stats.get("alignment", ""))

    fields = {
        # 1. Cabecera e Información General
        "CharacterName": character.name,
        "CharacterName 2": character.name,
        "ClassLevel": f"{class_name}{' (' + subclass_name + ')' if subclass_name else ''} {level}",
        "Background": background_name,
        "PlayerName": current_user.display_name if current_user else "",
        "Race  ": race_name,
        "Alignment": alignment_es,
        "XP": str(stats.get("xp", 0)),
        
        # 2. Atributos y Modificadores
        "STRscore": str(str_score),
        "DEXscore": str(dex_score),
        "CONscore": str(con_score),
        "INTscore": str(int_score),
        "WISscore": str(wis_score),
        "CHAscore": str(cha_score),
        "STRbonus": get_mod_str(str_score),
        "DEXbonus": get_mod_str(dex_score),
        "CONbonus": get_mod_str(con_score),
        "INTbonus": get_mod_str(int_score),
        "WISbonus": get_mod_str(wis_score),
        "CHAbonus": get_mod_str(cha_score),
        
        # 3. Inspiración, Competencia y Percepción Pasiva
        "Inspiration": "X" if stats.get("inspiration") else "",
        "ProfBonus": f"+{prof_bonus}",
        "PWP": str(10 + wis_mod + (prof_bonus * 2 if "perception" in expertises else prof_bonus if "perception" in skill_profs else 0)),
        
        # 4. Tiradas de Salvación
        "STRsave": f"+{str_save}" if str_save >= 0 else str(str_save),
        "DEXsave": f"+{dex_save}" if dex_save >= 0 else str(dex_save),
        "CONsave": f"+{con_save}" if con_save >= 0 else str(con_save),
        "INTsave": f"+{int_save}" if int_save >= 0 else str(int_save),
        "WISsave": f"+{wis_save}" if wis_save >= 0 else str(wis_save),
        "CHAsave": f"+{cha_save}" if cha_save >= 0 else str(cha_save),
        
        "STRsavePROF": "/Yes" if 'STR' in prof_saves else "/Off",
        "DEXsavePROF": "/Yes" if 'DEX' in prof_saves else "/Off",
        "CONsavePROF": "/Yes" if 'CON' in prof_saves else "/Off",
        "INTsavePROF": "/Yes" if 'INT' in prof_saves else "/Off",
        "WISsavePROF": "/Yes" if 'WIS' in prof_saves else "/Off",
        "CHAsavePROF": "/Yes" if 'CHA' in prof_saves else "/Off",
    }
    
    # 5. Rellenar bonos y competencias de habilidades (Skills)
    for skill_key, (chk_field, pdf_field, ability) in skills_map.items():
        is_prof = skill_key in skill_profs
        is_expert = skill_key in expertises
        
        ab_score = stats.get(ability, 10)
        ab_mod = get_mod(ab_score)
        
        bonus = ab_mod + (prof_bonus * 2 if is_expert else prof_bonus if is_prof else 0)
        bonus_str = f"+{bonus}" if bonus >= 0 else str(bonus)
        
        fields[pdf_field] = bonus_str
        fields[chk_field] = "/Yes" if is_prof or is_expert else "/Off"

    # 6. Combate, Iniciativa y HP
    fields["AC"] = str(ac)
    fields["Initiative"] = get_mod_str(dex_score)
    fields["Speed"] = str(stats.get("speed", 30))
    fields["HPMax"] = str(stats.get("maxHP", 10))
    fields["HPCurrent"] = str(stats.get("currHP", 10))
    fields["HPTemp"] = str(stats.get("tempHP", 0))
    
    hit_die_type = cls.hit_die if cls else 8
    fields["HDTotal"] = f"{level}d{hit_die_type}"
    fields["HD"] = str(level - stats.get("hitDiceUsed", 0))
    
    # 7. Armas y Ataques
    equipped_weapons = []
    try:
        eq_list = json.loads(character.equipment) if isinstance(character.equipment, str) else (character.equipment or [])
        for item in eq_list:
            if item.get("category") in ['Weapon', 'Arma']:
                equipped_weapons.append(item)
    except Exception:
        pass

    for idx in range(3):
        wpn_field = "Wpn Name" if idx == 0 else f"Wpn Name {idx+1}"
        atk_field = "Wpn1 AtkBonus" if idx == 0 else f"Wpn{idx+1} AtkBonus"
        if idx == 1:
            atk_field = "Wpn2 AtkBonus  "
            dmg_field = "Wpn2 Damage  "
        elif idx == 2:
            atk_field = "Wpn3 AtkBonus   "
            dmg_field = "Wpn3 Damage  "
        else:
            dmg_field = "Wpn1 Damage"

        if idx < len(equipped_weapons):
            w = equipped_weapons[idx]
            w_name = w.get("name", "")
            props = [p.get("name", "").lower() if isinstance(p, dict) else str(p).lower() for p in w.get("properties", [])]
            is_finesse = "finesse" in props or "sutil" in props
            
            # Traducir propiedades del arma
            prop_translations = {
                "ammunition": "Munición",
                "finesse": "Sutil",
                "heavy": "Pesada",
                "light": "Ligera",
                "loading": "Recarga",
                "range": "A distancia",
                "reach": "Alcance",
                "special": "Especial",
                "thrown": "Arrojadiza",
                "two-handed": "A dos manos",
                "versatile": "Versátil"
            }
            props_es = [prop_translations.get(p.strip(), p.capitalize()) for p in props]
            
            # Traducir rango y propiedades para la descripción o notas si procede
            w_range = w.get("weapon_range", "Melee")
            if w_range == "Ranged":
                w_range_es = "A distancia"
            elif w_range == "Melee":
                w_range_es = "Cuerpo a cuerpo"
            else:
                w_range_es = w_range
                
            is_ranged = w_range in ["Ranged", "A distancia"] or "ammunition" in props
            
            base_stat = "DEX" if is_ranged else ("DEX" if is_finesse and dex_mod > str_mod else "STR")
            w_atk_mod = get_mod(stats.get(base_stat, 10)) + prof_bonus
            w_dmg_mod = get_mod(stats.get(base_stat, 10))
            
            # Si el arma es sutil o a distancia, mostrarlo
            wpn_name_display = w_name
            if props_es:
                wpn_name_display += f" ({', '.join(props_es[:2])})"
            
            fields[wpn_field] = wpn_name_display
            fields[atk_field] = f"+{w_atk_mod}" if w_atk_mod >= 0 else str(w_atk_mod)
            
            dmg_dice = w.get("damage_dice", "1d4")
            dmg_type = w.get("damage_type", "")
            if isinstance(dmg_type, dict):
                dmg_type = dmg_type.get("name", "")
            dmg_type_es = damage_translations.get(dmg_type.lower().strip(), dmg_type)
            
            fields[dmg_field] = f"{dmg_dice}{'+' if w_dmg_mod >= 0 else ''}{w_dmg_mod} {dmg_type_es}"
        else:
            fields[wpn_field] = ""
            fields[atk_field] = ""
            fields[dmg_field] = ""

    # Notas generales de combate
    combat_notes = []
    if len(equipped_weapons) > 3:
        overflow_weapons = [w.get("name", "") for w in equipped_weapons[3:]]
        combat_notes.append("Armas adicionales: " + ", ".join(overflow_weapons))
    fields["AttacksSpellcasting"] = "\n".join(combat_notes)

    # 8. Monedas y Equipamiento
    coins = stats.get("coins", {}) or {}
    fields["CP"] = str(coins.get("cp", 0))
    fields["SP"] = str(coins.get("sp", 0))
    fields["EP"] = str(coins.get("ep", 0))
    fields["GP"] = str(coins.get("gp", 0))
    fields["PP"] = str(coins.get("pp", 0))

    try:
        eq_list = json.loads(character.equipment) if isinstance(character.equipment, str) else (character.equipment or [])
        eq_lines = []
        for eq_item in eq_list:
            n_val = eq_item.get("name", "")
            qty = eq_item.get("quantity", 1)
            eq_lines.append(f"- {n_val} (x{qty})")
        
        all_eq_text = "\n".join(eq_lines)
        if len(eq_lines) > 25:
            fields["Equipment"] = "\n".join(eq_lines[:25])
            fields["Equipment 2"] = "\n".join(eq_lines[25:])
        else:
            fields["Equipment"] = all_eq_text
            fields["Equipment 2"] = ""
    except Exception:
        pass

    # Idiomas y Competencias generales
    lines_langs = []
    if race and race.languages:
        try:
            langs = json.loads(race.languages)
            if isinstance(langs, list):
                lines_langs.extend(langs)
        except Exception:
            pass
    if bg and bg.languages:
        try:
            langs = json.loads(bg.languages)
            if isinstance(langs, list):
                lines_langs.extend(langs)
        except Exception:
            pass
    unique_langs = sorted(list(set(lines_langs)))

    class_profs = []
    if cls and cls.proficiencies:
        try:
            parsed = json.loads(cls.proficiencies)
            if isinstance(parsed, list):
                class_profs = parsed
        except Exception:
            pass

    prof_summary = []
    if class_profs:
        prof_summary.append("Competencias de Clase:\n" + ", ".join(class_profs))
    if unique_langs:
        prof_summary.append("Idiomas:\n" + ", ".join(unique_langs))
    fields["ProficienciesLang"] = "\n\n".join(prof_summary)

    # 9. Trasfondo y Personalidad (Múltiples formatos seguros de espacios para evitar fallos de renderizado)
    fields["PersonalityTraits"] = character.personality or ""
    fields["PersonalityTraits "] = character.personality or ""
    fields["PersonalityTraits  "] = character.personality or ""
    fields["Ideals"] = character.ideals or ""
    fields["Bonds"] = character.bonds or ""
    fields["Flaws"] = character.flaws or ""

    # Rasgos y Características especiales (Traducidos al español)
    trait_translations = {
        # Dracónido / Dragonborn
        "draconic ancestry": "Ascendencia Dracónica",
        "breath weapon": "Arma de Aliento",
        "damage resistance": "Resistencia al Daño",
        # Elfo / Elf
        "darkvision": "Visión en la Oscuridad",
        "keen senses": "Sentidos Aguzados",
        "fey ancestry": "Linaje Feérico",
        "trance": "Trance",
        # Enano / Dwarf
        "dwarven resilience": "Resiliencia Enana",
        "dwarven combat training": "Entrenamiento de Combate Enano",
        "tool proficiency": "Competencia con Herramientas",
        "stonecunning": "Afinidad con la Piedra",
        # Mediano / Halfling
        "lucky": "Afortunado",
        "brave": "Valiente",
        "halfling nimbleness": "Agilidad Mediana",
        # Trasfondos / Backgrounds
        "charlatan": "Charlatán",
        "acolyte": "Acólito",
        "soldier": "Soldado",
        "criminal": "Criminal",
        "folk hero": "Héroe del Pueblo",
        "noble": "Noble",
        "sage": "Sabio"
    }

    features_list = []
    if race and race.traits:
        try:
            r_traits = json.loads(race.traits)
            if isinstance(r_traits, list):
                for t in r_traits:
                    t_name = t.get("name", t) if isinstance(t, dict) else t
                    t_name_lower = t_name.lower().strip()
                    features_list.append(trait_translations.get(t_name_lower, t_name))
        except Exception:
            pass
    if background_name:
        bg_translated = trait_translations.get(background_name.lower().strip(), background_name)
        features_list.append(f"Rasgo de Trasfondo ({bg_translated})")
    
    fields["Features and Traits"] = "\n".join(features_list)

    # 10. Página 2: Aspecto físico, Historia, Aliados y Tesoro
    fields["Age"] = str(stats.get("age", ""))
    fields["Height"] = str(stats.get("height", ""))
    fields["Weight"] = str(stats.get("weight", ""))
    fields["Eyes"] = str(stats.get("eyes", ""))
    fields["Skin"] = str(stats.get("skin", ""))
    fields["Hair"] = str(stats.get("hair", ""))
    
    fields["Backstory"] = stats.get("backstory") or character.notes or ""

    allies_text = stats.get("allies", "")
    if len(allies_text) > 500:
        fields["Allies"] = allies_text[:500]
        fields["Allies 2"] = allies_text[500:]
    else:
        fields["Allies"] = allies_text
        fields["Allies 2"] = ""

    treasure_text = stats.get("treasure", "")
    if len(treasure_text) > 500:
        fields["Treasure"] = treasure_text[:500]
        fields["Treasure 2"] = treasure_text[500:]
    else:
        fields["Treasure"] = treasure_text
        fields["Treasure 2"] = ""

    add_traits = stats.get("additionalTraits", "")
    if len(add_traits) > 500:
        fields["Feat+Traits"] = add_traits[:500]
        fields["Feat+Traits 2"] = add_traits[500:]
    else:
        fields["Feat+Traits"] = add_traits
        fields["Feat+Traits 2"] = ""

    # 11. Página 3: Conjuros y Spellcasting
    is_caster = False
    spell_stat = "INT"
    if cn_lower in ['mago', 'artífice']:
        is_caster = True
        spell_stat = "INT"
    elif cn_lower in ['clérigo', 'druida', 'explorador']:
        is_caster = True
        spell_stat = "WIS"
    elif cn_lower in ['bardo', 'hechicero', 'brujo', 'paladín']:
        is_caster = True
        spell_stat = "CHA"

    if is_caster:
        fields["Spellcasting Class 2"] = class_name
        
        # Traducir abreviatura de característica (INT -> INT, WIS -> SAB, CHA -> CAR)
        spell_stat_es = "INT"
        if spell_stat == "WIS":
            spell_stat_es = "SAB"
        elif spell_stat == "CHA":
            spell_stat_es = "CAR"
            
        fields["SpellcastingAbility 2"] = spell_stat_es
        
        stat_mod_val = get_mod(stats.get(spell_stat, 10))
        fields["SpellSaveDC  2"] = str(8 + prof_bonus + stat_mod_val)
        fields["SpellAtkBonus 2"] = f"+{prof_bonus + stat_mod_val}"

        # Espacios de conjuro
        spell_slots = stats.get("spellSlots", {}) or {}
        # SlotsTotal 19 ➔ Nivel 1, SlotsTotal 27 ➔ Nivel 9
        for lvl in range(1, 10):
            slot_data = spell_slots.get(str(lvl), {}) or {}
            max_slots = slot_data.get("max", 0)
            used_slots = slot_data.get("used", 0)
            rem_slots = max(0, max_slots - used_slots)
            
            fields[f"SlotsTotal {18+lvl}"] = str(max_slots) if max_slots > 0 else ""
            fields[f"SlotsRemaining {18+lvl}"] = str(rem_slots) if max_slots > 0 else ""
    else:
        fields["Spellcasting Class 2"] = ""
        fields["SpellcastingAbility 2"] = ""
        fields["SpellSaveDC  2"] = ""
        fields["SpellAtkBonus 2"] = ""
        for lvl in range(1, 10):
            fields[f"SlotsTotal {18+lvl}"] = ""
            fields[f"SlotsRemaining {18+lvl}"] = ""

    # Conjuros conocidos cargados desde base de datos
    known_spells_list = []
    if character.spell_list:
        try:
            spell_indices = json.loads(character.spell_list) if isinstance(character.spell_list, str) else character.spell_list
            if spell_indices:
                db_spells = db.query(models.Spell).filter(models.Spell.index.in_(spell_indices)).all()
                known_spells_list = db_spells
        except Exception:
            pass

    # Agrupar conjuros por nivel (0 = Truco, 1 a 9)
    spells_by_level = {l: [] for l in range(10)}
    for sp in known_spells_list:
        if sp.level is not None and 0 <= sp.level <= 9:
            spells_by_level[sp.level].append(sp.name)

    # Rellenar listas de conjuros en el PDF utilizando la ordenación visual de coordenadas EXACTA
    
    # Nivel 0 (Trucos) - 8 campos visuales ordenados de arriba a abajo en la primera columna (Y: 619 a 521)
    level_0_fields = ["Spells 1014", "Spells 1016", "Spells 1017", "Spells 1018", "Spells 1019", "Spells 1020", "Spells 1021", "Spells 1022"]
    for i, f_name in enumerate(level_0_fields):
        name_list = spells_by_level[0]
        fields[f_name] = name_list[i] if i < len(name_list) else ""
        
    # Nivel 1 - 12 campos visuales ordenados de arriba a abajo (Y: 433 a 280) en la primera columna
    level_1_fields = ["Spells 1015", "Spells 1023", "Spells 1024", "Spells 1025", "Spells 1026", "Spells 1027", "Spells 1028", "Spells 1029", "Spells 1030", "Spells 1031", "Spells 1032", "Spells 1033"]
    for i, f_name in enumerate(level_1_fields):
        name_list = spells_by_level[1]
        fields[f_name] = name_list[i] if i < len(name_list) else ""

    # Nivel 2 - 13 campos visuales ordenados de arriba a abajo (Y: 221 a 53) en la primera columna
    level_2_fields = ["Spells 1046", "Spells 1034", "Spells 1035", "Spells 1036", "Spells 1037", "Spells 1039", "Spells 1040", "Spells 1041", "Spells 1042", "Spells 1043", "Spells 1044", "Spells 1045"]
    # Nota: Spells 1038 se encuentra ausente o mal posicionado en el PDF original. Siguiendo el listado de coordenadas:
    # 1046 (221.4), 1034 (207.3), 1035 (193.4), 1036 (179.4), 1037 (165.4), 1038 (151.4 - pero pertenece a nivel 5/columna 2?), 
    # Mapeamos los 12 reales visuales en el orden:
    level_2_fields = ["Spells 1046", "Spells 1034", "Spells 1035", "Spells 1036", "Spells 1037", "Spells 1038", "Spells 1039", "Spells 1040", "Spells 1041", "Spells 1042", "Spells 1043", "Spells 1044", "Spells 1045"]
    for i, f_name in enumerate(level_2_fields):
        name_list = spells_by_level[2]
        fields[f_name] = name_list[i] if i < len(name_list) else ""

    # Nivel 3 - 13 campos visuales ordenados de arriba a abajo en la columna central (Y: 617 a 449)
    level_3_fields = ["Spells 1048", "Spells 1047", "Spells 1049", "Spells 1050", "Spells 1051", "Spells 1052", "Spells 1053", "Spells 1054", "Spells 1055", "Spells 1056", "Spells 1057", "Spells 1058", "Spells 1059"]
    for i, f_name in enumerate(level_3_fields):
        name_list = spells_by_level[3]
        fields[f_name] = name_list[i] if i < len(name_list) else ""

    # Nivel 4 - 13 campos visuales ordenados de arriba a abajo en la columna central (Y: 392 a 224)
    level_4_fields = ["Spells 1061", "Spells 1060", "Spells 1062", "Spells 1063", "Spells 1064", "Spells 1065", "Spells 1066", "Spells 1067", "Spells 1068", "Spells 1069", "Spells 1070", "Spells 1071", "Spells 1072"]
    for i, f_name in enumerate(level_4_fields):
        name_list = spells_by_level[4]
        fields[f_name] = name_list[i] if i < len(name_list) else ""

    # Nivel 5 - 9 campos visuales ordenados de arriba a abajo en la columna central (Y: 165 a 53)
    level_5_fields = ["Spells 1074", "Spells 1073", "Spells 1075", "Spells 1076", "Spells 1077", "Spells 1078", "Spells 1079", "Spells 1080", "Spells 1081"]
    for i, f_name in enumerate(level_5_fields):
        name_list = spells_by_level[5]
        fields[f_name] = name_list[i] if i < len(name_list) else ""

    # Nivel 6 - 9 campos visuales ordenados de arriba a abajo en la columna derecha (Y: 617 a 505)
    level_6_fields = ["Spells 1083", "Spells 1082", "Spells 1084", "Spells 1085", "Spells 1086", "Spells 1087", "Spells 1088", "Spells 1089", "Spells 1090"]
    for i, f_name in enumerate(level_6_fields):
        name_list = spells_by_level[6]
        fields[f_name] = name_list[i] if i < len(name_list) else ""

    # Nivel 7 - 9 campos visuales ordenados de arriba a abajo en la columna derecha (Y: 447 a 335)
    level_7_fields = ["Spells 1092", "Spells 1091", "Spells 1093", "Spells 1094", "Spells 1095", "Spells 1096", "Spells 1097", "Spells 1098", "Spells 1099"]
    for i, f_name in enumerate(level_7_fields):
        name_list = spells_by_level[7]
        fields[f_name] = name_list[i] if i < len(name_list) else ""

    # Nivel 8 - 5 campos visuales ordenados de arriba a abajo en la columna derecha (Y: 278 a 222)
    level_8_fields = ["Spells 10101", "Spells 10100", "Spells 10102", "Spells 10103", "Spells 10104"]
    for i, f_name in enumerate(level_8_fields):
        name_list = spells_by_level[8]
        fields[f_name] = name_list[i] if i < len(name_list) else ""

    # Nivel 9 - 9 campos visuales ordenados de arriba a abajo en la columna derecha (Y: 208 a 53)
    level_9_fields = ["Spells 10105", "Spells 10106", "Spells 10108", "Spells 10107", "Spells 10109", "Spells 101010", "Spells 101011", "Spells 101012", "Spells 101013"]
    for i, f_name in enumerate(level_9_fields):
        name_list = spells_by_level[9]
        fields[f_name] = name_list[i] if i < len(name_list) else ""

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
