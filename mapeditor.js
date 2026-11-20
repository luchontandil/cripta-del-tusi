// Editor de mapas (solo administradores): estilo «modo construcción», con catálogo de casillas abajo.
// Crea, edita, prueba y guarda mapas; cada mapa pertenece a una zona (acto + tipo de sala) y tiene una frecuencia.
import {cleanMap,mapWarnings,MAP_LIMITS,ROOM_KINDS,obstacleNames,actNames,actBiomes,ACTS,setCustomMaps,adjacent} from './engine.js?v=104';

const liquidNames={crypt:'Agua',jungle:'Ciénaga',hell:'Lava'};
const floorColors={crypt:['#2f3446','#383c50'],jungle:['#2c4322','#344d27'],hell:['#2a2624','#322c29']};
const liquidColors={crypt:'#2c6f95',jungle:'#3d5a22',hell:'#e0601c'};
const obstacleGlyphs={crypt:['🏛','⚰','💀'],jungle:['🌳','🌿','🗿'],hell:['🔺','🔥','🪨']};
const categories={all:'Todo',ground:'Suelo',obstacle:'Obstáculos',liquid:'Líquidos',trap:'Trampas',spawn:'Aparición'};

/** Catálogo de casillas para el acto actual (los obstáculos y el líquido cambian con el bioma). */
function catalog(act){
  const biome=actBiomes[act-1]||'crypt';
  return [
    {id:'floor',cat:'ground',name:'Suelo',hint:'Casilla libre. Borra lo que haya.'},
    {id:'void',cat:'ground',name:'Vacío',hint:'Fuera del mapa: no existe ni bloquea la visión… porque no hay nada.'},
    ...obstacleNames[biome].map((name,i)=>({id:'wall'+i,cat:'obstacle',name,hint:'Obstáculo: bloquea el paso y la línea de visión.',variant:i})),
    {id:'water',cat:'liquid',name:liquidNames[biome],hint:'No se puede pisar, pero no tapa la visión.'},
    {id:'spikes',cat:'trap',name:'Pinchos',hint:'Trampa: daña a quien la pisa.'},
    {id:'gas',cat:'trap',name:'Gas venenoso',hint:'Trampa: envenena a quien la pisa.'},
    {id:'hero',cat:'spawn',name:'Inicio de héroe',hint:'Dónde empiezan los héroes (pon al menos 4).'},
    {id:'enemy',cat:'spawn',name:'Aparición de enemigo',hint:'Dónde pueden aparecer los enemigos (8 o más recomendados).'}
  ];
}
const tools={brush:['Pincel','B','Pinta casilla a casilla'],rect:['Rectángulo','R','Arrastra para rellenar un rectángulo'],fill:['Relleno','F','Rellena la zona conectada del mismo tipo'],pick:['Cuentagotas','I','Copia la casilla que pulses']};

function el(tag,cls,...kids){
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  for(const kid of kids.flat())if(kid!=null&&kid!==false)node.append(kid instanceof Node?kid:String(kid));
  return node;
}
const blank=(act=1,room='any')=>({id:Math.random().toString(36).slice(2,10),name:'Mapa nuevo',act,room,weight:30,enabled:true,width:12,height:8,
  voids:[],walls:[],wallVariants:{},water:[],traps:[],heroSpawns:[],enemySpawns:[]});

/**
 * Abre el editor. api: {list():Promise<maps>, save(map):Promise<{map,maps}>, remove(id):Promise<{maps}>, test(map)}.
 */
