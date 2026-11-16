// Almacenamiento clave-valor para las cuentas.
// En producción usa Upstash Redis por su API REST (sin dependencias).
// Sin las variables de entorno usa memoria (desarrollo y tests).
const url=process.env.UPSTASH_REDIS_REST_URL;
const secret=process.env.UPSTASH_REDIS_REST_TOKEN;
const memory=new Map();
export const persistent=!!(url&&secret);

async function command(...args){
  const response=await fetch(url,{
    method:'POST',
    headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},
    body:JSON.stringify(args),
    signal:AbortSignal.timeout(8000)
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.error)throw new Error('Almacenamiento no disponible.');
  return data.result;
}
export async function getJSON(key){
  if(!persistent){
    const entry=memory.get(key);
    if(!entry)return null;
    if(entry.expires&&entry.expires<Date.now()){memory.delete(key);return null;}
    return structuredClone(entry.value);
  }
  const raw=await command('GET',key);
  return raw?JSON.parse(raw):null;
}
export async function setJSON(key,value,seconds){
  if(!persistent){
    memory.set(key,{value:structuredClone(value),expires:seconds?Date.now()+seconds*1000:0});
    return;
  }
  if(seconds)await command('SET',key,JSON.stringify(value),'EX',String(seconds));
  else await command('SET',key,JSON.stringify(value));
}
export async function remove(key){
  if(!persistent){memory.delete(key);return;}
  await command('DEL',key);
}
