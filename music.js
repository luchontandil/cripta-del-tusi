// Short, synthesized effects. This module never starts a soundtrack.
import {icon} from './icons.js?v=32';
export function setupSfx(button){
  let context,master;
  let muted=false;
  try{muted=localStorage.getItem('cripta-sfx-muted')==='yes';}catch{}
  function ready(){
    if(muted)return false;
    try{
      if(!context){
        const Audio=window.AudioContext||window.webkitAudioContext;
        if(!Audio)return false;
        context=new Audio();
        master=context.createGain();
        master.gain.value=.5;
        master.connect(context.destination);
      }
      if(context.state!=='running')context.resume().catch(()=>{});
      return true;
    }catch{return false;}
  }
  function tone(from,to,duration,volume,type='sine',delay=0){
    const t=context.currentTime+delay;
    const oscillator=context.createOscillator(),gain=context.createGain();
    oscillator.type=type;
    oscillator.frequency.setValueAtTime(from,t);
    oscillator.frequency.exponentialRampToValueAtTime(to,t+duration);
    gain.gain.setValueAtTime(.001,t);
    gain.gain.exponentialRampToValueAtTime(volume,t+.008);
    gain.gain.exponentialRampToValueAtTime(.001,t+duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(t);
    oscillator.stop(t+duration+.015);
  }
  // ── Banco de sonidos (OpenGameArt CC0 + Little Robot Sound Factory CC-BY 3.0; ver sfx/CREDITS.md) ──
  // Cada clave tiene varias variantes; se elige una al azar con un ligero cambio de tono.
  const base=new URL('./sfx/',import.meta.url);
  let bank=null,bankLoading=null;
  const buffers=new Map();
  function loadBank(){
    if(!bankLoading)bankLoading=fetch(new URL('bank.json',base)).then(r=>r.json()).then(b=>{bank=b;}).catch(()=>{bank={};});
    return bankLoading;
  }
  function buffer(name){
    if(!buffers.has(name))buffers.set(name,fetch(new URL(name+'.ogg',base)).then(r=>r.arrayBuffer()).then(data=>context.decodeAudioData(data)).catch(()=>null));
    return buffers.get(name);
  }
  // Mapa de efectos del motor a claves del banco.
  const aliases={slash:'swing',expose:'arcane',pull:'push',swap:'dash',poison:'venom',fire:'blast'};
  /** Reproduce una muestra del banco. Devuelve false si no existe (para caer en el sintetizador). */
  function sample(key,{volume=1,rate=1,delay=0,pan=0}={}){
    if(!bank)return false;
    const name=bank[key]?key:bank[aliases[key]]?aliases[key]:null;
    if(!name)return false;
    const count=bank[name];
    const file=name.startsWith('amb_')?name:name+'_'+(1+Math.floor(Math.random()*count));
    buffer(file).then(data=>{
      if(!data||muted)return;
      const source=context.createBufferSource(),gain=context.createGain();
      source.buffer=data;
      source.playbackRate.value=rate*(.93+Math.random()*.14);
      gain.gain.value=volume;
      let node=source.connect(gain);
      if(pan&&context.createStereoPanner){const p=context.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));node=node.connect(p);}
      node.connect(master);
      source.start(context.currentTime+delay);
    });
    return true;
  }
  // Ambiente en bucle según el acto (muy bajo para no tapar el combate).
  let ambience=null,ambienceKey='';
  function ambient(key){
    if(key===ambienceKey)return;
    ambienceKey=key;
    if(ambience){const old=ambience;old.gain.gain.setTargetAtTime(0,context.currentTime,.6);setTimeout(()=>old.source.stop(),3000);ambience=null;}
    if(!key||!ready()||!bank?.[key])return;
    buffer(key).then(data=>{
      if(!data||ambienceKey!==key||muted)return;
      const source=context.createBufferSource(),gain=context.createGain();
      source.buffer=data;source.loop=true;
      gain.gain.value=0;gain.gain.setTargetAtTime(.32,context.currentTime,1.2);
      source.connect(gain).connect(master);source.start();
      ambience={source,gain};
    });
  }
  const play=(effect,options)=>{
    if(!ready())return;
    loadBank();
    if(sample(effect,options))return;
    switch(effect){
      case 'click': tone(470,230,.06,.16,'triangle'); break;
      case 'heal':case 'cleanse':
        [392,523,659].forEach((f,i)=>tone(f,f*1.05,.23,.13,'sine',i*.052));break;
      case 'blast':tone(150,36,.36,.36,'triangle');tone(240,58,.22,.105,'sawtooth',.035);break;
      case 'slow':tone(1050,240,.18,.14,'triangle');tone(160,56,.16,.15,'sine',.045);break;
      case 'venom':tone(280,79,.25,.13,'triangle');tone(410,132,.13,.09,'sine',.11);break;
      case 'slash':case 'push':tone(480,106,.13,.19,'triangle');tone(130,67,.10,.15,'sine',.04);break;
      case 'arrow':tone(650,225,.14,.10,'triangle');tone(124,76,.11,.17,'sine',.08);break;
      case 'dash':tone(170,410,.19,.12,'triangle');break;
      default:tone(310,720,.18,.13,'triangle');tone(520,175,.16,.13,'sine',.075);
    }
  };
  function reflect(){
    button.setAttribute('aria-pressed',String(!muted));
    button.replaceChildren(icon(muted?'mute':'sound'));
    button.title=muted?'Sonido desactivado':'Sonido activado';
  }
  reflect();
  button.addEventListener('click',()=>{
    muted=!muted;
    try{localStorage.setItem('cripta-sfx-muted',muted?'yes':'no');}catch{}
    reflect();
    if(muted){const key=ambienceKey;ambient('');ambienceKey=key;}
    else{play('click');const key=ambienceKey;ambienceKey='';ambient(key);}
  });
  document.addEventListener('click',event=>{
    const control=event.target.closest?.('button, summary');
    if(control&&control!==button&&!control.closest('#board')&&!control.disabled)play('click');
  },true);
  play.ambient=key=>{loadBank().then(()=>ambient(key));};
  return play;
}
