/*
 * Habilidades: [nombre, PA, alcance, mín, máx, tipo, símbolo, alcance mínimo, opciones].
 * Opciones: element (elemento), area ('cross'|'circle'|'cone'|'line') y size, push/pull (casillas),
 * value (valor del efecto), los:false (sin línea de visión), teleport, self (sobre sí mismo),
 * max: bonificación al llegar a rango 3 → {range:1}|{modifiable:true}|{crit:10}|{cost:-1}|{value:1}|{push:1}|{size:1}.
 */
export const classes = {
  // Valkyria (antes Guardián/Lancero). Las tres primeras son las de inicio. Física: escala con daño físico + su elemento.
  guardia: {name:'Valkyria', hp:58, initiative:10, skills:[
    ['Estocada',3,2,4,6,'push','➶',1,{element:'fire',inLine:true,burnChance:0,area:'line',size:2,push:2,los:false,casts:2,modifiable:false}],
    ['Lanza del lago',3,5,2,7,'pull','↢',1,{element:'lightning',area:'trident',inLine:true,pull:1,casts:1,cooldown:1,modifiable:true}],
    ['En guardia!',3,0,2,2,'guard','⛨',0,{area:'circle',size:2,los:false,casts:1,cooldown:2,modifiable:false,perRank:0,endsTurn:true}],
    ['Punzón',2,4,4,6,'damage','✧',1,{element:'physical',casts:2,lifesteal:25,modifiable:true}],
    ['Liberación',3,0,3,6,'push','✹',0,{element:'fire',burnChance:0,area:'circle',size:2,push:2,los:false,casts:1,modifiable:false}],
    ['Pies ligeros',2,0,0,0,'sprint','➝',0,{value:2,los:false,casts:1,cooldown:2,modifiable:false}],
    ['Balestra',3,6,2,9,'lunge','⇥',1,{element:'lightning',inLine:true,clearPath:true,anyTarget:true,casts:1,cooldown:1,modifiable:false}],
    ['Salto valiente',4,4,5,8,'leap','⤒',2,{element:'fire',burnChance:0,area:'circle',size:2,lifesteal:10,los:false,casts:1,cooldown:3,modifiable:false}],
    ['Carga heroica',3,5,2,8,'charge','⇶',1,{element:'lightning',inLine:true,clearPath:true,anyTarget:true,casts:1,cooldown:1,modifiable:false}],
    ['Abrir las aguas',3,5,3,6,'push','⊥',0,{element:'ice',area:'tee',size:2,push:1,pushFrom:'center',inLine:true,casts:1,cooldown:2,modifiable:false}],
    ['Lanza cargada',3,7,1,6,'damage','➹',1,{element:'lightning',inLine:'diagonal',crit:15,casts:2,stack:{value:1,turns:2,max:3},modifiable:false}],
    ['Barrido',3,5,4,5,'slow','⟷',1,{element:'ice',inLine:true,area:'wave',width:3,size:1,value:1,slowChance:30,casts:1,modifiable:false}],
    ['Lanza abisal',3,3,6,9,'damage','◆',1,{element:'ice',los:false,meleeBonus:35,casts:1,modifiable:false}],
    ['Eclipse',2,0,0,0,'eclipse','◐',0,{mpCost:2,value:6,los:false,casts:1,cooldown:5,modifiable:false}],
    ['Furia',2,0,0,0,'fury','✹',0,{element:'fire',burnChance:0,value:20,turns:2,los:false,casts:1,cooldown:4,modifiable:false}]
  ]},
  // Arquero: hoja nueva (docs/skills-arquero.md). «Veneno» = escala con daño caótico.
  tirador: {name:'Arquero', hp:31, initiative:14, skills:[
    ['Flecha helada',2,8,2,3,'slow','❄',2,{element:'ice',value:1,slowBonus:{chance:25,value:2},casts:2,modifiable:true}],
    ['Flecha Flamígera',3,9,5,7,'damage','➵',1,{element:'fire',burnChance:0,area:'line',size:3,inLine:true,friendly:true,recoil:1,casts:1,modifiable:false}],
    ['Detonadora',2,8,2,4,'detonate','✺',1,{element:'fire',burnChance:0,detonate:[3,5],perTarget:1,casts:2,modifiable:true}],
    ['Flecha Repelente',3,8,3,5,'push','➶',1,{element:'physical',push:2,casts:2,modifiable:true}],
    ['Ojo de águila',2,0,0,0,'reach','◉',0,{value:3,turns:2,los:false,casts:1,cooldown:3,modifiable:false}],
    ['Flecha venenosa',2,8,1,4,'curse','☠',1,{element:'chaos',value:1,casts:2,modifiable:true}],
    ['Dardo pestilente',2,8,2,4,'corrode','✣',1,{element:'chaos',value:25,poison:2,perTarget:1,casts:2,modifiable:true}]
    // Pendientes (docs/skills-arquero.md): Congelación prematura, Ramo helado, Tramposa, Expansión de dominio,
    // Contagio, Trampita, Flecha Explosiva, Flecha Rastreadora.
  ]},
  mistico: {name:'Clérigo', hp:36, initiative:12, skills:[
    ['Luz ardiente',2,4,5,8,'damage','✦',0,{element:'magic',max:{range:1}}],
    ['Restaurar',2,5,6,10,'heal','✚',0,{max:{range:1}}],
    ['Sello de fragilidad',1,4,1,3,'expose','✷',0,{element:'magic',value:3,max:{value:2}}],
    ['Purificar',2,3,3,6,'cleanse','❖',0,{max:{range:2}}],
    ['Escudo sagrado',2,4,0,0,'shield','⛨',0,{value:25,max:{value:10}}],
    ['Celeridad divina',2,4,0,0,'haste','➝',0,{value:2,max:{range:2}}],
    ['Juicio',3,5,5,8,'blast','✹',2,{element:'fire',area:'cross',max:{crit:15}}],
    ['Alba radiante',3,4,8,12,'heal','✚',0,{area:'cross',max:{cost:-1}}]
  ]},
  // Mago (rework): tres hechizos de inicio. Daños base bajos a propósito: escalan con el daño mágico
  // y su elemento (el Misil, con mágico y físico). Cada rango suma +1.
  mago: {name:'Mago', hp:30, initiative:13, skills:[
    ['Misil mágico',2,5,2,4,'damage','✦',1,{element:'magic',inLine:true,casts:2,scales:['magic','physical'],perRank:2,max:{crit:10}}],
    ['Bola de fuego',3,5,4,5,'blast','✹',2,{element:'fire',area:'cross',burnChance:20,casts:1,perRank:1,max:{burnChance:20}}],
    ['Escarcha',3,1,2,5,'slow','❄',1,{element:'ice',area:'wave',size:4,width:3,value:1,slowChance:50,casts:1,perRank:1,max:{slowChance:25}}]
  ]},
  sombra: {name:'Ninja', hp:35, initiative:15, skills:[
    ['Shuriken',2,5,5,8,'damage','✧',1,{element:'physical',max:{crit:15}}],
    ['Cuchilla envenenada',2,4,3,5,'venom','✧',0,{element:'chaos',value:3,max:{value:2}}],
    ['Paso de sombra',2,3,0,0,'dash','↢',1,{teleport:true,max:{range:1}}],
    ['Puñalada trasera',3,1,12,16,'damage','⚔',0,{element:'chaos',max:{crit:20}}],
    ['Bomba de humo',2,4,2,4,'slow','❄',0,{element:'chaos',area:'cross',value:1,max:{value:1}}],
    ['Kunai con cadena',2,5,4,6,'pull','↢',2,{element:'physical',pull:3,max:{range:1}}],
    ['Sustitución',2,5,0,0,'swap','↢',1,{max:{cost:-1}}],
    ['Corte glacial',2,2,5,8,'slow','❄',0,{element:'ice',value:2,max:{modifiable:true}}]
  ]}
};
/** Con cuántas habilidades empieza cada clase (el resto se aprende al subir de nivel). */
const startingSkills=3;
const skillRanks=id=>classes[id].skills.map((_,i)=>i<startingSkills?1:0);
const initialSkills=Object.fromEntries(Object.keys(classes).map(id=>[id,skillRanks(id)]));
export const skillOptions=skill=>skill?.[8]||{};
/** Bonificación de rango máximo, en texto. */
export function maxBonusText(skill){
  const bonus=skillOptions(skill).max||{};
  if(bonus.range)return '+'+bonus.range+' de alcance';
  if(bonus.modifiable)return 'el alcance pasa a ser modificable';
  if(bonus.crit)return '+'+bonus.crit+' % de crítico con esta habilidad';
  if(bonus.cost)return bonus.cost+' PA de coste';
  if(bonus.value)return '+'+bonus.value+' al efecto';
  if(bonus.push)return '+'+bonus.push+' casilla de empuje';
  if(bonus.size)return 'área o línea más grande (+'+bonus.size+')';
  if(bonus.burnChance)return '+'+bonus.burnChance+' % de probabilidad de quemar';
  if(bonus.slowChance)return '+'+bonus.slowChance+' % de probabilidad de ralentizar';
  if(bonus.casts)return '+'+bonus.casts+' lanzamiento por turno';
  return '';
}
export function skillFor(unit,index,preview=false){
  const base=classes[unit.classId]?.skills[index];
  const rank=unit.skillRanks?.[index]??initialSkills[unit.classId]?.[index]??0;
  if(!base||(!rank&&!preview))return null;
  const skill=[...base];
  const opts={...skillOptions(base)};
  skill[8]=opts;
  // Cada rango suma +2 de daño (+1 en las de área, que ya golpean a varios).
  const perRank=opts.perRank??(isAreaDamage(base)?1:2);
  if(rank>1&&skill[5]!=='dash'&&skill[4]>0){skill[3]+=(rank-1)*perRank;skill[4]+=(rank-1)*perRank;}
  if(rank>1&&skill[5]==='dash')skill[2]+=rank-1;
  // Cargas (Lanza cargada): +N de daño base por carga activa.
  const stacks=opts.stack?unit.stacks?.[base[0]]?.length||0:0;
  if(stacks){skill[3]+=stacks*opts.stack.value;skill[4]+=stacks*opts.stack.value;}
  if(rank>=3){
    const bonus=opts.max||{};
    if(bonus.range)skill[2]+=bonus.range;
    if(bonus.modifiable)opts.modifiable=true;
    if(bonus.crit)opts.crit=(opts.crit||0)+bonus.crit;
    if(bonus.cost)skill[1]=Math.max(1,skill[1]+bonus.cost);
    if(bonus.value)opts.value=(opts.value||0)+bonus.value;
    if(bonus.push){if(opts.push)opts.push+=bonus.push;if(opts.pull)opts.pull+=bonus.push;}
    if(bonus.size)opts.size=(opts.size||1)+bonus.size;
    if(bonus.burnChance)opts.burnChance=(opts.burnChance||0)+bonus.burnChance;
    if(bonus.slowChance)opts.slowChance=Math.min(100,(opts.slowChance||0)+bonus.slowChance);
    if(bonus.casts)opts.casts=(opts.casts||1)+bonus.casts;
  }
  return skill;
}
/** Tipos de daño. «Caótico» engloba venenos y magias oscuras. */
export const elements={physical:'Físico',magic:'Mágico',fire:'Fuego',ice:'Hielo',lightning:'Rayo',chaos:'Caótico'};
const damageKeys=Object.keys(elements);
/** Elementos propiamente dichos (los que suman a los hechizos además del daño mágico). */
const elementalKeys=['fire','ice','lightning','chaos'];
export function skillElement(unit,skill){
  const opts=skillOptions(skill);
  if(opts.element)return opts.element;
  if(skill[5]==='blast'||skill[6]==='✹')return 'fire';
  if(unit.classId==='mago'||unit.classId==='mistico')return 'magic';
  return 'physical';
}
/**
 * Escuela de una habilidad: «physical» (flechas, dagas, espadas, mazas…) o «magic» (hechizos).
 * Las de mago y clérigo son mágicas; el resto, físicas (aunque tengan un elemento, como Flecha ígnea).
 */
export function skillSchool(unit,skill){
  const opts=skillOptions(skill);
  if(opts.school)return opts.school;
  return unit.classId==='mago'||unit.classId==='mistico'?'magic':'physical';
}
/**
 * Bonus de daño de una habilidad:
 *  - físicas: solo el daño físico, sea cual sea su elemento;
 *  - mágicas: daño mágico + el de su elemento (fuego, hielo, rayo o caótico).
 */
/**
 * Daño al estilo Dofus:
 *   (tirada base + daño plano) × (1 + % de su escuela y elemento / 100)
 * Físico: % físico. Hechizos: % mágico + % de su elemento (fuego, hielo, rayo o caótico).
 */
export const LEVEL_DAMAGE=8;
export function damagePercent(unit,skill){
  const stats=unit.stats||{};
  // Escalado propio de la habilidad (p. ej. el Misil mágico: mágico + físico).
  const scales=skillOptions(skill).scales;
  if(scales)return scales.reduce((sum,key)=>sum+(stats[key]||0),0);
  // Escuela (físico o mágico) + su elemento, si lo tiene: Escarcha = mágico + hielo; Cuchilla envenenada = físico + caótico.
  const element=skillElement(unit,skill);
  const elemental=elementalKeys.includes(element)?stats[element]||0:0;
  if(skillSchool(unit,skill)==='physical')return (stats.physical||0)+elemental;
  return (stats.magic||0)+elemental;
}
/** Daño plano que se suma a la base (raro, de anillos y amuletos). */
export const flatDamage=unit=>unit.stats?.damage||0;
/** Daño de una tirada antes de armaduras y resistencias. */
export function scaledDamage(unit,skill,base,scale=1){
  const pe=passiveEffects(unit);
  const dealt=(pe.dealtAll||0)+(skillSchool(unit,skill)==='magic'?pe.dealtMagic||0:0);
  return Math.max(1,Math.floor((base+flatDamage(unit))*(1+damagePercent(unit,skill)/100)*(1+dealt/100)*furyBonus(unit)*scale));
}
/** Furia: +X % de daño final, multiplicado por (1 + % de fuego). Con +20 % de fuego, Furia 10 % da +12 %. */
export const furyBonus=unit=>unit?.effects?.fury?1+unit.effects.fury.value/100*(1+(unit.stats?.fire||0)/100):1;
/** Compatibilidad: cuánto añade el bonus a la media de la habilidad (para estimaciones). */
export function damageBonus(unit,skill){
  const average=(skill[3]+skill[4])/2;
  return scaledDamage(unit,skill,average)-average;
}
/** La armadura frena las habilidades físicas; los hechizos la atraviesan. */
const armorType=(unit,skill)=>skillSchool(unit,skill)==='physical'?'physical':skillElement(unit,skill);
export const modifiableRange=skill=>skillOptions(skill).modifiable??(skill[2]>1&&!['dash','swap'].includes(skill[5]));
/** Tipos de habilidad que se lanzan sobre aliados. */
export const supportKinds=['heal','cleanse','shield','haste','sprint','fury','eclipse','reach'];
/** Alcance extra para hechizos de alcance modificable: equipo + Ojo de águila. */
export const reachBonus=unit=>(unit.stats?.reach||0)+(unit.effects?.reach?.value||0);
/** ¿Se apunta a una casilla (área, teletransporte) en lugar de a una unidad? */
export const castsOnCell=skill=>!!skillOptions(skill).area||skill[5]==='dash'||skill[5]==='blast';
/** Tipos de objeto de equipo (el talismán ya no existe). */
export const slots = {weapon:'Arma',helmet:'Casco',armor:'Peto',gloves:'Guantes',belt:'Cinturón',boots:'Botas',ring:'Anillo',amulet:'Amuleto'};
/** Ranuras del personaje: como el tipo de objeto, pero con dos anillos. */
export const equipSlots = {weapon:'Arma',helmet:'Casco',amulet:'Amuleto',armor:'Peto',gloves:'Guantes',belt:'Cinturón',ring:'Anillo I',ring2:'Anillo II',boots:'Botas'};
/** Tipo de objeto que admite cada ranura. */
export const slotKind = key=>key==='ring2'?'ring':key;
/** Ranura donde se pone un objeto: los anillos van al primer hueco libre (o a la ranura pedida). */
export function equipTarget(p,item,wanted){
  if(item.slot!=='ring')return item.slot;
  if(wanted==='ring'||wanted==='ring2')return wanted;
  return !p.equipment.ring?'ring':!p.equipment.ring2?'ring2':'ring';
}
export const statNames = {...Object.fromEntries(Object.entries(elements).map(([key,name])=>[key,'Daño '+name.toLowerCase()])),
  vitality:'Vida',reach:'Alcance (habilidades modificables)',ward:'Armadura',critical:'Crítico',movement:'PM',action:'PA',
  leech:'Vampirismo',damage:'Daño (todos los tipos)'};
/** Estadísticas que se expresan en %: el daño por tipo, la armadura, el crítico y el vampirismo. */
export const percentStats=new Set([...Object.keys(elements),'ward','critical','leech']);
export const rarities = ['Normal','Poco común','Raro','Legendario'];
const bases = {
  weapon:['Arco de tejo','Sable de cobre','Cetro de ónice','Lanza de vigía'],
  helmet:['Yelmo del centinela','Capucha del eco','Corona de hollín'],
  armor:['Coraza de escamas','Manto de ceniza','Jubón reforzado'],   // el peto
  gloves:['Guantes de bruma','Guanteletes del vigía','Mitones de púas'],
  belt:['Cinturón del peregrino','Faja de cuero rojo','Cinto de eslabones'],
  boots:['Botas del umbral','Grebas de bronce','Botas de arena'],
  ring:['Anillo de obsidiana','Sello de cobre','Sortija de sal'],
  amulet:['Amuleto de luna','Colgante de ámbar','Lágrima del alba']
};
const actionWeapons=new Set(['Cetro de ónice','Lanza de vigía']);
/**
 * Modificadores al estilo Diablo 2 / Path of Exile.
 * Afijos (prefijos, delante del nombre) y sufijos ("del…"). Cada tier tiene
 * un nivel mínimo de objeto (ilvl), un rango de valores, un nombre y un peso.
 */
export const affixes={
  prefix:{
    physical:[[1,4,6,'Cortante'],[2,6,9,'Brutal'],[3,9,13,'Implacable'],[5,13,17,'Feroz'],[7,17,22,'Letal'],[11,22,28,'Devastador'],[16,28,35,'Aniquilador'],[21,35,44,'Apocalíptico']],
    fire:[[1,4,6,'Humeante'],[2,6,9,'Ardiente'],[3,9,13,'Candente'],[5,13,17,'Infernal'],[7,17,22,'Calcinante'],[11,22,28,'Volcánico'],[16,28,35,'Solar'],[21,35,44,'Primordial']],
    ice:[[1,4,6,'Invernal'],[2,6,9,'Polar'],[3,9,13,'Glacial'],[5,13,17,'Boreal'],[7,17,22,'Hiemal'],[11,22,28,'Ártico'],[16,28,35,'Perpetuo'],[21,35,44,'Absoluto']],
    magic:[[1,4,6,'Brillante'],[2,6,9,'Estelar'],[3,9,13,'Astral'],[5,13,17,'Celestial'],[7,17,22,'Sideral'],[11,22,28,'Cósmico'],[16,28,35,'Divino'],[21,35,44,'Infinito']],
    lightning:[[1,4,6,'Chispeante'],[2,6,9,'Eléctrico'],[3,9,13,'Crepitante'],[5,13,17,'Tormentoso'],[7,17,22,'Fulminante'],[11,22,28,'Tronante'],[16,28,35,'Huracanado'],[21,35,44,'del Trueno Eterno']],
    chaos:[[1,4,6,'Lúgubre'],[2,6,9,'Sepulcral'],[3,9,13,'Umbral'],[5,13,17,'Abisal'],[7,17,22,'Espectral'],[11,22,28,'Abismal'],[16,28,35,'Insondable'],[21,35,44,'Primigenio']],
    ward:[[1,3,5,'Firme'],[3,5,8,'Resistente'],[5,8,11,'Inquebrantable'],[7,11,14,'Impenetrable'],[13,14,18,'Colosal'],[19,18,23,'Inmortal']],
    // Daño plano pequeño (se suma a la base de cualquier habilidad). Raro: solo anillos y amuletos.
    damage:[[1,1,1,'Afilado'],[9,2,2,'Templado'],[17,3,3,'Magistral']]
  },
  suffix:{
    vitality:[[1,3,5,'del Zorro'],[2,5,8,'del Oso'],[3,8,12,'de la Ballena'],[5,12,16,'del Coloso'],[7,16,22,'del Titán'],[11,22,30,'del Leviatán'],[16,30,40,'del Behemot'],[21,40,52,'de los Dioses']],
    critical:[[1,3,5,'del Halcón'],[2,5,8,'del Cazador'],[4,8,11,'del Asesino'],[6,11,15,'del Verdugo'],[11,15,19,'de la Carnicería'],[17,19,24,'del Apocalipsis']],
    reach:[[3,1,1,'del Vigía'],[9,2,2,'del Horizonte']],
    movement:[[1,1,1,'de la Liebre'],[7,2,2,'del Viento']],
    action:[[3,1,1,'del Erudito']],
    // Vampirismo «omni»: recupera un % de todo el daño que haces (cualquier tipo). Solo en armas.
    leech:[[2,1,1,'del Murciélago'],[6,2,2,'de la Sanguijuela'],[11,3,3,'del Vampiro'],[16,4,4,'del Strigoi'],[21,5,5,'del Nosferatu']]
  }
};
const elementsAll=['physical','magic','fire','ice','lightning','chaos'];
/**
 * Qué puede salir en cada pieza:
 * - Daño (prefijos elementales y físico): solo en armas, anillos y amuletos.
 * - Armadura: solo en casco, guantes, botas y peto.
 * - Las armas nunca llevan armadura ni vida.
 */
const slotAffixes={
  weapon:{prefix:elementsAll,suffix:['critical','action','leech']},
  helmet:{prefix:['ward'],suffix:['vitality','critical','reach']},
  armor:{prefix:['ward'],suffix:['vitality','critical']},
  gloves:{prefix:['ward'],suffix:['critical','vitality']},
  belt:{prefix:[],suffix:['vitality','critical']},
  boots:{prefix:['ward'],suffix:['movement','vitality']},
  ring:{prefix:[...elementsAll,'damage'],suffix:['critical','vitality']},
  amulet:{prefix:[...elementsAll,'damage'],suffix:['action','vitality','critical']},
  charm:{prefix:elementsAll,suffix:['critical','vitality']}   // solo para talismanes antiguos
};
const rareFirst=['Lamento','Colmillo','Susurro','Ruina','Presagio','Garra','Aullido','Eco','Lamento','Fauces','Maldición','Grito'];
const rareSecond=['sombrío','de hueso','carmesí','del ocaso','funesto','de la cripta','errante','voraz','silente','de ceniza','eterno','roto'];
const legendaryNames=['La Última Brasa','Juramento del Umbral','El Ojo Insomne','Lágrima de Tusi','Promesa Rota','Corona del Rey Caído',
  'Fauces del Abismo','Canción de Ceniza','El Vigía Eterno','Pacto de Sangre','Aliento del Oráculo','Silencio del Osario'];
/**
 * Gemas (al estilo de Diablo II): cada tipo da un stat y su calidad sube con el nivel del objeto.
 * Calidades: dañada, astillada, completa, impecable y excelente.
 */
