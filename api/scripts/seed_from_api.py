"""
Seed the database from the D&D 5E API (dnd5eapi.co) with Spanish translations.
Run: python scripts/seed_from_api.py
"""
import sys
import os
import json
import time
import requests

# Add parent dir to path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, SessionLocal, Base
import models
from scripts.translations import (
    RACES, SUBRACES, CLASSES, SUBCLASSES, ABILITY_SCORES, SKILLS,
    MAGIC_SCHOOLS, DAMAGE_TYPES, CONDITIONS, SIZES, MONSTER_TYPES,
    ALIGNMENTS, LANGUAGES, RARITIES, BACKGROUNDS, SPELLS, MONSTERS,
    EQUIPMENT_CATEGORIES, WEAPON_PROPERTIES, translate, translate_text_block
)

API_BASE = "https://www.dnd5eapi.co"
API_2014 = f"{API_BASE}/api/2014"

# Create all tables
Base.metadata.create_all(bind=engine)
db = SessionLocal()


def fetch(url):
    """Fetch JSON from the API with retry."""
    full_url = f"{API_BASE}{url}" if url.startswith("/api") else url
    for attempt in range(3):
        try:
            r = requests.get(full_url, timeout=30)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f"  ⚠ Retry {attempt+1}/3 for {url}: {e}")
            time.sleep(1)
    print(f"  ✗ Failed to fetch {url}")
    return None


def t_alignment(text):
    return translate(text, ALIGNMENTS) if text else ""

def t_size(text):
    return translate(text, SIZES) if text else ""

def t_type(text):
    return translate(text, MONSTER_TYPES) if text else ""

def t_school(text):
    return translate(text, MAGIC_SCHOOLS) if text else ""

def t_damage(text):
    return translate(text, DAMAGE_TYPES) if text else ""

def t_condition(text):
    return translate(text, CONDITIONS) if text else ""


# ═══════════════════════════════════════════════════════
# SEED RACES
# ═══════════════════════════════════════════════════════
def seed_races():
    print("\n🧬 Seeding Races...")
    data = fetch(f"{API_2014}/races")
    if not data:
        return
    
    for item in data.get("results", []):
        detail = fetch(item["url"])
        if not detail:
            continue
        
        idx = detail["index"]
        name_es = RACES.get(idx, detail["name"])
        
        # Parse ability bonuses
        bonuses = []
        for ab in detail.get("ability_bonuses", []):
            score_name = ABILITY_SCORES.get(ab["ability_score"]["index"], ab["ability_score"]["name"])
            bonuses.append({"ability": score_name, "bonus": ab["bonus"]})
        
        # Parse traits
        traits = [{"name": t["name"], "index": t["index"]} for t in detail.get("traits", [])]
        
        # Parse languages
        langs = [LANGUAGES.get(l["index"], l["name"]) for l in detail.get("languages", [])]
        
        # Parse subraces
        subs = [{"name": SUBRACES.get(s["index"], s["name"]), "index": s["index"]} for s in detail.get("subraces", [])]
        
        race = models.Race(
            index=idx,
            name=name_es,
            speed=detail.get("speed", 30),
            ability_bonuses=json.dumps(bonuses, ensure_ascii=False),
            alignment=t_alignment(detail.get("alignment_desc", detail.get("alignment", ""))),
            age=detail.get("age", ""),
            size=t_size(detail.get("size", "Medium")),
            size_description=detail.get("size_description", ""),
            traits=json.dumps(traits, ensure_ascii=False),
            languages=json.dumps(langs, ensure_ascii=False),
            language_desc=detail.get("language_desc", ""),
            subraces=json.dumps(subs, ensure_ascii=False)
        )
        db.merge(race)
        print(f"  ✓ {name_es}")
    
    db.commit()


