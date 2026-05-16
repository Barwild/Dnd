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
    return db.query(models.Race).order_by(models.Race.name).all()


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
    return db.query(models.Class).order_by(models.Class.name).all()


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


# ═══════════════════════════════════════════════════════
# EQUIPMENT: MOUNTS, VEHICLES, TRADE GOODS, TOOLS, PACKS
# ═══════════════════════════════════════════════════════

@router.get("/mounts", response_model=List[schemas.MountResponse])
def list_mounts(db: Session = Depends(get_db)):
    return db.query(models.Mount).all()


@router.get("/mounts/{mount_id}", response_model=schemas.MountResponse)
def get_mount(mount_id: int, db: Session = Depends(get_db)):
    mount = db.query(models.Mount).filter(models.Mount.id == mount_id).first()
    if not mount:
        raise HTTPException(status_code=404, detail="Montura no encontrada")
    return mount


@router.get("/vehicles", response_model=List[schemas.VehicleResponse])
def list_vehicles(db: Session = Depends(get_db)):
    return db.query(models.Vehicle).all()


@router.get("/vehicles/{vehicle_id}", response_model=schemas.VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return vehicle


@router.get("/trade-goods", response_model=List[schemas.TradeGoodResponse])
def list_trade_goods(db: Session = Depends(get_db)):
    return db.query(models.TradeGood).all()


@router.get("/trade-goods/{trade_good_id}", response_model=schemas.TradeGoodResponse)
def get_trade_good(trade_good_id: int, db: Session = Depends(get_db)):
    trade_good = db.query(models.TradeGood).filter(models.TradeGood.id == trade_good_id).first()
    if not trade_good:
        raise HTTPException(status_code=404, detail="Bien comercial no encontrado")
    return trade_good


@router.get("/tools", response_model=List[schemas.ToolResponse])
def list_tools(db: Session = Depends(get_db)):
    return db.query(models.Tool).all()


@router.get("/tools/{tool_id}", response_model=schemas.ToolResponse)
def get_tool(tool_id: int, db: Session = Depends(get_db)):
    tool = db.query(models.Tool).filter(models.Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Herramienta no encontrada")
    return tool


@router.get("/equipment-packs", response_model=List[schemas.EquipmentPackResponse])
def list_equipment_packs(db: Session = Depends(get_db)):
    return db.query(models.EquipmentPack).all()


@router.get("/equipment-packs/{pack_id}", response_model=schemas.EquipmentPackResponse)
def get_equipment_pack(pack_id: int, db: Session = Depends(get_db)):
    pack = db.query(models.EquipmentPack).filter(models.EquipmentPack.id == pack_id).first()
    if not pack:
        raise HTTPException(status_code=404, detail="Paquete de equipo no encontrado")
    return pack


# ═══════════════════════════════════════════════════════
# RULES MECHANICS: ADVANTAGE, INSPIRATION, MULTICLASS, LEVELING
# ═══════════════════════════════════════════════════════

@router.get("/rules/advantage")
def list_advantage_rules(db: Session = Depends(get_db)):
    return db.query(models.AdvantageRule).all()


@router.get("/rules/inspiration")
def list_inspiration_rules(db: Session = Depends(get_db)):
    return db.query(models.InspirationRule).all()


@router.get("/rules/multiclass")
def list_multiclass_rules(db: Session = Depends(get_db)):
    return db.query(models.MulticlassRule).all()


@router.get("/rules/leveling/{class_name}", response_model=List[schemas.LevelingTableResponse])
def get_leveling_table(class_name: str, db: Session = Depends(get_db)):
    tables = db.query(models.LevelingTable).filter(models.LevelingTable.class_name == class_name).order_by(models.LevelingTable.level).all()
    if not tables:
        raise HTTPException(status_code=404, detail="Tabla de progreso no encontrada")
    return tables


@router.get("/rules/leveling/{class_name}/{level}", response_model=schemas.LevelingTableResponse)
def get_leveling_entry(class_name: str, level: int, db: Session = Depends(get_db)):
    entry = db.query(models.LevelingTable).filter(
        models.LevelingTable.class_name == class_name,
        models.LevelingTable.level == level
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail=f"Nivel {level} no encontrado para {class_name}")
    return entry


@router.get("/rules/proficiency-bonus")
def get_proficiency_bonus_table(db: Session = Depends(get_db)):
    # Fixed proficiency bonus table by level
    table = [
        {"level": 1, "bonus": 2},
        {"level": 2, "bonus": 2},
        {"level": 3, "bonus": 2},
        {"level": 4, "bonus": 2},
        {"level": 5, "bonus": 3},
        {"level": 6, "bonus": 3},
        {"level": 7, "bonus": 3},
        {"level": 8, "bonus": 3},
        {"level": 9, "bonus": 4},
        {"level": 10, "bonus": 4},
        {"level": 11, "bonus": 4},
        {"level": 12, "bonus": 4},
        {"level": 13, "bonus": 5},
        {"level": 14, "bonus": 5},
        {"level": 15, "bonus": 5},
        {"level": 16, "bonus": 5},
        {"level": 17, "bonus": 6},
        {"level": 18, "bonus": 6},
        {"level": 19, "bonus": 6},
        {"level": 20, "bonus": 6}
    ]
    return table
