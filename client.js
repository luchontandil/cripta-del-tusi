import {critChance,classes,create,join,act,tick,paths,targetable,hasRange,inRange,castableCell,spellArea,slots,statNames,onBoard,
  glyphInfo,skillFor,damagePreview,trainingChoices,trainingOffer,modifiableRange,elements,skillElement,skillOptions,maxBonusText,nodeKinds,modText,trapInfo,
  playerColors,bosses,actNames,ACTS,FLOORS_PER_ACT,masteryTree,masteryCost,runPoints,cleanMastery,actOf,monsterTraits} from './engine.js?v=31';
import {portrait,spellIcon,equipmentIcon} from './art.js?v=31';
import {setupSfx} from './music.js?v=31';
import {icon} from './icons.js?v=31';

const el=id=>document.getElementById(id);
const tintOf=u=>u&&!u.enemy?playerColors.find(c=>c.id===u.color)||null:null;
/** Retrato pixelado de una unidad o jugador, con el color de su puesto si es un héroe. */
const unitArt=u=>{
  const canvas=portrait(u.look||u.classId,tintOf(u));
  const tint=tintOf(u);
  if(tint)canvas.style.setProperty('--player',tint.hex);
  return canvas;
};
let state,session,selected=null,busy=false,polling=false,generation=0,revision=0,rendered='';
let pending=[],playing=null,lastSeq=0,animationEpoch=0;
let holdLoot=false,lastDamageUntil=0,soloAwarded=false;
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
  const shown=!!(iso&&useIso&&state?.units.length&&!el('game').hidden&&!['map','event','shop'].includes(state?.phase));
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
import('./isometric.js?v=31').then(({createIso})=>{
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
// ───────────── Cuentas, maestrías, amigos e invitaciones ─────────────
let account={token:localStorage.getItem('cripta-account')||null,user:null,friends:[],persistent:true,mode:'login',busy:false};
const serverBase=()=>{try{return new URL(el('server').value).origin;}catch{return location.origin;}};
async function accountCall(operation,body){
  const response=await fetch(serverBase()+'/api/account/'+operation,{
    method:body?'POST':'GET',
    headers:{...(body?{'Content-Type':'application/json'}:{}),...(account.token?{'X-Account':account.token}:{})},
    body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(12000)
  });
  const data=await response.json().catch(()=>({error:'El servidor todavía no responde.'}));
  if(response.status===401){setAccountToken(null);renderAccount();}
  if(!response.ok||data.error)throw new Error(data.error||'Error de cuenta.');
  return data;
}
function setAccountToken(token){
  account.token=token;
  if(token)localStorage.setItem('cripta-account',token);else{localStorage.removeItem('cripta-account');account.user=null;account.friends=[];}
}
const available=()=>account.user?account.user.points-account.user.spent:0;
async function refreshAccount(){
  if(!account.token)return;
  try{
    const data=await accountCall('me');
    account.user=data.user;account.friends=data.friends;
    renderAccount();showInvites();
    if(masteriesDialog.open)renderMasteries();
    if(state?.phase==='lobby')renderJourney();
  }catch{}
}
accountCall('status').then(data=>{account.persistent=data.persistent;renderAccount();}).catch(()=>{});
setInterval(refreshAccount,10000);
function field(label,input){return h('label','field',label,input);}
function renderAccount(){
  const box=el('account');
  if(!box)return;
  if(!account.token||!account.user){
    const nick=document.createElement('input');nick.maxLength=16;nick.autocomplete='username';nick.placeholder='Tu nick';
    const pass=document.createElement('input');pass.type='password';pass.autocomplete=account.mode==='login'?'current-password':'new-password';pass.placeholder='Contraseña';
    const go=btn('',async()=>{
      if(account.busy)return;account.busy=true;
      try{
        const data=await accountCall(account.mode==='login'?'login':'register',{nick:nick.value,password:pass.value});
        setAccountToken(data.token);account.user=data.user;
        error('');await refreshAccount();renderAccount();classPreview();
      }catch(e){error(e.message);}finally{account.busy=false;}
    });
    go.className='primary';
    go.append(icon(account.mode==='login'?'play':'users'),account.mode==='login'?'Entrar':'Crear cuenta');
    const swap=btn(account.mode==='login'?'¿No tienes cuenta? Crear una':'¿Ya tienes cuenta? Entrar',()=>{account.mode=account.mode==='login'?'register':'login';renderAccount();});
    swap.className='ghost link-button';
    pass.onkeydown=e=>{if(e.key==='Enter')go.click();};
    box.replaceChildren(
      h('div','account-head',h('h2',null,icon('level'),'Tu cuenta'),h('p','hint','Guarda tus puntos y maestrías, agrega amigos e invítalos a tu sala.')),
      h('div','account-form',field('Nick',nick),field('Contraseña',pass),go,swap),
      account.persistent?null:h('p','hint warn','Servidor sin base de datos configurada: las cuentas se borrarán al reiniciarlo.'));
    return;
  }
  const u=account.user;
  const masteryButton=btn('',()=>openMasteries());masteryButton.className='primary';
  masteryButton.append(icon('xp'),'Maestrías');
  const out=btn('',async()=>{try{await accountCall('logout',{});}catch{}setAccountToken(null);renderAccount();classPreview();});
  out.className='ghost';out.append(icon('exit'),'Salir');
  const nickInput=document.createElement('input');nickInput.placeholder='Nick de tu amigo';nickInput.maxLength=16;
  const add=btn('',async()=>{
    try{const data=await accountCall('friend',{nick:nickInput.value});account.user=data.user;account.friends=data.friends;error('');renderAccount();}
    catch(e){error(e.message);}
  });
  add.append(icon('users'),'Agregar');
  nickInput.onkeydown=e=>{if(e.key==='Enter')add.click();};
  const friends=h('ul','friend-list',...account.friends.map(f=>h('li','friend'+(f.online?' online':''),h('span','dot'),h('b',null,f.nick),h('small',null,f.online?'Conectado':'Desconectado'))));
  if(!account.friends.length)friends.append(h('li','friend empty','Todavía no tienes amigos agregados.'));
  const invites=(u.invites||[]).map(inv=>{
    const accept=btn('',()=>acceptInvite(inv));accept.className='primary';accept.append(icon('play'),'Unirse');
    const no=btn('Descartar',async()=>{try{const d=await accountCall('dismiss',{from:inv.from});account.user=d.user;renderAccount();}catch{}});no.className='ghost';
    return h('div','invite',icon('users'),h('span',null,h('b',null,inv.from),' te invita a su sala ',h('code',null,inv.code)),accept,no);
  });
  box.replaceChildren(
    h('div','account-head',h('h2',null,icon('level'),u.nick),
      h('div','account-stats',h('span','chip',icon('xp'),available()+' puntos'),h('span','chip',icon('crown'),'Mejor piso: '+(u.best||0)),h('span','chip',icon('clock'),(u.runs||0)+' partidas')),
      h('div','account-actions',masteryButton,out)),
    ...invites,
    h('div','friends',h('h3',null,icon('users'),'Amigos'),h('div','add-friend',nickInput,add),friends));
}
async function acceptInvite(inv){
  el('code').value=inv.code;
  try{const d=await accountCall('dismiss',{from:inv.from});account.user=d.user;}catch{}
  hideInviteToast();
  renderAccount();
  el('join').click();
}
let toastShown='';
function showInvites(){
  const inv=(account.user?.invites||[])[0];
  if(!inv||state||toastShown===inv.from+inv.code)return;
  toastShown=inv.from+inv.code;
  const toast=el('invite-toast');
  const go=btn('',()=>acceptInvite(inv));go.className='primary';go.append(icon('play'),'Unirse');
  const close=btn('',hideInviteToast);close.className='ghost';close.append('Ahora no');
  toast.replaceChildren(icon('users'),h('span',null,h('b',null,inv.from),' te invita a jugar'),go,close);
  toast.hidden=false;
  sfx('heal');
}
function hideInviteToast(){el('invite-toast').hidden=true;}
const masteriesDialog=el('masteries');
el('masteries-close').onclick=()=>masteriesDialog.close();
el('mastery-reset').onclick=async()=>{try{const d=await accountCall('mastery-reset',{});account.user=d.user;renderMasteries();renderAccount();}catch(e){error(e.message);}};
function openMasteries(){renderMasteries();masteriesDialog.showModal();}
function renderMasteries(){
  const u=account.user;if(!u)return;
  el('mastery-points').replaceChildren(icon('xp'),available()+' puntos disponibles');
  el('mastery-grid').replaceChildren(...Object.entries(masteryTree).map(([key,node])=>{
    const rank=u.mastery[key]||0;
    const maxed=rank>=node.max;
    const cost=maxed?0:masteryCost(key,rank);
    const locked=node.requires&&!(u.mastery[node.requires]>0);
    const buy=btn('',async()=>{try{const d=await accountCall('mastery',{key});account.user=d.user;renderMasteries();renderAccount();}catch(e){error(e.message);}});
    buy.className=maxed?'ghost':'primary';
    buy.disabled=maxed||locked||available()<cost;
    buy.append(maxed?'Máximo':locked?'Requiere '+masteryTree[node.requires].name:'Mejorar · '+cost+' pts');
    const pips=h('span','pips',...Array.from({length:node.max},(_,i)=>h('i',i<rank?'on':null)));
    return h('article','mastery'+(rank?' owned':'')+(maxed?' maxed':''),
      h('div','mastery-icon',icon(node.icon)),
      h('div','mastery-body',h('strong',null,node.name),pips,
        h('p',null,rank?'Ahora: '+node.description(rank):'Sin aprender'),
        maxed?null:h('p','next','Siguiente: '+node.description(rank+1))),
      buy);
  }));
}
renderAccount();
refreshAccount();
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
/** Qué hace especial a cada monstruo, en una frase. */
function traitNote(trait={}){
  const parts=[];
  if(trait.element&&trait.element!=='physical')parts.push('Ataca con '+elements[trait.element].toLowerCase());
  if(trait.lifesteal)parts.push('roba vida');
  if(trait.charm)parts.push('encanta (−1 PM)');
  if(trait.slime)parts.push('su baba resta 1 PM');
  if(trait.poison)parts.push('envenena');
  if(trait.movement<0)parts.push('casi no se mueve');
  if(trait.movement>0)parts.push('muy rápido');
  if(!parts.length)return '';
  const text=parts.join(', ');
  return text[0].toUpperCase()+text.slice(1)+'.';
}
function terrainNodes(pos){
  const trap=state.traps?.find(t=>t.pos===pos);
  if(trap)return [h('div','tip-glyph terrain-'+trap.kind,icon(trap.kind),h('div',null,h('strong',null,trapInfo[trap.kind].name),h('p',null,trapInfo[trap.kind].description(state.floor)),h('small',null,'Afecta a héroes y monstruos')))];
  if(state.water?.includes(pos)){
    const liquid={jungle:'Ciénaga',hell:'Río de lava'}[state.biome]||'Agua';
    return [h('div','tip-glyph terrain-water',icon('water'),h('div',null,h('strong',null,liquid),h('p',null,'No se puede cruzar, pero no bloquea la línea de visión.')))];
  }
  return [];
}
function inspectCell(unit,cell,pos,glyph,source,skill,aim){
  const anchor=iso?.active?iso.anchor(pos):cell.getBoundingClientRect();
  if(!unit){
    const nodes=[...(glyph?glyphNodes(glyph):[]),...terrainNodes(pos)];
    if(nodes.length)showTip(nodes,anchor,'tip-compact');
    return;
  }
  const nodes=[tipHead(unitArt(unit),unit.name,unit.enemy?(unit.boss?'Jefe':unit.elite?'Élite':'Enemigo'):classes[unit.classId].name+(unit.level?' · nivel '+unit.level:''),null),hpBar(unit)];
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
  const note=unit.boss?bosses[unit.look]?.powers:traitNote(monsterTraits[unit.look]);
  if(unit.enemy&&note)nodes.push(h('p','tip-note',note));
  const chips=effectChips(unit);
  if(chips)nodes.push(chips);
  if(glyph)nodes.push(...glyphNodes(glyph));
  nodes.push(...terrainNodes(pos));
  showTip(nodes,anchor,unit.enemy?'tip-foe':'tip-ally');
}
window.addEventListener('scroll',hideUnit,{passive:true});
const areaNames={cross:'cruz',circle:'círculo',cone:'cono',line:'línea'};
/** Texto del efecto de una habilidad, con sus valores reales (rango y bonificaciones incluidos). */
function skillEffectText(skill){
  const kind=skill[5],o=skillOptions(skill);
  const area=o.area?' · Área en '+areaNames[o.area]+(o.size>1?' ('+o.size+')':''):'';
  const text={
    expose:'Vulnerable 2 turnos: los ataques contra el objetivo hacen +'+(o.value||3),
    slow:'Ralentiza: −'+(o.value||2)+' PM en el próximo turno del objetivo',
    venom:'Veneno: '+(o.value||3)+' PV por turno durante 2 turnos',
    blast:'Daño en área',
    push:'Empuja '+(o.push||1)+(o.push>1?' casillas':' casilla')+' en línea (si choca, recibe daño extra)',
    pull:o.pull==='melee'?'Atrae al objetivo (aliado o enemigo) hasta el cuerpo a cuerpo; a los aliados no les hace daño':'Atrae '+(o.pull||1)+(o.pull>1?' casillas':' casilla')+' hacia ti',
    cleanse:'Elimina todos los efectos negativos del aliado',
    heal:'Cura a un aliado o a ti mismo',
    shield:'+'+(o.value||3)+' de armadura durante 2 turnos',
    haste:'+'+(o.value||2)+' PM en el próximo turno del aliado',
    swap:'Intercambia tu posición con la del objetivo',
    dash:o.teleport?'Teletransporte (sin línea de visión)':'Desplazamiento por una ruta libre sin gastar PM'
  }[kind]||'';
  return (text+area).replace(/^ · /,'');
}
/** Datos calculados de una habilidad para un personaje (con su equipo, si lo tiene). */
function skillFacts(unit,skill){
  const [,cost,range,min,max,kind,,minRange=0]=skill;
  const reach=modifiableRange(skill)?(unit.stats?.reach||0):0;
  const healing=['heal','cleanse'].includes(kind);
  const utility=['dash','shield','haste','swap'].includes(kind)||max<=0;
  const element=skillElement(unit,skill);
  const bonus=healing?Math.floor((unit.level||1)/2):utility?0:(unit.stats?.[element]||0);
  const crit=Math.min(100,Math.round(critChance(unit)*100)+(skillOptions(skill).crit||0));
  return {cost,minRange,maxRange:range+reach,reach,healing,utility,element,bonus,low:min+bonus,high:max+bonus,kind,crit,modifiable:modifiableRange(skill)};
}
/** Filas de la ficha de una habilidad. */
function skillRows(unit,skill){
  const f=skillFacts(unit,skill),o=skillOptions(skill);
  const rows=[statRow('ap','Coste',f.cost+' PA')];
  if(f.healing)rows.push(statRow('heal','Curación',f.low+'–'+f.high+(f.bonus?' (+'+f.bonus+' nivel)':'')));
  else if(!f.utility){
    rows.push(statRow(f.element,'Elemento',elements[f.element],'element-'+f.element));
    rows.push(statRow(f.element,'Daño',f.low+'–'+f.high+(f.bonus?' (+'+f.bonus+' equipo)':'')));
    rows.push(statRow('critical','Crítico',f.crit+' % · ×1,5'));
  }
  if(o.area)rows.push(statRow('blast','Área',areaNames[o.area]+(o.size>1?' · tamaño '+o.size:'')));
  if(o.push||o.pull)rows.push(statRow('mp',o.push?'Empuje':'Atrae',o.pull==='melee'?'Hasta el contacto':(o.push||o.pull)+((o.push||o.pull)>1?' casillas':' casilla')));
  if(o.inLine)rows.push(statRow('move','Lanzar','En línea recta'));
  if(o.anyTarget)rows.push(statRow('users','Objetivo','Aliado o enemigo'));
  rows.push(statRow('range','Alcance',(f.minRange?f.minRange+'–':'')+f.maxRange+(f.maxRange===1?' casilla':' casillas')+(f.reach?' (+'+f.reach+')':'')));
  rows.push(statRow('reach','Alcance modificable',f.modifiable?'Sí':'No',f.modifiable?'yes':'no'));
  rows.push(statRow('info','Línea de visión',o.los===false?'No necesaria':'Necesaria'));
  return rows;
}
function skillTipNodes(unit,index,skill,rank,hotkey=null){
  const [name,,,,,kind,symbol]=skill;
  const effect=skillEffectText(skill);
  const base=classes[unit.classId]?.skills[index??classes[unit.classId].skills.findIndex(s=>s[0]===name)];
  const bonus=maxBonusText(base||skill);
  return [tipHead(spellIcon(kind,symbol),name,rank?'Nivel '+rank+' de 3':'Sin aprender',hotkey?String(hotkey):null),
    h('div','tip-stats',...skillRows(unit,skill)),
    effect?h('p','tip-note',effect):null,
    bonus?h('p','tip-note max-bonus'+(rank>=3?' active':''),icon('xp'),(rank>=3?'Rango máximo: ':'Al rango 3: ')+bonus):null].filter(Boolean);
}
function initiative(turn){
  const units=state.units.length?state.units:state.players;
  return units.map(u=>{
    const li=h('li',u.enemy?'foe':'ally',h('span','turn-art',unitArt(u)));
    if(tintOf(u))li.style.setProperty('--player',tintOf(u).hex);
    const info=h('span','turn-info',h('span','turn-name',u.name));
    if(u.max){
      const bar=h('span','turn-hp',h('i'));
      bar.style.setProperty('--hp',Math.max(0,u.hp/u.max*100)+'%');
      info.append(bar);
      li.append(info,h('span','turn-pv',String(u.hp)));
      li.onpointerenter=()=>{
        const rect=li.getBoundingClientRect();
        const nodes=[tipHead(unitArt(u),u.name,u.enemy?'Enemigo':classes[u.classId]?.name||'',null),hpBar(u)];
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
/** Modificadores al estilo ARPG: afijos primero, luego sufijos, con su tier. */
function affixList(item,className='stat-list'){
  if(!item.affixes)return statList(item.stats,className);
  const sorted=[...item.affixes].sort((a,b)=>a.type===b.type?0:a.type==='prefix'?-1:1);
  return h('ul',className+' affix-list',...sorted.map(mod=>{
    const line=statLine(mod.stat,mod.value);
    line.classList.add('affix',mod.type);
    const tier=h('span','tier tier-'+mod.tier+(mod.tier===mod.tiers?' top':''),'T'+mod.tier);
    tier.title=(mod.type==='prefix'?'Afijo':'Sufijo')+' «'+mod.label+'» · tier '+mod.tier+' de '+mod.tiers;
    line.append(tier);
    return line;
  }));
}
const itemSubtitle=item=>item.kind==='rune'?'Runa · nivel '+(item.ilvl||1):
  [item.grade>=2?item.base:slots[item.slot],item.rarity,'nivel '+(item.ilvl||1)].filter(Boolean).join(' · ');
const rarityTone=item=>item?.kind==='rune'?'rune':'grade'+(item?.grade||0);
function itemRow(item,title,actions=[]){
  const row=h('div','item');
  const name=h('b',rarityTone(item),title+(item?.name||'Vacío'));
  const heading=h('div','item-heading');
  if(item)heading.append(equipmentIcon(item.kind==='rune'?'rune':item.slot));
  heading.append(h('div','item-title',name,item?h('small',null,itemSubtitle(item)):null));
  row.append(heading);
  if(item){
    row.append(affixList(item));
    if(item.socket)row.append(h('div','item-socket',equipmentIcon('rune'),h('span',null,item.socket.name),statList(item.socket.stats,'stat-list compact')));
  }
  if(actions.length)row.append(h('div','item-actions',...actions));
  return row;
}
function itemTip(item,anchor){
  const nodes=[tipHead(h('span','tip-item-art '+rarityTone(item),equipmentIcon(item.kind==='rune'?'rune':item.slot)),item.name,
    itemSubtitle(item),null),affixList(item,'stat-list tip-stats')];
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
  card.className='loot-card '+(item.kind==='rune'?'rune':'grade'+item.grade);
  const visual=document.createElement('div');
  visual.className='loot-icon';
  visual.append(equipmentIcon(item.kind==='rune'?'rune':item.slot));
  const title=document.createElement('h4');
  title.textContent=item.name;
  const type=document.createElement('small');
  type.textContent=itemSubtitle(item);
  const stats=affixList(item);
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
  const shopping=state.phase==='shop';
  // Fuera de combate se puede gestionar el equipo; vender solo en la tienda.
  const trading=lootReady()||['shop','map','event'].includes(state.phase);
  const others=state.players.filter(p=>p.id!==player.id);
  holder.hidden=state.phase==='lobby'||!bagShown;
  el('field-shop').hidden=true;
  const choosing=lootReady()&&!state.picks.includes(player.id);
  rewards.hidden=!choosing;
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
      if(shopping)actions.push(actionButton('Vender · '+(Math.floor(item.price/2)+(item.socket?Math.floor(item.socket.price/2):0))+' tusi','sell',{item:item.id}));
      for(const other of others){
        const gift=actionButton('','give',{to:other.id,item:item.id});
        gift.className='give-button';
        gift.append(icon('users'),'Dar a '+other.name);
        actions.push(gift);
      }
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
  if(trading&&others.length&&player.gold>0)bag.append(giveTusi(player,others));
  holder.replaceChildren(gear,bag);
  if(rewards.hidden){rewards.replaceChildren();return;}
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
  rewards.replaceChildren(loot);
}
/** Formulario compacto para dar tusi a otro jugador. */
let giveDraft=null;
function giveTusi(player,others){
  const box=h('details','give-tusi');
  box.open=giveDraft!==null;
  box.addEventListener('toggle',()=>{giveDraft=box.open?(giveDraft??''):null;});
  const summary=h('summary',null,icon('users'),'Dar tusi');
  const amount=document.createElement('input');
  amount.type='number';amount.min='1';amount.max=String(player.gold);amount.placeholder='Cantidad';
  amount.value=giveDraft||'';
  amount.oninput=()=>{giveDraft=amount.value;};
  const buttons=others.map(other=>{
    const b=btn('',()=>{
      const value=Math.floor(Number(amount.value));
      if(!value||value<1)return error('Escribe una cantidad.');
      giveDraft=null;
      send({type:'give',to:other.id,gold:value});
    });
    b.append(unitArt(other),'A '+other.name);
    return b;
  });
  box.append(summary,h('div','give-row',amount,...buttons));
  return box;
}
/** Tienda: sala del mapa con el género del mercader, venta y "Listo". */
function renderShop(box){
  const player=state.players.find(p=>p.id===session.id);
  const cards=state.stock.map(item=>{
    const card=lootCard(item,player);
    card.querySelectorAll('button').forEach(b=>b.remove());
    const buy=actionButton('','buy',{item:item.id});
    buy.className='primary buy-button';
    buy.append(icon('gold'),'Comprar · '+item.price+' tusi');
    buy.disabled=player.gold<item.price;
    card.append(buy);
    return card;
  });
  const ready=state.ready||[];
  const me=ready.includes(player.id);
  const readyButton=btn('',()=>send({type:'ready'}));
  readyButton.className=me?'ready-button done':'primary ready-button';
  readyButton.append(icon(me?'check':'play'),me?'Listo · esperando al grupo':'Listo para seguir');
  const party=h('div','ready-party',...state.players.map(p=>{
    const chip=h('span','ready-chip'+(ready.includes(p.id)?' on':''),unitArt(p),p.name);
    return chip;
  }));
  box.replaceChildren(
    h('div','journey-head',h('h3',null,icon('shop'),'Tienda del mercader'),
      h('p',null,'Compra aquí; vende desde tu mochila. Podéis pasaros objetos y tusi.')),
    h('div','shop-wallet',icon('gold'),h('b',null,String(player.gold)),' tusi disponibles'),
    cards.length?h('div','loot-cards shop-cards',...cards):h('p','event-text','El mercader no tiene nada más que vender.'),
    h('div','shop-footer',party,readyButton));
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
  el('training-choices').replaceChildren(...trainingOffer(player).map(({index,rank,name})=>{
    const base=classes[player.classId].skills[index];
    const choice=actionButton('','train',{skill:index});
    choice.className='training-choice';
    choice.append(spellIcon(base[5],base[6]),h('span','training-name',name),
      h('span','training-rank'+(rank?'':' new'),rank?'Mejorar '+rank+'/3 → '+(rank+1)+'/3':'Aprender · nueva'));
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
  const baseSkill=classes[player.classId].skills[index];
  const maxBonus=rank+1>=3?maxBonusText(baseSkill):'';
  const gain=[!rank?'Nueva habilidad':kind==='dash'?'+1 casilla de alcance':a.utility?'':a.healing?'+2 de curación mínima y máxima':'+2 de daño mínimo y máximo',
    maxBonus?'Rango máximo: '+maxBonus:''].filter(Boolean).join(' · ')||'Mejora la habilidad';
  el('training-compare').replaceChildren(
    tipHead(spellIcon(kind,symbol),name,rank?'Nivel '+rank+' → '+(rank+1):'Aprender · nivel 1',null),
    h('div','compare-grid',...rows),
    h('p','compare-gain',icon('xp'),gain),
    ...(skillEffectText(after)?[h('p','tip-note',skillEffectText(after))]:[]));
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
  const lost=state?.phase==='lost'||state?.phase==='won';
  if(!lost){if(gameoverDialog.open)gameoverDialog.close();return;}
  if(gameoverDialog.open||playing||pending.length||performance.now()<lastDamageUntil)return;
  const foes=state.units.filter(u=>u.enemy);
  const stat=(iconName,label,value)=>[h('dt',null,icon(iconName),label),h('dd',null,String(value))];
  el('gameover-stats').replaceChildren(
    ...stat('level','Piso alcanzado',state.floor+' de '+ACTS*FLOORS_PER_ACT+' · acto '+actOf(state.floor||1)),
    ...stat('crown','Jefes derrotados',(state.bossKills||0)+' de 6'),
    ...stat('clock','Rondas en este piso',state.rounds||1),
    ...stat('skull','Enemigos caídos en este piso',foes.filter(u=>u.hp<=0).length+' / '+foes.length));
  el('gameover-party').replaceChildren(...state.players.map(p=>h('li',null,unitArt(p),
    h('span',null,h('strong',null,p.name),h('small',null,classes[p.classId].name+' · nivel '+p.level)))));
  const won=state.phase==='won';
  gameoverDialog.classList.toggle('victory',won);
  el('gameover-title').textContent=won?'¡Expedición completada!':'El grupo ha caído';
  gameoverDialog.querySelector('.gameover-sub').textContent=won?'Los seis jefes han caído. La cripta es vuestra.':'La cripta reclama a otro grupo de aventureros.';
  gameoverDialog.querySelector('.gameover-skull').replaceChildren(icon(won?'crown':'skull'));
  const points=state.result?.points??runPoints({floor:state.floor,bossKills:state.bossKills,won});
  const line=el('gameover-points');
  line.hidden=false;
  line.replaceChildren(icon('xp'),'+'+points+' puntos de maestría',account.user?'':' (crea una cuenta para guardarlos)');
  if(account.user&&!session.code&&!soloAwarded){
    soloAwarded=true;
    accountCall('award',{floor:state.floor,bossKills:state.bossKills||0,won}).then(d=>{account.user=d.user;renderAccount();}).catch(()=>{});
  }else if(account.user&&session.code)setTimeout(refreshAccount,1500);
  hideUnit();
  sfx(won?'win':'lose');
  gameoverDialog.showModal();
}
const nodeIcons={combat:'sword',elite:'elite',event:'question',boss:'crown',shop:'shop'};
/** Retratos pequeños de quienes votaron una opción. */
function voters(option){
  const votes=state.vote?.votes||{};
  const list=state.players.filter(p=>votes[p.id]===option);
  return h('span','voters',...list.map(p=>{
    const v=h('span','voter'+(p.id===session.id?' me':''),unitArt(p));
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
  const width=1000,height=380,padX=60,padY=46;
  const rowOf=new Map();
  rows.forEach((row,i)=>row.forEach(node=>rowOf.set(node.id,i)));
  const at=node=>({x:padX+rowOf.get(node.id)*(width-2*padX)/(rows.length-1),y:padY+node.x*(height-2*padY)});
  const svgNS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(svgNS,'svg');
  svg.setAttribute('viewBox','0 0 '+width+' '+height);
  svg.setAttribute('class','map-lines');
  svg.setAttribute('preserveAspectRatio','none');
  const current=path.at(-1);
  const byId=new Map(rows.flat().map(n=>[n.id,n]));
  // Salas que aún se pueden alcanzar desde donde está el grupo: el resto queda cerrado.
  const reachFrom=ids=>{const seen=new Set(ids);for(const id of seen)for(const next of byId.get(id)?.next||[])seen.add(next);return seen;};
  const starts=current&&byId.has(current)?[current]:options.length?options:rows[0].map(n=>n.id);
  const reachable=reachFrom(starts);
  const lines=[];
  for(const row of rows)for(const node of row)for(const id of node.next){
    const other=rows.flat().find(n=>n.id===id);
    const a=at(node),b=at(other);
    const line=document.createElementNS(svgNS,'line');
    line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);
    const walked=path.includes(node.id)&&path.includes(id);
    const open=(node.id===current||(!current&&false))&&options.includes(id);
    line.setAttribute('class',walked?'walked':open?'open':reachable.has(node.id)&&reachable.has(id)?'':'closed');
    lines.push({line,from:node.id,to:id});
    svg.append(line);
  }
  const map=h('div','route-map',svg);
  rows.forEach((row,i)=>{
    const f=row[0].floor;
    const label=h('span','floor-label'+(f===state.floor+1&&state.phase==='map'?' next':''),'Piso '+f);
    label.style.left=(at(row[0]).x/width*100)+'%';
    map.append(label);
  });
  for(const node of rows.flat()){
    const option=options.indexOf(node.id);
    const visited=path.includes(node.id);
    const closed=!visited&&!reachable.has(node.id);
    const b=h('button','route-node kind-'+node.kind+(visited?' visited':'')+(closed?' closed':'')+(node.id===current?' current':'')+(option>=0?' available':'')+(option>=0&&myVote===option?' voted':''),icon(nodeIcons[node.kind]));
    b.type='button';
    const p=at(node);
    b.style.left=(p.x/width*100)+'%';
    b.style.top=(p.y/height*100)+'%';
    b.disabled=option<0||state.phase!=='map';
    b.setAttribute('aria-label','Piso '+node.floor+' · '+nodeKinds[node.kind].name+(option>=0?' · votar':''));
    if(option>=0){b.onclick=()=>send({type:'vote',option});b.append(voters(option));}
    b.onpointerenter=b.onfocus=()=>{
      const r=b.getBoundingClientRect();
      const info=node.boss?bosses[node.boss]:null;
      showTip([tipHead(h('span','tip-node kind-'+node.kind,icon(nodeIcons[node.kind])),info?info.name:nodeKinds[node.kind].name,'Piso '+node.floor+(info?' · Jefe':''),null),
        h('p','tip-note',info?info.powers:nodeKinds[node.kind].description),option>=0?h('p','tip-note strong','Haz clic para votar este camino.'):null].filter(Boolean),
        {left:r.left,top:r.top,bottom:r.bottom},'tip-skill');
    };
    b.onpointerleave=b.onblur=()=>{hideUnit();map.classList.remove('previewing');map.querySelectorAll('.preview').forEach(e=>e.classList.remove('preview'));};
    if(option>=0){
      // Al pasar por una opción se ilumina todo lo que esa rama deja abierto.
      const enter=b.onpointerenter;
      b.onpointerenter=b.onfocus=()=>{
        enter();
        const branch=reachFrom([node.id]);
        map.classList.add('previewing');
        for(const other of map.querySelectorAll('.route-node'))other.classList.toggle('preview',branch.has(other.dataset.id));
        for(const {line,from,to} of lines)line.classList.toggle('preview',(branch.has(from)&&branch.has(to))||(from===current&&to===node.id));
      };
    }
    b.dataset.id=node.id;
    map.append(b);
  }
  const legend=h('div','map-legend',...Object.entries(nodeKinds).map(([kind,info])=>h('span','legend-item kind-'+kind,icon(nodeIcons[kind]),info.name)));
  const actNumber=state.route.act||1;
  box.replaceChildren(h('div','journey-head',h('h3',null,icon('crown'),'Acto '+actNumber+' de '+ACTS+' · '+actNames[actNumber-1]),h('p',null,'Cada jugador vota la siguiente sala. Cada camino cierra otros: pasa el ratón por una sala para ver lo que deja abierto. Tenéis 15 segundos.')),map,legend,voteStatus());
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
/** Sala de espera: grupo con sus colores e invitación a amigos. */
function renderLobby(box){
  const host=state.players[0]?.id===session.id;
  const party=h('ul','lobby-party',...[0,1,2,3].map(i=>{
    const p=state.players[i];
    const color=playerColors[i];
    const slot=h('li','lobby-slot'+(p?' taken':''),h('span','slot-color',h('i')));
    slot.style.setProperty('--player',color.hex);
    if(p)slot.append(h('span','slot-art',unitArt(p)),h('span','slot-info',h('b',null,p.name+(p.id===session.id?' (tú)':'')),h('small',null,'Jugador '+(i+1)+' · '+color.name+' · '+classes[p.classId].name)));
    else slot.append(h('span','slot-info',h('b',null,'Libre'),h('small',null,'Jugador '+(i+1)+' · '+color.name)));
    return slot;
  }));
  const invite=[];
  if(session.code&&account.user){
    const list=account.friends.filter(f=>!state.players.some(p=>p.account===f.nick||p.name===f.nick));
    invite.push(h('h3',null,icon('users'),'Invitar amigos'));
    if(!list.length)invite.push(h('p','hint','Agrega amigos por su nick desde la pantalla de inicio.'));
    invite.push(h('ul','friend-list',...list.map(f=>{
      const b=btn('',async()=>{try{await accountCall('invite',{nick:f.nick,code:session.code});b.disabled=true;b.replaceChildren(icon('check'),'Invitado');}catch(e){error(e.message);}});
      b.append(icon('play'),'Invitar');
      return h('li','friend'+(f.online?' online':''),h('span','dot'),h('b',null,f.nick),h('small',null,f.online?'Conectado':'Desconectado'),b);
    })));
  }else if(session.code)invite.push(h('p','hint','Entra con tu cuenta para invitar a tus amigos directamente.'));
  box.replaceChildren(
    h('div','journey-head',h('h3',null,icon('users'),'Sala '+(session.code||'')),h('p',null,host?'Cuando estéis todos, pulsa «Iniciar expedición».':'Esperando a que el anfitrión inicie la expedición.')),
    party,...invite);
}
function renderJourney(){
  const box=el('journey');
  const show=['map','event','shop','lobby'].includes(state?.phase);
  box.hidden=!show;
  if(!show)return;
  if(state.phase==='lobby'){renderLobby(box);return;}
  if(state.phase==='map')renderMap(box);else if(state.phase==='shop')renderShop(box);else renderEvent(box);
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
/** Voz de cada criatura (banco de sonidos). */
const voices={skeleton:'v_skeleton',skeletonking:'v_boss',slime:'v_slime',slimeking:'v_slime',lavaslime:'v_slime',skull:'v_ghost',oracle:'v_ghost',
  umbralking:'v_ghost',worm:'v_worm',slug:'v_worm',bat:'v_bat',plant:'v_plant',sporemother:'v_plant',cerberus:'v_beast',imp:'v_imp',
  vampire:'v_shade',succubus:'v_shade',vampqueen:'v_shade',firedemon:'v_boss'};
const flying=new Set(['bat','skull','imp','oracle','umbralking','succubus','vampqueen','slime','slimeking','lavaslime','slug','worm','plant','sporemother']);
/** Sonidos de un evento del combate: acción, voz, golpe, muerte, trampas y glifos. */
function eventSound(event){
  const unitOf=id=>state?.units.find(u=>u.id===id);
  if(event.kind==='spell'){
    const actor=unitOf(event.actor);
    sfx(event.effect==='slash'?'swing':event.effect);
    if(actor?.enemy&&voices[actor.look])sfx(voices[actor.look],{volume:actor.boss?.9:.55});
    if(actor?.boss&&event.effect!=='slash')sfx('v_boss',{volume:.8,delay:.1});
    return;
  }
  if(['damage','glyph','trap','poison'].includes(event.kind)&&event.amount>0){
    const target=unitOf(event.unit);
    if(event.kind==='glyph')sfx('glyph',{volume:.8});
    else if(event.kind==='trap')sfx('trap',{volume:.8});
    else if(event.kind==='poison')sfx('venom',{volume:.5});
    sfx('hit',{volume:event.critical?1:.75,rate:event.critical?.85:1});
    if(event.kind==='damage'&&Math.random()<.5)sfx('slash',{volume:.4});
    if(target&&(target.classId==='guardia'||target.look==='skeleton'||target.look==='skeletonking'))sfx('armor',{volume:.5});
    if(target?.hp<=0)sfx(target.enemy?'die_monster':'die_hero',{delay:.12});
    else if(target&&!target.enemy&&Math.random()<.5)sfx('hurt_hero',{volume:.6,delay:.05});
    else if(target?.enemy&&voices[target.look]&&Math.random()<.4)sfx(voices[target.look],{volume:.45,delay:.06});
  }
}
/** Pasos al moverse (chapoteo en la jungla); las criaturas que flotan o reptan no pisan. */
function stepSounds(event){
  const unit=state?.units.find(u=>u.id===event.unit);
  if(!unit||flying.has(unit.look))return;
  const wet=state.biome==='jungle';
  const gap=unit.enemy?.135:.225;
  event.path.forEach((_,i)=>sfx(wet?'step_wet':'step',{volume:wet?.25:.35,delay:i*gap+.05,rate:unit.look==='cerberus'?.8:1}));
}
function impact(event){
  eventSound(event);
  if(event.kind==='spell'){
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
    stepSounds(event);
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
    pawn.append(unitArt(state.units.find(u=>u.id===event.unit)||{look:event.look}));
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
  const shades={jungle:['#3d5a2c','#4a6a32','#36502a','#56763a'],crypt:['#353a4c','#2f3444','#3a3e52','#2b3040'],roots:['#55513a','#4d573b','#60573d','#3f4938'],bones:['#5a5246','#4e473c','#625a4c','#474036'],
    hell:['#4a2a22','#3e2420','#542e24','#36201c']}[state.biome]||['#49524c','#3d4845','#515650','#3b4540'];
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
        el('path-status').textContent='Haz clic en una casilla azul para moverte.';
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
      pawn.append(unitArt(unit),hp,pawnName(unit.name));
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
  sfx.ambient?.(state?.phase==='combat'?{crypt:'amb_crypt',jungle:'amb_jungle',hell:'amb_hell'}[state.biome]||'amb_crypt':'');
  el('entry').hidden=!!state;
  el('game').hidden=!state;
  document.body.classList.toggle('in-expedition',!!state);
  if(!state){if(trainingDialog.open)trainingDialog.close();if(gameoverDialog.open)gameoverDialog.close();return;}
  const turn=state.units[state.turn];
  const mine=state.phase==='combat'&&turn?.id===session.id;
  const host=state.players[0]?.id===session.id;
  const rewardReady=lootReady();
  const actLabel='Acto '+(state.act||actOf(state.floor||1))+' · ';
  const title={shop:'Piso '+state.floor+' · Tienda',map:'Piso '+(state.floor+1)+' · Elige el camino',event:'Evento · '+(state.event?.title||''),lobby:'Sala de expedición',combat:actLabel+'Piso '+state.floor+' · '+turn?.name+(mine?' (tú)':''),reward:rewardReady?'Botín y mercader':'Victoria',won:'Expedición completada',lost:'El grupo ha caído'}[state.phase];
  el('phase').textContent=title;
  updateGameOver();
  const journey=['map','event','shop'].includes(state.phase);
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
    let slot=0;
    classes[turn.classId].skills.forEach((_,i)=>{
      const current=skillFor(turn,i);
      if(!current)return;
      const hotkey=++slot;
      const [name,cost,range,min,max,kind,symbol,minRange=0]=current;
      const b=btn('',()=>selectSpell(i),selected===i);
      b.className='ability';
      const rank=turn.skillRanks[i];
      const key=h('kbd',null,String(hotkey));
      key.setAttribute('aria-hidden','true');
      b.append(spellIcon(kind,symbol),h('span','ability-name',name),h('span','ability-cost stat-pa',cost+' PA'),key);
      if(rank>1)b.append(h('span','ability-rank',rank+'/3'));
      if(!['heal','cleanse','dash'].includes(kind)){
        const element=skillElement(turn,current);
        b.append(h('span','ability-element element-'+element,icon(element)));
      }
      b.setAttribute('aria-keyshortcuts',String(hotkey));
      const maxRange=range+(modifiableRange(current)?turn.stats.reach:0);
      const healing=['heal','cleanse'].includes(kind);
      b.setAttribute('aria-description',cost+' PA · alcance '+minRange+'–'+maxRange);
      b.onpointerenter=b.onfocus=()=>{
        const rect=b.getBoundingClientRect();
        showTip(skillTipNodes(turn,i,current,rank,hotkey),{left:rect.left,top:rect.top,bottom:rect.bottom},'tip-skill');
      };
      b.onpointerleave=b.onblur=hideUnit;
      b.disabled=cost>state.ap;
      controls.append(b);
    });
    const hint=h('small','hint-line');
    hint.id='path-status';
    hint.textContent=selected===null?'Haz clic en una casilla azul para moverte. Teclas 1–'+classes[turn.classId].skills.filter((_,i)=>skillFor(turn,i)).length+': habilidades.':'Morado: alcance · Rojo: sin visión · Dorado: objetivo válido'+(skill[5]==='blast'?' · Naranja: área de impacto':'')+' · Esc o clic derecho: cancelar';
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
// Clic derecho sobre el tablero: soltar la habilidad seleccionada y volver a moverse.
el('battlefield').addEventListener('contextmenu',event=>{
  if(selected===null)return;
  event.preventDefault();
  selected=null;render();
});
document.addEventListener('keydown',event=>{
  if(state?.phase!=='combat'||event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.key==='Escape'&&selected!==null){
    event.preventDefault();
    selected=null;render();return;
  }
  if(event.key==='F1'){
    event.preventDefault();
    if(!event.repeat)endTurn();
  }else if(/^[1-9]$/.test(event.key)&&!event.repeat&&
    !event.target.closest?.('input, textarea, select, [contenteditable]')){
    // Las teclas siguen el orden de la barra: 1 = primera habilidad aprendida, 2 = la segunda...
    const unit=state.units[state.turn];
    const learned=classes[unit.classId].skills.map((_,i)=>i).filter(i=>skillFor(unit,i));
    const index=learned[Number(event.key)-1];
    if(index!==undefined)selectSpell(index);
  }
},true);
el('copy-code').onclick=async()=>{
  try{await navigator.clipboard.writeText(session.code);el('copy-code').textContent='Copiado';setTimeout(()=>{el('copy-code').textContent='Copiar código';},1200);}
  catch{error('Código de sala: '+session.code);}
};
async function request(base,path,body,key){
  const response=await fetch(base+path,{
    method:body?'POST':'GET',
    headers:{...(body?{'Content-Type':'application/json'}:{}),...(key?{Authorization:'Bearer '+key}:{}),...(account.token?{'X-Account':account.token}:{})},
    body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(12000)
  });
  const result=await response.json().catch(()=>({error:'El servidor todavía no responde.'}));
  if(!response.ok||result.error)throw Object.assign(new Error(result.error),{status:response.status});
  if(!result.state?.players?.every(player=>Array.isArray(player.skillRanks))){
    throw new Error('La versión del servidor no coincide con la del juego.');
  }
  return result;
}
/** Sonido de cada acción del jugador fuera del combate (equipo, tienda, botín, mejora). */
const actionSounds={equip:'equip',unequip:'equip',socket:'equip',unsocket:'equip',buy:'coins',sell:'coins',give:'coins',reward:'loot',train:'levelup',vote:'page',ready:'door',next:'door'};
async function send(action){
  if(busy)return;
  if(actionSounds[action.type])sfx(actionSounds[action.type],{volume:action.type==='train'?.7:.8});
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
  join(next,session.id,account.user?.nick||p.name,p.classId,account.user?{mastery:account.user.mastery}:{});
  soloAwarded=false;
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
  if(state&&!session.code&&['combat','reward','map','event','shop'].includes(state.phase)&&Date.now()>=state.deadline){
    const next=structuredClone(state);
    if(tick(next))setState(next);
  }
  render();
},150);
setInterval(refresh,400);