# ═══════════════════════════════════════════════════════
# SEED CLASSES
# ═══════════════════════════════════════════════════════
def seed_classes():
    print("\n⚔️ Seeding Classes...")
    data = fetch(f"{API_2014}/classes")
    if not data:
        return
    
    for item in data.get("results", []):
        detail = fetch(item["url"])
        if not detail:
            continue
        
        idx = detail["index"]
        name_es = CLASSES.get(idx, detail["name"])
        
        # Proficiencies
        profs = [p["name"] for p in detail.get("proficiencies", [])]
        
        # Proficiency choices
        prof_choices = []
        for pc in detail.get("proficiency_choices", []):
            options = []
            if pc.get("from", {}).get("options"):
                for opt in pc["from"]["options"]:
                    if opt.get("item"):
                        opt_name = opt["item"]["name"]
                        # Translate skill names
                        skill_idx = opt["item"].get("index", "")
                        if skill_idx.startswith("skill-"):
                            skill_key = skill_idx.replace("skill-", "")
                            opt_name = SKILLS.get(skill_key, opt_name)
                        options.append(opt_name)
            prof_choices.append({"choose": pc.get("choose", 1), "options": options, "desc": pc.get("desc", "")})
        
        # Saving throws
        saves = [ABILITY_SCORES.get(s["index"], s["name"]) for s in detail.get("saving_throws", [])]
        
        # Starting equipment
        start_eq = []
        for se in detail.get("starting_equipment", []):
            start_eq.append({"name": se["equipment"]["name"], "quantity": se.get("quantity", 1)})
        
        # Starting equipment options
        start_eq_opts = []
        for seo in detail.get("starting_equipment_options", []):
            start_eq_opts.append({"desc": seo.get("desc", ""), "choose": seo.get("choose", 1)})
        
        # Spellcasting
        spellcasting = {}
        if detail.get("spellcasting"):
            sc = detail["spellcasting"]
            spellcasting = {
                "level": sc.get("level", 1),
                "spellcasting_ability": ABILITY_SCORES.get(
                    sc.get("spellcasting_ability", {}).get("index", ""),
                    sc.get("spellcasting_ability", {}).get("name", "")
                )
            }
        
        cls = models.Class(
            index=idx,
            name=name_es,
            hit_die=detail.get("hit_die", 8),
            proficiencies=json.dumps(profs, ensure_ascii=False),
            proficiency_choices=json.dumps(prof_choices, ensure_ascii=False),
            saving_throws=json.dumps(saves, ensure_ascii=False),
            starting_equipment=json.dumps(start_eq, ensure_ascii=False),
            starting_equipment_options=json.dumps(start_eq_opts, ensure_ascii=False),
            spellcasting=json.dumps(spellcasting, ensure_ascii=False),
            class_levels_url=detail.get("class_levels", "")
        )
        db.merge(cls)
        print(f"  ✓ {name_es} (d{detail.get('hit_die', 8)})")
    
    db.commit()


# ═══════════════════════════════════════════════════════
# SEED SUBCLASSES
# ═══════════════════════════════════════════════════════
def seed_subclasses():
    print("\n🛡️ Seeding Subclasses...")
    data = fetch(f"{API_2014}/subclasses")
    if not data:
        return
    
    for item in data.get("results", []):
        detail = fetch(item["url"])
        if not detail:
            continue
        
        idx = detail["index"]
        name_es = SUBCLASSES.get(idx, detail["name"])
        class_index = detail.get("class", {}).get("index", "")
        
        # Get class_id from our DB
        parent_class = db.query(models.Class).filter(models.Class.index == class_index).first()
        class_id = parent_class.id if parent_class else None
        
        desc_parts = detail.get("desc", [])
        description = "\n".join(desc_parts) if isinstance(desc_parts, list) else str(desc_parts)
        
        sc = models.Subclass(
            index=idx,
            name=name_es,
            class_id=class_id,
            class_index=class_index,
            description=description,
            features=json.dumps([], ensure_ascii=False)
        )
        db.merge(sc)
        print(f"  ✓ {name_es} ({class_index})")
    
    db.commit()


