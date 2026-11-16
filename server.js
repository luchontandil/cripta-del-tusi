import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { create, join, act, tick } from './engine.js';

const rooms = new Map();
const assets = {'/':'index.html','/client.js':'client.js','/engine.js':'engine.js','/art.js':'art.js','/music.js':'music.js','/style.css':'style.css',
  '/isometric.js':'isometric.js','/models3d.js':'models3d.js','/three.module.js':'three.module.js','/three.core.js':'three.core.js','/three-LICENSE.txt':'three-LICENSE.txt'};
const mime = {html:'text/html',js:'text/javascript',css:'text/css',txt:'text/plain'};
const token = bytes => randomBytes(bytes).toString('hex');
const snapshot = room => ({
  ...room.state,
  players:room.state.players.map(p => ({...p})),
});
export const server = createServer(async (req,res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  const send = (status, data) => {
    res.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store'});
    res.end(JSON.stringify(data));
  };
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  const path = req.url.split('?')[0];
  try {
    if (req.method === 'GET' && Object.hasOwn(assets,path)) {
      const file = assets[path];
      const content = await readFile(new URL('./'+file,import.meta.url));
      res.writeHead(200, {'Content-Type':mime[file.split('.').at(-1)]+'; charset=utf-8'});
      res.end(content);
      return;
    }
    const [,service,code,operation] = path.split('/');
    if (service !== 'api') return send(404,{error:'Ruta desconocida.'});
    let body = {};
    if (req.method === 'POST') {
      let input = '';
      for await (const chunk of req) {
        input += chunk;
        if (input.length > 4096) return send(413,{error:'Solicitud demasiado grande.'});
      }
      body = JSON.parse(input || '{}');
    }
    if (req.method === 'POST' && ((code === 'rooms' && !operation) || operation === 'join')) {
      const creating = code === 'rooms';
      if (creating && rooms.size >= 250) return send(503,{error:'Servidor lleno.'});
      const room = creating ? {state:create(), keys:new Map(), touched:Date.now()} : rooms.get(code);
      if (!room) return send(404,{error:'Sala no encontrada.'});
      const id = token(5);
      const key = token(24);
      join(room.state,id,body.name,body.classId);
      room.keys.set(key,id);
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
    if (req.method === 'POST' && operation === 'action') act(room.state,id,body);
    else if (req.method !== 'GET' || operation) return send(404,{error:'Ruta desconocida.'});
    return send(200,{state:snapshot(room)});
  } catch (error) {
    send(400,{error:error.message});
  }
});
setInterval(() => {
  for (const [code, room] of rooms) {
    if (Date.now()-room.touched > 3600000) rooms.delete(code);
    else tick(room.state);
  }
},200).unref();
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  server.listen(Number(process.env.PORT || 3000),'0.0.0.0',()=>console.log('Cripta del tusi · puerto '+server.address().port));
}

