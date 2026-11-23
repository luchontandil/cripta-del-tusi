# Skills del Arquero (id de clase: `tirador`) — propuesta nueva

Hoja hecha por un amigo del usuario, tal cual llegó (22-11-2026). Daños ajustados (abajo). Iniciales: Flecha helada, Flecha Flamigera y Detonadora. La fila vacía «Sangrado» se quitó (no había habilidad).

| Estado | Nombre del skill | Tipo (Activo/Buff/Pasivo) | Elementos | Coste | Daño Base | Lanzamiento/ Area | Alcance | modificable? | Requiere linea de vision? | Usos / Cooldown | Efecto secundario | Descripcion |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ✅ | Flecha helada | Activo | Fisico, Hielo | 2 | 2 - 3 | Single target | 2 - 8 | Si | Si | 2 usos por turno | Ret 1 pm 100%, Ret de 2 pm 25% | El arquero, lanza una flecha de Hielo que causa daño tipo hielo y retira 1 pm siempre |
| ✅ | Congelacion prematura | Activo | Fisico, Hielo | 4 | 6 - 8 | Cruz de 1 casilla. | 1 - 8 | No | Si | 1  vez por turno, 1 turno de CD | Aplica el estado congelamiento | Lanza una flecha de hielo del cielo que causa daño tipo hielo  en zona y aplica el estado "Congelamiento" a los enemigos afectados.  "Congelamiento": La proxima habilidad tipo hielo que afecte al enemigo afectado le retire 1 pm (independientemente si la habilidad retira pm,) y ocasiona un 50% mas de daño. |
| ✅ | Ramo helado | Activo | Fisico, Hielo | 3 | 5 - 6 | Linea recta en cono de 3 casillas | 1 - 8 | No | Si | 1 vez por turno | No tiene | Lanza una flecha en linea recta que al impactar al primer objetivo (no necesario) que desde la casilla en la que se lanzo se dispersa un cono de hielo golpeando a los enemigos detras. (muy parecida a la habilidad del ocra) |
| ✅ | Tramposa | Activo | Fisico, Hielo | 4 | 8 - 12 | Trampa de 1 casilla en cruz (necesito ayuda a describir bien la zona de efecto, es una trampa que se activa si se pisa en cruz de 2 casillas sin contar las diagonales) | 1 - 8 | No | Si | 1  vez por turno, 4 turnos de CD | Aplica el estado Congelamiento | Lanza una trampa de area 1 en cruz que se activa si un enemigo pisa alguna de las casillas del area de efecto. Una vez activada la trampa, ocasiona daños de hielo y aplica el estado "Congelamiento" a todos los enemigos alrededor de una zona de 3 casillas sin linea de vision (Importante que sea en ese orden, ya que si es de otra manera la trampa ocasionaria 50% mas de daño y retiraria pm). |
| ✅ | Flecha Repelente | Activo | Fisico | 3 | 7 - 10 | Single Target | 1 - 8 | Si | Si | 2 veces por turno | Empuja 2 casillas | Lanza una flecha que empuja al enemigo 2 casillas. |
| ✅ | Ojo de aguila | Buff | Ninguno | 2 | - | Single Target | 0 | No | Si | 1 vez por turno, 3 turnos de CD | Da 3 de alcance | El lanzador se da un bufo de 3 de alcance durante 2 turnos. |
| ✅ | Expansion de dominio | Buff | Ninguno | 2 | - | Single Target | 0 | No | Si | 1 vez por turno, 3 turnos de CD | Aumenta la duracion de debuffos del usuario 1 turno extra. | Aumenta la duracion de los efectos "Congelacion" y/o "Contagio" |
| ✅ | Dardo pestilente | Activo | Fisico, Veneno | 2 | 2 - 4 | Single target | 1 - 8 | Si | Si | 2 veces por turno, 1 por objetivo | Envenenamiento y maldicion de daño. | Lanza un dardo venenoso al enemigo ocasionando daños de veneno y reduciendo sus resistencias en un 25% por 1 turnos, no acumulable. |
| ✅ | Flecha venenosa | Activo | Fisico, Veneno | 2 | 1 - 4 | Single target | 1 - 8 | Si | Si | 2 veces por turno | Retira de PA. | Lanza una flecha envenenada que ocasiona daños de veneno y retira 1 PA NO acumulable. |
| ✅ | Contagio | Activo | Fisico, Veneno | 5 | 9 - 10 | Single target | 1 - 8 | Si | Si | 3 turnos de CD | Aplica el estado "Contagio" a el y a los enemigos a 2 casillas o menos de el enemigo | Lanza una flecha venenoza que ocasiona daños fisicos y de veneno. Luego aplica el estado "Contagio" durante 2 turnos a el y a sus enemigos a 2 casillas o menos. Contagio: Pierden 2 PA y disminuye el 25% del daño causado por 1 turno |
| ✅ | Trampita | Activo | Fisico, Veneno | 2 | 4 - 6 | Single target | 1 - 4 | No | No | 1 Turno de CD | Retira de PM | Lanza una trampa 1x1 (De una casilla) que envenena y retira pm 30% al personaje que la pise (tanto aliado como enemigo) |
| ✅ | Flecha Explosiva | Activo | Fisico, Fuego | 3 | 13 - 16 | Area de 3 casillas. | 1 - 7 | Si | Si | 1 vez por turno | No tiene efectos secundarios | Lanza una flecha explosiva que explota en la casilla objetivo ocasionando de fuego en area. Solo se ven afectados los enemigos que se encuentre en linea de vision desde donde cae la flecha. |
| ✅ | Flecha Flamigera | Activo | Fisico, Fuego | 3 | 9 - 10 | Linea recta, Area de 1x4 casillas | 1 - 9 | No | Si | 1 vez por turno | Empuja al lanzador una casilla hacia atras, en caso de que no haya una casilla disponible no lo empuja | Lanza una flecha en linea recta que afecta a todas las entidades a 3 casillas en linea recta desde su area de efecto, ocasionando daños de fuego |
| ✅ | Detonadora | Activo | Fisico, Fuego | 2 | 2 - 4 | Single target | 1 - 8 | Si | Si | 2 veces por turno y por objetivo | Le aplica el estado "Detonado xD" | Lanza una flecha que ocasiona daños de fuego al enemigo. Luego le aplica el estado "Detonado". Detonado: cuando finalice el turno del objetivo afectado, ocasiona daños de fuego a los enemigos a 2 casillas o menos (No al objetivo que tiene el estado "detonado") |
| ✅ | Flecha Rastreadora | Activo | Fisico, Fuego | 4 | 10 - 12 | Single target | 1 - 8 | Si | Si | 3 turnos de CD | Aplica el estado Rastreadisimo | Lanza una flecha que ocasiona daños de fuego. Aplica el estado Rastreadisimo: Pierdes la necesidad de la linea de vision con el enemigo objetivo "Rastreado" durante 2 turnos. |

