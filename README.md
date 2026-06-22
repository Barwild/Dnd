# ⚔️ D&D 5E Nexus

**D&D 5E Nexus** es una plataforma web y móvil integral para gestionar campañas, personajes, encuentros y compendios de la 5ª Edición de Dungeons & Dragons en español. El sistema está diseñado tanto para jugadores que desean llevar su hoja de personaje digital, como para Dungeon Masters (DM) que necesitan herramientas avanzadas de control de campañas en tiempo real.

---

## 🏗️ Arquitectura del Proyecto

El proyecto está estructurado de manera modular en dos directorios principales:
1.  **`api/` (Backend):** Desarrollado en Python utilizando **FastAPI** y **SQLAlchemy**. Se conecta a SQLite para desarrollo y a PostgreSQL para producción.
2.  **`app/` (Frontend):** Una aplicación moderna e interactiva en **React + TypeScript + Vite**, empaquetada con **Capacitor** para permitir la compilación directa a dispositivos móviles Android.

En producción (como en Render), el sistema funciona de forma unificada: el script de compilación genera el frontend y el servidor de FastAPI sirve de manera estática los archivos construidos (`dist/`), actuando tanto de API REST como de servidor web.

```mermaid
graph TD
    subgraph Frontend (app)
        A[React SPA] --> B[Vite Compiler]
        A --> C[Capacitor / Android]
    end
    subgraph Backend (api)
        D[FastAPI APP] --> E[SQLite / PostgreSQL]
        D --> F[Compendium Data & Assets]
    end
    B -- build.sh --> G[Statically Served in api/dist]
    G -.-> D
```

---

## 📁 Estructura General de Directorios

```text
DM_DnD/
├── api/                  # Código del Servidor FastAPI (Python)
│   ├── routers/          # Endpoints de la API clasificados por módulos
│   ├── scripts/          # Scripts para inicialización, traducción y seed de datos
│   ├── static/           # Archivos estáticos de la API (imágenes, retratos, etc.)
│   ├── utils/            # Utilidades de negocio (cálculo de equipo, correcciones)
│   ├── database.py       # Configuración de base de datos (SQLAlchemy)
│   ├── models.py         # Definición de modelos ORM de la Base de Datos
│   ├── schemas.py        # Modelos Pydantic para validación de datos (Request/Response)
│   ├── dnd_nexus.db      # Base de datos SQLite (Desarrollo local)
│   └── requirements.txt  # Dependencias del Backend
│
├── app/                  # Código del Frontend (React + Vite)
│   ├── android/          # Proyecto Android nativo autogenerado por Capacitor
│   ├── public/           # Archivos públicos y assets del frontend
│   ├── src/              # Código fuente de React
│   │   ├── components/   # Componentes globales reutilizables
│   │   ├── pages/        # Vistas principales de la aplicación (15 pantallas)
│   │   ├── App.jsx       # Enrutador y layout principal
│   │   ├── api.js        # Cliente Axios configurado para comunicar con la API
│   │   └── main.jsx      # Entrada del renderizado de React
│   ├── capacitor.config.ts# Configuración para compilación Android
│   ├── package.json      # Dependencias del Frontend
│   └── vite.config.js    # Configuración de Vite
│
├── build.sh              # Script Bash para despliegue automatizado
└── render.yaml           # Configuración de despliegue para Render.com
```

---

## 🖥️ Módulos del Backend (`api/`)

