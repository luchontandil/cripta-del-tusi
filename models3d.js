import * as T from './three.module.js';

const shapes={
  cube:new T.BoxGeometry(1,1,1),
  orb:new T.IcosahedronGeometry(.5,1),
  gem:new T.OctahedronGeometry(.5),
  column:new T.CylinderGeometry(.5,.5,1,8),
  cone:new T.ConeGeometry(.5,1,7),
  disc:new T.CylinderGeometry(.5,.5,1,24),
  ring:new T.TorusGeometry(.43,.032,5,24)
};
const materials=new Map();
export function solid(color,emissive=false) {
  const key=color+'-'+emissive;
  if(!materials.has(key))materials.set(key,emissive?new T.MeshBasicMaterial({color}):new T.MeshStandardMaterial({color,roughness:.9}));
  return materials.get(key);
}
export function piece(parent,shape,color,x,y,z,sx,sy,sz,glow=false){
  const mesh=new T.Mesh(shapes[shape],solid(color,glow));
  mesh.position.set(x,y,z);
  mesh.scale.set(sx,sy,sz);
  mesh.receiveShadow=!glow;
  parent.add(mesh);
  return mesh;
}
const looks={
  guardia:['#527571','#e8b475','#294445','#e5b090'],
  tirador:['#47765b','#e7ae69','#314632','#ddb38d'],
  mistico:['#79548b','#ffd894','#493156','#efbc91'],
  mago:['#425c9a','#9dd6fd','#293858','#f1b490'],
  sombra:['#4d355c','#ed9c79','#252137','#bf8978'],
  enemy:['#873f47','#ff9861','#4b2830','#8e6762'],
  ranged:['#793860','#f298b2','#39283d','#a77986'],
  elite:['#5c456e','#c8b1ff','#362d45','#7d658e'],
  boss:['#a14356','#ffd06d','#4b2534','#9b6865']
};

