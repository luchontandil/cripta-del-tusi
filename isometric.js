import * as T from './three.module.js';
import {miniature,ps1Obstacle,piece,solid} from './models3d.js?v=112';
import {playerColors} from './engine.js?v=112';

const clamp=T.MathUtils.clamp;
const ease=t=>t*t*(3-2*t);
const tilesets={
  crypt:['#2f3446','#383c50','#2c3142','#41435a','#343a4c'],
  jungle:['#2c4322','#344d27','#283d1f','#3c572c','#304824'],
  roots:['#3c524e','#465c50','#384a4a','#4e5f55','#415450'],
  bones:['#4e4840','#5a5246','#474036','#625a4c','#514a3e'],
  hell:['#2a2624','#322c29','#262220','#3a3330','#2e2826']
};
const biomeLight={crypt:'#ffa45a',jungle:'#e8ff8a',roots:'#c1f195',bones:'#9dffb8',hell:'#ff8a3a'};
const biomeFog={crypt:'#07060d',jungle:'#0c1a0e',roots:'#0d1412',bones:'#12110e',hell:'#0e0b0a'};
const overlayColors={walk:'#6aa3bb',cast:'#9484b8',aim:'#e9c48a',route:'#bfe6f2',area:'#e09a72',blocked:'#b06070',damage:'#ea6a50',poison:'#9abe56',slow:'#719add',foe:'#c97a6e'};
const ink='#121423';
const flatTile=new T.PlaneGeometry(1,1).rotateX(-Math.PI/2);
const waterGeometry=new T.PlaneGeometry(1,1,6,6).rotateX(-Math.PI/2);
let waterMaterial=null;
/** Agua animada: olas suaves, reflejos y espuma en los bordes de la casilla. */
/** Colores del líquido: agua en la mazmorra, ciénaga en la jungla, lava en el infierno. */
const liquids={
  crypt:{deep:[.02,.13,.24],mid:[.06,.36,.52],sky:[.55,.75,.95],foam:[.85,.95,1],glow:0},
  jungle:{deep:[.02,.08,.03],mid:[.1,.24,.08],sky:[.3,.42,.22],foam:[.5,.62,.32],glow:0},
  hell:{deep:[.45,.05,0],mid:[1,.42,.05],sky:[1,.85,.35],foam:[1,.95,.6],glow:1}
};
const waterMaterials={};
function makeWater(clockUniform,mode='crypt'){
  const key=liquids[mode]?mode:'crypt';
  if(waterMaterials[key])return waterMaterials[key];
  const l=liquids[key];
  const v3=a=>new T.Vector3(...a);
  const waterMaterial=waterMaterials[key]=new T.ShaderMaterial({
    uniforms:{time:clockUniform,deepC:{value:v3(l.deep)},midC:{value:v3(l.mid)},skyC:{value:v3(l.sky)},foamC:{value:v3(l.foam)},glow:{value:l.glow}},
    vertexShader:`uniform float time; varying vec2 vUv; varying vec3 vWorld;
      void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);
        w.y+=(sin(w.x*2.6+time*1.6)+sin(w.z*3.1-time*1.2)+sin((w.x+w.z)*4.3+time*2.1)*.5)*.012;
        vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform float time; uniform vec3 deepC,midC,skyC,foamC; uniform float glow; varying vec2 vUv; varying vec3 vWorld;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      float waves(vec2 p){
        return noise(p*3.+vec2(time*.35,time*.22))*.55+noise(p*6.5-vec2(time*.5,-time*.3))*.3+noise(p*13.+time*.8)*.15;
      }
      void main(){
        vec2 p=vWorld.xz;
        float e=.04;
        float h=waves(p);
        vec3 n=normalize(vec3(waves(p-vec2(e,0))-waves(p+vec2(e,0)),.12,waves(p-vec2(0,e))-waves(p+vec2(0,e))));
        vec3 view=normalize(vec3(.62,.64,.66));
        vec3 light=normalize(vec3(-.4,.85,.3));
        float fresnel=pow(1.-max(dot(n,view),0.),3.);
        float spec=pow(max(dot(reflect(-light,n),view),0.),60.);
        vec3 deep=deepC,mid=midC,sky=skyC;
        vec3 c=mix(deep,mid,smoothstep(.25,.85,h));
        c=mix(c,sky,fresnel*.55);
        // Cáusticas: líneas brillantes que se mueven.
        float caustic=pow(1.-abs(sin((noise(p*4.+time*.4)+noise(p*5.-time*.3))*6.2832)),8.);
        c+=caustic*vec3(.25,.45,.5)*.5;
        c+=spec*vec3(1.,.95,.85)*1.4;
        // Destellos.
        float sparkle=step(.985,hash(floor(p*24.)+floor(time*3.)))*smoothstep(.6,.9,h);
        c+=sparkle*.8;
        // Espuma en los bordes de la casilla.
        vec2 q=min(vUv,1.-vUv);float d=min(q.x,q.y);
        float foam=smoothstep(.12,.0,d)*smoothstep(.35,.65,noise(p*14.+time*.6));
        c=mix(c,foamC,foam*.65);
        // Lava: costra oscura que se rompe y brilla.
        if(glow>.5){float crust=smoothstep(.55,.75,noise(p*3.-time*.15));c=mix(c,vec3(.12,.03,.02),crust*.8);c*=1.+.3*sin(time*2.+p.x*3.);}
        gl_FragColor=vec4(c,glow>.5?1.:.9);
      }`,
    transparent:true
  });
  return waterMaterial;
}
const clock={value:0};
const overlayCache=new Map();
/** Material de resaltado: relleno translúcido, borde luminoso y pulso suave. */
function overlayMaterial(color,strength=1){
  const key=color+strength;
  if(overlayCache.has(key))return overlayCache.get(key);
  const material=new T.ShaderMaterial({
    uniforms:{tint:{value:new T.Color(color)},time:clock,strength:{value:strength}},
    vertexShader:`varying vec2 vUv; varying vec3 vWorld;
      void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform vec3 tint; uniform float time; uniform float strength; varying vec2 vUv; varying vec3 vWorld;
      void main(){
        vec2 q=min(vUv,1.-vUv);
        float d=min(q.x,q.y);
        float edge=smoothstep(.045,.0,d);
        float pulse=.94+.06*sin(time*2.4+(vWorld.x+vWorld.z)*.55);
        float alpha=(.20+edge*.32)*pulse*strength;
        gl_FragColor=vec4(tint*(1.+edge*.25),alpha);
      }`,
    transparent:true,depthWrite:false,toneMapped:false
  });
  overlayCache.set(key,material);
  return material;
}
const logical=(state,pos)=>new T.Vector3(pos%state.width-(state.width-1)/2,0,Math.floor(pos/state.width)-(state.height-1)/2);
const random=(seed,i)=>((Math.imul(i+7,2654435761)^seed)>>>0)/4294967296;
const look=u=>u.look||u.classId;

