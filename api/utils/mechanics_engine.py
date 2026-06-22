import math
import json
import os
import re
import unicodedata
from typing import Dict, List, Tuple, Optional
from sqlalchemy.orm import Session
import models

# Helper to clean feature names to snake_case indices
def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

def clean_index(name: str) -> str:
    s = strip_accents(name.lower().strip())
    s = re.sub(r'[^a-z0-9\s_-]', '', s)
    s = re.sub(r'[\s_-]+', '-', s)
    return s.strip('-')

# Bonificador de Competencia por Nivel acumulado
def get_proficiency_bonus(level: int) -> int:
    return 1 + math.ceil(level / 4)

# Percepción Pasiva oficial
def calculate_passive_perception(wisdom_score: int, proficient_in_perception: bool, level: int, has_advantage: bool = False, has_disadvantage: bool = False) -> int:
    wis_mod = math.floor((wisdom_score - 10) / 2)
    pb = get_proficiency_bonus(level) if proficient_in_perception else 0
    adj = 5 if has_advantage else (-5 if has_disadvantage else 0)
    return 10 + wis_mod + pb + adj

# Lógica de Descanso Corto
def apply_short_rest(character: models.Character, dice_spent: int, con_modifier: int, rolls: List[int], db: Session) -> Dict:
    if character.current_hit_dice < dice_spent:
        raise ValueError("No posees suficientes dados de golpe disponibles.")
    
    total_healing = sum(rolls) + (dice_spent * con_modifier)
    
    try:
        stats = json.loads(character.stats or "{}")
    except Exception:
        stats = {}
        
    current_hp = stats.get("currHP", 0)
    max_hp = stats.get("maxHP", 1)
    
    new_hp = min(max_hp, current_hp + total_healing)
    stats["currHP"] = new_hp
    
    # Recargar Pact Magic (Warlock)
    if character.char_class and character.char_class.index == "warlock":
        if "spellSlots" in stats:
            for lvl_key, slot in stats["spellSlots"].items():
                if slot.get("max", 0) > 0:
                    slot["used"] = 0
                    
    character.stats = json.dumps(stats)
    character.current_hit_dice = max(0, character.current_hit_dice - dice_spent)
    db.commit()
    return {"healed": total_healing, "new_hp": new_hp, "hit_dice_remaining": character.current_hit_dice}

