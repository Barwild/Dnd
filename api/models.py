from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


# ═══════════════════════════════════════════════════════
# USERS & AUTH
# ═══════════════════════════════════════════════════════

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=False)
    role = Column(String(10), default="player")  # "player" or "dm"
    created_at = Column(String, default=lambda: datetime.now().isoformat())

    characters = relationship("Character", back_populates="owner")
    campaigns_as_dm = relationship("Campaign", back_populates="dm")


# ═══════════════════════════════════════════════════════
# CAMPAIGNS
# ═══════════════════════════════════════════════════════

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(6), unique=True, index=True, nullable=False)
    description = Column(Text, default="")
    dm_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(String, default=lambda: datetime.now().isoformat())

    dm = relationship("User", back_populates="campaigns_as_dm")
    members = relationship("CampaignMember", back_populates="campaign", cascade="all, delete-orphan")
    characters = relationship("Character", back_populates="campaign")
    sessions = relationship("SessionNote", back_populates="campaign", cascade="all, delete-orphan")
    encounters = relationship("Encounter", back_populates="campaign", cascade="all, delete-orphan")


class CampaignMember(Base):
    __tablename__ = "campaign_members"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(String, default=lambda: datetime.now().isoformat())

    campaign = relationship("Campaign", back_populates="members")
    user = relationship("User")


# ═══════════════════════════════════════════════════════
# CHARACTERS
# ═══════════════════════════════════════════════════════

