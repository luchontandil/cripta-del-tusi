import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {server} from './server.js';
import {actBiomes,maxBonusText,runPoints,playerColors,masteryCost,enemyScaling,rollItem,makeRoute,create,join,act,tick,encounter,paths,lineOfSight,hasRange,inRange,spellArea,classes,planEnemy,onBoard,slots,damagePreview,skillFor,trainingChoices,trainingOffer,glyphCells,glyphPower,distance,damageBonus,damagePercent,skillSchool,monsterTraits,monsterVariants,monsterExtraSkills,forgeCost,forgeModes,socketsOf,runesOf,BASE_AP,BASE_MP,READY_TIME,shopRerollCost} from './engine.js';

const rng=()=>.3;
function battle(...classes) {
  const s=create();
  classes.forEach((kind,i)=>join(s,'p'+i,'Jugador '+i,kind));
  act(s,'p0',{type:'start'},rng);
  enterCombat(s);
  // Enemigos «neutros» para las pruebas de daño exacto: sin resistencias ni variantes.
  for(const u of s.units.filter(u=>u.enemy&&!u.boss)){
    const fresh=monsterTraits[u.look]||{};
    if(u.variant){u.variant=null;u.drain=u.hamstring=false;u.lifesteal=0;}
    u.resist={};
    u.stats.ward=(fresh.ward||0)+(u.elite?2:0);u.stats.movement=fresh.movement||0;
  }
  return s;
}
/** Vota en el mapa un nodo de combate normal para entrar a pelear. */
function enterCombat(s,r=rng){
  for(let i=0;i<8&&s.phase!=='combat';i++){
    if(s.phase==='map'){
      const option=Math.max(0,s.vote.options.findIndex(id=>s.route.rows.flat().find(n=>n.id===id).kind==='combat'));
      for(const p of s.players)if(s.phase==='map')act(s,p.id,{type:'vote',option},r);
    }else if(s.phase==='event'){
      for(const p of s.players)if(s.phase==='event')act(s,p.id,{type:'vote',option:0},r);
    }
  }
  if(s.phase==='combat'){s.water=[];s.traps=[];}
}
function timeout(s) {
  s.deadline=0;
  tick(s,rng);
}
test('valida turno, ruta, puntos, visibilidad y escalado',()=>{
  const s=battle('tirador','guardia');
  const [archer]=s.units;
  assert.throws(()=>act(s,'p1',{type:'end'}),/turno/);
  assert.throws(()=>act(s,'p0',{type:'move',pos:-1}),/alcance/);
  const to=archer.pos-3;
  assert.deepEqual(paths(s,archer,3).get(to),[to+2,to+1,to]);
  act(s,'p0',{type:'move',pos:to});
  assert.deepEqual(s.events.at(-1).path,[to+2,to+1,to]);
  assert.equal(s.mp,0);
  const enemy=s.units.find(u=>u.enemy);
  enemy.pos=to-3;
  s.walls=[to-1];
  assert.equal(lineOfSight(s,to,enemy.pos),false);
  assert.equal(hasRange(s,archer,enemy.pos,classes.tirador.skills[0]),true);
  assert.equal(inRange(s,archer,enemy.pos,classes.tirador.skills[0]),false);
  assert.throws(()=>act(s,'p0',{type:'skill',skill:0,pos:enemy.pos}),/visión/);
  assert.equal(s.ap,6);
  s.walls=[];
  act(s,'p0',{type:'skill',skill:0,pos:enemy.pos},rng);
  s.ap=1;
  assert.throws(()=>act(s,'p0',{type:'skill',skill:2,pos:enemy.pos}),/puntos/);
  assert.ok(encounter(3,4).length>encounter(3,1).length);
  assert.ok(encounter(5,1)[0].hp>encounter(1,1)[0].hp);
  assert.ok(encounter(1,2)[0].hp>=20&&encounter(1,2)[0].damage>=4);
  assert.ok(encounter(1,1)[0].hp<encounter(1,2)[0].hp);
});
test('la vulnerabilidad se aplica a otro atacante y el clérigo cura a un aliado',()=>{
  const s=battle('tirador','mistico');
  const archer=s.units.find(u=>u.id==='p0');
  const cleric=s.units.find(u=>u.id==='p1');
  const enemy=s.units.find(u=>u.enemy);
  s.walls=[];
  archer.pos=30;
  cleric.pos=19;
  enemy.pos=34;
  enemy.hp=80;
  archer.hp=16;
  act(s,'p0',{type:'skill',skill:2,pos:34},rng);
  act(s,'p0',{type:'end'},rng);
  const hp=enemy.hp;
  act(s,'p1',{type:'skill',skill:0,pos:34},rng);
  assert.equal(hp-enemy.hp,9);
  act(s,'p1',{type:'skill',skill:1,pos:30},rng);
  assert.equal(archer.hp,23);
});
test('el jefe anuncia un glifo amplio y, al activarla en su turno, las cadenas dañan y restan PM',()=>{
  const s=battle('tirador');
  s.route=makeRoute(rng,1);
  s.floor=7;
  s.phase='reward';
  s.picks=['p0'];
  act(s,'p0',{type:'next'},rng);
  enterCombat(s);
  assert.equal(s.units.find(u=>u.boss).look,'umbralking');
  const boss=s.units[s.turn];
  assert.equal(boss.boss,true);
  timeout(s);
  assert.equal(s.glyphs.length,1);
  const glyph=s.glyphs[0];
  assert.equal(glyph.kind,'slow');
  assert.ok(glyph.warn);
  const center=glyph.cells[0];
  // Rombo de radio 2 recortado por muros y líquidos.
  assert.ok(glyph.cells.length>5);
  assert.ok(glyph.cells.every(pos=>distance(s,center,pos)<=2&&!s.walls.includes(pos)));
  const hero=s.units.find(u=>u.id==='p0');
  hero.pos=center;
  const before=hero.hp;
  for(let i=0;i<16&&s.glyphs.some(g=>g.warn);i++)timeout(s);
  assert.ok(hero.hp<before);
  while(s.units[s.turn]===boss&&s.enemyPlan)timeout(s);
  assert.equal(s.glyphs.every(g=>!g.warn),true);
  assert.equal(s.units[s.turn],hero);
  assert.equal(s.mp,1);
});
test('genera botín con afijos y permite equipar y engarzar runas permanentes',()=>{
  const s=battle('tirador');
  const hero=s.units[s.turn];
  const enemy=s.units.find(u=>u.enemy);
  enemy.hp=1;
  enemy.pos=hero.pos-3;
  s.walls=[];
  let index=0;
  const random=()=>[.3,.3,.9,.1,.8,.2,.4,.7,.03,.6][index++%10];
  act(s,'p0',{type:'skill',skill:0,pos:enemy.pos},random);
  assert.equal(s.phase,'reward');
  const p=s.players[0];
  const available=[...s.offers.p0,...s.stock];
  const gear=available.find(u=>u.kind==='gear');
  assert.ok(Object.keys(gear.stats).length);
  if(s.offers.p0.includes(gear))act(s,'p0',{type:'reward',item:gear.id},rng);
  else {act(s,'p0',{type:'reward',item:null},rng);p.gold=200;act(s,'p0',{type:'buy',item:gear.id},rng);}
  assert.throws(()=>act(s,'p0',{type:'equip',item:gear.id,slot:gear.slot==='weapon'?'armor':'weapon'},rng),/ranura/);
  act(s,'p0',{type:'equip',item:gear.id,slot:gear.slot},rng);
  act(s,'p0',{type:'unequip',slot:gear.slot},rng);
  assert.ok(p.bag.includes(gear));
  act(s,'p0',{type:'equip',item:gear.id},rng);
  // Un hueco: se engarza una runa y ya no cabe otra (son permanentes).
  gear.sockets=1;gear.runes=[];
  const rune={kind:'rune',id:999,stats:{power:2},price:10};
  p.bag.push(rune);
  act(s,'p0',{type:'socket',item:rune.id,slot:gear.slot},rng);
  assert.deepEqual(p.equipment[gear.slot].runes,[rune]);
  // Las runas son permanentes: ni se extraen ni se reemplazan.
  assert.throws(()=>act(s,'p0',{type:'unsocket',slot:gear.slot},rng),/permanentes/);
  const other={kind:'rune',id:998,stats:{power:1},price:10};
  p.bag.push(other);
  assert.throws(()=>act(s,'p0',{type:'socket',item:other.id,slot:gear.slot},rng),/permanente/);
  assert.deepEqual(p.equipment[gear.slot].runes,[rune]);
  assert.throws(()=>act(s,'p0',{type:'sell',item:other.id},rng),/tienda/);
  assert.equal(s.stock.length,0);
  assert.throws(()=>act(s,'p0',{type:'next'},rng),/habilidades/);
  const offer=trainingOffer(p);
  assert.equal(offer.length,3);
  assert.equal(offer.filter(o=>o.rank>0).length,2,'dos para mejorar');
  assert.equal(offer.filter(o=>o.rank===0).length,1,'una nueva');
  const outside=trainingChoices(p).find(o=>!offer.some(c=>c.index===o.index));
  if(outside)assert.throws(()=>act(s,'p0',{type:'train',skill:outside.index},rng),/cartas/);
  const newSpell=offer.find(option=>option.rank===0);
  act(s,'p0',{type:'train',skill:newSpell.index},rng);
  assert.throws(()=>act(s,'p0',{type:'train',skill:0},rng),/pendiente/);
  act(s,'p0',{type:'next'},rng);
  enterCombat(s);
  assert.equal(s.floor,2);
  assert.equal(p.level,2);
  const raised=s.units.find(u=>u.id==='p0');
  assert.ok(raised.max>=hero.max+4);
  assert.ok(raised.stats.physical>=1);
  assert.ok(skillFor(raised,newSpell.index));
});
test('la vista previa aplica el crítico ×1,5 y la armadura frena las habilidades físicas',()=>{
  const s=battle('guardia');
  const hero=s.units[0], foe=s.units[1];
  // +20 % de daño físico contra un 30 % de armadura: (base × 1,2) × 0,7.
  hero.stats.physical=20;
  foe.stats.ward=30;foe.resist={};
  const [,,,lo,hi]=classes.guardia.skills[0];
  const net=(b,crit=1)=>Math.round(Math.floor(b*1.2)*crit*.7);
  assert.deepEqual(damagePreview(hero,foe,classes.guardia.skills[0]),{element:'physical',normal:[net(lo),net(hi)],critical:[net(lo,1.5),net(hi,1.5)],chance:.12});
  // Golpe de brasas es físico aunque sea de fuego: suma el daño físico (no el de fuego) y la armadura lo frena.
  hero.stats.fire=50;
  const embers=classes.guardia.skills.at(-1);
  assert.deepEqual(damagePreview(hero,foe,embers).normal,[net(embers[3]),net(embers[4])]);
});
test('la IA avanza hacia el rival aunque un aliado cierre el único paso',()=>{
  const s=battle('tirador');
  const hero=s.units[0], foe=s.units[1];
  hero.pos=7;
  foe.pos=1;
  s.height=1;
  s.walls=[];
  s.units.push({...foe,id:'ally',pos:5});
  s.mp=3;
  assert.deepEqual(planEnemy(s,foe,[hero]),[2,3,4]);
});
test('el generador solo ofrece PM en botas y PA en amuletos y armas elegibles',()=>{
  const seen=new Set();
  for(let seed=1;seed<=120;seed++){
    let value=seed*Math.imul(seed,2654435761);
    const rand=()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};
    const s=battle('guardia');
    const hero=s.units[0], foe=s.units[1];
    foe.pos=hero.pos-1;
    foe.hp=1;
    s.floor=4;
    act(s,'p0',{type:'skill',skill:0,pos:foe.pos},rand);
    for(const item of [...s.offers.p0,...s.stock]){
      if(item.stats.movement){assert.equal(item.slot,'boots');seen.add('PM');}
      if(item.stats.action){
        assert.ok(item.slot==='amulet'||(item.slot==='weapon'&&['Cetro de ónice','Lanza de vigía'].includes(item.base)));
        seen.add('PA');
      }
    }
  }
  assert.equal(seen.size,2);
});
test('la IA rodea un muro y publica el trayecto antes de atacar',()=>{
  const s=battle('tirador');
  const hero=s.units[0], foe=s.units[1];
  hero.pos=17;
  foe.pos=13;
  foe.look='slime';foe.stats.movement=0;
  s.walls=[2,3,4,14,15,16,26,27,28];
  act(s,'p0',{type:'end'},rng);
  const route=planEnemy(s,foe,[hero]);
  assert.deepEqual(route,[25,37,38]);
  const hp=hero.hp;
  timeout(s);
  assert.equal(s.units[s.turn],foe);
  assert.equal(hero.hp,hp);
  assert.deepEqual(s.events.at(-1).path,route);
  timeout(s);
  assert.equal(s.units[s.turn],hero);
});
test('el Mago puede lanzar a una casilla vacía y dañar a dos enemigos en cruz',()=>{
  const s=battle('mago','guardia');
  const mage=s.units.find(u=>u.id==='p0');
  const ally=s.units.find(u=>u.id==='p1');
  const [first,second]=s.units.filter(u=>u.enemy);
  const skill=classes.mago.skills[1];
  s.walls=[];
  mage.pos=29;
  ally.pos=45;
  first.pos=34;
  second.pos=47;
  const center=33;
  assert.equal(inRange(s,mage,center,skill),true);
  assert.ok(spellArea(s,center,skill).includes(first.pos));
  assert.ok(spellArea(s,center,skill).includes(second.pos));
  act(s,'p0',{type:'skill',skill:1,pos:center},rng);
  assert.equal(s.ap,3);
  // Bola de fuego 5–8, y los dos están a una casilla del centro: 80 % del daño.
  assert.equal(first.max-first.hp,4);
  assert.equal(second.max-second.hp,4);
  assert.equal(ally.hp,ally.max);
  assert.deepEqual(s.events.find(event=>event.kind==='spell').area,spellArea(s,center,skill));
});
test('los pisos alternan diseños y todas las casillas libres están conectadas',()=>{
  const names=new Set();
  const shapes=new Set();
  for(let size=1;size<=4;size++){
    const s=battle(...Array(size).fill('tirador'));
    const dimensions=new Set();
    for(let floor=1;floor<=6;floor++){
      names.add(s.layoutName);
      shapes.add(s.shape);
      dimensions.add(s.width+'×'+s.height);
      assert.equal(s.floor===1,s.voids.length===0);
      const start=Array.from({length:s.width*s.height},(_,i)=>i).find(i=>onBoard(s,i)&&!s.walls.includes(i));
      assert.equal(paths({...s,units:[]},{pos:start},s.width*s.height).size,s.width*s.height-s.walls.length-s.voids.length-s.water.length-1);
      assert.equal(new Set(s.units.map(u=>u.pos)).size,s.units.length);
      assert.ok(s.units.every(u=>onBoard(s,u.pos)&&!s.walls.includes(u.pos)));
      const heroes=s.units.filter(u=>!u.enemy);
      const enemies=s.units.filter(u=>u.enemy);
      assert.ok(Math.min(...heroes.map(u=>u.pos%s.width))>Math.max(...enemies.map(u=>u.pos%s.width)));
      if(floor===6)break;
      const previous=s.layoutName;
      const previousSize=[s.width,s.height];
      s.phase='reward';
      s.picks=s.players.map(p=>p.id);
      const varied=()=>((size*17+floor*13)%97)/97;
      act(s,'p0',{type:'next'},varied);
      enterCombat(s,varied);
      assert.notEqual(s.layoutName,previous);
      assert.notDeepEqual([s.width,s.height],previousSize);
    }
    assert.ok(dimensions.size>=2);
  }
  assert.ok(names.size>=4);
  assert.ok(shapes.size>=4);
});
test('el botín se puede equipar al elegirlo y devuelve la pieza anterior a la mochila',()=>{
  const s=battle('guardia');
  const p=s.players[0];
  const old={id:500,slot:'gloves',kind:'gear',stats:{power:1}};
  const item={id:501,slot:'gloves',kind:'gear',stats:{power:2}};
  assert.equal(Object.keys(slots).length,8,'sin talismán');
  p.equipment.gloves=old;
  s.phase='reward';
  s.offers.p0=[item];
  act(s,'p0',{type:'reward',item:item.id,equip:true},rng);
  assert.equal(p.equipment.gloves,item);
  assert.deepEqual(p.bag,[old]);
  assert.deepEqual(s.picks,['p0']);
});
test('la victoria conserva el daño crítico del último golpe y amplía el tiempo para elegir botín',()=>{
  const s=battle('guardia');
  const hero=s.units.find(u=>!u.enemy);
  const enemy=s.units.find(u=>u.enemy);
  enemy.pos=hero.pos-1;
  enemy.hp=9;
  act(s,'p0',{type:'skill',skill:0,pos:enemy.pos},()=>.01);
  assert.equal(s.phase,'reward');
  assert.equal(s.events.at(-1).kind,'damage');
  assert.equal(s.events.at(-1).amount,9);
  assert.equal(s.events.at(-1).critical,true);
  assert.equal(s.deadline-s.turnStarted,62500);
});
test('dos clientes reciben la misma trayectoria completa y el cambio de turno', {timeout:10000}, async t=>{
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  t.after(()=>server.close());
  const base='http://127.0.0.1:'+server.address().port;
  assert.match(await (await fetch(base)).text(),/Cripta del tusi/);
  assert.equal((await fetch(base+'/art.js')).status,200);
  assert.equal((await fetch(base+'/music.js')).status,200);
  for(const file of ['isometric.js','models3d.js','three.module.js','three.core.js']){
    assert.match((await fetch(base+'/'+file)).headers.get('content-type'),/^text\/javascript/);
  }
  async function request(path,body,key){
    const response=await fetch(base+path,{
      method:body?'POST':'GET',
      headers:{'Content-Type':'application/json',...(key?{Authorization:'Bearer '+key}:{})},
      body:body?JSON.stringify(body):undefined
    });
    return {status:response.status,...await response.json()};
  }
  const host=await request('/api/rooms',{name:'Uno',classId:'tirador'});
  assert.equal(host.status,200);
  const path='/api/'+host.code;
  const peer=await request(path+'/join',{name:'Dos',classId:'mistico'});
  assert.equal(peer.status,200);
  assert.equal((await request(path)).status,401);
  assert.equal((await request(path+'/action',{type:'start'},peer.key)).status,400);
  const map=await request(path+'/action',{type:'start'},host.key);
  assert.equal(map.state.phase,'map');
  assert.equal(map.state.deadline,null);
  const option=map.state.vote.options.findIndex(id=>map.state.route.rows[0].find(n=>n.id===id).kind==='combat');
  assert.equal((await request(path+'/action',{type:'vote',option},host.key)).state.phase,'map');
  const started=await request(path+'/action',{type:'vote',option},peer.key);
  assert.equal(started.state.phase,'combat');
  const me=started.state.units.find(u=>u.id===host.id);
  // Un destino a 2 pasos que de verdad sea alcanzable (el mapa es aleatorio).
  const [goal,route]=[...paths(started.state,me,2)].find(([,r])=>r.length===2&&!started.state.traps?.some(t=>r.includes(t.pos)));
  const moved=await request(path+'/action',{type:'move',pos:goal},host.key);
  const next=await request(path,null,peer.key);
  const event=next.state.events.find(e=>e.kind==='move');
  assert.deepEqual(event.path,route);
  assert.deepEqual(event,moved.state.events.at(-1));
  assert.equal(next.state.mp,1);
  assert.ok(!JSON.stringify(next).includes(host.key));
  assert.equal((await request(path+'/action',{type:'end'},host.key)).status,200);
  const active=await request(path,null,peer.key);
  assert.equal(active.state.units[active.state.turn].id,peer.id);
});

