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
    advantage = False
    disadvantage = False
    active_conds = []

    # Check conditions if character_id is provided
    if data.character_id:
        cond_records = db.query(models.CharacterCondition).filter(
            models.CharacterCondition.character_id == data.character_id
        ).all()
        active_conds = [c.condition_index.lower().strip() for c in cond_records]

        # Determine advantage/disadvantage based on condition indices
        if data.roll_type == "attack":
            if any(c in active_conds for c in ["blinded", "cegado", "frightened", "asustado", "poisoned", "envenenado", "prone", "tumbado", "restrained", "inmovilizado"]):
                disadvantage = True
        elif data.roll_type == "check":
            if any(c in active_conds for c in ["frightened", "asustado", "poisoned", "envenenado"]):
                disadvantage = True
        elif data.roll_type == "save":
            # Restrained gives disadvantage on DEX saves
            if "restrained" in active_conds or "inmovilizado" in active_conds:
                if "des" in data.description.lower() or "dex" in data.description.lower():
                    disadvantage = True

    # Check if formula contains 1d20 (case insensitive)
    formula_clean = data.dice_formula.strip().lower()
    is_d20_roll = "1d20" in formula_clean or (formula_clean.startswith("d20") and not formula_clean.startswith("d200"))

    results = []
    total = 0

    if is_d20_roll and (advantage or disadvantage):
        # We roll two d20s
        roll1 = random.randint(1, 20)
        roll2 = random.randint(1, 20)
        
        if advantage and not disadvantage:
            die_val = max(roll1, roll2)
            desc_suffix = f" (Ventaja: {roll1}, {roll2} -> se usa {die_val})"
        elif disadvantage and not advantage:
            die_val = min(roll1, roll2)
            desc_suffix = f" (Desventaja: {roll1}, {roll2} -> se usa {die_val})"
        else:
            die_val = roll1
            desc_suffix = ""

        # Parse formula but replace 1d20 or d20 with the die_val
        results.append({"die": "d20", "result": die_val})
        total += die_val
        
        # Add the rest of the formula
        mod_part = re.sub(r'1?d20', '', formula_clean).strip()
        if mod_part:
            # Parse fixed modifier
            # Split by + and -
            parts = re.split(r'(\+|-)', mod_part)
            sign = 1
            for part in parts:
                part = part.strip()
                if part == '+':
                    sign = 1
                elif part == '-':
                    sign = -1
                elif part:
                    try:
                        mod = int(part) * sign
                        results.append({"die": "mod", "result": mod})
                        total += mod
                    except ValueError:
                        pass
        
        desc = data.description + desc_suffix
    else:
        results, total = parse_and_roll(data.dice_formula)
        desc = data.description

    log_entry = models.DiceLog(
        campaign_id=data.campaign_id,
        user_id=current_user.id,
        character_name=data.character_name,
        roll_type=data.roll_type,
        dice_formula=data.dice_formula,
        results=json.dumps(results),
        total=total,
        description=desc
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
        roller_name=current_user.display_name,
        advantage=advantage and not disadvantage,
        disadvantage=disadvantage and not advantage
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
        # Query logs from DB may not have advantage/disadvantage saved as separate fields, so we fallback
        result.append(schemas.DiceRollResponse(
            id=log.id, user_id=log.user_id,
            campaign_id=log.campaign_id, character_name=log.character_name,
            roll_type=log.roll_type, dice_formula=log.dice_formula,
            results=log.results, total=log.total,
            description=log.description, created_at=log.created_at,
            roller_name=user.display_name if user else "",
            advantage=False, disadvantage=False
        ))
    return result


# Umbral de PX por nivel (Fácil, Medio, Difícil, Mortal)
XP_THRESHOLDS = {
    1: [25, 50, 75, 100],
    2: [50, 100, 150, 200],
    3: [75, 150, 225, 400],
    4: [125, 250, 375, 500],
    5: [250, 500, 750, 1100],
    6: [300, 600, 900, 1400],
    7: [350, 750, 1100, 1700],
    8: [450, 900, 1400, 2100],
    9: [550, 1100, 1600, 2400],
    10: [600, 1200, 1900, 2800],
    11: [800, 1600, 2400, 3600],
    12: [1000, 2000, 3000, 4500],
    13: [1100, 2200, 3400, 5100],
    14: [1250, 2500, 3800, 5700],
    15: [1400, 2800, 4300, 6400],
    16: [1600, 3200, 4800, 7200],
    17: [2000, 3900, 5900, 8800],
    18: [2100, 4200, 6300, 9500],
    19: [2400, 4900, 7300, 10900],
    20: [2800, 5700, 8500, 12700]
}


@router.get("/encounters/{enc_id}/difficulty")
def calculate_encounter_difficulty(enc_id: int, db: Session = Depends(get_db),
                                 current_user: models.User = Depends(get_current_user)):
    """
    Calcula la dificultad del encuentro según el reglamento del GDM (Pág. 82).
    """
    encounter = db.query(models.Encounter).filter(models.Encounter.id == enc_id).first()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encuentro no encontrado")
        
    campaign = encounter.campaign
    players = db.query(models.Character).filter(models.Character.campaign_id == campaign.id).all()
    
    # 1. Sumar umbrales de dificultad de toda la party
    party_thresholds = [0, 0, 0, 0]  # [Fácil, Medio, Difícil, Mortal]
    active_players_count = 0
    for char in players:
        active_players_count += 1
        lvl = max(1, min(20, char.level))
        thresh = XP_THRESHOLDS.get(lvl, [25, 50, 75, 100])
        for i in range(4):
            party_thresholds[i] += thresh[i]
            
    # 2. Calcular PX de monstruos
    try:
        combatants = json.loads(encounter.combatants or "[]")
    except Exception:
        combatants = []
        
    monsters = [c for c in combatants if c.get("type") == "monster"]
    raw_xp = 0
    for m in monsters:
        # Si el monstruo tiene xp directo lo sumamos, si no, intentamos obtener de db o CR
        xp_val = m.get("xp")
        if xp_val is None:
            cr = m.get("challenge_rating", "0")
            # Map standard CR to XP fallback
            cr_xp = {"0": 10, "1/8": 25, "1/4": 50, "1/2": 100, "1": 200, "2": 450, "3": 700, "4": 1100, "5": 1800}
            xp_val = cr_xp.get(str(cr), 200)
        raw_xp += xp_val
    
    # 3. Multiplicador de grupo por cantidad de monstruos
    num_monsters = len(monsters)
    multiplier = 1.0
    
    if active_players_count < 3:
        # Party pequeña: subir multiplicadores un nivel
        if num_monsters == 1: multiplier = 1.5
        elif num_monsters == 2: multiplier = 2.0
        elif 3 <= num_monsters <= 6: multiplier = 2.5
        elif 7 <= num_monsters <= 10: multiplier = 3.0
        elif 11 <= num_monsters <= 14: multiplier = 4.0
        elif num_monsters >= 15: multiplier = 5.0
    elif active_players_count > 5:
        # Party grande: bajar multiplicadores un nivel
        if num_monsters == 1: multiplier = 0.5
        elif num_monsters == 2: multiplier = 1.0
        elif 3 <= num_monsters <= 6: multiplier = 1.5
        elif 7 <= num_monsters <= 10: multiplier = 2.0
        elif 11 <= num_monsters <= 14: multiplier = 2.5
        elif num_monsters >= 15: multiplier = 3.0
    else:
        # Party estándar (3-5 jugadores)
        if num_monsters == 1: multiplier = 1.0
        elif num_monsters == 2: multiplier = 1.5
        elif 3 <= num_monsters <= 6: multiplier = 2.0
        elif 7 <= num_monsters <= 10: multiplier = 2.5
        elif 11 <= num_monsters <= 14: multiplier = 3.0
        elif num_monsters >= 15: multiplier = 4.0
        
    adjusted_xp = raw_xp * multiplier
    
    # 4. Clasificar dificultad
    difficulty = "Inofensivo"
    if active_players_count == 0:
        difficulty = "Sin jugadores"
    elif adjusted_xp >= party_thresholds[3]:
        difficulty = "Mortal"
    elif adjusted_xp >= party_thresholds[2]:
        difficulty = "Difícil"
    elif adjusted_xp >= party_thresholds[1]:
        difficulty = "Medio"
    elif adjusted_xp >= party_thresholds[0]:
        difficulty = "Fácil"
        
    return {
        "raw_xp": raw_xp,
        "adjusted_xp": adjusted_xp,
        "difficulty": difficulty,
        "party_count": active_players_count,
        "monster_count": num_monsters,
        "multiplier": multiplier,
        "thresholds": {
            "easy": party_thresholds[0],
            "medium": party_thresholds[1],
            "hard": party_thresholds[2],
            "deadly": party_thresholds[3]
        }
    }

