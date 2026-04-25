import sys
import os
import json
import time
from deep_translator import GoogleTranslator

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
import models

db = SessionLocal()
translator = GoogleTranslator(source='en', target='es')

def translate_text(text):
    if not text or len(text.strip()) == 0:
        return text
    try:
        # Small sleep to avoid rate limiting
        time.sleep(0.1)
        return translator.translate(text)
    except Exception as e:
        print(f"Error translating: {e}")
        return text

def translate_items():
    items = db.query(models.Item).all()
    count = 0
    print(f"Checking {len(items)} Items...")
    for item in items:
        # If name is same as English name, translate it
        if item.name == item.name_en or item.name == item.index.replace('-', ' ').title():
            es_name = translate_text(item.name_en)
            if es_name != item.name_en:
                item.name = es_name
                count += 1
                print(f"Item: {item.name_en} -> {es_name}")
                
        # Only translate description if it doesn't look Spanish
        if item.description and " y " not in item.description and " el " not in item.description:
            item.description = translate_text(item.description)
            count += 1
            
        if count > 0 and count % 20 == 0:
            db.commit()
            
    db.commit()
    print(f"Items translated: {count}")

def translate_magic_items():
    items = db.query(models.MagicItem).all()
    count = 0
    print(f"Checking {len(items)} Magic Items...")
    for item in items:
        if item.name == item.name_en:
            es_name = translate_text(item.name_en)
            if es_name != item.name_en:
                item.name = es_name
                count += 1
                print(f"MagicItem: {item.name_en} -> {es_name}")
                
        if item.description and " y " not in item.description and " de " not in item.description:
            item.description = translate_text(item.description)
            count += 1
            
        if count > 0 and count % 20 == 0:
            db.commit()
            
    db.commit()
    print(f"Magic Items translated: {count}")

def translate_json_list(json_str):
    if not json_str or json_str == '[]':
        return json_str
    try:
        data = json.loads(json_str)
        changed = False
        for item in data:
            if 'name' in item:
                es_name = translate_text(item['name'])
                if es_name != item['name']:
                    item['name'] = es_name
                    changed = True
            if 'desc' in item:
                es_desc = translate_text(item['desc'])
                if es_desc != item['desc']:
                    item['desc'] = es_desc
                    changed = True
        return json.dumps(data) if changed else json_str
    except:
        return json_str

def translate_monsters():
    monsters = db.query(models.Monster).all()
    count = 0
    print(f"Checking {len(monsters)} Monsters...")
    for m in monsters:
        monster_changed = False
        if m.name == m.name_en:
            es_name = translate_text(m.name_en)
            if es_name != m.name_en:
                m.name = es_name
                monster_changed = True
                print(f"Monster Name: {m.name_en} -> {es_name}")
        
        # Translate actions
        new_actions = translate_json_list(m.actions)
        if new_actions != m.actions:
            m.actions = new_actions
            monster_changed = True
            
        # Translate special abilities
        new_abilities = translate_json_list(m.special_abilities)
        if new_abilities != m.special_abilities:
            m.special_abilities = new_abilities
            monster_changed = True
            
        # Translate legendary actions
        new_legendary = translate_json_list(m.legendary_actions)
        if new_legendary != m.legendary_actions:
            m.legendary_actions = new_legendary
            monster_changed = True
            
        if monster_changed:
            count += 1
                
        if count > 0 and count % 10 == 0:
            db.commit()
            
    db.commit()
    print(f"Monsters updated/translated: {count}")

if __name__ == "__main__":
    print("Iniciando traductor profundo...")
    translate_monsters()
    translate_items()
    translate_magic_items()
    print("Terminado.")
    db.close()
