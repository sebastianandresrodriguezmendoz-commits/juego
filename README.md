# 🚀 GunRun 2D - Plataforma Web Arcade Top-Down Shooter

![GunRun 2D](https://img.shields.io/badge/Status-Producción-00ffcc?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.14+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![Canvas](https://img.shields.io/badge/Canvas_2D-60_FPS-ff007f?style=for-the-badge)

**GunRun 2D** es un videojuego de disparos en perspectiva superior (*Top-Down Shooter*) de alta velocidad ejecutable directamente desde el navegador web. Integra un motor nativo en HTML5 Canvas con cinemática 2D, balística, recarga táctica, síntesis de audio mediante Web Audio API, e Inteligencia Artificial de oleadas progresivas, respaldado por una arquitectura de servidor RESTful en Python/Flask y persistencia relacional en **MySQL**.

---

## 🏛️ 1. Arquitectura del Sistema (Cero Mocks)

El sistema opera bajo una estricta separación de responsabilidades y cero simulación:

```
juego_creado/
│
├── backend/
│   ├── run.py                     # Entrypoint dual (Flask Debug / Waitress WSGI Prod)
│   ├── config.py                  # Configuración dinámica y conexión MySQL
│   ├── init_db.sql                # Script SQL idempotente de inicialización de tablas
│   └── app/
│       ├── __init__.py            # Fábrica Flask, CORS, headers de seguridad
│       ├── models/
│       │   ├── __init__.py        # Exportación de modelos e instancia SQLAlchemy
│       │   ├── user.py            # Entidad User con hashing criptográfico de contraseñas
│       │   └── score.py           # Entidades Score, GameStats y UserAchievement
│       ├── routes/
│       │   ├── __init__.py        # Registro centralizado de Blueprints
│       │   ├── auth.py            # Endpoints de Registro, Login y Perfil con JWT y Rate Limiting
│       │   └── scores.py          # Endpoints de guardado, historial, logros y Leaderboard
│       └── utils/
│           ├── __init__.py
│           ├── jwt_manager.py     # Generación, firma (HS256) y middleware token_required
│           ├── rate_limiter.py    # Protección Rate Limiting por IP contra fuerza bruta y DoS
│           └── response.py        # Estructura JSON unificada { "success", "data", "error" }
│
├── frontend/
│   ├── index.html                 # Interfaz visual responsive con Bootstrap 5, Toasts y Canvas
│   ├── css/
│   │   └── style.css              # Sistema de diseño Retro-Arcade Neón Dark Mode
│   └── js/
│       ├── auth.js                # Cliente HTTP para Auth, Stats, Historial, Logros y Toasts
│       └── game.js                # Motor Canvas 2D a 60 FPS, Arsenal [1,2,3], IA, Balística y SFX
│
├── tests/                         # Suite Completa de Pruebas Automatizadas
│   ├── __init__.py
│   ├── conftest.py                # Configuración de pruebas atómicas en memoria
│   ├── test_auth.py               # Tests unitarios de Registro, Login y JWT
│   └── test_scores.py             # Tests unitarios de Puntajes, Stats y Logros
│
├── Dockerfile                     # Imagen de producción ligera multi-stage (Python 3.11 Slim)
├── docker-compose.yml             # Orquestación de Contenedores (App + MySQL 8.0 persistente)
├── .dockerignore                  # Exclusión de entornos virtuales y logs
├── run_tests.py                   # Ejecutor de la suite de pruebas unitarias
├── venv/                          # Entorno virtual de Python
├── .env.example                   # Plantilla de variables de entorno
├── .env                           # Credenciales activas
└── requirements.txt               # Dependencias de producción y testing
```

---

## 🗄️ 2. Modelo de Base de Datos Relacional (MySQL)

```mermaid
erDiagram
    USERS ||--o{ SCORES : "registra (1:N)"
    USERS ||--o| GAME_STATS : "posee (1:1)"
    USERS ||--o{ USER_ACHIEVEMENTS : "desbloquea (1:N)"

    USERS {
        int id PK
        string username UK
        string email UK
        string password_hash
        datetime created_at
        datetime updated_at
    }

    SCORES {
        int id PK
        int user_id FK
        int score
        int wave
        int kills
        int survival_time
        float accuracy
        datetime created_at
    }

    GAME_STATS {
        int id PK
        int user_id FK, UK
        int total_games
        int total_kills
        int highest_score
        int highest_wave
        int total_playtime_seconds
        datetime updated_at
    }

    USER_ACHIEVEMENTS {
        int id PK
        int user_id FK
        string achievement_key
        datetime unlocked_at
    }
```

---

## 📡 3. Catálogo de la API RESTful

Todas las respuestas del backend siguen el estándar unificado:
- **Éxito:** `{ "success": true, "message": "...", "data": { ... } }`
- **Error:** `{ "success": false, "error": "Mensaje descriptivo" }`

### Autenticación (`/api/auth`)
| Método | Endpoint | Cabeceras | Rate Limit | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | `Content-Type: application/json` | 10 req/min | Registra jugador con contraseña hasheada y emite JWT. |
| `POST` | `/api/auth/login` | `Content-Type: application/json` | 15 req/min | Autentica con usuario/correo y contraseña. Emite token JWT. |
| `GET` | `/api/auth/profile` | `Authorization: Bearer <token>` | Ninguno | Consulta el perfil del jugador autenticado. |
| `GET` | `/api/auth/verify` | `Authorization: Bearer <token>` | Ninguno | Comprueba vigencia del token activo. |
| `GET` | `/api/health` | *Ninguna* | Ninguno | Health check de estado del servidor y conexión MySQL. |

### Partidas, Estadísticas y Logros (`/api/scores`)
| Método | Endpoint | Cabeceras | Rate Limit | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/scores` | `Authorization: Bearer <token>` | 30 req/min | Guarda partida, actualiza `GameStats` y desbloquea logros en MySQL. |
| `GET` | `/api/scores/leaderboard` | *Ninguna* | Ninguno | Retorna el **Top 10 Global** ordenado por puntuación. |
| `GET` | `/api/scores/my-stats` | `Authorization: Bearer <token>` | Ninguno | Consulta las estadísticas consolidadas del jugador. |
| `GET` | `/api/scores/my-history` | `Authorization: Bearer <token>` | Ninguno | Retorna las últimas 20 partidas disputadas por el jugador. |
| `GET` | `/api/scores/achievements` | `Authorization: Bearer <token>` | Ninguno | Consulta el catálogo completo de logros desbloqueados y pendientes. |

---

## 🎮 4. Controles y Mecánicas del Juego

| Control | Acción |
| :--- | :--- |
| **`W` `A` `S` `D`** o **Flechas** | Desplazamiento del soldado en 2D (con vector normalizado). |
| **Cursor del Ratón** | Apuntado y rotación trigonométrica de 360° con mira láser. |
| **Clic Izquierdo** | Disparo táctico continuo con cadencia controlada según el arma activa. |
| **Teclas `1` `2` `3` o Rueda del Ratón** | **Arsenal Táctico:** [1] Blaster rápido, [2] Escopeta de dispersión (5 proyectiles en abanico), [3] Railgun penetrante (atraviesa hasta 3 enemigos). |
| **Tecla `R`** | Recarga táctica del cargador (25 balas / reserva de 175). |
| **Tecla `ESC`** | Pausar y reanudar la partida. |
| **Botón 🔊 Sonido** | Silenciar o reactivar el sintetizador Web Audio API nativo. |
| **Botón 🎯 Centrar** | Bloquea y centra automáticamente el visor del Canvas. |
| **Botón ⛶ Pantalla Completa** | Activa el modo inmersivo sin barras del navegador. |

### ⚡ Sistema de Drops y Power-Ups en la Arena
- 💚 **Botiquín (+35 HP):** Regenera la salud de la armadura.
- ⚡ **Munición (+60 Balas):** Rellena la reserva y recarga el arma de inmediato.
- 🛡️ **Sobreescudo (+35 Pts):** Absorbe proyectiles e impactos antes de afectar la salud.
- 🔥 **Modo Frenesí (7.5s):** Disparo con cadencia duplicada y costo de munición cero.
- ☢️ **PEM Nuke:** Detonación masiva que destruye a todos los enemigos estándar en arena.

### 👾 Tipos de Enemigos y Boss Titan
- **Drone de Asalto:** Rápido y ágil, busca el combate cuerpo a cuerpo.
- **Tanque Blindado:** Alta resistencia, daño de contacto elevado.
- **Francotirador (Shooter):** Mantiene distancia táctica y dispara proyectiles de plasma esquivables.
- **Dron Suicida (Kamikaze):** Ultra veloz con pulso de advertencia; detona al impactar.
- **Titan Protocol Omega (Jefe):** Aparece cada 5 oleadas (Oleadas 5, 10, 15...). Blindaje giratorio, ráfagas triples de proyectiles, barra de salud dedicada y recompensa de $+2500$ puntos con drops garantizados.

### 📖 Historia y Misión del Piloto
En el año 2088, el complejo orbital militar **Sector Neon-9** ha caído bajo el control de una inteligencia artificial fuera de control: **Protocol Omega**. Como último piloto del escuadrón **Neon Vanguard**, debes resistir oleadas de máquinas asesinas, dominar el cambio táctico de arsenal en tiempo real y eliminar a los colosos mecánicos que asedian la estación. Toda partida completada registra tu supervivencia, precisión y bajas en el **Leaderboard Global de MySQL**.

---

## 🛠️ 5. Puesta en Marcha Local

### Prerrequisitos
- **Python 3.10+** (o superior).
- **Servicio MySQL 8.0+** activo localmente.

### Pasos de Ejecución
1. **Clonar o situarse en el directorio:**
   ```powershell
   cd c:\Users\sebas\OneDrive\Desktop\juego_creado
   ```

2. **Verificar variables de entorno (`.env`):**
   ```ini
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=tu_clave_mysql
   DB_NAME=gunrun2d
   SECRET_KEY=clave_secreta_jwt_produccion
   FLASK_ENV=development
   PORT=5000
   ```

3. **Iniciar el Servidor (Modo Desarrollo):**
   ```powershell
   .\venv\Scripts\python.exe backend\run.py
   ```

4. **Acceder a la aplicación:**
   Abre tu navegador en: **`http://127.0.0.1:5000`**

---

## 🧪 6. Suite de Pruebas Automatizadas (Testing Unitario e Integración)

El proyecto incluye una suite completa de pruebas unitarias que validan la lógica de negocio, autenticación, persistencia y logros de forma aislada y reproducible:

### Ejecutar todas las pruebas:
```powershell
.\venv\Scripts\python.exe run_tests.py
```
O usando pytest:
```powershell
.\venv\Scripts\python.exe -m pytest -v
```

### Casos de prueba incluidos:
- `test_auth.py`: Registro con hashing de contraseñas, validación de correos, unicidad de usuarios (HTTP 409), login con username/email, verificación criptográfica de JWT y protección de perfiles contra accesos no autorizados (HTTP 401).
- `test_scores.py`: Guardado de partidas, agregación matemática de `GameStats` (`total_games`, `total_kills`, `highest_score`), algoritmo de desbloqueo de logros, ordenamiento del Leaderboard global y validación estricta de payloads (rechazo de puntuaciones negativas).

---

## 🌐 7. Despliegue en Producción

### Opción A: Despliegue Completo con Docker Compose (Recomendado)
Levanta la arquitectura completa (Base de datos MySQL 8.0 con volumen persistente + Backend Flask Waitress WSGI) en un solo comando:

```powershell
# Iniciar servicios en segundo plano con build de imagen
docker compose up --build -d

# Ver logs de la aplicación y base de datos
docker compose logs -f

# Detener los contenedores preservando datos
docker compose down
```
La aplicación quedará disponible inmediatamente en: **`http://localhost:5000`**

### Opción B: Servidor WSGI Waitress Nativo (Windows / Servidor Local)
Waitress está configurado para servir la aplicación en múltiples hilos concurrentes:
```powershell
.\venv\Scripts\python.exe backend\run.py --prod
```

### Opción C: Linux con Gunicorn + Nginx + Systemd
1. Instalar Gunicorn en el entorno virtual de producción:
   ```bash
   pip install gunicorn
   ```
2. Ejecutar con 4 workers concurrentes:
   ```bash
   gunicorn -w 4 -b 127.0.0.1:5000 "backend.app:create_app()"
   ```
3. Configurar Nginx como Reverse Proxy con terminación SSL/TLS (HTTPS).

---

## 🛡️ 8. Medidas de Seguridad Implementadas
- **Rate Limiting por IP:** Decorador activo en `/api/auth/login` (15 req/min), `/api/auth/register` (10 req/min) y `/api/scores` (30 req/min) para mitigación de ataques de fuerza bruta y DoS.
- **Hasheo Criptográfico de Contraseñas:** Algoritmo PBKDF2/Scrypt con sal automática de alta entropía (Werkzeug Security).
- **Criptografía JWT:** Tokens firmados con algoritmo HS256 y caducidad estricta de 24 horas.
- **Cabeceras HTTP de Producción:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`.
- **Protección CORS:** Restricción granular de accesos para consumo web de API.
- **Validación Estricta de Entradas:** Sanitización y tipado forzado en todos los payloads JSON.

---

## 🐙 9. Guía Paso a Paso: Cómo Subir el Proyecto a GitHub

Sigue estos pasos en tu terminal (PowerShell o CMD) para publicar tu repositorio completo en GitHub:

### Paso 1: Abrir la terminal en la raíz del proyecto
```powershell
cd c:\Users\sebas\OneDrive\Desktop\juego_creado
```

### Paso 2: Inicializar el repositorio Git local
```powershell
git init
```

### Paso 3: Agregar todos los archivos al seguimiento de Git
*(El archivo `.gitignore` ya está configurado para omitir automáticamente `venv/`, `.env`, cachés y temporales)*
```powershell
git add .
```

### Paso 4: Crear el primer commit con la versión completa
```powershell
git commit -m "feat: GunRun 2D completo - Flask API, Canvas Engine, MySQL, Arsenal, Tests y Docker"
```

### Paso 5: Renombrar la rama principal a `main`
```powershell
git branch -M main
```

### Paso 6: Crear el repositorio en GitHub y vincularlo
1. Ve a [GitHub](https://github.com/new) e inicia sesión.
2. Crea un nuevo repositorio (por ejemplo con el nombre `gunrun-2d`).
3. Elige la visibilidad (**Público** o **Privado**) y **no selecciones** "Initialize with README" ni `.gitignore` (ya los tienes en tu máquina).
4. Copia el comando de URL de tu repositorio y ejecútalo en tu terminal:
```powershell
git remote add origin https://github.com/TU_USUARIO/gunrun-2d.git
```
*(Reemplaza `TU_USUARIO` por tu nombre de usuario en GitHub)*

### Paso 7: Subir todo el código a GitHub
```powershell
git push -u origin main
```

---

## ☁️ 10. Guía Paso a Paso: Cómo Desplegar en Render (Deploy a Producción)

[Render](https://render.com) es una de las plataformas en la nube más sencillas para desplegar aplicaciones web completas con Python y Docker.

### Opción 1: Despliegue con Docker en Render (Más Rápido y Recomendado)
Dado que el proyecto ya cuenta con un `Dockerfile` optimizado:

1. **Crear cuenta en Render:**
   Entra a [render.com](https://render.com) e inicia sesión con tu cuenta de GitHub.

2. **Crear un nuevo Web Service:**
   - Haz clic en **New +** y selecciona **Web Service**.
   - Conecta tu repositorio de GitHub `gunrun-2d`.
   - Render detectará automáticamente el archivo `Dockerfile`.

3. **Configuración del Servicio:**
   - **Name:** `gunrun2d`
   - **Region:** Selecciona la más cercana (ej. *Oregon (US West)* o *Frankfurt*).
   - **Branch:** `main`
   - **Runtime:** `Docker`
   - **Instance Type:** `Free`

4. **Configurar la Base de Datos en Render:**
   Tienes dos opciones para la base de datos en la nube:
   - **Opción A (MySQL Gratuito en la nube con TiDB Cloud / Aiven / PlanetScale):**
     Crea una base de datos MySQL gratuita en [Aiven.io](https://aiven.io) o [TiDB Cloud](https://tidbcloud.com) y copia la URI de conexión (`mysql://usuario:clave@host:puerto/gunrun2d`).
   - **Opción B (PostgreSQL nativo en Render):**
     Crea un **PostgreSQL** gratuito en Render (New + -> PostgreSQL) y copia la `Internal Database URL`. Nuestro `backend/config.py` soporta automáticamente `DATABASE_URL` tanto para MySQL como para PostgreSQL.

5. **Configurar Variables de Entorno en Render:**
   En la pestaña **Environment Variables** de tu servicio web en Render, añade:
   - `DATABASE_URL`: La URL de conexión a tu base de datos en la nube.
   - `SECRET_KEY`: Una cadena segura alfanumérica para firmar los tokens JWT.
   - `FLASK_ENV`: `production`
   - `PORT`: `5000` (Render inyecta su propio puerto si es necesario).

6. **Desplegar:**
   Haz clic en **Create Web Service**. Render compilará el contenedor Docker, ejecutará el health check y te entregará una URL pública gratuita HTTPS del tipo:
   `https://gunrun2d.onrender.com`

---

### Opción 2: Despliegue Nativo en Render (Python Web Service)
Si prefieres desplegar sin Docker:
1. En Render, selecciona **New +** -> **Web Service** -> Tu repositorio.
2. **Runtime:** `Python 3`
3. **Build Command:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Start Command:**
   ```bash
   python backend/run.py --prod
   ```
   *(O usando Gunicorn):*
   ```bash
   gunicorn -w 4 -b 0.0.0.0:$PORT "backend.app:create_app()"
   ```
5. En **Environment Variables**, añade `DATABASE_URL`, `SECRET_KEY` y `FLASK_ENV=production`.
6. ¡Listo! Render desplegará tu juego y podrás compartir el enlace con cualquier persona para que juegue desde cualquier dispositivo.
