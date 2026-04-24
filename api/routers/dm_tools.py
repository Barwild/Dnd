import json
import re
import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(tags=["dm-tools"])


# ═══════════════════════════════════════════════════════
# ENCOUNTERS
# ═══════════════════════════════════════════════════════

@router.post("/encounters", response_model=schemas.EncounterResponse)
def create_encounter(data: schemas.EncounterCreate, db: Session = Depends(get_db),
                     current_user: models.User = Depends(get_current_user)):
    enc = models.Encounter(campaign_id=data.campaign_id, name=data.name)
    db.add(enc)
    db.commit()
    db.refresh(enc)
    return enc


@router.get("/encounters", response_model=List[schemas.EncounterResponse])
def list_encounters(campaign_id: int, db: Session = Depends(get_db),
                    current_user: models.User = Depends(get_current_user)):
    return db.query(models.Encounter).filter(
        models.Encounter.campaign_id == campaign_id
    ).order_by(models.Encounter.created_at.desc()).all()


@router.get("/encounters/{enc_id}", response_model=schemas.EncounterResponse)
def get_encounter(enc_id: int, db: Session = Depends(get_db),
                  current_user: models.User = Depends(get_current_user)):
    enc = db.query(models.Encounter).filter(models.Encounter.id == enc_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encuentro no encontrado")
    return enc


@router.put("/encounters/{enc_id}", response_model=schemas.EncounterResponse)
def update_encounter(enc_id: int, data: schemas.EncounterUpdate, db: Session = Depends(get_db),
                     current_user: models.User = Depends(get_current_user)):
    enc = db.query(models.Encounter).filter(models.Encounter.id == enc_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encuentro no encontrado")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(enc, key, value)
    db.commit()
    db.refresh(enc)
    return enc


@router.delete("/encounters/{enc_id}")
def delete_encounter(enc_id: int, db: Session = Depends(get_db),
                     current_user: models.User = Depends(get_current_user)):
    enc = db.query(models.Encounter).filter(models.Encounter.id == enc_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encuentro no encontrado")
    db.delete(enc)
    db.commit()
    return {"message": "Encuentro eliminado"}


# ═══════════════════════════════════════════════════════
# SESSION NOTES
# ═══════════════════════════════════════════════════════

@router.post("/sessions", response_model=schemas.SessionNoteResponse)
def create_session_note(data: schemas.SessionNoteCreate, db: Session = Depends(get_db),
                        current_user: models.User = Depends(get_current_user)):
    note = models.SessionNote(
        campaign_id=data.campaign_id,
        title=data.title,
        content=data.content,
        session_number=data.session_number
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/sessions", response_model=List[schemas.SessionNoteResponse])
def list_session_notes(campaign_id: int, db: Session = Depends(get_db),
                       current_user: models.User = Depends(get_current_user)):
    return db.query(models.SessionNote).filter(
        models.SessionNote.campaign_id == campaign_id
    ).order_by(models.SessionNote.session_number.desc()).all()


@router.put("/sessions/{note_id}", response_model=schemas.SessionNoteResponse)
def update_session_note(note_id: int, data: schemas.SessionNoteUpdate, db: Session = Depends(get_db),
                        current_user: models.User = Depends(get_current_user)):
    note = db.query(models.SessionNote).filter(models.SessionNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(note, key, value)
    note.updated_at = datetime.now().isoformat()
    db.commit()
    db.refresh(note)
    return note


@router.delete("/sessions/{note_id}")
def delete_session_note(note_id: int, db: Session = Depends(get_db),
                        current_user: models.User = Depends(get_current_user)):
    note = db.query(models.SessionNote).filter(models.SessionNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    db.delete(note)
    db.commit()
    return {"message": "Nota eliminada"}


# ═══════════════════════════════════════════════════════
# DICE ROLLER
# ═══════════════════════════════════════════════════════

def parse_and_roll(formula: str):
    """Parse a dice formula like '2d6+3' and roll it."""
    formula = formula.strip().lower()
    results = []
    total = 0
    
    # Split by + and - while keeping the operators
    parts = re.split(r'(\+|-)', formula)
    sign = 1
    
    for part in parts:
        part = part.strip()
        if part == '+':
            sign = 1
            continue
        elif part == '-':
            sign = -1
            continue
        elif not part:
            continue
        
        if 'd' in part:
            # Dice roll: NdM
            match = re.match(r'(\d*)d(\d+)', part)
            if match:
                num_dice = int(match.group(1)) if match.group(1) else 1
                die_faces = int(match.group(2))
                for _ in range(min(num_dice, 100)):  # Cap at 100 dice
                    roll = random.randint(1, die_faces)
                    results.append({"die": f"d{die_faces}", "result": roll * sign})
                    total += roll * sign
        else:
            # Fixed modifier
            try:
                mod = int(part) * sign
                results.append({"die": "mod", "result": mod})
                total += mod
            except ValueError:
                pass
    
    return results, total


@router.post("/dice/roll", response_model=schemas.DiceRollResponse)
def roll_dice(data: schemas.DiceRollRequest, db: Session = Depends(get_db),
              current_user: models.User = Depends(get_current_user)):
    """Realizar una tirada de dados."""
    results, total = parse_and_roll(data.dice_formula)
    
    log_entry = models.DiceLog(
        campaign_id=data.campaign_id,
        user_id=current_user.id,
        character_name=data.character_name,
        roll_type=data.roll_type,
        dice_formula=data.dice_formula,
        results=json.dumps(results),
        total=total,
        description=data.description
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    
    return schemas.DiceRollResponse(
        id=log_entry.id,
        user_id=log_entry.user_id,
        campaign_id=log_entry.campaign_id,
        character_name=log_entry.character_name,
        roll_type=log_entry.roll_type,
        dice_formula=log_entry.dice_formula,
        results=log_entry.results,
        total=log_entry.total,
        description=log_entry.description,
        created_at=log_entry.created_at,
        roller_name=current_user.display_name
    )


@router.get("/dice/log", response_model=List[schemas.DiceRollResponse])
def get_dice_log(campaign_id: int = None, limit: int = 50, db: Session = Depends(get_db),
                 current_user: models.User = Depends(get_current_user)):
    """Obtener el historial de tiradas."""
    q = db.query(models.DiceLog)
    if campaign_id:
        q = q.filter(models.DiceLog.campaign_id == campaign_id)
    else:
        q = q.filter(models.DiceLog.user_id == current_user.id)
    
    logs = q.order_by(models.DiceLog.created_at.desc()).limit(limit).all()
    result = []
    for log in logs:
        user = db.query(models.User).filter(models.User.id == log.user_id).first()
        result.append(schemas.DiceRollResponse(
            id=log.id, user_id=log.user_id,
            campaign_id=log.campaign_id, character_name=log.character_name,
            roll_type=log.roll_type, dice_formula=log.dice_formula,
            results=log.results, total=log.total,
            description=log.description, created_at=log.created_at,
            roller_name=user.display_name if user else ""
        ))
    return result
