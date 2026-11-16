export const classes = {
  guardia: {name:'Guardián', hp:46, initiative:10, skills:[
    ['Tajo',2,1,7,10,'damage','⚔'],
    ['Quebrar armadura',2,1,3,5,'expose','✷'],
    ['Segundo aliento',2,0,5,8,'heal','✚']
  ]},
  tirador: {name:'Arquero', hp:31, initiative:14, skills:[
    ['Flecha precisa',2,7,5,8,'damage','➶',2],
    ['Flecha de lastre',2,6,3,5,'slow','❄',2],
    ['Flecha perforante',3,8,11,15,'expose','✷',3],
    ['Paso atrás',1,1,2,3,'push','↢']
  ]},
  mistico: {name:'Clérigo', hp:36, initiative:12, skills:[
    ['Luz ardiente',2,4,5,8,'damage','✦'],
    ['Restaurar',2,5,7,11,'heal','✚'],
    ['Sello de fragilidad',2,4,2,4,'expose','✷'],
    ['Purificar',2,3,3,6,'cleanse','❖']
  ]},
  mago: {name:'Mago', hp:30, initiative:13, skills:[
    ['Descarga arcana',2,6,6,9,'damage','✦'],
    ['Bola de fuego',3,5,7,11,'blast','✹',2],
    ['Escarcha',2,5,3,6,'slow','❄']
  ]},
  sombra: {name:'Acechante', hp:35, initiative:15, skills:[
    ['Hoja umbría',2,1,8,11,'damage','⚔'],
    ['Cuchilla envenenada',2,4,3,5,'venom','✧'],
    ['Paso de sombra',2,3,0,0,'dash','↢',1]
  ]}
};
const unlocks={
  guardia:['Golpe de brasas',2,2,8,12,'damage','✹'],
  tirador:['Flecha ígnea',2,6,7,10,'damage','✹',2],
  mistico:['Alba radiante',3,5,12,16,'heal','✚'],
  mago:['Rayo umbrío',2,6,8,12,'damage','✦'],
  sombra:['Corte glacial',2,2,6,10,'slow','❄']
};
const initialSkills=Object.fromEntries(Object.entries(classes).map(([id,cls])=>[id,cls.skills.map(()=>1)]));
for(const [id,skill] of Object.entries(unlocks))classes[id].skills.push(skill);
const skillRanks=id=>[...initialSkills[id],0];
export function skillFor(unit,index,preview=false){
  const base=classes[unit.classId]?.skills[index];
  const rank=unit.skillRanks?.[index]??initialSkills[unit.classId]?.[index]??0;
  if(!base||(!rank&&!preview))return null;
  const skill=[...base];
  if(rank>1){
    if(skill[5]==='dash')skill[2]+=rank-1;
    else {skill[3]+=(rank-1)*2;skill[4]+=(rank-1)*2;}
  }
  return skill;
}
export const elements={physical:'Físico',fire:'Fuego',ice:'Hielo',arcane:'Arcano',shadow:'Sombra'};
const damageKeys=Object.keys(elements);
export function skillElement(unit,skill){
  if(skill[5]==='blast'||skill[6]==='✹')return 'fire';
  if(skill[0]==='Escarcha'||skill[0]==='Corte glacial')return 'ice';
  if(unit.classId==='sombra'||skill[0]==='Rayo umbrío')return 'shadow';
  if(unit.classId==='mago'||unit.classId==='mistico')return 'arcane';
  return 'physical';
}
export const modifiableRange=skill=>skill[2]>1&&skill[5]!=='dash';
export const slots = {weapon:'Arma',helmet:'Casco',armor:'Armadura',gloves:'Guantes',belt:'Cinturón',boots:'Botas',ring:'Anillo',amulet:'Amuleto',charm:'Talismán'};
export const statNames = {...Object.fromEntries(Object.entries(elements).map(([key,name])=>[key,'Daño '+name.toLowerCase()])),
  vitality:'Vida',reach:'Alcance',ward:'Armadura',critical:'Crítico',movement:'PM',action:'PA'};
