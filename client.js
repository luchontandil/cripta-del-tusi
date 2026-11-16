import {critChance,classes,create,join,act,tick,paths,targetable,hasRange,inRange,castableCell,spellArea,slots,statNames,onBoard,
  glyphInfo,skillFor,damagePreview,trainingChoices,modifiableRange,elements,skillElement,nodeKinds,modText,trapInfo} from './engine.js?v=16';
import {portrait,spellIcon,equipmentIcon} from './art.js?v=16';
import {setupSfx} from './music.js?v=16';
import {icon} from './icons.js?v=16';

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
const iconName={expose:'Vulnerable',slow:'Ralentizado',poison:'Veneno'};
const effectHelp={expose:v=>'+'+v+' de daño recibido',slow:v=>'−'+v+' PM',poison:v=>v+' PV por turno'};
const specs={guardia:'Primera línea · debilita al enemigo',tirador:'Flechas de largo alcance · ralentiza y empuja',mistico:'Cura y purifica a sus aliados',mago:'Daño en área y control con escarcha',sombra:'Traza rutas rápidas y envenena a sus rivales'};
const roles={guardia:'Tanque',tirador:'Distancia',mistico:'Apoyo',mago:'Hechicero',sombra:'Asesino'};
const sfx=setupSfx(el('field-sfx'));
/** Crea un elemento con clase y contenido (texto o nodos). */
function h(tag,className,...children){
  const node=document.createElement(tag);
  if(className)node.className=className;
  for(const child of children)if(child!==null&&child!==undefined&&child!==false)node.append(child);
  return node;
}
/** Pone un icono delante del texto de un botón. */
function iconLabel(button,name,text,iconOnly=false){
  button.replaceChildren(icon(name),...(iconOnly?[]:[h('span','label',text)]));
  if(iconOnly&&text){button.title=button.title||text;button.setAttribute('aria-label',text);}
  return button;
}
iconLabel(el('field-bag'),'bag','Equipo y mochila',true);
iconLabel(el('zoom-in'),'zoomIn','Acercar cámara',true);
iconLabel(el('zoom-out'),'zoomOut','Alejar cámara',true);
iconLabel(el('field-shop'),'shop','Mercader');
iconLabel(el('leave'),'exit','Salir');
iconLabel(el('copy-code'),'copy','Copiar código');
iconLabel(el('solo'),'play','Jugar en solitario');
iconLabel(el('create'),'users','Crear sala');
let bagShown=true,shopShown=false,drag=null,dropTarget=null,suppressInventoryClick=0;
let iso=null;
let useIso=localStorage.getItem('cripta-view')!=='2d';
const battlefield=el('battlefield');
const worldMount=el('iso-world');
function syncViewport(){
  const shown=!!(iso&&useIso&&state?.units.length&&!el('game').hidden&&!['map','event'].includes(state?.phase));
  iso?.show(shown);
  battlefield.classList.toggle('isometric',shown);
  const toggle=el('view-toggle');
  toggle.hidden=!iso||!state?.units.length;
  toggle.setAttribute('aria-pressed',String(shown));
  iconLabel(toggle,shown?'cube':'grid',shown?'Vista 3D':'Vista cenital');
  el('field-view').hidden=!iso;
  el('zoom-in').hidden=el('zoom-out').hidden=!shown;
  el('field-view').setAttribute('aria-pressed',String(shown));
  el('field-view').replaceChildren(icon(shown?'grid':'cube'));
  el('field-view').title=shown?'Cambiar a vista cenital':'Cambiar a vista 3D';
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
import('./isometric.js?v=16').then(({createIso})=>{
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
  const cls=classes[kind];
  for(const card of el('class-cards').children){
    const on=card.dataset.kind===kind;
    card.setAttribute('aria-checked',String(on));
    card.tabIndex=on?0:-1;
  }
  const sample={classId:kind,stats:{},level:1};
  const skills=h('ul','preview-skills',...cls.skills.map((skill,index)=>{
    const locked=index===cls.skills.length-1;
    const item=h('li',locked?'locked':null,spellIcon(skill[5],skill[6]),h('span',null,skill[0]),h('small',locked?'unlock':'stat-pa',locked?'Nivel 2+':skill[1]+' PA'));
    item.tabIndex=0;
    const show=()=>{
      const rect=item.getBoundingClientRect();
      const nodes=skillTipNodes(sample,locked?null:index,skill,locked?0:1);
      if(locked)nodes.push(h('p','tip-note','Se puede aprender al subir de nivel.'));
      showTip(nodes,{left:rect.left,top:rect.top,bottom:rect.bottom},'tip-skill');
    };
    item.onpointerenter=item.onfocus=show;
    item.onpointerleave=item.onblur=hideUnit;
    return item;
  }));
  el('class-preview').replaceChildren(
    h('div','preview-head',h('strong',null,cls.name),h('span','role-tag',roles[kind])),
    h('p',null,specs[kind]),
    h('div','preview-stats',h('span','mini-stat',icon('hp'),cls.hp+' PV'),h('span','mini-stat',icon('initiative'),'Iniciativa '+cls.initiative)),
    skills);
}
el('class').onchange=classPreview;
el('class-cards').replaceChildren(...Object.entries(classes).map(([kind,cls])=>{
  const card=h('button','class-card',h('span','class-art',portrait(kind)),h('span','class-name',cls.name),h('small',null,roles[kind]));
  card.type='button';
  card.dataset.kind=kind;
  card.setAttribute('role','radio');
  card.onclick=()=>{el('class').value=kind;classPreview();};
  card.onkeydown=event=>{
    const keys={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1};
    if(!(event.key in keys))return;
    event.preventDefault();
    const list=[...el('class-cards').children];
    const next=list[(list.indexOf(card)+keys[event.key]+list.length)%list.length];
    next.click();next.focus();
  };
  return card;
}));
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
/** Coloca la ficha flotante junto al ancla, sin salirse de la ventana. */
function placeTip(anchor){
  const tooltip=el('unit-tooltip');
  tooltip.hidden=false;
  const left=Math.max(6,Math.min(anchor.left,window.innerWidth-tooltip.offsetWidth-6));
  const above=anchor.top-tooltip.offsetHeight-9;
  tooltip.style.left=left+'px';
  tooltip.style.top=(above>=6?above:Math.max(6,Math.min(anchor.bottom+9,window.innerHeight-tooltip.offsetHeight-6)))+'px';
}
function showTip(nodes,anchor,tone=''){
  const tooltip=el('unit-tooltip');
  tooltip.className='tip'+(tone?' '+tone:'');
  tooltip.replaceChildren(...nodes);
  placeTip(anchor);
}
/** Fila de estadística: icono · nombre · valor. */
function statRow(iconName,label,value,tone=''){
  const row=h('div','tip-row'+(tone?' '+tone:''),icon(iconName),h('span','tip-label',label));
  const val=h('span','tip-value');
  resourceText(val,String(value));
  row.append(val);
  return row;
}
function tipHead(art,title,subtitle,badge){
  return h('div','tip-head',art,h('div','tip-title',h('strong',null,title),subtitle?h('small',null,subtitle):null),badge?h('span','tip-badge',badge):null);
}
function hpBar(u){
  const pct=Math.max(0,Math.min(100,u.hp/u.max*100));
  const bar=h('div','tip-hp'+(u.enemy?' foe':''),h('i'),h('span',null,u.hp+' / '+u.max+' PV'));
  bar.style.setProperty('--hp',pct+'%');
  return bar;
}
function effectChips(unit){
  const list=Object.entries(unit.effects||{});
  if(!list.length)return null;
  return h('div','tip-effects',...list.map(([key,status])=>{
    const chip=h('span','effect-chip effect-'+key,icon(key),iconName[key]+' ',h('b',null,effectHelp[key]?.(status.value)||status.value),h('small',null,' · '+status.turns+' t'));
    return chip;
  }));
}
function glyphNodes(glyph){
  const info=glyphInfo[glyph.kind];
  return [h('div','tip-glyph glyph-'+glyph.kind,icon('glyph'),h('div',null,h('strong',null,info.name),h('p',null,info.description),
    h('small',null,glyph.warn?'Se activa en el próximo turno del jefe.':'Activo')))];
}
function terrainNodes(pos){
  const trap=state.traps?.find(t=>t.pos===pos);
  if(trap)return [h('div','tip-glyph terrain-'+trap.kind,icon(trap.kind),h('div',null,h('strong',null,trapInfo[trap.kind].name),h('p',null,trapInfo[trap.kind].description(state.floor)),h('small',null,'Afecta a héroes y monstruos')))];
  if(state.water?.includes(pos))return [h('div','tip-glyph terrain-water',icon('water'),h('div',null,h('strong',null,'Agua'),h('p',null,'No se puede cruzar, pero no bloquea la línea de visión.')))];
  return [];
}
function inspectCell(unit,cell,pos,glyph,source,skill,aim){
  const anchor=iso?.active?iso.anchor(pos):cell.getBoundingClientRect();
  if(!unit){
    const nodes=[...(glyph?glyphNodes(glyph):[]),...terrainNodes(pos)];
    if(nodes.length)showTip(nodes,anchor,'tip-compact');
    return;
  }
  const nodes=[tipHead(portrait(unit.look||unit.classId),unit.name,unit.enemy?(unit.boss?'Jefe':unit.elite?'Élite':'Enemigo'):classes[unit.classId].name+(unit.level?' · nivel '+unit.level:''),null),hpBar(unit)];
  if(unit.enemy&&skill){
    const preview=damagePreview(source,unit,skill);
    if(preview&&aim){
      nodes.push(h('div','tip-preview',
        statRow(preview.element,'Daño '+elements[preview.element].toLowerCase(),preview.normal.join('–'),'hit'),
        statRow('critical','Crítico · '+Math.round(preview.chance*100)+' %',preview.critical.join('–'),'crit')));
    }else if(preview)nodes.push(h('div','tip-warning',icon('info'),'Fuera de alcance o sin línea de visión'));
  }
  const stats=h('div','tip-stats');
  stats.append(
    statRow('ward','Armadura',unit.stats?.ward||0),
    statRow('initiative','Iniciativa',unit.initiative),
    statRow('mp','Movimiento',(3+(unit.stats?.movement||0))+' PM'));
  if(unit.enemy){
    stats.append(statRow('attack','Ataque',unit.damage+'–'+(unit.damage+2)),statRow('range','Alcance',unit.range+(unit.range===1?' casilla':' casillas')));
  }else{
    for(const [key,value] of Object.entries(unit.stats||{})){
      if(!value||['ward','movement','vitality'].includes(key))continue;
      stats.append(statRow(key,statNames[key],'+'+value+(key==='critical'?' %':'')));
    }
  }
  nodes.push(stats);
  const chips=effectChips(unit);
  if(chips)nodes.push(chips);
  if(glyph)nodes.push(...glyphNodes(glyph));
  nodes.push(...terrainNodes(pos));
  showTip(nodes,anchor,unit.enemy?'tip-foe':'tip-ally');
}
window.addEventListener('scroll',hideUnit,{passive:true});
const skillEffects={
  expose:'Vulnerable 2 turnos: todos los atacantes infligen +3',
  slow:'Ralentiza: −2 PM en el próximo turno del objetivo',
  venom:'Veneno: 3 PV por turno durante 2 turnos',
  blast:'Área en cruz: la casilla elegida y las 4 adyacentes',
  push:'Empuja al objetivo una casilla',
  cleanse:'Elimina todos los efectos negativos del aliado',
  heal:'Cura a un aliado o a ti mismo',
  dash:'Teletransporte por una ruta libre sin gastar PM'
};
/** Datos calculados de una habilidad para un personaje (con su equipo, si lo tiene). */
function skillFacts(unit,skill){
  const [,cost,range,min,max,kind,,minRange=0]=skill;
  const reach=modifiableRange(skill)?(unit.stats?.reach||0):0;
  const healing=['heal','cleanse'].includes(kind);
  const element=skillElement(unit,skill);
  const bonus=healing?Math.floor((unit.level||1)/2):kind==='dash'?0:(unit.stats?.[element]||0);
  return {cost,minRange,maxRange:range+reach,reach,healing,element,bonus,low:min+bonus,high:max+bonus,kind,modifiable:modifiableRange(skill)};
}
/** Filas de la ficha de una habilidad. */
function skillRows(unit,skill){
  const f=skillFacts(unit,skill);
  const rows=[statRow('ap','Coste',f.cost+' PA')];
  if(f.kind==='dash')rows.push(statRow('dash','Efecto','Movimiento sin PM'));
  else if(f.healing)rows.push(statRow('heal','Curación',f.low+'–'+f.high+(f.bonus?' (+'+f.bonus+' nivel)':'')));
  else{
    rows.push(statRow(f.element,'Elemento',elements[f.element],'element-'+f.element));
    rows.push(statRow(f.element,'Daño',f.low+'–'+f.high+(f.bonus?' (+'+f.bonus+' equipo)':'')));
    rows.push(statRow('critical','Crítico',Math.round(critChance(unit)*100)+' % · ×1,5'));
  }
  rows.push(statRow('range','Alcance',(f.minRange?f.minRange+'–':'')+f.maxRange+(f.maxRange===1?' casilla':' casillas')+(f.reach?' (+'+f.reach+')':'')));
  rows.push(statRow('reach','Alcance modificable',f.modifiable?'Sí':'No',f.modifiable?'yes':'no'));
  rows.push(statRow('info','Línea de visión','Necesaria'));
  return rows;
}
function skillTipNodes(unit,index,skill,rank){
  const [name,,,,,kind,symbol]=skill;
  return [tipHead(spellIcon(kind,symbol),name,rank?'Nivel '+rank+' de 3':'Sin aprender',index!==null?String(index+1):null),
    h('div','tip-stats',...skillRows(unit,skill)),
    skillEffects[kind]?h('p','tip-note',skillEffects[kind]):null].filter(Boolean);
}
function initiative(turn){
  const units=state.units.length?state.units:state.players;
  return units.map(u=>{
    const li=h('li',u.enemy?'foe':'ally',h('span','turn-art',portrait(u.look||u.classId)));
    const info=h('span','turn-info',h('span','turn-name',u.name));
    if(u.max){
      const bar=h('span','turn-hp',h('i'));
      bar.style.setProperty('--hp',Math.max(0,u.hp/u.max*100)+'%');
      info.append(bar);
      li.append(info,h('span','turn-pv',String(u.hp)));
      li.onpointerenter=()=>{
        const rect=li.getBoundingClientRect();
        const nodes=[tipHead(portrait(u.look||u.classId),u.name,u.enemy?'Enemigo':classes[u.classId]?.name||'',null),hpBar(u)];
        const chips=effectChips(u);
        if(chips)nodes.push(chips);
        showTip(nodes,{left:rect.right+8,top:rect.top+rect.height,bottom:rect.top},u.enemy?'tip-foe':'tip-ally');
      };
      li.onpointerleave=hideUnit;
    }else info.append(h('small',null,classes[u.classId].name));
    if(!u.max)li.append(info);
    li.classList.toggle('current',state.phase==='combat'&&u===turn);
    li.classList.toggle('dead',u.hp===0);
    return li;
  });
}
function panel(title,iconName){
  const box=document.createElement('section');
  box.className='panel inventory-panel';
  const heading=document.createElement('h3');
  if(iconName)heading.append(icon(iconName));
  heading.append(title);
  box.append(heading);
  return box;
}
const statValue=(key,value,signed=true)=>(signed?(value>0?'+':'−'):'')+Math.abs(value)+(key==='critical'?' %':'');
/** Línea de atributo de objeto con icono, valor y nombre. */
function statLine(key,value,tag='li'){
  const line=h(tag,'stat-line stat-'+key,icon(key),h('b',null,statValue(key,value)),' ');
  const label=h('span',null);
  resourceText(label,statNames[key]);
  line.append(label);
  return line;
}
const statList=(stats,className='stat-list')=>h('ul',className,...Object.entries(stats).map(([key,value])=>statLine(key,value)));
const rarityTone=item=>item?.kind==='rune'?'rune':'grade'+(item?.grade||0);
function itemRow(item,title,actions=[]){
  const row=h('div','item');
  const name=h('b',rarityTone(item),title+(item?.name||'Vacío'));
  const heading=h('div','item-heading');
  if(item)heading.append(equipmentIcon(item.kind==='rune'?'rune':item.slot));
  heading.append(h('div','item-title',name,item?h('small',null,item.kind==='rune'?'Runa':(slots[item.slot]||'')+(item.rarity?' · '+item.rarity:'')):null));
  row.append(heading);
  if(item){
    row.append(statList(item.stats));
    if(item.socket)row.append(h('div','item-socket',equipmentIcon('rune'),h('span',null,item.socket.name),statList(item.socket.stats,'stat-list compact')));
  }
  if(actions.length)row.append(h('div','item-actions',...actions));
  return row;
}
function itemTip(item,anchor){
  const nodes=[tipHead(h('span','tip-item-art '+rarityTone(item),equipmentIcon(item.kind==='rune'?'rune':item.slot)),item.name,
    item.kind==='rune'?'Runa engarzable':(slots[item.slot]||'')+(item.rarity?' · '+item.rarity:''),null),statList(item.stats,'stat-list tip-stats')];
  if(item.socket)nodes.push(h('div','item-socket',equipmentIcon('rune'),h('span',null,'Engarzada: '+item.socket.name),statList(item.socket.stats,'stat-list compact')));
  showTip(nodes,anchor,'tip-item '+rarityTone(item));
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
    const stat=h('span',change>0?'gain':'loss',icon(key),statValue(key,change)+' ');
    const name=h('span',null);
    resourceText(name,label);
    stat.append(name);
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
  const stats=statList(item.stats);
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
    drag={payload,x:event.clientX,y:event.clientY,id:event.pointerId,label:face.dataset.name||face.title};
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
  if(!item)face.title=label?label+' · vacío':'Ranura vacía';
  else{
    face.setAttribute('aria-label',(label?label+' · ':'')+item.name);
    tile.addEventListener('toggle',hideUnit);
  }
  face.dataset.name=item?.name||'';
  if(item){
    const inspect=()=>{if(!tile.open&&!drag)itemTip(item,face.getBoundingClientRect());};
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
  const gear=panel('Nivel '+player.level,'level');
  const xp=document.createElement('progress');
  xp.max=100;
  xp.value=player.xp||0;
  xp.setAttribute('aria-label','Experiencia');
  const xpLabel=h('small','xp-label',icon('xp'),(player.xp||0)+' / 100 XP');
  gear.append(h('div','xp-row',xp,xpLabel));
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
  const bag=panel('Mochila','bag');
  const bagGrid=document.createElement('div');
  bagGrid.className='bag-grid';
  for(const item of player.bag){
    const actions=[];
    if(trading){
      if(item.kind==='gear')actions.push(actionButton('Equipar','equip',{item:item.id}));
      else for(const [slot,label] of Object.entries(slots)){
        if(player.equipment[slot])actions.push(actionButton('Engarzar en '+label.toLowerCase(),'socket',{item:item.id,slot}));
      }
      actions.push(actionButton('Vender · '+(Math.floor(item.price/2)+(item.socket?Math.floor(item.socket.price/2):0))+' tusi','sell',{item:item.id}));
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
  gold.replaceChildren(icon('gold'),h('b',null,String(player.gold)),' tusi');
  bag.append(gold);
  holder.replaceChildren(gear,bag);
  if(rewards.hidden){rewards.replaceChildren();return;}
  const shop=panel('Mercader','shop');
  if(!state.stock.length)shop.append('Todo vendido');
  for(const item of state.stock){
    const buy=actionButton('Comprar · '+item.price+' tusi','buy',{item:item.id});
    buy.disabled=player.gold<item.price;
    shop.append(itemRow(item,'',[buy]));
  }
  const loot=panel('Botín · Elige una recompensa','xp');
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
  const unit=state.units.find(u=>u.id===player.id)||{classId:player.classId,stats:{},level:player.level};
  el('training-compare').hidden=true;
  el('training-choices').replaceChildren(...trainingChoices(player).map(({index,rank,name})=>{
    const base=classes[player.classId].skills[index];
    const choice=actionButton('','train',{skill:index});
    choice.className='training-choice';
    choice.append(spellIcon(base[5],base[6]),h('span','training-name',name),
      h('span','training-rank'+(rank?'':' new'),rank?rank+'/3 → '+(rank+1)+'/3':'Nueva'));
    choice.onpointerenter=choice.onfocus=()=>showTrainingCompare(player,unit,index,rank);
    return choice;
  }));
  hideUnit();
  trainingDialog.showModal();
}
/** Panel lateral: la habilidad antes y después de la mejora. */
function showTrainingCompare(player,unit,index,rank){
  const ranks=[...player.skillRanks];
  const before=rank?skillFor({classId:player.classId,skillRanks:ranks},index):null;
  ranks[index]=rank+1;
  const after=skillFor({classId:player.classId,skillRanks:ranks},index);
  const a=after&&skillFacts(unit,after),b=before&&skillFacts(unit,before);
  const [name,,,,,kind,symbol]=after;
  const line=(iconName,label,from,to)=>{
    const changed=from!==to;
    return h('div','compare-row'+(changed?' changed':''),icon(iconName),h('span','tip-label',label),
      changed?h('span','compare-from',from??'—'):h('span'),changed?h('span','compare-arrow','→'):h('span'),h('span','compare-to',to));
  };
  const amount=f=>f?f.low+'–'+f.high:null;
  const reach=f=>f?(f.minRange?f.minRange+'–':'')+f.maxRange:null;
  const rows=[line('ap','Coste',b?b.cost+' PA':null,a.cost+' PA')];
  if(kind==='dash')rows.push(line('dash','Distancia',b?reach(b)+' cas.':null,reach(a)+' cas.'));
  else{
    if(!a.healing)rows.push(line(a.element,'Elemento',b?elements[b.element]:null,elements[a.element]));
    rows.push(line(a.healing?'heal':'attack',a.healing?'Curación':'Daño',amount(b),amount(a)));
    rows.push(line('range','Alcance',b?reach(b):null,reach(a)));
  }
  const gain=kind==='dash'?'+1 casilla de alcance':!rank?'Nueva habilidad':a.healing?'+2 de curación mínima y máxima':'+2 de daño mínimo y máximo';
  el('training-compare').replaceChildren(
    tipHead(spellIcon(kind,symbol),name,rank?'Nivel '+rank+' → '+(rank+1):'Aprender · nivel 1',null),
    h('div','compare-grid',...rows),
    h('p','compare-gain',icon('xp'),gain),
    ...(skillEffects[kind]?[h('p','tip-note',skillEffects[kind])]:[]));
  el('training-compare').hidden=false;
}
const gameoverDialog=el('gameover');
gameoverDialog.addEventListener('cancel',event=>event.preventDefault());
el('gameover-home').onclick=()=>{
  gameoverDialog.close();
  el('leave').onclick();
};
gameoverDialog.querySelector('.gameover-skull').append(icon('skull'));
/** Ventana de fin de partida cuando cae todo el grupo (tras terminar las animaciones). */
function updateGameOver(){
  const lost=state?.phase==='lost';
  if(!lost){if(gameoverDialog.open)gameoverDialog.close();return;}
  if(gameoverDialog.open||playing||pending.length||performance.now()<lastDamageUntil)return;
  const foes=state.units.filter(u=>u.enemy);
  const stat=(iconName,label,value)=>[h('dt',null,icon(iconName),label),h('dd',null,String(value))];
  el('gameover-stats').replaceChildren(
    ...stat('level','Piso alcanzado',state.floor+' de 6'),
    ...stat('clock','Rondas en este piso',state.rounds||1),
    ...stat('skull','Enemigos caídos en este piso',foes.filter(u=>u.hp<=0).length+' / '+foes.length));
  el('gameover-party').replaceChildren(...state.players.map(p=>h('li',null,portrait(p.classId),
    h('span',null,h('strong',null,p.name),h('small',null,classes[p.classId].name+' · nivel '+p.level)))));
  hideUnit();
  sfx('blast');
  gameoverDialog.showModal();
}
const nodeIcons={combat:'sword',elite:'elite',event:'question',boss:'crown'};
/** Retratos pequeños de quienes votaron una opción. */
function voters(option){
  const votes=state.vote?.votes||{};
  const list=state.players.filter(p=>votes[p.id]===option);
  return h('span','voters',...list.map(p=>{
    const v=h('span','voter'+(p.id===session.id?' me':''),portrait(p.classId));
    v.title=p.name;
    return v;
  }));
}
function voteStatus(){
  const votes=Object.keys(state.vote?.votes||{}).length;
  const status=h('div','vote-status',icon('users'),h('span',null,'Votos: '+votes+' / '+state.players.length),
    state.players.length>1?h('small',null,'Empate: decide el anfitrión · sin votos: primera opción'):null);
  const pending=modText(state.pending);
  if(pending)status.append(h('span','pending-mods',icon('info'),'Próximo combate: '+pending));
  return status;
}
/** Árbol de pisos: nodos por piso de izquierda a derecha, con conexiones y votos. */
function renderMap(box){
  const rows=state.route.rows;
  const options=state.vote?.options||[];
  const path=state.route.path;
  const myVote=state.vote?.votes?.[session.id];
  const width=1000,height=360,padX=70,padY=46;
  const at=node=>({x:padX+(node.floor-1)*(width-2*padX)/5,y:padY+node.x*(height-2*padY)});
  const svgNS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(svgNS,'svg');
  svg.setAttribute('viewBox','0 0 '+width+' '+height);
  svg.setAttribute('class','map-lines');
  svg.setAttribute('preserveAspectRatio','none');
  const current=path.at(-1);
  for(const row of rows)for(const node of row)for(const id of node.next){
    const other=rows.flat().find(n=>n.id===id);
    const a=at(node),b=at(other);
    const line=document.createElementNS(svgNS,'line');
    line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);
    const walked=path.includes(node.id)&&path.includes(id);
    const open=(node.id===current||(!current&&false))&&options.includes(id);
    line.setAttribute('class',walked?'walked':open?'open':'');
    svg.append(line);
  }
  const map=h('div','route-map',svg);
  for(let f=1;f<=6;f++){
    const label=h('span','floor-label'+(f===state.floor+1&&state.phase==='map'?' next':''),'Piso '+f);
    label.style.left=(at({floor:f,x:0}).x/width*100)+'%';
    map.append(label);
  }
  for(const node of rows.flat()){
    const option=options.indexOf(node.id);
    const visited=path.includes(node.id);
    const b=h('button','route-node kind-'+node.kind+(visited?' visited':'')+(node.id===current?' current':'')+(option>=0?' available':'')+(option>=0&&myVote===option?' voted':''),icon(nodeIcons[node.kind]));
    b.type='button';
    const p=at(node);
    b.style.left=(p.x/width*100)+'%';
    b.style.top=(p.y/height*100)+'%';
    b.disabled=option<0||state.phase!=='map';
    b.setAttribute('aria-label','Piso '+node.floor+' · '+nodeKinds[node.kind].name+(option>=0?' · votar':''));
    if(option>=0){b.onclick=()=>send({type:'vote',option});b.append(voters(option));}
    b.onpointerenter=b.onfocus=()=>{
      const r=b.getBoundingClientRect();
      showTip([tipHead(h('span','tip-node kind-'+node.kind,icon(nodeIcons[node.kind])),nodeKinds[node.kind].name,'Piso '+node.floor,null),
        h('p','tip-note',nodeKinds[node.kind].description),option>=0?h('p','tip-note strong','Haz clic para votar este camino.'):null].filter(Boolean),
        {left:r.left,top:r.top,bottom:r.bottom},'tip-skill');
    };
    b.onpointerleave=b.onblur=hideUnit;
    map.append(b);
  }
  const legend=h('div','map-legend',...Object.entries(nodeKinds).map(([kind,info])=>h('span','legend-item kind-'+kind,icon(nodeIcons[kind]),info.name)));
  box.replaceChildren(h('div','journey-head',h('h3',null,icon('crown'),'Elige el camino'),h('p',null,'Cada jugador vota la siguiente sala. Tenéis 15 segundos.')),map,legend,voteStatus());
}
function renderEvent(box){
  const myVote=state.vote?.votes?.[session.id];
  const options=state.event.options.map((option,i)=>{
    const b=h('button','event-option'+(myVote===i?' voted':''),h('span','event-label',option.label),h('span','event-detail',option.detail),voters(i));
    b.type='button';
    b.onclick=()=>send({type:'vote',option:i});
    return b;
  });
  box.replaceChildren(h('div','event-card',
    h('div','event-art',icon('question')),
    h('p','event-kicker','Evento · piso '+state.floor),
    h('h3',null,state.event.title),
    h('p','event-text',state.event.text),
    h('div','event-options',...options),
    voteStatus()));
}
function renderJourney(){
  const box=el('journey');
  const show=['map','event'].includes(state?.phase);
  box.hidden=!show;
  if(!show)return;
  if(state.phase==='map')renderMap(box);else renderEvent(box);
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
    const water=state.water?.includes(pos);
    const trap=state.traps?.find(t=>t.pos===pos);
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
    cell.className=['cell',voidCell&&'void',wall&&'wall',water&&'water',trap&&'trap trap-'+trap.kind,path&&'walk',blocked&&'no-sight',castRange&&'cast-range',aim&&'aim',glyph&&'glyph-'+glyph.kind,glyph?.warn&&'warn'].filter(Boolean).join(' ');
    if(voidCell){cell.disabled=true;cell.setAttribute('aria-hidden','true');}
    cell.setAttribute('aria-label',(unit?.name||(wall?'Muro':water?'Agua':trap?trapInfo[trap.kind].name:'Casilla'))+' '+(pos%state.width+1)+', '+(Math.floor(pos/state.width)+1));
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
      pawn.className=['pawn','look-'+(unit.look||unit.classId),unit.enemy&&'foe',turn===unit&&'active',hidePawn(unit.id)&&'in-motion'].filter(Boolean).join(' ');
      pawn.dataset.unit=unit.id;
      cell.title=unitLabel(unit);
      const hp=document.createElement('span');
      hp.className='hp';
      hp.style.setProperty('--hp',(unit.hp/unit.max*100)+'%');
      hp.append(document.createElement('i'));
      pawn.append(portrait(unit.look||unit.classId),hp,pawnName(unit.name));
      cell.append(pawn);
    }
    if(unit||glyph||water||trap){
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
  if(!state){if(trainingDialog.open)trainingDialog.close();if(gameoverDialog.open)gameoverDialog.close();return;}
  const turn=state.units[state.turn];
  const mine=state.phase==='combat'&&turn?.id===session.id;
  const host=state.players[0]?.id===session.id;
  const rewardReady=lootReady();
  const title={map:'Piso '+(state.floor+1)+' · Elige el camino',event:'Evento · '+(state.event?.title||''),lobby:'Sala de expedición',combat:'Piso '+state.floor+' · '+state.layoutName+' · '+turn?.name+(mine?' (tú)':''),reward:rewardReady?'Botín y mercader':'Victoria',won:'Expedición completada',lost:'El grupo ha caído'}[state.phase];
  el('phase').textContent=title;
  updateGameOver();
  const journey=['map','event'].includes(state.phase);
  el('turn-bar').hidden=state.phase!=='combat'&&!rewardReady&&!journey;
  el('turn-bar').classList.toggle('timer-only',state.phase!=='combat');
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
    const moveButton=btn('',()=>{selected=null;render();},selected===null);
    moveButton.className='ability move-ability';
    moveButton.append(h('span','spell-icon move',icon('move')),h('span','ability-name','Mover'),h('span','ability-cost stat-mp',state.mp+' PM'));
    controls.append(moveButton);
    classes[turn.classId].skills.forEach((_,i)=>{
      const current=skillFor(turn,i);
      if(!current)return;
      const [name,cost,range,min,max,kind,symbol,minRange=0]=current;
      const b=btn('',()=>selectSpell(i),selected===i);
      b.className='ability';
      const rank=turn.skillRanks[i];
      const key=h('kbd',null,String(i+1));
      key.setAttribute('aria-hidden','true');
      b.append(spellIcon(kind,symbol),h('span','ability-name',name),h('span','ability-cost stat-pa',cost+' PA'),key);
      if(rank>1)b.append(h('span','ability-rank',rank+'/3'));
      if(!['heal','cleanse','dash'].includes(kind)){
        const element=skillElement(turn,current);
        b.append(h('span','ability-element element-'+element,icon(element)));
      }
      b.setAttribute('aria-keyshortcuts',String(i+1));
      const maxRange=range+(modifiableRange(current)?turn.stats.reach:0);
      const healing=['heal','cleanse'].includes(kind);
      b.setAttribute('aria-description',cost+' PA · alcance '+minRange+'–'+maxRange);
      b.onpointerenter=b.onfocus=()=>{
        const rect=b.getBoundingClientRect();
        showTip(skillTipNodes(turn,i,current,rank),{left:rect.left,top:rect.top,bottom:rect.bottom},'tip-skill');
      };
      b.onpointerleave=b.onblur=hideUnit;
      b.disabled=cost>state.ap;
      controls.append(b);
    });
    const hint=h('small','hint-line');
    hint.id='path-status';
    hint.textContent=selected===null?'Azul: casillas a las que puedes moverte.':'Morado: alcance · Rojo: sin visión · Dorado: objetivo válido'+(skill[5]==='blast'?' · Naranja: área de impacto':'');
    controls.append(hint);
  }
  drawBoard(turn,walking,skill);
  renderJourney();
  if(journey){el('battlefield').hidden=true;iso?.show(false);}
  const mods=modText(state.phase==='combat'?state.mods:{});
  el('mods').hidden=!mods;
  el('mods').replaceChildren(icon('info'),mods);
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
  if(state&&!session.code&&['combat','reward','map','event'].includes(state.phase)&&Date.now()>=state.deadline){
    const next=structuredClone(state);
    if(tick(next))setState(next);
  }
  render();
},150);
setInterval(refresh,400);

