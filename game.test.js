import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {server} from './server.js';
import {create,join,act,tick,encounter,paths,lineOfSight} from './engine.js';

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
  const to=archer.pos+3;
  assert.deepEqual(paths(s,archer,3).get(to),[to-2,to-1,to]);
  act(s,'p0',{type:'move',pos:to});
  assert.deepEqual(s.events.at(-1).path,[to-2,to-1,to]);
  assert.equal(s.mp,0);
  const enemy=s.units.find(u=>u.enemy);
  enemy.pos=to+3;
  s.walls=[to+1];
  assert.equal(lineOfSight(s,to,enemy.pos),false);
  assert.throws(()=>act(s,'p0',{type:'skill',skill:0,pos:enemy.pos}),/visión/);
  assert.equal(s.ap,4);
  s.walls=[];
  act(s,'p0',{type:'skill',skill:0,pos:enemy.pos},rng);
  assert.throws(()=>act(s,'p0',{type:'skill',skill:2,pos:enemy.pos}),/puntos/);
  assert.ok(encounter(3,4).length>encounter(3,1).length);
  assert.ok(encounter(5,1)[0].hp>encounter(1,1)[0].hp);
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
test('los jefes anuncian tres tipos de glifo y cadenas resta PM a quien empieza encima',()=>{
  const s=battle('tirador');
  s.floor=2;
  s.phase='reward';
  s.picks=['p0'];
  act(s,'p0',{type:'next'},rng);
  const boss=s.units[s.turn];
  assert.equal(boss.boss,true);
  timeout(s);
  assert.deepEqual(new Set(s.glyphs.map(g=>g.kind)),new Set(['damage','poison','slow']));
  assert.ok(s.glyphs.every(g=>g.warn));
  const hero=s.units.find(u=>u.id==='p0');
  hero.pos=s.glyphs.find(g=>g.kind==='slow').cells[0];
  while(s.units[s.turn]!==boss)timeout(s);
  timeout(s);
  assert.equal(s.glyphs.every(g=>!g.warn),true);
  assert.equal(s.units[s.turn],hero);
  assert.equal(s.mp,1);
});
test('genera botín con afijos y permite equipar, engarzar, extraer y vender una runa',()=>{
  const s=battle('tirador');
  const hero=s.units[s.turn];
  const enemy=s.units.find(u=>u.enemy);
  enemy.hp=1;
  enemy.pos=hero.pos+3;
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
  act(s,'p0',{type:'equip',item:gear.id},rng);
  const rune={kind:'rune',id:999,stats:{power:2},price:10};
  p.bag.push(rune);
  act(s,'p0',{type:'socket',item:rune.id,slot:gear.slot},rng);
  assert.equal(p.equipment[gear.slot].socket,rune);
  act(s,'p0',{type:'unsocket',slot:gear.slot},rng);
  const gold=p.gold;
  act(s,'p0',{type:'sell',item:rune.id},rng);
  assert.equal(p.gold,gold+5);
  act(s,'p0',{type:'next'},rng);
  assert.equal(s.floor,2);
});
test('dos clientes reciben la misma trayectoria completa y el cambio de turno', {timeout:10000}, async t=>{
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  t.after(()=>server.close());
  const base='http://127.0.0.1:'+server.address().port;
  assert.match(await (await fetch(base)).text(),/Cripta del tusi/);
  assert.equal((await fetch(base+'/art.js')).status,200);
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
  const moved=await request(path+'/action',{type:'move',pos:origin+2},host.key);
  const next=await request(path,null,peer.key);
  const event=next.state.events.find(e=>e.kind==='move');
  assert.deepEqual(event.path,[origin+1,origin+2]);
  assert.deepEqual(event,moved.state.events.at(-1));
  assert.equal(next.state.mp,1);
  assert.ok(!JSON.stringify(next).includes(host.key));
  assert.equal((await request(path+'/action',{type:'end'},host.key)).status,200);
  const active=await request(path,null,peer.key);
  assert.equal(active.state.units[active.state.turn].id,peer.id);
});
