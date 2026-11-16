import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { server } from './server.js';
import { create, join, act, encounter } from './engine.js';

test('rechaza acciones fuera de turno, movimiento inválido y gasto excesivo', () => {
  const s=create();
  join(s,'one','Uno','tirador');
  join(s,'two','Dos','guardia');
  act(s,'one',{type:'start'});
  assert.throws(()=>act(s,'two',{type:'end'}),/turno/);
  assert.throws(()=>act(s,'one',{type:'move',pos:0}),/alcance/);
  s.units.find(u=>u.enemy).pos=51;
  act(s,'one',{type:'skill',skill:0,pos:51},()=>.2);
  assert.equal(s.ap,1);
  assert.throws(()=>act(s,'one',{type:'skill',skill:1,pos:51}),/puntos/);
});

test('escala los encuentros y pasa de los pisos a la victoria y al reinicio', () => {
  assert.ok(encounter(1,4).length>encounter(1,1).length);
  assert.ok(encounter(5,1)[1].hp>encounter(1,1)[0].hp);
  const s=create();
  join(s,'one','Uno','tirador');
  act(s,'one',{type:'start'});
  for(let floor=1;floor<=5;floor++){
    assert.equal(s.floor,floor);
    const enemies=s.units.filter(u=>u.enemy);
    const [target,...rest]=enemies;
    for(const enemy of rest)enemy.hp=0;
    target.pos=51;
    target.hp=1;
    act(s,'one',{type:'skill',skill:0,pos:51},()=>.2);
    if(floor<5) {
      assert.equal(s.phase,'reward');
      act(s,'one',{type:'reward',choice:'power'});
    }
  }
  assert.equal(s.phase,'won');
  act(s,'one',{type:'restart'});
  assert.equal(s.phase,'lobby');
  assert.equal(s.players[0].bonus,0);
});
test('el servidor comparte sala, estado y acciones entre dos clientes', {timeout:10000}, async t => {
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  t.after(()=>server.close());
  const {port}=server.address();
  const base='http://127.0.0.1:'+port;
  assert.match(await (await fetch(base)).text(),/Cripta del tusi/);
  const request=async (path,body,key)=>{
    const response=await fetch(base+path,{
      method:body?'POST':'GET',
      headers:{'Content-Type':'application/json',...(key?{Authorization:'Bearer '+key}:{})},
      body:body?JSON.stringify(body):undefined
    });
    return {status:response.status,...await response.json()};
  };
  const host=await request('/api/rooms',{name:'Uno',classId:'tirador'});
  assert.equal(host.status,200);
  const path='/api/'+host.code;
  const peer=await request(path+'/join',{name:'Dos',classId:'mistico'});
  assert.equal(peer.status,200);
  assert.equal((await request(path)).status,401);
  assert.equal((await request(path+'/action',{type:'start'},peer.key)).status,400);
  assert.equal((await request(path+'/action',{type:'start'},host.key)).state.phase,'combat');
  assert.equal((await request(path+'/action',{type:'move',pos:51},host.key)).status,200);
  const next=await request(path,null,peer.key);
  assert.equal(next.state.units.find(u=>u.id===host.id).pos,51);
  assert.equal(next.state.mp,2);
  assert.ok(!JSON.stringify(next).includes(host.key));
  assert.equal((await request(path+'/action',{type:'end'},host.key)).status,200);
  const active=await request(path,null,peer.key);
  assert.notEqual(active.state.units[active.state.turn].id,host.id);
});
