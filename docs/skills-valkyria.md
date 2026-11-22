# Skills de la Valkyria (id de clase: `guardia`)

Hoja del usuario, con las correcciones acordadas en el chat ya aplicadas a los skills implementados.
Estado: ✅ implementado · ⏳ pendiente.

| Estado | Nombre | Tipo | Elemento | Coste | Daño base | Lanzamiento / Área | Alcance | Modificable | Línea de visión | Usos / Recarga | Efecto secundario | Descripción |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ✅ | Furia | Buff | Fuego | 2 PA | – | – | 0 | No | No | 1 por turno, 4 turnos de recarga | – | Dura 2 turnos (contando el del lanzamiento): +10 % de daño final × (1 + % de daño de fuego). Afecta a todo el daño. |
| ✅ inicial | Estocada | Activo | Físico, Fuego | 3 PA | 5 – 7 | Línea recta de 3 casillas desde la casilla elegida | 1 – 2, en línea recta | No | No | 2 por turno | Empuja 2 casillas en área | Empuja 2 casillas (alejándose) a todos los objetivos de la línea; primero los más lejanos. |
| ✅ | Liberación | Activo | Físico, Fuego | 3 PA | 3 – 6 | Círculo de 2 a tu alrededor | 0 | No | No | 1 por turno | – | Empuja 2 casillas a todos los objetivos de la zona. |
| ✅ | Pies ligeros | Buff | Ninguno | 2 PA | – | – | 0 | No | No | 1 por turno, 2 turnos de recarga | – | Ganas 2 PM al momento (se ve «+2 PM»). |
| ✅ | Punzón | Activo | Físico | 2 PA | 3 – 4 | Un objetivo | 1 – 4 | Sí | Sí | 2 por turno | Te curas el 25 % del daño hecho (daño real) | Te curas el 25 % del daño hecho. |
| ✅ | Balestra | Activo | Físico, Rayo | 3 PA | 2 – 9 | Línea recta, un objetivo | 1 – 6 | No | Sí | 1 por turno, 1 turno de recarga | Teletransporta al usuario detrás del objetivo | Corre en línea recta hasta el objetivo, lo daña y se teletransporta detrás; si esa casilla está ocupada se queda pegado. Sin obstáculos en la recta (unidades, muros, agua; las trampas no cuentan). Si es un aliado no lo daña. |
| ✅ | Salto valiente | Activo | Físico, Fuego | 4 PA | 5 – 8 | Círculo de 2 casillas | 2 – 4 | No | No | 1 por turno, 3 turnos de recarga | Cura el 10 % del daño causado | Teletransporta al usuario a una casilla libre y daña a todos los enemigos en un círculo de 2 alrededor de donde aterriza (−20 % por casilla de distancia, mínimo 60 %). |
| ✅ | Lanza cargada | Activo, Buff | Físico, Rayo | 3 PA | 1 – 9 | Línea recta y diagonales | 1 – 7 | No | Sí | 2 por turno | 15 % de crítico base | Un solo objetivo (el primero de la línea: los cuerpos tapan la visión). +15 % de crítico. Cada uso da una carga de +1 al daño mínimo y máximo que dura 2 turnos; máximo 3 cargas, cada una con su propia duración. |
| ✅ | Carga heroica | Activo | Físico, Rayo | 3 PA | 2 – 8 | Línea recta | 1 – 5 | No | Sí | 1 por turno | – | Desplaza al usuario hacia el objetivo y lo daña; luego empuja al objetivo tantas casillas como las recorridas + 1 (con daño de choque además del del skill). Sin obstáculos en la recta. Vale sobre aliados (sin daño). |
| ✅ inicial | Lanza del lago | Activo | Físico, Rayo | 3 PA | 2 – 7 | Tridente: `X.X.X / .XXX. / ..X..` (base en la casilla elegida, se abre alejándose) | 1 – 5, en línea recta | Sí | Sí | 1 por turno, 1 turno de recarga | Atrae 1 casilla hacia el lanzador | Atrae a los enemigos golpeados 1 casilla. |
| ✅ inicial | En guardia! | Activo, Buff | Físico | 3 PA | 2 – 2 | Círculo de 2 a tu alrededor | 0 | No | No | 1 por turno, 2 turnos de recarga | – | Escudo = 10 % de la vida máxima + nivel, hasta tu próximo turno. **Pasa el turno.** Al terminar tu turno se crea la zona (dura hasta tu próximo turno): el enemigo que entra recibe el daño y es empujado 2 casillas, una vez por enemigo. No hace daño al lanzarse. |
| ✅ | Eclipse | Activo | Ninguno | 2 PA + 2 PM | – | Todo el mapa | 64 | No | No | 5 turnos de recarga | – | Sin objetivo, efecto inmediato. Todos los enemigos pierden 6 de alcance en su próximo turno (mínimo 1). Necesita los 2 PM para lanzarse. |
| ✅ | Barrido | Activo | Físico, Hielo | 3 PA | 4 – 5 | Línea recta, área 3×1 | 1 – 5, en línea recta | No | Sí | 1 por turno | 30 % de quitar 1 PM durante 1 turno | Franja de 3 de lado (perpendicular al lanzador); se puede lanzar sobre una casilla vacía. |
| ✅ | Abrir las aguas | Activo | Físico, Hielo | 4 PA | 3 – 6 | T invertida: `..X.. / ..X.. / XXXXX` (centro de la barra en la casilla elegida; el palo se aleja del lanzador) | 0 – 5, en línea recta | No | Sí | 1 por turno, 2 turnos de recarga | Empuja 1 casilla | Daña y empuja 1 casilla a los enemigos, alejándolos del centro de la T. |
| ✅ | Lanza abisal | Activo | Físico, Hielo | 3 PA | 6 – 9 | Un objetivo | 1 – 3 | No | No | 1 por turno | +35 % de daño cuerpo a cuerpo | +35 % de daño si el enemigo está adyacente (las 4 casillas pegadas). |

## Reglas generales acordadas
- Daño por choque al empujar (todas las clases): 2 × casillas que faltaban + nivel del lanzador / 2, sin elemento; solo si choca.
- Recarga: «N turnos de recarga» = no se puede usar en los N turnos siguientes.
- «Físico, X»: el skill es del elemento X.
- Nivel 2–3 de cada skill: por ahora solo sube el daño.
