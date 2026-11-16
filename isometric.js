import * as T from './three.module.js';
import {miniature,obstacle,piece,solid} from './models3d.js?v=7';

const clamp=T.MathUtils.clamp;
const ease=t=>t*t*(3-2*t);
const tilesets={
  crypt:['#3e485e','#4c506a','#41475c','#575970','#464d63'],
  roots:['#3c524e','#465c50','#384a4a','#4e5f55','#415450']
};
const overlayColors={walk:'#448ead',cast:'#725298',aim:'#f1bf71',route:'#b3efff',area:'#ed8855',blocked:'#b34255',damage:'#ea6a50',poison:'#9abe56',slow:'#719add'};
const ink='#121423';
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
  renderer.toneMappingExposure=1.25;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFShadowMap;
  renderer.domElement.setAttribute('aria-hidden','true');
  const labels=document.createElement('div');
  labels.className='iso-labels';
  mount.append(renderer.domElement,labels);

  const scene=new T.Scene();
  scene.fog=new T.Fog('#111420',26,55);
  const stage=new T.Group();
  const figures=new T.Group();
  const transient=new T.Group();
  scene.add(stage,figures,transient);
  scene.add(new T.HemisphereLight('#d4e1ff','#322139',2.15));
  const key=new T.DirectionalLight('#ffd1a1',2.4);
  key.position.set(-5,10,6);
  key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);
  key.shadow.camera.left=key.shadow.camera.bottom=-12;
  key.shadow.camera.right=key.shadow.camera.top=12;
  key.shadow.camera.far=42;
  key.shadow.normalBias=.025;
  scene.add(key);
  const fill=new T.DirectionalLight('#a3aaff',1.2);
  fill.position.set(5,6,-7);
  scene.add(fill);
  const camera=new T.OrthographicCamera(-1,1,1,-1,.1,100);
  const pixels=new T.WebGLRenderTarget(1,1,{minFilter:T.NearestFilter,magFilter:T.NearestFilter});
  const screen=new T.Scene();
  const screenCamera=new T.OrthographicCamera(-1,1,1,-1,0,2);
  screenCamera.position.z=1;
  const pixelMaterial=new T.ShaderMaterial({
    uniforms:{image:{value:pixels.texture},resolution:{value:new T.Vector2(1,1)}},
    vertexShader:`varying vec2 tex; void main(){tex=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader:`uniform sampler2D image; uniform vec2 resolution; varying vec2 tex;
      void main(){
        vec2 p=floor(tex*resolution);
        gl_FragColor=texture2D(image,(p+.5)/resolution);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        float threshold=mod(p.x+p.y*2.,4.)/4.-.375;
        gl_FragColor.rgb=clamp(floor(gl_FragColor.rgb*31.+.5+threshold)/31.,0.,1.);
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
  const models=new Map();
  const effects=[];
  const steps=new Map();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stageKey='',state,active=false,hover=null,frame=0,viewWidth=0,viewHeight=0;
  let routeSignature='';
  let previousFrame=0;
  const routeGroup=new T.Group();
  stage.add(routeGroup);

  function fit(){
    if(!state||!active)return;
    const lastRect=mount.getBoundingClientRect();
    if(!lastRect.width||!lastRect.height)return;
    if(lastRect.width!==viewWidth||lastRect.height!==viewHeight){
      viewWidth=lastRect.width;
      viewHeight=lastRect.height;
      renderer.setSize(viewWidth,viewHeight,false);
      pixels.setSize(Math.max(1,Math.round(viewWidth*.68)),Math.max(1,Math.round(viewHeight*.68)));
      pixelMaterial.uniforms.resolution.value.set(pixels.width,pixels.height);
    }
    camera.position.set(17,17.5,18);
    camera.lookAt(0,.25,0);
    camera.updateMatrixWorld();
    const halfW=state.width/2+.55,halfH=state.height/2+.55;
    let sizeX=0,sizeY=0;
    for(const x of [-halfW,halfW])for(const z of [-halfH,halfH])for(const y of [-.75,1.1]){
      world.set(x,y,z).applyMatrix4(camera.matrixWorldInverse);
      sizeX=Math.max(sizeX,Math.abs(world.x));
      sizeY=Math.max(sizeY,Math.abs(world.y));
    }
    const aspect=viewWidth/viewHeight;
    const extent=Math.max(sizeY,sizeX/aspect)*1.07;
    camera.left=-extent*aspect;
    camera.right=extent*aspect;
    camera.top=extent;
    camera.bottom=-extent;
    camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(fit);
  observer.observe(mount);

  function removeModel(id){
    const model=models.get(id);
    if(!model)return;
    model.label.remove();
    model.ring.geometry.dispose();
    model.shadow.parent?.remove(model.shadow);
    figures.remove(model.root);
    models.delete(id);
  }
  function clearTransient(){
    transient.clear();
    effects.length=0;
    for(const step of steps.values())step.resolve();
    steps.clear();
  }
  function rebuild(){
    for(const id of models.keys())removeModel(id);
    clearTransient();
    stage.clear();
    routeGroup.clear();
    stage.add(routeGroup);
    routeSignature='';
    overlays.length=0;
    torches.length=0;
    const mode=state.biome||'crypt';
    const palette=tilesets[mode]||tilesets.crypt;
    const walls=new Set(state.walls);
    piece(stage,'cube',ink,0,-.45,0,state.width+.18,.65,state.height+.18);
    piece(stage,'cube',mode==='roots'?'#293837':'#333b53',0,-.20,0,state.width+.13,.23,state.height+.13);
    for(let pos=0;pos<state.width*state.height;pos++){
      const coord=logical(state,pos);
      const v=random(state.mapSeed,pos);
      const color=palette[Math.floor(v*palette.length)];
      piece(stage,'cube',color,coord.x,-.065,coord.z,.965,.13,.965);
      const overlay=piece(stage,'cube','#448ead',coord.x,.007,coord.z,.92,.016,.92,true);
      overlay.visible=false;
      overlays.push(overlay);
      if(walls.has(pos)){
        const block=new T.Group();
        stage.add(block);
        block.position.copy(coord);
        block.rotation.y=((pos%4)*Math.PI)/2;
        obstacle(block,mode,Math.floor(v*3));
      }else if(v<.085){
        const chip=piece(stage,'cube',palette[0],coord.x-.22,.012,coord.z+.21,.22,.022,.035);
        chip.rotation.y=v*12;
      }
    }
    const w=state.width,h=state.height;
    // Cutaway walls frame the far sides; the two sides closest to camera stay low.
    for(let i=0;i<w;i++){
      const x=i-(w-1)/2;
      if(i%5!==3)piece(stage,'cube',palette[(i+2)%palette.length],x,.28,-h/2-.15,.98,.53,.29);
      if(i%4===0)piece(stage,'cube','#687189',x,.61,-h/2-.15,.35,.16,.36);
    }
    for(let i=0;i<h;i++){
      const z=i-(h-1)/2;
      if(i%4!==2)piece(stage,'cube',palette[i%palette.length],-w/2-.15,.25,z,.29,.47,.98);
    }
    const placement=[[-w/2-.15,-h/2+.8],[w/2-.95,-h/2-.18],[-w/2-.17,h/2-.9]];
    placement.forEach(([x,z],index)=>{
      piece(stage,'column','#475264',x,.52,z,.34,1.13,.34);
      piece(stage,'column','#b18a65',x,1.13,z,.31,.17,.31);
      const color=mode==='roots'?'#c1f195':'#ffb46b';
      const flame=piece(stage,'gem',color,x,1.34,z,.22,.37,.22,true);
      torches.push(flame);
      const light=new T.PointLight(color,12,5,2);
      light.position.set(x,1.47,z);
      stage.add(light);
      const crystal=piece(stage,'gem',mode==='roots'?'#7da38f':'#8479b5',x+(index===0?.65:-.41),.19,z+.35,.22,.38,.20);
      crystal.rotation.z=.32;
    });
    fit();
  }
  function makeLabel(u){
    const label=document.createElement('div');
    label.className='iso-label'+(u.enemy?' enemy-label':'');
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
      if(u.hp<=0&&!moving){removeModel(u.id);continue;}
      const coords=logical(next,u.pos);
      if(!models.has(u.id)){
        const model=miniature(look(u));
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
  function anchor(pos){
    const u=state.units.find(candidate=>candidate.hp>0&&candidate.pos===pos);
    const model=u&&models.get(u.id);
    const coords=model?.root.position||logical(state,pos);
    const p=projected(coords.x,model?.head||.06,coords.z);
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
        c.contains('aim')?'aim':c.contains('cast-range')?'cast':c.contains('walk')?'walk':null);
      o.visible=!!type;
      if(type)o.material=solid(overlayColors[type],true);
      o.scale.set(c.contains('route')?.88:glyph?.86:.82,.016,c.contains('route')?.88:glyph?.86:.82);
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
  function aimAt(event){
    const rect=mount.getBoundingClientRect();
    mouse.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
    ray.setFromCamera(mouse,camera);
    const visible=[...models.values()].filter(model=>model.unit.hp>0);
    const hit=ray.intersectObjects(visible.map(model=>model.root),true)[0];
    if(hit){
      let root=hit.object;
      while(root.parent&&root.parent!==figures)root=root.parent;
      const model=visible.find(candidate=>candidate.root===root);
      if(model)return model.unit.pos;
    }
    if(!ray.ray.intersectPlane(plane,world))return null;
    const x=Math.round(world.x+(state.width-1)/2),z=Math.round(world.z+(state.height-1)/2);
    if(x<0||x>=state.width||z<0||z>=state.height)return null;
    return z*state.width+x;
  }
  function changeHover(pos,event){
    if(hover===pos)return;
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
    model.root.position.copy(points[0]);
    return new Promise(resolve=>steps.set(event.unit,{points,elapsed:0,first:true,resolve}));
  }
  function impact(event){
    if(!active)return;
    const palette={heal:'#b5ef90',blast:'#ffad64',poison:'#c2df81',glyph:'#ff8e66'};
    const positions=event.area||[event.pos];
    if(event.from!==undefined&&event.from!==event.pos){
      const source=state.units.find(u=>u.pos===event.from&&u.hp>0);
      const model=source&&models.get(source.id);
      if(model){
        model.strike=performance.now();
        const start=logical(state,event.from);
        const end=logical(state,event.pos);
        model.root.rotation.y=Math.atan2(end.x-start.x,end.z-start.z);
        if(start.distanceTo(end)>1.1){
          const projectile=piece(transient,'gem',palette[event.kind]||'#f4d5a3',start.x,.72,start.z,.16,.24,.16,true);
          effects.push({mesh:projectile,start:performance.now(),duration:170,source:start,target:end});
        }
      }
    }
    for(const pos of positions){
      const p=logical(state,pos);
      const glow=piece(transient,'disc',palette[event.kind]||'#f69a74',p.x,.044,p.z,.55,.025,.55,true);
      effects.push({mesh:glow,start:performance.now(),duration:360,pop:true});
    }
  }
  function draw(now){
    if(!active)return;
    const delta=previousFrame?Math.min(45,Math.max(0,now-previousFrame)):0;
    previousFrame=now;
    for(const [index,flame] of torches.entries()){
      const t=reduced?0:now*.007+index;
      flame.scale.y=.34+Math.sin(t)*.065;
      flame.rotation.y=t*.45;
    }
    for(const [id,model] of models){
      const walk=steps.get(id);
      let gait=0;
      if(walk){
        if(walk.first)walk.first=false;
        else walk.elapsed+=delta;
        const t=walk.elapsed/(reduced?145:225);
        const i=Math.min(walk.points.length-2,Math.floor(t));
        const a=walk.points[i],b=walk.points[i+1];
        model.root.position.lerpVectors(a,b,ease(clamp(t-i,0,1)));
        model.root.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);
        gait=Math.sin(t*Math.PI*2);
        if(t>=walk.points.length-1){steps.delete(id);walk.resolve();}
      }
      const strike=Math.max(0,1-(now-(model.strike??-10000))/285);
      const swing=Math.sin(strike*Math.PI);
      const breath=reduced?0:Math.sin(now*.003+model.phase);
      model.figure.position.y=reduced?0:Math.abs(gait)*.055+breath*.024;
      model.figure.rotation.z=walk?gait*.055:breath*.035;
      model.arms[0].rotation.x=gait*.36+breath*.12;
      model.arms[1].rotation.x=-gait*.36-swing*.97-breath*.10;
      model.legs[0].rotation.x=-gait*.43;
      model.legs[1].rotation.x=gait*.43;
      model.shadow.position.x=model.root.position.x;
      model.shadow.position.z=model.root.position.z;
      const pos=projected(model.root.position.x,model.head+.15+model.figure.position.y,model.root.position.z);
      model.label.style.transform='translate('+pos.x+'px,'+pos.y+'px) translate(-50%,-100%)';
    }
    for(let i=effects.length-1;i>=0;i--){
      const fx=effects[i];
      const t=(now-fx.start)/fx.duration;
      if(t>=1){transient.remove(fx.mesh);effects.splice(i,1);continue;}
      if(fx.pop){
        fx.mesh.scale.x=fx.mesh.scale.z=.36+t*.55;
        fx.mesh.position.y=.04+t*.045;
      }else{
        fx.mesh.position.lerpVectors(fx.source,fx.target,t);
        fx.mesh.position.y=.56+Math.sin(t*Math.PI)*.52;
      }
    }
    renderer.setRenderTarget(pixels);
    renderer.render(scene,camera);
    renderer.setRenderTarget(null);
    renderer.render(screen,screenCamera);
    frame=requestAnimationFrame(draw);
  }
  return {show,sync,anchor,highlight,move,impact,get active(){return active;}};
}

