from pydantic import BaseModel
from typing import Optional, List


# ═══════════════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════════════

class UserRegister(BaseModel):
    username: str
    password: str
    display_name: str
    role: str = "player"  # "player" or "dm"


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    display_name: str
    role: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ═══════════════════════════════════════════════════════
# EQUIPMENT: MOUNTS, VEHICLES, TRADE GOODS, TOOLS, PACKS
# ═══════════════════════════════════════════════════════

class MountResponse(BaseModel):
    id: int
    index: str
    name: str
    name_en: str
    speed: str
    capacity: str
    cost_quantity: int
    cost_unit: str
    description: str
    special_abilities: list

    class Config:
        from_attributes = True


class VehicleResponse(BaseModel):
    id: int
    index: str
    name: str
    name_en: str
    vehicle_type: str
    speed: str
    capacity: str
    cost_quantity: int
    cost_unit: str
    description: str
    crew_required: int
    special_abilities: list

    class Config:
        from_attributes = True


class TradeGoodResponse(BaseModel):
    id: int
    index: str
    name: str
    name_en: str
    category: str
    cost_quantity: int
    cost_unit: str
    description: str
    availability: str

    class Config:
        from_attributes = True


class ToolResponse(BaseModel):
    id: int
    index: str
    name: str
    name_en: str
    tool_type: str
    cost_quantity: int
    cost_unit: str
    weight: str
    description: str
    ability_score: str

    class Config:
        from_attributes = True


class EquipmentPackResponse(BaseModel):
    id: int
    index: str
    name: str
    name_en: str
    pack_type: str
    cost_quantity: int
    cost_unit: str
    description: str
    contents: list

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════
# RULES MECHANICS: ADVANTAGE, INSPIRATION, MULTICLASS, LEVELING
# ═════════════════════════════════════════════════════

class AdvantageRuleResponse(BaseModel):
    id: int
    name: str
    description: str
    examples: list

    class Config:
        from_attributes = True


class InspirationRuleResponse(BaseModel):
    id: int
    name: str
    description: str
    how_to_earn: str
    how_to_use: str

    class Config:
        from_attributes = True


class MulticlassRuleResponse(BaseModel):
    id: int
    name: str
    description: str
    requirements: list
    benefits: list

    class Config:
        from_attributes = True


class LevelingTableResponse(BaseModel):
    id: int
    class_name: str
    level: int
    proficiency_bonus: int
    features: list
    spell_slots: dict
    cantrips_known: int
    spells_known: dict

    class Config:
        from_attributes = True

class CampaignCreate(BaseModel):
    name: str
    description: str = ""


class CampaignResponse(BaseModel):
    id: int
    name: str
    code: str
    description: str
    dm_user_id: int
    created_at: Optional[str] = None
    member_count: Optional[int] = 0
    dm_name: Optional[str] = ""

    class Config:
        from_attributes = True


class CampaignJoin(BaseModel):
    code: str


# ═══════════════════════════════════════════════════════
# CHARACTERS
# ═══════════════════════════════════════════════════════

class CharacterCreate(BaseModel):
    name: str
    level: int = 1
    race_id: Optional[int] = None
    class_id: Optional[int] = None
    subclass_id: Optional[int] = None
    background_id: Optional[int] = None
    campaign_id: Optional[int] = None
    stats: str = "{}"
    equipment: str = "[]"
    starting_equipment: Optional[str] = None
    spell_list: str = "[]"
    notes: str = ""
    portrait_url: Optional[str] = None


class CharacterUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[int] = None
    subclass_id: Optional[int] = None
    campaign_id: Optional[int] = None
    user_id: Optional[int] = None
    stats: Optional[str] = None
    equipment: Optional[str] = None
    starting_equipment: Optional[str] = None
    spell_list: Optional[str] = None
    notes: Optional[str] = None
    portrait_url: Optional[str] = None


