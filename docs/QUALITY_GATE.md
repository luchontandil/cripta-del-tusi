# Quality gate de asset

ID / rama / revisión:
Brief y referencia fuente:
Asset GLB y fuente:
Consumer del juego:

Puntúa 0–4: 0 falla, 1 débil, 2 necesita revisión, 3 cumple, 4 supera. Adjunta captura o métrica cuando puntúes menos de 3.

| Área | 0–4 | Evidencia |
|---|---:|---|
| Fidelidad | | Requisitos del usuario y arquetipo/mecánica presentes; exclusiones respetadas. |
| Estilo | | Chibi estilizado coherente; simple pero bello, expresivo, no primitivo genérico. |
| Silueta | | Se identifica desde top-down/isométrica a tamaño de tile. |
| Escala/grid | | Medida comparada con unidad de casilla y figura existente del código. |
| Cara/equipo | | Cara, arma/accesorio y rol se reconocen a distancia de juego. |
| Malla/rig | | Topología limpia; deformación adecuada para acciones reales. |
| Materiales/VFX | | Color y lenguaje del acto/clase; efecto coincide con área/mecánica. |
| Rendimiento | | Triángulos, draw calls, materiales, texturas, tamaño GLB y coste medidos. |
| Integración | | Adaptador/factory y todos sus consumers siguen funcionando; clips/socket correctos. |
| Procedencia | | Referencias/licencias registradas; archivo fuente reproducible. |

**Bloqueantes:** GLB o adapter no carga; rasgo identitario ausente; clase confusa en miniatura; ocupa/bloquea casillas de forma errónea; rig roto; VFX enseña un área distinta del gameplay; coste alto sin justificación; asset externo de licencia dudosa.

Capturas: top-down · isométrica · miniatura · pose/acción · test room con 4 jugadores
Métricas: tris · draw calls · materiales · textura máxima · peso GLB · clips · frame time
Fallas/correcciones/retest:
Decisión: APROBADO / REVISAR / PENDIENTE DE INSPECCIÓN
