# Pipeline visual para assets tácticos

No declares “listo” solo porque el GLB abre. El objetivo es un juego de navegador con personajes chibi estilizados y una cuadrícula táctica.

## Entender

Lee brief, estilo, roster, mecánica real en `engine.js` y escala/proyección del tablero en `isometric.js`/`models3d.js`. No uses el concepto realista retirado. Guarda en el brief los requisitos y correcciones literales. Si la referencia del otro chat no está descargada en el workspace, indícalo con claridad.

## Diseñar y revisar blockout

Define silhouette, proporción 2.5–3 cabezas para héroes, equipo, paleta/clase/acto y relación con el tile. Revisa top-down a tamaño de pantalla real y además la vista isométrica. Usa gris plano primero para diagnosticar formas; no aceptes cabezas/cuerpos como cubos/esferas sin acabado diseñado.

## Acabado

Usa formas suaves de fantasía estilizada, cara expresiva, cambios de plano amplios y detalles funcionales. La simplicidad es control, no falta de diseño: cara, manos, pies y arma deben tener anatomía; armadura y tela deben tener bordes, espesores y solapes. Aplica variación, wear o ruido solo donde cuente material/uso. Mantén las VFX en correspondencia con grid, objetivos y áreas reales.

## Integración

Mide GLB y runtime con el roster de juego cargado (idealmente party de cuatro, enemigos, props y efecto simultáneos). La escena/vista aislada no prueba el cost. Mantén API de factories y consumidores; adapta GLB en vez de sustituir sin revisar. Corrige problemas y recaptura.

## Salida

Capturas cenital/isométrica/miniatura/acción, quality gate y métricas. Si el render no fue observado o la integración no corrió, marca pendiente; no rellenes métricas inventadas.