export const gemQualities=[
  {name:['dañado','dañada'],ilvl:1},{name:['astillado','astillada'],ilvl:5},{name:['completo','completa'],ilvl:10},
  {name:['impecable','impecable'],ilvl:15},{name:['excelente','excelente'],ilvl:21}
];
export const gems={
  ruby:{name:'Rubí',female:false,stat:'vitality',values:[5,10,16,23,32],colors:['#c8213a','#ff8a9a','#6e0f22']},
  garnet:{name:'Granate',female:false,stat:'fire',values:[4,8,12,16,22],colors:['#d4561e','#ffb27a','#7a2a10']},
  sapphire:{name:'Zafiro',female:false,stat:'ice',values:[4,8,12,16,22],colors:['#2a5fd0','#9cc4ff','#122e70']},
  topaz:{name:'Topacio',female:false,stat:'lightning',values:[4,8,12,16,22],colors:['#e3b422','#fff1a0','#7a5a0e']},
  amethyst:{name:'Amatista',female:true,stat:'magic',values:[4,8,12,16,22],colors:['#8a4fd8','#dcb8ff','#43206e']},
  emerald:{name:'Esmeralda',female:true,stat:'chaos',values:[4,8,12,16,22],colors:['#1f9d55','#8ff0b4','#0c4d28']},
  onyx:{name:'Ónice',female:false,stat:'physical',values:[4,8,12,16,22],colors:['#4a4a55','#b7b7c4','#16161c']},
  diamond:{name:'Diamante',female:false,stat:'ward',values:[3,6,9,12,16],colors:['#cfe6ef','#ffffff','#7b98a6']},
  tigereye:{name:'Ojo de tigre',female:false,stat:'critical',values:[2,4,6,8,10],colors:['#b9782a','#ffd28a','#5a3510']}
};
/** Calidad de gema (0–4) para un nivel de objeto. */
export const gemQuality=ilvl=>gemQualities.reduce((q,info,i)=>ilvl>=info.ilvl?i:q,0);
export function makeGem(id,type,quality){
  const gem=gems[type],q=Math.max(0,Math.min(gemQualities.length-1,quality));
  return {id,name:gem.name+' '+gemQualities[q].name[gem.female?1:0],kind:'rune',gem:type,quality:q,ilvl:gemQualities[q].ilvl,
    price:6+5*q,stats:{[gem.stat]:gem.values[q]}};
}
const pick = (values,rng) => values[Math.floor(rng()*values.length)];
const roll = (low,high,rng) => low+Math.floor(rng()*(high-low+1));
const randomSeed = rng => (rng()*4294967296)>>>0;
/** Generador del mapa (mulberry32): semillas cercanas dan salas muy distintas. */
function floorRandom(seed) {
  return () => {
    seed=(seed+0x6D2B79F5)>>>0;
    let t=seed;
    t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}
/** Elige con pesos: [[valor,peso],...]. */
function weighted(entries,rng){
  const total=entries.reduce((sum,[,w])=>sum+w,0);
  let r=rng()*total;
  for(const [value,w] of entries){if((r-=w)<0)return value;}
  return entries.at(-1)[0];
}
const tierWeights=[100,45,22,11,5,3,2,1];
/**
 * Tier de un modificador: solo los que el ilvl permite. Un tier recién
 * desbloqueado es raro; con cada nivel por encima de su mínimo, los tiers
 * antiguos pierden peso y los altos se vuelven proporcionalmente más comunes.
 */
function rollTier(tiers,ilvl,rng){
  const options=tiers.map((tier,i)=>[i,tier[0]<=ilvl?tierWeights[i]*Math.pow(.62,ilvl-tier[0]):0]).filter(([,w])=>w>0);
  return weighted(options,rng);
}
/** Rareza según el nivel del objeto y la suerte extra (élite, eventos). */
function rollRarity(ilvl,bonus,rng,minGrade=0){
  // Raros y legendarios algo más escasos (~25 % menos que antes).
  const weights=[60,30,6+ilvl*1.65,.7+ilvl*.8].map((w,i)=>i<minGrade?0:w*(i>=2?1+bonus*3:1));
  return weighted(weights.map((w,i)=>[i,w]),rng);
}
export const itemLevel=(s,extra=0)=>Math.max(1,s.floor+extra);
/** Runas engarzadas en un objeto (los objetos antiguos tenían una sola en «socket»). */
export function runesOf(item){return item?.runes||(item?.socket?[item.socket]:[]);}
/** Huecos de runa de un objeto (antiguos: 1). */
export function socketsOf(item){return item?.sockets??1;}
export const MAX_SOCKETS=2;
/** Huecos al generar: 0, 1 o 2 (este último raro); los objetos mejores traen más a menudo. */
function rollSockets(grade,rng){
  const table=[[70,27,3],[55,38,7],[42,47,11],[28,54,18]][grade];
  return weighted(table.map((w,i)=>[i,w]),rng);
}
/**
 * Legendarios: muy de vez en cuando un afijo «ascendido» sale con tiers de niveles superiores
 * a los del objeto (aunque sea de nivel bajo).
 */
function tierLevel(grade,level,rng){
  return grade===3&&rng()<.03?level+4+Math.floor(rng()*9):level;
}
/** Afijos (prefijos) y sufijos que puede llevar un objeto concreto. */
function affixPool(slot,base){
  return {prefix:[...slotAffixes[slot].prefix],suffix:slotAffixes[slot].suffix.filter(stat=>stat!=='action'||(slot==='amulet'||actionWeapons.has(base)))};
}
/**
 * Si una pieza tiene pocos prefijos o sufijos posibles (p. ej. un casco no tiene prefijos),
 * los huecos que no se pueden llenar pasan al otro tipo.
 */
function balanceCounts([pre,suf],pool,level){
  const room=type=>pool[type].filter(stat=>affixes[type][stat].some(tier=>tier[0]<=level)).length;
  // Como mucho 2 prefijos y 2 sufijos.
  const maxPre=Math.min(2,room('prefix')),maxSuf=Math.min(2,room('suffix'));
  let p=Math.min(pre,maxPre),q=Math.min(suf,maxSuf),spare=pre+suf-p-q;
  while(spare>0&&(p<maxPre||q<maxSuf)){if(q<maxSuf)q++;else p++;spare--;}
  return [p,q];
}
/** Tira un modificador nuevo de un tipo, evitando los stats que ya lleva. */
function rollMod(type,slot,base,level,taken,rng,grade=0){
  const available=affixPool(slot,base)[type].filter(stat=>!taken.includes(stat)&&affixes[type][stat].some(tier=>tier[0]<=level));
  if(!available.length)return null;
  const stat=pick(available,rng);
  const reach=tierLevel(grade,level,rng);
  const tierIndex=rollTier(affixes[type][stat],reach,rng);
  const [,low,high,label]=affixes[type][stat][tierIndex];
  return {type,stat,tier:tierIndex+1,tiers:affixes[type][stat].length,value:roll(low,high,rng),label,...(affixes[type][stat][tierIndex][0]>level?{ascended:true}:{})};
}
/** Recalcula stats, nombre y precio de un objeto a partir de sus modificadores. */
function refreshItem(item,rng,wasGrade=item.grade){
  const stats={};
  for(const mod of item.affixes)stats[mod.stat]=(stats[mod.stat]||0)+mod.value;
  item.stats=stats;
  item.rarity=rarities[item.grade];
  const prefix=item.affixes.find(m=>m.type==='prefix')?.label;
  const suffix=item.affixes.find(m=>m.type==='suffix')?.label;
  // Normales y poco comunes se llaman por sus afijos; raros y legendarios conservan su nombre (uno nuevo al subir de grado).
  if(item.grade<2)item.name=[item.base,prefix?.toLowerCase(),suffix].filter(Boolean).join(' ');
  else if(item.grade!==wasGrade)item.name=item.grade===3?pick(legendaryNames,rng):pick(rareFirst,rng)+' '+pick(rareSecond,rng);
  item.price=5+item.grade*8+item.affixes.reduce((sum,m)=>sum+m.tier*2,0)+item.ilvl+socketsOf(item)*4;
  return item;
}
export function rollItem(s,rng,{bonus=0,gear=false,ilvl,minGrade=0}={}) {
  const itemId = ++s.itemId;
  const level=ilvl??itemLevel(s);
  if (!gear&&!minGrade&&rng()<.22) {
    // A veces sale una calidad por debajo de la que toca por nivel.
    const quality=Math.max(0,gemQuality(level)-(rng()<.3?1:0));
    return makeGem(itemId,pick(Object.keys(gems),rng),quality);
  }
  const slot=pick(Object.keys(slots),rng);
  const base=pick(bases[slot],rng);
  const grade=rollRarity(level,bonus,rng,minGrade);
  const pool=affixPool(slot,base);
  const counts=balanceCounts([rng()<.5?[1,0]:[0,1],[1,1],rng()<.5?[2,1]:[1,2],[2,2]][grade],pool,level);
  const mods=[];
  for(const [type,count] of [['prefix',counts[0]],['suffix',counts[1]]]){
    for(let i=0;i<count;i++){
      const available=pool[type].filter(stat=>affixes[type][stat].some(tier=>tier[0]<=level));
      if(!available.length)break;
      const stat=pick(available,rng);
      pool[type].splice(pool[type].indexOf(stat),1);
      const tierIndex=rollTier(affixes[type][stat],tierLevel(grade,level,rng),rng);
      const [,low,high,label]=affixes[type][stat][tierIndex];
      mods.push({type,stat,tier:tierIndex+1,tiers:affixes[type][stat].length,value:roll(low,high,rng),label,...(affixes[type][stat][tierIndex][0]>level?{ascended:true}:{})});
    }
  }
  const stats={};
  for(const mod of mods)stats[mod.stat]=(stats[mod.stat]||0)+mod.value;
  const prefix=mods.find(m=>m.type==='prefix')?.label;
  const suffix=mods.find(m=>m.type==='suffix')?.label;
  const name=grade===3?pick(legendaryNames,rng):grade===2?pick(rareFirst,rng)+' '+pick(rareSecond,rng):
    [base,prefix?.toLowerCase(),suffix].filter(Boolean).join(' ');
  const price=5+grade*8+mods.reduce((sum,m)=>sum+m.tier*2,0)+level;
  const sockets=rollSockets(grade,rng);
  return {id:itemId,name,base,kind:'gear',slot,rarity:rarities[grade],grade,ilvl:level,affixes:mods,stats,price:price+sockets*4,sockets,runes:[]};
}
// ───────────── Forja ─────────────
/** Operaciones de la forja y su multiplicador de precio. */
export const forgeModes={
  reroll:{name:'Re-tirar todo',text:'Vuelve a tirar todos sus PREFIJOS y SUFIJOS (misma rareza y nivel).',factor:1},
  prefix:{name:'Re-tirar prefijos',text:'Vuelve a tirar solo los PREFIJOS; los sufijos se quedan igual.',factor:1.35},
  suffix:{name:'Re-tirar sufijos',text:'Vuelve a tirar solo los SUFIJOS; los prefijos se quedan igual.',factor:1.35},
  upgrade:{name:'Mejorar rareza',text:'Sube un grado de rareza y añade el prefijo o sufijo que le corresponde.',factor:2.6},
  socket:{name:'Añadir hueco',text:'Abre un hueco más para gemas (máximo 2).',factor:1.8},
  polish:{name:'Pulir',text:'Sube un tier un PREFIJO o SUFIJO al azar (de los que aún pueden mejorar).',factor:1.6}
};
/** Modificadores de un objeto que todavía pueden subir de tier. */
// Como mucho hasta tiers de 6 niveles por encima del objeto (no se puede llevar un objeto de nivel 1 al tier máximo).
export const polishable=item=>(item?.affixes||[]).filter(mod=>{
  const tiers=affixes[mod.type]?.[mod.stat];
  return tiers&&mod.tier<tiers.length&&tiers[mod.tier][0]<=(item.ilvl||1)+6;
});
/** Precio de una operación de forja: crece con el nivel y la rareza del objeto. */
export function forgeCost(item,mode){
  const base=12+item.ilvl*3+item.grade*10;
  // Mejorar rareza: subir un objeto normal es barato; cada grado siguiente cuesta bastante más.
  const avgTier=item.affixes?.length?item.affixes.reduce((sum,m)=>sum+m.tier,0)/item.affixes.length:1;
  const factor=mode==='upgrade'?[1.1,2.2,3.2][item.grade]??3.2:mode==='polish'?1.2+.3*avgTier:forgeModes[mode]?.factor||1;
  return Math.round(base*factor);
}
/** ¿Se puede hacer esta operación sobre este objeto? Devuelve el motivo si no. */
export function forgeBlock(item,mode){
  if(!item||item.kind!=='gear')return 'Solo se forja equipo.';
  if(mode==='upgrade'&&item.grade>=3)return 'Ya es legendario.';
  if(mode==='socket'&&socketsOf(item)>=MAX_SOCKETS)return 'Ya tiene el máximo de huecos ('+MAX_SOCKETS+').';
  if(mode==='prefix'&&!item.affixes.some(m=>m.type==='prefix'))return 'No tiene prefijos.';
  if(mode==='suffix'&&!item.affixes.some(m=>m.type==='suffix'))return 'No tiene sufijos.';
  if(mode==='polish'&&!polishable(item).length)return 'Todos sus modificadores ya están en su tier máximo.';
  return null;
}
function forgeItem(item,mode,rng){
  const level=item.ilvl,wasGrade=item.grade;
  const reroll=type=>{
    const count=item.affixes.filter(m=>m.type===type).length;
    const kept=item.affixes.filter(m=>m.type!==type);
    const taken=kept.map(m=>m.stat),fresh=[];
    for(let i=0;i<count;i++){const mod=rollMod(type,item.slot,item.base,level,[...taken,...fresh.map(m=>m.stat)],rng,item.grade);if(mod)fresh.push(mod);}
    item.affixes=[...kept,...fresh].sort((a,b)=>a.type===b.type?0:a.type==='prefix'?-1:1);
  };
  if(mode==='socket'){
    item.runes=runesOf(item);delete item.socket;
    item.sockets=Math.min(MAX_SOCKETS,socketsOf(item)+1);
    item.price+=4;
    return item;
  }
  if(mode==='polish'){
    // Pulir: un modificador al azar sube un tier y vuelve a tirar su valor en el rango nuevo.
    const mod=pick(polishable(item),rng);
    const tiers=affixes[mod.type][mod.stat];
    const [need,low,high,label]=tiers[mod.tier];
    mod.tier++;mod.value=roll(low,high,rng);mod.label=label;
    if(need>level)mod.ascended=true;
  }
  else if(mode==='reroll'){reroll('prefix');reroll('suffix');}
  else if(mode==='prefix')reroll('prefix');
  else if(mode==='suffix')reroll('suffix');
  else if(mode==='upgrade'){
    // Grados: normal 1 mod, poco común 1+1, raro 2+1 (o 1+2), legendario 2+2.
    const count=type=>item.affixes.filter(m=>m.type===type).length;
    item.grade++;
    const types=['prefix','suffix'].filter(type=>count(type)<(item.grade===1?1:2));
    const order=types.sort((a,b)=>count(a)-count(b)||rng()-.5);
    // Si la pieza no admite más de ese tipo (p. ej. un casco no tiene prefijos), se prueba con el otro.
    const fallback=['prefix','suffix'].filter(type=>!order.includes(type)&&count(type)<2);
    for(const type of [...order,...fallback]){
      const mod=rollMod(type,item.slot,item.base,level,item.affixes.map(m=>m.stat),rng,item.grade);
      if(mod){item.affixes.push(mod);break;}
    }
    item.affixes.sort((a,b)=>a.type===b.type?0:a.type==='prefix'?-1:1);
  }
  return refreshItem(item,rng,wasGrade);
}
function startForge(s){
  s.floor++;
  for(const p of s.players)p.level=s.floor;
  s.phase='forge';
  s.vote=null;
  s.event=null;
  s.ready=[];
  noTimer(s);
  note(s,'Piso '+s.floor+' · Forja del herrero.');
}
const legacyStat={arcane:'magic',shadow:'chaos'};
/** Estadísticas de un héroe a partir de su equipo, su pasiva y su nivel (también fuera de combate). */
export function heroStats(p,level=p.level||1){
  const stats=sumStats(p.equipment);
  // Cada nivel: +8 % de daño de todos los tipos.
  for(const key of damageKeys)stats[key]+=LEVEL_DAMAGE*(level-1);
  // Pasiva del mazo.
  const pe=passiveEffects(p);
  stats.critical+=pe.critical||0;stats.ward+=pe.ward||0;stats.reach+=pe.reach||0;stats.movement+=pe.movement||0;
  // Bendiciones (o maldiciones) permanentes de los eventos.
  const b=p.boons||{};
  for(const key of damageKeys)stats[key]+=5*(b.power||0);   // cada punto de «poder»: +5 % de daño
  stats.vitality+=b.vitality||0;stats.critical+=b.critical||0;stats.ward+=4*(b.ward||0);
  const max=Math.max(1,Math.round((classes[p.classId].hp+stats.vitality+(level-1)*4)*(1+(pe.maxHpPct||0)/100)));
  return {stats,max,initiative:classes[p.classId].initiative};
}
function sumStats(equipment) {
  const totals=Object.fromEntries(Object.keys(statNames).map(key=>[key,0]));
  for (const gear of Object.values(equipment)) {
    for (const stats of [gear.stats,...runesOf(gear).map(r=>r.stats||{})]) {
      for (const [raw,value] of Object.entries(stats)){
        const key=legacyStat[raw]||raw;
        if(!Object.hasOwn(totals,key))continue;
        if(key==='movement'&&gear.slot!=='boots')continue;
        if(key==='reach'&&gear.slot!=='helmet')continue;
        if(key==='action'&&gear.slot!=='amulet'&&!(gear.slot==='weapon'&&actionWeapons.has(gear.base||gear.name)))continue;
        totals[key]+=value;
      }
    }
  }
  return totals;
}
export function create() {
  return {phase:'lobby', floor:0, rounds:0, width:12,height:8,players:[],units:[],walls:[],voids:[],glyphs:[],
    water:[],traps:[],log:[],events:[],seq:0,itemId:0,turn:0,deadline:0,turnStarted:0,picks:[],offers:{},stock:[],training:false,
    route:null,node:null,vote:null,event:null,pending:{},mods:{},ready:[]};
}
const alive = unit => unit.hp>0;
const fail = message => {throw new Error(message);};
const note = (s,text) => {s.log=[text,...s.log].slice(0,14);};
function emit(s,event) {
  s.events.push({...event,seq:++s.seq,floor:s.floor});
  if (s.events.length>96) s.events.shift();
}
// ───────────── Colores de jugador y maestrías ─────────────
/** El color depende del puesto en la sala, no de la clase: J1 rojo, J2 azul, J3 verde, J4 amarillo. */
export const playerColors=[
  {id:'red',name:'Rojo',hex:'#e5484d',dark:'#7a1f24',light:'#ff9a9e'},
  {id:'blue',name:'Azul',hex:'#3e7bfa',dark:'#1b3a80',light:'#9dbcff'},
  {id:'green',name:'Verde',hex:'#46a758',dark:'#1d5a2a',light:'#a3e0ae'},
  {id:'yellow',name:'Amarillo',hex:'#f5c542',dark:'#7a5a10',light:'#ffe49a'}
];
// ───────────── Cartas (sustituyen a las maestrías) ─────────────
/**
 * Cada clase tiene cartas activas (sus habilidades) y pasivas. Antes de la partida se equipa un mazo:
 * 3 activas y 1 pasiva (+1 hueco de activa que se compra con Esquirlas). Las 3 primeras activas de
 * cada clase vienen de inicio; el resto se compran en la tienda de Esquirlas.
 */
export const ACTIVE_SLOTS=3,MAX_ACTIVE_SLOTS=4,EXTRA_SLOT_PRICE=1000;
/** Huecos de pasiva: 1, y un 2.º muy caro. */
export const PASSIVE_SLOTS=1,MAX_PASSIVE_SLOTS=2,PASSIVE_SLOT_PRICE=2500;
const slug=text=>String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
/** Pasivas por clase: cambian cómo se juega (siempre con un coste). */
export const passiveCards={
  mago:[{id:'mago.furia-magica',name:'Furia mágica',text:'Recibes un 30 % más de daño físico, pero haces un 15 % más de daño mágico.',price:600,effects:{takenPhysical:30,dealtMagic:15}}],
  guardia:[{id:'guardia.baluarte',name:'Baluarte',text:'+15 % de vida máxima, pero −1 PM.',price:500,effects:{maxHpPct:15,movement:-1}}],
  tirador:[{id:'tirador.ojo-de-halcon',name:'Ojo de halcón',text:'+1 de alcance en las habilidades de alcance modificable, pero −15 % de vida máxima.',price:500,effects:{reach:1,maxHpPct:-15}}],
  mistico:[{id:'mistico.fe-ardiente',name:'Fe ardiente',text:'Tus curas curan un 25 % más, pero haces un 10 % menos de daño.',price:500,effects:{healPct:25,dealtAll:-10}}],
  sombra:[{id:'sombra.sombra-letal',name:'Sombra letal',text:'+12 % de crítico, pero −15 % de armadura.',price:500,effects:{critical:12,ward:-15}}]
};
/** Catálogo completo de cartas. */
export const cards=Object.fromEntries(Object.entries(classes).flatMap(([classId,cls])=>[
  ...cls.skills.map((skill,index)=>{
    const id=classId+'.'+slug(skill[0]);
    return [id,{id,classId,kind:'active',index,name:skill[0],starter:index<ACTIVE_SLOTS,price:index<ACTIVE_SLOTS?0:250+(index-ACTIVE_SLOTS)*75}];
  }),
  ...(passiveCards[classId]||[]).map(card=>[card.id,{...card,classId,kind:'passive',starter:false}])
]));
export const starterCards=Object.values(cards).filter(c=>c.starter).map(c=>c.id);
/** Mazo por defecto de una clase: sus 3 activas de inicio, sin pasiva. */
export const defaultLoadout=classId=>({actives:Object.values(cards).filter(c=>c.classId===classId&&c.starter).map(c=>c.id),passives:[]});
/**
 * Mazo válido: solo cartas de esa clase que se tengan, hasta los huecos disponibles y al menos una activa.
 * owned: lista de cartas compradas (las de inicio siempre se tienen); null = sin cuenta (solo las de inicio).
 */
export function cleanLoadout(classId,loadout,owned=null,slots=ACTIVE_SLOTS,passiveSlots=PASSIVE_SLOTS){
  const have=new Set([...starterCards,...(owned||[])]);
  const fit=id=>cards[id]&&cards[id].classId===classId&&have.has(id);
  const actives=[...new Set((loadout?.actives||[]).filter(id=>fit(id)&&cards[id].kind==='active'))].slice(0,Math.min(MAX_ACTIVE_SLOTS,slots));
  // «passive» (una sola) es el formato antiguo; ahora «passives» es una lista.
  const wanted=loadout?.passives||(loadout?.passive?[loadout.passive]:[]);
  const passives=[...new Set(wanted.filter(id=>fit(id)&&cards[id].kind==='passive'))].slice(0,Math.min(MAX_PASSIVE_SLOTS,passiveSlots));
  return actives.length?{actives,passives}:{...defaultLoadout(classId),passives};
}
/** Efectos sumados de las pasivas de un jugador o una unidad. */
export function passiveEffects(unit){
  const total={};
  for(const id of unit?.passives||[])for(const [key,value] of Object.entries(cards[id]?.effects||{}))total[key]=(total[key]||0)+value;
  return total;
}
/** Rangos iniciales según el mazo: las activas equipadas empiezan aprendidas (rango 1). */
function ranksFor(classId,loadout){
  const equipped=new Set(loadout.actives.map(id=>cards[id].index));
  return classes[classId].skills.map((_,i)=>equipped.has(i)?1:0);
}
/**
 * Entrar en la sala. extra.loadouts: mazos por clase ya validados (los pone el servidor desde la cuenta;
 * sin cuenta, los de inicio).
 */
export function join(s,id,name,classId,extra={}) {
  if(s.phase!=='lobby'||s.players.length>=4) fail('La sala no admite más jugadores.');
  if(!Object.hasOwn(classes,classId)) fail('Elige una clase válida.');
  const used=new Set(s.players.map(p=>p.color));
  const color=playerColors.find(c=>!used.has(c.id)).id;
  const player={id,name:String(name||'Aventurero').trim().slice(0,22)||'Aventurero',classId,bag:[],equipment:{},
    gold:0,level:1,xp:0,skillRanks:[],trained:true,color,loadouts:extra.loadouts||{},passives:[],account:extra.account||null};
  lobbyLoadout(player);
  s.players.push(player);
}
/** Saca a un jugador de la sala de espera (se fue, cerró la pestaña o volvió a entrar). */
export function leave(s,id){
  if(s.phase!=='lobby')return false;
  const before=s.players.length;
  s.players=s.players.filter(p=>p.id!==id);
  return s.players.length<before;
}
/** Aplica el mazo de la clase elegida: habilidades iniciales y pasiva. */
function lobbyLoadout(player){
  const loadout=player.loadouts?.[player.classId]||defaultLoadout(player.classId);
  player.skillRanks=ranksFor(player.classId,loadout);
  player.passives=[...(loadout.passives||[])];
  player.gold=0;
}
/** Puntos de cuenta al terminar la partida: según lo lejos que se llegó. */
export function runPoints(summary){
  const floor=Math.max(0,Math.min(TOTAL_FLOORS,Math.floor(Number(summary.floor)||0)));
  const kills=Math.max(0,Math.min(6,Math.floor(Number(summary.bossKills)||0)));
  const acts=Math.max(0,actOf(floor)-1)+(summary.won?1:0);
  // Esquirlas: 10 por piso, 40 por jefe, 100 por acto superado y 300 por ganar.
  return floor*10+kills*40+acts*100+(summary.won?300:0);
}
export const monsterNames={slime:'Limo',bat:'Murciélago',skull:'Calavera flotante',worm:'Gusano de cripta',slimeking:'Limo colosal',
  skeleton:'Esqueleto',succubus:'Súcubo',vampire:'Vampiro',imp:'Diablillo',slug:'Babosa',plant:'Planta escupidora',lavaslime:'Limo de lava'};
/**
 * Pisos de cada acto. El jefe intermedio está a mitad del acto y el final en el último piso:
 * acto 1 → 4 y 8; acto 2 → 5 y 10 (una sala más antes de cada jefe); acto 3 → 6 y 12 (dos más).
 */
export const ACTS=3,ACT_FLOORS=[8,10,12];
export const TOTAL_FLOORS=ACT_FLOORS.reduce((a,b)=>a+b,0);
/** Último piso del acto anterior (el acto empieza en actStart+1). */
export const actStart=act=>ACT_FLOORS.slice(0,act-1).reduce((a,b)=>a+b,0);
export const actLength=act=>ACT_FLOORS[act-1];
export const midBossFloor=act=>ACT_FLOORS[act-1]/2;
export const actOf=floor=>{let act=1;while(act<ACTS&&Math.max(1,floor)>actStart(act+1))act++;return act;};
export const actFloor=floor=>floor-actStart(actOf(floor));
export const actNames=['La Mazmorra','La Jungla','El Infierno'];
/** Ambientación de cada acto: mazmorra oscura, jungla y infierno. */
export const actBiomes=['crypt','jungle','hell'];
/** Fauna de cada acto: cuerpo a cuerpo, a distancia, élite y refuerzo de élite. */
const fauna=[
  {melee:['skeleton','slime'],ranged:['skull'],elite:'worm',extra:'slimeking'},
  {melee:['slug','bat'],ranged:['plant'],elite:'slimeking',extra:'slug'},
  {melee:['lavaslime','vampire'],ranged:['imp','succubus'],elite:'lavaslime',extra:'vampire'}
];
/** Jefes: dos por acto (a mitad y al final), con sus poderes. */
export const bosses={
  cerberus:{name:'Cancerbero',act:2,range:1,initiative:18,hp:1.05,powers:'Embestida sobre el héroe más lejano y aullido que resta PM a todo el grupo.'},
  oracle:{name:'Oráculo de Ceniza',act:3,range:4,initiative:16,hp:1,glyphs:['damage','poison'],element:'fire',powers:'Glifos de brasas y veneno, y mirada ardiente a distancia.'},
  skeletonking:{name:'Rey Osario',act:1,range:1,initiative:12,hp:1.1,powers:'Invoca esqueletos y se protege con un escudo de huesos mientras viven.'},
  umbralking:{name:'Rey del Umbral',act:1,range:4,initiative:16,hp:1,glyphs:['slow','poison'],element:'magic',powers:'Glifos de cadenas y veneno; cadena que arrastra a un héroe hacia él.'},
  sporemother:{name:'Madre Espora',act:2,range:3,initiative:14,hp:1.1,glyphs:['poison','slow'],powers:'Glifos de esporas y lianas; hace brotar plantas escupidoras a su alrededor.'},
  firedemon:{name:'Demonio de Fuego',act:3,range:2,initiative:15,hp:1.1,glyphs:['damage'],element:'fire',powers:'Nova de fuego a su alrededor y suelo en llamas.'},
  vampqueen:{name:'Reina Vampira',act:3,range:3,initiative:17,hp:1.05,glyphs:['poison','damage'],element:'chaos',powers:'Roba vida con cada golpe e invoca murciélagos.'}
};
/** Jefes de cada acto: [opciones a mitad, opciones al final]. */
const actBosses=[[['skeletonking'],['umbralking']],[['cerberus'],['sporemother']],[['oracle','vampqueen'],['firedemon']]];
/** Rasgos de cada monstruo: elemento de su ataque, robo de vida, encanto, armadura, movimiento. */
export const monsterTraits={
  bat:{movement:1,initiative:9,hamstring:true,resist:{lightning:-30,physical:-15}},
  // Calavera: quita PA solo con su Maldición (cada 3 turnos), no con cada golpe; alcance algo menor.
  skull:{element:'magic',range:5,resist:{chaos:60,magic:30,physical:20}},
  skeleton:{ward:15,initiative:7,resist:{chaos:50,ice:30,fire:-25}},
  succubus:{element:'chaos',charm:true,range:5,initiative:12,resist:{chaos:40,magic:25,ice:-25}},
  vampire:{lifesteal:.5,element:'chaos',initiative:10,drain:true,resist:{chaos:50,fire:-30}},
  imp:{element:'fire',range:6,initiative:13,resist:{fire:75,ice:-30}},
  worm:{ward:15,resist:{physical:15,ice:-25}},
  slimeking:{ward:10,resist:{physical:30,lightning:-30}},
  slime:{resist:{physical:25,fire:-25}},
  slug:{ward:10,slime:true,initiative:5,resist:{chaos:30,ice:-30}},
  plant:{range:4,movement:-2,poison:true,initiative:8,resist:{chaos:50,fire:-50}},
  lavaslime:{element:'fire',ward:10,initiative:7,resist:{fire:80,ice:-50}}
};
/** Resistencias de los jefes. */
export const bossResist={skeletonking:{chaos:50,fire:-20},umbralking:{magic:30,lightning:-20},cerberus:{fire:30,ice:-20},
  sporemother:{chaos:50,fire:-40},oracle:{fire:50,ice:-25},vampqueen:{chaos:50,fire:-25},firedemon:{fire:80,ice:-40}};
/**
 * Variantes de monstruo (campeones): aparecen más a menudo en actos avanzados.
 * Suman armadura, velocidad, daño, resistencias o efectos al golpear (−PA, −PM, robo de vida).
 */
export const monsterVariants={
  acorazado:{name:'acorazado',text:'+20 % de armadura',apply:u=>{u.stats.ward+=20;}},
  veloz:{name:'veloz',text:'+1 PM y más iniciativa',apply:u=>{u.stats.movement+=1;u.initiative+=4;}},
  furioso:{name:'furioso',text:'+25 % de daño',apply:u=>{u.damage=Math.ceil(u.damage*1.25);}},
  ignifugo:{name:'ignífugo',text:'Resiste el fuego (+50 %)',apply:u=>{u.resist.fire=(u.resist.fire||0)+50;}},
  escarchado:{name:'escarchado',text:'Resiste el hielo (+50 %)',apply:u=>{u.resist.ice=(u.resist.ice||0)+50;}},
  aislado:{name:'aislado',text:'Resiste el rayo y la magia (+40 %)',apply:u=>{u.resist.lightning=(u.resist.lightning||0)+40;u.resist.magic=(u.resist.magic||0)+40;}},
  maldito:{name:'maldito',text:'Sus golpes quitan 1 PA',apply:u=>{u.drain=true;}},
  pegajoso:{name:'pegajoso',text:'Sus golpes quitan 1 PM',apply:u=>{u.hamstring=true;}},
  sanguinario:{name:'sanguinario',text:'Roba un 30 % del daño',apply:u=>{u.lifesteal=Math.max(u.lifesteal||0,.3);}}
};
/** Convierte a un monstruo en una variante (o no) según el acto. */
function maybeVariant(u,act,rng){
  if(!rng||u.boss||rng()>=.12+.1*act)return u;
  const keys=Object.keys(monsterVariants);
  const key=keys[Math.floor(rng()*keys.length)];
  monsterVariants[key].apply(u);
  u.variant=key;
  u.name=u.name+' '+monsterVariants[key].name;
  u.hp=Math.round(u.hp*1.15);
  return u;
}
/** Habilidad propia de cada monstruo (con recarga en turnos del propio monstruo). */
export const monsterSkills={
  skeleton:{name:'Golpe de escudo',cd:3,text:'Cada 3 turnos golpea con el escudo: empuja 1 casilla y resta 1 PM.'},
  slime:{name:'Salto viscoso',cd:3,text:'Cada 3 turnos salta hasta 5 casillas para caer junto a un héroe.'},
  skull:{name:'Maldición',cd:3,text:'Cada 3 turnos su rayo maldice: −1 PA en el próximo turno del objetivo.'},
  worm:{name:'Excavar',cd:3,text:'Cada 3 turnos se entierra y emerge junto al héroe más débil.'},
  slimeking:{name:'Aplastar',cd:2,text:'Cada 2 turnos se deja caer y golpea a todos los héroes pegados a él.'},
  bat:{name:'Picar y huir',cd:0,text:'Tras morder, se aleja volando con el movimiento que le quede.'},
  slug:{name:'Escupitajo de baba',cd:3,text:'Cada 3 turnos escupe hasta 3 casillas: daño y −2 PM.'},
  plant:{name:'Raíces',cd:3,text:'Cada 3 turnos sus raíces inmovilizan al objetivo (−3 PM).'},
  lavaslime:{name:'Erupción',cd:3,text:'Cada 3 turnos estalla: daño de fuego a todos los héroes pegados a él.'},
  vampire:{name:'Paso de niebla',cd:3,text:'Cada 3 turnos se vuelve niebla y aparece junto al héroe con menos vida.'},
  imp:{name:'Bola de fuego',cd:3,text:'Cada 3 turnos su ataque estalla en cruz alrededor del objetivo.'},
  succubus:{name:'Beso',cd:3,text:'Cada 3 turnos atrae al objetivo 2 casillas hacia ella.'}
};
/** Segundas habilidades (con su propia recarga). */
export const monsterExtraSkills={
  plant:{name:'Liana devoradora',cd:3,text:'Atrapa a un héroe en línea recta, a cualquier distancia, y lo arrastra hasta ella; necesita visión y el camino totalmente libre (sin muros, líquidos ni unidades). Lista desde su primer turno, luego cada 3.'}
};
const skillReady=unit=>!unit.boss&&monsterSkills[unit.look]&&(unit.cd??1)<=0;
function useSkill(s,unit){
  unit.cd=monsterSkills[unit.look].cd;
  note(s,unit.name+' usa '+monsterSkills[unit.look].name.toLowerCase()+'.');
}
function monster(species,id,floor,{ranged=false,elite=false,solo=false}={}){
  const trait=monsterTraits[species]||{};
  const factor=(ranged?.75:elite?1.15:1)*(solo?.85:1);
  const hp=Math.round((12+4*floor)*factor);   // (antes 16+4·piso: los primeros combates se alargaban con la IA nueva)
  return {id,name:monsterNames[species],look:species,boss:false,elite,enemy:true,resist:{...(trait.resist||{})},
    initiative:trait.initiative||(ranged?11:6),range:trait.range||(ranged?6:1),hp,
    damage:Math.max(1,Math.round((ranged?2+floor:3+floor)*(solo?.85:1))),
    stats:{ward:(trait.ward||0)+(elite?15:0),movement:trait.movement||0},effects:{}};
}
export function encounter(floor,size,options={}) {
  if(typeof options==='boolean')options={elite:options};
  const {elite=false,boss=null,rng=null}=options;
  const act=actOf(floor),local=actFloor(floor);
  const solo=size===1;
  const life=fauna[act-1];
  const count=Math.min(7,size+Math.floor(local/3)+(act-1));
  const lineup=[];
  for(let i=0;i<count;i++){
    if(boss&&i===0){
      const info=bosses[boss];
      lineup.push({id:'enemy0',name:info.name,look:boss,boss:true,elite:false,enemy:true,initiative:info.initiative,range:info.range,
        hp:Math.round((48+floor*6+8*(size-1))*info.hp*(solo?.9:1)),damage:4+floor,element:info.element,
        stats:{ward:20,movement:0},effects:{},cycle:0,resist:{...(bossResist[boss]||{})}});
      continue;
    }
    const ranged=i%2===1&&floor>1;
    const isElite=!ranged&&(elite&&i===0||(local>=5&&i===2));
    const pool=ranged?life.ranged:life.melee;
    const species=isElite?life.elite:pool[rng?Math.floor(rng()*pool.length):(i+floor)%pool.length];
    lineup.push(maybeVariant(monster(species,'enemy'+i,floor,{ranged,elite:isElite,solo}),act,rng));
  }
  if(!elite)return lineup;
  // Combate de élite: enemigos reforzados; en grupo, además, un refuerzo extra.
  for(const u of lineup){u.hp=Math.round(u.hp*(solo?1.1:1.2));u.damage+=1;u.stats.ward+=8;}
  if(!solo){
    const extra=monster(life.extra,'enemy'+count,floor,{elite:true});
    extra.hp=Math.round(extra.hp*1.3);extra.elite=true;
    lineup.push(extra);
  }
  return lineup;
}
export const distance = (s,a,b) => Math.abs(a%s.width-b%s.width)+Math.abs(Math.floor(a/s.width)-Math.floor(b/s.width));
export const onBoard=(s,pos)=>Number.isInteger(pos)&&pos>=0&&pos<s.width*s.height&&!s.voids?.includes(pos);
export const adjacent = (s,pos) => [pos-s.width,pos+s.width,pos-1,pos+1].filter(n=>onBoard(s,n)&&distance(s,pos,n)===1);
const forms={
  L:(x,y)=>x<.52||y>=.43,
  T:(x,y)=>y<.43||(x>=.28&&x<.73),
  C:(x,y)=>x<.49||y<.31||y>=.69,
  cruz:(x,y)=>(x>=.23&&x<.77)||(y>=.27&&y<.75),
  H:(x,y)=>x<.32||x>=.68||(y>=.36&&y<.64),
  U:(x,y)=>x<.3||x>=.7||y>=.6,
  anillo:(x,y)=>!(x>=.38&&x<.62&&y>=.36&&y<.64),
  rombo:(x,y)=>Math.abs(x-.5)*1.1+Math.abs(y-.5)<.74
};
function contour(s,rng){
  if(s.floor===1)return {shape:'rectángulo',voids:[]};
  if(s.shape!=='irregular'&&rng()<.35){
    // Contorno irregular: mordiscos rectangulares al azar en los bordes de arriba y abajo.
    const voids=new Set();
    for(let i=roll(2,4,rng);i>0;i--){
      const width=roll(2,Math.max(2,Math.floor(s.width/4)),rng),depth=roll(1,Math.max(1,Math.floor(s.height/3)),rng);
      const x0=roll(0,s.width-width,rng),top=rng()<.5;
      for(let y=0;y<depth;y++)for(let x=x0;x<x0+width;x++)voids.add((top?y:s.height-1-y)*s.width+x);
    }
    return {shape:'irregular',voids:[...voids]};
  }
  const shape=pick(Object.keys(forms).filter(key=>key!==s.shape),rng);
  const mirror=rng()<.5;
  const heightFlip=rng()<.5;
  const voids=[];
  for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){
    const u=(x+.5)/s.width,v=(y+.5)/s.height;
    if(!forms[shape](mirror?1-u:u,heightFlip?1-v:v))voids.push(y*s.width+x);
  }
  return {shape,voids};
}
/**
 * Formas de sala. Las pequeñas obligan al cuerpo a cuerpo; las galerías largas y las amplias
 * favorecen a quien ataca a distancia (a veces el grupo, a veces los enemigos).
 */
