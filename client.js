import {distance,setCustomMaps,testCustomMap,labCombat,cooldownLeft,critChance,classes,create,join,act,tick,paths,targetable,hasRange,inRange,castableCell,spellArea,slots,equipSlots,slotKind,polishable,statNames,onBoard,
  BASE_AP,BASE_MP,heroStats,gems,gemQualities,areaFalloff,shopRerollCost,glyphInfo,glyphText,forgeModes,forgeCost,forgeBlock,runesOf,socketsOf,monsterSkills,monsterExtraSkills,monsterVariants,skillFor,damagePreview,trainingChoices,trainingOffer,modifiableRange,reachBonus,elements,skillElement,skillSchool,damageBonus,damagePercent,castsLeft,scaledDamage,flatDamage,percentStats,skillOptions,maxBonusText,nodeKinds,modText,trapInfo,
  playerColors,bosses,actNames,ACTS,TOTAL_FLOORS,runPoints,actOf,monsterTraits,cards,passiveCards,defaultLoadout,ACTIVE_SLOTS,MAX_ACTIVE_SLOTS,EXTRA_SLOT_PRICE,PASSIVE_SLOTS,MAX_PASSIVE_SLOTS,PASSIVE_SLOT_PRICE,passiveEffects} from './engine.js?v=166';
import {portrait,spellIcon,equipmentIcon} from './art.js?v=166';
import {setupSfx} from './music.js?v=166';
import {icon} from './icons.js?v=166';
import {openMapEditor} from './mapeditor.js?v=166';

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
const iconName={feeble:'Contagio',tracked:'Rastreado',frozen:'Congelado',chill:'Hielo roto',domain:'Expansión de dominio',reach:'Ojo de águila',corrode:'Corroído',detonate:'Detonado',expose:'Vulnerable',slow:'Ralentizado',poison:'Veneno',burn:'Quemadura',weak:'Maldito',haste:'Prisa',shield:'Escudo',fury:'Furia',barrier:'Guardia',blind:'Eclipse'};
const effectHelp={expose:v=>'+'+v+' de daño recibido',slow:v=>'−'+v+' PM',poison:v=>v+' PV por turno',burn:v=>v+' PV de fuego por turno',weak:v=>'−'+v+' PA',feeble:v=>'hace un '+v+' % menos de daño',tracked:()=>'el arquero no necesita verlo para dispararle',frozen:()=>'el próximo golpe de hielo hace +35 % y quita 1 PM',chill:v=>'−'+v+' PM',domain:()=>'tus Congelamientos y Contagios duran 1 turno más',reach:v=>'+'+v+' de alcance',corrode:v=>'−'+v+' % a todas las resistencias',detonate:v=>'estalla al acabar su turno ('+v+' de fuego a 2 casillas)',haste:v=>'+'+v+' PM',shield:v=>v+' de escudo',fury:v=>'+'+v+' % de daño',barrier:v=>v+' de escudo',blind:v=>'−'+v+' de alcance'};
const specs={guardia:'Lanza, empujes y escudo · controla el frente',tirador:'Flechas de largo alcance · ralentiza y empuja',mistico:'Cura y purifica a sus aliados',mago:'Daño en área y control con escarcha',sombra:'Traza rutas rápidas y envenena a sus rivales'};
const roles={guardia:'Valkyria',tirador:'Distancia',mistico:'Apoyo',mago:'Hechicero',sombra:'Asesino'};
// Editor de SFX desactivado por ahora; poner true para volver a mostrarlo al admin.
const SFX_EDITOR=false;
const sfx=setupSfx(el('field-sfx'));
// Pausa: botón en el tablero y tecla P.
const pauseButton=el('field-pause');
// pauseIntent: el cartel sale al instante, sin esperar a que el servidor conteste (en Render puede tardar).
let pauseIntent=null,pauseQueued=false;
function togglePause(){
  if(!state||['lobby','over'].includes(state.phase))return;
  pauseIntent=!state.paused;
  renderPause();
  send({type:'pause'});
}
pauseButton.onclick=togglePause;
// Nombres y barras de vida: se pueden ocultar (botón del tablero o tecla V); se recuerda en el navegador.
let platesShown=localStorage.getItem('cripta-plates')!=='off';
function renderPlates(){
  el('battlefield').classList.toggle('hide-plates',!platesShown);
  const b=el('field-plates');
  b.replaceChildren(icon('hp'));
  b.setAttribute('aria-pressed',String(platesShown));
  b.title=platesShown?'Ocultar nombres y barras de vida (V)':'Mostrar nombres y barras de vida (V)';
  iso?.setPlates?.(platesShown);
}
el('field-plates').onclick=()=>{platesShown=!platesShown;localStorage.setItem('cripta-plates',platesShown?'on':'off');renderPlates();};
document.addEventListener('keydown',event=>{
  if(event.ctrlKey||event.metaKey||event.altKey)return;
  if(/input|textarea|select/i.test(document.activeElement?.tagName||''))return;
  const key=event.key.toLowerCase();
  if(key==='v'&&state&&!el('game').hidden){event.preventDefault();el('field-plates').click();return;}
  if(key!=='p')return;
  if(state&&!['lobby','over'].includes(state.phase)&&!el('game').hidden){event.preventDefault();togglePause();}
});
function renderPause(){
  const paused=pauseIntent??!!state?.paused;
  pauseButton.replaceChildren(icon(paused?'play':'pause'));
  pauseButton.title=paused?'Reanudar (P)':'Pausa (P)';
  pauseButton.setAttribute('aria-pressed',String(paused));
  let veil=el('pause-veil');
  if(paused&&!veil){
    veil=h('div','pause-veil',h('div','pause-card',icon('pause'),h('strong',null,'Pausa'),h('p',null,''),h('button','primary','Reanudar')));
    veil.id='pause-veil';
    veil.querySelector('button').onclick=togglePause;
    document.body.append(veil);
  }
  if(veil){
    veil.hidden=!paused;
    if(paused)veil.querySelector('p').textContent=(state?.paused?state.paused.by+' ha pausado la partida.':'Pausando la partida…')+' Pulsa P o «Reanudar» para seguir.';
  }
}
sfx.attach(el('entry-sfx'));
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
  const shown=!!(iso&&useIso&&state?.units.length&&!el('game').hidden&&!['map','event','shop','forge'].includes(state?.phase));
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
import('./isometric.js?v=166').then(({createIso})=>{
  iso=createIso(worldMount,(event,pos)=>{
    const cell=el('board').children[pos];
    if(event==='click')cell?.click();
    else cell?.dispatchEvent(new PointerEvent('pointer'+event));
  });
  iso?.setStatusRenderer?.(statusBadge);
  renderPlates();
  syncViewport();
  if(iso?.active){
    iso.sync(state,hidePawn);
    iso.highlight(el('board').children);
  }
}).catch(()=>{syncViewport();});
// ───────────── Cuentas, maestrías, amigos e invitaciones ─────────────
/**
 * Cuenta. Se guarda una copia de los datos públicos (nick, Esquirlas, cartas…; nunca la contraseña) para
 * mostrarte conectado al recargar, sin esperar a que el servidor (que puede estar despertando) responda.
 */
const cachedUser=(()=>{try{return localStorage.getItem('cripta-account')?JSON.parse(localStorage.getItem('cripta-account-user')||'null'):null;}catch{return null;}})();
let account={token:localStorage.getItem('cripta-account')||null,user:cachedUser,friends:[],persistent:true,mode:'login',busy:false,cached:!!cachedUser};
function rememberUser(){try{if(account.token&&account.user)localStorage.setItem('cripta-account-user',JSON.stringify(account.user));}catch{}}
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
  if(token)localStorage.setItem('cripta-account',token);else{localStorage.removeItem('cripta-account');localStorage.removeItem('cripta-account-user');account.user=null;account.friends=[];}
}
const available=()=>account.user?.shards||0;
async function refreshAccount(){
  if(!account.token)return;
  try{
    const data=await accountCall('me');
    // Si hay cambios del mazo sin guardar, manda lo que se ve en pantalla (la respuesta puede venir de antes).
    if(deckPending>0&&account.user)data.user.loadouts=account.user.loadouts;
    account.user=data.user;account.friends=data.friends;account.cached=false;rememberUser();
    renderAccount();showInvites();
    if(deckDialog.open)renderDeck();
    if(shopDialog.open)renderShardShop();
    if(state?.phase==='lobby')renderJourney();
  }catch{}
}
accountCall('status').then(data=>{account.persistent=data.persistent;renderAccount();paintVersion(data);}).catch(()=>paintVersion(null));
/** Versión abajo a la izquierda: la de esta página y la del servidor «live». */
const CLIENT_VERSION=(import.meta.url.match(/[?&]v=(\d+)/)||[])[1]||(document.querySelector('script[src*="v="]')?.src.match(/v=(\d+)/)||[])[1]||'?';
function paintVersion(data){
  let box=el('live-version');
  if(!box){box=h('div','live-version');box.id='live-version';document.body.append(box);}
  const parts=['Versión '+CLIENT_VERSION];
  if(!data)parts.push('servidor sin conexión');
  else{
    parts.push('servidor live: '+(data.commit||'local'));
    if(data.assets&&data.assets!==CLIENT_VERSION)parts.push('(servidor en v'+data.assets+')');
  }
  box.textContent=parts.join(' · ');
  box.title='Página: v'+CLIENT_VERSION+(data?'\nServidor: commit '+(data.commit||'local')+', ficheros v'+(data.assets||'?'):'');
  box.classList.toggle('stale',!!(data&&data.assets&&data.assets!==CLIENT_VERSION));
  // Si el servidor ya tiene una versión más nueva que esta página (caché del navegador), ofrecer recargar.
  const newer=data?.assets&&Number(data.assets)>Number(CLIENT_VERSION);
  // Recargar pidiendo la página con ?v=N: GitHub Pages guarda la portada en caché unos minutos y un
  // recargo normal puede devolver la versión vieja.
  const fresh=()=>location.replace(location.pathname+'?v='+data.assets+location.hash);
  box.onclick=newer?fresh:null;
  box.classList.toggle('update',!!newer);
  if(!newer)return;
  // Ya se recargó pidiendo esa versión y sigue llegando la vieja: la web aún se está publicando.
  const asked=Number(new URLSearchParams(location.search).get('v'))||0;
  if(asked>=Number(data.assets)){
    box.textContent='Publicando la versión '+data.assets+'… se recargará sola';
    clearTimeout(paintVersion.retry);
    paintVersion.retry=setTimeout(()=>{if(!state)fresh();},30000);
  }else box.textContent='Hay una versión nueva ('+data.assets+') · pulsa para recargar';
}
// Comprobar cada 2 minutos si hay versión nueva publicada.
setInterval(()=>{if(!state||state.phase==='lobby')accountCall('status').then(paintVersion).catch(()=>{});},120000);
// Mezcla de sonidos definida por el administrador (volumen, tono y variantes de cada categoría).
let savedMix={};
fetch(serverBase()+'/api/sfx/mix',{signal:AbortSignal.timeout(12000)}).then(r=>r.json()).then(d=>{savedMix=d.mix||{};sfx.setMix(savedMix,serverBase());}).catch(()=>{});
// Mapas creados en el editor: el modo solitario también los usa.
fetch(serverBase()+'/api/maps',{signal:AbortSignal.timeout(12000)}).then(r=>r.json()).then(d=>setCustomMaps(d.maps||[])).catch(()=>{});
setInterval(refreshAccount,10000);
// Al cargar la página: comprobar la sesión enseguida (antes se esperaba a la primera consulta, a los 10 s).
refreshAccount();
// Invitaciones casi en tiempo real: consulta ligera cada 2,5 s mientras estás en la portada.
async function ping(){
  if(!account.token||!account.user||state||document.hidden)return;
  try{
    const data=await accountCall('ping');
    paintResume(data.room);
    const known=new Set((account.user.invites||[]).map(i=>i.from+i.code+i.at));
    const fresh=(data.invites||[]).filter(i=>!known.has(i.from+i.code+i.at));
    if(fresh.length){account.user.invites=[...fresh,...(account.user.invites||[])];showInvites();renderAccount();}
  }catch{}
}
setInterval(ping,2500);
setTimeout(ping,600);
/** Botón «Volver a tu partida» en la portada si tu cuenta tiene un héroe en una sala en curso. */
function paintResume(room){
  const button=el('resume');
  const show=!!room&&!state&&!!account.user;
  button.hidden=!show;
  if(!show)return;
  button.replaceChildren(icon('play'),'Volver a tu partida · '+room.code);
  button.onclick=()=>{el('code').value=room.code;enter(false);};
}
function field(label,input){return h('label','field',label,input);}
/** El campo «Nombre» solo hace falta sin cuenta: con sesión, el nombre es el nick. */
function syncNameField(){
  const field=el('name')?.closest('label');
  if(!field)return;
  field.hidden=!!account.user;
}
function renderAccount(){
  rememberUser();
  syncNameField();
  const box=el('account');
  if(!box)return;
  if(account.token&&!account.user){
    box.replaceChildren(h('div','account-head',h('h2',null,icon('level'),'Tu cuenta'),h('p','hint connecting',icon('clock'),'Conectando con tu cuenta…')));
    return;
  }
  if(!account.token||!account.user){
    const nick=document.createElement('input');nick.maxLength=16;nick.autocomplete='username';nick.placeholder='Tu nick';
    const pass=document.createElement('input');pass.type='password';pass.autocomplete=account.mode==='login'?'current-password':'new-password';pass.placeholder='Contraseña';
    // Al crear cuenta, la contraseña se pide dos veces.
    const repeat=document.createElement('input');repeat.type='password';repeat.autocomplete='new-password';repeat.placeholder='Repite la contraseña';
    const go=btn('',async()=>{
      if(account.busy)return;
      if(account.mode!=='login'&&pass.value!==repeat.value){error('Las contraseñas no coinciden.');repeat.focus();return;}
      account.busy=true;
      try{
        go.disabled=true;go.replaceChildren(icon('clock'),account.mode==='login'?'Entrando…':'Creando cuenta…');
        const data=await accountCall(account.mode==='login'?'login':'register',{nick:nick.value,password:pass.value});
        setAccountToken(data.token);account.user=data.user;rememberUser();
        // Se entra ya; los amigos y el resto se cargan después, sin esperar.
        error('');renderAccount();classPreview();refreshAccount();
      }catch(e){error(e.message);go.disabled=false;renderAccount();}finally{account.busy=false;}
    });
    go.className='primary';
    go.append(icon(account.mode==='login'?'play':'users'),account.mode==='login'?'Entrar':'Crear cuenta');
    const swap=btn(account.mode==='login'?'¿No tienes cuenta? Crear una':'¿Ya tienes cuenta? Entrar',()=>{account.mode=account.mode==='login'?'register':'login';renderAccount();});
    swap.className='ghost link-button';
    pass.onkeydown=e=>{if(e.key==='Enter'){if(account.mode==='login')go.click();else repeat.focus();}};
    repeat.onkeydown=e=>{if(e.key==='Enter')go.click();};
    box.replaceChildren(
      h('div','account-head',h('h2',null,icon('level'),'Tu cuenta'),h('p','hint','Guarda tus Esquirlas y tus cartas, agrega amigos e invítalos a tu sala.')),
      h('div','account-form',...[field('Nick',nick),field('Contraseña',pass),account.mode==='login'?null:field('Repite la contraseña',repeat),go,swap].filter(Boolean)),
      ...(account.persistent?[]:[h('p','hint warn','Servidor sin base de datos configurada: las cuentas se borrarán al reiniciarlo.')]));
    return;
  }
  const u=account.user;
  const deckButton=btn('',()=>openDeck(el('class').value));deckButton.className='primary';
  deckButton.append(icon('level'),'Mazo');
  const shopButton=btn('',()=>openShardShop(el('class').value));shopButton.className='primary';
  shopButton.append(icon('shop'),'Tienda');
  const out=btn('',async()=>{try{await accountCall('logout',{});}catch{}setAccountToken(null);renderAccount();classPreview();});
  out.className='ghost logout';out.append(icon('exit'),'Cerrar sesión');
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
  const online=account.friends.filter(f=>f.online).length;
  const friendBox=h('details','friends',h('summary',null,icon('users'),'Amigos ',h('span','friend-count','('+online+'/'+account.friends.length+')')),h('div','add-friend',nickInput,add),friends);
  friendBox.open=friendsOpen;
  friendBox.addEventListener('toggle',()=>{friendsOpen=friendBox.open;});
  box.replaceChildren(
    h('div','account-head',h('div','account-title',h('h2',null,icon('level'),u.nick),shardBadge(available())),
      h('div','account-stats',h('span','chip',icon('crown'),'Mejor piso: '+(u.best||0)),h('span','chip',icon('clock'),(u.runs||0)+' partidas')),
      h('div','account-actions',deckButton,shopButton,SFX_EDITOR&&u.admin?sfxEditorButton():null,u.admin?mapEditorButton():null,out)),
    ...invites,
    friendBox);
}
let friendsOpen=false;
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
// ───────────── Cartas: mazo por clase y tienda de Esquirlas ─────────────
const shardChip=n=>h('span','chip shard-chip',icon('cube'),h('b',null,String(n)),' Esquirlas');
/** Esquirlas junto al nick: solo icono y número en su color; al pasar el ratón, qué son. */
function shardBadge(n){
  const badge=h('span','shard-badge',icon('cube'),h('b',null,String(n)));
  badge.tabIndex=0;
  badge.setAttribute('aria-label',n+' Esquirlas');
  hoverTip(badge,()=>[tipHead(h('span','shard-art',icon('cube')),'Esquirlas',n+' disponibles',null),
    h('p','tip-lore','Fragmentos de la cripta que ganas al terminar cada partida, llegues hasta donde llegues.'),
    statRow('level','Por piso alcanzado','10'),statRow('skull','Por jefe derrotado','40'),statRow('crown','Por acto superado','100'),statRow('play','Por ganar la partida','300'),
    h('p','tip-note','Se gastan en la Tienda: cartas nuevas, huecos extra para tu mazo y, próximamente, aspectos.')],250);
  return badge;
}
/** Mazo de una clase: el de la cuenta o, sin cuenta, el de inicio. */
const myLoadout=classId=>account.user?.loadouts?.[classId]||defaultLoadout(classId);
const ownsCard=id=>cards[id]?.starter||!!account.user?.cards?.includes(id);
const slotsFor=classId=>Math.min(MAX_ACTIVE_SLOTS,account.user?.slots?.[classId]||ACTIVE_SLOTS);
const passiveSlotsFor=classId=>Math.min(MAX_PASSIVE_SLOTS,account.user?.passiveSlots?.[classId]||PASSIVE_SLOTS);
/** En la sala de espera, el servidor vuelve a leer tus cartas. */
function syncLobbyDeck(){if(session?.code&&state?.phase==='lobby')send({type:'loadout'});}
/** Ficha al pasar el ratón, con un pequeño retraso para que no salte al cruzar por encima. */
function hoverTip(target,build,delay=400){
  let timer=null;
  const show=()=>{const rect=target.getBoundingClientRect();showTip(build(),{left:rect.right+8,top:rect.top,bottom:rect.bottom},'tip-skill');};
  target.addEventListener('pointerenter',()=>{clearTimeout(timer);timer=setTimeout(show,delay);});
  target.addEventListener('pointerleave',()=>{clearTimeout(timer);hideUnit();});
  target.addEventListener('focus',show);target.addEventListener('blur',hideUnit);
}
/** Descripción corta de una carta (para la propia carta). */
function cardBlurb(card){
  if(card.kind==='passive')return card.text;
  const skill=classes[card.classId].skills[card.index];
  return skillLore[skill[0]]||skillEffectText(skill)||'';
}
/** Ficha completa de una carta: qué hace, números y efecto. */
function cardTipNodes(card){
  if(card.kind==='passive')return [tipHead(h('span','passive-art',icon('crown')),card.name,'Carta pasiva · '+classes[card.classId].name,null),
    h('p','tip-lore',card.text),h('p','tip-note','Solo se puede equipar una pasiva. Su efecto dura toda la partida.')];
  const skill=classes[card.classId].skills[card.index];
  return skillTipNodes({classId:card.classId,stats:{},level:1},card.index,skill,1);
}
/** Carta con aspecto de carta: coste, ilustración, nombre, tipo y descripción corta. */
function cardTile(card,extra=''){
  const skill=card.kind==='active'?classes[card.classId].skills[card.index]:null;
  const art=h('div','card-art',skill?spellIcon(skill[5],skill[6],skill[0]):h('span','passive-art',icon('crown')));
  const cost=skill?h('span','card-cost',String(skill[1]),h('small',null,'PA')):h('span','card-cost passive',icon('crown'));
  const type=skill?(skillSchool({classId:card.classId},skill)==='magic'?'Hechizo':'Físico')+(skill[2]>1?' · alcance '+skill[2]:' · cuerpo a cuerpo'):'Pasiva';
  const tile=h('article','card-tile kind-'+card.kind+' '+extra,cost,art,h('strong','card-name',card.name),h('small','card-kind',type),h('p','card-text',cardBlurb(card)));
  tile.tabIndex=0;
  tile.dataset.name=card.name;
  hoverTip(tile,()=>cardTipNodes(card));
  return tile;
}
function classTabs(current,onPick){
  const tabs=h('div','forge-tabs deck-tabs',...Object.keys(classes).map(id=>{
    const b=btn('',()=>onPick(id));b.className='forge-tab'+(id===current?' on':'');
    b.append(h('span','tab-art',portrait(id)),classes[id].name);return b;
  }));
  return tabs;
}
/** Diálogo del mazo: 3 activas (+1 si se compró el hueco) y 1 pasiva por clase. */
const deckDialog=el('deck');
let deckClass='guardia';
function openDeck(classId=deckClass){deckClass=classId;renderDeck();if(!deckDialog.open)deckDialog.showModal();}
/**
 * Guardar el mazo: el cambio se ve al instante (sin esperar al servidor) y se guarda en segundo plano;
 * si el servidor lo rechaza, se deshace.
 */