# ═══════════════════════════════════════════════════════
# SEED BACKGROUNDS
# ═══════════════════════════════════════════════════════
def seed_backgrounds():
    print("\n📜 Seeding Backgrounds...")
    data = fetch(f"{API_2014}/backgrounds")
    if not data:
        return
    
    for item in data.get("results", []):
        detail = fetch(item["url"])
        if not detail:
            continue
        
        idx = detail["index"]
        name_es = BACKGROUNDS.get(idx, detail["name"])
        
        skill_profs = []
        for sp in detail.get("starting_proficiencies", []):
            skill_idx = sp.get("index", "")
            if skill_idx.startswith("skill-"):
                skill_key = skill_idx.replace("skill-", "")
                skill_profs.append(SKILLS.get(skill_key, sp["name"]))
            else:
                skill_profs.append(sp["name"])
        
        feature = detail.get("feature", {})
        
        bg = models.Background(
            index=idx,
            name=name_es,
            skill_proficiencies=json.dumps(skill_profs, ensure_ascii=False),
            tool_proficiencies=json.dumps([], ensure_ascii=False),
            languages=json.dumps([], ensure_ascii=False),
            equipment=json.dumps([], ensure_ascii=False),
            feature_name=feature.get("name", ""),
            feature_desc="\n".join(feature.get("desc", [])) if isinstance(feature.get("desc"), list) else feature.get("desc", "")
        )
        db.merge(bg)
        print(f"  ✓ {name_es}")
    
    db.commit()


# ═══════════════════════════════════════════════════════
# SEED MONSTERS
# ═══════════════════════════════════════════════════════
def seed_monsters():
    print("\n🐉 Seeding Monsters...")
    data = fetch(f"{API_2014}/monsters")
    if not data:
        return
    
    total = len(data.get("results", []))
    for i, item in enumerate(data.get("results", [])):
        detail = fetch(item["url"])
        if not detail:
            continue
        
        idx = detail["index"]
        name_en = detail["name"]
        name_es = MONSTERS.get(idx, name_en)
        
        # Parse AC
        ac_list = detail.get("armor_class", [])
        ac_val = ac_list[0].get("value", 10) if ac_list else 10
        ac_type = ac_list[0].get("type", "") if ac_list else ""
        
        # Parse speed
        speed = detail.get("speed", {})
        
        # Proficiencies
        profs = []
        for p in detail.get("proficiencies", []):
            profs.append({
                "name": p["proficiency"]["name"],
                "value": p["value"]
            })
        
        # Damage arrays
        dmg_vuln = [t_damage(d) for d in detail.get("damage_vulnerabilities", [])]
        dmg_res = [t_damage(d) for d in detail.get("damage_resistances", [])]
        dmg_imm = [t_damage(d) for d in detail.get("damage_immunities", [])]
        cond_imm = [t_condition(c.get("name", c) if isinstance(c, dict) else c) for c in detail.get("condition_immunities", [])]
        
        # Senses
        senses = detail.get("senses", {})
        
        # Special abilities
        special = []
        for sa in detail.get("special_abilities", []):
            special.append({"name": sa["name"], "desc": sa["desc"]})
        
        # Actions
        actions = []
        for act in detail.get("actions", []):
            action_data = {"name": act["name"], "desc": act["desc"]}
            if act.get("attack_bonus"):
                action_data["attack_bonus"] = act["attack_bonus"]
            if act.get("damage"):
                action_data["damage"] = [
                    {
                        "type": d.get("damage_type", {}).get("name", ""),
                        "dice": d.get("damage_dice", "")
                    } for d in act["damage"]
                ]
            actions.append(action_data)
        
        # Legendary actions
        legendary = []
        for la in detail.get("legendary_actions", []):
            legendary.append({"name": la["name"], "desc": la["desc"]})
        
        # Reactions
        reactions = []
        for r in detail.get("reactions", []):
            reactions.append({"name": r["name"], "desc": r["desc"]})
        
        # Image
        image_url = f"{API_BASE}{detail['image']}" if detail.get("image") else None
        
        monster = models.Monster(
            index=idx,
            name=name_es,
            name_en=name_en,
            size=t_size(detail.get("size", "")),
            type=t_type(detail.get("type", "")),
            alignment=t_alignment(detail.get("alignment", "")),
            armor_class=ac_val,
            armor_class_type=ac_type,
            hit_points=detail.get("hit_points", 1),
            hit_dice=detail.get("hit_points_roll", detail.get("hit_dice", "")),
            speed=json.dumps(speed, ensure_ascii=False),
            strength=detail.get("strength", 10),
            dexterity=detail.get("dexterity", 10),
            constitution=detail.get("constitution", 10),
            intelligence=detail.get("intelligence", 10),
            wisdom=detail.get("wisdom", 10),
            charisma=detail.get("charisma", 10),
            proficiencies=json.dumps(profs, ensure_ascii=False),
            damage_vulnerabilities=json.dumps(dmg_vuln, ensure_ascii=False),
            damage_resistances=json.dumps(dmg_res, ensure_ascii=False),
            damage_immunities=json.dumps(dmg_imm, ensure_ascii=False),
            condition_immunities=json.dumps(cond_imm, ensure_ascii=False),
            senses=json.dumps(senses, ensure_ascii=False),
            languages=detail.get("languages", ""),
            challenge_rating=str(detail.get("challenge_rating", 0)),
            xp=detail.get("xp", 0),
            proficiency_bonus=detail.get("proficiency_bonus", 2),
            special_abilities=json.dumps(special, ensure_ascii=False),
            actions=json.dumps(actions, ensure_ascii=False),
            legendary_actions=json.dumps(legendary, ensure_ascii=False),
            reactions=json.dumps(reactions, ensure_ascii=False),
            image_url=image_url
        )
        db.merge(monster)
        
        if (i + 1) % 20 == 0 or i == total - 1:
            db.commit()
            print(f"  ✓ {i+1}/{total} monstruos...")
    
    db.commit()
    print(f"  ✅ {total} monstruos procesados")


