import * as T from './three.module.js';
import {miniature,ps1Obstacle,piece,solid,useObstacleTexture} from './models3d.js?v=184';
import {playerColors} from './engine.js?v=184';

const clamp=T.MathUtils.clamp;
const ease=t=>t*t*(3-2*t);
const tilesets={
  crypt:['#2f3446','#383c50','#2c3142','#41435a','#343a4c'],
  jungle:['#2c4322','#344d27','#283d1f','#3c572c','#304824'],
  roots:['#3c524e','#465c50','#384a4a','#4e5f55','#415450'],
  bones:['#4e4840','#5a5246','#474036','#625a4c','#514a3e'],
  hell:['#2a2624','#322c29','#262220','#3a3330','#2e2826']
};
// Tileset en archivo (prueba): tiles/<bioma>.png, cuadrícula de 4×4 casillas (32×32 o más):
// filas 1-3 = 12 variantes de suelo ordenadas de más sana a más destruida, fila 4 = 4 variantes de pared.
// Se activa con ?tiles en la URL o localStorage tiles=1; los biomas sin archivo siguen con colores planos.
const query=(()=>{try{return new URLSearchParams(location.search);}catch{return new URLSearchParams();}})();
// Gráficos mejorados por defecto (tileset + relieve + luces cálidas + sombras de antorchas + decorado + muros altos).
// ?classic vuelve al aspecto anterior de colores planos.
const deluxe=!query.has('classic');
/** Color del mortero entre losas, por bioma. */
const groutColor={crypt:'#2e2a38',hell:'#3a2420',jungle:'#2a3424'};
const useTiles=deluxe||query.has('tiles')||(()=>{try{return localStorage.getItem('tiles')==='1';}catch{return false;}})();
const tileFiles={crypt:'tiles/crypt.png',hell:'tiles/hell.png'};
const TILE_COLS=4,TILE_ROWS=4,FLOOR_TILES=12,WALL_ROW=3;
const FLOOR_WEIGHTS=[10,9,8,7,6,5,4,3,2.5,2,1.5,1],FLOOR_WEIGHT_TOTAL=FLOOR_WEIGHTS.reduce((a,b)=>a+b,0);
const tileSheets={},tileMats={};
let propTexture=null;
function tileMaterial(mode,col,row){
  const file=tileFiles[mode];if(!useTiles||!file)return null;
  const key=mode+col+'/'+row;
  if(tileMats[key])return tileMats[key];
  const sheet=tileSheets[mode]??=new T.TextureLoader().load(file);
  const t=sheet.clone();
  t.magFilter=t.minFilter=T.NearestFilter;t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=false;
  t.repeat.set(1/TILE_COLS,1/TILE_ROWS);t.offset.set(col/TILE_COLS,1-(row+1)/TILE_ROWS);
  // En HD el propio dibujo hace de relieve: las juntas oscuras quedan hundidas y atrapan sombra.
  return tileMats[key]=new T.MeshStandardMaterial({map:t,roughness:.86,metalness:0,...(deluxe?{bumpMap:t,bumpScale:row===WALL_ROW?3:2.2}:{})});
}
const biomeLight={crypt:'#ffa45a',jungle:'#e8ff8a',roots:'#c1f195',bones:'#9dffb8',hell:'#ff8a3a'};
const biomeFog={crypt:'#07060d',jungle:'#0c1a0e',roots:'#0d1412',bones:'#12110e',hell:'#0e0b0a'};
const overlayColors={walk:'#62d68e',cast:'#9484b8',aim:'#e9c48a',route:'#bfe6f2',area:'#ff8a4a',blocked:'#b06070',damage:'#ea6a50',poison:'#9abe56',slow:'#9a86ff',foe:'#c97a6e',guard:'#d8c27a',snare:'#8fe3ff',snareToxic:'#a6d64a'};
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
const areaCache=new Map();
/** Color del área según el elemento: [forma, marca del impacto]. Veneno = caótico (lima). */
const areaTones={fire:['#ff8a4a','#ffc890'],ice:['#8ad8ff','#d8f4ff'],lightning:['#ffe066','#fff3b0'],chaos:['#a6e04a','#dcff9e'],
  magic:['#c08cff','#e6d0ff'],physical:['#e0d6c4','#fff6e6']};
/**
 * Casilla del área de un hechizo, con el mismo lenguaje que el resto (relleno suave, «L» con latido), pero el área
 * se lee como UNA forma: las «L» solo van en las esquinas exteriores de la forma.
 * edges = lados que dan fuera (+x, −x, +z, −z); corners = «L» en (+x+z, −x+z, +x−z, −x−z). fill baja con la distancia.
 */