export function roomForms(extra=0,rng=Math.random){
  const r=(a,b)=>a+Math.floor(rng()*(b-a+1));
  return [
    {key:'estandar',name:'Sala',w:12+2*extra,h:7+extra},
    {key:'pequena',name:'Sala pequeña',w:r(9,10)+extra,h:6},
    {key:'larga',name:'Galería larga',w:Math.min(22,r(17,19)+2*extra),h:5+Math.min(1,extra)},
    {key:'amplia',name:'Sala amplia',w:Math.min(22,r(15,16)+2*extra),h:Math.min(12,r(10,11)+extra)},
    {key:'cuadrada',name:'Sala cuadrada',w:10+extra,h:Math.min(12,9+extra)}
  ];
}
/** Nombres de sala por ambientación: se combinan al azar. */
const roomNames={
  crypt:[['Galería','Osario','Capilla','Pasaje','Cámara','Nave','Sepulcro','Calabozo','Cripta','Mazmorra'],
    ['de los ecos','del silencio','de los pilares','de las cadenas','del guardián','de huesos','sin nombre','de la vela negra','del carcelero','del eco roto']],
  jungle:[['Claro','Ciénaga','Espesura','Ruinas','Senda','Templo','Manglar','Charca','Bosque','Altar'],
    ['de las lianas','de los helechos','del jaguar','de las esporas','de la niebla verde','de raíces','de las ranas','del musgo','de la serpiente','de las flores carnívoras']],
  hell:[['Forja','Caldera','Pozo','Puente','Altar','Grieta','Trono','Horno','Cráter','Río'],
    ['de azufre','de las almas','de brasas','del tormento','de la ceniza','de los condenados','de lava','del pacto','de cadenas al rojo','del diablo']]
};
/** Estilos de sala: cada uno coloca los obstáculos con reglas distintas y al azar. */
const roomStyles={
  // Pilares sueltos, a veces en espejo.
  pilares(cells,area,rng){
    const count=roll(3,6,rng);
    for(let i=0;i<count;i++)cells.push([roll(area.x0,area.x1,rng),roll(area.y0,area.y1,rng)]);
  },
  // Tramos de muro rectos de 2 a 4 casillas.
  muros(cells,area,rng){
    for(let i=roll(2,4,rng);i>0;i--){
      const horizontal=rng()<.5,length=roll(2,4,rng);
      let x=roll(area.x0,area.x1,rng),y=roll(area.y0,area.y1,rng);
      for(let j=0;j<length;j++){cells.push([x,y]);if(horizontal)x++;else y++;}
    }
  },
  // Un muro que parte la sala con uno o dos huecos de paso.
  salas(cells,area,rng){
    const x=roll(area.x0+1,Math.max(area.x0+1,area.x1-1),rng);
    const gaps=new Set([roll(area.y0,area.y1,rng),roll(area.y0,area.y1,rng)]);
    for(let y=area.y0;y<=area.y1;y++)if(!gaps.has(y))cells.push([x,y]);
    for(let i=roll(1,2,rng);i>0;i--)cells.push([roll(area.x0,area.x1,rng),roll(area.y0,area.y1,rng)]);
  },
  // Montones de escombros que crecen como manchas.
  cumulos(cells,area,rng){
    for(let i=roll(2,3,rng);i>0;i--){
      let x=roll(area.x0,area.x1,rng),y=roll(area.y0,area.y1,rng);
      for(let j=roll(2,4,rng);j>0;j--){
        cells.push([x,y]);
        if(rng()<.5)x+=rng()<.5?1:-1;else y+=rng()<.5?1:-1;
      }
    }
  },
  // Esquinas en L, como restos de habitaciones.
  ruinas(cells,area,rng){
    for(let i=roll(2,3,rng);i>0;i--){
      const x=roll(area.x0,area.x1,rng),y=roll(area.y0,area.y1,rng);
      const dx=rng()<.5?1:-1,dy=rng()<.5?1:-1,arm=roll(1,2,rng);
      cells.push([x,y]);
      for(let j=1;j<=arm;j++){cells.push([x+dx*j,y]);cells.push([x,y+dy*j]);}
    }
  },
  // Columnas en rejilla con huecos al azar.
  columnata(cells,area,rng){
    const ox=roll(0,1,rng),oy=roll(0,1,rng);
    for(let y=area.y0+oy;y<=area.y1;y+=2)for(let x=area.x0+ox;x<=area.x1;x+=2)if(rng()<.55)cells.push([x,y]);
  },
  // Anillo alrededor del centro con 2-3 entradas: se pelea dentro y fuera.
  anillo(cells,area,rng){
    const cx=Math.round((area.x0+area.x1)/2),cy=Math.round((area.y0+area.y1)/2),r=Math.max(1,Math.min(2,Math.floor((area.y1-area.y0)/2)));
    const ring=[];
    for(let x=cx-r-1;x<=cx+r+1;x++)for(let y=cy-r;y<=cy+r;y++){
      const edge=x===cx-r-1||x===cx+r+1||y===cy-r||y===cy+r;
      if(edge)ring.push([x,y]);
    }
    const gaps=roll(2,3,rng);
    for(let i=0;i<gaps;i++)ring.splice(roll(0,ring.length-1,rng),2);
    cells.push(...ring);
  },
  // Línea diagonal de obstáculos con algún hueco: divide la sala en dos triángulos.
  diagonal(cells,area,rng){
    const up=rng()<.5,len=area.x1-area.x0;
    for(let i=0;i<=len;i++){
      if(rng()<.22)continue;
      const y=Math.round(area.y0+(area.y1-area.y0)*(up?i/len:1-i/len));
      cells.push([area.x0+i,y]);
    }
  },
  // Islas: bloques de 2×2 separados por pasillos anchos.
  islas(cells,area,rng){
    for(let i=roll(2,3,rng);i>0;i--){
      const x=roll(area.x0,area.x1-1,rng),y=roll(area.y0,area.y1-1,rng);
      cells.push([x,y],[x+1,y],[x,y+1],[x+1,y+1]);
    }
  },
  // Muros escalonados en zigzag: hay que rodearlos para avanzar.
  zigzag(cells,area,rng){
    let top=rng()<.5;
    for(let x=area.x0+1;x<=area.x1;x+=2){
      const len=roll(2,3,rng);
      for(let j=0;j<len;j++)cells.push([x,top?area.y0+j:area.y1-j]);
      top=!top;
    }
  },
  // Cruz central: cuatro brazos cortos que forman cuatro cuadrantes.
  cruz(cells,area,rng){
    const cx=Math.round((area.x0+area.x1)/2),cy=Math.round((area.y0+area.y1)/2),arm=roll(1,2,rng);
    cells.push([cx,cy]);
    for(let j=1;j<=arm;j++)cells.push([cx+j,cy],[cx-j,cy],[cx,cy+j],[cx,cy-j]);
  }
};
/** Estilos propios de cada acto (se suman a los comunes). */
const biomeStyles={
  crypt:{
    // Hileras de sarcófagos con pasillos entre ellas.
    nichos(cells,area,rng){
      for(let y=area.y0+roll(0,1,rng);y<=area.y1;y+=3)for(let x=area.x0;x<=area.x1;x++)if(rng()<.6&&(x-area.x0)%4!==3)cells.push([x,y]);
    }
  },
  jungle:{
    // Arboleda densa: muchos troncos sueltos.
    arboleda(cells,area,rng){
      for(let i=roll(7,10,rng);i>0;i--)cells.push([roll(area.x0,area.x1,rng),roll(area.y0,area.y1,rng)]);
    }
  },
  hell:{
    // Picos de obsidiana en dos frentes enfrentados.
    frentes(cells,area,rng){
      const a=area.x0+1,b=area.x1-1;
      for(let y=area.y0;y<=area.y1;y++){if(rng()<.5)cells.push([a,y]);if(rng()<.5)cells.push([b,y]);}
    }
  }
};
function makeLayout(s,rng){
  const w=s.width;
  const h=s.height;
  const biome=s.biome||'crypt';
  const styles={...roomStyles,...(biomeStyles[biome]||{})};
  const style=pick(Object.keys(styles).filter(key=>key!==s.layoutStyle),rng);
  // Los obstáculos se reparten por casi todo el mapa: quedan libres las 3 columnas de salida de cada bando.
  const area={x0:3,x1:w-4,y0:0,y1:h-1};
  const cells=[];
  styles[style](cells,area,rng);
  // A veces la sala sale simétrica (en espejo arriba/abajo).
  if(rng()<.4)for(const [x,y] of [...cells])cells.push([x,h-1-y]);
  // Densidad: cada sala tiene un tope de obstáculos (de arena diáfana a sala con cobertura).
  // Tope sobre el mapa entero (≈5–14 %): de arena casi diáfana a sala con bastante cobertura.
  const boardCells=Array.from({length:w*h},(_,pos)=>pos).filter(pos=>onBoard(s,pos)).length;
  const density=pick([.03,.05,.06,.08,.10],rng);
  const budget=Math.max(2,Math.round(boardCells*density));
  const walls=[];
  const shuffled=[...cells].map(c=>[rng(),c]).sort((a,b)=>a[0]-b[0]).map(([,c])=>c);
  for(const [x,y] of shuffled){
    const pos=y*w+x;
    if(walls.length>=budget)break;
    if(x>=3&&x<=w-4&&y>=0&&y<h&&onBoard(s,pos)&&!walls.includes(pos))walls.push(pos);
  }
  const [nouns,tails]=roomNames[biome]||roomNames.crypt;
  let name=pick(nouns,rng)+' '+pick(tails,rng);
  if(name===s.layoutName)name=nouns[(nouns.indexOf(name.split(' ')[0])+1)%nouns.length]+' '+pick(tails,rng);
  const boundary=new Set();
  const ground=Array.from({length:w*h},(_,pos)=>pos).filter(pos=>onBoard(s,pos));
  const candidates=ground.filter(pos=>pos%w>=3&&pos%w<=w-4&&!walls.includes(pos));
  function connected(){
    const visited=new Set([ground.find(pos=>!boundary.has(pos))]);
    for(const pos of visited)for(const next of adjacent(s,pos)){
      if(!boundary.has(next))visited.add(next);
    }
    return visited.size+boundary.size===ground.length;
  }
  // Además de estar conectada, la sala debe dejar varios caminos de un bando al otro:
  // al menos 4 rutas que no compartan casillas (nunca un único pasillo).
  const MIN_ROUTES=4;
  function routes(){
    // Flujo máximo con capacidad 1 por casilla (cada casilla partida en entrada 2c y salida 2c+1).
    const free=pos=>onBoard(s,pos)&&!boundary.has(pos);
    const S=-1,T=-2,cap=new Map(),links=new Map();
    const edge=(u,v)=>{
      cap.set(u+','+v,(cap.get(u+','+v)||0)+1);if(!cap.has(v+','+u))cap.set(v+','+u,0);
      for(const [a,b] of [[u,v],[v,u]]){if(!links.has(a))links.set(a,[]);links.get(a).push(b);}
    };
    for(const pos of ground){
      if(!free(pos))continue;
      edge(2*pos,2*pos+1);
      if(pos%w<3)edge(S,2*pos);
      if(pos%w>w-4)edge(2*pos+1,T);
      for(const next of adjacent(s,pos))if(free(next))edge(2*pos+1,2*next);
    }
    let flow=0;
    while(flow<MIN_ROUTES){
      const prev=new Map([[S,null]]),queue=[S];
      for(let i=0;i<queue.length&&!prev.has(T);i++){
        const u=queue[i];
        for(const v of links.get(u)||[])if(!prev.has(v)&&cap.get(u+','+v)>0){prev.set(v,u);queue.push(v);}
      }
      if(!prev.has(T))break;
      for(let v=T;v!==S;v=prev.get(v)){const u=prev.get(v);cap.set(u+','+v,cap.get(u+','+v)-1);cap.set(v+','+u,cap.get(v+','+u)+1);}
      flow++;
    }
    return flow;
  }
  const passable=()=>connected()&&routes()>=MIN_ROUTES;
  for(const pos of walls){
    boundary.add(pos);
    if(!passable())boundary.delete(pos);
  }
  for(let i=0;i<Math.min(3,Math.floor(budget/6))&&candidates.length;i++){
    const pos=candidates.splice(roll(0,candidates.length-1,rng),1)[0];
    boundary.add(pos);
    if(!passable())boundary.delete(pos);
  }
  const blocks=[...boundary];
  // Agua: charcas que bloquean el paso pero no la visión. El mapa sigue conectado.
  const water=[];
  const open=candidates.filter(pos=>!boundary.has(pos));
  // Charcas en la mazmorra, ciénagas grandes en la jungla y ríos de lava en el infierno.
  // Infierno: a veces un río de lava vertical con uno o dos puentes.
  if(biome==='hell'&&s.floor>1&&rng()<.45){
    const x=roll(area.x0+1,Math.max(area.x0+1,area.x1-1),rng);
    const bridges=new Set([roll(0,h-1,rng),roll(0,h-1,rng)]);
    for(let y=0;y<h;y++){
      const pos=y*w+x;
      if(bridges.has(y)||!open.includes(pos)||boundary.has(pos))continue;
      boundary.add(pos);
      if(passable())water.push(pos);else boundary.delete(pos);
    }
  }
  const pools=s.floor===1?1:biome==='jungle'?roll(1,3,rng):biome==='hell'?roll(1,2,rng):roll(0,2,rng);
  // El agua (o lava) tampoco puede comerse la sala: como mucho ≈8 % del mapa.
  const waterCap=Math.max(3,Math.round(boardCells*.06))+water.length;
  for(let i=0;i<pools&&open.length&&water.length<waterCap;i++){
    let pos=open[roll(0,open.length-1,rng)];
    const size=biome==='jungle'?roll(3,5,rng):roll(2,4,rng);
    for(let j=0;j<size&&pos!==undefined&&water.length<waterCap;j++){
      if(!boundary.has(pos)){
        boundary.add(pos);
        if(passable())water.push(pos);else boundary.delete(pos);
      }
      const next=adjacent(s,pos).filter(n=>open.includes(n)&&!boundary.has(n));
      pos=next.length?pick(next,rng):undefined;
    }
  }
  // Trampas: pinchos en todos los pisos y gas venenoso desde el piso 2.
  // Nunca en pasillos (casillas con 2 o menos vecinas libres) ni pegadas a otra trampa.
  const traps=[];
  const walkable=pos=>onBoard(s,pos)&&!boundary.has(pos);
  const spots=open.filter(pos=>walkable(pos)&&adjacent(s,pos).filter(walkable).length>=3);
  const count=Math.min(5,1+Math.floor(actFloor(s.floor)*.5)+(s.act||1)-1);
  for(let i=0;i<count&&spots.length;i++){
    const pos=spots.splice(roll(0,spots.length-1,rng),1)[0];
    if(traps.some(t=>distance(s,t.pos,pos)<=2)){i--;continue;}
    traps.push({pos,kind:s.floor>=2&&rng()<.4?'gas':'spikes'});
  }
  return {name,style,walls:blocks,water,traps};
}
/** Daño esperado por turno de un héroe con su mejor habilidad ofensiva. */
/** PA y PM base de todos los personajes. */
export const BASE_AP=6,BASE_MP=3,ENEMY_MP=4;
export function heroOffense(hero){
  const ap=BASE_AP+(hero.stats?.action||0);
  let best=0;
  classes[hero.classId].skills.forEach((_,i)=>{
    const skill=skillFor(hero,i);
    if(!skill||[...supportKinds,'dash','swap'].includes(skill[5])||!(skill[4]>0))return;
    const element=skillElement(hero,skill);
    const average=scaledDamage(hero,skill,(skill[3]+skill[4])/2);
    const area=skillOptions(skill).area?1.6:1;
    best=Math.max(best,average*area*Math.floor(ap/skill[1]));
  });
  return best*(1+critChance(hero)*.5);
}
/** Vida efectiva: la armadura reduce cada golpe físico. */
export const heroDefense=hero=>hero.max/(1-Math.min(ARMOR_CAP,hero.stats?.ward||0)/100*.6);
/** Héroe "esperado" en un piso: nivel, una mejora de habilidad por piso y equipo medio. */
function expectedHero(classId,floor){
  const ranks=skillRanks(classId);
  for(let i=1;i<floor;i++){const k=ranks.findIndex(r=>r<3);if(k>=0)ranks[k]++;}
  const stats={action:0,ward:Math.floor((floor-1)/3)*4,critical:(floor-1)*1.5};
  // Equipo medio: +5 % de daño por piso, además del +8 % por nivel.
  for(const key of damageKeys)stats[key]=LEVEL_DAMAGE*(floor-1)+5*(floor-1);
  const max=classes[classId].hp+(floor-1)*4+(floor-1)*3;
  return {classId,level:floor,skillRanks:ranks,stats,max};
}
/**
 * Escalado dinámico: compara el poder real del grupo con el esperado en ese piso.
 * Más daño del grupo → enemigos con más vida; más aguante → enemigos que pegan más.
 */
