# Inventario de referencias visuales — Cripta del Tusi

Estado de auditoría: 17-11-2026. Alcance: documentación local completa de producción + README y código públicos consultables. El checkout situado en `C:\Users\Lucho\Documents\Codex\2026-11-16\n` es una plantilla/visor de assets; no incluye el código de juego. Código contrastado en `https://github.com/luchontandil/cripta-del-tusi`.

## Canon y discrepancias que afectan a producción

- Cinco clases verificadas en `engine.js`: Guardián (`guardia`), Arquero (`tirador`), Clérigo (`mistico`), Mago (`mago`) y Ninja (`sombra`). El README público todavía presenta Acechante; prevalecen el nombre y el diseño de clase que implementa `engine.js`/`models3d.js` y que fija la biblia local: Ninja.
- Hay tres actos y ocho pisos por acto, no solo tres ambientes abstractos. Los jefes disponibles son Rey Osario, Rey del Umbral, Cancerbero, Madre Espora, Oráculo de Ceniza, Reina Vampira y Demonio de Fuego. Oráculo y Reina Vampira pueden ocupar el jefe intermedio del acto III.
- Enemigos normales: limo, murciélago, calavera flotante, gusano de cripta, limo colosal, esqueleto, súcubo, vampiro, diablillo, babosa, planta escupidora y limo de lava. Algunas familias comparten factory/modelo (slime/slimeking/lavaslime; plant/sporemother), pero requieren fichas de variación de escala/material/silueta de jefe.
- La guía local indica nueve ranuras de botín: arma, casco, armadura, guantes, cinturón, botas, anillo, amuleto y talismán/charm. El código publicable debe consultarse de nuevo para los identificadores concretos y bases actuales antes de diseñar modelos por ítem.
- La escala métrica y dimensiones de celda permanecen sin fijar. El repositorio público no está clonado en el workspace y la plantilla local no incluye `isometric.js`; medirlas en el checkout real antes de indicar medidas.
- Las vistas de referencia aprobadas no están en `docs/production/references/`; existe solo un README. Las referencias textuales permiten una propuesta visual, pero no una lámina fiel/aprobada.

## Referencias prioritarias

### Biblia visual y validación de estilo

| ID | Archivo previsto | Vistas/alcance | Estado |
|---|---|---|---|
| STY-01 | `00_style_guide.png` | Proporciones chibi, volumen, rostro, simplificación, materiales y luz; sin copiar IP | Pendiente |
| STY-02 | `01_class_lineup.png` | Cinco clases, misma escala, siluetas y paletas | Pendiente |
| STY-03 | `02_palette_materials.png` | Piel, tela, cuero, metal, piedra, jungla, lava y magia | Pendiente |
| STY-04 | `act_crypt.png`, `act_jungle.png`, `act_hell.png` | Muestras de lenguaje visual ambiental por acto | Pendiente |

### Héroes — una hoja independiente por clase

Todas: frontal/lateral/trasera ortográficas en T-pose clara, 3/4 y top-down de juego del mismo diseño; rostro, manos/pies, prendas, sockets, arma separable, materiales y paleta. T-pose sin armas ocultando articulaciones. La pose de juego va en panel distinto.

| Asset | ID | Anclas reales para el diseño | Archivo previsto | Estado |
|---|---|---|---|---|
| Guardián | `guardia` | Tanque, tajo, control, escudo, empuje/atracción; teal apagado y latón | `hero_guardian.png` | Pendiente |
| Arquero | `tirador` | Distancia/movilidad; arco, flechas; verde y ocre | `hero_archer.png` | Pendiente |
| Clérigo | `mistico` | Cura, limpieza, escudo, celeridad; violeta/oro claro | `hero_cleric.png` | Pendiente |
| Mago | `mago` | Fuego, hielo, arcano, áreas y teletransporte; azul/cian | `hero_mage.png` | Pendiente |
| Ninja | `sombra` | Shuriken, veneno/sombra, dash, sustitución; violeta/coral | `hero_ninja.png` | Pendiente |

