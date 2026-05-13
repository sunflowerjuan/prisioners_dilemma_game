# Prisionero Game
Aplicacion web multijugador inspirada en el Dilema del Prisionero para equipos empresariales. Incluye frontend en React + Tailwind, backend en Node.js + Express, tiempo real con Socket.IO y persistencia local con PGlite.

## Caracteristicas principales

- Salas con codigo unico.
- Panel de administrador para iniciar, cerrar rondas, avanzar, reiniciar y finalizar.
- Equipos con votos colectivos por mayoria.
- Emparejamiento aleatorio 1 vs 1 evitando repeticiones consecutivas cuando es posible.
- Sistema de coins y ranking global.
- Interfaz retro pixel/cyber responsive.
- Reconexión de jugadores con sesion guardada en `localStorage`.
- Persistencia local de salas y resultados en `server/data/pglite`.

## Stack

- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express
- Tiempo real: Socket.IO
- Persistencia: PGlite (compatible con flujo tipo PostgreSQL sin compilacion nativa)

## Estructura

```text
.
├── client
│   ├── src
│   │   ├── App.jsx
│   │   ├── styles.css
│   │   └── lib
│   └── .env.example
├── server
│   ├── src
│   │   ├── config.js
│   │   ├── db.js
│   │   ├── game.js
│   │   └── index.js
│   └── data
├── package.json
└── vercel.json
```

## Ejecucion local

1. Instala dependencias:

```bash
npm install
```

2. Opcional: crea `client/.env` a partir de `client/.env.example`.

3. Inicia frontend y backend juntos:

```bash
npm run dev
```

4. Abre:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run start
```

## Reglas del juego implementadas

- `Cooperar vs Cooperar`: `+8` / `+8`
- `Traicionar vs Cooperar`: `+15` / `-2`
- `Traicionar vs Traicionar`: `+1` / `+1`

Cada miembro del equipo recibe el mismo resultado colectivo.

Si un equipo empata en votos, se mantiene la ultima decision colectiva del equipo; si no existe, se usa `Cooperar`.

## Estado actual

La version incluida ya permite:

- Crear y unirse a salas.
- Seleccionar nombre, avatar y equipo.
- Ver equipos y jugadores conectados en tiempo real.
- Votar una sola vez por ronda.
- Resolver rondas automaticamente por tiempo o manualmente por admin.
- Ver resultados, ranking y resumen final.

## Despliegue

### Frontend en Vercel

Este repositorio ya incluye `vercel.json` para desplegar el cliente Vite.

Antes de desplegar, configura en Vercel:

- `Root Directory`: repositorio raiz
- `Build Command`: `npm run build --workspace client`
- `Output Directory`: `client/dist`
- `VITE_SOCKET_URL`: URL publica del backend Socket.IO

### Backend en tiempo real

Socket.IO con conexiones persistentes no es una buena combinacion para funciones serverless tradicionales de Vercel. Para mantener tiempo real estable, recomiendo desplegar el backend Express en Railway, Render o un VPS, y dejar Vercel para el frontend.

#### Opcion rapida con Render

El repo ahora incluye `render.yaml`, asi que puedes crear el servicio web directamente desde GitHub usando estos valores:

- `Build Command`: `npm install`
- `Start Command`: `npm run start --workspace server`
- `Health Check Path`: `/api/health`

Deploy directo:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/sunflowerjuan/prisioners_dilemma_game)

Si quieres, el siguiente paso puede ser:

1. conectar este proyecto a GitHub,
2. hacer los commits por hitos,
3. subir el frontend a Vercel,
4. desplegar el backend realtime en un servicio Node persistente.