function areaMaterial(color,edges,corners,fill){
  const key=color+edges+'/'+corners+'/'+fill;
  if(areaCache.has(key))return areaCache.get(key);
  const material=new T.ShaderMaterial({
    uniforms:{tint:{value:new T.Color(color)},time:clock,edges:{value:new T.Vector4(...edges)},corners:{value:new T.Vector4(...corners)},fill:{value:fill}},
    vertexShader:`varying vec2 vLocal; varying vec3 vWorld;
      void main(){vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;vLocal=position.xz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform vec3 tint; uniform float time; uniform vec4 edges; uniform vec4 corners; uniform float fill;
      varying vec2 vLocal; varying vec3 vWorld;
      void main(){
        vec2 l=vLocal;
        vec2 q=.5-abs(l);                                // distancia a cada borde de la casilla
        // «L» en las esquinas exteriores de la forma (mismo grosor y latido que las del movimiento).
        float c=l.x>0.?(l.y>0.?corners.x:corners.z):(l.y>0.?corners.y:corners.w);
        float arm=.3;
        float bandX=smoothstep(.05,.065,q.x)*smoothstep(.11,.095,q.x)*step(q.y,arm)*step(.05,q.y);
        float bandZ=smoothstep(.05,.065,q.y)*smoothstep(.11,.095,q.y)*step(q.x,arm)*step(.05,q.x);
        float bracket=c*max(bandX,bandZ);
        // Latido como el de la casilla de destino del movimiento: más rápido y marcado; el contorno late con él.
        float beatT=fract(time/.7);
        float beat=exp(-pow(beatT*11.,2.))+.65*exp(-pow((beatT-.2)*11.,2.));
        float throb=1.-.85*.7+.85*beat;
        bracket*=1.7*2.2*throb;
        float pulse=.94+.06*sin(time*2.4+(vWorld.x+vWorld.z)*.55);
        float alpha=(.20*fill+bracket*.32)*pulse*1.1;
        gl_FragColor=vec4(tint*(1.+bracket*.25),alpha);
      }`,
    transparent:true,depthWrite:false,toneMapped:false
  });
  areaCache.set(key,material);
  return material;
}
const overlayCache=new Map();
/** Material de resaltado: relleno translúcido, borde luminoso y pulso suave. */
/** Material de casilla resaltada. corners=1: en vez de borde completo, solo «L» en las cuatro esquinas. */
function overlayMaterial(color,strength=1,fill=1,corners=0,amp=.38,arm=.19,boost=1,period=1.6){
  const key=color+strength+'/'+fill+'/'+corners+'/'+amp+'/'+arm+'/'+boost+'/'+period;
  if(overlayCache.has(key))return overlayCache.get(key);
  const material=new T.ShaderMaterial({
    uniforms:{tint:{value:new T.Color(color)},time:clock,strength:{value:strength},fill:{value:fill},corners:{value:corners},amp:{value:amp},arm:{value:arm},boost:{value:boost},period:{value:period}},
    vertexShader:`varying vec2 vUv; varying vec3 vWorld;
      void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform vec3 tint; uniform float time; uniform float strength; uniform float fill; uniform float corners; uniform float amp; uniform float arm; uniform float boost; uniform float period; varying vec2 vUv; varying vec3 vWorld;
      void main(){
        vec2 q=min(vUv,1.-vUv);
        float d=min(q.x,q.y);
        float edge=smoothstep(.045,.0,d);
        // Esquinas en «L»: el borde solo existe a menos de un 19 % del vértice en los dos ejes.
        // (un poco metidas hacia dentro para que las de casillas vecinas no se junten en una cruz).
        float inCorner=step(q.x,arm)*step(q.y,arm)*step(.05,q.x)*step(.05,q.y);
        float band=smoothstep(.05,.065,d)*smoothstep(.11,.095,d);
        // Latido tenue de las esquinas: doble pulso (pum-pum) cada 1,6 s, igual en todas las casillas.
        float beatT=fract(time/period);
        float beat=exp(-pow(beatT*11.,2.))+.65*exp(-pow((beatT-.2)*11.,2.));
        edge=mix(edge,band*inCorner*1.7*boost*(1.-amp*.7+amp*beat),corners);
        float fillNow=fill;
        float pulse=.94+.06*sin(time*2.4+(vWorld.x+vWorld.z)*.55);
        float alpha=(.20*fillNow+edge*.32)*pulse*strength;
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
  let statusRenderer=null;
  const labels=document.createElement('div');
  labels.className='iso-labels';
  const badges=document.createElement('div');
  badges.className='iso-labels iso-badges';
  mount.append(renderer.domElement,labels,badges);

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
    fragmentShader:`#define DELUXE ${deluxe?'1.':'0.'}
      uniform sampler2D image; uniform vec2 resolution; uniform float time; varying vec2 tex;
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
        gl_FragColor=vec4(base.rgb+glow*(DELUXE>0.?.16:.08),base.a);
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
        c*=1.-dot(v,v)*(DELUXE>0.?.9:.3);
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
  // Casilla bajo el ratón: mismo estilo que las de movimiento (relleno tenue + esquinas en «L» que laten), en blanco.
  const hoverMarker=new T.Mesh(flatTile,overlayMaterial('#ffffff',1,.18,1,.38,.19,1.15));
  hoverMarker.visible=false;
  hoverMarker.renderOrder=3;
  let dust=null;
  const models=new Map();
  const effects=[];
  const heroLamps=[];
  const steps=new Map();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stageKey='',state,active=false,hover=null,frame=0,viewWidth=0,viewHeight=0;
  let routeSignature='';
  const destinationPlane=new T.PlaneGeometry(1,1).rotateX(-Math.PI/2);
  // Materiales del surco de la ruta.
  const grooveRim=new T.ShaderMaterial({
    uniforms:{time:clock,total:{value:1}},
    vertexShader:`attribute float along; varying float vAlong;
      void main(){vAlong=along;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float time; uniform float total; varying float vAlong;
      void main(){
        // Destello que recorre el borde desde el héroe hasta el destino cada 1,4 s.
        float head=fract(time/1.4)*(total+.8)-.4;
        float glint=exp(-pow((vAlong-head)*3.2,2.));
        gl_FragColor=vec4(vec3(.36,.78,.5)*(1.+glint*1.4),.62+glint*.35);
      }`,
    transparent:true,depthWrite:false,side:T.DoubleSide});
  const grooveDeep=new T.MeshBasicMaterial({color:'#060c08',transparent:true,opacity:.88,depthWrite:false,side:T.DoubleSide});
  const grooveFloor=new T.MeshStandardMaterial({color:'#1d3a27',roughness:1,transparent:true,opacity:.7,depthWrite:false,side:T.DoubleSide});
  let previousFrame=0;
  let magnification=1.13;
  // Desplazamiento de la cámara (para hacer zoom hacia donde apunta el ratón).
  const pan={x:0,z:0};
  const routeGroup=new T.Group();
  stage.add(routeGroup);
  // Área del hechizo apuntado.
  const areaGroup=new T.Group();
  stage.add(areaGroup);
  let areaSignature='';
  // Trampas de los héroes (Tramposa, Trampita): una marca en la casilla, que late.
  const snareGroup=new T.Group();
  stage.add(snareGroup);
  let snareSignature='';

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
    const room=clamp((magnification-.95)/.5,0,1);
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
    model.label.remove();model.fx?.remove();
    model.ring.geometry.dispose();
    model.shadow.parent?.remove(model.shadow);
    figures.remove(model.root);
    models.delete(id);
  }
  /** Poses de acción, golpe recibido y muerte, aplicadas encima de la animación de cada modelo. */
  /**
   * Poses de la Valkyria al usar cada habilidad. S = brazo de la lanza (arms[0]), O = el otro.
   * rotation.x negativo alza el brazo hacia delante/arriba; L es la capa de todo el cuerpo
   * (position.z hacia delante, rotation.x positivo inclina hacia delante).
   */
  /**
   * Arquero. B = brazo del arco (arms[0]), H = mano de la cuerda (arms[1]).
   * El arco se mantiene vertical en el mundo (o inclinado hacia atrás al tirar al cielo).
   */
  function bowPose(model,type,at,B,H,L,ease){
    if(!['draw','sky','toss','focus'].includes(type))return false;
    const seg=(a,b)=>ease(Math.min(1,Math.max(0,(at-a)/(b-a))));
    const holder=model.bowHolder??=B?.getObjectByName('held')||null;
    let tilt=0;
    if(type==='draw'||type==='sky'){
      const rel=type==='draw'?.58:.59;                     // suelta en bowRelease / duración
      const raise=seg(0,.22),pull=seg(.18,rel),snap=seg(rel,rel+.08),rest=seg(.8,1);
      const up=type==='sky'?.85:0;
      const hold=raise*(1-rest);
      B.rotation.x=-(1.5+up)*hold;B.rotation.z=.12*hold;
      // La mano tira de la cuerda hacia la cara y al soltar se abre hacia atrás.
      H.rotation.x=-(1.45+up)*hold+.55*pull*(1-snap)*hold-.2*snap*(1-rest);
      H.rotation.z=-.55*pull*(1-snap)*hold-.9*snap*(1-rest);
      L.rotation.y+=.42*hold;                              // de perfil para tensar
      L.position.z+=-.05*pull*(1-snap)+.07*snap*(1-rest);  // retroceso al soltar
      L.rotation.x+=(type==='sky'?-.16:-.04)*hold+.06*snap*(1-rest);
      L.position.y-=.03*pull*(1-snap);
      tilt=type==='sky'?-.8*hold:0;
    }else if(type==='toss'){
      const crouch=seg(0,.3)*(1-seg(.7,1)),fling=seg(.35,.55)*(1-seg(.75,1));
      L.position.y-=.12*crouch;L.rotation.x+=.35*crouch;
      H.rotation.x=-.4*crouch-1.2*fling;H.rotation.z=.2*crouch;
      B.rotation.x=.3*crouch;
    }else if(type==='focus'){
      const k=seg(0,.25)*(1-seg(.75,1));
      H.rotation.x=-2.5*k;H.rotation.z=.45*k;               // mano a la frente
      B.rotation.x=-.9*k;B.rotation.z=.25*k;
      L.rotation.x-=.08*k;L.position.y+=.04*k;
    }
    if(holder)holder.rotation.x=tilt-B.rotation.x;
    return true;
  }
  function spearPose(model,type,at,S,O,L,ease){
    const seg=(a,b)=>ease((at-a)/(b-a));
    // Ángulo de la lanza en el mundo (0 = vertical con la punta arriba, π/2 = al frente, π = punta abajo):
    // la mano gira para que siempre golpee con la punta, no con el regatón.
    const H=model.spearHolder;let aim=null;
    if(type==='thrust'){                        // recoger y lanzar la estocada
      const back=seg(0,.3),hit=seg(.3,.5),rest=seg(.7,1);
      const k=hit*(1-rest);
      S.rotation.x=-.5*back*(1-hit)-1.6*k;S.rotation.z=.25*back*(1-hit);
      O.rotation.x=.5*back*(1-hit)-.6*k;
      L.rotation.y+=.45*back*(1-hit)-.25*k;
      L.position.z+=-.1*back*(1-hit)+.22*k;L.rotation.x+=.18*k;
      aim=.08+1.25*back*(1-rest)+.25*k;
    }else if(type==='throw'){                   // lanza por encima del hombro y latigazo
      const wind=seg(0,.4),fly=seg(.4,.58),rest=seg(.7,1);
      S.rotation.x=-2.9*wind*(1-fly)-1.3*fly*(1-rest);S.rotation.z=.35*wind*(1-fly);
      O.rotation.x=-1.3*wind*(1-rest);O.rotation.z=-.3*wind*(1-rest);
      L.rotation.y+=.5*wind*(1-fly)-.35*fly*(1-rest);
      L.rotation.x+=-.12*wind*(1-fly)+.22*fly*(1-rest);L.position.z+=.12*fly*(1-rest);
      aim=.08+1.4*wind*(1-rest)+.15*fly*(1-rest);
    }else if(type==='slam'){                    // alzar la lanza con las dos manos y clavarla
      const lift=seg(0,.4),drop=seg(.4,.55),rest=seg(.75,1);
      const up=lift*(1-drop),down=drop*(1-rest);
      S.rotation.x=-2.9*up-1.1*down;O.rotation.x=-2.7*up-1.1*down;O.rotation.z=-.3*up;
      L.position.y+=.12*up-.08*down;L.rotation.x+=-.12*up+.35*down;L.position.z+=.08*down;
      aim=.08+2.3*down;
    }else if(type==='sweep'){                   // barrido de lado a lado
      const wind=seg(0,.3),cut=seg(.3,.65),rest=seg(.75,1);
      S.rotation.x=-1.4*(wind+cut>0?1:0)*(1-rest);
      S.rotation.z=(1.1*wind-2.2*cut)*(1-rest);
      O.rotation.x=-.5*(1-rest)*wind;
      L.rotation.y+=(.8*wind-1.7*cut)*(1-rest);L.rotation.x+=.12*cut*(1-rest);
      aim=.08+1.5*Math.max(wind,cut)*(1-rest);
    }else if(type==='raise'){                   // lanza al cielo (Furia, Eclipse)
      const up=seg(0,.35)*(1-seg(.75,1));
      S.rotation.x=-3.05*up;O.rotation.x=-.6*up;O.rotation.z=-1.1*up;
      L.position.y+=.1*up;L.rotation.x+=-.14*up;
    }else if(type==='guard'){                   // agacharse tras la lanza en guardia
      const k=seg(0,.3)*(1-seg(.75,1));
      S.rotation.x=-1.35*k;S.rotation.z=-.2*k;O.rotation.x=-1.1*k;O.rotation.z=.35*k;
      L.position.y-=.07*k;L.rotation.x+=.14*k;
      aim=.08+1.15*k;
    }else if(type==='leap'){                    // agacharse, volar con la lanza en alto y clavarla al caer
      const crouch=seg(0,.15)*(1-seg(.15,.3)),air=seg(.15,.35)*(1-seg(.62,.72)),stab=seg(.62,.72)*(1-seg(.85,1));
      L.position.y-=.1*crouch;L.rotation.x+=.25*crouch-.15*air+.4*stab;
      S.rotation.x=-.4*crouch-2.8*air-.9*stab;O.rotation.x=-1.6*air-.8*stab;O.rotation.z=-.5*air;
      aim=.08-.08*air+2.6*stab;
    }else if(type==='charge'){                  // lanza en ristre e inclinado hacia delante
      const k=seg(0,.15)*(1-seg(.85,1));
      S.rotation.x=-1.55*k;O.rotation.x=.6*k;
      L.rotation.x+=.32*k;L.position.z+=.08*k;
      aim=.08+1.5*k;
    }else if(type==='hop'){                     // saltito ligero
      const up=Math.sin(Math.min(1,at)*Math.PI);
      L.position.y+=.16*up;S.rotation.x=-.4*up;O.rotation.x=.4*up;
    }else return false;
    if(H&&aim!==null)H.rotation.x=aim-S.rotation.x;
    return true;
  }
  function actionLayer(model,now,type,at,walk){
    const [left,right]=model.arms||[];
    if(model.unit.classId==='tirador'&&left){
      model.bowHolder??=left.getObjectByName('held')||null;
      if(model.bowHolder)model.bowHolder.rotation.x=0;
    }
    if(model.unit.classId==='guardia'&&left){
      model.spearHolder??=left.getObjectByName('held')||null;
      if(model.spearHolder)model.spearHolder.rotation.x=.08;
    }
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
      }else if(bowPose(model,type,at,left,right,L,ease)){
        // Poses con arco del Arquero (ver bowPose).
      }else if(spearPose(model,type,at,left,right,L,ease)){
        // Poses con lanza de la Valkyria (ver spearPose).
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
    if(model.deathAt&&!model.dying&&now>=model.deathAt){model.dying=now;model.label.style.opacity='0';model.fx.style.display='none';model.ring.visible=false;}
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
  /** HD: muros altos de ladrillo al fondo y decorado (huesos, calaveras, velas, cascotes, charcos). */
  function dressStage(palette,mode,walls,holes,w,h){
    const brick=tileMaterial(mode,0,WALL_ROW),brick2=tileMaterial(mode,2,WALL_ROW);
    const tall=(x,z,alongX)=>{
      for(let k=0;k<3;k++){
        const c=piece(stage,'cube','#3a3d50',x,.3+k*.55,z,alongX?1:.3,.55,alongX?.3:1);
        if(brick){c.material=k%2?brick2:brick;c.castShadow=true;}
      }
      const cap=piece(stage,'cube','#2a2c3a',x,1.95,z,alongX?1.04:.38,.12,alongX?.38:1.04);cap.castShadow=true;
    };
    for(let x=0;x<w;x++){if(!holes.has(x)){const c=logical(state,x);tall(c.x,c.z-.65,true);}}
    for(let z=0;z<h;z++){if(!holes.has(z*w)){const c=logical(state,z*w);tall(c.x-.65,c.z,false);}}
    let candles=0;
    // Siempre el mismo número de luces en escena: si cambia, Three.js recompila TODOS los shaders, y eso
    // congelaba unos segundos la entrada a cada combate (cada mapa traía un número distinto de velas).
    for(let pos=0;pos<w*h;pos++){
      if(walls.has(pos)||holes.has(pos)||state.water?.includes(pos)||state.traps?.some(t=>t.pos===pos))continue;
      const v=random(state.mapSeed,pos+5003),c=logical(state,pos),ox=(random(state.mapSeed,pos+71)-.5)*.5,oz=(random(state.mapSeed,pos+13)-.5)*.5;
      if(v<.05){                                  // huesos y calavera
        for(let i=0;i<3;i++){const b=piece(stage,'cube','#d9cfb8',c.x+ox+(i-1)*.1,.03,c.z+oz,.22,.04,.05);b.rotation.y=v*40+i;b.castShadow=true;}
        if(v<.025){const sk=piece(stage,'orb','#e6dcc4',c.x+ox,.09,c.z+oz+.15,.16,.13,.16);sk.castShadow=true;piece(stage,'cube','#201a1a',c.x+ox-.03,.1,c.z+oz+.23,.03,.03,.01);piece(stage,'cube','#201a1a',c.x+ox+.03,.1,c.z+oz+.23,.03,.03,.01);}
      }else if(v<.075&&candles<7){                 // velas con su propia luz
        candles++;
        for(const [dx,dz,hh] of [[0,0,.22],[.09,.05,.15],[-.07,.08,.11]]){
          const cdl=piece(stage,'column','#e8dcc0',c.x+ox+dx,hh/2,c.z+oz+dz,.06,hh,.06);cdl.castShadow=true;
          piece(stage,'gem','#ffcf6b',c.x+ox+dx,hh+.04,c.z+oz+dz,.05,.09,.05,true);
        }
        const l=new T.PointLight('#ffb15a',5,3.2,2);l.position.set(c.x+ox,.45,c.z+oz);stage.add(l);torchLights.push(l);
        const halo=piece(stage,'orb','#ffb15a',c.x+ox,.28,c.z+oz,.45,.45,.45,true);
        halo.material=new T.MeshBasicMaterial({color:'#ffb15a',transparent:true,opacity:.12,depthWrite:false,blending:T.AdditiveBlending});
      }else if(v<.11){                             // cascotes
        for(let i=0;i<4;i++){const r=piece(stage,'cube',palette[i%palette.length],c.x+ox+(random(state.mapSeed,pos+i)-.5)*.4,.04,c.z+oz+(random(state.mapSeed,pos+i+9)-.5)*.4,.09+.05*i%2,.07,.08);r.rotation.y=i*1.3;r.castShadow=true;}
      }else if(v<.13&&mode==='crypt'){             // charco que refleja las luces
        const p=piece(stage,'disc','#2a3448',c.x+ox*.5,.006,c.z+oz*.5,.42,.004,.3);
        p.material=new T.MeshStandardMaterial({color:'#3a4660',roughness:.12,metalness:.35,transparent:true,opacity:.7});
      }
    }
    for(;candles<7;candles++){const l=new T.PointLight('#ffb15a',0,3.2,2);l.position.set(0,-6,0);stage.add(l);}
    // Luces de los héroes: un juego fijo de 4 que sigue a cada héroe vivo (ver draw), por el mismo motivo.
    heroLamps.length=0;
    for(let i=0;i<4;i++){const l=new T.PointLight('#ffe6c4',0,2.6,2);l.position.set(0,-6,0);stage.add(l);heroLamps.push(l);}
  }
  function rebuild(){
    if(dust){dust.geometry.dispose();dust.material.dispose();dust=null;}
    for(const id of models.keys())removeModel(id);
    clearTransient();
    stage.clear();
    routeGroup.clear();
    stage.add(routeGroup);
    routeSignature='';
    clearArea();stage.add(areaGroup);
    snareGroup.clear();stage.add(snareGroup);snareSignature='';
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
    // HD: ambiente oscuro y frío; la luz importante la ponen las antorchas y velas.
    if(deluxe){sky.intensity*=.55;key.intensity*=.5;key.color.set('#c9d2f2');fill.intensity*=.55;fill.color.set('#8c86b8');scene.fog.color.set('#05040a');}
    const palette=tilesets[mode]||tilesets.crypt;
    // HD: piedra con grano en sarcófagos, columnas y escombros (solo biomas de piedra).
    useObstacleTexture(deluxe&&tileFiles[mode]?(propTexture??=new T.TextureLoader().load('tiles/props.png')):null);
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
      if(!state.water?.includes(pos)){
        // Juntas: antes cada losa era un bloque con una ranura honda alrededor; con una luz baja cerca, las caras
        // laterales se iluminaban y la ranura quedaba negra, como si las losas estuvieran muy separadas.
        // Ahora la ranura es poco profunda: debajo hay una capa de mortero casi a ras del suelo.
        const slab=piece(stage,'cube',color,coord.x,-.057,coord.z,.963,.114,.963);
        piece(stage,'cube',groutColor[mode]||'#2b2633',coord.x,-.03,coord.z,1,.036,1);
        // Con tileset: la losa lleva su dibujo (variante y giro según la semilla).
        const r=random(state.mapSeed,pos+911);
        // De más sana a más rota: las sanas salen mucho más a menudo.
        let n=0,acc=r*FLOOR_WEIGHT_TOTAL;while(n<FLOOR_TILES-1&&(acc-=FLOOR_WEIGHTS[n])>0)n++;
        const top=tileMaterial(mode,n%TILE_COLS,Math.floor(n/TILE_COLS));
        if(top){slab.material=top;slab.rotation.y=Math.floor(random(state.mapSeed,pos+37)*4)*Math.PI/2;}
      }
      const x=pos%w,z=Math.floor(pos/w);
      if(!ground(x-1,z)||!ground(x+1,z)||!ground(x,z-1)||!ground(x,z+1)){
        piece(stage,'cube',ink,coord.x,-.24,coord.z,1,.36,1);
        if(!ground(x,z-1)){
          const side=piece(stage,'cube',palette[(pos+2)%palette.length],coord.x,.21,coord.z-.51,.97,.40,.23);
          const sm=tileMaterial(mode,pos%4,WALL_ROW);if(sm)side.material=sm;
          exposed.push([coord.x,coord.z-.55]);
        }
        if(!ground(x-1,z)&&pos%4!==2){
          const side=piece(stage,'cube',palette[pos%palette.length],coord.x-.52,.17,coord.z,.22,.34,.96);
          const sm=tileMaterial(mode,(pos+1)%4,WALL_ROW);if(sm)side.material=sm;
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
    if(deluxe)dressStage(palette,mode,walls,holes,w,h);
    const placement=[.09,.49,.87].map(f=>exposed[Math.floor(exposed.length*f)]);
    placement.forEach(([x,z],index)=>{
      piece(stage,'column','#475264',x,.52,z,.34,1.13,.34);
      piece(stage,'column','#b18a65',x,1.13,z,.31,.17,.31);
      const color=biomeLight[mode]||'#ffb46b';
      const flame=piece(stage,'gem',color,x,1.34,z,.22,.37,.22,true);
      torches.push(flame);
      const light=new T.PointLight(color,deluxe?34:14,deluxe?11:6,2);
      light.position.set(x,1.47,z);
      if(deluxe){light.castShadow=true;light.shadow.mapSize.set(512,512);light.shadow.bias=-.004;light.shadow.radius=3;}
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
  /** Carteles de nombre y vida visibles (el botón del tablero los oculta; los iconos de estado bajan a su sitio). */
  let plates=true;
  /** Crea el cartel de nombre y vida de una unidad y su capa de iconos de estado. */
  function makeLabel(u){
    const label=document.createElement('div');
    label.className='iso-label'+(u.enemy?' enemy-label':'')+(u.boss?' boss-label':'')+(u.minion?' minion-label':'');
    const tint=!u.enemy&&playerColors.find(c=>c.id===u.color);
    if(tint)label.style.setProperty('--player',tint.hex);
    const name=document.createElement('span');
    name.textContent=u.name;
    // Barra de vida: relleno, rastro del daño reciente (se encoge con retraso) y 3 marcas que la parten en cuartos.
    const hp=document.createElement('div');hp.className='np-bar';
    const lag=document.createElement('b');lag.className='np-lag';
    const fill=document.createElement('i');fill.className='np-fill';
    hp.append(lag,fill);
    // Estados encima del nombre (iconos con ficha al pasar el ratón; los dibuja el cliente).
    // Van en su propia capa, por encima de todos los nombres, para que ningún otro cartel los tape.
    const fx=document.createElement('div');fx.className='iso-effects';
    label.append(name,hp);
    labels.append(label);
    badges.append(fx);
    return {label,hp,fx,fxSig:''};
  }
  function sync(next,shouldAnimate){
    state=next;
    const id=state.floor+':'+state.width+':'+state.height+':'+state.mapSeed;
    if(id!==stageKey){
      stageKey=id;
      rebuild();
    }
    const snareSig=JSON.stringify(state.snares||[]);
    if(snareSig!==snareSignature){
      snareSignature=snareSig;
      snareGroup.clear();
      for(const t of state.snares||[]){
        const p=logical(state,t.pos),ice=t.skill==='Tramposa',col=ice?'#9fe8ff':'#9acb4a';
        const mark=new T.Group();mark.position.set(p.x,0,p.z);mark.userData.snare=true;
        piece(mark,'ring',col,0,.06,0,.42,.42,.1,true).rotation.x=-Math.PI/2;
        piece(mark,'disc',ice?'#2a5a78':'#3a4a1a',0,.035,0,.3,.01,.3);
        // Dientes del cepo / pinchos.
        for(let i=0;i<(ice?8:6);i++){const a=i/(ice?8:6)*Math.PI*2,r=ice?.24:.14;piece(mark,'cone',ice?'#e6fbff':'#c8cdd5',Math.cos(a)*r,.08,Math.sin(a)*r,.05,.14,.05,ice);}
        piece(mark,'gem',col,0,.16,0,.09,.09,.09,true);
        snareGroup.add(mark);
      }
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
        // Invocaciones: figura espectral (translúcida y con brillo violeta) para distinguirlas de los monstruos normales.
        if(u.minion)model.root.traverse(o=>{if(o.isMesh&&o.material){o.material.transparent=true;o.material.opacity=.62;o.material.depthWrite=true;if(o.material.emissive){o.material.emissive.set('#7a4cff');o.material.emissiveIntensity=.55;}}});
        if(u.minion)model.baseEmissive=model.materials.map(m=>m.emissive?{color:m.emissive.clone(),intensity:m.emissiveIntensity}:null);
        model.root.position.copy(coords);
        model.root.rotation.y=u.enemy?-.9:.9;
        figures.add(model.root);
        const shadow=piece(figures,'disc','#212538',coords.x,.016,coords.z,.69,.018,.60);
        const ring=piece(shadow,'ring','#ffd895',0,1,0,1.22,1.39,1.36,true);
        ring.geometry=ring.geometry.clone().rotateX(-Math.PI/2);
        model.ring=ring;
        model.shadow=shadow;
        Object.assign(model,makeLabel(u),{unit:u,phase:random(next.mapSeed,u.pos)*Math.PI*2});
        // HD: cada héroe lleva una luz suave encima para no perderse en la penumbra.
        models.set(u.id,model);
      }
      const model=models.get(u.id);
      model.unit=u;
      model.label.classList.toggle('active',next.phase==='combat'&&next.units[next.turn]?.id===u.id);
      model.ring.visible=next.phase==='combat'&&next.units[next.turn]?.id===u.id;
      const ratio=Math.max(0,Math.min(1,u.hp/u.max));
      model.hp.style.setProperty('--hp',(ratio*100)+'%');
      model.label.classList.toggle('low',ratio>0&&ratio<=.3);
      const sig=JSON.stringify(u.effects||{});
      if(sig!==model.fxSig){
        model.fxSig=sig;
        model.fx.replaceChildren(...Object.entries(u.effects||{}).map(([key,st])=>statusRenderer?.(key,st,u)).filter(Boolean));
      }
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
    const route=[],area=[];
    let areaCenter=null,areaElement='fire';const areaHidden=new Set();
    for(const [i,cell] of [...cells].entries()){
      const o=overlays[i];
      if(!o)continue;
      const c=cell.classList;
      const glyph=['damage','poison','slow'].find(kind=>c.contains('glyph-'+kind));
      // Los glifos siempre se ven: por encima de la ruta, del movimiento y del alcance (solo el área del hechizo los tapa).
      const type=c.contains('area-preview')?'area':glyph||(c.contains('route')?'route':c.contains('no-sight')?'blocked':null)||(
        c.contains('aim')?'aim':c.contains('hero-trap-poison')?'snareToxic':c.contains('hero-trap')?'snare':c.contains('cast-range')?'cast':c.contains('walk')?'walk':c.contains('foe-reach')?'foe':c.contains('guard-zone')?'guard':null);
      // Las casillas a las que puedes moverte: casi transparentes, solo el borde, para ver el suelo y los glifos.
      // La ruta ya la dibuja la flecha: sus casillas se ven como las de movimiento.
      if(c.contains('area-preview')){area.push(i);areaElement=cell.dataset.element||areaElement;if(c.contains('area-center'))areaCenter=i;if(c.contains('area-hidden'))areaHidden.add(i);}
      // El área la dibuja su propia capa (una sola forma); la casilla de debajo no se pinta.
      o.visible=!!type&&type!=='area';
      if(type)o.material=type==='walk'||type==='route'?overlayMaterial(overlayColors.walk,1.05,.2,1):
        // Alcance de movimiento de los enemigos: el mismo estilo, en rojo.
        type==='foe'?overlayMaterial('#e0604f',1.05,.2,1):
        // Alcance del hechizo: mismo estilo de esquinas, en celeste (color de los PA); sin línea de visión, gris rojizo.
        type==='cast'?overlayMaterial('#7cc4ff',1.05,.2,1):
        type==='blocked'?overlayMaterial('#a86a78',.8,.12,1,0):
        type==='aim'?overlayMaterial('#9fd8ff',1.15,.26,1):overlayMaterial(overlayColors[type],type==='route'||type==='area'?1.25:glyph?1.6:type.startsWith('snare')?1.5:1,glyph?1.6:type.startsWith('snare')?1.3:1);
      // La casilla entera (los glifos un pelín menos, para que se distingan del suelo resaltado).
      const size=glyph?.96:1;
      o.scale.set(size,1,size);
      if(c.contains('route'))route.push([Number(cell.dataset.step),i]);
    }
    paintAreaShape(area,areaCenter,areaHidden,areaElement);
    route.sort((a,b)=>a[0]-b[0]);
    const signature=route.map(([,pos])=>pos).join(',');
    if(signature===routeSignature)return;
    routeSignature=signature;
    routeGroup.clear();
    const mover=state.units?.[state.turn];
    if(route.length&&mover)routeArrow([mover.pos,...route.map(([,pos])=>pos)]);
  }
  function clearArea(){
    areaGroup.clear();areaSignature='';
  }
  /** Dibuja el área del hechizo como una sola forma (ver areaMaterial); el impacto, con «L» largas. */
  function paintAreaShape(area,center,hidden=new Set(),element='fire'){
    const sig=area.join(',')+'@'+center+'/'+[...hidden].join(',')+element;
    const tone=areaTones[element]||areaTones.fire;
    if(sig===areaSignature)return;
    clearArea();areaSignature=sig;
    if(!area.length)return;
    const w=state.width,h=state.height;
    const origin=center??area[0];
    // Las casillas tapadas (hechizos que necesitan visión desde el impacto) no forman parte de la forma.
    const shape=new Set(area.filter(pos=>!hidden.has(pos)));
    const inShape=(x,z)=>x>=0&&x<w&&z>=0&&z<h&&shape.has(z*w+x);
    for(const pos of area){
      const p=logical(state,pos),x=pos%w,z=Math.floor(pos/w);
      let material;
      if(hidden.has(pos))material=overlayMaterial('#a86a78',.8,.12,1,0);
      else{
        // Columna → x del mundo, fila → z.
        const e=[!inShape(x+1,z),!inShape(x-1,z),!inShape(x,z+1),!inShape(x,z-1)].map(Number);
        const corners=[e[0]&&e[2],e[1]&&e[2],e[0]&&e[3],e[1]&&e[3]].map(Number);
        const steps=Math.abs(x-origin%w)+Math.abs(z-Math.floor(origin/w));
        // El relleno baja con la distancia al impacto, como el daño (−20 % por casilla, mínimo 60 %).
        material=areaMaterial(tone[0],e,corners,+(Math.max(.6,1-.2*steps)*1.05).toFixed(2));
      }
      const mesh=new T.Mesh(flatTile,material);
      mesh.position.set(p.x,.026,p.z);mesh.renderOrder=6;
      // Impacto: «L» largas con su propio latido, como la casilla de destino del movimiento.
      if(pos===origin&&center!=null){
        const mark=new T.Mesh(flatTile,overlayMaterial(tone[1],1.1,0,1,.85,.3,2.2,.7));
        mark.position.set(p.x,.03,p.z);mark.renderOrder=7;areaGroup.add(mark);
      }
      areaGroup.add(mesh);
    }
  }
  /**
   * Ruta de movimiento: un surco hundido en las losas que sigue el camino, se curva en los giros y acaba en punta
   * en la casilla apuntada. Fondo oscuro + borde fino verde iluminado; un destello recorre el borde hacia el destino.
   */
  function routeArrow(cells){
    const pts=cells.map(pos=>{const p=logical(state,pos);return new T.Vector2(p.x,p.z);});
    pts[0]=pts[0].clone().lerp(pts[1],.42);
    const path=[pts[0]];
    for(let i=1;i<pts.length-1;i++){
      const a=pts[i-1],b=pts[i],c=pts[i+1];
      const straight=Math.abs((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x))<1e-6;
      if(straight){path.push(b);continue;}
      const m1=a.clone().lerp(b,i===1?.4:.5),m2=b.clone().lerp(c,.5);
      for(let k=0;k<=8;k++){const t=k/8,u=1-t;path.push(new T.Vector2(u*u*m1.x+2*u*t*b.x+t*t*m2.x,u*u*m1.y+2*u*t*b.y+t*t*m2.y));}
    }
    const end=pts.at(-1),dir=end.clone().sub(pts.at(-2)).normalize();
    const tipLen=.42,tipBase=end.clone().addScaledVector(dir,.22-tipLen),tip=end.clone().addScaledVector(dir,.24);
    path.push(tipBase);
    const basePath=path;
    const lengths=[0];for(let i=1;i<path.length;i++)lengths.push(lengths[i-1]+path[i].distanceTo(path[i-1]));
    const total=lengths.at(-1)+tipLen;
    // Cinta con punta; «along» = distancia recorrida (para el destello que viaja).
    const ribbon=(width,y,material,order,shift=0)=>{
      const pos=[],along=[],idx=[];
      // Las capas interiores se meten un poco en la punta para que no quede una raya verde entre cuerpo y punta.
      const path=[...basePath.slice(0,-1),basePath.at(-1).clone().addScaledVector(dir,(.4-width)*1.4)];
      for(let i=0;i<path.length;i++){
        const p=path[i],q=path[Math.min(path.length-1,i+1)],o=path[Math.max(0,i-1)];
        const t=q.clone().sub(o).normalize(),n=new T.Vector2(-t.y,t.x);
        const c=p.clone().addScaledVector(n,shift);
        pos.push(c.x+n.x*width/2,y,c.y+n.y*width/2,c.x-n.x*width/2,y,c.y-n.y*width/2);along.push(lengths[i],lengths[i]);
        if(i)idx.push((i-1)*2,(i-1)*2+1,i*2,(i-1)*2+1,i*2+1,i*2);
      }
      // Punta: el mismo triángulo para todas las capas, encogido hacia su incentro para que el borde verde
      // tenga el mismo grosor en los tres lados.
      const side=new T.Vector2(-dir.y,dir.x),b=pos.length/3;
      const A=tipBase.clone().addScaledVector(side,.46),B=tipBase.clone().addScaledVector(side,-.46),C=tip.clone();
      const la=B.distanceTo(C),lb=A.distanceTo(C),lc=A.distanceTo(B),per=la+lb+lc;
      const inc=new T.Vector2((A.x*la+B.x*lb+C.x*lc)/per,(A.y*la+B.y*lb+C.y*lc)/per);
      const area=Math.abs((B.x-A.x)*(C.y-A.y)-(C.x-A.x)*(B.y-A.y))/2,r=2*area/per;
      const k=Math.max(.05,(r-(.4-width)/2)/r);
      const [a2,b2,c2]=[A,B,C].map(v=>inc.clone().add(v.clone().sub(inc).multiplyScalar(k)).addScaledVector(side,shift));
      pos.push(a2.x,y,a2.y,b2.x,y,b2.y,c2.x,y,c2.y);
      along.push(lengths.at(-1),lengths.at(-1),total);
      idx.push(b,b+1,b+2);
      const g=new T.BufferGeometry();
      g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('along',new T.Float32BufferAttribute(along,1));g.setIndex(idx);
      const m=new T.Mesh(g,material);m.renderOrder=order;routeGroup.add(m);
    };
    grooveRim.uniforms.total.value=total;
    ribbon(.4,.05,grooveRim,3);              // borde verde (lo que asoma alrededor del surco)
    ribbon(.31,.053,grooveDeep,4);           // fondo oscuro del surco
    ribbon(.2,.056,grooveFloor,5,.03);       // fondo algo más claro, desplazado: da sensación de profundidad
    // Casilla de destino: esquinas más largas y brillantes con su propio latido rápido.
    const goal=new T.Mesh(destinationPlane,overlayMaterial('#8dffb4',1.05,0,1,.85,.3,2.2,.7));
    goal.position.set(end.x,.046,end.y);goal.renderOrder=2;routeGroup.add(goal);
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
  /**
   * Prepara los shaders antes del primer combate: monta en segundo plano un escenario de prueba (con las mismas
   * luces que uno real) y lo compila sin bloquear la página. Sin esto, el primer mapa tardaba unos segundos.
   */
  let warmed=false;
  function warm(biome='crypt'){
    if(warmed||active||state)return;
    warmed=true;
    const units=['guardia','tirador','mago','mistico','sombra'].map((c,i)=>({id:'w'+i,classId:c,name:'',hp:1,max:1,pos:8+i,effects:{},color:'p1'}))
      .concat(['skeleton','bat','slug'].map((l,i)=>({id:'e'+i,look:l,enemy:true,name:'',hp:1,max:1,pos:20+i,effects:{}})));
    try{
      sync({floor:-1,width:6,height:6,mapSeed:7,biome,walls:[14],water:[27],voids:[],traps:[],snares:[],units,phase:'combat',turn:0},()=>false);
      const done=()=>{if(active||state?.floor!==-1)return;
        // Un dibujado de prueba (fuera de pantalla) termina de preparar las sombras y sube las texturas.
        try{renderer.setRenderTarget(pixels);renderer.render(scene,camera);renderer.setRenderTarget(null);}catch{}for(const id of [...models.keys()])removeModel(id);state=null;stageKey='';};
      // Se compila contra el mismo destino que el dibujo real (la textura de píxeles): si no, los shaders salen distintos.
      renderer.setRenderTarget(pixels);
      const job=renderer.compileAsync?renderer.compileAsync(scene,camera):Promise.resolve(renderer.compile(scene,camera));
      renderer.setRenderTarget(null);
      job.catch(()=>{}).finally(done);
    }catch{state=null;stageKey='';}
  }
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
    if(event.blink&&event.style==='bolt'){
      // Balestra: desaparece en un relámpago y reaparece detrás del objetivo.
      const end=points.at(-1),time=performance.now();
      for(const [p,d] of [[points[0],0],[end,120]]){skybolt(p,'#fff36b',{start:time+d});sparks(p,volt,{start:time+d,n:8});}
      model.root.visible=false;
      return new Promise(resolve=>setTimeout(()=>{model.root.position.copy(end);model.root.visible=true;model.hurt=null;resolve();},150));
    }
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
    if(event.style==='leap'){
      // Salto valiente: vuela en parábola dejando un reguero de ascuas.
      const a=points[0],b=points.at(-1),start=performance.now(),dur=reduced?260:460;
      model.root.position.copy(a);
      model.root.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);
      return new Promise(resolve=>steps.set(event.unit,{points:[a,b],elapsed:0,first:true,resolve,speed:dur,arc:1.6,trail:['#ff7a2e','#ffd36b']}));
    }
    model.root.position.copy(points[0]);
    // Empujones y cargas: deslizamiento rápido (sin pasos) con estela de polvo o de energía.
    const rush=event.rush?{speed:event.style==='charge'?75:95,trail:event.style==='charge'?['#c9d6ff','#ffffff']:['#b8a890','#8a7d6a']}:{};
    return new Promise(resolve=>steps.set(event.unit,{points,elapsed:0,first:true,resolve,...rush}));
  }

  // ── Efectos propios por habilidad (Valkyria): trazos, impactos, chispas y temblor de cámara. ──
  let shake=null;
  const quake=(power,ms=260)=>{if(!reduced)shake={start:performance.now(),power,ms};};
  /** Pieza brillante con material propio (para poder desvanecerla) y mezcla aditiva. */
  function glowPiece(shape,color,x,y,z,sx,sy,sz,opacity=1,shade=false){
    const mesh=piece(transient,shape,color,x,y,z,sx,sy,sz,true);
    mesh.material=new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:shade?T.NormalBlending:T.AdditiveBlending});
    mesh.visible=false;
    return mesh;
  }
  const add=(mesh,start,duration,update)=>effects.push({mesh,start,duration,update});
  const at=(pos,y=0)=>{const p=logical(state,pos);p.y=y;return p;};
  /** Trazo recto de a a b: se dibuja deprisa y luego se apaga (el recorrido del golpe). */
  function streak(a,b,color,{start=performance.now(),dur=320,width=.12,grow=.3,y=null}={}){
    const A=a.clone(),B=b.clone();if(y!==null){A.y=y;B.y=y;}
    const len=A.distanceTo(B)||.01;
    for(const [w,col,o] of [[width*2.6,color,.35],[width,'#ffffff',.95]]){
      const m=glowPiece('cube',col,A.x,A.y,A.z,w,w*.6,len,o);
      m.lookAt(B);
      add(m,start,dur,(t)=>{
        const g=Math.min(1,t/grow);
        m.scale.z=len*g;m.position.lerpVectors(A,B,g/2);
        m.material.opacity=o*(t<grow?1:1-(t-grow)/(1-grow));
        m.scale.x=m.scale.y=w*(1-t*.5);
      });
    }
  }
  /** Onda en el suelo que se abre y se apaga. */
  function shock(p,color,{start=performance.now(),dur=420,size=1,y=.06,thick=1}={}){
    const m=glowPiece('ring',color,p.x,y,p.z,.4,.4,.4*thick,.9);
    m.rotation.x=-Math.PI/2;
    add(m,start,dur,t=>{const k=.3+size*1.9*Math.sin(t*Math.PI/2);m.scale.set(k,k,k*thick);m.material.opacity=.95*(1-t);});
    const d=glowPiece('disc',color,p.x,y-.01,p.z,.2,.01,.2,.35);
    add(d,start,dur*.7,t=>{const k=.2+size*1.6*t;d.scale.set(k,.01,k);d.material.opacity=.4*(1-t);});
  }
  /** Chispas que saltan desde un punto. */
  function sparks(p,colors,{start=performance.now(),n=10,spread=.6,high=.7,dur=420,size=.1,y=.35}={}){
    for(let i=0;i<(reduced?Math.ceil(n/3):n);i++){
      const a=Math.random()*Math.PI*2,r=spread*(.5+Math.random()*.6),h=high*(.5+Math.random()*.7);
      const m=glowPiece('gem',colors[i%colors.length],p.x,y,p.z,size,size,size);
      add(m,start+Math.random()*40,dur*(.7+Math.random()*.5),t=>{
        m.position.set(p.x+Math.cos(a)*r*t,y+Math.sin(t*Math.PI)*h-t*.15,p.z+Math.sin(a)*r*t);
        m.scale.setScalar(size*(1-t));m.rotation.y=t*9;
      });
    }
  }
  /** Rayo quebrado de a a b que parpadea. */
  function bolt(a,b,color='#fff6a8',{start=performance.now(),dur=260,segments=6,jitter=.22}={}){
    const pts=[a.clone()];
    for(let i=1;i<segments;i++){const q=a.clone().lerp(b,i/segments);q.x+=(Math.random()-.5)*jitter*2;q.z+=(Math.random()-.5)*jitter*2;q.y+=(Math.random()-.5)*jitter;pts.push(q);}
    pts.push(b.clone());
    for(let i=0;i<pts.length-1;i++){
      const A=pts[i],B=pts[i+1],len=A.distanceTo(B);
      for(const [w,col,o] of [[.2,color,.55],[.07,'#ffffff',1]]){
        const m=glowPiece('cube',col,(A.x+B.x)/2,(A.y+B.y)/2,(A.z+B.z)/2,w,w,len,o);
        m.lookAt(B);
        add(m,start,dur,t=>{m.visible=!(t>.22&&t<.3)&&!(t>.6&&t<.66);m.material.opacity=o*(1-t*.7);});
      }
    }
  }
  /** Rayo que cae del cielo sobre una casilla. */
  const skybolt=(p,color,opts={})=>{bolt(new T.Vector3(p.x+.3,3.2,p.z-.3),new T.Vector3(p.x,.05,p.z),color,{segments:7,jitter:.3,...opts});shock(p,color,{start:opts.start,size:.55,dur:300});};
  /** Púa (hielo, agua) que brota del suelo y se hunde. */
  function spike(p,color,{start=performance.now(),dur=520,h=.9,w=.22,tilt=0}={}){
    const m=glowPiece('cone',color,p.x,0,p.z,w,.01,w,.9);
    m.rotation.z=tilt;
    const core=glowPiece('cone','#ffffff',p.x,0,p.z,w*.35,.01,w*.35,.45);
    add(m,start,dur,t=>{const k=t<.25?t/.25:t<.7?1:1-(t-.7)/.3;m.scale.y=h*Math.max(.01,k);m.position.y=h*k/2;m.material.opacity=.9*Math.min(1,k*1.4);});
    add(core,start,dur,t=>{const k=t<.25?t/.25:t<.7?1:1-(t-.7)/.3;core.scale.y=h*.7*Math.max(.01,k);core.position.y=h*.35*k;});
  }
  /** Lenguas de fuego que suben y se apagan. */
  function flames(p,{start=performance.now(),n=5,radius=.25,h=.7,dur=560}={}){
    for(let i=0;i<(reduced?2:n);i++){
      const a=i/n*Math.PI*2+Math.random(),r=radius*Math.random();
      const x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;
      for(const [col,w,k] of [['#ff5a1f',.2,1],['#ffd36b',.1,.6]]){
        const m=glowPiece('cone',col,x,0,z,w,.01,w,.95);
        const d=Math.random()*80;
        add(m,start+d,dur,t=>{const f=Math.sin(t*Math.PI)*(.85+.3*Math.sin(t*40+i));m.scale.y=h*k*Math.max(.01,f);m.position.y=h*k*f/2+.02;m.material.opacity=.95*(1-t*.5);});
      }
    }
  }
  /** Esfera (cúpula) que se hincha y se apaga. */
  function dome(p,color,{start=performance.now(),dur=520,size=1.2,y=.4,opacity=.35}={}){
    const m=glowPiece('orb',color,p.x,y,p.z,.2,.2,.2,opacity);
    add(m,start,dur,t=>{const k=.2+size*Math.sin(t*Math.PI/2);m.scale.set(k,k*.8,k);m.material.opacity=opacity*(1-t);});
  }
  /** Barrido en arco (gemas encendidas en secuencia) alrededor de un centro. */
  function sweep(c,a0,a1,radius,color,{start=performance.now(),dur=360,y=.45,n=14}={}){
    for(let i=0;i<n;i++){
      const a=a0+(a1-a0)*i/(n-1);
      const m=glowPiece('gem',i%3?color:'#ffffff',c.x+Math.cos(a)*radius,y,c.z+Math.sin(a)*radius,.16,.16,.16);
      add(m,start+i*dur*.35/n,dur*.65,t=>{m.scale.setScalar(.2*(1-t));m.position.y=y+t*.1;});
    }
  }
  /** Partículas que viajan de a a b (robo de vida, energía que vuelve). */
  function stream(a,b,color,{start=performance.now(),n=6,dur=420,y=.6,size=.11}={}){
    for(let i=0;i<(reduced?2:n);i++){
      const off=(Math.random()-.5)*.5,m=glowPiece('orb',color,a.x,y,a.z,size,size,size);
      add(m,start+i*45,dur,t=>{m.position.lerpVectors(a,b,t);m.position.y=y+Math.sin(t*Math.PI)*(.35+off);m.position.x+=Math.sin(t*Math.PI)*off;m.scale.setScalar(size*(1-t*.4));});
    }
  }
  /** Lanza que vuela recta y deja estela. */
  function javelin(a,b,color,{start=performance.now(),dur=200,y=.62}={}){
    const A=a.clone(),B=b.clone();A.y=B.y=y;
    const m=glowPiece('cone','#f4f6ff',A.x,y,A.z,.09,.75,.09,1);
    const dir=B.clone().sub(A).normalize();
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir);
    let last=0;
    add(m,start,dur,(t,now)=>{m.position.lerpVectors(A,B,t);
      if(now-last>18&&!reduced){last=now;const q=m.position;const sp=glowPiece('gem',color,q.x,q.y,q.z,.12,.12,.12,.9);add(sp,now,240,u=>{sp.scale.setScalar(.12*(1-u));sp.material.opacity=.9*(1-u);});}});
  }
  /** Flecha física: astil, punta y plumas. Vuela recta o en parábola; deja estela. Devuelve cuándo llega (ms). */
  function arrowFlight(a,b,{start=performance.now(),speed=.045,arc=0,curve=0,tip='#e9edf5',trail=null,y=.75,size=1}={}){
    const A=a.clone(),B=b.clone();A.y=y;B.y=.55;
    const dist=A.distanceTo(B),dur=Math.max(120,dist/speed*(arc?1.5:1));
    const g=new T.Group();g.visible=false;transient.add(g);
    piece(g,'cube','#7a5435',0,0,-.18*size,.035*size,.035*size,.62*size);
    piece(g,'cone',tip,0,0,.17*size,.07*size,.16*size,.07*size).rotation.x=Math.PI/2;
    for(const k of [-1,1])piece(g,'cube','#f2ecd8',.03*k*size,0,-.45*size,.012,.07*size,.12*size);
    const side=new T.Vector3(B.z-A.z,0,A.x-B.x).normalize();
    const at=t=>{const p=A.clone().lerp(B,t);p.y+=Math.sin(t*Math.PI)*arc;p.addScaledVector(side,Math.sin(t*Math.PI)*curve);return p;};
    let last=0;
    effects.push({mesh:g,start,duration:dur,update:(t,now)=>{
      const p=at(t),q=at(Math.min(1,t+.02));
      g.position.copy(p);if(q.distanceToSquared(p)>1e-6)g.lookAt(q);
      if(trail&&!reduced&&now-last>16){last=now;const c=trail[Math.floor(Math.random()*trail.length)];
        const sp=glowPiece('gem',c,p.x,p.y,p.z,.11,.11,.11,.9);add(sp,now,300,u=>{sp.scale.setScalar(.12*(1-u));sp.material.opacity=.9*(1-u);sp.position.y-=.002;});}
    }});
    return start+dur;
  }
  /** Flecha que sube recta al cielo desde el arquero y luego cae vertical sobre el objetivo. */
  function skyArrow(a,b,{start=performance.now(),tip='#e9edf5',trail=null}={}){
    const up=a.clone();up.y=.8;const top=a.clone();top.y=6;
    arrowFlight(up,top,{start,speed:.05,tip,trail,y:.8});
    const high=b.clone();high.y=6;
    const fall=start+260;
    const g=new T.Group();g.visible=false;transient.add(g);
    piece(g,'cube','#7a5435',0,0,-.18,.04,.04,.7);piece(g,'cone',tip,0,0,.18,.08,.18,.08).rotation.x=Math.PI/2;
    for(const k of [-1,1])piece(g,'cube','#f2ecd8',.03*k,0,-.47,.012,.08,.13);
    let last=0;
    effects.push({mesh:g,start:fall,duration:220,update:(t,now)=>{
      g.position.set(b.x,6-5.6*t*t,b.z);g.lookAt(b.x,-10,b.z);
      if(trail&&!reduced&&now-last>16){last=now;const sp=glowPiece('gem',trail[0],b.x,g.position.y+.3,b.z,.13,.13,.13);add(sp,now,280,u=>{sp.scale.setScalar(.13*(1-u));});}
    }});
    return fall+220;
  }
  /** Nube tóxica: orbes verdes que suben y se dispersan. */
  function cloud(p,colors,{start=performance.now(),n=10,size=.9,dur=800}={}){
    for(let i=0;i<(reduced?3:n);i++){
      const a=Math.random()*Math.PI*2,r=Math.random()*size*.6;
      const m=glowPiece('orb',colors[i%colors.length],p.x,.3,p.z,.2,.2,.2,.55);
      add(m,start+Math.random()*120,dur,t=>{const k=.15+size*.35*Math.sin(t*Math.PI*.8);m.scale.setScalar(k);
        m.position.set(p.x+Math.cos(a)*(r+t*size*.5),.3+t*.7,p.z+Math.sin(a)*(r+t*size*.5));m.material.opacity=.55*(1-t);});
    }
  }
  const toxic=['#8cff5a','#b8ff7a','#4fae2a'],sick=['#9acb4a','#b06ad0','#6a8a2a'];
  /** Cuánto esperar: hasta que la flecha llega (más un respiro para el impacto). */
  const hold=(time,land)=>Math.max(0,land-time)+40;
  const fire=['#ff6a2b','#ffb347','#ffe9a8'],volt=['#fff36b','#9fd8ff','#ffffff'],frost=['#a8f0ff','#4fb6e0','#ffffff'];
  /** Coreografías de cada habilidad: ctx = {from, target, area (vectores), time, travel}. */
  const skillFx={
    'Estocada':({from,target,area,time})=>{
      const far=area.reduce((m,p)=>p.distanceTo(from)>m.distanceTo(from)?p:m,target);
      streak(from,far,'#ff7a2e',{start:time+90,dur:300,width:.14,y:.6});
      area.forEach((p,i)=>{const t0=time+130+i*45;flames(p,{start:t0,n:3,h:.55});sparks(p,fire,{start:t0,n:8});shock(p,'#ff9a4a',{start:t0,size:.5,dur:300});});
      setTimeout(()=>quake(.06),130);
    },
    'Lanza del lago':({from,target,area,time})=>{
      streak(from,target,'#6fc8ff',{start:time+80,dur:260,width:.1,y:.55});
      const order=[...area].sort((a,b)=>a.distanceTo(from)-b.distanceTo(from));
      order.forEach((p,i)=>{const t0=time+180+i*55;spike(p,'#7fd4ff',{start:t0,h:.8});sparks(p,['#bfefff','#6fc8ff'],{start:t0,n:6,high:.9});});
      order.slice(-3).forEach((p,i)=>skybolt(p,'#fff36b',{start:time+260+i*70}));
      order.forEach((p,i)=>stream(p,from,'#9fe0ff',{start:time+520+i*20,n:2,dur:300,size:.08}));
    },
    'En guardia!':({from,area,time})=>{
      dome(from,'#ffd87a',{start:time+60,size:1.3,dur:620,opacity:.4});
      shock(from,'#ffd87a',{start:time+120,size:2.4,dur:650,thick:2});
      area.forEach((p,i)=>{const m=glowPiece('gem','#ffe7a0',p.x,.05,p.z,.12,.12,.12);add(m,time+160+i*15,500,t=>{m.position.y=.05+t*.6;m.scale.setScalar(.14*(1-t));});});
      quake(.04,200);
    },
    'Punzón':({from,target,time})=>{
      streak(from,target,'#ffe8e8',{start:time+60,dur:260,width:.09,grow:.4,y:.62});
      sparks(target,['#c8203a','#ff6b7f','#ffffff'],{start:time+150,n:10,size:.08,y:.6});
      stream(target,from,'#7dff96',{start:time+280,n:5});
    },
    'Liberación':({from,area,time})=>{
      dome(from,'#ffb347',{start:time,size:.8,dur:250,opacity:.6});
      shock(from,'#ffcf6b',{start:time+160,size:2.6,dur:520,thick:2});shock(from,'#ff5a1f',{start:time+230,size:2,dur:480});
      area.forEach((p,i)=>{const t0=time+180+p.distanceTo(from)*70;flames(p,{start:t0,n:3,h:.5});sparks(p,fire,{start:t0,n:4});});
      setTimeout(()=>quake(.1,320),170);
    },
    'Pies ligeros':({from,time})=>{
      for(let i=0;i<(reduced?5:18);i++){const a0=i/18*Math.PI*2*2;const m=glowPiece('gem',i%3?'#7dff9e':'#ffffff',from.x,.1,from.z,.18,.18,.18);
        add(m,time+i*22,760,t=>{const a=a0+t*8;m.position.set(from.x+Math.cos(a)*.5*(1-t*.4),.05+t*1.3,from.z+Math.sin(a)*.5*(1-t*.4));m.scale.setScalar(.2*(1-t));});}
      shock(from,'#8dffb0',{start:time,size:.8,dur:450,thick:2});dome(from,'#7dff9e',{start:time,size:.7,dur:380,opacity:.3});
      for(const k of [-1,1]){const m=glowPiece('cone','#ffffff',from.x+k*.35,.5,from.z,.12,.5,.12,.8);m.rotation.z=k*1.1;add(m,time+120,450,t=>{m.position.y=.5+t*.5;m.material.opacity=.8*(1-t);});}
    },
    'Balestra':({from,target,time})=>{
      bolt(new T.Vector3(from.x,.6,from.z),new T.Vector3(target.x,.6,target.z),'#fff36b',{start:time+40,dur:420,jitter:.2,segments:8});
      dome(from,'#fff36b',{start:time,size:.6,dur:200,opacity:.6});
      sparks(target,volt,{start:time+200,n:12});shock(target,'#9fd8ff',{start:time+200,size:.7});
    },
    'Salto valiente':({from,target,area,time})=>{
      shock(from,'#ffb347',{start:time,size:.6,dur:300});
      const land=time+480;
      shock(target,'#ffcf6b',{start:land,size:2.2,dur:520,thick:2});dome(target,'#ff7a2e',{start:land,size:1,dur:300,opacity:.5});
      area.forEach(p=>{const t0=land+p.distanceTo(target)*60;flames(p,{start:t0,n:2,h:.45});sparks(p,fire,{start:t0,n:4});});
      setTimeout(()=>quake(.12,340),480);
    },
    'Carga heroica':({from,target,time,travel})=>{
      dome(from,'#9fb4ff',{start:time,size:.6,dur:220,opacity:.6});
      const hitAt=time+Math.max(0,travel-1)*75+60;
      sparks(target,volt,{start:hitAt,n:14,spread:.8});shock(target,'#c9d6ff',{start:hitAt,size:1,dur:380});skybolt(target,'#fff36b',{start:hitAt});
      setTimeout(()=>quake(.1,300),hitAt-time);
    },
    'Abrir las aguas':({from,target,area,time})=>{
      streak(from,target,'#a8f0ff',{start:time+60,dur:240,width:.08,y:.5});
      shock(target,'#bff4ff',{start:time+180,size:1.2,dur:500});
      const order=[...area].sort((a,b)=>a.distanceTo(target)-b.distanceTo(target));
      order.forEach((p,i)=>{const t0=time+200+i*60;spike(p,'#9fe8ff',{start:t0,h:1,w:.26,tilt:(Math.random()-.5)*.3});sparks(p,frost,{start:t0,n:6});});
      setTimeout(()=>quake(.07,260),200);
    },
    'Lanza cargada':({from,target,time})=>{
      for(let i=0;i<3;i++){const a0=i/3*Math.PI*2;const m=glowPiece('orb','#fff36b',from.x,.7,from.z,.12,.12,.12);add(m,time,260,t=>{const a=a0+t*9;m.position.set(from.x+Math.cos(a)*.35,.7,from.z+Math.sin(a)*.35);m.scale.setScalar(.12*(1-t*.5));});}
      const d=Math.max(140,from.distanceTo(target)*45);
      javelin(from,target,'#fff36b',{start:time+180,dur:d});
      const hit=time+180+d;
      skybolt(target,'#fff36b',{start:hit});sparks(target,volt,{start:hit,n:12});
      setTimeout(()=>quake(.06),hit-time);
    },
    'Barrido':({from,target,area,time})=>{
      const dir=Math.atan2(target.z-from.z,target.x-from.x);
      sweep(from,dir-.9,dir+.9,from.distanceTo(target),'#a8f0ff',{start:time+80,dur:380});
      area.forEach((p,i)=>{const t0=time+140+i*70;spike(p,'#bff4ff',{start:t0,h:.6,tilt:(Math.random()-.5)*.6});sparks(p,frost,{start:t0,n:6});});
    },
    'Lanza abisal':({from,target,time})=>{
      for(let i=0;i<(reduced?4:12);i++){const a0=i/12*Math.PI*2;const m=glowPiece('gem',i%2?'#2f6fd6':'#a8f0ff',target.x,.4,target.z,.13,.13,.13);
        add(m,time+i*12,420,t=>{const a=a0+t*6,r=1.1*(1-t);m.position.set(target.x+Math.cos(a)*r,.4+t*.2,target.z+Math.sin(a)*r);m.scale.setScalar(.14*(1-t*.5));});}
      streak(from,target,'#4f8fe0',{start:time+60,dur:260,width:.1,y:.6});
      spike(target,'#7fd4ff',{start:time+380,h:1.5,w:.4,dur:620});sparks(target,frost,{start:time+380,n:14,high:1.1});
      shock(target,'#2f6fd6',{start:time+380,size:1,dur:450});
      setTimeout(()=>quake(.09,300),380);
    },
    'Eclipse':({from,time})=>{
      // La oscuridad se extiende por el suelo desde la Valkyria y luego se retira.
      const reach=Math.max(state.width,state.height)*1.2;
      const dark=glowPiece('disc','#05020c',from.x,.03,from.z,.2,.01,.2,.75,true);
      add(dark,time,1300,t=>{const k=.2+reach*Math.min(1,t/.35);dark.scale.set(k,.01,k);dark.material.opacity=.7*(t<.6?1:1-(t-.6)/.4);});
      // Borde de la sombra: chispas violetas que avanzan con ella.
      const rim=reduced?12:36;
      for(let i=0;i<rim;i++){const a=i/rim*Math.PI*2;const m=glowPiece('gem',i%3?'#b9a3ff':'#ffffff',from.x,.12,from.z,.16,.16,.16);
        add(m,time,1300*.45,t=>{const r=(.2+reach*Math.min(1,t/.78))/2;m.position.set(from.x+Math.cos(a)*r,.12+Math.sin(t*9+i)*.05,from.z+Math.sin(a)*r);m.scale.setScalar(.17*(1-t*.6));});}
      dome(from,'#8f6bff',{start:time,size:1,dur:500,opacity:.45});
      for(const u of state.units.filter(u=>u.enemy&&u.hp>0)){
        const p=logical(state,u.pos);
        dome(p,'#6a4fd0',{start:time+350+p.distanceTo(from)*35,size:.8,dur:500,y:.9,opacity:.5});
        const m=glowPiece('orb','#2a1650',p.x,1.3,p.z,.3,.3,.3,.9);add(m,time+350,600,t=>{m.scale.setScalar(.35*(1-t));m.position.y=1.3-t*.4;});
      }
      quake(.05,400);
    },
    // ── Arquero: tensa, suelta y la flecha vuela (recta o en parábola). ──
    'Flecha helada':({from,target,time})=>{
      const land=arrowFlight(from,target,{start:time+bowRelease.draw,tip:'#bff4ff',trail:frost});
      spike(target,'#9fe8ff',{start:land,h:.7});sparks(target,frost,{start:land,n:12});shock(target,'#bff4ff',{start:land,size:.6,dur:320});
      return hold(time,land);
    },
    'Flecha Flamígera':({from,target,area,time})=>{
      const far=area.reduce((m,p)=>p.distanceTo(from)>m.distanceTo(from)?p:m,target);
      const land=arrowFlight(from,far,{start:time+bowRelease.draw,speed:.06,tip:'#ffd36b',trail:fire,size:1.2});
      const t0=time+bowRelease.draw;
      streak(from,far,'#ff7a2e',{start:t0,dur:land-t0+260,width:.12,grow:.7,y:.7});
      [...area].sort((a,b)=>a.distanceTo(from)-b.distanceTo(from)).forEach((p,i)=>{const t=t0+(land-t0)*(p.distanceTo(from)/from.distanceTo(far));flames(p,{start:t,n:3,h:.65});sparks(p,fire,{start:t,n:6});});
      setTimeout(()=>quake(.08,260),t0-time);
      return hold(time,land);
    },
    'Detonadora':({from,target,time})=>{
      const land=arrowFlight(from,target,{start:time+bowRelease.draw,tip:'#ff9a4a',trail:['#ff6a2b','#ffd36b']});
      sparks(target,fire,{start:land,n:10});
      const m=glowPiece('orb','#ff4a1a',target.x,.7,target.z,.14,.14,.14,.9);add(m,land,900,t=>{const k=.14+.06*Math.sin(t*30);m.scale.setScalar(k*(1-t*.3));});
      return hold(time,land);
    },
    'Detonación':({target,area,time})=>{
      dome(target,'#ff7a2e',{start:time,size:1.3,dur:420,opacity:.6});dome(target,'#ffe9a8',{start:time,size:.6,dur:260,opacity:.8});
      shock(target,'#ffb347',{start:time+40,size:2.3,dur:520,thick:2});
      sparks(target,fire,{start:time,n:20,spread:1.3,high:1.2});flames(target,{start:time,n:6,radius:.6,h:1});
      area.forEach(p=>{if(p.distanceTo(target)>.1){flames(p,{start:time+120,n:2,h:.5});sparks(p,fire,{start:time+120,n:5});}});
      quake(.14,380);
      return 200;
    },
    'Flecha Repelente':({from,target,time})=>{
      const land=arrowFlight(from,target,{start:time+bowRelease.draw,speed:.07,size:1.25,trail:['#ffffff','#e8e0c8']});
      shock(target,'#fff1cf',{start:land,size:1,dur:360,thick:2});sparks(target,['#ffffff','#e8d8b0'],{start:land,n:14,spread:.9});
      streak(target,target.clone().add(target.clone().sub(from).normalize().multiplyScalar(1.6)),'#fff1cf',{start:land,dur:280,width:.1,y:.6});
      setTimeout(()=>quake(.1,280),land-time);
      return hold(time,land);
    },
    'Ojo de águila':({from,time})=>{
      const eye=glowPiece('ring','#ffd56a',from.x,1.2,from.z,.3,.3,.3,.9);
      add(eye,time+120,700,t=>{const k=.3+t*1.2;eye.scale.set(k,k*.55,k);eye.material.opacity=.9*(1-t);});
      const pupil=glowPiece('orb','#fff1cf',from.x,1.2,from.z,.15,.15,.15,.9);add(pupil,time+120,600,t=>{pupil.scale.setScalar(.18*(1-t));});
      for(let i=0;i<8;i++){const a=i*Math.PI/4;streak(from.clone().setY(1.2),new T.Vector3(from.x+Math.cos(a)*1.6,1.2,from.z+Math.sin(a)*1.6),'#ffd56a',{start:time+200,dur:380,width:.04});}
      return 0;
    },
    'Flecha venenosa':({from,target,time})=>{
      const land=arrowFlight(from,target,{start:time+bowRelease.draw,tip:'#b8ff7a',trail:toxic});
      cloud(target,toxic,{start:land,n:8,size:.8});sparks(target,toxic,{start:land,n:8});
      return hold(time,land);
    },
    'Dardo pestilente':({from,target,time})=>{
      const land=arrowFlight(from,target,{start:time+bowRelease.draw,speed:.07,size:.7,tip:'#d8ff9a',trail:sick});
      cloud(target,sick,{start:land,n:12,size:1});
      const m=glowPiece('ring','#b06ad0',target.x,.08,target.z,.3,.3,.3,.8);m.rotation.x=-Math.PI/2;add(m,land,700,t=>{const k=.3+t*.9;m.scale.set(k,k,k);m.material.opacity=.8*(1-t);});
      return hold(time,land);
    },
    'Congelación prematura':({from,target,area,time})=>{
      const land=skyArrow(from,target,{start:time+bowRelease.sky,tip:'#bff4ff',trail:frost});
      area.forEach((p,i)=>{spike(p,'#9fe8ff',{start:land+i*40,h:.9,w:.26,tilt:(Math.random()-.5)*.4});sparks(p,frost,{start:land,n:7});});
      shock(target,'#bff4ff',{start:land,size:1.4,dur:460,thick:2});dome(target,'#e6fbff',{start:land,size:.6,dur:240,opacity:.7});
      setTimeout(()=>quake(.11,320),land-time);
      return hold(time,land);
    },
    'Ramo helado':({from,target,area,time})=>{
      const land=arrowFlight(from,target,{start:time+bowRelease.draw,tip:'#bff4ff',trail:frost});
      dome(target,'#e6fbff',{start:land,size:.5,dur:220,opacity:.8});
      [...area].sort((a,b)=>a.distanceTo(target)-b.distanceTo(target)).forEach(p=>{
        const t=land+p.distanceTo(target)*55;
        if(p.distanceTo(target)>.1)streak(target,p,'#a8f0ff',{start:land,dur:260+p.distanceTo(target)*40,width:.07,y:.45});
        spike(p,'#9fe8ff',{start:t,h:.65,tilt:(Math.random()-.5)*.6});sparks(p,frost,{start:t,n:4});
      });
      setTimeout(()=>quake(.06),land-time);
      return hold(time,land);
    },
    'Tramposa':({from,target,area,time,event})=>{
      if(event.trigger){
        // La trampa salta: estalla un anillo de púas de hielo hasta 3 casillas.
        dome(target,'#e6fbff',{start:time,size:.9,dur:300,opacity:.8});
        shock(target,'#bff4ff',{start:time,size:3.2,dur:620,thick:2});shock(target,'#4fb6e0',{start:time+120,size:2.4,dur:560});
        for(let i=0;i<(reduced?6:16);i++){const a=i/16*Math.PI*2,r=.6+(i%3)*.7;spike(new T.Vector3(target.x+Math.cos(a)*r,0,target.z+Math.sin(a)*r),'#9fe8ff',{start:time+r*60,h:.7+Math.random()*.4,tilt:(Math.random()-.5)*.5});}
        area.forEach(p=>sparks(p,frost,{start:time+150,n:8}));
        quake(.14,380);
        return 220;
      }
      const land=arrowFlight(from,target,{start:time+bowRelease.toss,speed:.03,arc:1.2,tip:'#9aa3b0'});
      shock(target,'#8fe3ff',{start:land,size:.9,dur:420});sparks(target,frost,{start:land,n:6,high:.3});
      return hold(time,land);
    },
    'Expansión de dominio':({from,time})=>{
      for(let i=0;i<3;i++)shock(from,i%2?'#8cff5a':'#8fe3ff',{start:time+150+i*140,size:1.4+i*.5,dur:700});
      for(let i=0;i<(reduced?4:12);i++){const a0=i/12*Math.PI*2;const m=glowPiece('gem',i%2?'#8cff5a':'#bff4ff',from.x,.1,from.z,.14,.14,.14);
        add(m,time+120+i*20,800,t=>{const a=a0+t*3,r=.4+t*1.3;m.position.set(from.x+Math.cos(a)*r,.15+Math.sin(t*Math.PI)*.6,from.z+Math.sin(a)*r);m.scale.setScalar(.15*(1-t));});}
      return 0;
    },
    'Contagio':({from,target,time})=>{
      const land=arrowFlight(from,target,{start:time+bowRelease.draw,tip:'#b8ff7a',trail:toxic,size:1.15});
      cloud(target,toxic,{start:land,n:16,size:2.2,dur:1000});
      shock(target,'#8cff5a',{start:land,size:2.2,dur:700,thick:2});
      for(let i=0;i<(reduced?3:8);i++){const a=i/8*Math.PI*2;stream(target,new T.Vector3(target.x+Math.cos(a)*2,0,target.z+Math.sin(a)*2),'#8cff5a',{start:land+60,n:1,dur:420});}
      setTimeout(()=>quake(.07),land-time);
      return hold(time,land);
    },
    'Trampita':({from,target,time,event})=>{
      if(event.trigger){
        cloud(target,toxic,{start:time,n:12,size:1});sparks(target,['#c8cdd5','#8cff5a'],{start:time,n:10,high:.5});
        for(let i=0;i<5;i++)spike(new T.Vector3(target.x+(Math.random()-.5)*.5,0,target.z+(Math.random()-.5)*.5),'#c8cdd5',{start:time,h:.4,w:.1,dur:380});
        quake(.05,200);
        return 150;
      }
      const land=arrowFlight(from,target,{start:time+bowRelease.toss,speed:.03,arc:1,tip:'#6a8a2a'});
      sparks(target,toxic,{start:land,n:5,high:.3});
      return hold(time,land);
    },
    'Flecha Explosiva':({from,target,area,time})=>{
      const land=arrowFlight(from,target,{start:time+bowRelease.sky,speed:.04,arc:2.6,tip:'#ff9a4a',trail:fire,size:1.15});
      dome(target,'#ffe9a8',{start:land,size:.8,dur:220,opacity:.9});dome(target,'#ff6a2b',{start:land+40,size:2,dur:520,opacity:.5});
      shock(target,'#ffcf6b',{start:land,size:3.4,dur:620,thick:2.4});shock(target,'#ff5a1f',{start:land+90,size:2.6,dur:560});
      sparks(target,fire,{start:land,n:24,spread:2,high:1.6,size:.13});
      area.forEach(p=>{const t=land+p.distanceTo(target)*55;flames(p,{start:t,n:2,h:.55});});
      setTimeout(()=>quake(.2,460),land-time);
      return hold(time,land);
    },
    'Flecha Rastreadora':({from,target,time})=>{
      const land=arrowFlight(from,target,{start:time+bowRelease.draw,speed:.04,curve:1.4,tip:'#ffd36b',trail:fire});
      sparks(target,fire,{start:land,n:12});flames(target,{start:land,n:3,h:.6});
      // Retícula sobre la presa: se queda un momento marcándola.
      const ring=glowPiece('ring','#ffe0a0',target.x,.1,target.z,.5,.5,.5,.9);ring.rotation.x=-Math.PI/2;
      add(ring,land,1400,t=>{const k=.7-.2*Math.min(1,t*4);ring.scale.set(k,k,k);ring.rotation.z=t*4;ring.material.opacity=.9*(1-Math.max(0,t-.6)/.4);});
      setTimeout(()=>quake(.06),land-time);
      return hold(time,land);
    },
    'Furia':({from,time})=>{
      flames(from,{start:time+60,n:8,radius:.45,h:1.1,dur:700});
      shock(from,'#ff5a1f',{start:time+60,size:1.1,dur:450,thick:2});dome(from,'#ff3a1a',{start:time,size:.9,dur:500,opacity:.35});
      sparks(from,fire,{start:time+120,n:14,high:1.2,spread:.5});
      quake(.05,240);
    },
  };
  /** Pose de la Valkyria según la habilidad. */
  const spearPoses={'Estocada':'thrust','Punzón':'thrust','Lanza abisal':'thrust','Balestra':'thrust','Lanza cargada':'throw',
    'Liberación':'slam','Abrir las aguas':'slam','Lanza del lago':'slam','Barrido':'sweep','Eclipse':'raise','Furia':'raise',
    'En guardia!':'guard','Salto valiente':'leap','Carga heroica':'charge','Pies ligeros':'hop'};
  /** Poses del Arquero: tensar y soltar (directa), al cielo (en parábola), lanzar trampa y concentrarse. */
  const bowPoses={'Flecha helada':'draw','Flecha Flamígera':'draw','Detonadora':'draw','Flecha Repelente':'draw','Flecha venenosa':'draw',
    'Dardo pestilente':'draw','Ramo helado':'draw','Contagio':'draw','Flecha Rastreadora':'draw',
    'Congelación prematura':'sky','Flecha Explosiva':'sky','Tramposa':'toss','Trampita':'toss','Ojo de águila':'focus','Expansión de dominio':'focus'};
  /** Momento (ms) en que suelta la cuerda en cada pose. */
  const bowRelease={draw:360,sky:400,toss:230,focus:260};
  const poseLength={draw:620,sky:680,toss:460,focus:760,thrust:480,throw:560,slam:620,sweep:560,raise:820,guard:760,hop:420};
  /** Qué animación hace el que actúa, según el efecto y quién es. */
  function actionFor(unit,effect){
    if(['heal','cleanse'].includes(effect))return 'support';
    if(effect==='push'||effect==='pull')return effect;
    if(unit?.boss&&effect!=='slash')return 'cast';                   // poderes de jefe: invocar, aullar, nova
    if(effect==='dash'||effect==='swap'||effect==='leap')return 'dash';
    if(effect==='lunge'||effect==='charge')return 'melee';
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
    if(model&&!event.trigger){
      model.strike=time;
      const pose=model.unit.classId==='guardia'&&spearPoses[event.name]||model.unit.classId==='tirador'&&bowPoses[event.name];
      model.action={type:pose||actionFor(model.unit,event.effect),start:time,
        dur:pose==='charge'?260+travel*80:pose==='leap'?620:pose?poseLength[pose]:null};
      if(travel>.01)model.root.rotation.y=Math.atan2(target.x-from.x,target.z-from.z);
    }
    if(event.name&&skillFx[event.name]){
      // Devuelve cuánto esperar antes de mostrar el daño (p. ej., hasta que la flecha llega).
      return skillFx[event.name]({from,target,area:(event.area||[event.pos]).map(pos=>logical(state,pos)),time,travel,event})||0;
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
    if(!reduced)for(const [i,mark] of snareGroup.children.entries()){mark.rotation.y=now*.0006+i;const k=1+.06*Math.sin(now*.004+i);mark.scale.set(k,1,k);}
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
        const t=walk.elapsed/(walk.speed||(id.startsWith('enemy')?135:reduced?145:225));
        const i=Math.min(walk.points.length-2,Math.floor(t));
        const a=walk.points[i],b=walk.points[i+1];
        model.root.position.lerpVectors(a,b,ease(clamp(t-i,0,1)));
        if(walk.arc){model.root.position.y=Math.sin(clamp(t,0,1)*Math.PI)*walk.arc;}
        else model.root.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);
        gait=walk.speed?0:Math.sin(t*Math.PI*2);
        if(walk.trail&&!reduced&&now-(walk.lastTrail||0)>22){
          walk.lastTrail=now;const q=model.root.position;
          const sp=glowPiece('gem',walk.trail[Math.floor(Math.random()*walk.trail.length)],q.x+(Math.random()-.5)*.2,q.y+.15+Math.random()*.4,q.z+(Math.random()-.5)*.2,.11,.11,.11,.85);
          add(sp,now,300,u=>{sp.scale.setScalar(.11*(1-u));sp.material.opacity=.85*(1-u);});
        }
        if(t>=walk.points.length-1){if(walk.arc)model.root.position.y=0;steps.delete(id);walk.resolve();}
      }
      const strike=Math.max(0,1-(now-(model.strike??-10000))/285);
      let swing=Math.sin(strike*Math.PI);
      const act=model.action,actDur=act?.dur||{melee:460,shoot:560,cast:620,support:640,push:420,pull:460,dash:300}[act?.type]||400;
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
      if(model.fx.firstChild)model.fx.style.transform='translate('+pos.x+'px,'+(pos.y-(plates?model.label.offsetHeight+3:-2))+'px) translate(-50%,-100%)';
    }
    for(let i=effects.length-1;i>=0;i--){
      const fx=effects[i];
      const t=(now-fx.start)/fx.duration;
      if(t<0)continue;
      if(t>=1){transient.remove(fx.mesh);effects.splice(i,1);continue;}
      fx.mesh.visible=true;
      if(fx.update){fx.update(t,now);continue;}
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
    let shook=null;
    if(shake){
      const k=(now-shake.start)/shake.ms;
      if(k>=1)shake=null;
      else{const a=shake.power*(1-k);shook=camera.position.clone();camera.position.x+=(Math.random()-.5)*a;camera.position.y+=(Math.random()-.5)*a;}
    }
    // Luces de los héroes: siguen a cada héroe vivo; las que sobran, apagadas.
    if(heroLamps.length){
      let n=0;
      for(const model of models.values()){
        if(n>=heroLamps.length||model.unit.enemy||model.dying)continue;
        const lamp=heroLamps[n++];lamp.intensity=1.6;
        lamp.position.set(0,1.9,.25).applyMatrix4(model.root.matrixWorld);
      }
      for(;n<heroLamps.length;n++)heroLamps[n].intensity=0;
    }
    renderer.setRenderTarget(pixels);
    renderer.render(scene,camera);
    if(shook)camera.position.copy(shook);
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
    // Paso proporcional (cada rueda acerca un % del zoom actual). El tope de acercamiento crece con el tamaño
    // del mapa: en un mapa grande se puede llegar a ver unas 5 casillas de ancho.
    const most=Math.max(2.6,Math.max(state.width,state.height)/5);
    magnification=clamp(magnification*(1+delta*1.4),.6,most);
    fit();
    const after=groundAt(event);
    if(before&&after){pan.x+=before.x-after.x;pan.z+=before.z-after.z;fit();}
  }
  return {warm,show,sync,anchor,highlight,move,impact,zoom,setPlates(on){plates=!!on;},setStatusRenderer(fn){statusRenderer=fn;for(const m of models.values())m.fxSig='';},resetHover(){hover=null;},get active(){return active;},
    set aiming(value){groundOnly=!!value;}};
}

