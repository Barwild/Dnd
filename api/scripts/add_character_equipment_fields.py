"""
Script para añadir los nuevos campos de equipamiento al modelo Character
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from sqlalchemy import text

def add_character_equipment_fields():
    """Añadir nuevos campos de equipamiento a la tabla characters"""
    print("🔧 Añadiendo campos de equipamiento a la tabla characters...")
    
    with engine.connect() as conn:
        # Añadir campo equipped_items si no existe
        try:
            conn.execute(text("""
                ALTER TABLE characters 
                ADD COLUMN equipped_items TEXT DEFAULT '{}'
            """))
            print("✅ Campo 'equipped_items' añadido")
        except Exception as e:
            if "duplicate column name" not in str(e).lower():
                print(f"❌ Error añadiendo equipped_items: {e}")
            else:
                print("⚠️ Campo 'equipped_items' ya existe")
        
        # Añadir campo calculated_stats si no existe
        try:
            conn.execute(text("""
                ALTER TABLE characters 
                ADD COLUMN calculated_stats TEXT DEFAULT '{}'
            """))
            print("✅ Campo 'calculated_stats' añadido")
        except Exception as e:
            if "duplicate column name" not in str(e).lower():
                print(f"❌ Error añadiendo calculated_stats: {e}")
            else:
                print("⚠️ Campo 'calculated_stats' ya existe")
        
        conn.commit()
    
    print("✅ Migración de campos de equipamiento completada!")

def main():
    """Función principal"""
    print("🚀 Iniciando migración de campos de equipamiento...")
    
    try:
        add_character_equipment_fields()
        print("\n✅ ¡Migración completada exitosamente!")
        print("📊 Nuevos campos añadidos:")
        print("   • equipped_items: JSON con items equipados por ranura")
        print("   • calculated_stats: JSON con estadísticas calculadas (CA, daño, etc.)")
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        return False
    
    return True

if __name__ == "__main__":
    main()