test('cada acto tiene 8 pisos, jefes en 4 y 8, sin élites al principio y todos los nodos alcanzables',()=>{
  for(let seed=1;seed<30;seed++){
    let x=seed;const random=()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);
    for(const actNumber of [1,2,3]){
      const route=makeRoute(random,actNumber);
      assert.equal(route.rows.length,8);
      assert.equal(route.rows[3][0].kind,'boss');
      assert.equal(route.rows[7][0].kind,'boss');
      assert.ok(route.rows[0].concat(route.rows[1]).every(n=>n.kind!=='elite'));
      for(let r=1;r<8;r++)for(const node of route.rows[r])assert.ok(route.rows[r-1].some(prev=>prev.next.includes(node.id)));
      for(let r=0;r<7;r++)for(const node of route.rows[r])assert.ok(node.next.length>0);
    }
  }
});
test('los eventos se votan, el empate lo decide el anfitrión y aplican efectos al próximo combate',()=>{
  const s=create();
  join(s,'p0','Uno','guardia');join(s,'p1','Dos','mago');
  act(s,'p0',{type:'start'},rng);
  s.route.rows[0]=[{id:'1-0',floor:1,kind:'event',x:.27,next:s.route.rows[1].map(n=>n.id)},{id:'1-1',floor:1,kind:'combat',x:.73,next:s.route.rows[1].map(n=>n.id)}];
  s.vote.options=['1-0','1-1'];
  act(s,'p1',{type:'vote',option:1},rng);
  assert.equal(s.phase,'map');
  act(s,'p0',{type:'vote',option:0},rng);
  assert.equal(s.phase,'event');
  assert.equal(s.floor,1);
  s.event=null;
  s.event={id:'camp',title:'',text:'',options:[{},{}]};
  s.vote={kind:'event',options:[0,1],votes:{}};
  act(s,'p0',{type:'vote',option:1},rng);
  act(s,'p1',{type:'vote',option:1},rng);
  assert.equal(s.pending.ap,1);
  assert.equal(s.pending.mp,1);
  assert.equal(s.phase,'map');
  enterCombat(s);
  const hero=s.units.find(u=>u.id===s.units[s.turn].id&&!u.enemy)||s.units.find(u=>!u.enemy);
  assert.equal(s.mods.ap,1);
  if(!s.units[s.turn].enemy)assert.equal(s.ap,7+(s.units[s.turn].stats.action||0));
  assert.ok(hero.hp<=Math.ceil(hero.max*.8));
});
test('mapa, eventos, tienda y forja: sin reloj hasta que la mitad del grupo está lista',()=>{
  const s=create();
  join(s,'p0','Uno','guardia');join(s,'p1','Dos','mago');join(s,'p2','Tres','tirador');
  act(s,'p0',{type:'start'},rng);
  assert.equal(s.phase,'map');
  assert.equal(s.deadline,null);
  assert.equal(tick(s,rng),false);                 // sin reloj no pasa nada
  assert.equal(s.phase,'map');
  act(s,'p1',{type:'vote',option:0},rng);          // 1 de 3: aún no es mayoría
  assert.equal(s.deadline,null);
  act(s,'p2',{type:'vote',option:0},rng);          // 2 de 3: empieza la cuenta atrás
  assert.equal(s.deadline-s.turnStarted,READY_TIME);
  timeout(s);
  assert.notEqual(s.phase,'map');
  // Tienda: listos uno a uno; con todos, se sigue al instante.
  const t=create();
  join(t,'p0','Uno','guardia');join(t,'p1','Dos','mago');
  act(t,'p0',{type:'start'},rng);
  t.phase='shop';t.ready=[];t.deadline=null;
  act(t,'p0',{type:'ready'},rng);                  // 1 de 2 = la mitad: cuenta atrás
  assert.ok(t.deadline!=null);
  act(t,'p0',{type:'ready'},rng);                  // se arrepiente: se para
  assert.equal(t.deadline,null);
  act(t,'p0',{type:'ready'},rng);act(t,'p1',{type:'ready'},rng);
  assert.notEqual(t.phase,'shop');
});
test('el combate de élite trae un enemigo extra y mejor botín',()=>{
  const normal=encounter(2,2),elite=encounter(2,2,true);
  assert.equal(elite.length,normal.length+1);
  assert.equal(encounter(2,1,true).length,encounter(2,1).length);
  assert.ok(elite[0].hp>normal[0].hp);
});
test('el agua bloquea el paso pero no la visión y los pinchos dañan al pisarlos',()=>{
  const s=battle('tirador');
  const hero=s.units[s.turn];
  s.walls=[];
  s.water=[hero.pos-1];
  assert.equal(paths(s,hero,3).has(hero.pos-1),false);
  assert.equal(lineOfSight(s,hero.pos,hero.pos-2),true);
  s.water=[];
  s.traps=[{pos:hero.pos-1,kind:'spikes'}];
  const hp=hero.hp;
  act(s,'p0',{type:'move',pos:hero.pos-1},rng);
  assert.equal(hero.hp,hp-(3+s.floor));
});

