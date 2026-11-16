const palettes = {
  guardia:['#315251','#73937a','#d7b169','#f7dda0'],
  tirador:['#283e2d','#51865b','#b28455','#f2ce92'],
  mistico:['#4e3869','#8a6caf','#f3b363','#fff2bf'],
  mago:['#243451','#5675ad','#99b6ef','#f6d1ff'],
  sombra:['#352840','#745273','#bf8978','#ffe0b2'],
  enemy:['#523237','#95565b','#c6846d','#ffdc92'],
  ranged:['#4d293b','#a45579','#d690a2','#ffd2a2'],
  elite:['#392c51','#755e91','#c69980','#ffe0a9'],
  boss:['#572938','#b34a63','#df9a54','#fff0a2']
};
export function portrait(look) {
  const image=document.createElement('canvas');
  image.width=26;
  image.height=30;
  image.setAttribute('aria-hidden','true');
  const c=image.getContext('2d');
  const [dark,mid,light,shine]=palettes[look]||palettes.enemy;
  const ink='#201820';
  const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  rect(5,26,16,2,'#19151e90');
  rect(7,20,12,6,ink);
  rect(8,20,4,5,dark);rect(14,20,4,5,dark);
  rect(5,12,16,9,ink);rect(7,11,12,9,mid);rect(9,17,8,3,dark);
  rect(8,5,10,8,ink);rect(9,5,8,4,mid);rect(10,8,6,4,light);
  rect(11,9,1,1,shine);rect(14,9,1,1,shine);
  rect(8,16,10,1,light);rect(12,16,2,2,shine);
  if(look==='tirador'||look==='ranged'){
    rect(8,4,9,2,dark);rect(9,3,7,2,mid);rect(17,6,3,2,mid);
    rect(21,10,2,3,light);rect(23,13,2,8,light);rect(21,21,2,3,light);
    rect(21,13,1,8,shine);rect(17,16,6,1,shine);
  }else if(look==='sombra'){
    rect(7,4,12,4,dark);rect(8,3,10,2,mid);rect(10,10,6,2,dark);
    rect(3,12,2,7,shine);rect(2,17,5,2,light);
  }else if(look==='mago'){
    rect(5,7,16,2,dark);rect(8,5,10,2,mid);rect(10,3,7,2,mid);rect(12,1,5,2,light);
    rect(8,20,11,5,mid);rect(21,9,2,15,light);rect(20,7,4,4,shine);
  }else if(look==='mistico'){
    rect(7,5,3,8,mid);rect(16,5,3,8,mid);rect(10,3,6,2,mid);
    rect(21,8,2,17,light);rect(19,6,6,5,dark);rect(20,5,4,6,shine);rect(21,6,2,4,light);
    rect(9,21,8,3,mid);rect(12,14,2,4,shine);
  }else if(look==='boss'){
    rect(7,3,12,4,light);for(const x of [7,12,17])rect(x,0,2,5,shine);
    rect(4,11,4,10,dark);rect(18,11,4,10,dark);rect(11,12,4,4,shine);
  }else if(look==='guardia'||look==='elite'){
    rect(7,6,12,2,light);rect(8,3,10,3,mid);rect(11,2,4,2,shine);
    rect(18,12,6,8,ink);rect(19,12,4,7,light);rect(20,13,2,5,dark);
    rect(3,9,2,11,shine);rect(2,17,5,2,light);
  }else{
    rect(6,4,3,4,light);rect(17,4,3,4,light);
    rect(5,17,3,4,light);rect(18,17,3,4,light);
  }
  return image;
}
export function spellIcon(kind,symbol) {
  const icon=document.createElement('span');
  icon.className='spell-icon '+kind;
  icon.setAttribute('aria-hidden','true');
  const art=document.createElement('canvas');
  art.width=28;
  art.height=28;
  const c=art.getContext('2d');
  c.lineCap='round';
  const stroke=(color,width,...points)=>{
    c.strokeStyle=color;c.lineWidth=width;c.beginPath();
    c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.stroke();
  };
  if(kind==='heal'||kind==='cleanse'){
    stroke('#eaffc3',4,[14,6],[14,22]);
    stroke('#eaffc3',4,[6,14],[22,14]);
    if(kind==='cleanse')stroke('#c6fdad',1,[6,6],[22,6],[22,22],[6,22],[6,6]);
  }else if(kind==='blast'){
    c.fillStyle='#ff8c41';c.beginPath();
    for(const [x,y] of [[5,16],[10,9],[11,14],[18,3],[18,11],[24,8],[23,21],[17,25],[9,23]])c.lineTo(x,y);
    c.closePath();c.fill();
    c.fillStyle='#ffe0a1';c.beginPath();c.arc(15,18,4,0,Math.PI*2);c.fill();
  }else if(kind==='expose'){
    stroke('#e7baff',2,[14,4],[23,9],[22,18],[14,24],[6,18],[5,9],[14,4]);
    stroke('#fff0cf',2,[15,5],[11,12],[16,14],[12,22]);
  }else if(kind==='slow'){
    for(const [a,b] of [[[14,5],[14,23]],[[6,9],[22,19]],[[6,19],[22,9]]])stroke('#aff6ff',2,a,b);
    stroke('#eaffff',2,[11,9],[14,6],[17,9]);
    stroke('#eaffff',2,[11,19],[14,22],[17,19]);
  }else if(symbol==='➶'||kind==='push'){
    stroke('#f4d68c',2,[5,21],[22,6],[21,13]);
    stroke('#fff4c3',2,[16,7],[22,6]);
    stroke('#c59a59',2,[5,16],[5,21],[10,21]);
  }else{
    stroke('#ffe0a1',3,[7,21],[21,7],[22,4]);
    stroke('#fff8d7',2,[17,6],[22,4],[21,9]);
    stroke('#bf8f63',3,[5,16],[12,23]);
  }
  icon.append(art);
  return icon;
}