## Daños acordados (22-11-2026)
Flecha Explosiva 13–16 → 5–7 · Flecha Repelente 7–10 → 3–5 · Flecha Flamigera 9–10 → 5–7 · Flecha Rastreadora 10–12 → 6–8 ·
Contagio 9–10 → 5–7 · Tramposa 8–12 → 5–8 · Congelacion prematura 6–8 → 4–6 · Ramo helado 5–6 → 3–5 · Trampita 4–6 → 3–5.
El resto, igual.

## Tanda 1 — decisiones (22-11-2026)
- «Veneno» = elemento caótico. Flecha helada: −1 PM (75 %) o −2 PM (25 %).
- Flecha Flamígera: casilla elegida + 3 más en línea recta; daña también a aliados; el arquero retrocede 1 (con daño si choca).
- Detonadora: 2 por turno, 1 por objetivo; la explosión hace 3–5 de fuego a los aliados del objetivo a ≤2 casillas al acabar su turno.
- Flecha Repelente: choque normal. Ojo de águila: solo hechizos de alcance modificable.
- Flecha venenosa: −1 PA no acumulable. Dardo pestilente: −25 a todas las resistencias hasta el próximo turno del arquero + veneno de 1 turno; 1 por objetivo.
- Venenos de héroe (también la Cuchilla envenenada del Ninja): 2 de daño base × (1 + % de daño caótico de quien lo aplica).

## Tanda 2 — decisiones (22-11-2026)
- Congelamiento: dura hasta el próximo turno de quien lo aplica. Lo consume la siguiente habilidad de daño de hielo de cualquier héroe: +50 % de daño y −1 PM extra (se suma a otros −PM). Si ya estaba congelado, primero se consume y luego se aplica el nuevo.
- Ramo helado: cono 1-3-5 desde la casilla elegida (impacto incluido), en línea recta. (Revisar: puede ser mucha área.)
- Tramposa: casilla vacía, oculta para los enemigos; se activa al pisar la cruz de 1 (5 casillas); daña a los enemigos a ≤3 (−20 %/casilla, sin línea de visión, sin aliados) y después congela. Dura todo el combate; una sola por arquero (la nueva sustituye a la vieja).
- Expansión de dominio: 2 turnos; todos los Congelamientos y Contagios que aplique duran 1 turno más del arquero.

## Tanda 3 — decisiones (22-11-2026)
- Contagio: al objetivo y a sus aliados a ≤2: −2 PA y −25 % de daño causado durante 1 turno (+1 con Expansión de dominio) y veneno 2 turnos.
- Trampita: visible, 1 casilla, la activa cualquiera (aliado o enemigo): daño + veneno 2 turnos + 30 % de −1 PM. Sin recarga, 1 por turno, dura todo el combate, máximo 3 a la vez (la más vieja desaparece).
- Flecha Explosiva: círculo de 3, solo enemigos, solo los que se ven desde la casilla del impacto, −20 %/casilla.
- Flecha Rastreadora: 2 turnos sin necesitar línea de visión contra ese objetivo, solo para las habilidades del arquero que la lanzó.

## Ajustes de equilibrio (22-11-2026, tomando la Valkyria como referencia)
- Flecha Explosiva: círculo de 3 → círculo de 2. Explosión de Detonadora: 3–5 → 2–3.
- La IA esquiva las Trampitas (visibles); la Tramposa sigue oculta.
- Congelación prematura (23-11-2026): sin recarga (1 uso por turno) y daño 4–6 → 6–8.
- Congelación prematura (23-11-2026, de nuevo): 1 turno de recarga y 4–6. Congelamiento dura 2 turnos del lanzador (3 con Expansión de dominio) y da +35 % (antes +50 %). Afecta también a Tramposa.
- Flecha Repelente (23-11-2026): alcance 1–6 no modificable, 2 por turno y 1 por objetivo, daño 3–5 → 2–4.
