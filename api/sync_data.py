"""Sync reference/compendium data from the bundled SQLite database
to whatever database the app is configured to use (DATABASE_URL).

Run standalone:  python sync_data.py
Or imported:     from sync_data import sync_reference_data; sync_reference_data(engine)
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLITE_PATH = os.path.join(BASE_DIR, "dnd_nexus.db")

REFERENCE_TABLES = [
    "classes", "races", "spells", "items", "magic_items", "monsters",
    "subclasses", "backgrounds", "conditions", "damage_types", "languages",
    "skills", "feats", "mounts", "vehicles", "trade_goods", "tools",
    "equipment_packs", "advantage_rules", "inspiration_rules",
    "multiclass_rules", "leveling_tables",
]


def _has_column(table_name, col_name, session):
    """Check if a table has a column using a simple query."""
    try:
        session.execute(text(f'SELECT "{col_name}" FROM "{table_name}" LIMIT 0'))
        return True
    except Exception:
        return False


def sync_reference_data(target_engine=None):
    if target_engine is None:
        url = os.getenv("DATABASE_URL", "")
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        target_engine = create_engine(url) if url else create_engine(f"sqlite:///{SQLITE_PATH}")

    source_engine = create_engine(f"sqlite:///{SQLITE_PATH}")
    Source = sessionmaker(bind=source_engine)
    Target = sessionmaker(bind=target_engine)

    source = Source()
    target = Target()

    db_type = "PostgreSQL" if str(target_engine.url).startswith("postgresql") else "SQLite"
    print(f"[sync] Starting data sync from SQLite → {db_type} ...")

    is_pg = db_type == "PostgreSQL"
    total_upserted = 0

    for table in REFERENCE_TABLES:
        rows = source.execute(text(f'SELECT * FROM "{table}"')).fetchall()
        if not rows:
            continue

        cols = [c for c in rows[0]._mapping.keys()]
        if _has_column(table, "index", source):
            conflict_col = '"index"'
            conflict_name = "index"
        else:
            conflict_col = f'"{cols[0]}"'
            conflict_name = cols[0]

        col_list = ", ".join(f'"{c}"' for c in cols)
        param_list = ", ".join(f":{c}" for c in cols)
        update_list = ", ".join(
            f'"{c}" = excluded."{c}"' for c in cols if c != conflict_name
        )

        if is_pg:
            sql = text(
                f'INSERT INTO "{table}" ({col_list}) VALUES ({param_list}) '
                f'ON CONFLICT ({conflict_col}) DO UPDATE SET {update_list}'
            )
        else:
            sql = text(f'INSERT OR REPLACE INTO "{table}" ({col_list}) VALUES ({param_list})')

        upserted = 0
        for row in rows:
            data = dict(row._mapping)
            try:
                target.execute(sql, data)
                upserted += 1
            except Exception as e:
                target.rollback()
                print(f"[sync] WARNING: {table} row {conflict_name}="
                      f"{data.get(conflict_name)} failed: {e}")
                break

        target.commit()
        total_upserted += upserted
        print(f"[sync]   {table}: {upserted} rows upserted")

    source.close()
    target.close()
    print(f"[sync] Done. Total: {total_upserted} rows")
    return total_upserted


if __name__ == "__main__":
    url = os.getenv("DATABASE_URL", "")
    engine = create_engine(url) if url else create_engine(f"sqlite:///{SQLITE_PATH}")
    n = sync_reference_data(engine)
    print(f"[sync] Finished: {n} rows")