const gearColors={
  weapon:['#b3c7e4','#eef4ff','#687292'],
  helmet:['#9babbc','#e4e9f1','#626776'],
  armor:['#8398a2','#c1e3e1','#4c6873'],
  gloves:['#b86260','#f6ad85','#754440'],
  belt:['#a26d51','#f2bd72','#6c493f'],
  boots:['#97736a','#d4b49a','#60454b'],
  ring:['#dba45d','#ffe8a2','#9b6445'],
  amulet:['#b887dc','#fbd6ff','#74509d'],
  charm:['#7ba6a6','#c3f0dc','#456a72'],
  rune:['#8267bb','#e1bbff','#4e3d78']
};
export function equipmentIcon(type){
  const art=document.createElement('canvas');
  art.width=40;art.height=40;
  art.className='equipment-icon';
  art.setAttribute('aria-hidden','true');
  const c=art.getContext('2d');
  const [base,light,shade]=gearColors[type]||gearColors.charm;
  const outline='#201923';
  const poly=(paint,points,stroke=outline)=>{
    c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
    c.fillStyle=paint;c.fill();if(stroke){c.lineWidth=1.7;c.strokeStyle=stroke;c.stroke();}
  };
  const path=(paint,width,points)=>{
    c.lineJoin='round';c.lineCap='round';c.strokeStyle=paint;c.lineWidth=width;c.beginPath();
    points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
  };
  const gem=(x,y,r,a=light,b=shade)=>{poly(a,[[x,y-r],[x+r,y],[x,y+r],[x-r,y]]);poly(b,[[x,y],[x+r,y],[x,y+r]],null);};
  if(type==='weapon'){
    poly(base,[[11,25],[27,8],[34,6],[33,13],[16,29]]);
    path(light,2,[[14,24],[29,9]]);path(shade,5,[[9,32],[16,25]]);path('#e7b56f',4,[[10,22],[20,32]]);
    gem(8,33,3);
  }else if(type==='helmet'){
    poly(base,[[6,24],[8,14],[14,8],[25,8],[32,15],[34,24],[31,31],[23,31],[22,26],[17,26],[16,31],[9,31]]);
    path(light,3,[[10,19],[15,12],[25,12],[30,18]]);path(shade,3,[[11,24],[17,24],[22,22],[30,24]]);
  }else if(type==='armor'){
    poly(base,[[9,10],[16,7],[20,12],[24,7],[31,10],[35,19],[28,22],[27,33],[13,33],[12,22],[5,19]]);
    path(light,3,[[11,12],[19,19],[29,12]]);path(shade,2,[[13,25],[20,28],[27,25]]);gem(20,20,4);
  }else if(type==='gloves'){
    poly(base,[[13,33],[12,25],[7,20],[7,16],[10,14],[15,20],[15,9],[19,8],[21,14],[23,7],[27,9],[28,15],[30,11],[34,14],[32,23],[28,33]]);
    path(light,2,[[16,23],[21,19],[29,18]]);path(shade,4,[[15,30],[26,30]]);
  }else if(type==='belt'){
    poly(base,[[5,16],[34,15],[36,25],[6,27]]);
    path(shade,3,[[8,24],[33,22]]);poly(light,[[15,13],[25,13],[28,18],[26,26],[15,27],[12,22],[12,17]]);
    poly(shade,[[16,17],[23,17],[24,23],[16,24]]);path(light,2,[[19,21],[28,20]]);
  }else if(type==='boots'){
    poly(base,[[12,9],[24,9],[25,24],[33,28],[33,33],[10,33],[10,27]]);
    path(shade,3,[[12,30],[31,30]]);path(light,2,[[13,12],[21,12],[21,25],[27,27]]);
    path(shade,2,[[15,17],[22,17],[15,21],[22,21]]);
  }else if(type==='ring'){
    c.strokeStyle=outline;c.lineWidth=8;c.beginPath();c.ellipse(20,23,10,9,0,0,Math.PI*2);c.stroke();
    c.strokeStyle=base;c.lineWidth=5;c.stroke();gem(20,12,6,light,shade);
    path(light,1.5,[[12,25],[15,29],[19,30]]);
  }else if(type==='amulet'){
    path(outline,5,[[7,9],[9,21],[20,30],[31,21],[33,9]]);
    path(base,2.7,[[7,9],[9,21],[20,30],[31,21],[33,9]]);
    gem(20,24,9,light,shade);gem(20,24,4,base,shade);
  }else if(type==='rune'){
    poly(base,[[12,7],[26,8],[32,17],[30,32],[18,34],[8,27],[8,15]]);
    path(light,2.5,[[15,28],[23,13],[24,26],[16,21],[26,18]]);
  }else{
    poly(shade,[[20,5],[32,12],[33,27],[20,35],[7,27],[8,12]]);
    poly(base,[[20,9],[30,19],[20,31],[10,19]]);
    gem(20,19,7,light,shade);path(light,1.5,[[20,11],[28,19],[20,27]]);
  }
  return art;
}

