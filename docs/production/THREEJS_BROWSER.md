# Integración de modelos en Cripta del Tusi / Three.js

Fuente: [models3d.js](https://github.com/luchontandil/cripta-del-tusi/blob/main/models3d.js), [engine.js](https://github.com/luchontandil/cripta-del-tusi/blob/main/engine.js), [isometric.js](https://github.com/luchontandil/cripta-del-tusi/blob/main/isometric.js). Verificar el checkout actual antes de cambiar contratos.

## Arquitectura actual

El repo incluye una copia local de Three.js y `models3d.js` contiene helpers/factories que ensamblan grupos y geometrías Three.js de forma procedural. Factory de criatura devuelve un objeto tipo `{root, figure, legs, arms, head, animate}`; existe además `miniature(kind)` para clases/enemigos y `obstacle(root, kind, variant)` para elementos del tablero. El juego no cargará automáticamente archivos GLB solo por agregarlos al proyecto.

Cuando se migren/añadan GLB, preservar esta interfaz con un adapter async/caché: cargar `root` GLB una sola vez por asset; devolver una forma que consumidores existentes esperan; traducir los clips GLB al `AnimationMixer`; documentar qué campos no existen (por ejemplo limbs explícitos) y modificar callers de manera localizada. Revisar `client.js` y demás consumers antes de cambiar `miniature()` sync por async; preload assets antes de iniciar el combate para no bloquear render.

```js
// Esquema adaptador; adaptar a imports y ciclo de vida reales del repo.
const gltf = await loader.loadAsync(url);
const root = gltf.scene;
const mixer = new THREE.AnimationMixer(root);
const clips = new Map(gltf.animations.map(clip => [clip.name, mixer.clipAction(clip)]));
return { root, figure: root, legs: [], arms: [], head: measuredHeadHeight, animate(t, state, dt) { mixer.update(dt); /* disparar clip según state */ } };
```

No duplicar THREE desde otro bundle/version: usar la instancia/copia compatible del proyecto. La importación GLTFLoader debe corresponder a la versión instalada (repo dice r180) y su distribución; no añadir CDN remoto a juego sin decisión explícita. Comprobar MIT de Three.js sigue conservada.

## Cámara y ejes

README describe tablero isométrico y un alternador de vista cenital (automática si no hay WebGL). El usuario seleccionó cámara top-down para dirección/producción. Los assets deben leerse en ambos modos: isométrico de juego y cenital. Orientación de personajes/ataques se deriva de la cuadrícula, no de cámara. Antes de fijar eje de forward, escala métrica o grid size, leer `isometric.js` y consumers.

## Animación y mecánicas

Preferir clips GLB con nombres estables más adaptador. Si se conserva factory API `animate`, no llamar a mixer dos veces ni mezclar animación procedural y clip sin definir precedencia. Acciones deben corresponder a estados: idle/walk/attack/hit/death/cast. Efectos del juego siguen `engine.js`: cruz/círculo/cono/línea y empuje/atracción/escudo/curación/teletransporte deben ser legibles en tiles.

## Rendimiento

Este juego puede mostrar 4 héroes, varios enemigos, obstáculos, loot y VFX a la vez. Perfil real en una sala representativa; medir tris, draw calls, GLB, atlas, materiales, fill rate y memoria. Reusar geometry/material, instanciar obstáculos idénticos, hacer atlas y reducir transparencias/sombras dinámicas. Cachear GLBs y dispose al cambiar de escena sin fugas.

## Validación de un GLB nuevo

- Load success con GLTFLoader compatible, sin errores de path.
- Bounding box, escala y orientación coinciden con actor/tile real.
- Jerarquía, sockets, clips y clips names preservados.
- Cámara isométrica y cenital, miniatura, tablero con 4 jugadores.
- Interacciones de gameplay, oclusión, grid y colisión.
- Medidas de rendimiento adjuntas. Sin medidas, no llamarlo optimizado.
