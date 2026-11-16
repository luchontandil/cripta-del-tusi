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
export function setupMusic(button) {
  let ctx,master,timer,next,bar=0,battle=false;
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
  button.onclick=async()=>{
    button.disabled=true;
    try{
      if(timer){
        clearInterval(timer);
        timer=null;
        await ctx.close();
        button.setAttribute('aria-pressed','false');
        button.textContent='Música';
      }else{
        const Audio=window.AudioContext||window.webkitAudioContext;
        if(!Audio)throw new Error('Audio no disponible');
        ctx=new Audio();
        master=ctx.createGain();
        master.gain.value=.20;
        master.connect(ctx.destination);
        await ctx.resume();
        next=ctx.currentTime+.05;
        timer=setInterval(schedule,100);
        schedule();
        button.setAttribute('aria-pressed','true');
        button.textContent='Música activa';
      }
    }catch{
      button.textContent='Audio no disponible';
    }finally{button.disabled=false;}
  };
  return value=>{battle=value;};
}