# ═══════════════════════════════════════════════════════
# SEED SPELLS
# ═══════════════════════════════════════════════════════
def seed_spells():
    print("\n✨ Seeding Spells...")
    data = fetch(f"{API_2014}/spells")
    if not data:
        return
    
    total = len(data.get("results", []))
    for i, item in enumerate(data.get("results", [])):
        detail = fetch(item["url"])
        if not detail:
            continue
        
        idx = detail["index"]
        name_en = detail["name"]
        name_es = SPELLS.get(idx, name_en)
        
        # Components
        components = detail.get("components", [])
        material = detail.get("material", "")
        
        # Description
        desc_parts = detail.get("desc", [])
        description = "\n".join(desc_parts) if isinstance(desc_parts, list) else str(desc_parts)
        
        higher = detail.get("higher_level", [])
        higher_text = "\n".join(higher) if isinstance(higher, list) else str(higher) if higher else ""
        
        # Classes
        spell_classes = [CLASSES.get(c["index"], c["name"]) for c in detail.get("classes", [])]
        
        # Damage type
        dmg = detail.get("damage", {})
        dmg_type = ""
        dmg_at_level = {}
        if dmg:
            if dmg.get("damage_type"):
                dmg_type = t_damage(dmg["damage_type"].get("name", ""))
            dmg_at_level = dmg.get("damage_at_slot_level", dmg.get("damage_at_character_level", {}))
        
        school_name = detail.get("school", {}).get("name", "")
        
        spell = models.Spell(
            index=idx,
            name=name_es,
            name_en=name_en,
            level=detail.get("level", 0),
            school=t_school(school_name),
            casting_time=detail.get("casting_time", ""),
            range=detail.get("range", ""),
            components=json.dumps(components, ensure_ascii=False),
            material=material,
            duration=detail.get("duration", ""),
            concentration=detail.get("concentration", False),
            ritual=detail.get("ritual", False),
            description=description,
            higher_levels=higher_text,
            classes=json.dumps(spell_classes, ensure_ascii=False),
            damage_type=dmg_type,
            damage_at_slot_level=json.dumps(dmg_at_level, ensure_ascii=False)
        )
        db.merge(spell)
        
        if (i + 1) % 20 == 0 or i == total - 1:
            db.commit()
            print(f"  ✓ {i+1}/{total} hechizos...")
    
    db.commit()
    print(f"  ✅ {total} hechizos procesados")


