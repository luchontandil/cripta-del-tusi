# Entornos por acto — grid táctico

El tablero del repo es isométrico con modo cenital; las salas generadas tienen formas/tamaños variables, obstáculos y posiciones de unidad dinámicas. Modelar para mantener navegación y línea de visión. La cuadrícula del juego es la fuente de dimensiones: **no imponer celdas de 2 × 2 metros**, ya que el código debe definir esa calibración.

## Acto I: Mazmorra

Piedra gris azulada, cripta/galería/osario/capilla, pilares, muros cortos, escombros, huesos, charcas de agua, pinchos y gas. Props/enemigos: limo, murciélago, calavera, gusano y esqueleto. Jefes: Rey Osario y Rey del Umbral. Mantener contraste suficiente para que los tiles de movimiento y las VFX se lean encima.

## Acto II: Jungla

Ciénaga, raíces, árboles, helechos, ruinas, charcas y plantas peligrosas. Paleta verde y turquesa saturada, con variación cálida local. Enemigos: babosa, murciélago y planta escupidora; jefes Cancerbero y Madre Espora. Plantas con silueta atractiva y legible, no follaje realista denso.

## Acto III: Infierno

Ríos/canales de lava, agujas de obsidiana, roca volcánica, puentes e islotes. Paleta carbón/obsidiana con naranja/rojo de calor. Enemigos: limo de lava, diablillo, vampiro y súcubo. Jefes de mitad: Oráculo de Ceniza o Reina Vampira; final: Demonio de Fuego.

## Kit modular (anclado al tablero)

El motor usa variedad de formas de sala, simetría, voids y estilos de obstáculos (pilares, muros, salas partidas, escombros, ruinas, columnatas). Crear familias que cubran esos casos y variantes deterministas por semilla. Antes de asignar metros, medir el tamaño/proyección de una celda en `isometric.js` y `models3d.js`.

| Familia | Ejemplos de piezas |
|---|---|
| Suelo | piso base, transición borde/charca/lava, tile trampa |
| Bloqueo y cobertura | pilar, muro 2–4 casillas, escombro, columna |
| Orgánico | raíz, árbol, helecho, planta hostil |
| Ruina | fragmento de capilla, columna caída, altar/portal |
| Bordes | borde exterior, agujero/void, pared rota |

Para cada pieza definir footprint sobre grid, bloquea paso, bloquea línea de visión, altura de oclusión en cenital y si puede instanciarse. VFX de agua, gas, veneno y fuego no deben ocultar información de alcance/objetivos.

## Construcción de rooms

Crear una muestra de room por forma (recta/cuadrada, L, T, C, cruz) y por acto. Prueba posiciones de 4 jugadores, monstruos, línea de visión de ataques largos, agua que bloquea paso pero no visión, trampas, glifos de jefe y movimiento de cámara. La belleza ambiental no puede cambiar las reglas de navegación.