test('la tienda es una sala del mapa: se compra y vende allí y se sigue cuando todos están listos',()=>{
  for(let seed=1;seed<20;seed++){
    let x=seed;const random=()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);
    const route=makeRoute(random);
    assert.ok(route.rows[2].some(n=>n.kind==='shop'));
    assert.ok(route.rows[6].some(n=>n.kind==='shop'));
  }
  const s=create();
  join(s,'p0','Uno','guardia');join(s,'p1','Dos','mago');
  act(s,'p0',{type:'start'},rng);
  s.route.rows[0]=[{id:'1-0',floor:1,kind:'shop',x:.27,next:s.route.rows[1].map(n=>n.id)},{id:'1-1',floor:1,kind:'combat',x:.73,next:s.route.rows[1].map(n=>n.id)}];
  s.vote.options=['1-0','1-1'];
  act(s,'p0',{type:'vote',option:0},rng);
  act(s,'p1',{type:'vote',option:0},rng);
  assert.equal(s.phase,'shop');
  assert.equal(s.stock.length,6);
  const p=s.players[0];
  p.gold=500;
  const item=s.stock[0];
  act(s,'p0',{type:'buy',item:item.id},rng);
  assert.ok(p.bag.includes(item));
  const before=p.gold;
  act(s,'p0',{type:'sell',item:item.id},rng);
  assert.equal(p.gold,before+Math.floor(item.price/2));
  act(s,'p0',{type:'ready'},rng);
  assert.equal(s.phase,'shop');
  act(s,'p1',{type:'ready'},rng);
  assert.equal(s.phase,'map');
  assert.equal(s.stock.length,0);
});
test('los jugadores pueden darse objetos y tusi fuera del combate',()=>{
  const s=create();
  join(s,'p0','Uno','guardia');join(s,'p1','Dos','mago');
  act(s,'p0',{type:'start'},rng);
  const [a,b]=s.players;
  a.gold=30;
  const gem={id:777,kind:'rune',name:'Runa',stats:{fire:2},price:10};
  a.bag.push(gem);
  act(s,'p0',{type:'give',to:'p1',gold:12},rng);
  assert.equal(a.gold,18);assert.equal(b.gold,12);
  act(s,'p0',{type:'give',to:'p1',item:777},rng);
  assert.ok(b.bag.includes(gem));assert.ok(!a.bag.includes(gem));
  assert.throws(()=>act(s,'p0',{type:'give',to:'p1',gold:100},rng),/suficiente/);
  assert.throws(()=>act(s,'p0',{type:'give',to:'p0',gold:1},rng),/otro jugador/);
  enterCombat(s);
  assert.throws(()=>act(s,s.units[s.turn].id,{type:'give',to:'p1',gold:1},rng),/fuera del combate/);
});

