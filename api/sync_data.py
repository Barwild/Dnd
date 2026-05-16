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


def _upsert_sql(table, cols, pk, is_pg):
    col_list = ", ".join(f'"{c}"' for c in cols)
    param_list = ", ".join(f":{c}" for c in cols)
    if is_pg:
        update_list = ", ".join(f'"{c}" = excluded."{c}"' for c in cols if c != pk)
        return text(
            f'INSERT INTO "{table}" ({col_list}) VALUES ({param_list}) '
            f'ON CONFLICT ("{pk}") DO UPDATE SET {update_list}'
        )
    # SQLite: INSERT OR REPLACE = delete then insert (works for PK tables)
    return text(f'INSERT OR REPLACE INTO "{table}" ({col_list}) VALUES ({param_list})')


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

    is_pg = str(target_engine.url).startswith("postgresql")
    total_upserted = 0

    for table in REFERENCE_TABLES:
        rows = source.execute(text(f'SELECT * FROM "{table}"')).fetchall()
        if not rows:
            continue

        cols = [c for c in rows[0]._mapping.keys()]
        pk = cols[0]
        sql = _upsert_sql(table, cols, pk, is_pg)

        upserted = 0
        for row in rows:
            data = dict(row._mapping)
            try:
                target.execute(sql, data)
                upserted += 1
            except Exception as e:
                target.rollback()
                raise RuntimeError(
                    f"Failed to upsert into {table} (pk={data.get(pk)}): {e}"
                ) from e

        target.commit()
        total_upserted += upserted

    source.close()
    target.close()
    return total_upserted


if __name__ == "__main__":
    url = os.getenv("DATABASE_URL", "")
    engine = create_engine(url) if url else create_engine(f"sqlite:///{SQLITE_PATH}")
    n = sync_reference_data(engine)
    print(f"Upserted {n} rows across all tables")


