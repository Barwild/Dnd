import sys
import os
import pytest

# Add api/ directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.mechanics_engine import (
    get_proficiency_bonus,
    calculate_passive_perception,
    calculate_multiclass_spell_slots,
    validate_multiclass_requirements
)

def test_proficiency_bonus():
    # Level 1-4: +2
    assert get_proficiency_bonus(1) == 2
    assert get_proficiency_bonus(4) == 2
    # Level 5-8: +3
    assert get_proficiency_bonus(5) == 3
    assert get_proficiency_bonus(8) == 3
    # Level 9-12: +4
    assert get_proficiency_bonus(9) == 4
    # Level 17-20: +6
    assert get_proficiency_bonus(20) == 6

def test_passive_perception():
    # 10 + WIS mod (16 WIS -> +3) + PB (Level 1 -> +2) = 15
    assert calculate_passive_perception(16, True, 1) == 15
    # Without proficiency: 10 + WIS mod (+3) = 13
    assert calculate_passive_perception(16, False, 1) == 13
    # With advantage: 15 + 5 = 20
    assert calculate_passive_perception(16, True, 1, has_advantage=True) == 20
    # With disadvantage: 15 - 5 = 10
    assert calculate_passive_perception(16, True, 1, has_disadvantage=True) == 10

def test_multiclass_spell_slots():
    # 3 levels of Wizard (3rd level caster)
    # Combined level = 3. Slots: [4, 2, 0, 0, 0, 0, 0, 0, 0]
    assert calculate_multiclass_spell_slots([("wizard", 3)]) == [4, 2, 0, 0, 0, 0, 0, 0, 0]

    # 2 levels of Wizard, 2 levels of Cleric (4th level caster)
    # Combined level = 4. Slots: [4, 3, 0, 0, 0, 0, 0, 0, 0]
    assert calculate_multiclass_spell_slots([("wizard", 2), ("cleric", 2)]) == [4, 3, 0, 0, 0, 0, 0, 0, 0]

    # 4 levels of Paladin (Half caster -> level / 2 = 2)
    # Combined level = 2. Slots: [3, 0, 0, 0, 0, 0, 0, 0, 0]
    assert calculate_multiclass_spell_slots([("paladin", 4)]) == [3, 0, 0, 0, 0, 0, 0, 0, 0]

    # 3 levels of Artificer (counts as 3 // 2 = 1 in multiclass)
    # Combined level = 1. Slots: [2, 0, 0, 0, 0, 0, 0, 0, 0]
    assert calculate_multiclass_spell_slots([("artificer", 3)]) == [2, 0, 0, 0, 0, 0, 0, 0, 0]

def test_multiclass_requirements():
    # Wizard needs INT >= 13
    assert validate_multiclass_requirements("wizard", {"INT": 14}) is True
    assert validate_multiclass_requirements("wizard", {"INT": 12}) is False

    # Paladin needs STR >= 13 and CHA >= 13
    assert validate_multiclass_requirements("paladin", {"STR": 13, "CHA": 13}) is True
    assert validate_multiclass_requirements("paladin", {"STR": 12, "CHA": 13}) is False
