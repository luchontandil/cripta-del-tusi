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
const creatures={slime:slime,slimeking:slime,lavaslime:slime,slug:slug,plant:plant,sporemother:plant,bat:bat,skull:skull,worm:worm,oracle:oracle,umbralking:umbralKing,
  skeleton:skeleton,succubus:succubus,vampire:vampire,imp:imp,cerberus:cerberus,skeletonking:skeletonKing,firedemon:fireDemon,vampqueen:vampQueen};
const boneMat=()=>new T.MeshStandardMaterial({color:'#e6dfcc',roughness:.6});
/** Esqueleto: huesos que traquetean, mandíbula que castañetea y espada oxidada. */
function skeleton(){
  const root=new T.Group(),figure=new T.Group();root.add(figure);
  const bone=boneMat(),dark=solid('#1a1418');
  const hips=add(figure,'cube',bone,0,.42,0,.3,.07,.14);
  const spine=[];for(let i=0;i<4;i++)spine.push(add(figure,'cube',bone,0,.5+i*.07,0,.06,.05,.06));
  const ribs=[];for(let i=0;i<3;i++)ribs.push(add(figure,'cube',bone,0,.58+i*.07,.02,.3-i*.03,.03,.18));
  const head=new T.Group();head.position.set(0,.95,0);figure.add(head);
  add(head,'orb',bone,0,0,0,.3,.3,.3);
  for(const x of [-.06,.06]){add(head,'orb',dark,x,.01,.12,.08,.08,.05);add(head,'orb',solid('#ff5a3a',true),x,.01,.135,.03,.03,.02);}
  const jaw=add(head,'cube',bone,0,-.14,.04,.18,.06,.16);
  const legs=[-.09,.09].map(x=>{const leg=new T.Group();leg.position.set(x,.4,0);figure.add(leg);add(leg,'cube',bone,0,-.18,0,.05,.36,.05);add(leg,'cube',bone,0,-.37,.04,.09,.04,.14);return leg;});
  const arms=[-.2,.2].map((x,i)=>{const arm=new T.Group();arm.position.set(x,.76,0);figure.add(arm);add(arm,'cube',bone,0,-.16,0,.045,.32,.045);
    if(i===1){add(arm,'cube',solid('#8a7a6a'),0,-.25,.18,.05,.04,.4);add(arm,'cube',solid('#5a4a3a'),0,-.25,-.02,.09,.04,.04);}
    return arm;});
  figure.scale.setScalar(1.15);
  const animate=(t,{gait,swing,walking,phase})=>{
    const rattle=Math.sin(t*9+phase)*.015;
    head.position.y=.95+Math.sin(t*1.8+phase)*.02;
    head.rotation.z=Math.sin(t*1.1+phase)*.12;
    jaw.position.y=-.14-Math.max(0,Math.sin(t*6+phase))*.04-swing*.05;
    ribs.forEach((rib,i)=>rib.position.x=Math.sin(t*7+i)*.01);
    figure.rotation.z=walking?gait*.08:rattle;
    legs[0].rotation.x=-gait*.5;legs[1].rotation.x=gait*.5;
    arms[0].rotation.x=gait*.4+Math.sin(t*1.6)*.1;arms[1].rotation.x=-gait*.4-swing*1.4-.2;
    hips.rotation.y=Math.sin(t*1.3)*.08;
  };
  return {root,figure,legs:[],arms:[],head:1.35,animate};
}
/** Súcubo: flota con alas de murciélago, cola ondulante y un aura rosada. */
function succubus(){
  const root=new T.Group(),figure=new T.Group(),body=new T.Group();root.add(figure);figure.add(body);
  const skin=new T.MeshStandardMaterial({color:'#c76a9a',roughness:.5}),cloth=solid('#3a1030');
  add(body,'cone',cloth,0,.42,0,.36,.5,.3).rotation.x=Math.PI;
  add(body,'orb',skin,0,.68,0,.26,.3,.22);
  const head=add(body,'orb',skin,0,.95,.02,.24,.26,.24);
  add(body,'orb',solid('#2a0a20'),0,1.0,-.04,.28,.24,.28);
  for(const side of [-1,1]){
    add(body,'cone',solid('#1a0818'),side*.08,1.12,0,.05,.18,.05).rotation.z=side*-.4;
    add(body,'orb',solid('#ff7ad9',true),side*.05,.96,.12,.035,.03,.02);
  }
  const membrane=new T.MeshStandardMaterial({color:'#5a1846',roughness:.7,side:T.DoubleSide,emissive:'#2a0820',emissiveIntensity:.4});
  const wings=[-1,1].map(side=>{const wing=new T.Group();wing.position.set(side*.12,.75,-.12);body.add(wing);
    const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(side*.5,.28);shape.lineTo(side*.46,.02);shape.lineTo(side*.3,-.12);shape.lineTo(side*.1,-.05);
    wing.add(new T.Mesh(new T.ShapeGeometry(shape),membrane));return wing;});
  const tail=[0,1,2,3].map(i=>add(body,'orb',skin,0,.3-i*.05,-.14-i*.08,.06-i*.008,.06-i*.008,.06-i*.008));
  add(body,'cone',solid('#ff7ad9',true),0,.14,-.48,.06,.1,.06);
  const aura=add(figure,'ring',new T.MeshBasicMaterial({color:'#ff7ad9',transparent:true,opacity:.35,depthWrite:false}),0,.04,0,1,1,1);
  aura.rotation.x=-Math.PI/2;aura.castShadow=false;
  figure.scale.setScalar(1.2);
  const animate=(t,{swing,walking,phase})=>{
    body.position.y=.18+Math.sin(t*2+phase)*.07;
    body.rotation.z=Math.sin(t*1.2+phase)*.06;
    const flap=Math.sin(t*(walking?12:5)+phase);
    wings[0].rotation.y=.3+flap*.4;wings[1].rotation.y=-.3-flap*.4;
    tail.forEach((seg,i)=>seg.position.x=Math.sin(t*3-i*.8+phase)*.05*(i+1));
    head.rotation.y=Math.sin(t*.8+phase)*.3;
    body.rotation.x=-swing*.4;
    aura.scale.setScalar(1+Math.sin(t*2.4)*.08+swing*.3);
    aura.material.opacity=.25+Math.sin(t*3)*.1+swing*.3;
  };
  return {root,figure,legs:[],arms:[],head:1.55,animate};
}
/** Vampiro: capa alta que ondea, ojos rojos y garras; se inclina al morder. */
function vampire(){
  const root=new T.Group(),figure=new T.Group(),body=new T.Group();root.add(figure);figure.add(body);
  const pale=new T.MeshStandardMaterial({color:'#d9d4e6',roughness:.5});
  add(body,'cone',solid('#1c1426'),0,.5,0,.46,.95,.36);
  add(body,'cube',solid('#7a1020'),0,.7,.16,.16,.36,.04);
  const head=new T.Group();head.position.set(0,1.05,0);body.add(head);
  add(head,'orb',pale,0,0,0,.26,.3,.26);
  add(head,'cube',solid('#151018'),0,.12,-.02,.27,.08,.26);
  for(const x of [-.06,.06]){add(head,'orb',solid('#ff2a3a',true),x,.02,.12,.035,.03,.02);add(head,'cone',solid('#ffffff'),x*.6,-.1,.11,.015,.05,.015).rotation.x=Math.PI;}
  const collar=[-1,1].map(side=>{const c=add(body,'cube',solid('#2a1838'),side*.16,1.02,-.06,.12,.32,.04);c.rotation.z=side*.35;return c;});
  const cape=new T.Group();cape.position.set(0,.98,-.14);body.add(cape);
  const capeMesh=add(cape,'cube',solid('#4a0a1a'),0,-.45,0,.7,.92,.04);
  const arms=[-1,1].map(side=>{const arm=new T.Group();arm.position.set(side*.24,.82,0);body.add(arm);
    add(arm,'cube',solid('#1c1426'),0,-.16,0,.1,.32,.1);for(let k=-1;k<=1;k++)add(arm,'cone',pale,k*.025,-.36,.03,.015,.08,.015).rotation.x=Math.PI;return arm;});
  figure.scale.setScalar(1.12);
  const animate=(t,{gait,swing,walking,phase})=>{
    body.position.y=Math.sin(t*1.6+phase)*.02;
    cape.rotation.x=.12+Math.sin(t*2+phase)*.07+(walking?.3:0);
    capeMesh.rotation.z=Math.sin(t*1.5+phase)*.05;
    head.rotation.y=Math.sin(t*.7+phase)*.35;
    body.rotation.x=-swing*.45;
    arms[0].rotation.x=-.4+gait*.3+Math.sin(t*1.4)*.08;arms[1].rotation.x=-.4-gait*.3-swing*1.2;
    collar.forEach((c,i)=>c.rotation.x=Math.sin(t*2+i)*.05);
  };
  return {root,figure,legs:[],arms:[],head:1.5,animate};
}
/** Diablillo: pequeño demonio que levita con alitas y una bola de fuego en la mano. */
function imp(){
  const root=new T.Group(),figure=new T.Group(),body=new T.Group();root.add(figure);figure.add(body);
  const red=new T.MeshStandardMaterial({color:'#c2402a',roughness:.5});
  add(body,'orb',red,0,.42,0,.34,.36,.3);
  const head=add(body,'orb',red,0,.7,.02,.3,.28,.28);
  for(const side of [-1,1]){
    add(body,'cone',solid('#2a1410'),side*.1,.86,0,.05,.14,.05).rotation.z=side*-.5;
    add(body,'orb',solid('#ffe04a',true),side*.06,.72,.13,.04,.035,.02);
  }
  const wings=[-1,1].map(side=>{const w=add(body,'cone',solid('#5a1a14'),side*.2,.55,-.1,.2,.06,.14);w.rotation.z=side*1.2;return w;});
  const fire=add(body,'orb',new T.MeshBasicMaterial({color:'#ffb347'}),.26,.46,.12,.14,.14,.14);
  const core=add(body,'orb',new T.MeshBasicMaterial({color:'#fff2b0'}),.26,.46,.12,.07,.07,.07);
  const tail=add(body,'cone',red,0,.3,-.22,.05,.3,.05);tail.rotation.x=-1;
  figure.scale.setScalar(1.15);
  const animate=(t,{swing,walking,phase})=>{
    body.position.y=.25+Math.sin(t*3+phase)*.08;
    wings[0].rotation.y=Math.sin(t*16+phase)*.5;wings[1].rotation.y=-Math.sin(t*16+phase)*.5;
    const s=.14+Math.sin(t*8)*.03+swing*.1;fire.scale.setScalar(s);core.scale.setScalar(s*.5);
    head.rotation.z=Math.sin(t*1.5+phase)*.15;
    tail.rotation.z=Math.sin(t*3+phase)*.4;
    body.rotation.x=-swing*.5+(walking?.2:0);
  };
  return {root,figure,legs:[],arms:[],head:1.25,animate};
}
/** Cancerbero: perro gigante de tres cabezas, respiración pesada y fauces humeantes. */
function cerberus(){
  const root=new T.Group(),figure=new T.Group(),body=new T.Group();root.add(figure);figure.add(body);
  const fur=new T.MeshStandardMaterial({color:'#2a1e1c',roughness:.85}),furLight=solid('#4a3530');
  const ember=new T.MeshStandardMaterial({color:'#ff6a2a',emissive:'#ff4a10',emissiveIntensity:1.4});
  add(body,'orb',fur,0,.62,-.05,.62,.5,.95);
  add(body,'orb',furLight,0,.72,.32,.55,.5,.4);
  for(let i=0;i<5;i++)add(body,'cone',furLight,0,.95-i*.02,-.35+i*.15,.08,.18,.08);
  const legs=[[-.22,.3],[.22,.3],[-.22,-.38],[.22,-.38]].map(([x,z])=>{const leg=new T.Group();leg.position.set(x,.48,z);body.add(leg);
    add(leg,'cube',fur,0,-.22,0,.16,.42,.16);add(leg,'cube',solid('#1a1210'),0,-.44,.05,.18,.06,.22);return leg;});
  const heads=[-.32,0,.32].map((x,i)=>{const head=new T.Group();head.position.set(x,.95+(i===1?.08:0),.55);body.add(head);
    add(head,'orb',fur,0,0,0,.3,.28,.32);
    add(head,'cube',furLight,0,-.05,.2,.2,.14,.24);
    const jaw=add(head,'cube',fur,0,-.13,.19,.18,.05,.22);
    for(const side of [-1,1]){add(head,'cone',fur,side*.1,.17,-.02,.07,.14,.06).rotation.z=side*-.3;add(head,'orb',ember,side*.08,.05,.13,.04,.035,.02);}
    add(head,'cube',ember,0,-.1,.31,.12,.02,.02);
    return {head,jaw};});
  const tail=add(body,'cone',fur,0,.85,-.6,.08,.42,.08);tail.rotation.x=-.9;
  const smoke=[0,1,2,3,4].map(()=>add(figure,'orb',new T.MeshBasicMaterial({color:'#ff8a3a',transparent:true,opacity:.4,depthWrite:false}),0,0,0,.08,.08,.08));
  figure.scale.setScalar(1.35);
  const animate=(t,{gait,swing,walking,phase})=>{
    const breath=Math.sin(t*2.2+phase);
    body.position.y=breath*.02+(walking?Math.abs(gait)*.08:0);
    body.scale.set(1,1+breath*.02,1);
    legs.forEach((leg,i)=>leg.rotation.x=(i%2?1:-1)*(i<2?1:-1)*gait*.6);
    heads.forEach(({head,jaw},i)=>{
      head.rotation.y=Math.sin(t*.9+i*1.7+phase)*.35;
      head.rotation.x=Math.sin(t*1.3+i)*.08-swing*.5;
      jaw.rotation.x=Math.max(0,Math.sin(t*2.5+i*2))*.35+swing*.6;
    });
    tail.rotation.z=Math.sin(t*4+phase)*.5;
    smoke.forEach((puff,i)=>{
      const k=(t*.6+i/5)%1;
      const h=heads[i%3].head;
      puff.position.set(h.position.x*1.35,(1.2+k*.8)*1.35,(h.position.z+.35)*1.35);
      puff.scale.setScalar(.06+k*.18);
      puff.material.opacity=.45*(1-k);
    });
  };
  return {root,figure,legs:[],arms:[],head:2.0,animate};
}
/** Rey Osario: esqueleto gigante con corona de hueso, capa raída y espadón; ojos de llama verde. */
function skeletonKing(){
  const root=new T.Group(),figure=new T.Group(),body=new T.Group();root.add(figure);figure.add(body);
  const bone=boneMat(),gold=new T.MeshStandardMaterial({color:'#c9a24a',roughness:.35,metalness:.7});
  const soul=new T.MeshStandardMaterial({color:'#7dffb0',emissive:'#30ff80',emissiveIntensity:1.6});
  add(body,'cube',bone,0,.55,0,.34,.08,.18);
  for(let i=0;i<4;i++)add(body,'cube',bone,0,.7+i*.1,.03,.42-i*.03,.04,.24);
  add(body,'cube',bone,0,.82,0,.07,.5,.07);
  const cape=new T.Group();cape.position.set(0,1.15,-.18);body.add(cape);
  const capeMesh=add(cape,'cube',solid('#3a2a4a'),0,-.5,0,.8,1.0,.04);
  for(const side of [-1,1])add(body,'orb',gold,side*.3,1.13,0,.22,.16,.22);
  const head=new T.Group();head.position.set(0,1.38,0);body.add(head);
  add(head,'orb',bone,0,0,0,.38,.4,.38);
  add(head,'cube',bone,0,-.18,.05,.24,.08,.22);
  for(const x of [-.08,.08]){add(head,'orb',solid('#0c0812'),x,.02,.16,.1,.1,.05);add(head,'orb',soul,x,.02,.18,.05,.05,.03);}
  const crown=new T.Group();head.add(crown);
  add(crown,'column',gold,0,.2,0,.4,.08,.4);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;add(crown,'cone',bone,Math.sin(a)*.18,.33,Math.cos(a)*.18,.06,.2,.06);}
  const legs=[-.12,.12].map(x=>{const leg=new T.Group();leg.position.set(x,.52,0);body.add(leg);add(leg,'cube',bone,0,-.24,0,.07,.48,.07);add(leg,'cube',bone,0,-.48,.05,.12,.05,.2);return leg;});
  const arm=new T.Group();arm.position.set(.36,1.08,.02);body.add(arm);
  add(arm,'cube',bone,0,-.2,0,.06,.4,.06);
  const sword=new T.Group();sword.position.set(0,-.4,.06);arm.add(sword);
  add(sword,'cube',new T.MeshStandardMaterial({color:'#8fa0b4',roughness:.3,metalness:.8}),0,.5,0,.09,1.05,.03);
  add(sword,'cube',gold,0,-.02,0,.32,.05,.06);add(sword,'gem',soul,0,-.02,.04,.06,.08,.04);
  const left=new T.Group();left.position.set(-.36,1.08,.02);body.add(left);add(left,'cube',bone,0,-.2,.06,.06,.4,.06);
  const wisps=[0,1,2,3].map(()=>add(figure,'gem',new T.MeshBasicMaterial({color:'#7dffb0',transparent:true,opacity:.8}),0,0,0,.06,.1,.06));
  figure.scale.setScalar(1.35);
  const animate=(t,{gait,swing,walking,phase})=>{
    body.position.y=Math.sin(t*1.3+phase)*.03;
    head.rotation.y=Math.sin(t*.6+phase)*.3;
    head.rotation.z=Math.sin(t*1.1)*.05;
    crown.position.y=Math.sin(t*2)*.02;
    cape.rotation.x=.15+Math.sin(t*1.7+phase)*.08+(walking?.25:0);
    capeMesh.rotation.z=Math.sin(t*1.2)*.04;
    legs[0].rotation.x=-gait*.45;legs[1].rotation.x=gait*.45;
    arm.rotation.x=-swing*2-.2+Math.sin(t*1.2)*.06;
    left.rotation.x=-.3+Math.sin(t*1.5+phase)*.15;
    soul.emissiveIntensity=1.4+Math.sin(t*3)*.4+swing*2;
    wisps.forEach((w,i)=>{const a=t*1.2+i*1.57;w.position.set(Math.cos(a)*.7,1.2+Math.sin(t*2+i)*.2,Math.sin(a)*.7);w.rotation.y=t*3;});
  };
  return {root,figure,legs:[],arms:[],head:2.5,animate};
}
/** Demonio de Fuego: coloso de roca y lava con cuernos, brazos llameantes y corona de fuego. */
function fireDemon(){
  const root=new T.Group(),figure=new T.Group(),body=new T.Group();root.add(figure);figure.add(body);
  const rock=new T.MeshStandardMaterial({color:'#2a1612',roughness:.8,emissive:'#4a1006',emissiveIntensity:.6});
  const lava=new T.MeshStandardMaterial({color:'#ff7a1a',emissive:'#ff5a00',emissiveIntensity:1.6});
  add(body,'orb',rock,0,.95,0,.75,.75,.6);
  add(body,'orb',lava,0,.95,.2,.32,.4,.2);
  add(body,'cone',rock,0,.45,0,.6,.6,.5).rotation.x=Math.PI;
  for(const side of [-1,1])add(body,'orb',rock,side*.42,1.2,0,.36,.3,.34);
  const head=new T.Group();head.position.set(0,1.45,.05);body.add(head);
  add(head,'orb',rock,0,0,0,.36,.34,.34);
  for(const side of [-1,1]){
    const horn=add(head,'cone',solid('#1a0a08'),side*.2,.2,0,.09,.38,.09);horn.rotation.z=side*-.6;
    add(head,'orb',solid('#fff2a0',true),side*.08,.02,.15,.05,.04,.03);
  }
  add(head,'cube',lava,0,-.1,.16,.18,.03,.02);
  const arms=[-1,1].map(side=>{const arm=new T.Group();arm.position.set(side*.5,1.15,0);body.add(arm);
    add(arm,'cube',rock,0,-.25,0,.22,.5,.22);const fist=add(arm,'orb',lava,0,-.55,.04,.24,.24,.24);return {arm,fist};});
  const flames=Array.from({length:9},(_,i)=>add(figure,'gem',new T.MeshBasicMaterial({color:i%2?'#ffd36b':'#ff6a1a',transparent:true,opacity:.9}),0,0,0,.1,.24,.1));
  const ring=add(figure,'ring',new T.MeshBasicMaterial({color:'#ff6a1a',transparent:true,opacity:.5,depthWrite:false}),0,.04,0,2.3,2.3,2.3);
  ring.rotation.x=-Math.PI/2;ring.castShadow=false;
  figure.scale.setScalar(1.3);
  const animate=(t,{gait,swing,walking,phase})=>{
    body.position.y=Math.sin(t*1.5+phase)*.03;
    lava.emissiveIntensity=1.4+Math.sin(t*3)*.5+swing*2;
    head.rotation.y=Math.sin(t*.7+phase)*.25;
    arms[0].arm.rotation.x=gait*.3+Math.sin(t*1.4)*.1-swing*1.4;
    arms[1].arm.rotation.x=-gait*.3+Math.sin(t*1.4+1)*.1-swing*1.4;
    arms.forEach(({fist},i)=>fist.scale.setScalar(.24+Math.sin(t*6+i)*.03));
    flames.forEach((f,i)=>{const a=i/flames.length*Math.PI*2+t*.4;f.position.set(Math.cos(a)*.42,1.95+Math.sin(t*7+i)*.06,Math.sin(a)*.42);f.scale.y=.24+Math.sin(t*9+i*2)*.08;});
    ring.scale.setScalar(2.3+Math.sin(t*2)*.1+swing*.6);
    ring.material.opacity=.35+Math.sin(t*3)*.1+swing*.4;
  };
  return {root,figure,legs:[],arms:[],head:2.75,animate};
}
/** Reina Vampira: levita con un vestido de sangre, alas enormes, corona y orbes de sangre en órbita. */
function vampQueen(){
  const root=new T.Group(),figure=new T.Group(),body=new T.Group();root.add(figure);figure.add(body);
  const pale=new T.MeshStandardMaterial({color:'#e8e0ee',roughness:.45});
  const blood=new T.MeshStandardMaterial({color:'#8a0a1e',roughness:.4,emissive:'#3a0008',emissiveIntensity:.6});
  const dress=add(body,'cone',blood,0,.65,0,.7,1.3,.6);
  add(body,'orb',pale,0,1.3,0,.34,.36,.28);
  add(body,'cube',solid('#1a0810'),0,1.32,.13,.28,.18,.03);
  const head=new T.Group();head.position.set(0,1.62,.02);body.add(head);
  add(head,'orb',pale,0,0,0,.3,.34,.3);
  add(head,'orb',solid('#120a14'),0,.06,-.06,.36,.36,.36);
  for(const x of [-.07,.07])add(head,'orb',solid('#ff2a3a',true),x,0,.14,.04,.03,.02);
  const crown=new T.Group();head.add(crown);
  for(let i=0;i<5;i++){const a=(i-2)*.35;add(crown,'cone',new T.MeshStandardMaterial({color:'#c9a24a',metalness:.7,roughness:.3}),Math.sin(a)*.17,.22,Math.cos(a)*.1,.05,.18,.05);}
  const membrane=new T.MeshStandardMaterial({color:'#3a0a1a',roughness:.6,side:T.DoubleSide,emissive:'#20000a',emissiveIntensity:.5});
  const wings=[-1,1].map(side=>{const wing=new T.Group();wing.position.set(side*.15,1.3,-.18);body.add(wing);
    const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(side*.95,.55);shape.lineTo(side*.85,.05);shape.lineTo(side*.6,-.2);shape.lineTo(side*.35,-.05);shape.lineTo(side*.15,-.25);
    wing.add(new T.Mesh(new T.ShapeGeometry(shape),membrane));return wing;});
  const orbs=[0,1,2,3,4].map(()=>add(figure,'orb',new T.MeshStandardMaterial({color:'#ff1a3a',emissive:'#ff0020',emissiveIntensity:1.4}),0,0,0,.09,.09,.09));
  figure.scale.setScalar(1.25);
  const animate=(t,{swing,walking,phase})=>{
    body.position.y=.12+Math.sin(t*1.6+phase)*.06;
    dress.rotation.y=Math.sin(t*.9)*.08;
    const flap=Math.sin(t*(walking?8:2.6)+phase);
    wings[0].rotation.y=.4+flap*.3;wings[1].rotation.y=-.4-flap*.3;
    head.rotation.y=Math.sin(t*.6+phase)*.3;
    crown.position.y=Math.sin(t*2.2)*.02;
    body.rotation.x=-swing*.35;
    orbs.forEach((o,i)=>{const a=t*1.1+i/5*Math.PI*2;o.position.set(Math.cos(a)*.8,1.2+Math.sin(a*2+t)*.25,Math.sin(a)*.8);o.scale.setScalar(.08+Math.sin(t*4+i)*.02+swing*.05);});
  };
  return {root,figure,legs:[],arms:[],head:2.6,animate};
}
const glow=(color,opacity=1)=>new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity>=1});
/** Oráculo de Ceniza: un gran ojo flotante de obsidiana con corona de brasas y fragmentos en órbita. */
function oracle(){
  const root=new T.Group(),figure=new T.Group(),core=new T.Group();
  root.add(figure);figure.add(core);
  const obsidian=new T.MeshStandardMaterial({color:'#2a1d26',roughness:.35,metalness:.4,emissive:'#3a0d08',emissiveIntensity:.5});
  const ember=new T.MeshStandardMaterial({color:'#ff7a2e',emissive:'#ff5a1a',emissiveIntensity:1.4,roughness:.4});
  // Manto hecho jirones bajo el ojo.
  const mantle=add(core,'cone',new T.MeshStandardMaterial({color:'#5a1f22',roughness:.9,side:T.DoubleSide}),0,-.42,0,.7,.7,.7);
  mantle.rotation.x=Math.PI;
  for(let i=0;i<6;i++){
    const a=i/6*Math.PI*2;
    const strip=add(core,'cone',solid('#6e2626'),Math.sin(a)*.25,-.78,Math.cos(a)*.25,.12,.35,.12);
    strip.rotation.x=Math.PI;
  }
  // Cuerpo: esfera facetada con grietas de lava.
  const body=add(core,'orb',obsidian,0,0,0,.92,.88,.92);
  for(let i=0;i<5;i++){
    const crack=add(core,'cube',ember,Math.sin(i*1.3)*.32,Math.cos(i*2.1)*.25,-.2-Math.abs(Math.sin(i))*.2,.04,.22,.04);
    crack.rotation.z=i*.9;
  }
  // El ojo.
  const eye=new T.Group();
  eye.position.set(0,.02,.36);
  core.add(eye);
  add(eye,'orb',new T.MeshStandardMaterial({color:'#fff1d6',roughness:.2,emissive:'#ffcf8a',emissiveIntensity:.25}),0,0,0,.46,.42,.22);
  const iris=new T.Group();
  eye.add(iris);
  const irisMat=new T.MeshStandardMaterial({color:'#ff9a2e',emissive:'#ff6a00',emissiveIntensity:1.2,roughness:.3});
  add(iris,'orb',irisMat,0,0,.08,.24,.24,.1);
  add(iris,'orb',glow('#120808'),0,0,.12,.1,.17,.05);
  for(const side of [-1,1]){
    const lid=add(eye,'cube',obsidian,0,side*.2,.02,.52,.08,.24);
    lid.rotation.x=side*.25;
  }
  // Corona de brasas y fragmentos en órbita.
  const flames=Array.from({length:7},(_,i)=>add(figure,'gem',glow(i%2?'#ffd36b':'#ff7a2e',.9),0,0,0,.12,.24,.12));
  const shards=Array.from({length:4},(_,i)=>add(figure,'gem',obsidian,0,0,0,.18,.3,.14));
  const halo=add(figure,'ring',glow('#ff8a3d',.6),0,.02,0,1.6,1.6,1.6);
  halo.rotation.x=-Math.PI/2;halo.castShadow=false;
  figure.scale.setScalar(1.45);
  const animate=(t,{swing,walking,phase})=>{
    core.position.y=1.15+Math.sin(t*1.6+phase)*.1+swing*.1;
    core.rotation.z=Math.sin(t*.9+phase)*.08;
    core.rotation.x=-swing*.35+(walking?.15:0);
    // El ojo mira a su alrededor y parpadea de vez en cuando.
    iris.position.x=Math.sin(t*.8+phase)*.08;
    iris.position.y=Math.sin(t*1.3+phase)*.04;
    const blink=Math.max(0,Math.sin(t*.7+phase)-.97)*30;
    eye.scale.y=Math.max(.1,1-blink);
    irisMat.emissiveIntensity=1.2+swing*3+Math.sin(t*3)*.2;
    flames.forEach((flame,i)=>{
      const a=t*1.4+i/flames.length*Math.PI*2;
      flame.position.set(Math.cos(a)*.42,core.position.y+.62+Math.sin(t*6+i)*.05,Math.sin(a)*.42);
      flame.scale.y=.24+Math.sin(t*9+i*2)*.06;
    });
    shards.forEach((shard,i)=>{
      const a=-t*.8+i/shards.length*Math.PI*2;
      shard.position.set(Math.cos(a)*.95,core.position.y-.1+Math.sin(t*2+i)*.15,Math.sin(a)*.95);
      shard.rotation.set(t+i,t*1.5,0);
    });
    halo.rotation.z=t*.5;
    halo.material.opacity=.35+Math.sin(t*2)*.15+swing*.4;
  };
  return {root,figure,legs:[],arms:[],head:2.35,animate};
}
/** Rey del Umbral: un liche coronado con guadaña, hombreras, capa y cadenas que orbitan. */
function umbralKing(){
  const root=new T.Group(),figure=new T.Group(),body=new T.Group();
  root.add(figure);figure.add(body);
  const robe=new T.MeshStandardMaterial({color:'#2b1d45',roughness:.85});
  const trim=new T.MeshStandardMaterial({color:'#d9a441',roughness:.35,metalness:.7});
  const bone=new T.MeshStandardMaterial({color:'#e3dccb',roughness:.55});
  const soul=new T.MeshStandardMaterial({color:'#6fd7ff',emissive:'#36b7ff',emissiveIntensity:1.6});
  // Túnica y ribetes dorados.
  add(body,'cone',robe,0,.62,0,.95,1.15,.8);
  add(body,'column',trim,0,.08,0,.9,.06,.76);
  add(body,'cube',trim,0,.72,.3,.1,.9,.04);
  // Capa.
  const cape=new T.Group();
  cape.position.set(0,1.25,-.22);
  body.add(cape);
  const capeMesh=add(cape,'cube',new T.MeshStandardMaterial({color:'#5a1730',roughness:.8}),0,-.55,0,.85,1.1,.05);
  // Torso, hombreras con pinchos y cráneo.
  add(body,'orb',robe,0,1.22,0,.62,.42,.48);
  for(const side of [-1,1]){
    add(body,'orb',trim,side*.34,1.3,0,.34,.24,.34);
    for(const k of [0,1,2])add(body,'cone',trim,side*(.32+k*.06),1.46,(k-1)*.09,.06,.2,.06).rotation.z=side*-.5;
  }
  const head=new T.Group();
  head.position.set(0,1.62,.03);
  body.add(head);
  add(head,'orb',bone,0,0,0,.36,.38,.36);
  add(head,'cube',bone,0,-.16,.06,.22,.1,.2);
  for(const x of [-.08,.08]){
    add(head,'orb',solid('#0c0812'),x,.02,.15,.1,.1,.05);
    add(head,'orb',soul,x,.02,.17,.05,.05,.03);
  }
  // Corona flotante.
  const crown=new T.Group();
  head.add(crown);
  add(crown,'column',trim,0,0,0,.42,.08,.42);
  for(let i=0;i<7;i++){
    const a=i/7*Math.PI*2;
    add(crown,'cone',trim,Math.sin(a)*.19,.12,Math.cos(a)*.19,.07,.2,.07);
  }
  add(crown,'gem',soul,0,.06,.21,.08,.1,.05);
  // Brazo con guadaña.
  const arm=new T.Group();
  arm.position.set(.42,1.2,.05);
  body.add(arm);
  add(arm,'cube',robe,0,-.18,0,.16,.4,.16);
  add(arm,'orb',bone,0,-.4,.02,.1,.1,.1);
  const scythe=new T.Group();
  scythe.position.set(0,-.4,.06);
  arm.add(scythe);
  add(scythe,'column',solid('#3a2a24'),0,.2,0,.05,1.6,.05);
  const blade=add(scythe,'cone',new T.MeshStandardMaterial({color:'#b9c6d6',roughness:.25,metalness:.8,emissive:'#2a5a7a',emissiveIntensity:.4}),.28,.96,0,.12,.62,.04);
  blade.rotation.z=-1.6;
  add(scythe,'gem',soul,0,1,0,.09,.12,.09);
  // Otro brazo, con la mano en alto.
  const left=new T.Group();
  left.position.set(-.42,1.2,.05);
  body.add(left);
  add(left,'cube',robe,0,-.15,.05,.16,.36,.16);
  add(left,'orb',soul,0,-.38,.12,.13,.13,.13);
  // Cadenas en órbita y círculo rúnico.
  const chains=Array.from({length:10},()=>add(figure,'ring',trim,0,0,0,.22,.22,.22));
  const rune=add(figure,'ring',glow('#6fd7ff',.55),0,.03,0,1.9,1.9,1.9);
  rune.rotation.x=-Math.PI/2;rune.castShadow=false;
  const rune2=add(figure,'ring',glow('#b58cff',.4),0,.035,0,1.35,1.35,1.35);
  rune2.rotation.x=-Math.PI/2;rune2.castShadow=false;
  figure.scale.setScalar(1.3);
  const animate=(t,{swing,walking,phase})=>{
    body.position.y=.12+Math.sin(t*1.4+phase)*.05;
    body.rotation.z=Math.sin(t*.7+phase)*.03;
    head.rotation.y=Math.sin(t*.6+phase)*.3;
    head.rotation.x=Math.sin(t*1.1)*.05;
    crown.position.y=.32+Math.sin(t*2.2+phase)*.04;
    crown.rotation.y=t*.4;
    cape.rotation.x=.12+Math.sin(t*1.8+phase)*.08+(walking?.25:0);
    capeMesh.rotation.z=Math.sin(t*1.3)*.04;
    arm.rotation.x=-swing*1.8+Math.sin(t*1.2+phase)*.08;
    arm.rotation.z=-.15-swing*.4;
    left.rotation.x=-.6+Math.sin(t*1.7+phase)*.12;
    soul.emissiveIntensity=1.4+Math.sin(t*3)*.4+swing*2;
    chains.forEach((link,i)=>{
      const a=t*.9+i/chains.length*Math.PI*2;
      link.position.set(Math.cos(a)*.85,.9+Math.sin(a*2+t)*.18,Math.sin(a)*.85);
      link.rotation.set(a,i%2?Math.PI/2:0,0);
    });
    rune.rotation.z=t*.35;rune2.rotation.z=-t*.6;
    rune.material.opacity=.4+Math.sin(t*2)*.12+swing*.4;
  };
  return {root,figure,legs:[],arms:[],head:2.75,animate};
}
const glass=(color,opacity=.82)=>new T.MeshStandardMaterial({color,roughness:.25,metalness:.05,transparent:true,opacity,emissive:color,emissiveIntensity:.18});
function add(parent,shape,material,x,y,z,sx,sy,sz){
  const mesh=new T.Mesh(shapes[shape],material);
  mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);
  mesh.castShadow=true;parent.add(mesh);return mesh;
}
/** Limo: cuerpo gelatinoso que respira, rebota al moverse y se estira al atacar. */
function slime(kind){
  const king=kind==='slimeking';
  const lava=kind==='lavaslime';
  const tone=king?'#c77dff':lava?'#ff6a1a':'#6fdc8c';
  const root=new T.Group(),figure=new T.Group(),body=new T.Group();
  root.add(figure);figure.add(body);
  const jelly=add(body,'orb',glass(tone),0,.3,0,.74,.58,.74);
  add(body,'gem',solid(king?'#ffe27a':lava?'#ffe08a':'#d9ff9e',true),0,.28,0,.16,.2,.16);
  if(lava){
    // Costra de roca volcánica y gotas incandescentes.
    for(const [x,z] of [[-.22,-.1],[.18,-.2],[.05,.22],[-.1,.12]])add(body,'gem',solid('#3a1a12'),x,.52,z,.16,.1,.14).rotation.y=x*9;
    for(const x of [-.3,.3])add(body,'orb',solid('#ffd36b',true),x,.08,.18,.07,.1,.07);
  }
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
    const breath=Math.sin(t*3.1);
    const hop=walking?Math.abs(gait):0;
    body.position.y=hop*.28;
    const squash=1+breath*.07-hop*.12+swing*.25;
    body.scale.set(1/Math.sqrt(squash)*(1+(walking?(1-hop)*.12:0)),squash,1/Math.sqrt(squash));
    body.position.z=swing*.22;
    jelly.material.emissiveIntensity=(lava?.7+Math.sin(t*5)*.15:.18)+swing*.6;
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
    const flap=Math.sin(t*(walking?20:13)+phase);
    wings[0].rotation.y=flap*.9;wings[1].rotation.y=-flap*.9;
    wings[0].rotation.z=-flap*.25;wings[1].rotation.z=flap*.25;
    body.position.y=.72+Math.sin(t*4+phase)*.07-swing*.3;
    body.position.z=swing*.35;
    body.rotation.x=walking?.35:swing*.6;
    body.rotation.z=Math.sin(t*2.2+phase)*.12;
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
    const r=t;
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
    const r=t;
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

/** Babosa: se arrastra ondulando, con caparazón y antenas con ojos que se balancean. */
function slug(){
  const root=new T.Group(),figure=new T.Group(),body=new T.Group();
  root.add(figure);figure.add(body);
  const skin=new T.MeshStandardMaterial({color:'#a8cf4a',roughness:.3,emissive:'#3a5a10',emissiveIntensity:.25});
  const segments=[0,1,2,3].map(i=>add(body,'orb',skin,0,.16-i*.015,.18-i*.17,.42-i*.06,.3-i*.04,.36));
  const shell=new T.Group();shell.position.set(0,.36,-.12);body.add(shell);
  add(shell,'orb',solid('#8a5a2a'),0,0,0,.48,.42,.4);
  add(shell,'ring',solid('#d9a45a'),0,.02,.0,.5,.5,.5).rotation.y=Math.PI/2;
  add(shell,'orb',solid('#b07a3a'),.0,.04,.0,.28,.24,.42);
  const head=new T.Group();head.position.set(0,.3,.34);body.add(head);
  add(head,'orb',skin,0,0,0,.3,.26,.28);
  add(head,'cube',solid('#2a3a10'),0,-.04,.14,.1,.02,.02);
  const stalks=[-1,1].map(side=>{
    const stalk=new T.Group();stalk.position.set(side*.07,.08,.04);head.add(stalk);
    add(stalk,'column',skin,0,.13,0,.04,.26,.04);
    add(stalk,'orb',solid('#f6fff0'),0,.28,0,.09,.09,.09);
    add(stalk,'orb',solid('#14200a'),0,.28,.04,.045,.045,.03);
    return stalk;
  });
  // Rastro de baba brillante.
  const trail=add(figure,'disc',glass('#c8f0a0',.35),0,.01,-.35,.5,.01,.9);
  figure.scale.setScalar(1.25);
  const animate=(t,{gait,swing,walking,phase})=>{
    const speed=walking?9:2.4;
    segments.forEach((seg,i)=>{const wave=Math.sin(t*speed-i*1.1+phase);seg.scale.y=(.3-i*.04)*(1+wave*.12);seg.position.z=.18-i*.17+wave*.02;});
    shell.position.y=.36+Math.sin(t*speed+phase)*.025;
    head.position.z=.34+swing*.3+(walking?Math.sin(t*speed)*.04:0);
    head.rotation.x=-swing*.5;
    stalks.forEach((stalk,i)=>{stalk.rotation.z=Math.sin(t*2.3+phase+i*1.7)*.35+(i?-.15:.15);stalk.rotation.x=Math.sin(t*1.7+phase+i)*.2;});
    trail.material.opacity=.25+Math.sin(t*2+phase)*.08;
  };
  return {root,figure,legs:[],arms:[],head:.75*1.25,animate};
}
/** Planta escupidora (y la Madre Espora, su versión gigante): maceta de raíces, tallo que se mece y fauces con dientes. */
function plant(kind){
  const mother=kind==='sporemother';
  const root=new T.Group(),figure=new T.Group();
  root.add(figure);
  add(figure,'column',solid('#4a3020'),0,.07,0,.7,.14,.7);
  for(const a of [0,1.6,3.1,4.6])add(figure,'cone',solid('#3a2416'),Math.sin(a)*.32,.05,Math.cos(a)*.32,.1,.2,.1).rotation.set(Math.PI/2,a,0);
  const leaves=[0,1,2,3].map(i=>{
    const leaf=new T.Group();leaf.rotation.y=i*Math.PI/2+.4;leaf.position.y=.14;figure.add(leaf);
    add(leaf,'orb',solid(i%2?'#4f9a34':'#7acb4a'),0,.03,.32,.22,.05,.5);
    return leaf;
  });
  const stem=new T.Group();stem.position.y=.14;figure.add(stem);
  const stalk=[0,1,2].map(i=>add(stem,'column',solid('#3f7a2a'),0,.12+i*.2,0,.09,.22,.09));
  const head=new T.Group();head.position.y=.72;stem.add(head);
  const petal=mother?'#7a2a8a':'#b8324a';
  add(head,'orb',solid(petal),0,.08,0,.5,.34,.44);
  const jaw=new T.Group();jaw.position.set(0,0,.05);head.add(jaw);
  add(jaw,'orb',solid(petal),0,-.06,0,.46,.22,.42);
  add(head,'orb',solid('#3a0a14'),0,0,.12,.34,.12,.24);
  for(const x of [-.12,-.04,.04,.12]){add(head,'cone',solid('#f4ece0'),x,.04,.2,.04,.08,.04).rotation.x=Math.PI;add(jaw,'cone',solid('#f4ece0'),x+.04,-.02,.2,.04,.08,.04);}
  const spots=[];
  for(const [x,y,z] of [[-.16,.2,-.05],[.14,.22,.0],[0,.25,-.15],[.2,.08,-.1]])spots.push(add(head,'orb',solid(mother?'#e7f07a':'#f2e07a',true),x,y,z,.07,.07,.07));
  const spores=[];
  if(mother){
    for(let i=0;i<6;i++)spores.push(add(figure,'orb',solid('#c8f07a',true),0,0,0,.07,.07,.07));
    for(const a of [.8,2.4,4,5.6]){const vine=add(figure,'column',solid('#3f7a2a'),Math.sin(a)*.45,.35,Math.cos(a)*.45,.07,.7,.07);vine.rotation.set(Math.cos(a)*.5,0,-Math.sin(a)*.5);}
  }
  const size=mother?1.75:1.15;
  figure.scale.setScalar(size);
  const animate=(t,{swing,walking,phase})=>{
    const sway=Math.sin(t*1.6+phase);
    stem.rotation.z=sway*.12;stem.rotation.x=-swing*.6+Math.sin(t*1.1+phase)*.06;
    head.rotation.x=-swing*.4;
    jaw.rotation.x=.15+Math.max(0,Math.sin(t*2.4+phase))*.25+swing*.6;
    leaves.forEach((leaf,i)=>{leaf.rotation.z=Math.sin(t*1.3+phase+i)*.08;});
    spores.forEach((spore,i)=>{const a=t*.6+i*1.05;spore.position.set(Math.sin(a)*.6,.5+((t*.25+i*.17)%1)*.9,Math.cos(a)*.6);});
    spots.forEach((spot,i)=>spot.scale.setScalar(.07*(1+.2*Math.sin(t*3+i))));
  };
  return {root,figure,legs:[],arms:[],head:(mother?1.15:1.05)*size,animate};
}
export function miniature(kind,tint=null) {
  if(creatures[kind])return creatures[kind](kind);
  if(ps1Kits[kind])return ps1Hero(kind,tint);
  if(heroKits[kind])return chibiHero(kind,tint);
  let [body,accent,dark,skin]=looks[kind]||looks.enemy;
  // Color del jugador: la ropa toma el color de su puesto (J1 rojo, J2 azul...).
  if(tint){body=tint.hex;dark=tint.dark;}
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
  if(kind==='jungle'){jungleObstacle(root,variant);return;}
  if(kind==='hell'&&variant===2){hellObstacle(root);return;}
  const palette={crypt:['#4a5268','#2a3044','#6a7590','#a58ae8'],roots:['#58635d','#333e43','#77a681','#b7ed91'],
    bones:['#7a6e5e','#4a4036','#d6c9a8','#9dffb8'],hell:['#5a2a24','#2a1210','#b4462a','#ffb347']}[kind]||[];
  const [stone,dark,trim]=palette.length?palette:['#59667b','#354159','#8292ac'];
  piece(root,'cube',dark,0,.10,0,.82,.22,.82);
  if(variant===0){
    piece(root,'column',stone,0,.59,0,.67,.93,.67);
    piece(root,'column',trim,0,1.10,0,.80,.13,.80);
    piece(root,'column',dark,0,.24,0,.78,.12,.78);
  }else if(variant===1){
    piece(root,'cube',stone,0,.38,0,.82,.45,.66);
    piece(root,'cube',trim,0,.645,0,.90,.085,.72);
    piece(root,'cube',dark,0,.43,.34,.17,.21,.033);
    piece(root,'gem',palette[3]||'#bea0fb',0,.43,.37,.14,.155,.065,true);
  }else{
    piece(root,'cube',stone,0,.40,0,.69,.63,.72).rotation.y=.22;
    piece(root,'gem',trim,.12,.72,-.10,.45,.39,.45);
    piece(root,'gem',dark,-.26,.45,.26,.35,.35,.31);
  }
  root.traverse(mesh=>{if(mesh.isMesh&&mesh.material.isMeshStandardMaterial)mesh.castShadow=true;});
}


/** Jungla: árbol con copa, matorral de helechos o roca cubierta de musgo. */
function jungleObstacle(root,variant){
  piece(root,'cube','#3a2a1a',0,.06,0,.84,.12,.84);
  if(variant===0){
    piece(root,'column','#5a3a22',0,.55,0,.32,1.05,.32);
    piece(root,'cone','#4a3020',0,.12,0,.6,.25,.6);
    piece(root,'orb','#2f6a2a',0,1.15,0,.95,.6,.95);
    piece(root,'orb','#3f8a34',.15,1.38,-.1,.62,.45,.62);
    piece(root,'orb','#57a83f',-.1,1.5,.1,.36,.3,.36);
    piece(root,'column','#4f7a2a',.2,.5,.17,.03,.8,.03);
  }else if(variant===1){
    for(const [x,z,h] of [[-.2,-.15,.55],[.2,-.1,.7],[0,.2,.6],[-.15,.2,.45],[.22,.2,.5]]){
      const leaf=piece(root,'cone',h>.55?'#3f8a34':'#57a83f',x,h/2+.1,z,.32,h,.32);leaf.rotation.z=x*1.2;leaf.rotation.x=z*1.2;
    }
    piece(root,'orb','#ff5a8a',.1,.62,.05,.12,.12,.12,true);
    piece(root,'orb','#ffd36b',-.18,.5,.18,.1,.1,.1,true);
  }else{
    piece(root,'cube','#5d6658',0,.36,0,.74,.6,.7).rotation.y=.3;
    piece(root,'cube','#3f8a34',0,.7,0,.78,.08,.74).rotation.y=.3;
    piece(root,'gem','#4f9a34',.2,.72,.2,.3,.2,.3);
    piece(root,'column','#3f7a2a',-.3,.35,.3,.04,.6,.04);
  }
  root.traverse(mesh=>{if(mesh.isMesh&&mesh.material.isMeshStandardMaterial)mesh.castShadow=true;});
}
/** Infierno: aguja de obsidiana con grietas de magma. */
function hellObstacle(root){
  piece(root,'cube','#2a1210',0,.08,0,.84,.16,.84);
  piece(root,'cone','#1e1418',0,.62,0,.62,1.1,.62);
  piece(root,'cone','#2a1c22',.22,.4,-.18,.3,.6,.3);
  piece(root,'cube','#ff6a1a',0,.45,.2,.04,.5,.04,true);
  piece(root,'cube','#ffb347',-.12,.3,.18,.03,.28,.03,true);
  root.traverse(mesh=>{if(mesh.isMesh&&mesh.material.isMeshStandardMaterial)mesh.castShadow=true;});
}

// ───────────── Héroes chibi (rework según docs/art/STYLE_GUIDE.md) ─────────────
// Escala: 1 casilla = 1 unidad. Altura ≈1,13 (sin sombrero), cabeza 0,45 → 2,5 cabezas.
// Formas suaves y redondeadas, cara expresiva, manos/pies/armas algo exagerados.
const smooth={
  ball:new T.SphereGeometry(.5,16,11),
  dome:new T.SphereGeometry(.5,16,7,0,Math.PI*2,0,Math.PI/2),
  cyl:new T.CylinderGeometry(.5,.5,1,12),
  taper:new T.CylinderGeometry(.38,.5,1,16),
  cone:new T.ConeGeometry(.5,1,14),
  torus:new T.TorusGeometry(.5,.07,6,20),
  arc:new T.TorusGeometry(.5,.045,5,14,Math.PI),
  box:new T.BoxGeometry(1,1,1),
  gem:new T.OctahedronGeometry(.5,0),
  disc:new T.CylinderGeometry(.5,.5,1,20)
};
const heroMats=new Map();
/** Material PBR simplificado: mate por defecto, satinado para metal, emisivo solo para magia. */
function mat(color,{metal=0,rough=.72,glow=0}={}){
  const key=color+metal+rough+glow;
  if(!heroMats.has(key))heroMats.set(key,new T.MeshStandardMaterial({color,metalness:metal,roughness:rough,emissive:glow?color:'#000000',emissiveIntensity:glow}));
  return heroMats.get(key);
}
function part(parent,shape,material,x,y,z,sx,sy,sz){
  const mesh=new T.Mesh(smooth[shape],typeof material==='string'?mat(material):material);
  mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);
  mesh.castShadow=true;mesh.receiveShadow=true;
  parent.add(mesh);
  return mesh;
}
/** Paletas de clase (anclas de models3d.js): tela, acento, oscuro, piel, metal, pelo. */
const heroKits={
  guardia:{cloth:'#3f7a74',accent:'#e0a84f',dark:'#24403f',skin:'#f0c09c',metal:'#9fb3b0',hair:'#6b3f2a'},
  tirador:{cloth:'#3f7a4f',accent:'#d9a04f',dark:'#2a3f2c',skin:'#e8b48c',metal:'#b8a07a',hair:'#c9873a'},
  mistico:{cloth:'#7a54a0',accent:'#f2cd6a',dark:'#46305e',skin:'#f3c7a6',metal:'#f2d58a',hair:'#d9a441'},
  mago:{cloth:'#3f5fae',accent:'#7fe0ff',dark:'#26385e',skin:'#f1bf9c',metal:'#c0c8d8',hair:'#9a6ad0'},
  sombra:{cloth:'#4d3466',accent:'#ff8a6e',dark:'#241a33',skin:'#d9a07e',metal:'#cfd6de',hair:'#1c1626'}
};
/** Cara: ojos grandes con brillo, cejas, boca y rubor. Se ve desde arriba y en isométrico. */
function face(head,kit,{mask=false,angry=false,z=0}={}){
  const eyes=[];
  for(const side of [-1,1]){
    const eye=new T.Group();eye.position.set(side*.085,-.005,.19+z);head.add(eye);
    part(eye,'ball','#fbf7f0',0,0,0,.085,.105,.05);
    part(eye,'ball','#1d1626',0,-.006,.016,.058,.075,.03);
    part(eye,'ball',mat('#ffffff',{glow:.6}),side*-.012,.018,.03,.02,.024,.012);
    eyes.push(eye);
    const brow=part(head,'box',kit.hair,side*.088,.085,.205+z,.07,.018,.02);
    brow.rotation.z=side*(angry?.32:-.12);
    if(!mask)part(head,'ball',mat('#ff8f8f',{rough:.9}),side*.135,-.07,.17+z,.06,.035,.02);
  }
  if(!mask){
    const mouth=part(head,'arc','#5a2a2a',0,-.085,.205+z,.07,.06,.06);
    mouth.rotation.z=Math.PI;
  }
  return eyes;
}
function chibiHero(kind,tint){
  const kit={...heroKits[kind]};
  if(tint){kit.cloth=tint.hex;kit.dark=tint.dark;}
  const root=new T.Group(),figure=new T.Group();root.add(figure);
  const robe=kind==='mistico'||kind==='mago';
  // Piernas cortas con botas grandes.
  const legs=[-1,1].map(side=>{
    const leg=new T.Group();leg.position.set(side*.085,.34,0);figure.add(leg);
    if(!robe)part(leg,'ball',kit.dark,0,-.12,0,.12,.24,.12);
    const boot=part(leg,'ball',kind==='guardia'?mat(kit.metal,{metal:.55,rough:.38}):'#4a3428',0,-.3,.03,.15,.1,.22);
    if(kind==='guardia')part(leg,'torus',mat(kit.accent,{metal:.5,rough:.4}),0,-.25,.0,.13,.13,.6).rotation.x=Math.PI/2;
    return leg;
  });
  // Torso compacto con cinturón.
  const torso=new T.Group();figure.add(torso);
  if(robe){
    part(torso,'taper',kit.cloth,0,.27,0,.42,.5,.38);
    part(torso,'torus',mat(kit.accent,{metal:.4,rough:.45}),0,.03,0,.42,.38,.5).rotation.x=Math.PI/2;
  }
  part(torso,'ball',kit.cloth,0,.5,0,.34,.36,.28);
  part(torso,'torus','#4a3428',0,.38,0,.34,.28,.5).rotation.x=Math.PI/2;
  part(torso,'box',mat(kit.accent,{metal:.5,rough:.4}),0,.38,.14,.07,.06,.03);
  // Cabeza grande.
  const head=new T.Group();head.position.set(0,.9,0);figure.add(head);
  part(head,'ball',kit.skin,0,0,0,.45,.43,.42);
  for(const side of [-1,1])part(head,'ball',kit.skin,side*.22,-.01,0,.06,.09,.06);
  const eyes=kind==='tirador'||kind==='sombra'?[]:face(head,kit,{angry:kind==='guardia'});
  // Brazos con manos grandes; el objeto se sujeta en "held".
  const arms=[-1,1].map(side=>{
    const arm=new T.Group();arm.position.set(side*.2,.62,0);figure.add(arm);
    part(arm,'ball',kit.cloth,0,-.08,0,.11,.2,.11);
    part(arm,'ball',kit.skin,0,-.2,.02,.12,.12,.12);
    const held=new T.Group();held.position.set(0,-.21,.06);held.name='held';arm.add(held);
    return arm;
  });
  const [left,right]=arms;
  const hand=arm=>arm.getObjectByName('held');
  const gold=mat(kit.accent,{metal:.6,rough:.35});
  const steel=mat(kit.metal,{metal:.65,rough:.32});
  let top=1.13;
  if(kind==='guardia'){
    // Casco con visera y cresta, hombreras, peto con tabardo y gran escudo.
    part(head,'dome',steel,0,.03,0,.5,.44,.47);
    part(head,'torus',gold,0,.04,0,.47,.47,.6).rotation.x=Math.PI/2;
    part(head,'box',mat(kit.cloth),0,.26,-.02,.06,.17,.38);
    for(const side of [-1,1])part(head,'box',steel,side*.2,-.07,.06,.05,.16,.14);
    top=1.2;
    part(torso,'ball',steel,0,.53,.05,.33,.3,.22);
    part(torso,'box',kit.cloth,0,.36,.13,.17,.22,.04);
    for(const arm of arms){part(arm,'dome',steel,0,0,0,.2,.16,.2);part(arm,'torus',gold,0,-.01,0,.2,.2,.5).rotation.x=Math.PI/2;}
    const shield=new T.Group();shield.position.set(-.05,.04,.12);hand(left).add(shield);
    part(shield,'disc',steel,0,0,0,.44,.06,.52).rotation.x=Math.PI/2;
    part(shield,'disc',kit.cloth,0,0,.025,.36,.04,.43).rotation.x=Math.PI/2;
    part(shield,'torus',gold,0,0,.03,.44,.52,.6);
    part(shield,'gem',gold,0,.02,.06,.12,.16,.06);
    const sword=hand(right);
    sword.rotation.x=1.15;
    part(sword,'box',steel,0,.24,0,.07,.42,.025);
    part(sword,'cone',steel,0,.48,0,.07,.07,.025);
    part(sword,'box',gold,0,.04,0,.2,.04,.05);
    part(sword,'ball','#4a3428',0,-.04,0,.05,.08,.05);
    part(sword,'ball',gold,0,-.1,0,.06,.06,.06);
  }else if(kind==='tirador'){
    // Capucha con pico, capa corta, carcaj a la espalda y arco curvo.
    part(head,'ball',kit.cloth,0,.04,-.04,.5,.48,.48);
    part(head,'ball',kit.skin,0,-.02,.07,.4,.36,.34);
    eyes.push(...face(head,kit,{z:.03}));
    const tip=part(head,'cone',kit.cloth,0,.1,-.28,.16,.24,.16);tip.rotation.x=-1.9;
    part(head,'ball',kit.hair,.06,.13,.16,.14,.06,.08);
    top=1.16;
    const cape=part(torso,'box',kit.cloth,0,.48,-.15,.36,.38,.04);cape.rotation.x=.12;
    part(torso,'cyl','#7a4a30',-.1,.62,-.2,.11,.4,.11).rotation.z=-.35;
    for(const dx of [-.04,0,.04]){const a=part(torso,'gem',mat('#f2f0e6'),-.17+dx,.86,-.22,.05,.09,.02);a.rotation.z=-.35;}
    const bow=new T.Group();bow.position.set(0,.05,.05);bow.rotation.y=Math.PI/2;hand(left).add(bow);
    part(bow,'arc',mat('#8a5a34',{rough:.6}),0,0,0,.36,.62,.9).rotation.z=Math.PI/2;
    part(bow,'box',mat('#f2ead6'),.0,0,0,.008,.62,.008);
    part(bow,'box',gold,-.18,0,0,.05,.08,.05);
    part(arms[0],'cyl','#7a4a30',0,-.14,0,.12,.08,.12);
  }else if(kind==='mistico'){
    // Manto claro, diadema solar y báculo con disco de sol.
    part(head,'ball',kit.hair,0,.06,-.05,.48,.42,.46);
    for(const side of [-1,1])part(head,'ball',kit.hair,side*.17,-.12,-.04,.12,.26,.14);
    part(head,'ball',kit.hair,.05,.15,.15,.2,.08,.1);
    part(head,'torus',gold,0,.12,0,.44,.44,.5).rotation.x=Math.PI/2.3;
    part(head,'gem',mat(kit.accent,{glow:.5}),0,.16,.2,.08,.1,.04);
    top=1.18;
    part(torso,'dome',mat('#f2ead6'),0,.6,0,.42,.2,.36);
    part(torso,'box',gold,0,.3,.17,.06,.36,.02);
    const staff=hand(right);
    part(staff,'cyl','#8a6a44',0,.25,0,.04,.85,.04);
    part(staff,'torus',gold,0,.72,0,.22,.22,.6);
    part(staff,'ball',mat(kit.accent,{glow:.7}),0,.72,0,.11,.11,.11);
    for(let i=0;i<8;i++){const ray=part(staff,'cone',gold,Math.sin(i*Math.PI/4)*.15,.72+Math.cos(i*Math.PI/4)*.15,0,.035,.07,.035);ray.rotation.z=-i*Math.PI/4;}
  }else if(kind==='mago'){
    // Gran sombrero de ala ancha con punta doblada y báculo de cristal.
    const hat=new T.Group();hat.position.set(0,.14,0);head.add(hat);
    part(hat,'disc',kit.dark,0,0,0,.72,.035,.68);
    part(hat,'cone',kit.cloth,0,.2,-.02,.42,.42,.4);
    const tip=part(hat,'cone',kit.cloth,.06,.43,-.08,.2,.2,.2);tip.rotation.z=-.6;
    part(hat,'torus',gold,0,.04,0,.42,.42,.6).rotation.x=Math.PI/2;
    part(hat,'gem',mat(kit.accent,{glow:.8}),.0,.12,.2,.07,.08,.03);
    part(head,'ball',kit.hair,0,-.02,-.13,.4,.3,.22);
    top=1.62;
    const staff=hand(right);
    part(staff,'cyl','#5a3a2a',0,.25,0,.045,.85,.045);
    part(staff,'torus',gold,0,.66,0,.12,.12,.4).rotation.x=Math.PI/2;
    const crystal=part(staff,'gem',mat(kit.accent,{glow:.9,rough:.2}),0,.8,0,.18,.28,.18);
    crystal.name='crystal';
  }else if(kind==='sombra'){
    // Capucha ceñida, máscara bajo los ojos, cinta con colas, bufanda coral y dos dagas.
    part(head,'ball',kit.cloth,0,.05,-.03,.48,.45,.46);
    part(head,'ball',kit.skin,0,0,.08,.38,.22,.32);
    eyes.push(...face(head,kit,{mask:true,angry:true,z:.02}));
    part(head,'ball',mat(kit.dark),0,-.135,.11,.4,.15,.32);
    part(head,'torus',mat(kit.accent),0,.06,0,.47,.47,.4).rotation.x=Math.PI/2;
    for(const side of [-1,1]){const tail=part(head,'box',mat(kit.accent),side*.05,.0,-.27,.05,.04,.22);tail.rotation.set(-.6,side*.3,0);}
    top=1.14;
    part(torso,'torus',mat(kit.accent),0,.62,0,.3,.3,1.1).rotation.x=Math.PI/2;
    part(torso,'gem',steel,.14,.36,.12,.08,.08,.02);
    for(const arm of arms){
      const dagger=hand(arm);
      part(dagger,'box',steel,0,-.12,.0,.04,.24,.02).rotation.x=.2;
      part(dagger,'box',mat(kit.accent),0,.0,0,.1,.03,.04);
    }
  }
  const size=1.12;
  figure.scale.setScalar(size);
  const blinkAt=Math.random()*4;
  const crystal=figure.getObjectByName('crystal');
  const animate=(t,{gait,swing,walking,phase})=>{
    const breath=Math.sin(t*2.8+phase);
    const idle=walking?0:1;
    figure.position.y=Math.abs(gait)*.06+breath*.02*idle;
    torso.scale.y=1+breath*.025*idle;
    head.position.y=.9+breath*.012*idle;
    head.rotation.y=idle*Math.sin(t*.45+phase)*Math.max(0,Math.sin(t*.21+phase))*.4;
    head.rotation.z=walking?gait*.06:Math.sin(t*1.3+phase)*.04;
    figure.rotation.z=walking?gait*.05:0;
    left.rotation.x=gait*.5+breath*.08*idle;
    right.rotation.x=-gait*.5-swing*1.6-(.15+breath*.06)*idle;
    left.rotation.z=-.08-idle*.04;right.rotation.z=.08+idle*.04;
    legs[0].rotation.x=-gait*.6;legs[1].rotation.x=gait*.6;
    // Parpadeo cada pocos segundos.
    const blink=((t+blinkAt)%3.6)<.12?.15:1;
    for(const eye of eyes)eye.scale.y=blink;
    if(crystal){crystal.rotation.y=t*1.5;crystal.material.emissiveIntensity=.7+Math.sin(t*3)*.25+swing;}
  };
  return {root,figure,legs,arms,head:top*size,animate};
}