# Lógica de Descanso Largo
def apply_long_rest(character: models.Character, db: Session) -> Dict:
    try:
        stats = json.loads(character.stats or "{}")
    except Exception:
        stats = {}
        
    max_hp = stats.get("maxHP", 1)
    stats["currHP"] = max_hp
    
    # Restaurar todos los spell slots
    if "spellSlots" in stats:
        for lvl_key, slot in stats["spellSlots"].items():
            slot["used"] = 0
            
    character.stats = json.dumps(stats)
    
    # Restaurar dados de golpe: mitad del nivel de personaje (mínimo 1)
    max_dice = character.level
    dice_to_recover = max(1, max_dice // 2)
    character.current_hit_dice = min(max_dice, character.current_hit_dice + dice_to_recover)
    
    # Restablecer tiradas de salvación de muerte
    character.death_saves_successes = 0
    character.death_saves_failures = 0
    
    # Reducir cansancio
    if character.exhaustion_levels > 0:
        character.exhaustion_levels -= 1
        
    db.commit()
    return {"recovered_hp": max_hp, "hit_dice_recovered": dice_to_recover, "exhaustion_level": character.exhaustion_levels}

# Tabla combinada de ranuras de multiclase (PHB pág. 165)
MULTICLASS_SLOTS_TABLE = [
    # [1º, 2º, 3º, 4º, 5º, 6º, 7º, 8º, 9º] ranuras
    [0, 0, 0, 0, 0, 0, 0, 0, 0], # Lvl 0
    [2, 0, 0, 0, 0, 0, 0, 0, 0], # Lvl 1
    [3, 0, 0, 0, 0, 0, 0, 0, 0], # Lvl 2
    [4, 2, 0, 0, 0, 0, 0, 0, 0], # Lvl 3
    [4, 3, 0, 0, 0, 0, 0, 0, 0], # Lvl 4
    [4, 3, 2, 0, 0, 0, 0, 0, 0], # Lvl 5
    [4, 3, 3, 0, 0, 0, 0, 0, 0], # Lvl 6
    [4, 3, 3, 1, 0, 0, 0, 0, 0], # Lvl 7
    [4, 3, 3, 2, 0, 0, 0, 0, 0], # Lvl 8
    [4, 3, 3, 3, 1, 0, 0, 0, 0], # Lvl 9
    [4, 3, 3, 3, 2, 0, 0, 0, 0], # Lvl 10
    [4, 3, 3, 3, 2, 1, 0, 0, 0], # Lvl 11
    [4, 3, 3, 3, 2, 1, 0, 0, 0], # Lvl 12
    [4, 3, 3, 3, 2, 1, 1, 0, 0], # Lvl 13
    [4, 3, 3, 3, 2, 1, 1, 0, 0], # Lvl 14
    [4, 3, 3, 3, 2, 1, 1, 1, 0], # Lvl 15
    [4, 3, 3, 3, 2, 1, 1, 1, 0], # Lvl 16
    [4, 3, 3, 3, 2, 1, 1, 1, 1], # Lvl 17
    [4, 3, 3, 3, 3, 1, 1, 1, 1], # Lvl 18
    [4, 3, 3, 3, 3, 2, 1, 1, 1], # Lvl 19
    [4, 3, 3, 3, 3, 2, 2, 1, 1]  # Lvl 20
]

def calculate_multiclass_spell_slots(classes_levels: List[Tuple[str, int]]) -> List[int]:
    combined_level = 0
    for cls_name, lvl in classes_levels:
        cls_clean = cls_name.lower().strip()
        if cls_clean in ["wizard", "cleric", "druid", "bard", "sorcerer", "mago", "clérigo", "druida", "hechicero"]:
            combined_level += lvl
        elif cls_clean in ["paladin", "ranger", "paladín", "explorador"]:
            combined_level += lvl // 2
        elif cls_clean in ["artificer", "artífice"]:
            # CRÍTICO: Redondeado hacia abajo en multiclase para evitar bugs de niveles mágicos
            combined_level += lvl // 2
            
    if combined_level == 0:
        return [0] * 9
    return MULTICLASS_SLOTS_TABLE[min(20, combined_level)]

# Requisitos mínimos de multiclase (Atributo >= 13)
MULTICLASS_REQUIREMENTS = {
    "barbarian": [("STR", 13)],
    "bárbaro": [("STR", 13)],
    "bard": [("CHA", 13)],
    "bardo": [("CHA", 13)],
    "cleric": [("WIS", 13)],
    "clérigo": [("WIS", 13)],
    "druid": [("WIS", 13)],
    "druida": [("WIS", 13)],
    "fighter": [("STR", 13), ("DEX", 13)],
    "guerrero": [("STR", 13), ("DEX", 13)],
    "monk": [("DEX", 13), ("WIS", 13)],
    "monje": [("DEX", 13), ("WIS", 13)],
    "paladin": [("STR", 13), ("CHA", 13)],
    "paladín": [("STR", 13), ("CHA", 13)],
    "ranger": [("DEX", 13), ("WIS", 13)],
    "explorador": [("DEX", 13), ("WIS", 13)],
    "rogue": [("DEX", 13)],
    "pícaro": [("DEX", 13)],
    "sorcerer": [("CHA", 13)],
    "hechicero": [("CHA", 13)],
    "warlock": [("CHA", 13)],
    "brujo": [("CHA", 13)],
    "wizard": [("INT", 13)],
    "mago": [("INT", 13)],
    "artificer": [("INT", 13)],
    "artífice": [("INT", 13)],
}

def validate_multiclass_requirements(char_class_index: str, stats: Dict[str, int]) -> bool:
    reqs = MULTICLASS_REQUIREMENTS.get(char_class_index.lower().strip(), [])
    if not reqs:
        return True
    if char_class_index.lower().strip() in ["fighter", "guerrero"]:
        return any(stats.get(attr, 10) >= val for attr, val in reqs)
    return all(stats.get(attr, 10) >= val for attr, val in reqs)


# MOTOR UNIVERSAL DE SUBIDA DE NIVEL
def handle_level_up_universal(character: models.Character, old_level: int, new_level: int, db: Session) -> Dict:
    """
    Controla la subida de nivel, añade rasgos correspondientes a `CharacterFeature`
    y determina qué decisiones del frontend requiere.
    """
    cls = character.char_class
    if not cls:
        cls = db.query(models.Class).filter(models.Class.id == character.class_id).first()
    
    if not cls:
        return {"requires_choice": False, "choice_type": None}
        
    cls_index = cls.index.lower().strip()
    
    # Load JSON
    utils_dir = os.path.dirname(os.path.abspath(__file__))
    api_dir = os.path.dirname(utils_dir)
    json_path = os.path.join(api_dir, "static", "compendium_progression.json")
    
    if not os.path.exists(json_path):
        return {"requires_choice": False, "choice_type": None}
        
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            prog_data = json.load(f)
    except Exception:
        return {"requires_choice": False, "choice_type": None}
        
    class_prog = prog_data.get(cls_index)
    if not class_prog:
        # Fallback: try finding class index by translating common ES/EN names
        translations = {
            "mago": "wizard", "clerigo": "cleric", "clérigo": "cleric",
            "druida": "druid", "bardo": "bard", "hechicero": "sorcerer",
            "paladin": "paladin", "paladín": "paladin", "explorador": "ranger",
            "guerrero": "fighter", "barbaro": "barbarian", "bárbaro": "barbarian",
            "monje": "monk", "picaro": "rogue", "pícaro": "rogue",
            "brujo": "warlock", "artifice": "artificer", "artífice": "artificer"
        }
        translated_index = translations.get(cls_index)
        class_prog = prog_data.get(translated_index)
        if class_prog:
            cls_index = translated_index
            
    if not class_prog:
        return {"requires_choice": False, "choice_type": None}
        
    features_prog = class_prog.get("features", {})
    subclass_level = class_prog.get("subclass_level", 3)
    
    # Add new features for each level between old and new
    added_features = []
    for lvl in range(old_level + 1, new_level + 1):
        lvl_features = features_prog.get(str(lvl), [])
        for feat_name in lvl_features:
            feat_idx = clean_index(feat_name)
            # Avoid duplicating features
            existing = db.query(models.CharacterFeature).filter(
                models.CharacterFeature.character_id == character.id,
                models.CharacterFeature.feature_index == feat_idx
            ).first()
            if not existing:
                new_feat = models.CharacterFeature(
                    character_id=character.id,
                    feature_index=feat_idx,
                    custom_modifiers=json.dumps({"name": feat_name})
                )
                db.add(new_feat)
                added_features.append(feat_name)

    # Check choices required at `new_level`
    requires_choice = False
    choice_type = None

    # 1. Subclass Selection
    if new_level >= subclass_level and not character.subclass_id:
        requires_choice = True
        choice_type = "SUBCLASS"

    # 2. Fighting Style Selection (Guerrero lvl 1, Paladín/Explorador lvl 2)
    elif (cls_index == "fighter" and new_level == 1) or (cls_index in ["paladin", "ranger"] and new_level == 2):
        requires_choice = True
        choice_type = "FIGHTING_STYLE"

    # 3. ASI or Feat Selection (levels 4, 8, 12, 16, 19 for most, plus extra for fighter/rogue)
    else:
        # Standard levels for ASI
        standard_asi = [4, 8, 12, 16, 19]
        is_asi = new_level in standard_asi
        if cls_index == "fighter" and new_level in [6, 14]:
            is_asi = True
        elif cls_index == "rogue" and new_level == 10:
            is_asi = True
            
        if is_asi:
            requires_choice = True
            choice_type = "ASI_OR_FEAT"

    db.commit()
    return {
        "requires_choice": requires_choice,
        "choice_type": choice_type,
        "added_features": added_features
    }

