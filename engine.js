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
  ]}
};
export const slots = {weapon:'Arma', armor:'Armadura', boots:'Botas', charm:'Talismán'};
export const statNames = {power:'Potencia', vitality:'Vitalidad', healing:'Curación', reach:'Alcance', ward:'Protección', critical:'Crítico', movement:'PM'};
const rarities = ['Común','Poco común','Raro','Épico'];
const bases = {
  weapon:['Arco de tejo','Sable de cobre','Cetro de ónice','Lanza de vigía'],
  armor:['Coraza de escamas','Manto de ceniza','Jubón reforzado'],
  boots:['Botas del umbral','Grebas de bronce','Botas de arena'],
  charm:['Anillo de obsidiana','Amuleto de luna','Ojo de la cripta']
};
const pools = {weapon:['power','reach','critical'],armor:['vitality','ward','healing'],boots:['movement','vitality','ward'],charm:['healing','critical','power','reach']};
const inscriptions = [
  ['Brasa','power',2], ['Brote','healing',3], ['Brújula','reach',1],
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
function rollItem(s,rng) {
  const itemId = ++s.itemId;
  if (rng()<.28) {
    const [name,key,value]=pick(inscriptions,rng);
    return {id:itemId,name:'Runa de '+name,kind:'rune',price:7+2*s.floor,stats:{[key]:value}};
  }
  const slot=pick(Object.keys(slots),rng);
  const luck=rng()+s.floor*.055;
  const rarity=luck>1.08?3:luck>.83?2:luck>.53?1:0;
  const choices=[...pools[slot]];
  const stats={};
  for (let i=0;i<Math.min(choices.length,1+rarity);i++) {
    const key=choices.splice(roll(0,choices.length-1,rng),1)[0];
    stats[key]={
      power:roll(1,2+rarity,rng), vitality:roll(3,5+rarity*3,rng),
      healing:roll(1,3+rarity,rng), reach:1, ward:rarity>=2?2:1,
      critical:roll(4,7+3*rarity,rng), movement:1
    }[key];
  }
  return {id:itemId,name:pick(bases[slot],rng),kind:'gear',slot,rarity:rarities[rarity],grade:rarity,stats,price:6+rarity*7+s.floor,socket:null};
}
function sumStats(equipment) {
  const totals=Object.fromEntries(Object.keys(statNames).map(key=>[key,0]));
  for (const gear of Object.values(equipment)) {
    for (const stats of [gear.stats,gear.socket?.stats||{}]) {
      for (const [key,value] of Object.entries(stats)) totals[key]+=value;
    }
  }
  return totals;
}
export function create() {
  return {phase:'lobby', floor:0, rounds:0, width:12,height:8,players:[],units:[],walls:[],glyphs:[],
    log:[],events:[],seq:0,itemId:0,turn:0,deadline:0,turnStarted:0,picks:[],offers:{},stock:[]};
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
  s.players.push({id,name:String(name||'Aventurero').trim().slice(0,22)||'Aventurero',classId,bag:[],equipment:{},gold:0});
}
export function encounter(floor,size) {
  const count=Math.min(7,size+Math.floor(floor/2));
  return Array.from({length:count},(_,i)=>{
    const boss=floor%3===0&&i===0;
    const ranged=!boss&&floor>1&&i%2===1;
    const elite=!boss&&!ranged&&floor>=4;
    return {id:'enemy'+i,name:boss?(floor===3?'Oráculo de Ceniza':'Rey del Umbral'):ranged?'Vigía':elite?'Custodio':'Acechador',
      look:boss?'boss':ranged?'ranged':elite?'elite':'enemy',boss,enemy:true,initiative:boss?16:ranged?11:6,
      range:boss?4:ranged?5:1,hp:boss?30+floor*3+6*(size-1):9+2*floor,damage:2+Math.floor(floor/2)+(boss?2:0),effects:{}};
  });
}
export const distance = (s,a,b) => Math.abs(a%s.width-b%s.width)+Math.abs(Math.floor(a/s.width)-Math.floor(b/s.width));
const adjacent = (s,pos) => [pos-s.width,pos+s.width,pos-1,pos+1].filter(n=>n>=0&&n<s.width*s.height&&distance(s,pos,n)===1);
function openFloor(s,rng) {
  s.phase='combat';
  s.floor++;
  s.rounds=1;
  s.width=Math.min(16,10+2*s.players.length);
  s.height=7+s.players.length;
  s.biome=s.floor<4?'crypt':'roots';
  s.glyphs=[];
  s.mapSeed=randomSeed(rng);
  const mapRng=floorRandom(s.mapSeed);
  const w=s.width;
  const mid=Math.floor(s.height/2);
  const heroes=s.players.map((p,i)=>{
    const previous=s.units.find(u=>u.id===p.id);
    const stats=sumStats(p.equipment);
    const max=classes[p.classId].hp+stats.vitality;
    return {id:p.id,name:p.name,classId:p.classId,initiative:classes[p.classId].initiative,stats,max,
      hp:previous?Math.min(max,Math.max(previous.hp,0)+Math.ceil(max*.45)):max,
      pos:w*(mid+[0,-1,1,-2][i])+1,effects:{}};
  });
  const foes=encounter(s.floor,s.players.length).map((u,i)=>({...u,max:u.hp,pos:w*(i%s.height)+w-2-(i%2)}));
  const candidates=Array.from({length:w*s.height},(_,pos)=>pos).filter(pos=>pos%w>=4&&pos%w<=w-5&&Math.floor(pos/w)!==mid);
  s.walls=[];
  for(let i=0;i<Math.min(candidates.length,3+s.floor+s.players.length);i++) {
    s.walls.push(candidates.splice(roll(0,candidates.length-1,mapRng),1)[0]);
  }
  s.units=[...heroes,...foes].sort((a,b)=>b.initiative-a.initiative);
  s.turn=0;
  note(s,'Piso '+s.floor+' · '+(s.floor%3===0?'Cámara del jefe':s.biome==='roots'?'Galería de raíces':'Cripta hundida'));
  beginTurn(s);
}
export function lineOfSight(s,from,to) {
  let x=from%s.width,y=Math.floor(from/s.width);
  const tx=to%s.width,ty=Math.floor(to/s.width);
  const dx=Math.abs(tx-x),dy=Math.abs(ty-y);
  const sx=Math.sign(tx-x),sy=Math.sign(ty-y);
  const blocked=new Set([...s.walls,...s.units.filter(u=>alive(u)&&u.pos!==from&&u.pos!==to).map(u=>u.pos)]);
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
  const blocked=new Set([...s.walls,...s.units.filter(alive).map(u=>u.pos)]);
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
function hit(s,actor,target,raw,kind='damage',critical=false) {
  const extra=kind==='damage'?(target.effects.expose?.value||0):0;
  const damage=Math.min(target.hp,Math.max(1,raw+extra-(target.stats?.ward||0)));
  target.hp-=damage;
  emit(s,{kind,unit:target.id,pos:target.pos,from:actor.pos,amount:damage,critical});
  note(s,actor.name+' → '+target.name+' · −'+damage+' PV'+(extra?' (+'+extra+' vulnerabilidad)':'')+(critical?' · crítico':''));
}
function effect(unit,key,value,turns) {
  const previous=unit.effects[key];
  unit.effects[key]={value:Math.max(previous?.value||0,value),turns:Math.max(previous?.turns||0,turns)};
}
function applyGlyphs(s,unit,oldPos) {
  if(unit.enemy)return;
  for(const g of s.glyphs) {
    if(g.warn||!alive(unit)||!g.cells.includes(unit.pos)||g.cells.includes(oldPos))continue;
    if(g.kind==='damage')hit(s,{name:'Glifo de brasas',pos:unit.pos},unit,8,'glyph');
    if(g.kind==='poison') {
      effect(unit,'poison',3,2);
      note(s,unit.name+' queda envenenado.');
    }
    if(g.kind==='slow') {
      s.mp=Math.max(0,s.mp-2);
      note(s,unit.name+' pierde 2 PM por el glifo de cadenas.');
    }
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
  }
}
function beginTurn(s) {
  const u=s.units[s.turn];
  s.ap=4;
  s.mp=Math.max(0,3+(u.stats?.movement||0)-(u.effects.slow?.value||0));
  s.turnStarted=Date.now();
  s.deadline=s.turnStarted+(u.enemy?950:60000);
  if(u.effects.poison)hit(s,{name:'Veneno',pos:u.pos},u,u.effects.poison.value,'poison');
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
  s.glyphs=[];
  s.picks=[];
  s.offers={};
  s.stock=[];
  s.turnStarted=Date.now();
  s.deadline=s.turnStarted+60000;
  if(s.phase==='reward'){
    for(const p of s.players){
      p.gold+=10+s.floor*4;
      s.offers[p.id]=Array.from({length:3},()=>rollItem(s,rng));
    }
    s.stock=Array.from({length:4},()=>rollItem(s,rng));
    note(s,'Victoria · Elige botín y prepara tu equipo.');
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
function castGlyph(s,boss,heroes,rng) {
  s.glyphs=s.glyphs.filter(g=>g.owner!==boss.id||--g.remaining>0);
  if(s.glyphs.some(g=>g.owner===boss.id&&g.warn)){
    s.glyphs.forEach(g=>{if(g.owner===boss.id)g.warn=false;});
    note(s,boss.name+' activa sus glifos. Sal de las zonas marcadas.');
    return;
  }
  if(s.glyphs.some(g=>g.owner===boss.id))return;
  const target=heroes.reduce((a,b)=>distance(s,boss.pos,a.pos)<=distance(s,boss.pos,b.pos)?a:b);
  const options=[target.pos,...adjacent(s,target.pos)].filter(pos=>!s.walls.includes(pos));
  const kinds=['damage','poison','slow'];
  const first=(boss.glyphCycle||0)%kinds.length;
  boss.glyphCycle=(boss.glyphCycle||0)+1;
  for(let i=0;i<Math.min(options.length,3);i++){
    const center=options.splice(i===0?0:roll(0,options.length-1,rng),1)[0];
    const other=adjacent(s,center).find(pos=>pos!==target.pos&&!options.includes(pos)&&!s.walls.includes(pos)&&!s.glyphs.some(g=>g.cells.includes(pos)));
    const cells=[center];
    if(other!==undefined)cells.push(other);
    s.glyphs.push({owner:boss.id,kind:kinds[(first+i)%kinds.length],cells,warn:true,remaining:3});
  }
  note(s,boss.name+' anuncia glifos de brasas, veneno y cadenas.');
}
export function tick(s,rng=Math.random) {
  if(Date.now()<s.deadline)return false;
  if(s.phase==='reward'){openFloor(s,rng);return true;}
  if(s.phase!=='combat')return false;
  const unit=s.units[s.turn];
  if(unit.enemy){
    const heroes=s.units.filter(u=>!u.enemy&&alive(u));
    if(unit.boss)castGlyph(s,unit,heroes,rng);
    const targetAt=pos=>heroes.filter(h=>distance(s,pos,h.pos)<=unit.range&&lineOfSight(s,pos,h.pos)).sort((a,b)=>a.hp-b.hp)[0];
    if(!targetAt(unit.pos)){
      const closest=pos=>Math.min(...heroes.map(h=>distance(s,pos,h.pos)));
      const routes=paths(s,unit,Math.min(3,s.mp));
      const positions=[unit.pos,...routes.keys()];
      const next=positions.sort((a,b)=>Number(!!targetAt(b))-Number(!!targetAt(a))||closest(a)-closest(b))[0];
      if(routes.has(next))move(s,unit,routes.get(next));
    }
    const target=targetAt(unit.pos);
    if(target)hit(s,unit,target,unit.damage+roll(0,2,rng));
  }else note(s,unit.name+' se quedó sin tiempo.');
  advance(s,rng);
  return true;
}
const support=kind=>kind==='heal'||kind==='cleanse';
export function inRange(s,unit,pos,skill) {
  const [,cost,range,,,,,min=0]=skill;
  if(!Number.isInteger(pos)||pos<0||pos>=s.width*s.height||s.walls.includes(pos)||cost>s.ap)return false;
  const d=distance(s,unit.pos,pos);
  return d>=min&&d<=range+(range>1?(unit.stats?.reach||0):0)&&lineOfSight(s,unit.pos,pos);
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
  if(a.type==='reward'){
    const choices=s.offers[p.id];
    if(s.picks.includes(p.id)||!choices)fail('Ya elegiste botín.');
    const loot=choices.find(choice=>choice.id===a.item);
    if(!loot&&a.item!==null)fail('Botín inválido.');
    if(loot)p.bag.push(loot);
    s.picks.push(p.id);
  }else if(a.type==='buy'){
    const i=s.stock.findIndex(listing=>listing.id===a.item);
    if(i<0)fail('Ya no está a la venta.');
    if(p.gold<s.stock[i].price)fail('Oro insuficiente.');
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
    openFloor(s,rng);
  }else{
    if(!item)fail('Objeto no encontrado.');
    if(a.type==='equip'&&item.kind==='gear'){
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
  if(a.type==='start'&&s.phase==='lobby'&&host){openFloor(s,rng);return;}
  if(a.type==='restart'&&['won','lost'].includes(s.phase)&&host){
    Object.assign(s,create(),{players:s.players.map(p=>({...p,equipment:{},bag:[],gold:0})),seq:s.seq});
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
  const skill=classes[unit.classId].skills[a.skill];
  if(a.type!=='skill'||!Number.isInteger(a.skill)||!skill)fail('Acción inválida.');
  const [name,cost,,min,max,kind]=skill;
  if(cost>s.ap)fail('No te quedan suficientes puntos de acción.');
  const target=s.units.find(u=>alive(u)&&u.pos===a.pos);
  if(kind==='blast'){
    if(!inRange(s,unit,a.pos,skill))fail('Casilla fuera de alcance o sin línea de visión.');
    s.ap-=cost;
    const area=spellArea(s,a.pos,skill);
    emit(s,{kind:'blast',pos:a.pos,area});
    for(const foe of s.units.filter(u=>u.enemy&&alive(u)&&area.includes(u.pos))){
      hit(s,unit,foe,roll(min,max,rng)+unit.stats.power);
    }
    finish(s,rng);
    return;
  }
  if(!targetable(s,unit,target,skill))fail('Objetivo inválido, fuera de alcance o sin línea de visión.');
  s.ap-=cost;
  if(support(kind)){
    const amount=Math.min(target.max-target.hp,roll(min,max,rng)+unit.stats.healing);
    target.hp+=amount;
    if(kind==='cleanse')target.effects={};
    emit(s,{kind:'heal',unit:target.id,from:unit.pos,pos:target.pos,amount});
    note(s,name+' → '+target.name+' · +'+amount+' PV'+(kind==='cleanse'?' · purificado':''));
  }else{
    const critical=rng()<Math.min(.5,.12+unit.stats.critical/100);
    hit(s,unit,target,roll(min,max,rng)+unit.stats.power+(critical?4:0),'damage',critical);
    if(alive(target)&&kind==='expose'){
      effect(target,'expose',3,2);
      note(s,target.name+' queda vulnerable: todos los atacantes infligen +3.');
    }
    if(alive(target)&&kind==='slow')effect(target,'slow',2,1);
    if(alive(target)&&kind==='push'){
      const to=target.pos+(target.pos-unit.pos);
      if(adjacent(s,target.pos).includes(to)&&!s.walls.includes(to)&&!s.units.some(u=>alive(u)&&u.pos===to))move(s,target,[to],false);
    }
  }
  finish(s,rng);
}

