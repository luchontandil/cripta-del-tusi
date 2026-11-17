/*
 * Habilidades: [nombre, PA, alcance, mín, máx, tipo, símbolo, alcance mínimo, opciones].
 * Opciones: element (elemento), area ('cross'|'circle'|'cone'|'line') y size, push/pull (casillas),
 * value (valor del efecto), los:false (sin línea de visión), teleport, self (sobre sí mismo),
 * max: bonificación al llegar a rango 3 → {range:1}|{modifiable:true}|{crit:10}|{cost:-1}|{value:1}|{push:1}|{size:1}.
 */
export const classes = {
  guardia: {name:'Guardián', hp:58, initiative:10, skills:[
    ['Tajo',2,1,7,10,'damage','⚔',0,{element:'physical',max:{crit:15}}],
    ['Quebrar armadura',2,1,3,5,'expose','✷',0,{element:'physical',value:3,max:{value:2}}],
    ['Segundo aliento',2,0,5,8,'heal','✚',0,{max:{range:2}}],
    ['Empujón de escudo',2,1,4,6,'push','➶',0,{element:'physical',push:3,max:{push:1}}],
    ['Barrido',3,1,6,9,'damage','⚔',0,{element:'physical',area:'cone',max:{cost:-1}}],
    ['Gancho',2,4,2,4,'pull','↢',2,{element:'physical',pull:'melee',inLine:true,anyTarget:true,max:{range:1}}],
    ['Muralla',2,3,0,0,'shield','⛨',0,{value:3,max:{value:1}}],
    ['Golpe de brasas',2,2,7,10,'damage','✹',0,{element:'fire',max:{modifiable:true}}]
  ]},
  tirador: {name:'Arquero', hp:31, initiative:14, skills:[
    ['Flecha precisa',2,7,6,8,'damage','➶',2,{element:'physical',max:{crit:15}}],
    ['Flecha de lastre',2,6,3,5,'slow','❄',2,{element:'ice',value:2,max:{value:1}}],
    ['Flecha perforante',3,8,9,12,'expose','✷',3,{element:'physical',value:3,max:{range:1}}],
    ['Paso atrás',1,1,2,3,'push','↢',0,{element:'physical',push:2,max:{push:1}}],
    ['Lluvia de flechas',3,7,4,7,'blast','✹',3,{element:'physical',area:'cross',max:{cost:-1}}],
    ['Flecha penetrante',3,6,6,9,'damage','➶',2,{element:'physical',area:'line',size:2,max:{size:1}}],
    ['Flecha de retroceso',2,5,3,5,'push','➶',2,{element:'physical',push:2,max:{push:1}}],
    ['Flecha ígnea',2,6,6,9,'damage','✹',2,{element:'fire',max:{crit:15}}]
  ]},
  mistico: {name:'Clérigo', hp:36, initiative:12, skills:[
    ['Luz ardiente',2,4,5,8,'damage','✦',0,{element:'magic',max:{range:1}}],
    ['Restaurar',2,5,6,10,'heal','✚',0,{max:{range:1}}],
    ['Sello de fragilidad',1,4,1,3,'expose','✷',0,{element:'magic',value:3,max:{value:2}}],
    ['Purificar',2,3,3,6,'cleanse','❖',0,{max:{range:2}}],
    ['Escudo sagrado',2,4,0,0,'shield','⛨',0,{value:3,max:{value:2}}],
    ['Celeridad divina',2,4,0,0,'haste','➝',0,{value:2,max:{range:2}}],
    ['Juicio',3,5,6,9,'blast','✹',2,{element:'fire',area:'cross',max:{crit:15}}],
    ['Alba radiante',3,4,8,12,'heal','✚',0,{area:'cross',max:{cost:-1}}]
  ]},
  mago: {name:'Mago', hp:30, initiative:13, skills:[
    ['Descarga arcana',2,6,6,9,'damage','✦',0,{element:'magic',max:{crit:15}}],
    ['Bola de fuego',3,5,6,10,'blast','✹',2,{element:'fire',area:'cross',max:{size:1}}],
    ['Escarcha',2,5,3,6,'slow','❄',0,{element:'ice',value:2,max:{value:1}}],
    ['Cono de hielo',3,1,6,9,'slow','❄',0,{element:'ice',area:'cone',value:1,max:{size:1}}],
    ['Relámpago',3,1,6,10,'damage','✦',0,{element:'lightning',area:'line',size:3,max:{size:1}}],
    ['Onda de choque',2,3,4,6,'push','✦',0,{element:'magic',push:2,max:{push:1}}],
    ['Teletransporte',3,4,0,0,'dash','↢',1,{teleport:true,los:false,max:{range:1}}],
    ['Rayo umbrío',2,6,7,10,'damage','✦',0,{element:'chaos',max:{modifiable:true}}]
  ]},
  sombra: {name:'Ninja', hp:35, initiative:15, skills:[
    ['Shuriken',2,5,5,8,'damage','✧',1,{element:'physical',max:{crit:15}}],
    ['Cuchilla envenenada',2,4,3,5,'venom','✧',0,{element:'chaos',value:3,max:{value:2}}],
    ['Paso de sombra',2,3,0,0,'dash','↢',1,{max:{range:1}}],
    ['Puñalada trasera',3,1,12,16,'damage','⚔',0,{element:'chaos',max:{crit:20}}],
    ['Bomba de humo',2,4,3,5,'slow','❄',0,{element:'chaos',area:'cross',value:1,max:{value:1}}],
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
  return '';
}
export function skillFor(unit,index,preview=false){
  const base=classes[unit.classId]?.skills[index];
  const rank=unit.skillRanks?.[index]??initialSkills[unit.classId]?.[index]??0;
  if(!base||(!rank&&!preview))return null;
  const skill=[...base];
  const opts={...skillOptions(base)};
  skill[8]=opts;
  if(rank>1&&skill[5]!=='dash'&&skill[4]>0){skill[3]+=(rank-1)*2;skill[4]+=(rank-1)*2;}
  if(rank>1&&skill[5]==='dash')skill[2]+=rank-1;
  if(rank>=3){
    const bonus=opts.max||{};
    if(bonus.range)skill[2]+=bonus.range;
    if(bonus.modifiable)opts.modifiable=true;
    if(bonus.crit)opts.crit=(opts.crit||0)+bonus.crit;
    if(bonus.cost)skill[1]=Math.max(1,skill[1]+bonus.cost);
    if(bonus.value)opts.value=(opts.value||0)+bonus.value;
    if(bonus.push){if(opts.push)opts.push+=bonus.push;if(opts.pull)opts.pull+=bonus.push;}
    if(bonus.size)opts.size=(opts.size||1)+bonus.size;
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
export function damageBonus(unit,skill){
  const stats=unit.stats||{};
  if(skillSchool(unit,skill)==='physical')return stats.physical||0;
  const element=skillElement(unit,skill);
  return (stats.magic||0)+(elementalKeys.includes(element)?stats[element]||0:0);
}
/** La armadura frena las habilidades físicas; los hechizos la atraviesan. */
const armorType=(unit,skill)=>skillSchool(unit,skill)==='physical'?'physical':skillElement(unit,skill);
export const modifiableRange=skill=>skillOptions(skill).modifiable??(skill[2]>1&&!['dash','swap'].includes(skill[5]));
/** Tipos de habilidad que se lanzan sobre aliados. */
export const supportKinds=['heal','cleanse','shield','haste'];
/** ¿Se apunta a una casilla (área, teletransporte) en lugar de a una unidad? */
export const castsOnCell=skill=>!!skillOptions(skill).area||skill[5]==='dash'||skill[5]==='blast';
export const slots = {weapon:'Arma',helmet:'Casco',armor:'Armadura',gloves:'Guantes',belt:'Cinturón',boots:'Botas',ring:'Anillo',amulet:'Amuleto',charm:'Talismán'};
export const statNames = {...Object.fromEntries(Object.entries(elements).map(([key,name])=>[key,'Daño '+name.toLowerCase()])),
  vitality:'Vida',reach:'Alcance (habilidades modificables)',ward:'Armadura',critical:'Crítico',movement:'PM',action:'PA'};
export const rarities = ['Normal','Poco común','Raro','Legendario'];
const bases = {
  weapon:['Arco de tejo','Sable de cobre','Cetro de ónice','Lanza de vigía'],
  helmet:['Yelmo del centinela','Capucha del eco','Corona de hollín'],
  armor:['Coraza de escamas','Manto de ceniza','Jubón reforzado'],
  gloves:['Guantes de bruma','Guanteletes del vigía','Mitones de púas'],
  belt:['Cinturón del peregrino','Faja de cuero rojo','Cinto de eslabones'],
  boots:['Botas del umbral','Grebas de bronce','Botas de arena'],
  ring:['Anillo de obsidiana','Sello de cobre','Sortija de sal'],
  amulet:['Amuleto de luna','Colgante de ámbar','Lágrima del alba'],
  charm:['Ojo de la cripta','Diente de vigía','Llave de los ecos']
};
const actionWeapons=new Set(['Cetro de ónice','Lanza de vigía']);
/**
 * Modificadores al estilo Diablo 2 / Path of Exile.
 * Afijos (prefijos, delante del nombre) y sufijos ("del…"). Cada tier tiene
 * un nivel mínimo de objeto (ilvl), un rango de valores, un nombre y un peso.
 */
export const affixes={
  prefix:{
    physical:[[1,1,2,'Cortante'],[2,2,3,'Brutal'],[3,3,5,'Implacable'],[5,5,7,'Feroz'],[7,7,9,'Letal'],[11,9,12,'Devastador'],[16,12,15,'Aniquilador'],[21,15,19,'Apocalíptico']],
    fire:[[1,1,2,'Humeante'],[2,2,3,'Ardiente'],[3,3,5,'Candente'],[5,5,7,'Infernal'],[7,7,9,'Calcinante'],[11,9,12,'Volcánico'],[16,12,15,'Solar'],[21,15,19,'Primordial']],
    ice:[[1,1,2,'Invernal'],[2,2,3,'Polar'],[3,3,5,'Glacial'],[5,5,7,'Boreal'],[7,7,9,'Hiemal'],[11,9,12,'Ártico'],[16,12,15,'Perpetuo'],[21,15,19,'Absoluto']],
    magic:[[1,1,2,'Brillante'],[2,2,3,'Estelar'],[3,3,5,'Astral'],[5,5,7,'Celestial'],[7,7,9,'Sideral'],[11,9,12,'Cósmico'],[16,12,15,'Divino'],[21,15,19,'Infinito']],
    lightning:[[1,1,2,'Chispeante'],[2,2,3,'Eléctrico'],[3,3,5,'Crepitante'],[5,5,7,'Tormentoso'],[7,7,9,'Fulminante'],[11,9,12,'Tronante'],[16,12,15,'Huracanado'],[21,15,19,'del Trueno Eterno']],
    chaos:[[1,1,2,'Lúgubre'],[2,2,3,'Sepulcral'],[3,3,5,'Umbral'],[5,5,7,'Abisal'],[7,7,9,'Espectral'],[11,9,12,'Abismal'],[16,12,15,'Insondable'],[21,15,19,'Primigenio']],
    ward:[[1,1,1,'Firme'],[3,1,2,'Resistente'],[5,2,3,'Inquebrantable'],[7,3,4,'Impenetrable'],[13,4,5,'Colosal'],[19,5,7,'Inmortal']]
  },
  suffix:{
    vitality:[[1,3,5,'del Zorro'],[2,5,8,'del Oso'],[3,8,12,'de la Ballena'],[5,12,16,'del Coloso'],[7,16,22,'del Titán'],[11,22,30,'del Leviatán'],[16,30,40,'del Behemot'],[21,40,52,'de los Dioses']],
    critical:[[1,3,5,'del Halcón'],[2,5,8,'del Cazador'],[4,8,11,'del Asesino'],[6,11,15,'del Verdugo'],[11,15,19,'de la Carnicería'],[17,19,24,'del Apocalipsis']],
    reach:[[3,1,1,'del Vigía'],[9,2,2,'del Horizonte']],
    movement:[[1,1,1,'de la Liebre'],[7,2,2,'del Viento']],
    action:[[3,1,1,'del Erudito']]
  }
};
const elementsAll=['physical','magic','fire','ice','lightning','chaos'];
const slotAffixes={
  weapon:{prefix:elementsAll,suffix:['critical','vitality','action']},
  helmet:{prefix:['ward','fire','ice','magic','lightning'],suffix:['vitality','critical','reach']},
  armor:{prefix:['ward','physical','chaos'],suffix:['vitality','critical']},
  gloves:{prefix:elementsAll,suffix:['critical','vitality']},
  belt:{prefix:['ward','physical','fire','lightning'],suffix:['vitality','critical']},
  boots:{prefix:['ward','ice','chaos'],suffix:['movement','vitality']},
  ring:{prefix:elementsAll,suffix:['critical','vitality']},
  amulet:{prefix:['magic','fire','lightning','chaos','ward'],suffix:['action','vitality']},
  charm:{prefix:elementsAll,suffix:['critical','vitality']}
};
const rareFirst=['Lamento','Colmillo','Susurro','Ruina','Presagio','Garra','Aullido','Eco','Lamento','Fauces','Maldición','Grito'];
const rareSecond=['sombrío','de hueso','carmesí','del ocaso','funesto','de la cripta','errante','voraz','silente','de ceniza','eterno','roto'];
const legendaryNames=['La Última Brasa','Juramento del Umbral','El Ojo Insomne','Lágrima de Tusi','Promesa Rota','Corona del Rey Caído',
  'Fauces del Abismo','Canción de Ceniza','El Vigía Eterno','Pacto de Sangre','Aliento del Oráculo','Silencio del Osario'];
const inscriptions = [
  ['Brasa','fire',2],['Escarcha','ice',2],['Acero','physical',2],['Éter','magic',2],['Chispa','lightning',2],['Umbría','chaos',2],
  ['Muralla','ward',1], ['Centella','critical',8], ['Pulso','vitality',5]
];
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
export function rollItem(s,rng,{bonus=0,gear=false,ilvl,minGrade=0}={}) {
  const itemId = ++s.itemId;
  const level=ilvl??itemLevel(s);
  if (!gear&&!minGrade&&rng()<.22) {
    const [name,key,value]=pick(inscriptions,rng);
    const power=value*(1+Math.floor((level-1)/3));
    return {id:itemId,name:'Runa de '+name,kind:'rune',ilvl:level,price:7+2*level,stats:{[key]:power}};
  }
  const slot=pick(Object.keys(slots),rng);
  const base=pick(bases[slot],rng);
  const grade=rollRarity(level,bonus,rng,minGrade);
  const counts=[rng()<.5?[1,0]:[0,1],[1,1],rng()<.5?[2,1]:[1,2],[2,2]][grade];
  const pool={prefix:[...slotAffixes[slot].prefix],suffix:slotAffixes[slot].suffix.filter(stat=>stat!=='action'||(slot==='amulet'||actionWeapons.has(base)))};
  const mods=[];
  for(const [type,count] of [['prefix',counts[0]],['suffix',counts[1]]]){
    for(let i=0;i<count;i++){
      const available=pool[type].filter(stat=>affixes[type][stat].some(tier=>tier[0]<=level));
      if(!available.length)break;
      const stat=pick(available,rng);
      pool[type].splice(pool[type].indexOf(stat),1);
      const tierIndex=rollTier(affixes[type][stat],level,rng);
      const [,low,high,label]=affixes[type][stat][tierIndex];
      mods.push({type,stat,tier:tierIndex+1,tiers:affixes[type][stat].length,value:roll(low,high,rng),label});
    }
  }
  const stats={};
  for(const mod of mods)stats[mod.stat]=(stats[mod.stat]||0)+mod.value;
  const prefix=mods.find(m=>m.type==='prefix')?.label;
  const suffix=mods.find(m=>m.type==='suffix')?.label;
  const name=grade===3?pick(legendaryNames,rng):grade===2?pick(rareFirst,rng)+' '+pick(rareSecond,rng):
    [base,prefix?.toLowerCase(),suffix].filter(Boolean).join(' ');
  const price=5+grade*8+mods.reduce((sum,m)=>sum+m.tier*2,0)+level;
  return {id:itemId,name,base,kind:'gear',slot,rarity:rarities[grade],grade,ilvl:level,affixes:mods,stats,price,socket:null};
}
const legacyStat={arcane:'magic',shadow:'chaos'};
function sumStats(equipment) {
  const totals=Object.fromEntries(Object.keys(statNames).map(key=>[key,0]));
  for (const gear of Object.values(equipment)) {
    for (const stats of [gear.stats,gear.socket?.stats||{}]) {
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
/** Árbol de maestrías: se compran con los puntos de cuenta y se aplican a todas las partidas futuras. */
export const masteryTree={
  vigor:{name:'Vigor',icon:'hp',max:5,cost:1,description:r=>'+'+4*r+' de vida máxima'},
  fuerza:{name:'Fuerza',icon:'attack',max:5,cost:2,description:r=>'+'+r+' de daño de todos los elementos'},
  precision:{name:'Precisión',icon:'critical',max:5,cost:1,description:r=>'+'+3*r+' % de crítico'},
  coraza:{name:'Coraza',icon:'ward',max:3,cost:2,description:r=>'+'+r+' de armadura'},
  fortuna:{name:'Fortuna',icon:'gold',max:5,cost:1,description:r=>'Empiezas con '+10*r+' tusi'},
  botin:{name:'Ojo para el botín',icon:'xp',max:3,cost:2,description:r=>'Botín de más rareza (+'+10*r+' %)'},
  sabiduria:{name:'Sabiduría',icon:'level',max:1,cost:5,description:()=>'Tu primera habilidad empieza en rango 2'},
  celeridad:{name:'Celeridad',icon:'mp',max:1,cost:8,requires:'vigor',description:()=>'+1 PM en todos los combates'}
};
/** Coste del siguiente rango de una maestría. */
export const masteryCost=(key,rank)=>Math.ceil(masteryTree[key].cost*(rank+1)*1.5);
export function cleanMastery(input={}){
  const out={};
  for(const [key,node] of Object.entries(masteryTree)){
    const rank=Math.floor(Number(input?.[key])||0);
    if(rank>0)out[key]=Math.min(node.max,rank);
  }
  return out;
}
export function join(s,id,name,classId,extra={}) {
  if(s.phase!=='lobby'||s.players.length>=4) fail('La sala no admite más jugadores.');
  if(!Object.hasOwn(classes,classId)) fail('Elige una clase válida.');
  const mastery=cleanMastery(extra.mastery);
  const ranks=skillRanks(classId);
  if(mastery.sabiduria)ranks[0]=Math.min(3,ranks[0]+1);
  const used=new Set(s.players.map(p=>p.color));
  const color=playerColors.find(c=>!used.has(c.id)).id;
  s.players.push({id,name:String(name||'Aventurero').trim().slice(0,22)||'Aventurero',classId,bag:[],equipment:{},
    gold:(mastery.fortuna||0)*10,level:1,xp:0,skillRanks:ranks,trained:true,color,mastery,account:extra.account||null});
}
/** Puntos de cuenta al terminar la partida: según lo lejos que se llegó. */
export function runPoints(summary){
  const floor=Math.max(0,Math.min(ACTS*FLOORS_PER_ACT,Math.floor(Number(summary.floor)||0)));
  const kills=Math.max(0,Math.min(6,Math.floor(Number(summary.bossKills)||0)));
  const acts=Math.max(0,actOf(floor)-1)+(summary.won?1:0);
  return Math.floor(floor/2)+kills*2+acts*5+(summary.won?15:0);
}
export const monsterNames={slime:'Limo',bat:'Murciélago',skull:'Calavera flotante',worm:'Gusano de cripta',slimeking:'Limo colosal',
  skeleton:'Esqueleto',succubus:'Súcubo',vampire:'Vampiro',imp:'Diablillo',slug:'Babosa',plant:'Planta escupidora',lavaslime:'Limo de lava'};
export const ACTS=3,FLOORS_PER_ACT=8;
export const actOf=floor=>Math.min(ACTS,Math.ceil(Math.max(1,floor)/FLOORS_PER_ACT));
export const actFloor=floor=>floor-(actOf(floor)-1)*FLOORS_PER_ACT;
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
  skull:{element:'magic',drain:true,resist:{chaos:60,magic:30,physical:20}},
  skeleton:{ward:2,initiative:7,resist:{chaos:50,ice:30,fire:-25}},
  succubus:{element:'chaos',charm:true,range:5,initiative:12,resist:{chaos:40,magic:25,ice:-25}},
  vampire:{lifesteal:.5,element:'chaos',initiative:10,drain:true,resist:{chaos:50,fire:-30}},
  imp:{element:'fire',range:6,initiative:13,resist:{fire:75,ice:-30}},
  worm:{ward:2,resist:{physical:15,ice:-25}},
  slimeking:{ward:1,resist:{physical:30,lightning:-30}},
  slime:{resist:{physical:25,fire:-25}},
  slug:{ward:1,slime:true,initiative:5,resist:{chaos:30,ice:-30}},
  plant:{range:4,movement:-2,poison:true,initiative:8,resist:{chaos:50,fire:-50}},
  lavaslime:{element:'fire',ward:1,initiative:7,resist:{fire:80,ice:-50}}
};
/** Resistencias de los jefes. */
export const bossResist={skeletonking:{chaos:50,fire:-20},umbralking:{magic:30,lightning:-20},cerberus:{fire:30,ice:-20},
  sporemother:{chaos:50,fire:-40},oracle:{fire:50,ice:-25},vampqueen:{chaos:50,fire:-25},firedemon:{fire:80,ice:-40}};
/**
 * Variantes de monstruo (campeones): aparecen más a menudo en actos avanzados.
 * Suman armadura, velocidad, daño, resistencias o efectos al golpear (−PA, −PM, robo de vida).
 */
export const monsterVariants={
  acorazado:{name:'acorazado',text:'+3 de armadura',apply:u=>{u.stats.ward+=3;}},
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
  const hp=Math.round((16+4*floor)*factor);
  return {id,name:monsterNames[species],look:species,boss:false,elite,enemy:true,resist:{...(trait.resist||{})},
    initiative:trait.initiative||(ranged?11:6),range:trait.range||(ranged?8:1),hp,
    damage:Math.max(1,Math.round((ranged?2+floor:3+floor)*(solo?.85:1))),
    stats:{ward:(trait.ward||0)+(elite?2:0),movement:trait.movement||0},effects:{}};
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
        stats:{ward:3,movement:0},effects:{},cycle:0,resist:{...(bossResist[boss]||{})}});
      continue;
    }
    const ranged=i%2===1&&local+(act-1)*8>1;
    const isElite=!ranged&&(elite&&i===0||(local>=5&&i===2));
    const pool=ranged?life.ranged:life.melee;
    const species=isElite?life.elite:pool[rng?Math.floor(rng()*pool.length):(i+floor)%pool.length];
    lineup.push(maybeVariant(monster(species,'enemy'+i,floor,{ranged,elite:isElite,solo}),act,rng));
  }
  if(!elite)return lineup;
  // Combate de élite: enemigos reforzados; en grupo, además, un refuerzo extra.
  for(const u of lineup){u.hp=Math.round(u.hp*(solo?1.1:1.2));u.damage+=1;u.stats.ward+=1;}
  if(!solo){
    const extra=monster(life.extra,'enemy'+count,floor,{elite:true});
    extra.hp=Math.round(extra.hp*1.3);extra.elite=true;
    lineup.push(extra);
  }
  return lineup;
}
export const distance = (s,a,b) => Math.abs(a%s.width-b%s.width)+Math.abs(Math.floor(a/s.width)-Math.floor(b/s.width));
export const onBoard=(s,pos)=>Number.isInteger(pos)&&pos>=0&&pos<s.width*s.height&&!s.voids?.includes(pos);
const adjacent = (s,pos) => [pos-s.width,pos+s.width,pos-1,pos+1].filter(n=>onBoard(s,n)&&distance(s,pos,n)===1);
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
  // Los obstáculos van en el centro: las columnas de salida de cada bando quedan libres.
  const area={x0:4,x1:w-5,y0:rng()<.5?0:1,y1:h-1-(rng()<.5?0:1)};
  const cells=[];
  styles[style](cells,area,rng);
  // A veces la sala sale simétrica (en espejo arriba/abajo).
  if(rng()<.4)for(const [x,y] of [...cells])cells.push([x,h-1-y]);
  const walls=[];
  for(const [x,y] of cells){
    const pos=y*w+x;
    if(x>=4&&x<=w-5&&y>=0&&y<h&&onBoard(s,pos)&&!walls.includes(pos))walls.push(pos);
  }
  const [nouns,tails]=roomNames[biome]||roomNames.crypt;
  let name=pick(nouns,rng)+' '+pick(tails,rng);
  if(name===s.layoutName)name=nouns[(nouns.indexOf(name.split(' ')[0])+1)%nouns.length]+' '+pick(tails,rng);
  const boundary=new Set();
  const ground=Array.from({length:w*h},(_,pos)=>pos).filter(pos=>onBoard(s,pos));
  const candidates=ground.filter(pos=>pos%w>=4&&pos%w<=w-5&&Math.floor(pos/w)>0&&Math.floor(pos/w)<h-1&&!walls.includes(pos));
  function connected(){
    const visited=new Set([ground.find(pos=>!boundary.has(pos))]);
    for(const pos of visited)for(const next of adjacent(s,pos)){
      if(!boundary.has(next))visited.add(next);
    }
    return visited.size+boundary.size===ground.length;
  }
  for(const pos of walls){
    boundary.add(pos);
    if(!connected())boundary.delete(pos);
  }
  for(let i=0;i<2+Math.floor(s.floor/2)&&candidates.length;i++){
    const pos=candidates.splice(roll(0,candidates.length-1,rng),1)[0];
    boundary.add(pos);
    if(!connected())boundary.delete(pos);
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
      if(connected())water.push(pos);else boundary.delete(pos);
    }
  }
  const pools=s.floor===1?1:biome==='jungle'?roll(2,4,rng):biome==='hell'?roll(1,3,rng):roll(0,2,rng);
  for(let i=0;i<pools&&open.length;i++){
    let pos=open[roll(0,open.length-1,rng)];
    const size=biome==='jungle'?roll(3,6,rng):roll(2,5,rng);
    for(let j=0;j<size&&pos!==undefined;j++){
      if(!boundary.has(pos)){
        boundary.add(pos);
        if(connected())water.push(pos);else boundary.delete(pos);
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
export function heroOffense(hero){
  const ap=4+(hero.stats?.action||0);
  let best=0;
  classes[hero.classId].skills.forEach((_,i)=>{
    const skill=skillFor(hero,i);
    if(!skill||[...supportKinds,'dash','swap'].includes(skill[5])||!(skill[4]>0))return;
    const element=skillElement(hero,skill);
    const average=(skill[3]+skill[4])/2+damageBonus(hero,skill);
    const area=skillOptions(skill).area?1.6:1;
    best=Math.max(best,average*area*Math.floor(ap/skill[1]));
  });
  return best*(1+critChance(hero)*.5);
}
/** Vida efectiva: la armadura reduce cada golpe físico. */
export const heroDefense=hero=>hero.max*(1+(hero.stats?.ward||0)*.09);
/** Héroe "esperado" en un piso: nivel, una mejora de habilidad por piso y equipo medio. */
function expectedHero(classId,floor){
  const ranks=skillRanks(classId);
  for(let i=1;i<floor;i++){const k=ranks.findIndex(r=>r<3);if(k>=0)ranks[k]++;}
  const gear=Math.floor((floor-1)*.8);
  const stats={action:0,ward:Math.floor((floor-1)/3),critical:(floor-1)*1.5};
  for(const key of damageKeys)stats[key]=Math.floor(floor/2)+gear;
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
  const baseWidth=Math.min(16,10+2*s.players.length);
  const baseHeight=7+s.players.length;
  const sizes=[
    [baseWidth,baseHeight],
    [baseWidth+2,baseHeight],
    [baseWidth,baseHeight+1],
    [Math.max(12,baseWidth-2),baseHeight+2]
  ];
  const available=sizes.filter(([width,height])=>width!==s.width||height!==s.height);
  [s.width,s.height]=s.floor===1?sizes[0]:pick(available,mapRng);
  Object.assign(s,contour(s,mapRng));
  s.act=actOf(s.floor);
  s.biome=actBiomes[s.act-1];
  s.glyphs=[];
  const w=s.width;
  const mid=Math.floor(s.height/2);
  const layout=makeLayout(s,mapRng);
  s.layoutName=layout.name;
  s.layoutStyle=layout.style;
  s.walls=layout.walls;
  s.water=layout.water;
  s.traps=layout.traps;
  const trapCells=new Set(s.traps.map(t=>t.pos));
  const free=Array.from({length:w*s.height},(_,pos)=>pos).filter(pos=>onBoard(s,pos)&&!s.walls.includes(pos)&&!s.water.includes(pos)&&!trapCells.has(pos));
  const rightScore=pos=>(pos%w)*4-Math.abs(Math.floor(pos/w)-mid);
  const heroPositions=s.floor===1?[0,-1,1,-2].map(y=>w*(mid+y)+w-2):
    [...free].sort((a,b)=>rightScore(b)-rightScore(a)).slice(0,s.players.length);
  const heroes=s.players.map((p,i)=>{
    const previous=s.units.find(u=>u.id===p.id);
    const level=s.floor;
    p.level=level;
    p.xp=0;
    p.trained=true;
    const stats=sumStats(p.equipment);
    const m=p.mastery||{};
    for(const key of damageKeys)stats[key]+=Math.floor(level/2)+(m.fuerza||0);
    stats.vitality+=4*(m.vigor||0);
    stats.critical+=3*(m.precision||0);
    stats.ward+=m.coraza||0;
    stats.movement+=m.celeridad||0;
    const max=classes[p.classId].hp+stats.vitality+(level-1)*4;
    return {id:p.id,name:p.name,classId:p.classId,color:p.color,level,skillRanks:[...p.skillRanks],initiative:classes[p.classId].initiative,stats,max,
      hp:previous?Math.min(max,Math.max(previous.hp,0)+Math.ceil(max*.45)):max,
      pos:heroPositions[i],effects:{}};
  });
  const lineup=encounter(s.floor,s.players.length,{elite,boss,rng:floorRandom((s.mapSeed^0x9e3779b9)>>>0)});
  const scale=enemyScaling(s.floor,heroes);
  s.scaling=scale;
  if(s.mods.startHpPct)for(const hero of heroes)hero.hp=Math.max(1,Math.min(hero.hp,Math.ceil(hero.max*s.mods.startHpPct)));
  const spawns=s.floor===1?Array.from({length:(s.height-2)*2},(_,i)=>w*(1+Math.floor(i/2))+1+i%2):
    free.filter(pos=>!heroPositions.includes(pos)).sort((a,b)=>a%w-b%w).slice(0,Math.max(12,lineup.length*2));
  const foes=lineup.map(u=>{
    const pos=spawns.splice(roll(0,spawns.length-1,mapRng),1)[0];
    const hp=Math.max(1,Math.round(u.hp*(s.mods.enemyHp||1)*scale.hp));
    return {...u,hp,max:hp,damage:Math.max(1,Math.round(u.damage*scale.damage)),pos};
  });
  s.units=[...heroes,...foes].sort((a,b)=>b.initiative-a.initiative);
  s.turn=0;
  note(s,'Piso '+s.floor+' · '+s.layoutName+(s.voids.length?' · '+s.shape.toUpperCase():'')+(boss?' · '+bosses[boss].name:elite?' · Combate de élite':''));
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
  const blocked=new Set([...s.walls,...(s.voids||[]),...s.units.filter(u=>alive(u)&&u.id!==ignoreId&&u.pos!==from&&u.pos!==to).map(u=>u.pos)]);
  let ix=0,iy=0;
  while(ix<dx||iy<dy) {
    const cross=(1+2*ix)*dy-(1+2*iy)*dx;
    if(cross===0) {
      if(blocked.has(y*s.width+x+sx)&&blocked.has((y+sy)*s.width+x))return false;
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
function netDamage(target,raw,element,critical,extra=0){
  const ward=(target.stats?.ward||0)+(target.effects?.shield?.value||0);
  // Resistencia (o debilidad, si es negativa) al tipo de daño, en %.
  const resist=Math.max(-100,Math.min(90,target.resist?.[element]||0));
  const base=Math.floor((raw+extra)*(critical?1.5:1)*(1-resist/100));
  return Math.max(0,base-(element==='physical'?ward:Math.floor((target.effects?.shield?.value||0)/2)));
}
export const critChance=unit=>Math.min(1,.12+(unit.stats?.critical||0)/100);
export function damagePreview(unit,target,skill){
  if([...supportKinds,'dash','swap'].includes(skill[5])||!(skill[4]>0))return null;
  const element=skillElement(unit,skill);
  const bonus=damageBonus(unit,skill),armor=armorType(unit,skill);
  const extra=target.effects?.expose?.value||0;
  const range=critical=>[skill[3],skill[4]].map(base=>netDamage(target,base+bonus,armor,critical,extra));
  return {normal:range(false),critical:range(true),chance:Math.min(1,critChance(unit)+(skillOptions(skill).crit||0)/100),element};
}
function hit(s,actor,target,raw,kind='damage',critical=false,element='physical') {
  const extra=kind==='damage'?(target.effects.expose?.value||0):0;
  const damage=Math.min(target.hp,netDamage(target,raw,element,critical,extra));
  target.hp-=damage;
  emit(s,{kind,unit:target.id,pos:target.pos,from:actor.pos,amount:damage,critical});
  note(s,actor.name+' → '+target.name+' · −'+damage+' PV'+(extra?' (+'+extra+' vulnerabilidad)':'')+(critical?' · crítico':''));
  if(target.hp<=0)releaseMinions(s,target);
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
function effect(unit,key,value,turns) {
  const previous=unit.effects[key];
  unit.effects[key]={value:Math.max(previous?.value||0,value),turns:Math.max(previous?.turns||0,turns)};
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
    effect(unit,'slow',power.slow,1);
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
function move(s,unit,path,voluntary=true) {
  const from=unit.pos;
  const traveled=[];
  if(!path.length||!alive(unit)||(voluntary&&s.mp===0))return;
  emit(s,{kind:'move',unit:unit.id,look:unit.look||unit.classId,from,path:traveled});
  for(const pos of path) {
    if(!alive(unit)||(voluntary&&s.mp===0))break;
    if(voluntary)s.mp--;
    const previous=unit.pos;
    unit.pos=pos;
    traveled.push(pos);
    applyGlyphs(s,unit,previous);
    const trap=s.traps?.find(t=>t.pos===pos);
    if(trap&&alive(unit))triggerTrap(s,trap,unit);
  }
}
function beginTurn(s) {
  const u=s.units[s.turn];
  s.enemyPlan=null;
  const bonus=u.enemy?{}:s.mods||{};
  s.ap=Math.max(1,4+(u.stats?.action||0)+(bonus.ap||0)-(u.effects.weak?.value||0));
  s.mp=Math.max(0,3+(u.stats?.movement||0)+(bonus.mp||0)+(u.effects.haste?.value||0)-(u.effects.slow?.value||0));
  s.turnStarted=Date.now();
  s.deadline=s.turnStarted+(u.enemy?350:60000);
  if(u.effects.poison)hit(s,{name:'Veneno',pos:u.pos},u,u.effects.poison.value,'poison',false,'chaos');
  applyGlyphs(s,u,-1);
}
function endEffects(unit) {
  for(const [key,status] of Object.entries(unit.effects)) {
    if(--status.turns<=0)delete unit.effects[key];
  }
}
function finish(s,rng) {
  if(!s.units.some(u=>!u.enemy&&alive(u))){
    s.phase='lost';
    s.result={points:runPoints({floor:s.floor,bossKills:s.bossKills,won:false})};
    return true;
  }
  if(s.units.some(u=>u.enemy&&alive(u)))return false;
  const bossFight=s.node?.kind==='boss';
  if(bossFight)s.bossKills=(s.bossKills||0)+1;
  s.phase=bossFight&&s.floor===ACTS*FLOORS_PER_ACT?'won':'reward';
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
      p.trainOffer=rollTrainingOffer(p,rng);
      p.trained=p.trainOffer.length===0;
      p.gold+=Math.round((10+s.floor*4)*(elite?1.5:1));
      const ilvl=itemLevel(s,(elite?1:0)+(bossFight?2:0));
      const luck=(elite?.35:0)+.1*(p.mastery?.botin||0);
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
  endEffects(s.units[s.turn]);
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
const reachOf=unit=>unit.look==='slug'&&skillReady(unit)?3:unit.range;
/** Qué tan apetecible es un héroe: remata a quien pueda matar, va a por sanadores y frágiles. */
function priority(s,unit,hero,pos){
  const ward=hero.stats?.ward||0;
  const lethal=hero.hp<=Math.max(1,unit.damage-(unit.range>1?0:ward))?40:0;
  const healer=hero.classId==='mistico'?5:0;
  const fragile=Math.max(0,8-ward)*.6;
  return lethal+healer+fragile-hero.hp*.35-distance(s,pos,hero.pos)*.3;
}
function attackOptions(s,unit,heroes,pos){
  const reach=reachOf(unit);
  return heroes.filter(h=>alive(h)&&distance(s,pos,h.pos)<=reach&&lineOfSight(s,pos,h.pos,unit.id))
    .sort((a,b)=>priority(s,unit,b,pos)-priority(s,unit,a,pos));
}
const trapsOn=(s,path)=>path.filter(pos=>s.traps?.some(t=>t.pos===pos)).length;
export function planEnemy(s,unit,heroes){
  const routes=paths(s,unit,s.width*s.height);
  const firing=[];
  for(const [pos,path] of [[unit.pos,[]],...routes]){
    const target=attackOptions(s,unit,heroes,pos)[0];
    if(!target)continue;
    const nearest=Math.min(...heroes.map(h=>distance(s,pos,h.pos)));
    const rangedSafety=unit.range>1?Math.min(nearest,unit.range)*2.2:0;
    // Cuerpo a cuerpo: evita quedar rodeado por varios héroes a la vez.
    const crowd=unit.range>1?0:heroes.filter(h=>distance(s,pos,h.pos)===1).length;
    const score=priority(s,unit,target,pos)+rangedSafety-crowd*1.5-path.length*.4-trapsOn(s,path)*12;
    firing.push({path,score});
  }
  const local=firing.filter(option=>option.path.length<=s.mp).sort((a,b)=>b.score-a.score);
  if(local.length)return local[0].path;
  const approach=firing.sort((a,b)=>(a.path.length+trapsOn(s,a.path)*4)-(b.path.length+trapsOn(s,b.path)*4)||b.score-a.score)[0];
  if(approach){
    // Avanza sin detenerse sobre una trampa si puede evitarlo.
    let step=approach.path.slice(0,s.mp);
    while(step.length&&s.traps?.some(t=>t.pos===step.at(-1)))step=step.slice(0,-1);
    return step;
  }
  const nearest=pos=>Math.min(...heroes.map(hero=>distance(s,pos,hero.pos)));
  const available=[...routes].filter(([pos,path])=>path.length<=s.mp&&nearest(pos)<nearest(unit.pos)&&!trapsOn(s,path));
  available.sort(([a,pa],[b,pb])=>nearest(a)-nearest(b)||pa.length-pb.length);
  return available[0]?.[1]||[];
}
/** Tras atacar, los tiradores y los murciélagos se alejan con el movimiento que les quede. */
function retreat(s,unit,heroes){
  if(s.mp<=0||!alive(unit))return;
  if(unit.range<=1&&unit.look!=='bat')return;
  const living=heroes.filter(alive);
  if(!living.length)return;
  const nearest=pos=>Math.min(...living.map(h=>distance(s,pos,h.pos)));
  const here=nearest(unit.pos);
  if(unit.range>1&&here>=3)return;
  const options=[...paths(s,unit,s.mp)].filter(([pos,path])=>!trapsOn(s,path)&&nearest(pos)>here);
  options.sort(([a,pa],[b,pb])=>nearest(b)-nearest(a)||pa.length-pb.length);
  if(options[0])move(s,unit,options[0][1]);
}
// ───────────── Camino entre pisos, eventos y votaciones ─────────────
export const nodeKinds={
  combat:{name:'Combate',description:'Enemigos normales y botín estándar.'},
  elite:{name:'Élite',description:'Enemigos más duros y un limo colosal extra. Botín mejor y 50 % más de tusi.'},
  event:{name:'Evento',description:'Un encuentro sin combate. El grupo vota entre varias opciones.'},
  shop:{name:'Tienda',description:'Un mercader: compra y vende con tusi. Sin combate. Se sigue cuando todos están listos.'},
  boss:{name:'Jefe',description:'Cámara del jefe: un enemigo enorme con poderes propios.'}
};
const voteTime=15000;
/** Árbol de un acto: 8 pisos, 3-4 caminos por piso, jefe a mitad (piso 4) y al final (piso 8). */
export function makeRoute(rng,act=1){
  const rows=[];
  const [midBoss,endBoss]=actBosses[act-1].map(options=>options.length>1?pick(options,rng):options[0]);
  for(let local=1;local<=FLOORS_PER_ACT;local++){
    const floor=(act-1)*FLOORS_PER_ACT+local;
    if(local===4||local===8){
      const boss=local===4?midBoss:endBoss;
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
    // Tiendas solo en el mapa: siempre en los pisos 3 y 7 del acto, a veces en el 6.
    if(local===3||local===7||(local===6&&rng()<.35))kinds[Math.floor(rng()*count)]='shop';
    if(!kinds.some(kind=>kind==='combat'||kind==='elite'))kinds[kinds.indexOf('shop')===0?count-1:0]='combat';
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
  const row=s.route.rows[s.floor-(s.route.act-1)*FLOORS_PER_ACT];
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
  if(s.floor>=s.route.act*FLOORS_PER_ACT&&s.route.act<ACTS){
    s.route=makeRoute(rng,s.route.act+1);
    s.node=null;
    s.act=s.route.act;
    note(s,'Acto '+s.act+' · '+actNames[s.act-1]+'.');
  }
  const options=routeOptions(s);
  if(options.length===1){enterNode(s,findNode(s,options[0]),rng);return;}
  s.phase='map';
  s.event=null;
  s.vote={kind:'map',options,votes:{}};
  s.turnStarted=Date.now();
  s.deadline=s.turnStarted+voteTime;
  note(s,'Piso '+(s.floor+1)+' · El grupo vota el camino.');
}
function enterNode(s,node,rng){
  s.node={id:node.id,kind:node.kind};
  s.route.path.push(node.id);
  if(node.kind==='event'){startEvent(s,rng);return;}
  if(node.kind==='shop'){startShop(s,rng);return;}
  openFloor(s,rng,node.kind==='elite',node.boss||null);
}
function castVote(s,player,option,rng){
  if(!Number.isInteger(option)||option<0||option>=s.vote.options.length)fail('Opción inválida.');
  s.vote.votes[player.id]=option;
  note(s,player.name+' vota: '+voteLabel(s,option)+'.');
  if(s.players.every(p=>Object.hasOwn(s.vote.votes,p.id)))resolveVote(s,rng);
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
const giveAll=(s,make)=>{for(const p of s.players)p.bag.push(make(p));};
export function modText(mods={}){
  const parts=[];
  if(mods.ap)parts.push((mods.ap>0?'+':'−')+Math.abs(mods.ap)+' PA');
  if(mods.mp)parts.push((mods.mp>0?'+':'−')+Math.abs(mods.mp)+' PM');
  if(mods.enemyHp)parts.push('enemigos +'+Math.round((mods.enemyHp-1)*100)+' % de vida');
  if(mods.startHpPct)parts.push('empezáis con el '+Math.round(mods.startHpPct*100)+' % de vida');
  return parts.join(', ');
}
const events={
  fountain:{title:'Fuente de aguas negras',text:'Un manantial oscuro brota entre las losas. El agua huele a hierro y a promesas.',needsHeroes:true,options:[
    {label:'Beber',detail:'Todo el grupo se cura por completo, pero tiene −1 PM en el próximo combate.',apply:s=>{healParty(s,1);addMod(s,'mp',-1);}},
    {label:'Llenar los odres',detail:'Todo el grupo recupera un 30 % de su vida.',apply:s=>healParty(s,.3)},
    {label:'Seguir adelante',detail:'Cada jugador recibe 8 de tusi.',apply:s=>{for(const p of s.players)p.gold+=8;}}]},
  altar:{title:'Altar de sangre',text:'Un altar antiguo exige un tributo. Las runas talladas laten al acercaros.',options:[
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
    {label:'Comprar runas',detail:'Cada uno paga hasta 10 de tusi y recibe una runa.',apply:(s,rng)=>{for(const p of s.players){p.gold=Math.max(0,p.gold-10);let rune;do rune=rollItem(s,rng);while(rune.kind!=='rune');p.bag.push(rune);}}},
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
    {label:'Saquear',detail:'Cada uno recibe 12 de tusi.',apply:s=>{for(const p of s.players)p.gold+=12;}}]}
};
const shopTime=90000;
function startShop(s,rng){
  s.floor++;
  for(const p of s.players)p.level=s.floor;
  s.phase='shop';
  s.vote=null;
  s.event=null;
  s.ready=[];
  s.stock=Array.from({length:6},(_,i)=>rollItem(s,rng,{bonus:.12,gear:i<4,ilvl:itemLevel(s)}));
  s.turnStarted=Date.now();
  s.deadline=s.turnStarted+shopTime;
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
  s.turnStarted=Date.now();
  s.deadline=s.turnStarted+voteTime;
  note(s,'Piso '+s.floor+' · Evento: '+event.title+'.');
}
/**
 * Cartas al subir de nivel: 2 habilidades ya aprendidas (sin rango máximo) para mejorar
 * y 1 habilidad nueva para aprender, al azar. Si falta de un tipo, se completa con el otro.
 */
function rollTrainingOffer(player,rng){
  const shuffle=list=>{const out=[...list];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};
  const all=trainingChoices(player);
  const upgrades=shuffle(all.filter(c=>c.rank>0)),fresh=shuffle(all.filter(c=>c.rank===0));
  const pickUp=upgrades.slice(0,2),pickNew=fresh.slice(0,1);
  const rest=[...upgrades.slice(2),...fresh.slice(1)];
  const offer=[...pickUp,...pickNew];
  while(offer.length<3&&rest.length)offer.push(rest.shift());
  return offer.map(c=>c.index);
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
  if(s.phase==='shop'){openRoute(s,rng);return true;}
  if(s.phase!=='combat')return false;
  const unit=s.units[s.turn];
  if(!alive(unit)){advance(s,rng);return true;}
  if(unit.enemy){
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
  }else note(s,unit.name+' se quedó sin tiempo.');
  advance(s,rng);
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
      effect(target,'slow',1,1);
      const to=target.pos+(target.pos-unit.pos);
      if(adjacent(s,target.pos).includes(to)&&freeCell(s,to))move(s,target,[to],false);
    }
    if(special==='skull'){effect(target,'weak',1,1);note(s,target.name+' queda maldito: −1 PA en su próximo turno.');}
    if(special==='slug'){effect(target,'slow',2,1);note(s,target.name+' queda pringado: −2 PM.');}
    if(special==='plant'){effect(target,'slow',3,1);note(s,target.name+' queda atrapado por raíces.');}
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
    effect(target,'slow',1,1);
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
    effect(target,'slow',1,1);
    note(s,unit.name+' entorpece a '+target.name+': −1 PM en su próximo turno.');
  }
  if(trait.charm&&alive(target)){
    effect(target,'slow',1,1);
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
      for(const hero of alivePlayers){effect(hero,'slow',1,1);emit(s,{kind:'spell',effect:'slow',actor:boss.id,from:boss.pos,pos:hero.pos});}
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
    if(cycle%2===0&&minions.length<4)minions.push(...summon(s,boss,'skeleton',2));
    boss.stats.ward=3+2*minions.length;
    if(minions.length)note(s,'Escudo de huesos: el Rey Osario tiene '+boss.stats.ward+' de armadura.');
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
  emit(s,{kind:'spell',effect,actor:unit.id,from:unit.pos,pos,area,...(element&&element!=='physical'?{element}:{})});
}
export function hasRange(s,unit,pos,skill) {
  const [,cost,range,,,,,min=0]=skill;
  if(!onBoard(s,pos)||s.walls.includes(pos)||cost>s.ap)return false;
  const d=distance(s,unit.pos,pos);
  // Hechizos en línea recta: solo en la misma fila o columna que el lanzador.
  if(skillOptions(skill).inLine&&pos%s.width!==unit.pos%s.width&&Math.floor(pos/s.width)!==Math.floor(unit.pos/s.width))return false;
  return d>=min&&d<=range+(modifiableRange(skill)?(unit.stats?.reach||0):0);
}
export function inRange(s,unit,pos,skill) {
  return hasRange(s,unit,pos,skill)&&(skillOptions(skill).los===false||lineOfSight(s,unit.pos,pos));
}
const free=(s,pos)=>onBoard(s,pos)&&!s.walls.includes(pos)&&!s.water?.includes(pos)&&!s.units.some(u=>alive(u)&&u.pos===pos);
export function castableCell(s,unit,pos,skill){
  if(!inRange(s,unit,pos,skill))return false;
  if(skill[5]==='dash'){
    if(!free(s,pos))return false;
    return skillOptions(skill).teleport||paths(s,unit,skill[2]).has(pos);
  }
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
  if(!target||!alive(target)||!inRange(s,unit,target.pos,skill))return false;
  if(skill[5]==='swap'||skillOptions(skill).anyTarget)return target!==unit;
  return !!target.enemy!==supportKinds.includes(skill[5]);
}
/** Empuja (o atrae) a una unidad casilla a casilla; si choca, recibe daño por cada casilla que faltaba. */
function shove(s,actor,target,cells,toward){
  const {dx,dy}=direction(s,actor.pos,target.pos);
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
  if(!toward&&missing>0&&alive(target)){
    hit(s,actor,target,missing*3+Math.floor(s.floor/3),'damage',false,'physical');
    note(s,target.name+' choca: +'+(missing*3)+' de daño por empuje.');
  }
}
/** Aplica una habilidad a una unidad concreta (daño, efectos, empuje...). */
function applySkill(s,unit,target,skill,rng){
  const [name,,,min,max,kind]=skill;
  const opts=skillOptions(skill);
  const value=opts.value;
  if(supportKinds.includes(kind)){
    if(kind==='shield'){effect(target,'shield',value||3,2);note(s,name+' → '+target.name+': +'+(value||3)+' de armadura 2 turnos.');emit(s,{kind:'heal',unit:target.id,from:unit.pos,pos:target.pos,amount:0});return;}
    if(kind==='haste'){effect(target,'haste',value||2,target===unit?2:1);note(s,name+' → '+target.name+': +'+(value||2)+' PM en su próximo turno.');emit(s,{kind:'heal',unit:target.id,from:unit.pos,pos:target.pos,amount:0});return;}
    const amount=Math.min(target.max-target.hp,roll(min,max,rng)+Math.floor(unit.level/2));
    target.hp+=amount;
    if(kind==='cleanse')for(const key of ['poison','slow','expose'])delete target.effects[key];
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
  // Los hechizos que pueden apuntar a aliados (como el Gancho) no les hacen daño.
  if(max>0&&!!target.enemy!==!!unit.enemy){
    const element=skillElement(unit,skill);
    const critical=rng()<Math.min(1,critChance(unit)+(opts.crit||0)/100);
    hit(s,unit,target,roll(min,max,rng)+damageBonus(unit,skill),'damage',critical,armorType(unit,skill));
  }
  if(!alive(target))return;
  if(kind==='expose'){effect(target,'expose',value||3,2);note(s,target.name+' queda vulnerable: todos los atacantes infligen +'+(value||3)+'.');}
  if(kind==='slow')effect(target,'slow',value||2,1);
  if(kind==='venom'){effect(target,'poison',value||3,2);note(s,target.name+' queda envenenado.');}
  if(kind==='push')shove(s,unit,target,opts.push||1,false);
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
      if(p.equipment[loot.slot])p.bag.push(p.equipment[loot.slot]);
      p.equipment[loot.slot]=loot;
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
    const gear=p.equipment[a.slot];
    if(!gear?.socket)fail('Ese equipo no tiene runa.');
    p.bag.push(gear.socket);
    gear.socket=null;
  }else if(a.type==='next'){
    if(s.players[0].id!==p.id)fail('Solo el anfitrión puede continuar.');
    if(s.picks.length!==s.players.length)fail('Falta elegir botín.');
    if(s.training&&s.players.some(p=>!p.trained))fail('Falta elegir habilidades.');
    openRoute(s,rng);
  }else{
    if(!item)fail('Objeto no encontrado.');
    if(a.type==='equip'&&item.kind==='gear'){
      if(a.slot!==undefined&&a.slot!==item.slot)fail('Ese objeto no encaja en la ranura.');
      p.bag.splice(bagIndex,1);
      if(p.equipment[item.slot])p.bag.push(p.equipment[item.slot]);
      p.equipment[item.slot]=item;
    }else if(a.type==='socket'&&item.kind==='rune'&&Object.hasOwn(p.equipment,a.slot)){
      const gear=p.equipment[a.slot];
      p.bag.splice(bagIndex,1);
      if(gear.socket)p.bag.push(gear.socket);
      gear.socket=item;
    }else if(a.type==='sell'){
      if(s.phase!=='shop')fail('Solo puedes vender en la tienda.');
      p.bag.splice(bagIndex,1);
      const earned=Math.floor(item.price/2)+(item.socket?Math.floor(item.socket.price/2):0);
      p.gold+=earned;
      note(s,p.name+' vende '+item.name+' por '+earned+' tusi.');
    }else fail('Acción de inventario inválida.');
  }
}
export function act(s,id,a,rng=Math.random) {
  const player=s.players.find(p=>p.id===id);
  if(!player)fail('Jugador desconocido.');
  const host=s.players[0].id===id;
  if(a.type==='start'&&s.phase==='lobby'&&host){
    s.route=makeRoute(rng,1);
    s.act=1;
    s.bossKills=0;
    openRoute(s,rng);
    return;
  }
  const calm=['reward','shop','map','event'].includes(s.phase);
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
  if(s.phase==='shop'){
    if(a.type==='ready'){
      if(!s.ready.includes(player.id))s.ready.push(player.id);
      else s.ready=s.ready.filter(id=>id!==player.id);
      if(s.players.every(p=>s.ready.includes(p.id)))openRoute(s,rng);
      return;
    }
    if(!['buy','sell'].includes(a.type))fail('Acción no disponible en la tienda.');
    gearAction(s,player,a,rng);
    return;
  }
  if(a.type==='restart'&&['won','lost'].includes(s.phase)&&host){
    Object.assign(s,create(),{players:s.players.map(p=>{
      const ranks=skillRanks(p.classId);
      if(p.mastery?.sabiduria)ranks[0]=Math.min(3,ranks[0]+1);
      return {...p,equipment:{},bag:[],gold:(p.mastery?.fortuna||0)*10,level:1,xp:0,skillRanks:ranks,trained:true};
    }),seq:s.seq});
    return;
  }
  if(s.phase==='reward'){gearAction(s,player,a,rng);return;}
  if(s.phase!=='combat'||s.units[s.turn].id!==id||Date.now()>=s.deadline)fail('No es tu turno.');
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
  const target=s.units.find(u=>alive(u)&&u.pos===a.pos);
  if(kind==='dash'){
    if(!castableCell(s,unit,a.pos,skill))fail('No hay una ruta libre a esa casilla.');
    s.ap-=cost;
    spellCue(s,unit,a.pos,kind);
    const route=skillOptions(skill).teleport?[a.pos]:paths(s,unit,skill[2]).get(a.pos);
    move(s,unit,route,false);
    if(!alive(unit))advance(s,rng);
    return;
  }
  if(castsOnCell(skill)){
    if(!castableCell(s,unit,a.pos,skill))fail('Casilla fuera de alcance o sin línea de visión.');
    s.ap-=cost;
    const area=spellArea(s,a.pos,skill,unit);
    spellCue(s,unit,a.pos,kind,area,skill);
    const support=supportKinds.includes(kind);
    for(const other of s.units.filter(u=>alive(u)&&area.includes(u.pos)&&(support?!u.enemy:u.enemy)))applySkill(s,unit,other,skill,rng);
    finish(s,rng);
    if(s.phase==='combat'&&!alive(unit))advance(s,rng);
    return;
  }
  if(!targetable(s,unit,target,skill))fail('Objetivo inválido, fuera de alcance o sin línea de visión.');
  s.ap-=cost;
  spellCue(s,unit,target.pos,kind,undefined,skill);
  applySkill(s,unit,target,skill,rng);
  finish(s,rng);
  if(s.phase==='combat'&&!alive(unit))advance(s,rng);
}