class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    level = Column(Integer, default=1)
    race_id = Column(Integer, ForeignKey("races.id"))
    class_id = Column(Integer, ForeignKey("classes.id"))
    subclass_id = Column(Integer, ForeignKey("subclasses.id"), nullable=True)
    background_id = Column(Integer, ForeignKey("backgrounds.id"), nullable=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stats = Column(Text, default="{}")  # JSON: STR, DEX, CON, INT, WIS, CHA, currHP, maxHP, etc.
    equipment = Column(Text, default="[]")  # JSON array
    starting_equipment = Column(Text, default="[]")  # JSON array
    equipped_items = Column(Text, default="{}")  # JSON: {armor: item_id, weapon: item_id, shield: item_id, etc.}
    calculated_stats = Column(Text, default="{}")  # JSON: AC, damage, etc.
    spell_list = Column(Text, default="[]")  # JSON array of spell indexes
    notes = Column(Text, default="")
    portrait_url = Column(String(500), nullable=True)
    created_at = Column(String, default=lambda: datetime.now().isoformat())

    owner = relationship("User", back_populates="characters")
    campaign = relationship("Campaign", back_populates="characters")
    race = relationship("Race")
    char_class = relationship("Class")
    subclass = relationship("Subclass")
    background = relationship("Background")


# ═══════════════════════════════════════════════════════
# COMPENDIUM: RULES DATA (from dnd5eapi.co, translated to ES)
# ═══════════════════════════════════════════════════════

class Race(Base):
    __tablename__ = "races"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(String(50), unique=True, index=True)
    name = Column(String(100), nullable=False)
    speed = Column(Integer, default=30)
    ability_bonuses = Column(Text, default="[]")  # JSON
    alignment = Column(Text, default="")
    age = Column(Text, default="")
    size = Column(String(20), default="Mediano")
    size_description = Column(Text, default="")
    traits = Column(Text, default="[]")  # JSON
    languages = Column(Text, default="[]")  # JSON
    language_desc = Column(Text, default="")
    subraces = Column(Text, default="[]")  # JSON


class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(String(50), unique=True, index=True)
    name = Column(String(100), nullable=False)
    hit_die = Column(Integer, default=8)
    proficiencies = Column(Text, default="[]")  # JSON
    proficiency_choices = Column(Text, default="[]")  # JSON
    saving_throws = Column(Text, default="[]")  # JSON
    starting_equipment = Column(Text, default="[]")  # JSON
    starting_equipment_options = Column(Text, default="[]")  # JSON
    spellcasting = Column(Text, default="{}")  # JSON - null for non-casters
    class_levels_url = Column(String(200), default="")


class Subclass(Base):
    __tablename__ = "subclasses"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(String(50), unique=True, index=True)
    name = Column(String(100), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"))
    class_index = Column(String(50))
    description = Column(Text, default="")
    features = Column(Text, default="[]")  # JSON


class Background(Base):
    __tablename__ = "backgrounds"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(String(50), unique=True, index=True)
    name = Column(String(100), nullable=False)
    skill_proficiencies = Column(Text, default="[]")  # JSON
    tool_proficiencies = Column(Text, default="[]")  # JSON
    languages = Column(Text, default="[]")  # JSON
    equipment = Column(Text, default="[]")  # JSON
    feature_name = Column(String(200), default="")
    feature_desc = Column(Text, default="")


class Monster(Base):
    __tablename__ = "monsters"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(String(100), unique=True, index=True)
    name = Column(String(200), nullable=False)
    name_en = Column(String(200), default="")  # Keep english name for reference
    size = Column(String(30), default="")
    type = Column(String(50), default="")
    alignment = Column(String(100), default="")
    armor_class = Column(Integer, default=10)
    armor_class_type = Column(String(100), default="")
    hit_points = Column(Integer, default=1)
    hit_dice = Column(String(50), default="")
    speed = Column(Text, default="{}")  # JSON
    # Stats
    strength = Column(Integer, default=10)
    dexterity = Column(Integer, default=10)
    constitution = Column(Integer, default=10)
    intelligence = Column(Integer, default=10)
    wisdom = Column(Integer, default=10)
    charisma = Column(Integer, default=10)
    # Combat details
    proficiencies = Column(Text, default="[]")  # JSON
    damage_vulnerabilities = Column(Text, default="[]")  # JSON
    damage_resistances = Column(Text, default="[]")  # JSON
    damage_immunities = Column(Text, default="[]")  # JSON
    condition_immunities = Column(Text, default="[]")  # JSON
    senses = Column(Text, default="{}")  # JSON
    languages = Column(String(300), default="")
    challenge_rating = Column(String(10), default="0")
    xp = Column(Integer, default=0)
    proficiency_bonus = Column(Integer, default=2)
    # Abilities & Actions
    special_abilities = Column(Text, default="[]")  # JSON
    actions = Column(Text, default="[]")  # JSON
    legendary_actions = Column(Text, default="[]")  # JSON
    reactions = Column(Text, default="[]")  # JSON
    image_url = Column(String(500), nullable=True)


class Spell(Base):
    __tablename__ = "spells"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(String(100), unique=True, index=True)
    name = Column(String(200), nullable=False)
    name_en = Column(String(200), default="")
    level = Column(Integer, default=0)  # 0 = cantrip
    school = Column(String(50), default="")
    casting_time = Column(String(100), default="")
    range = Column(String(100), default="")
    components = Column(Text, default="[]")  # JSON: ["V", "S", "M"]
    material = Column(Text, default="")
    duration = Column(String(100), default="")
    concentration = Column(Boolean, default=False)
    ritual = Column(Boolean, default=False)
    description = Column(Text, default="")
    higher_levels = Column(Text, default="")
    classes = Column(Text, default="[]")  # JSON array of class indexes
    damage_type = Column(String(50), default="")
    damage_at_slot_level = Column(Text, default="{}")  # JSON


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(String(100), unique=True, index=True)
    name = Column(String(200), nullable=False)
    name_en = Column(String(200), default="")
    category = Column(String(100), default="")
    cost_quantity = Column(Integer, default=0)
    cost_unit = Column(String(10), default="gp")
    weight = Column(String(20), default="0")
    description = Column(Text, default="")
    properties = Column(Text, default="[]")  # JSON
    # Weapon specifics
    damage_dice = Column(String(20), default="")
    damage_type = Column(String(50), default="")
    weapon_range = Column(String(20), default="")
    # Armor specifics
    armor_class_base = Column(Integer, nullable=True)
    armor_class_dex_bonus = Column(Boolean, default=False)
    stealth_disadvantage = Column(Boolean, default=False)


class MagicItem(Base):
    __tablename__ = "magic_items"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(String(100), unique=True, index=True)
    name = Column(String(200), nullable=False)
    name_en = Column(String(200), default="")
    rarity = Column(String(50), default="")
    description = Column(Text, default="")
    requires_attunement = Column(Boolean, default=False)
    equipment_category = Column(String(100), default="")


class Feat(Base):
    __tablename__ = "feats"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(String(100), unique=True, index=True)
    name = Column(String(200), nullable=False)
    name_en = Column(String(200), default="")
    prerequisites = Column(Text, default="[]")  # JSON
    description = Column(Text, default="")


class Condition(Base):
    __tablename__ = "conditions"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(String(50), unique=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")


class DamageType(Base):
    __tablename__ = "damage_types"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(String(50), unique=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")


class Language(Base):
    __tablename__ = "languages"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(String(50), unique=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), default="")  # Standard or Exotic
    typical_speakers = Column(Text, default="")
    script = Column(String(50), default="")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(String(50), unique=True, index=True)
    name = Column(String(100), nullable=False)
    ability_score = Column(String(3), default="")  # STR, DEX, etc.
    description = Column(Text, default="")


# ═══════════════════════════════════════════════════════
# EQUIPMENT: MOUNTS, VEHICLES, TRADE GOODS, TOOLS, PACKS
# ═════════════════════════════════════════════════════

class Mount(Base):
    __tablename__ = "mounts"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(String(50), unique=True, index=True)
    name = Column(String(100), nullable=False)
    name_en = Column(String(100), default="")
    speed = Column(String(20), default="")
    capacity = Column(String(50), default="")
    cost_quantity = Column(Integer, default=0)
    cost_unit = Column(String(10), default="gp")
    description = Column(Text, default="")
    special_abilities = Column(Text, default="[]")  # JSON


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(String(50), unique=True, index=True)
    name = Column(String(100), nullable=False)
    name_en = Column(String(100), default="")
    vehicle_type = Column(String(50), default="")  # Water, Land, Air
    speed = Column(String(200), default="")
    capacity = Column(String(200), default="")
    cost_quantity = Column(Integer, default=0)
    cost_unit = Column(String(10), default="gp")
    description = Column(Text, default="")
    crew_required = Column(Integer, default=0)
    special_abilities = Column(Text, default="[]")  # JSON


class TradeGood(Base):
    __tablename__ = "trade_goods"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(String(50), unique=True, index=True)
    name = Column(String(100), nullable=False)
    name_en = Column(String(100), default="")
    category = Column(String(50), default="")  # Gemstone, Metal, etc.
    cost_quantity = Column(Integer, default=0)
    cost_unit = Column(String(10), default="gp")
    description = Column(Text, default="")
    availability = Column(String(20), default="Common")  # Common, Uncommon, Rare


class Tool(Base):
    __tablename__ = "tools"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(String(50), unique=True, index=True)
    name = Column(String(100), nullable=False)
    name_en = Column(String(100), default="")
    tool_type = Column(String(50), default="")  # Artisan, Gaming, Musical, etc.
    cost_quantity = Column(Integer, default=0)
    cost_unit = Column(String(10), default="gp")
    weight = Column(String(20), default="0")
    description = Column(Text, default="")
    ability_score = Column(String(3), default="")  # STR, DEX, INT, etc.


class EquipmentPack(Base):
    __tablename__ = "equipment_packs"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(String(50), unique=True, index=True)
    name = Column(String(100), nullable=False)
    name_en = Column(String(100), default="")
    pack_type = Column(String(50), default="")  # Class, Role, etc.
    cost_quantity = Column(Integer, default=0)
    cost_unit = Column(String(10), default="gp")
    description = Column(Text, default="")
    contents = Column(Text, default="[]")  # JSON array of items


# ═══════════════════════════════════════════════════════
# RULES MECHANICS: ADVANTAGE, INSPIRATION, MULTICLASS, LEVELING
# ═════════════════════════════════════════════════════

class AdvantageRule(Base):
    __tablename__ = "advantage_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    examples = Column(Text, default="[]")  # JSON array of examples


class InspirationRule(Base):
    __tablename__ = "inspiration_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    how_to_earn = Column(Text, default="")
    how_to_use = Column(Text, default="")


class MulticlassRule(Base):
    __tablename__ = "multiclass_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    requirements = Column(Text, default="[]")  # JSON array of requirements
    benefits = Column(Text, default="[]")  # JSON array of benefits


class LevelingTable(Base):
    __tablename__ = "leveling_tables"

    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String(50), nullable=False)
    level = Column(Integer, nullable=False)
    proficiency_bonus = Column(Integer, default=0)
    features = Column(Text, default="[]")  # JSON array of features
    spell_slots = Column(Text, default="{}")  # JSON object of spell slots per level
    cantrips_known = Column(Integer, default=0)
    spells_known = Column(Text, default="{}")  # JSON object of spells known per level

class Encounter(Base):
    __tablename__ = "encounters"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    name = Column(String(200), default="Encuentro")
    combatants = Column(Text, default="[]")  # JSON: [{name, type, hp, maxHp, ac, init, ...}]
    status = Column(String(20), default="preparing")  # preparing, active, finished
    current_round = Column(Integer, default=0)
    current_turn = Column(Integer, default=0)
    combat_log = Column(Text, default="[]")  # JSON array of log entries
    created_at = Column(String, default=lambda: datetime.now().isoformat())

    campaign = relationship("Campaign", back_populates="encounters")


class SessionNote(Base):
    __tablename__ = "session_notes"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    title = Column(String(200), default="Sesión")
    content = Column(Text, default="")
    session_number = Column(Integer, default=1)
    created_at = Column(String, default=lambda: datetime.now().isoformat())
    updated_at = Column(String, default=lambda: datetime.now().isoformat())

    campaign = relationship("Campaign", back_populates="sessions")


class DiceLog(Base):
    __tablename__ = "dice_logs"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    character_name = Column(String(100), default="")
    roll_type = Column(String(50), default="custom")  # attack, save, check, damage, custom
    dice_formula = Column(String(50), default="1d20")  # e.g., "2d6+3"
    results = Column(Text, default="[]")  # JSON: individual dice results
    total = Column(Integer, default=0)
    description = Column(String(200), default="")
    created_at = Column(String, default=lambda: datetime.now().isoformat())
