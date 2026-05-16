"""Sync reference/compendium data from the bundled SQLite database
to whatever database the app is configured to use (DATABASE_URL).
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

# Boolean columns that SQLite stores as 0/1 int but PostgreSQL expects boolean
BOOL_COLUMNS = {
    "spells": ["concentration", "ritual"],
    "items": ["armor_class_dex_bonus", "stealth_disadvantage"],
    "magic_items": ["requires_attunement"],
}


def _has_column(table_name, col_name, session):
    try:
        session.execute(text(f'SELECT "{col_name}" FROM "{table_name}" LIMIT 0'))
        return True
    except Exception:
        return False


def _get_pk(table_name, session):
    """Get the primary key column name for a table."""
    try:
        result = session.execute(text(
            f"SELECT name FROM pragma_table_info('{table_name}') WHERE pk = 1"
        )).fetchone()
        return result[0] if result else "id"
    except Exception:
        return "id"


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
        pk = _get_pk(table, source)

        # Determine conflict column: use 'index' if available, else PK
        if _has_column(table, "index", source):
            conflict_col = '"index"'
            conflict_name = "index"
        else:
            conflict_col = f'"{pk}"'
            conflict_name = pk

        col_list = ", ".join(f'"{c}"' for c in cols)

        # For PostgreSQL, cast boolean columns explicitly
        if is_pg:
            bool_cols = BOOL_COLUMNS.get(table, [])
            param_parts = []
            for c in cols:
                if c in bool_cols:
                    param_parts.append(f"(:{c})::boolean")
                else:
                    param_parts.append(f":{c}")
            param_list = ", ".join(param_parts)
        else:
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
        errors = 0
        for row in rows:
            data = dict(row._mapping)
            # Convert integer booleans to Python bool for SQLAlchemy
            bool_cols = BOOL_COLUMNS.get(table, [])
            for bc in bool_cols:
                if bc in data and isinstance(data[bc], int):
                    data[bc] = bool(data[bc])
            try:
                target.execute(sql, data)
                upserted += 1
            except Exception as e:
                errors += 1
                if errors <= 3:
                    print(f"[sync] ERROR {table} {conflict_name}={data.get(conflict_name)}: {e}")
                if errors == 4:
                    print(f"[sync] ERROR {table}: ... more errors suppressed")
                target.rollback()
                break

        target.commit()
        total_upserted += upserted
        status = f"{upserted} upserted"
        if errors:
            status += f", {errors} errors"
        print(f"[sync]   {table}: {status}")

    source.close()
    target.close()
    print(f"[sync] Done. Total: {total_upserted} rows")
    return total_upserted


if __name__ == "__main__":
    url = os.getenv("DATABASE_URL", "")
    engine = create_engine(url) if url else create_engine(f"sqlite:///{SQLITE_PATH}")
    n = sync_reference_data(engine)
    print(f"[sync] Finished: {n} rows")