### Enemigos y jefes

Formato de cada hoja: frontal/lateral/trasera, 3/4/top-down, escala relativa al héroe y casilla (cuando se pueda medir), articulaciones y silueta de combate. Para los jefes añadir vista abierta de extremidades/arma y pose característica derivada de la mecánica del motor.

| Acto | Asset | ID de código | Archivo previsto | Estado |
|---|---|---|---|---|
| I Mazmorra | Limo | `slime` | `monster_slime.png` | Pendiente |
| I Mazmorra | Murciélago | `bat` | `monster_bat.png` | Pendiente |
| I Mazmorra | Calavera flotante | `skull` | `monster_floating_skull.png` | Pendiente |
| I Mazmorra | Gusano de cripta | `worm` | `monster_crypt_worm.png` | Pendiente |
| I Mazmorra | Esqueleto | `skeleton` | `monster_skeleton.png` | Pendiente |
| I Mazmorra | Limo colosal (élite) | `slimeking` | `monster_colossal_slime.png` | Pendiente |
| I Mazmorra | Rey Osario | `skeletonking` | `boss_ossuary_king.png` | Pendiente |
| I Mazmorra | Rey del Umbral | `umbralking` | `boss_threshold_king.png` | Pendiente |
| II Jungla | Babosa | `slug` | `monster_slug.png` | Pendiente |
| II Jungla | Murciélago | `bat` (familia compartida) | `monster_bat.png` | Pendiente |
| II Jungla | Planta escupidora | `plant` | `monster_spitter_plant.png` | Pendiente |
| II Jungla | Cancerbero | `cerberus` | `boss_cerberus.png` | Pendiente |
| II Jungla | Madre Espora | `sporemother` | `boss_spore_mother.png` | Pendiente |
| III Infierno | Limo de lava | `lavaslime` | `monster_lava_slime.png` | Pendiente |
| III Infierno | Diablillo | `imp` | `monster_imp.png` | Pendiente |
| III Infierno | Vampiro | `vampire` | `monster_vampire.png` | Pendiente |
| III Infierno | Súcubo | `succubus` | `monster_succubus.png` | Pendiente |
| III Infierno | Oráculo de Ceniza | `oracle` | `boss_ash_oracle.png` | Pendiente |
| III Infierno | Reina Vampira | `vampqueen` | `boss_vampire_queen.png` | Pendiente |
| III Infierno | Demonio de Fuego | `firedemon` | `boss_fire_demon.png` | Pendiente |

El murciélago aparece en actos I/II y comparte ID/modelo: una ficha canónica con notas de contexto/variación puede cubrirlo sin duplicar la imagen.

### Equipo, botín y props

| Grupo | Cobertura | Archivos previstos | Estado |
|---|---|---|---|
| Slots de equipo (9 familias) | Arma, casco, armadura, guantes, cinturón, botas, anillo, amuleto, talismán/charm. Una hoja por familia cuando se conocen bases reales; orthos + socket/pivote + vista en héroe | `equipment/slot_<id>.png` | Pendiente: auditar bases/loot del `engine.js` completo |
| Variaciones de rareza | Normal, poco común, raro, legendario. Mismo modelo con pocos acentos parametrizables, sin color UI pintado en toda la malla | `equipment/rarity_materials.png` | Pendiente |
| Runas | Token legible a tamaño de inventario y ejemplos de engaste/extracción | `props/rune_token.png` | Pendiente |
| Sala/combate | Charca/agua, pinchos, gas, muros, pilares, escombros, raíces/árboles/helechos, plantas, rocas/obstáculos, agujas/islotes/canales de lava | `props/` por ID de obstáculo | Pendiente: contrastar todas las factories/variantes |
| Eventos | Fuente, altar de sangre, cofre encadenado, campamento, buhonero, biblioteca; la existencia está en README, escala/modelo requiere revisar UI/código | `props/event_<id>.png` | Pendiente |

### Entornos modulares y VFX

