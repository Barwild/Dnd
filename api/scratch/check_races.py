import os
import sqlite3
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "dnd_nexus.db")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute('SELECT "index", name, ability_bonuses, subraces FROM races')
for row in cur.fetchall():
    print(f"\nRace: {row[1]} ({row[0]})")
    print(f"  Ability Bonuses: {row[2]}")
    try:
        subraces = json.loads(row[3])
        print(f"  Subraces:")
        for sr in subraces:
            print(f"    - Subrace: {sr.get('name')} ({sr.get('index')})")
            print(f"      Ability Bonuses: {sr.get('ability_bonuses')}")
    except Exception as e:
        print("  Error:", e)

conn.close()
