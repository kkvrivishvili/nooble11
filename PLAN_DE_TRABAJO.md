# Plan de Trabajo — Nooble.ai

> Documento vivo. Iteraremos este plan por fases, con entregables, criterios de aceptación y dependencias. Todas las tareas están mapeadas a los IDs proporcionados (1–33).

## Objetivos generales
- Consolidar el Design System (tipografías, colores, sombras, bordes, degradados, patrones) y aplicarlo de forma consistente en componentes y vistas.
- Definir navegación clara: menú inferior y lateral de chats con notificaciones.
- Integrar AI para generar títulos/descripciones y metadatos de colecciones/prompts.
- Unificar plataformas: `nooble.ai` (Next.js) y `app.nooble.ai` (Vite).
- Orquestar experiencia de chat (streaming, canales simultáneos, widgets, público y privado).
- Modelo de negocio Free: 100 mensajes/mes, 1 agente, 0 integraciones, Tools: solo RAG.
- Mejorar ingestión: tipos, íconos, previsualización de chunks, tagging.

## Supuestos y alcance
- Headless UI (tarea 7) será base para accesibilidad/UX en componentes interactivos.
- Design tokens (colores, sombras, radios, tipografías) centralizados en `index.css` o equivalente (tareas 8, 11, 12, 13, 20, 32).
- Estrategia de multi-sitio: `nooble.ai` (marketing/docs/landing) en NextJS (tarea 3) y `app.nooble.ai` (producto) en Vite (tarea 4).

---

## Fase 1 — Diseño y Estandarización Visual
Enfocada en base visual consistente y componentes reutilizables.

Entregables
- Design tokens centralizados (colores, sombras, bordes, tipografías) [8, 11, 12, 13, 20, 32].
- Tabs de “Design” con secciones: Primera (overview), Buttons, Fonts, Distribution [14].
- Degradados y paletas con “Build tu degradado” + manejo de colores ausentes [10].
- Patrones tipo wallpaper con variaciones y preview (como degradados) [28, 31].
- Color picker integrado con Wallpaper & Colors [15] y ajuste de texto 95% negro / 5% blanco según contraste [20].
- Íconos más grandes en fondos/estilos de botones [19].
- Eliminar botones de design superiores [21]; botones al nivel del título, junto a notificaciones y settings [22].
- Arreglo de título en design + UX de guardado: botón Save con autosave 30s o instantáneo [29].

Criterios de aceptación
- index.css expone variables CSS para: `--shadow-*`, `--radius-*`, `--color-*`, `--font-*` [8, 11, 12, 13].
- Todas las cards usan sombras/bordes estandarizados [8, 11].
- Tabs “Design” funcionales, contenidos cargan sin errores [14].
- Builder de degradados permite crear/editar y guarda preset [10].
- Previews de patrones/degradados muestran miniaturas consistentes y texto con contraste automático [20, 28, 30].
- Botonera reposicionada, sin botones superiores legacy [21, 22].

Dependencias
- Headless UI para tabs, popovers, dialogs [7].

---

## Fase 2 — Navegación y Estructura de la App
Enfocada en navegación clara y superficies clave.

Entregables
- Menú inferior: Chats, Shop, Profile [2].
- Lateral de chats con toasts de notificación [5].
- Widgets en `public-profile` y en chats [6, 9].
- Renombrar “Team & Agents” a “My Workers” con vista tipo mobile preview y chats para probar [23].
- Estandarizar canales (varios `agent_id` hablando a la vez) [26].
- Notificaciones: logs backend importantes, interacciones front, conversaciones entrantes, pagos/planes/ofertas [27].

Criterios de aceptación
- Menú inferior navegable, estados activos/hover, soporte responsive [2].
- Toasts se disparan en eventos: mensaje entrante, error, acción completada [5, 27].
- Widgets configurables y reutilizables, documentados [6, 9].
- “My Workers” reemplaza secciones previas sin enlaces rotos [23].
- Múltiples canales visibles con distinción clara por `agent_id` [26].

Dependencias
- Design System de Fase 1 aplicado a navegación y widgets.

