# hero_cleric — ficha de referencia

- **Asset:** Clérigo (`mistico`), Héroe. Archivo: `hero_cleric.png`.
- **Estado:** Propuesta (17-11-2026). Pendiente de revisión de Lucho; no aprobado.
- **Procedencia:** render del modelo procedural `ps1Hero('mistico')` de `models3d.js` (repo del juego), hecho por Claude. Original, sin assets externos.
- **Reglas aplicadas:** PS1 estilizado ~4,5 cabezas, cara oculta, misma base y altura que el Guardián v2.
- **Vistas:** frontal en T-pose con líneas de cabeza (1 cabeza ≈0,26 u), lateral derecha, trasera, 3/4 en pose de juego, cenital sobre casilla, isométrico con la cámara del juego y escala frente al esqueleto actual.
- **Escala medida:** casilla = 1 unidad Three.js; cuerpo ≈1,16 u de alto.
- **Rasgos que fija:** capucha clara con cara en sombra, diadema de oro con gema, esclavina clara, estola con remates dorados, túnica larga (color de jugador) con ribete dorado, báculo con disco solar de 8 rayos.
- **Técnica:** low-poly facetado con color por vértice. **884 triángulos, 6 mallas (draw calls), 1 material(es).** Piezas móviles: torso+cabeza, 2 brazos, 2 piernas y arma(s).
