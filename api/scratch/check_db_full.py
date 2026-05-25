import os
import sqlite3
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "dnd_nexus.db")

print("DB Path:", DB_PATH)
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# 1. Races and Subraces
print("\n=== RACES ===")
cur.execute('SELECT "index", name, ability_bonuses, subraces FROM races')
for row in cur.fetchall():
    print(f"Race: {row[1]} ({row[0]})")
    print(f"  Ability Bonuses: {row[2]}")
    try:
        subraces = json.loads(row[3])
        print(f"  Subraces count: {len(subraces)}")
        for sr in subraces:
            print(f"    - Subrace: {sr.get('name')} ({sr.get('index')})")
            print(f"      Ability Bonuses: {sr.get('ability_bonuses')}")
    except Exception as e:
        print("  Error parsing subraces:", e)

# 2. Classes
print("\n=== CLASSES ===")
cur.execute('SELECT "index", name, hit_die, saving_throws FROM classes')
for row in cur.fetchall():
    print(f"Class: {row[1]} ({row[0]}), Hit Die: d{row[2]}, Saving Throws: {row[3]}")

# 3. Subclasses
print("\n=== SUBCLASSES ===")
cur.execute('SELECT "index", name, class_index FROM subclasses')
for row in cur.fetchall():
    print(f"Subclass: {row[1]} ({row[0]}) for class: {row[2]}")

# 4. Leveling Tables
print("\n=== LEVELING TABLES COUNT ===")
cur.execute('SELECT class_name, COUNT(*) FROM leveling_tables GROUP BY class_name')
for row in cur.fetchall():
    print(f"Leveling Table for {row[0]}: {row[1]} levels")

# Let's inspect level 4 for "mago" and "guerrero" in leveling_tables
print("\n=== LEVELING DETAIL FOR MAGO & GUERRERO LEVEL 4 ===")
cur.execute('SELECT class_name, level, proficiency_bonus, features, cantrips_known FROM leveling_tables WHERE level=4')
for row in cur.fetchall():
    print(f"Class: {row[0]}, Lvl: {row[1]}, PB: +{row[2]}, Features: {row[3]}, Cantrips: {row[4]}")

conn.close()
