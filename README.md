# Cripta del tusi

Dungeon crawler táctico para navegador. Juega en solitario o en una sala de hasta cuatro personas. Elige Guardián, Arquero, Clérigo o Mago y supera seis pisos. Los tableros se generan por semilla y crecen con el grupo.

## Jugar en local

Con Node.js 20 o posterior, abre una terminal en esta carpeta y ejecuta:

```sh
npm start
```

Entra en http://localhost:3000. Para probar el cooperativo, abre una segunda ventana en modo privado. En la primera, crea una sala desde **Jugar con amigos**. En la segunda, introduce el código y pulsa **Unirse**. Para jugar desde otro dispositivo de la misma red, usa la IP local del equipo anfitrión y el puerto 3000 en ambos navegadores.

Los turnos tienen 60 segundos. Las casillas azules se pueden alcanzar. Pasa el puntero para ver la ruta y haz clic para moverte. Selecciona un hechizo para ver su alcance en morado y sus objetivos válidos con borde dorado. La Bola de fuego del Mago permite elegir una casilla y previsualizar su área en naranja. Activa la banda sonora desde Música. Todos los jugadores reciben la misma secuencia de pasos. Los hechizos largos comprueban línea de visión y la vulnerabilidad aumenta el daño de cualquier atacante.

Los jefes de los pisos 3 y 6 anuncian glifos de brasas, veneno y cadenas. Al activarse pueden dañar, envenenar o restar PM a los héroes que entren o comiencen el turno encima.

Entre pisos se puede elegir botín, equipar objetos y comprar o vender al mercader. El equipo combina bases, rarezas y atributos aleatorios. Las runas se guardan en la mochila y pueden venderse, engarzarse en una pieza o extraerse para reutilizarlas.

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta al repositorio, con los archivos en la raíz.
2. En GitHub, ve a **Settings → Pages**. Elige **Deploy from a branch**, selecciona la rama principal y la carpeta **/(root)**, y guarda.
3. Cuando Pages muestre la URL, ábrela para jugar en solitario o conectarte al servidor multijugador.

Para jugar con amigos por internet, despliega este mismo repositorio en un servicio que ejecute Node.js y sirva HTTPS. Usa `npm start` como comando de inicio. El servidor acepta la variable `PORT` y aloja tanto la web como la API. Puedes compartir la URL del servidor directamente o introducirla en **Jugar con amigos** desde GitHub Pages.

Las salas viven en memoria y se pierden al reiniciar el servidor. Al recargar la misma pestaña, el juego intenta recuperar su sesión. Para partidas cooperativas usa una sola instancia del servidor.

## Escalado inicial

| Piso | 1 jugador | 2 jugadores | 4 jugadores | PV / daño base de enemigo común |
| --- | ---: | ---: | ---: | --- |
| 1 | 1 | 2 | 4 | 11 / 2 |
| 3 | 2 | 3 | 5 | 15 / 3 |
| 6 | 4 | 5 | 7 | 21 / 5 |

Los totales de los pisos 3 y 6 incluyen al jefe. Ajusta las clases y la función `encounter` en `engine.js` para cambiar el balance.

Ejecuta `npm test` para comprobar el motor y la sincronización de dos clientes.

