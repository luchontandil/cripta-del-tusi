> ⚠️ Documento de una etapa anterior (estética chibi, Guardián, glifos de jefes…). La guía vigente es `CLAUDE.md` en la raíz del repo; si algo choca, manda ella.

# Guía de agentes: Cripta del Tusi — Blender + Three.js

Lee `docs/production/PRODUCTION_BIBLE.md`, `docs/art/STYLE_GUIDE.md`, la ficha de la familia, el roster, `docs/REFERENCE_POLICY.md`, `docs/VISUAL_QA.md` y `docs/QUALITY_GATE.md` antes de modelar. Las imágenes autorizadas del proyecto tienen que existir en `docs/production/references/`; si no están disponibles, decláralo. No uses la lámina realista anterior de peregrino/abadía ni inventes un canon.

## Canon

- Juego táctico de navegador Three.js; dungeon crawler oscuro y colorido, estética chibi estilizada tipo encanto de Dofus sin copiar sus assets.
- Cámara top-down pedida; el juego también tiene modo isométrico. Debes revisar ambas.
- Clases existentes: Guardián `guardia`, Arquero `tirador`, Clérigo `mistico`, Mago `mago`, Ninja `sombra`.
- Tres actos Mazmorra/Jungla/Infierno. Ver `ARCHETYPES_AND_BESTIARY.md` para enemigos, jefes y mecánicas reales.
- Balanced: héroes 8–15k tris, enemigos 2–7k, jefe 15–30k, props/obstáculos 0.3–5k orientativos. Perfil real decide.
- La cuadrícula del juego fija escala/footprint. No asumir alturas realistas de 1.8 m ni módulos de 2 m sin medir el código.
- El juego existente hace factories Three.js proceduralmente en `models3d.js`; los GLB requieren integración/adaptador intencional.

## Ciclo

1. Extrae el brief literal y la mecánica del código; fija landmarks, silueta, paleta, tamaño relativo a tile, socket, rig y presupuesto.
2. Consulta imágenes del proyecto. Busca web para referencias concretas si hace falta; no calques referencias ni tomes una descarga gratuita como licencia.
3. Diseña turnaround/pose y blockout original. Prueba primero top-down, escala de pantalla y luego isométrico; corrige antes de detalle.
4. Modela mallas diseñadas. “Chibi simple” no significa juntar cubos/esferas sin forma: deben existir silueta, solapes, espesores, cara, equipo funcional, cambios de plano y detalle focal.
5. Usa PBR simplificado, paleta del acto/clase y UV/atlas. Evita ruido de textura y geometría fina que se pierde a tamaño táctico.
6. Exporta GLB/source, integra con la API actual (`miniature`, `obstacle` u otro caller; revisa consumidores antes de cambiar sync/async). Preload/cachea, respeta instancia Three y acciones.
7. Prueba con party de cuatro, enemigos, bloqueadores, áreas VFX y UI/tiles; mide render/performance, corrige y vuelve a capturar.
8. Completa quality gate. “Revisado visualmente” requiere capturas reales inspeccionadas; nunca rellenar métricas de memoria.

No detenerse a pedir aprobación intermedia si el usuario encargó crear el asset. Pedir aclaración solo ante ambigüedad que altere su identidad o licencia/servicio no autorizado.