export function enemyScaling(floor,heroes){
  if(!heroes.length)return {hp:1,damage:1};
  let offense=0,expectedOffense=0,defense=0,expectedDefense=0;
  for(const hero of heroes){
    const base=expectedHero(hero.classId,floor);
    offense+=heroOffense(hero);expectedOffense+=heroOffense(base);
    defense+=heroDefense(hero);expectedDefense+=heroDefense(base);
  }
  const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
  return {
    hp:Number(Math.pow(clamp(offense/expectedOffense,.7,2.2),.9).toFixed(2)),
    damage:Number(Math.pow(clamp(defense/expectedDefense,.7,2.2),.75).toFixed(2))
  };
}
// ───────────── Mapas creados en el editor ─────────────
/**
 * Un mapa creado: tamaño, casillas fuera del mapa (voids), obstáculos (walls, con variante opcional),
 * agua/lava, trampas y puntos de aparición. Pertenece a una zona (acto + tipo de sala) y tiene una
 * frecuencia: el % de veces que sale en lugar de un mapa aleatorio de esa zona.
 */
export const MAP_LIMITS={minW:6,maxW:20,minH:5,maxH:14};
export const ROOM_KINDS={any:'Cualquiera',normal:'Normal',elite:'Élite',boss:'Jefe'};
export const obstacleNames={
  crypt:['Columna rota','Sarcófago con velas','Huesos y escombros'],
  jungle:['Árbol retorcido','Helechos con flores','Ídolo con musgo'],
  hell:['Agujas de obsidiana','Brasero de azufre','Roca de lava']
};
let customMaps=[];
/** Lista de mapas creados que usa el juego (el servidor y el modo solitario la cargan al empezar). */
export function setCustomMaps(list){customMaps=(Array.isArray(list)?list:[]).map(m=>{try{return cleanMap(m);}catch{return null;}}).filter(Boolean);}
export const getCustomMaps=()=>customMaps;
/** Normaliza y valida un mapa (lanza un error con el motivo si no sirve). */
export function cleanMap(raw){
  const m=raw&&typeof raw==='object'?raw:{};
  const int=(v,lo,hi,def)=>{const n=Math.round(Number(v));return Number.isFinite(n)?Math.min(hi,Math.max(lo,n)):def;};
  const width=int(m.width,MAP_LIMITS.minW,MAP_LIMITS.maxW,12),height=int(m.height,MAP_LIMITS.minH,MAP_LIMITS.maxH,8);
  const size=width*height;
  const cells=list=>[...new Set((Array.isArray(list)?list:[]).map(Number).filter(p=>Number.isInteger(p)&&p>=0&&p<size))].sort((a,b)=>a-b);
  const voids=cells(m.voids);
  const off=new Set(voids);
  const walls=cells(m.walls).filter(p=>!off.has(p));
  const blocked=new Set([...voids,...walls]);
  const water=cells(m.water).filter(p=>!blocked.has(p));
  water.forEach(p=>blocked.add(p));
  const traps=[];
  for(const t of Array.isArray(m.traps)?m.traps:[]){
    const pos=Number(t?.pos);
    if(!Number.isInteger(pos)||pos<0||pos>=size||blocked.has(pos)||traps.some(x=>x.pos===pos))continue;
    traps.push({pos,kind:t.kind==='gas'?'gas':'spikes'});
  }
  const trapSet=new Set(traps.map(t=>t.pos));
  const heroSpawns=cells(m.heroSpawns).filter(p=>!blocked.has(p)&&!trapSet.has(p)).slice(0,8);
  const enemySpawns=cells(m.enemySpawns).filter(p=>!blocked.has(p)&&!trapSet.has(p)&&!heroSpawns.includes(p)).slice(0,24);
  const wallVariants={},wallRotations={};
  for(const [k,v] of Object.entries(m.wallVariants||{})){const p=Number(k),n=Number(v);if(walls.includes(p)&&[0,1,2].includes(n))wallVariants[p]=n;}
  // Giro de cada obstáculo (0–3, en cuartos de vuelta). Sin dato, el juego usa el giro por defecto.
  for(const [k,v] of Object.entries(m.wallRotations||{})){const p=Number(k),n=Number(v);if(walls.includes(p)&&[0,1,2,3].includes(n))wallRotations[p]=n;}
  const name=String(m.name||'').trim().slice(0,40)||'Mapa sin nombre';
  const act=int(m.act,1,ACTS,1);
  const room=Object.hasOwn(ROOM_KINDS,m.room)?m.room:'any';
  const weight=int(m.weight,0,100,30);
  const id=/^[a-z0-9]{6,16}$/.test(m.id||'')?m.id:Math.random().toString(36).slice(2,10);
  return {id,name,act,room,weight,enabled:m.enabled!==false,width,height,voids,walls,wallVariants,wallRotations,water,traps,heroSpawns,enemySpawns,
    ...(m.author?{author:String(m.author).slice(0,24)}:{}),...(m.updated?{updated:Number(m.updated)||0}:{})};
}
/** Avisos de un mapa: no impiden guardarlo, pero el editor los muestra. */
export function mapWarnings(map){
  const m=cleanMap(map);
  const out=[];
  if(m.heroSpawns.length<4)out.push('Faltan puntos de aparición de héroes ('+m.heroSpawns.length+'/4): el juego completará el resto.');
  if(m.enemySpawns.length<8)out.push('Pocos puntos de enemigos ('+m.enemySpawns.length+'/8 recomendados): el juego añadirá casillas libres.');
  // Todas las casillas transitables conectadas (si no, habría zonas imposibles de alcanzar).
  const s={width:m.width,height:m.height,voids:m.voids};
  const blocked=new Set([...m.voids,...m.walls,...m.water]);
  const open=Array.from({length:m.width*m.height},(_,p)=>p).filter(p=>!blocked.has(p));
  if(open.length){
    const seen=new Set([open[0]]);
    for(const p of seen)for(const n of adjacent(s,p))if(!blocked.has(n))seen.add(n);
    if(seen.size<open.length)out.push((open.length-seen.size)+' casillas quedan aisladas: nadie puede llegar a ellas.');
  }else out.push('No hay casillas transitables.');
  if(!m.enabled)out.push('Desactivado: no sale en partidas.');
  else if(!m.weight)out.push('Frecuencia 0 %: no sale en partidas.');
  return out;
}
/** Mapa creado para esta sala (o null): se recorre la zona en orden aleatorio y cada uno se tira con su frecuencia. */
function pickCustomMap(s,room,rng){
  const pool=customMaps.filter(m=>m.enabled&&m.weight>0&&m.act===actOf(s.floor)&&(m.room==='any'||m.room===room));
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool.find(m=>rng()*100<m.weight)||null;
}
// ───────────── Laboratorio de pruebas (editor de mapas) ─────────────
/** Lo que se puede poner de enemigo en el laboratorio: el muñeco, cada monstruo y cada jefe. */
export function labEnemyOptions(){
  const species=[...new Set(fauna.flatMap(f=>[...f.melee,...f.ranged,f.elite,f.extra]))];
  return [{id:'dummy',name:'Muñeco de prueba',group:'Pruebas'},
    ...species.map(id=>({id,name:monsterNames[id],group:'Monstruos'})),
    ...Object.entries(bosses).map(([id,b])=>({id:'boss:'+id,name:b.name,group:'Jefes'}))];
}
function labLineup(s){
  return s.lab.enemies.slice(0,12).map((entry,i)=>{
    const id='enemy'+i;
    if(entry.kind==='dummy'){
      const hp=Math.max(1,Math.min(99999,Math.round(Number(entry.hp)||999)));
      return {id,name:'Muñeco de prueba',look:'skeleton',dummy:true,boss:false,elite:false,enemy:true,resist:{},initiative:0,range:1,hp,damage:0,stats:{ward:0,movement:0},effects:{}};
    }
    if(String(entry.kind).startsWith('boss:')){
      const key=entry.kind.slice(5),info=bosses[key];
      if(!info)fail('Jefe desconocido.');
      return {id,name:info.name,look:key,boss:true,elite:false,enemy:true,initiative:info.initiative,range:info.range,
        hp:Math.round((48+s.floor*6)*info.hp),damage:4+s.floor,element:info.element,stats:{ward:20,movement:0},effects:{},cycle:0,resist:{...(bossResist[key]||{})}};
    }
    if(!monsterNames[entry.kind])fail('Monstruo desconocido.');
    const ranged=fauna.some(f=>f.ranged.includes(entry.kind));
    return monster(entry.kind,id,s.floor,{ranged,elite:!!entry.elite});
  });
}
/**
 * Combate de laboratorio: héroes con la clase, el nivel y las habilidades (y su nivel) que se elijan,
 * los enemigos que se elijan (o los normales de la zona), en un mapa creado o aleatorio, y trucos opcionales.
 * config: {act, room, map|null, heroes:[{classId, level, ranks:[0-3,…], passives:[id]}], enemies:[{kind, elite, hp}], immortal, infinite}
 */
export function labCombat(s,config,rng=Math.random){
  const c=config||{};
  s.lab={immortal:!!c.immortal,infinite:!!c.infinite,enemies:(Array.isArray(c.enemies)?c.enemies:[]).filter(e=>e&&e.kind)};
  s.players.forEach((p,i)=>{
    const h=c.heroes?.[i]||{};
    if(Object.hasOwn(classes,h.classId))p.classId=h.classId;
    p.labLevel=Math.max(1,Math.min(40,Math.round(Number(h.level)||1)));
    const count=classes[p.classId].skills.length;
    const ranks=Array.from({length:count},(_,k)=>Math.max(0,Math.min(3,Math.round(Number(h.ranks?.[k])||0))));
    if(!ranks.some(r=>r>0))ranks[0]=1;
    p.skillRanks=ranks;
    p.passives=(Array.isArray(h.passives)?h.passives:[]).filter(id=>passiveCards[p.classId]?.some(card=>card.id===id));
  });
  const act=Math.max(1,Math.min(ACTS,Math.round(Number(c.act)||c.map?.act||1)));
  const room=['normal','elite','boss'].includes(c.room)?c.room:'normal';
  const map=c.map?{...cleanMap(c.map),act,room}:null;
  s.route=makeRoute(rng,act);
  s.act=act;s.bossKills=0;
  s.floor=actStart(act)+(room==='boss'?actLength(act):room==='elite'?4:2)-1;
  s.testMap=map;
  openFloor(s,rng,room==='elite',room==='boss'&&!s.lab.enemies.length?actBosses[act-1][1][0]:null);
}
/** Partida de prueba desde el editor: empieza directamente en un combate de esa zona con ese mapa. */
export function testCustomMap(s,raw,rng=Math.random){
  const map=cleanMap(raw);
  s.route=makeRoute(rng,map.act);
  s.act=map.act;s.bossKills=0;
  s.floor=actStart(map.act)+(map.room==='boss'?actLength(map.act):map.room==='elite'?4:2)-1;
  s.testMap=map;
  openFloor(s,rng,map.room==='elite',map.room==='boss'?actBosses[map.act-1][1][0]:null);
}
/** Coloca un mapa creado en el estado (o uno de prueba desde el editor). */
function applyCustomMap(s,map){
  [s.width,s.height]=[map.width,map.height];
  s.voids=[...map.voids];s.shape=map.voids.length?'personalizado':'rectángulo';
  s.roomForm='custom';s.roomFormName='Mapa del editor';
  return {name:map.name,style:'custom',walls:[...map.walls],water:[...map.water],traps:map.traps.map(t=>({...t}))};
}
function openFloor(s,rng,elite=false,boss=null) {
  s.phase='combat';
  s.vote=null;
  s.event=null;
  s.mods=s.pending||{};
  s.pending={};
  s.training=false;
  s.floor++;
  s.rounds=1;
  s.mapSeed=randomSeed(rng);
  const mapRng=floorRandom(s.mapSeed);
  // Formas de sala: unas ayudan al cuerpo a cuerpo (pequeñas), otras a la distancia (largas, amplias).
  const extra=s.players.length-1;
  // Mapa creado en el editor: el de prueba (s.testMap) o uno de la zona según su frecuencia.
  const custom=s.testMap||pickCustomMap(s,boss?'boss':elite?'elite':'normal',mapRng);
  s.testMap=null;
  s.customMap=custom?{id:custom.id,name:custom.name}:null;
  s.wallVariants=custom?{...custom.wallVariants}:{};
  s.wallRotations=custom?{...custom.wallRotations}:{};
  let layout;
  if(custom)layout=applyCustomMap(s,custom);
  else{
    const forms=roomForms(extra,mapRng);
    const form=s.floor===1?forms[0]:pick(forms.filter(f=>f.key!==s.roomForm),mapRng);
    s.roomForm=form.key;s.roomFormName=form.name;
    [s.width,s.height]=[form.w,form.h];
    Object.assign(s,contour(s,mapRng));
  }
  s.act=actOf(s.floor);
  s.biome=actBiomes[s.act-1];
  s.glyphs=[];s.guardZones=[];
  const w=s.width;
  const mid=Math.floor(s.height/2);
  layout||=makeLayout(s,mapRng);
  s.layoutName=layout.name;
  s.layoutStyle=layout.style;
  s.walls=layout.walls;
  s.water=layout.water;
  s.traps=layout.traps;
  const trapCells=new Set(s.traps.map(t=>t.pos));
  const free=Array.from({length:w*s.height},(_,pos)=>pos).filter(pos=>onBoard(s,pos)&&!s.walls.includes(pos)&&!s.water.includes(pos)&&!trapCells.has(pos));
  const rightScore=pos=>(pos%w)*4-Math.abs(Math.floor(pos/w)-mid);
  // Mapa creado: sus puntos de aparición primero; si faltan, las casillas libres más a la derecha.
  const heroPositions=custom?[...custom.heroSpawns.filter(p=>free.includes(p)),...[...free].filter(p=>!custom.heroSpawns.includes(p)&&!custom.enemySpawns.includes(p)).sort((a,b)=>rightScore(b)-rightScore(a))].slice(0,s.players.length):
    s.floor===1?[0,-1,1,-2].map(y=>w*(mid+y)+w-2):
    [...free].sort((a,b)=>rightScore(b)-rightScore(a)).slice(0,s.players.length);
  const heroes=s.players.map((p,i)=>{
    const previous=s.units.find(u=>u.id===p.id);
    const level=s.lab?(p.labLevel||1):s.floor;
    p.level=level;
    p.xp=0;
    p.trained=true;
    const {stats,max}=heroStats(p,level);
    return {id:p.id,name:p.name,classId:p.classId,color:p.color,level,skillRanks:[...p.skillRanks],passives:[...(p.passives||[])],initiative:classes[p.classId].initiative,stats,max,
      // La vida NO se recupera de sala a sala: se conserva la que quedaba (más lo que suba la vida máxima).
      // Quien cayó vuelve con el 10 %.
      hp:!previous?max:previous.hp>0?Math.max(1,Math.min(max,previous.hp+Math.max(0,max-(previous.max||max)))):Math.ceil(max*.1),
      pos:heroPositions[i],effects:{}};
  });
  const lineup=s.lab?.enemies?.length?labLineup(s):encounter(s.floor,s.players.length,{elite,boss,rng:floorRandom((s.mapSeed^0x9e3779b9)>>>0)});
  const scale=s.lab?{hp:1,damage:1}:enemyScaling(s.floor,heroes);
  s.scaling=scale;
  if(s.mods.startHpPct)for(const hero of heroes)hero.hp=Math.max(1,Math.min(hero.hp,Math.ceil(hero.max*s.mods.startHpPct)));
  const spawns=custom?custom.enemySpawns.filter(p=>free.includes(p)&&!heroPositions.includes(p)):
    s.floor===1?Array.from({length:(s.height-2)*2},(_,i)=>w*(1+Math.floor(i/2))+1+i%2):
    free.filter(pos=>!heroPositions.includes(pos)).sort((a,b)=>a%w-b%w).slice(0,Math.max(12,lineup.length*2));
  // Si el mapa creado no tiene bastantes puntos de enemigos, se usan las casillas libres más a la izquierda.
  if(custom&&spawns.length<lineup.length)spawns.push(...free.filter(p=>!heroPositions.includes(p)&&!spawns.includes(p)).sort((a,b)=>a%w-b%w).slice(0,lineup.length-spawns.length));
  const foes=lineup.map(u=>{
    const pos=spawns.splice(roll(0,spawns.length-1,mapRng),1)[0];
    const hp=Math.max(1,Math.round(u.hp*(s.mods.enemyHp||1)*scale.hp));
    return {...u,hp,max:hp,damage:Math.max(1,Math.round(u.damage*scale.damage)),pos};
  });
  s.units=[...heroes,...foes].sort((a,b)=>b.initiative-a.initiative);
  s.turn=0;
  note(s,'Piso '+s.floor+' · '+s.layoutName+' · '+(s.roomFormName||'Sala').toLowerCase()+(s.voids.length&&!s.customMap?' · '+s.shape.toUpperCase():'')+(boss?' · '+bosses[boss].name:elite?' · Combate de élite':''));
  if(Math.abs(scale.hp-1)>=.05||Math.abs(scale.damage-1)>=.05)
    note(s,'Los enemigos se adaptan al poder del grupo: vida ×'+scale.hp.toFixed(2)+', daño ×'+scale.damage.toFixed(2)+'.');
  const effects=modText(s.mods);
  if(effects)note(s,'Efectos de este combate: '+effects+'.');
  beginTurn(s);
}
export function lineOfSight(s,from,to,ignoreId) {
  let x=from%s.width,y=Math.floor(from/s.width);
  const tx=to%s.width,ty=Math.floor(to/s.width);
  const dx=Math.abs(tx-x),dy=Math.abs(ty-y);
  const sx=Math.sign(tx-x),sy=Math.sign(ty-y);
  // Los aliados de quien lanza no tapan la visión; los rivales sí.
  const caster=s.units.find(u=>u.id===ignoreId)||s.units.find(u=>alive(u)&&u.pos===from);
  const screens=s.units.filter(u=>alive(u)&&u.id!==ignoreId&&u.pos!==from&&u.pos!==to&&(!caster||!!u.enemy!==!!caster.enemy));
  const blocked=new Set([...s.walls,...(s.voids||[]),...screens.map(u=>u.pos)]);
  let ix=0,iy=0;
  while(ix<dx||iy<dy) {
    const cross=(1+2*ix)*dy-(1+2*iy)*dx;
    if(cross===0) {
      // La línea pasa justo por la esquina: dos bloques en diagonal no la tapan.
      x+=sx;y+=sy;ix++;iy++;
    } else if(cross<0){x+=sx;ix++;}
    else {y+=sy;iy++;}
    if(blocked.has(y*s.width+x))return false;
  }
  return true;
}
export function paths(s,unit,limit) {
  if(!onBoard(s,unit.pos))return new Map();
  const blocked=new Set([...s.walls,...(s.water||[]),...s.units.filter(alive).map(u=>u.pos)]);
  const routes=new Map([[unit.pos,[]]]);
  for(const [pos,path] of routes) {
    if(path.length>=limit)continue;
    for(const next of adjacent(s,pos)){
      if(blocked.has(next)||routes.has(next))continue;
      routes.set(next,[...path,next]);
    }
  }
  routes.delete(unit.pos);
  return routes;
}
export const reachable=(s,unit,limit)=>new Map([...paths(s,unit,limit)].map(([pos,path])=>[pos,path.length]));
export const ARMOR_CAP=75;
/** Reducción por armadura (en %) contra un tipo de daño: entera contra el físico; el escudo protege la mitad contra el resto. */
export function armorPercent(target,element){
  const shield=target.effects?.shield?.value||0;
  const armor=element==='physical'?(target.stats?.ward||0)+shield:Math.floor(shield/2);
  return Math.max(0,Math.min(ARMOR_CAP,armor));
}
function netDamage(target,raw,element,critical,extra=0){
  // Resistencia (o debilidad, si es negativa) al tipo de daño y armadura: ambas en %.
  // Dardo pestilente: −N a todas las resistencias mientras dure.
  const resist=Math.max(-100,Math.min(90,(target.resist?.[element]||0)-(target.effects?.corrode?.value||0)));
  const taken=element==='physical'?passiveEffects(target).takenPhysical||0:0;
  const total=(raw+extra)*(critical?1.5:1)*(1-resist/100)*(1-armorPercent(target,element)/100)*(1+taken/100);
  return Math.max(raw+extra>0?1:0,Math.round(total));
}
export const critChance=unit=>Math.min(1,.12+(unit.stats?.critical||0)/100);
export function damagePreview(unit,target,skill,scale=1){
  if([...supportKinds,'dash','swap'].includes(skill[5])||!(skill[4]>0))return null;
  const element=skillElement(unit,skill);
  const armor=armorType(unit,skill);
  const extra=target.effects?.expose?.value||0;
  const range=critical=>[skill[3],skill[4]].map(base=>netDamage(target,scaledDamage(unit,skill,base,scale),armor,critical,extra));
  return {normal:range(false),critical:range(true),chance:Math.min(1,critChance(unit)+(skillOptions(skill).crit||0)/100),element};
}
export function hit(s,actor,target,raw,kind='damage',critical=false,element='physical',burns=true) {
  const extra=kind==='damage'?(target.effects.expose?.value||0):0;
  let incoming=netDamage(target,raw,element,critical,extra);
  // Escudo (En guardia!): absorbe daño antes de la vida.
  const barrier=target.effects.barrier;
  if(barrier&&incoming>0){
    const absorbed=Math.min(barrier.value,incoming);
    barrier.value-=absorbed;incoming-=absorbed;
    if(barrier.value<=0)delete target.effects.barrier;
    emit(s,{kind:'block',unit:target.id,pos:target.pos,amount:absorbed});
    note(s,target.name+' absorbe '+absorbed+' de daño con su escudo.');
  }
  const damage=Math.min(target.hp,incoming);
  target.hp-=damage;
  // Laboratorio: «no morir» deja a los héroes con 1 PV.
  if(s.lab?.immortal&&!target.enemy&&target.hp<=0)target.hp=1;
  if(target.hp>0)target.lastHit=damage;
  emit(s,{kind,unit:target.id,pos:target.pos,from:actor.pos,amount:damage,critical,element});
  // Vampirismo de los héroes: se acumula la fracción y se cura en puntos enteros.
  const leech=!actor.enemy&&kind==='damage'&&actor!==target?actor.stats?.leech||0:0;
  if(leech>0&&damage>0&&alive(actor)){
    actor.leechPool=(actor.leechPool||0)+damage*leech/100;
    const heal=Math.min(actor.max-actor.hp,Math.floor(actor.leechPool));
    if(Math.floor(actor.leechPool)>=1){
      actor.leechPool-=Math.floor(actor.leechPool);
      if(heal>0){actor.hp+=heal;emit(s,{kind:'heal',unit:actor.id,from:actor.pos,pos:actor.pos,amount:heal});note(s,actor.name+' recupera '+heal+' PV por vampirismo.');}
    }
  }
  note(s,actor.name+' → '+target.name+' · −'+damage+' PV'+(extra?' (+'+extra+' vulnerabilidad)':'')+(critical?' · crítico':''));
  if(target.hp<=0)releaseMinions(s,target);
  // Golpes de fuego (monstruos, glifos, hechizos) prenden; el hielo apaga.
  else if((kind==='damage'||kind==='glyph')&&(burns||element!=='fire'))ignite(s,target,damage,element);
}
/** Al morir un invocador, sus invocaciones se deshacen con él. */
function releaseMinions(s,owner){
  for(const minion of s.units.filter(u=>u.minion===owner.id&&u.hp>0)){
    const amount=minion.hp;
    minion.hp=0;
    emit(s,{kind:'damage',unit:minion.id,pos:minion.pos,from:owner.pos,amount});
    note(s,minion.name+' se deshace al caer '+owner.name+'.');
  }
}
/**
 * Quemadura: un golpe de fuego deja al objetivo ardiendo 2 turnos; al empezar cada uno de sus
 * turnos recibe un cuarto del golpe como daño de fuego. El hielo la apaga.
 */
