# Roster canónico: arquetipos, actos, bestiario y VFX

Fuente primaria: [README del juego](https://github.com/luchontandil/cripta-del-tusi/blob/main/README.md), [clases y habilidades de engine.js](https://github.com/luchontandil/cripta-del-tusi/blob/main/engine.js), [paletas y factories de models3d.js](https://github.com/luchontandil/cripta-del-tusi/blob/main/models3d.js). Releer al comenzar cada fase; los nombres/mecánicas pueden evolucionar.

## Cinco clases (IDs actuales)

| ID | Nombre visible | Rol mecánico | Diseño/silueta propuestos | Ancla de color del código |
|---|---|---|---|---|
| `guardia` | Guardián | tanque, control, escudo, empuje/atracción | ancho y estable; gran escudo vertical, placas grandes y cuello/casco reconocible | teal apagado + latón |
| `tirador` | Arquero | ataque a distancia, precisión, movilidad | compacto y ligero; arco curvo claro, carcaj y capa/hood diferenciadores | verde bosque + ocre |
| `mistico` | Clérigo | curación, limpieza, escudo, celeridad | silueta serena; báculo/símbolo sagrado y masas de tela claras | violeta + oro claro |
| `mago` | Mago | elementos y áreas/control | túnica compacta, cabeza/hood y cristal/báculo exagerado | azul + cian |
| `sombra` | Ninja | iniciativa, sigilo, shuriken, veneno, desplazamiento | perfil bajo y diagonal; capucha, dos dagas/shuriken, telas cortas | violeta oscuro + coral |

La paleta citada refleja `looks` en `models3d.js`; usarla como ancla, no como recolor literal obligatorio. Las formas, gesto y equipo establecen rol antes del color. No sustituir la clase del código `sombra` por “Acechante”.

### Template común de héroe

- Altura visual: 2.5–3 cabezas; proporciones compatibles para base rig compartida.
- Vistas de producción: frontal, lateral, trasera, 3/4 de juego, top-down; neutra y una pose clave de clase.
- Ciclo inicial: `Idle`, `Walk`, `Attack`, `Hit`, `Death`; añadir `Cast` si la clase lo exige.
- Piezas: body/rig, headgear, torso, gloves, boots, cape/cloth, weapon, back/hand accessory. El equipo se separa en sockets con nombre estable.
- Expresividad visible en head/eyes/eyebrows/pose; simplificar para render cenital, no hacer rostro inexpresivo o oculto por defecto.

## Acto I — Mazmorra/cripta

- Visual: piedra gris azulada, agua estancada, huesos marfil apagado, metal envejecido; lectura oscura con luces cálidas/espectrales puntuales.
- Normales: limos, murciélagos, calaveras flotantes, gusanos de cripta y esqueletos.
- Jefes: Rey Osario (invocación/escudo de huesos), Rey del Umbral (glifos y cadena que arrastra).
- Elementos: pilares, muros, salas partidas, escombros, charcas, pinchos/gas. Agua bloquea paso, no visión.
- Forma de VFX: fuego/arcano/veneno y glifos con margen de casilla claro.

## Acto II — Jungla/ciénaga

- Visual: verdes y turquesas saturados; charcas, raíces, helechos, lianas, ruinas tomadas por plantas. Contraste húmedo y tóxico sin hacer todo fosforescente.
- Normales: babosas (baba que resta PM), murciélagos, plantas escupidoras (envenenan y apenas se mueven).
- Jefes: Cancerbero (embestida/aullido), Madre Espora (glifos de esporas y crecimiento de plantas).
- Siluetas de obstáculo: raíces horizontales, helechos en abanico, troncos húmedos y plantas columnares; dejan pasillos tácticos libres.

## Acto III — Infierno

- Visual: obsidiana, piedra volcánica, ríos de lava naranja/roja y agujas oscuras. Rojo/naranja reservado para calor/amenaza.
- Normales: limos de lava, diablillos, vampiros y súcubos.
- Jefes: Oráculo de Ceniza o Reina Vampira a mitad de acto; Demonio de Fuego final.
- Formas: roca fracturada, puentes/islotes y costra negra separada de canales de lava; evitar cubrir casillas transitables con VFX opaca.

## Objetos, botín y equipo

Nueve slots de juego: weapon, helmet, armor, gloves, belt, boots, ring, amulet, charm/talisman. Objetos combinan base + affixes/suffixes. Rarezas: normal (blanco), poco común (azul), raro (amarillo), legendario (dorado). Las variaciones de rareza deben seguir siendo el mismo modelo legible, con pocos cambios controlados de material/glow/silueta; color del borde/UI pertenece al UI y no debe pintarse indiscriminadamente en la malla. Runa se modela como token/tallado que se lee al tamaño de inventario.

## VFX guiada por mecánicas

Leer `engine.js` cada vez que se implemente VFX. Debe mapear acciones a señales consistentes:

- `cross`, `circle`, `cone`, `line`: footprint que coincide con celdas afectadas, vista antes/después de lanzamiento.
- `push`/`pull`: vector en tablero + reacción de la unidad + colisión si aplica.
- `shield`, `heal`, `cleanse`, `haste`: señales diferenciadas por clase/elemento y sin tapar silueta.
- `teleport`/`dash`/`swap`: salida/entrada, dirección y casilla final legibles.
- `fire`, `ice`, `arcane`, `shadow`, `physical`: lenguaje de color/partícula compartido y accesible; no depender solo del color para comunicar.

## Roster de monstruos y jefes según README actual

| Familia/acto | Identificadores visuales |
|---|---|
| No muerto / mazmorra | `skeleton`, floating skull, `worm`, `slime`, `skeletonking`, `umbralking` |
| Jungla | `slug`, `bat`, `plant`, `sporemother`, `cerberus` |
| Infernal/vampírico | `lavaslime`, `imp`, `vampire`, `succubus`, `oracle`, `vampqueen`, `firedemon` |

Comprobar IDs exactos en `models3d.js`/`engine.js` antes de exportar nombres. Estas correspondencias usan keys observadas en las factories de `models3d.js`; detalles de cada encuentro se verifican en el README/engine.