# ═══════════════════════════════════════════════════════
# SEED EQUIPMENT
# ═══════════════════════════════════════════════════════
def seed_equipment():
    print("\n🗡️ Seeding Equipment...")
    data = fetch(f"{API_2014}/equipment")
    if not data:
        return
    
    total = len(data.get("results", []))
    for i, item_ref in enumerate(data.get("results", [])):
        detail = fetch(item_ref["url"])
        if not detail:
            continue
        
        idx = detail["index"]
        name_en = detail["name"]
        
        # Category
        category_raw = detail.get("equipment_category", {}).get("name", "")
        category = EQUIPMENT_CATEGORIES.get(category_raw, category_raw)
        
        # Cost
        cost = detail.get("cost", {})
        cost_qty = cost.get("quantity", 0) if cost else 0
        cost_unit = cost.get("unit", "gp") if cost else "gp"
        
        # Weight
        weight = str(detail.get("weight", 0))
        
        # Description
        desc_parts = detail.get("desc", [])
        description = "\n".join(desc_parts) if isinstance(desc_parts, list) else ""
        
        # Properties
        props = [WEAPON_PROPERTIES.get(p["name"], p["name"]) for p in detail.get("properties", [])]
        
        # Weapon specifics
        damage_dice = ""
        damage_type = ""
        weapon_range = ""
        if detail.get("damage"):
            damage_dice = detail["damage"].get("damage_dice", "")
            damage_type = t_damage(detail["damage"].get("damage_type", {}).get("name", ""))
        if detail.get("range"):
            rng = detail["range"]
            weapon_range = f"{rng.get('normal', '')}"
            if rng.get("long"):
                weapon_range += f"/{rng['long']}"
        
        # Armor specifics
        armor_class_base = None
        armor_dex = False
        stealth_disadv = False
        if detail.get("armor_class"):
            ac = detail["armor_class"]
            armor_class_base = ac.get("base", None)
            armor_dex = ac.get("dex_bonus", False)
            stealth_disadv = detail.get("stealth_disadvantage", False)
        
        eq = models.Item(
            index=idx,
            name=name_en,  # Keep English for now, items are harder to translate
            name_en=name_en,
            category=category,
            cost_quantity=cost_qty,
            cost_unit=cost_unit,
            weight=weight,
            description=description,
            properties=json.dumps(props, ensure_ascii=False),
            damage_dice=damage_dice,
            damage_type=damage_type,
            weapon_range=weapon_range,
            armor_class_base=armor_class_base,
            armor_class_dex_bonus=armor_dex,
            stealth_disadvantage=stealth_disadv
        )
        db.merge(eq)
        
        if (i + 1) % 30 == 0 or i == total - 1:
            db.commit()
            print(f"  ✓ {i+1}/{total} items...")
    
    db.commit()
    print(f"  ✅ {total} items procesados")


# ═══════════════════════════════════════════════════════
# SEED MAGIC ITEMS
# ═══════════════════════════════════════════════════════
def seed_magic_items():
    print("\n💎 Seeding Magic Items...")
    data = fetch(f"{API_2014}/magic-items")
    if not data:
        return
    
    total = len(data.get("results", []))
    for i, item_ref in enumerate(data.get("results", [])):
        detail = fetch(item_ref["url"])
        if not detail:
            continue
        
        idx = detail["index"]
        desc_parts = detail.get("desc", [])
        description = "\n".join(desc_parts) if isinstance(desc_parts, list) else ""
        
        rarity_raw = detail.get("rarity", {}).get("name", "") if isinstance(detail.get("rarity"), dict) else ""
        
        mi = models.MagicItem(
            index=idx,
            name=detail["name"],
            name_en=detail["name"],
            rarity=RARITIES.get(rarity_raw, rarity_raw),
            description=description,
            requires_attunement=detail.get("requires_attunement", False) if isinstance(detail.get("requires_attunement"), bool) else "attunement" in str(detail.get("requires_attunement", "")),
            equipment_category=detail.get("equipment_category", {}).get("name", "")
        )
        db.merge(mi)
        
        if (i + 1) % 30 == 0 or i == total - 1:
            db.commit()
            print(f"  ✓ {i+1}/{total} objetos mágicos...")
    
    db.commit()
    print(f"  ✅ {total} objetos mágicos procesados")


# ═══════════════════════════════════════════════════════
# SEED SKILLS
# ═══════════════════════════════════════════════════════
def seed_skills():
    print("\n🎯 Seeding Skills...")
    data = fetch(f"{API_2014}/skills")
    if not data:
        return
    
    for item in data.get("results", []):
        detail = fetch(item["url"])
        if not detail:
            continue
        
        idx = detail["index"]
        name_es = SKILLS.get(idx, detail["name"])
        ability = ABILITY_SCORES.get(detail.get("ability_score", {}).get("index", ""), "")
        desc_parts = detail.get("desc", [])
        description = "\n".join(desc_parts) if isinstance(desc_parts, list) else ""
        
        skill = models.Skill(index=idx, name=name_es, ability_score=ability, description=description)
        db.merge(skill)
        print(f"  ✓ {name_es} ({ability})")
    
    db.commit()


