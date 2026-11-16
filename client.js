import {classes,create,join,act,tick,paths,targetable,inRange,spellArea,slots,statNames} from './engine.js?v=3';
import {portrait,spellIcon} from './art.js?v=3';
import {setupMusic} from './music.js?v=3';

const el=id=>document.getElementById(id);
let state,session,selected=null,busy=false,polling=false,generation=0,revision=0,rendered='';
let pending=[],playing=null,lastSeq=0,animationEpoch=0;
const onPages=location.hostname.endsWith('.github.io');
el('server').value=localStorage.getItem('amber-server')||(onPages?'https://cripta-del-tusi.onrender.com':location.origin);
const error=message=>{el('error').textContent=message;};
const iconName={expose:'Vulnerable',slow:'−PM',poison:'Veneno'};
const specs={guardia:'Primera línea · debilita al enemigo',tirador:'Flechas de largo alcance · ralentiza y empuja',mistico:'Cura y purifica a sus aliados',mago:'Daño en área y control con escarcha'};
const musicMode=setupMusic(el('music'));
function classPreview(){
  const kind=el('class').value;
  const description=document.createElement('span');
  description.textContent=specs[kind];
  el('class-preview').replaceChildren(portrait(kind),description);
}
el('class').onchange=classPreview;
classPreview();
function btn(label,action,pressed){
  const b=document.createElement('button');
  b.textContent=label;
  b.onclick=action;
  if(pressed!==undefined)b.setAttribute('aria-pressed',pressed);
  return b;
}
const actionButton=(label,type,data={})=>btn(label,()=>send({type,...data}));
function paintClock(active){
  const clock=el('clock');
  clock.hidden=!active;
  if(!active)return;
  const remaining=Math.max(0,state.deadline-Date.now());
  const seconds=Math.ceil(remaining/1000);
  el('seconds').textContent=seconds+' s';
  el('timebar').max=(state.deadline-state.turnStarted)/1000;
  el('timebar').value=remaining/1000;
  clock.classList.toggle('urgent',seconds<=10);
}
function unitLabel(u){
  const effects=Object.entries(u.effects||{}).map(([key,value])=>iconName[key]+' '+value.value+' ('+value.turns+' t)');
  return u.name+' · '+u.hp+'/'+u.max+' PV'+(effects.length?' · '+effects.join(' · '):'');
}
function initiative(turn){
  const units=state.units.length?state.units:state.players;
  return units.map(u=>{
    const li=document.createElement('li');
    li.append(portrait(u.look||u.classId),u.name+(u.max?' · '+u.hp+' PV':' · '+classes[u.classId].name));
    if(u.max)li.title=unitLabel(u);
    li.classList.toggle('current',state.phase==='combat'&&u===turn);
    li.classList.toggle('dead',u.hp===0);
    return li;
  });
}
function panel(title){
  const box=document.createElement('section');
  box.className='panel inventory-panel';
  const h=document.createElement('h3');
  h.textContent=title;
  box.append(h);
  return box;
}
const describe=stats=>Object.entries(stats).map(([key,value])=>'+'+value+' '+statNames[key]).join(' · ');
function itemRow(item,title,actions=[]){
  const row=document.createElement('div');
  row.className='item';
  const name=document.createElement('b');
  name.textContent=title+(item?.name||'Vacío');
  name.className=item?.kind==='rune'?'rune':'grade'+(item?.grade||0);
  row.append(name);
  if(item){
    const desc=document.createElement('small');
    desc.textContent=[item.rarity,describe(item.stats),item.socket?'⚒ '+item.socket.name+' · '+describe(item.socket.stats):''].filter(Boolean).join(' · ');
    row.append(desc);
  }
  row.append(...actions);
  return row;
}
function renderInventory(player){
  const holder=el('inventory');
  holder.hidden=state.phase!=='reward';
  if(holder.hidden){holder.replaceChildren();return;}
  const gear=panel('Equipo · '+player.gold+' oro');
  for(const [slot,label] of Object.entries(slots)){
    const item=player.equipment[slot];
    const actions=item?[actionButton('Quitar','unequip',{slot})]:[];
    if(item?.socket)actions.push(actionButton('Extraer runa','unsocket',{slot}));
    gear.append(itemRow(item,label+' · ',actions));
  }
  const bag=panel('Mochila');
  if(!player.bag.length)bag.append('Vacía');
  for(const item of player.bag){
    const actions=[];
    if(item.kind==='gear')actions.push(actionButton('Equipar','equip',{item:item.id}));
    else for(const [slot,label] of Object.entries(slots)){
      if(player.equipment[slot])actions.push(actionButton('Engarzar en '+label.toLowerCase(),'socket',{item:item.id,slot}));
    }
    actions.push(actionButton('Vender · '+(Math.floor(item.price/2)+(item.socket?Math.floor(item.socket.price/2):0))+' oro','sell',{item:item.id}));
    bag.append(itemRow(item,'',actions));
  }
  const shop=panel('Mercader');
  if(!state.stock.length)shop.append('Todo vendido');
  for(const item of state.stock){
    const buy=actionButton('Comprar · '+item.price+' oro','buy',{item:item.id});
    buy.disabled=player.gold<item.price;
    shop.append(itemRow(item,'',[buy]));
  }
  const loot=panel('Botín');
  const choices=state.offers[player.id]||[];
  if(state.picks.includes(player.id))loot.append('Botín elegido. '+state.picks.length+'/'+state.players.length+' listos.');
  else{
    for(const item of choices)loot.append(itemRow(item,'',[actionButton('Elegir','reward',{item:item.id})]));
    loot.append(actionButton('Pasar','reward',{item:null}));
  }
  holder.replaceChildren(loot,gear,bag,shop);
}
function boardPoint(pos){
  const col=pos%state.width;
  const row=Math.floor(pos/state.width);
  return {left:((col+.5)/state.width*100)+'%',top:((row+.5)/state.height*100)+'%'};
}
const hidePawn=id=>playing?.unit===id||pending.some(event=>event.kind==='move'&&event.unit===id);
function updatePawns(){
  for(const pawn of el('board').querySelectorAll('.pawn'))pawn.classList.toggle('in-motion',hidePawn(pawn.dataset.unit));
}
function resetAnimation(){
  animationEpoch++;
  pending=[];
  playing=null;
  lastSeq=0;
  el('animations').replaceChildren();
}
function impact(event){
  if(event.kind==='blast'){
    for(const pos of event.area){
      const flash=document.createElement('span');
      flash.className='fire-flash';
      Object.assign(flash.style,boardPoint(pos));
      el('animations').append(flash);
      setTimeout(()=>flash.remove(),600);
    }
    return;
  }
  const tag=document.createElement('span');
  tag.className='impact '+event.kind;
  tag.textContent=(event.kind==='heal'?'+':'−')+event.amount+(event.critical?' ✷':'');
  Object.assign(tag.style,boardPoint(event.pos));
  el('animations').append(tag);
  setTimeout(()=>tag.remove(),700);
}
async function animate(){
  if(playing||!pending.length||!state)return;
  const epoch=animationEpoch;
  while(pending.length&&epoch===animationEpoch){
    const event=pending.shift();
    playing=event;
    if(!['combat','reward','won','lost'].includes(state.phase))continue;
    if(event.kind!=='move'){impact(event);continue;}
    const pawn=document.createElement('div');
    pawn.className='pawn moving';
    pawn.style.inset='auto';
    pawn.style.width=(100/state.width)+'%';
    pawn.style.height=(100/state.height)+'%';
    Object.assign(pawn.style,boardPoint(event.from));
    pawn.append(portrait(event.look));
    el('animations').append(pawn);
    updatePawns();
    let from=boardPoint(event.from);
    for(const square of event.path){
      const to=boardPoint(square);
      const motion=pawn.animate([from,to],{duration:135,easing:'ease-in-out',fill:'forwards'});
      await motion.finished.catch(()=>{});
      if(epoch!==animationEpoch)break;
      Object.assign(pawn.style,to);
      motion.cancel();
      from=to;
    }
    pawn.remove();
  }
  if(epoch!==animationEpoch)return;
  playing=null;
  updatePawns();
}
function setState(next,initial=false){
  const previous=state;
  const newFloor=previous?.floor!==next.floor;
  if(newFloor||initial){
    resetAnimation();
    lastSeq=next.seq||0;
  }else{
    pending.push(...(next.events||[]).filter(e=>e.seq>lastSeq&&e.floor===next.floor));
    lastSeq=next.seq||lastSeq;
  }
  if(newFloor||previous?.turn!==next.turn||previous?.phase!==next.phase||previous?.rounds!==next.rounds){
    selected=null;
  }
  state=next;
  musicMode(next.phase==='combat');
  render();
  animate();
}
function pathArrow(a,b){
  if(b-a===state.width)return '↓';
  if(a-b===state.width)return '↑';
  return b>a?'→':'←';
}
function paintPath(path,origin){
  const board=el('board');
  for(const cell of board.querySelectorAll('.route')){
    cell.classList.remove('route','destination');
    cell.querySelector('.route-arrow')?.remove();
  }
  path?.forEach((pos,index)=>{
    const cell=board.children[pos];
    if(!cell)return;
    cell.classList.add('route');
    cell.dataset.step=index+1;
    if(index===path.length-1)cell.classList.add('destination');
    const arrow=document.createElement('span');
    arrow.className='route-arrow';
    arrow.textContent=pathArrow(index?path[index-1]:origin,pos);
    arrow.setAttribute('aria-hidden','true');
    cell.append(arrow);
  });
}
function paintArea(area=[]){
  const board=el('board');
  for(const cell of board.querySelectorAll('.area-preview'))cell.classList.remove('area-preview');
  for(const pos of area)board.children[pos]?.classList.add('area-preview');
}
function drawBoard(turn,walking,skill){
  const board=el('board');
  const field=el('battlefield');
  field.hidden=!state.units.length;
  board.replaceChildren();
  if(field.hidden)return;
  board.style.setProperty('--cols',state.width);
  board.className=state.biome||'crypt';
  const fragment=document.createDocumentFragment();
  const shades=state.biome==='roots'?['#55513a','#4d573b','#60573d','#3f4938']:['#49524c','#3d4845','#515650','#3b4540'];
  for(let pos=0;pos<state.width*state.height;pos++){
    const unit=state.units.find(u=>u.hp>0&&u.pos===pos);
    const wall=state.walls.includes(pos);
    const glyph=state.glyphs.find(g=>g.cells.includes(pos));
    const castRange=skill&&inRange(state,turn,pos,skill);
    const blast=skill?.[5]==='blast';
    const aim=castRange&&(blast||targetable(state,turn,unit,skill));
    const path=walking.get(pos);
    const cell=btn('',()=>{
      if(aim){send({type:'skill',pos,skill:selected});return;}
      if(path)send({type:'move',pos});
    });
    const shadesIndex=((Math.imul(pos+1,2654435761)^state.mapSeed)>>>6)%shades.length;
    cell.style.setProperty('--tile',shades[shadesIndex]);
    cell.className=['cell',wall&&'wall',path&&'walk',castRange&&'cast-range',aim&&'aim',glyph&&'glyph-'+glyph.kind,glyph?.warn&&'warn'].filter(Boolean).join(' ');
    cell.setAttribute('aria-label',(unit?.name||(wall?'Muro':'Casilla'))+' '+(pos%state.width+1)+', '+(Math.floor(pos/state.width)+1));
    if(path){
      cell.onpointerenter=cell.onfocus=()=>{
        paintPath(path,turn.pos);
        el('path-status').textContent=path.length+' PM · Clic para moverte';
      };
      cell.onpointerleave=cell.onblur=()=>{
        paintPath();
        el('path-status').textContent='Azul: casillas a las que puedes moverte.';
      };
    }else if(aim&&blast){
      cell.onpointerenter=cell.onfocus=()=>paintArea(spellArea(state,pos,skill));
      cell.onpointerleave=cell.onblur=()=>paintArea();
    }
    if(unit){
      const pawn=document.createElement('span');
      pawn.className=['pawn',unit.enemy&&'foe',turn===unit&&'active',hidePawn(unit.id)&&'in-motion'].filter(Boolean).join(' ');
      pawn.dataset.unit=unit.id;
      cell.title=unitLabel(unit);
      const hp=document.createElement('span');
      hp.className='hp';
      hp.style.setProperty('--hp',(unit.hp/unit.max*100)+'%');
      hp.append(document.createElement('i'));
      pawn.append(portrait(unit.look||unit.classId),hp);
      cell.append(pawn);
    }
    if(glyph)cell.title=[cell.title,{damage:'Brasas',poison:'Veneno',slow:'Cadenas'}[glyph.kind],glyph.warn?'Se activa en el próximo turno del jefe':'Glifo activo'].filter(Boolean).join(' · ');
    fragment.append(cell);
  }
  board.append(fragment);
}
function render(){
  el('entry').hidden=!!state;
  el('game').hidden=!state;
  if(!state)return;
  const turn=state.units[state.turn];
  const mine=state.phase==='combat'&&turn?.id===session.id;
  const host=state.players[0]?.id===session.id;
  const title={lobby:'Sala de expedición',combat:'Piso '+state.floor+' · '+turn?.name+(mine?' (tú)':''),reward:'Botín y mercader',won:'Expedición completada',lost:'El grupo ha caído'}[state.phase];
  el('phase').textContent=title;
  paintClock((state.phase==='combat'&&!turn.enemy)||state.phase==='reward');
  const signature=JSON.stringify([state,selected]);
  if(signature===rendered)return;
  rendered=signature;
  el('room').textContent=session.code?'Sala '+session.code:'En solitario';
  el('copy-code').hidden=!session.code;
  el('glyph-legend').hidden=!(state.phase==='combat'&&state.glyphs.length);
  el('turns').replaceChildren(...initiative(turn));
  el('log').replaceChildren(...state.log.map(entry=>{
    const li=document.createElement('li');
    li.textContent=entry;
    return li;
  }));
  const controls=el('controls');
  controls.replaceChildren();
  if(state.phase==='lobby'&&host)controls.append(actionButton('Iniciar expedición','start'));
  if(state.phase==='reward'&&host){
    const next=actionButton('Siguiente piso','next');
    next.disabled=state.picks.length!==state.players.length;
    controls.append(next);
  }
  if(['won','lost'].includes(state.phase)&&host)controls.append(actionButton('Volver a la sala','restart'));
  const walking=mine&&selected===null?paths(state,turn,state.mp):new Map();
  const skill=mine&&selected!==null?classes[turn.classId].skills[selected]:null;
  if(mine){
    const stats=document.createElement('span');
    stats.className='resource';
    stats.textContent=state.ap+' PA · '+state.mp+' PM';
    controls.append(stats,btn('Mover',()=>{selected=null;render();},selected===null));
    classes[turn.classId].skills.forEach(([name,cost,range,min,max,kind,symbol,minRange=0],i)=>{
      const b=btn(name,()=>{selected=selected===i?null:i;render();},selected===i);
      b.className='ability';
      b.prepend(spellIcon(kind,symbol));
      b.title=cost+' PA · alcance '+minRange+'–'+(range+(range>1?turn.stats.reach:0))+' · '+min+'–'+max+' '+(['heal','cleanse'].includes(kind)?'cura':'daño base');
      b.disabled=cost>state.ap;
      controls.append(b);
    });
    const hint=document.createElement('small');
    hint.id='path-status';
    hint.textContent=selected===null?'Azul: casillas a las que puedes moverte.':skill[5]==='blast'?'Morado: puntos de lanzamiento. Naranja: área de impacto.':'Morado: alcance. Dorado: objetivos válidos.';
    controls.append(hint);
    controls.append(actionButton('Terminar turno','end'));
  }
  drawBoard(turn,walking,skill);
  renderInventory(state.players.find(p=>p.id===session.id));
}
el('copy-code').onclick=async()=>{
  try{await navigator.clipboard.writeText(session.code);el('copy-code').textContent='Copiado';setTimeout(()=>{el('copy-code').textContent='Copiar código';},1200);}
  catch{error('Código de sala: '+session.code);}
};
async function request(base,path,body,key){
  const response=await fetch(base+path,{
    method:body?'POST':'GET',
    headers:{...(body?{'Content-Type':'application/json'}:{}),...(key?{Authorization:'Bearer '+key}:{})},
    body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(12000)
  });
  const result=await response.json().catch(()=>({error:'El servidor todavía no responde.'}));
  if(!response.ok||result.error)throw Object.assign(new Error(result.error),{status:response.status});
  return result;
}
async function send(action){
  if(busy)return;
  const epoch=generation;
  busy=true;
  revision++;
  try{
    let next;
    if(session.code){
      const result=await request(session.base,'/api/'+session.code+'/action',action,session.key);
      if(epoch!==generation)return;
      next=result.state;
    }else{
      next=structuredClone(state);
      act(next,session.id,action);
    }
    selected=null;
    error('');
    setState(next);
  }catch(e){if(epoch===generation)error(e.message);}
  finally{if(epoch===generation)busy=false;}
}
const profile=()=>({name:el('name').value,classId:el('class').value});
el('solo').onclick=()=>{
  if(busy)return;
  generation++;
  rendered='';
  const p=profile();
  const next=create();
  session={id:'local'};
  join(next,session.id,p.name,p.classId);
  act(next,session.id,{type:'start'});
  error('');
  setState(next,true);
};
async function enter(creating){
  if(busy)return;
  const epoch=++generation;
  busy=true;
  try{
    const base=new URL(el('server').value).origin;
    const code=el('code').value.trim().toUpperCase();
    if(!creating&&!/^[A-F0-9]{6}$/.test(code))throw new Error('Introduce el código de seis caracteres.');
    const result=await request(base,creating?'/api/rooms':'/api/'+code+'/join',profile());
    if(epoch!==generation)return;
    if(!Array.isArray(result.state.glyphs))throw new Error('El servidor está actualizando el juego.');
    session={base,code:result.code,key:result.key,id:result.id};
    sessionStorage.setItem('amber-session',JSON.stringify(session));
    localStorage.setItem('amber-server',base);
    rendered='';
    error('');
    setState(result.state,true);
  }catch(e){if(epoch===generation)error(e.message);}
  finally{if(epoch===generation)busy=false;}
}
el('create').onclick=()=>enter(true);
el('join').onclick=()=>enter(false);
el('leave').onclick=()=>{
  generation++;busy=false;state=null;session=null;selected=null;rendered='';
  resetAnimation();
  musicMode(false);
  sessionStorage.removeItem('amber-session');
  error('');render();
};
async function refresh(){
  if(busy||polling||!session?.code)return;
  const epoch=generation;
  const version=revision;
  polling=true;
  try{
    const result=await request(session.base,'/api/'+session.code,null,session.key);
    if(epoch!==generation||version!==revision)return;
    if(!Array.isArray(result.state.glyphs))throw new Error('El servidor está actualizando el juego.');
    setState(result.state,!state);
  }catch(e){
    if(epoch===generation&&version===revision){
      if([401,404].includes(e.status)){
        el('leave').onclick();
        error('La sala ya no está disponible.');
      }else error('No se pudo sincronizar la sala. '+e.message);
    }
  }finally{polling=false;}
}
try{session=JSON.parse(sessionStorage.getItem('amber-session'));}catch{session=null;}
refresh();
setInterval(()=>{
  if(state&&!session.code&&['combat','reward'].includes(state.phase)&&Date.now()>=state.deadline){
    const next=structuredClone(state);
    if(tick(next))setState(next);
  }
  render();
},150);
setInterval(refresh,400);

