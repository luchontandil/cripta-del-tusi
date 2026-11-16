# Cripta del tusi

Dungeon crawler táctico para navegador. Juega en solitario o en una sala de hasta cuatro personas. Elige Guardián, Arquero, Clérigo, Mago o Acechante y supera seis pisos. Los tableros combinan cinco diseños, reflejos, obstáculos adicionales y posiciones enemigas variables. Crecen con el grupo. A partir del segundo piso, la planta puede tener forma de L, T, C o cruz y cambia de dimensiones respecto al anterior.

El tablero isométrico usa Three.js r180, incluido con su licencia MIT. Pulsa una casilla para moverte o para lanzar el hechizo seleccionado. Desde la barra superior puedes alternar con la vista cenital. Si el navegador no dispone de WebGL, el juego usa la vista cenital automáticamente.

## Jugar en local

Con Node.js 20 o posterior, abre una terminal en esta carpeta y ejecuta:

```sh
npm start
```

Entra en http://localhost:3000. Para probar el cooperativo, abre una segunda ventana en modo privado. En la primera, crea una sala desde **Jugar con amigos**. En la segunda, introduce el código y pulsa **Unirse**. Para jugar desde otro dispositivo de la misma red, usa la IP local del equipo anfitrión y el puerto 3000 en ambos navegadores.

Los turnos tienen 60 segundos. Las casillas azules se pueden alcanzar. Pasa el puntero para ver la ruta y haz clic para moverte. Selecciona un hechizo para ver su alcance en morado y sus objetivos válidos con borde dorado. La Bola de fuego del Mago permite elegir una casilla y previsualizar su área en naranja. Usa F1 para terminar el turno y las teclas 1 a 4 para seleccionar hechizos. Pasa el puntero sobre una unidad para ver su ficha. El botón SFX controla los sonidos de botones y hechizos. Las casillas rojas indican que hay alcance pero falta línea de visión. Todos los jugadores reciben la misma secuencia de pasos. Los hechizos largos comprueban línea de visión y la vulnerabilidad aumenta el daño de cualquier atacante.

Antes de cada piso el grupo vota el camino en un árbol generado al azar en cada partida. Hay 15 segundos para votar; si hay empate decide el voto del anfitrión y, sin votos, se toma la primera opción. Los nodos pueden ser **combate**, **élite** (enemigos más duros, un limo colosal extra, mejor botín y un 50 % más de oro) o **evento**. Los eventos (fuente, altar de sangre, cofre encadenado, campamento, buhonero, biblioteca) se votan entre 2 o 3 opciones con ventajas y costes; algunas afectan al combate siguiente (PA, PM, vida inicial o vida de los enemigos). Los pisos 3 y 6 son siempre la cámara del jefe.

Los monstruos son limos, murciélagos, calaveras flotantes y gusanos de cripta, cada uno con su modelo y sus animaciones. Las salas combinan trece diseños y ocho formas de planta, y pueden tener agua (bloquea el paso, no la visión) y trampas de pinchos o de gas que afectan a héroes y monstruos al pisarlas.

Los jefes de los pisos 3 y 6 anuncian un glifo en cruz por vez. El Oráculo alterna brasas y veneno. El Rey alterna cadenas y veneno. Todos los glifos hacen daño al activarse en el turno del jefe. Las brasas y el veneno también afectan a quien entre o empiece el turno encima. Las cadenas solo actúan en el turno del jefe y restan 2 PM en el siguiente turno de quien esté encima.

Entre pisos se elige el botín sobre el tablero. Las tarjetas comparan cada pieza con la equipada y permiten equiparla directamente o guardarla. Hay nueve ranuras de equipo, con iconos propios para cada ranura y las runas. Arrastra objetos de la mochila a una ranura compatible y devuélvelos a la mochila para desequiparlos. El botón Mercader abre la tienda. Cada nuevo piso da un nivel y 4 PV máximos. Tras la victoria, cada jugador elige una habilidad antes de continuar. El equipo aporta daño elemental, crítico, vida, armadura, alcance, PA o PM según la ranura. El equipo combina bases, rarezas y atributos aleatorios. Las runas se guardan en la mochila y pueden venderse, engarzarse en una pieza o extraerse para reutilizarlas.

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta al repositorio, con los archivos en la raíz.
2. En GitHub, ve a **Settings → Pages**. Elige **Deploy from a branch**, selecciona la rama principal y la carpeta **/(root)**, y guarda.
3. Cuando Pages muestre la URL, ábrela para jugar en solitario o conectarte al servidor multijugador.

Para jugar con amigos por internet, despliega este mismo repositorio en un servicio que ejecute Node.js y sirva HTTPS. Usa `npm start` como comando de inicio. El servidor acepta la variable `PORT` y aloja tanto la web como la API. Puedes compartir la URL del servidor directamente o introducirla en **Jugar con amigos** desde GitHub Pages.

Las salas viven en memoria y se pierden al reiniciar el servidor. Al recargar la misma pestaña, el juego intenta recuperar su sesión. Para partidas cooperativas usa una sola instancia del servidor.

## Escalado inicial

| Piso | 1 jugador | 2 jugadores | 4 jugadores | PV / daño base de enemigo común |
| --- | ---: | ---: | ---: | --- |
| 1 | 1 | 2 | 4 | 20 / 4 |
| 3 | 2 | 3 | 5 | 28 / 6 |
| 6 | 4 | 5 | 7 | 40 / 9 |

Los totales de los pisos 3 y 6 incluyen al jefe. Los vigías tienen un 25 % menos de vida y los custodios un 15 % más y 2 de armadura. Los jefes tienen 48 PV más 6 por piso y 8 por jugador adicional. Ajusta las clases y la función `encounter` en `engine.js` para cambiar el balance.

Ejecuta `npm test` para comprobar el motor y la sincronización de dos clientes.








## Despliegue del multijugador

- Usa un único Web Service Node.js 20+ en Render. Si ya tienes el servicio, sube esta revisión a la rama que usa y selecciona Manual Deploy → Deploy latest commit. Para uno nuevo, conecta el repositorio con el servicio web, selecciona main y deja Root Directory vacío.
- Build Command: npm test. Start Command: npm start. Health Check Path: /.
- No se requieren variables obligatorias ni claves de API. Render inyecta PORT. En un servidor propio, PORT es opcional y el valor local por defecto es 3000.
- Abre la URL HTTPS que muestra Render. El mismo servicio entrega la web y la API. El anfitrión crea una sala y comparte el código.
- Si entras desde GitHub Pages, abre Jugar con amigos e introduce la misma URL HTTPS de Render en Dirección del servidor. Publica el cliente y el servidor de la misma revisión.
- Las salas viven en memoria. Un reinicio o un nuevo despliegue corta las partidas en curso.
