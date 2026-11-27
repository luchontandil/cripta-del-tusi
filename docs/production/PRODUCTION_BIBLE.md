> ⚠️ Documento de una etapa anterior (estética chibi, Guardián, glifos de jefes…). La guía vigente es `CLAUDE.md` en la raíz del repo; si algo choca, manda ella.

# Biblia de arte y producción — Cripta del Tusi

## Autoridad y decisiones actuales

1. Requisitos y correcciones estéticas de Lucho.
2. Implementación del juego: [README](https://github.com/luchontandil/cripta-del-tusi/blob/main/README.md), [engine.js](https://github.com/luchontandil/cripta-del-tusi/blob/main/engine.js), [models3d.js](https://github.com/luchontandil/cripta-del-tusi/blob/main/models3d.js), [art.js](https://github.com/luchontandil/cripta-del-tusi/blob/main/art.js), [isometric.js](https://github.com/luchontandil/cripta-del-tusi/blob/main/isometric.js).
3. Fichas de este directorio.
4. Imágenes aprobadas (apariencia/forma; solo las vistas ortográficas fijan medidas).

### Correcciones estéticas del usuario

- El destino real es **Cripta del Tusi**, RPG táctico cooperativo de navegador.
- No es dark fantasy realista. Es fantasía oscura estilizada con personajes **chibi tipo Dofus en su simplicidad y atractivo**, sin copiar diseños. Cabezas grandes, cuerpos compactos, expresiones, colores armoniosos, equipo con personalidad.
- Calidad `balanced`; cámara de producción `top-down`; alcance `all`.
- Personajes más vivos y agradables dentro de escenarios peligrosos/oscuros. Debe seguir legible desde las cámaras top-down e isométrica ya presentes en el juego.
- La propuesta del Guardián peregrino realista y la ilustración SVG de Codex quedan retiradas.

## Inventario funcional observado

Cinco clases: Guardián, Arquero, Clérigo, Mago y Ninja (IDs internos `guardia`, `tirador`, `mistico`, `mago`, `sombra`). Tres actos y bestiario definidos en README/engine/models3d; revisar archivos fuente para pisos, jefes/mecánicas actuales. Equipamiento de nueve slots; loot normal/poco común/raro/legendario; hechizos tácticos de formas y elementos definidos en `engine.js`. Ver `ARCHETYPES_AND_BESTIARY.md`.

## Dirección y proporciones

Chibi estilizado no infantil: 2.5–3 cabezas de altura como punto inicial; cabeza/cara expresivas, extremidades compactas, manos/pies y equipo ligeramente exagerados. Formas grandes primero y siluetas de clase distintas incluso en gris plano. Bordes suaves y volúmenes esculpidos, no ensamblaje sin tratar de primitivas.

**Tono global:** fantasía estilizada atractiva + ambiente dungeon oscuro + identidad propia. La fórmula “70/20/10” que apareció en una respuesta anterior es una metáfora de dirección, no una medida del usuario.

Los héroes son coloridos respecto del ambiente. Tres actos tienen lenguaje local coherente:

- Mazmorra: piedra gris azulada, cripta, huesos, agua/trampas, magia espectral.
- Jungla: verdes/turquesas, ciénaga, raíces, helechos, ruinas y plantas tóxicas.
- Infierno: obsidiana, roca volcánica, lava y agujas infernales.

PBR simplificado, materiales suaves, superficies de detalle moderado y acentos luminosos localizados. Colores de `models3d.js` son anclas existentes: guardia teal/ocre; tirador verde/ocre; místico violeta/oro; mago azul/cian; sombra violeta/coral; mobs rojo oscuro; élites violeta; jefes magenta/oro. Las imágenes corregidas del usuario prevalecen sobre valores aproximados del código.

## Cámara, cuadrícula y medidas

El README describe tablero isométrico con opción cenital. Lucho pidió top-down para arte y producción: diseñar/validar primero desde arriba y verificar isométrica después. **No asumir metros, tamaño de casilla ni footprint fijo**. Medir `isometric.js` y consumidores actuales antes de definir escala/pivotes.

## Presupuesto inicial balanced

Recomendaciones preliminares para browser (perfilarlas en escena; no son constantes del código): héroe 8–15k tris; mob 2–7k; jefe 15–30k; prop 300–3k; módulo 500–5k. Texturas 512–1024 px según lectura. Varios héroes, enemigos, objetos y VFX se ven juntos; compartir atlas/materiales, geometry instancing, reducir transparencias/sombras y comprobar dispositivo objetivo. Cambiar presupuesto solo por medición/decisión explícita.

## Blender y runtime

Blender produce fuente editable y GLB. El `models3d.js` actual crea modelos Three.js con helpers y factories (`miniature`, `obstacle`), por lo que GLB no se carga automáticamente. Implementar un adapter/cache y conservar el contrato y consumidores o modificar callers con intención. Ver `THREEJS_BROWSER.md`.

## Pipeline de calidad

1. Traducir el brief y mecánicas exactas a silhouette/landmarks/paleta/piezas.
2. Leer y probar las imágenes correctivas guardadas en `docs/production/references/`.
3. Hacer blockout y evaluarlo top-down/isométrico a tamaño de casilla real.
4. Acabar malla, materiales, rig, clips, colisión/LOD según uso.
5. Integrar en escena de prueba real con party, monstruos, obstáculos y hechizos.
6. Medir, corregir, recapturar y completar `QUALITY_GATE.md`.
7. Nunca fingir lectura de imagen o medición. Si referencia no está disponible desde el workspace, anotarlo.

Empieza con un vertical slice coherente y prueba todos los assets juntos antes de multiplicar el catálogo.

