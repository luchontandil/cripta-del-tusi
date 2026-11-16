# hero_mage — ficha de referencia

- **Asset:** Mago (`mago`), Héroe. Archivo: `hero_mage.png`.
- **Estado:** Propuesta (17-11-2026). Pendiente de revisión de Lucho; no aprobado.
- **Procedencia:** render del modelo procedural `ps1Hero('mago')` de `models3d.js` (repo del juego), hecho por Claude. Original, sin assets externos.
- **Reglas aplicadas:** PS1 estilizado ~4,5 cabezas, cara oculta, misma base y altura que el Guardián v2.
- **Vistas:** frontal en T-pose con líneas de cabeza (1 cabeza ≈0,26 u), lateral derecha, trasera, 3/4 en pose de juego, cenital sobre casilla, isométrico con la cámara del juego y escala frente al esqueleto actual.
- **Escala medida:** casilla = 1 unidad Three.js; cuerpo ≈1,16 u de alto.
- **Rasgos que fija:** sombrero de ala ancha con punta doblada (color de jugador), cara en sombra con ojos que brillan y barba gris, túnica larga con franja dorada, báculo de madera con garra y cristal cian emisivo (2.º material).
- **Técnica:** low-poly facetado con color por vértice. **680 triángulos, 7 mallas (draw calls), 2 material(es).** Piezas móviles: torso+cabeza, 2 brazos, 2 piernas y arma(s).
