# Equipamiento y props del dungeon crawler

No asumir que toda partida necesita espada, linterna o campana: la anterior lámina del peregrino realista está descartada. Priorizar equipamiento y props que reflejen slots, clases, rarezas, actos y mecánicas ya existentes.

## Nueve slots de equipamiento

Arma, casco, armadura, guantes, cinturón, botas, anillo, amuleto y talismán. Cada pieza debe comunicar a qué slot pertenece por su forma, tener pivote/socket claro y no depender de diminutos detalles. Héroes diseñados con sockets compatibles entre clases, salvo piezas que requieran adaptación de silueta.

## Rarezas

- Normal: blanco/neutro, sin brillo.
- Poco común: azul.
- Raro: amarillo.
- Legendario: dorado.

La rareza debe ser un material/acento o VFX parametrizable, no cuatro copias completas del modelo. Conserva albedo base del objeto, controla el brillo y contrasta visualmente con los colores de clase y el fondo de tablero.

## Familias por clase

- Guardián: escudos, armas de una mano, casco/coraza resistentes.
- Arquero: arcos, carcaj, guantes/botas ligeros.
- Clérigo: báculos, símbolos, amuletos de soporte.
- Mago: bastones, cristales, talismanes arcanos.
- Ninja: shuriken, dagas, equipo ligero y runas.

Usar descriptores del `engine.js` y datos de botín del repo como origen de cada objeto; no inventar efectos mecánicos a partir del diseño.

## Props de sala

Agua/charcas, trampas de pinchos, respiraderos de gas, pilares, muros, ruinas, escombros, lianas, plantas escupidoras, agujas de obsidiana, lava y elementos de evento/tienda según acto. Colisión y estado de peligro necesitan mallas/metadata aparte de la malla bonita. Los objetos interactivos dejan libre el espacio de navegación salvo celdas que el motor marque bloqueadas.

## Contrato para cada prop

- ID `PRP_<BaseName>_<Variant>`; categoría de gameplay y acto.
- Dimensiones calibradas a celda y pivote de uso; no asumir una cuadrícula de dos metros.
- Malla, LOD/colisión simplificada, materiales PBR y origen reproducible.
- Variantes por color/rareza/daño parametrizadas cuando sean el mismo ítem.
- Capturas top-down, isométrica y close-up; lectura reducida a tamaño real del slot o casilla.
