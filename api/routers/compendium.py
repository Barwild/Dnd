from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
import models
import schemas

router = APIRouter(prefix="/compendium", tags=["compendium"])


# ═══════════════════════════════════════════════════════
# MONSTERS
# ═══════════════════════════════════════════════════════

@router.get("/monsters", response_model=List[schemas.MonsterListItem])
def list_monsters(
    skip: int = 0, limit: int = 50,
    search: str = "", cr: str = "", type: str = "",
    db: Session = Depends(get_db)
):
    """Listar monstruos con búsqueda y filtros."""
    q = db.query(models.Monster)
    if search:
        q = q.filter(models.Monster.name.ilike(f"%{search}%"))
    if cr:
        q = q.filter(models.Monster.challenge_rating == cr)
    if type:
        q = q.filter(models.Monster.type.ilike(f"%{type}%"))
    q = q.order_by(models.Monster.name)
    return q.offset(skip).limit(limit).all()


@router.get("/monsters/count")
def count_monsters(search: str = "", cr: str = "", type: str = "", db: Session = Depends(get_db)):
    q = db.query(models.Monster)
    if search:
        q = q.filter(models.Monster.name.ilike(f"%{search}%"))
    if cr:
        q = q.filter(models.Monster.challenge_rating == cr)
    if type:
        q = q.filter(models.Monster.type.ilike(f"%{type}%"))
    return {"count": q.count()}


@router.get("/monsters/{monster_id}", response_model=schemas.MonsterResponse)
def get_monster(monster_id: int, db: Session = Depends(get_db)):
    monster = db.query(models.Monster).filter(models.Monster.id == monster_id).first()
    if not monster:
        raise HTTPException(status_code=404, detail="Monstruo no encontrado")
    return monster


@router.get("/monsters/index/{index}", response_model=schemas.MonsterResponse)
def get_monster_by_index(index: str, db: Session = Depends(get_db)):
    monster = db.query(models.Monster).filter(models.Monster.index == index).first()
    if not monster:
        raise HTTPException(status_code=404, detail="Monstruo no encontrado")
    return monster


# ═══════════════════════════════════════════════════════
# SPELLS
# ═══════════════════════════════════════════════════════

@router.get("/spells", response_model=List[schemas.SpellResponse])
def list_spells(
    skip: int = 0, limit: int = 50,
    search: str = "", level: Optional[int] = None,
    school: str = "", class_filter: str = "",
    db: Session = Depends(get_db)
):
    q = db.query(models.Spell)
    if search:
        q = q.filter(models.Spell.name.ilike(f"%{search}%"))
    if level is not None:
        q = q.filter(models.Spell.level == level)
    if school:
        q = q.filter(models.Spell.school.ilike(f"%{school}%"))
    if class_filter:
        q = q.filter(models.Spell.classes.ilike(f"%{class_filter}%"))
    q = q.order_by(models.Spell.level, models.Spell.name)
    return q.offset(skip).limit(limit).all()


@router.get("/spells/count")
def count_spells(search: str = "", level: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(models.Spell)
    if search:
        q = q.filter(models.Spell.name.ilike(f"%{search}%"))
    if level is not None:
        q = q.filter(models.Spell.level == level)
    return {"count": q.count()}


@router.get("/spells/{spell_id}", response_model=schemas.SpellResponse)
def get_spell(spell_id: int, db: Session = Depends(get_db)):
    spell = db.query(models.Spell).filter(models.Spell.id == spell_id).first()
    if not spell:
        raise HTTPException(status_code=404, detail="Hechizo no encontrado")
    return spell


# ═══════════════════════════════════════════════════════
# ITEMS
# ═══════════════════════════════════════════════════════

@router.get("/items", response_model=List[schemas.ItemResponse])
def list_items(
    skip: int = 0, limit: int = 50,
    search: str = "", category: str = "",
    db: Session = Depends(get_db)
):
    q = db.query(models.Item)
    if search:
        q = q.filter(models.Item.name.ilike(f"%{search}%"))
    if category:
        q = q.filter(models.Item.category.ilike(f"%{category}%"))
    q = q.order_by(models.Item.category, models.Item.name)
    return q.offset(skip).limit(limit).all()


@router.get("/items/{item_id}", response_model=schemas.ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Objeto no encontrado")
    return item


# ═══════════════════════════════════════════════════════
# MAGIC ITEMS
# ═══════════════════════════════════════════════════════

@router.get("/magic-items")
def list_magic_items(skip: int = 0, limit: int = 50, search: str = "",
                     rarity: str = "", db: Session = Depends(get_db)):
    q = db.query(models.MagicItem)
    if search:
        q = q.filter(models.MagicItem.name.ilike(f"%{search}%"))
    if rarity:
        q = q.filter(models.MagicItem.rarity.ilike(f"%{rarity}%"))
    q = q.order_by(models.MagicItem.name)
    return q.offset(skip).limit(limit).all()


# ═══════════════════════════════════════════════════════
# RACES
# ═══════════════════════════════════════════════════════

@router.get("/races", response_model=List[schemas.RaceResponse])
def list_races(db: Session = Depends(get_db)):
    return db.query(models.Race).all()


@router.get("/races/{race_id}", response_model=schemas.RaceResponse)
def get_race(race_id: int, db: Session = Depends(get_db)):
    race = db.query(models.Race).filter(models.Race.id == race_id).first()
    if not race:
        raise HTTPException(status_code=404, detail="Raza no encontrada")
    return race


# ═══════════════════════════════════════════════════════
# CLASSES
# ═══════════════════════════════════════════════════════

@router.get("/classes", response_model=List[schemas.ClassResponse])
def list_classes(db: Session = Depends(get_db)):
    return db.query(models.Class).all()


@router.get("/classes/{class_id}", response_model=schemas.ClassResponse)
def get_class(class_id: int, db: Session = Depends(get_db)):
    cls = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
    return cls


# ═══════════════════════════════════════════════════════
# SUBCLASSES
# ═══════════════════════════════════════════════════════

@router.get("/subclasses", response_model=List[schemas.SubclassResponse])
def list_subclasses(class_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(models.Subclass)
    if class_id is not None:
        q = q.filter(models.Subclass.class_id == class_id)
    return q.all()


# ═══════════════════════════════════════════════════════
# BACKGROUNDS
# ═══════════════════════════════════════════════════════

@router.get("/backgrounds", response_model=List[schemas.BackgroundResponse])
def list_backgrounds(db: Session = Depends(get_db)):
    return db.query(models.Background).all()


# ═══════════════════════════════════════════════════════
# SKILLS, CONDITIONS, DAMAGE TYPES, LANGUAGES, FEATS
# ═══════════════════════════════════════════════════════

@router.get("/skills")
def list_skills(db: Session = Depends(get_db)):
    return db.query(models.Skill).all()


@router.get("/conditions")
def list_conditions(db: Session = Depends(get_db)):
    return db.query(models.Condition).all()


@router.get("/damage-types")
def list_damage_types(db: Session = Depends(get_db)):
    return db.query(models.DamageType).all()


@router.get("/languages")
def list_languages(db: Session = Depends(get_db)):
    return db.query(models.Language).all()


@router.get("/feats")
def list_feats(db: Session = Depends(get_db)):
    return db.query(models.Feat).all()
