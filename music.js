// Short, synthesized effects. This module never starts a soundtrack.
import {icon} from './icons.js?v=34';
export function setupSfx(button){
  let context,master;
  let muted=false;
  // Volúmenes guardados en el navegador (0–1): efectos y ambiente.
  const stored=(key,fallback)=>{try{const v=parseFloat(localStorage.getItem(key));return Number.isFinite(v)?Math.min(1,Math.max(0,v)):fallback;}catch{return fallback;}};
  let volumeSfx=stored('cripta-sfx-volume',.6),volumeAmbience=stored('cripta-amb-volume',.5);
  let ambienceBus=null;
  try{muted=localStorage.getItem('cripta-sfx-muted')==='yes';}catch{}
  function ready(){
    if(muted)return false;
    try{
      if(!context){
        const Audio=window.AudioContext||window.webkitAudioContext;
        if(!Audio)return false;
        context=new Audio();
        master=context.createGain();
        master.gain.value=.34*volumeSfx;          // volumen base más bajo que antes
        master.connect(context.destination);
        ambienceBus=context.createGain();
        ambienceBus.gain.value=.34*volumeAmbience;
        ambienceBus.connect(context.destination);
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
  // Mezcla del editor de SFX (la define un administrador en el servidor).
  let mix={};
  /** Archivo de una categoría según la mezcla: origen, variantes activas. null = silencio. */
  function pickFile(name){
    const m=mix[name]||{};
    const src=m.from&&bank[m.from]?m.from:name;
    if(src.startsWith('amb_'))return src;
    const on=Array.from({length:bank[src]},(_,i)=>i+1).filter(n=>!(m.off||[]).includes(n));
    if(!on.length)return null;
    return src+'_'+on[Math.floor(Math.random()*on.length)];
  }
  let lastPreview=null;
  function sample(key,{volume=1,rate=1,delay=0,pan=0,file:forced=null,exact=false,track=false}={}){
    if(!bank)return false;
    const name=bank[key]?key:bank[aliases[key]]?aliases[key]:null;
    if(!name&&!forced)return false;
    const m=forced?{}:mix[name]||{};
    const file=forced||pickFile(name);
    if(!file)return true;
    volume*=m.volume??1;rate*=m.pitch??1;
    buffer(file).then(data=>{
      if(!data||muted)return;
      const source=context.createBufferSource(),gain=context.createGain();
      source.buffer=data;
      source.playbackRate.value=rate*(exact?1:.93+Math.random()*.14);
      gain.gain.value=volume;
      let node=source.connect(gain);
      if(pan&&context.createStereoPanner){const p=context.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));node=node.connect(p);}
      node.connect(master);
      if(track){try{lastPreview?.stop();}catch{}lastPreview=source;}
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
    const file=pickFile(key),level=.6*(mix[key]?.volume??1);
    buffer(file).then(data=>{
      if(!data||ambienceKey!==key||muted)return;
      const source=context.createBufferSource(),gain=context.createGain();
      source.buffer=data;source.loop=true;source.playbackRate.value=mix[key]?.pitch??1;
      gain.gain.value=0;gain.gain.setTargetAtTime(level,context.currentTime,1.2);
      source.connect(gain).connect(ambienceBus);source.start();
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
    button.setAttribute('aria-expanded',String(!menu.hidden));
    button.replaceChildren(icon(muted?'mute':'sound'));
    button.title='Sonido';
    muteBox.checked=!muted;
    sfxRange.value=Math.round(volumeSfx*100);ambRange.value=Math.round(volumeAmbience*100);
    sfxOut.textContent=sfxRange.value+' %';ambOut.textContent=ambRange.value+' %';
  }
  // Menú de sonido: activar/desactivar y barras de volumen.
  const menu=document.createElement('div');
  menu.className='sound-menu';menu.hidden=true;menu.setAttribute('role','dialog');menu.setAttribute('aria-label','Opciones de sonido');
  menu.innerHTML=`<strong>Sonido</strong>
    <label class="sound-row"><input type="checkbox" data-k="on"> Sonido activado</label>
    <label class="sound-row">Efectos <input type="range" min="0" max="100" step="5" data-k="sfx"><output></output></label>
    <label class="sound-row">Ambiente <input type="range" min="0" max="100" step="5" data-k="amb"><output></output></label>`;
  document.body.append(menu);
  const muteBox=menu.querySelector('[data-k="on"]'),sfxRange=menu.querySelector('[data-k="sfx"]'),ambRange=menu.querySelector('[data-k="amb"]');
  const [sfxOut,ambOut]=menu.querySelectorAll('output');
  function place(){const r=button.getBoundingClientRect();menu.style.top=(r.bottom+6)+'px';menu.style.left=Math.max(8,Math.min(innerWidth-236,r.right-228))+'px';}
  function setMuted(next){
    muted=next;
    try{localStorage.setItem('cripta-sfx-muted',muted?'yes':'no');}catch{}
    if(muted){const key=ambienceKey;ambient('');ambienceKey=key;}
    else{play('click');const key=ambienceKey;ambienceKey='';ambient(key);}
    reflect();
  }
  muteBox.addEventListener('change',()=>setMuted(!muteBox.checked));
  sfxRange.addEventListener('input',()=>{volumeSfx=sfxRange.value/100;try{localStorage.setItem('cripta-sfx-volume',volumeSfx);}catch{}
    if(master)master.gain.value=.34*volumeSfx;reflect();});
  sfxRange.addEventListener('change',()=>play('hit'));
  ambRange.addEventListener('input',()=>{volumeAmbience=ambRange.value/100;try{localStorage.setItem('cripta-amb-volume',volumeAmbience);}catch{}
    if(ambienceBus)ambienceBus.gain.value=.34*volumeAmbience;reflect();});
  reflect();
  button.addEventListener('click',()=>{menu.hidden=!menu.hidden;if(!menu.hidden){place();ready();}reflect();});
  document.addEventListener('pointerdown',event=>{if(!menu.hidden&&!menu.contains(event.target)&&!button.contains(event.target)){menu.hidden=true;reflect();}});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){menu.hidden=true;reflect();button.focus();}});
  document.addEventListener('click',event=>{
    const control=event.target.closest?.('button, summary');
    if(control&&control!==button&&!control.closest('#board')&&!control.disabled)play('click');
  },true);
  play.ambient=key=>{loadBank().then(()=>ambient(key));};
  // Utilidades para el editor de SFX.
  play.bank=()=>loadBank().then(()=>bank);
  play.mix=()=>mix;
  play.setMix=next=>{
    mix=next&&typeof next==='object'?next:{};
    if(ambienceKey&&ambience){const key=ambienceKey;ambienceKey='';ambient(key);}
  };
  /** Reproduce una categoría (con la mezcla) o una variante concreta (file) con volumen y tono dados. */
  play.preview=(key,options={})=>{if(!ready())return;loadBank().then(()=>{
    if(key.startsWith('amb_')){const f=options.file||pickFile(key);if(f)sample(key,{...options,file:f,exact:true,track:true});return;}
    sample(key,{...options,track:true});
  });};
  play.stopPreview=()=>{try{lastPreview?.stop();}catch{}lastPreview=null;};
  return play;
}