function ignite(s,target,dealt,element){
  if(!alive(target))return;
  if(element==='ice'&&target.effects.burn){delete target.effects.burn;note(s,'El hielo apaga las llamas de '+target.name+'.');return;}
  if(element!=='fire'||!(dealt>0))return;
  const had=!!target.effects.burn;
  effect(target,'burn',Math.max(1,Math.ceil(dealt/4)),2);
  if(!had)note(s,target.name+' arde: −'+target.effects.burn.value+' PV al empezar sus próximos 2 turnos.');
}
function effect(unit,key,value,turns) {
  const previous=unit.effects[key];
  unit.effects[key]={value:Math.max(previous?.value||0,value),turns:Math.max(previous?.turns||0,turns)};
}
/** Quita PM para el próximo turno y lo anuncia (el número «−N PM» sale bajo el daño). */
function drainMp(s,unit,value,turns){
  effect(unit,'slow',value,turns);
  emit(s,{kind:'mp',unit:unit.id,pos:unit.pos,amount:value});
}
/** Fuerza de cada glifo según el piso: crece con la partida para que siga pesando. */
export function glyphPower(kind,floor=1){
  const f=Math.max(1,floor);
  if(kind==='poison')return {damage:3+Math.floor(f/4),element:'chaos',poison:2+Math.floor(f/5),turns:2};
  if(kind==='slow')return {damage:3+Math.floor(f/4),element:'magic',slow:2};
  return {damage:7+Math.floor(f/2),element:'fire'};
}
/** Radio de los glifos de jefe (rombo de 13 casillas). */
export const GLYPH_RADIUS=2;
/** Aplica un glifo activo a un héroe: daño y, según el tipo, veneno o pérdida de PM. */
function triggerGlyph(s,g,unit) {
  const power=glyphPower(g.kind,s.floor);
  hit(s,{name:glyphInfo[g.kind].name,pos:unit.pos},unit,power.damage,'glyph',false,power.element);
  if(!alive(unit))return;
  if(power.poison) {
    effect(unit,'poison',power.poison,power.turns);
    note(s,unit.name+' queda envenenado.');
  }
  if(power.slow) {
    drainMp(s,unit,power.slow,1);
    note(s,unit.name+' pierde '+power.slow+' PM en su próximo turno por el glifo de cadenas.');
  }
}
export const trapInfo={
  spikes:{name:'Trampa de pinchos',description:floor=>'Al pisarla: '+(3+floor)+' de daño físico (la armadura lo reduce).'},
  gas:{name:'Trampa de gas',description:floor=>'Al pisarla: 2 de daño y veneno de '+(2+Math.floor(floor/2))+' PV durante 2 turnos.'}
};
/** Trampa al pisar una casilla: afecta a héroes y monstruos. */
function triggerTrap(s,trap,unit){
  const source={name:trapInfo[trap.kind].name,pos:unit.pos};
  if(trap.kind==='spikes')hit(s,source,unit,3+s.floor,'trap',false,'physical');
  else{
    hit(s,source,unit,2,'trap',false,'chaos');
    if(alive(unit)){effect(unit,'poison',2+Math.floor(s.floor/2),2);note(s,unit.name+' respira gas venenoso.');}
  }
}
function applyGlyphs(s,unit,oldPos) {
  if(unit.enemy)return;
  for(const g of s.glyphs) {
    // Las cadenas solo se activan en el turno del jefe que las lanza.
    if(g.kind==='slow'||g.warn||!alive(unit)||!g.cells.includes(unit.pos)||g.cells.includes(oldPos))continue;
    triggerGlyph(s,g,unit);
  }
}
function move(s,unit,path,voluntary=true,blink=false,style=null) {
  const from=unit.pos;
  const traveled=[];
  if(!path.length||!alive(unit)||(voluntary&&s.mp===0))return;
  emit(s,{kind:'move',unit:unit.id,look:unit.look||unit.classId,from,path:traveled,...(blink?{blink:true}:{}),...(!voluntary&&!blink?{rush:true}:{}),...(style?{style}:{})});
  for(const pos of path) {
    if(!alive(unit)||(voluntary&&s.mp===0))break;
    if(voluntary)s.mp--;
    const previous=unit.pos;
    unit.pos=pos;
    traveled.push(pos);
    applyGlyphs(s,unit,previous);
    const trap=s.traps?.find(t=>t.pos===pos);
    if(trap&&alive(unit))triggerTrap(s,trap,unit);
    if(s.guardZones?.length&&guardZoneCheck(s,unit,previous))break;
  }
}
function beginTurn(s) {
  const u=s.units[s.turn];
  s.enemyPlan=null;
  // En guardia!: el escudo y la zona duran hasta el próximo turno del lanzador.
  if(s.guardZones?.length)s.guardZones=s.guardZones.filter(z=>z.owner!==u.id);
  if(u.effects.barrier?.untilOwnTurn)delete u.effects.barrier;
  const bonus=u.enemy?{}:s.mods||{};
  s.casts={};s.castTargets={};
  s.ap=Math.max(1,(u.enemy?4:BASE_AP)+(u.stats?.action||0)+(bonus.ap||0)-(u.effects.weak?.value||0));
  // Los enemigos tienen 4 PM de base (uno más que los héroes).
  // Los de distancia, 3 PM (si no, disparan y huyen sin que se les pueda alcanzar).
  s.mp=Math.max(0,(u.enemy?(archetypeOf(u)==='ranged'?ENEMY_MP-1:ENEMY_MP):BASE_MP)+(u.stats?.movement||0)+(bonus.mp||0)+(u.effects.haste?.value||0)-(u.effects.slow?.value||0));
  if(s.lab?.infinite&&!u.enemy){s.ap=99;s.mp=99;}
  s.turnStarted=Date.now();
  s.deadline=u.enemy?s.turnStarted+350:s.lab?null:s.turnStarted+60000;
  if(u.effects.poison)hit(s,{name:'Veneno',pos:u.pos},u,u.effects.poison.value,'poison',false,'chaos');
  if(u.effects.burn&&alive(u))hit(s,{name:'Quemadura',pos:u.pos},u,u.effects.burn.value,'burn',false,'fire');
  applyGlyphs(s,u,-1);
}
/** Detonadora: al acabar el turno del objetivo, estalla y quema a sus aliados a 2 casillas o menos. */
function detonate(s,unit){
  const d=unit.effects.detonate;delete unit.effects.detonate;
  const caster=s.units.find(u=>u.id===d.by)||{name:'Detonadora',pos:unit.pos,level:1};
  const victims=s.units.filter(u=>u!==unit&&alive(u)&&!!u.enemy===!!unit.enemy&&distance(s,u.pos,unit.pos)<=2);
  emit(s,{kind:'spell',effect:'blast',actor:caster.id,from:unit.pos,pos:unit.pos,area:victims.map(u=>u.pos).concat(unit.pos),name:'Detonación',element:'fire'});
  note(s,unit.name+' estalla'+(victims.length?'.':', pero no hay nadie cerca.'));
  for(const v of victims)hit(s,caster,v,d.value,'damage',false,'fire',false);
}
function endEffects(unit) {
  for(const [key,status] of Object.entries(unit.effects)) {
    if(--status.turns<=0)delete unit.effects[key];
  }
  for(const [name,left] of Object.entries(unit.cooldowns||{}))if(left<=1)delete unit.cooldowns[name];else unit.cooldowns[name]=left-1;
  // Cada carga tiene su propia duración.
  for(const [name,list] of Object.entries(unit.stacks||{})){
    const rest=list.map(t=>t-1).filter(t=>t>0);
    if(rest.length)unit.stacks[name]=rest;else delete unit.stacks[name];
  }
}
function finish(s,rng) {
  if(!s.units.some(u=>!u.enemy&&alive(u))){
    s.phase='lost';
    s.result={points:runPoints({floor:s.floor,bossKills:s.bossKills,won:false})};
    return true;
  }
  if(s.units.some(u=>u.enemy&&alive(u)))return false;
  // Laboratorio de pruebas: sin recompensas; el combate termina y se puede reiniciar.
  if(s.lab){s.phase='won';note(s,'Laboratorio: combate terminado.');return true;}
  const bossFight=s.node?.kind==='boss';
  if(bossFight){
    s.bossKills=(s.bossKills||0)+1;
    // Respiro tras derrotar a un jefe: el grupo recupera la mitad de su vida.
    healParty(s,.5);
    note(s,'El jefe cae: el grupo recupera la mitad de su vida.');
  }
  s.phase=bossFight&&s.floor===TOTAL_FLOORS?'won':'reward';
  s.mods={};
  s.glyphs=[];
  const elite=s.node?.kind==='elite';
  s.picks=[];
  s.offers={};
  s.stock=[];
  s.turnStarted=Date.now();
  s.deadline=s.turnStarted+62500;
  if(s.phase==='reward'){
    s.training=true;
    for(const p of s.players){
      p.xp=100;
      p.trainOffer=rollTrainingOffer(p,rng,bossFight);
      p.trained=p.trainOffer.length===0;
      p.gold+=Math.round((10+s.floor*4)*(elite?1.5:1));
      const ilvl=itemLevel(s,(elite?1:0)+(bossFight?2:0));
      const luck=elite?.35:0;
      s.offers[p.id]=Array.from({length:3},(_,i)=>rollItem(s,rng,{ilvl,bonus:luck,gear:elite&&i===0}));
    }
    s.stock=[];
    note(s,elite?'Victoria de élite · Botín mejorado y más tusi.':'Victoria · Elige botín y prepara tu equipo.');
  }else{
    for(const p of s.players)p.xp=100;
    s.result={points:runPoints({floor:s.floor,bossKills:s.bossKills,won:true})};
  }
  return true;
}
function advance(s,rng) {
  const ending=s.units[s.turn];
  if(ending?.guardPending&&alive(ending)){
    (s.guardZones||=[]).push({owner:ending.id,...ending.guardPending,hit:[]});
    delete ending.guardPending;
    note(s,ending.name+' queda en guardia hasta su próximo turno.');
  }
  if(ending?.effects?.detonate&&alive(ending))detonate(s,ending);
  endEffects(ending);
  while(!finish(s,rng)){
    do {
      s.turn=(s.turn+1)%s.units.length;
      if(s.turn===0)s.rounds++;
    }while(!alive(s.units[s.turn]));
    beginTurn(s);
    if(alive(s.units[s.turn]))return;
  }
}
export const glyphInfo={
  damage:{name:'Glifo de brasas'},
  poison:{name:'Glifo de veneno'},
  slow:{name:'Glifo de cadenas'}
};
/** Descripción de un glifo con sus valores reales en este piso. */
export function glyphText(kind,floor){
  const p=glyphPower(kind,floor);
  if(kind==='poison')return 'Al activarse en el turno del jefe, y al entrar o empezar el turno encima: '+p.damage+' de daño de sombra y veneno de '+p.poison+' PV durante 2 turnos.';
  if(kind==='slow')return 'En cada turno del jefe: '+p.damage+' de daño arcano y −'+p.slow+' PM en el próximo turno de quien esté encima.';
  return 'Al activarse en el turno del jefe, y al entrar o empezar el turno encima: '+p.damage+' de daño de fuego.';
}
/** Casillas de un glifo centrado en pos: rombo de radio 2, recortado por muros y líquidos. */
export function glyphCells(s,center,radius=GLYPH_RADIUS){
  const out=[];
  for(let pos=0;pos<s.width*s.height;pos++){
    if(!onBoard(s,pos)||s.walls.includes(pos)||s.water?.includes(pos))continue;
    if(distance(s,center,pos)<=radius)out.push(pos);
  }
  return [center,...out.filter(pos=>pos!==center)];
}
function castGlyph(s,boss,heroes) {
  const existing=s.glyphs.find(g=>g.owner===boss.id);
  if(existing?.warn){
    existing.warn=false;
    note(s,boss.name+' activa '+glyphInfo[existing.kind].name.toLowerCase()+'.');
    for(const hero of heroes.filter(h=>alive(h)&&existing.cells.includes(h.pos))){
      triggerGlyph(s,existing,hero);
    }
    return;
  }
  s.glyphs=s.glyphs.filter(g=>g.owner!==boss.id);
  const living=heroes.filter(alive);
  if(!living.length)return;
  const target=living.reduce((a,b)=>distance(s,boss.pos,a.pos)<=distance(s,boss.pos,b.pos)?a:b);
  // El centro puede estar pegado a un muro: el área se recorta. Se busca cubrir a más héroes,
  // y a igualdad, al más cercano y con el centro justo encima de alguien.
  let best=null;
  for(let pos=0;pos<s.width*s.height;pos++){
    if(!onBoard(s,pos)||s.walls.includes(pos)||s.water?.includes(pos))continue;
    const covered=living.filter(h=>distance(s,pos,h.pos)<=GLYPH_RADIUS);
    if(!covered.length)continue;
    const score=covered.length*10-distance(s,pos,target.pos)-covered.reduce((n,h)=>n+distance(s,pos,h.pos),0)*.2;
    if(!best||score>best.score)best={pos,score};
  }
  const center=best?.pos;
  if(center===undefined)return;
  const kinds=bosses[boss.look]?.glyphs||['damage'];
  const kind=kinds[(boss.glyphCycle||0)%kinds.length];
  boss.glyphCycle=(boss.glyphCycle||0)+1;
  s.glyphs.push({owner:boss.id,kind,cells:glyphCells(s,center),warn:true});
  emit(s,{kind:'spell',effect:'glyph',actor:boss.id,from:boss.pos,pos:center});
  note(s,boss.name+' anuncia '+glyphInfo[kind].name.toLowerCase()+'.');
}
/** Alcance actual de un monstruo (el escupitajo de la babosa llega más lejos cuando está listo). */
const reachOf=unit=>Math.max(1,(unit.look==='slug'&&skillReady(unit)?3:unit.range)-(unit.effects?.blind?.value||0));
/** Qué tan apetecible es un héroe: remata a quien pueda matar, va a por sanadores y frágiles. */
function priority(s,unit,hero,pos){
  const ward=hero.stats?.ward||0;
  const lethal=hero.hp<=Math.max(1,Math.round(unit.damage*(1-(unit.range>1?0:Math.min(ARMOR_CAP,ward))/100)))?40:0;
  const healer=hero.classId==='mistico'?5:0;
  const fragile=Math.max(0,32-ward)*.15;
  return lethal+healer+fragile-hero.hp*.35-distance(s,pos,hero.pos)*.3;
}
function attackOptions(s,unit,heroes,pos){
  const reach=reachOf(unit);
  return heroes.filter(h=>alive(h)&&distance(s,pos,h.pos)<=reach&&lineOfSight(s,pos,h.pos,unit.id))
    .sort((a,b)=>priority(s,unit,b,pos)-priority(s,unit,a,pos));
}
const trapsOn=(s,path)=>path.filter(pos=>s.traps?.some(t=>t.pos===pos)).length;
/** Casillas peligrosas de un camino: trampas y glifos a punto de estallar. */
const hazardsOn=(s,path)=>trapsOn(s,path)+path.filter(pos=>s.glyphs?.some(g=>g.warn&&g.cells.includes(pos))).length;
/** Arquetipo de IA: los que atacan de lejos mantienen la distancia; el resto va de frente. */
export const archetypeOf=unit=>unit.range>1?'ranged':'melee';
export function planEnemy(s,unit,heroes){
  const routes=paths(s,unit,s.width*s.height);
  const ranged=archetypeOf(unit)==='ranged';
  const firing=[];
  for(const [pos,path] of [[unit.pos,[]],...routes]){
    const target=attackOptions(s,unit,heroes,pos)[0];
    if(!target)continue;
    const nearest=Math.min(...heroes.map(h=>distance(s,pos,h.pos)));
    const adjacent=heroes.filter(h=>distance(s,pos,h.pos)===1).length;
    // Distancia: dispara desde lo más lejos que permita su alcance y nunca pegado a un héroe.
    // Cuerpo a cuerpo: va de frente por el camino más corto.
    const stance=ranged?Math.min(nearest,unit.range)*3-adjacent*10-(nearest===2?3:0):-adjacent*.5;
    const score=priority(s,unit,target,pos)+stance-path.length*(ranged?.25:.6)-hazardsOn(s,path)*25;
    firing.push({path,score});
  }
  const local=firing.filter(option=>option.path.length<=s.mp).sort((a,b)=>b.score-a.score);
  if(local.length)return local[0].path;
  const approach=firing.sort((a,b)=>(a.path.length+hazardsOn(s,a.path)*8)-(b.path.length+hazardsOn(s,b.path)*8)||b.score-a.score)[0];
  if(approach){
    // Avanza sin detenerse sobre una trampa si puede evitarlo.
    let step=approach.path.slice(0,s.mp);
    while(step.length&&hazardsOn(s,[step.at(-1)]))step=step.slice(0,-1);
    return step;
  }
  const nearest=pos=>Math.min(...heroes.map(hero=>distance(s,pos,hero.pos)));
  const available=[...routes].filter(([pos,path])=>path.length<=s.mp&&nearest(pos)<nearest(unit.pos)&&!hazardsOn(s,path));
  available.sort(([a,pa],[b,pb])=>nearest(a)-nearest(b)||pa.length-pb.length);
  return available[0]?.[1]||[];
}
/**
 * Tras atacar, los de distancia (y los murciélagos) se alejan con el movimiento que les quede:
 * buscan quedar fuera del alcance cuerpo a cuerpo, sin pasar por trampas.
 */
function retreat(s,unit,heroes){
  if(s.mp<=0||!alive(unit))return;
  if(archetypeOf(unit)!=='ranged'&&unit.look!=='bat')return;
  const living=heroes.filter(alive);
  if(!living.length)return;
  const nearest=pos=>Math.min(...living.map(h=>distance(s,pos,h.pos)));
  const here=nearest(unit.pos);
  // Solo se aleja si tiene a un héroe encima (a 2 casillas o menos).
  if(here>2)return;
  const options=[...paths(s,unit,s.mp)].filter(([pos,path])=>!hazardsOn(s,path)&&nearest(pos)>here);
  options.sort(([a,pa],[b,pb])=>nearest(b)-nearest(a)||pa.length-pb.length);
  if(options[0])move(s,unit,options[0][1]);
}
// ───────────── Camino entre pisos, eventos y votaciones ─────────────
export const nodeKinds={
  combat:{name:'Combate',description:'Enemigos normales y botín estándar.'},
  elite:{name:'Élite',description:'Enemigos más duros y un limo colosal extra. Botín mejor y 50 % más de tusi.'},
  event:{name:'Evento',description:'Un encuentro sin combate. El grupo vota entre varias opciones.'},
  shop:{name:'Tienda',description:'Un mercader: compra y vende con tusi. Sin combate. Se sigue cuando todos están listos.'},
  forge:{name:'Forja',description:'Un herrero: re-tira los stats de tu equipo o sube su rareza a cambio de tusi. Sin combate.'},
  boss:{name:'Jefe',description:'Cámara del jefe: un enemigo enorme con poderes propios.'}
};
const voteTime=45000;
/**
 * Fases sin prisa (mapa, eventos, tienda y forja): no hay reloj al entrar. Cuando al menos la mitad
 * del grupo está lista (o ha votado), empieza una cuenta atrás para el resto; si están todos, se sigue ya.
 */
