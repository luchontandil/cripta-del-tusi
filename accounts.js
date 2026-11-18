// Cuentas: registro, sesión, Esquirlas, cartas y mazos, amigos e invitaciones.
import {randomBytes,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {getJSON,setJSON,remove} from './store.js';
import {runPoints,cards,classes,cleanLoadout,defaultLoadout,ACTIVE_SLOTS,MAX_ACTIVE_SLOTS,EXTRA_SLOT_PRICE,PASSIVE_SLOTS,MAX_PASSIVE_SLOTS,PASSIVE_SLOT_PRICE} from './engine.js';

const scrypt=promisify(scryptCallback);
const sessionDays=30;
const onlineWindow=45000;
export const nickKey=nick=>'user:'+String(nick).trim().toLowerCase();
const fail=message=>{throw Object.assign(new Error(message),{status:400});};

function validNick(nick){
  const clean=String(nick||'').trim();
  if(!/^[\p{L}\p{N}_.-]{3,16}$/u.test(clean))fail('El nick debe tener de 3 a 16 letras, números, punto, guion o guion bajo.');
  return clean;
}
async function hashPassword(password,salt=randomBytes(16).toString('hex')){
  const hash=(await scrypt(String(password),salt,32)).toString('hex');
  return {salt,hash};
}
/** Administradores: «passa» siempre, más los nicks de la variable de entorno ADMIN_NICKS (separados por comas). */
const builtInAdmins=['passa'];
export function isAdmin(nick){
  const list=[...builtInAdmins,...String(process.env.ADMIN_NICKS||'').split(',')].map(n=>n.trim().toLowerCase()).filter(Boolean);
  return !!nick&&list.includes(String(nick).trim().toLowerCase());
}
/**
 * Progreso de cuenta (versión 2: Esquirlas y cartas). Las cuentas anteriores empiezan de cero:
 * se conservan nick, contraseña y amigos; Esquirlas, cartas, maestrías y partidas se reinician.
 */
const PROGRESS=2;
function ensureProgress(user){
  if(user.progress===PROGRESS)return false;
  Object.assign(user,{progress:PROGRESS,shards:0,cards:[],slots:{},loadouts:{},runs:0,best:0});
  delete user.points;delete user.spent;delete user.mastery;
  return true;
}
/** Huecos de carta activa de una clase (3, o 4 si se compró el extra). */
export const slotsOf=(user,classId)=>Math.min(MAX_ACTIVE_SLOTS,user?.slots?.[classId]||ACTIVE_SLOTS);
export const passiveSlotsOf=(user,classId)=>Math.min(MAX_PASSIVE_SLOTS,user?.passiveSlots?.[classId]||PASSIVE_SLOTS);
/** Mazos de todas las clases, validados contra lo que tiene la cuenta (sin cuenta: los de inicio). */
export function loadoutsOf(user){
  return Object.fromEntries(Object.keys(classes).map(classId=>[classId,user
    ?cleanLoadout(classId,user.loadouts?.[classId]||defaultLoadout(classId),user.cards,slotsOf(user,classId),passiveSlotsOf(user,classId))
    :defaultLoadout(classId)]));
}
/** Datos públicos de la cuenta (sin contraseña). */
export function publicUser(user){
  return {admin:isAdmin(user.nick),nick:user.nick,shards:user.shards||0,cards:user.cards||[],slots:user.slots||{},passiveSlots:user.passiveSlots||{},loadouts:loadoutsOf(user),
    friends:user.friends,invites:(user.invites||[]).filter(i=>Date.now()-i.at<600000),runs:user.runs||0,best:user.best||0};
}
async function newSession(nick){
  const token=randomBytes(24).toString('hex');
  await setJSON('session:'+token,{nick},sessionDays*86400);
  return token;
}
export async function register(nick,password){
  nick=validNick(nick);
  if(String(password||'').length<6)fail('La contraseña debe tener al menos 6 caracteres.');
  if(await getJSON(nickKey(nick)))fail('Ese nick ya existe.');
  const {salt,hash}=await hashPassword(password);
  const user={nick,salt,hash,progress:PROGRESS,shards:0,cards:[],slots:{},loadouts:{},friends:[],invites:[],runs:0,best:0,created:Date.now(),seen:Date.now()};
  await setJSON(nickKey(nick),user);
  return {token:await newSession(nick),user:publicUser(user)};
}
export async function login(nick,password){
  const user=await getJSON(nickKey(nick));
  if(!user)fail('Nick o contraseña incorrectos.');
  const {hash}=await hashPassword(password,user.salt);
  if(!timingSafeEqual(Buffer.from(hash,'hex'),Buffer.from(user.hash,'hex')))fail('Nick o contraseña incorrectos.');
  if(ensureProgress(user))await setJSON(nickKey(user.nick),user);
  return {token:await newSession(user.nick),user:publicUser(user)};
}
export async function logout(token){if(token){sessionCache.delete(token);await remove('session:'+token);}}
/** Usuario de una sesión; marca la hora de última conexión. */
export async function userFromToken(token,touch=true){
  if(!token)return null;
  const session=await getJSON('session:'+token);
  if(!session)return null;
  const user=await getJSON(nickKey(session.nick));
  if(!user)return null;
  const reset=ensureProgress(user);
  if(reset||(touch&&Date.now()-(user.seen||0)>15000)){user.seen=Date.now();await setJSON(nickKey(user.nick),user);}
  return user;
}
async function save(user){await setJSON(nickKey(user.nick),user);}
/** Comprar una carta con Esquirlas. */
export async function buyCard(user,id){
  const card=cards[id];
  if(!card)fail('Esa carta no existe.');
  if(card.starter||user.cards.includes(id))fail('Ya tienes esa carta.');
  if((user.shards||0)<card.price)fail('No tienes Esquirlas suficientes.');
  user.shards-=card.price;
  user.cards.push(id);
  await save(user);
  return publicUser(user);
}
/** Comprar el hueco extra de carta activa para una clase. */
export async function buySlot(user,classId){
  if(!Object.hasOwn(classes,classId))fail('Clase desconocida.');
  if(slotsOf(user,classId)>=MAX_ACTIVE_SLOTS)fail('Esa clase ya tiene el hueco extra.');
  if((user.shards||0)<EXTRA_SLOT_PRICE)fail('No tienes Esquirlas suficientes.');
  user.shards-=EXTRA_SLOT_PRICE;
  user.slots={...user.slots,[classId]:MAX_ACTIVE_SLOTS};
  await save(user);
  return publicUser(user);
}
/** Comprar el 2.º hueco de pasiva para una clase (caro). */
export async function buyPassiveSlot(user,classId){
  if(!Object.hasOwn(classes,classId))fail('Clase desconocida.');
  if(passiveSlotsOf(user,classId)>=MAX_PASSIVE_SLOTS)fail('Esa clase ya tiene el 2.º hueco de pasiva.');
  if((user.shards||0)<PASSIVE_SLOT_PRICE)fail('No tienes Esquirlas suficientes.');
  user.shards-=PASSIVE_SLOT_PRICE;
  user.passiveSlots={...user.passiveSlots,[classId]:MAX_PASSIVE_SLOTS};
  await save(user);
  return publicUser(user);
}
/** Guardar el mazo de una clase (se valida contra las cartas que se tienen). */
export async function saveLoadout(user,classId,loadout){
  if(!Object.hasOwn(classes,classId))fail('Clase desconocida.');
  const actives=(loadout?.actives||[]).filter(id=>cards[id]?.kind==='active');
  if(!actives.length)fail('Equipa al menos una carta activa.');
  user.loadouts={...user.loadouts,[classId]:cleanLoadout(classId,{actives,passives:loadout?.passives||(loadout?.passive?[loadout.passive]:[])},user.cards,slotsOf(user,classId),passiveSlotsOf(user,classId))};
  await save(user);
  return publicUser(user);
}
/** Suma las Esquirlas de una partida terminada. */
export async function awardRun(nick,summary){
  const user=await getJSON(nickKey(nick));
  if(!user)return 0;
  ensureProgress(user);
  const points=runPoints(summary);
  user.shards=(user.shards||0)+points;
  user.runs=(user.runs||0)+1;
  user.best=Math.max(user.best||0,Math.floor(Number(summary.floor)||0));
  await save(user);
  return points;
}
/** Partida en solitario: el cliente envía el resumen; una vez cada 30 s como máximo. */
export async function awardSolo(user,summary){
  if(Date.now()-(user.lastAward||0)<30000)fail('Puntos ya guardados.');
  const points=runPoints(summary);
  user.lastAward=Date.now();
  user.shards=(user.shards||0)+points;
  user.runs=(user.runs||0)+1;
  user.best=Math.max(user.best||0,Math.floor(Number(summary.floor)||0));
  await save(user);
  return {points,user:publicUser(user)};
}
export async function addFriend(user,nick){
  const other=await getJSON(nickKey(nick));
  if(!other)fail('No existe ningún jugador con ese nick.');
  if(other.nick===user.nick)fail('No puedes agregarte a ti mismo.');
  if(!user.friends.includes(other.nick))user.friends.push(other.nick);
  if(!other.friends.includes(user.nick))other.friends.push(user.nick);
  await save(user);await save(other);
  return publicUser(user);
}
export async function removeFriend(user,nick){
  user.friends=user.friends.filter(f=>f.toLowerCase()!==String(nick).toLowerCase());
  await save(user);
  const other=await getJSON(nickKey(nick));
  if(other){other.friends=other.friends.filter(f=>f!==user.nick);await save(other);}
  return publicUser(user);
}
/** Lista de amigos con su estado de conexión. */
export async function friendList(user){
  const list=await Promise.all(user.friends.map(async nick=>{
    const other=await getJSON(nickKey(nick));
    return other?{nick:other.nick,online:Date.now()-(other.seen||0)<onlineWindow,best:other.best||0}:null;
  }));
  return list.filter(Boolean);
}
// Invitaciones en vivo: además de guardarse en la cuenta, quedan en memoria para que el aviso
// llegue en segundos sin gastar consultas a la base de datos (ruta /api/account/ping).
const liveInvites=new Map();
const sessionCache=new Map();
const fresh=list=>(list||[]).filter(i=>Date.now()-i.at<600000);
export function pendingInvites(nick){return nick?fresh(liveInvites.get(String(nick).toLowerCase())):[];}
/** Nick de una sesión, con caché en memoria (para consultas frecuentes y baratas). */
export async function nickFromToken(token){
  if(!token)return null;
  const hit=sessionCache.get(token);
  if(hit&&hit.until>Date.now())return hit.nick;
  const session=await getJSON('session:'+token);
  if(sessionCache.size>5000)sessionCache.clear();
  sessionCache.set(token,{nick:session?.nick||null,until:Date.now()+(session?600000:30000)});
  return session?.nick||null;
}
export async function invite(user,nick,code){
  if(!user.friends.some(f=>f.toLowerCase()===String(nick).toLowerCase()))fail('Solo puedes invitar a tus amigos.');
  const other=await getJSON(nickKey(nick));
  if(!other)fail('Jugador no encontrado.');
  other.invites=(other.invites||[]).filter(i=>i.from!==user.nick&&Date.now()-i.at<600000);
  other.invites.push({from:user.nick,code,at:Date.now()});
  liveInvites.set(other.nick.toLowerCase(),other.invites.slice());
  await save(other);
}
export async function dismissInvite(user,from){
  user.invites=(user.invites||[]).filter(i=>i.from!==from);
  liveInvites.set(user.nick.toLowerCase(),fresh(liveInvites.get(user.nick.toLowerCase())).filter(i=>i.from!==from));
  await save(user);
  return publicUser(user);
}

// ───────────── Mezcla de sonidos (editor de SFX, solo administradores) ─────────────
const mixKey='sfx:mix';
let bankCache=null;
async function soundBank(){
  if(!bankCache){
    const {readFile}=await import('node:fs/promises');
    bankCache=JSON.parse(await readFile(new URL('./sfx/bank.json',import.meta.url),'utf8'));
  }
  return bankCache;
}
export async function soundMix(){return (await getJSON(mixKey))||{};}
/** Valida y guarda la mezcla: volumen, tono, variantes desactivadas y origen de cada categoría. */
export async function saveSoundMix(user,mix){
  if(!isAdmin(user.nick))throw Object.assign(new Error('Solo un administrador puede editar los sonidos.'),{status:403});
  const bank=await soundBank();
  const current=await soundMix();
  const clean={};
  for(const [key,entry] of Object.entries(mix||{})){
    if(!Object.hasOwn(bank,key)||!entry||typeof entry!=='object')continue;
    const out={};
    const from=typeof entry.from==='string'&&Object.hasOwn(bank,entry.from)&&entry.from!==key&&!entry.from.startsWith('amb_')===!key.startsWith('amb_')?entry.from:null;
    if(from)out.from=from;
    const count=bank[from||key];
    const vol=Number(entry.volume);if(Number.isFinite(vol)&&vol!==1)out.volume=Math.round(Math.min(2,Math.max(0,vol))*100)/100;
    const pitch=Number(entry.pitch);if(Number.isFinite(pitch)&&pitch!==1)out.pitch=Math.round(Math.min(2,Math.max(.5,pitch))*100)/100;
    const off=Array.isArray(entry.off)?[...new Set(entry.off.map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=count))].sort((a,b)=>a-b):[];
    if(off.length)out.off=off;
    // Los archivos subidos los gestiona el servidor: se conservan tal cual.
    if(current[key]?.files?.length)out.files=current[key].files;
    if(Object.keys(out).length)clean[key]=out;
  }
  for(const [key,entry] of Object.entries(current))if(entry.files?.length&&!clean[key])clean[key]={files:entry.files};
  await setJSON(mixKey,clean);
  return clean;
}
const audioTypes={'audio/ogg':'ogg','audio/mpeg':'mp3','audio/mp3':'mp3','audio/wav':'wav','audio/x-wav':'wav','audio/wave':'wav','audio/webm':'webm'};
export const MAX_SOUND_BYTES=450*1024;
/** Sube un sonido propio para una categoría (reemplaza a sus variantes originales). */
export async function uploadSound(user,{key,name,type,data}){
  if(!isAdmin(user.nick))throw Object.assign(new Error('Solo un administrador puede editar los sonidos.'),{status:403});
  const bank=await soundBank();
  if(!Object.hasOwn(bank,key))fail('Categoría de sonido desconocida.');
  if(!audioTypes[type])fail('Formato no admitido: usa OGG, MP3, WAV o WEBM.');
  const bytes=Buffer.from(String(data||''),'base64');
  if(!bytes.length)fail('El archivo está vacío.');
  if(bytes.length>MAX_SOUND_BYTES)fail('El archivo es demasiado grande (máximo 450 KB). Recórtalo o pásalo a OGG/MP3.');
  const mix=await soundMix();
  const entry=mix[key]||(mix[key]={});
  entry.files=entry.files||[];
  if(entry.files.length>=8)fail('Máximo 8 sonidos propios por categoría.');
  const id=randomBytes(8).toString('hex');
  await setJSON('sfx:file:'+id,{type,data:bytes.toString('base64')});
  entry.files.push({id,name:String(name||'sonido').replace(/[^\p{L}\p{N} ._-]/gu,'').slice(0,40)||'sonido'});
  await setJSON(mixKey,mix);
  return mix;
}
export async function deleteSound(user,{key,id}){
  if(!isAdmin(user.nick))throw Object.assign(new Error('Solo un administrador puede editar los sonidos.'),{status:403});
  const mix=await soundMix();
  const entry=mix[key];
  if(!entry?.files?.some(f=>f.id===id))fail('Ese sonido ya no existe.');
  entry.files=entry.files.filter(f=>f.id!==id);
  if(!entry.files.length)delete entry.files;
  if(!Object.keys(entry).length)delete mix[key];
  await remove('sfx:file:'+id);
  await setJSON(mixKey,mix);
  return mix;
}
export async function soundFile(id){
  if(!/^[0-9a-f]{16}$/.test(String(id)))return null;
  return getJSON('sfx:file:'+id);
}