test('los objetos siguen las reglas de rareza, afijos/sufijos y tiers por nivel',()=>{
  const sample=(floor,n=600)=>{
    let x=floor*977;const random=()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);
    const s=create();s.floor=floor;
    return Array.from({length:n},()=>rollItem(s,random,{gear:true}));
  };
  const rules=[[1,0,1,0],[1,1,1,1],[3,3,1,2],[2,2,2,2]];
  const damage=new Set(['physical','magic','fire','ice','lightning','chaos']);
  for(const item of [...sample(3),...sample(12,900)]){
    const total=item.affixes.length;
    // Normal 1 modificador, poco común 2, raro 3, legendario 4 (menos si la pieza no admite tantos).
    assert.ok(total<=item.grade+1&&total>=Math.min(item.grade+1,2),item.slot+' '+item.grade+' '+total);
    assert.equal(new Set(item.affixes.map(a=>a.stat)).size,item.affixes.length);
    for(const mod of item.affixes){
      if(damage.has(mod.stat))assert.ok(['weapon','ring','amulet'].includes(item.slot),'daño en '+item.slot);
      if(mod.stat==='ward')assert.ok(['helmet','gloves','boots','armor'].includes(item.slot),'armadura en '+item.slot);
      if(mod.stat==='leech'){assert.equal(item.slot,'weapon');assert.ok(mod.value>=1&&mod.value<=5);}
    }
    if(item.slot==='weapon')assert.ok(!item.affixes.some(a=>a.stat==='ward'||a.stat==='vitality'),'arma con armadura o vida');
    assert.notEqual(item.slot,'charm');
    assert.ok(item.affixes.filter(a=>a.type==='prefix').length<=2&&item.affixes.filter(a=>a.type==='suffix').length<=2,'máximo 2 y 2');
  }
  const avgTier=items=>{const t=items.flatMap(i=>i.affixes.map(a=>a.tier));return t.reduce((a,b)=>a+b,0)/t.length;};
  const early=sample(1),late=sample(6);
  assert.ok(avgTier(late)>avgTier(early)+.8);
  assert.ok(early.every(i=>i.affixes.every(a=>a.tier<=2)));
  assert.ok(late.filter(i=>i.grade>=2).length>early.filter(i=>i.grade>=2).length);
});

test('los enemigos se adaptan al poder real del grupo',()=>{
  const hero=(extra={})=>({classId:'guardia',level:3,skillRanks:[2,1,1,0],max:classes.guardia.hp+8+(extra.vitality||0),
    stats:{physical:1,fire:1,ice:1,magic:1,lightning:1,chaos:1,ward:0,critical:0,action:0,...extra}});
  const weak=enemyScaling(3,[hero()]);
  const strong=enemyScaling(3,[hero({physical:8,critical:25,ward:3,vitality:25})]);
  assert.ok(strong.hp>weak.hp);
  assert.ok(strong.damage>weak.damage);
  assert.ok(strong.hp<=2.2&&weak.hp>=.7);
  const s=battle('guardia');
  assert.ok(s.scaling&&s.scaling.hp>0);
});

test('cada jefe usa sus poderes sin romper el combate',()=>{
  for(const [boss,floor] of [['skeletonking',4],['umbralking',8],['cerberus',12],['sporemother',16],['oracle',20],['vampqueen',20],['firedemon',24]]){
    const s=battle('guardia','mago');
    s.walls=[];s.water=[];s.traps=[];
    s.floor=floor;
    const foe=encounter(floor,2,{boss})[0];
    foe.max=foe.hp;
    const heroes=s.units.filter(u=>!u.enemy);
    for(const h of heroes){h.hp=h.max=999;}
    foe.pos=heroes[0].pos-4;
    s.units=[...heroes,foe];
    s.turn=s.units.indexOf(foe);
    s.deadline=0;s.enemyPlan=null;
    for(let i=0;i<12&&s.phase==='combat';i++){
      if(s.units[s.turn].enemy){timeout(s);if(s.units[s.turn]?.enemy)timeout(s);}
      else act(s,s.units[s.turn].id,{type:'end'},rng);
    }
    assert.equal(s.phase,'combat',boss);
    if(boss==='skeletonking')assert.ok(s.units.some(u=>u.minion),'el Rey Osario invoca');
    if(boss==='cerberus')assert.ok(heroes.some(h=>h.hp<999),'Cancerbero muerde');
    if(boss==='sporemother')assert.ok(s.units.some(u=>u.minion&&u.look==='plant'),'la Madre Espora hace brotar plantas');
  }
});
test('una partida completa recorre los 3 actos y termina en victoria',()=>{
  const s=create();
  join(s,'p0','Uno','guardia');join(s,'p1','Dos','mago');
  act(s,'p0',{type:'start'},rng);
  let guard=0,acts=new Set();
  while(s.phase!=='won'&&guard++<400){
    acts.add(s.route.act);
    if(s.phase==='map'||s.phase==='event'){for(const p of s.players)if(s.phase==='map'||s.phase==='event')act(s,p.id,{type:'vote',option:0},rng);}
    else if(s.phase==='shop'){for(const p of s.players)if(s.phase==='shop')act(s,p.id,{type:'ready'},rng);}
    else if(s.phase==='combat'){
      for(const u of s.units)if(u.enemy)u.hp=0;
      const hero=s.units.find(u=>!u.enemy&&u.hp>0);
      hero.hp=Math.max(hero.hp,1);
      s.turn=s.units.indexOf(hero);
      act(s,hero.id,{type:'end'},rng);
    }else if(s.phase==='reward'){
      for(const p of s.players){
        if(!s.picks.includes(p.id))act(s,p.id,{type:'reward',item:null},rng);
        if(s.training&&!p.trained)act(s,p.id,{type:'train',skill:trainingOffer(p)[0].index},rng);
      }
      act(s,'p0',{type:'next'},rng);
    }else assert.fail('fase inesperada '+s.phase);
  }
  assert.equal(s.phase,'won');
  assert.equal(s.floor,24);
  assert.deepEqual([...acts],[1,2,3]);
  assert.equal(s.bossKills,6);
});

test('colores fijos por puesto y maestrías aplicadas a la partida',()=>{
  const s=create();
  join(s,'a','Uno','tirador',{mastery:{vigor:2,fuerza:1,fortuna:3,sabiduria:1,coraza:9}});
  join(s,'b','Dos','tirador');
  assert.deepEqual(s.players.map(p=>p.color),['red','blue']);
  assert.equal(s.players[0].gold,30);
  assert.equal(s.players[0].mastery.coraza,3);
  assert.equal(s.players[0].skillRanks[0],2);
  act(s,'a',{type:'start'},rng);
  enterCombat(s);
  const [a,b]=['a','b'].map(id=>s.units.find(u=>u.id===id));
  assert.equal(a.max-b.max,8);
  assert.equal(a.stats.physical-b.stats.physical,4,'fuerza: +4 % por rango');
  assert.equal(a.stats.ward-b.stats.ward,12,'coraza: +4 % por rango');
  assert.equal(a.color,'red');
  assert.equal(masteryCost('fuerza',2),9);
});
test('los puntos de cuenta crecen con lo lejos que se llega',()=>{
  assert.ok(runPoints({floor:3})<runPoints({floor:9,bossKills:2}));
  assert.ok(runPoints({floor:24,bossKills:6,won:true})>runPoints({floor:24,bossKills:5}));
  assert.equal(runPoints({floor:999,bossKills:99,won:true}),12+12+15+15);
});
test('cuentas: registro, maestrías, amigos, invitaciones y puntos al terminar la partida en sala', {timeout:10000}, async t=>{
  const {server:app}=await import('./server.js');
  if(!app.listening){app.listen(0,'127.0.0.1');await once(app,'listening');}
  t.after(()=>app.close());
  const base='http://127.0.0.1:'+app.address().port;
  const call=async(path,body,account,key)=>{
    const response=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(account?{'X-Account':account}:{}),...(key?{Authorization:'Bearer '+key}:{})},body:body?JSON.stringify(body):undefined});
    return {status:response.status,...await response.json()};
  };
  const ana=await call('/api/account/register',{nick:'Ana',password:'secreto1'});
  assert.equal(ana.status,200);
  assert.equal((await call('/api/account/register',{nick:'ana',password:'otraclave'})).status,400);
  assert.equal((await call('/api/account/login',{nick:'Ana',password:'mala'})).status,400);
  const bob=await call('/api/account/register',{nick:'Bob',password:'secreto2'});
  const login=await call('/api/account/login',{nick:'ANA',password:'secreto1'});
  assert.equal(login.user.nick,'Ana');
  const friends=await call('/api/account/friend',{nick:'bob'},ana.token);
  assert.deepEqual(friends.user.friends,['Bob']);
  assert.equal(friends.friends[0].online,true);
  const solo=await call('/api/account/award',{floor:9,bossKills:2,won:false},ana.token);
  assert.equal(solo.points,4+4+5);
  assert.equal((await call('/api/account/award',{floor:9},ana.token)).status,400);
  const bought=await call('/api/account/mastery',{key:'vigor'},ana.token);
  assert.equal(bought.user.mastery.vigor,1);
  assert.equal(bought.user.spent,2);
  assert.equal((await call('/api/account/mastery',{key:'celeridad'},bob.token)).status,400);
  const room=await call('/api/rooms',{classId:'guardia'},ana.token);
  assert.equal(room.state.players[0].name,'Ana');
  assert.equal(room.state.players[0].mastery.vigor,1);
  assert.equal((await call('/api/account/invite',{nick:'Bob',code:room.code},ana.token)).status,200);
  const bobMe=await call('/api/account/me',null,bob.token);
  assert.equal(bobMe.user.invites[0].code,room.code);
  const joined=await call('/api/'+room.code+'/join',{classId:'mago'},bob.token);
  assert.deepEqual(joined.state.players.map(p=>p.color),['red','blue']);
  const before=(await call('/api/account/me',null,bob.token)).user.points;
  const {rooms}=await import('./server.js');
  await call('/api/'+room.code+'/action',{type:'start'},null,room.key);
  const live=rooms.get(room.code);
  live.state.floor=5;live.state.bossKills=1;live.state.phase='lost';
  await call('/api/'+room.code,null,null,room.key);
  await call('/api/'+room.code,null,null,joined.key);
  const after=(await call('/api/account/me',null,bob.token)).user.points;
  assert.equal(after-before,2+2);
  assert.ok(before>=0);
});

