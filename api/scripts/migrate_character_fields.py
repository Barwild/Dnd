import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from sqlalchemy import text

def migrate():
    cols = {
        "current_hit_dice": "INTEGER DEFAULT 1",
        "exhaustion_levels": "INTEGER DEFAULT 0",
        "death_saves_successes": "INTEGER DEFAULT 0",
        "death_saves_failures": "INTEGER DEFAULT 0",
        "temporary_hp": "INTEGER DEFAULT 0",
    }
    with engine.connect() as conn:
        for col, col_type in cols.items():
            try:
                conn.execute(text(f"ALTER TABLE characters ADD COLUMN {col} {col_type}"))
                print(f"Added column {col}")
            except Exception as e:
                print(f"Column {col} already exists or error: {e}")
        conn.commit()

if __name__ == "__main__":
    migrate()
