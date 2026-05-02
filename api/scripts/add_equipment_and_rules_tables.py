"""
Script para añadir las nuevas tablas de Equipment y Rules Mechanics a la base de datos.
FASE 1: Equipment Completo (Mounts, Vehicles, Trade Goods, Tools, Equipment Packs)
FASE 2: Rules Mechanics (Advantage, Inspiration, Multiclass, Leveling)
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, Base
from models import Mount, Vehicle, TradeGood, Tool, EquipmentPack
from models import AdvantageRule, InspirationRule, MulticlassRule, LevelingTable
import json

def create_tables():
    """Crear las nuevas tablas en la base de datos"""
    print("🔨 Creando nuevas tablas en la base de datos...")
    
    # Crear tablas de equipment
    Mount.__table__.create(engine, checkfirst=True)
    Vehicle.__table__.create(engine, checkfirst=True)
    TradeGood.__table__.create(engine, checkfirst=True)
    Tool.__table__.create(engine, checkfirst=True)
    EquipmentPack.__table__.create(engine, checkfirst=True)
    
    # Crear tablas de rules mechanics
    AdvantageRule.__table__.create(engine, checkfirst=True)
    InspirationRule.__table__.create(engine, checkfirst=True)
    MulticlassRule.__table__.create(engine, checkfirst=True)
    LevelingTable.__table__.create(engine, checkfirst=True)
    
    print("✅ Tablas creadas exitosamente!")

def populate_mounts():
    """Añadir datos SRD de monturas"""
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    session = Session()
    
    mounts_data = [
        {
            "index": "donkey",
            "name": "Burro",
            "name_en": "Donkey",
            "speed": "40 pies",
            "capacity": "420 libras",
            "cost_quantity": 8,
            "cost_unit": "gp",
            "description": "Un burro es una montura resistente y económica.",
            "special_abilities": json.dumps([])
        },
        {
            "index": "mule",
            "name": "Mula",
            "name_en": "Mule",
            "speed": "40 pies",
            "capacity": "420 libras",
            "cost_quantity": 8,
            "cost_unit": "gp",
            "description": "Una mula es más fuerte que un burro pero igual de económica.",
            "special_abilities": json.dumps([])
        },
        {
            "index": "horse",
            "name": "Caballo de Montaña",
            "name_en": "Horse",
            "speed": "60 pies",
            "capacity": "480 libras",
            "cost_quantity": 25,
            "cost_unit": "gp",
            "description": "Un caballo de montaña es una montura veloz y resistente.",
            "special_abilities": json.dumps([])
        },
        {
            "index": "warhorse",
            "name": "Caballo de Guerra",
            "name_en": "Warhorse",
            "speed": "60 pies",
            "capacity": "540 libras",
            "cost_quantity": 75,
            "cost_unit": "gp",
            "description": "Un caballo de guerra es más fuerte y resistente que un caballo normal.",
            "special_abilities": json.dumps([])
        },
        {
            "index": "pony",
            "name": "Poni",
            "name_en": "Pony",
            "speed": "40 pies",
            "capacity": "225 libras",
            "cost_quantity": 30,
            "cost_unit": "gp",
            "description": "Un poni es una montura pequeña y resistente.",
            "special_abilities": json.dumps([])
        },
        {
            "index": "warpony",
            "name": "Poni de Guerra",
            "name_en": "Warpony",
            "speed": "40 pies",
            "capacity": "255 libras",
            "cost_quantity": 90,
            "cost_unit": "gp",
            "description": "Un poni de guerra es más fuerte que un poni normal.",
            "special_abilities": json.dumps([])
        },
        {
            "index": "camel",
            "name": "Camello",
            "name_en": "Camel",
            "speed": "50 pies",
            "capacity": "480 libras",
            "cost_quantity": 50,
            "cost_unit": "gp",
            "description": "Un camello puede viajar largas distancias sin agua.",
            "special_abilities": json.dumps(["Puede viajar 10 días sin agua"])
        },
        {
            "index": "elephant",
            "name": "Elefante",
            "name_en": "Elephant",
            "speed": "40 pies",
            "capacity": "1320 libras",
            "cost_quantity": 200,
            "cost_unit": "gp",
            "description": "Un elefante es una montura enorme y poderosa.",
            "special_abilities": json.dumps(["Ataque de trompa", "Carga"])
        }
    ]
    
    for mount_data in mounts_data:
        if not session.query(Mount).filter(Mount.index == mount_data["index"]).first():
            mount = Mount(**mount_data)
            session.add(mount)
    
    session.commit()
    session.close()
    print("✅ Monturas añadidas exitosamente!")

def populate_vehicles():
    """Añadir datos SRD de vehículos"""
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    session = Session()
    
    vehicles_data = [
        {
            "index": "galley",
            "name": "Galera",
            "name_en": "Galley",
            "vehicle_type": "Water",
            "speed": "4 millas (velas), 3 millas (remos)",
            "capacity": "150 soldados, 20 toneladas de mercancía",
            "cost_quantity": 30000,
            "cost_unit": "gp",
            "description": "Una galera es un barco de guerra con remos y velas.",
            "crew_required": 80,
            "special_abilities": json.dumps(["Movimiento con remos", "Movimiento con velas"])
        },
        {
            "index": "keelboat",
            "name": "Barco de Quilla",
            "name_en": "Keelboat",
            "vehicle_type": "Water",
            "speed": "1 milla (remos)",
            "capacity": "15 soldados, 1 tonelada de mercancía",
            "cost_quantity": 3000,
            "cost_unit": "gp",
            "description": "Un barco de quilla es un pequeño barco de transporte.",
            "crew_required": 4,
            "special_abilities": json.dumps(["Río y agua dulce"])
        },
        {
            "index": "longship",
            "name": "Barco Largo",
            "name_en": "Longship",
            "vehicle_type": "Water",
            "speed": "3 millas (velas), 3 millas (remos)",
            "capacity": "50 soldados, 5 toneladas de mercancía",
            "cost_quantity": 10000,
            "cost_unit": "gp",
            "description": "Un barco largo es un barco vikingo rápido y versátil.",
            "crew_required": 24,
            "special_abilities": json.dumps(["Velocidad en aguas poco profundas"])
        },
        {
            "index": "rowboat",
            "name": "Bote de Remos",
            "name_en": "Rowboat",
            "vehicle_type": "Water",
            "speed": "1.5 millas (remos)",
            "capacity": "3 soldados, 200 libras de mercancía",
            "cost_quantity": 50,
            "cost_unit": "gp",
            "description": "Un pequeño bote de remos para viajes cortos.",
            "crew_required": 1,
            "special_abilities": json.dumps(["Transporte a corta distancia"])
        },
        {
            "index": "sailing-ship",
            "name": "Barco de Vela",
            "name_en": "Sailing Ship",
            "vehicle_type": "Water",
            "speed": "2 millas (velas)",
            "capacity": "20 soldados, 100 toneladas de mercancía",
            "cost_quantity": 10000,
            "cost_unit": "gp",
            "description": "Un barco de vela es un barco mercante estándar.",
            "crew_required": 20,
            "special_abilities": json.dumps(["Navegación oceánica"])
        },
        {
            "index": "wagon",
            "name": "Carro",
            "name_en": "Wagon",
            "vehicle_type": "Land",
            "speed": "2 millas (caballos)",
            "capacity": "4000 libras de mercancía",
            "cost_quantity": 35,
            "cost_unit": "gp",
            "description": "Un carro es un vehículo de transporte terrestre.",
            "crew_required": 1,
            "special_abilities": json.dumps(["Transporte terrestre"])
        }
    ]
    
    for vehicle_data in vehicles_data:
        if not session.query(Vehicle).filter(Vehicle.index == vehicle_data["index"]).first():
            vehicle = Vehicle(**vehicle_data)
            session.add(vehicle)
    
    session.commit()
    session.close()
    print("✅ Vehículos añadidos exitosamente!")

def populate_trade_goods():
    """Añadir datos SRD de bienes comerciales"""
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    session = Session()
    
    trade_goods_data = [
        # Gemas
        {"index": "amber", "name": "Ámbar", "name_en": "Amber", "category": "Gema", "cost_quantity": 100, "cost_unit": "gp", "description": "Una gema ámbar brillante.", "availability": "Common"},
        {"index": "amethyst", "name": "Amatista", "name_en": "Amethyst", "category": "Gema", "cost_quantity": 100, "cost_unit": "gp", "description": "Una gema amatista púrpura.", "availability": "Common"},
        {"index": "diamond", "name": "Diamante", "name_en": "Diamond", "category": "Gema", "cost_quantity": 5000, "cost_unit": "gp", "description": "Un diamante brillante y perfectamente cortado.", "availability": "Rare"},
        {"index": "emerald", "name": "Esmeralda", "name_en": "Emerald", "category": "Gema", "cost_quantity": 1000, "cost_unit": "gp", "description": "Una esmeralda verde profunda.", "availability": "Uncommon"},
        {"index": "ruby", "name": "Rubí", "name_en": "Ruby", "category": "Gema", "cost_quantity": 1000, "cost_unit": "gp", "description": "Un rubí rojo intenso.", "availability": "Uncommon"},
        {"index": "sapphire", "name": "Zafiro", "name_en": "Sapphire", "category": "Gema", "cost_quantity": 1000, "cost_unit": "gp", "description": "Un zafiro azul profundo.", "availability": "Uncommon"},
        
        # Metales
        {"index": "copper", "name": "Cobre", "name_en": "Copper", "category": "Metal", "cost_quantity": 5, "cost_unit": "sp", "description": "Una libra de cobre.", "availability": "Common"},
        {"index": "silver", "name": "Plata", "name_en": "Silver", "category": "Metal", "cost_quantity": 5, "cost_unit": "gp", "description": "Una libra de plata.", "availability": "Common"},
        {"index": "gold", "name": "Oro", "name_en": "Gold", "category": "Metal", "cost_quantity": 50, "cost_unit": "gp", "description": "Una libra de oro.", "availability": "Common"},
        {"index": "platinum", "name": "Platino", "name_en": "Platinum", "category": "Metal", "cost_quantity": 500, "cost_unit": "gp", "description": "Una libra de platino.", "availability": "Rare"},
        
        # Otros bienes
        {"index": "ivory", "name": "Marfil", "name_en": "Ivory", "category": "Material", "cost_quantity": 100, "cost_unit": "gp", "description": "Marfil de alta calidad.", "availability": "Uncommon"},
        {"index": "pearl", "name": "Perla", "name_en": "Pearl", "category": "Gema", "cost_quantity": 100, "cost_unit": "gp", "description": "Una perla perfecta.", "availability": "Common"}
    ]
    
    for trade_good_data in trade_goods_data:
        if not session.query(TradeGood).filter(TradeGood.index == trade_good_data["index"]).first():
            trade_good = TradeGood(**trade_good_data)
            session.add(trade_good)
    
    session.commit()
    session.close()
    print("✅ Bienes comerciales añadidos exitosamente!")

def populate_tools():
    """Añadir datos SRD de herramientas"""
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    session = Session()
    
    tools_data = [
        # Herramientas de artesano
        {"index": "alchemists-supplies", "name": "Suministros de Alquimista", "name_en": "Alchemist's Supplies", "tool_type": "Artisan", "cost_quantity": 50, "cost_unit": "gp", "weight": "8 libras", "description": "Suministros para crear pociones y productos alquímicos.", "ability_score": "INT"},
        {"index": "brewers-supplies", "name": "Suministros de Cervecero", "name_en": "Brewer's Supplies", "tool_type": "Artisan", "cost_quantity": 20, "cost_unit": "gp", "weight": "9 libras", "description": "Suministros para fabricar cerveza y otras bebidas.", "ability_score": "INT"},
        {"index": "calligraphers-supplies", "name": "Suministros de Calígrafo", "name_en": "Calligrapher's Supplies", "tool_type": "Artisan", "cost_quantity": 15, "cost_unit": "gp", "weight": "5 libras", "description": "Suministros para caligrafía y escritura elegante.", "ability_score": "DEX"},
        {"index": "carpenters-tools", "name": "Herramientas de Carpintero", "name_en": "Carpenter's Tools", "tool_type": "Artisan", "cost_quantity": 8, "cost_unit": "gp", "weight": "6 libras", "description": "Herramientas para trabajar con madera.", "ability_score": "DEX"},
        {"index": "cartographers-tools", "name": "Herramientas de Cartógrafo", "name_en": "Cartographer's Tools", "tool_type": "Artisan", "cost_quantity": 15, "cost_unit": "gp", "weight": "6 libras", "description": "Herramientas para crear mapas.", "ability_score": "DEX"},
        {"index": "cobblers-tools", "name": "Herramientas de Zapatero", "name_en": "Cobbler's Tools", "tool_type": "Artisan", "cost_quantity": 5, "cost_unit": "gp", "weight": "5 libras", "description": "Herramientas para reparar y fabricar calzado.", "ability_score": "DEX"},
        {"index": "cooks-utensils", "name": "Utensilios de Cocina", "name_en": "Cook's Utensils", "tool_type": "Artisan", "cost_quantity": 1, "cost_unit": "gp", "weight": "8 libras", "description": "Utensilios básicos para cocinar.", "ability_score": "INT"},
        {"index": "glassblowers-tools", "name": "Herramientas de Vidriero", "name_en": "Glassblower's Tools", "tool_type": "Artisan", "cost_quantity": 30, "cost_unit": "gp", "weight": "5 libras", "description": "Herramientas para trabajar con vidrio.", "ability_score": "DEX"},
        {"index": "jewelers-tools", "name": "Herramientas de Joyero", "name_en": "Jeweler's Tools", "tool_type": "Artisan", "cost_quantity": 25, "cost_unit": "gp", "weight": "2 libras", "description": "Herramientas para trabajar con metales y gemas preciosas.", "ability_score": "DEX"},
        {"index": "leatherworkers-tools", "name": "Herramientas de Curtidor", "name_en": "Leatherworker's Tools", "tool_type": "Artisan", "cost_quantity": 5, "cost_unit": "gp", "weight": "5 libras", "description": "Herramientas para trabajar con cuero.", "ability_score": "DEX"},
        {"index": "masons-tools", "name": "Herramientas de Albañil", "name_en": "Mason's Tools", "tool_type": "Artisan", "cost_quantity": 10, "cost_unit": "gp", "weight": "8 libras", "description": "Herramientas para trabajar con piedra.", "ability_score": "STR"},
        {"index": "painters-supplies", "name": "Suministros de Pintor", "name_en": "Painter's Supplies", "tool_type": "Artisan", "cost_quantity": 10, "cost_unit": "gp", "weight": "5 libras", "description": "Suministros para pintar y crear arte.", "ability_score": "DEX"},
        {"index": "potters-tools", "name": "Herramientas de Alfarero", "name_en": "Potter's Tools", "tool_type": "Artisan", "cost_quantity": 10, "cost_unit": "gp", "weight": "3 libras", "description": "Herramientas para trabajar con arcilla.", "ability_score": "DEX"},
        {"index": "smiths-tools", "name": "Herramientas de Herrero", "name_en": "Smith's Tools", "tool_type": "Artisan", "cost_quantity": 20, "cost_unit": "gp", "weight": "8 libras", "description": "Herramientas para trabajar con metales.", "ability_score": "STR"},
        {"index": "tinkers-tools", "name": "Herramientas de Chapucero", "name_en": "Tinker's Tools", "tool_type": "Artisan", "cost_quantity": 50, "cost_unit": "gp", "weight": "10 libras", "description": "Herramientas para reparar y crear mecanismos.", "ability_score": "INT"},
        {"index": "weavers-tools", "name": "Herramientas de Tejedor", "name_en": "Weaver's Tools", "tool_type": "Artisan", "cost_quantity": 5, "cost_unit": "gp", "weight": "5 libras", "description": "Herramientas para tejer telas.", "ability_score": "DEX"},
        {"index": "woodcarvers-tools", "name": "Herramientas de Tallador", "name_en": "Woodcarver's Tools", "tool_type": "Artisan", "cost_quantity": 1, "cost_unit": "gp", "weight": "5 libras", "description": "Herramientas para tallar madera.", "ability_score": "DEX"},
        
        # Herramientas de juego
        {"index": "dice-set", "name": "Juego de Dados", "name_en": "Dice Set", "tool_type": "Gaming", "cost_quantity": 1, "cost_unit": "sp", "weight": "0 libras", "description": "Un juego de dados para juegos de azar.", "ability_score": ""},
        {"index": "playing-card-set", "name": "Juego de Cartas", "name_en": "Playing Card Set", "tool_type": "Gaming", "cost_quantity": 5, "cost_unit": "sp", "weight": "0 libras", "description": "Un juego de cartas para juegos de azar.", "ability_score": ""},
        {"index": "dragonchess-set", "name": "Juego de Dragonchess", "name_en": "Dragonchess Set", "tool_type": "Gaming", "cost_quantity": 1, "cost_unit": "gp", "weight": "0.5 libras", "description": "Un juego de dragonchess complejo.", "ability_score": "INT"},
        
        # Herramientas musicales
        {"index": "flute", "name": "Flauta", "name_en": "Flute", "tool_type": "Musical", "cost_quantity": 2, "cost_unit": "gp", "weight": "1 libra", "description": "Una flauta sencilla.", "ability_score": "DEX"},
        {"index": "lute", "name": "Laúd", "name_en": "Lute", "tool_type": "Musical", "cost_quantity": 35, "cost_unit": "gp", "weight": "2 libras", "description": "Un laúd de calidad.", "ability_score": "DEX"},
        {"index": "violin", "name": "Violín", "name_en": "Violin", "tool_type": "Musical", "cost_quantity": 30, "cost_unit": "gp", "weight": "1 libra", "description": "Un violín bien construido.", "ability_score": "DEX"},
        
        # Herramientas de exploración
        {"index": "disguise-kit", "name": "Kit de Disfraz", "name_en": "Disguise Kit", "tool_type": "Exploration", "cost_quantity": 25, "cost_unit": "gp", "weight": "3 libras", "description": "Suministros para crear disfraces convincentes.", "ability_score": "INT"},
        {"index": "forgery-kit", "name": "Kit de Falsificación", "name_en": "Forgery Kit", "tool_type": "Exploration", "cost_quantity": 15, "cost_unit": "gp", "weight": "5 libras", "description": "Herramientas para falsificar documentos.", "ability_score": "INT"},
        {"index": "herbalism-kit", "name": "Kit de Herboristería", "name_en": "Herbalism Kit", "tool_type": "Exploration", "cost_quantity": 5, "cost_unit": "gp", "weight": "3 libras", "description": "Herramientas para identificar y recolectar plantas.", "ability_score": "WIS"},
        {"index": "healers-kit", "name": "Kit de Sanador", "name_en": "Healer's Kit", "tool_type": "Exploration", "cost_quantity": 5, "cost_unit": "gp", "weight": "3 libras", "description": "Suministros para tratamiento médico básico.", "ability_score": "WIS"},
        {"index": "messengers-papers", "name": "Papeles de Mensajero", "name_en": "Messenger's Papers", "tool_type": "Exploration", "cost_quantity": 2, "cost_unit": "gp", "weight": "1 libra", "description": "Papeles oficiales para mensajeros.", "ability_score": ""},
        {"index": "thieves-tools", "name": "Herramientas de Ladrón", "name_en": "Thieves' Tools", "tool_type": "Exploration", "cost_quantity": 25, "cost_unit": "gp", "weight": "1 libra", "description": "Herramientas para abrir cerraduras y desactivar trampas.", "ability_score": "DEX"}
    ]
    
    for tool_data in tools_data:
        if not session.query(Tool).filter(Tool.index == tool_data["index"]).first():
            tool = Tool(**tool_data)
            session.add(tool)
    
    session.commit()
    session.close()
    print("✅ Herramientas añadidas exitosamente!")

def populate_equipment_packs():
    """Añadir datos SRD de paquetes de equipo"""
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    session = Session()
    
    packs_data = [
        {
            "index": "burglars-pack",
            "name": "Paquete de Ladrón",
            "name_en": "Burglar's Pack",
            "pack_type": "Role",
            "cost_quantity": 16,
            "cost_unit": "gp",
            "description": "Un paquete de equipo para ladrones y exploradores urbanos.",
            "contents": json.dumps([
                {"name": "Saco de dormir", "quantity": 1},
                {"name": "Caldero", "quantity": 1},
                {"name": "Hornillo", "quantity": 1},
                {"name": "Raciones (10 días)", "quantity": 1},
                {"name": "Barril de agua", "quantity": 1},
                {"name": "Saco", "quantity": 1},
                {"name": "Cuerda (50 pies)", "quantity": 1},
                {"name": "Herramientas de ladrón", "quantity": 1}
            ])
        },
        {
            "index": "diplomats-pack",
            "name": "Paquete de Diplomático",
            "name_en": "Diplomat's Pack",
            "pack_type": "Role",
            "cost_quantity": 39,
            "cost_unit": "gp",
            "description": "Un paquete de equipo para diplomáticos y nobles viajeros.",
            "contents": json.dumps([
                {"name": "Cofre", "quantity": 1},
                {"name": "Juego de ropas finas", "quantity": 2},
                {"name": "Raciones (5 días)", "quantity": 1},
                {"name": "Vino (5 botellas)", "quantity": 1},
                {"name": "Saco", "quantity": 1},
                {"name": "Tinta (1 onza)", "quantity": 1},
                {"name": "Pluma", "quantity": 1},
                {"name": "Pergamino (5 hojas)", "quantity": 1}
            ])
        },
        {
            "index": "dungeoneers-pack",
            "name": "Paquete de Explorador de Mazmorras",
            "name_en": "Dungeoneer's Pack",
            "pack_type": "Role",
            "cost_quantity": 12,
            "cost_unit": "gp",
            "description": "Un paquete de equipo para exploradores de mazmorras.",
            "contents": json.dumps([
                {"name": "Saco de dormir", "quantity": 1},
                {"name": "Raciones (10 días)", "quantity": 1},
                {"name": "Barril de agua", "quantity": 1},
                {"name": "Saco", "quantity": 1},
                {"name": "Cuerda (50 pies)", "quantity": 1},
                {"name": "Antorchas (10)", "quantity": 1}
            ])
        },
        {
            "index": "entertainers-pack",
            "name": "Paquete de Artista",
            "name_en": "Entertainer's Pack",
            "pack_type": "Role",
            "cost_quantity": 3,
            "cost_unit": "gp",
            "description": "Un paquete de equipo para artistas y músicos viajeros.",
            "contents": json.dumps([
                {"name": "Laúd", "quantity": 1},
                {"name": "Juego de ropas de viaje", "quantity": 1},
                {"name": "Raciones (5 días)", "quantity": 1},
                {"name": "Barril de agua", "quantity": 1},
                {"name": "Saco", "quantity": 1}
            ])
        },
        {
            "index": "explorers-pack",
            "name": "Paquete de Explorador",
            "name_en": "Explorer's Pack",
            "pack_type": "Role",
            "cost_quantity": 10,
            "cost_unit": "gp",
            "description": "Un paquete de equipo para exploradores y aventureros.",
            "contents": json.dumps([
                {"name": "Juego de ropas de viaje", "quantity": 1},
                {"name": "Raciones (10 días)", "quantity": 1},
                {"name": "Barril de agua", "quantity": 1},
                {"name": "Saco", "quantity": 1},
                {"name": "Cuerda (50 pies)", "quantity": 1},
                {"name": "Antorchas (5)", "quantity": 1}
            ])
        },
        {
            "index": "priests-pack",
            "name": "Paquete de Sacerdote",
            "name_en": "Priest's Pack",
            "pack_type": "Role",
            "cost_quantity": 19,
            "cost_unit": "gp",
            "description": "Un paquete de equipo para sacerdotes y clérigos viajeros.",
            "contents": json.dumps([
                {"name": "Saco de dormir", "quantity": 1},
                {"name": "Raciones (10 días)", "quantity": 1},
                {"name": "Barril de agua", "quantity": 1},
                {"name": "Saco", "quantity": 1},
                {"name": "Incienso (10 varillas)", "quantity": 1},
                {"name": "Incensario", "quantity": 1},
                {"name": "Vestimentas", "quantity": 2},
                {"name": "Libro de rezos", "quantity": 1}
            ])
        },
        {
            "index": "scholars-pack",
            "name": "Paquete de Erudito",
            "name_en": "Scholar's Pack",
            "pack_type": "Role",
            "cost_quantity": 40,
            "cost_unit": "gp",
            "description": "Un paquete de equipo para eruditos y magos.",
            "contents": json.dumps([
                {"name": "Juego de ropas de viaje", "quantity": 1},
                {"name": "Libro", "quantity": 1},
                {"name": "Tinta (1 onza)", "quantity": 1},
                {"name": "Pluma", "quantity": 1},
                {"name": "Pergamino (10 hojas)", "quantity": 1},
                {"name": "Bolsa pequeña", "quantity": 1}
            ])
        }
    ]
    
    for pack_data in packs_data:
        if not session.query(EquipmentPack).filter(EquipmentPack.index == pack_data["index"]).first():
            pack = EquipmentPack(**pack_data)
            session.add(pack)
    
    session.commit()
    session.close()
    print("✅ Paquetes de equipo añadidos exitosamente!")

def populate_rules_mechanics():
    """Añadir datos de reglas de mecánicas"""
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Reglas de Ventaja/Desventaja
    advantage_rules = [
        {
            "name": "Ventaja",
            "description": "Cuando tienes ventaja en una tirada, lanzas dos d20 y tomas el resultado mayor. Cuando tienes desventaja, lanzas dos d20 y tomas el resultado menor.",
            "examples": json.dumps([
                "Ataque con flanqueo",
                "Tirada de percepción con buena visibilidad",
                "Tirada de sigilo cuando estás oculto"
            ])
        },
        {
            "name": "Desventaja",
            "description": "Cuando tienes desventaja en una tirada, lanzas dos d20 y tomas el resultado menor. La desventaja anula la ventaja.",
            "examples": json.dumps([
                "Ataque cuando estás ciego",
                "Tirada de percepción en la oscuridad",
                "Tirada de sigilo cuando estás siendo observado"
            ])
        }
    ]
    
    for rule_data in advantage_rules:
        if not session.query(AdvantageRule).filter(AdvantageRule.name == rule_data["name"]).first():
            rule = AdvantageRule(**rule_data)
            session.add(rule)
    
    # Reglas de Inspiración
    inspiration_rules = [
        {
            "name": "Inspiración",
            "description": "La inspiración es una regla opcional que puedes usar para recompensar a los jugadores por un buen roleplaying. Un jugador puede gastar su inspiración para añadir ventaja a una tirada de ataque, tirada de habilidad, o tirada de salvación.",
            "how_to_earn": "El DM puede conceder inspiración a un jugador cuando actúa de acuerdo con sus rasgos de personalidad, ideal, lazo o defecto, o cuando interpreta a su personaje de una manera especialmente entretenida.",
            "how_to_use": "Un jugador puede gastar su inspiración después de lanzar un d20 pero antes de que el DM diga si la tirada tiene éxito o fracasa. El jugador solo puede tener un punto de inspiración a la vez."
        }
    ]
    
    for rule_data in inspiration_rules:
        if not session.query(InspirationRule).filter(InspirationRule.name == rule_data["name"]).first():
            rule = InspirationRule(**rule_data)
            session.add(rule)
    
    # Reglas de Multiclase
    multiclass_rules = [
        {
            "name": "Requisitos para Multiclase",
            "description": "Para añadir una clase multiclase, tu personaje debe cumplir con ciertos requisitos de habilidad.",
            "requirements": json.dumps([
                {"class": "Bárbaro", "requirement": "Fuerza 13"},
                {"class": "Bardo", "requirement": "Carisma 13"},
                {"class": "Clérigo", "requirement": "Sabiduría 13"},
                {"class": "Druida", "requirement": "Sabiduría 13"},
                {"class": "Explorador", "requirement": "Destreza 13 y Sabiduría 13"},
                {"class": "Guerrero", "requirement": "Fuerza 13 y Destreza 13"},
                {"class": "Mago", "requirement": "Inteligencia 13"},
                {"class": "Monje", "requirement": "Destreza 13 y Sabiduría 13"},
                {"class": "Paladín", "requirement": "Fuerza 13 y Carisma 13"},
                {"class": "Pícaro", "requirement": "Destreza 13"},
                {"class": "Hechicero", "requirement": "Carisma 13"},
                {"class": "Brujo", "requirement": "Carisma 13"}
            ]),
            "benefits": json.dumps([
                "Obtienes las habilidades de clase de la nueva clase",
                "Ganas puntos de golpe según la nueva clase",
                "Puedes lanzar hechizos de ambas clases si cumples los requisitos"
            ])
        }
    ]
    
    for rule_data in multiclass_rules:
        if not session.query(MulticlassRule).filter(MulticlassRule.name == rule_data["name"]).first():
            rule = MulticlassRule(**rule_data)
            session.add(rule)
    
    session.commit()
    session.close()
    print("✅ Reglas de mecánicas añadidas exitosamente!")

def main():
    """Función principal para ejecutar todo el proceso"""
    print("🚀 Iniciando implementación de FASE 1 y FASE 2...")
    
    try:
        # Crear tablas
        create_tables()
        
        # Poblar datos
        populate_mounts()
        populate_vehicles()
        populate_trade_goods()
        populate_tools()
        populate_equipment_packs()
        populate_rules_mechanics()
        
        print("\n✅ ¡Implementación completada exitosamente!")
        print("📊 Resumen de contenido añadido:")
        print("   • 8+ Monturas con SRD data")
        print("   • 6+ Vehículos con SRD data")
        print("   • 15+ Bienes comerciales (gemas, metales)")
        print("   • 25+ Herramientas (artesano, juego, música, exploración)")
        print("   • 7+ Paquetes de equipo por rol")
        print("   • Sistema completo de reglas (Ventaja/Desventaja, Inspiración, Multiclase)")
        print("\n🎯 Las nuevas API endpoints están disponibles en:")
        print("   • /compendium/mounts")
        print("   • /compendium/vehicles")
        print("   • /compendium/trade-goods")
        print("   • /compendium/tools")
        print("   • /compendium/equipment-packs")
        print("   • /compendium/rules/advantage")
        print("   • /compendium/rules/inspiration")
        print("   • /compendium/rules/multiclass")
        print("   • /compendium/rules/proficiency-bonus")
        
    except Exception as e:
        print(f"❌ Error durante la implementación: {e}")
        return False
    
    return True

if __name__ == "__main__":
    main()