# ═══════════════════════════════════════════════════════
# SEED CONDITIONS
# ═══════════════════════════════════════════════════════
def seed_conditions():
    print("\n💀 Seeding Conditions...")
    data = fetch(f"{API_2014}/conditions")
    if not data:
        return
    
    for item in data.get("results", []):
        detail = fetch(item["url"])
        if not detail:
            continue
        
        idx = detail["index"]
        name_es = CONDITIONS.get(idx, detail["name"])
        desc_parts = detail.get("desc", [])
        description = "\n".join(desc_parts) if isinstance(desc_parts, list) else ""
        
        cond = models.Condition(index=idx, name=name_es, description=description)
        db.merge(cond)
        print(f"  ✓ {name_es}")
    
    db.commit()


# ═══════════════════════════════════════════════════════
# SEED DAMAGE TYPES
# ═══════════════════════════════════════════════════════
def seed_damage_types():
    print("\n🔥 Seeding Damage Types...")
    data = fetch(f"{API_2014}/damage-types")
    if not data:
        return
    
    for item in data.get("results", []):
        detail = fetch(item["url"])
        if not detail:
            continue
        
        idx = detail["index"]
        name_es = DAMAGE_TYPES.get(idx, detail["name"])
        desc_parts = detail.get("desc", [])
        description = "\n".join(desc_parts) if isinstance(desc_parts, list) else ""
        
        dt = models.DamageType(index=idx, name=name_es, description=description)
        db.merge(dt)
        print(f"  ✓ {name_es}")
    
    db.commit()


# ═══════════════════════════════════════════════════════
# SEED LANGUAGES
# ═══════════════════════════════════════════════════════
def seed_languages():
    print("\n💬 Seeding Languages...")
    data = fetch(f"{API_2014}/languages")
    if not data:
        return
    
    for item in data.get("results", []):
        detail = fetch(item["url"])
        if not detail:
            continue
        
        idx = detail["index"]
        name_es = LANGUAGES.get(idx, detail["name"])
        typical = ", ".join(detail.get("typical_speakers", []))
        
        lang = models.Language(
            index=idx, name=name_es,
            type=detail.get("type", ""),
            typical_speakers=typical,
            script=detail.get("script", "")
        )
        db.merge(lang)
        print(f"  ✓ {name_es}")
    
    db.commit()


# ═══════════════════════════════════════════════════════
# SEED FEATS
# ═══════════════════════════════════════════════════════
def seed_feats():
    print("\n⭐ Seeding Feats...")
    data = fetch(f"{API_2014}/feats")
    if not data:
        return
    
    for item in data.get("results", []):
        detail = fetch(item["url"])
        if not detail:
            continue
        
        idx = detail["index"]
        desc_parts = detail.get("desc", [])
        description = "\n".join(desc_parts) if isinstance(desc_parts, list) else ""
        
        prereqs = []
        for p in detail.get("prerequisites", []):
            prereqs.append(str(p))
        
        feat = models.Feat(
            index=idx,
            name=detail["name"],
            name_en=detail["name"],
            prerequisites=json.dumps(prereqs, ensure_ascii=False),
            description=description
        )
        db.merge(feat)
        print(f"  ✓ {detail['name']}")
    
    db.commit()


# ═══════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════
if __name__ == "__main__":
    print("=" * 60)
    print("🎲 D&D 5E API Seeder — Traducción al Español")
    print("=" * 60)
    print(f"API: {API_2014}")
    print(f"Database: {engine.url}")
    print()
    
    start = time.time()
    
    # Seed in dependency order
    seed_races()
    seed_classes()
    seed_subclasses()
    seed_backgrounds()
    seed_skills()
    seed_conditions()
    seed_damage_types()
    seed_languages()
    seed_feats()
    seed_spells()
    seed_monsters()
    seed_equipment()
    seed_magic_items()
    
    elapsed = time.time() - start
    print(f"\n{'=' * 60}")
    print(f"✅ Seed completado en {elapsed:.1f} segundos")
    print(f"{'=' * 60}")
    
    db.close()