const rarities = ['Común','Poco común','Raro','Épico'];
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
const pools = {
  weapon:['element','reach','critical'],helmet:['vitality','ward','critical'],armor:['vitality','ward','element'],
  gloves:['element','critical','reach'],belt:['vitality','ward','element'],boots:['movement','vitality','ward'],
  ring:['critical','reach','element'],amulet:['vitality','action','reach'],charm:['element','critical','reach']
};
const actionWeapons=new Set(['Cetro de ónice','Lanza de vigía']);
const inscriptions = [
  ['Brasa','fire',2],['Escarcha','ice',2],['Acero','physical',2],['Éter','arcane',2],['Umbría','shadow',2],['Brújula','reach',1],
  ['Muralla','ward',1], ['Centella','critical',8], ['Pulso','vitality',5]
];
const pick = (values,rng) => values[Math.floor(rng()*values.length)];
const roll = (low,high,rng) => low+Math.floor(rng()*(high-low+1));
const randomSeed = rng => (rng()*4294967296)>>>0;
function floorRandom(seed) {
  return () => {
    seed = (Math.imul(seed,1664525)+1013904223)>>>0;
    return seed/4294967296;
  };
}
function rollItem(s,rng,{bonus=0,gear=false}={}) {
  const itemId = ++s.itemId;
  if (!gear&&rng()<.28) {
    const [name,key,value]=pick(inscriptions,rng);
    return {id:itemId,name:'Runa de '+name,kind:'rune',price:7+2*s.floor,stats:{[key]:value}};
  }
  const slot=pick(Object.keys(slots),rng);
  const name=pick(bases[slot],rng);
  const luck=rng()+s.floor*.055+bonus;
  const rarity=luck>1.08?3:luck>.83?2:luck>.53?1:0;
  const choices=[...pools[slot]];
  if(slot==='weapon'&&actionWeapons.has(name)&&rarity>=2)choices.push('action');
  const stats={};
  for (let i=0;i<Math.min(choices.length,1+rarity);i++) {
    const key=choices.splice(roll(0,choices.length-1,rng),1)[0];
    if(key==='element')stats[pick(damageKeys,rng)]=roll(1,2+rarity,rng);
    else if(key==='vitality')stats[key]=roll(3,5+rarity*3,rng);
    else if(key==='critical')stats[key]=roll(4,7+3*rarity,rng);
    else stats[key]=key==='ward'&&rarity>=2?2:1;
  }
  return {id:itemId,name,kind:'gear',slot,rarity:rarities[rarity],grade:rarity,stats,price:6+rarity*7+s.floor,socket:null};
}
function sumStats(equipment) {
  const totals=Object.fromEntries(Object.keys(statNames).map(key=>[key,0]));
  for (const gear of Object.values(equipment)) {
    for (const stats of [gear.stats,gear.socket?.stats||{}]) {
      for (const [key,value] of Object.entries(stats)){
        if(!Object.hasOwn(totals,key))continue;
        if(key==='movement'&&gear.slot!=='boots')continue;
        if(key==='action'&&gear.slot!=='amulet'&&!(gear.slot==='weapon'&&actionWeapons.has(gear.name)))continue;
        totals[key]+=value;
      }
    }
  }
  return totals;
}
export function create() {
  return {phase:'lobby', floor:0, rounds:0, width:12,height:8,players:[],units:[],walls:[],voids:[],glyphs:[],
    water:[],traps:[],log:[],events:[],seq:0,itemId:0,turn:0,deadline:0,turnStarted:0,picks:[],offers:{},stock:[],training:false,
    route:null,node:null,vote:null,event:null,pending:{},mods:{}};
}
const alive = unit => unit.hp>0;
const fail = message => {throw new Error(message);};
const note = (s,text) => {s.log=[text,...s.log].slice(0,14);};
function emit(s,event) {
  s.events.push({...event,seq:++s.seq,floor:s.floor});
  if (s.events.length>96) s.events.shift();
}
export function join(s,id,name,classId) {
  if(s.phase!=='lobby'||s.players.length>=4) fail('La sala no admite más jugadores.');
  if(!Object.hasOwn(classes,classId)) fail('Elige una clase válida.');
  s.players.push({id,name:String(name||'Aventurero').trim().slice(0,22)||'Aventurero',classId,bag:[],equipment:{},gold:0,level:1,xp:0,skillRanks:skillRanks(classId),trained:true});
}
export const monsterNames={slime:'Limo',bat:'Murciélago',skull:'Calavera flotante',worm:'Gusano de cripta',slimeking:'Limo colosal'};
export function encounter(floor,size,elite=false) {
  const count=Math.min(7,size+Math.floor(floor/2));
  const lineup=Array.from({length:count},(_,i)=>{
    const boss=floor%3===0&&i===0;
    const ranged=!boss&&floor>1&&i%2===1;
    const elite=!boss&&!ranged&&floor>=4;
    const species=boss?(floor===3?'oracle':'umbralking'):ranged?'skull':elite?'worm':(i+floor)%2?'bat':'slime';
    return {id:'enemy'+i,name:boss?(floor===3?'Oráculo de Ceniza':'Rey del Umbral'):monsterNames[species],
      look:species,boss,elite,enemy:true,initiative:boss?16:ranged?11:species==='bat'?9:6,
      range:boss?4:ranged?8:1,
      hp:boss?48+floor*6+8*(size-1):Math.round((16+4*floor)*(ranged?.75:elite?1.15:1)),
      damage:boss?4+floor:ranged?2+floor:3+floor,stats:{ward:boss?3:elite?2:0},effects:{}};
  });
  if(!elite)return lineup;
  // Combate de élite: enemigos más duros y un custodio de refuerzo.
  for(const u of lineup){u.hp=Math.round(u.hp*1.2);u.damage+=1;u.stats.ward+=1;}
  lineup.push({id:'enemy'+count,name:monsterNames.slimeking,look:'slimeking',boss:false,elite:true,enemy:true,initiative:8,range:1,
    hp:Math.round((16+4*floor)*1.5),damage:4+floor,stats:{ward:2},effects:{}});
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
const layouts=[
  {name:'Galería de pilares', pillars:['.......','..#.#..','.......','...#...','.......','..#.#..','.......']},
  {name:'Pasajes quebrados', pillars:['.......','##...#.','.#...#.','.......','...##..','...#...','.......']},
  {name:'Patio de losas', pillars:['.......','..##...','..#....','.....#.','.....#.','..#....','.......']},
  {name:'Cruce de sepulcros', pillars:['.......','..#....','..#.#..','.......','.#..#..','....#..','.......']},
  {name:'Cámaras gemelas', pillars:['.......','.#...#.','.#...#.','.......','..#.#..','..#.#..','.......']},
  {name:'Nave central', pillars:['.......','.#.#.#.','.......','.......','.......','.#.#.#.','.......']},
  {name:'Anillo de tumbas', pillars:['.......','..###..','.#...#.','.#...#.','.#...#.','..#.#..','.......']},
  {name:'Escalera rota', pillars:['.......','.#.....','.##....','...#...','....##.','.....#.','.......']},
  {name:'Osario diagonal', pillars:['#......','.#.....','.......','...#...','.......','.....#.','......#']},
  {name:'Capilla en ruinas', pillars:['.......','.##.##.','.......','..#.#..','.......','.##.##.','.......']},
  {name:'Laberinto menor', pillars:['.......','.####..','.....#.','.###.#.','.#.....','.#.###.','.......']},
  {name:'Cripta del eco', pillars:['...#...','.......','.#...#.','#.....#','.#...#.','.......','...#...']},
  {name:'Sala de columnas', pillars:['.......','.#.#.#.','.......','.#.#.#.','.......','.#.#.#.','.......']}
];
function makeLayout(s,rng){
  const available=layouts.filter(layout=>layout.name!==s.layoutName);
  const layout=pick(available,rng);
  const flip=rng()<.5;
  const invert=rng()<.5;
  const w=s.width;
  const h=s.height;
  const offset=Math.floor((w-7)/2);
  const top=Math.floor((h-7)/2);
  const walls=[];
  layout.pillars.forEach((row,y)=>[...row].forEach((tile,x)=>{
    if(tile!=='#')return;
    const col=offset+(flip?6-x:x);
    const line=top+(invert?6-y:y);
    if(col>=4&&col<=w-5&&onBoard(s,line*w+col))walls.push(line*w+col);
  }));
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
  const pools=s.floor===1?1:1+Math.floor(rng()*3);
  for(let i=0;i<pools&&open.length;i++){
    let pos=open[roll(0,open.length-1,rng)];
    const size=2+Math.floor(rng()*4);
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
  const traps=[];
  const spots=open.filter(pos=>!boundary.has(pos));
  for(let i=0;i<1+Math.floor(s.floor*.7)&&spots.length;i++){
    const pos=spots.splice(roll(0,spots.length-1,rng),1)[0];
    traps.push({pos,kind:s.floor>=2&&rng()<.4?'gas':'spikes'});
  }
  return {name:layout.name,walls:blocks,water,traps};
}
function openFloor(s,rng,elite=false) {
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
  s.biome=s.floor<4?'crypt':'roots';
  s.glyphs=[];
  const w=s.width;
  const mid=Math.floor(s.height/2);
  const layout=makeLayout(s,mapRng);
  s.layoutName=layout.name;
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
    for(const key of damageKeys)stats[key]+=Math.floor(level/2);
    const max=classes[p.classId].hp+stats.vitality+(level-1)*4;
    return {id:p.id,name:p.name,classId:p.classId,level,skillRanks:[...p.skillRanks],initiative:classes[p.classId].initiative,stats,max,
      hp:previous?Math.min(max,Math.max(previous.hp,0)+Math.ceil(max*.45)):max,
      pos:heroPositions[i],effects:{}};
  });
  const lineup=encounter(s.floor,s.players.length,elite);
  if(s.mods.startHpPct)for(const hero of heroes)hero.hp=Math.max(1,Math.min(hero.hp,Math.ceil(hero.max*s.mods.startHpPct)));
  const spawns=s.floor===1?Array.from({length:(s.height-2)*2},(_,i)=>w*(1+Math.floor(i/2))+1+i%2):
    free.filter(pos=>!heroPositions.includes(pos)).sort((a,b)=>a%w-b%w).slice(0,Math.max(12,lineup.length*2));
  const foes=lineup.map(u=>{
    const pos=spawns.splice(roll(0,spawns.length-1,mapRng),1)[0];
    const hp=Math.round(u.hp*(s.mods.enemyHp||1));
    return {...u,hp,max:hp,pos};
  });
  s.units=[...heroes,...foes].sort((a,b)=>b.initiative-a.initiative);
  s.turn=0;
  note(s,'Piso '+s.floor+' · '+s.layoutName+(s.voids.length?' · '+s.shape.toUpperCase():'')+(s.floor%3===0?' · Cámara del jefe':elite?' · Combate de élite':''));
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
  return Math.max(0,Math.floor((raw+extra)*(critical?1.5:1))-(element==='physical'?(target.stats?.ward||0):0));
}
export const critChance=unit=>Math.min(1,.12+(unit.stats?.critical||0)/100);
export function damagePreview(unit,target,skill){
  if(['heal','cleanse','dash'].includes(skill[5]))return null;
  const element=skillElement(unit,skill);
  const bonus=unit.stats?.[element]||0;
  const extra=target.effects?.expose?.value||0;
  const range=critical=>[skill[3],skill[4]].map(base=>netDamage(target,base+bonus,element,critical,extra));
  return {normal:range(false),critical:range(true),chance:critChance(unit),element};
}
function hit(s,actor,target,raw,kind='damage',critical=false,element='physical') {
  const extra=kind==='damage'?(target.effects.expose?.value||0):0;
  const damage=Math.min(target.hp,netDamage(target,raw,element,critical,extra));
  target.hp-=damage;
  emit(s,{kind,unit:target.id,pos:target.pos,from:actor.pos,amount:damage,critical});
  note(s,actor.name+' → '+target.name+' · −'+damage+' PV'+(extra?' (+'+extra+' vulnerabilidad)':'')+(critical?' · crítico':''));
}
function effect(unit,key,value,turns) {
  const previous=unit.effects[key];
  unit.effects[key]={value:Math.max(previous?.value||0,value),turns:Math.max(previous?.turns||0,turns)};
}
export const glyphPower={damage:{damage:9,element:'fire'},poison:{damage:4,element:'shadow',poison:3,turns:2},slow:{damage:4,element:'arcane',slow:2}};
/** Aplica un glifo activo a un héroe: daño y, según el tipo, veneno o pérdida de PM. */
function triggerGlyph(s,g,unit) {
  const power=glyphPower[g.kind];
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
    hit(s,source,unit,2,'trap',false,'shadow');
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
  s.ap=Math.max(1,4+(u.stats?.action||0)+(bonus.ap||0));
  s.mp=Math.max(0,3+(u.stats?.movement||0)+(bonus.mp||0)-(u.effects.slow?.value||0));
  s.turnStarted=Date.now();
  s.deadline=s.turnStarted+(u.enemy?350:60000);
  if(u.effects.poison)hit(s,{name:'Veneno',pos:u.pos},u,u.effects.poison.value,'poison',false,'shadow');
  applyGlyphs(s,u,-1);
}
function endEffects(unit) {
  for(const [key,status] of Object.entries(unit.effects)) {
    if(--status.turns<=0)delete unit.effects[key];
  }
}
function finish(s,rng) {
  if(!s.units.some(u=>!u.enemy&&alive(u))){s.phase='lost';return true;}
  if(s.units.some(u=>u.enemy&&alive(u)))return false;
  s.phase=s.floor===6?'won':'reward';
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
      p.trained=false;
      p.gold+=Math.round((10+s.floor*4)*(elite?1.5:1));
      s.offers[p.id]=Array.from({length:3},(_,i)=>rollItem(s,rng,elite?{bonus:.35,gear:i===0}:{}));
    }
    s.stock=Array.from({length:4},()=>rollItem(s,rng));
    note(s,elite?'Victoria de élite · Botín mejorado y más tusi.':'Victoria · Elige botín y prepara tu equipo.');
  }else for(const p of s.players)p.xp=100;
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
  damage:{name:'Glifo de brasas',description:'Al activarse en el turno del jefe, y al entrar o empezar el turno encima: 9 de daño de fuego.'},
  poison:{name:'Glifo de veneno',description:'Al activarse en el turno del jefe, y al entrar o empezar el turno encima: 4 de daño de sombra y veneno de 3 PV durante 2 turnos.'},
  slow:{name:'Glifo de cadenas',description:'En cada turno del jefe: 4 de daño arcano y −2 PM en el próximo turno de quien esté encima.'}
};
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
  const target=heroes.reduce((a,b)=>distance(s,boss.pos,a.pos)<=distance(s,boss.pos,b.pos)?a:b);
  const centers=Array.from({length:s.width*s.height},(_,i)=>i)
    .filter(pos=>onBoard(s,pos)&&!s.walls.includes(pos)&&!s.water?.includes(pos)&&adjacent(s,pos).filter(n=>!s.walls.includes(n)&&!s.water?.includes(n)).length===4)
    .sort((a,b)=>distance(s,a,target.pos)-distance(s,b,target.pos));
  const center=centers[0];
  if(center===undefined)return;
  const kinds=boss.name==='Oráculo de Ceniza'?['damage','poison']:['slow','poison'];
  const kind=kinds[(boss.glyphCycle||0)%kinds.length];
  boss.glyphCycle=(boss.glyphCycle||0)+1;
  s.glyphs.push({owner:boss.id,kind,cells:[center,...adjacent(s,center)],warn:true});
  note(s,boss.name+' anuncia '+glyphInfo[kind].name.toLowerCase()+'.');
}
function attackOptions(s,unit,heroes,pos){
  return heroes.filter(h=>distance(s,pos,h.pos)<=unit.range&&lineOfSight(s,pos,h.pos,unit.id))
    .sort((a,b)=>a.hp-b.hp||distance(s,pos,a.pos)-distance(s,pos,b.pos));
}
export function planEnemy(s,unit,heroes){
  const routes=paths(s,unit,s.width*s.height);
  const firing=[];
  for(const [pos,path] of [[unit.pos,[]],...routes]){
    const target=attackOptions(s,unit,heroes,pos)[0];
    if(!target)continue;
    const nearest=Math.min(...heroes.map(h=>distance(s,pos,h.pos)));
    const lethal=target.hp<=unit.damage?5:0;
    const rangedSafety=unit.range>1?Math.min(nearest,unit.range)*2.7:0;
    const score=lethal+rangedSafety-target.hp*.13-path.length*.54;
    firing.push({path,score});
  }
  const local=firing.filter(option=>option.path.length<=s.mp).sort((a,b)=>b.score-a.score);
  if(local.length)return local[0].path;
  const approach=firing.sort((a,b)=>a.path.length-b.path.length||b.score-a.score)[0];
  if(approach)return approach.path.slice(0,s.mp);
  const nearest=pos=>Math.min(...heroes.map(hero=>distance(s,pos,hero.pos)));
  const available=[...routes].filter(([pos,path])=>path.length<=s.mp&&nearest(pos)<nearest(unit.pos));
  available.sort(([a,pa],[b,pb])=>nearest(a)-nearest(b)||pa.length-pb.length);
  return available[0]?.[1]||[];
}
// ───────────── Camino entre pisos, eventos y votaciones ─────────────
export const nodeKinds={
  combat:{name:'Combate',description:'Enemigos normales y botín estándar.'},
  elite:{name:'Élite',description:'Enemigos más duros y un limo colosal extra. Botín mejor y 50 % más de tusi.'},
  event:{name:'Evento',description:'Un encuentro sin combate. El grupo vota entre varias opciones.'},
  boss:{name:'Jefe',description:'Cámara del jefe con glifos.'}
};
const voteTime=15000;
/** Árbol de 6 pisos: 2-3 caminos por piso y jefes en los pisos 3 y 6. */
export function makeRoute(rng){
  const rows=[];
  for(let floor=1;floor<=6;floor++){
    if(floor%3===0){rows.push([{id:floor+'-0',floor,kind:'boss',x:.5,next:[]}]);continue;}
    const count=rng()<.55?3:2;
    const xs=count===3?[.15,.5,.85]:[.27,.73];
    const kinds=xs.map((_,i)=>{
      if(floor===1)return i===0?'combat':rng()<.5?'event':'combat';
      const r=rng();
      return r<.42?'combat':r<.7?'elite':'event';
    });
    if(floor>1&&new Set(kinds).size===1)kinds[kinds.length-1]=kinds[0]==='event'?'combat':'event';
    if(!kinds.some(kind=>kind!=='event'))kinds[0]='combat';
    rows.push(xs.map((x,i)=>({id:floor+'-'+i,floor,kind:kinds[i],x,next:[]})));
  }
  for(let r=0;r<rows.length-1;r++){
    const here=rows[r],next=rows[r+1];
    for(const node of here){
      node.next=next.filter(other=>Math.abs(other.x-node.x)<=.5).map(other=>other.id);
      if(!node.next.length)node.next=[next.reduce((a,b)=>Math.abs(a.x-node.x)<=Math.abs(b.x-node.x)?a:b).id];
    }
    for(const other of next){
      if(here.some(node=>node.next.includes(other.id)))continue;
      here.reduce((a,b)=>Math.abs(a.x-other.x)<=Math.abs(b.x-other.x)?a:b).next.push(other.id);
    }
  }
  return {rows,path:[],seen:[]};
}
const findNode=(s,id)=>s.route.rows.flat().find(node=>node.id===id);
function routeOptions(s){
  const row=s.route.rows[s.floor];
  if(!row)return [];
  const current=s.node&&findNode(s,s.node.id);
  return current&&current.floor===s.floor?current.next:row.map(node=>node.id);
}
/** Pasa al siguiente piso del camino: vota si hay varias rutas, entra directamente si solo hay una. */
function openRoute(s,rng){
  s.training=false;
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
  openFloor(s,rng,node.kind==='elite');
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
    {label:'Ofrecer sangre',detail:'Todos pierden un 25 % de su vida actual y reciben un objeto raro o mejor.',apply:(s,rng)=>{hurtParty(s,.25);giveAll(s,()=>rollItem(s,rng,{bonus:.6,gear:true}));}},
    {label:'Rezar',detail:'+1 PA en el próximo combate, pero los enemigos tendrán un 15 % más de vida.',apply:s=>{addMod(s,'ap',1);s.pending.enemyHp=(s.pending.enemyHp||1)*1.15;}},
    {label:'Marcharse',detail:'No ocurre nada.',apply:()=>{}}]},
  chest:{title:'Cofre encadenado',text:'Un cofre cubierto de cadenas. Algo dentro tintinea… y algo en la oscuridad os observa.',options:[
    {label:'Forzar el cofre',detail:'Cada uno recibe un objeto épico, pero los enemigos del próximo combate tendrán un 25 % más de vida.',apply:(s,rng)=>{giveAll(s,()=>rollItem(s,rng,{bonus:1.2,gear:true}));s.pending.enemyHp=(s.pending.enemyHp||1)*1.25;}},
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
export function trainingChoices(player){
  return player.skillRanks.flatMap((rank,index)=>rank<3?[{index,rank,name:classes[player.classId].skills[index][0]}]:[]);
}
export function tick(s,rng=Math.random) {
  if(Date.now()<s.deadline)return false;
  if(s.phase==='reward'){
    for(const p of s.players.filter(p=>s.training&&!p.trained)){
      const choice=trainingChoices(p).find(choice=>choice.rank>0)||trainingChoices(p)[0];
      if(choice)p.skillRanks[choice.index]++;
    }
    openRoute(s,rng);return true;
  }
  if(s.phase==='map'||s.phase==='event'){resolveVote(s,rng);return true;}
  if(s.phase!=='combat')return false;
  const unit=s.units[s.turn];
  if(!alive(unit)){advance(s,rng);return true;}
  if(unit.enemy){
    const heroes=s.units.filter(u=>!u.enemy&&alive(u));
    if(!s.enemyPlan){
      if(unit.boss)castGlyph(s,unit,heroes);
      const route=planEnemy(s,unit,heroes);
      if(route.length){
        move(s,unit,route);
        s.enemyPlan=unit.id;
        s.deadline=Date.now()+route.length*150+120;
        return true;
      }
    }
    const target=attackOptions(s,unit,heroes,unit.pos)[0];
    if(target){
      emit(s,{kind:'spell',effect:unit.range>1?'arrow':'slash',actor:unit.id,from:unit.pos,pos:target.pos});
      hit(s,unit,target,unit.damage+roll(0,2,rng));
    }
  }else note(s,unit.name+' se quedó sin tiempo.');
  advance(s,rng);
  return true;
}
const support=kind=>kind==='heal'||kind==='cleanse';
function spellCue(s,unit,pos,kind,area){
  const effect=kind==='damage'?(unit.classId==='tirador'?'arrow':unit.classId==='mago'||unit.classId==='mistico'?'arcane':'slash'):kind;
  emit(s,{kind:'spell',effect,actor:unit.id,from:unit.pos,pos,area});
}
export function hasRange(s,unit,pos,skill) {
  const [,cost,range,,,,,min=0]=skill;
  if(!onBoard(s,pos)||s.walls.includes(pos)||cost>s.ap)return false;
  const d=distance(s,unit.pos,pos);
  return d>=min&&d<=range+(modifiableRange(skill)?(unit.stats?.reach||0):0);
}
export function inRange(s,unit,pos,skill) {
  return hasRange(s,unit,pos,skill)&&lineOfSight(s,unit.pos,pos);
}
export function castableCell(s,unit,pos,skill){
  if(!inRange(s,unit,pos,skill))return false;
  return skill[5]==='blast'||(skill[5]==='dash'&&!s.units.some(u=>alive(u)&&u.pos===pos)&&paths(s,unit,skill[2]).has(pos));
}
export function spellArea(s,pos,skill) {
  return skill[5]==='blast'?[pos,...adjacent(s,pos)].filter(cell=>!s.walls.includes(cell)):[pos];
}
export function targetable(s,unit,target,skill) {
  return !!target&&alive(target)&&!!target.enemy!==support(skill[5])&&inRange(s,unit,target.pos,skill);
}
function gearAction(s,p,a,rng) {
  const bagIndex=p.bag.findIndex(item=>item.id===a.item);
  const item=p.bag[bagIndex];
  if(a.type==='train'){
    if(!s.training||p.trained)fail('No tienes una mejora pendiente.');
    const choice=trainingChoices(p).find(option=>option.index===a.skill);
    if(!choice)fail('La habilidad ya está al máximo o no existe.');
    p.skillRanks[choice.index]++;
    p.trained=true;
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
      p.bag.splice(bagIndex,1);
      p.gold+=Math.floor(item.price/2)+(item.socket?Math.floor(item.socket.price/2):0);
    }else fail('Acción de inventario inválida.');
  }
}
export function act(s,id,a,rng=Math.random) {
  const player=s.players.find(p=>p.id===id);
  if(!player)fail('Jugador desconocido.');
  const host=s.players[0].id===id;
  if(a.type==='start'&&s.phase==='lobby'&&host){
    s.route=makeRoute(rng);
    openRoute(s,rng);
    return;
  }
  if(s.phase==='map'||s.phase==='event'){
    if(a.type!=='vote')fail('Ahora toca votar.');
    castVote(s,player,a.option,rng);
    return;
  }
  if(a.type==='restart'&&['won','lost'].includes(s.phase)&&host){
    Object.assign(s,create(),{players:s.players.map(p=>({...p,equipment:{},bag:[],gold:0,level:1,xp:0,skillRanks:skillRanks(p.classId),trained:true})),seq:s.seq});
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
  const [name,cost,,min,max,kind]=skill;
  if(cost>s.ap)fail('No te quedan suficientes puntos de acción.');
  const target=s.units.find(u=>alive(u)&&u.pos===a.pos);
  if(kind==='dash'){
    if(!castableCell(s,unit,a.pos,skill))fail('No hay una ruta libre a esa casilla.');
    s.ap-=cost;
    spellCue(s,unit,a.pos,kind);
    move(s,unit,paths(s,unit,skill[2]).get(a.pos),false);
    if(!alive(unit))advance(s,rng);
    return;
  }
  if(kind==='blast'){
    if(!castableCell(s,unit,a.pos,skill))fail('Casilla fuera de alcance o sin línea de visión.');
    s.ap-=cost;
    const area=spellArea(s,a.pos,skill);
    spellCue(s,unit,a.pos,kind,area);
    for(const foe of s.units.filter(u=>u.enemy&&alive(u)&&area.includes(u.pos))){
      const element=skillElement(unit,skill);
      hit(s,unit,foe,roll(min,max,rng)+unit.stats[element],'damage',rng()<critChance(unit),element);
    }
    finish(s,rng);
    return;
  }
  if(!targetable(s,unit,target,skill))fail('Objetivo inválido, fuera de alcance o sin línea de visión.');
  s.ap-=cost;
  spellCue(s,unit,target.pos,kind);
  if(support(kind)){
    const amount=Math.min(target.max-target.hp,roll(min,max,rng)+Math.floor(unit.level/2));
    target.hp+=amount;
    if(kind==='cleanse')target.effects={};
    emit(s,{kind:'heal',unit:target.id,from:unit.pos,pos:target.pos,amount});
    note(s,name+' → '+target.name+' · +'+amount+' PV'+(kind==='cleanse'?' · purificado':''));
  }else{
    const critical=rng()<critChance(unit);
    const element=skillElement(unit,skill);
    hit(s,unit,target,roll(min,max,rng)+unit.stats[element],'damage',critical,element);
    if(alive(target)&&kind==='expose'){
      effect(target,'expose',3,2);
      note(s,target.name+' queda vulnerable: todos los atacantes infligen +3.');
    }
    if(alive(target)&&kind==='slow')effect(target,'slow',2,1);
    if(alive(target)&&kind==='venom'){
      effect(target,'poison',3,2);
      note(s,target.name+' queda envenenado.');
    }
    if(alive(target)&&kind==='push'){
      const to=target.pos+(target.pos-unit.pos);
      if(adjacent(s,target.pos).includes(to)&&!s.walls.includes(to)&&!s.water?.includes(to)&&!s.units.some(u=>alive(u)&&u.pos===to))move(s,target,[to],false);
    }
  }
  finish(s,rng);
}

