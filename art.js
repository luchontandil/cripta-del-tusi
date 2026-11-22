const creatureArt={
  skeleton:c=>{
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    r(6,28,14,2,'#19151e90');
    r(9,3,8,7,'#e6dfcc');r(8,5,10,4,'#e6dfcc');r(10,5,2,2,'#1a1418');r(14,5,2,2,'#1a1418');r(10,6,1,1,'#ff5a3a');r(15,6,1,1,'#ff5a3a');
    r(10,10,6,2,'#cfc6b2');for(const x of [10,12,14])r(x,11,1,1,'#1a1418');
    r(12,12,2,8,'#e6dfcc');for(const y of [13,15,17])r(9,y,8,1,'#e6dfcc');
    r(7,12,2,8,'#e6dfcc');r(17,12,2,8,'#e6dfcc');r(19,16,1,9,'#8a7a6a');r(18,15,3,1,'#5a4a3a');
    r(10,20,6,2,'#e6dfcc');r(10,22,2,6,'#e6dfcc');r(14,22,2,6,'#e6dfcc');
  },
  succubus:c=>{
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    r(6,28,14,2,'#19151e70');
    r(1,8,5,2,'#5a1846');r(0,10,7,4,'#7a2a62');r(20,8,5,2,'#5a1846');r(19,10,7,4,'#7a2a62');
    r(9,1,2,3,'#1a0818');r(15,1,2,3,'#1a0818');
    r(9,3,8,8,'#2a0a20');r(10,4,6,6,'#c76a9a');r(11,6,1,1,'#ff7ad9');r(14,6,1,1,'#ff7ad9');r(12,8,2,1,'#7a1a3a');
    r(10,11,6,5,'#c76a9a');r(9,14,8,3,'#3a1030');r(8,17,10,8,'#3a1030');r(9,25,8,2,'#2a0820');
    r(18,20,2,2,'#c76a9a');r(20,22,2,2,'#c76a9a');r(22,23,2,2,'#ff7ad9');
  },
  vampire:c=>{
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    r(5,28,16,2,'#19151e90');
    r(4,9,4,18,'#4a0a1a');r(18,9,4,18,'#4a0a1a');r(5,7,3,4,'#2a1838');r(18,7,3,4,'#2a1838');
    r(9,2,8,3,'#151018');r(9,4,8,7,'#d9d4e6');r(10,6,2,1,'#ff2a3a');r(14,6,2,1,'#ff2a3a');r(11,9,1,2,'#ffffff');r(14,9,1,2,'#ffffff');
    r(8,11,10,15,'#1c1426');r(12,12,2,8,'#7a1020');r(9,26,8,2,'#151018');
  },
  imp:c=>{
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    r(6,28,14,2,'#19151e70');
    r(8,4,2,3,'#2a1410');r(16,4,2,3,'#2a1410');
    r(8,7,10,8,'#c2402a');r(10,9,2,2,'#ffe04a');r(14,9,2,2,'#ffe04a');r(11,12,4,1,'#5a1a14');
    r(3,13,5,3,'#5a1a14');r(18,13,5,3,'#5a1a14');
    r(9,15,8,7,'#c2402a');r(10,22,2,4,'#a2301e');r(14,22,2,4,'#a2301e');r(17,19,3,2,'#a2301e');r(20,20,2,2,'#c2402a');
    r(19,14,5,5,'#ffb347');r(20,15,3,3,'#fff2b0');
  },
  cerberus:c=>{
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    r(1,28,24,2,'#19151e90');
    r(5,14,16,10,'#2a1e1c');r(4,24,3,4,'#1a1210');r(19,24,3,4,'#1a1210');r(9,24,3,4,'#1a1210');r(14,24,3,4,'#1a1210');
    for(const [x,y] of [[0,8],[9,5],[18,8]]){r(x,y,8,7,'#2a1e1c');r(x+1,y+4,6,3,'#4a3530');r(x+1,y+2,2,1,'#ff6a2a');r(x+5,y+2,2,1,'#ff6a2a');r(x,y-2,2,2,'#2a1e1c');r(x+6,y-2,2,2,'#2a1e1c');r(x+2,y+6,4,1,'#ff6a2a');}
    r(21,15,4,2,'#2a1e1c');
  },
  skeletonking:c=>{
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    r(3,28,20,2,'#19151e90');
    r(8,0,10,2,'#c9a24a');for(const x of [8,11,14,17])r(x,-1,1,3,'#e6dfcc');
    r(8,2,10,7,'#e6dfcc');r(9,4,3,3,'#0c0812');r(14,4,3,3,'#0c0812');r(10,5,1,1,'#7dffb0');r(15,5,1,1,'#7dffb0');
    r(10,9,6,2,'#cfc6b2');for(const x of [10,12,14])r(x,10,1,1,'#0c0812');
    r(4,11,5,4,'#c9a24a');r(17,11,5,4,'#c9a24a');
    r(5,14,16,13,'#3a2a4a');r(12,12,2,10,'#e6dfcc');for(const y of [13,15,17,19])r(9,y,8,1,'#e6dfcc');
    r(22,4,2,22,'#8fa0b4');r(20,18,6,1,'#c9a24a');
  },
  firedemon:c=>{
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    r(2,28,22,2,'#19151e90');
    r(6,1,2,5,'#1a0a08');r(18,1,2,5,'#1a0a08');for(const x of [9,12,15])r(x,0,2,3,'#ffd36b');
    r(8,4,10,7,'#2a1612');r(10,6,2,2,'#fff2a0');r(14,6,2,2,'#fff2a0');r(10,9,6,1,'#ff7a1a');
    r(3,11,20,12,'#2a1612');r(9,12,8,8,'#ff7a1a');r(11,14,4,4,'#ffd36b');
    r(1,14,3,8,'#2a1612');r(22,14,3,8,'#2a1612');r(0,21,5,4,'#ff7a1a');r(21,21,5,4,'#ff7a1a');
    r(6,23,5,5,'#2a1612');r(15,23,5,5,'#2a1612');
  },
  vampqueen:c=>{
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    r(3,28,20,2,'#19151e90');
    r(0,6,7,3,'#3a0a1a');r(0,9,5,8,'#3a0a1a');r(19,6,7,3,'#3a0a1a');r(21,9,5,8,'#3a0a1a');
    for(const x of [9,12,15])r(x,0,2,3,'#c9a24a');
    r(8,2,10,9,'#120a14');r(9,3,8,7,'#e8e0ee');r(10,6,2,1,'#ff2a3a');r(14,6,2,1,'#ff2a3a');
    r(7,11,12,4,'#e8e0ee');r(6,14,14,14,'#8a0a1e');r(8,16,10,2,'#3a0008');r(2,20,2,2,'#ff1a3a');r(22,18,2,2,'#ff1a3a');
  },
  oracle:c=>{
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    r(5,28,16,2,'#19151e90');
    for(const [x,y] of [[3,4],[12,1],[21,4],[1,12],[23,12]])r(x,y,2,3,'#ffb347');
    r(7,24,12,3,'#5a1f22');r(9,27,2,2,'#6e2626');r(15,27,2,2,'#6e2626');
    r(7,6,12,2,'#1a1218');r(5,8,16,2,'#1a1218');r(4,10,18,10,'#1a1218');r(5,20,16,2,'#1a1218');r(7,22,12,2,'#1a1218');
    r(6,8,14,14,'#2e2028');r(5,10,16,10,'#2e2028');
    r(6,18,2,1,'#ff6a1a');r(18,9,1,3,'#ff6a1a');r(19,17,2,1,'#ff6a1a');
    r(8,11,10,7,'#fff1d6');r(7,12,12,5,'#fff1d6');
    r(10,11,6,7,'#ff8a1e');r(9,12,8,5,'#ff8a1e');r(11,12,4,5,'#ffcf5a');
    r(12,12,2,5,'#120808');
    r(8,10,10,1,'#1a1218');r(8,18,10,1,'#1a1218');
  },
  umbralking:c=>{
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    r(3,28,20,2,'#19151e90');
    r(7,0,12,2,'#d9a441');for(const x of [7,10,13,16])r(x,-1,2,3,'#ffd36b');r(12,1,2,1,'#6fd7ff');
    r(8,2,10,7,'#e3dccb');r(9,9,8,2,'#cfc6b2');
    r(9,4,3,3,'#0c0812');r(14,4,3,3,'#0c0812');r(10,5,1,1,'#6fd7ff');r(15,5,1,1,'#6fd7ff');
    r(10,9,1,1,'#0c0812');r(12,9,1,1,'#0c0812');r(14,9,1,1,'#0c0812');
    r(3,11,6,4,'#d9a441');r(17,11,6,4,'#d9a441');r(2,10,2,2,'#ffd36b');r(22,10,2,2,'#ffd36b');
    r(6,12,14,16,'#2b1d45');r(5,16,16,12,'#2b1d45');r(12,12,2,16,'#d9a441');r(5,27,16,1,'#d9a441');
    r(4,12,3,15,'#5a1730');r(19,12,3,15,'#5a1730');
    r(23,2,1,26,'#6b4a3a');r(19,2,5,2,'#b9c6d6');r(18,3,2,3,'#b9c6d6');r(23,2,1,1,'#6fd7ff');
    r(2,16,3,3,'#6fd7ff');
  },
  lavaslime:(c,look)=>creatureArt.slime(c,look),
  slug:c=>{
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    r(1,27,24,2,'#19151e90');
    r(1,24,22,3,'#6a8a2a');r(2,22,14,2,'#8fb83a');
    r(3,18,13,5,'#a8cf4a');r(5,16,9,2,'#a8cf4a');r(4,19,5,1,'#d4f07a');
    r(12,12,8,11,'#a8cf4a');r(13,10,6,3,'#8fb83a');r(14,13,4,2,'#d4f07a');
    r(13,4,1,7,'#6a8a2a');r(18,4,1,7,'#6a8a2a');r(12,2,3,3,'#f6fff0');r(17,2,3,3,'#f6fff0');r(13,3,1,1,'#14200a');r(18,3,1,1,'#14200a');
    r(15,17,3,1,'#2a3a10');
    r(6,13,6,5,'#8a5a2a');r(7,12,4,1,'#b07a3a');r(8,14,2,2,'#d9a45a');
    r(0,26,4,1,'#c8f0a0a0');r(20,26,5,1,'#c8f0a0a0');
  },
  plant:c=>{
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    r(4,27,18,2,'#19151e90');
    r(5,24,16,3,'#4a3020');r(7,23,12,1,'#6a4428');
    r(12,13,2,11,'#3f7a2a');r(4,19,8,3,'#4f9a34');r(14,17,8,3,'#4f9a34');r(3,20,3,2,'#7acb4a');r(20,18,3,2,'#7acb4a');
    r(7,4,12,10,'#b8324a');r(6,6,14,6,'#b8324a');r(8,5,4,2,'#e05a6a');
    r(8,8,10,4,'#3a0a14');for(const x of [9,11,13,15])r(x,8,1,2,'#f4ece0');for(const x of [10,12,14,16])r(x,10,1,2,'#f4ece0');
    r(9,3,2,2,'#f2e07a');r(15,3,2,2,'#f2e07a');r(12,2,2,2,'#f2e07a');
    r(20,7,2,2,'#9be05a');r(22,5,2,2,'#9be05a');
  },
  sporemother:c=>{
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    r(2,27,22,2,'#19151e90');
    r(3,23,20,4,'#4a3020');r(1,20,6,3,'#3f7a2a');r(19,20,6,3,'#3f7a2a');r(0,18,3,2,'#7acb4a');r(23,18,3,2,'#7acb4a');
    r(11,12,4,11,'#3f7a2a');r(8,16,3,2,'#4f9a34');r(15,15,3,2,'#4f9a34');
    r(5,2,16,11,'#7a2a8a');r(3,5,20,6,'#7a2a8a');r(6,3,5,2,'#b05ac0');
    for(const [x,y] of [[6,5],[11,3],[17,4],[8,9],[15,8],[20,7]])r(x,y,2,2,'#e7f07a');
    r(8,10,10,3,'#2a0a2a');for(const x of [9,11,13,15])r(x,10,1,2,'#f4ece0');
    r(1,1,2,2,'#c8f07a');r(23,2,2,2,'#c8f07a');r(2,12,1,1,'#c8f07a');r(24,11,1,1,'#c8f07a');
  },
  slime:(c,look)=>{
    const king=look==='slimeking';
    const lava=look==='lavaslime';
    const [dark,mid,light]=king?['#5b2a86','#a35bd9','#e2b8ff']:lava?['#7a1a08','#e8521a','#ffd36b']:['#1f6b3a','#4fc271','#b8f5c6'];
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    r(4,27,18,2,'#19151e90');
    r(7,12,12,2,dark);r(5,14,16,2,dark);r(4,16,18,9,dark);r(5,25,16,2,dark);
    r(8,13,10,2,mid);r(6,15,14,10,mid);r(7,25,12,1,mid);
    r(8,15,4,2,light);r(7,17,2,2,light);
    r(9,18,3,3,'#f6fff6');r(15,18,3,3,'#f6fff6');r(10,19,2,2,'#14281a');r(16,19,2,2,'#14281a');
    r(11,23,5,1,'#14281a');
    if(king){r(8,8,10,3,'#f2c45c');for(const x of [8,12,16])r(x,5,2,3,'#ffd977');r(12,9,2,1,'#ff6a6a');}
    if(lava){r(10,9,2,3,'#ff8a2a');r(16,10,2,2,'#ffb347');r(5,24,2,3,'#ff6a1a');r(19,24,2,3,'#ff6a1a');r(12,15,3,2,'#2a0a04');}
  },
  bat:c=>{
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    r(6,27,14,2,'#19151e90');
    r(1,11,6,2,'#4a3358');r(0,13,8,3,'#6b4a7d');r(2,16,3,2,'#4a3358');r(5,16,3,3,'#6b4a7d');
    r(19,11,6,2,'#4a3358');r(18,13,8,3,'#6b4a7d');r(21,16,3,2,'#4a3358');r(18,16,3,3,'#6b4a7d');
    r(9,8,2,4,'#4a3358');r(15,8,2,4,'#4a3358');
    r(8,11,10,10,'#3a2648');r(9,12,8,8,'#4a3358');
    r(10,14,2,2,'#ff5a5a');r(14,14,2,2,'#ff5a5a');
    r(11,18,1,2,'#f4ece0');r(14,18,1,2,'#f4ece0');
    r(10,21,2,2,'#3a2648');r(14,21,2,2,'#3a2648');
  },
  skull:c=>{
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    r(6,27,14,2,'#19151e70');
    r(5,9,16,2,'#bdb5a2');r(4,11,18,8,'#bdb5a2');r(6,7,14,2,'#bdb5a2');
    r(6,8,13,10,'#e8e0cc');r(5,11,16,6,'#e8e0cc');
    r(7,12,4,4,'#1a1420');r(15,12,4,4,'#1a1420');r(8,13,2,2,'#8dffb0');r(16,13,2,2,'#8dffb0');
    r(12,16,2,2,'#1a1420');
    r(7,19,12,3,'#d6cdb8');for(const x of [8,10,12,14,16])r(x,19,1,2,'#1a1420');
    r(8,22,10,2,'#bdb5a2');
    r(2,6,2,3,'#7dffb0');r(22,9,2,3,'#7dffb0');r(3,20,2,2,'#7dffb0');
  },
  worm:c=>{
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    r(2,27,22,2,'#19151e90');
    r(2,22,5,5,'#8d4f4a');r(6,20,5,6,'#b7766c');r(10,18,5,7,'#8d4f4a');
    r(13,9,9,11,'#b7766c');r(12,11,11,8,'#b7766c');r(14,8,7,2,'#c98a7f');
    r(15,13,5,5,'#2a0f14');r(13,10,2,2,'#ffcc4d');r(20,10,2,2,'#ffcc4d');
    r(14,18,2,3,'#f2e6d0');r(19,18,2,3,'#f2e6d0');
    r(7,21,1,4,'#6e3a37');r(11,19,1,5,'#6e3a37');
  }
};
const palettes = {
  guardia:['#33598c','#4f86c9','#e1b48f','#f6e2c4'],
  tirador:['#283e2d','#51865b','#b28455','#f2ce92'],
  mistico:['#4e3869','#8a6caf','#f3b363','#fff2bf'],
  mago:['#243451','#5675ad','#99b6ef','#f6d1ff'],
  sombra:['#352840','#745273','#bf8978','#ffe0b2'],
  enemy:['#523237','#95565b','#c6846d','#ffdc92'],
  ranged:['#4d293b','#a45579','#d690a2','#ffd2a2'],
  elite:['#392c51','#755e91','#c69980','#ffe0a9'],
  boss:['#572938','#b34a63','#df9a54','#fff0a2']
};
/** Retrato del Lancero: valquiria esbelta con yelmo alado, trenza oscura, capa y lanza. */
function lancerPortrait(c,dark,mid){
  const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
  const ink='#201820',steel='#c8cdd5',steelHi='#eef1f5',steelLo='#8c939e',gold='#d8b04a',skin='#e1b48f',skinLo='#c48f6c',hair='#e2bf63',wing='#f6f8fb',wingLo='#c9ced6';
  r(7,27,13,2,'#19151e90');
  r(8,12,11,13,ink);r(9,12,9,12,dark);                                  // capa por detrás
  // Piernas: malla y grebas.
  r(10,20,6,7,ink);r(10,20,2,2,mid);r(14,20,2,2,mid);
  r(10,22,2,4,steel);r(14,22,2,4,steel);r(10,22,2,1,gold);r(14,22,2,1,gold);r(10,26,2,1,steelLo);r(14,26,2,1,steelLo);
  // Faldellín de tiras de cuero.
  r(9,18,8,3,ink);for(let x=10;x<16;x++)r(x,18,1,2,x%2?'#6b4a34':'#4a3a30');r(10,20,6,1,gold);
  // Torso esbelto: malla, peto y cinturón.
  r(10,11,6,8,ink);r(10,12,6,6,mid);r(11,12,4,4,steel);r(11,12,4,1,steelHi);r(12,15,2,1,steelLo);r(10,17,6,1,gold);
  // Brazos descubiertos con brazales.
  r(8,13,2,6,ink);r(16,13,2,6,ink);r(8,13,2,2,skin);r(16,13,2,2,skin);r(8,15,2,2,steel);r(16,15,2,2,steel);r(8,17,2,1,skin);r(16,17,2,1,skin);
  r(7,11,3,2,steel);r(16,11,3,2,steel);r(7,12,3,1,gold);r(16,12,3,1,gold);     // hombreras
  // Cabeza: rostro y yelmo con carrilleras.
  r(10,4,6,7,ink);r(11,6,4,4,skin);r(11,9,4,1,skinLo);
  r(11,7,1,1,'#6f9bb8');r(14,7,1,1,'#6f9bb8');r(12,9,2,1,'#c98378');
  r(10,3,6,3,steel);r(11,2,4,1,steelHi);r(10,6,1,4,steel);r(15,6,1,4,steel);r(12,3,2,1,gold);
  // Alas del yelmo, abiertas hacia arriba.
  // Cada ala: plumas en abanico hacia fuera y algo hacia arriba, con las puntas separadas.
  for(const [side,x0] of [[-1,9],[1,16]]){
    const X=(dx,w)=>side<0?x0-dx-w+1:x0+dx;
    r(X(0,2),5,2,1,wingLo);
    r(X(0,4),4,4,1,wing);
    r(X(0,5),3,5,1,wing);
    r(X(1,4),2,4,1,wing);
    r(X(2,3),1,3,1,wing);
    r(X(4,1),0,1,1,wing);
    for(const dx of [1,3])r(X(dx,1),4,1,1,wingLo);                   // separación de plumas
    r(X(4,1),3,1,1,wingLo);
  }
  // Trenza rubia sobre el hombro izquierdo.
  r(15,9,2,8,hair);r(16,17,1,2,hair);r(15,16,2,1,gold);
  // Lanza: asta, punta afilada y guarda dorada.
  r(3,8,1,19,'#5e4230');
  r(3,0,1,2,steelHi);r(2,2,3,4,'#d8dde4');r(3,2,1,4,steelHi);r(3,6,1,1,'#aab1bb');
  r(1,7,5,1,gold);r(3,7,1,1,'#4fa3ff');r(2,13,1,2,skin);r(4,13,1,2,skin);
}
export function portrait(look,tint=null) {
  const image=document.createElement('canvas');
  image.width=26;
  image.height=30;
  image.setAttribute('aria-hidden','true');
  const c=image.getContext('2d');
  if(creatureArt[look]){creatureArt[look](c,look);return image;}
  let [dark,mid,light,shine]=palettes[look]||palettes.enemy;
  // Color del jugador: la ropa toma el color de su puesto.
  if(tint){dark=tint.dark;mid=tint.hex;}
  const ink='#201820';
  if(look==='guardia'){lancerPortrait(c,dark,mid);return image;}
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
  }else if(look==='elite'){
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
  }else if(kind==='venom'){
    c.fillStyle='#c9ef7a';c.beginPath();c.moveTo(14,4);c.bezierCurveTo(20,12,22,15,22,18);c.arc(14,18,8,0,Math.PI);c.bezierCurveTo(6,15,8,12,14,4);c.fill();
    c.fillStyle='#46601f';c.beginPath();c.arc(11,18,2,0,Math.PI*2);c.arc(16.5,20.5,1.4,0,Math.PI*2);c.fill();
  }else if(kind==='dash'){
    c.fillStyle='#e6ccff';c.beginPath();c.arc(14,14,9,Math.PI*.35,Math.PI*1.65);c.arc(17,14,7,Math.PI*1.55,Math.PI*.45,true);c.fill();
    stroke('#fff4ff',2,[17,9],[24,14],[17,19]);
  }else if(symbol==='✦'){
    c.fillStyle='#e7dcff';c.beginPath();
    for(let i=0;i<8;i++){const r=i%2?3.5:11,a=i*Math.PI/4-Math.PI/2;c.lineTo(14+Math.cos(a)*r,14+Math.sin(a)*r);}
    c.closePath();c.fill();c.fillStyle='#ffffff';c.beginPath();c.arc(14,14,2.5,0,Math.PI*2);c.fill();
  }else if(symbol==='✹'){
    c.fillStyle='#ffb057';c.beginPath();c.moveTo(14,3);c.bezierCurveTo(22,10,23,16,21,20);c.arc(14,19,7.5,0,Math.PI);c.bezierCurveTo(5,15,8,12,11,9);c.lineTo(13,13);c.closePath();c.fill();
    c.fillStyle='#fff0b8';c.beginPath();c.arc(14,20,3.5,0,Math.PI*2);c.fill();
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
/** Colores de cada gema (los mismos que en engine.js). */
const gemColors={ruby:['#c8213a','#ff8a9a','#6e0f22'],garnet:['#d4561e','#ffb27a','#7a2a10'],sapphire:['#2a5fd0','#9cc4ff','#122e70'],
  topaz:['#e3b422','#fff1a0','#7a5a0e'],amethyst:['#8a4fd8','#dcb8ff','#43206e'],emerald:['#1f9d55','#8ff0b4','#0c4d28'],
  onyx:['#4a4a55','#b7b7c4','#16161c'],diamond:['#cfe6ef','#ffffff','#7b98a6'],tigereye:['#b9782a','#ffd28a','#5a3510']};
/** Gema facetada: más grande y brillante cuanto mejor es su calidad (0 dañada … 4 excelente). */
function gemIcon(c,kind,quality){
  const [base,light,shade]=gemColors[kind]||gemColors.ruby;
  const q=Math.max(0,Math.min(4,quality|0));
  const r=9+q*1.9,cx=20,cy=21;
  const outline='#1a1420';
  const poly=(paint,points,stroke=outline,width=1.6)=>{
    c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
    c.fillStyle=paint;c.fill();if(stroke){c.lineWidth=width;c.strokeStyle=stroke;c.stroke();}
  };
  if(q>=3){const g=c.createRadialGradient(cx,cy,2,cx,cy,r+6);g.addColorStop(0,light+'aa');g.addColorStop(1,light+'00');c.fillStyle=g;c.fillRect(0,0,40,40);}
  // Contorno de talla brillante: corona arriba y pabellón en punta abajo.
  const top=cy-r*.62,girdle=cy-r*.12,bottom=cy+r;
  const outer=[[cx-r*.55,top],[cx+r*.55,top],[cx+r,girdle],[cx,bottom],[cx-r,girdle]];
  poly(base,outer);
  poly(light,[[cx-r*.55,top],[cx+r*.55,top],[cx+r*.3,girdle],[cx-r*.3,girdle]],null);       // mesa
  poly(shade,[[cx+r*.3,girdle],[cx+r,girdle],[cx,bottom]],null);                               // faceta en sombra
  poly(base,[[cx-r*.3,girdle],[cx+r*.3,girdle],[cx,bottom]],null);
  c.lineWidth=1;c.strokeStyle=shade;c.beginPath();
  c.moveTo(cx-r,girdle);c.lineTo(cx+r,girdle);c.moveTo(cx-r*.3,girdle);c.lineTo(cx,bottom);c.moveTo(cx+r*.3,girdle);c.lineTo(cx,bottom);c.stroke();
  poly('transparent',outer);
  // Calidades bajas: grietas y una esquina rota.
  if(q<=1){
    c.strokeStyle='#1a1420';c.lineWidth=1.3;c.beginPath();
    c.moveTo(cx-r*.2,top+1);c.lineTo(cx+r*.05,girdle);c.lineTo(cx-r*.15,cy+r*.45);
    if(q===0){c.moveTo(cx+r*.5,girdle);c.lineTo(cx+r*.15,cy+r*.5);}
    c.stroke();
    if(q<=1)poly('#1a1420',[[cx+r*.55,top],[cx+r*.85,top+r*.3],[cx+r*.4,top+r*.25]],null);
  }
  // Calidades altas: destellos.
  if(q>=3){
    c.fillStyle='#ffffff';
    const spark=(x,y,k)=>{c.fillRect(x-k,y-.6,k*2,1.2);c.fillRect(x-.6,y-k,1.2,k*2);};
    spark(cx-r*.25,top+r*.2,2+q*.45);
    if(q>=4)spark(cx+r*.6,girdle+r*.25,2.4);
  }
}
export function equipmentIcon(type){
  const art=document.createElement('canvas');
  art.width=40;art.height=40;
  art.className='equipment-icon';
  art.setAttribute('aria-hidden','true');
  const c=art.getContext('2d');
  if(String(type).startsWith('gem:')){const [,kind,quality]=String(type).split(':');gemIcon(c,kind,Number(quality));return art;}
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

