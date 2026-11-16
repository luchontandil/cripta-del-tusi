# Quality gate — Héroes chibi (vertical slice)

ID / revisión: `HERO_guardia`, `HERO_tirador`, `HERO_mistico`, `HERO_mago`, `HERO_sombra` · rework procedural v1
Brief: `docs/production/HERO_ARCHETYPES.md`, `docs/art/STYLE_GUIDE.md` (correcciones de Lucho: chibi tipo Dofus, top-down + isométrico, balanced).
Referencias de imagen: **no disponibles** (`docs/production/references/` solo tiene README). Diseño hecho desde las fichas de texto.
Asset: procedural Three.js (`chibiHero` en `models3d.js`). **Sin GLB/Blender**: no hay Blender en el entorno de trabajo; decisión de Lucho: rehacer en código.
Consumer: `miniature(kind,tint)` → `isometric.js` (contrato `{root,figure,legs,arms,head,animate}` conservado).

Escala medida en código: 1 casilla = 1 unidad (losa 0,963). Héroe ≈1,27 de alto con escala 1,12 (sin sombrero); cabeza 0,45 → **2,5 cabezas**.

| Área | 0–4 | Evidencia |
|---|---:|---|
| Fidelidad | 3 | Guardián: casco con cresta, hombreras, escudo grande y espada. Arquero: capucha con pico, capa, carcaj y arco curvo. Clérigo: diadema solar, manto claro, báculo de sol. Mago: sombrero de ala ancha y báculo de cristal. Ninja: capucha, máscara, cinta con colas, bufanda coral y dos dagas. |
| Estilo | 3 | Formas redondeadas, cara con ojos con brillo, cejas, boca y rubor; manos/pies grandes. `hero-front.png` |
| Silueta | 3 | Isométrico claro (`hero-iso.png`). Cenital: se distinguen por casco+escudo, pico de capucha+arco, diadema, ala del sombrero y colas de la cinta (`hero-top.png`); la cabeza domina, como es propio del chibi. |
| Escala/grid | 3 | Cabe en una casilla; comparado con limo/esqueleto en `hero-ingame.png`. |
| Cara/equipo | 3 | Cara visible en isométrico; en cenital se ve sobre todo el tocado. |
| Malla/rig | 2 | Jerarquía con grupos (piernas, brazos, cabeza, objeto en mano). Sin rig de huesos ni clips: animación procedural (respiración, mirar, parpadeo, caminar, golpe). |
| Materiales/VFX | 3 | PBR simple: tela mate, metal satinado, glow solo en cristal/gemas. Color de jugador en la tela principal; color de clase en metal/acentos. |
| Rendimiento | 2 | Tris: guardia 10 108 · tirador 8 100 · místico 9 060 · mago 7 480 · sombra 7 556 (perfil balanced 8–15k ✓). Mallas por héroe 34–47 (≈180 draw calls con 4 héroes) → **pendiente fusionar geometría**. Materiales cacheados y compartidos. Frame time no medido (render por software en el entorno de prueba). |
| Integración | 3 | Partida real con 4 héroes, enemigos, obstáculos y agua (`hero-ingame.png`); sin errores de consola; 31 tests del motor en verde. |
| Procedencia | 4 | Todo original y generado por código en el repo; sin assets externos. |

Capturas: `hero-front.png` · `hero-iso.png` · `hero-top.png` · `hero-ingame.png`
Pendiente: referencias de imagen aprobadas, fusión de mallas (draw calls), monstruos/jefes y entornos con la misma guía.
Decisión: **REVISAR** (vertical slice listo para que Lucho lo valide antes de extenderlo al bestiario).
