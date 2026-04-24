import os
import sys

# Agregamos el directorio principal de la api para poder importar los módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.schema import CreateTable
from models import Base
import models

def run_migration(postgres_url):
    print("Iniciando migración de datos...")
    
    # 1. Conectar a SQLite local
    sqlite_url = "sqlite:///../dnd_nexus.db"
    engine_sqlite = create_engine(sqlite_url)
    SessionLocal_sqlite = sessionmaker(bind=engine_sqlite)
    session_sqlite = SessionLocal_sqlite()

    # 2. Conectar a Postgres remoto
    if postgres_url.startswith("postgres://"):
        postgres_url = postgres_url.replace("postgres://", "postgresql://", 1)
        
    engine_postgres = create_engine(postgres_url)
    
    # 3. Crear tablas en Postgres si no existen
    print("Creando tablas en Neon...")
    Base.metadata.create_all(bind=engine_postgres)
    
    SessionLocal_postgres = sessionmaker(bind=engine_postgres)
    session_postgres = SessionLocal_postgres()

    # 4. Obtener todas las tablas en orden de dependencias
    tables = Base.metadata.sorted_tables
    
    try:
        for table in tables:
            print(f"Migrando tabla: {table.name}...")
            
            # Borrar datos existentes en Postgres por si acaso (para evitar duplicados en la prueba)
            session_postgres.execute(table.delete())
            session_postgres.commit()

            # Leer datos de SQLite
            rows = session_sqlite.execute(table.select()).fetchall()
            if not rows:
                print(f"  Tabla {table.name} vacía, saltando.")
                continue
                
            # Convertir las filas a diccionarios
            # En SQLAlchemy 2.0, rows son objetos Row. Usamos _mapping
            dicts = [dict(row._mapping) for row in rows]
            
            # Insertar en Postgres en bloques
            print(f"  Insertando {len(dicts)} registros en {table.name}...")
            session_postgres.execute(table.insert(), dicts)
            session_postgres.commit()
            
        print("\n¡Migración completada con éxito!")
        
    except Exception as e:
        print(f"\nError durante la migración: {e}")
        session_postgres.rollback()
    finally:
        session_sqlite.close()
        session_postgres.close()

if __name__ == "__main__":
    url = "postgresql://neondb_owner:npg_5eOJKpFj6bNr@ep-holy-sunset-abvng4c9.eu-west-2.aws.neon.tech/neondb?sslmode=require"
    run_migration(url)