| Asset | Ficha requerida | Estado |
|---|---|---|
| Kit Mazmorra/cripta | Suelo, borde/void, charca, trampa, muro/cobertura, pilar, escombro, ruina; room top-down y ortho/isométrica | Pendiente |
| Kit Jungla/ciénaga | Suelo, charca, raíz, árbol, helecho, ruina, planta hostil, muro/cobertura; mantener corredores tácticos | Pendiente |
| Kit Infierno | Costra de roca, canal/borde de lava, islote/puente, aguja de obsidiana, obstáculo de roca | Pendiente |
| Rooms tácticas | Formas reales del generador (rectangular, L, T, C, cruz y demás variantes), obstáculos y línea de visión; no imponer celda de 2 m | Pendiente: obtener forma exacta de `engine.js`/`isometric.js` local actual |
| VFX de clase | Cada habilidad de `classes` (8 habilidades por clase) agrupable por efecto común, con preview/impacto y huella de grid exacta: cruz, círculo, cono, línea, empuje/atracción, escudo, cura, cleanse, haste, dash/teleport/swap, fuego/hielo/arcano/sombra/veneno | Pendiente: hoja matriz tras leer todas las habilidades/código de VFX |
| VFX de jefe/entorno | Brasas, veneno, cadenas/lentitud, esporas/lianas, nova/suelo en llamas, invocación de esqueletos/murciélagos | Pendiente |

## Conteo de producción a planificar

- 3 hojas de guía de estilo + 5 héroes + 19 entradas del bestiario (12 normales/familias y 7 jefes; el murciélago se comparte) + 3 kits de acto + 9 familias de slots + runa/rarezas + props/eventos + hojas de VFX. El total exacto de hojas de props/VFX depende de inventariar factories y habilidades del commit vigente.
- No duplicar referencias de murciélago; evitar una única lámina que sustituya hojas independientes de assets.
- Para lectura de T-pose: hombros, codos, muñecas, caderas, rodillas y tobillos despejados; frontal/lateral/trasera coincidentes.

## Fuentes verificadas

- README público actual: `https://github.com/luchontandil/cripta-del-tusi/blob/main/README.md`
- `engine.js`: clases/habilidades, actos/fauna/jefes y mecánicas: `https://github.com/luchontandil/cripta-del-tusi/blob/main/engine.js`
- `models3d.js`: colores, factories de héroes/criaturas/obstáculos: `https://github.com/luchontandil/cripta-del-tusi/blob/main/models3d.js`
- Especificaciones locales: `docs/production/*.md`, `docs/art/STYLE_GUIDE.md`, `docs/REFERENCE_POLICY.md`, `docs/QUALITY_GATE.md`, `docs/VISUAL_QA.md`, `docs/AGENT_GUIDE.md`.

Este inventario está contrastado con el código público consultable, pero no reemplaza revisar el checkout/commit que finalmente se usará. Donde lo local y lo público divergen, se conserva explícitamente la incertidumbre.

---

## Auditoría Fase 1 — Claude, 17-11-2026 (contra el código vigente)

**Snapshot de autoridad:** checkout del juego `luchontandil/cripta-del-tusi`, commit local `db43077` = `origin/main` (`44944ad`) + 3 commits locales sin publicar (cartas de nivel, árbol con ramas, prueba de héroes chibi procedurales). Ninguno de esos commits cambia el roster, los IDs ni la escala. Este checkout sustituye a la consulta del repo público en GitHub.

### Correcciones al inventario