test('habilidades estilo Dofus: Ninja con shuriken, cono, línea, empuje con choque, atracción, intercambio y bonus de rango máximo',()=>{
  assert.equal(classes.sombra.name,'Ninja');
  assert.equal(classes.sombra.skills[0][0],'Shuriken');
  assert.ok(classes.sombra.skills[0][2]>1);
  for(const cls of Object.values(classes)){
    assert.ok(cls.skills.length>=8);
    const elementsUsed=new Set(cls.skills.map(sk=>sk[8]?.element).filter(Boolean));
    assert.ok(elementsUsed.size>=2,cls.name);
    for(const sk of cls.skills)assert.ok(maxBonusText(sk),sk[0]);
  }
  const s=battle('guardia','mago');
  s.walls=[];s.water=[];s.traps=[];
  const g=s.units.find(u=>u.id==='p0'),m=s.units.find(u=>u.id==='p1');
  const foe=s.units.find(u=>u.enemy);
  for(const u of s.units.filter(u=>u.enemy&&u!==foe))u.hp=0;
  const w=s.width;
  // Cono de Barrido: 4 casillas hacia delante.
  g.pos=3*w+5;
  const cone=spellArea(s,3*w+4,skillFor({...g,skillRanks:[1,1,1,1,1,1,1,1]},4),g);
  assert.deepEqual(new Set(cone),new Set([3*w+4,3*w+3,2*w+3,4*w+3]));
  // Línea del Relámpago: casilla elegida y 3 detrás.
  m.pos=6*w+8;
  const line=spellArea(s,6*w+7,skillFor({...m,skillRanks:[1,1,1,1,1,1,1,1]},4),m);
  assert.deepEqual(new Set(line),new Set([6*w+7,6*w+6,6*w+5,6*w+4]));
  // Empujón de escudo contra un muro: la unidad choca y recibe daño extra.
  s.turn=s.units.indexOf(g);s.ap=6;
  g.skillRanks=[1,1,1,1,0,1,1,0];
  foe.pos=g.pos-1;foe.hp=foe.max=200;foe.stats.ward=0;
  s.walls=[g.pos-3];
  const before=foe.hp;
  act(s,'p0',{type:'skill',skill:3,pos:foe.pos},()=>.5);
  assert.equal(foe.pos,g.pos-2);
  assert.ok(before-foe.hp>=4+6);
  // Gancho: atrae al enemigo en línea recta hasta el cuerpo a cuerpo.
  s.walls=[];foe.pos=g.pos-4;s.ap=6;
  act(s,'p0',{type:'skill',skill:5,pos:foe.pos},()=>.5);
  assert.equal(foe.pos,g.pos-1);
  // Rango máximo: Tajo gana crítico, Golpe de brasas pasa a alcance modificable.
  const top={classId:'guardia',skillRanks:[3,1,1,1,1,1,1,3]};
  assert.equal(skillFor(top,0)[8].crit,15);
  assert.equal(skillFor(top,7)[8].modifiable,true);
  assert.equal(skillFor({classId:'mistico',skillRanks:[1,1,1,1,1,1,1,3]},7)[1],2);
  // Sustitución del Ninja: intercambia posiciones.
  const n=battle('sombra');
  n.walls=[];n.water=[];n.traps=[];
  const ninja=n.units.find(u=>!u.enemy),enemy=n.units.find(u=>u.enemy);
  ninja.skillRanks[6]=1;n.ap=6;
  const [a,b]=[ninja.pos,ninja.pos-3];enemy.pos=b;
  act(n,'p0',{type:'skill',skill:6,pos:b},rng);
  assert.deepEqual([ninja.pos,enemy.pos],[b,a]);
});

test('el Guardián tiene más vida y su Gancho atrae en línea recta a aliados y enemigos hasta el cuerpo a cuerpo',()=>{
  assert.ok(classes.guardia.hp>=56);
  const s=battle('guardia','mago');
  s.walls=[];s.water=[];s.traps=[];
  const guard=s.units.find(u=>u.id==='p0'),mage=s.units.find(u=>u.id==='p1'),foe=s.units.find(u=>u.enemy);
  const hook=classes.guardia.skills.findIndex(k=>k[0]==='Gancho');
  guard.skillRanks[hook]=1;s.players[0].skillRanks[hook]=1;
  s.turn=s.units.indexOf(guard);s.ap=6;
  const w=s.width;
  guard.pos=3*w+8;
  for(const u of s.units)if(u!==guard)u.pos=-99;
  foe.pos=guard.pos-4;foe.stats.ward=0;
  mage.pos=guard.pos-2*w-2;
  const skill=skillFor(guard,hook);
  assert.equal(hasRange(s,guard,mage.pos,skill),false,'nada en diagonal');
  const hp=foe.hp;
  act(s,'p0',{type:'skill',skill:hook,pos:foe.pos},rng);
  assert.equal(foe.pos,guard.pos-1);
  assert.ok(foe.hp<hp);
  mage.pos=guard.pos+3*w;
  const mageHp=mage.hp;
  act(s,'p0',{type:'skill',skill:hook,pos:mage.pos},rng);
  assert.equal(mage.pos,guard.pos+w);
  assert.equal(mage.hp,mageHp);
});

test('cada acto tiene su ambientación, su fauna y salas generadas al azar',()=>{
  assert.deepEqual(actBiomes,['crypt','jungle','hell']);
  const looks=act=>new Set(Array.from({length:8},(_,i)=>encounter((act-1)*8+1+i,4,{elite:i%3===0})).flat().map(u=>u.look));
  const crypt=looks(1),jungle=looks(2),hell=looks(3);
  assert.ok(crypt.has('skeleton')&&crypt.has('slime'));
  assert.ok(jungle.has('slug')&&jungle.has('bat')&&jungle.has('plant'));
  assert.ok(hell.has('lavaslime')&&hell.has('imp'));
  assert.ok(!jungle.has('skeleton')&&!hell.has('slug')&&!crypt.has('lavaslime'));
  // Una partida real: cada sala nueva sale distinta (obstáculos, contorno, estilo y nombre).
  let r=7;
  const seq=()=>{r=(r*16807)%2147483647;return r/2147483647;};
  const s=create();join(s,'p0','A','guardia');act(s,'p0',{type:'start'},seq);
  const seen=new Set(),styles=new Set(),names=new Set();
  let rooms=0;
  while(s.floor<23){
    for(let k=0;k<8&&s.phase!=='combat';k++){
      if(s.phase==='map'){const o=Math.max(0,s.vote.options.findIndex(id=>s.route.rows.flat().find(n=>n.id===id).kind==='combat'));act(s,'p0',{type:'vote',option:o},seq);}
      else if(s.phase==='event')act(s,'p0',{type:'vote',option:0},seq);
      else if(s.phase==='shop'||s.phase==='forge')act(s,'p0',{type:'ready'},seq);
    }
    assert.equal(s.phase,'combat');
    assert.equal(s.biome,actBiomes[s.act-1]);
    seen.add(s.walls.join(',')+'|'+s.voids.join(','));styles.add(s.layoutStyle);names.add(s.layoutName);
    rooms++;
    s.phase='reward';s.picks=['p0'];act(s,'p0',{type:'next'},seq);
  }
  assert.ok(rooms>=15);
  assert.equal(seen.size,rooms);
  assert.ok(styles.size>=5&&names.size>=rooms-3,styles.size+' estilos, '+names.size+' nombres');
});

test('el árbol de pisos tiene ramas: cada elección cierra caminos',()=>{
  let closed=0,edges=0,nodes=0;
  for(let seed=1;seed<=40;seed++){
    let r=seed;const seq=()=>{r=(r*16807)%2147483647;return r/2147483647;};
    for(let act=1;act<=3;act++){
      const route=makeRoute(seq,act);
      route.rows.forEach((row,i)=>{
        const next=route.rows[i+1];
        if(!next)return;
        for(const node of row){
          assert.ok(node.next.length>=1,'cada sala lleva a algún sitio');
          edges+=node.next.length;nodes++;
          if(row.length>1&&next.length>1&&node.next.length<next.length)closed++;
        }
        for(const other of next)assert.ok(row.some(n=>n.next.includes(other.id)),'todas las salas son alcanzables');
      });
    }
  }
  assert.ok(edges/nodes<2,'pocas conexiones por sala: '+(edges/nodes).toFixed(2));
  assert.ok(closed>nodes*.4,'la mayoría de elecciones cierran salas');
});

test('las invocaciones mueren cuando cae su invocador',()=>{
  const s=battle('guardia');
  const boss=s.units.find(u=>u.enemy);
  boss.look='skeletonking';boss.boss=true;
  boss.pos=s.units[0].pos-1;
  const before=s.units.length;
  for(let i=0;i<3;i++){const p=s.units.find(u=>u.enemy);p.cycle=0;}
  s.units.push({...structuredClone(boss),id:'minion1',minion:boss.id,boss:false,look:'skeleton',hp:10,max:10,pos:boss.pos-1});
  const hero=s.units.find(u=>!u.enemy);
  s.turn=s.units.indexOf(hero);s.ap=6;boss.hp=1;boss.stats.ward=0;
  act(s,hero.id,{type:'skill',skill:0,pos:boss.pos},()=>.5);
  assert.equal(boss.hp,0);
  assert.equal(s.units.find(u=>u.id==='minion1').hp,0);
  assert.ok(s.units.length>=before);
});