class CharacterResponse(BaseModel):
    id: int
    name: str
    level: int
    race_id: Optional[int] = None
    class_id: Optional[int] = None
    subclass_id: Optional[int] = None
    background_id: Optional[int] = None
    campaign_id: Optional[int] = None
    user_id: int
    stats: str
    equipment: str
    starting_equipment: Optional[str] = None
    spell_list: str
    notes: str
    portrait_url: Optional[str] = None
    created_at: Optional[str] = None
    owner_name: Optional[str] = ""
    race_name: Optional[str] = ""
    class_name: Optional[str] = ""

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════
# COMPENDIUM (Read-only responses)
# ═══════════════════════════════════════════════════════

class MonsterResponse(BaseModel):
    id: int
    index: str
    name: str
    name_en: str
    size: str
    type: str
    alignment: str
    armor_class: int
    armor_class_type: str
    hit_points: int
    hit_dice: str
    speed: str
    strength: int
    dexterity: int
    constitution: int
    intelligence: int
    wisdom: int
    charisma: int
    proficiencies: str
    damage_vulnerabilities: str
    damage_resistances: str
    damage_immunities: str
    condition_immunities: str
    senses: str
    languages: str
    challenge_rating: str
    xp: int
    proficiency_bonus: int
    special_abilities: str
    actions: str
    legendary_actions: str
    reactions: str
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


class MonsterListItem(BaseModel):
    id: int
    index: str
    name: str
    type: str
    challenge_rating: str
    armor_class: int
    hit_points: int
    xp: int

    class Config:
        from_attributes = True


class SpellResponse(BaseModel):
    id: int
    index: str
    name: str
    name_en: str
    level: int
    school: str
    casting_time: str
    range: str
    components: str
    material: str
    duration: str
    concentration: bool
    ritual: bool
    description: str
    higher_levels: str
    classes: str
    damage_type: str

    class Config:
        from_attributes = True


class ItemResponse(BaseModel):
    id: int
    index: str
    name: str
    name_en: str
    category: str
    cost_quantity: int
    cost_unit: str
    weight: str
    description: str
    properties: str
    damage_dice: str
    damage_type: str

    class Config:
        from_attributes = True


class RaceResponse(BaseModel):
    id: int
    index: str
    name: str
    speed: int
    ability_bonuses: str
    alignment: str
    age: str
    size: str
    traits: str
    languages: str
    subraces: Optional[str] = None

    class Config:
        from_attributes = True


class ClassResponse(BaseModel):
    id: int
    index: str
    name: str
    hit_die: int
    proficiencies: str
    proficiency_choices: str
    saving_throws: str
    starting_equipment: str
    starting_equipment_options: str
    spellcasting: str

    class Config:
        from_attributes = True


class SubclassResponse(BaseModel):
    id: int
    index: str
    name: str
    class_id: int
    class_index: str
    description: str
    features: str

    class Config:
        from_attributes = True


class BackgroundResponse(BaseModel):
    id: int
    index: str
    name: str
    skill_proficiencies: str
    tool_proficiencies: str
    languages: str
    equipment: str
    feature_name: str
    feature_desc: str

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════
# DM TOOLS
# ═══════════════════════════════════════════════════════

class EncounterCreate(BaseModel):
    campaign_id: int
    name: str = "Encuentro"


class EncounterUpdate(BaseModel):
    name: Optional[str] = None
    combatants: Optional[str] = None
    status: Optional[str] = None
    current_round: Optional[int] = None
    current_turn: Optional[int] = None
    combat_log: Optional[str] = None


class EncounterResponse(BaseModel):
    id: int
    campaign_id: int
    name: str
    combatants: str
    status: str
    current_round: int
    current_turn: int
    combat_log: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class SessionNoteCreate(BaseModel):
    campaign_id: int
    title: str = "Sesión"
    content: str = ""
    session_number: int = 1


class SessionNoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class SessionNoteResponse(BaseModel):
    id: int
    campaign_id: int
    title: str
    content: str
    session_number: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class DiceRollRequest(BaseModel):
    campaign_id: Optional[int] = None
    character_name: str = ""
    roll_type: str = "custom"
    dice_formula: str = "1d20"
    description: str = ""


class DiceRollResponse(BaseModel):
    id: int
    user_id: int
    campaign_id: Optional[int] = None
    character_name: str
    roll_type: str
    dice_formula: str
    results: str
    total: int
    description: str
    created_at: Optional[str] = None
    roller_name: Optional[str] = ""

    class Config:
        from_attributes = True
