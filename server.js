import {readFileSync} from 'node:fs';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { create, join, act, tick, leave } from './engine.js';
import * as accounts from './accounts.js';
// Versión publicada: Render pone el commit en RENDER_GIT_COMMIT; la de los ficheros sale de index.html.
const liveVersion={
  commit:(process.env.RENDER_GIT_COMMIT||'').slice(0,7)||null,
  assets:(readFileSync(new URL('./index.html',import.meta.url),'utf8').match(/client\.js\?v=(\d+)/)||[])[1]||null,
  since:Date.now()
};
import { persistent } from './store.js';

export const rooms = new Map();
const assets = {'/':'index.html','/client.js':'client.js','/engine.js':'engine.js','/art.js':'art.js','/music.js':'music.js','/icons.js':'icons.js','/style.css':'style.css',
  '/isometric.js':'isometric.js','/models3d.js':'models3d.js','/three.module.js':'three.module.js','/three.core.js':'three.core.js','/three-LICENSE.txt':'three-LICENSE.txt','/favicon.svg':'favicon.svg'};
const mime = {html:'text/html',js:'text/javascript',css:'text/css',txt:'text/plain',ogg:'audio/ogg',json:'application/json',md:'text/markdown',svg:'image/svg+xml'};
const token = bytes => randomBytes(bytes).toString('hex');
const snapshot = room => ({
  ...room.state,
  players:room.state.players.map(p => ({...p})),
});
export const server = createServer(async (req,res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization, X-Account');
  const send = (status, data) => {
    res.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store'});
    res.end(JSON.stringify(data));
  };
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  const path = req.url.split('?')[0];
  try {
    // Banco de sonidos: solo nombres simples dentro de sfx/.
    if (req.method === 'GET' && /^\/sfx\/([a-z0-9_]+\.(ogg|json)|CREDITS\.md)$/.test(path)) {
      const content = await readFile(new URL('.'+path,import.meta.url)).catch(()=>null);
      if (!content) return send(404,{error:'Sonido no encontrado.'});
      res.writeHead(200, {'Content-Type':mime[path.split('.').at(-1)],'Cache-Control':'public, max-age=86400'});
      res.end(content);
      return;
    }
    if (req.method === 'GET' && Object.hasOwn(assets,path)) {
      const file = assets[path];
      const content = await readFile(new URL('./'+file,import.meta.url));
      res.writeHead(200, {'Content-Type':mime[file.split('.').at(-1)]+'; charset=utf-8'});
      res.end(content);
      return;
    }
    // Sonidos subidos por el administrador.
    const custom = /^\/api\/sfx\/file\/([0-9a-f]{16})$/.exec(path);
    if (req.method === 'GET' && custom) {
      const file = await accounts.soundFile(custom[1]);
      if (!file) return send(404,{error:'Sonido no encontrado.'});
      res.writeHead(200, {'Content-Type':file.type,'Cache-Control':'public, max-age=31536000, immutable'});
      res.end(Buffer.from(file.data,'base64'));
      return;
    }
    const [,service,code,operation] = path.split('/');
    if (service !== 'api') return send(404,{error:'Ruta desconocida.'});
    let body = {};
    if (req.method === 'POST') {
      let input = '';
      const limit = path === '/api/account/sfx-upload' ? 640*1024 : path === '/api/account/sfx-mix' ? 32768 : 4096;
      for await (const chunk of req) {
        input += chunk;
        if (input.length > limit) return send(413,{error:'Solicitud demasiado grande.'});
      }
      body = JSON.parse(input || '{}');
    }
    const accountToken = req.headers['x-account'] || null;
    if (code === 'account') return send(200, await accountRoute(operation, req.method, body, accountToken));
    if (code === 'sfx' && operation === 'mix' && req.method === 'GET') return send(200,{mix:await accounts.soundMix()});
    if (req.method === 'POST' && ((code === 'rooms' && !operation) || operation === 'join')) {
      const creating = code === 'rooms';
      if (creating && rooms.size >= 250) return send(503,{error:'Servidor lleno.'});
      const room = creating ? {state:create(), keys:new Map(), touched:Date.now()} : rooms.get(code);
      if (!room) return send(404,{error:'Sala no encontrada.'});
      const id = token(5);
      const key = token(24);
      // Con cuenta: el nombre es el nick y se aplican sus maestrías.
      const user = await accounts.userFromToken(accountToken);
      // La misma cuenta que vuelve a entrar sustituye a su hueco anterior (no se duplica).
      if (user && room.state.phase === 'lobby') for (const old of room.state.players.filter(p => p.account === user.nick)) dropPlayer(room, old.id);
      join(room.state,id,user?.nick||body.name,body.classId,user?{mastery:user.mastery,account:user.nick}:{});
      room.keys.set(key,id);
      (room.seen ||= new Map()).set(id,Date.now());
      room.touched = Date.now();
      let roomCode = code;
      if (creating) {
        do { roomCode = token(3).toUpperCase(); } while (rooms.has(roomCode));
        rooms.set(roomCode,room);
      }
      return send(200,{id,key,code:roomCode,state:snapshot(room)});
    }
    const room = rooms.get(code);
    if (!room) return send(404,{error:'Sala no encontrada.'});
    const id = room.keys.get(req.headers.authorization?.slice(7));
    if (!id) return send(401,{error:'Sesión inválida.'});
    room.touched=Date.now();
    (room.seen ||= new Map()).set(id,Date.now());
    if (req.method === 'POST' && operation === 'leave') {
      dropPlayer(room,id);
      if (!room.state.players.length) rooms.delete(code);
      return send(200,{ok:true});
    }
    pruneLobby(room);
    if (req.method === 'POST' && operation === 'action') {
      // Maestrías en la sala: se leen de la cuenta del jugador, no de lo que mande el cliente.
      if (body.type === 'mastery') {
        const user = await accounts.userFromToken(accountToken);
        const player = room.state.players.find(p => p.id === id);
        if (!user || !player || (player.account && player.account !== user.nick)) return send(400,{error:'Entra con tu cuenta para usar maestrías.'});
        body = {type:'mastery', mastery:user.mastery, trusted:true};
      } else if (body && typeof body === 'object') delete body.trusted;
      act(room.state,id,body);
      if (room.state.phase === 'lobby') room.awarded = false;
      await settle(room);
    }
    else if (req.method !== 'GET' || operation) return send(404,{error:'Ruta desconocida.'});
    await settle(room);
    return send(200,{state:snapshot(room)});
  } catch (error) {
    send(error.status || 400,{error:error.message});
  }
});
/** Quita a un jugador de la sala de espera y anula su sesión. */
function dropPlayer(room,id){
  if (!leave(room.state,id)) return;
  for (const [key,owner] of room.keys) if (owner === id) room.keys.delete(key);
  room.seen?.delete(id);
}
/** En la sala de espera, quien lleva 15 s sin dar señales (cerró la pestaña) deja su hueco. */
const LOBBY_IDLE = 15000;
function pruneLobby(room){
  if (room.state.phase !== 'lobby') return;
  const now = Date.now();
  for (const p of [...room.state.players]) if (now - (room.seen?.get(p.id) ?? now) > LOBBY_IDLE) dropPlayer(room,p.id);
}
/** Al terminar una partida en sala, reparte los puntos a cada cuenta (una sola vez). */
async function settle(room){
  const s=room.state;
  if(room.awarded||!['won','lost'].includes(s.phase))return;
  room.awarded=true;
  for(const p of s.players){
    if(p.account)await accounts.awardRun(p.account,{floor:s.floor,bossKills:s.bossKills,won:s.phase==='won'}).catch(()=>{});
  }
}
/** Rutas de cuentas: /api/account/<operación>. */
async function accountRoute(operation,method,body,tokenValue){
  if(method==='POST'&&operation==='register')return accounts.register(body.nick,body.password);
  if(method==='POST'&&operation==='login')return accounts.login(body.nick,body.password);
  if(method==='GET'&&operation==='status')return {persistent,...liveVersion};
  const user=await accounts.userFromToken(tokenValue);
  if(!user)throw Object.assign(new Error('Sesión de cuenta caducada. Vuelve a entrar.'),{status:401});
  if(method==='POST'&&operation==='logout'){await accounts.logout(tokenValue);return {ok:true};}
  if(method==='GET'&&operation==='me')return {user:accounts.publicUser(user),friends:await accounts.friendList(user)};
  if(method!=='POST')throw new Error('Ruta desconocida.');
  if(operation==='mastery')return {user:await accounts.buyMastery(user,body.key)};
  if(operation==='mastery-reset')return {user:await accounts.resetMastery(user)};
  if(operation==='friend')return {user:await accounts.addFriend(user,body.nick),friends:await accounts.friendList(user)};
  if(operation==='unfriend'){const updated=await accounts.removeFriend(user,body.nick);return {user:updated,friends:await accounts.friendList({...user,friends:updated.friends})};}
  if(operation==='invite'){
    const room=rooms.get(String(body.code||''));
    if(!room||room.state.phase!=='lobby')throw new Error('La sala ya no acepta jugadores.');
    if(!room.state.players.some(p=>p.account===user.nick))throw new Error('Solo puedes invitar a una sala en la que estés.');
    await accounts.invite(user,body.nick,body.code);
    return {ok:true};
  }
  if(operation==='dismiss')return {user:await accounts.dismissInvite(user,body.from)};
  if(operation==='award')return accounts.awardSolo(user,body);
  if(operation==='sfx-mix')return {mix:await accounts.saveSoundMix(user,body.mix)};
  if(operation==='sfx-upload')return {mix:await accounts.uploadSound(user,body)};
  if(operation==='sfx-delete')return {mix:await accounts.deleteSound(user,body)};
  throw new Error('Ruta desconocida.');
}
setInterval(() => {
  for (const [code, room] of rooms) {
    if (Date.now()-room.touched > 3600000) rooms.delete(code);
    else if (tick(room.state)) settle(room).catch(()=>{});
  }
},200).unref();
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  server.listen(Number(process.env.PORT || 3000),'0.0.0.0',()=>console.log('Cripta del tusi · puerto '+server.address().port));
}

