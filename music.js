// Original score in D minor. One bar is scheduled ahead of playback.
const chords=[[38,45,50,53],[34,41,46,50],[41,48,53,57],[36,43,48,52],
  [38,45,50,57],[31,43,46,55],[34,46,50,57],[33,45,49,55]];
const melody=[
  [62,null,65,69,null,67,65,null],[62,null,60,62,null,65,69,null],
  [72,null,69,67,65,null,67,null],[64,null,67,69,null,72,67,null],
  [74,null,72,69,65,null,69,null],[70,null,67,65,null,62,65,null],
  [69,null,70,74,null,72,69,null],[67,null,64,61,null,64,69,null]
];
const hz=n=>440*2**((n-69)/12);
export function setupMusic(button,fieldButton) {
  let ctx,master,timer,next,bar=0,battle=false,starting=false,muted=false;
  try{muted=localStorage.getItem('cripta-muted')==='yes';}catch{}
  const buttons=[button,fieldButton];
  function voice(note,time,length,volume,type='sine',attack=.035){
    const tone=ctx.createOscillator();
    const gain=ctx.createGain();
    tone.type=type;
    tone.frequency.value=hz(note);
    gain.gain.setValueAtTime(.0001,time);
    gain.gain.exponentialRampToValueAtTime(volume,time+attack);
    gain.gain.exponentialRampToValueAtTime(.0001,time+length);
    tone.connect(gain).connect(master);
    tone.start(time);
    tone.stop(time+length+.025);
  }
  function schedule(){
    if(ctx.state!=='running')return;
    if(next<ctx.currentTime-.2)next=ctx.currentTime+.05;
    while(next<ctx.currentTime+.18){
      const step=battle ? .245 : .32;
      const pattern=bar%chords.length;
      const chord=chords[pattern];
      voice(chord[0],next,step*7,.33,'sine',.14);
      voice(chord[2]-12,next,step*6,.12,'triangle',.14);
      for(const note of chord.slice(1))voice(note+12,next,step*7.7,.045,'sine',step*1.8);
      for(let i=0;i<8;i++){
        const time=next+i*step;
        const harmony=chord[[0,2,1,3,0,1,2,3][i]]+12;
        voice(harmony,time,step*1.9,.13,'triangle');
        const note=melody[pattern][i];
        if(note!==null){
          voice(note,time+.025,step*2.4,.15,'sine');
          voice(note,time+step*.85,step*1.4,.045,'sine');
        }
        if(battle&&(i===0||i===3||i===6))voice(25,time,.14,.28,'sine',.008);
      }
      next+=step*8;
      bar++;
    }
  }
  function reflect(enabled){
    for(const control of buttons)control.setAttribute('aria-pressed',String(enabled));
    button.textContent=enabled?'Silenciar música':'Activar música';
    fieldButton.textContent=enabled?'♫':'♪';
  }
  async function start(){
    if(timer||starting)return;
    starting=true;
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)throw new Error('Audio no disponible');
      ctx=new Audio();
      master=ctx.createGain();
      master.gain.value=.30;
      master.connect(ctx.destination);
      const echo=ctx.createDelay(.8);
      const send=ctx.createGain();
      echo.delayTime.value=.24;
      send.gain.value=.15;
      master.connect(echo).connect(send).connect(ctx.destination);
      await ctx.resume();
      if(muted){await ctx.close();return;}
      next=ctx.currentTime+.05;
      timer=setInterval(schedule,100);
      schedule();
      reflect(true);
    }catch{
      button.textContent='Audio no disponible';
    }finally{starting=false;}
  }
  function toggle(){
    muted=!!timer||starting;
    try{localStorage.setItem('cripta-muted',muted?'yes':'no');}catch{}
    if(muted){
      clearInterval(timer);
      timer=null;
      if(ctx?.state==='running'&&!starting)ctx.close().catch(()=>{});
      reflect(false);
    }else start();
  }
  reflect(false);
  for(const control of buttons)control.onclick=toggle;
  document.addEventListener('click',event=>{
    if(!muted&&!buttons.includes(event.target))start();
  },{once:true,capture:true});
  return value=>{
    battle=value;
  };
}
