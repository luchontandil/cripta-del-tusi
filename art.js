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