test('las trampas no se amontonan ni se ponen en pasillos',()=>{
  let r=11;const seq=()=>{r=(r*16807)%2147483647;return r/2147483647;};
  const s=create();join(s,'p0','A','guardia');act(s,'p0',{type:'start'},seq);
  let rooms=0;
  while(s.floor<23){
    for(let k=0;k<8&&s.phase!=='combat';k++){
      if(s.phase==='map'){const o=Math.max(0,s.vote.options.findIndex(id=>s.route.rows.flat().find(n=>n.id===id).kind==='combat'));act(s,'p0',{type:'vote',option:o},seq);}
      else if(s.phase==='event')act(s,'p0',{type:'vote',option:0},seq);
      else if(s.phase==='shop')act(s,'p0',{type:'ready'},seq);
    }
    const free=pos=>onBoard(s,pos)&&!s.walls.includes(pos)&&!s.water.includes(pos);
    for(const t of s.traps){
      const near=[t.pos-1,t.pos+1,t.pos-s.width,t.pos+s.width].filter(p=>free(p)&&Math.abs(p%s.width-t.pos%s.width)+Math.abs(Math.floor(p/s.width)-Math.floor(t.pos/s.width))===1);
      assert.ok(near.length>=3,'trampa en pasillo');
      for(const o of s.traps)if(o!==t)assert.ok(Math.abs(o.pos%s.width-t.pos%s.width)+Math.abs(Math.floor(o.pos/s.width)-Math.floor(t.pos/s.width))>2,'trampas pegadas');
    }
    assert.ok(s.traps.length<=5);
    rooms++;
    s.phase='reward';s.picks=['p0'];act(s,'p0',{type:'next'},seq);
  }
  assert.ok(rooms>10);
});

test('los glifos de jefe se pueden lanzar pegados a un muro y escalan con el piso',()=>{
  const s=battle('guardia');
  s.walls=[];s.water=[];
  const corner=s.width+1;
  s.walls=[corner-1,corner-s.width];
  const cells=glyphCells(s,corner);
  assert.equal(cells[0],corner);
  assert.ok(cells.every(pos=>!s.walls.includes(pos)));
  assert.ok(glyphPower('damage',20).damage>glyphPower('damage',1).damage);
});
test('cada monstruo tiene una habilidad propia: el diablillo estalla en cruz y la calavera maldice',()=>{
  const s=battle('guardia');
  s.walls=[];s.water=[];s.traps=[];
  const hero=s.units.find(u=>!u.enemy);
  for(const u of s.units.filter(u=>u.enemy))u.hp=0;
  const imp=s.units.find(u=>u.enemy);
  Object.assign(imp,{hp:30,max:30,look:'imp',name:'Diablillo',range:6,cd:1,damage:4,effects:{},stats:{ward:0,movement:0}});
  hero.pos=3*s.width+5;imp.pos=3*s.width+8;
  s.turn=s.units.indexOf(imp);s.enemyPlan=null;s.mp=3;s.ap=4;
  const before=hero.hp;
  timeout(s);while(s.units[s.turn]===imp)timeout(s);
  assert.ok(hero.hp<before);
  assert.equal(imp.cd,3);
  Object.assign(imp,{look:'skull',name:'Calavera',cd:0});
  hero.effects={};
  s.turn=s.units.indexOf(imp);s.enemyPlan=null;
  timeout(s);while(s.units[s.turn]===imp)timeout(s);
  assert.ok(hero.effects.weak);
});
test('daño: físicas suman solo el físico; hechizos suman mágico + su elemento; la armadura solo frena lo físico',()=>{
  const stats={physical:3,magic:5,fire:7,ice:11,lightning:13,chaos:17};
  const archer={classId:'tirador',stats},mage={classId:'mago',stats};
  const skill=(cls,name)=>classes[cls].skills.find(sk=>sk[0]===name);
  assert.equal(damagePercent(archer,skill('tirador','Flecha ígnea')),3);
  assert.equal(damagePercent(mage,skill('mago','Bola de fuego')),5+7);
  assert.equal(damagePercent(mage,skill('mago','Relámpago')),5+13);
  assert.equal(damagePercent(mage,skill('mago','Descarga arcana')),5);
  assert.equal(skillSchool(archer,skill('tirador','Flecha ígnea')),'physical');
  // La armadura (en %) solo frena lo físico.
  const target={stats:{ward:40},effects:{}};
  const phys=damagePreview(archer,target,skill('tirador','Flecha ígnea')).normal[0];
  const magic=damagePreview(mage,target,skill('mago','Bola de fuego')).normal[0];
  assert.equal(phys,Math.round(Math.floor(skill('tirador','Flecha ígnea')[3]*1.03)*.6));
  assert.equal(magic,Math.floor(skill('mago','Bola de fuego')[3]*1.12));
});

test('resistencias, debilidades, drenaje de PA/PM y variantes',()=>{
  const s=battle('mago');
  const hero=s.units.find(u=>!u.enemy);
  const foe=s.units.find(u=>u.enemy);
  foe.stats.ward=0;
  const fireball=classes.mago.skills.find(sk=>sk[0]==='Bola de fuego');
  const base=damagePreview(hero,foe,fireball).normal;
  foe.resist={fire:50};
  assert.deepEqual(damagePreview(hero,foe,fireball).normal,base.map(v=>Math.round(v*.5)));
  foe.resist={fire:-50};
  assert.deepEqual(damagePreview(hero,foe,fireball).normal,base.map(v=>Math.round(v*1.5)));
  // Cada especie normal tiene al menos una resistencia o debilidad.
  for(const [species,t] of Object.entries(monsterTraits))assert.ok(Object.keys(t.resist||{}).length,species);
  assert.ok(Object.keys(monsterVariants).length>=8);
  // Un vampiro drena PA y un murciélago quita PM.
  for(const [look,key] of [['vampire','weak'],['bat','slow']]){
    const t=battle('guardia');
    const h=t.units.find(u=>!u.enemy);
    for(const u of t.units.filter(u=>u.enemy))u.hp=0;
    const m=t.units.find(u=>u.enemy);
    Object.assign(m,{hp:30,max:30,look,range:1,cd:5,damage:2,effects:{},resist:{},stats:{ward:0,movement:0}});
    t.walls=[];t.water=[];t.traps=[];
    m.pos=h.pos-1;h.effects={};
    t.turn=t.units.indexOf(m);t.enemyPlan=null;t.mp=0;t.ap=4;
    timeout(t);while(t.units[t.turn]===m)timeout(t);
    assert.ok(h.effects[key],look+' → '+key);
  }
});
test('hay más tipos de sala y cada acto tiene los suyos',()=>{
  const seen=new Set(),byBiome={crypt:new Set(),jungle:new Set(),hell:new Set()};
  let seed=12345;const rng=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let actNo=1;actNo<=3;actNo++)for(let i=0;i<25;i++){
    const s=battle('guardia');
    s.route=makeRoute(rng,actNo);
    s.floor=(actNo-1)*8+1+(i%3);
    s.phase='reward';s.picks=['p0'];
    act(s,'p0',{type:'next'},rng);
    for(let k=0;k<6&&s.phase!=='combat';k++){
      if(s.phase==='map')act(s,'p0',{type:'vote',option:0},rng);
      else if(s.phase==='event')act(s,'p0',{type:'vote',option:0},rng);
      else timeout(s);
    }
    if(s.phase!=='combat')continue;
    seen.add(s.layoutStyle);byBiome[s.biome]?.add(s.layoutStyle);
  }
  assert.ok(seen.size>=10,'estilos: '+[...seen].join(','));
  assert.ok(byBiome.crypt.size&&byBiome.jungle.size&&byBiome.hell.size,JSON.stringify(Object.fromEntries(Object.entries(byBiome).map(([k,v])=>[k,[...v]]))));
});

test('planta carnívora: liana en línea recta, alcance infinito, con visión y camino libre',()=>{
  const setup=()=>{
    const t=battle('guardia');
    const h=t.units.find(u=>!u.enemy);
    for(const u of t.units.filter(u=>u.enemy))u.hp=0;
    const m=t.units.find(u=>u.enemy);
    Object.assign(m,{hp:30,max:30,look:'plant',name:'Planta',range:4,cd:5,vineCd:0,damage:2,effects:{},resist:{},stats:{ward:0,movement:-2}});
    t.walls=[];t.water=[];t.traps=[];t.voids=[];
    const row=2*t.width;
    m.pos=row+1;h.pos=row+t.width-2;      // misma fila, lejos (más allá de su alcance normal)
    t.turn=t.units.indexOf(m);t.enemyPlan=null;t.mp=0;t.ap=4;
    return {t,h,m};
  };
  // Camino libre: lo arrastra hasta pegarlo a la planta.
  let {t,h,m}=setup();
  timeout(t);while(t.units[t.turn]===m)timeout(t);
  assert.equal(distance(t,m.pos,h.pos),1);
  assert.equal(m.vineCd,monsterExtraSkills.plant.cd);
  // Un muro, líquido o unidad en medio lo impide.
  for(const block of ['wall','water','unit']){
    ({t,h,m}=setup());
    const mid=m.pos+3;
    if(block==='wall')t.walls=[mid];
    if(block==='water')t.water=[mid];
    if(block==='unit')t.units.push({...h,id:'ally',pos:mid,enemy:false});
    const start=h.pos;
    timeout(t);while(t.units[t.turn]===m)timeout(t);
    assert.equal(h.pos,start,block);
  }
  // Fuera de línea recta no la usa.
  ({t,h,m}=setup());
  h.pos+=t.width;const start=h.pos;
  timeout(t);while(t.units[t.turn]===m)timeout(t);
  assert.equal(h.pos,start);
});

