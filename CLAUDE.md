# CLAUDE.md — Guía para trabajar en «Cripta del tusi»

Este archivo es la referencia viva del proyecto. Léelo entero antes de tocar nada. Si algo de aquí choca con
`README.md` o con los documentos antiguos de `docs/` (AGENT_GUIDE, ASSET_BRIEF, production/, art/STYLE_GUIDE…),
**manda este archivo**: aquellos son de una etapa anterior (estética chibi, Guardián, 6 pisos, jefes con glifos).

Idioma: todo en español (código comentado, textos del juego, commits, respuestas al usuario).

---

## 1. Despliegue (automático, sin preguntar)

- Repo `luchontandil/cripta-del-tusi`, rama `main`.
- **GitHub Pages** publica la web con cada push (~1 min): https://luchontandil.github.io/cripta-del-tusi/
- **Render** (https://cripta-del-tusi.onrender.com) redespliega el servidor con cada push; su build ejecuta
  `npm test`. Un test roto = deploy fallido + correo «build failed» al usuario. Tarda 5–10 min; mientras, el pie
  de página muestra «servidor en vN-1», es normal.
- Datos (cuentas, cartas, mapas): Upstash. El token lo gestiona el usuario: **nunca** lo pidas ni lo escribas.

Ciclo de cada cambio:
1. Cambia el código.
2. Sube la versión de caché (todos los imports llevan `?v=N`):
   `grep -rl "v=N" *.js *.html | grep -v "^three\." | xargs sed -i 's/v=N/v=N+1/g'`
3. Commit y push **solo si `npm test` pasa**:
   ```
   npm test >/tmp/t.log 2>&1 && git add -A && git -c user.name="luchontandil" \
     -c user.email="luchontandil@users.noreply.github.com" commit -q -m "<UNA línea corta>" \
     -m "<atribución>" && git push -q origin main
   ```
   Mensajes de commit: **una sola línea, corta y en español** (los largos le llegan al usuario por Render).
   No encadenes el commit tras un `grep` (siempre «acierta»): encadénalo tras `npm test`.
4. Responde al usuario en pocas líneas: qué cambió y en qué versión quedó.

Excepción: en trabajo visual grande (modelos, gráficos, estética) el usuario a veces dice «aún no subas»: enseña
capturas y espera su visto bueno.

## 2. Preferencias del usuario (usuario «passa»)

- Directo y práctico. Le gusta ver capturas de las cartas/efectos antes de probar.
- Prueba todo en el **Laboratorio** (editor de mapas → Probar). Admins: `passa` y `maurisho` (accounts.js).
- Colores: PA azul/celeste, PM **verde**. Fuentes sin serifa. Moneda «tusi».
- Cartas de habilidad: sin palabras de relleno; rangos «X-Y» con guion; «Usos por turno» muestra solo el máximo;
  la descripción (lore) dice **qué hace el hechizo**, sin números ni frases poéticas.
- Seguridad: los logins y secretos los pone él; crear cuentas de hosting o poner tarjetas, también.

## 3. Arquitectura

| Archivo | Qué contiene |
|---|---|
| `engine.js` | Lógica autoritativa, compartida por servidor y modo solitario: clases y habilidades, combate, IA, jefes, mapas, botín, actos. Exporta `_test={move,beginTurn}` y `hit` para los tests. |
| `client.js` | Interfaz: barra de habilidades, cartas/tooltips (`skillEffectText`, `skillRows`), lore (`skillLore`), estados (`statusBadge`), reproducción de eventos (`impact`, cola con espera de flechas). |
| `isometric.js` | Render Three.js: tablero, tileset, luces, decorado HD, overlays (movimiento, alcance, glifos, trampas), efectos por habilidad (`skillFx`), poses (`spearPose`, `bowPose`), etiquetas e iconos de estado. |
| `models3d.js` | Modelos low-poly hechos con piezas (`miniature`, `ps1Obstacle`), caras de 16×16 dibujadas por código, textura triplanar de obstáculos. |
| `art.js` | Iconos de habilidades dibujados en canvas (`skillArt`, por nombre) y retratos. |
| `mapeditor.js` | Editor de mapas + Laboratorio (solo admins). |
| `server.js` / `accounts.js` / `store.js` | Servidor HTTP/salas, cuentas y cartas, guardado en Upstash. |
| `game.test.js` | Tests (`node:test`). Helpers: `battle(classId)`, `timeout(s)` para avanzar turnos de la IA. |
| `tiles/*.png` | Tileset por bioma y `props.png` (ver §6). |
| `tiles/card_<clase>.jpg` | Ilustraciones de la selección de personaje (las hace el usuario con IA; 3:4; todas con el mismo recorte (36,40)-(828,1096) sobre el original de 864×1152 y escaladas a 480×640, sin cortar pies ni armas). |
| Página de inicio | Fila «Elige tu héroe» a todo el ancho (ilustraciones ampliadas ×1,32 por CSS); debajo cuenta · ficha del héroe (perfil en 5 barras `classProfile`) + «Jugar en solitario» · jugar con amigos. |
| Sala multijugador | `renderLobby`: 4 huecos con ilustración y color del jugador, «Tu héroe» (miniaturas + `heroSheetNodes`), código e invitar amigos; laterales ocultos (`body.in-lobby`). |
| `docs/skills-<clase>.md` | Hoja de habilidades de cada clase con **todas** las decisiones tomadas. Léela antes de tocar esa clase. |

### Habilidades
Tupla: `[nombre, PA, alcance, mín, máx, tipo, símbolo, alcanceMín, {opciones}]`.
- Las 3 primeras de cada clase son las **iniciales**; el resto se compra (precio `250+(i-3)*75`).
- Tipos (`kind`): damage, push, pull, slow, venom, expose, heal, shield, haste, cleanse, dash, swap, blast,
  guard, sprint, fury, eclipse, lunge, leap, charge, reach, domain, curse, corrode, detonate, snare, contagion, track.
  Los de apoyo están en `supportKinds`.
- Opciones frecuentes: `element` (physical, magic, fire, ice, lightning, chaos — «veneno» = chaos), `area`
  (cross, circle, cone, line, wave, trident, tee) + `size`/`width`, `casts` (usos/turno), `perTarget`, `cooldown`,
  `modifiable` (alcance ampliable), `los:false`, `inLine` (`true` o `'diagonal'`), `clearPath`, `push`, `pull`,
  `pushFrom:'center'`, `lifesteal`, `crit`, `stack`, `meleeBonus`, `mpCost`, `friendly`, `recoil`, `freeze`,
  `endsTurn`, `anyTarget`, `burnChance:0` (fuego sin quemadura). Busca ejemplos en `classes` de engine.js.

### Reglas de combate (resumen)
- 6 PA y 3 PM base. Crítico base 12 % (×1,5), tope 100 %.
- **Armadura en puntos (estilo Terraria), siempre pares**: cada 2 puntos quitan 1 a cada golpe **físico** (mínimo 1 de
  daño), después de los multiplicadores (`armorPoints`/`armorReduction`).
- **Escudo** (`effects.shield` del Escudo sagrado, `effects.barrier` de En guardia!): vida extra que absorbe el daño antes
  que los PV; se ve como tramo gris azulado al final de la barra de vida. El daño elemental solo lo
  frenan las resistencias, con tope del 50 % (`RESIST_CAP`, enemigos y, cuando existan, héroes).
- Tusi: cada combate da al menos 25. Sin gemas como recompensa en los pisos 1–2.
- Daño en área: −20 % por casilla de distancia al centro (mínimo 60 %).
- Empuje que choca: `2 × casillas que faltan + nivel/2`, sin elemento.
- Recarga «N turnos» = no se puede usar en los N turnos siguientes.
- Estados: `effects[key]={value,turns}`; `turns` baja al acabar el turno de quien lo sufre. Los que duran «hasta
  el turno del lanzador» usan `untilTurnOf` (+`skips`). Congelamiento: +35 % al siguiente golpe de hielo y −1 PM.
- Venenos de héroe: 2 de base × (1 + % de daño caótico).
- Actos de 8/10/12 pisos (30 en total). Normal → mejora de habilidad; jefe intermedio («élite») y jefe → 3
  habilidades nuevas. Los jefes **ya no usan glifos** (el código de glifos sigue, sin uso).

### Checklist para una habilidad nueva
1. Tupla en `classes.<id>.skills` (engine.js) y mecánica en `applySkill`/rama de `act`.
2. Texto de la carta en `skillEffectText`/`skillRows` (client.js) y frase en `skillLore` (qué hace, sin números).
3. Icono en `skillArt` (art.js), 32×32 con fondo del color de su elemento.
4. Animación en `skillFx` y pose en `spearPoses`/`bowPoses` (isometric.js). Las flechas devuelven el tiempo de
   vuelo para que el daño aparezca al impactar.
5. Test en game.test.js. 6. Anotar la decisión en `docs/skills-<clase>.md`.

### Flujo con el usuario para clases nuevas
Él pasa las filas de su hoja → guárdalas en `docs/skills-<clase>.md` → pregunta las mecánicas dudosas (numeradas) →
implementa por tandas → manda captura de las cartas → él prueba en el Laboratorio.
**Equilibrio de referencia: la Valkyria.** Regla: si pega de lejos, en área o quita PA/PM, pega menos.
Referencias: ~1,6–2,6 de daño por PA a un objetivo; área/control ~1,2–1,6.

## 4. Estado de las clases

| id | Nombre | Estado |
|---|---|---|
| `guardia` | Valkyria | 15 habilidades nuevas, iconos, animaciones y poses de lanza. Equilibrada (referencia). |
| `tirador` | Arquero | 15 habilidades nuevas, iconos, animaciones y poses de arco. Ajustado contra la Valkyria. |
| `mago` | Mago | Solo 3 habilidades; pendiente de su hoja nueva. |
| `mistico` | Paladín (antes Clérigo) | Kit antiguo (8). Pendiente; su ilustración es de paladín. |
| `sombra` | Ninja | Kit antiguo (8). Pendiente. |

Backlog conocido: habilidades nuevas de Mago/Paladín/Ninja; nuevo poder para el **Oráculo de Ceniza** (sin glifos
se quedó solo con su ataque); repasar recargas de todas las habilidades; tilesets de jungla, raíces y huesos;
Amazona (aplazada); legendarios; borrar cuentas de prueba Ana/Bob.

## 5. Estética (canon actual)

- **Personajes**: low-poly estilo PS1 estilizado, 4–5 cabezas, hechos con piezas en `models3d.js`. Caras de 16×16
  píxeles dibujadas por código. Nada de chibi «de belén».
- **Valkyria**: mujer, armadura gris, mezcla valquiria/Amazona de Diablo 2, yelmo alado, pelo rubio, ojos celestes,
  lanza (golpea siempre con la **punta**).
- **Escenario (HD, por defecto)**: tileset + relieve (bumpMap), ambiente oscuro y frío, antorchas cálidas **sin
  sombras propias** (luz + «charco de luz» pintado en el suelo, `lightPool`; las sombras de antorcha encarecían mucho la
  carga en Firefox), velas solo con charco de luz (sin luz real), luz suave sobre los héroes, muros de ladrillo al fondo, decorado (huesos, cascotes, charcos),
  piedra triplanar en obstáculos, viñeta. `?classic` en la URL vuelve a colores planos.
- **Efectos**: viscerales y con peso: trazos del recorrido, impactos, chispas, púas, ondas y temblor de cámara en
  los golpes fuertes. Cada habilidad tiene los suyos; no reutilizar los del Mago.
- **Iconos de estado** encima del nombre (rojo perjuicio, verde mejora; hielo azul, veneno lima, fuego naranja) con
  ficha al pasar el ratón.

## 6. Tileset (`tiles/<bioma>.png`)

- Cuadrícula **4×4** de casillas de 32×32 (128×128; vale cualquier múltiplo manteniendo la cuadrícula).
- Filas 1–3: **12 suelos**, la misma losa de **más sana (1) a más destruida (12)**; salen con peso decreciente
  (`FLOOR_WEIGHTS`) y giradas al azar. Fila 4: 4 paredes de ladrillo.
- Vista cenital, sin luces ni sombras pintadas, bordes que encajen. Biomas con archivo: `crypt`, `hell`.
- `props.png`: 64×64, gris neutro, repetible; se tiñe con el color de cada pieza de los obstáculos.
- Los generadores de prueba eran scripts de Python/PIL; el usuario mejorará los PNG con IA y los reemplazará.

## 7. Probar y capturar

- `npm start` (o `PORT=3000 node server.js`) y abre http://localhost:3000. Tras cambiar archivos, reinicia el
  servidor (cachea archivos estáticos).
- Para capturas: Playwright con Chromium (`--use-angle=swiftshader`), registrar/iniciar sesión como `passa`,
  Editor de mapas → Probar → añadir héroe/enemigos → Empezar prueba. Truco útil: interceptar `client.js` y añadir
  al final `window.__fx=e=>iso.impact(e);window.__mv=e=>iso.move(e);window.__st=()=>state;window.__render=()=>render();`
  para lanzar efectos y mover unidades a mano; ralentizar `performance.now`/`requestAnimationFrame` para ver
  animaciones a cámara lenta.

## 8. Comentarios en el código

Las funciones clave de engine.js, isometric.js y models3d.js tienen comentario (JSDoc corto en español). client.js
y mapeditor.js están menos comentados. Al tocar una función sin comentario, añádele uno breve: qué hace y por qué.