let deckSave=Promise.resolve(),deckPending=0,deckVersion=0;
const deckConfirmed={};   // último mazo que el servidor dio por bueno, por clase
function saveDeck(loadout){
  if(!account.user){error('Crea una cuenta para cambiar tus cartas: sin cuenta se juega con las de inicio.');return;}
  const classId=deckClass;
  deckConfirmed[classId]??=account.user.loadouts?.[classId];
  account.user.loadouts={...account.user.loadouts,[classId]:loadout};
  error('');renderDeck();classPreview();
  // Los guardados van en cola, en orden; solo el último cambio decide lo que se ve.
  const version=++deckVersion;deckPending++;
  deckSave=deckSave.then(async()=>{
    try{
      const d=await accountCall('loadout',{classId,loadout});
      deckConfirmed[classId]=d.user.loadouts[classId];
      Object.assign(account.user,{slots:d.user.slots,passiveSlots:d.user.passiveSlots,shards:d.user.shards,cards:d.user.cards});
      syncLobbyDeck();
    }catch(e){
      // Solo se deshace si nadie ha cambiado nada después.
      if(version===deckVersion){account.user.loadouts={...account.user.loadouts,[classId]:deckConfirmed[classId]};renderDeck();classPreview();}
      error(e.message);
    }finally{deckPending--;}
  });
}
function renderDeck(){
  const loadout=myLoadout(deckClass),slots=slotsFor(deckClass),pslots=passiveSlotsFor(deckClass);
  const passives=loadout.passives||[];
  const all=Object.values(cards).filter(c=>c.classId===deckClass);
  const lockedSlot=(label,price,buy)=>{
    const b=btn('',buy);b.className='primary small-button';
    b.append(icon('plus'),'Desbloquear · '+price);
    b.disabled=!account.user||available()<price;
    return h('div','deck-slot locked',icon('cube'),h('small',null,label),b);
  };
  const emptySlot=(kindText)=>h('div','deck-slot empty',h('strong',null,'Slot vacío'),h('span','hint','Añade una habilidad '+kindText));
  // Activas
  const activeSlots=Array.from({length:MAX_ACTIVE_SLOTS},(_,i)=>{
    const id=loadout.actives[i];
    if(i>=slots)return lockedSlot('Hueco extra de activa',EXTRA_SLOT_PRICE,()=>buyExtraSlot(deckClass));
    if(!id){
      const empty=emptySlot('activa');
      dropZone(empty,p=>p.card&&cards[p.card].kind==='active'&&!loadout.actives.includes(p.card),p=>saveDeck({...loadout,actives:[...loadout.actives,p.card]}));
      return empty;
    }
    const tile=cardTile(cards[id],'equipped');
    draggable(tile,{card:id,from:'deck'});
    // Desde la colección: la sustituye. Desde otro hueco: se intercambian.
    dropZone(tile,p=>p.card&&p.card!==id&&cards[p.card].kind==='active',p=>{
      const actives=p.from==='deck'?loadout.actives.map(x=>x===id?p.card:x===p.card?id:x):loadout.actives.map(x=>x===id?p.card:x);
      saveDeck({...loadout,actives});
    });
    tile.onclick=()=>{if(loadout.actives.length<=1)return error('Necesitas al menos una carta activa.');saveDeck({...loadout,actives:loadout.actives.filter(x=>x!==id)});};
    tile.title='Clic para quitarla del mazo';
    return h('div','deck-slot',tile);
  });
  // Pasivas: 1 hueco, y un 2.º que se compra (caro)
  const passiveSlots=Array.from({length:MAX_PASSIVE_SLOTS},(_,i)=>{
    const id=passives[i];
    if(i>=pslots)return lockedSlot('2.º hueco de pasiva',PASSIVE_SLOT_PRICE,()=>buyPassiveSlot(deckClass));
    if(!id){
      const empty=emptySlot('pasiva');
      dropZone(empty,p=>p.card&&cards[p.card].kind==='passive'&&!passives.includes(p.card),p=>saveDeck({...loadout,passives:[...passives,p.card]}));
      return empty;
    }
    const tile=cardTile(cards[id],'equipped');
    draggable(tile,{card:id,from:'deck'});
    dropZone(tile,p=>p.card&&p.card!==id&&cards[p.card].kind==='passive',p=>saveDeck({...loadout,passives:passives.map(x=>x===id?p.card:x===p.card?id:x)}));
    tile.onclick=()=>saveDeck({...loadout,passives:passives.filter(x=>x!==id)});
    tile.title='Clic para quitarla';
    return h('div','deck-slot passive',tile);
  });
  // Colección: activas y pasivas por separado; primero las que tienes
  const tileFor=card=>{
    const owned=ownsCard(card.id),equipped=loadout.actives.includes(card.id)||passives.includes(card.id);
    const tile=cardTile(card,(owned?'owned':'locked')+(equipped?' in-deck':''));
    if(!owned){tile.append(h('span','card-price',icon('cube'),String(card.price)));tile.onclick=()=>openShardShop(card.classId);tile.title='Se compra en la Tienda';}
    else if(!equipped){
      draggable(tile,{card:card.id,from:'collection'});
      tile.onclick=()=>{
        if(card.kind==='passive'){
          if(passives.length>=pslots)return error('No te quedan huecos de pasiva: quita una primero.');
          return saveDeck({...loadout,passives:[...passives,card.id]});
        }
        if(loadout.actives.length>=slots)return error('Mazo lleno: quita una carta activa primero.');
        saveDeck({...loadout,actives:[...loadout.actives,card.id]});
      };
      tile.title='Clic para equiparla';
    }
    return tile;
  };
  const group=kind=>all.filter(c=>c.kind===kind).sort((a,b)=>Number(ownsCard(b.id))-Number(ownsCard(a.id))).map(tileFor);
  const activeCards=group('active'),passiveCardsList=group('passive');
  const close=btn('Cerrar',()=>deckDialog.close());close.className='ghost';
  const shop=btn('',()=>openShardShop(deckClass));shop.className='primary';shop.append(icon('shop'),'Tienda');
  const board=h('section','deck-board',deckBackdrop(deckClass),
    h('h3','deck-title',icon('play'),'Activas · '+loadout.actives.length+'/'+slots),h('div','deck-slots',...activeSlots),
    h('h3','deck-title',icon('crown'),'Pasivas · '+passives.length+'/'+pslots),h('div','deck-slots passive-row',...passiveSlots),
    h('p','hint deck-help',account.user?'Arrastra o haz clic en una carta de tu colección para equiparla; clic en una equipada para quitarla. En la partida puedes descubrir y aprender más habilidades al subir de nivel.'
      :'Sin cuenta juegas con las cartas de inicio. Crea una cuenta para comprar cartas y montar tu mazo.'));
  const owned=all.filter(c=>ownsCard(c.id)).length;
  const side=h('aside','deck-collection',h('h3','deck-title',icon('bag'),'Tus cartas · '+owned+'/'+all.length),
    h('h4','deck-subtitle',icon('play'),'Activas'),h('div','card-grid',...activeCards),
    h('h4','deck-subtitle',icon('crown'),'Pasivas'),h('div','card-grid',...passiveCardsList));
  // Arrastrar una carta equipada a la colección la quita del mazo.
  dropZone(side,p=>p.card&&p.from==='deck',p=>{
    if(cards[p.card].kind==='passive')return saveDeck({...loadout,passives:passives.filter(x=>x!==p.card)});
    if(loadout.actives.length<=1)return error('Necesitas al menos una carta activa.');
    saveDeck({...loadout,actives:loadout.actives.filter(x=>x!==p.card)});
  });
  const scroll=deckDialog.querySelector('.deck-collection')?.scrollTop||0;
  deckDialog.replaceChildren(
    h('div','masteries-head',Object.assign(h('h2',null,icon('level'),'Mazo · '+classes[deckClass].name),{id:'deck-title'}),account.user?shardChip(available()):null,shop,close),
    classTabs(deckClass,id=>openDeck(id)),
    h('div','deck-layout',board,side));
  deckDialog.querySelector('.deck-collection').scrollTop=scroll;
}
async function buyPassiveSlot(classId){
  try{const d=await accountCall('buy-passive-slot',{classId});account.user=d.user;error('');renderDeck();renderShardShop();renderAccount();}catch(e){error(e.message);}
}
/** Icono grande de cada clase (en gris, de fondo en el mazo). */
const classEmblems={
  // Sombrero de mago con estrella
  mago:'<path d="M100 38 L132 128 Q100 120 68 128 Z" /><path d="M48 132 Q100 112 152 132 Q154 146 100 150 Q46 146 48 132 Z"/><path d="M104 58 l4 9 10 1 -8 6 3 10 -9 -6 -9 6 3 -10 -8 -6 10 -1 z" fill="#100c12"/>',
  // Espada cruzada con escudo
  guardia:'<path d="M97 34 h6 v136 h-6 z"/><path d="M100 10 l12 26 l-12 10 l-12 -10 z"/><path d="M90 52 h20 v6 h-20 z"/><path d="M70 96 q30 -22 60 0 v14 h-60 z"/><path d="M66 100 q-26 -20 -36 -48 q22 10 40 34 z"/><path d="M134 100 q26 -20 36 -48 q-22 10 -40 34 z"/>',
  // Arco y flecha
  tirador:'<path d="M78 40 Q138 100 78 160" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round"/><path d="M78 40 L78 160" stroke="currentColor" stroke-width="3"/><path d="M60 100 H150" stroke="currentColor" stroke-width="6"/><path d="M150 100 l-16 -10 v20 z"/><path d="M60 100 l-10 -8 m10 8 l-10 8" stroke="currentColor" stroke-width="5" fill="none"/>',
  // Símbolo sagrado: sol con cruz
  mistico:'<circle cx="100" cy="100" r="30"/>'+Array.from({length:12},(_,i)=>{const a=i/12*Math.PI*2,x=100+Math.cos(a)*48,y=100+Math.sin(a)*48;return '<rect x="'+(x-4)+'" y="'+(y-10)+'" width="8" height="20" transform="rotate('+(i*30+90)+' '+x+' '+y+')"/>';}).join('')+'<path d="M95 80 h10 v15 h15 v10 h-15 v15 h-10 v-15 h-15 v-10 h15 z" fill="#100c12"/>',
  // Shuriken
  sombra:'<path d="M100 36 L114 86 L164 100 L114 114 L100 164 L86 114 L36 100 L86 86 Z"/><circle cx="100" cy="100" r="10" fill="#100c12"/>'
};
/** Dibujo en gris de fondo del tablero: el emblema de la clase dentro de un círculo de runas. */
function deckBackdrop(classId){
  const art=h('div','deck-backdrop');
  art.setAttribute('aria-hidden','true');
  art.innerHTML='<svg viewBox="0 0 200 200" fill="currentColor"><circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="100" cy="100" r="78" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="4 6"/>'
    +Array.from({length:12},(_,i)=>{const a=i/12*Math.PI*2;return '<rect x="'+(100+Math.cos(a)*85-3)+'" y="'+(100+Math.sin(a)*85-3)+'" width="6" height="6" transform="rotate(45 '+(100+Math.cos(a)*85)+' '+(100+Math.sin(a)*85)+')"/>';}).join('')
    +(classEmblems[classId]||'')+'</svg>';
  art.append(h('span','deck-backdrop-name',classes[classId].name));
  return art;
}
async function buyExtraSlot(classId){
  try{const d=await accountCall('buy-slot',{classId});account.user=d.user;error('');renderDeck();renderShardShop();renderAccount();}catch(e){error(e.message);}
}
/** Tienda de Esquirlas: cartas por clase, huecos extra y aspectos («Próximamente»). */
const shopDialog=el('shard-shop');
let shopTab='guardia';
function openShardShop(classId=shopTab){shopTab=classId;renderShardShop();if(!shopDialog.open)shopDialog.showModal();}
function renderShardShop(){
  if(!shopDialog.open&&!shopDialog.isConnected)return;
  const close=btn('Cerrar',()=>shopDialog.close());close.className='ghost';
  const tabs=classTabs(shopTab,id=>openShardShop(id));
  const skins=btn('',()=>openShardShop('skins'));skins.className='forge-tab'+(shopTab==='skins'?' on':'');skins.append(icon('crown'),'Aspectos');
  tabs.append(skins);
  let body;
  if(shopTab==='skins'){
    body=h('div','coming-soon',icon('crown'),h('strong',null,'Próximamente'),h('p',null,'Aspectos para tus personajes, nuevas animaciones y más. ¡Ve guardando Esquirlas!'));
  }else{
    const forSale=Object.values(cards).filter(c=>c.classId===shopTab&&!c.starter);
    const tiles=forSale.map(card=>{
      const owned=ownsCard(card.id);
      const tile=cardTile(card,owned?'owned':'for-sale');
      const buy=btn('',async()=>{try{const d=await accountCall('buy-card',{card:card.id});account.user=d.user;error('');sfx('coins');renderShardShop();renderDeck();renderAccount();}catch(e){error(e.message);}});
      buy.className=owned?'ghost small-button':'primary small-button';
      buy.disabled=owned||!account.user||available()<card.price;
      buy.append(owned?'Comprada':h('span',null,icon('cube'),' '+card.price));
      tile.append(buy);
      return tile;
    });
    const slotOwned=slotsFor(shopTab)>=MAX_ACTIVE_SLOTS;
    const slotBuy=btn('',()=>buyExtraSlot(shopTab));slotBuy.className=slotOwned?'ghost small-button':'primary small-button';
    slotBuy.disabled=slotOwned||!account.user||available()<EXTRA_SLOT_PRICE;
    slotBuy.append(slotOwned?'Comprado':h('span',null,icon('cube'),' '+EXTRA_SLOT_PRICE));
    const slotTile=h('article','card-tile kind-slot '+(slotOwned?'owned':'for-sale'),h('span','passive-art',icon('plus')),h('strong',null,'4.º hueco de activa'),
      h('small','card-kind','Para '+classes[shopTab].name+': empieza con 4 habilidades'),slotBuy);
    body=h('div','card-grid',slotTile,...tiles);
    if(!forSale.length)body.append(h('p','hint','Pronto habrá más cartas para esta clase.'));
  }
  shopDialog.replaceChildren(
    h('div','masteries-head',Object.assign(h('h2',null,icon('shop'),'Tienda'),{id:'shop-title'}),account.user?shardChip(available()):null,close),
    h('p','hint',account.user?'Las Esquirlas se ganan al terminar cada partida: 10 por piso, 40 por jefe, 100 por acto superado y 300 por ganar.':'Crea una cuenta para ganar Esquirlas y comprar cartas.'),
    tabs,body);
}
function classPreview(){
  const kind=el('class').value;
  const cls=classes[kind];
  for(const card of el('class-cards').children){
    const on=card.dataset.kind===kind;
    card.setAttribute('aria-checked',String(on));
    card.tabIndex=on?0:-1;
  }
  const sample={classId:kind,stats:{},level:1};
  // Tu mazo para esta clase: las activas con las que empiezas y la pasiva.
  const loadout=myLoadout(kind);
  const skills=h('ul','preview-skills',...loadout.actives.map(id=>{
    const index=cards[id].index,skill=cls.skills[index];
    const item=h('li',null,spellIcon(skill[5],skill[6],skill[0]),h('span',null,skill[0]),h('small','stat-pa',skill[1]+' PA'));
    item.tabIndex=0;
    const show=()=>{
      const rect=item.getBoundingClientRect();
      showTip(skillTipNodes(sample,index,skill,1),{left:rect.left,top:rect.top,bottom:rect.bottom},'tip-skill');
    };
    item.onpointerenter=item.onfocus=show;
    item.onpointerleave=item.onblur=hideUnit;
    return item;
  }),...(loadout.passives||[]).map(id=>h('li','passive-line',h('span','passive-art',icon('crown')),h('span',null,cards[id].name),h('small','stat-pa','Pasiva'))));
  const deck=btn('',()=>openDeck(kind));deck.className='ghost small-button deck-open';deck.append(icon('level'),'Preparar cartas');
  el('class-preview').replaceChildren(
    h('div','preview-head',h('strong',null,cls.name),h('span','role-tag',roles[kind])),
    h('p',null,specs[kind]),
    h('div','preview-stats',h('span','mini-stat',icon('hp'),cls.hp+' PV'),h('span','mini-stat',icon('initiative'),'Iniciativa '+cls.initiative),deck),
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
/** Segundos en vivo en las notas de espera (mapa, eventos, tienda y forja). */
function paintWait(){
  if(state?.deadline==null)return;
  const left=state.paused?state.paused.left:state.deadline-Date.now();
  for(const n of document.querySelectorAll('.wait-seconds'))n.textContent=String(Math.max(0,Math.ceil(left/1000)));
}
function paintClock(){
  const clock=el('clock');
  // Sin cuenta atrás (mapa, eventos, tienda y forja hasta que la mitad está lista): reloj en espera.
  const idle=state.paused?state.paused.left==null:state.deadline==null;
  clock.classList.toggle('idle',idle);
  if(idle){
    el('seconds').textContent='∞';
    clock.style.setProperty('--time','1turn');
    clock.setAttribute('aria-valuetext','Sin límite de tiempo');
    clock.classList.remove('urgent');
    return;
  }
  const remaining=state.paused?state.paused.left:Math.max(0,state.deadline-Date.now());
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
/** Ventana modal abierta (va por encima de todo), o el documento. */
const modalHost=()=>[...document.querySelectorAll('dialog[open]')].find(d=>d.matches(':modal'))||document.body;
/** La ficha flotante: se guarda la referencia porque a veces vive dentro de una ventana que se redibuja. */
const tipBox=el('unit-tooltip');
function hideUnit(){
  tipBox.hidden=true;
  if(document.querySelector('#board .foe-reach'))paintFoeReach(null);
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
  const tooltip=tipBox;
  tooltip.hidden=false;
  tooltip.classList.remove('docked');tooltip.style.width='';
  // Fichas de unidades del tablero: ancladas en la columna izquierda (sobre el registro), sin tapar el combate.
  if(anchor?.dock){
    const log=document.querySelector('.side-left .combat-log');
    const rect=log?.getBoundingClientRect();
    if(rect&&rect.width>120&&rect.bottom>0){
      tooltip.classList.add('docked');
      tooltip.style.width=rect.width+'px';
      tooltip.style.left=rect.left+'px';
      tooltip.style.top=Math.max(6,Math.min(rect.top,window.innerHeight-tooltip.offsetHeight-6))+'px';
      return;
    }
  }
  const left=Math.max(6,Math.min(anchor.left,window.innerWidth-tooltip.offsetWidth-6));
  const above=anchor.top-tooltip.offsetHeight-9;
  tooltip.style.left=left+'px';
  tooltip.style.top=(above>=6?above:Math.max(6,Math.min(anchor.bottom+9,window.innerHeight-tooltip.offsetHeight-6)))+'px';
}
function showTip(nodes,anchor,tone=''){
  const tooltip=tipBox;
  // Las ventanas modales (mazo, tienda…) van por encima de todo: la ficha tiene que ir dentro de la abierta.
  if(tooltip.parentElement!==modalHost())modalHost().append(tooltip);
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
/** Icono y explicación de cada estado (encima del nombre de las criaturas). */
const statusIcons={frozen:'ice',chill:'slow',feeble:'weak',tracked:'range',corrode:'expose',detonate:'fire',reach:'reach',domain:'clock',
  fury:'fire',barrier:'ward',blind:'range',shield:'ward',haste:'movement'};
const statusBuffs=new Set(['reach','domain','fury','barrier','shield','haste']);
const statusLong={
  poison:'Pierde vida al empezar cada uno de sus turnos.',burn:'Arde: pierde vida de fuego al empezar cada uno de sus turnos.',
  slow:'Tendrá menos PM en su próximo turno.',chill:'Se le rompió el hielo: tendrá menos PM en su próximo turno.',
  weak:'Tendrá menos PA en su próximo turno.',expose:'Recibe más daño de todos los ataques.',
  feeble:'Contagiado: hace menos daño con sus ataques.',corrode:'Todas sus resistencias están rebajadas.',
  frozen:'El próximo golpe de hielo que reciba le hará +35 % de daño y le quitará 1 PM; luego se rompe.',
  detonate:'Al acabar su turno estallará y quemará a sus aliados a 2 casillas o menos (a él no).',
  tracked:'El arquero que lo marcó no necesita línea de visión para dispararle.',
  blind:'Eclipse: tiene menos alcance en su próximo turno (mínimo 1).',
  reach:'Más alcance en los hechizos de alcance modificable.',domain:'Sus Congelamientos y Contagios duran 1 turno más.',
  fury:'Hace más daño con todos sus ataques.',barrier:'Escudo de En guardia!: absorbe el daño hasta su próximo turno.',
  shield:'Más armadura.',haste:'Tendrá más PM en su próximo turno.'};
function statusDuration(status){
  if(status.untilTurnOf){
    const who=state?.units.find(u=>u.id===status.untilTurnOf)?.name||'quien lo aplicó';
    return 'Hasta el próximo turno de '+who+(status.skips?' (+'+status.skips+' turno más)':'');
  }
  if(status.untilOwnTurn)return 'Hasta su próximo turno';
  if(!status.turns||status.turns>=99)return null;
  return status.turns===1?'1 turno restante':status.turns+' turnos restantes';
}
function statusBadge(key,status,unit){
  const badge=h('span','status-badge '+(statusBuffs.has(key)?'buff':'debuff')+' status-'+key,icon(statusIcons[key]||key));
  const value=status.value>1&&!['frozen','tracked','domain','detonate'].includes(key)?h('b',null,String(status.value)):null;
  if(value)badge.append(value);
  badge.tabIndex=0;
  hoverTip(badge,()=>[
    h('div','tip-head',h('strong',null,iconName[key]||key)),
    effectHelp[key]?h('p','tip-effect',effectHelp[key](status.value)):null,
    h('p','tip-lore',statusLong[key]||''),
    statusDuration(status)?statRow('clock','Duración',statusDuration(status)):null
  ].filter(Boolean),150);
  return badge;
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
  return [h('div','tip-glyph glyph-'+glyph.kind,icon('glyph'),h('div',null,h('strong',null,info.name),h('p',null,glyphText(glyph.kind,state.floor)),
    h('small',null,glyph.warn?'Se activa en el próximo turno del jefe.':'Activo')))];
}
/** Qué hace especial a cada monstruo, en una frase. */
function traitNote(trait={}){
  const parts=[];
  if(trait.element&&trait.element!=='physical')parts.push('Ataca con '+elements[trait.element].toLowerCase());
  if(trait.lifesteal)parts.push('roba vida');
  if(trait.charm)parts.push('encanta (−1 PM)');
  if(trait.slime)parts.push('su baba resta 1 PM');
  if(trait.drain)parts.push('sus golpes quitan 1 PA');
  if(trait.hamstring)parts.push('sus golpes quitan 1 PM');
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
/** Estadísticas completas de un héroe: PV, PA, PM, armadura, iniciativa, crítico, alcance y daños. */
function heroStatRows(u){
  const st=u.stats||{};
  const rows=[
    statRow('heal','Vida',(u.hp??u.max??'—')+(u.max?' / '+u.max:'')+' PV'),
    statRow('ap','Acción',(BASE_AP+(st.action||0))+' PA'),
    statRow('mp','Movimiento',(BASE_MP+(st.movement||0))+' PM'),
    Object.assign(statRow('ward','Armadura',Math.min(75,st.ward||0)+' %'),{title:'Reduce el daño físico que recibes (máximo 75 %).'}),
    statRow('initiative','Iniciativa',u.initiative??'—'),
    statRow('critical','Crítico',Math.round(critChance(u)*100)+' % · ×1,5'),
    statRow('reach','Alcance extra',st.reach?'+'+st.reach:'0')
  ];
  if(st.leech)rows.push(statRow('leech','Vampirismo',st.leech+' % del daño'));
  for(const key of Object.keys(elements))if(st[key])rows.push(statRow(key,'Daño '+elements[key].toLowerCase(),'+'+st[key]+' %','element-'+key));
  if(st.damage)rows.push(statRow('attack','Daño plano','+'+st.damage+' a cada golpe'));
  return rows;
}
/** Casillas a las que puede llegar un enemigo en su turno (al pasarle el ratón). */
function paintFoeReach(unit){
  const board=el('board');
  for(const cell of board.querySelectorAll('.foe-reach'))cell.classList.remove('foe-reach');
  if(unit?.enemy&&unit.hp>0&&state?.phase==='combat'){
    const mp=Math.max(0,3+(unit.stats?.movement||0)-(unit.effects?.slow?.value||0));
    for(const pos of paths(state,unit,mp).keys())board.children[pos]?.classList.add('foe-reach');
  }
  if(iso?.active)iso.highlight(board.children);
}
function inspectCell(unit,cell,pos,glyph,source,skill,aim){
  paintFoeReach(unit?.enemy?unit:null);
  const near=iso?.active?iso.anchor(pos):cell.getBoundingClientRect();
  // Las fichas de unidades se anclan a un lado; las de terreno siguen junto a la casilla.
  const anchor=unit?{left:near.left,top:near.top,bottom:near.bottom,dock:true}:near;
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
  if(unit.enemy){
    stats.append(
      statRow('ward','Armadura',Math.min(75,unit.stats?.ward||0)+' %'),
      statRow('initiative','Iniciativa',unit.initiative),
      statRow('mp','Movimiento',Math.max(0,3+(unit.stats?.movement||0)-(unit.effects?.slow?.value||0))+' PM'),
      statRow('attack','Ataque',unit.damage+'–'+(unit.damage+2)),statRow('range','Alcance',String(unit.range)));
  }else stats.append(...heroStatRows(unit));
  nodes.push(stats);
  const note=unit.boss?bosses[unit.look]?.powers:traitNote(monsterTraits[unit.look]);
  if(unit.enemy&&unit.hp>0)nodes.push(h('p','tip-note foe-reach-note','Las casillas en rojo muestran hasta dónde puede moverse en su turno.'));
  if(unit.enemy&&note)nodes.push(h('p','tip-note',note));
  if(unit.enemy&&unit.variant)nodes.push(h('p','tip-note tip-variant',h('strong',null,'Variante '+monsterVariants[unit.variant].name+': '),monsterVariants[unit.variant].text+'.'));
  const resist=Object.entries(unit.resist||{}).filter(([,v])=>v);
  if(unit.enemy&&resist.length)nodes.push(h('div','tip-resists',...resist.sort((a,b)=>b[1]-a[1]).map(([key,v])=>
    h('span','resist-chip '+(v>0?'resist':'weak')+' element-'+key,icon(key),(v>0?'Resiste ':'Débil al ')+elements[key].toLowerCase()+' '+Math.abs(v)+' %'))));
  const special=unit.enemy&&!unit.boss&&monsterSkills[unit.look];
  const extra=unit.enemy&&!unit.boss&&monsterExtraSkills[unit.look];
  if(extra)nodes.push(h('p','tip-note tip-skill',h('strong',null,extra.name+': '),extra.text+((unit.vineCd??0)<=0?' · ¡Lista!':'')));
  if(special)nodes.push(h('p','tip-note tip-skill',h('strong',null,special.name+': '),special.text+(special.cd&&(unit.cd??1)<=0?' · ¡Lista!':'')));
  const chips=effectChips(unit);
  if(chips)nodes.push(chips);
  if(glyph)nodes.push(...glyphNodes(glyph));
  nodes.push(...terrainNodes(pos));
  showTip(nodes,anchor,unit.enemy?'tip-foe':'tip-ally');
}
window.addEventListener('scroll',hideUnit,{passive:true});
const areaNames={cross:'cruz',circle:'círculo',cone:'cono',line:'línea',wave:'rectángulo delante de ti',trident:'tridente',tee:'T invertida'};
/** Texto del efecto de una habilidad, con sus valores reales (rango y bonificaciones incluidos). */
/** Qué hace cada habilidad, en una frase (los números exactos van en la ficha). */
const skillLore={
  // Valkyria
  'Estocada':'Clava la lanza hacia delante y empuja a todos los enemigos de la línea.',
  'Lanza del lago':'Lanza una estocada en forma de tridente que atrae a los enemigos alcanzados hacia ti.',
  'En guardia!':'Te proteges con un escudo y terminas el turno; los enemigos que entren a tu alrededor reciben daño y son empujados.',
  'Punzón':'Pincha a un enemigo a distancia y te curas con parte del daño.',
  'Liberación':'Golpea el suelo con la lanza y empuja a todos los enemigos a tu alrededor.',
  'Pies ligeros':'Ganas movimiento extra este turno.',
  'Balestra':'Corres hacia el objetivo, lo golpeas y apareces detrás de él.',
  'Salto valiente':'Saltas a una casilla y golpeas a todos los enemigos a tu alrededor al caer.',
  'Carga heroica':'Cargas contra el objetivo y lo empujas más lejos cuanto más hayas corrido.',
  'Lanza cargada':'Lanza un golpe eléctrico en línea o diagonal; cada uso hace más fuertes los siguientes.',
  'Barrido':'Barre con la lanza tres casillas de lado y puede ralentizar a los enemigos.',
  'Lanza abisal':'Golpe de hielo que hace más daño si el enemigo está pegado a ti.',
  'Eclipse':'Oscureces el campo de batalla: todos los enemigos pierden alcance durante su próximo turno.',
  'Abrir las aguas':'Clava la lanza y abre una zona de hielo en forma de T que daña y aparta a los enemigos.',
  'Furia':'Durante un tiempo, todos tus golpes hacen más daño.',
  // Clérigo
  'Luz ardiente':'Un destello sagrado que quema a los enemigos que se acercan demasiado.',
  'Restaurar':'Posas la mano y la luz cierra las heridas, tuyas o de un aliado.',
  'Sello de fragilidad':'Un sello brilla sobre el enemigo y marca dónde golpear: todos le hacen más daño.',
  'Purificar':'Arrancas de un aliado venenos, quemaduras y maldiciones, y le devuelves algo de vida.',
  'Escudo sagrado':'Un halo de luz envuelve a un aliado y frena los golpes durante un tiempo.',
  'Celeridad divina':'Una bendición que aligera los pasos de un aliado en su próximo turno.',
  'Juicio':'El cielo responde y el fuego sagrado cae sobre los enemigos de la zona.',
  'Alba radiante':'Una luz cálida que se extiende y sana a todos los aliados que toca.',
  // Mago
  'Misil mágico':'Un proyectil de energía pura que nunca se desvía. Se alimenta tanto de tu magia como de tu fuerza.',
  'Bola de fuego':'Una esfera ardiente que estalla al llegar y puede dejar a los enemigos en llamas.',
  'Escarcha':'Un aliento helado barre lo que tienes delante y puede entumecer a quien alcance.',
  'Descarga arcana':'Magia en bruto lanzada contra cualquier enemigo a la vista.',
  'Cono de hielo':'Un soplo glacial que hiela y frena a todo lo que tengas enfrente.',
  'Relámpago':'Un rayo que sale de tus manos y recorre la línea entera, alcanzando a todos los enemigos en ella.',
  'Onda de choque':'Una sacudida de energía que golpea y aparta al enemigo.',
  'Teletransporte':'Te desvaneces y reapareces en otro punto, aunque no lo veas.',
  'Rayo umbrío':'Energía caótica que se retuerce camino del blanco.',
  // Arquero (hoja nueva)
  'Flecha helada':'Dispara una flecha de hielo que ralentiza al objetivo.',
  'Flecha Flamígera':'Dispara una flecha de fuego que quema todo lo que hay en línea recta. El retroceso te echa hacia atrás.',
  'Detonadora':'Clava una flecha explosiva en un enemigo; al acabar su turno, estalla y quema a los que tenga cerca.',
  'Flecha Repelente':'Dispara una flecha potente que aparta al enemigo de un empujón.',
  'Ojo de águila':'Te concentras y tus hechizos llegan más lejos durante un tiempo.',
  'Flecha venenosa':'Dispara una flecha envenenada que le quita acciones al objetivo.',
  'Dardo pestilente':'Lanza un dardo que envenena al objetivo y debilita sus resistencias.',
  'Congelación prematura':'Dispara una flecha al cielo que cae y congela a los enemigos de la zona.',
  'Ramo helado':'Dispara una flecha que, al impactar, se abre en un cono de hielo hacia atrás.',
  'Tramposa':'Coloca una trampa de hielo oculta; cuando un enemigo la pisa, estalla y congela a los que estén cerca.',
  'Expansión de dominio':'Durante un tiempo, tus congelamientos y contagios duran más.',
  'Contagio':'Dispara una flecha infectada que debilita y envenena al objetivo y a los enemigos que tenga cerca.',
  'Trampita':'Coloca una pequeña trampa venenosa a la vista; quien la pise queda envenenado.',
  'Flecha Explosiva':'Dispara una flecha que explota en la zona de impacto; los muros protegen de la explosión.',
  'Flecha Rastreadora':'Dispara una flecha de fuego que marca al objetivo: podrás dispararle aunque no lo veas.',
  // Ninja
  'Shuriken':'Una estrella de acero que vuela rápida y silenciosa hacia el blanco.',
  'Cuchilla envenenada':'Un corte pequeño, pero el veneno sigue trabajando turno tras turno.',
  'Paso de sombra':'Te funden las sombras y apareces donde mires, sin pisar nada por el camino.',
  'Puñalada trasera':'Una hoja que encuentra el punto débil: casi siempre es un golpe crítico.',
  'Bomba de humo':'Una nube espesa que daña y deja a los enemigos desorientados y lentos.',
  'Kunai con cadena':'Clavas el kunai y tiras de la cadena: el enemigo viene hacia ti.',
  'Sustitución':'Un parpadeo y has cambiado tu lugar con el de otro, amigo o enemigo.',
  'Corte glacial':'Un tajo con hoja helada que entumece al enemigo para su próximo turno.'
};
function skillEffectText(skill){
  const kind=skill[5],o=skillOptions(skill);
  const area='';   // el área ya se ve en su fila con el croquis
  const text={
    expose:'Vulnerable 2 turnos: los ataques contra el objetivo hacen +'+(o.value||3),
    slow:o.slowBonus?'Quita PM en el próximo turno del objetivo: −'+(o.value||1)+' PM ('+(100-o.slowBonus.chance)+' % de las veces) o −'+o.slowBonus.value+' PM ('+o.slowBonus.chance+' %)':(o.slowChance!==undefined?o.slowChance+' % de probabilidad de ralentizar: ':'Ralentiza: ')+'−'+(o.value||2)+' PM en el próximo turno del objetivo',
    venom:'Veneno: '+(o.value||2)+' PV por turno durante 2 turnos (+ tu % de daño caótico)',
    blast:'',
    push:o.area?'Empuja '+(o.push||1)+(o.push>1?' casillas':' casilla')+' a los enemigos alcanzados, alejándolos '+(o.pushFrom==='center'?'del centro del área':'de ti')+'. Si chocan: 2 de daño por casilla que falte + la mitad de tu nivel':'Empuja '+(o.push||1)+(o.push>1?' casillas':' casilla')+' en línea. Si choca: 2 de daño por casilla que falte + la mitad de tu nivel',
    pull:o.area?'Atrae '+(o.pull||1)+(o.pull>1?' casillas':' casilla')+' hacia ti a los enemigos alcanzados':o.pull==='melee'?'Atrae al objetivo (aliado o enemigo) hasta el cuerpo a cuerpo; a los aliados no les hace daño':'Atrae '+(o.pull||1)+(o.pull>1?' casillas':' casilla')+' hacia ti',
    cleanse:'Elimina todos los efectos negativos del aliado',
    heal:'Cura a un aliado o a ti mismo',
    shield:'+'+(o.value||3)+' de armadura durante 2 turnos',
    haste:'+'+(o.value||2)+' PM en el próximo turno del aliado',
    sprint:'Ganas +'+(o.value||2)+' PM este turno',
    snare:!o.blast?'Trampa de 1 casilla, visible. Quien la pise (aliado o enemigo) recibe el daño, veneno de '+(o.poison||2)+' PV (+ tu % de daño caótico) durante '+(o.poisonTurns||2)+' turnos y un '+(o.slowChance||30)+' % de probabilidad de −'+(o.value||1)+' PM. Dura todo el combate; hasta '+(o.maxTraps||3)+' a la vez':'Trampa oculta (los enemigos no la ven). Se activa cuando un enemigo pisa la cruz; estalla y daña a todos los enemigos a '+(o.blast||3)+' casillas o menos (−20 % por casilla, sin línea de visión) y después los congela. Dura todo el combate; solo una a la vez',
    contagion:'Contagia al objetivo y a sus aliados a '+(o.spread||2)+' casillas o menos: −'+(o.value||2)+' PA y −'+(o.feeble||25)+' % de daño causado en su próximo turno, y veneno de '+(o.poison||2)+' PV (+ tu % de daño caótico) durante '+(o.poisonTurns||2)+' turnos',
    track:'Rastreado durante '+(o.turns||2)+' turnos: tus habilidades no necesitan línea de visión contra él',
    domain:'Durante '+(o.turns||2)+' turnos, los Congelamientos y Contagios que apliques duran 1 turno más',
    detonate:'Detonado: al acabar su turno estalla y quema a sus aliados a 2 casillas o menos ('+(o.detonate||[3,5]).join('-')+' de fuego)',
    reach:'+'+(o.value||3)+' de alcance en tus hechizos de alcance modificable durante '+(o.turns||2)+' turnos',
    curse:'−'+(o.value||1)+' PA en el próximo turno del objetivo (no se acumula)',
    corrode:'−'+(o.value||25)+' % a todas las resistencias del objetivo hasta tu próximo turno, y veneno de '+(o.poison||2)+' PV (+ tu % de daño caótico) en su próximo turno',
    eclipse:'Todos los enemigos del mapa pierden '+(o.value||6)+' de alcance en su próximo turno (mínimo 1)',
    fury:'+'+(o.value||10)+' % de daño final durante 2 turnos (contando este); se multiplica por tu % de daño de fuego',
    guard:'Escudo del 10 % de tu vida máxima + tu nivel hasta tu próximo turno. Al terminar tu turno, el primer paso de cada enemigo dentro del área le hace este daño y lo empuja 2 casillas (una vez por enemigo). Pasa el turno',
    swap:'Intercambia tu posición con la del objetivo',
    lunge:'Corres en línea recta hasta el objetivo, lo golpeas y apareces detrás de él (si esa casilla está ocupada, te quedas pegado). A un aliado no le hace daño. Sin nada en medio de la recta',
    charge:'Corres en línea recta hasta el objetivo, lo golpeas y lo empujas tantas casillas como recorriste + 1. Si choca: 2 de daño por casilla que falte + la mitad de tu nivel. A un aliado lo empuja sin daño. Sin nada en medio de la recta',
    leap:'Saltas a una casilla libre y golpeas a todos los enemigos a tu alrededor (−20 % por casilla de distancia)',
    dash:o.teleport?(o.los===false?'Teletransporte (sin necesitar línea de visión)':'Teletransporte a una casilla libre que veas, sin gastar PM'):'Desplazamiento por una ruta libre sin gastar PM'
  }[kind]||'';
  const extra=(o.stack?'+'+o.stack.value+' de daño base de esta habilidad por cada uso durante '+(o.stack.turns||2)+' turnos (acumulable '+(o.stack.max||3)+' veces, cada carga dura lo suyo)':'')+(o.meleeBonus?'+'+o.meleeBonus+' % de daño si el objetivo está adyacente':'')+(o.freeze&&skill[5]!=='snare'?'Congela a los enemigos alcanzados durante 2 de tus turnos: el siguiente golpe de hielo que reciban hace +35 % y les quita 1 PM':'')+(o.blastSight?'Solo daña a los enemigos que se ven desde la casilla del impacto (tras un muro, a salvo)':'')+(o.friendly?'Daña también a los aliados del área':'')+(o.recoil?(o.friendly?' · ':'')+'Retrocedes '+o.recoil+' casilla al disparar (si chocas, te haces daño)':'');
  const steal=o.lifesteal?' · Te curas el '+o.lifesteal+' % del daño hecho':'';
  const burn=o.element==='fire'&&o.burnChance!==0?' · '+(o.burnChance!==undefined?o.burnChance+' % de probabilidad de quemar: ':'Quemadura: ')+'arde 2 turnos y pierde ¼ del daño al empezar cada uno':'';
  return ([text,extra].filter(Boolean).join(' · ')+area+steal+burn).replace(/^ · /,'');
}
/** Con qué escala el daño de una habilidad: (Magia, Hielo), (Físico), (Magia, Físico)... */
const tagNames={physical:'Físico',magic:'Magia',fire:'Fuego',ice:'Hielo',lightning:'Rayo',chaos:'Caótico'};
function scalingTags(unit,skill){
  const f=skillFacts(unit,skill);
  if(f.healing||f.utility)return [];
  const scales=skillOptions(skill).scales;
  if(scales)return [...scales];
  return [f.school==='physical'?'physical':'magic',...(['fire','ice','lightning','chaos'].includes(f.element)?[f.element]:[])];
}
/** Datos calculados de una habilidad para un personaje (con su equipo, si lo tiene). */
function skillFacts(unit,skill){
  const [,cost,range,min,max,kind,,minRange=0]=skill;
  const reach=modifiableRange(skill)?reachBonus(unit):0;
  const healing=['heal','cleanse'].includes(kind);
  const utility=['dash','shield','haste','swap'].includes(kind)||max<=0;
  const element=skillElement(unit,skill);
  const heal=Math.floor((unit.level||1)/2);
  const percent=healing||utility?0:damagePercent(unit,skill),flat=healing||utility?0:flatDamage(unit);
  const low=healing?min+heal:utility?min:scaledDamage(unit,skill,min),high=healing?max+heal:utility?max:scaledDamage(unit,skill,max);
  const school=skillSchool(unit,skill);
  const crit=Math.min(100,Math.round(critChance(unit)*100)+(skillOptions(skill).crit||0));
  return {cost,minRange,maxRange:range+reach,reach,healing,utility,element,school,bonus:healing?heal:percent,flat,low,high,kind,crit,modifiable:modifiableRange(skill)};
}
/** De dónde sale el bonus de daño: físico, o mágico + elemento. */
function bonusSource(unit,f){
  const elemental=['fire','ice','lightning','chaos'].includes(f.element);
  const school=f.school==='physical'?'físico':'mágico';
  return elemental?school+' + '+elements[f.element].toLowerCase():'daño '+school;
}
/**
 * Croquis del área (como en Dofus): rejilla isométrica en miniatura con las casillas afectadas.
 * Se calcula con la misma función que el juego, con el lanzador abajo (para conos y líneas).
 */
function areaSketch(skill){
  const o=skillOptions(skill);
  const kind=o.area||(skill[5]==='blast'?'cross':null);
  if(!kind)return null;
  const size=o.size||1,R=Math.min(4,size+1),N=2*R+3;
  const fake={width:N,height:N,walls:[],voids:[]};
  const c=Math.floor(N/2),center=c*N+c;
  const caster={pos:(c+2)*N+c};
  const hit=new Set(spellArea(fake,center,skill,caster));
  const hw=7,hh=3.6,cells=[];
  let minX=0,maxX=0,minY=0,maxY=0;
  for(let y=-R;y<=R;y++)for(let x=-R;x<=R;x++){
    const pos=(c+y)*N+(c+x);
    // Rombo alrededor del centro, más cualquier casilla del área que quede fuera (esquinas del tridente).
    if(Math.abs(x)+Math.abs(y)>R+1&&!hit.has(pos))continue;
    const px=(x-y)*hw,py=(x+y)*hh;
    minX=Math.min(minX,px-hw);maxX=Math.max(maxX,px+hw);minY=Math.min(minY,py-hh);maxY=Math.max(maxY,py+hh);
    cells.push({px,py,on:hit.has(pos),center:pos===center});
  }
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox',[minX-1,minY-1,maxX-minX+2,maxY-minY+2].join(' '));
  svg.setAttribute('class','area-sketch');
  svg.setAttribute('aria-hidden','true');
  for(const cell of cells){
    const poly=document.createElementNS(ns,'polygon');
    poly.setAttribute('points',[[cell.px,cell.py-hh],[cell.px+hw,cell.py],[cell.px,cell.py+hh],[cell.px-hw,cell.py]].map(p=>p.join(',')).join(' '));
    poly.setAttribute('class',cell.center?'sk-center':cell.on?'sk-on':'sk-off');
    svg.append(poly);
  }
  return svg;
}
/** Filas de la ficha de una habilidad. */
function skillRows(unit,skill){
  const f=skillFacts(unit,skill),o=skillOptions(skill);
  const rows=[statRow('ap','Coste',f.cost+' PA'+(o.mpCost?' + '+o.mpCost+' PM':''))];
  // Daño y curación como filas: valor a la derecha, con el icono y el color de su tipo (sin rótulo de elemento).
  const amount=(cls,iconName,low,high,title)=>{
    const row=h('div','tip-row tip-amount '+cls,icon(cls==='heal'?'heal':'attack'),h('span','tip-label',title),
      h('span','tip-value',icon(iconName),h('b',null,String(low)),'–',h('b',null,String(high))));
    return row;
  };
  if(f.healing){
    const row=amount('heal','heal',f.low,f.high,'Curación');
    if(f.bonus)row.title='+'+f.bonus+' por nivel';
    rows.push(row);
  }else if(!f.utility){
    const row=amount('element-'+f.element,f.element,f.low,f.high,'Daño');
    if(f.bonus||f.flat)row.title='Base '+skill[3]+'–'+skill[4]+(f.flat?' +'+f.flat:'')+(f.bonus?' · +'+f.bonus+' % por '+bonusSource(unit,f):'');
    rows.push(row);
    // Crítico: probabilidad y el daño que hace al acertar (×1,5 ya aplicado).
    rows.push(h('div','tip-row tip-amount tip-crit element-'+f.element,icon('critical'),h('span','tip-label','Crítico'),
      h('span','tip-value',f.crit+' % · ',icon(f.element),h('b',null,String(Math.round(f.low*1.5))),'–',h('b',null,String(Math.round(f.high*1.5))))));
  }
  const sketch=areaSketch(skill);
  if(o.area||sketch){
    const label=o.area==='wave'?(o.width||3)+'×'+(o.size||1)+' al frente':o.area==='line'?'línea de '+((o.size||1)+1)+' casillas':o.area==='trident'?'tridente':o.area==='tee'?'T invertida':o.area==='cone'?'cono '+Array.from({length:(o.size||1)+1},(_,i)=>2*i+1).join('-'):o.area==='circle'&&!skill[2]?'círculo de '+(o.size||1)+' a tu alrededor':o.area?areaNames[o.area]+(o.size>1?' · tamaño '+o.size:''):'cruz';
    const row=statRow('blast','Área',label);
    if(sketch)row.querySelector('.tip-value').append(sketch);
    rows.push(row);
  }
  if(o.push||o.pull)rows.push(statRow('mp',o.push?'Empuje':'Atrae',o.pull==='melee'?'Hasta el contacto':(o.push||o.pull)+((o.push||o.pull)>1?' casillas':' casilla')));
  if(o.inLine)rows.push(statRow('move','Lanzar',o.inLine==='diagonal'?'En línea recta o diagonal':'En línea recta'));
  if(o.stack&&unit.stacks?.[skill[0]]?.length)rows.push(statRow('attack','Cargas',unit.stacks[skill[0]].length+' de '+(o.stack.max||3)+' · +'+unit.stacks[skill[0]].length*o.stack.value+' de daño'));
  if(o.casts)rows.push(statRow('clock','Usos por turno',String(o.casts)));
  if(o.perTarget)rows.push(statRow('clock','Usos por objetivo',String(o.perTarget)));
  if(o.cooldown){
    const left=cooldownLeft(unit,skill);
    rows.push(statRow('clock','Recarga',left?'faltan '+left+(left>1?' turnos':' turno'):o.cooldown+(o.cooldown>1?' turnos':' turno')));
  }
  if(o.anyTarget)rows.push(statRow('users','Objetivo','Aliado o enemigo'));
  // Alcance y si es modificable en la misma fila.
  const range=statRow('range','Alcance',(f.minRange&&f.minRange!==f.maxRange?f.minRange+'–':'')+f.maxRange+(f.reach?' (+'+f.reach+' equipo)':''));
  range.querySelector('.tip-value').append(h('small','reach-kind '+(f.modifiable?'yes':'no'),f.modifiable?'modificable':'fijo'));
  range.title=f.modifiable?'Modificable: el «+Alcance» del equipo lo aumenta.':'Fijo: el «+Alcance» del equipo no lo cambia.';
  rows.push(range);
  rows.push(statRow('info','Línea de visión',o.los===false?'No necesaria':'Necesaria'));
  return rows;
}
function skillTipNodes(unit,index,skill,rank,hotkey=null){
  const [name,,,,,kind,symbol]=skill;
  const effect=skillEffectText(skill);
  const base=classes[unit.classId]?.skills[index??classes[unit.classId].skills.findIndex(s=>s[0]===name)];
  const bonus=maxBonusText(base||skill);
  const head=tipHead(spellIcon(kind,symbol,name),name,rank?'Nivel '+rank+' de 3':'Sin aprender',hotkey?String(hotkey):null);
  const tags=scalingTags(unit,skill);
  if(tags.length)head.querySelector('.tip-title').append(h('span','skill-tags','(',...tags.flatMap((key,i)=>[i?', ':'',h('span','skill-tag element-'+key,tagNames[key])]),')'));
  return [head,
    skillLore[name]?h('p','tip-lore',skillLore[name]):null,
    h('div','tip-stats',...skillRows(unit,skill)),
    effect?(()=>{const p=h('p','tip-effect');resourceText(p,effect);return p;})():null,
    bonus?h('p','tip-note max-bonus'+(rank>=3?' active':''),icon('xp'),(rank>=3?'Rango máximo: ':'Al rango 3: ')+bonus):null].filter(Boolean);
}
function initiative(turn){
  const units=state.units.length?state.units:state.players;
  return units.map(u=>{
    const li=h('li',u.enemy?'foe':'ally',h('span','turn-art',unitArt(u)));
    if(tintOf(u))li.style.setProperty('--player',tintOf(u).hex);
    const away=!u.enemy&&state.players.find(p=>p.id===u.id)?.away;
    if(away)li.classList.add('away');
    const info=h('span','turn-info',h('span','turn-name',u.name),away?h('span','away-tag','sin conexión'):null);
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
const statValue=(key,value,signed=true)=>(signed?(value>0?'+':'−'):'')+Math.abs(value)+(percentStats.has(key)?' %':'');
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
function affixList(item,className='stat-list',grouped=false){
  if(!item.affixes)return statList(item.stats,className);
  const sorted=[...item.affixes].sort((a,b)=>a.type===b.type?0:a.type==='prefix'?-1:1);
  const lines=[];
  let group=null;
  for(const mod of sorted){
    if(grouped&&mod.type!==group){group=mod.type;lines.push(h('li','affix-group '+group,group==='prefix'?'Prefijos':'Sufijos'));}
    lines.push(mod);
  }
  return h('ul',className+' affix-list'+(grouped?' grouped':''),...lines.map(mod=>{
    if(mod instanceof Node)return mod;
    const line=statLine(mod.stat,mod.value);
    line.classList.add('affix',mod.type);
    const tier=h('span','tier tier-'+mod.tier+(mod.tier===mod.tiers?' top':'')+(mod.ascended?' ascended':''),(mod.ascended?'▲':'')+'T'+mod.tier);
    tier.title=(mod.type==='prefix'?'Prefijo':'Sufijo')+' «'+mod.label+'» · tier '+mod.tier+' de '+mod.tiers+(mod.ascended?' · ascendido: de un nivel superior al del objeto':'');
    line.append(tier);
    return line;
  }));
}
const itemSubtitle=item=>item.kind==='rune'?(item.gem?'Gema · calidad '+(item.quality+1)+' de '+gemQualities.length:'Gema'):
  [item.grade>=2?item.base:slots[item.slot],item.rarity,'nivel '+(item.ilvl||1)].filter(Boolean).join(' · ');
/** Icono de un objeto: equipo por ranura; las gemas con su color y su calidad. */
const itemIcon=item=>equipmentIcon(item?.kind==='rune'?(item.gem?'gem:'+item.gem+':'+item.quality:'rune'):item?.slot);
const rarityTone=item=>item?.kind==='rune'?'rune':'grade'+(item?.grade||0);
function itemRow(item,title,actions=[]){
  const row=h('div','item');
  const name=h('b',rarityTone(item),title+(item?.name||'Vacío'));
  const heading=h('div','item-heading');
  if(item)heading.append(itemIcon(item));
  heading.append(h('div','item-title',name,item?h('small',null,itemSubtitle(item)):null));
  row.append(heading);
  if(item){
    row.append(affixList(item));
    row.append(...socketNodes(item));
  }
  if(actions.length)row.append(h('div','item-actions',...actions));
  return row;
}
/** Gemas engastadas y huecos libres de un objeto (◆ ocupado · ◇ libre). */
function socketNodes(item,prefix=''){
  if(item?.kind!=='gear')return [];
  const runes=runesOf(item),total=socketsOf(item);
  const nodes=runes.map(r=>h('div','item-socket',itemIcon(r),h('span',null,prefix+r.name),statList(r.stats,'stat-list compact')));
  nodes.push(h('div','item-holes',total?h('span',null,'Huecos para gemas: '):h('span',null,'Sin huecos para gemas'),
    ...Array.from({length:total},(_,i)=>h('b',i<runes.length?'hole full':'hole',i<runes.length?'◆':'◇'))));
  return nodes;
}
/** Huecos para gemas en miniatura sobre el icono del objeto: ◆ ocupado, ◇ vacío. */
function socketPips(item){
  const runes=runesOf(item).length,total=socketsOf(item);
  const box=h('span','socket-pips',...Array.from({length:total},(_,i)=>h('i',i<runes?'full':null)));
  box.title=total-runes?(total-runes)+(total-runes===1?' hueco libre para gema':' huecos libres para gemas'):'Huecos para gemas ocupados';
  return box;
}
function itemTip(item,anchor){
  const nodes=[tipHead(h('span','tip-item-art '+rarityTone(item),itemIcon(item)),item.name,
    itemSubtitle(item),null),affixList(item,'stat-list tip-stats')];
  nodes.push(...socketNodes(item,'Engastada: '));
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
    const change=(item.stats[key]||0)-(old?.stats[key]||0)-runesOf(old).reduce((sum,r)=>sum+(r.stats?.[key]||0),0);
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
  visual.append(itemIcon(item));
  const title=document.createElement('h4');
  title.textContent=item.name;
  const type=document.createElement('small');
  type.textContent=itemSubtitle(item);
  const stats=affixList(item);
  card.append(visual,title,type,stats);
  if(item.kind==='gear')card.append(...socketNodes(item,'Engastada: '));
  if(item.kind==='rune')card.append(h('p','rune-help',icon('rune'),'Gema: se engasta en un hueco libre de cualquier pieza de equipo y suma su bonificación mientras la lleves. Cuanto mejor su calidad (de dañada a excelente), más da. Es permanente: una vez engastada no se puede quitar ni cambiar.'));
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
  const face=tile.querySelector('summary')||tile;
  face.classList.add('draggable-item');
  face.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    drag={payload,x:event.clientX,y:event.clientY,id:event.pointerId,label:face.dataset.name||face.title};
  });
}
function dropZone(tile,accept,drop){
  dropTargets.set(tile,{accept,drop});
  tile.dataset.drop='';
}
function inventoryTarget(event){
  let node=document.elementFromPoint(event.clientX,event.clientY);
  while(node&&node!==document.body){
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
    modalHost().append(drag.ghost);
    el('inventory').classList.add('dragging');
    hideUnit();
    // Ilumina las casillas donde se puede soltar el objeto (su ranura de equipo, la mochila...).
    for(const tile of document.querySelectorAll('.inventory-slot, .bag-zone, [data-drop]'))
      if(dropTargets.get(tile)?.accept(drag.payload))tile.classList.add('drop-valid');
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
  for(const tile of document.querySelectorAll('.drop-valid'))tile.classList.remove('drop-valid');
  if(active.ghost)suppressInventoryClick=performance.now()+310;
  if(active.ghost)suppressDeckClick=performance.now()+310;
  if(target)dropTargets.get(target).drop(active.payload);
}
document.addEventListener('pointerup',finishDrag);
document.addEventListener('pointercancel',finishDrag);
let suppressDeckClick=0;
for(const dialog of [el('deck'),el('shard-shop')])dialog.addEventListener('click',event=>{
  if(performance.now()<suppressDeckClick){event.preventDefault();event.stopImmediatePropagation();}
},true);
el('inventory').addEventListener('click',event=>{
  if(performance.now()<suppressInventoryClick){event.preventDefault();event.stopImmediatePropagation();}
},true);
function inventorySlot(item,label,actions=[],fallback=''){
  const tile=document.createElement(item?'details':'div');
  tile.className='inventory-slot '+(item?'filled grade'+(item.grade||0):'empty');
  const face=document.createElement(item?'summary':'span');
  if(item||fallback)face.append(item?itemIcon(item):equipmentIcon(fallback));
  if(item?.kind==='gear'&&socketsOf(item))face.append(socketPips(item));
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
    if(runesOf(item).length){
      const rune=itemIcon(runesOf(item)[0]);
      rune.classList.add('socket-icon');
      rune.title=runesOf(item).map(r=>r.name).join(' · ');
      face.append(rune);
    }
  }
  tile.append(face);
  if(item)tile.append(itemRow(item,'',actions));
  return tile;
}
/** Silueta del personaje detrás de las ranuras de equipo. */
function paperDollSilhouette(){
  const holder=h('div','doll-silhouette');
  holder.setAttribute('aria-hidden','true');
  holder.innerHTML='<svg viewBox="0 0 120 200" preserveAspectRatio="xMidYMid meet"><path d="M60 8c-11 0-19 9-19 20s8 21 19 21 19-10 19-21-8-20-19-20zM38 54c-9 2-15 8-18 17l-9 40c-1 5 2 9 6 10l6 1 8-38 3 30-2 36h-1l-5 34c-1 4 2 7 6 7h9c3 0 5-2 6-5l9-40 9 40c1 3 3 5 6 5h9c4 0 7-3 6-7l-5-34h-1l-2-36 3-30 8 38 6-1c4-1 7-5 6-10l-9-40c-3-9-9-15-18-17z"/></svg>';
  return holder;
}
/**
 * Aviso al cambiar equipo: se recuerda qué había en cada ranura y, si cambia, la ranura destella
 * (y la pieza que vuelve a la mochila parpadea). Se guarda la hora para que el destello no se corte
 * aunque el inventario se vuelva a dibujar mientras dura.
 */
let lastGear=null;
const gearFlash=new Map(),stowFlash=new Map();
const FLASH_MS=1400;
function trackGearChanges(player){
  const now=Date.now();
  const current=Object.fromEntries(Object.keys(equipSlots).map(slot=>[slot,player.equipment[slot]?.id??null]));
  if(lastGear&&lastGear.player===player.id){
    for(const [slot,id] of Object.entries(current)){
      const before=lastGear.slots[slot];
      if(id!==null&&id!==before){
        gearFlash.set(slot,now);
        if(before!==null&&player.bag.some(item=>item.id===before))stowFlash.set(before,now);
      }
    }
  }
  lastGear={player:player.id,slots:current};
}
function flash(tile,started,className){
  if(!started)return;
  const elapsed=Date.now()-started;
  if(elapsed>FLASH_MS)return;
  tile.classList.add(className);
  tile.style.animationDelay=-elapsed+'ms';
}
function renderInventory(player){
  trackGearChanges(player);
  const holder=el('inventory');
  const rewards=el('rewards');
  const shopping=state.phase==='shop';
  // Fuera de combate se puede gestionar el equipo; vender solo en la tienda.
  const trading=lootReady()||['shop','forge','map','event'].includes(state.phase);
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
  // Equipo al estilo Diablo / Path of Exile: las ranuras rodean la silueta del personaje.
  const gearGrid=document.createElement('div');
  gearGrid.className='equipment-grid paper-doll';
  gearGrid.append(paperDollSilhouette());
  for(const [slot,label] of Object.entries(equipSlots)){
    const item=player.equipment[slot];
    const actions=item&&trading?[actionButton('Quitar','unequip',{slot})]:[];
    const tile=inventorySlot(item,label,actions,slotKind(slot));
    tile.classList.add('doll-'+slot);
    flash(tile,gearFlash.get(slot),'just-equipped');
    if(trading){
      if(item)draggable(tile,{from:'gear',slot});
      dropZone(tile,p=>p.from==='bag'&&(p.slot===slotKind(slot)||(p.kind==='rune'&&!!item&&runesOf(item).length<socketsOf(item))),
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
      else for(const [slot,label] of Object.entries(equipSlots)){
        if(player.equipment[slot]&&runesOf(player.equipment[slot]).length<socketsOf(player.equipment[slot]))actions.push(actionButton('Engastar en '+label.toLowerCase()+' (permanente)','socket',{item:item.id,slot}));
      }
      if(shopping){
        const sell=actionButton('Vender · ','sell',{item:item.id});
        sell.append(h('b','price',String(Math.floor(item.price/2)+runesOf(item).reduce((sum,r)=>sum+Math.floor(r.price/2),0))),' tusi');
        actions.push(sell);
      }
      for(const other of others){
        const gift=actionButton('','give',{to:other.id,item:item.id});
        gift.className='give-button';
        gift.append(icon('users'),'Dar a '+other.name);
        actions.push(gift);
      }
    }
    const tile=inventorySlot(item,'',actions);
    flash(tile,stowFlash.get(item.id),'just-stowed');
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
  const sheet=panel('Estadísticas','info');
  // En combate, la unidad real (con su vida actual); fuera, lo que daría su equipo ahora mismo.
  const unitNow=state.units.find(u=>u.id===player.id&&!u.enemy);
  const me=unitNow&&state.phase==='combat'?unitNow:{...heroStats(player),hp:unitNow?.hp,level:player.level};
  if(me.hp===undefined)me.hp=me.max;
  sheet.append(h('div','tip-stats hero-sheet',...heroStatRows(me)));
  holder.replaceChildren(gear,bag,sheet);
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
/** Dar tusi a otro jugador: en línea, con la cantidad máxima (todo tu tusi) por defecto. */
let giveDraft=null;
function giveTusi(player,others){
  const amount=document.createElement('input');
  amount.type='number';amount.min='1';amount.max=String(player.gold);amount.placeholder='Cantidad';
  amount.title='Cantidad de tusi a enviar';
  amount.value=String(Math.min(player.gold,Number(giveDraft)||player.gold));
  amount.oninput=()=>{giveDraft=amount.value;};
  const max=btn('MAX',()=>{amount.value=String(player.gold);giveDraft=null;});max.className='ghost give-max';
  const buttons=others.map(other=>{
    const b=btn('',()=>{
      const value=Math.min(player.gold,Math.floor(Number(amount.value)));
      if(!value||value<1)return error('Escribe una cantidad.');
      giveDraft=null;
      send({type:'give',to:other.id,gold:value});
    });
    b.append(unitArt(other),'A '+other.name);
    b.disabled=player.gold<1;
    return b;
  });
  return h('div','give-tusi inline',h('span','give-label',icon('users'),'Enviar tusi'),h('div','give-row',amount,max,...buttons));
}
/** Tienda: sala del mapa con el género del mercader, venta y "Listo". */
function renderShop(box){
  const player=state.players.find(p=>p.id===session.id);
  const cards=state.stock.map(item=>{
    const card=lootCard(item,player);
    card.querySelectorAll('button').forEach(b=>b.remove());
    const buy=actionButton('','buy',{item:item.id});
    buy.className='primary buy-button';
    buy.append(icon('gold'),'Comprar · ',h('b','price',String(item.price)),' tusi');
    buy.disabled=player.gold<item.price;
    card.append(buy);
    return card;
  });
  // Re-tirar el género (lo paga quien lo pulsa; cambia la tienda para todo el grupo).
  const rerollCost=shopRerollCost(state);
  const reroll=actionButton('','reroll-shop');
  reroll.className='ghost reroll-shop';
  reroll.append(icon('dice'),'Re-tirar tienda · ',h('b','price',String(rerollCost)),' tusi');
  reroll.disabled=player.gold<rerollCost;
  reroll.title='Cambia todos los objetos de la tienda. Cada re-tirada en esta tienda cuesta más.';
  const ready=state.ready||[];
  const me=ready.includes(player.id);
  const readyButton=btn('',()=>send({type:'ready'}));
  readyButton.className=me?'ready-button done':'primary ready-button';
  readyButton.append(icon(me?'check':'play'),me?'Listo · esperando al grupo':'Listo para seguir');
  const party=h('div','ready-party',...state.players.map(p=>{
    const chip=h('span','ready-chip'+(ready.includes(p.id)?' on':'')+(p.away?' away':''),unitArt(p),p.name,p.away?h('span','away-tag','sin conexión'):null);
    return chip;
  }));
  const sellHint=h('div','shop-sell-hint',icon('gold'),'Arrastra aquí un objeto de tu mochila para venderlo');
  dropZone(box,p=>p.from==='bag'&&state?.phase==='shop',p=>{
    send({type:'sell',item:p.item});
  });
  box.replaceChildren(
    h('div','journey-head',h('h3',null,icon('shop'),'Tienda del mercader'),
      h('p',null,'Compra aquí; vende arrastrando objetos de tu mochila hasta la tienda (o con «Vender»). Podéis pasaros objetos y tusi.')),
    sellHint,
    h('div','shop-bar',h('div','shop-wallet',icon('gold'),h('b',null,String(player.gold)),' tusi disponibles'),reroll),
    cards.length?h('div','loot-cards shop-cards',...cards):h('p','event-text','El mercader no tiene nada más que vender.'),
    h('div','shop-footer',party,readyButton,waitNote(ready.length)));
}
/** Forja: re-tirar stats o subir la rareza de cualquier objeto (equipado o en la mochila). */
let forgeTab='equipped';
function renderForge(box){
  const player=state.players.find(p=>p.id===session.id);
  const worn=Object.values(player.equipment).filter(i=>i?.kind==='gear');
  const packed=player.bag.filter(i=>i?.kind==='gear');
  if(forgeTab==='equipped'&&!worn.length&&packed.length)forgeTab='bag';
  const items=forgeTab==='equipped'?worn:packed;
  const tab=(id,label,count,iconName)=>{
    const b=btn('',()=>{forgeTab=id;renderForge(box);});
    b.className='forge-tab'+(forgeTab===id?' on':'');
    b.setAttribute('role','tab');b.setAttribute('aria-selected',String(forgeTab===id));
    b.append(icon(iconName),label,h('small',null,String(count)));
    return b;
  };
  const tabs=h('div','forge-tabs',tab('equipped','Equipado',worn.length,'ward'),tab('bag','Mochila',packed.length,'bag'));
  tabs.setAttribute('role','tablist');
  const cards=items.map(item=>{
    const card=lootCard(item,player);
    card.querySelectorAll('button').forEach(b=>b.remove());
    card.classList.add('forge-card');
    // Prefijos y sufijos agrupados y con título, para ver qué se va a re-tirar.
    card.querySelector('.affix-list')?.replaceWith(affixList(item,'stat-list',true));
    // Marcar los modificadores que «Pulir» puede subir de tier.
    const sorted=[...item.affixes].sort((a,b)=>a.type===b.type?0:a.type==='prefix'?-1:1);
    const canPolish=new Set(polishable(item));
    card.querySelectorAll('.affix-list li.affix').forEach((li,i)=>{if(canPolish.has(sorted[i]))li.classList.add('can-polish');});
    // Huecos de la vista previa ya reservados (invisibles): al pasar el ratón solo se iluminan, la carta no cambia de alto.
    const list=card.querySelector('.affix-list');
    if(list)list.append(h('li','forge-ghost upgrade-ghost',forgeBlock(item,'upgrade')?'\u00a0':'+ 1 prefijo o sufijo nuevo'));
    const holes=card.querySelector('.item-holes');
    if(holes&&!forgeBlock(item,'socket'))holes.append(h('b','hole forge-ghost socket-ghost','◇'));
    // Lo equipado no se compara consigo mismo.
    if(forgeTab==='equipped')card.querySelector('.loot-comparison')?.remove();
    const buttons=Object.entries(forgeModes).map(([mode,info])=>{
      const blocked=forgeBlock(item,mode),cost=forgeCost(item,mode);
      const b=actionButton('','forge',{item:item.id,mode});
      b.className='forge-button'+(mode==='upgrade'?' primary':'');
      b.append(h('span',null,info.name),h('b',null,icon('gold'),String(cost)));
      b.title=blocked||info.text;
      b.disabled=!!blocked||player.gold<cost;
      // Al pasar el ratón se ilumina lo que cambiaría.
      const on=()=>card.classList.add('forge-preview-'+mode),off=()=>card.classList.remove('forge-preview-'+mode);
      b.addEventListener('pointerenter',on);b.addEventListener('pointerleave',off);
      b.addEventListener('focus',on);b.addEventListener('blur',off);
      return b;
    });
    card.append(h('p','forge-hint',icon('info'),'Pasa el ratón por una opción: se ilumina lo que se va a re-tirar.'),h('div','forge-actions',...buttons));
    return card;
  });
  const ready=state.ready||[];
  const me=ready.includes(player.id);
  const readyButton=btn('',()=>send({type:'ready'}));
  readyButton.className=me?'ready-button done':'primary ready-button';
  readyButton.append(icon(me?'check':'play'),me?'Listo · esperando al grupo':'Listo para seguir');
  const party=h('div','ready-party',...state.players.map(p=>h('span','ready-chip'+(ready.includes(p.id)?' on':'')+(p.away?' away':''),unitArt(p),p.name,p.away?h('span','away-tag','sin conexión'):null)));
  box.replaceChildren(
    h('div','journey-head',h('h3',null,icon('forge'),'Forja del herrero'),
      h('p',null,'Re-tira los PREFIJOS y SUFIJOS de tu equipo o sube su rareza a cambio de tusi. Re-tirar solo prefijos o solo sufijos cuesta algo más; mejorar un objeto normal es barato y cada rareza siguiente cuesta más.')),
    h('div','shop-wallet',icon('gold'),h('b',null,String(player.gold)),' tusi disponibles'),
    tabs,
    cards.length?h('div','loot-cards forge-cards',...cards):h('p','event-text',forgeTab==='equipped'?'No llevas equipo puesto.':'No tienes equipo en la mochila.'),
    h('div','shop-footer',party,readyButton,waitNote(ready.length)));
}
const trainingDialog=el('training');
trainingDialog.addEventListener('cancel',event=>event.preventDefault());
function updateTraining(player,ready){
  if(!ready||!state.training||player.trained){
    if(trainingDialog.open)trainingDialog.close();
    return;
  }
  if(trainingDialog.open)return;
  // Tras un jefe se ofrecen habilidades nuevas; tras los demás combates, mejoras de las que tienes.
  const offer=trainingOffer(player);
  const learning=offer.some(c=>c.rank===0)&&offer.every(c=>c.rank===0);
  el('training-title').textContent='Nivel '+(player.level+1)+' · '+(learning?'Habilidad nueva':'Mejora una habilidad');
  el('training-intro').textContent=learning?'Elige una habilidad nueva de tu clase para el resto de la partida.':
    offer.some(c=>c.rank===0)?'Mejora una habilidad que ya conoces o aprende una nueva. Pasa el ratón por una opción para ver cómo cambia.':
    'Elige cuál de tus habilidades mejorar. Pasa el ratón por una opción para ver cómo cambia.';
  const unit=state.units.find(u=>u.id===player.id)||{classId:player.classId,stats:{},level:player.level};
  el('training-compare').hidden=true;
  el('training-choices').replaceChildren(...trainingOffer(player).map(({index,rank,name})=>{
    const base=classes[player.classId].skills[index];
    const choice=actionButton('','train',{skill:index});
    choice.className='training-choice';
    choice.append(spellIcon(base[5],base[6],base[0]),h('span','training-name',name),
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
    tipHead(spellIcon(kind,symbol,name),name,rank?'Nivel '+rank+' → '+(rank+1):'Aprender · nivel 1',null),
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
    ...stat('level','Piso alcanzado',state.floor+' de '+TOTAL_FLOORS+' · acto '+actOf(state.floor||1)),
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
  // Solo las cuentas registradas ganan puntos de maestría.
  if(account.user)line.replaceChildren(icon('cube'),'+'+points+' Esquirlas');
  else line.replaceChildren(icon('cube'),'Sin cuenta no se ganan Esquirlas. Regístrate para empezar a acumularlas y comprar cartas.');
  if(account.user&&!session.code&&!soloAwarded){
    soloAwarded=true;
    accountCall('award',{floor:state.floor,bossKills:state.bossKills||0,won}).then(d=>{account.user=d.user;renderAccount();}).catch(()=>{});
  }else if(account.user&&session.code)setTimeout(refreshAccount,1500);
  hideUnit();
  sfx(won?'win':'lose');
  gameoverDialog.showModal();
}
const nodeIcons={combat:'sword',elite:'elite',event:'question',boss:'crown',shop:'shop',forge:'forge'};
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
/** Línea de espera común: listos/votos y cuenta atrás (si la mitad ya está lista). */
function waitNote(count){
  const n=state.players.length;
  if(n<2)return null;
  if(state.deadline!=null)return h('small','wait-note on',icon('clock'),'La mayoría está lista: quedan ',h('b','wait-seconds',''),' s para el resto');
  return h('small','wait-note',icon('clock'),'Sin prisa: la cuenta atrás de 30 s empieza cuando al menos '+Math.ceil(n/2)+' de '+n+' estén listos'+(count?' ('+count+' ya)':''));
}
function voteStatus(){
  const votes=Object.keys(state.vote?.votes||{}).length;
  const status=h('div','vote-status',icon('users'),h('span',null,'Votos: '+votes+' / '+state.players.length),
    state.players.length>1?h('small',null,'Empate: decide el anfitrión · sin votos: primera opción'):null,waitNote(votes));
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
  box.replaceChildren(h('div','journey-head',h('h3',null,icon('crown'),'Acto '+actNumber+' de '+ACTS+' · '+actNames[actNumber-1]),h('p',null,'Cada jugador vota la siguiente sala. Cada camino cierra otros: pasa el ratón por una sala para ver lo que deja abierto. Tomaos el tiempo que necesitéis.')),map,legend,voteStatus());
}
/**
 * Texto enriquecido: tusi, vida, PA, PM, armadura, crítico, daño, gemas, objetos y enemigos
 * aparecen con su icono y su color (y la cantidad que los acompaña, si la hay).
 */
const richRules=[
  {re:/objetos? legendarios?/,tone:'legendary',art:()=>icon('bag')},
  {re:/objetos? raros?(?: o mejor(?:es)?)?/,tone:'rare',art:()=>icon('bag')},
  {re:/objetos? poco comun(?:es)?(?: o mejor(?:es)?)?|objetos? poco común(?: o mejor)?/,tone:'uncommon',art:()=>icon('bag')},
  {re:/(?:Rubí|Granate|Zafiro|Topacio|Amatista|Esmeralda|Ónice|Diamante|Ojo de tigre)(?= |\b|$)/,tone:'gem',art:m=>{const kind=Object.entries(gems).find(([,g])=>g.name===m)?.[0]||'ruby';return gemArt(kind);}},
  {re:/gemas?/,tone:'gem',art:()=>gemArt('amethyst')},
  {re:/(?:[+−-]?\d+ (?:de )?)?tusi/,tone:'gold',art:()=>icon('gold')},
  {re:/(?:[+−-]?\d+ (?:de )?)?vida máxima/,tone:'hp',art:()=>icon('hp')},
  {re:/vida/,tone:'hp',art:()=>icon('hp')},
  {re:/(?:[+−-]?\d+ )?PA\b/,tone:'ap',art:()=>icon('ap')},
  {re:/(?:[+−-]?\d+ )?PM\b/,tone:'mp',art:()=>icon('mp')},
  {re:/(?:[+−-]?\d+ (?:% )?(?:de )?)?armadura/,tone:'ward',art:()=>icon('ward')},
  {re:/(?:[+−-]?\d+ ?% de )?crítico/,tone:'critical',art:()=>icon('critical')},
  {re:/(?:[+−-]?\d+ (?:% )?(?:de )?)?daño/,tone:'damage',art:()=>icon('attack')},
  {re:/habilidad(?:es)?/,tone:'skill',art:()=>icon('level')},
  {re:/enemigos?/,tone:'foe',art:()=>icon('skull')}
];
// Solo palabras completas (que «PA» no se cuele dentro de «mapa»).
const richPattern=new RegExp('(?<!\\p{L})(?:'+richRules.map(r=>'('+r.re.source+')').join('|')+')(?!\\p{L})','giu');
function gemArt(kind){const art=equipmentIcon('gem:'+kind+':3');art.classList.add('rich-gem');return art;}
function richText(text){
  const out=[];let last=0;
  for(const match of String(text).matchAll(richPattern)){
    const index=match.slice(1).findIndex(Boolean);
    const rule=richRules[index];
    if(match.index>last)out.push(String(text).slice(last,match.index));
    out.push(h('span','rich rich-'+rule.tone,rule.art(match[0]),match[0]));
    last=match.index+match[0].length;
  }
  if(last<String(text).length)out.push(String(text).slice(last));
  return out;
}
function renderEvent(box){
  const myVote=state.vote?.votes?.[session.id];
  const options=state.event.options.map((option,i)=>{
    const b=h('button','event-option'+(myVote===i?' voted':''),h('span','event-label',...richText(option.label)),h('span','event-detail',...richText(option.detail)),voters(i));
    b.type='button';
    b.onclick=()=>send({type:'vote',option:i});
    return b;
  });
  box.replaceChildren(h('div','event-card',
    h('div','event-art',icon('question')),
    h('p','event-kicker','Evento · piso '+state.floor),
    h('h3',null,state.event.title),
    h('p','event-text',...richText(state.event.text)),
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
  // Tu hueco: elegir clase y maestrías antes de empezar.
  const me=state.players.find(p=>p.id===session.id);
  const setup=[];
  if(me){
    const picks=h('div','lobby-classes',...Object.keys(classes).map(kind=>{
      const b=h('button','lobby-class'+(me.classId===kind?' on':''),h('span','class-art',portrait(kind)),h('span',null,classes[kind].name));
      b.type='button';b.title=classes[kind].name+' · '+roles[kind];
      b.setAttribute('aria-pressed',String(me.classId===kind));
      b.onclick=()=>{if(me.classId===kind)return;send({type:'class',classId:kind});const select=el('class');if(select){select.value=kind;classPreview();}};
      return b;
    }));
    const learned=me.skillRanks.filter(r=>r>0).length;
    const masteryLine=account.user
      ?h('div','lobby-mastery',h('span',null,icon('level'),learned+' cartas activas'+(me.passives?.length?' · '+me.passives.map(id=>cards[id]?.name).join(', '):' · sin pasiva')),
        Object.assign(btn('',()=>openDeck(me.classId)),{className:'primary'}))
      :h('p','hint','Sin cuenta juegas con las cartas de inicio.');
    masteryLine.querySelector?.('button')?.append(icon('level'),'Preparar cartas');
    setup.push(h('div','lobby-setup',h('h3',null,icon('level'),'Tu personaje'),picks,masteryLine));
  }
  box.replaceChildren(
    h('div','journey-head',h('h3',null,icon('users'),'Sala '+(session.code||'')),h('p',null,host?'Cuando estéis todos, pulsa «Iniciar expedición».':'Esperando a que el anfitrión inicie la expedición.')),
    party,...setup,...invite);
}
function renderJourney(){
  const box=el('journey');
  const show=['map','event','shop','forge','lobby'].includes(state?.phase);
  box.hidden=!show;
  if(!show)return;
  if(state.phase==='lobby'){renderLobby(box);return;}
  if(state.phase==='map')renderMap(box);else if(state.phase==='shop')renderShop(box);else if(state.phase==='forge')renderForge(box);else renderEvent(box);
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
    // La flecha: zumbido al soltarla y golpe seco al llegar.
    if(event.effect==='arrow')sfx('arrowhit',{delay:.25,volume:.85});
    // Sonido del elemento al impactar (llama, hielo que se quiebra, sombra, magia arcana),
    // salvo si el propio efecto ya es ese sonido.
    const elementSound={fire:'el_fire',ice:'el_ice',chaos:'el_shadow',magic:'arcane',lightning:'el_lightning'}[event.element];
    const already={el_fire:'blast',el_shadow:'venom',arcane:'arcane'}[elementSound];
    if(elementSound&&event.effect!==already){
      const travel=Math.min(.62,.2+.055*(state?.width?Math.abs((event.pos%state.width)-(event.from%state.width))+Math.abs(Math.floor(event.pos/state.width)-Math.floor(event.from/state.width)):3));
      sfx(elementSound,{delay:travel,volume:.8});
    }
    // Voz al atacar (salvo los espectros: su lamento queda para cuando reciben daño o mueren).
    if(actor?.enemy&&voices[actor.look]&&voices[actor.look]!=='v_ghost')sfx(voices[actor.look],{volume:actor.boss?.9:.55});
    if(actor?.boss&&event.effect!=='slash')sfx('v_boss',{volume:.8,delay:.1});
    return;
  }
  if(['damage','glyph','trap','poison','burn'].includes(event.kind)&&event.amount>0){
    const target=unitOf(event.unit);
    if(event.kind==='glyph')sfx('glyph',{volume:.8});
    else if(event.kind==='trap')sfx('trap',{volume:.8});
    else if(event.kind==='poison')sfx('venom',{volume:.5});
    else if(event.kind==='burn')sfx('el_fire',{volume:.45,rate:1.15});
    sfx('hit',{volume:.75});
    if(target&&(target.classId==='guardia'||target.look==='skeleton'||target.look==='skeletonking'))sfx('armor',{volume:.5});
    if(target?.hp<=0){
      if(!target.enemy)sfx('die_hero',{delay:.12});
      else{
        // Cada monstruo muere con su propia voz (más grave) y un golpe al caer; los esqueletos se desarman.
        if(voices[target.look])sfx(voices[target.look],{volume:target.boss?1:.8,rate:.78,delay:.08});
        sfx(['skeleton','skeletonking'].includes(target.look)?'bones':'thud',{volume:target.boss?1:.8,delay:.35});
      }
    }
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
    if(iso?.active)return iso.impact(event);
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
  // Daño absorbido por un escudo: «⛨ N» en gris azulado.
  if(event.kind==='block'){
    const tag=h('span','impact mp-loss block-loss','⛨ '+event.amount);
    tag.title='Escudo: absorbe '+event.amount+' de daño';
    Object.assign(tag.style,boardPoint(event.pos,1.48));
    tag.style.setProperty('--float-offset','-30px');
    el('animations').append(tag);
    setTimeout(()=>tag.remove(),hitDuration);
    return;
  }
  // Mejoras sin número de vida (furia, escudo, guardia, prisa): texto corto sobre la unidad.
  if(event.kind==='buff'){
    const tag=h('span','impact buff buff-'+(event.tone||'shield'),event.text);
    Object.assign(tag.style,boardPoint(event.pos,1.1));
    tag.style.setProperty('--float-offset','-30px');
    el('animations').append(tag);
    setTimeout(()=>tag.remove(),hitDuration);
    return;
  }
  // PM quitados: «−N PM» justo debajo del número de daño.
  if(event.kind==='mp'){
    const tag=h('span','impact mp-loss',(event.gain?'+':'−')+event.amount+' PM');
    tag.title=event.gain?'Gana '+event.amount+' PM este turno':'Pierde '+event.amount+' PM en su próximo turno';
    Object.assign(tag.style,boardPoint(event.pos,event.gain?1.1:1.48));
    tag.style.setProperty('--float-offset',event.gain?'-30px':'34px');
    el('animations').append(tag);
    setTimeout(()=>tag.remove(),hitDuration);
    return;
  }
  const tag=document.createElement('span');
  const damage=event.kind!=='heal';
  const typed=damage&&event.element&&elements[event.element];
  tag.className=['impact',event.kind,damage&&'damage-number',event.critical&&'critical',typed&&'el-'+event.element].filter(Boolean).join(' ');
  tag.textContent=(damage?'':'+')+event.amount+(event.critical?'!':'');
  // El tipo de daño se ve de un vistazo: su icono delante y su color.
  if(typed){tag.prepend(icon(event.element,'impact-type'));tag.title='Daño '+elements[event.element].toLowerCase();}
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
    if(event.kind!=='move'){
      // Algunas habilidades piden esperar a que llegue la flecha antes de mostrar el daño.
      const wait=impact(event);
      if(wait>0)await new Promise(r=>setTimeout(r,Math.min(1500,wait)));
      continue;
    }
    if(!event.blink)stepSounds(event);
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
    if(event.blink){
      // Teletransporte: se desvanece en sombra y reaparece en el destino, sin caminar.
      const out=pawn.animate([{opacity:1,filter:'none'},{opacity:0,filter:'brightness(.2) blur(3px)'}],{duration:160,fill:'forwards'});
      await out.finished.catch(()=>{});
      const to=boardPoint(event.path.at(-1));Object.assign(pawn.style,to);
      const back=pawn.animate([{opacity:0,filter:'brightness(.2) blur(3px)'},{opacity:1,filter:'none'}],{duration:180,fill:'forwards'});
      await back.finished.catch(()=>{});
      pawn.remove();continue;
    }
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
  // Laboratorio con varios héroes: controlas al que tenga el turno.
  if(next?.lab&&!session?.code&&next.phase==='combat'){
    const unit=next.units[next.turn];
    if(unit&&!unit.enemy&&session.id!==unit.id)session={...session,id:unit.id};
  }
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
  if(previous&&!initial)itemArrivalSound(previous,next);
  state=next;
  render();
  animate();
}
/** Sonido suave cuando te llega un objeto nuevo (botín elegido, compra, regalo) o te envían tusi. */
function itemArrivalSound(previous,next){
  const ids=p=>new Set([...(p?.bag||[]),...Object.values(p?.equipment||{})].filter(Boolean).map(i=>i.id));
  const before=previous.players?.find(p=>p.id===session?.id),after=next.players?.find(p=>p.id===session?.id);
  if(!before||!after)return;
  const old=ids(before);
  if([...ids(after)].some(id=>!old.has(id)))sfx('loot',{volume:.55});
  else if(after.gold>before.gold&&!['combat','reward'].includes(next.phase)&&previous.phase===next.phase)sfx('coins',{volume:.5});
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
function paintArea(area=[],center=null,skill=null,caster=null){
  const board=el('board');
  for(const cell of board.querySelectorAll('.area-preview,.area-center'))cell.classList.remove('area-preview','area-center');
  for(const pos of area)board.children[pos]?.classList.add('area-preview');
  if(center!==null&&area.includes(center))board.children[center]?.classList.add('area-center');
  if(iso?.active)iso.highlight(board.children);
  aimDamage(skill&&caster?area:[],skill,caster,center);
}
/** Etiquetas sobre cada enemigo afectado con el daño teórico que le harías (mínimo–máximo). */
function aimDamage(area,skill,caster,center=null){
  let layer=el('aim-damage');
  if(!layer){layer=h('div','aim-damage-layer');layer.id='aim-damage';document.body.append(layer);}
  layer.replaceChildren();
  for(const pos of area){
    const target=state?.units.find(u=>u.hp>0&&u.pos===pos&&u.enemy);
    const preview=target&&damagePreview(caster,target,skill,areaFalloff(state,center,pos,skill));
    if(!preview)continue;
    const cell=el('board').children[pos];
    const near=iso?.active?iso.anchor(pos):cell?.getBoundingClientRect();
    if(!near)continue;
    const [lo,hi]=preview.normal;
    const kill=lo>=target.hp+(target.effects?.shield?.value||0);
    const tag=h('div','aim-damage'+(kill?' lethal':''),icon(preview.element),h('b',null,lo===hi?String(lo):lo+'–'+hi));
    tag.style.left=(near.left+(iso?.active?14:(near.width||0)/2))+'px';
    tag.style.top=(near.top-(iso?.active?30:6))+'px';
    tag.title='Daño '+elements[preview.element].toLowerCase()+': '+lo+'–'+hi+' · crítico '+preview.critical.join('–')+' ('+Math.round(preview.chance*100)+' %)';
    layer.append(tag);
  }
}
function drawBoard(turn,walking,skill){
  const board=el('board');
  if(iso)iso.aiming=!!skill;
  const field=el('battlefield');
  hideUnit();
  iso?.resetHover();
  field.hidden=!state.units.length;
  board.replaceChildren();
  aimDamage([]);
  syncViewport();
  if(field.hidden)return;
  board.style.setProperty('--cols',state.width);
  board.className=(state.biome||'crypt')+(state.voids?.length?' shaped':'');
  const fragment=document.createDocumentFragment();
  const shades={jungle:['#3d5a2c','#4a6a32','#36502a','#56763a'],crypt:['#353a4c','#2f3444','#3a3e52','#2b3040'],roots:['#55513a','#4d573b','#60573d','#3f4938'],bones:['#5a5246','#4e473c','#625a4c','#474036'],
    hell:['#2e2826','#2a2624','#3a3330','#262220']}[state.biome]||['#49524c','#3d4845','#515650','#3b4540'];
  for(let pos=0;pos<state.width*state.height;pos++){
    const unit=state.units.find(u=>u.hp>0&&u.pos===pos);
    const voidCell=!onBoard(state,pos);
    const wall=state.walls.includes(pos);
    const glyph=state.glyphs.find(g=>g.cells.includes(pos));
    // Zona de En guardia! (círculo alrededor de quien la lanzó, hasta su próximo turno).
    const snareAt=!voidCell&&!wall&&(state.snares||[]).find(t=>distance(state,t.pos,pos)<=(t.trigger??1));
    const snare=snareAt&&(snareAt.skill==='Trampita'?'hero-trap hero-trap-poison':'hero-trap');
    const guardZone=!voidCell&&!wall&&(state.guardZones||[]).some(z=>{const o=state.units.find(u=>u.id===z.owner&&u.hp>0);return o&&distance(state,o.pos,pos)<=z.size;});
    const water=state.water?.includes(pos);
    const trap=state.traps?.find(t=>t.pos===pos);
    const castRange=skill&&inRange(state,turn,pos,skill);
    const blocked=skill&&hasRange(state,turn,pos,skill)&&!castRange;
    // Cualquier habilidad con área (explosión, cono, línea, rectángulo) muestra todas sus casillas al apuntar.
    const blast=skill?.[5]==='blast'||!!skill&&!!skillOptions(skill).area;
    const aim=castRange&&(castableCell(state,turn,pos,skill)||(!['dash','blast'].includes(skill[5])&&targetable(state,turn,unit,skill)));
    const path=walking.get(pos);
    const cell=btn('',()=>{
      if(aim){send({type:'skill',pos,skill:selected});return;}
      if(path)send({type:'move',pos});
    });
    const shadesIndex=((Math.imul(pos+1,2654435761)^state.mapSeed)>>>6)%shades.length;
    cell.style.setProperty('--tile',shades[shadesIndex]);
    cell.className=['cell',voidCell&&'void',wall&&'wall',water&&'water',trap&&'trap trap-'+trap.kind,path&&'walk',blocked&&'no-sight',castRange&&'cast-range',aim&&'aim',glyph&&'glyph-'+glyph.kind,glyph?.warn&&'warn',guardZone&&'guard-zone',snare].filter(Boolean).join(' ');
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
    }else if(aim){
      cell.onpointerenter=cell.onfocus=()=>paintArea(blast?spellArea(state,pos,skill,turn):[pos],pos,skill,turn);
      cell.onpointerleave=cell.onblur=()=>paintArea();
    }
    if(unit){
      const pawn=document.createElement('span');
      pawn.className=['pawn','look-'+(unit.look||unit.classId),unit.enemy&&'foe',turn===unit&&'active',hidePawn(unit.id)&&'in-motion',unit.effects?.burn&&'burning'].filter(Boolean).join(' ');
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
  renderPause();
  if(!state){if(trainingDialog.open)trainingDialog.close();if(gameoverDialog.open)gameoverDialog.close();return;}
  const turn=state.units[state.turn];
  const mine=state.phase==='combat'&&turn?.id===session.id;
  const host=state.players[0]?.id===session.id;
  const rewardReady=lootReady();
  const actLabel='Acto '+(state.act||actOf(state.floor||1))+' · ';
  const title={shop:'Piso '+state.floor+' · Tienda',map:'Piso '+(state.floor+1)+' · Elige el camino',event:'Evento · '+(state.event?.title||''),lobby:'Sala de expedición',combat:actLabel+'Piso '+state.floor+' · '+turn?.name+(mine?' (tú)':''),reward:rewardReady?'Botín y mercader':'Victoria',won:'Expedición completada',lost:'El grupo ha caído'}[state.phase];
  el('phase').textContent=title;
  updateGameOver();
  const journey=['map','event','shop','forge'].includes(state.phase);
  el('turn-bar').hidden=state.phase!=='combat'&&!rewardReady&&!journey;
  el('turn-bar').classList.toggle('timer-only',state.phase!=='combat');
  if(!el('turn-bar').hidden)paintClock();
  paintWait();
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
  // PA y PM solo en tu turno (no se muestran los de los aliados ni los de los enemigos).
  el('pa').textContent=mine?state.ap:'—';
  el('pm').textContent=mine?state.mp:'—';
  for(const id of ['pa','pm'])el(id).closest('.points').style.visibility=mine?'visible':'hidden';
  if(state.phase==='lobby'&&host)controls.append(actionButton('Iniciar expedición','start'));
  if(rewardReady&&host){
    const next=actionButton('Siguiente piso','next');
    next.disabled=state.picks.length!==state.players.length||(state.training&&state.players.some(p=>!p.trained));
    next.className='primary next-floor';
    controls.append(next);
  }
  if(['won','lost'].includes(state.phase)&&host)controls.append(actionButton('Volver a la sala','restart'));
  const walking=mine&&selected===null?paths(state,turn,state.mp):new Map();
  // Si la habilidad elegida ya no se puede usar (sin PA o sin lanzamientos), se deselecciona.
  if(mine&&selected!==null){const chosen=skillFor(turn,selected);if(!chosen||chosen[1]>state.ap||castsLeft(state,turn,chosen)<=0)selected=null;}
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
      b.append(spellIcon(kind,symbol,name),h('span','ability-name',name),h('span','ability-cost stat-pa',cost+' PA'+(skillOptions(current).mpCost?' +'+skillOptions(current).mpCost+' PM':'')),key);
      if(rank>1)b.append(h('span','ability-rank',rank+'/3'));
      if(!['heal','cleanse','dash'].includes(kind)){
        const element=skillElement(turn,current);
        b.append(h('span','ability-element element-'+element,icon(element)));
      }
      if(modifiableRange(current))b.append(h('span','ability-reach',icon('reach')));
      b.setAttribute('aria-keyshortcuts',String(hotkey));
      const maxRange=range+(modifiableRange(current)?reachBonus(turn):0);
      const healing=['heal','cleanse'].includes(kind);
      b.setAttribute('aria-description',cost+' PA · alcance '+minRange+'–'+maxRange);
      b.onpointerenter=b.onfocus=()=>{
        const rect=b.getBoundingClientRect();
        showTip(skillTipNodes(turn,i,current,rank,hotkey),{left:rect.left,top:rect.top,bottom:rect.bottom},'tip-skill');
      };
      b.onpointerleave=b.onblur=hideUnit;
      // Sin lanzamientos este turno: la carta se apaga en gris (y lo dice).
      const spent=castsLeft(state,turn,current)<=0;
      const recharge=cooldownLeft(turn,current);
      b.disabled=cost>state.ap||spent;
      b.classList.toggle('spent',spent);
      if(spent)b.append(h('span','ability-spent',recharge?'Recarga '+recharge:'Usado'));
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
  if(!skill||skill[1]>state.ap||castsLeft(state,unit,skill)<=0)return;
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
  // «Nada nuevo»: el servidor solo confirma la versión.
  if(result.same)return result;
  if(result.version)roomVersion=result.version;
  if(!result.state?.players?.every(player=>Array.isArray(player.skillRanks))){
    throw new Error('La versión del servidor no coincide con la del juego.');
  }
  return result;
}
/** Sonido de cada acción del jugador fuera del combate (equipo, tienda, botín, mejora). */
const actionSounds={equip:'equip',unequip:'equip',socket:'equip',unsocket:'equip',buy:'coins',sell:'coins',give:'coins',vote:'page',ready:'door',next:'door'};
async function send(action){
  // La pausa no se pierde si otra acción sigue en camino: se manda en cuanto termine.
  if(busy){if(action.type==='pause')pauseQueued=true;return;}
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
// Con la cuenta iniciada, el personaje se llama como la cuenta.
const profile=()=>({name:account.user?.nick||el('name').value,classId:el('class').value});
el('solo').onclick=()=>{
  if(busy)return;
  generation++;
  rendered='';
  const p=profile();
  const next=create();
  session={id:'local'};
  join(next,session.id,account.user?.nick||p.name,p.classId,{loadouts:Object.fromEntries(Object.keys(classes).map(c=>[c,myLoadout(c)]))});
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
    localStorage.setItem('amber-session',JSON.stringify(session));paintResume(null);
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
  // Avisa al servidor para liberar el hueco en la sala (sin esperar respuesta).
  if(session?.code&&session.key)fetch(session.base+'/api/'+session.code+'/leave',{method:'POST',keepalive:true,
    headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.key},body:'{}'}).catch(()=>{});
  generation++;busy=false;state=null;session=null;selected=null;rendered='';
  roomVersion=0;lastFullSync=0;
  resetAnimation();
  syncViewport();
  hideUnit();
  localStorage.removeItem('amber-session');sessionStorage.removeItem('amber-session');
  editorTest=null;paintEditorReturn();
  error('');render();
};
/**
 * Versión del estado de la sala que ya tenemos. Al consultar se manda: si no ha cambiado nada, el servidor
 * responde «nada nuevo» (unos bytes) en lugar del estado entero. Cada 8 s se pide completo por si acaso.
 */
let roomVersion=0,lastFullSync=0;
async function refresh(){
  if(busy||polling||!session?.code)return;
  const epoch=generation;
  const version=revision;
  polling=true;
  try{
    const full=Date.now()-lastFullSync>8000||!state;
    const result=await request(session.base,'/api/'+session.code+(roomVersion&&!full?'?since='+roomVersion:''),null,session.key);
    if(epoch!==generation||version!==revision)return;
    if(result.same)return;
    lastFullSync=Date.now();
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
// La sesión de la sala se guarda en el navegador: sobrevive a recargar y a cerrarlo.
try{session=JSON.parse(localStorage.getItem('amber-session')||sessionStorage.getItem('amber-session'));}catch{session=null;}
refresh();
setInterval(()=>{
  if(state&&!session.code&&state.deadline!=null&&['combat','reward','map','event','shop','forge'].includes(state.phase)&&Date.now()>=state.deadline){
    const next=structuredClone(state);
    if(tick(next))setState(next);
  }
  render();
},150);
setInterval(refresh,400);


// ───────────── Editor de SFX (solo administradores) ─────────────
const sfxLabels={armor:'Golpe en armadura',arrow:'Disparo de flecha',arrowhit:'Impacto de flecha',blast:'Explosión y fuego',
  cleanse:'Purificar',click:'Clic de interfaz',coins:'Monedas',dash:'Salto y teletransporte',die_hero:'Muerte de héroe',die_monster:'Muerte de monstruo (sin uso)',thud:'Caída de un cuerpo',bones:'Huesos que caen',
  door:'Puerta y cambio de sala',equip:'Equipar objeto',glyph:'Glifo',heal:'Curación',hit:'Golpe recibido',hurt_hero:'Quejido de héroe',levelup:'Subir de nivel',
  loot:'Botín',lose:'Derrota',page:'Página y menú',push:'Empujón y tirón',shield:'Escudo',slash:'Corte',slow:'Ralentizar y hielo',step:'Pasos',
  step_wet:'Pasos en el barro',swing:'Golpe al aire',trap:'Trampa',venom:'Veneno',win:'Victoria',v_bat:'Voz: murciélago',v_beast:'Voz: bestia',
  v_boss:'Voz: jefe',v_ghost:'Voz: espectro',v_imp:'Voz: diablillo',v_plant:'Voz: planta',v_shade:'Voz: vampiro y súcubo',v_skeleton:'Voz: esqueleto',
  v_slime:'Voz: limo',v_worm:'Voz: gusano',amb_crypt:'Ambiente: mazmorra',el_fire:'Elemento: fuego (impacto)',el_ice:'Elemento: hielo (impacto)',el_shadow:'Elemento: caótico (impacto)',el_lightning:'Elemento: rayo (impacto)',arcane:'Hechizo mágico',amb_jungle:'Ambiente: jungla',amb_hell:'Ambiente: infierno'};
// ───────────── Editor de mapas (solo administradores) ─────────────
let editorTest=null,labConfig=null;
const mapEditorApi={
  list:async()=>{
    const response=await fetch(serverBase()+'/api/maps',{signal:AbortSignal.timeout(12000)});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'Error del servidor.');
    return data.maps||[];
  },
  save:map=>accountCall('map-save',{map}),
  remove:id=>accountCall('map-delete',{id}),
  // Laboratorio: combate de prueba con los héroes, habilidades y enemigos elegidos (sin recompensas).
  lab:config=>{
    if(busy)return;
    generation++;rendered='';
    const next=create();
    config.heroes.forEach((hero,i)=>join(next,'lab'+i,classes[hero.classId].name,hero.classId,{}));
    session={id:'lab0'};
    soloAwarded=true;
    labCombat(next,config);
    labConfig=config;editorTest=config.map?.id||'lab';mapEditorApi.current=config.map?.id;
    error('');
    setState(next,true);
    paintEditorReturn();
  },
  // Probar: partida en solitario que empieza directamente en un combate de esa zona con ese mapa (sin recompensas).
  test:map=>{
    if(busy)return;
    generation++;rendered='';
    const p=profile();
    const next=create();
    session={id:'local'};
    join(next,session.id,account.user?.nick||p.name,p.classId,{loadouts:Object.fromEntries(Object.keys(classes).map(c=>[c,myLoadout(c)]))});
    soloAwarded=true;
    testCustomMap(next,map);
    editorTest=map.id;mapEditorApi.current=map.id;
    error('');
    setState(next,true);
    paintEditorReturn();
  }
};
function mapEditorButton(){
  const b=btn('',()=>openMapEditor(mapEditorApi));b.className='ghost';
  b.append(icon('grid'),'Editor de mapas');
  return b;
}
/** Durante una prueba del editor o del laboratorio: reiniciar el combate o volver al editor. */
function paintEditorReturn(){
  let bar=el('editor-return');
  if(!editorTest||!state){bar?.remove();return;}
  if(!bar){
    const back=h('button',null,'⟲ Volver al editor');
    back.onclick=()=>{editorTest=null;labConfig=null;el('leave').onclick();openMapEditor(mapEditorApi);};
    const again=h('button',null,'↻ Reiniciar combate');again.id='lab-restart';
    again.onclick=()=>{if(labConfig)mapEditorApi.lab(structuredClone(labConfig));};
    bar=h('div','editor-return',h('b',null,'Laboratorio'),again,back);bar.id='editor-return';
    document.body.append(bar);
  }
  el('lab-restart').hidden=!labConfig;
}
function sfxEditorButton(){
  const b=btn('',()=>openSfxEditor());b.className='ghost';
  b.append(icon('sound'),'Editor de SFX');
  return b;
}
let sfxDraft={},sfxFilter='';
const sfxDialog=el('sfx-editor');
sfxDialog.addEventListener('close',()=>{sfx.stopPreview();sfx.setMix(savedMix);});
async function openSfxEditor(){
  const bank=await sfx.bank();
  sfxDraft=structuredClone(savedMix);
  sfxDialog.showModal();
  renderSfxEditor(bank);
}
function renderSfxEditor(bank){
  const keys=Object.keys(bank).sort((a,b)=>(sfxLabels[a]||a).localeCompare(sfxLabels[b]||b,'es'));
  const apply=()=>sfx.setMix(sfxDraft);
  const entry=key=>sfxDraft[key]||(sfxDraft[key]={});
  const tidy=key=>{const e=sfxDraft[key];if(!e)return;
    if(e.volume===1)delete e.volume;if(e.pitch===1)delete e.pitch;if(!e.from)delete e.from;if(!e.off?.length)delete e.off;
    if(!Object.keys(e).length)delete sfxDraft[key];};
  const slider=(label,min,max,value,format,onInput)=>{
    const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=5;input.value=value;input.style.setProperty('--min',min);input.style.setProperty('--max',max);input.style.setProperty('--v',value);input.addEventListener('input',()=>input.style.setProperty('--v',input.value));
    const out=h('output',null,format(value));
    input.oninput=()=>{out.textContent=format(+input.value);onInput(+input.value);};
    return h('label','sfx-slider',h('span',null,label),input,out);
  };
  const row=key=>{
    const e=sfxDraft[key]||{};
    const ambience=key.startsWith('amb_');
    const src=e.from&&bank[e.from]?e.from:key;
    const customs=e.files||[];
    const variants=ambience||customs.length?[]:Array.from({length:bank[src]},(_,i)=>i+1).map(n=>{
      const on=!(e.off||[]).includes(n);
      const play=btn('▶',()=>sfx.preview(key,{file:src+'_'+n,volume:e.volume??1,rate:e.pitch??1,exact:true}));
      play.className='sfx-play';play.title='Escuchar la variante '+n;
      const box=document.createElement('input');box.type='checkbox';box.checked=on;box.title=on?'Activa: desmarca para no usarla':'Desactivada';
      box.onchange=()=>{const en=entry(key);const off=new Set(en.off||[]);box.checked?off.delete(n):off.add(n);en.off=[...off].sort((a,b)=>a-b);tidy(key);apply();renderSfxEditor(bank);};
      return h('span','sfx-variant'+(on?'':' off'),play,h('label',null,box,' '+n));
    });
    const uploaded=customs.map(f=>{
      const play=btn('▶',()=>sfx.preview(key,{file:sfx.customUrl(f.id),volume:e.volume??1,rate:e.pitch??1,exact:true}));play.className='sfx-play';
      const del=btn('✕',async()=>{if(!confirm('¿Borrar «'+f.name+'»? No se puede deshacer.'))return;
        try{const d=await accountCall('sfx-delete',{key,id:f.id});savedMix=d.mix;Object.assign(sfxDraft,{[key]:{...(sfxDraft[key]||{}),files:d.mix[key]?.files}});tidy(key);apply();renderSfxEditor(bank);}catch(err){alert(err.message);}});
      del.className='sfx-play danger';del.title='Borrar este sonido';
      return h('span','sfx-variant custom',play,h('span',null,f.name),del);
    });
    const file=document.createElement('input');file.type='file';file.accept='audio/ogg,audio/mpeg,audio/wav,audio/webm,.ogg,.mp3,.wav,.webm';file.hidden=true;
    file.onchange=async()=>{
      const f=file.files[0];if(!f)return;
      const type=f.type||({ogg:'audio/ogg',mp3:'audio/mpeg',wav:'audio/wav',webm:'audio/webm'})[f.name.split('.').pop().toLowerCase()]||'';
      if(f.size>450*1024){alert('El archivo pesa '+Math.round(f.size/1024)+' KB; el máximo es 450 KB. Recórtalo o pásalo a OGG/MP3.');return;}
      const data=await new Promise((ok,ko)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]);r.onerror=ko;r.readAsDataURL(f);});
      try{const d=await accountCall('sfx-upload',{key,name:f.name.replace(/\.[^.]+$/,''),type,data});savedMix=d.mix;
        sfxDraft[key]={...(sfxDraft[key]||{}),files:d.mix[key]?.files};apply();renderSfxEditor(bank);}
      catch(err){alert(err.message);}
    };
    const upload=btn('',()=>file.click());upload.className='ghost';upload.append(icon('plus'),'Subir sonido');
    const from=document.createElement('select');
    from.append(new Option('Sus propios sonidos',''),...keys.filter(k=>k!==key&&k.startsWith('amb_')===ambience).map(k=>new Option(sfxLabels[k]||k,k)));
    from.value=e.from||'';
    from.onchange=()=>{const en=entry(key);en.from=from.value||undefined;delete en.off;tidy(key);apply();renderSfxEditor(bank);};
    const test=btn('',()=>sfx.preview(key));test.className='primary sfx-test';test.append(icon('play'),'Probar');
    const reset=btn('Restablecer',()=>{const files=sfxDraft[key]?.files;if(files)sfxDraft[key]={files};else delete sfxDraft[key];apply();renderSfxEditor(bank);});reset.className='ghost';reset.disabled=!sfxDraft[key]||Object.keys(sfxDraft[key]).join()==='files';
    return h('div','sfx-row'+(sfxDraft[key]?' changed':''),
      h('div','sfx-name',h('strong',null,sfxLabels[key]||key),h('code',null,key)),
      h('div','sfx-controls',
        slider('Volumen',0,200,Math.round((e.volume??1)*100),v=>v+' %',v=>{entry(key).volume=v/100;tidy(key);apply();}),
        slider('Tono',50,200,Math.round((e.pitch??1)*100),v=>v+' %',v=>{entry(key).pitch=v/100;tidy(key);apply();}),
        h('label','sfx-from',h('span',null,'Usar'),from)),
      h('div','sfx-variants',...variants,...uploaded,
        customs.length?h('small','hint','Usa tus sonidos subidos en lugar de los originales.'):null),
      h('div','sfx-actions',test,upload,file,reset));
  };
  const search=document.createElement('input');search.type='search';search.placeholder='Buscar sonido…';search.value=sfxFilter;
  search.oninput=()=>{sfxFilter=search.value;const pos=search.selectionStart;renderSfxEditor(bank);const again=sfxDialog.querySelector('input[type=search]');again.focus();again.setSelectionRange(pos,pos);};
  const q=sfxFilter.trim().toLowerCase();
  const shown=keys.filter(k=>!q||k.includes(q)||(sfxLabels[k]||'').toLowerCase().includes(q));
  const status=h('span','sfx-status');
  const save=btn('',async()=>{
    save.disabled=true;status.textContent='Guardando…';
    try{const d=await accountCall('sfx-mix',{mix:sfxDraft});savedMix=d.mix;sfxDraft=structuredClone(savedMix);sfx.setMix(savedMix);status.textContent='Guardado para todos los jugadores.';}
    catch(err){status.textContent=err.message;}
    finally{save.disabled=false;}
  });
  save.className='primary';save.append(icon('check'),'Guardar para todos');
  const resetAll=btn('Restablecer ajustes',()=>{sfxDraft=Object.fromEntries(Object.entries(sfxDraft).filter(([,e])=>e.files?.length).map(([k,e])=>[k,{files:e.files}]));apply();renderSfxEditor(bank);});resetAll.title='Vuelve a los valores originales (los sonidos subidos se mantienen)';resetAll.className='ghost';
  const close=btn('Cerrar',()=>sfxDialog.close());close.className='ghost';
  const changed=Object.keys(sfxDraft).length;
  sfxDialog.replaceChildren(
    h('header','sfx-head',Object.assign(h('h2',null,icon('sound'),'Editor de SFX'),{id:'sfx-editor-title'}),
      h('p','hint','Ajusta volumen y tono, usa los sonidos de otra categoría, desmarca variantes que no encajen o sube tus propios archivos (OGG, MP3 o WAV, máx. 450 KB). Los cambios suenan al momento; «Guardar» los aplica a todos los jugadores.'),
      h('div','sfx-toolbar',search,h('span','chip',changed+' modificados'),resetAll,save,close),status),
    h('div','sfx-list',...shown.map(row)));
}