| Tema | Inventario previo | Código vigente (`engine.js`) |
|---|---|---|
| Murciélago | Acto I y II | **No está en la fauna del Acto I.** Acto II (cuerpo a cuerpo) y Acto III como invocación de la Reina Vampira. |
| Fauna Acto I | limo, murciélago, calavera, gusano, esqueleto, limo colosal | esqueleto, limo (cuerpo a cuerpo); calavera flotante (distancia); gusano (élite); limo colosal (refuerzo de élite); esqueletos invocados por el Rey Osario. |
| Fauna Acto II | babosa, murciélago, planta | babosa, murciélago (cuerpo a cuerpo); planta escupidora (distancia); **limo colosal (élite)**; babosa (refuerzo); plantas invocadas por la Madre Espora. |
| Fauna Acto III | limo de lava, diablillo, vampiro, súcubo | igual; élite = limo de lava; refuerzo = vampiro; murciélagos invocados por la Reina Vampira. |
| Nombre Ninja | dudoso por el README | `engine.js` y `models3d.js`: **Ninja** (`sombra`). El párrafo inicial del README del juego está desactualizado (Acechante, “seis pisos”, “cinco diseños”): es un error de documentación del repo, no del roster. |
| Equipo en héroes | modelos por slot | **El equipo no se dibuja sobre el héroe 3D**; solo aparece como icono en la interfaz (`art.js → equipmentIcon`). Las láminas de equipo son de iconos de UI salvo que se amplíe el alcance. |
| Eventos y tienda | props 3D de evento | Los 6 eventos (fuente, altar de sangre, cofre encadenado, campamento, buhonero, biblioteca) y la tienda son **tarjetas 2D de interfaz**, sin modelo 3D. No hay props de evento en el tablero. |

### Escala y tablero medidos (`isometric.js`, `models3d.js`)

- **1 casilla = 1 unidad de Three.js.** Losa de suelo 0,963 × 0,114 × 0,963. Borde exterior: pared de 0,40 de alto.
- Cámara de juego: ortográfica en (17; 17,5; 18) mirando a (0; 0,25; 0) → isométrico a ~45° de azimut y ~35° de elevación. La vista “cenital” del juego es el **tablero 2D** (CSS), no una cámara 3D cenital.
- Héroe actual: ~1,27 unidades de alto (sin sombrero); la etiqueta de nombre se ancla a `head` (altura de la cabeza).
- Obstáculo: ocupa 1 casilla y bloquea paso y línea de visión; alto 1,1–1,6. Variantes por acto: Mazmorra/Infierno = columna, bloque con gema, roca; Jungla = árbol, helechos, roca con musgo; Infierno variante 3 = aguja de obsidiana.
- Agua / ciénaga / lava: bloquea paso, **no** visión. Trampas: pinchos y gas. 3 antorchas decorativas por sala sobre el borde. Glifos de jefe: cruz de 5 casillas.
- Tamaño de sala: ancho = mín(16; 10 + 2 × jugadores), alto = 7 + jugadores, con ±1–2 de variación. Contornos: rectángulo (piso 1), L, T, C, cruz, H, U, anillo, rombo e irregular. Obstáculos solo entre las columnas 4 y ancho−5 (las de salida quedan libres). Estilos: pilares, muros, salas partidas, escombros, ruinas, columnata.

### Botín real

9 slots con 27 bases: arma (Arco de tejo, Sable de cobre, Cetro de ónice, Lanza de vigía); casco (Yelmo del centinela, Capucha del eco, Corona de hollín); armadura (Coraza de escamas, Manto de ceniza, Jubón reforzado); guantes (Guantes de bruma, Guanteletes del vigía, Mitones de púas); cinturón (Cinturón del peregrino, Faja de cuero rojo, Cinto de eslabones); botas (Botas del umbral, Grebas de bronce, Botas de arena); anillo (Anillo de obsidiana, Sello de cobre, Sortija de sal); amuleto (Amuleto de luna, Colgante de ámbar, Lágrima del alba); talismán (Ojo de la cripta, Diente de vigía, Llave de los ecos). 9 runas (Brasa, Escarcha, Acero, Éter, Umbría, Brújula, Muralla, Centella, Pulso). Rarezas: Normal, Poco común, Raro, Legendario.

### VFX del renderer

Señales que emite el motor: `slash`, `arrow`, `arcane`, `blast`, `venom`, `slow`, `dash`, `heal`, `cleanse` (+ escudo/celeridad como `heal` sin cantidad). Áreas exactas de `spellArea`: cruz, círculo, cono, línea. 40 habilidades (8 por clase); jefes: nova de fuego, invocaciones, cadena que arrastra, aullido, embestida.