---

## Fase 3 — Funcionalidad de IA, Chat y Plan Free
Enfocada en capacidades IA, streaming y restricciones comerciales.

Entregables
- Títulos como “collection” y “system prompt” generados por IA durante creación [1, 16].
- Stream Chat Orchestrator + pruebas E2E + soporte en `public-profile` [17].
- Modelo Free: todo gratis, 100 mensajes/mes, 1 agente, 0 integraciones; Tools en Free: solo RAG [18, 24].
- Wallpapers: el degradado/patrón/foto/video reflejan su mini preview con color aplicado [30].

Criterios de aceptación
- Endpoint/acción de creación llama IA y persiste título/descripcion; fallback robusto [1, 16].
- Streaming estable (reintentos, backpressure) y tests de latencia < X ms p95 [17].
- Límite de 100 mensajes con UX clara: contador, warning, bloqueo elegante; enforcement backend [18].
- Config de planes: solo RAG habilitado en Free; otras tools gated [24].
- Previews de wallpapers por tipo (patrón/foto/video/degradado) coherentes [30].

Dependencias
- Infra de notificaciones (Fase 2) para alertas de límites y eventos.

---

## Fase 4 — Ingesta de Conocimientos y Tipos de Archivos
Enfocada en mejorar la ingesta y visibilidad antes de guardar.

Entregables
- Agregar tipos de archivos: páginas web, perfiles de redes sociales incluidos [25].
- Íconos de tipo de ingesta [33].
- Previsualización de chunks antes de guardar + posibilidad de agregar tags [33].
- Eliminar id rígido de colores; usar pickers y añadir botón `+` para sumar color [32].

Criterios de aceptación
- Ingesta soporta URL web y perfiles sociales con extracción básica (meta, texto principal) [25].
- Vista previa de chunks con paginación/scroll; tagging libre/estandarizado [33].
- UI muestra íconos por tipo (PDF, Web, Social, etc.) [33].

Dependencias
- Límites de plan Free respetados (Fase 3).

---

## Infraestructura y Multi-plataforma
- Documentar arquitectura de `nooble.ai` (NextJS) vs `app.nooble.ai` (Vite): carpetas, CI/CD, dominios, envs [3, 4].
- Guía de contribución para componentes compartidos (design tokens) entre ambas apps.

Criterios de aceptación
- README de arquitectura actualizado y enlaces de despliegue.

---

## Métricas de calidad y DX
- Accesibilidad: Lighthouse a11y ≥ 90 en páginas clave.
- Performance: LCP < 2.5s, CLS < 0.1, TBT < 200ms en desktop; p95 render chat < 150ms.
- UX: tasa de error toasts < 1% de sesiones; cumplimiento de contraste AA.
- Tests: unitarios de componentes críticos (tabs, pickers, builder), E2E para chat y límites de plan.

---

## Roadmap sugerido (iterativo)
- Semana 1: Fase 1 (tokens, tabs, builder degradados, previews básicas) + headlessui.
- Semana 2: Fase 2 (menú inferior, lateral chats, widgets, My Workers, notificaciones base).
- Semana 3: Fase 3 (IA en títulos/desc, stream orchestrator, límites Free, previews wallpaper).
- Semana 4: Fase 4 (ingesta ampliada, íconos, preview chunks con tags) + documentación Next/Vite.

---

## Mapeo rápido de tareas → fases
- Fase 1: [8, 11, 12, 13, 14, 10, 15, 19, 20, 21, 22, 28, 29, 31, 32]
- Fase 2: [2, 5, 6, 9, 23, 26, 27]
- Fase 3: [1, 16, 17, 18, 24, 30]
- Fase 4: [25, 33]
- Infra/Docs: [3, 4]

---

## Próximos pasos
1) Validar agrupación y prioridades con el equipo.
2) Acordar criterios de aceptación numéricos (latencia p95, límites exactos, etc.).
3) Crear issues por entregable con checklist y referencias a este plan.
4) Empezar por Fase 1, creando design tokens y componentes base.
