// Sonido del juego: efectos, ambiente por acto y música de fondo.
import {icon} from './icons.js?v=94';
export function setupSfx(button){
  let context,master;
  let muted=false;
  // Volúmenes guardados en el navegador (0–1). Por defecto: efectos 15 %, ambiente 25 %, música 5 %.
  // (Claves nuevas: todos los jugadores empiezan con estos valores aunque antes hubieran movido las barras.)
  const stored=(key,fallback)=>{try{const v=parseFloat(localStorage.getItem(key));return Number.isFinite(v)?Math.min(1,Math.max(0,v)):fallback;}catch{return fallback;}};
  const keys={sfx:'cripta-vol-sfx',amb:'cripta-vol-amb',music:'cripta-vol-music'};
  let volumeSfx=stored(keys.sfx,.15),volumeAmbience=stored(keys.amb,.25),volumeMusic=stored(keys.music,.05);
  let ambienceBus=null,musicBus=null;
  const MUSIC_GAIN=2;   // escala de la barra de música: al 5 % queda bien de fondo
  try{muted=localStorage.getItem('cripta-sfx-muted')==='yes';}catch{}
  function ready(){
    if(muted)return false;
    try{
      if(!context){
        const Audio=window.AudioContext||window.webkitAudioContext;
        if(!Audio)return false;
        context=new Audio();
        master=context.createGain();
        master.gain.value=.5*volumeSfx;          // volumen base (algo más bajo que el original)
        master.connect(context.destination);
        ambienceBus=context.createGain();
        ambienceBus.gain.value=.75*volumeAmbience;
        ambienceBus.connect(context.destination);
        musicBus=context.createGain();
        musicBus.gain.value=MUSIC_GAIN*volumeMusic;
        musicBus.connect(context.destination);
      }
      if(context.state!=='running')context.resume().catch(()=>{});
      return true;
    }catch{return false;}
  }
  // Música de fondo en bucle («Dungeon Pulse»). Se descarga en streaming desde que carga la página
  // y suena en cuanto el navegador lo permite (con el primer gesto del jugador).
  const track=new Audio();
  track.src=new URL('./sfx/music_dungeon.ogg?v=1',import.meta.url).href;
  track.loop=true;track.preload='auto';track.crossOrigin='anonymous';
  let music=null,routed=false;
  // El volumen de la música se aplica siempre, pase o no por el mezclador de Web Audio:
  // en algunos navegadores no se puede conectar el reproductor y sonaba sin control de volumen.
  // A 0 se pausa del todo, así la barra siempre llega a silencio.
  function applyMusicVolume(){
    const level=Math.min(1,Math.max(0,MUSIC_GAIN*volumeMusic));
    if(musicBus)musicBus.gain.value=MUSIC_GAIN*volumeMusic;
    try{track.volume=routed?1:level;}catch{}
    if(volumeMusic<=0)track.pause();
  }
  function startMusic(){
    if(muted||!context||volumeMusic<=0)return;
    if(!music){
      if(!routed){
        try{
          const source=context.createMediaElementSource(track),gain=context.createGain();
          gain.gain.value=0;gain.gain.setTargetAtTime(1,context.currentTime,.25);
          source.connect(gain).connect(musicBus);
          routed=true;
        }catch{routed=false;}
      }
      music={};
    }
    applyMusicVolume();
    track.play().catch(()=>{music=null;});
  }
  function stopMusic(){
    track.pause();
  }
  function resumeMusic(){if(music&&!muted&&volumeMusic>0&&track.paused){applyMusicVolume();track.play().catch(()=>{});}}
  // Algunos navegadores (Firefox) dejan el audio suspendido: se reintenta con cada gesto.
  const unlock=()=>{if(muted)return;if(!context)ready();else if(context.state!=='running')context.resume().catch(()=>{});startMusic();resumeMusic();};
  for(const type of ['pointerdown','keydown','touchend'])document.addEventListener(type,unlock,true);
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
  const SFX_VERSION='8';   // súbelo al cambiar archivos del banco
  const diag={decoded:0,failed:0,lastError:''};
  let bank=null,bankLoading=null;
  const buffers=new Map();
  function loadBank(){
    if(!bankLoading)bankLoading=fetch(new URL('bank.json?v='+SFX_VERSION,base)).then(r=>r.json()).then(b=>{bank=b;}).catch(()=>{bank={};});
    return bankLoading;
  }
  function buffer(name){
    if(!buffers.has(name))buffers.set(name,fetch(name.includes('/')?name:new URL(name+'.ogg?v='+SFX_VERSION,base)).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.arrayBuffer();})
      .then(data=>new Promise((ok,ko)=>context.decodeAudioData(data,ok,ko)))
      .then(d=>{diag.decoded++;return d;}).catch(e=>{diag.failed++;diag.lastError=name+': '+(e?.message||e);return null;}));
    return buffers.get(name);
  }
  // Mapa de efectos del motor a claves del banco.
  const aliases={slash:'swing',expose:'arcane',pull:'push',swap:'dash',poison:'venom',fire:'blast'};
  /** Reproduce una muestra del banco. Devuelve false si no existe (para caer en el sintetizador). */
  // Mezcla del editor de SFX (la define un administrador en el servidor).
  let mix={},customBase='';
  const customUrl=id=>customBase+'/api/sfx/file/'+id;
  /** Archivo de una categoría según la mezcla: origen, variantes activas. null = silencio. */
  function pickFile(name){
    const m=mix[name]||{};
    // Sonidos subidos por el administrador: sustituyen a los originales.
    if(m.files?.length&&customBase)return customUrl(m.files[Math.floor(Math.random()*m.files.length)].id);
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
    const file=pickFile(key),level=.8*(mix[key]?.volume??1);
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
  const buttons=[button];
  let anchor=button;
  function reflect(){
    for(const b of buttons){
      b.setAttribute('aria-pressed',String(!muted));
      b.setAttribute('aria-expanded',String(!menu.hidden&&anchor===b));
      b.replaceChildren(icon(muted?'mute':'sound'));
      b.title=muted?'Sonido desactivado':'Sonido';
    }
    muteBox.checked=!muted;
    sfxRange.value=Math.round(volumeSfx*100);ambRange.value=Math.round(volumeAmbience*100);musicRange.value=Math.round(volumeMusic*100);
    for(const r of [sfxRange,ambRange,musicRange])r.style.setProperty('--v',r.value);
    sfxOut.textContent=sfxRange.value+' %';ambOut.textContent=ambRange.value+' %';musicOut.textContent=musicRange.value+' %';
  }
  // Menú de sonido: activar/desactivar y barras de volumen.
  const menu=document.createElement('div');
  menu.className='sound-menu';menu.hidden=true;menu.setAttribute('role','dialog');menu.setAttribute('aria-label','Opciones de sonido');
  menu.innerHTML=`<strong>Sonido</strong>
    <label class="sound-row"><input type="checkbox" data-k="on"> Sonido activado</label>
    <label class="sound-row">Efectos <input type="range" min="0" max="100" step="5" data-k="sfx"><output></output></label>
    <label class="sound-row">Ambiente <input type="range" min="0" max="100" step="5" data-k="amb"><output></output></label>
    <label class="sound-row">Música <input type="range" min="0" max="100" step="5" data-k="music"><output></output></label>
    <button type="button" class="ghost sound-test" data-k="test">Probar sonido</button>
    <p class="sound-diag" data-k="diag" hidden></p>`;
  document.body.append(menu);
  const muteBox=menu.querySelector('[data-k="on"]'),sfxRange=menu.querySelector('[data-k="sfx"]'),ambRange=menu.querySelector('[data-k="amb"]');
  const musicRange=menu.querySelector('[data-k="music"]');
  const [sfxOut,ambOut,musicOut]=menu.querySelectorAll('output');
  function place(){const r=anchor.getBoundingClientRect();menu.style.top=(r.bottom+6)+'px';menu.style.left=Math.max(8,Math.min(innerWidth-236,r.right-228))+'px';}
  function setMuted(next){
    muted=next;
    try{localStorage.setItem('cripta-sfx-muted',muted?'yes':'no');}catch{}
    if(muted){const key=ambienceKey;ambient('');ambienceKey=key;stopMusic();}
    else{play('click');startMusic();resumeMusic();const key=ambienceKey;ambienceKey='';ambient(key);}
    reflect();
  }
  muteBox.addEventListener('change',()=>setMuted(!muteBox.checked));
  const diagBox=menu.querySelector('[data-k="diag"]');
  menu.querySelector('[data-k="test"]').addEventListener('click',async()=>{
    diagBox.hidden=false;
    if(muted){diagBox.textContent='El sonido está desactivado: marca «Sonido activado».';return;}
    if(!ready()){diagBox.textContent='Este navegador no permite audio web.';return;}
    try{await context.resume();}catch{}
    tone(523,523,.25,.25,'triangle');tone(784,784,.3,.2,'triangle',.18);
    await loadBank();
    setTimeout(()=>{play('levelup');},600);
    setTimeout(()=>{
      const lines=[];
      if(context.state!=='running')lines.push('⚠ El navegador tiene el audio bloqueado ('+context.state+'). En Firefox: pulsa el icono a la izquierda de la dirección → Permisos → Reproducción automática → «Permitir audio y vídeo», y recarga.');
      else lines.push('Audio activo. Si no has oído dos notas y una fanfarria, revisa que la pestaña no esté silenciada y el mezclador de volumen del sistema.');
      if(volumeSfx===0)lines.push('La barra de Efectos está a 0 %.');
      if(!bank||!Object.keys(bank).length)lines.push('⚠ No se pudo cargar la lista de sonidos.');
      if(diag.failed)lines.push('⚠ '+diag.failed+' sonidos no se pudieron cargar ('+diag.lastError+').');
      lines.push('Cargados: '+diag.decoded+'.');
      diagBox.textContent=lines.join(' ');
    },1400);
  });
  sfxRange.addEventListener('input',()=>{volumeSfx=sfxRange.value/100;try{localStorage.setItem(keys.sfx,volumeSfx);}catch{}
    if(master)master.gain.value=.5*volumeSfx;reflect();});
  sfxRange.addEventListener('change',()=>play('hit'));
  ambRange.addEventListener('input',()=>{volumeAmbience=ambRange.value/100;try{localStorage.setItem(keys.amb,volumeAmbience);}catch{}
    if(ambienceBus)ambienceBus.gain.value=.75*volumeAmbience;reflect();});
  musicRange.addEventListener('input',()=>{volumeMusic=musicRange.value/100;try{localStorage.setItem(keys.music,volumeMusic);}catch{}
    applyMusicVolume();if(ready())startMusic();reflect();});
  reflect();
  function attach(b){
    if(!b)return;
    if(!buttons.includes(b))buttons.push(b);
    b.addEventListener('click',()=>{const same=anchor===b;anchor=b;menu.hidden=same?!menu.hidden:false;if(!menu.hidden){place();ready();}reflect();});
  }
  attach(button);
  document.addEventListener('pointerdown',event=>{if(!menu.hidden&&!menu.contains(event.target)&&!buttons.some(b=>b.contains(event.target))){menu.hidden=true;reflect();}});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){menu.hidden=true;reflect();anchor.focus();}});
  document.addEventListener('click',event=>{
    const control=event.target.closest?.('button, summary');
    if(control&&!buttons.includes(control)&&!control.closest('#board')&&!control.disabled)play('click');
  },true);
  play.attach=b=>{attach(b);reflect();};
  play.ambient=key=>{loadBank().then(()=>ambient(key));};
  // Utilidades para el editor de SFX.
  play.bank=()=>loadBank().then(()=>bank);
  play.mix=()=>mix;
  play.setMix=(next,server)=>{
    mix=next&&typeof next==='object'?next:{};
    if(server!==undefined)customBase=server;
    if(ambienceKey&&ambience){const key=ambienceKey;ambienceKey='';ambient(key);}
  };
  /** Reproduce una categoría (con la mezcla) o una variante concreta (file) con volumen y tono dados. */
  play.preview=(key,options={})=>{if(!ready())return;loadBank().then(()=>{
    if(key.startsWith('amb_')){const f=options.file||pickFile(key);if(f)sample(key,{...options,file:f,exact:true,track:true});return;}
    sample(key,{...options,track:true});
  });};
  play.customUrl=customUrl;
  play.stopPreview=()=>{try{lastPreview?.stop();}catch{}lastPreview=null;};
  return play;
}
