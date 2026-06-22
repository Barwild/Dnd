# Plan de Implementación de Progresión de Niveles SRD 5e y Artífice

Este plan detalla la estructura del compendio de progresión de niveles (1 al 20) en español y la refactorización del motor de mecánicas en el backend FastAPI y la hoja de personaje en React.

---

## Cambios Propuestos

### 1. Datos del Compendio de Progresión
#### [NEW] [compendium_progression.json](file:///c:/Users/bafee/Downloads/DM_DnD/api/static/compendium_progression.json)
Creación de un archivo de datos estructurado en formato JSON con la progresión detallada de nivel 1 al 20 para las 13 clases del juego.
*   Incluye campo `subclass_level` para cada clase indicando en qué nivel eligen subclase.
*   Mapea cada nivel al arreglo de rasgos (`features`) en español oficiales del SRD 5.1 y Artífice.

---

### 2. Backend - Motor de Mecánicas y Reglas
#### [MODIFY] [mechanics_engine.py](file:///c:/Users/bafee/Downloads/DM_DnD/api/utils/mechanics_engine.py)
*   **Ajuste de la regla de multiclase para Artífice:** Cambiar la contribución del Artífice a redondeado hacia abajo (`lvl // 2`) para coincidir con la instrucción explícita del usuario.
*   **Función `handle_level_up_universal`:**
    *   Lee `compendium_progression.json`.
    *   Compara rasgos del nivel anterior al nuevo.
    *   Inserta en la tabla `character_features` transformando nombres a `snake_case` sin tildes.
    *   Determina si el nivel alcanzado requiere una elección del usuario:
        *   `ASI_OR_FEAT`: En niveles de mejora de característica (4, 8, 12, 16, 19, y niveles extra de Guerrero/Pícaro).
        *   `SUBCLASS`: En el nivel que indica `subclass_level` si el personaje no tiene `subclass_id` asignado.
        *   `FIGHTING_STYLE`: Si desbloquea "Estilo de Combate".

---

### 3. Backend - Endpoints
#### [MODIFY] [characters.py](file:///c:/Users/bafee/Downloads/DM_DnD/api/routers/characters.py)
*   Creación del endpoint `POST /characters/{id}/level-up` que:
    *   Usa bloqueos de base de datos (`with db.begin()`) o control de transacciones seguras para evitar Race Conditions.
    *   Incrementa `level` en `Character`.
    *   Llama a `handle_level_up_universal`.
    *   Actualiza los Dados de Golpe máximos y actuales.
    *   Devuelve el resultado del nivel del personaje y los requisitos de elección.

---

### 4. Frontend - Interfaz de Usuario React
#### [MODIFY] [CharacterSheet.jsx](file:///c:/Users/bafee/Downloads/DM_DnD/app/src/pages/CharacterSheet.jsx)
*   Interceptor en la respuesta del botón "Subir Nivel".
*   Si el backend devuelve `requires_choice: true`, activa estados para mostrar modales interactivos en español correspondientes a:
    *   `ASI_OR_FEAT`: Incremento de atributos o selección de dote.
    *   `SUBCLASS`: Selección de subclase del compendio vinculada a su clase actual.
    *   `FIGHTING_STYLE`: Selección de estilo de combate.

---

## Preguntas Abiertas / Confirmación del Usuario
> [!IMPORTANT]
> Se asume que en el frontend, al finalizar una elección en un modal (como la Subclase), se enviará una petición regular de actualización del personaje (`PUT /characters/{id}`) para guardar la dote, subclase o estilo elegido. ¿Es esto correcto?

---

## Plan de Verificación

### Pruebas Automatizadas
*   Añadir pruebas unitarias en `test_mechanics.py` para validar `handle_level_up_universal` y verificar que detecta correctamente las elecciones `ASI_OR_FEAT`, `SUBCLASS` y `FIGHTING_STYLE` según la clase y el nivel.