### Conflicto de dirección abierto

El 17-11, en el chat, Lucho pidió que los héroes no parezcan “muñecos de belén” y que tengan **proporciones más de juego de PS1**. Esto contradice las 2,5–3 cabezas chibi de toda la documentación. **Hay que resolverlo antes de la Fase 2.** La prueba procedural chibi (`db43077`) queda descartada como dirección.

### Generación de imágenes

En esta sesión, Claude **no tiene generador de imágenes integrado** y no usará API/CLI con claves. Lo que sí puede producir: láminas técnicas dibujadas por código (ortográficas frontal/lateral/trasera, T-pose, cenital, siluetas, paleta y escala medida sobre la casilla real), marcadas como `Propuesta (dibujo técnico)`. No son concept art pintado ni se marcarán como aprobadas sin revisión de Lucho.

### Conteo para la Fase 2

3 hojas de estilo · 5 héroes · 19 entradas de bestiario (12 normales/familias + 7 jefes) · 3 kits de acto + salas de prueba · 1 matriz de VFX · (opcional) 9 familias de iconos de equipo + runas/rarezas. Sin props de evento 3D.

## Animaciones (añadido 17-11-2026 a petición de Lucho)

Estado en el código: el renderer (`isometric.js`) solo tiene **reposo**, **andar** y un **golpe genérico** (balanceo del brazo derecho en cualquier acción). **No hay** reacción al recibir daño ni muerte (la figura desaparece al llegar a 0 PV), ni animaciones distintas por habilidad.

Las animaciones se hacen por código (`animate` de cada modelo, sin huesos), con poses clave legibles en isométrico. Cada una necesita una lámina de **poses clave** (inicio, contacto, final) como referencia.

| Estado | Quién | Disparador en el motor | Estado |
|---|---|---|---|
| Reposo (respirar, mirar) | Héroes y monstruos | siempre | Hecho (básico) |
| Andar | Héroes y monstruos con patas | evento `move` | Hecho (básico) |
| Ataque cuerpo a cuerpo | Guardián, Ninja, monstruos melee | `spell` con `slash` | **Hecho**: anticipación hacia atrás, golpe con giro del torso y paso adelante |
| Disparo | Arquero | `arrow` (y cualquier habilidad del Arquero) | **Hecho**: alzar el arco, tensar y soltar |
| Lanzar hechizo | Mago, Clérigo, monstruos a distancia, jefes | `arcane`, `blast`, `slow`, `venom` | **Hecho**: alzar el báculo, descargar y elevarse; criaturas sin brazos se estiran |
| Apoyo | Clérigo y quien cure | `heal`, `cleanse` | **Hecho**: báculo al cielo y brazos abiertos |
| Desplazamiento | Mago (teletransporte), Ninja (paso de sombra, sustitución) | `dash`, `swap` | **Básico**: giro completo al salir; pendiente efecto de entrada |
| Empuje / atracción | Guardián (Gancho, empujón), Arquero, Mago, Ninja | `push`, `pull` | **Hecho**: empujón con ambos brazos / lanzar y tirar hacia atrás |
| Recibir golpe | Todos | daño, glifo, veneno, trampa | **Hecho**: retroceso desde el atacante, inclinación y destello rojo (más fuerte si es crítico) |
| Muerte | Todos | PV a 0 | **Hecho**: tras el golpe mortal, los humanoides caen hacia atrás y los limos/criaturas se aplastan; se hunden y se desvanecen en ~1 s |
| Poderes de jefe | 7 jefes | `bossPower` (invocar, nova, embestida, aullido, cadena) | **Básico**: pose de hechizo genérica; pendiente una animación propia por poder |

Implementación: capa de acción en `isometric.js` (grupo intermedio por modelo que se reinicia en cada fotograma) + materiales propios por modelo para destello y desvanecido, sin draw calls extra. Lámina de poses: `references/anim_keyposes.png` (4 fotogramas por acción, reloj congelado).