// ───────────── Héroes estilo PS1 (decisión de Lucho, 17-11-2026: ~4–5 cabezas) ─────────────
// Low-poly facetado con color por vértice (una sola textura pequeña para la cara).
// Escala: 1 casilla = 1 unidad; altura ≈1,35; cabeza ≈0,3 → 4,5 cabezas.
// Cada grupo móvil (torso+cabeza, brazos, piernas, arma, escudo) es UNA malla fusionada → 7–8 draw calls.
const ps1Material=new T.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.78,metalness:.08});
/** Pieza low-poly: geometría + color + transformación, lista para fusionar. */
function lp(list,geometry,color,[x,y,z],[rx,ry,rz]=[0,0,0],[sx,sy,sz]=[1,1,1]){
  const g=geometry.index?geometry.toNonIndexed():geometry.clone();
  g.deleteAttribute('uv');
  const m=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(sx,sy,sz));
  g.applyMatrix4(m);
  const c=new T.Color(color);
  const n=g.attributes.position.count;
  const colors=new Float32Array(n*3);
  for(let i=0;i<n;i++){colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;}
  g.setAttribute('color',new T.BufferAttribute(colors,3));
  list.push(g);
  return g;
}
/** Fusiona piezas en una sola malla (una draw call). */
function fuse(list,name){
  let count=0;for(const g of list)count+=g.attributes.position.count;
  const pos=new Float32Array(count*3),col=new Float32Array(count*3);
  let o=0;
  for(const g of list){pos.set(g.attributes.position.array,o*3);col.set(g.attributes.color.array,o*3);o+=g.attributes.position.count;}
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.BufferAttribute(pos,3));
  geometry.setAttribute('color',new T.BufferAttribute(col,3));
  geometry.computeVertexNormals();
  const mesh=new T.Mesh(geometry,ps1Material);
  mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;
  return mesh;
}
const P={
  box:new T.BoxGeometry(1,1,1),
  prism6:new T.CylinderGeometry(.5,.5,1,6),
  taper6:new T.CylinderGeometry(.42,.5,1,6),
  taper8:new T.CylinderGeometry(.36,.5,1,8),
  head:new T.CylinderGeometry(.44,.5,1,8),
  dome:new T.SphereGeometry(.5,8,4,0,Math.PI*2,0,Math.PI/2),
  ball:new T.SphereGeometry(.5,7,5),
  cone6:new T.ConeGeometry(.5,1,6),
  oct:new T.OctahedronGeometry(.5,0)
};
/** Cara pixelada de 16×16 (estilo textura de PS1). */
const faceTextures=new Map();
function faceTexture(skin,hair,{scar=false}={}){
  const key=skin+hair+scar;
  if(faceTextures.has(key))return faceTextures.get(key);
  const c=document.createElement('canvas');c.width=c.height=16;
  const g=c.getContext('2d');
  const px=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
  px(0,0,16,16,skin);
  const shade=new T.Color(skin).multiplyScalar(.82).getStyle();
  px(0,12,16,4,shade);px(0,0,2,16,shade);px(14,0,2,16,shade);
  px(3,5,4,1,hair);px(9,5,4,1,hair);            // cejas
  px(4,7,2,2,'#f4f0e6');px(10,7,2,2,'#f4f0e6'); // ojos
  px(5,7,1,2,'#1a1620');px(10,7,1,2,'#1a1620');
  px(7,8,2,3,shade);                             // nariz
  px(6,12,4,1,'#6a2e2a');                        // boca
  if(scar)px(11,9,1,3,'#b05a4a');
  const t=new T.CanvasTexture(c);t.magFilter=t.minFilter=T.NearestFilter;t.colorSpace=T.SRGBColorSpace;
  faceTextures.set(key,t);
  return t;
}
const ps1Kits={
  guardia:{cloth:'#3f7a74',clothDark:'#2a5450',steel:'#a9b8b6',steelDark:'#5f6f70',brass:'#c9963f',leather:'#5a3a26',skin:'#d9a07c',hair:'#4a2e1e'}
};
function ps1Hero(kind,tint){
  const k={...ps1Kits[kind]};
  if(tint){k.cloth=tint.hex;k.clothDark=tint.dark;}
  const root=new T.Group(),figure=new T.Group();root.add(figure);
  // ── Torso, cadera y cabeza (una malla) ──
  const body=[];
  lp(body,P.taper8,k.leather,[0,.62,0],[0,Math.PI/8,0],[.3,.1,.22]);              // cadera
  lp(body,P.box,k.brass,[0,.665,.105],[0,0,0],[.08,.06,.03]);                     // hebilla
  lp(body,P.taper8,k.steel,[0,.86,0],[Math.PI,Math.PI/8,0],[.4,.34,.27]);          // peto (ancho arriba)
  lp(body,P.box,k.steelDark,[0,.86,.125],[0,0,0],[.04,.3,.03]);                    // cresta del peto
  lp(body,P.box,k.cloth,[0,.6,.12],[.08,0,0],[.2,.3,.03]);                         // tabardo delantero
  lp(body,P.box,k.cloth,[0,.6,-.12],[-.08,0,0],[.22,.3,.03]);                      // tabardo trasero
  lp(body,P.box,k.brass,[0,.74,.135],[0,0,0],[.2,.025,.02]);
  lp(body,P.prism6,k.steelDark,[0,1.05,0],[0,0,0],[.12,.08,.12]);                  // cuello (cota)
  lp(body,P.taper6,k.steelDark,[0,1.04,0],[0,Math.PI/6,0],[.28,.06,.24]);          // gorjal
  lp(body,P.head,k.steel,[0,1.2,0],[0,Math.PI/8,0],[.27,.28,.27]);                 // yelmo cerrado
  lp(body,P.box,'#141218',[0,1.215,.128],[0,0,0],[.19,.03,.02]);                   // ranura de visión
  lp(body,P.box,k.steelDark,[0,1.13,.125],[0,0,0],[.14,.07,.02]);                  // respiradero
  for(const x of [-.04,0,.04])lp(body,P.box,'#141218',[x,1.13,.137],[0,0,0],[.012,.04,.01]);
  lp(body,P.dome,k.steel,[0,1.27,0],[0,Math.PI/8,0],[.31,.24,.31]);                // casco
  lp(body,P.prism6,k.brass,[0,1.275,0],[0,Math.PI/6,0],[.31,.03,.31]);             // aro del casco
  lp(body,P.box,k.steel,[0,1.19,.135],[0,0,0],[.03,.1,.02]);                       // refuerzo central
  lp(body,P.box,k.steel,[0,1.15,-.1],[.15,0,0],[.27,.2,.07]);                      // cubrenuca


  lp(body,P.box,k.cloth,[0,1.42,-.02],[0,0,0],[.04,.12,.28]);                      // cimera
  lp(body,P.box,k.clothDark,[0,1.44,-.17],[.5,0,0],[.04,.08,.1]);
  const torso=fuse(body,'body');figure.add(torso);
  // ── Piernas ──
  const legs=[-1,1].map(s=>{
    const leg=new T.Group();leg.position.set(s*.09,.6,0);figure.add(leg);
    const p=[];
    lp(p,P.taper6,k.clothDark,[0,-.13,0],[Math.PI,0,0],[.13,.26,.13]);             // muslo
    lp(p,P.oct,k.steel,[0,-.27,.04],[0,0,0],[.11,.1,.09]);                          // rodillera
    lp(p,P.taper6,k.steel,[0,-.42,0],[Math.PI,0,0],[.12,.24,.12]);                  // greba
    lp(p,P.box,k.leather,[0,-.565,.035],[0,0,0],[.13,.07,.21]);                      // bota
    lp(p,P.box,k.steelDark,[0,-.55,.13],[.5,0,0],[.12,.04,.05]);                     // puntera
    leg.add(fuse(p,'leg'));
    return leg;
  });
  // ── Brazos (hombrera, brazo, guantelete, mano) ──
  const arms=[-1,1].map(s=>{
    const arm=new T.Group();arm.position.set(s*.22,.99,0);figure.add(arm);
    const p=[];
    lp(p,P.dome,k.steel,[s*.02,.0,0],[0,0,s*-.35],[.2,.15,.2]);                     // hombrera
    lp(p,P.box,k.brass,[s*.06,-.02,0],[0,0,s*-.35],[.13,.025,.2]);
    lp(p,P.taper6,k.clothDark,[0,-.13,0],[Math.PI,0,0],[.1,.22,.1]);               // brazo
    lp(p,P.taper6,k.steel,[0,-.32,0],[Math.PI,0,0],[.11,.2,.11]);                   // antebrazo
    lp(p,P.box,k.leather,[0,-.45,.01],[0,0,0],[.09,.08,.09]);                       // mano
    arm.add(fuse(p,'arm'));
    const held=new T.Group();held.name='held';held.position.set(0,-.45,.04);arm.add(held);
    return arm;
  });
  // ── Escudo heráldico (mano izquierda) ──
  const shieldShape=new T.Shape();
  shieldShape.moveTo(-.2,.2);shieldShape.lineTo(.2,.2);shieldShape.lineTo(.2,-.02);shieldShape.lineTo(0,-.26);shieldShape.lineTo(-.2,-.02);shieldShape.closePath();
  const shieldGeo=new T.ExtrudeGeometry(shieldShape,{depth:.04,bevelEnabled:false});
  const sp=[];
  lp(sp,shieldGeo,k.steelDark,[0,0,0],[0,0,0],[1.08,1.08,1]);
  lp(sp,shieldGeo,k.cloth,[0,.005,.035],[0,0,0],[.9,.9,.4]);
  lp(sp,P.box,k.brass,[0,.03,.06],[0,0,0],[.05,.3,.02]);
  lp(sp,P.box,k.brass,[0,.08,.06],[0,0,0],[.24,.05,.02]);
  lp(sp,P.oct,k.brass,[0,.08,.075],[0,0,0],[.07,.07,.04]);
  const shield=fuse(sp,'shield');
  shield.position.set(-.06,.02,.08);shield.rotation.y=-.35;
  arms[0].getObjectByName('held').add(shield);
  // ── Espada (mano derecha) ──
  const wp=[];
  lp(wp,P.prism6,'#6a4a30',[0,.17,0],[0,0,0],[.04,.4,.04]);                       // mango
  lp(wp,P.prism6,k.leather,[0,.0,0],[0,0,0],[.05,.12,.05]);                       // empuñadura
  lp(wp,P.oct,k.brass,[0,-.08,0],[0,0,0],[.06,.06,.06]);                          // pomo
  lp(wp,P.prism6,k.steelDark,[0,.43,0],[0,0,0],[.09,.16,.09]);                    // cabeza de la maza
  for(let i=0;i<6;i++){const a=i*Math.PI/3;lp(wp,P.box,k.steel,[Math.sin(a)*.065,.43,Math.cos(a)*.065],[0,a,0],[.025,.17,.07]);} // pestañas
  lp(wp,P.cone6,k.steel,[0,.55,0],[0,0,0],[.06,.07,.06]);                          // punta
  lp(wp,P.prism6,k.brass,[0,.33,0],[0,0,0],[.07,.025,.07]);                       // collar
  const sword=fuse(wp,'mace');
  const swordHolder=arms[1].getObjectByName('held');
  swordHolder.add(sword);swordHolder.rotation.x=1.25;
  const animate=(t,{gait,swing,walking,phase})=>{
    const breath=Math.sin(t*2.4+phase);
    const idle=walking?0:1;
    figure.position.y=Math.abs(gait)*.05+breath*.008*idle;
    torso.rotation.y=idle*Math.sin(t*.4+phase)*.08;
    figure.rotation.z=walking?gait*.035:0;
    arms[0].rotation.x=gait*.4-.1*idle;
    arms[1].rotation.x=-gait*.4-swing*1.5-(.18+breath*.04)*idle;
    arms[0].rotation.z=-.1;arms[1].rotation.z=.1;
    legs[0].rotation.x=-gait*.55;legs[1].rotation.x=gait*.55;
  };
  figure.scale.set(.92,.86,.92);
  return {root,figure,legs,arms,head:1.46*.86,animate,pose:{T:()=>{arms[0].rotation.set(0,0,-Math.PI/2);arms[1].rotation.set(0,0,Math.PI/2);legs.forEach(l=>l.rotation.set(0,0,0));}}};
}
