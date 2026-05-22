# Contexto de la consigna — Parcial Práctico 1 (AWP)

Documento de referencia derivado del PDF **DW3-W0D35-parcial-1.pdf**. No sustituye la consigna oficial; sirve para alinear el desarrollo del repositorio **Chordy** con lo que pide el parcial.

---

## Datos del examen

| Campo | Valor |
|--------|--------|
| Carrera | Diseño y Programación Web (Educación a Distancia) |
| Asignatura | Aplicaciones Web Progresivas (AWP) |
| Examen | Parcial Práctico 1 |
| Año lectivo | 2026 |
| Docente | Potente, Alejandro Lucas |
| Modalidad | Individual (máximo 1 alumno, salvo autorización) |

---

## Objetivo general

Desarrollar una **aplicación web progresiva (PWA)** orientada a **gestionar tareas** (to-do), con:

- **Service Worker** para uso offline y caché (recursos estáticos y dinámicos).
- **Manifiesto web** (JSON) para instalabilidad y experiencia de app.
- **Estrategias de caché** coherentes con una experiencia offline fluida.
- **Almacenamiento local** (`localStorage` e **IndexedDB**).
- **Instalación** desde la UI en dispositivos compatibles.

La evaluación pondera: funcionalidad, implementación correcta de SW/manifiesto/caché, almacenamiento local, instalación, calidad de código e interfaz.

---

## Requisitos detallados (consigna)

### 1. Interfaz de usuario

- HTML y CSS.
- Permitir **agregar**, **eliminar** y **marcar como completadas** las tareas.
- Interfaz **responsiva** y usable en móvil y escritorio.

### 2. Manejo del DOM

- JavaScript para manipular el DOM.
- Actualización dinámica de la UI ante acciones del usuario (alta, baja, completado).

### 3. Service Worker

- Habilitar funcionalidad **offline**.
- Cachear recursos **estáticos y dinámicos** necesarios para operar sin Internet.
- Definir **estrategias de caché** adecuadas.

### 4. Archivo de manifiesto

- JSON con nombre de la app, iconos, colores de tema, URL de inicio, etc.
- Enlazado desde el HTML para **instalación** en pantalla de inicio.

### 5. Almacenamiento local

- Uso obligatorio de **`localStorage`**.
- Uso obligatorio de **`indexedDB`**.

### 6. Instalación

- Control en la interfaz para que el usuario **instale** la PWA (evento `beforeinstallprompt` o equivalente según implementación).

### Entrega

Código fuente completo: HTML, CSS, JavaScript y manifiesto.

---

## Adaptación al proyecto Chordy

La consigna describe una app de **tareas**; en este repositorio el dominio es **gestión de acordes y canciones** para guitarra. Es una adaptación válida del mismo stack PWA siempre que se cumplan los requisitos técnicos y la UI responda a CRUD + estados equivalentes.

| Requisito consigna (tareas) | Equivalente en Chordy |
|----------------------------|------------------------|
| Agregar tarea | Crear acorde / crear canción |
| Eliminar tarea | Eliminar acorde / eliminar canción |
| Marcar completada | No hay “completado” literal; podría mapearse a otro estado o considerarse fuera de dominio — conviene definir con el docente si hace falta un tercer estado o si “gestionar ítems” alcanza |
| UI responsiva | App móvil-first con navegación inferior, modales, búsqueda de acordes |
| DOM dinámico | Listas de acordes y canciones renderizadas y actualizadas desde JS |
| `localStorage` | `chords-storage.js` y `songs-storage.js` persisten acordes y canciones |
| `indexedDB` | **Pendiente** según inspección del repo (solo `localStorage` hoy) |
| Service Worker + caché | **Pendiente** (no hay `sw.js` ni registro en HTML) |
| `manifest.json` | **Pendiente** (hay `theme-color` en HTML, no manifiesto enlazado) |
| Botón instalar PWA | **Pendiente** |

### Estado actual del repo (solo lectura)

**Implementado o en curso (alineado con la consigna “de producto”):**

- Varias páginas HTML: `index.html`, `chords.html`, `songs.html`, `new-chord.html`.
- Estilos: `css/app.css` (compilado desde `scss/main.scss`).
- Módulos JS separados: almacenamiento, listados, modales, FAB, navegación, diagramas de acordes.
- Persistencia en **`localStorage`** para acordes (`chordy_chords`) y canciones (`chordy_songs`).
- UI responsiva con meta viewport, barra inferior, modales de confirmación.
- Manipulación del DOM para listar, buscar, crear y eliminar entidades.

**Faltante respecto al parcial PWA (requisitos explícitos del PDF):**

1. **Service Worker** registrado y estrategias de caché documentadas/implementadas.
2. **`manifest.webmanifest`** (o `manifest.json`) con iconos y `start_url`, referenciado en `<head>`.
3. **IndexedDB** para al menos parte de los datos (no solo `localStorage`).
4. **Flujo de instalación** en la UI (`beforeinstallprompt`, botón “Instalar”, etc.).
5. Verificar que la app funcione **offline** de punta a punta (incluido CDN de Lucide si se cachea o se self-hostea).

---

## Criterios de evaluación (resumen)

1. ¿La app hace lo que promete (gestión de datos + UI)?
2. ¿El Service Worker cachea bien y la app funciona sin red?
3. ¿El manifiesto está completo y enlazado?
4. ¿Las estrategias de caché son apropiadas?
5. ¿Se usan **`localStorage` e IndexedDB**?
6. ¿El usuario puede **instalar** la PWA desde la interfaz?
7. Calidad de código e interfaz.

---

## Entregables esperados para el parcial

- HTML, CSS, JS del proyecto.
- Archivo de **manifiesto**.
- **Service Worker** (y, en la práctica, decisión de qué entra en precache vs runtime cache).
- Evidencia de almacenamiento en **localStorage** e **IndexedDB**.
- UI con acción de **instalación**.

---

## Notas para el desarrollo en este repo

- **Chordy** ya cubre buena parte del bloque “app web clásica” (UI, DOM, `localStorage`); el trabajo pendiente del parcial está concentrado en la capa **PWA**.
- Conviene no mezclar la consigna genérica (“tareas”) con el dominio real sin dejar claro en la entrega o documentación que el alcance funcional es **acordes/canciones** pero los requisitos AWP son los del PDF.
- Recursos externos (`unpkg.com/lucide`) impactan el SW: hay que cachearlos o vendorizarlos para cumplir offline de forma creíble.

---

*Generado a partir del análisis del PDF de consigna y del estado del repositorio Chordy. No modifica código del proyecto.*
