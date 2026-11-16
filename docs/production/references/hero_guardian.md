# hero_guardian — ficha de referencia

- **Asset:** Guardián (`guardia`), Héroe. Archivos: `hero_guardian.png` (lámina) y `hero_guardian_ingame.png` (captura en partida).
- **Estado:** Propuesta — pendiente de revisión de Lucho. No aprobado.
- **Procedencia:** render del modelo procedural `ps1Hero('guardia')` de `models3d.js` (repo del juego), hecho por Claude el 17-11-2026. Original, sin assets externos ni licencias de terceros.
- **Dirección:** PS1 estilizado, ~4,5 cabezas (decisión de Lucho del 17-11-2026, sustituye al chibi de 2,5–3 cabezas).
- **Vistas:** frontal en T-pose con líneas de cabeza (1 cabeza = 0,30 u), lateral derecha, trasera, 3/4 en pose de juego, cenital sobre casilla, isométrico con la cámara del juego y comparación de escala con el esqueleto actual.
- **Escala medida:** casilla = 1 unidad Three.js. Altura ≈1,35 u (≈1,46 u con cimera). Ancho de hombros con hombreras ≈0,6 u: cabe en una casilla.
- **Rasgos que fija:** casco abierto con nasal, carrilleras, cubrenuca y cimera (color de jugador); peto de acero con cresta; hombreras con ribete de latón; tabardo delantero y trasero (color de jugador); grebas y rodilleras; botas de cuero; escudo heráldico con cruz de latón (campo del color de jugador) en la mano izquierda; espada recta en la derecha; cara pixelada de 16×16 con cicatriz.
- **Paleta:** acero `#a9b8b6`/`#5f6f70`, latón `#c9963f`, cuero `#5a3a26`, piel `#d9a07c`, tela de clase teal `#3f7a74` (la sustituye el color de jugador en partida).
- **Técnica:** low-poly facetado, color por vértice y una sola textura pequeña (cara). **930 triángulos, 8 mallas (draw calls), 2 materiales.** Piezas móviles separadas: torso+cabeza, 2 brazos, 2 piernas, escudo, espada, cara.
- **Exclusiones:** sin proporción chibi, sin texturas realistas ni metal cromado, sin copiar diseños de Dofus u otros juegos.
- **Dudas abiertas:** ¿cara visible o con visera cerrada? ¿espada recta o maza? ¿escudo heráldico o redondo?
