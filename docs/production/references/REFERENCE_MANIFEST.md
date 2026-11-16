# Reference Manifest — Cripta del Tusi

**Estado (17-11-2026, Claude):** Fase 1 completada contra el checkout vigente del juego (commit `db43077`). Referencias raster todavía no generadas. **No aprobar para modelado final.**

**Reglas fijadas por Lucho (17-11-2026):** PS1 estilizado ~4–5 cabezas; **caras ocultas** en todos los héroes; héroes de ~1,16 u de alto.

**Bloqueos actuales para la Fase 2:**
1. ~~Conflicto de dirección~~ **Resuelto por Lucho (17-11-2026): «PS1 estilizado, ~4–5 cabezas»**: cuerpo más adulto pero algo cabezón y legible desde arriba, low-poly facetado con texturas pixeladas. Sustituye a las 2,5–3 cabezas chibi de `STYLE_GUIDE.md`, `HERO_ARCHETYPES.md`, `PRODUCTION_BIBLE.md` y `CLAUDE_HANDOFF.md` (pendiente actualizar esos documentos).
2. ~~Generador de imágenes~~ Resuelto: Claude produce las láminas renderizando el propio modelo 3D (mismo modelo en todas las vistas). Lucho dio el visto bueno al método el 17-11-2026 con el Guardián como primera prueba.

Correcciones de roster, escala medida, botín, eventos y VFX en la sección «Auditoría Fase 1» de `ASSET_REFERENCE_INVENTORY.md`.

## Procedencia y destino

- Ruta pedida en el brief: `C:\Users\Lucho\Documents\Codex\2026-11-16\n\docs\production\references`.
- Esta sesión solo permite escritura en el workspace `C:\Users\Lucho\Documents\ChatGPT\imagenes` y en una carpeta técnica de visualizaciones. Por ello, los entregables actuales están en `CRIPTA_DEL_TUSI_REFERENCIAS\docs\production\references` bajo el workspace, no en el checkout externo.
- No se han copiado ni modificado archivos del checkout de documentación.
- El generador de imágenes integrado no está disponible en las herramientas de esta sesión. No se ejecutó el flujo CLI/API alternativo.

## Resumen de cobertura

| Grupo | Cantidad prevista | Estado | Observaciones |
|---|---:|---|---|
| Biblia de estilo | 3 | Pendiente | No existen PNG aprobados en la carpeta de referencias fuente |
| Héroes | 5 | Pendiente | Ninja `sombra` según código; README público tiene el nombre antiguo Acechante |
| Bestiario | 19 entradas | Pendiente | 12 IDs normales/familias y 7 jefes; el murciélago es del Acto II (y lo invoca la Reina Vampira), no del Acto I |
| Kits de entorno | 3 actos | Pendiente | Escala medida: 1 casilla = 1 unidad Three.js (ver inventario) |
| Familias de equipo | 9 slots (27 bases) + 9 runas + 4 rarezas | Pendiente | Bases confirmadas; el equipo solo existe como icono de UI, no sobre el héroe 3D |
| Props/eventos | Obstáculos, agua/lava, trampas, antorchas | Pendiente | Eventos y tienda son tarjetas 2D de UI: no necesitan modelo 3D |
| Hechizos/VFX | 40 habilidades + VFX de jefe | Pendiente | 8 habilidades × 5 clases; falta matriz completa por forma/elemento |
| Animaciones | 11 estados (reposo, andar, ataque, disparo, hechizo, apoyo, desplazamiento, empuje/atracción, golpe recibido, muerte, poderes de jefe) | Pendiente | Añadido el 17-11-2026. Hoy solo existen reposo, andar y golpe genérico; faltan golpe recibido y muerte. Ver inventario |

## Assets

La lista completa, vistas, observaciones y huecos de auditoría está en [ASSET_REFERENCE_INVENTORY.md](../../ASSET_REFERENCE_INVENTORY.md).

