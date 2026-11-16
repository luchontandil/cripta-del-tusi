# hero_archer — ficha de referencia

- **Asset:** Arquero (`tirador`), Héroe. Archivo: `hero_archer.png`.
- **Estado:** Propuesta (17-11-2026). Pendiente de revisión de Lucho; no aprobado.
- **Procedencia:** render del modelo procedural `ps1Hero('tirador')` de `models3d.js` (repo del juego), hecho por Claude. Original, sin assets externos.
- **Reglas aplicadas:** PS1 estilizado ~4,5 cabezas, cara oculta, misma base y altura que el Guardián v2.
- **Vistas:** frontal en T-pose con líneas de cabeza (1 cabeza ≈0,26 u), lateral derecha, trasera, 3/4 en pose de juego, cenital sobre casilla, isométrico con la cámara del juego y escala frente al esqueleto actual.
- **Escala medida:** casilla = 1 unidad Three.js; cuerpo ≈1,16 u de alto.
- **Rasgos que fija:** capucha con pico y cara en sombra, capa corta (color de jugador), jubón de cuero con tachas, correa cruzada, carcaj con 3 flechas de pluma roja a la espalda, brazales, arco largo curvo en la mano izquierda.
- **Técnica:** low-poly facetado con color por vértice. **864 triángulos, 6 mallas (draw calls), 1 material(es).** Piezas móviles: torso+cabeza, 2 brazos, 2 piernas y arma(s).