function bow(parent,color) {
  const points=[[-.14,.26],[.02,.20],[.12,0],[.02,-.20],[-.14,-.26]];
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i];
    const segment=piece(parent,'cube',color,(a[0]+b[0])/2,(a[1]+b[1])/2,0,.041,Math.hypot(b[0]-a[0],b[1]-a[1])+.012,.045);
    segment.rotation.z=-Math.atan2(b[0]-a[0],b[1]-a[1]);
  }
  piece(parent,'cube','#f2d9aa',-.14,0,0,.012,.51,.012);
}
function staff(parent,color,arcane){
  piece(parent,'column','#543745',0,.06,0,.057,.63,.057);
  piece(parent,'column',color,0,.29,0,.095,.09,.095);
  piece(parent,'gem',color,0,.42,0,.19,.26,.19,true);
  if(arcane)piece(parent,'ring','#93c7ff',0,.42,0,.29,.29,.29,true);
}
const creatures={slime:slime,slimeking:slime,bat:bat,skull:skull,worm:worm};
const glass=(color,opacity=.82)=>new T.MeshStandardMaterial({color,roughness:.25,metalness:.05,transparent:true,opacity,emissive:color,emissiveIntensity:.18});
function add(parent,shape,material,x,y,z,sx,sy,sz){
  const mesh=new T.Mesh(shapes[shape],material);
  mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);
  mesh.castShadow=true;parent.add(mesh);return mesh;
}
/** Limo: cuerpo gelatinoso que respira, rebota al moverse y se estira al atacar. */
function slime(kind){
  const king=kind==='slimeking';
  const tone=king?'#c77dff':'#6fdc8c';
  const root=new T.Group(),figure=new T.Group(),body=new T.Group();
  root.add(figure);figure.add(body);
  const jelly=add(body,'orb',glass(tone),0,.3,0,.74,.58,.74);
  add(body,'gem',solid(king?'#ffe27a':'#d9ff9e',true),0,.28,0,.16,.2,.16);
  for(const x of [-.13,.13]){
    add(body,'orb',solid('#f6fff6'),x,.42,.3,.13,.15,.08);
    add(body,'orb',solid('#14281a'),x,.42,.335,.065,.085,.04);
  }
  add(body,'cube',solid('#1d3b26'),0,.31,.33,.12,.025,.02);
  if(king){
    add(body,'column',solid('#f2c45c'),0,.62,0,.3,.07,.3);
    for(const a of [0,1.26,2.51,3.77,5.03])add(body,'cone',solid('#ffd977'),Math.sin(a)*.14,.71,Math.cos(a)*.14,.07,.12,.07);
  }
  const size=king?1.5:1;
  figure.scale.setScalar(size);
  const animate=(t,{gait,swing,walking,reduced})=>{
    const breath=reduced?0:Math.sin(t*3.1);
    const hop=walking?Math.abs(gait):0;
    body.position.y=hop*.28;
    const squash=1+breath*.07-hop*.12+swing*.25;
    body.scale.set(1/Math.sqrt(squash)*(1+(walking?(1-hop)*.12:0)),squash,1/Math.sqrt(squash));
    body.position.z=swing*.22;
    jelly.material.emissiveIntensity=.18+swing*.6;
  };
  return {root,figure,legs:[],arms:[],head:.75*size,animate};
}
/** Murciélago: vuela con aleteo rápido, se balancea y se lanza en picado al atacar. */
function bat(){
  const root=new T.Group(),figure=new T.Group(),body=new T.Group();
  root.add(figure);figure.add(body);
  const fur=solid('#7a58a0'),membrane=new T.MeshStandardMaterial({color:'#a77fc4',roughness:.7,side:T.DoubleSide,emissive:'#3a2050',emissiveIntensity:.4});
  add(body,'orb',fur,0,0,0,.36,.34,.32);
  add(body,'orb',fur,0,.2,.05,.28,.25,.25);
  for(const side of [-1,1]){
    const ear=add(body,'cone',fur,side*.09,.36,.03,.08,.16,.06);ear.rotation.z=side*-.3;
    add(body,'orb',solid('#ff5a5a',true),side*.06,.22,.17,.05,.05,.03);
    add(body,'cone',solid('#f4ece0'),side*.035,.12,.16,.02,.05,.02).rotation.x=Math.PI;
  }
  const wings=[-1,1].map(side=>{
    const wing=new T.Group();
    wing.position.set(side*.14,.05,0);
    body.add(wing);
    const shape=new T.Shape();
    shape.moveTo(0,0);shape.lineTo(side*.55,.18);shape.lineTo(side*.5,-.02);shape.lineTo(side*.36,-.1);shape.lineTo(side*.22,-.04);shape.lineTo(side*.1,-.12);shape.lineTo(0,-.06);
    const mesh=new T.Mesh(new T.ShapeGeometry(shape),membrane);
    mesh.castShadow=true;
    wing.add(mesh);
    add(wing,'cube',fur,side*.27,.08,0,.5,.025,.025).rotation.z=side*.33;
    return wing;
  });
  body.position.y=.72;
  figure.scale.setScalar(1.55);
  const animate=(t,{gait,swing,walking,reduced,phase})=>{
    const flap=reduced?.3:Math.sin(t*(walking?20:13)+phase);
    wings[0].rotation.y=flap*.9;wings[1].rotation.y=-flap*.9;
    wings[0].rotation.z=-flap*.25;wings[1].rotation.z=flap*.25;
    body.position.y=.72+(reduced?0:Math.sin(t*4+phase)*.07)-swing*.3;
    body.position.z=swing*.35;
    body.rotation.x=walking?.35:swing*.6;
    body.rotation.z=reduced?0:Math.sin(t*2.2+phase)*.12;
  };
  return {root,figure,legs:[],arms:[],head:1.05*1.55,animate};
}
/** Calavera flotante: levita, abre la mandíbula, ojos brillantes y llamas que orbitan. */
function skull(){
  const root=new T.Group(),figure=new T.Group(),head=new T.Group();
  root.add(figure);figure.add(head);
  const bone=new T.MeshStandardMaterial({color:'#e8e0cc',roughness:.6});
  add(head,'orb',bone,0,0,0,.48,.44,.46);
  add(head,'cube',bone,0,-.16,.08,.3,.12,.28);
  for(const x of [-.11,.11]){
    add(head,'orb',solid('#1a1420'),x,.02,.2,.13,.13,.06);
    add(head,'orb',solid('#8dffb0',true),x,.02,.225,.085,.085,.04);
  }
  add(head,'gem',solid('#1a1420'),0,-.07,.225,.06,.07,.03);
  const jaw=new T.Group();
  jaw.position.set(0,-.2,-.02);
  head.add(jaw);
  add(jaw,'cube',bone,0,-.04,.1,.27,.07,.24);
  for(const x of [-.08,-.027,.027,.08])add(jaw,'cube',solid('#f8f3e6'),x,.0,.21,.035,.04,.02);
  const flames=[0,1,2].map(i=>{
    const flame=add(figure,'gem',new T.MeshBasicMaterial({color:'#7dffb0',transparent:true,opacity:.85}),0,.6,0,.08,.13,.08);
    flame.castShadow=false;return flame;
  });
  head.position.y=.68;
  figure.scale.setScalar(1.35);
  const animate=(t,{swing,walking,reduced,phase})=>{
    const r=reduced?0:t;
    head.position.y=.68+Math.sin(r*2.1+phase)*.08;
    head.rotation.z=Math.sin(r*1.3+phase)*.14;
    head.rotation.x=-swing*.45+(walking?.2:0);
    head.position.z=swing*.18;
    jaw.rotation.x=.12+Math.max(0,Math.sin(r*3.3+phase))*.25+swing*.7;
    flames.forEach((flame,i)=>{
      const a=r*2.4+i*2.094;
      flame.position.set(Math.cos(a)*.36,head.position.y-.05+Math.sin(r*5+i)*.06,Math.sin(a)*.36);
      flame.rotation.y=r*4;
    });
  };
  return {root,figure,legs:[],arms:[],head:1.1*1.35,animate};
}
/** Gusano de cripta: segmentos que ondulan, cabeza alzada con mandíbulas y embestida. */
function worm(){
  const root=new T.Group(),figure=new T.Group();
  root.add(figure);
  const flesh=new T.MeshStandardMaterial({color:'#b7766c',roughness:.55});
  const ring=new T.MeshStandardMaterial({color:'#8d4f4a',roughness:.6});
  const segments=[0,1,2,3,4].map(i=>{
    const size=.42-i*.055;
    const seg=add(figure,'orb',i%2?ring:flesh,0,size*.5,-i*.2,size,size*.9,size);
    return seg;
  });
  const head=new T.Group();
  figure.add(head);
  add(head,'orb',flesh,0,0,0,.42,.4,.42);
  add(head,'orb',solid('#2a0f14'),0,0,.17,.22,.2,.1);
  for(const side of [-1,1]){
    const fang=add(head,'cone',solid('#f2e6d0'),side*.11,-.02,.2,.06,.17,.06);
    fang.rotation.x=Math.PI/2+.3;fang.rotation.z=side*.35;
    add(head,'orb',solid('#ffcc4d',true),side*.13,.12,.13,.05,.05,.04);
  }
  figure.scale.setScalar(1.15);
  const animate=(t,{gait,swing,walking,reduced,phase})=>{
    const speed=walking?7:2.6;
    const r=reduced?0:t;
    segments.forEach((seg,i)=>{
      const wave=Math.sin(r*speed-i*.9+phase);
      seg.position.x=wave*.06*(i+1)*.5;
      seg.position.y=(.42-i*.055)*.5+Math.max(0,wave)*.05;
    });
    const rise=.55+Math.sin(r*1.7+phase)*.06+swing*.1;
    head.position.set(Math.sin(r*speed+.9+phase)*.04,rise,.16+swing*.32);
    head.rotation.x=-.25-swing*.5;
    head.rotation.z=Math.sin(r*1.4+phase)*.15;
  };
  return {root,figure,legs:[],arms:[],head:.95*1.15,animate};
}
export function miniature(kind) {
  if(creatures[kind])return creatures[kind](kind);
  const [body,accent,dark,skin]=looks[kind]||looks.enemy;
  const root=new T.Group();
  const figure=new T.Group();
  root.add(figure);
  const robe=['mago','mistico'].includes(kind);
  const mace=['elite','boss'].includes(kind);
  const isMonster=['enemy','ranged','elite','boss'].includes(kind);
  const size=kind==='boss'?1.44:kind==='elite'?1.18:1.1;
  figure.scale.setScalar(size);
  const legs=[-.117,.117].map(x=>{
    const leg=new T.Group();
    leg.position.set(x,.33,0);
    figure.add(leg);
    piece(leg,'cube',dark,0,-.105,0,.145,.24,.13);
    piece(leg,'cube',isMonster?body:'#372c32',0,-.248,.035,.16,.085,.225);
    return leg;
  });
  piece(figure,robe?'cone':'cube',body,0,.44,0,robe?.51:.40,robe?.53:.32,.30);
  piece(figure,'cube',dark,0,.49,.015,.40,.062,.31);
  piece(figure,'cube',accent,0,.49,.179,.105,.064,.036);
  piece(figure,'orb',body,0,.675,0,.47,.32,.35);
  piece(figure,'orb',skin,0,.922,.015,.36,.34,.34);
  if(robe||kind==='tirador'||kind==='ranged'||kind==='sombra'){
    piece(figure,'orb',dark,0,.994,-.043,.41,.33,.33);
    piece(figure,'cube',body,0,.733,-.175,.36,.47,.07).rotation.x=-.14;
  }
  if(kind==='sombra'){
    piece(figure,'cube',dark,0,.872,.161,.27,.104,.079);
    piece(figure,'cone',body,0,1.093,-.06,.40,.23,.34);
    piece(figure,'gem',accent,0,.713,.201,.135,.093,.075);
  }
  if(kind==='tirador'){
    piece(figure,'cone',body,0,.984,-.074,.44,.36,.40).rotation.x=-.46;
    const quiver=piece(figure,'column','#6b4639',-.13,.67,-.235,.125,.51,.13);
    quiver.rotation.z=-.28;
    for(const x of [-.18,-.10,-.048]){
      piece(figure,'cube','#d2af65',x,.93,-.241,.017,.21,.017);
      piece(figure,'gem',accent,x,1.035,-.241,.069,.085,.046);
    }
  }
  if(kind==='mago'){
    piece(figure,'disc',dark,0,1.036,.012,.53,.045,.48);
    piece(figure,'cone',body,.017,1.18,-.025,.39,.31,.37).rotation.z=-.18;
    piece(figure,'column',accent,0,1.086,0,.33,.038,.31);
  }else if(kind==='guardia'||mace){
    piece(figure,'orb',dark,0,1.014,0,.40,.26,.39);
    piece(figure,'cube',accent,0,.979,.182,.32,.058,.054);
    if(kind==='guardia'){
      piece(figure,'cube','#b1c4b8',0,.962,.204,.063,.19,.042);
      piece(figure,'gem','#f6c889',0,1.145,-.018,.104,.139,.25);
    }
  }else if(kind==='mistico'){
    piece(figure,'gem',accent,0,1.085,.162,.13,.21,.05);
    for(const x of [-.15,.15])piece(figure,'cube','#d0b6d7',x,.622,.195,.048,.35,.045);
  }
  for(const side of [-1,1]){
    piece(figure,'cube',isMonster?'#ffad75':'#231d2d',side*.075,.931,.173,.031,.032,.022,isMonster);
    if(isMonster){
      const horn=piece(figure,'cone',accent,side*.15,1.078,-.01,.126,.24,.14);
      horn.rotation.z=side*-.38;
    }
  }
  if(kind==='enemy'){
    piece(figure,'orb',dark,0,.875,.094,.34,.22,.29);
    piece(figure,'gem','#df9678',0,.82,.23,.15,.13,.06);
    for(const x of [-.085,0,.085])piece(figure,'cube',accent,x,.685,.194,.042,.10,.045);
  }else if(kind==='boss'){
    piece(figure,'column',accent,0,1.085,0,.38,.08,.38);
    for(const side of [-1,0,1])piece(figure,'cone',accent,side*.108,1.17,.134,.108,.19,.105);
    piece(figure,'gem','#f78882',0,.66,.202,.15,.19,.10,true);
    for(const sign of [-1,1]){
      const blade=piece(figure,'cone',accent,sign*.27,.868,-.073,.16,.45,.15);
      blade.rotation.z=sign*-.63;
    }
  }else if(robe)piece(figure,'gem',accent,0,.702,.194,.102,.10,.056,true);

  const arms=[-.24,.24].map((x,i)=>{
    const arm=new T.Group();
    arm.position.set(x,.718,.008);
    figure.add(arm);
    piece(arm,'orb',mace||kind==='guardia'?accent:body,0,-.006,0,.22,.18,.22);
    piece(arm,'cube',accent,0,-.187,.055,.131,.08,.116);
    piece(arm,'cube',body,0,-.14,.0,.130,.24,.154);
    piece(arm,'orb',skin,0,-.288,.025,.13,.13,.13);
    const held=new T.Group();
    held.position.set(0,-.27,.093);
    arm.add(held);
    if(i===1){
      if(kind==='tirador'||kind==='ranged')bow(held,accent);
      else if(robe||kind==='boss')staff(held,accent,kind==='mago');
      else if(kind==='guardia'||kind==='elite'||kind==='sombra'){
        const blade=kind==='sombra'?.61:1;
        piece(held,'cube','#c3cbd1',0,.23*blade,0,.095,.45*blade,.05);
        piece(held,'cone','#d9dfe0',0,.50*blade,0,.099,.11*blade,.05);
        piece(held,'cube',accent,0,.015,0,.18,.046,.054);
      }
    }else if(kind==='guardia'||kind==='elite'){
      piece(held,'gem',body,-.02,.10,.041,.34,.43,.115);
      piece(held,'gem',accent,-.02,.10,.107,.105,.137,.06);
    }
    return arm;
  });
  figure.traverse(mesh=>{if(mesh.isMesh&&mesh.material.isMeshStandardMaterial)mesh.castShadow=true;});
  return {root,figure,legs,arms,head:(kind==='mago'?1.36:1.23)*size};
}
export function obstacle(root,kind,variant) {
  const stone=kind==='roots'?'#58635d':'#59667b';
  const dark=kind==='roots'?'#333e43':'#354159';
  const trim=kind==='roots'?'#77a681':'#8292ac';
  piece(root,'cube',dark,0,.10,0,.82,.22,.82);
  if(variant===0){
    piece(root,'column',stone,0,.59,0,.67,.93,.67);
    piece(root,'column',trim,0,1.10,0,.80,.13,.80);
    piece(root,'column',dark,0,.24,0,.78,.12,.78);
  }else if(variant===1){
    piece(root,'cube',stone,0,.38,0,.82,.45,.66);
    piece(root,'cube',trim,0,.645,0,.90,.085,.72);
    piece(root,'cube',dark,0,.43,.34,.17,.21,.033);
    piece(root,'gem',kind==='roots'?'#b7ed91':'#bea0fb',0,.43,.37,.14,.155,.065,true);
  }else{
    piece(root,'cube',stone,0,.40,0,.69,.63,.72).rotation.y=.22;
    piece(root,'gem',kind==='roots'?'#81997c':'#8595ad',.12,.72,-.10,.45,.39,.45);
    piece(root,'gem',dark,-.26,.45,.26,.35,.35,.31);
  }
  root.traverse(mesh=>{if(mesh.isMesh&&mesh.material.isMeshStandardMaterial)mesh.castShadow=true;});
}