export const READY_TIME=30000;
const majority=s=>Math.ceil(s.players.length/2);
function noTimer(s){s.turnStarted=Date.now();s.deadline=null;}
function armTimer(s,count){
  if(count>=majority(s)&&count<s.players.length&&s.deadline==null){
    s.turnStarted=Date.now();
    s.deadline=s.turnStarted+READY_TIME;
    note(s,'La mayoría está lista: '+READY_TIME/1000+' s para el resto.');
  }else if(count<majority(s)&&s.deadline!=null){
    s.deadline=null;
    note(s,'Ya no está lista la mayoría: se para la cuenta atrás.');
  }
}
/** Árbol de un acto: 8 pisos, 3-4 caminos por piso, jefe a mitad (piso 4) y al final (piso 8). */
export function makeRoute(rng,act=1){
  const rows=[];
  const [midBoss,endBoss]=actBosses[act-1].map(options=>options.length>1?pick(options,rng):options[0]);
  const length=actLength(act),mid=midBossFloor(act);
  for(let local=1;local<=length;local++){
    const floor=actStart(act)+local;
    if(local===mid||local===length){
      const boss=local===mid?midBoss:endBoss;
      rows.push([{id:act+'-'+local+'-0',floor,kind:'boss',boss,bossName:bosses[boss].name,x:.5,next:[]}]);
      continue;
    }
    const count=local===1?3:rng()<.5?4:3;
    const xs=count===4?[.12,.37,.63,.88]:[.18,.5,.82];
    const kinds=xs.map((_,i)=>{
      if(local<=2)return i===0?'combat':rng()<.4?'event':'combat';
      const r=rng();
      return r<.45?'combat':r<.7?'elite':'event';
    });
    if(local>2&&new Set(kinds).size===1)kinds[kinds.length-1]=kinds[0]==='event'?'combat':'event';
    // Tiendas solo en el mapa: siempre en el piso 3 y en el anterior al jefe final, a veces dos antes.
    if(local===3||local===length-1||(local===length-2&&rng()<.35))kinds[Math.floor(rng()*count)]='shop';
    // Forjas: siempre justo después del jefe intermedio y a veces en el piso 2.
    if(local===mid+1||(local===2&&rng()<.3)){const i=Math.floor(rng()*count);if(kinds[i]!=='shop')kinds[i]='forge';else kinds[(i+1)%count]='forge';}
    if(!kinds.some(kind=>kind==='combat'||kind==='elite'))kinds[['shop','forge'].includes(kinds[0])?count-1:0]='combat';
    rows.push(xs.map((x,i)=>({id:act+'-'+local+'-'+i,floor,kind:kinds[i],x,next:[]})));
  }
  // Ramas: cada sala lleva a la más cercana del piso siguiente y, a veces, se bifurca hacia una vecina.
  // Así cada decisión cierra caminos: no todo está conectado con todo.
  for(let r=0;r<rows.length-1;r++){
    const here=rows[r],next=rows[r+1];
    const nearest=x=>next.reduce((a,b)=>Math.abs(a.x-x)<=Math.abs(b.x-x)?a:b);
    for(const node of here){
      if(here.length===1||next.length===1){node.next=next.map(other=>other.id);continue;}
      const main=nearest(node.x);
      node.next=[main.id];
      if(rng()<.35){
        const side=next.filter(other=>other!==main&&Math.abs(other.x-node.x)<=.4)
          .sort((a,b)=>Math.abs(a.x-node.x)-Math.abs(b.x-node.x))[0];
        if(side)node.next.push(side.id);
      }
    }
    // Ninguna sala queda inalcanzable: la que nadie apunta recibe el camino de la sala más cercana de arriba.
    for(const other of next){
      if(here.some(node=>node.next.includes(other.id)))continue;
      here.reduce((a,b)=>Math.abs(a.x-other.x)<=Math.abs(b.x-other.x)?a:b).next.push(other.id);
    }
    for(const node of here)node.next.sort((a,b)=>next.findIndex(n=>n.id===a)-next.findIndex(n=>n.id===b));
  }
  return {act,rows,path:[],seen:[]};
}
const findNode=(s,id)=>s.route.rows.flat().find(node=>node.id===id);
function routeOptions(s){
  const row=s.route.rows[s.floor-actStart(s.route.act)];
  if(!row)return [];
  const current=s.node&&findNode(s,s.node.id);
  return current&&current.floor===s.floor?current.next:row.map(node=>node.id);
}
/** Pasa al siguiente piso del camino: vota si hay varias rutas, entra directamente si solo hay una. */
function openRoute(s,rng){
  s.training=false;
  s.stock=[];
  s.ready=[];
  // Al vencer al jefe final del acto empieza el siguiente, con un árbol nuevo.
  if(s.floor>=actStart(s.route.act)+actLength(s.route.act)&&s.route.act<ACTS){
    s.route=makeRoute(rng,s.route.act+1);
    s.node=null;
    s.act=s.route.act;
    note(s,'Acto '+s.act+' · '+actNames[s.act-1]+'.');
  }
  const options=routeOptions(s);
  // El mapa se muestra siempre, aunque solo haya un camino.
  s.phase='map';
  s.event=null;
  s.vote={kind:'map',options,votes:{}};
  noTimer(s);
  note(s,'Piso '+(s.floor+1)+' · El grupo vota el camino.');
}
function enterNode(s,node,rng){
  s.node={id:node.id,kind:node.kind};
  s.route.path.push(node.id);
  if(node.kind==='event'){startEvent(s,rng);return;}
  if(node.kind==='shop'){startShop(s,rng);return;}
  if(node.kind==='forge'){startForge(s);return;}
  openFloor(s,rng,node.kind==='elite',node.boss||null);
}
function castVote(s,player,option,rng){
  if(!Number.isInteger(option)||option<0||option>=s.vote.options.length)fail('Opción inválida.');
  s.vote.votes[player.id]=option;
  note(s,player.name+' vota: '+voteLabel(s,option)+'.');
  if(s.players.every(p=>Object.hasOwn(s.vote.votes,p.id)))resolveVote(s,rng);
  else armTimer(s,Object.keys(s.vote.votes).length);
}
function voteLabel(s,option){
  if(s.vote.kind==='map')return nodeKinds[findNode(s,s.vote.options[option]).kind].name;
  return s.event.options[option].label;
}
/** Gana la opción más votada; en empate, la del anfitrión; sin votos, la primera. */
function resolveVote(s,rng){
  const counts=s.vote.options.map((_,i)=>Object.values(s.vote.votes).filter(v=>v===i).length);
  const best=Math.max(...counts);
  const tied=counts.map((c,i)=>c===best?i:-1).filter(i=>i>=0);
  const hostVote=s.vote.votes[s.players[0].id];
  const choice=tied.includes(hostVote)?hostVote:tied[0];
  note(s,'Decisión del grupo: '+voteLabel(s,choice)+'.');
  if(s.vote.kind==='map'){enterNode(s,findNode(s,s.vote.options[choice]),rng);return;}
  const event=events[s.event.id];
  event.options[choice].apply(s,rng);
  s.vote=null;
  openRoute(s,rng);
}
const heroesOf=s=>s.units.filter(u=>!u.enemy);
function healParty(s,pct){
  for(const hero of heroesOf(s))hero.hp=Math.min(hero.max,Math.max(hero.hp,0)+Math.ceil(hero.max*pct));
}
function hurtParty(s,pct){
  const heroes=heroesOf(s).filter(alive);
  if(!heroes.length){s.pending.startHpPct=Math.min(s.pending.startHpPct||1,1-pct);return;}
  for(const hero of heroes)hero.hp=Math.max(1,hero.hp-Math.floor(hero.hp*pct));
}
const addMod=(s,key,value)=>{s.pending[key]=(s.pending[key]||0)+value;};
/** Bendición permanente para todo el grupo (power: daño de todos los tipos). */
function addBoon(s,key,value,players=s.players){
  for(const p of players){p.boons=p.boons||{};p.boons[key]=(p.boons[key]||0)+value;}
}
const boonName={power:'de daño',vitality:'de vida máxima',critical:'% de crítico',ward:'de armadura'};
const payAll=(s,amount)=>{for(const p of s.players)p.gold=Math.max(0,p.gold-amount);};
const tougher=(s,factor)=>{s.pending.enemyHp=(s.pending.enemyHp||1)*factor;};
const weaker=(s,pct)=>{s.pending.startHpPct=Math.min(s.pending.startHpPct||1,pct);};
/** Una gema al azar con una calidad más de la que toca por nivel. */
const fineGem=(s,rng)=>makeGem(++s.itemId,pick(Object.keys(gems),rng),gemQuality(itemLevel(s))+1);
const giveAll=(s,make)=>{for(const p of s.players)p.bag.push(make(p));};
export function modText(mods={}){
  const parts=[];
  if(mods.ap)parts.push((mods.ap>0?'+':'−')+Math.abs(mods.ap)+' PA');
  if(mods.mp)parts.push((mods.mp>0?'+':'−')+Math.abs(mods.mp)+' PM');
  if(mods.enemyHp)parts.push('enemigos +'+Math.round((mods.enemyHp-1)*100)+' % de vida');
  if(mods.startHpPct)parts.push('empezáis con el '+Math.round(mods.startHpPct*100)+' % de vida');
  return parts.join(', ');
}
export const events={
  fountain:{title:'Fuente de aguas negras',text:'Un manantial oscuro brota entre las losas. El agua huele a hierro y a promesas.',needsHeroes:true,options:[
    {label:'Beber',detail:'Todo el grupo se cura por completo, pero tiene −1 PM en el próximo combate.',apply:s=>{healParty(s,1);addMod(s,'mp',-1);}},
    {label:'Llenar los odres',detail:'Todo el grupo recupera un 30 % de su vida.',apply:s=>healParty(s,.3)},
    {label:'Seguir adelante',detail:'Cada jugador recibe 8 de tusi.',apply:s=>{for(const p of s.players)p.gold+=8;}}]},
  altar:{title:'Altar de sangre',text:'Un altar antiguo exige un tributo. Las gemas incrustadas laten al acercaros.',options:[
    {label:'Ofrecer sangre',detail:'Todos pierden un 25 % de su vida actual y reciben un objeto raro o mejor.',apply:(s,rng)=>{hurtParty(s,.25);giveAll(s,()=>rollItem(s,rng,{gear:true,minGrade:2,ilvl:itemLevel(s,1)}));}},
    {label:'Rezar',detail:'+1 PA en el próximo combate, pero los enemigos tendrán un 15 % más de vida.',apply:s=>{addMod(s,'ap',1);s.pending.enemyHp=(s.pending.enemyHp||1)*1.15;}},
    {label:'Marcharse',detail:'No ocurre nada.',apply:()=>{}}]},
  chest:{title:'Cofre encadenado',text:'Un cofre cubierto de cadenas. Algo dentro tintinea… y algo en la oscuridad os observa.',options:[
    {label:'Forzar el cofre',detail:'Cada uno recibe un objeto legendario, pero los enemigos del próximo combate tendrán un 25 % más de vida.',apply:(s,rng)=>{giveAll(s,()=>rollItem(s,rng,{gear:true,minGrade:3,ilvl:itemLevel(s,1)}));s.pending.enemyHp=(s.pending.enemyHp||1)*1.25;}},
    {label:'Buscar la llave',detail:'Cada uno recibe 15 de tusi.',apply:s=>{for(const p of s.players)p.gold+=15;}}]},
  camp:{title:'Campamento abandonado',text:'Restos de una hoguera todavía tibia. Alguien estuvo aquí hace poco.',needsHeroes:true,options:[
    {label:'Descansar',detail:'Todo el grupo recupera un 50 % de su vida.',apply:s=>healParty(s,.5)},
    {label:'Entrenar',detail:'+1 PA y +1 PM en el próximo combate, pero empezáis con el 80 % de la vida.',apply:s=>{addMod(s,'ap',1);addMod(s,'mp',1);s.pending.startHpPct=Math.min(s.pending.startHpPct||1,.8);}}]},
  peddler:{title:'Buhonero errante',text:'Un mercader encapuchado arrastra un carro lleno de baratijas brillantes.',options:[
    {label:'Comprar gemas',detail:'Cada uno paga hasta 10 de tusi y recibe una gema.',apply:(s,rng)=>{for(const p of s.players){p.gold=Math.max(0,p.gold-10);p.bag.push(makeGem(++s.itemId,pick(Object.keys(gems),rng),gemQuality(itemLevel(s))));}}},
    {label:'Pedir consejo',detail:'+1 PM en el próximo combate.',apply:s=>addMod(s,'mp',1)},
    {label:'Robarle',detail:'Cada uno recibe 25 de tusi, pero empezáis el próximo combate con el 75 % de la vida.',apply:s=>{for(const p of s.players)p.gold+=25;s.pending.startHpPct=Math.min(s.pending.startHpPct||1,.75);}}]},
  library:{title:'Biblioteca olvidada',text:'Estanterías podridas guardan tomos de técnicas perdidas.',options:[
    {label:'Estudiar',detail:'Cada jugador mejora al azar una habilidad que ya conoce (máximo 3/3).',apply:(s,rng)=>{
      for(const p of s.players){
        const options=trainingChoices(p).filter(choice=>choice.rank>0);
        if(!options.length)continue;
        const choice=pick(options,rng);
        p.skillRanks[choice.index]++;
        const hero=s.units.find(u=>u.id===p.id);
        if(hero)hero.skillRanks=[...p.skillRanks];
        note(s,p.name+' mejora '+choice.name+' a '+(choice.rank+1)+'/3.');
      }}},
    {label:'Saquear',detail:'Cada uno recibe 12 de tusi.',apply:s=>{for(const p of s.players)p.gold+=12;}}]},
  herbalist:{title:'Herbolaria del pantano',text:'Una anciana remueve un caldero humeante. «Todo tiene un precio, querida», dice sin mirar.',needsHeroes:true,options:[
    {label:'Ungüento',detail:'Cada uno paga 10 de tusi y todo el grupo recupera un 45 % de su vida.',apply:s=>{payAll(s,10);healParty(s,.45);}},
    {label:'Tónico amargo',detail:'+6 de vida máxima permanente para todos, pero empezáis el próximo combate con el 85 % de la vida.',apply:s=>{addBoon(s,'vitality',6);weaker(s,.85);}},
    {label:'Seguir',detail:'No ocurre nada.',apply:()=>{}}]},
  shrine:{title:'Santuario de los caídos',text:'Cientos de velas rodean las armaduras de antiguos héroes. Un silencio pesado lo cubre todo.',options:[
    {label:'Arrodillarse',detail:'Todos pierden un 20 % de su vida actual y ganan +4 % de armadura permanente.',apply:s=>{hurtParty(s,.2);addBoon(s,'ward',1);}},
    {label:'Tomar las ofrendas',detail:'Cada uno recibe 25 de tusi, pero los enemigos del próximo combate tendrán un 20 % más de vida.',apply:s=>{for(const p of s.players)p.gold+=25;tougher(s,1.2);}},
    {label:'Encender una vela',detail:'+1 PM en el próximo combate.',apply:s=>addMod(s,'mp',1)}]},
  dice:{title:'Los dados del esqueleto',text:'Un esqueleto con sombrero agita un cubilete. «¿Una partidita? Los vivos siempre pierden… casi siempre.»',options:[
    {label:'Apostar 15 tusi',detail:'Cada uno por su cuenta: 50 % de ganar 40 de tusi; si no, pierde lo apostado.',apply:(s,rng)=>{for(const p of s.players){
      if(p.gold<15){note(s,p.name+' no tiene para apostar.');continue;}
      if(rng()<.5){p.gold+=40;note(s,p.name+' gana a los dados: +40 de tusi.');}else{p.gold-=15;note(s,p.name+' pierde 15 de tusi.');}}}},
    {label:'Apostar sangre',detail:'Cada uno por su cuenta: 50 % de recibir un objeto raro o mejor; si no, pierde un 30 % de su vida.',apply:(s,rng)=>{for(const p of s.players){
      if(rng()<.5){p.bag.push(rollItem(s,rng,{gear:true,minGrade:2,ilvl:itemLevel(s,1)}));note(s,p.name+' gana un objeto raro.');}
      else{const hero=s.units.find(u=>u.id===p.id&&!u.enemy);if(hero&&hero.hp>0)hero.hp=Math.max(1,hero.hp-Math.floor(hero.hp*.3));else weaker(s,.7);note(s,p.name+' pierde la apuesta y sangra.');}}}},
    {label:'No jugar',detail:'El esqueleto se encoge de hombros. No ocurre nada.',apply:()=>{}}]},
  mirror:{title:'Espejo encantado',text:'Tu reflejo no imita tus gestos: sonríe, y señala algo detrás de ti.',options:[
    {label:'Mirar tu reflejo',detail:'+4 % de crítico permanente para todos, pero los enemigos del próximo combate tendrán un 15 % más de vida.',apply:s=>{addBoon(s,'critical',4);tougher(s,1.15);}},
    {label:'Romperlo',detail:'Cada uno recibe una gema de una calidad mejor de la habitual, pero −1 PM en el próximo combate.',apply:(s,rng)=>{giveAll(s,()=>fineGem(s,rng));addMod(s,'mp',-1);}},
    {label:'Taparlo',detail:'No ocurre nada.',apply:()=>{}}]},
  anvil:{title:'Yunque de los enanos',text:'Un yunque todavía caliente y un martillo de runas. Quien lo usó se fue con prisa.',options:[
    {label:'Afilar las armas',detail:'Cada uno paga 20 de tusi y gana +5 % de daño permanente (todos los tipos).',apply:s=>{const payers=s.players.filter(p=>p.gold>=20);for(const p of payers)p.gold-=20;addBoon(s,'power',1,payers);
      for(const p of s.players.filter(p=>!payers.includes(p)))note(s,p.name+' no tiene tusi para afilar su arma.');}},
    {label:'Fundir chatarra',detail:'Cada uno recibe 18 de tusi.',apply:s=>{for(const p of s.players)p.gold+=18;}}]},
  prisoner:{title:'Aventurero encadenado',text:'Un mercenario cuelga de unos grilletes. «Sacadme de aquí y os pagaré… o al menos os daré lo que llevo.»',options:[
    {label:'Liberarlo',detail:'Cada uno recibe un objeto poco común o mejor, pero el ruido atrae: los enemigos tendrán un 10 % más de vida.',apply:(s,rng)=>{giveAll(s,()=>rollItem(s,rng,{gear:true,minGrade:1,ilvl:itemLevel(s,1)}));tougher(s,1.1);}},
    {label:'Quitarle la bolsa',detail:'Cada uno recibe 30 de tusi, pero su maldición os persigue: −1 PA en el próximo combate.',apply:s=>{for(const p of s.players)p.gold+=30;addMod(s,'ap',-1);}},
    {label:'Ignorarlo',detail:'No ocurre nada.',apply:()=>{}}]},
  oracle:{title:'Oráculo ciego',text:'Una figura de ojos vendados os llama por vuestros nombres antes de que habléis.',options:[
    {label:'Escuchar la profecía',detail:'Todos pierden un 15 % de su vida actual; +1 PA y +1 PM en el próximo combate.',apply:s=>{hurtParty(s,.15);addMod(s,'ap',1);addMod(s,'mp',1);}},
    {label:'Pagar 25 tusi',detail:'Quien pague mejora al azar una habilidad que ya conoce (máximo 3/3).',apply:(s,rng)=>{for(const p of s.players){
      if(p.gold<25){note(s,p.name+' no tiene para pagar al oráculo.');continue;}
      const options=trainingChoices(p).filter(choice=>choice.rank>0);if(!options.length)continue;
      p.gold-=25;const choice=pick(options,rng);p.skillRanks[choice.index]++;
      const hero=s.units.find(u=>u.id===p.id);if(hero)hero.skillRanks=[...p.skillRanks];
      note(s,p.name+' mejora '+choice.name+' a '+(choice.rank+1)+'/3.');}}},
    {label:'Marcharse',detail:'No ocurre nada.',apply:()=>{}}]},
  idol:{title:'Ídolo maldito',text:'Una estatuilla de obsidiana con los ojos de rubí. Susurra promesas en una lengua muerta.',options:[
    {label:'Tomar el ídolo',detail:'+10 % de daño permanente para todos, pero −8 de vida máxima permanente.',apply:s=>{addBoon(s,'power',2);addBoon(s,'vitality',-8);}},
    {label:'Arrancarle los ojos',detail:'Cada uno recibe un Rubí de una calidad mejor de la habitual, pero los enemigos tendrán un 15 % más de vida.',apply:s=>{giveAll(s,()=>makeGem(++s.itemId,'ruby',gemQuality(itemLevel(s))+1));tougher(s,1.15);}},
    {label:'Dejarlo',detail:'No ocurre nada.',apply:()=>{}}]},
  mushrooms:{title:'Setas luminosas',text:'Un corro de setas que brillan con un azul enfermizo. Huelen a pan recién hecho.',needsHeroes:true,options:[
    {label:'Comerlas',detail:'Cada uno por su cuenta: 60 % de recuperar un 50 % de su vida; si no, pierde un 15 % pero gana +1 PM en el próximo combate.',apply:(s,rng)=>{let sick=false;
      for(const hero of heroesOf(s)){if(rng()<.6){hero.hp=Math.min(hero.max,Math.max(hero.hp,0)+Math.ceil(hero.max*.5));note(s,hero.name+' se siente renovado.');}
        else{hero.hp=Math.max(1,hero.hp-Math.floor(hero.hp*.15));sick=true;note(s,hero.name+' ve colores durante un rato.');}}
      if(sick)addMod(s,'mp',1);}},
    {label:'Recolectarlas',detail:'Cada uno recibe 14 de tusi.',apply:s=>{for(const p of s.players)p.gold+=14;}}]},
  fallen:{title:'Restos de un héroe',text:'Un esqueleto con armadura abraza su espada. A su lado, una bolsa de cuero.',options:[
    {label:'Dar sepultura',detail:'+5 de vida máxima permanente para todos.',apply:s=>addBoon(s,'vitality',5)},
    {label:'Saquear',detail:'Cada uno recibe 12 de tusi y una gema de una calidad mejor de la habitual, pero empezáis el próximo combate con el 85 % de la vida.',apply:(s,rng)=>{for(const p of s.players)p.gold+=12;giveAll(s,()=>fineGem(s,rng));weaker(s,.85);}}]},
  wellspring:{title:'Manantial sagrado',text:'Agua clara brota de una grieta. Por primera vez en mucho tiempo, el aire huele limpio.',needsHeroes:true,options:[
    {label:'Beber despacio',detail:'Todo el grupo recupera un 60 % de su vida.',apply:s=>healParty(s,.6)},
    {label:'Llenar frascos',detail:'Todo el grupo recupera un 25 % ahora y empezáis el próximo combate con +1 PA.',apply:s=>{healParty(s,.25);addMod(s,'ap',1);}}]}
};
/** Re-tirar el género de la tienda: crece con el piso y con cada re-tirada en la misma tienda. */
export function shopRerollCost(s){return 10+Math.floor(s.floor*1.5)+8*(s.rerolls||0);}
const stockFor=(s,rng)=>Array.from({length:6},(_,i)=>rollItem(s,rng,{bonus:.12,gear:i<4,ilvl:itemLevel(s)}));
function startShop(s,rng){
  s.floor++;
  for(const p of s.players)p.level=s.floor;
  s.phase='shop';
  s.vote=null;
  s.event=null;
  s.ready=[];
  s.stock=stockFor(s,rng);
  s.rerolls=0;
  noTimer(s);
  note(s,'Piso '+s.floor+' · Tienda del mercader.');
}
/** Dar un objeto de la mochila o tusi a otro jugador (fuera de combate). */
function give(s,p,a){
  const to=s.players.find(other=>other.id===a.to);
  if(!to||to.id===p.id)fail('Elige a otro jugador.');
  if(a.gold!==undefined){
    const amount=Number(a.gold);
    if(!Number.isInteger(amount)||amount<=0)fail('Cantidad inválida.');
    if(amount>p.gold)fail('No tienes suficiente tusi.');
    p.gold-=amount;
    to.gold+=amount;
    note(s,p.name+' da '+amount+' tusi a '+to.name+'.');
    return;
  }
  const index=p.bag.findIndex(item=>item.id===a.item);
  if(index<0)fail('Objeto no encontrado en tu mochila.');
  const [item]=p.bag.splice(index,1);
  to.bag.push(item);
  note(s,p.name+' da '+item.name+' a '+to.name+'.');
}
function startEvent(s,rng){
  const hasHeroes=heroesOf(s).length>0;
  const pool=Object.keys(events).filter(id=>!s.route.seen.includes(id)&&(hasHeroes||!events[id].needsHeroes));
  const id=pick(pool.length?pool:Object.keys(events).filter(id=>hasHeroes||!events[id].needsHeroes),rng);
  s.route.seen.push(id);
  s.floor++;
  for(const p of s.players)p.level=s.floor;
  const event=events[id];
  s.phase='event';
  s.event={id,title:event.title,text:event.text,options:event.options.map(({label,detail})=>({label,detail}))};
  s.vote={kind:'event',options:event.options.map((_,i)=>i),votes:{}};
  noTimer(s);
  note(s,'Piso '+s.floor+' · Evento: '+event.title+'.');
}
/**
 * Cartas de habilidad tras un combate:
 * - combates normales (y salas élite sueltas): 3 habilidades que ya tienes, para mejorarlas;
 * - jefes (el intermedio y el final de cada acto): 3 habilidades nuevas de la clase que aún no tienes en la partida.
 * Si no hay bastantes del tipo que toca, se completa con el otro.
 */
