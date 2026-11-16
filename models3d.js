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
const creatures={slime:slime,slimeking:slime,bat:bat,skull:skull,worm:worm,oracle:oracle,umbralking:umbralKing,
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
    const breath=Math.sin(t*3.1);
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
export function miniature(kind,tint=null) {
  if(creatures[kind])return creatures[kind](kind);
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
  const palette={crypt:['#59667b','#354159','#8292ac','#bea0fb'],roots:['#58635d','#333e43','#77a681','#b7ed91'],
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

