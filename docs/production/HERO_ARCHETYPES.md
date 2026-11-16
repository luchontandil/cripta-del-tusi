# Especificación visual de los cinco arquetipos

Los cinco pertenecen a la misma escala y rig base, con proporción chibi estilizada de 2.5–3 cabezas. No los hagas bebés ni muñecos sin anatomía: silueta compacta, cara expresiva, manos/armas algo exageradas, volúmenes simples con bordes suaves y un rasgo distintivo legible desde cenital. Las fichas no reemplazan las imágenes de referencia; si no se copian al repo, registrar que faltan.

## Escala/rig y entrega

- El juego actual es una cuadrícula táctica; **no fijar 1.80 m** ni escala métrica hasta calibrar contra una unidad del tablero en código.
- Presupuesto inicial balanced: 8–15k tris por héroe, 2–4 materiales, atlas 512–1024 px según lectura; validar en una sala con cuatro jugadores y enemigos.
- Armature humanoide compartida cuando la silueta y proporciones de la clase lo permitan.
- Clips: `Idle`, `Walk`, `Attack`, `Hit`, `Death`; `Cast`/variantes según hechizos. Evitar locomoción en idle y ciclos de ataques que no correspondan a la mecánica.
- Piezas/equipos separados en sockets: `Head`, `Torso`, `Hands`, `Weapon`, `Back`, `Waist`, `Feet`, `Ring`, `Amulet`, `Charm`.
- Entrega cada GLB con fuente Blender, scripts, capturas cenital/isométrica/frontal/trasera y métricas.

## 1. Guardián (`guardia`)

Rol: tanque, escudo, control de espacio, empuje/atracción. Cuerpo compacto y robusto; torso ancho y piernas plantadas, pero no un bloque cúbico. Escudo grande como forma dominante separada del torso, casco/coraza con diseño propio y arma de corto alcance. Debe entenderse como protector antes de leer color o cara. Paleta base teal apagado, latón cálido y carbón según `models3d.js`. Pose: frontal estable, escudo al frente; ataque de tajo/embestida y pose de muralla.

## 2. Arquero (`tirador`)

Rol: daño a distancia y movilidad. Silueta más delgada y dinámica que el Guardián; arco curvo inequívoco, carcaj visible desde arriba, capa corta/capucha opcional. Dedos y cuerda legibles sin geometría filiforme. Paleta verde bosque + ocre. Poses: arco tensado lateral/diagonal, paso atrás, lanzamiento de flecha en línea/cruz.

## 3. Clérigo (`mistico`)

Rol: cura, limpia, escuda, acelera. Silueta vertical serena; báculo/símbolo solar o sagrado como punto de lectura, prendas claras organizadas en grandes paños; evitar iconografía religiosa real específica salvo brief. Paleta violeta/índigo con oro claro/blanco cálido. Poses: báculo elevado para curación/escudo y golpe/juicio para efecto ofensivo.

## 4. Mago (`mago`)

Rol: elementos, áreas, control, teleport. Silueta con túnica compacta, capucha/sombrero o cabeza diferenciada, bastón y cristal grande pero proporcionado a la cuadrícula. Paleta azul con cian, cristales legibles. Poses: carga, apuntado, cono/área y teletransporte.

## 5. Ninja (`sombra`)

Nombre visible real en el motor: **Ninja**; ID `sombra`. No renombrarlo Acechante. Rol: máxima iniciativa, shuriken, veneno, dash/swap, dagas. Silueta baja/ágil, capucha compacta, dos armas cortas y pañuelo/faja reconocible. Paleta violeta oscura + coral/rosa. Poses: guardia asimétrica, shuriken, doble cuchilla, paso de sombra.

## Reglas comunes de modelado

- Misma escala de cabeza, suelo y articulaciones base; diferenciar roles con masas y accesorios, no solo color.
- Cabeza/cara expresivas: ojos, cejas y boca visibles a la escala de cámara. No ocultar caras por capucha completa salvo pedido.
- Acabado de fantasía estilizada: suaves transiciones grandes, biselado redondeado moderado, superficie limpia con acentos de desgaste. No realismo metálico cinematográfico ni low-poly geométrico duro.
- Los equipos intercambiables se pueden quitar sin dejar huecos. Rig de shoulder/cape evita intersecciones en acciones principales.
- Revisión individual y lineup de las cinco clases juntas. Aprobar coherencia de escala/paleta y diferencias de silueta antes de crear variantes.