| Asset | Categoría | Archivo | Vistas previstas | Estado | Observaciones |
|---|---|---|---|---|---|
| Style guide / lineup / materiales | Dirección visual | `00_style_guide.png`, `01_class_lineup.png`, `02_palette_materials.png` | Paneles de muestras y escala común | Pendiente | Proporciones chibi y materiales PBR simplificados de la biblia local |
| Guardián | Personaje | `hero_guardian.png`, `hero_guardian_ingame.png`, `hero_guardian.md` | T-pose frontal, lateral, trasera, 3/4, cenital, isométrico, escala | **Propuesta v2** (17-11-2026) | Render del modelo PS1 `ps1Hero('guardia')`; 1 036 tris, 7 draw calls, 1 material. Correcciones aplicadas: sin cara, maza, más bajo. Pendiente de revisión |
| Arquero | Personaje | `hero_archer.png`, `hero_archer.md` | Igual que el Guardián | **Propuesta** (17-11-2026) | 864 tris, 6 draw calls, 1 material |
| Clérigo | Personaje | `hero_cleric.png`, `hero_cleric.md` | Igual que el Guardián | **Propuesta** (17-11-2026) | 884 tris, 6 draw calls, 1 material |
| Mago | Personaje | `hero_mage.png`, `hero_mage.md` | Igual que el Guardián | **Propuesta** (17-11-2026) | 680 tris, 7 draw calls, 2 materiales (cristal emisivo) |
| Ninja | Personaje | `hero_ninja.png`, `hero_ninja.md` | Igual que el Guardián | **Propuesta** (17-11-2026) | 852 tris, 7 draw calls, 1 material |
| Lineup de clases | Dirección visual | `01_class_lineup.png` | Frontal a escala común + isométrico con colores de jugador | **Propuesta** (17-11-2026) | Las cinco clases juntas; sustituye a STY-02 |
| Esqueleto | Bestiario · Acto I | `monster_skeleton.png`, `monster_skeleton.md` | F/L/T, 3/4, cenital, isométrico, escala | **Propuesta** (17-11-2026) | 724 tris, 7 draw calls |
| Limo | Bestiario · Acto I | `monster_slime.png`, `monster_slime.md` | F/L/T, 3/4, cenital, isométrico, escala | **Propuesta** (17-11-2026) | 148 tris, 2 draw calls |
| Limo colosal | Bestiario · Acto I–II | `monster_colossal_slime.png`, `monster_colossal_slime.md` | F/L/T, 3/4, cenital, isométrico, escala | **Propuesta** (17-11-2026) | 232 tris, 2 draw calls |
| Calavera flotante | Bestiario · Acto I | `monster_floating_skull.png`, `monster_floating_skull.md` | F/L/T, 3/4, cenital, isométrico, escala | **Propuesta** (17-11-2026) | 284 tris, 5 draw calls |
| Gusano de cripta | Bestiario · Acto I | `monster_crypt_worm.png`, `monster_crypt_worm.md` | F/L/T, 3/4, cenital, isométrico, escala | **Propuesta** (17-11-2026) | 348 tris, 6 draw calls |
| Rey Osario | Bestiario · Acto I (jefe a mitad) | `boss_ossuary_king.png`, `boss_ossuary_king.md` | F/L/T, 3/4, cenital, isométrico, escala | **Propuesta** (17-11-2026) | 1028 tris, 7 draw calls |
| Rey del Umbral | Bestiario · Acto I (jefe final) | `boss_threshold_king.png`, `boss_threshold_king.md` | F/L/T, 3/4, cenital, isométrico, escala | **Propuesta** (17-11-2026) | 1084 tris, 8 draw calls |
| Monstruos y jefes de los Actos II y III | Bestiario | Ver inventario | Igual | Pendiente | Siguiente tanda |
| Mazmorra, Jungla, Infierno | Entorno | `act_crypt.png`, `act_jungle.png`, `act_hell.png` | Room top-down/isométrico + kit modular/footprints | Pendiente | No fijar metros ni tile sin medida de código |
| Slots, runas, rarezas | Equipo | `equipment/`, `props/rune_token.png` | Frente/lado/arriba/3-4, punto de agarre | Pendiente | Confirmar bases en el código de loot antes de crear ítems individuales |
| Props, eventos y VFX | Gameplay | `props/`, `vfx/` | Vista aislada y overlay táctico | Pendiente | Mapear con reglas de colisión, LOS, alcance y áreas reales |

## Pendientes bloqueantes antes de láminas aprobadas

1. Habilitar una herramienta integrada de generación de imágenes en la sesión o autorizar explícitamente una alternativa compatible con API/CLI.
2. Dar acceso de escritura a la ruta fuente `C:\Users\Lucho\Documents\Codex\2026-11-16\n\docs\production\references` o aceptar que el catálogo permanezca en la carpeta de workspace actual.
3. Confirmar qué snapshot de roster es canónico: el repo público en `main` implementa Ninja (`sombra`), mientras su README visible lo llama Acechante. La documentación local prioriza Ninja.
4. Leer/capturar el repo de juego a un checkout legible para verificar escala, grid, loot, obstáculo y VFX exhaustivos antes de finalizar fichas detalladas.
5. Incorporar las imágenes aprobadas al repo y rellenar procedencia/licencia/vistas faltantes antes de marcar `APROBADO`.

## Control de calidad actual

- Documentación local de producción revisada, incluidos checklist, biblia, roster, entorno, presupuesto, integración, brief, política de referencias, guía visual y quality gates.
- README, `engine.js` y `models3d.js` públicos consultados para roster/IDs, skills, jefes/fauna y fábricas.
- Ninguna imagen creada ni afirmada como existente.
- Ninguna referencia está aprobada para modelado final.
- Ruta externa de destino sin escritura; archivos del checkout fuente sin cambios.