export function openMapEditor(api){
  let dialog=document.getElementById('map-editor');
  if(!dialog){dialog=el('dialog','map-editor');dialog.id='map-editor';document.body.append(dialog);}
  let maps=[],map=api.draft?structuredClone(api.draft):blank(),dirty=!!api.draft,tile='wall0',tool='brush',category='all',filter='',listFilter='';
  let undo=[],redo=[],drag=null,hover=-1;

  // ── Modelo: qué hay en cada casilla ──
  const kindAt=pos=>{
    if(map.voids.includes(pos))return 'void';
    if(map.walls.includes(pos))return 'wall'+(map.wallVariants[pos]??0);
    if(map.water.includes(pos))return 'water';
    const trap=map.traps.find(t=>t.pos===pos);if(trap)return trap.kind;
    if(map.heroSpawns.includes(pos))return 'hero';
    if(map.enemySpawns.includes(pos))return 'enemy';
    return 'floor';
  };
  const clear=pos=>{
    const out=list=>list.filter(p=>p!==pos);
    map.voids=out(map.voids);map.walls=out(map.walls);map.water=out(map.water);
    map.heroSpawns=out(map.heroSpawns);map.enemySpawns=out(map.enemySpawns);
    map.traps=map.traps.filter(t=>t.pos!==pos);delete map.wallVariants[pos];
  };
  const put=(pos,id)=>{
    if(kindAt(pos)===id)return false;
    clear(pos);
    if(id==='void')map.voids.push(pos);
    else if(id.startsWith('wall')){map.walls.push(pos);map.wallVariants[pos]=Number(id.slice(4));}
    else if(id==='water')map.water.push(pos);
    else if(id==='spikes'||id==='gas')map.traps.push({pos,kind:id});
    else if(id==='hero')map.heroSpawns.push(pos);
    else if(id==='enemy')map.enemySpawns.push(pos);
    return true;
  };
  const snapshot=()=>JSON.stringify(map);
  const remember=()=>{undo.push(snapshot());if(undo.length>80)undo.shift();redo=[];};
  const restore=json=>{map=JSON.parse(json);dirty=true;paintAll();};

  // ── Estructura ──
  const nameInput=el('input','me-name');nameInput.maxLength=40;
  const actSelect=el('select');for(let a=1;a<=ACTS;a++)actSelect.append(new Option(a+' · '+actNames[a-1],a));
  const roomSelect=el('select');for(const [k,v] of Object.entries(ROOM_KINDS))roomSelect.append(new Option(v,k));
  const weightInput=el('input');Object.assign(weightInput,{type:'range',min:0,max:100,step:5});
  const weightLabel=el('b','me-weight');
  const enabledInput=el('input');enabledInput.type='checkbox';
  const wInput=el('input','me-size'),hInput=el('input','me-size');
  for(const [input,lo,hi] of [[wInput,MAP_LIMITS.minW,MAP_LIMITS.maxW],[hInput,MAP_LIMITS.minH,MAP_LIMITS.maxH]])Object.assign(input,{type:'number',min:lo,max:hi});
  const saveButton=el('button','primary','Guardar');
  const testButton=el('button',null,'▶ Probar');
  const closeButton=el('button','ghost me-close','✕');closeButton.title='Cerrar el editor';
  const status=el('span','me-status');
  const top=el('header','me-top',
    el('strong','me-title','Mapas'),nameInput,
    el('label','me-field','Zona ',actSelect),el('label','me-field','Sala ',roomSelect),
    el('label','me-field me-freq','Frecuencia ',weightInput,weightLabel),
    el('label','me-field',enabledInput,' Activo'),
    el('label','me-field','Tamaño ',wInput,'×',hInput),
    el('div','me-actions',status,testButton,saveButton,closeButton));

  const listSearch=el('input','me-search');listSearch.placeholder='Buscar mapa…';
  const listBox=el('div','me-list');
  const newButton=el('button',null,'+ Nuevo'),copyButton=el('button',null,'Duplicar'),deleteButton=el('button','danger','Borrar');
  const side=el('aside','me-side',el('h3',null,'Mapas'),listSearch,listBox,el('div','me-side-actions',newButton,copyButton,deleteButton));

  const canvas=el('canvas','me-canvas');
  const ctx=canvas.getContext('2d');
  const toolBar=el('div','me-tools');
  const toolButtons={};
  for(const [key,[name,keyName,hint]] of Object.entries(tools)){
    const b=el('button','me-tool',el('span',null,{brush:'🖌',rect:'▭',fill:'🪣',pick:'💧'}[key]),el('small',null,keyName));
    b.title=name+' ('+keyName+') · '+hint;b.onclick=()=>{tool=key;paintTools();};
    toolButtons[key]=b;toolBar.append(b);
  }
  const undoButton=el('button','me-tool','↶');undoButton.title='Deshacer (Ctrl+Z)';
  const redoButton=el('button','me-tool','↷');redoButton.title='Rehacer (Ctrl+Y)';
  toolBar.append(el('span','me-gap'),undoButton,redoButton);
  const warnings=el('ul','me-warnings');
  const stage=el('div','me-stage',toolBar,el('div','me-board',canvas),warnings);

  const tabs=el('div','me-tabs');
  const tileSearch=el('input','me-search');tileSearch.placeholder='Filtrar casillas…';
  const tileGrid=el('div','me-tiles');
  const help=el('p','me-help','Clic izquierdo: pintar · clic derecho: borrar (suelo) · rueda: cambiar de casilla · B/R/F/I: herramientas');
  const tray=el('footer','me-tray',el('div','me-tray-head',tabs,tileSearch,help),tileGrid);

  dialog.replaceChildren(top,el('div','me-body',side,stage),tray);

  // ── Dibujo ──
  const biome=()=>actBiomes[map.act-1]||'crypt';
  let cell=40;
  function paintBoard(){
    const box=canvas.parentElement.getBoundingClientRect();
    cell=Math.max(16,Math.floor(Math.min((box.width-8)/map.width,(box.height-8)/map.height)));
    const dpr=window.devicePixelRatio||1;
    canvas.width=map.width*cell*dpr;canvas.height=map.height*cell*dpr;
    canvas.style.width=map.width*cell+'px';canvas.style.height=map.height*cell+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,map.width*cell,map.height*cell);
    const b=biome();
    const preview=dragCells();
    for(let pos=0;pos<map.width*map.height;pos++){
      const x=(pos%map.width)*cell,y=Math.floor(pos/map.width)*cell;
      const kind=preview.has(pos)?tile:kindAt(pos);
      if(kind==='void'){
        ctx.fillStyle='#0c0b10';ctx.fillRect(x,y,cell,cell);
        ctx.strokeStyle='#1b1a22';ctx.beginPath();ctx.moveTo(x,y+cell);ctx.lineTo(x+cell,y);ctx.stroke();
      }else{
        ctx.fillStyle=floorColors[b][(pos%map.width+Math.floor(pos/map.width))%2];ctx.fillRect(x,y,cell,cell);
        if(kind==='water'){ctx.fillStyle=liquidColors[b];ctx.fillRect(x+2,y+2,cell-4,cell-4);ctx.fillStyle='#ffffff30';ctx.fillRect(x+cell*.2,y+cell*.3,cell*.35,2);ctx.fillRect(x+cell*.45,y+cell*.62,cell*.3,2);}
        else if(kind.startsWith('wall')){
          ctx.fillStyle='#00000066';ctx.fillRect(x+4,y+6,cell-6,cell-6);
          ctx.fillStyle={crypt:'#565c72',jungle:'#4c6a32',hell:'#4a3a34'}[b];ctx.fillRect(x+3,y+3,cell-7,cell-8);
          glyph(obstacleGlyphs[b][Number(kind.slice(4))],x,y,.56);
        }else if(kind==='spikes'){
          ctx.fillStyle='#c9c3d6';
          for(const [dx,dy] of [[.3,.32],[.7,.32],[.5,.52],[.3,.72],[.7,.72]]){ctx.beginPath();ctx.moveTo(x+cell*dx,y+cell*(dy-.14));ctx.lineTo(x+cell*(dx-.1),y+cell*(dy+.08));ctx.lineTo(x+cell*(dx+.1),y+cell*(dy+.08));ctx.fill();}
        }else if(kind==='gas'){ctx.fillStyle='#8fd14a55';ctx.beginPath();ctx.arc(x+cell/2,y+cell/2,cell*.34,0,7);ctx.fill();glyph('☁',x,y,.5,'#c6ec8a');}
        else if(kind==='hero'||kind==='enemy'){
          ctx.fillStyle=kind==='hero'?'#3fb6ff':'#ff5a5a';ctx.beginPath();ctx.arc(x+cell/2,y+cell/2,cell*.3,0,7);ctx.fill();
          glyph(kind==='hero'?'H':'E',x,y,.38,'#0b0d14','bold ');
        }
      }
      ctx.strokeStyle='#ffffff10';ctx.strokeRect(x+.5,y+.5,cell-1,cell-1);
    }
    if(hover>=0&&!drag){
      ctx.strokeStyle='#ffd27a';ctx.lineWidth=2;
      ctx.strokeRect((hover%map.width)*cell+1,Math.floor(hover/map.width)*cell+1,cell-2,cell-2);ctx.lineWidth=1;
    }
  }
  function glyph(text,x,y,size,color='#fff',weight=''){
    ctx.font=weight+Math.round(cell*size)+'px system-ui, "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,x+cell/2,y+cell/2+1);
  }
  function paintTiles(){
    tabs.replaceChildren(...Object.entries(categories).map(([key,name])=>{
      const b=el('button','me-tab'+(category===key?' on':''),name);b.onclick=()=>{category=key;paintTiles();};return b;
    }));
    const q=filter.trim().toLowerCase();
    const items=catalog(map.act).filter(t=>(category==='all'||t.cat===category)&&(!q||t.name.toLowerCase().includes(q)||categories[t.cat].toLowerCase().includes(q)));
    tileGrid.replaceChildren(...items.map(t=>{
      const swatch=el('canvas','me-swatch');swatch.width=swatch.height=56;
      drawSwatch(swatch,t.id);
      const card=el('button','me-tile'+(tile===t.id?' on':''),swatch,el('span',null,t.name),el('small',null,categories[t.cat]));
      card.title=t.hint;card.onclick=()=>{tile=t.id;if(tool==='pick')tool='brush';paintTiles();paintTools();};
      return card;
    }));
    if(!items.length)tileGrid.append(el('p','me-empty','Ninguna casilla coincide con el filtro.'));
  }
  function drawSwatch(canvas,id){
    const c=canvas.getContext('2d');
    c.fillStyle=id==='void'?'#0c0b10':floorColors[biome()][0];c.fillRect(0,0,56,56);
    swatchKind(c,id,map.act);
  }
  function swatchKind(target,kind,act){
    const b=actBiomes[act-1]||'crypt',c=56;
    const g=(text,size,color='#fff',weight='')=>{target.font=weight+Math.round(c*size)+'px system-ui, "Segoe UI Emoji", "Apple Color Emoji", sans-serif';target.textAlign='center';target.textBaseline='middle';target.fillStyle=color;target.fillText(text,c/2,c/2+1);};
    if(kind==='void'){target.strokeStyle='#2a2833';target.beginPath();target.moveTo(0,c);target.lineTo(c,0);target.stroke();return;}
    if(kind==='water'){target.fillStyle=liquidColors[b];target.fillRect(3,3,c-6,c-6);return;}
    if(kind.startsWith('wall')){target.fillStyle={crypt:'#565c72',jungle:'#4c6a32',hell:'#4a3a34'}[b];target.fillRect(5,5,c-11,c-12);g(obstacleGlyphs[b][Number(kind.slice(4))],.56);return;}
    if(kind==='spikes'){g('▲▲',.4,'#c9c3d6');return;}
    if(kind==='gas'){target.fillStyle='#8fd14a55';target.beginPath();target.arc(c/2,c/2,c*.34,0,7);target.fill();g('☁',.5,'#c6ec8a');return;}
    if(kind==='hero'||kind==='enemy'){target.fillStyle=kind==='hero'?'#3fb6ff':'#ff5a5a';target.beginPath();target.arc(c/2,c/2,c*.3,0,7);target.fill();g(kind==='hero'?'H':'E',.38,'#0b0d14','bold ');}
  }
  function paintTools(){
    for(const [key,b] of Object.entries(toolButtons))b.classList.toggle('on',tool===key);
    undoButton.disabled=!undo.length;redoButton.disabled=!redo.length;
  }
  function paintFields(){
    nameInput.value=map.name;actSelect.value=map.act;roomSelect.value=map.room;
    weightInput.value=map.weight;weightLabel.textContent=map.weight+' %';enabledInput.checked=map.enabled;
    wInput.value=map.width;hInput.value=map.height;
  }
  function paintWarnings(){
    const list=mapWarnings(map);
    const counts=el('li','me-counts','Héroes: '+map.heroSpawns.length+' · Enemigos: '+map.enemySpawns.length+' · Obstáculos: '+map.walls.length+' · Trampas: '+map.traps.length);
    warnings.replaceChildren(counts,...list.map(t=>el('li',null,'⚠ '+t)));
    status.textContent=dirty?'Cambios sin guardar':'Guardado';
    status.classList.toggle('dirty',dirty);
  }
  function paintList(){
    const q=listFilter.trim().toLowerCase();
    const groups=new Map();
    for(const m of maps.filter(m=>!q||m.name.toLowerCase().includes(q))){
      const key=m.act+'·'+m.room;
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(m);
    }
    const sorted=[...groups.entries()].sort(([a],[b])=>a.localeCompare(b));
    listBox.replaceChildren(...sorted.flatMap(([key,items])=>{
      const [act,room]=key.split('·');
      return [el('h4',null,actNames[act-1]+' · '+ROOM_KINDS[room]),...items.map(m=>{
        const row=el('button','me-map'+(m.id===map.id?' on':'')+(m.enabled&&m.weight?'':' off'),el('span',null,m.name),el('small',null,m.width+'×'+m.height+' · '+m.weight+' %'));
        row.onclick=()=>select(m);
        return row;
      })];
    }));
    if(!maps.length)listBox.append(el('p','me-empty','Aún no hay mapas. Pulsa «+ Nuevo» o dibuja y guarda este.'));
  }
  function paintAll(){paintFields();paintBoard();paintTiles();paintTools();paintWarnings();paintList();}

  // ── Acciones ──
  function confirmLeave(){return !dirty||confirm('Hay cambios sin guardar en «'+map.name+'». ¿Descartarlos?');}
  function select(m){if(m.id===map.id||!confirmLeave())return;map=structuredClone(m);undo=[];redo=[];dirty=false;paintAll();}
  function edit(change){remember();change();dirty=true;paintBoard();paintWarnings();paintTools();}
  function resize(w,h){
    w=Math.min(MAP_LIMITS.maxW,Math.max(MAP_LIMITS.minW,w||map.width));h=Math.min(MAP_LIMITS.maxH,Math.max(MAP_LIMITS.minH,h||map.height));
    if(w===map.width&&h===map.height)return;
    edit(()=>{
      const move=p=>{const x=p%map.width,y=Math.floor(p/map.width);return x<w&&y<h?y*w+x:-1;};
      const keep=list=>list.map(move).filter(p=>p>=0);
      const variants={};for(const [p,v] of Object.entries(map.wallVariants)){const q=move(Number(p));if(q>=0)variants[q]=v;}
      Object.assign(map,{voids:keep(map.voids),walls:keep(map.walls),water:keep(map.water),heroSpawns:keep(map.heroSpawns),enemySpawns:keep(map.enemySpawns),
        traps:map.traps.map(t=>({...t,pos:move(t.pos)})).filter(t=>t.pos>=0),wallVariants:variants,width:w,height:h});
    });
    paintFields();
  }
  function cellAt(event){
    const r=canvas.getBoundingClientRect();
    const x=Math.floor((event.clientX-r.left)/cell),y=Math.floor((event.clientY-r.top)/cell);
    return x>=0&&y>=0&&x<map.width&&y<map.height?y*map.width+x:-1;
  }
  function dragCells(){
    if(!drag||drag.tool!=='rect'||drag.end<0)return new Set();
    const [x0,x1]=[drag.start%map.width,drag.end%map.width].sort((a,b)=>a-b);
    const [y0,y1]=[Math.floor(drag.start/map.width),Math.floor(drag.end/map.width)].sort((a,b)=>a-b);
    const out=new Set();for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)out.add(y*map.width+x);
    return out;
  }
  function flood(start,id){
    const from=kindAt(start);if(from===id)return;
    const grid={width:map.width,height:map.height,voids:[]};
    const seen=new Set([start]);
    for(const p of seen)for(const n of adjacent(grid,p))if(!seen.has(n)&&kindAt(n)===from)seen.add(n);
    for(const p of seen)put(p,id);
  }
  canvas.oncontextmenu=e=>e.preventDefault();
  canvas.onpointerdown=e=>{
    if(document.activeElement?.matches?.('input,select'))document.activeElement.blur();
    const pos=cellAt(e);if(pos<0)return;
    canvas.setPointerCapture(e.pointerId);
    const id=e.button===2?'floor':tile;
    if(tool==='pick'&&e.button!==2){tile=kindAt(pos);tool='brush';paintTiles();paintTools();return;}
    if(tool==='fill'){edit(()=>flood(pos,id));return;}
    remember();
    drag={tool:tool==='rect'?'rect':'brush',start:pos,end:pos,id,changed:false};
    if(drag.tool==='brush'){drag.changed=put(pos,id);paintBoard();}
    else paintBoard();
  };
  canvas.onpointermove=e=>{
    const pos=cellAt(e);
    if(!drag){if(pos!==hover){hover=pos;paintBoard();}return;}
    if(pos<0||pos===drag.end)return;
    drag.end=pos;
    if(drag.tool==='brush')drag.changed=put(pos,drag.id)||drag.changed;
    paintBoard();
  };
  canvas.onpointerup=()=>{
    if(!drag)return;
    if(drag.tool==='rect'){const id=drag.id;const cells=dragCells();for(const p of cells)drag.changed=put(p,id)||drag.changed;}
    if(drag.changed){dirty=true;redo=[];}else undo.pop();
    drag=null;paintBoard();paintWarnings();paintTools();
  };
  canvas.onpointerleave=()=>{if(!drag){hover=-1;paintBoard();}};
  canvas.onwheel=e=>{
    e.preventDefault();
    const items=catalog(map.act);
    const i=items.findIndex(t=>t.id===tile);
    tile=items[(i+(e.deltaY>0?1:-1)+items.length)%items.length].id;
    paintTiles();
  };
  undoButton.onclick=()=>{if(!undo.length)return;redo.push(snapshot());restore(undo.pop());};
  redoButton.onclick=()=>{if(!redo.length)return;undo.push(snapshot());restore(redo.pop());};
  nameInput.oninput=()=>{map.name=nameInput.value;dirty=true;paintWarnings();};
  actSelect.onchange=()=>{map.act=Number(actSelect.value);dirty=true;paintAll();};
  roomSelect.onchange=()=>{map.room=roomSelect.value;dirty=true;paintWarnings();};
  weightInput.oninput=()=>{map.weight=Number(weightInput.value);weightLabel.textContent=map.weight+' %';dirty=true;paintWarnings();};
  enabledInput.onchange=()=>{map.enabled=enabledInput.checked;dirty=true;paintWarnings();};
  wInput.onchange=()=>resize(Number(wInput.value),map.height);
  hInput.onchange=()=>resize(map.width,Number(hInput.value));
  listSearch.oninput=()=>{listFilter=listSearch.value;paintList();};
  tileSearch.oninput=()=>{filter=tileSearch.value;paintTiles();};
  newButton.onclick=()=>{if(!confirmLeave())return;map=blank(map.act,map.room);undo=[];redo=[];dirty=true;paintAll();};
  copyButton.onclick=()=>{if(!confirmLeave())return;map={...structuredClone(map),id:Math.random().toString(36).slice(2,10),name:(map.name+' (copia)').slice(0,40)};dirty=true;paintAll();};
  deleteButton.onclick=async()=>{
    if(!maps.some(m=>m.id===map.id)){map=blank(map.act,map.room);dirty=false;paintAll();return;}
    if(!confirm('¿Borrar el mapa «'+map.name+'»? No se puede deshacer.'))return;
    try{maps=(await api.remove(map.id)).maps;setCustomMaps(maps);map=maps[0]?structuredClone(maps[0]):blank();dirty=false;paintAll();}
    catch(error){status.textContent=error.message;}
  };
  saveButton.onclick=async()=>{
    try{
      saveButton.disabled=true;status.textContent='Guardando…';
      const result=await api.save(cleanMap(map));
      maps=result.maps;setCustomMaps(maps);map=structuredClone(result.map);dirty=false;api.draft=null;api.current=map.id;paintAll();
    }catch(error){status.textContent=error.message;}
    finally{saveButton.disabled=false;}
  };
  // Probar: el borrador (aunque no esté guardado) se conserva para volver al editor.
  testButton.onclick=()=>{api.draft=dirty?structuredClone(map):null;dialog.close();api.test(cleanMap(map));};
  closeButton.onclick=()=>{if(confirmLeave())dialog.close();};
  dialog.oncancel=e=>{if(!confirmLeave())e.preventDefault();};
  dialog.onkeydown=e=>{
    const k=e.key.toLowerCase();
    if((e.ctrlKey||e.metaKey)&&k==='s'){e.preventDefault();saveButton.onclick();return;}
    if(e.target.matches('input,select'))return;
    if((e.ctrlKey||e.metaKey)&&k==='z'){e.preventDefault();(e.shiftKey?redoButton:undoButton).onclick();return;}
    if((e.ctrlKey||e.metaKey)&&k==='y'){e.preventDefault();redoButton.onclick();return;}
    const shortcut={b:'brush',r:'rect',f:'fill',i:'pick'}[k];
    if(shortcut){tool=shortcut;paintTools();}
  };
  const onResize=()=>{if(dialog.open)paintBoard();};
  window.addEventListener('resize',onResize);
  dialog.onclose=()=>window.removeEventListener('resize',onResize);

  dialog.showModal();
  dialog.tabIndex=-1;dialog.focus();
  paintAll();
  status.textContent='Cargando mapas…';
  api.list().then(list=>{
    maps=list;setCustomMaps(maps);
    if(!dirty&&maps.length)map=structuredClone(api.current&&maps.find(m=>m.id===api.current)||maps[0]);
    api.draft=null;
    paintAll();
  }).catch(error=>{status.textContent='No se pudieron cargar los mapas: '+error.message;});
  return {reopen:()=>{dialog.showModal();paintAll();}};
}