function rollTrainingOffer(player,rng,learn=false){
  const shuffle=list=>{const out=[...list];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};
  const all=trainingChoices(player);
  const upgrades=shuffle(all.filter(c=>c.rank>0)),fresh=shuffle(all.filter(c=>c.rank===0));
  const [first,second]=learn?[fresh,upgrades]:[upgrades,fresh];
  return [...first,...second].slice(0,3).map(c=>c.index);
}
/** Las cartas que tiene un jugador para elegir ahora mismo. */
export function trainingOffer(player){
  const all=trainingChoices(player);
  return (player.trainOffer||[]).map(i=>all.find(c=>c.index===i)).filter(Boolean);
}
export function trainingChoices(player){
  return player.skillRanks.flatMap((rank,index)=>rank<3?[{index,rank,name:classes[player.classId].skills[index][0]}]:[]);
}
export function tick(s,rng=Math.random) {
  if(s.paused)return false;
  // Si solo falta gente desconectada, no se la espera: se adelanta el reloj.
  if(awayDue(s)&&(s.deadline==null||s.deadline>Date.now()))s.deadline=Date.now();
  if(s.deadline==null)return false;
  if(Date.now()<s.deadline)return false;
  if(s.phase==='reward'){
    for(const p of s.players.filter(p=>s.training&&!p.trained)){
      const offer=trainingOffer(p);
      const choice=offer.find(choice=>choice.rank>0)||offer[0];
      if(choice)p.skillRanks[choice.index]++;
      p.trained=true;p.trainOffer=[];
    }
    openRoute(s,rng);return true;
  }
  if(s.phase==='map'||s.phase==='event'){resolveVote(s,rng);return true;}
  if(s.phase==='shop'||s.phase==='forge'){openRoute(s,rng);return true;}
  if(s.phase!=='combat')return false;
  const unit=s.units[s.turn];
  if(!alive(unit)){advance(s,rng);return true;}
  if(unit.enemy){
    // Muñeco de prueba: no se mueve ni ataca.
    if(unit.dummy){advance(s,rng);return true;}
    const heroes=s.units.filter(u=>!u.enemy&&alive(u));
    if(!s.enemyPlan){
      if(unit.boss){
        if(bosses[unit.look]?.glyphs)castGlyph(s,unit,heroes);
        const consumed=bossPower(s,unit,heroes,rng);
        unit.cycle=(unit.cycle||0)+1;
        if(consumed||!heroes.some(alive)){advance(s,rng);return true;}
      }
      if(!unit.boss&&monsterSkills[unit.look])unit.cd=(unit.cd??2)-1;
      // Planta carnívora: liana que arrastra y luego muerde.
      if(unit.look==='plant'){
        const caught=plantVine(s,unit,heroes);
        unit.vineCd=Math.max(0,(unit.vineCd??0)-(caught?0:1));
        if(caught){
          if(alive(unit)&&alive(caught))monsterAttack(s,unit,caught,rng);
          advance(s,rng);
          return true;
        }
      }
      const canAttack=[[unit.pos],...paths(s,unit,s.mp)].some(([pos])=>attackOptions(s,unit,heroes,pos).length);
      const leapt=!unit.boss&&monsterLeap(s,unit,heroes,canAttack);
      if(leapt){
        if(alive(unit)&&alive(leapt))monsterAttack(s,unit,leapt,rng);
        advance(s,rng);
        return true;
      }
      const route=planEnemy(s,unit,heroes);
      if(route.length){
        move(s,unit,route);
        s.enemyPlan=unit.id;
        s.deadline=Date.now()+route.length*150+120;
        return true;
      }
    }
    const target=attackOptions(s,unit,heroes.filter(alive),unit.pos)[0];
    if(target&&alive(unit)){
      monsterAttack(s,unit,target,rng);
      retreat(s,unit,heroes);
    }
  }else note(s,unit.name+(playerOf(s,unit.id)?.away?' no está conectado: pasa el turno.':' se quedó sin tiempo.'));
  advance(s,rng);
  return true;
}
/**
 * Jugadores desconectados (el servidor marca player.away cuando dejan de dar señales). Mientras quede
 * alguien conectado, no se les espera: su héroe pasa el turno y los votos o el «listo» se cierran sin ellos.
 * Si se desconectan todos, la partida espera.
 */
const playerOf=(s,id)=>s.players.find(p=>p.id===id);
function awayDue(s){
  const here=s.players.filter(p=>!p.away);
  if(!here.length||here.length===s.players.length)return false;
  if(s.phase==='combat'){
    const unit=s.units[s.turn];
    return !!(unit&&!unit.enemy&&alive(unit)&&!s.enemyPlan&&playerOf(s,unit.id)?.away);
  }
  if((s.phase==='map'||s.phase==='event')&&s.vote)return here.every(p=>Object.hasOwn(s.vote.votes,p.id));
  if(s.phase==='shop'||s.phase==='forge')return here.every(p=>s.ready.includes(p.id));
  if(s.phase==='reward')return here.every(p=>s.picks.includes(p.id)&&(!s.training||p.trained));
  return false;
}
/** El servidor avisa de quién se desconecta o vuelve. Devuelve true si cambió algo. */
export function setAway(s,id,away){
  const player=playerOf(s,id);
  if(!player||!!player.away===away||s.phase==='lobby')return false;
  if(away)player.away=true;else delete player.away;
  note(s,player.name+(away?' se ha desconectado.':' ha vuelto.'));
  return true;
}
/** Ataque de un monstruo con sus rasgos: elemento, robo de vida y encanto. */
function monsterAttack(s,unit,target,rng){
  const trait=monsterTraits[unit.look]||{};
  const element=unit.element||trait.element||'physical';
  const cue=element==='fire'?'blast':element==='chaos'?'venom':element==='magic'||element==='lightning'?'arcane':unit.range>1?'arrow':'slash';
  const special=skillReady(unit)&&!['slime','worm','vampire','bat'].includes(unit.look)?unit.look:null;
  if(special)useSkill(s,unit);
  // Golpes en área: aplastar, erupción y bola de fuego.
  if(special==='slimeking'||special==='lavaslime'){
    const victims=s.units.filter(u=>!u.enemy&&alive(u)&&distance(s,unit.pos,u.pos)===1);
    const cells=[unit.pos,...adjacent(s,unit.pos)];
    emit(s,{kind:'spell',effect:special==='lavaslime'?'blast':'push',actor:unit.id,from:unit.pos,pos:unit.pos,area:cells});
    for(const v of victims)hit(s,unit,v,unit.damage+1+roll(0,2,rng),'damage',false,element);
    return;
  }
  if(special==='imp'){
    const cells=[target.pos,...adjacent(s,target.pos)];
    emit(s,{kind:'spell',effect:'blast',actor:unit.id,from:unit.pos,pos:target.pos,area:cells});
    hit(s,unit,target,unit.damage+1+roll(0,2,rng),'damage',false,element);
    for(const v of s.units.filter(u=>!u.enemy&&alive(u)&&u!==target&&distance(s,target.pos,u.pos)===1))
      hit(s,unit,v,Math.max(1,unit.damage-1),'damage',false,element);
    return;
  }
  emit(s,{kind:'spell',effect:special==='slug'||special==='plant'?'poison':special==='skull'?'arcane':special==='succubus'?'pull':special==='skeleton'?'push':cue,actor:unit.id,from:unit.pos,pos:target.pos,...(element!=='physical'?{element}:{})});
  const before=target.hp;
  hit(s,unit,target,unit.damage+roll(0,2,rng)+(special==='skeleton'?1:0),'damage',false,element);
  const dealt=before-target.hp;
  if(special&&alive(target)){
    if(special==='skeleton'){
      drainMp(s,target,1,1);
      const to=target.pos+(target.pos-unit.pos);
      if(adjacent(s,target.pos).includes(to)&&freeCell(s,to))move(s,target,[to],false);
    }
    if(special==='skull'){effect(target,'weak',1,1);note(s,target.name+' queda maldito: −1 PA en su próximo turno.');}
    if(special==='slug'){drainMp(s,target,2,1);note(s,target.name+' queda pringado: −2 PM.');}
    if(special==='plant'){drainMp(s,target,3,1);note(s,target.name+' queda atrapado por raíces.');}
    if(special==='succubus')drag(s,unit,target,2);
  }
  const steal=unit.look==='vampqueen'?1:Math.max(trait.lifesteal||0,unit.lifesteal||0);
  if(steal&&dealt){
    const amount=Math.min(unit.max-unit.hp,Math.ceil(dealt*steal));
    if(amount>0){
      unit.hp+=amount;
      emit(s,{kind:'heal',unit:unit.id,from:unit.pos,pos:unit.pos,amount});
      note(s,unit.name+' roba '+amount+' PV.');
    }
  }
  if(trait.slime&&alive(target)){
    drainMp(s,target,1,1);
    note(s,unit.name+' deja su baba en '+target.name+': −1 PM en su próximo turno.');
  }
  if(trait.poison&&alive(target)){
    effect(target,'poison',1+Math.floor(s.floor/4),2);
    note(s,unit.name+' envenena a '+target.name+'.');
  }
  if((trait.drain||unit.drain)&&alive(target)&&!target.effects.weak){
    effect(target,'weak',1,1);
    note(s,unit.name+' drena la voluntad de '+target.name+': −1 PA en su próximo turno.');
  }
  if((trait.hamstring||unit.hamstring)&&alive(target)){
    drainMp(s,target,1,1);
    note(s,unit.name+' entorpece a '+target.name+': −1 PM en su próximo turno.');
  }
  if(trait.charm&&alive(target)){
    drainMp(s,target,1,1);
    note(s,unit.name+' encanta a '+target.name+': −1 PM en su próximo turno.');
  }
}
function freeCell(s,pos){
  return onBoard(s,pos)&&!s.walls.includes(pos)&&!s.water?.includes(pos)&&!s.units.some(u=>alive(u)&&u.pos===pos);
}
/** Invoca monstruos alrededor del jefe. */
function summon(s,boss,species,count){
  const around=[...adjacent(s,boss.pos),...adjacent(s,boss.pos).flatMap(p=>adjacent(s,p))].filter((pos,i,list)=>list.indexOf(pos)===i&&freeCell(s,pos));
  const made=[];
  for(const pos of around.slice(0,count)){
    s.minionId=(s.minionId||0)+1;
    const minion=monster(species,'minion'+s.minionId,s.floor,{solo:s.players.length===1});
    minion.hp=minion.max=Math.round(minion.hp*.6);
    minion.minion=boss.id;
    minion.pos=pos;
    s.units.push(minion);
    emit(s,{kind:'spell',effect:'dash',actor:boss.id,from:boss.pos,pos});
    made.push(minion);
  }
  if(made.length)note(s,boss.name+' invoca '+made.length+' '+monsterNames[species].toLowerCase()+(made.length>1?'s':'')+'.');
  return made;
}
/** Arrastra a un héroe hasta n casillas hacia quien lo atrae. */
function drag(s,puller,target,n){
  const steps=[];
  let pos=target.pos;
  for(let i=0;i<n;i++){
    const next=adjacent(s,pos).filter(c=>freeCell(s,c)&&!steps.includes(c)&&distance(s,puller.pos,c)<distance(s,puller.pos,pos)).sort((a,b)=>distance(s,puller.pos,a)-distance(s,puller.pos,b))[0];
    if(next===undefined)break;
    steps.push(next);pos=next;
  }
  if(steps.length)move(s,target,steps,false);
}
/**
 * Liana devoradora: si hay un héroe en la misma fila o columna con el camino totalmente libre
 * (sin muros, líquidos ni unidades entre ambos) y a la vista, lo arrastra hasta el cuerpo a cuerpo.
 */
function plantVine(s,unit,heroes){
  if(unit.look!=='plant'||(unit.vineCd??0)>0)return null;
  const options=[];
  for(const hero of heroes.filter(alive)){
    const sameRow=Math.floor(hero.pos/s.width)===Math.floor(unit.pos/s.width),sameCol=hero.pos%s.width===unit.pos%s.width;
    if(!sameRow&&!sameCol)continue;
    const d=distance(s,unit.pos,hero.pos);
    if(d<2)continue;
    const step=sameRow?Math.sign(hero.pos-unit.pos):Math.sign(hero.pos-unit.pos)*s.width;
    const between=[];
    for(let pos=unit.pos+step;pos!==hero.pos;pos+=step)between.push(pos);
    if(!between.every(pos=>freeCell(s,pos)))continue;
    if(!lineOfSight(s,unit.pos,hero.pos,unit.id))continue;
    options.push({hero,path:[...between].reverse()});
  }
  if(!options.length)return null;
  const {hero,path}=options.sort((a,b)=>priority(s,unit,b.hero,unit.pos)-priority(s,unit,a.hero,unit.pos))[0];
  unit.vineCd=monsterExtraSkills.plant.cd;
  emit(s,{kind:'spell',effect:'pull',actor:unit.id,from:unit.pos,pos:hero.pos,element:'chaos'});
  note(s,unit.name+' usa liana devoradora y arrastra a '+hero.name+'.');
  move(s,hero,path,false);
  return hero;
}
/**
 * Habilidades de movimiento (salto, excavar, niebla). Devuelve el objetivo junto al que cae, o null.
 */
function monsterLeap(s,unit,heroes,canAttack){
  if(!skillReady(unit)||!['slime','worm','vampire'].includes(unit.look))return null;
  if(unit.look==='slime'&&canAttack)return null;
  const living=heroes.filter(alive);
  const pool=unit.look==='slime'?living.filter(h=>distance(s,unit.pos,h.pos)<=6)
    :unit.look==='vampire'?living.filter(h=>distance(s,unit.pos,h.pos)<=7):living;
  const target=[...pool].sort((a,b)=>a.hp-b.hp)[0];
  if(!target)return null;
  const landing=adjacent(s,target.pos).filter(pos=>freeCell(s,pos)&&!s.traps?.some(t=>t.pos===pos))
    .sort((a,b)=>distance(s,unit.pos,a)-distance(s,unit.pos,b))[0];
  if(landing===undefined)return null;
  useSkill(s,unit);
  emit(s,{kind:'spell',effect:'dash',actor:unit.id,from:unit.pos,pos:landing});
  move(s,unit,[landing],false);
  return target;
}
/**
 * Poderes de los jefes. Devuelve true si el poder consume el turno entero.
 */
function bossPower(s,boss,heroes,rng){
  const alivePlayers=heroes.filter(alive);
  if(!alivePlayers.length)return false;
  const cycle=boss.cycle||0;
  const near=[...alivePlayers].sort((a,b)=>distance(s,boss.pos,a.pos)-distance(s,boss.pos,b.pos));
  if(boss.look==='cerberus'){
    if(cycle%2===0){
      for(const hero of alivePlayers){drainMp(s,hero,1,1);emit(s,{kind:'spell',effect:'slow',actor:boss.id,from:boss.pos,pos:hero.pos});}
      note(s,'Cancerbero aúlla: todo el grupo pierde 1 PM en su próximo turno.');
      return false;
    }
    const target=near.at(-1);
    const landing=adjacent(s,target.pos).filter(pos=>freeCell(s,pos)).sort((a,b)=>distance(s,boss.pos,a)-distance(s,boss.pos,b))[0];
    if(landing===undefined)return false;
    const from=boss.pos;
    boss.pos=landing;
    emit(s,{kind:'move',unit:boss.id,look:boss.look,from,path:[landing]});
    note(s,'Cancerbero embiste a '+target.name+'.');
    emit(s,{kind:'spell',effect:'slash',actor:boss.id,from:landing,pos:target.pos});
    hit(s,boss,target,boss.damage+3+roll(0,2,rng));
    const to=target.pos+(target.pos-landing);
    if(alive(target)&&adjacent(s,target.pos).includes(to)&&freeCell(s,to))move(s,target,[to],false);
    return true;
  }
  if(boss.look==='skeletonking'){
    const minions=s.units.filter(u=>alive(u)&&u.minion===boss.id);
    // Invoca cada 3 ciclos (antes cada 2).
    if(cycle%3===0&&minions.length<4)minions.push(...summon(s,boss,'skeleton',2));
    boss.stats.ward=20+12*minions.length;
    if(minions.length)note(s,'Escudo de huesos: el Rey Osario tiene un '+Math.min(ARMOR_CAP,boss.stats.ward)+' % de armadura.');
    return false;
  }
  if(boss.look==='umbralking'&&cycle%2===1){
    const target=near.find(h=>distance(s,boss.pos,h.pos)<=5&&lineOfSight(s,boss.pos,h.pos,boss.id));
    if(!target)return false;
    emit(s,{kind:'spell',effect:'slow',actor:boss.id,from:boss.pos,pos:target.pos});
    note(s,'El Rey del Umbral encadena a '+target.name+' y lo arrastra.');
    drag(s,boss,target,2);
    if(alive(target))hit(s,boss,target,3+Math.floor(s.floor/2),'damage',false,'magic');
    return false;
  }
  if(boss.look==='firedemon'&&cycle%2===0){
    const area=alivePlayers.filter(h=>distance(s,boss.pos,h.pos)<=2);
    const cells=Array.from({length:s.width*s.height},(_,i)=>i).filter(pos=>onBoard(s,pos)&&distance(s,boss.pos,pos)<=2&&!s.walls.includes(pos));
    emit(s,{kind:'spell',effect:'blast',actor:boss.id,from:boss.pos,pos:boss.pos,area:cells});
    note(s,'Nova de fuego del Demonio.');
    for(const hero of area)hit(s,boss,hero,4+Math.floor(s.floor*.6),'damage',false,'fire');
    return false;
  }
  if(boss.look==='sporemother'&&cycle%2===0){
    const sprouts=s.units.filter(u=>alive(u)&&u.minion===boss.id);
    if(sprouts.length<3)summon(s,boss,'plant',2);
    return false;
  }
  if(boss.look==='vampqueen'&&cycle%3===0){
    const bats=s.units.filter(u=>alive(u)&&u.minion===boss.id);
    if(bats.length<4)summon(s,boss,'bat',2);
    return false;
  }
  return false;
}
const support=kind=>supportKinds.includes(kind);
function spellCue(s,unit,pos,kind,area,skill){
  const effect=kind==='damage'?(unit.classId==='tirador'?'arrow':unit.classId==='mago'||unit.classId==='mistico'?'arcane':'slash'):kind;
  // Elemento de la habilidad (para el sonido de impacto): solo en las que no son de apoyo.
  const element=skill&&!supportKinds.includes(kind)&&kind!=='dash'?skillElement(unit,skill):null;
  emit(s,{kind:'spell',effect,actor:unit.id,from:unit.pos,pos,area,...(skill?{name:skill[0]}:{}),...(element&&element!=='physical'?{element}:{})});
}
export function hasRange(s,unit,pos,skill) {
  const [,cost,range,,,,,min=0]=skill;
  if(!onBoard(s,pos)||s.walls.includes(pos)||cost>s.ap||(skillOptions(skill).mpCost||0)>s.mp||castsLeft(s,unit,skill)<=0)return false;
  const d=distance(s,unit.pos,pos);
  // Hechizos en línea recta: solo en la misma fila o columna que el lanzador.
  const line=skillOptions(skill).inLine;
  if(line){
    const dx=Math.abs(pos%s.width-unit.pos%s.width),dy=Math.abs(Math.floor(pos/s.width)-Math.floor(unit.pos/s.width));
    if(dx&&dy&&!(line==='diagonal'&&dx===dy))return false;
  }
  // Cargas (Balestra, Carga heroica): nada en medio de la recta (las trampas no cuentan).
  if(skillOptions(skill).clearPath&&!clearLine(s,unit.pos,pos))return false;
  return d>=min&&d<=range+(modifiableRange(skill)?reachBonus(unit):0);
}
/** Lanzamientos que le quedan este turno a una habilidad con límite (Infinity si no tiene). */
export function castsLeft(s,unit,skill){
  // Tiempo de recarga: tras usarla, no se puede volver a usar durante sus N turnos siguientes.
  if(unit.cooldowns?.[skill[0]]>0)return 0;
  const limit=skillOptions(skill).casts;
  if(!limit)return Infinity;
  return limit-(s.casts?.[unit.id+':'+skill[0]]||0);
}
/** Turnos de recarga que le quedan a una habilidad (0 si está lista). */
export const cooldownLeft=(unit,skill)=>Math.max(0,(unit.cooldowns?.[skill[0]]||0)-1);
function countCast(s,unit,skill,target=null){
  // Una vez por objetivo y turno (Detonadora, Dardo pestilente).
  if(target&&skillOptions(skill).perTarget)((s.castTargets||={})[skill[0]]||=[]).push(target.id);
  const cooldown=skillOptions(skill).cooldown;
  // Habilidades que además cuestan PM (Eclipse).
  if(skillOptions(skill).mpCost)s.mp=Math.max(0,s.mp-skillOptions(skill).mpCost);
  // Se guarda N+1: baja 1 al terminar cada turno propio, y con 0 vuelve a estar lista (N turnos después).
  if(cooldown)(unit.cooldowns||={})[skill[0]]=cooldown+1;
  // Lanza cargada: suma una carga (máximo N; con el máximo, la más vieja se sustituye por la nueva).
  const stack=skillOptions(skill).stack;
  if(stack){
    const list=((unit.stacks||={})[skill[0]]||=[]);
    if(list.length<(stack.max||3))list.push(stack.turns||2);
    else{list.sort((a,b)=>a-b);list[0]=stack.turns||2;}
  }
  if(!skillOptions(skill).casts)return;
  s.casts=s.casts||{};
  const key=unit.id+':'+skill[0];
  s.casts[key]=(s.casts[key]||0)+1;
}
export function inRange(s,unit,pos,skill) {
  return hasRange(s,unit,pos,skill)&&(skillOptions(skill).los===false||lineOfSight(s,unit.pos,pos));
}
/** ¿Están libres (sin muros, agua, vacío ni unidades) todas las casillas entre dos de la misma recta? */
function clearLine(s,from,to){
  const {dx,dy}=direction(s,from,to);
  for(let p=step(s,from,dx,dy);p>=0&&p!==to;p=step(s,p,dx,dy))if(!free(s,p))return false;
  return true;
}
const free=(s,pos)=>onBoard(s,pos)&&!s.walls.includes(pos)&&!s.water?.includes(pos)&&!s.units.some(u=>alive(u)&&u.pos===pos);
export function castableCell(s,unit,pos,skill){
  if(!inRange(s,unit,pos,skill))return false;
  if(skill[5]==='dash'){
    if(!free(s,pos))return false;
    return skillOptions(skill).teleport||paths(s,unit,skill[2]).has(pos);
  }
  if(skill[5]==='leap'&&!free(s,pos))return false;
  return castsOnCell(skill);
}
/** Dirección (una de las 4) desde el lanzador hacia la casilla objetivo. */
function direction(s,from,to){
  const dx=to%s.width-from%s.width,dy=Math.floor(to/s.width)-Math.floor(from/s.width);
  if(!dx&&!dy)return {dx:0,dy:-1};
  return Math.abs(dx)>=Math.abs(dy)?{dx:Math.sign(dx),dy:0}:{dx:0,dy:Math.sign(dy)};
}
const step=(s,pos,dx,dy)=>{
  const x=pos%s.width+dx,y=Math.floor(pos/s.width)+dy;
  return x<0||y<0||x>=s.width||y>=s.height?-1:y*s.width+x;
};
/** Casillas afectadas: cruz, círculo, cono (abre hacia delante) o línea, según la habilidad. */
export function spellArea(s,pos,skill,caster=null) {
  const opts=skillOptions(skill);
  const area=opts.area||(skill[5]==='blast'?'cross':null);
  const size=opts.size||1;
  const cells=new Set([pos]);
  if(area==='cross'||area==='circle'){
    for(let p=0;p<s.width*s.height;p++)if(onBoard(s,p)&&distance(s,pos,p)<=size)cells.add(p);
  }else if(area==='wave'&&caster){
    // Rectángulo delante del lanzador: «size» casillas de largo y «width» de ancho, empezando en la casilla elegida.
    const {dx,dy}=direction(s,caster.pos,pos);
    const half=Math.floor((opts.width||3)/2);
    let center=pos;
    for(let depth=0;depth<size&&center>=0;depth++){
      for(let k=-half;k<=half;k++){const c=k?step(s,center,dy*k,dx*k):center;if(c>=0&&onBoard(s,c))cells.add(c);}
      center=step(s,center,dx,dy);
    }
  }else if(area==='trident'&&caster){
    // Tridente: la casilla elegida es la base y se abre alejándose del lanzador.
    //   X . X . X     (2 casillas más allá)
    //   . X X X .     (1 más allá)
    //   . . X . .     (casilla elegida)
    const {dx,dy}=direction(s,caster.pos,pos);
    const at=(forward,side)=>{
      const x=pos%s.width+dx*forward+dy*side,y=Math.floor(pos/s.width)+dy*forward+dx*side;
      return x<0||y<0||x>=s.width||y>=s.height?-1:y*s.width+x;
    };
    for(const [f,l] of [[1,-1],[1,0],[1,1],[2,-2],[2,0],[2,2]]){const c=at(f,l);if(c>=0)cells.add(c);}
  }else if(area==='tee'&&caster){
    // T invertida: la casilla elegida es el centro de la barra y el palo se aleja del lanzador.
    //   . . X . .     (2 más allá)
    //   . . X . .     (1 más allá)
    //   X X X X X     (casilla elegida en el centro)
    const {dx,dy}=direction(s,caster.pos,pos);
    const at=(forward,side)=>{
      const x=pos%s.width+dx*forward+dy*side,y=Math.floor(pos/s.width)+dy*forward+dx*side;
      return x<0||y<0||x>=s.width||y>=s.height?-1:y*s.width+x;
    };
    for(const [f,l] of [[0,-2],[0,-1],[0,1],[0,2],[1,0],[2,0]]){const c=at(f,l);if(c>=0)cells.add(c);}
  }else if((area==='cone'||area==='line')&&caster){
    const {dx,dy}=direction(s,caster.pos,pos);
    let row=[pos];
    for(let depth=1;depth<=size+(area==='line'?0:0);depth++){
      const next=[];
      for(const c of row){const n=step(s,c,dx,dy);if(n>=0)next.push(n);}
      if(area==='cone'){
        const center=next[Math.floor(next.length/2)]??-1;
        if(center>=0)for(let k=1;k<=depth;k++)for(const sign of [-1,1]){const side=step(s,center,dy*sign*k,dx*sign*k);if(side>=0)next.push(side);}
      }
      for(const c of next)if(onBoard(s,c))cells.add(c);
      row=area==='line'?next.slice(0,1):next.slice(0,1);
      if(!row.length)break;
    }
  }
  return [...cells].filter(c=>onBoard(s,c)&&!s.walls.includes(c));
}
export function targetable(s,unit,target,skill) {
  if(skillOptions(skill).perTarget&&target&&s.castTargets?.[skill[0]]?.includes(target.id))return false;
  if(!target||!alive(target)||!inRange(s,unit,target.pos,skill))return false;
  if(skill[5]==='swap'||skillOptions(skill).anyTarget)return target!==unit;
  return !!target.enemy!==supportKinds.includes(skill[5]);
}
/** Empuja (o atrae) a una unidad casilla a casilla; si choca, recibe daño por cada casilla que faltaba. */
function shove(s,actor,target,cells,toward,origin=actor.pos,crash=true){
  // Desde un punto (el centro de un área): quien está justo encima sale en la dirección del lanzamiento.
  const {dx,dy}=origin===target.pos?direction(s,actor.pos,origin):direction(s,origin,target.pos);
  const sx=toward?-dx:dx,sy=toward?-dy:dy;
  const path=[];
  let pos=target.pos;
  for(let i=0;i<cells;i++){
    const next=step(s,pos,sx,sy);
    if(next<0||!free(s,next)||(toward&&next===actor.pos))break;
    path.push(next);pos=next;
  }
  if(path.length)move(s,target,path,false);
  const missing=cells-path.length;
  if(!toward&&crash&&missing>0&&alive(target)){
    // Choque: daño sin elemento ni escalado = 2 × casillas que faltaban + mitad del nivel del que empuja.
    const amount=2*missing+Math.floor((actor.level||s.floor||0)/2);
    hit(s,actor,target,amount,'damage',false,'neutral');
    note(s,target.name+' choca: +'+amount+' de daño por empuje.');
  }
}
/**
 * En guardia!: escudo del 10 % de la vida máxima + el nivel hasta el próximo turno del lanzador.
 * Al terminar su turno se crea una zona (círculo de 3 a su alrededor) que dura hasta su próximo turno:
 * cada enemigo que entre recibe el daño de la habilidad y es empujado 2 casillas (una vez por enemigo).
 */
