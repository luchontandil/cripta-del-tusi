import {classes,create,join,act,tick,paths,targetable,hasRange,inRange,castableCell,spellArea,slots,statNames,onBoard,
  glyphInfo,skillFor,damagePreview,trainingChoices,modifiableRange,elements} from './engine.js?v=10';
import {portrait,spellIcon,equipmentIcon} from './art.js?v=8';
import {setupSfx} from './music.js?v=8';

const el=id=>document.getElementById(id);
let state,session,selected=null,busy=false,polling=false,generation=0,revision=0,rendered='';
let pending=[],playing=null,lastSeq=0,animationEpoch=0;
let holdLoot=false,lastDamageUntil=0;
const hitDuration=1000;
function lootReady(){
  return state?.phase==='reward'&&(!holdLoot||(!playing&&!pending.length&&performance.now()>=lastDamageUntil));
}
const onPages=location.hostname.endsWith('.github.io');
el('server').value=localStorage.getItem('amber-server')||(onPages?'https://cripta-del-tusi.onrender.com':location.origin);
const error=message=>{el('error').textContent=message;};
const iconName={expose:'Vulnerable',slow:'−PM',poison:'Veneno'};
const specs={guardia:'Primera línea · debilita al enemigo',tirador:'Flechas de largo alcance · ralentiza y empuja',mistico:'Cura y purifica a sus aliados',mago:'Daño en área y control con escarcha',sombra:'Traza rutas rápidas y envenena a sus rivales'};
const sfx=setupSfx(el('field-sfx'));
let bagShown=true,shopShown=false,drag=null,dropTarget=null,suppressInventoryClick=0;
let iso=null;
let useIso=localStorage.getItem('cripta-view')!=='2d';
const battlefield=el('battlefield');
const worldMount=el('iso-world');
function syncViewport(){
  const shown=!!(iso&&useIso&&state?.units.length&&!el('game').hidden);
  iso?.show(shown);
  battlefield.classList.toggle('isometric',shown);
  const toggle=el('view-toggle');
  toggle.hidden=!iso||!state?.units.length;
  toggle.setAttribute('aria-pressed',String(shown));
  toggle.textContent=shown?'Vista isométrica':'Vista cenital';
  el('field-view').hidden=!iso;
  el('zoom-in').hidden=el('zoom-out').hidden=!shown;
  el('field-view').setAttribute('aria-pressed',String(shown));
  el('field-view').textContent=shown?'3D':'2D';
}
el('view-toggle').onclick=()=>{
  useIso=!useIso;
  localStorage.setItem('cripta-view',useIso?'iso':'2d');
  syncViewport();
  if(iso?.active){
    iso.sync(state,hidePawn);
    iso.highlight(el('board').children);
  }
};
el('field-view').onclick=()=>el('view-toggle').click();
el('zoom-in').onclick=()=>iso?.zoom(.1);
el('zoom-out').onclick=()=>iso?.zoom(-.1);
el('field-bag').onclick=()=>{
  bagShown=!bagShown;
  el('inventory').hidden=!bagShown;
  el('field-bag').setAttribute('aria-pressed',String(bagShown));
};
el('field-shop').onclick=()=>{
  shopShown=!shopShown;
  renderInventory(state.players.find(p=>p.id===session.id));
};
worldMount.addEventListener('graphicslost',()=>{
  iso?.show(false);
  iso=null;
  syncViewport();
});
import('./isometric.js?v=10').then(({createIso})=>{
  iso=createIso(worldMount,(event,pos)=>{
    const cell=el('board').children[pos];
    if(event==='click')cell?.click();
    else cell?.dispatchEvent(new PointerEvent('pointer'+event));
  });
  syncViewport();
  if(iso?.active){
    iso.sync(state,hidePawn);
    iso.highlight(el('board').children);
  }
}).catch(()=>{syncViewport();});
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
function paintClock(){
  const clock=el('clock');
  const remaining=Math.max(0,state.deadline-Date.now());
  const seconds=Math.ceil(remaining/1000);
  const duration=state.deadline-state.turnStarted;
  el('seconds').textContent=seconds;
  clock.style.setProperty('--time',Math.min(1,remaining/Math.max(1,duration))+'turn');
  clock.setAttribute('aria-valuemax',Math.ceil(duration/1000));
  clock.setAttribute('aria-valuenow',seconds);
  clock.setAttribute('aria-valuetext',seconds+' segundos');
  clock.classList.toggle('urgent',duration>10000&&seconds<=10);
}
function unitLabel(u){
  const effects=Object.entries(u.effects||{}).map(([key,value])=>iconName[key]+' '+value.value+' ('+value.turns+' t)');
  return u.name+' · '+u.hp+'/'+u.max+' PV'+(effects.length?' · '+effects.join(' · '):'');
}
function hideUnit(){
  el('unit-tooltip').hidden=true;
}
function resourceText(element,text){
  element.replaceChildren(...text.split(/(\b(?:PA|PM)\b)/g).map(word=>{
    if(word!=='PA'&&word!=='PM')return document.createTextNode(word);
    const badge=document.createElement('b');
    badge.className=word==='PA'?'stat-pa':'stat-mp';
    badge.textContent=word;
    return badge;
  }));
}
function showTooltip(title,rows,anchor){
  const tooltip=el('unit-tooltip');
  const heading=document.createElement('strong');
  heading.textContent=title;
  tooltip.replaceChildren(heading,...rows.map(text=>{
    const row=document.createElement('div');
    resourceText(row,text);
    return row;
  }));
  tooltip.hidden=false;
  const left=Math.max(6,Math.min(anchor.left,window.innerWidth-tooltip.offsetWidth-6));
  const above=anchor.top-tooltip.offsetHeight-7;
  tooltip.style.left=left+'px';
  tooltip.style.top=(above>=6?above:Math.max(6,Math.min(anchor.bottom+7,window.innerHeight-tooltip.offsetHeight-6)))+'px';
}
function inspectCell(unit,cell,pos,glyph,source,skill,aim){
  const anchor=iso?.active?iso.anchor(pos):cell.getBoundingClientRect();
  const glyphLines=glyph?[glyphInfo[glyph.kind].name,glyphInfo[glyph.kind].description,glyph.warn?'Se activa en el próximo turno del jefe.':'Activo.']:null;
  if(!unit){
    if(glyphLines)showTooltip(glyphLines[0],glyphLines.slice(1),anchor);
    return;
  }
  const effects=Object.entries(unit.effects||{}).map(([key,status])=>iconName[key]+' '+status.value+' · '+status.turns+' turno'+(status.turns===1?'':'s'));
  const rows=[
    '♥ Vida: '+unit.hp+'/'+unit.max+' PV',
    '⛨ Armadura: '+(unit.stats?.ward||0)+' de reducción física',
    'Iniciativa: '+unit.initiative,
    'Movimiento base: '+(3+(unit.stats?.movement||0))+' PM'
  ];
  if(unit.level)rows.push('Nivel: '+unit.level);
  if(unit.enemy)rows.push('Ataque: '+unit.damage+'–'+(unit.damage+2),'Alcance: '+unit.range+' casillas');
  else rows.push(...Object.entries(unit.stats||{}).filter(([key,value])=>value&&!['ward','movement','vitality'].includes(key)).map(([key,value])=>statNames[key]+': +'+value));
  rows.push(effects.length?'Efectos: '+effects.join(' / '):'Sin efectos activos');
  if(unit.enemy&&skill){
    const preview=damagePreview(source,unit,skill);
    if(preview&&aim)rows.unshift('⚔ '+elements[preview.element]+' · '+preview.normal.join('–')+' daño',
      '✦ Crítico ('+Math.round(preview.chance*100)+' %): '+preview.critical.join('–'));
    else if(preview)rows.unshift('Fuera de alcance o sin visión.');
  }
  if(glyphLines)rows.push(...glyphLines);
  showTooltip(unit.name+' · '+(unit.enemy?'Enemigo':classes[unit.classId].name),rows,anchor);
}
window.addEventListener('scroll',hideUnit,{passive:true});
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
const statIcons={physical:'⚔',fire:'♨',ice:'❄',arcane:'✦',shadow:'◐',vitality:'♥',reach:'◎',ward:'⛨',critical:'✸',movement:'➝',action:'◆'};
const statText=(key,value)=>statIcons[key]+' +'+value+(key==='critical'?' %':'')+' '+statNames[key];
const describe=stats=>Object.entries(stats).map(([key,value])=>statText(key,value)).join(' · ');
function itemRow(item,title,actions=[]){
  const row=document.createElement('div');
  row.className='item';
  const name=document.createElement('b');
  name.textContent=title+(item?.name||'Vacío');
  name.className=item?.kind==='rune'?'rune':'grade'+(item?.grade||0);
  const heading=document.createElement('div');
  heading.className='item-heading';
  if(item)heading.append(equipmentIcon(item.kind==='rune'?'rune':item.slot));
  heading.append(name);
  row.append(heading);
  if(item){
    const desc=document.createElement('small');
    resourceText(desc,[item.rarity,describe(item.stats),item.socket?'⚒ '+item.socket.name+' · '+describe(item.socket.stats):''].filter(Boolean).join(' · '));
    row.append(desc);
  }
  row.append(...actions);
  return row;
}
function comparison(item,player){
  const old=player.equipment[item.slot];
  const box=document.createElement('div');
  box.className='loot-comparison';
  const title=document.createElement('strong');
  title.textContent=old?'Frente a '+old.name:'Ranura libre';
  box.append(title);
  const delta=document.createElement('div');
  delta.className='loot-deltas';
  for(const [key,label] of Object.entries(statNames)){
    const change=(item.stats[key]||0)-(old?.stats[key]||0)-(old?.socket?.stats[key]||0);
    if(!change)continue;
    const stat=document.createElement('span');
    stat.className=change>0?'gain':'loss';
    resourceText(stat,statIcons[key]+' '+(change>0?'+':'−')+Math.abs(change)+(key==='critical'?' %':'')+' '+label);
    delta.append(stat);
  }
  if(!delta.children.length)delta.textContent='Mismos atributos';
  box.append(delta);
  return box;
}
function lootCard(item,player){
  const card=document.createElement('article');
  card.className='loot-card grade'+(item.kind==='rune'?3:item.grade);
  const visual=document.createElement('div');
  visual.className='loot-icon';
  visual.append(equipmentIcon(item.kind==='rune'?'rune':item.slot));
  const title=document.createElement('h4');
  title.textContent=item.name;
  const type=document.createElement('small');
  type.textContent=item.kind==='rune'?'Runa · Engarzable':slots[item.slot]+' · '+item.rarity;
  const stats=document.createElement('ul');
  for(const [key,value] of Object.entries(item.stats)){
    const li=document.createElement('li');
    resourceText(li,statText(key,value));
    stats.append(li);
  }
  card.append(visual,title,type,stats);
  if(item.kind==='gear')card.append(comparison(item,player));
  const take=actionButton('A la mochila','reward',{item:item.id});
  if(item.kind==='gear'){
    const equip=actionButton('Equipar ahora','reward',{item:item.id,equip:true});
    equip.className='primary';
    card.append(equip);
  }
  card.append(take);
  return card;
}
const dropTargets=new WeakMap();
function draggable(tile,payload){
  const face=tile.querySelector('summary');
  face.classList.add('draggable-item');
  face.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    drag={payload,x:event.clientX,y:event.clientY,id:event.pointerId,label:face.title};
  });
}
function dropZone(tile,accept,drop){
  dropTargets.set(tile,{accept,drop});
}
function inventoryTarget(event){
  let node=document.elementFromPoint(event.clientX,event.clientY);
  while(node&&node!==el('inventory')){
    if(dropTargets.get(node)?.accept(drag.payload))return node;
    node=node.parentElement;
  }
  return null;
}
document.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  if(!drag.ghost&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<5)return;
  if(!drag.ghost){
    drag.ghost=document.createElement('span');
    drag.ghost.className='item-ghost';
    drag.ghost.textContent=drag.label;
    document.body.append(drag.ghost);
    el('inventory').classList.add('dragging');
  }
  drag.ghost.style.left=event.clientX+'px';
  drag.ghost.style.top=event.clientY+'px';
  const next=inventoryTarget(event);
  dropTarget?.classList.remove('drop-target');
  dropTarget=next;
  dropTarget?.classList.add('drop-target');
});
function finishDrag(event){
  if(!drag||event.pointerId!==drag.id)return;
  const active=drag;
  const target=event.type==='pointerup'&&active.ghost?inventoryTarget(event):null;
  drag=null;
  dropTarget?.classList.remove('drop-target');
  dropTarget=null;
  active.ghost?.remove();
  el('inventory').classList.remove('dragging');
  if(active.ghost)suppressInventoryClick=performance.now()+310;
  if(target)dropTargets.get(target).drop(active.payload);
}
document.addEventListener('pointerup',finishDrag);
document.addEventListener('pointercancel',finishDrag);
el('inventory').addEventListener('click',event=>{
  if(performance.now()<suppressInventoryClick){event.preventDefault();event.stopImmediatePropagation();}
},true);
function inventorySlot(item,label,actions=[],fallback=''){
  const tile=document.createElement(item?'details':'div');
  tile.className='inventory-slot '+(item?'filled grade'+(item.grade||0):'empty');
  const face=document.createElement(item?'summary':'span');
  if(item||fallback)face.append(equipmentIcon(item?.kind==='rune'?'rune':item?.slot||fallback));
  if(label){
    const name=document.createElement('small');
    name.textContent=label;
    face.append(name);
  }
  face.title=item?.name||label||'Ranura vacía';
  if(item)face.setAttribute('aria-label',(label?label+' · ':'')+item.name);
  if(item&&label){
    const inspect=()=>showTooltip(item.name,[item.rarity||'',...Object.entries(item.stats).map(([key,value])=>statText(key,value)),
      ...(item.socket?['Engarzada: '+item.socket.name,describe(item.socket.stats)]:[])].filter(Boolean),face.getBoundingClientRect());
    face.addEventListener('pointerenter',inspect);
    face.addEventListener('pointerleave',hideUnit);
    face.addEventListener('focus',inspect);
    face.addEventListener('blur',hideUnit);
    if(item.socket){
      const rune=equipmentIcon('rune');
      rune.classList.add('socket-icon');
      rune.title=item.socket.name;
      face.append(rune);
    }
  }
  tile.append(face);
  if(item)tile.append(itemRow(item,'',actions));
  return tile;
}
function renderInventory(player){
  const holder=el('inventory');
  const rewards=el('rewards');
  const trading=lootReady();
  holder.hidden=state.phase==='lobby'||!bagShown;
  el('field-shop').hidden=!trading;
  const choosing=trading&&!state.picks.includes(player.id);
  rewards.hidden=!choosing&&!(trading&&shopShown);
  if(state.phase==='lobby'){holder.replaceChildren();rewards.replaceChildren();return;}
  const gear=panel('Nivel '+player.level);
  const xp=document.createElement('progress');
  xp.max=100;
  xp.value=player.xp||0;
  xp.setAttribute('aria-label','Experiencia');
  const xpLabel=document.createElement('small');
  xpLabel.textContent=(player.xp||0)+' / 100 XP';
  gear.append(xp,xpLabel);
  const gearGrid=document.createElement('div');
  gearGrid.className='equipment-grid';
  for(const [slot,label] of Object.entries(slots)){
    const item=player.equipment[slot];
    const actions=item&&trading?[actionButton('Quitar','unequip',{slot})]:[];
    if(trading&&item?.socket)actions.push(actionButton('Extraer runa','unsocket',{slot}));
    const tile=inventorySlot(item,label,actions,slot);
    if(trading){
      if(item)draggable(tile,{from:'gear',slot});
      dropZone(tile,p=>p.from==='bag'&&(p.slot===slot||(p.kind==='rune'&&!!item)),
        p=>send({type:p.kind==='rune'?'socket':'equip',slot,item:p.item}));
    }
    gearGrid.append(tile);
  }
  gear.append(gearGrid);
  const bag=panel('Mochila');
  const bagGrid=document.createElement('div');
  bagGrid.className='bag-grid';
  for(const item of player.bag){
    const actions=[];
    if(trading){
      if(item.kind==='gear')actions.push(actionButton('Equipar','equip',{item:item.id}));
      else for(const [slot,label] of Object.entries(slots)){
        if(player.equipment[slot])actions.push(actionButton('Engarzar en '+label.toLowerCase(),'socket',{item:item.id,slot}));
      }
      actions.push(actionButton('Vender · '+(Math.floor(item.price/2)+(item.socket?Math.floor(item.socket.price/2):0))+' oro','sell',{item:item.id}));
    }
    const tile=inventorySlot(item,'',actions);
    if(trading)draggable(tile,{from:'bag',item:item.id,slot:item.slot,kind:item.kind});
    bagGrid.append(tile);
  }
  const visibleSlots=Math.max(12,Math.ceil(player.bag.length/4)*4);
  for(let index=player.bag.length;index<visibleSlots;index++)bagGrid.append(inventorySlot(null,''));
  if(trading)dropZone(bagGrid,p=>p.from==='gear',p=>send({type:'unequip',slot:p.slot}));
  bag.append(bagGrid);
  const gold=document.createElement('div');
  gold.className='bag-gold';
  gold.textContent='◈ '+player.gold+' oro';
  bag.append(gold);
  holder.replaceChildren(gear,bag);
  if(rewards.hidden){rewards.replaceChildren();return;}
  const shop=panel('Mercader');
  if(!state.stock.length)shop.append('Todo vendido');
  for(const item of state.stock){
    const buy=actionButton('Comprar · '+item.price+' oro','buy',{item:item.id});
    buy.disabled=player.gold<item.price;
    shop.append(itemRow(item,'',[buy]));
  }
  const loot=panel('Botín · Elige una recompensa');
  loot.classList.add('loot-panel');
  const choices=state.offers[player.id]||[];
  if(state.picks.includes(player.id))loot.append('Botín elegido. '+state.picks.length+'/'+state.players.length+' listos.');
  else{
    const cards=document.createElement('div');
    cards.className='loot-cards';
    for(const item of choices)cards.append(lootCard(item,player));
    const skip=actionButton('No quiero ninguno','reward',{item:null});
    skip.className='loot-skip';
    loot.append(cards,skip);
  }
  if(shopShown)shop.prepend(btn('Cerrar',()=>{
    shopShown=false;
    renderInventory(player);
  }));
  rewards.replaceChildren(...(choosing?[loot]:[]),...(shopShown?[shop]:[]));
}
const trainingDialog=el('training');
trainingDialog.addEventListener('cancel',event=>event.preventDefault());
function updateTraining(player,ready){
  if(!ready||!state.training||player.trained){
    if(trainingDialog.open)trainingDialog.close();
    return;
  }
  if(trainingDialog.open)return;
  el('training-title').textContent='Nivel '+(player.level+1)+' · Habilidad';
  el('training-choices').replaceChildren(...trainingChoices(player).map(({index,rank,name})=>
    actionButton((rank?'Mejorar a '+(rank+1)+'/3 · ':'Aprender · ')+name,'train',{skill:index})));
  hideUnit();
  trainingDialog.showModal();
}
function pawnName(name){
  const tag=document.createElement('span');
  tag.className='pawn-name';
  tag.textContent=name;
  return tag;
}
function boardPoint(pos,height){
  if(iso?.active){
    const p=iso.anchor(pos,height);
    const rect=worldMount.getBoundingClientRect();
    return {left:(p.left-rect.left+14)+'px',top:(p.top-rect.top)+'px'};
  }
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
  holdLoot=false;
  lastDamageUntil=0;
  el('animations').replaceChildren();
}
function impact(event){
  if(event.kind==='spell'){
    sfx(event.effect);
    if(iso?.active)iso.impact(event);
    else{
      for(const pos of event.area||[event.pos]){
        const flash=document.createElement('span');
        flash.className='spell-burst '+event.effect;
        Object.assign(flash.style,boardPoint(pos));
        el('animations').append(flash);
        setTimeout(()=>flash.remove(),600);
      }
    }
    return;
  }
  if(iso?.active){
    iso.impact(event);
    if(event.kind==='blast')return;
  }
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
  const damage=event.kind!=='heal';
  tag.className=['impact',event.kind,damage&&'damage-number',event.critical&&'critical'].filter(Boolean).join(' ');
  tag.textContent=(damage?'':'+')+event.amount+(event.critical?'!':'');
  Object.assign(tag.style,boardPoint(event.pos,damage?1.48:undefined));
  const stack=el('animations').querySelectorAll('.impact[data-cell="'+event.pos+'"]').length;
  tag.dataset.cell=event.pos;
  tag.style.setProperty('--float-offset',String(-25*stack)+'px');
  el('animations').append(tag);
  if(damage)lastDamageUntil=performance.now()+hitDuration;
  setTimeout(()=>tag.remove(),damage?hitDuration:850);
}
async function animate(){
  if(playing||!pending.length||!state)return;
  const epoch=animationEpoch;
  while(pending.length&&epoch===animationEpoch){
    const event=pending.shift();
    playing=event;
    if(!['combat','reward','won','lost'].includes(state.phase))continue;
    if(event.kind!=='move'){impact(event);continue;}
    if(iso?.active){
      await iso.move(event);
      continue;
    }
    const pawn=document.createElement('div');
    pawn.className='pawn moving';
    pawn.style.inset='auto';
    pawn.style.width=(100/state.width)+'%';
    pawn.style.height=(100/state.height)+'%';
    Object.assign(pawn.style,boardPoint(event.from));
    const name=state.units.find(u=>u.id===event.unit)?.name;
    pawn.append(portrait(event.look));
    if(name)pawn.append(pawnName(name));
    el('animations').append(pawn);
    updatePawns();
    let from=boardPoint(event.from);
    for(const square of event.path){
      const to=boardPoint(square);
      const motion=pawn.animate([from,to],{duration:event.unit.startsWith('enemy')?140:220,easing:'ease-in-out',fill:'forwards'});
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
  if(iso?.active)iso.sync(state,hidePawn);
  updatePawns();
}
function setState(next,initial=false){
  const previous=state;
  const newFloor=previous?.floor!==next.floor;
  if(newFloor||initial){
    resetAnimation();
    lastSeq=next.seq||0;
  }else{
    const fresh=(next.events||[]).filter(e=>e.seq>lastSeq&&e.floor===next.floor);
    if(next.phase==='reward'&&previous?.phase==='combat'){
      holdLoot=true;
      lastDamageUntil=Math.max(lastDamageUntil,performance.now()+hitDuration);
    }
    pending.push(...fresh);
    lastSeq=next.seq||lastSeq;
  }
  if(newFloor||previous?.turn!==next.turn||previous?.phase!==next.phase||previous?.rounds!==next.rounds){
    selected=null;
  }
  if(next.phase!=='reward')shopShown=false;
  state=next;
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
  if(iso?.active)iso.highlight(board.children);
}
function paintArea(area=[]){
  const board=el('board');
  for(const cell of board.querySelectorAll('.area-preview'))cell.classList.remove('area-preview');
  for(const pos of area)board.children[pos]?.classList.add('area-preview');
  if(iso?.active)iso.highlight(board.children);
}
function drawBoard(turn,walking,skill){
  const board=el('board');
  const field=el('battlefield');
  hideUnit();
  iso?.resetHover();
  field.hidden=!state.units.length;
  board.replaceChildren();
  syncViewport();
  if(field.hidden)return;
  board.style.setProperty('--cols',state.width);
  board.className=(state.biome||'crypt')+(state.voids?.length?' shaped':'');
  const fragment=document.createDocumentFragment();
  const shades=state.biome==='roots'?['#55513a','#4d573b','#60573d','#3f4938']:['#49524c','#3d4845','#515650','#3b4540'];
  for(let pos=0;pos<state.width*state.height;pos++){
    const unit=state.units.find(u=>u.hp>0&&u.pos===pos);
    const voidCell=!onBoard(state,pos);
    const wall=state.walls.includes(pos);
    const glyph=state.glyphs.find(g=>g.cells.includes(pos));
    const castRange=skill&&inRange(state,turn,pos,skill);
    const blocked=skill&&hasRange(state,turn,pos,skill)&&!castRange;
    const blast=skill?.[5]==='blast';
    const aim=castRange&&(castableCell(state,turn,pos,skill)||(!['dash','blast'].includes(skill[5])&&targetable(state,turn,unit,skill)));
    const path=walking.get(pos);
    const cell=btn('',()=>{
      if(aim){send({type:'skill',pos,skill:selected});return;}
      if(path)send({type:'move',pos});
    });
    const shadesIndex=((Math.imul(pos+1,2654435761)^state.mapSeed)>>>6)%shades.length;
    cell.style.setProperty('--tile',shades[shadesIndex]);
    cell.className=['cell',voidCell&&'void',wall&&'wall',path&&'walk',blocked&&'no-sight',castRange&&'cast-range',aim&&'aim',glyph&&'glyph-'+glyph.kind,glyph?.warn&&'warn'].filter(Boolean).join(' ');
    if(voidCell){cell.disabled=true;cell.setAttribute('aria-hidden','true');}
    cell.setAttribute('aria-label',(unit?.name||(wall?'Muro':'Casilla'))+' '+(pos%state.width+1)+', '+(Math.floor(pos/state.width)+1));
    if(path){
      cell.onpointerenter=cell.onfocus=()=>{
        paintPath(path,turn.pos);
        resourceText(el('path-status'),path.length+' PM · Clic para moverte');
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
      pawn.append(portrait(unit.look||unit.classId),hp,pawnName(unit.name));
      cell.append(pawn);
    }
    if(unit||glyph){
      const inspect=()=>inspectCell(unit,cell,pos,glyph,turn,skill,aim);
      cell.addEventListener('pointerenter',inspect);
      cell.addEventListener('pointerleave',hideUnit);
      cell.addEventListener('focus',inspect);
      cell.addEventListener('blur',hideUnit);
    }
    if(glyph)cell.title=[cell.title,{damage:'Brasas',poison:'Veneno',slow:'Cadenas'}[glyph.kind],glyph.warn?'Se activa en el próximo turno del jefe':'Glifo activo'].filter(Boolean).join(' · ');
    fragment.append(cell);
  }
  board.append(fragment);
  if(iso?.active){
    iso.sync(state,hidePawn);
    iso.highlight(board.children);
  }
}
function render(){
  el('entry').hidden=!!state;
  el('game').hidden=!state;
  document.body.classList.toggle('in-expedition',!!state);
  if(!state){if(trainingDialog.open)trainingDialog.close();return;}
  const turn=state.units[state.turn];
  const mine=state.phase==='combat'&&turn?.id===session.id;
  const host=state.players[0]?.id===session.id;
  const rewardReady=lootReady();
  const title={lobby:'Sala de expedición',combat:'Piso '+state.floor+' · '+state.layoutName+' · '+turn?.name+(mine?' (tú)':''),reward:rewardReady?'Botín y mercader':'Victoria',won:'Expedición completada',lost:'El grupo ha caído'}[state.phase];
  el('phase').textContent=title;
  el('turn-bar').hidden=state.phase!=='combat'&&!rewardReady;
  if(!el('turn-bar').hidden)paintClock();
  const signature=JSON.stringify([state,selected,rewardReady]);
  if(signature===rendered)return;
  rendered=signature;
  el('room').textContent=session.code?'Sala '+session.code:'En solitario';
  el('copy-code').hidden=!session.code;
  el('glyph-legend').hidden=!(state.phase==='combat'&&state.glyphs.length);
  el('turns').replaceChildren(...initiative(turn));
  el('log').replaceChildren(...state.log.map(entry=>{
    const li=document.createElement('li');
    resourceText(li,entry);
    return li;
  }));
  const controls=el('controls');
  controls.replaceChildren();
  el('end-turn').disabled=!mine;
  el('pa').textContent=state.phase==='combat'&&!turn.enemy?state.ap:'—';
  el('pm').textContent=state.phase==='combat'&&!turn.enemy?state.mp:'—';
  if(state.phase==='lobby'&&host)controls.append(actionButton('Iniciar expedición','start'));
  if(rewardReady&&host){
    const next=actionButton('Siguiente piso','next');
    next.disabled=state.picks.length!==state.players.length||(state.training&&state.players.some(p=>!p.trained));
    next.className='primary next-floor';
    controls.append(next);
  }
  if(['won','lost'].includes(state.phase)&&host)controls.append(actionButton('Volver a la sala','restart'));
  const walking=mine&&selected===null?paths(state,turn,state.mp):new Map();
  const skill=mine&&selected!==null?skillFor(turn,selected):null;
  if(mine){
    controls.append(btn('Mover',()=>{selected=null;render();},selected===null));
    classes[turn.classId].skills.forEach((_,i)=>{
      const current=skillFor(turn,i);
      if(!current)return;
      const [name,cost,range,min,max,kind,symbol,minRange=0]=current;
      const b=btn(name,()=>selectSpell(i),selected===i);
      b.className='ability';
      b.prepend(spellIcon(kind,symbol));
      const shortcut=document.createElement('kbd');
      shortcut.textContent=i+1;
      shortcut.setAttribute('aria-hidden','true');
      b.append(shortcut);
      b.setAttribute('aria-keyshortcuts',String(i+1));
      b.title='Nivel '+turn.skillRanks[i]+' · '+cost+' PA · alcance '+minRange+'–'+(range+(modifiableRange(current)?turn.stats.reach:0))+(kind==='dash'?' · movimiento sin gastar PM':' · '+min+'–'+max+' '+(['heal','cleanse'].includes(kind)?'cura':'daño base'));
      const costLabel=document.createElement('span');
      costLabel.className='stat-pa ability-cost';
      costLabel.textContent=cost+' PA';
      b.append(costLabel);
      b.disabled=cost>state.ap;
      controls.append(b);
    });
    const hint=document.createElement('small');
    hint.id='path-status';
    hint.textContent=selected===null?'Azul: casillas a las que puedes moverte.':'Morado: alcance · Rojo: sin visión · Dorado: objetivo válido'+(skill[5]==='blast'?' · Naranja: área de impacto':'');
    controls.append(hint);
  }
  drawBoard(turn,walking,skill);
  const player=state.players.find(p=>p.id===session.id);
  renderInventory(player);
  updateTraining(player,rewardReady);
}
function endTurn(){
  if(state?.phase==='combat'&&state.units[state.turn]?.id===session?.id)send({type:'end'});
}
function selectSpell(index){
  const unit=state?.units[state.turn];
  if(state?.phase!=='combat'||unit?.id!==session?.id)return;
  const skill=skillFor(unit,index);
  if(!skill||skill[1]>state.ap)return;
  selected=selected===index?null:index;
  render();
}
el('end-turn').onclick=endTurn;
document.addEventListener('keydown',event=>{
  if(state?.phase!=='combat'||event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.key==='F1'){
    event.preventDefault();
    if(!event.repeat)endTurn();
  }else if(/^[1-9]$/.test(event.key)&&!event.repeat&&
    !event.target.closest?.('input, textarea, select, [contenteditable]')){
    selectSpell(Number(event.key)-1);
  }
},true);
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
  if(!result.state?.players?.every(player=>Array.isArray(player.skillRanks))){
    throw new Error('La versión del servidor no coincide con la del juego.');
  }
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
  syncViewport();
  hideUnit();
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