test('forja: re-tirar todo, solo afijos o solo sufijos y mejorar rareza, cobrando tusi',()=>{
  let seed=99;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const s=battle('guardia');
  const p=s.players[0];
  s.phase='forge';s.ready=[];
  let item;
  do{item=rollItem(s,random,{gear:true,ilvl:10});}while(item.grade!==1);
  p.bag.push(item);
  p.gold=1000;
  // Re-tirar solo sufijos: los afijos (prefijos) no cambian.
  const prefixes=JSON.stringify(item.affixes.filter(m=>m.type==='prefix'));
  let gold=p.gold;
  act(s,'p0',{type:'forge',item:item.id,mode:'suffix'},random);
  assert.equal(JSON.stringify(item.affixes.filter(m=>m.type==='prefix')),prefixes);
  assert.equal(p.gold,gold-forgeCost({...item,grade:1},'suffix'));
  // Mejorar rareza: poco común (1+1) → raro (2+1 o 1+2) → legendario (2+2).
  act(s,'p0',{type:'forge',item:item.id,mode:'upgrade'},random);
  assert.equal(item.grade,2);assert.equal(item.affixes.length,3);
  act(s,'p0',{type:'forge',item:item.id,mode:'upgrade'},random);
  assert.equal(item.grade,3);assert.equal(item.affixes.length,4);
  assert.equal(item.affixes.filter(m=>m.type==='prefix').length,2);
  assert.throws(()=>act(s,'p0',{type:'forge',item:item.id,mode:'upgrade'},random),/legendario/);
  // Re-tirar todo mantiene rareza y número de modificadores; sin tusi no se puede.
  act(s,'p0',{type:'forge',item:item.id,mode:'reroll'},random);
  assert.equal(item.grade,3);assert.equal(item.affixes.length,4);
  assert.equal(new Set(item.affixes.map(m=>m.stat)).size,4,'sin stats repetidos');
  p.gold=0;
  assert.throws(()=>act(s,'p0',{type:'forge',item:item.id,mode:'reroll'},random),/tusi/);
  // Precios: mejorar es lo más caro, re-tirar parte un poco más caro que todo.
  assert.ok(forgeCost(item,'upgrade')>forgeCost(item,'prefix')&&forgeCost(item,'prefix')>forgeCost(item,'reroll'));
});
test('la forja aparece en el mapa de cada acto',()=>{
  for(let actNo=1;actNo<=3;actNo++){
    const route=makeRoute(rng,actNo);
    assert.ok(route.rows[4].some(n=>n.kind==='forge'),'piso 5 del acto '+actNo);
  }
});

test('huecos de runa: 0, 1 o 2 (2 es raro), dos runas caben en dos huecos y la forja abre hasta 2',()=>{
  let seed=321;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const s=battle('guardia');
  const counts=[0,0,0];
  for(let i=0;i<3000;i++){const it=rollItem(s,random,{gear:true,ilvl:6});counts[it.sockets]++;}
  assert.ok(counts[0]>0&&counts[1]>0&&counts[2]>0);
  assert.ok(counts[2]<counts[1]&&counts[2]<counts[0],'2 huecos es lo más raro: '+counts);
  const p=s.players[0];
  const gear=rollItem(s,random,{gear:true,ilvl:5});
  gear.sockets=0;gear.runes=[];
  p.equipment[gear.slot]=gear;
  const r1={kind:'rune',id:9001,stats:{physical:1},price:8},r2={kind:'rune',id:9002,stats:{fire:1},price:8};
  p.bag.push(r1,r2);
  s.phase='shop';
  assert.throws(()=>act(s,'p0',{type:'socket',item:r1.id,slot:gear.slot},random),/huecos/);
  s.phase='forge';p.gold=999;
  act(s,'p0',{type:'forge',item:gear.id,mode:'socket'},random);
  act(s,'p0',{type:'forge',item:gear.id,mode:'socket'},random);
  assert.equal(socketsOf(gear),2);
  assert.throws(()=>act(s,'p0',{type:'forge',item:gear.id,mode:'socket'},random),/máximo/);
  s.phase='shop';
  act(s,'p0',{type:'socket',item:r1.id,slot:gear.slot},random);
  act(s,'p0',{type:'socket',item:r2.id,slot:gear.slot},random);
  assert.deepEqual(runesOf(gear).map(r=>r.id),[9001,9002]);
});
test('legendarios de nivel bajo pueden traer (muy rara vez) afijos de nivel superior',()=>{
  let seed=77;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const s=battle('guardia');
  let legend=0,ascended=0;
  for(let i=0;i<4000;i++){
    const it=rollItem(s,random,{gear:true,ilvl:2,minGrade:3});
    legend++;ascended+=it.affixes.filter(m=>m.ascended).length?1:0;
  }
  assert.ok(ascended>0,'aparece alguno');
  assert.ok(ascended/legend<.4,'pero es poco frecuente: '+ascended+'/'+legend);
});
test('todos empiezan con '+6+' PA y 3 PM',()=>{
  assert.equal(BASE_AP,6);assert.equal(BASE_MP,3);
});
test('quemadura: un golpe de fuego prende, quema al empezar el turno y el hielo la apaga',()=>{
  const s=battle('mago');
  const hero=s.units.find(u=>!u.enemy);
  const foe=s.units.find(u=>u.enemy);
  s.walls=[];s.water=[];s.traps=[];
  for(const u of s.units.filter(u=>u.enemy&&u!==foe))u.hp=0;
  foe.hp=foe.max=200;foe.stats.ward=0;foe.resist={};foe.effects={};
  foe.pos=hero.pos-3;
  s.turn=s.units.indexOf(hero);s.ap=6;
  const fireball=classes.mago.skills.findIndex(sk=>sk[0]==='Bola de fuego');
  hero.skillRanks[fireball]=Math.max(1,hero.skillRanks[fireball]||0);
  act(s,'p0',{type:'skill',skill:fireball,pos:foe.pos},()=>.5);
  assert.ok(foe.effects.burn,'arde');
  const before=foe.hp;
  act(s,'p0',{type:'end'},rng);          // empieza el turno del enemigo: le quema
  assert.ok(s.events.some(e=>e.kind==='burn'&&e.unit===foe.id));
  assert.ok(foe.hp<before);
});
test('pausa: congela el reloj, bloquea acciones y devuelve el tiempo al reanudar',()=>{
  const s=battle('guardia');
  const left=s.deadline-Date.now();
  act(s,'p0',{type:'pause'},rng);
  assert.ok(s.paused);
  assert.throws(()=>act(s,'p0',{type:'end'},rng),/pausa/);
  s.deadline=0;                          // aunque se agote el reloj, no avanza
  assert.equal(tick(s,rng),false);
  act(s,'p0',{type:'pause'},rng);
  assert.ok(!s.paused);
  assert.ok(Math.abs((s.deadline-Date.now())-left)<1500);
});
test('tienda: se puede re-tirar pagando tusi y cada vez cuesta más',()=>{
  let seed=55;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const s=battle('guardia');
  s.phase='shop';s.ready=[];s.stock=[];s.rerolls=0;s.deadline=null;
  const p=s.players[0];p.gold=100;
  const first=shopRerollCost(s);
  act(s,'p0',{type:'reroll-shop'},random);
  assert.equal(p.gold,100-first);
  assert.equal(s.stock.length,6);
  const before=s.stock.map(i=>i.id).join();
  assert.ok(shopRerollCost(s)>first);
  act(s,'p0',{type:'reroll-shop'},random);
  assert.notEqual(s.stock.map(i=>i.id).join(),before);
  p.gold=0;
  assert.throws(()=>act(s,'p0',{type:'reroll-shop'},random),/tusi/);
});
test('sala: cambiar de clase, maestrías desde la cuenta, salir y no duplicar al volver a entrar', {timeout:10000}, async t=>{
  const {server:app}=await import('./server.js');
  if(!app.listening){app.listen(0,'127.0.0.1');await once(app,'listening');}
  t.after(()=>app.close());
  const base='http://127.0.0.1:'+app.address().port;
  const call=async(path,body,account,key)=>{
    const response=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(account?{'X-Account':account}:{}),...(key?{Authorization:'Bearer '+key}:{})},body:body?JSON.stringify(body):undefined});
    return {status:response.status,...await response.json()};
  };
  const carla=await call('/api/account/register',{nick:'Carla',password:'secreto3'});
  const room=await call('/api/rooms',{name:'Anfi',classId:'guardia'});
  const first=await call('/api/'+room.code+'/join',{classId:'mago'},carla.token);
  assert.equal(first.state.players.length,2);
  // Cambia de clase en la sala
  const changed=await call('/api/'+room.code+'/action',{type:'class',classId:'sombra'},carla.token,first.key);
  assert.equal(changed.state.players.find(p=>p.id===first.id).classId,'sombra');
  assert.equal((await call('/api/'+room.code+'/action',{type:'class',classId:'dragón'},carla.token,first.key)).status,400);
  // Las maestrías salen de la cuenta: lo que mande el cliente no cuenta
  const cheat=await call('/api/'+room.code+'/action',{type:'mastery',mastery:{fuerza:3},trusted:true},carla.token,first.key);
  assert.deepEqual(cheat.state.players.find(p=>p.id===first.id).mastery,{});
  assert.equal((await call('/api/'+room.code+'/action',{type:'mastery'},null,room.key)).status,400);
  // Volver a entrar con la misma cuenta sustituye el hueco anterior
  const again=await call('/api/'+room.code+'/join',{classId:'tirador'},carla.token);
  assert.equal(again.state.players.length,2);
  assert.equal(again.state.players.filter(p=>p.account==='carla'||p.name==='Carla').length,1);
  assert.equal((await call('/api/'+room.code,null,null,first.key)).status,401);
  // Salir libera el hueco
  assert.equal((await call('/api/'+room.code+'/leave',{},null,again.key)).status,200);
  const after=await call('/api/'+room.code,null,null,room.key);
  assert.equal(after.state.players.length,1);
});
test('visión: los aliados no tapan, los enemigos sí, y dos bloques en diagonal no tapan',()=>{
  const s=battle('tirador','guardia');
  s.walls=[];s.water=[];s.voids=[];
  const [archer,guard]=s.units.filter(u=>!u.enemy);
  const enemy=s.units.find(u=>u.enemy);
  const others=s.units.filter(u=>u.enemy&&u!==enemy);
  for(const o of others)o.pos=s.width*s.height-1-others.indexOf(o);
  const w=s.width;
  archer.pos=2*w+1;enemy.pos=2*w+6;guard.pos=2*w+3;
  assert.equal(lineOfSight(s,archer.pos,enemy.pos),true,'el aliado en medio no tapa');
  const blocker=others[0];blocker.pos=2*w+4;
  assert.equal(lineOfSight(s,archer.pos,enemy.pos),false,'otro enemigo en medio sí tapa');
  blocker.pos=s.width*s.height-1;
  // Diagonal exacta pasando entre dos bloques que se tocan por la esquina.
  archer.pos=1*w+1;enemy.pos=3*w+3;guard.pos=7*w+7;
  s.walls=[1*w+2,2*w+1];
  assert.equal(lineOfSight(s,archer.pos,enemy.pos),true);
  s.walls=[2*w+2];
  assert.equal(lineOfSight(s,archer.pos,enemy.pos),false,'un muro en la propia diagonal sí tapa');
});
test('paso de sombra: se teletransporta (sin camino) y la forja sube rarezas normales barato',()=>{
  const s=battle('sombra');
  s.walls=[];s.water=[];s.traps=[];
  const ninja=s.units.find(u=>!u.enemy);
  s.turn=s.units.indexOf(ninja);s.ap=6;s.mp=3;
  const w=s.width;
  for(const u of s.units.filter(u=>u.enemy))u.pos=7*w+11-s.units.indexOf(u);
  ninja.pos=3*w+3;
  // Una trampa en medio: andando la pisaría; teletransportado, no.
  s.traps=[{pos:3*w+4,kind:'spikes'}];
  const hp=ninja.hp;
  const index=classes.sombra.skills.findIndex(k=>k[0]==='Paso de sombra');
  const target=3*w+5;
  act(s,'p0',{type:'skill',skill:index,pos:target});
  assert.equal(ninja.pos,target);
  assert.equal(ninja.hp,hp);
  const moveEvent=s.events.filter(e=>e.kind==='move').at(-1);
  assert.equal(moveEvent.blink,true);
  assert.deepEqual(moveEvent.path,[target]);
  const item=rollItem(s,()=>.4,{gear:true,ilvl:3});
  const normal=forgeCost({...item,grade:0},'upgrade'),uncommon=forgeCost({...item,grade:1},'upgrade'),rare=forgeCost({...item,grade:2},'upgrade');
  assert.ok(normal<uncommon&&uncommon<rare);
  assert.ok(normal<=forgeCost({...item,grade:0},'reroll')*1.2);
});
test('gemas: tipo y calidad según el nivel; el daño en área cae lejos del centro',async()=>{
  const E=await import('./engine.js');
  assert.equal(E.gemQuality(1),0);assert.equal(E.gemQuality(11),2);assert.equal(E.gemQuality(30),4);assert.equal(E.gemQualities.length,5);
  const ruby=E.makeGem(1,'ruby',0),best=E.makeGem(2,'ruby',4),amethyst=E.makeGem(3,'amethyst',2);
  assert.equal(ruby.name,'Rubí dañado');assert.equal(best.name,'Rubí excelente');assert.equal(amethyst.name,'Amatista completa');
  assert.ok(best.stats.vitality>ruby.stats.vitality);
  assert.ok(E.makeGem(4,'tigereye',4).stats.critical<=10,'el crítico de las gemas está acotado');
  // Las gemas salen del botín normal con su calidad
  const s=create();join(s,'p0','A','mago');s.floor=12;
  let gem;for(let i=0;i<400&&!gem;i++){const it=rollItem(s,Math.random);if(it.kind==='rune')gem=it;}
  assert.ok(gem&&gem.gem&&gem.quality>=1&&gem.quality<=2);
  // Caída en área: pleno en el centro, menos al lado
  const b=battle('mago');b.walls=[];
  const fire=skillFor(b.units.find(u=>!u.enemy),classes.mago.skills.findIndex(k=>k[0]==='Bola de fuego'));
  const w=b.width;
  assert.equal(E.areaFalloff(b,3*w+5,3*w+5,fire),1);
  assert.equal(E.areaFalloff(b,3*w+5,3*w+6,fire),.8);
  assert.equal(E.areaFalloff(b,3*w+5,3*w+6,classes.mago.skills[0]),1,'un solo objetivo no cae');
});
test('la vida no se recupera de sala a sala; los caídos vuelven con el 10 %',()=>{
  const s=battle('guardia','mago');
  const [guard,mage]=s.units.filter(u=>!u.enemy);
  guard.hp=20;mage.hp=0;
  s.phase='reward';s.picks=['p0','p1'];s.training=false;
  for(const p of s.players)p.trained=true;
  act(s,'p0',{type:'next'},rng);
  enterCombat(s);
  assert.equal(s.phase,'combat');
  const [g2,m2]=s.units.filter(u=>!u.enemy);
  assert.equal(g2.hp,Math.min(g2.max,20+Math.max(0,g2.max-guard.max)),'el guardián conserva su vida');
  assert.equal(m2.hp,Math.ceil(m2.max*.1));
});
test('todos los eventos y sus opciones se aplican sin errores',async()=>{
  const E=await import('./engine.js');
  for(const [id,event] of Object.entries(E.events)){
    for(const [i,option] of event.options.entries()){
      const s=battle('guardia','mistico');
      s.players.forEach(p=>p.gold=50);
      s.pending={};
      option.apply(s,rng);
      for(const p of s.players){assert.ok(p.gold>=0,id+' '+i);const {max}=E.heroStats(p,s.floor);assert.ok(max>0);}
      for(const u of s.units.filter(u=>!u.enemy))assert.ok(u.hp>=1&&u.hp<=u.max,id+' '+i+' vida '+u.hp+'/'+u.max);
    }
  }
  assert.ok(Object.keys(E.events).length>=15);
});

