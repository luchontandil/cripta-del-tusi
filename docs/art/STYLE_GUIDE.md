> ⚠️ Documento de una etapa anterior (estética chibi, Guardián, glifos de jefes…). La guía vigente es `CLAUDE.md` en la raíz del repo; si algo choca, manda ella.

# Dirección artística — Cripta del Tusi

## Canon visual aprobado

RPG táctico cooperativo de navegador; fantasía estilizada oscura con encanto chibi, tomando como referencia amplia el atractivo, la claridad y las proporciones compactas de Dofus, más el tono de dungeon crawler. El balance visual es: personajes atractivos y coloridos en un mundo peligroso, con identidad propia. No convertir esto en una fórmula porcentual ni copiar diseños protegidos.

El antecedente de peregrino realista, abadía cinematográfica, proporción adulta y paleta totalmente desaturada quedó descartado por la corrección del usuario. La SVG que Codex había dibujado también se eliminó como referencia porque su calidad era insuficiente.

## Proporción y construcción chibi

- 2.5–3 cabezas de altura; cabeza grande y expresiva, torso compacto, brazos/piernas cortos con manos, pies y armas algo exagerados.
- Chibi agradable, no infantil sin identidad: gesto claro, pose dinámica, accesorios con intención y silueta que aguanta a tamaño de ficha.
- Formas simples de volúmenes suaves y bordes redondeados; detalle selectivo y bien agrupado. Geometría sencilla debe seguir teniendo landmarks, solapes, huecos, articulaciones y buen diseño.
- Los héroes son más coloridos que el escenario. Oscuridad vive en atmósfera, valores y monstruos; no apagar toda la paleta.
- Cada clase se distingue primero por forma y equipo; color refuerza. Usar el roster real (`docs/production/ARCHETYPES_AND_BESTIARY.md`).

## Mundo por acto

- **Mazmorra:** piedra gris azulada, huesos, agua estancada, trampas, limos, esqueletos y criptas. Legibilidad fría, con acentos de magia/fuego.
- **Jungla:** ciénaga, raíces, árboles, helechos, ruinas tomadas por plantas. Verdes saturados y turquesa; vida y peligro tóxico.
- **Infierno:** obsidiana, agujas volcánicas, canales de lava y arquitectura infernal. Negro carbón y naranja/rojo de calor, reservado a amenaza/fuego.

Compartir proporciones, escala de detalle y shading entre actos; cambiar arquitectura, vegetación, materiales, paleta local, monstruos y partículas.

## Superficie y materiales

PBR simplificado: superficies limpias con rugosidad clara, paleta armoniosa y pocos mapas. Evitar texturas realistas de alta frecuencia; usar color por grandes planos, variación pictórica sutil y wear localizado. Metales satinados estilizados, piedra mate, cuero/caparazón diferenciados, telas de color de alto contraste y glow únicamente para magia/amenaza/legendario.

Los colores de `models3d.js` son referencias actuales: guardia teal/ocre, tirador verde/ocre, místico violeta/oro, mago azul/cian, sombra violeta/coral; enemigos rojos oscuros, élite violeta y jefe magenta/dorado. Ajustar a capturas aprobadas del usuario cuando estén disponibles.

## Cámara y lectura táctica

El repo tiene tablero isométrico y modo cenital; Lucho eligió top-down para las referencias de producción. Diseña y aprueba en top-down, luego confirma que funciona en isométrico. No sacar toda la variación de altura: los modelos necesitan volumen reconocible, sombra contenida y orientación compatible con las 8 direcciones/tiles que use el juego. En cenital, evitar que escudo, cabeza, capa o VFX tapen arma, tiles o selección.

## Efectos y feedback

Los efectos visuales corresponden con la forma de área del código: cruz, círculo, cono, línea; teletransporte, empuje, atracción, escudo, curación, veneno, hielo, fuego, arcano y sombra necesitan señales diferenciadas. La zona afectada debe poder leerse antes del lanzamiento y no esconder objetivos.

## Antiestilo

No usar: dark fantasy realista, proporciones 7–8 cabezas, personaje genérico con armadura gris completa, ilustración cinematográfica como spec de malla, estética bebé, cabezas lisas inexpresivas, primitivas ensambladas sin diseño, pixel art literal 2D, assets copiados de Dofus/Diablo, terror gore, detalle fino invisible, exceso de contorno negro, materiales cromados o una sola paleta marrón/negra en todos los actos.

## Integración visual

El brief/ficha del usuario vence a la guía. Registrar imágenes de producción dentro del proyecto con nombre/id y descriptor de qué fijan. La historia legible en el repo está resumida y enlazada en `docs/production/`; ver README/engine.js/models3d.js originales para cambios. Los thumbnails de imagen en el otro chat no se asumieron como píxeles inspeccionados al editar este repo.