export function createIso(mount,onCell){
  let renderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}
  catch{return null;}
  renderer.setPixelRatio(1);
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.48;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden','true');
  const labels=document.createElement('div');
  labels.className='iso-labels';
  mount.append(renderer.domElement,labels);

  const scene=new T.Scene();
  scene.fog=new T.Fog('#100d1a',24,52);
  const stage=new T.Group();
  const figures=new T.Group();
  const transient=new T.Group();
  scene.add(stage,figures,transient);
  const sky=new T.HemisphereLight('#d9dcff','#2a1a33',2.3);
  scene.add(sky);
  const key=new T.DirectionalLight('#ffd6a8',2.7);
  key.position.set(-5,10,6);
  key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);
  key.shadow.radius=2;
  key.shadow.camera.left=key.shadow.camera.bottom=-12;
  key.shadow.camera.right=key.shadow.camera.top=12;
  key.shadow.camera.far=42;
  key.shadow.normalBias=.025;
  scene.add(key);
  const fill=new T.DirectionalLight('#9fa6ff',1.35);
  fill.position.set(5,6,-7);
  scene.add(fill);
  const camera=new T.OrthographicCamera(-1,1,1,-1,.1,100);
  // Render a resolución completa con antialiasing (MSAA ×4): bordes suaves, sin el granulado de antes.
  const pixels=new T.WebGLRenderTarget(1,1,{minFilter:T.LinearFilter,magFilter:T.LinearFilter,samples:4});
  const screen=new T.Scene();
  const screenCamera=new T.OrthographicCamera(-1,1,1,-1,0,2);
  screenCamera.position.z=1;
  const pixelMaterial=new T.ShaderMaterial({
    uniforms:{image:{value:pixels.texture},resolution:{value:new T.Vector2(1,1)},time:clock},
    vertexShader:`varying vec2 tex; void main(){tex=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader:`uniform sampler2D image; uniform vec2 resolution; uniform float time; varying vec2 tex;
      void main(){
        vec2 p=tex*resolution;
        vec4 base=texture2D(image,tex);
        // Brillo suave: muestras vecinas de las zonas más luminosas.
        vec3 glow=vec3(0.);
        for(int i=0;i<8;i++){
          float a=float(i)*.785398;
          vec2 o=vec2(cos(a),sin(a))*3.5/resolution;
          vec3 c=texture2D(image,tex+o).rgb;
          glow+=max(c-.62,0.);
        }
        gl_FragColor=vec4(base.rgb+glow*.08,base.a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        // Gradación: sombras frías, luces cálidas, algo más de contraste.
        vec3 c=gl_FragColor.rgb;
        float l=dot(c,vec3(.299,.587,.114));
        c=mix(c,c*vec3(.92,.95,1.12),1.-smoothstep(.0,.45,l));
        c=mix(c,c*vec3(1.07,1.0,.9),smoothstep(.5,1.,l));
        c=mix(vec3(l),c,1.06);
        c=(c-.5)*1.05+.5;
        // Viñeta suave (sin tramado ni reducción de colores: cansaban la vista).
        vec2 v=tex-.5;
        c*=1.-dot(v,v)*.3;
        gl_FragColor.rgb=clamp(c,0.,1.);
      }`,
    transparent:true,depthTest:false
  });
  screen.add(new T.Mesh(new T.PlaneGeometry(2,2),pixelMaterial));
  const plane=new T.Plane(new T.Vector3(0,1,0),0);
  const ray=new T.Raycaster();
  const mouse=new T.Vector2();
  const world=new T.Vector3();
  const overlays=[];
  const torches=[];
  const torchLights=[];
  const gasPuffs=[];
  const hoverMarker=new T.Mesh(flatTile,overlayMaterial('#ffffff',.55));
  hoverMarker.visible=false;
  hoverMarker.renderOrder=3;
  let dust=null;
  const models=new Map();
  const effects=[];
  const steps=new Map();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stageKey='',state,active=false,hover=null,frame=0,viewWidth=0,viewHeight=0;
  let routeSignature='';
  let previousFrame=0;
  let magnification=1.13;
  // Desplazamiento de la cámara (para hacer zoom hacia donde apunta el ratón).
  const pan={x:0,z:0};
  const routeGroup=new T.Group();
  stage.add(routeGroup);

  function fit(){
    if(!state||!active)return;
    const lastRect=mount.getBoundingClientRect();
    if(!lastRect.width||!lastRect.height)return;
    if(lastRect.width!==viewWidth||lastRect.height!==viewHeight){
      viewWidth=lastRect.width;
      viewHeight=lastRect.height;
      const density=Math.min(2,window.devicePixelRatio||1);
      renderer.setPixelRatio(density);
      renderer.setSize(viewWidth,viewHeight,false);
      pixels.setSize(Math.max(1,Math.round(viewWidth*density)),Math.max(1,Math.round(viewHeight*density)));
      pixelMaterial.uniforms.resolution.value.set(pixels.width,pixels.height);
    }
    // Con poco zoom la cámara vuelve al centro; con más zoom puede desplazarse hasta los bordes del tablero.
    const room=Math.max(0,(magnification-.95)/(1.45-.95));
    pan.x=clamp(pan.x,-state.width/2*room,state.width/2*room);
    pan.z=clamp(pan.z,-state.height/2*room,state.height/2*room);
    camera.position.set(17+pan.x,17.5,18+pan.z);
    camera.lookAt(pan.x,.25,pan.z);
    camera.updateMatrixWorld();
    const halfW=state.width/2+.55,halfH=state.height/2+.55;
    let sizeX=0,sizeY=0;
    for(const x of [-halfW,halfW])for(const z of [-halfH,halfH])for(const y of [-.75,1.1]){
      world.set(x,y,z).applyMatrix4(camera.matrixWorldInverse);
      sizeX=Math.max(sizeX,Math.abs(world.x));
      sizeY=Math.max(sizeY,Math.abs(world.y));
    }
    const aspect=viewWidth/viewHeight;
    const extent=Math.max(sizeY,sizeX/aspect)*1.07/magnification;
    camera.left=-extent*aspect;
    camera.right=extent*aspect;
    camera.top=extent;
    camera.bottom=-extent;
    camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(fit);
  observer.observe(mount);

  /** Cada modelo recibe copias de sus materiales: así puede destellar o desvanecerse solo. */
  function ownMaterials(model){
    const copies=new Map();
    model.materials=[];
    model.root.traverse(mesh=>{
      if(!mesh.isMesh)return;
      if(!copies.has(mesh.material)){const copy=mesh.material.clone();copies.set(mesh.material,copy);model.materials.push(copy);}
      mesh.material=copies.get(mesh.material);
    });
    model.baseEmissive=model.materials.map(m=>m.emissive?{color:m.emissive.clone(),intensity:m.emissiveIntensity}:null);
    // Grupo intermedio para las poses de acción (se reinicia en cada fotograma).
    const layer=new T.Group();
    model.root.remove(model.figure);layer.add(model.figure);model.root.add(layer);
    model.layer=layer;
  }
  function removeModel(id){
    const model=models.get(id);
    if(!model)return;
    model.label.remove();
    model.ring.geometry.dispose();
    model.shadow.parent?.remove(model.shadow);
    figures.remove(model.root);
    models.delete(id);
  }
  /** Poses de acción, golpe recibido y muerte, aplicadas encima de la animación de cada modelo. */
  function actionLayer(model,now,type,at,walk){
    const [left,right]=model.arms||[];
    const L=model.layer;
    L.position.set(0,0,0);L.rotation.set(0,0,0);L.scale.set(1,1,1);
    const ease=x=>x<0?0:x>1?1:x*x*(3-2*x);
    if(type&&left&&right){
      const up=Math.sin(Math.min(1,at)*Math.PI);
      if(type==='shoot'){                      // tensar y soltar
        const draw=ease(at/.6),release=at>.62?ease((at-.62)/.38):0;
        left.rotation.x=-1.45*(1-release*.6);left.rotation.z=-.1;
        right.rotation.x=-1.3*draw*(1-release)+.3*release;right.rotation.z=.5*draw*(1-release);
      }else if(type==='cast'){                 // alzar el báculo y descargar
        const raise=ease(at/.45),thrust=at>.45?ease((at-.45)/.3):0;
        right.rotation.x=-2.6*raise+1.1*thrust*(1-ease((at-.75)/.25));
        left.rotation.x=-1.1*up;left.rotation.z=-.4*up;
        L.position.y+=.06*up;
      }else if(type==='support'){              // báculo al cielo y brazos abiertos
        right.rotation.x=-2.9*up;left.rotation.x=-.5*up;left.rotation.z=-.9*up;
        L.position.y+=.09*up;
      }else if(type==='push'||type==='pull'){   // empujón o tirón con ambos brazos
        const push=type==='push'?Math.sin(at*Math.PI):(at<.4?ease(at/.4):1-ease((at-.4)/.6)*1.3);
        left.rotation.x=-1.5*push;right.rotation.x=-1.5*push;
        L.position.z+=type==='push'?.12*push:-.1*Math.max(0,at-.4);
      }else if(type==='melee'){                // giro del torso acompañando el golpe
        L.rotation.y+=at<.35?.35*ease(at/.35):.35-.8*ease((at-.35)/.4);
        L.position.z+=at>.35?.1*Math.sin((at-.35)/.65*Math.PI):0;
      }else if(type==='dash'){
        L.rotation.y+=Math.PI*2*ease(at);
      }
    }else if(type&&!left){                      // criaturas sin brazos: saltito y estirón
      const up=Math.sin(Math.min(1,at)*Math.PI);
      if(type==='cast'||type==='support'){L.position.y+=.12*up;L.scale.y=1+.12*up;}
    }
    // Golpe recibido: retroceso desde el atacante, inclinación y destello.
    const hurt=model.hurt,ht=hurt?(now-hurt.start)/320:2;
    let flash=0;
    if(ht<1){
      const k=Math.sin(ht*Math.PI),len=Math.hypot(hurt.dx,hurt.dz)||1,a=-model.root.rotation.y;
      const wx=hurt.dx/len,wz=hurt.dz/len;
      L.position.x+=(wx*Math.cos(a)-wz*Math.sin(a))*.14*k;
      L.position.z+=(wx*Math.sin(a)+wz*Math.cos(a))*.14*k;
      L.rotation.x-=.25*k;
      flash=(1-ht)*(1-ht)*(hurt.crit?1.4:1);
    }else if(hurt)model.hurt=null;
    // Muerte: cae hacia atrás, se hunde y se desvanece; después se retira.
    let fade=1;
    if(model.deathAt&&!model.dying&&now>=model.deathAt){model.dying=now;model.label.style.opacity='0';model.ring.visible=false;}
    if(model.dying){
      const dt=(now-model.dying)/950;
      if(dt>=1){removeModel(model.unit.id);return;}
      const fall=ease(dt/.55);
      if(left){L.rotation.x=-Math.PI/2*fall*.95;L.position.y=.1*fall-.25*ease((dt-.6)/.4);}
      else{L.scale.y=Math.max(.15,1-.85*fall);L.position.y-=.2*ease((dt-.5)/.5);}
      fade=1-ease((dt-.45)/.55);
      flash=Math.max(flash,(1-dt)*.25);
    }
    if(model.materials){
      model.materials.forEach((m,i)=>{
        const base=model.baseEmissive[i];
        if(m.emissive&&base){
          if(flash>0){
            const dark=base.color.r+base.color.g+base.color.b<.02;
            m.emissive.setRGB(.9,.12,.08);
            m.emissiveIntensity=(dark?0:base.intensity)+flash*.35;
          }
          else if(model.flashed){m.emissive.copy(base.color);m.emissiveIntensity=base.intensity;}
        }
        const transparent=fade<1||m.userData.wasTransparent;
        if(fade<1&&!m.userData.fading){m.userData.fading=true;m.userData.wasTransparent=m.transparent;m.userData.opacity=m.opacity;m.transparent=true;m.needsUpdate=true;}
        if(m.userData.fading)m.opacity=(m.userData.opacity??1)*fade;
        void transparent;
      });
      model.flashed=flash>0;
    }
  }
  function clearTransient(){
    transient.clear();
    effects.length=0;
    for(const step of steps.values())step.resolve();
    steps.clear();
  }
  function rebuild(){
    if(dust){dust.geometry.dispose();dust.material.dispose();dust=null;}
    for(const id of models.keys())removeModel(id);
    clearTransient();
    stage.clear();
    routeGroup.clear();
    stage.add(routeGroup);
    routeSignature='';
    overlays.length=0;
    torches.length=0;
    torchLights.length=0;
    gasPuffs.length=0;
    pan.x=pan.z=0;
    const mode=state.biome||'crypt';
    scene.fog.color.set(biomeFog[mode]||'#100d1a');
    // Luz de cada acto: mazmorra fría y oscura, jungla verde y húmeda, infierno rojo.
    const mood={crypt:['#9aa2d8','#140c1c',1.6,'#ffc890',2.1,'#7a82e0',1.0],jungle:['#c8e8b0','#142010',1.9,'#ffe8a0',2.4,'#6ab890',1.0],
      hell:['#c8b8b0','#1a1210',1.5,'#ffc890',1.9,'#8a7ab8',.8]}[mode]||['#d9dcff','#2a1a33',2.3,'#ffd6a8',2.7,'#9fa6ff',1.35];
    sky.color.set(mood[0]);sky.groundColor.set(mood[1]);sky.intensity=mood[2];
    key.color.set(mood[3]);key.intensity=mood[4];fill.color.set(mood[5]);fill.intensity=mood[6];
    const palette=tilesets[mode]||tilesets.crypt;
    const walls=new Set(state.walls);
    const holes=new Set(state.voids||[]);
    const w=state.width,h=state.height;
    const ground=(x,z)=>x>=0&&x<w&&z>=0&&z<h&&!holes.has(z*w+x);
    const exposed=[];
    for(let pos=0;pos<state.width*state.height;pos++){
      if(holes.has(pos)){overlays.push(null);continue;}
      const coord=logical(state,pos);
      const v=random(state.mapSeed,pos);
      const color=palette[Math.floor(v*palette.length)];
      if(!state.water?.includes(pos))piece(stage,'cube',color,coord.x,-.057,coord.z,.963,.114,.963);
      const x=pos%w,z=Math.floor(pos/w);
      if(!ground(x-1,z)||!ground(x+1,z)||!ground(x,z-1)||!ground(x,z+1)){
        piece(stage,'cube',ink,coord.x,-.24,coord.z,1,.36,1);
        if(!ground(x,z-1)){
          piece(stage,'cube',palette[(pos+2)%palette.length],coord.x,.21,coord.z-.51,.97,.40,.23);
          exposed.push([coord.x,coord.z-.55]);
        }
        if(!ground(x-1,z)&&pos%4!==2){
          piece(stage,'cube',palette[pos%palette.length],coord.x-.52,.17,coord.z,.22,.34,.96);
          exposed.push([coord.x-.55,coord.z]);
        }
      }
      if(state.water?.includes(pos)){
        // Hundimos la losa y ponemos la superficie del agua encima.
        piece(stage,'cube','#08131d',coord.x,-.2,coord.z,1,.1,1);
        piece(stage,'cube','#1f3a44',coord.x,-.12,coord.z,.98,.04,.98);
        const surface=new T.Mesh(waterGeometry,makeWater(clock,mode));
        surface.position.set(coord.x,-.02,coord.z);
        surface.renderOrder=1;
        stage.add(surface);
      }
      const trap=state.traps?.find(t=>t.pos===pos);
      if(trap?.kind==='spikes'){
        piece(stage,'cube','#2a2433',coord.x,.004,coord.z,.7,.02,.7);
        for(const [dx,dz] of [[-.17,-.17],[.17,-.17],[-.17,.17],[.17,.17],[0,0]])
          piece(stage,'cone','#c9c3d6',coord.x+dx,.11,coord.z+dz,.1,.2,.1).castShadow=true;
      }else if(trap?.kind==='gas'){
        // Respiradero de piedra: aro, rejilla y un brillo verde por debajo; de él salen volutas pequeñas.
        piece(stage,'disc','#2b2632',coord.x,.008,coord.z,.62,.03,.62);
        const glow=piece(stage,'disc','#7fbf3a',coord.x,.012,coord.z,.44,.012,.44,true);
        glow.material=new T.MeshBasicMaterial({color:'#8fd14a',transparent:true,opacity:.55,depthWrite:false});
        for(const d of [-.13,0,.13]){
          piece(stage,'cube','#4a4352',coord.x+d,.03,coord.z,.045,.03,.46);
          piece(stage,'cube','#4a4352',coord.x,.031,coord.z+d,.46,.03,.045);
        }
        for(let i=0;i<4;i++){
          const wisp=piece(stage,'orb','#c6ec8a',coord.x,.1,coord.z,.12,.12,.12,true);
          wisp.material=new T.MeshBasicMaterial({color:'#c6ec8a',transparent:true,opacity:0,depthWrite:false});
          wisp.userData={x:coord.x,z:coord.z,phase:i/4,angle:i*1.9+pos};
          gasPuffs.push(wisp);
        }
      }
      const overlay=new T.Mesh(flatTile,overlayMaterial(overlayColors.walk));
      overlay.position.set(coord.x,.012,coord.z);
      overlay.renderOrder=2;
      overlay.visible=false;
      stage.add(overlay);
      overlays.push(overlay);
      if(walls.has(pos)){
        const block=new T.Group();
        stage.add(block);
        block.position.copy(coord);
        block.rotation.y=((state.wallRotations?.[pos]??pos%4)*Math.PI)/2;
        ps1Obstacle(block,['jungle','hell'].includes(mode)?mode:'crypt',state.wallVariants?.[pos]??Math.floor(v*3),pos%7+1);
      }else if(v<.085&&!state.water?.includes(pos)&&!trap){
        const chip=piece(stage,'cube',palette[0],coord.x-.22,.012,coord.z+.21,.22,.022,.035);
        chip.rotation.y=v*12;
      }
    }
    const placement=[.09,.49,.87].map(f=>exposed[Math.floor(exposed.length*f)]);
    placement.forEach(([x,z],index)=>{
      piece(stage,'column','#475264',x,.52,z,.34,1.13,.34);
      piece(stage,'column','#b18a65',x,1.13,z,.31,.17,.31);
      const color=biomeLight[mode]||'#ffb46b';
      const flame=piece(stage,'gem',color,x,1.34,z,.22,.37,.22,true);
      torches.push(flame);
      const light=new T.PointLight(color,14,6,2);
      light.position.set(x,1.47,z);
      stage.add(light);
      torchLights.push(light);
      const halo=piece(stage,'orb',color,x,1.36,z,.5,.5,.5,true);
      halo.material=new T.MeshBasicMaterial({color,transparent:true,opacity:.16,depthWrite:false,blending:T.AdditiveBlending});
      const crystal=piece(stage,'gem',{jungle:'#7acb4a',roots:'#7da38f',bones:'#c9c0a8',hell:'#ff7a3a'}[mode]||'#8479b5',x+(index===0?.65:-.41),.19,z+.35,.22,.38,.20);
      crystal.rotation.z=.32;
    });
    stage.add(hoverMarker);
    const count=reduced?0:Math.round(w*h*1.4);
    if(count){
      const positions=new Float32Array(count*3);
      const seeds=new Float32Array(count);
      for(let i=0;i<count;i++){
        positions[i*3]=(random(state.mapSeed,i*3+1)-.5)*(w+2);
        positions[i*3+1]=random(state.mapSeed,i*3+2)*2.6;
        positions[i*3+2]=(random(state.mapSeed,i*3+3)-.5)*(h+2);
        seeds[i]=random(state.mapSeed,i*7)*6.283;
      }
      const geometry=new T.BufferGeometry();
      geometry.setAttribute('position',new T.BufferAttribute(positions,3));
      geometry.setAttribute('seed',new T.BufferAttribute(seeds,1));
      const material=new T.ShaderMaterial({
        uniforms:{time:clock,tint:{value:new T.Color({jungle:'#e8ff6a',roots:'#d4ff9c',bones:'#c9ffd8',hell:'#ff8a3a'}[mode]||'#ffc98a')}},
        vertexShader:`attribute float seed; uniform float time; varying float vFade;
          void main(){
            vec3 p=position;
            float t=time*.18+seed;
            p.y=mod(p.y+time*.12,2.6);
            p.x+=sin(t*1.3)*.25; p.z+=cos(t)*.25;
            vFade=sin(p.y/2.6*3.1416)*(.55+.45*sin(time*2.+seed*3.));
            gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
            gl_PointSize=2.;
          }`,
        fragmentShader:`uniform vec3 tint; varying float vFade; void main(){gl_FragColor=vec4(tint,vFade*.75);}`,
        transparent:true,depthWrite:false,blending:T.AdditiveBlending
      });
      dust=new T.Points(geometry,material);
      stage.add(dust);
    }
    fit();
  }
  function makeLabel(u){
    const label=document.createElement('div');
    label.className='iso-label'+(u.enemy?' enemy-label':'')+(u.boss?' boss-label':'');
    const tint=!u.enemy&&playerColors.find(c=>c.id===u.color);
    if(tint)label.style.setProperty('--player',tint.hex);
    const name=document.createElement('span');
    name.textContent=u.name;
    const hp=document.createElement('i');
    label.append(name,hp);
    labels.append(label);
    return {label,hp};
  }
  function sync(next,shouldAnimate){
    state=next;
    const id=state.floor+':'+state.width+':'+state.height+':'+state.mapSeed;
    if(id!==stageKey){
      stageKey=id;
      rebuild();
    }
    for(const u of next.units){
      const moving=shouldAnimate(u.id)||steps.has(u.id);
      if(u.hp<=0&&!moving){
        // La caída empieza tras el golpe que la mata (o, si no llega a verse, al cabo de 1,5 s).
        const dying=models.get(u.id);
        if(!dying)continue;
        if(!active){removeModel(u.id);continue;}
        if(!dying.dying&&!dying.deathAt)dying.deathAt=performance.now()+1500;
        continue;
      }
      const coords=logical(next,u.pos);
      if(!models.has(u.id)){
        const tint=u.enemy?null:playerColors.find(c=>c.id===u.color)||null;
        const model=miniature(look(u),tint);
        ownMaterials(model);
        model.root.position.copy(coords);
        model.root.rotation.y=u.enemy?-.9:.9;
        figures.add(model.root);
        const shadow=piece(figures,'disc','#212538',coords.x,.016,coords.z,.69,.018,.60);
        const ring=piece(shadow,'ring','#ffd895',0,1,0,1.22,1.39,1.36,true);
        ring.geometry=ring.geometry.clone().rotateX(-Math.PI/2);
        model.ring=ring;
        model.shadow=shadow;
        Object.assign(model,makeLabel(u),{unit:u,phase:random(next.mapSeed,u.pos)*Math.PI*2});
        models.set(u.id,model);
      }
      const model=models.get(u.id);
      model.unit=u;
      model.label.classList.toggle('active',next.phase==='combat'&&next.units[next.turn]?.id===u.id);
      model.ring.visible=next.phase==='combat'&&next.units[next.turn]?.id===u.id;
      model.hp.style.setProperty('--hp',(u.hp/u.max*100)+'%');
      if(!moving)model.root.position.copy(coords);
    }
  }
  function projected(x,y,z){
    world.set(x,y,z).project(camera);
    return {x:(world.x*.5+.5)*viewWidth,y:(.5-world.y*.5)*viewHeight};
  }
  function anchor(pos,height){
    const u=state.units.find(candidate=>candidate.hp>0&&candidate.pos===pos);
    const model=u&&models.get(u.id);
    const coords=model?.root.position||logical(state,pos);
    const p=projected(coords.x,height??model?.head??.06,coords.z);
    const rect=mount.getBoundingClientRect();
    return {left:rect.left+p.x-14,top:rect.top+p.y,bottom:rect.top+p.y+18};
  }
  function highlight(cells){
    if(!active)return;
    const route=[];
    for(const [i,cell] of [...cells].entries()){
      const o=overlays[i];
      if(!o)continue;
      const c=cell.classList;
      const glyph=['damage','poison','slow'].find(kind=>c.contains('glyph-'+kind));
      const type=c.contains('area-preview')?'area':c.contains('route')?'route':c.contains('no-sight')?'blocked':glyph||(
        c.contains('aim')?'aim':c.contains('cast-range')?'cast':c.contains('walk')?'walk':c.contains('foe-reach')?'foe':null);
      o.visible=!!type;
      if(type)o.material=overlayMaterial(overlayColors[type],type==='route'||type==='area'?1.25:glyph?1.1:1);
      // La casilla entera (los glifos un pelín menos, para que se distingan del suelo resaltado).
      const size=glyph?.96:1;
      o.scale.set(size,1,size);
      if(c.contains('route'))route.push([Number(cell.dataset.step),i]);
    }
    route.sort((a,b)=>a[0]-b[0]);
    const signature=route.map(([,pos])=>pos).join(',');
    if(signature===routeSignature)return;
    routeSignature=signature;
    routeGroup.clear();
    for(const [,pos] of route){
      const p=logical(state,pos);
      piece(routeGroup,'disc','#e1fbff',p.x,.048,p.z,.21,.024,.21,true);
    }
  }
  // Con una habilidad elegida se apunta a casillas: las figuras no tapan las casillas de detrás.
  let groundOnly=false;
  function aimAt(event){
    const rect=mount.getBoundingClientRect();
    mouse.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
    ray.setFromCamera(mouse,camera);
    const visible=groundOnly?[]:[...models.values()].filter(model=>model.unit.hp>0);
    const hit=visible.length?ray.intersectObjects(visible.map(model=>model.root),true)[0]:null;
    if(hit){
      let root=hit.object;
      while(root.parent&&root.parent!==figures)root=root.parent;
      const model=visible.find(candidate=>candidate.root===root);
      if(model)return model.unit.pos;
    }
    if(!ray.ray.intersectPlane(plane,world))return null;
    const x=Math.round(world.x+(state.width-1)/2),z=Math.round(world.z+(state.height-1)/2);
    if(x<0||x>=state.width||z<0||z>=state.height)return null;
    const pos=z*state.width+x;
    return state.voids?.includes(pos)?null:pos;
  }
  function changeHover(pos,event){
    if(hover===pos)return;
    if(pos!==null&&state){
      const p=logical(state,pos);
      hoverMarker.position.set(p.x,.02,p.z);
      hoverMarker.visible=true;
    }else hoverMarker.visible=false;
    if(hover!==null)onCell('leave',hover,event);
    hover=pos;
    if(pos!==null)onCell('enter',pos,event);
  }
  renderer.domElement.addEventListener('pointermove',e=>{if(active&&state)changeHover(aimAt(e),e);});
  renderer.domElement.addEventListener('pointerleave',e=>changeHover(null,e));
  renderer.domElement.addEventListener('click',e=>{
    if(!active||!state)return;
    const pos=aimAt(e);
    if(pos!==null)onCell('click',pos,e);
  });
  renderer.domElement.addEventListener('wheel',e=>{
    if(!active||e.ctrlKey||e.deltaY===0)return;
    e.preventDefault();
    const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?viewHeight:1);
    zoom(clamp(-pixels*.0012,-.16,.16),e);
  },{passive:false});
  renderer.domElement.addEventListener('webglcontextlost',e=>{
    e.preventDefault();
    mount.dispatchEvent(new Event('graphicslost'));
  });
  function show(value){
    if(active===value)return;
    active=value;
    mount.hidden=!value;
    if(value){
      previousFrame=0;
      fit();
      frame=requestAnimationFrame(draw);
    }else{
      cancelAnimationFrame(frame);
      changeHover(null);
      clearTransient();
    }
  }
  function move(event){
    if(!active)return Promise.resolve();
    const model=models.get(event.unit);
    if(!model)return Promise.resolve();
    const points=[event.from,...event.path].map(pos=>logical(state,pos));
    if(event.blink){
      // Teletransporte: nube de sombra en el origen, aparece de golpe en el destino.
      const time=performance.now(),end=points.at(-1);
      for(const [p,delay] of [[points[0],0],[end,140]])for(let j=0;j<(reduced?3:7);j++){
        const angle=j/7*Math.PI*2,r=.12+(j%3)*.07;
        const puff=piece(transient,'orb',j%2?'#2a1838':'#7d4fb0',p.x+Math.cos(angle)*r,.25+(j%3)*.18,p.z+Math.sin(angle)*r,.22,.22,.22,j%2===0);
        puff.visible=!delay;
        effects.push({mesh:puff,start:time+delay,duration:460,fade:true,size:.24});
      }
      model.root.position.copy(points[0]);
      model.root.visible=false;
      return new Promise(resolve=>setTimeout(()=>{model.root.position.copy(end);model.root.visible=true;model.hurt=null;resolve();},170));
    }
    model.root.position.copy(points[0]);
    return new Promise(resolve=>steps.set(event.unit,{points,elapsed:0,first:true,resolve}));
  }
  /** Qué animación hace el que actúa, según el efecto y quién es. */
  function actionFor(unit,effect){
    if(['heal','cleanse'].includes(effect))return 'support';
    if(effect==='push'||effect==='pull')return effect;
    if(unit?.boss&&effect!=='slash')return 'cast';                   // poderes de jefe: invocar, aullar, nova
    if(effect==='dash'||effect==='swap')return 'dash';
    if(effect==='arrow')return 'shoot';
    if(effect==='slash')return 'melee';
    if(unit?.classId==='tirador')return 'shoot';
    if(unit?.classId==='guardia'||unit?.classId==='sombra')return 'melee';
    if(unit?.enemy&&!unit.boss&&(unit.range||1)<=1)return 'melee';
    return 'cast';
  }
  function impact(event){
    if(!active)return;
    const palette={heal:'#9bf2a5',cleanse:'#fff2ba',blast:'#ff884b',slow:'#9be8ff',venom:'#b9e574',expose:'#d9a3ff',
      arcane:'#bfb4ff',arrow:'#f6d18b',push:'#faf1a9',slash:'#ffdaa8',dash:'#bc91ee',poison:'#b9e574',glyph:'#ff8e66',burn:'#ff7a2e'};
    const color=palette[event.effect||event.kind]||'#f4c18e';
    const time=performance.now();
    const target=logical(state,event.pos);
    if(event.kind!=='spell'){
      const victim=event.unit&&models.get(event.unit);
      if(victim&&event.amount>0&&['damage','glyph','poison','trap','burn'].includes(event.kind)){
        const from=event.from!==undefined?logical(state,event.from):null;
        victim.hurt={start:time,dx:from?victim.root.position.x-from.x:0,dz:from?victim.root.position.z-from.z:0,crit:!!event.critical};
        if(state.units.find(u=>u.id===event.unit)?.hp<=0&&!victim.dying)victim.deathAt=time+240;
      }
      if(event.kind==='glyph'||event.kind==='poison'||event.kind==='burn'){
        const pulse=piece(transient,'disc',color,target.x,.045,target.z,.45,.025,.45,true);
        effects.push({mesh:pulse,start:time,duration:330,pop:true});
      }
      return;
    }
    const from=logical(state,event.from);
    const travel=from.distanceTo(target);
    const model=models.get(event.actor);
    if(model){
      model.strike=time;
      model.action={type:actionFor(model.unit,event.effect),start:time};
      if(travel>.01)model.root.rotation.y=Math.atan2(target.x-from.x,target.z-from.z);
    }
    const ranged=travel>1.1&&!['heal','cleanse','dash','slash'].includes(event.effect);
    // Proyectil visible: más lento, con halo y estela, del color de su elemento.
    const flight=ranged?Math.min(620,200+travel*55):65;
    if(ranged){
      const elementColor={fire:'#ff7a2e',ice:'#8fe3ff',lightning:'#ffe45c',chaos:'#9be05a',magic:'#c9a6ff'}[event.element];
      const tint=elementColor||color;
      const actorUnit=state.units.find(u=>u.id===event.actor);
      const lift=actorUnit&&['skull','bat','imp','oracle','umbralking','succubus','vampqueen'].includes(actorUnit.look)?.35:0;
      const arrow=event.effect==='arrow';
      const shot=piece(transient,arrow?'cone':'orb',tint,from.x,.68+lift,from.z,arrow?.12:.27,arrow?.42:.27,arrow?.12:.27,true);
      const halo=arrow?null:piece(shot,'orb',tint,0,0,0,1.9,1.9,1.9,true);
      if(halo){halo.material=halo.material.clone();halo.material.transparent=true;halo.material.opacity=.35;halo.material.depthWrite=false;}
      effects.push({mesh:shot,start:time,duration:flight,source:from,target,shape:event.effect,lift,trail:tint,lastTrail:0});
    }
    const area=event.area||[event.pos];
    for(const [i,pos] of area.entries()){
      const p=logical(state,pos);
      const start=time+flight+i*34;
      const ring=piece(transient,'ring',color,p.x,.064,p.z,.44,.44,.44,true);
      ring.rotation.x=-Math.PI/2;
      ring.visible=false;
      effects.push({mesh:ring,start,duration:405,ring:true});
      const count=reduced?3:event.effect==='blast'?9:6;
      for(let j=0;j<count;j++){
        const angle=j/count*Math.PI*2;
        const spark=piece(transient,'gem',j%3===0?'#fff5d4':color,p.x,.15,p.z,.087,.125,.087,true);
        spark.visible=false;
        effects.push({mesh:spark,start:start+(j%3)*18,duration:295+(j%3)*65,
          burst:true,origin:p,angle,wide:event.effect==='blast'?.58:.31,high:['heal','cleanse'].includes(event.effect)?.85:.57});
      }
    }
  }
  function draw(now){
    if(!active)return;
    const delta=previousFrame?Math.min(45,Math.max(0,now-previousFrame)):0;
    previousFrame=now;
    clock.value=now/1000;
    for(const [index,light] of torchLights.entries()){
      light.intensity=reduced?14:12.5+Math.sin(now*.011+index*2.1)*1.6+Math.sin(now*.027+index)*1.1;
    }
    for(const puff of gasPuffs){
      // Cada voluta sube despacio, se ensancha y se desvanece; luego vuelve a nacer en la rejilla.
      const {x,z,phase,angle}=puff.userData;
      const t=reduced?phase:((now*.00035+phase)%1);
      const drift=t*.16;
      puff.position.set(x+Math.cos(angle+t*2)*drift,.06+t*.62,z+Math.sin(angle+t*2)*drift);
      puff.scale.setScalar(.08+t*.2);
      puff.material.opacity=Math.sin(t*Math.PI)*.38;
    }
    for(const [index,flame] of torches.entries()){
      const t=reduced?0:now*.007+index;
      flame.scale.y=.34+Math.sin(t)*.065;
      flame.rotation.y=t*.45;
    }
    const heroSpots=[...models.values()].filter(m=>!m.unit.enemy&&m.unit.hp>0).map(m=>m.root.position);
    for(const [id,model] of models){
      const walk=steps.get(id);
      // Los enemigos miran siempre hacia el héroe vivo más cercano (salvo al caminar o atacar).
      if(model.unit.enemy&&!walk&&heroSpots.length&&now-(model.strike??-10000)>350){
        const p=model.root.position;
        const target=heroSpots.reduce((a,b)=>a.distanceToSquared(p)<=b.distanceToSquared(p)?a:b);
        const desired=Math.atan2(target.x-p.x,target.z-p.z);
        let diff=desired-model.root.rotation.y;
        diff=Math.atan2(Math.sin(diff),Math.cos(diff));
        model.root.rotation.y+=reduced?diff:diff*Math.min(1,delta*.012);
      }
      let gait=0;
      if(walk){
        if(walk.first)walk.first=false;
        else walk.elapsed+=delta;
        const t=walk.elapsed/(id.startsWith('enemy')?135:reduced?145:225);
        const i=Math.min(walk.points.length-2,Math.floor(t));
        const a=walk.points[i],b=walk.points[i+1];
        model.root.position.lerpVectors(a,b,ease(clamp(t-i,0,1)));
        model.root.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);
        gait=Math.sin(t*Math.PI*2);
        if(t>=walk.points.length-1){steps.delete(id);walk.resolve();}
      }
      const strike=Math.max(0,1-(now-(model.strike??-10000))/285);
      let swing=Math.sin(strike*Math.PI);
      const act=model.action,actDur={melee:460,shoot:560,cast:620,support:640,push:420,pull:460,dash:300}[act?.type]||400;
      const at=act?(now-act.start)/actDur:2;
      if(at<1){
        // Anticipación (hacia atrás) y golpe: la curva se pasa a la animación propia del modelo.
        swing=act.type==='melee'?(at<.35?-.45*Math.sin(at/.35*Math.PI/2):Math.sin((at-.35)/.65*Math.PI)):
          act.type==='pull'?(at<.5?Math.sin(at*2*Math.PI/2):Math.cos((at-.5)*2*Math.PI/2)*(1-at)*2-.3*(at-.5)):Math.sin(at*Math.PI)*.8;
      }else if(act)model.action=null;
      // Las animaciones de reposo se mantienen siempre (son suaves), incluso con movimiento reducido.
      const breath=Math.sin(now*.0028+model.phase);
      if(model.animate){
        model.animate(now/1000,{gait,swing,walking:!!walk,reduced:false,phase:model.phase});
      }else{
        const t=now/1000+model.phase;
        const idle=walk?0:1;
        model.figure.position.y=Math.abs(gait)*.055+breath*.035*idle;
        model.figure.scale.y=model.figure.scale.x*(1+breath*.018*idle);
        model.figure.rotation.z=walk?gait*.055:breath*.04;
        // Mira a su alrededor de vez en cuando.
        model.figure.rotation.y=idle*Math.sin(t*.45)*Math.max(0,Math.sin(t*.21))*.35;
        model.arms[0].rotation.x=gait*.36+breath*.16*idle;
        model.arms[0].rotation.z=idle*(.06+Math.sin(t*1.1)*.04);
        model.arms[1].rotation.x=-gait*.36-swing*.97-(breath*.14+.12)*idle;
        model.arms[1].rotation.z=-idle*(.06+Math.sin(t*1.3)*.04);
        model.legs[0].rotation.x=-gait*.43;
        model.legs[1].rotation.x=gait*.43;
      }
      actionLayer(model,now,at<1?act.type:null,at,walk);
      if(model.ring.visible&&!reduced){
        model.ring.rotation.y=now*.0012;
        const s=1+Math.sin(now*.005)*.05;
        model.ring.scale.set(1.22*s,1.39,1.36*s);
      }
      // Quemadura: lenguas de fuego que parpadean alrededor del cuerpo y ascuas que suben.
      const burning=!!model.unit.effects?.burn&&model.unit.hp>0;
      if(burning&&!model.flames){
        model.flames=new T.Group();
        const tongues=[];
        for(let i=0;i<6;i++){
          const a=i/6*Math.PI*2,r=.2+(i%2)*.07;
          const outer=piece(model.flames,'cone',i%2?'#ff5a1f':'#ff8a2e',Math.sin(a)*r,.18,Math.cos(a)*r,.13,.38,.13,true);
          const inner=piece(model.flames,'cone','#ffd36b',Math.sin(a)*r*.8,.13,Math.cos(a)*r*.8,.07,.22,.07,true);
          tongues.push({outer,inner,seed:i*1.7});
        }
        model.flames.userData.tongues=tongues;
        model.root.add(model.flames);
      }
      if(model.flames){
        model.flames.visible=burning;
        if(burning){
          for(const t of model.flames.userData.tongues){
            const f=reduced?1:.75+.35*Math.abs(Math.sin(now*.013+t.seed))+.15*Math.sin(now*.031+t.seed*3);
            t.outer.scale.set(.13,.38*f,.13);t.outer.position.y=.18*f;
            t.inner.scale.set(.07,.22*f,.07);t.inner.position.y=.12*f;
          }
          model.flames.rotation.y=reduced?0:now*.0015;
          if(!reduced&&now-(model.lastEmber||0)>110){
            model.lastEmber=now;
            const p=model.root.position,a=Math.random()*Math.PI*2;
            const ember=piece(transient,'gem',Math.random()<.5?'#ffb347':'#ff6a2a',p.x+Math.sin(a)*.25,.35,p.z+Math.cos(a)*.25,.06,.06,.06,true);
            effects.push({mesh:ember,start:now,duration:700,ember:true,size:.06});
          }
        }
      }
      model.shadow.position.x=model.root.position.x;
      model.shadow.position.z=model.root.position.z;
      const pos=projected(model.root.position.x,model.head+.15+model.figure.position.y,model.root.position.z);
      model.label.style.transform='translate('+pos.x+'px,'+pos.y+'px) translate(-50%,-100%)';
    }
    for(let i=effects.length-1;i>=0;i--){
      const fx=effects[i];
      const t=(now-fx.start)/fx.duration;
      if(t<0)continue;
      if(t>=1){transient.remove(fx.mesh);effects.splice(i,1);continue;}
      fx.mesh.visible=true;
      if(fx.burst){
        const spread=fx.wide*Math.sin(t*Math.PI*.62);
        fx.mesh.position.set(fx.origin.x+Math.cos(fx.angle)*spread,.1+Math.sin(t*Math.PI)*fx.high,fx.origin.z+Math.sin(fx.angle)*spread);
        fx.mesh.scale.setScalar(.12*(1-t*.88));
        fx.mesh.rotation.y=t*5;
      }else if(fx.ring){
        fx.mesh.scale.setScalar(.25+Math.sin(t*Math.PI*.76)*.86);
        fx.mesh.position.y=.04+t*.08;
      }else if(fx.ember){
        fx.mesh.position.y+=.012;
        fx.mesh.scale.setScalar(fx.size*(1-t));
      }else if(fx.fade){
        fx.mesh.scale.setScalar(fx.size*(1-t));
        fx.mesh.position.y-=.002;
      }else if(fx.pop){
        fx.mesh.scale.x=fx.mesh.scale.z=.36+t*.55;
        fx.mesh.position.y=.04+t*.045;
      }else{
        fx.mesh.position.lerpVectors(fx.source,fx.target,t);
        fx.mesh.position.y=.56+(fx.lift||0)*(1-t)+Math.sin(t*Math.PI)*.42;
        // Estela: chispas que se quedan atrás y se apagan.
        if(fx.trail&&now-fx.lastTrail>26&&!reduced){
          fx.lastTrail=now;
          const p=fx.mesh.position;
          const spark=piece(transient,'gem',fx.trail,p.x,p.y,p.z,.13,.13,.13,true);
          effects.push({mesh:spark,start:now,duration:300,fade:true,size:.13});
        }
        if(fx.shape==='arrow'){
          fx.mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),fx.target.clone().sub(fx.source).normalize());
          fx.mesh.scale.y=.48;
        }else fx.mesh.rotation.y=t*7;
      }
    }
    renderer.setRenderTarget(pixels);
    renderer.render(scene,camera);
    renderer.setRenderTarget(null);
    renderer.render(screen,screenCamera);
    frame=requestAnimationFrame(draw);
  }
  /** Punto del suelo bajo el ratón (o el centro de la vista). */
  function groundAt(event){
    const rect=mount.getBoundingClientRect();
    mouse.set(event?(event.clientX-rect.left)/rect.width*2-1:0,event?1-(event.clientY-rect.top)/rect.height*2:0);
    ray.setFromCamera(mouse,camera);
    return ray.ray.intersectPlane(plane,world)?{x:world.x,z:world.z}:null;
  }
  /** Zoom hacia el punto que señala el ratón: ese punto se queda quieto bajo el puntero. */
  function zoom(delta,event=null){
    if(!state)return;
    const before=groundAt(event);
    magnification=clamp(magnification+delta,.85,1.45);
    fit();
    const after=groundAt(event);
    if(before&&after){pan.x+=before.x-after.x;pan.z+=before.z-after.z;fit();}
  }
  return {show,sync,anchor,highlight,move,impact,zoom,resetHover(){hover=null;},get active(){return active;},
    set aiming(value){groundOnly=!!value;}};
}

