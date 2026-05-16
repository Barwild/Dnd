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
    total_inserted = 0

    for table in REFERENCE_TABLES:
        rows = source.execute(text(f'SELECT * FROM "{table}"')).fetchall()
        if not rows:
            continue

        cols = [c for c in rows[0]._mapping.keys()]
        pk = cols[0]
        col_list = ", ".join(f'"{c}"' for c in cols)
        param_list = ", ".join(f":{c}" for c in cols)

        before = target.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar()
        if before >= len(rows):
            continue

        if is_pg:
            sql = text(
                f'INSERT INTO "{table}" ({col_list}) VALUES ({param_list}) '
                f'ON CONFLICT ("{pk}") DO NOTHING'
            )
        else:
            sql = text(f'INSERT OR IGNORE INTO "{table}" ({col_list}) VALUES ({param_list})')

        for row in rows:
            data = dict(row._mapping)
            try:
                target.execute(sql, data)
            except Exception as e:
                target.rollback()
                raise RuntimeError(
                    f"Failed to insert into {table} (row id={data.get(pk)}): {e}"
                ) from e

        target.commit()
        after = target.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar()
        n = after - before
        if n:
            total_inserted += n

    source.close()
    target.close()
    return total_inserted


if __name__ == "__main__":
    url = os.getenv("DATABASE_URL", "")
    engine = create_engine(url) if url else create_engine(f"sqlite:///{SQLITE_PATH}")
    n = sync_reference_data(engine)
    print(f"Synced {n} new rows")


