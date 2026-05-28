# Chordy

**De músicos, para músicos.** Chordy es una aplicación web progresiva (PWA) pensada para quienes ensayan, tocan en vivo o estudian en casa: un lugar simple donde guardar tus canciones con letra y acordes, y armar tu propio catálogo de digitaciones.

No importa si estás online o offline: tus datos quedan en el dispositivo y la app sigue funcionando cuando se corta la conexión.

---

## ¿Qué podés hacer?

### Biblioteca de canciones
- Crear canciones con título, artista, álbum y letra completa.
- Colocar acordes sobre cada línea del verso.
- Ver, editar o eliminar cualquier canción desde la lista.
- **Con internet:** buscar metadatos en Spotify para autocompletar título, artista y portada.
- **Sin internet:** cargar todo a mano; la canción se guarda igual y queda disponible para cuando vuelvas a tener señal.

### Catálogo de acordes
- Consultar acordes con diagrama de guitarra.
- Crear acordes nuevos con el editor visual (cuerdas, trastes, cejilla).
- Editar o eliminar los que agregaste vos.
- Buscar por nombre en el listado.

### PWA instalable
- Instalala en el celular o la compu como una app nativa (botón **Instalar** en el header, cuando el navegador lo permita).
- Navegación entre **Canciones** y **Acordes** con barra inferior y acceso rápido con el botón **+**.
- Tema claro/oscuro y indicador de conexión en el header.

---

## Cómo correr el proyecto

Requisitos: [Node.js](https://nodejs.org/) instalado.

```bash
npm install
npm run build:css   # compila SCSS → css/app.css
npm start           # servidor en http://localhost:3000
```

Abrí [http://localhost:3000/songs.html](http://localhost:3000/songs.html).

### Deploy en Vercel

Chordy es un sitio estático (HTML/CSS/JS) + una función serverless para Spotify. **No uses `npm start` en Vercel** (ese comando es solo para desarrollo local con `server.js`).

1. Conectá el repo en Vercel.
2. **Framework Preset:** Other  
   **Build Command:** `npm run build:css`  
   **Output Directory:** dejalo vacío (raíz del repo).
3. En **Settings → Environment Variables** agregá:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
4. Redeploy.

La ruta `/api/spotify/search` la atiende `api/spotify/search.js`. El archivo `vercel.json` redirige `/` → `songs.html`.

Para desarrollo con recarga de estilos:

```bash
npm run watch:css
```

### Spotify (opcional)
La búsqueda de canciones online usa la API de Spotify. Copiá `.env.example` a `.env` y completá tus credenciales. Sin ellas, la app funciona igual en modo manual y offline.

---

## Stack y persistencia

| Capa | Tecnología |
|------|------------|
| UI | HTML, SCSS/CSS, Bootstrap Icons |
| Lógica | JavaScript (vanilla) |
| Datos | **IndexedDB** (canciones, acordes, artistas) |
| Preferencias | **localStorage** (tema, flags de migración e instalación) |
| Offline | **Service Worker** + `manifest.webmanifest` |

---

## Estructura principal

```
acordy/
├── songs.html          # Biblioteca de canciones
├── chords.html         # Catálogo de acordes
├── manifest.webmanifest
├── sw.js               # Service Worker
├── js/
│   ├── data/data.js    # IndexedDB y CRUD
│   ├── songs.js        # Canciones, modales, Spotify
│   ├── chords.js       # Acordes, diagramas, editor
│   └── pwa.js          # Registro SW e instalación
├── scss/main.scss      # Estilos fuente
└── server.js           # Servidor estático + proxy Spotify
```

---

## Contexto académico

Este proyecto fue desarrollado en el marco de **Aplicaciones Web Progresivas (AWP)** — Diseño y Programación Web, UNLP. La consigna del parcial plantea una app de tareas; Chordy la adapta al dominio musical manteniendo los requisitos técnicos: PWA instalable, Service Worker, manifiesto, `localStorage`, IndexedDB e interfaz responsiva con CRUD completo.

Más detalle en [`contexto-consigna.md`](contexto-consigna.md).

---

*Chordy — tu letra, tus acordes, aunque no haya WiFi.*