El servidor expone múltiples servicios organizados en controladores (**routers**) en [api/routers/](file:///c:/Users/bafee/Downloads/DM_DnD/api/routers/):

### 🔐 1. Autenticación (`auth.py`)
Maneja el registro de usuarios, inicio de sesión y validación de tokens **JWT**.
- Permite la creación de cuentas con roles específicos: **Jugador** (`player`) o **Dungeon Master** (`dm`).

### 🗺️ 2. Gestión de Campañas (`campaigns.py`)
Controla la creación de campañas por parte de los DM y la unión de jugadores mediante un código único de 6 caracteres.
- Permite registrar bitácoras y notas de sesión estructuradas (`SessionNote`).
- Gestiona a los miembros activos (`CampaignMember`) de cada mesa de juego.

### 👤 3. Hojas de Personaje (`characters.py`)
Un motor robusto para gestionar toda la información de un personaje.
- Controla niveles, clases, subclases, trasfondos y alineamientos.
- Guarda inventario, equipo equipado (`equipped_items`) y calcula estadísticas derivadas como la Clase de Armadura (CA) y el peso máximo transportable mediante clases especializadas ([equipment_calculator.py](file:///c:/Users/bafee/Downloads/DM_DnD/api/utils/equipment_calculator.py)).
- Permite la administración del libro de conjuros del personaje (`spell_list`).

### 📚 4. Compendio (`compendium.py`)
Proporciona endpoints de consulta y búsqueda para todas las reglas del juego traducidas al español:
*   **Razas y Subrazas** (`races`)
*   **Clases y Subclases** (`classes`, `subclasses`)
*   **Monstruos / Bestiario** (`monsters`)
*   **Conjuros / Hechizos** (`spells`)
*   **Objetos y Equipo** (Armas, Armaduras, Objetos Mágicos, Herramientas, Monturas, Vehículos y Packs de Equipo)
*   **Trasfondos** (`backgrounds`)
*   **Dotes y Habilidades** (`feats`, `skills`)
*   **Reglas Mecánicas** (Ventajas, Inspiración, Multiclase y Tablas de Nivelación)

### 🎲 5. Herramientas del DM (`dm_tools.py`)
Funcionalidades avanzadas para dinamizar las sesiones de juego:
- **Gestión de Encuentros / Combates (`Encounter`):** Permite añadir combatientes (personajes y monstruos), rastrear iniciativas, turnos, rondas y registrar un log de combate.
- **Historial de Dados (`DiceLog`):** Permite registrar tiradas de dados enviadas desde los clientes asociados a la campaña.

---

## 🎨 Vistas del Frontend (`app/`)

El cliente de React en [app/src/pages/](file:///c:/Users/bafee/Downloads/DM_DnD/app/src/pages/) está compuesto por 15 páginas dinámicas que enriquecen la experiencia de juego:

*   **`Home.jsx`**: Panel inicial con acceso directo a las campañas y hojas de personaje del usuario.
*   **`Login.jsx` & `Register.jsx`**: Pantallas de acceso y creación de cuentas.
*   **`PlayerLobby.jsx`**: Lobby donde los jugadores pueden unirse a una campaña mediante un código y asociar un personaje.
*   **`CampaignManager.jsx`**: Permite al DM crear campañas, ver notas de sesiones y gestionar su listado de partidas.
*   **`PlayerCreator.jsx`**: Asistente de creación de personajes paso a paso, guiando la selección de raza, clase, atributos, trasfondo y equipo inicial.
*   **`CharacterSheet.jsx`**: Hoja de personaje dinámica e interactiva con visualización de vida actual/máxima, iniciativa, velocidad, dados de golpe y rasgos de clase.
*   **`SkillsSheet.jsx`**: Desglose de habilidades y puntuaciones de característica, con modificadores calculados automáticamente.
*   **`EquipmentSheet.jsx`**: Gestión interactiva del inventario, permitiendo equipar o desequipar armas, armaduras y escudos en tiempo real con recálculo automático de la CA.
*   **`Spellbook.jsx`**: Gestor de hechizos y cantrips conocidos por el personaje, divididos por niveles de conjuro.
*   **`MasterDashboard.jsx`**: Panel de control del Dungeon Master. Contiene el gestor de notas de sesión en directo, control de combatientes, listado de personajes jugadores y visores rápidos.
*   **`EncounterBuilder.jsx`**: Diseñador de combates para el DM, permitiendo simular tiradas de iniciativa, añadir monstruos del bestiario y controlar la vida de los enemigos.
*   **`Bestiary.jsx`**: Buscador de criaturas con fichas detalladas de monstruos (estadísticas, ataques, acciones legendarias).
*   **`ItemsCatalog.jsx`**: Catálogo de consulta de armas, armaduras y objetos mágicos del compendio.
*   **`ConditionsRef.jsx`**: Guía rápida de referencia de estados y condiciones (Cegado, Derribado, Envenenado, etc.).

### ⚙️ Componente Destacado:
*   **`DiceRollingOverlay.jsx`**: Superposición flotante para realizar tiradas de dados interactivas y registrar directamente los resultados en el historial de la campaña.

---

## 🗄️ Modelado de Base de Datos (`api/models.py`)

La base de datos cuenta con una estructura relacional muy completa. Algunos de los modelos clave definidos en [models.py](file:///c:/Users/bafee/Downloads/DM_DnD/api/models.py) son:

*   **`User`**: Información de usuario, contraseña encriptada y rol.
*   **`Campaign`**: Datos de la campaña y código de acceso único.
*   **`Character`**: Almacena atributos (Fuerza, Destreza, etc.), equipo en formato JSON, hechizos aprendidos y estadísticas calculadas.
*   **`Monster` & `Spell`**: Plantillas detalladas de criaturas y conjuros de D&D 5E con soporte de traducción ES/EN.
*   **`Encounter`**: Estado activo del combate, rondas, turnos e iniciativas de los combatientes.
*   **`SessionNote`**: Notas narrativas de las sesiones vinculadas a las campañas.
*   **`DiceLog`**: Registro persistente de tiradas de dados realizadas en el contexto de una campaña.

---

## 🚀 Despliegue y Ejecución Local

### Requisitos Previos:
*   Python 3.10 o superior
*   Node.js (v18+) y npm

### Ejecución en Desarrollo:

1.  **Backend (API):**
    ```bash
    cd api
    python -m venv venv
    # En Windows:
    .\venv\Scripts\activate
    # En Linux/macOS:
    source venv/bin/activate
    pip install -r requirements.txt
    uvicorn main:app --reload
    ```
    *La API estará disponible en `http://localhost:8000`. El sistema sincronizará y seedeará automáticamente la base de datos local `dnd_nexus.db` en su primera ejecución.*

2.  **Frontend (React App):**
    ```bash
    cd app
    npm install
    npm run dev
    ```
    *El frontend estará disponible en `http://localhost:5173`.*

### Despliegue en Producción (Render.com):
El despliegue está configurado mediante `render.yaml`. Utiliza el archivo `build.sh` que ejecuta de forma automática:
1.  Instalación de paquetes de backend (`requirements.txt`).
2.  Instalación y compilación del frontend en React (`npm run build`).
3.  Copia de los assets compilados a `api/dist` para que FastAPI los sirva de forma unificada desde una única IP.
