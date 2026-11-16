export const classes = {
  guardia: { name: 'Guardián', hp: 38, skills: [['Tajo', 1, 1, 7, 10], ['Guardia', 1, 0, 5, 8, 'heal']] },
  tirador: { name: 'Tirador', hp: 31, skills: [['Flecha', 1, 4, 5, 8], ['Disparo certero', 2, 6, 12, 16]] },
  mistico: { name: 'Místico', hp: 32, skills: [['Ascua', 1, 3, 6, 9], ['Restaurar', 1, 3, 5, 8, 'heal']] }
};
const cells = Array.from({length:64}, (_, i) => i);
const distance = (a, b) => Math.abs(a % 8 - b % 8) + Math.abs((a >> 3) - (b >> 3));
const alive = unit => unit.hp > 0;
const fail = message => { throw new Error(message); };
export function create() {
  return { phase:'lobby', floor:0, players:[], units:[], walls:[], log:[], turn:0, deadline:0 };
}
export function join(state, id, name, classId) {
  if (state.phase !== 'lobby' || state.players.length >= 4) fail('La sala no admite más jugadores.');
  if (!Object.hasOwn(classes, classId)) fail('Elige una clase válida.');
  state.players.push({ id, name:String(name || 'Aventurero').trim().slice(0,22) || 'Aventurero', classId, bonus:0, extra:0 });
}
const note = (s, text) => { s.log = [text, ...s.log].slice(0,12); };
export function encounter(floor, size) {
  const count = Math.min(6, 1 + Math.floor(floor / 2) + size - 1);
  return Array.from({length:count}, (_, i) => {
    const boss = floor === 5 && i === 0;
    const ranged = !boss && floor > 1 && i % 2 === 1;
    return { id:'enemy'+i, name:boss?'Rey de Ámbar':ranged?'Vigía':'Acechador', boss, enemy:true,
      range:ranged?4:1, hp:boss?32+6*(size-1):9+2*floor, damage:2+Math.floor(floor/2)+(boss?3:0) };
  });
}
function openFloor(s) {
  s.phase = 'combat';
  s.floor++;
  s.walls = [[26,37],[19,28,35],[18,21,42,45],[17,22,33,38],[25,30,33,38]][s.floor-1];
  const heroes = s.players.map((p, i) => {
    const previous = s.units.find(u => u.id === p.id);
    const max = classes[p.classId].hp + p.extra;
    return {...p, max, hp:previous ? Math.min(max, Math.max(0, previous.hp) + Math.ceil(max * .45)) : max, pos:[59,60,57,62][i]};
  });
  const foes = encounter(s.floor, s.players.length).map((u,i) => ({...u, max:u.hp, pos:[3,4,1,6,10,13][i]}));
  s.units = heroes.flatMap((hero,i) => [hero, ...foes.slice(i,i+1)]).concat(foes.slice(heroes.length));
  s.turn = 0;
  s.mark = [];
  note(s,'Piso '+s.floor+' · '+(s.floor === 5 ? 'Cámara del Rey' : 'La cripta se abre'));
  resetTurn(s);
}
function resetTurn(s) {
  s.mp = 3;
  s.ap = 2;
  s.deadline = Date.now() + 30000;
  if (s.units[s.turn].enemy) s.deadline = Date.now()+450;
}
export function reachable(s, unit, limit) {
  const blocked = new Set([...s.walls,...s.units.filter(alive).map(u => u.pos)]);
  const steps = new Map([[unit.pos,0]]);
  for (const [pos, cost] of steps) {
    if (cost >= limit) continue;
    for (const next of [pos-8,pos+8,pos-1,pos+1]) {
      if (next < 0 || next >= 64 || distance(pos,next) !== 1 || blocked.has(next) || steps.has(next)) continue;
      steps.set(next,cost+1);
    }
  }
  steps.delete(unit.pos);
  return steps;
}
function finish(s) {
  if (!s.units.some(u => !u.enemy && alive(u))) { s.phase='lost'; return true; }
  if (!s.units.some(u => u.enemy && alive(u))) {
    s.phase = s.floor === 5 ? 'won' : 'reward';
    s.picks = [];
    s.deadline = Date.now()+30000;
    return true;
  }
  return false;
}
function advance(s) {
  if (finish(s)) return;
  do { s.turn = (s.turn + 1) % s.units.length; } while (!alive(s.units[s.turn]));
  resetTurn(s);
}
export function tick(s, rng = Math.random) {
  if (Date.now() < s.deadline) return false;
  if (s.phase === 'reward') { openFloor(s); return true; }
  if (s.phase !== 'combat') return false;
  const unit = s.units[s.turn];
  if (unit.enemy) {
    const heroes = s.units.filter(u => !u.enemy && alive(u));
    if (unit.boss && s.mark.length) {
      for (const hero of heroes.filter(h => s.mark.includes(h.pos))) hit(s,unit,hero,unit.damage+5);
      s.mark = [];
    } else if (unit.boss && unit.warnNext !== false) {
      const target = heroes.reduce((a,b) => distance(unit.pos,a.pos) <= distance(unit.pos,b.pos) ? a : b);
      s.mark = cells.filter(pos => distance(pos,target.pos) <= 1);
      unit.warnNext = false;
      note(s, '¡El Rey marca las casillas rojas!');
    } else {
      unit.warnNext = true;
      const closest = pos => Math.min(...heroes.map(h => distance(pos,h.pos)));
      const choices = [unit.pos,...reachable(s,unit,2).keys()];
      if (closest(unit.pos) > unit.range) unit.pos = choices.reduce((a,b) => closest(a) <= closest(b) ? a : b);
      const target = heroes.filter(h => distance(unit.pos,h.pos) <= unit.range).sort((a,b) => a.hp-b.hp)[0];
      if (target) hit(s,unit,target,unit.damage+Math.floor(rng()*3));
    }
  } else {
    note(s,unit.name+' se quedó sin tiempo.');
  }
  advance(s);
  return true;
}
function hit(s, actor, target, damage, critical=false) {
  target.hp = Math.max(0,target.hp-damage);
  note(s,actor.name+' inflige '+damage+' a '+target.name+(critical?' · crítico':''));
}
export function act(s, id, action, rng=Math.random) {
  const p = s.players.find(player => player.id === id);
  if (!p) fail('Jugador desconocido.');
  const host = s.players[0].id === id;
  if (action.type === 'start' && s.phase === 'lobby' && host) { openFloor(s); return; }
  if (action.type === 'restart' && ['won','lost'].includes(s.phase) && host) {
    s.phase='lobby'; s.floor=0; s.units=[]; s.walls=[]; s.mark=[]; s.log=[];
    for (const player of s.players) { player.bonus=0; player.extra=0; }
    return;
  }
  if (action.type === 'reward' && s.phase === 'reward') {
    if (s.picks.includes(id) || !['power','health'].includes(action.choice)) fail('Mejora inválida.');
    if (action.choice === 'power') p.bonus += 1;
    else p.extra += 5;
    s.picks.push(id);
    if (s.picks.length === s.players.length) openFloor(s);
    return;
  }
  if (s.phase !== 'combat' || s.units[s.turn].id !== id || Date.now() >= s.deadline) fail('No es tu turno.');
  const unit = s.units[s.turn];
  if (action.type === 'end') { advance(s); return; }
  if (action.type === 'move') {
    const cost = reachable(s,unit,s.mp).get(action.pos);
    if (cost === undefined) fail('Casilla fuera de alcance.');
    unit.pos=action.pos; s.mp-=cost; return;
  }
  if (action.type !== 'skill' || ![0,1].includes(action.skill)) fail('Acción inválida.');
  const [name,cost,range,min,max,kind] = classes[unit.classId].skills[action.skill];
  if (cost > s.ap) fail('No te quedan suficientes puntos de acción.');
  const target = s.units.find(u => alive(u) && u.pos === action.pos);
  if (!target || !!target.enemy === (kind === 'heal') || distance(unit.pos,target.pos) > range) fail('Objetivo fuera de alcance o inválido.');
  const critical = kind !== 'heal' && rng() < .15;
  const amount = min + Math.floor(rng()*(max-min+1)) + unit.bonus + (critical?3:0);
  s.ap -= cost;
  if (kind === 'heal') {
    const previous = target.hp;
    target.hp = Math.min(target.max,target.hp+amount);
    note(s, name+' restaura '+(target.hp-previous)+' PV a '+target.name);
  } else hit(s,unit,target,amount,critical);
  finish(s);
}
