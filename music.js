// Short, synthesized effects. This module never starts a soundtrack.
import {icon} from './icons.js?v=19';
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
        master.gain.value=.21;
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
  const play=effect=>{
    if(!ready())return;
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
    if(!muted)play('click');
  });
  document.addEventListener('click',event=>{
    const control=event.target.closest?.('button, summary');
    if(control&&control!==button&&!control.closest('#board')&&!control.disabled)play('click');
  },true);
  return play;
}
