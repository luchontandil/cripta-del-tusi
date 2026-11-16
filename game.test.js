import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {server} from './server.js';
import {create,join,act,tick,encounter,paths,lineOfSight,hasRange,inRange,spellArea,classes,planEnemy,onBoard,slots,damagePreview,skillFor,trainingChoices} from './engine.js';

const rng=()=>.3;
function battle(...classes) {
  const s=create();
  classes.forEach((kind,i)=>join(s,'p'+i,'Jugador '+i,kind));
  act(s,'p0',{type:'start'},rng);
  return s;
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
  assert.equal(s.ap,4);
  s.walls=[];
  act(s,'p0',{type:'skill',skill:0,pos:enemy.pos},rng);
  assert.throws(()=>act(s,'p0',{type:'skill',skill:2,pos:enemy.pos}),/puntos/);
  assert.ok(encounter(3,4).length>encounter(3,1).length);
  assert.ok(encounter(5,1)[0].hp>encounter(1,1)[0].hp);
  assert.ok(encounter(1,1)[0].hp>=20&&encounter(1,1)[0].damage>=4);
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
  assert.equal(archer.hp,24);
});
test('el jefe anuncia una sola cruz y, al activarla en su turno, las cadenas dañan y restan PM',()=>{
  const s=battle('tirador');
  s.floor=5;
  s.phase='reward';
  s.picks=['p0'];
  act(s,'p0',{type:'next'},rng);
  const boss=s.units[s.turn];
  assert.equal(boss.boss,true);
  timeout(s);
  assert.equal(s.glyphs.length,1);
  const glyph=s.glyphs[0];
  assert.equal(glyph.kind,'slow');
  assert.ok(glyph.warn);
  const center=glyph.cells[0];
  assert.deepEqual(new Set(glyph.cells),new Set([center,center-s.width,center+s.width,center-1,center+1]));
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
test('genera botín con afijos y permite equipar, engarzar, extraer y vender una runa',()=>{
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
  const rune={kind:'rune',id:999,stats:{power:2},price:10};
  p.bag.push(rune);
  act(s,'p0',{type:'socket',item:rune.id,slot:gear.slot},rng);
  assert.equal(p.equipment[gear.slot].socket,rune);
  act(s,'p0',{type:'unsocket',slot:gear.slot},rng);
  const gold=p.gold;
  act(s,'p0',{type:'sell',item:rune.id},rng);
  assert.equal(p.gold,gold+5);
  assert.throws(()=>act(s,'p0',{type:'next'},rng),/habilidades/);
  const newSpell=trainingChoices(p).find(option=>option.rank===0);
  act(s,'p0',{type:'train',skill:newSpell.index},rng);
  assert.throws(()=>act(s,'p0',{type:'train',skill:0},rng),/pendiente/);
  act(s,'p0',{type:'next'},rng);
  assert.equal(s.floor,2);
  assert.equal(p.level,2);
  const raised=s.units.find(u=>u.id==='p0');
  assert.ok(raised.max>=hero.max+4);
  assert.ok(raised.stats.physical>=1);
  assert.ok(skillFor(raised,newSpell.index));
});
test('la vista previa aplica el crítico ×1,5 y solo resta armadura al daño físico',()=>{
  const s=battle('guardia');
  const hero=s.units[0], foe=s.units[1];
  hero.stats.physical=2;
  foe.stats.ward=3;
  assert.deepEqual(damagePreview(hero,foe,classes.guardia.skills[0]),{element:'physical',normal:[6,9],critical:[10,15],chance:.12});
  hero.stats.fire=2;
  assert.deepEqual(damagePreview(hero,foe,classes.guardia.skills.at(-1)).normal,[10,14]);
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
    act(s,'p0',{type:'skill',skill:0,pos:foe.pos},rand);
    for(const item of [...s.offers.p0,...s.stock]){
      if(item.stats.movement){assert.equal(item.slot,'boots');seen.add('PM');}
      if(item.stats.action){
        assert.ok(item.slot==='amulet'||(item.slot==='weapon'&&['Cetro de ónice','Lanza de vigía'].includes(item.name)));
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
  assert.equal(s.ap,1);
  assert.equal(first.max-first.hp,8);
  assert.equal(second.max-second.hp,8);
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
      assert.equal(paths({...s,units:[]},{pos:start},s.width*s.height).size,s.width*s.height-s.walls.length-s.voids.length-1);
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
      act(s,'p0',{type:'next'},()=>((size*17+floor*13)%97)/97);
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
  assert.equal(Object.keys(slots).length,9);
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
  const started=await request(path+'/action',{type:'start'},host.key);
  assert.equal(started.state.phase,'combat');
  const origin=started.state.units.find(u=>u.id===host.id).pos;
  const moved=await request(path+'/action',{type:'move',pos:origin-2},host.key);
  const next=await request(path,null,peer.key);
  const event=next.state.events.find(e=>e.kind==='move');
  assert.deepEqual(event.path,[origin-1,origin-2]);
  assert.deepEqual(event,moved.state.events.at(-1));
  assert.equal(next.state.mp,1);
  assert.ok(!JSON.stringify(next).includes(host.key));
  assert.equal((await request(path+'/action',{type:'end'},host.key)).status,200);
  const active=await request(path,null,peer.key);
  assert.equal(active.state.units[active.state.turn].id,peer.id);
});