function guard(s,unit,skill){
  const amount=Math.round(unit.max*.1)+(unit.level||0);
  unit.effects.barrier={value:amount,turns:99,untilOwnTurn:true};
  unit.guardPending={skill:skill[0],size:skillOptions(skill).size||3,push:2};
  emit(s,{kind:'buff',tone:'shield',unit:unit.id,pos:unit.pos,text:'⛨ '+amount});
  note(s,unit.name+' se pone en guardia: escudo de '+amount+'. Al terminar su turno, quien se acerque será rechazado.');
}
/** Zona de En guardia!: se activa cuando un enemigo entra en ella (una vez por enemigo). */
function guardZoneCheck(s,unit,previous){
  for(const zone of s.guardZones||[]){
    const owner=s.units.find(u=>u.id===zone.owner);
    if(!owner||!alive(owner)||!alive(unit)||!!owner.enemy===!!unit.enemy||zone.hit.includes(unit.id))continue;
    const inside=p=>p>=0&&distance(s,owner.pos,p)<=zone.size;
    if(!inside(unit.pos)||inside(previous))continue;
    zone.hit.push(unit.id);
    const index=classes[owner.classId]?.skills.findIndex(k=>k[0]===zone.skill);
    const skill=index>=0?skillFor(owner,index,true):null;
    note(s,unit.name+' entra en la guardia de '+owner.name+'.');
    if(skill&&skill[4]>0)hit(s,owner,unit,scaledDamage(owner,skill,roll(skill[3],skill[4],Math.random)),'damage',false,armorType(owner,skill),false);
    if(alive(unit))shove(s,owner,unit,zone.push,false);
    return true;
  }
  return false;
}
/** Aplica una habilidad a una unidad concreta (daño, efectos, empuje...). */
/** ¿Es una habilidad de daño en área? */
export function isAreaDamage(skill){
  const o=skillOptions(skill);
  return (skill[5]==='blast'||!!o.area)&&skill[4]>0&&!supportKinds.includes(skill[5]);
}
/** Daño en área: pleno en la casilla central y −20 % por cada casilla de distancia (mínimo 60 %). */
export function areaFalloff(s,center,pos,skill){
  if(!isAreaDamage(skill)||center==null||pos==null)return 1;
  return Math.max(.6,1-.2*distance(s,center,pos));
}
function applySkill(s,unit,target,skill,rng,scale=1,origin){
  const [name,,,min,max,kind]=skill;
  const opts=skillOptions(skill);
  const value=opts.value;
  if(supportKinds.includes(kind)){
    if(kind==='shield'){effect(target,'shield',value||25,2);note(s,name+' → '+target.name+': +'+(value||25)+' % de armadura 2 turnos.');emit(s,{kind:'buff',tone:'shield',unit:target.id,pos:target.pos,text:'+'+(value||25)+' % armadura'});return;}
    if(kind==='reach'){
      effect(target,'reach',value||3,opts.turns||2);
      note(s,name+': +'+(value||3)+' de alcance en los hechizos de alcance modificable durante '+(opts.turns||2)+' turnos.');
      emit(s,{kind:'buff',tone:'mp',unit:target.id,pos:target.pos,text:'+'+(value||3)+' alcance'});
      return;
    }
    if(kind==='eclipse'){
      const foes=s.units.filter(u=>alive(u)&&!!u.enemy!==!!unit.enemy);
      for(const foe of foes){effect(foe,'blind',value||6,1);emit(s,{kind:'buff',tone:'blind',unit:foe.id,pos:foe.pos,text:'−'+(value||6)+' alcance'});}
      note(s,name+': todos los enemigos pierden '+(value||6)+' de alcance en su próximo turno.');
      return;
    }
    if(kind==='sprint'){s.mp+=value||2;note(s,name+': +'+(value||2)+' PM este turno.');emit(s,{kind:'mp',gain:true,unit:target.id,pos:target.pos,amount:value||2});return;}
    if(kind==='fury'){effect(target,'fury',value||10,opts.turns||2);note(s,name+': +'+(value||10)+' % de daño final (más con daño de fuego) durante 2 turnos.');emit(s,{kind:'buff',tone:'fury',unit:target.id,pos:target.pos,text:'+'+Math.round((furyBonus(target)-1)*100)+' % daño'});return;}
    if(kind==='haste'){effect(target,'haste',value||2,target===unit?2:1);note(s,name+' → '+target.name+': +'+(value||2)+' PM en su próximo turno.');emit(s,{kind:'buff',tone:'mp',unit:target.id,pos:target.pos,text:'+'+(value||2)+' PM'});return;}
    const amount=Math.min(target.max-target.hp,Math.round((roll(min,max,rng)+Math.floor(unit.level/2))*(1+(passiveEffects(unit).healPct||0)/100)));
    target.hp+=amount;
    if(kind==='cleanse')for(const key of ['poison','burn','slow','expose','weak'])delete target.effects[key];
    emit(s,{kind:'heal',unit:target.id,from:unit.pos,pos:target.pos,amount});
    note(s,name+' → '+target.name+' · +'+amount+' PV'+(kind==='cleanse'?' · purificado':''));
    return;
  }
  if(kind==='swap'){
    const a=unit.pos,b=target.pos;
    unit.pos=b;target.pos=a;
    emit(s,{kind:'move',unit:unit.id,look:unit.look||unit.classId,from:a,path:[b]});
    emit(s,{kind:'move',unit:target.id,look:target.look||target.classId,from:b,path:[a]});
    note(s,unit.name+' intercambia su posición con '+target.name+'.');
    return;
  }
  // Cargas (Balestra, Carga heroica): primero corre en línea recta hasta quedar pegado al objetivo.
  let dir=null,traveled=0;
  if(kind==='lunge'||kind==='charge'){
    dir=direction(s,unit.pos,target.pos);
    const start=unit.pos,route=[];
    for(let p=step(s,unit.pos,dir.dx,dir.dy);p>=0&&p!==target.pos;p=step(s,p,dir.dx,dir.dy))route.push(p);
    if(route.length)move(s,unit,route,false,false,'charge');
    traveled=distance(s,start,unit.pos);
    if(!alive(unit))return;
  }
  // Los hechizos que pueden apuntar a aliados (como el Gancho) no les hacen daño; los «friendly» sí.
  if(max>0&&(opts.friendly||!!target.enemy!==!!unit.enemy)){
    const element=skillElement(unit,skill);
    const critical=rng()<Math.min(1,critChance(unit)+(opts.crit||0)/100);
    const before=target.hp;
    // Con «burnChance», el fuego solo quema con esa probabilidad (si no, siempre).
    const burns=opts.burnChance===undefined||rng()*100<opts.burnChance;
    // Lanza abisal: más daño si el objetivo está pegado.
    const melee=opts.meleeBonus&&distance(s,unit.pos,target.pos)===1?1+opts.meleeBonus/100:1;
    hit(s,unit,target,scaledDamage(unit,skill,roll(min,max,rng),scale*melee),'damage',critical,armorType(unit,skill),burns);
    if(burns)ignite(s,target,before-target.hp,element);
    // Robo de vida de la habilidad (Punzón): un % del daño hecho de verdad.
    if(opts.lifesteal&&alive(unit)){
      const heal=Math.min(unit.max-unit.hp,Math.round((before-target.hp)*opts.lifesteal/100));
      if(heal>0){unit.hp+=heal;emit(s,{kind:'heal',unit:unit.id,from:target.pos,pos:unit.pos,amount:heal});note(s,unit.name+' se cura '+heal+' PV.');}
    }
  }
  // Balestra: se teletransporta detrás del objetivo (si esa casilla está ocupada, se queda pegado).
  if(kind==='lunge'&&alive(unit)){
    const behind=step(s,target.pos,dir.dx,dir.dy);
    if(behind>=0&&free(s,behind))move(s,unit,[behind],false,true,'bolt');
  }
  if(!alive(target))return;
  // Carga heroica: empuja tantas casillas como recorrió + 1 (a un aliado sin daño por choque).
  if(kind==='charge')shove(s,unit,target,traveled+1,false,unit.pos,!!target.enemy!==!!unit.enemy);
  if(kind==='expose'){effect(target,'expose',value||3,2);note(s,target.name+' queda vulnerable: todos los atacantes infligen +'+(value||3)+'.');}
  if(kind==='slow'&&(opts.slowChance===undefined||rng()*100<opts.slowChance)){
    // Flecha helada: siempre −1 PM y a veces −2.
    const amount=opts.slowBonus&&rng()*100<opts.slowBonus.chance?opts.slowBonus.value:value||2;
    drainMp(s,target,amount,1);
    if(opts.slowChance!==undefined)note(s,target.name+' queda ralentizado: −'+(value||2)+' PM.');
  }
  if(kind==='venom'){effect(target,'poison',value||3,2);note(s,target.name+' queda envenenado.');}
  if(kind==='detonate'&&!!target.enemy!==!!unit.enemy){
    const [lo,hi]=opts.detonate||[3,5];
    target.effects.detonate={value:scaledDamage(unit,skill,roll(lo,hi,rng)),turns:1,by:unit.id};
    note(s,target.name+' queda detonado: estallará al acabar su turno.');
  }
  if(kind==='curse'){effect(target,'weak',value||1,1);note(s,target.name+' pierde '+(value||1)+' PA en su próximo turno.');}
  if(kind==='corrode'){
    effect(target,'corrode',value||25,1);
    if(opts.poison)effect(target,'poison',opts.poison,1);
    note(s,target.name+': −'+(value||25)+' % a todas sus resistencias y envenenado.');
  }
  if(kind==='push')shove(s,unit,target,opts.push||1,false,origin??unit.pos);
  if(kind==='pull')shove(s,unit,target,opts.pull==='melee'?Math.max(0,distance(s,unit.pos,target.pos)-1):opts.pull||1,true);
}
function gearAction(s,p,a,rng) {
  const bagIndex=p.bag.findIndex(item=>item.id===a.item);
  const item=p.bag[bagIndex];
  if(a.type==='train'){
    if(!s.training||p.trained)fail('No tienes una mejora pendiente.');
    const choice=trainingOffer(p).find(option=>option.index===a.skill);
    if(!choice)fail('Esa habilidad no está entre las cartas ofrecidas.');
    p.skillRanks[choice.index]++;
    p.trained=true;
    p.trainOffer=[];
  }else if(a.type==='reward'){
    const choices=s.offers[p.id];
    if(s.picks.includes(p.id)||!choices)fail('Ya elegiste botín.');
    const loot=choices.find(choice=>choice.id===a.item);
    if(!loot&&a.item!==null)fail('Botín inválido.');
    if(loot&&a.equip===true&&loot.kind==='gear'){
      const key=equipTarget(p,loot,a.slot);
      if(p.equipment[key])p.bag.push(p.equipment[key]);
      p.equipment[key]=loot;
    }else if(loot)p.bag.push(loot);
    s.picks.push(p.id);
  }else if(a.type==='buy'){
    if(s.phase!=='shop')fail('Solo puedes comprar en la tienda.');
    const i=s.stock.findIndex(listing=>listing.id===a.item);
    if(i<0)fail('Ya no está a la venta.');
    if(p.gold<s.stock[i].price)fail('No tienes suficiente tusi.');
    const [bought]=s.stock.splice(i,1);
    p.gold-=bought.price;
    p.bag.push(bought);
  }else if(a.type==='unequip'){
    if(!Object.hasOwn(p.equipment,a.slot))fail('Ranura vacía.');
    p.bag.push(p.equipment[a.slot]);
    delete p.equipment[a.slot];
  }else if(a.type==='unsocket'){
    fail('Las gemas engastadas son permanentes: no se pueden extraer.');
  }else if(a.type==='next'){
    if(s.players[0].id!==p.id)fail('Solo el anfitrión puede continuar.');
    if(s.picks.length!==s.players.length)fail('Falta elegir botín.');
    if(s.training&&s.players.some(p=>!p.trained))fail('Falta elegir habilidades.');
    openRoute(s,rng);
  }else{
    if(!item)fail('Objeto no encontrado.');
    if(a.type==='equip'&&item.kind==='gear'){
      if(a.slot!==undefined&&slotKind(a.slot)!==item.slot)fail('Ese objeto no encaja en la ranura.');
      const key=equipTarget(p,item,a.slot);
      p.bag.splice(bagIndex,1);
      if(p.equipment[key])p.bag.push(p.equipment[key]);
      p.equipment[key]=item;
    }else if(a.type==='socket'&&item.kind==='rune'&&Object.hasOwn(p.equipment,a.slot)){
      const gear=p.equipment[a.slot];
      const set=runesOf(gear);
      if(socketsOf(gear)===0)fail('Ese equipo no tiene huecos para gemas (la forja puede abrirle uno).');
      if(set.length>=socketsOf(gear))fail('Ese equipo no tiene huecos libres: las gemas engastadas son permanentes y no se pueden reemplazar.');
      p.bag.splice(bagIndex,1);
      gear.runes=[...set,item];delete gear.socket;
    }else if(a.type==='sell'){
      if(s.phase!=='shop')fail('Solo puedes vender en la tienda.');
      p.bag.splice(bagIndex,1);
      const earned=Math.floor(item.price/2)+runesOf(item).reduce((sum,r)=>sum+Math.floor(r.price/2),0);
      p.gold+=earned;
      note(s,p.name+' vende '+item.name+' por '+earned+' tusi.');
    }else fail('Acción de inventario inválida.');
  }
}
export function act(s,id,a,rng=Math.random) {
  const player=s.players.find(p=>p.id===id);
  if(!player)fail('Jugador desconocido.');
  const host=s.players[0].id===id;
  // En la sala, antes de empezar: cada jugador puede cambiar de clase y de maestrías.
  // (Las maestrías las pone el servidor desde la cuenta, nunca el propio cliente.)
  if(a.type==='class'&&s.phase==='lobby'){
    if(!Object.hasOwn(classes,a.classId))fail('Elige una clase válida.');
    player.classId=a.classId;
    lobbyLoadout(player);
    return;
  }
  if(a.type==='loadout'&&s.phase==='lobby'){
    if(!a.trusted)fail('Las cartas se cargan desde tu cuenta.');
    player.loadouts=a.loadouts||{};
    lobbyLoadout(player);
    return;
  }
  if(a.type==='start'&&s.phase==='lobby'&&host){
    s.route=makeRoute(rng,1);
    s.act=1;
    s.bossKills=0;
    openRoute(s,rng);
    return;
  }
  // Pausa: congela el reloj (turno, voto, tienda...) y a los enemigos; cualquiera puede pausar o reanudar.
  if(a.type==='pause'){
    if(['lobby','over'].includes(s.phase))fail('No hay nada que pausar.');
    if(!s.paused){
      s.paused={by:player.name,at:Date.now(),left:s.deadline==null?null:Math.max(0,s.deadline-Date.now())};
      note(s,player.name+' pausa la partida.');
    }else{
      const gone=Date.now()-s.paused.at;
      s.deadline=s.paused.left==null?null:Date.now()+s.paused.left;
      if(s.turnStarted)s.turnStarted+=gone;
      note(s,player.name+' reanuda la partida.');
      s.paused=null;
    }
    return;
  }
  if(s.paused)fail('La partida está en pausa.');
  const calm=['reward','shop','forge','map','event'].includes(s.phase);
  if(a.type==='give'){
    if(!calm)fail('Solo podéis intercambiar fuera del combate.');
    give(s,player,a);
    return;
  }
  if(calm&&['equip','unequip','socket','unsocket'].includes(a.type)){gearAction(s,player,a,rng);return;}
  if(s.phase==='map'||s.phase==='event'){
    if(a.type!=='vote')fail('Ahora toca votar.');
    castVote(s,player,a.option,rng);
    return;
  }
  if(s.phase==='forge'){
    if(a.type==='ready'){
      if(!s.ready.includes(player.id))s.ready.push(player.id);
      else s.ready=s.ready.filter(id=>id!==player.id);
      if(s.players.every(p=>s.ready.includes(p.id)))openRoute(s,rng);
      else armTimer(s,s.ready.length);
      return;
    }
    if(a.type!=='forge')fail('Acción no disponible en la forja.');
    const item=player.bag.find(i=>i.id===a.item)||Object.values(player.equipment).find(i=>i.id===a.item);
    if(!forgeModes[a.mode])fail('Operación de forja desconocida.');
    const blocked=forgeBlock(item,a.mode);
    if(blocked)fail(blocked);
    const cost=forgeCost(item,a.mode);
    if(player.gold<cost)fail('No tienes suficiente tusi.');
    player.gold-=cost;
    const before=item.rarity;
    forgeItem(item,a.mode,rng);
    note(s,player.name+' forja '+item.name+' ('+forgeModes[a.mode].name.toLowerCase()+(before!==item.rarity?' → '+item.rarity.toLowerCase():'')+') por '+cost+' tusi.');
    return;
  }
  if(s.phase==='shop'&&a.type==='reroll-shop'){
    const cost=shopRerollCost(s);
    if(player.gold<cost)fail('No tienes suficiente tusi para re-tirar la tienda.');
    player.gold-=cost;
    s.stock=stockFor(s,rng);
    s.rerolls=(s.rerolls||0)+1;
    note(s,player.name+' paga '+cost+' tusi y el mercader saca género nuevo.');
    return;
  }
  if(s.phase==='shop'){
    if(a.type==='ready'){
      if(!s.ready.includes(player.id))s.ready.push(player.id);
      else s.ready=s.ready.filter(id=>id!==player.id);
      if(s.players.every(p=>s.ready.includes(p.id)))openRoute(s,rng);
      else armTimer(s,s.ready.length);
      return;
    }
    if(!['buy','sell'].includes(a.type))fail('Acción no disponible en la tienda.');
    gearAction(s,player,a,rng);
    return;
  }
  if(a.type==='restart'&&['won','lost'].includes(s.phase)&&host){
    Object.assign(s,create(),{players:s.players.map(p=>{
      const fresh={...p,equipment:{},bag:[],level:1,xp:0,trained:true,boons:{}};
      lobbyLoadout(fresh);
      return fresh;
    }),seq:s.seq});
    return;
  }
  if(s.phase==='reward'){gearAction(s,player,a,rng);return;}
  if(s.phase!=='combat'||s.units[s.turn].id!==id||(s.deadline!=null&&Date.now()>=s.deadline))fail('No es tu turno.');
  const unit=s.units[s.turn];
  if(a.type==='end'){advance(s,rng);return;}
  if(a.type==='move'){
    const path=paths(s,unit,s.mp).get(a.pos);
    if(!path)fail('Casilla fuera de alcance.');
    move(s,unit,path);
    if(!alive(unit))advance(s,rng);
    return;
  }
  const skill=skillFor(unit,a.skill);
  if(a.type!=='skill'||!Number.isInteger(a.skill)||!skill)fail('Acción inválida.');
  const [,cost,,,,kind]=skill;
  if(cost>s.ap)fail('No te quedan suficientes puntos de acción.');
  if(castsLeft(s,unit,skill)<=0)fail('Ya usaste '+skill[0]+' todas las veces que permite este turno.');
  const target=s.units.find(u=>alive(u)&&u.pos===a.pos);
  if(kind==='dash'){
    if(!castableCell(s,unit,a.pos,skill))fail('No hay una ruta libre a esa casilla.');
    s.ap-=cost;countCast(s,unit,skill);
    spellCue(s,unit,a.pos,kind);
    const teleport=!!skillOptions(skill).teleport;
    const route=teleport?[a.pos]:paths(s,unit,skill[2]).get(a.pos);
    move(s,unit,route,false,teleport);
    if(!alive(unit))advance(s,rng);
    return;
  }
  if(castsOnCell(skill)){
    if(!castableCell(s,unit,a.pos,skill))fail('Casilla fuera de alcance o sin línea de visión.');
    s.ap-=cost;countCast(s,unit,skill);
    const area=spellArea(s,a.pos,skill,unit);
    spellCue(s,unit,a.pos,kind,area,skill);
    // Salto valiente: se teletransporta a la casilla y golpea alrededor.
    if(kind==='leap')move(s,unit,[a.pos],false,false,'leap');
    const support=supportKinds.includes(kind);
    // Empujes en área: primero los más lejanos, para que no se bloqueen entre ellos.
    const origin=skillOptions(skill).pushFrom==='center'?a.pos:unit.pos;
    // «friendly»: golpea a todo lo que haya en el área, aliados incluidos (Flecha Flamígera).
    const hits=s.units.filter(u=>alive(u)&&area.includes(u.pos)&&(skillOptions(skill).friendly?u!==unit:support?!u.enemy:u.enemy))
      .sort((a,b)=>kind==='push'?distance(s,origin,b.pos)-distance(s,origin,a.pos):kind==='pull'?distance(s,unit.pos,a.pos)-distance(s,unit.pos,b.pos):0);
    if(kind==='guard')guard(s,unit,skill);
    else if(alive(unit))for(const other of hits)applySkill(s,unit,other,skill,rng,areaFalloff(s,a.pos,other.pos,skill),origin);
    // Retroceso del lanzador (Flecha Flamígera): se aleja de la casilla elegida; si choca, se hace daño.
    if(skillOptions(skill).recoil&&alive(unit))shove(s,unit,unit,skillOptions(skill).recoil,false,a.pos);
    finish(s,rng);
    // Habilidades que pasan el turno al lanzarse (En guardia!).
    if(s.phase==='combat'&&(!alive(unit)||skillOptions(skill).endsTurn))advance(s,rng);
    return;
  }
  if(!targetable(s,unit,target,skill))fail('Objetivo inválido, fuera de alcance o sin línea de visión.');
  s.ap-=cost;countCast(s,unit,skill,target);
  spellCue(s,unit,target.pos,kind,undefined,skill);
  applySkill(s,unit,target,skill,rng);
  finish(s,rng);
  if(s.phase==='combat'&&!alive(unit))advance(s,rng);
}

/** Solo para los tests: mover unidades y empezar turnos a mano. */
export const _test={move:(...a)=>move(...a),beginTurn:(...a)=>beginTurn(...a)};
