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
        spell_list=data.spell_list,
        notes=data.notes,
        portrait_url=data.portrait_url
    )
    db.add(character)
    db.commit()
    db.refresh(character)
    return _char_response(character, db)


@router.get("", response_model=List[schemas.CharacterResponse])
def get_characters(campaign_id: int = None, db: Session = Depends(get_db),
                   current_user: models.User = Depends(get_current_user)):
    """Obtener personajes. Si campaign_id se pasa, devuelve los de esa campaña."""
    q = db.query(models.Character)
    if campaign_id is not None:
        q = q.filter(models.Character.campaign_id == campaign_id)
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
    return _char_response(character, db)


@router.delete("/{char_id}")
def delete_character(char_id: int, db: Session = Depends(get_db),
                     current_user: models.User = Depends(get_current_user)):
    character = db.query(models.Character).filter(models.Character.id == char_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Personaje no encontrado")
    if character.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el dueño puede eliminar el personaje")
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
        spell_list=char.spell_list, notes=char.notes,
        portrait_url=char.portrait_url, created_at=char.created_at,
        owner_name=owner.display_name if owner else "",
        race_name=race.name if race else "",
        class_name=cls.name if cls else ""
    )
