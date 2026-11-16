import { classes, create, join, act, tick, reachable } from './engine.js';
const el = id => document.getElementById(id);
let state, session, selected = null, busy = false, generation = 0;
let rendered = '';
const onPages = location.hostname.endsWith('.github.io');
el('server').value = localStorage.getItem('amber-server') || (onPages ? '' : location.origin);
const distance = (a,b) => Math.abs(a%8-b%8)+Math.abs((a>>3)-(b>>3));
const error = message => { el('error').textContent=message; };
const button = (label, click, pressed) => {
  const b = document.createElement('button');
  b.textContent=label;
  b.onclick=click;
  if (pressed !== undefined) b.setAttribute('aria-pressed',pressed);
  return b;
};
function list(key, values) {
  el(key).replaceChildren(...values.map(([text,current]) => {
    const li=document.createElement('li');
    li.textContent=text;
    li.classList.toggle('current',!!current);
    return li;
  }));
}
function render() {
  el('entry').hidden=!!state;
  el('game').hidden=!state;
  if (!state) return;
  const turn=state.units[state.turn];
  const mine=state.phase==='combat' && turn?.id===session.id;
  const seconds=Math.max(0,Math.ceil((state.deadline-Date.now())/1000));
  const title={lobby:'Sala de expedición',combat:'Piso '+state.floor+' · '+turn?.name+(mine?' (tú)':''),reward:'Elige una mejora',won:'Expedición completada',lost:'El grupo ha caído'}[state.phase];
  el('phase').textContent=title+((mine||state.phase==='reward')?' · '+seconds+' s':'');
  const signature=JSON.stringify([state,selected]);
  if (signature===rendered) return;
  rendered=signature;
  el('room').textContent=session.code?'Sala '+session.code:'En solitario';
  const host=state.players[0].id===session.id;
  list('turns',state.units.length ? state.units.map(u=>[u.name+' · '+u.hp+'/'+u.max+' PV',u===turn&&state.phase==='combat']) : state.players.map(p=>[p.name+' · '+classes[p.classId].name]));
  list('log',state.log.map(entry=>[entry]));
  const controls=el('controls');
  const board=el('board');
  controls.replaceChildren();
  board.replaceChildren();
  if (state.phase==='lobby') {
    if(host) controls.append(button('Iniciar expedición',()=>send({type:'start'})));
    return;
  }
  if (state.phase==='reward' && !state.picks.includes(session.id)) {
    controls.append(button('+1 potencia',()=>send({type:'reward',choice:'power'})),button('+5 PV máximos',()=>send({type:'reward',choice:'health'})));
  }
  if (['won','lost'].includes(state.phase)&&host) controls.append(button('Volver a la sala',()=>send({type:'restart'})));
  const walking=mine&&selected===null ? reachable(state,turn,state.mp) : new Map();
  const skill=mine&&selected!==null ? classes[turn.classId].skills[selected] : null;
  if (mine) {
    const stats=document.createElement('p');
    stats.textContent=state.ap+' PA · '+state.mp+' PM';
    controls.append(stats,button('Mover',()=>{selected=null;render();},selected===null));
    classes[turn.classId].skills.forEach(([name,cost, ,min,max,kind],i)=>{
      const b=button(name+' · '+cost+' PA · '+(min+turn.bonus)+'–'+(max+turn.bonus)+(kind==='heal'?' cura':' daño'),()=>{selected=selected===i?null:i;render();},selected===i);
      b.disabled=cost>state.ap;
      controls.append(b);
    });
    controls.append(button('Terminar turno',()=>send({type:'end'})));
  }
  const fragment=document.createDocumentFragment();
  for(let pos=0;pos<64;pos++){
    const unit=state.units.find(u=>u.hp>0&&u.pos===pos);
    const wall=state.walls.includes(pos);
    const aim=skill&&unit&&!!unit.enemy!==(skill[5]==='heal')&&distance(turn.pos,pos)<=skill[2]&&state.ap>=skill[1];
    const canWalk=walking.has(pos);
    const cell=button(wall?'▧':unit?(unit.boss?'♛':unit.enemy?'◆':'♟'):'',()=>{
      if(canWalk) send({type:'move',pos});
      if(aim) send({type:'skill',pos,skill:selected});
    });
    cell.className=['cell',wall&&'wall',unit&&(unit.enemy?'enemy':'ally'),canWalk&&'walk',aim&&'aim',state.mark?.includes(pos)&&'danger'].filter(Boolean).join(' ');
    cell.setAttribute('aria-label',(unit?.name || (wall?'Muro':'Casilla'))+' '+(pos%8+1)+', '+((pos>>3)+1));
    if(unit){
      cell.title=unit.name+' · '+unit.hp+'/'+unit.max+' PV';
      const hp=document.createElement('small');
      hp.className='unit-hp';
      hp.textContent=unit.hp;
      cell.append(hp);
    }
    fragment.append(cell);
  }
  board.append(fragment);
}
async function request(base,path,body,key){
  const response=await fetch(base+path,{
    method:body?'POST':'GET',
    headers:{...(body?{'Content-Type':'application/json'}:{}),...(key?{Authorization:'Bearer '+key}:{})},
    body:body?JSON.stringify(body):undefined,
    signal:AbortSignal.timeout(5000)
  });
  const result=await response.json();
  if(!response.ok) throw new Error(result.error);
  return result;
}
async function send(action){
  if(busy)return;
  const epoch=generation;
  busy=true;
  try{
    if(session.code) {
      const result=await request(session.base,'/api/'+session.code+'/action',action,session.key);
      if(epoch!==generation)return;
      state=result.state;
    } else act(state,session.id,action);
    selected=null;
    error('');
    render();
  }catch(e){if(epoch===generation)error(e.message);}
  finally{if(epoch===generation)busy=false;}
}
const profile=()=>({name:el('name').value,classId:el('class').value});
el('solo').onclick=()=>{
  if(busy)return;
  const p=profile();
  state=create();
  session={id:'local'};
  join(state,session.id,p.name,p.classId);
  act(state,session.id,{type:'start'});
  error('');
  render();
};
async function enter(creating){
  if(busy)return;
  busy=true;
  try{
    const base=new URL(el('server').value).origin;
    const code=el('code').value.trim().toUpperCase();
    if(!creating&&!/^[A-F0-9]{6}$/.test(code))throw new Error('Introduce el código de seis caracteres.');
    const result=await request(base,creating?'/api/rooms':'/api/'+code+'/join',profile());
    session={base,code:result.code,key:result.key,id:result.id};
    sessionStorage.setItem('amber-session',JSON.stringify(session));
    localStorage.setItem('amber-server',base);
    state=result.state;
    error('');
    render();
  }catch(e){error(e.message);}
  finally{busy=false;}
}
el('create').onclick=()=>enter(true);
el('join').onclick=()=>enter(false);
el('leave').onclick=()=>{
  generation++; busy=false; state=null; session=null; selected=null; rendered='';
  sessionStorage.removeItem('amber-session');
  error(''); render();
};
async function refresh(){
  if(busy||!session?.code)return;
  const epoch=generation;
  busy=true;
  try{
    const result=await request(session.base,'/api/'+session.code,null,session.key);
    if(epoch!==generation)return;
    if(state?.turn!==result.state.turn||state?.floor!==result.state.floor)selected=null;
    state=result.state;
    error('');
    render();
  }catch(e){if(epoch===generation)error('No se pudo sincronizar la sala. '+e.message);}
  finally{if(epoch===generation)busy=false;}
}
try{session=JSON.parse(sessionStorage.getItem('amber-session'));}catch{session=null;}
refresh();
setInterval(()=>{if(state&&!session.code&&tick(state))selected=null;render();},200);
setInterval(refresh,650);