test('dos anillos: el segundo va al hueco libre y se puede elegir cuál reemplazar',async()=>{
  const {heroStats:heroStatsOf}=await import('./engine.js');
  const s=battle('guardia');
  const p=s.players[0];
  s.phase='map';
  const ring=id=>({id,slot:'ring',kind:'gear',stats:{critical:1},affixes:[],grade:0,ilvl:1,price:5});
  p.bag=[ring(601),ring(602),ring(603)];
  act(s,'p0',{type:'equip',item:601},rng);
  act(s,'p0',{type:'equip',item:602},rng);
  assert.equal(p.equipment.ring.id,601);assert.equal(p.equipment.ring2.id,602);
  act(s,'p0',{type:'equip',item:603,slot:'ring2'},rng);
  assert.equal(p.equipment.ring2.id,603);
  assert.deepEqual(p.bag.map(i=>i.id),[602]);
  assert.throws(()=>act(s,'p0',{type:'equip',item:602,slot:'boots'},rng),/no encaja/);
  assert.equal(heroStatsOf(p).stats.critical,2,'los dos anillos suman');
});

test('vampirismo: el héroe recupera un % del daño que hace; pulir sube un tier',async()=>{
  const E=await import('./engine.js');
  const s=battle('guardia');
  s.walls=[];s.water=[];s.traps=[];
  const hero=s.units.find(u=>!u.enemy);
  const foe=s.units.find(u=>u.enemy);
  hero.stats.leech=5;hero.hp=10;
  foe.pos=hero.pos-1;foe.hp=foe.max=200;foe.resist={};
  s.turn=s.units.indexOf(hero);s.ap=6;
  for(let i=0;i<3;i++){try{act(s,'p0',{type:'skill',skill:0,pos:foe.pos},rng);}catch{}}
  const dealt=200-foe.hp;
  assert.ok(dealt>0);
  assert.equal(hero.hp,10+Math.floor(dealt*.05),'cura '+Math.floor(dealt*.05)+' de '+dealt);
  // Pulir
  const item={id:900,kind:'gear',slot:'ring',base:'Anillo de obsidiana',grade:1,ilvl:6,sockets:0,runes:[],
    affixes:[{type:'prefix',stat:'fire',tier:2,tiers:8,value:2,label:'Ardiente'},{type:'suffix',stat:'critical',tier:6,tiers:6,value:20,label:'del Apocalipsis'}]};
  assert.deepEqual(E.polishable(item).map(m=>m.stat),['fire'],'el crítico ya está al máximo');
  s.players[0].gold=999;s.players[0].bag=[item];s.phase='forge';
  act(s,'p0',{type:'forge',item:900,mode:'polish'},rng);
  const fire=item.affixes.find(m=>m.stat==='fire');
  assert.equal(fire.tier,3);assert.equal(fire.label,'Candente');assert.ok(fire.value>=9&&fire.value<=13,'T3 de fuego: 9–13 %');
  assert.ok(E.forgeBlock({...item,ilvl:1,affixes:[{type:'prefix',stat:'fire',tier:5,tiers:8,value:8,label:'Calcinante'}]},'polish'),'no se pule más allá de nivel+6');
});
