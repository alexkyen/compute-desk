/* The NVL72 rack, Figure 3 of the hardware page. Moved from the original rack page with the site's
   palette and fonts; chapters are saved as `rack` (the old page used `stage`).
   Plate I — the NVL72 rack.
   Schematic 3D: flat-shaded parametric geometry, ink edges, site tokens.
   Figures: NVIDIA GB200 NVL72 datasheet — 72 Blackwell GPUs, 36 Grace CPUs,
   18 compute trays x 2 GB200 superchips, 9 NVSwitch trays, ~5,000 direct copper
   NVLink cables, 1.8 TB/s NVLink per GPU, 186 GB HBM3e per GPU, ~120 kW,
   liquid cooling required. */
(function(){
"use strict";

/* ---------- stage copy (the deliverable; the model serves it) ---------- */
var STAGES=[
 {tab:"The rack",eyebrow:"01 / RACK ARCHITECTURE",title:"72 GPUs, one NVLink domain",
  body:"The rack connects 72 GPUs through NVLink. They can exchange data at high bandwidth, while each GPU retains its own memory. Traffic leaving the rack uses a separate network.",
  stats:[["Blackwell GPUs","72","teal"],["Grace CPUs","36","teal"],["Compute trays","18","teal"],["Planning rack power","~120 kW","amber"]]},
 {tab:"The trays",eyebrow:"02 / COMPUTE & COOLING",title:"18 compute trays; liquid cooling",
  body:"Eighteen compute trays hold four GPUs each. Nine switch trays connect them. Liquid cooling removes heat from the dense electronics; the facility must support the rack’s power and cooling requirements.",
  stats:[["Compute trays","18","teal"],["Connection trays","9","teal"],["Approx. power needed","120 kW","amber"],["Cooling method","Liquid","amber"]]},
 {tab:"The links",eyebrow:"03 / GPU COMMUNICATION",title:"The connections inside the rack",
  body:"Copper NVLink connections carry data between the compute and switch trays. Each GPU has 1.8 TB/s of NVLink bandwidth. The schematic simplifies the physical cable count.",
  stats:[["Copper cables","~5,000","amber"],["Cables drawn here","378","amber"],["NVLink per GPU","1.8 TB/s","teal"],["Connected GPUs","72","teal"]]},
 {tab:"The chip",eyebrow:"04 / THE SUPERCHIP",title:"One CPU and two GPUs",
  body:"A GB200 superchip pairs one Grace CPU with two Blackwell GPUs. NVIDIA specifies 372 GB of GPU memory per superchip: 186 GB per GPU. Two superchips sit in each compute tray.",
  stats:[["Superchips per tray","2","teal"],["Memory per GPU","186 GB","amber"],["GPUs per superchip","2","teal"],["Superchips per rack","36","teal"]]}
];

/* ---------- panel + tabs (work with or without WebGL) ---------- */
var tabsEl=document.getElementById("tabs"),
    panelEl=document.getElementById("panel"),
    eyeEl=document.getElementById("an-eyebrow"),
    titleEl=document.getElementById("an-title"),
    bodyEl=document.getElementById("an-body"),
    statsEl=document.getElementById("an-stats"),
    scrub=document.getElementById("scrub"),
    subEl=document.getElementById("subrow"),
    countsEl=document.getElementById("counts"),
    hovEl=document.getElementById("hovlab"),
    chipEl=document.getElementById("modechip"),
    sceneWrap=document.getElementById("scene-wrap");
var reduceMq=window.matchMedia("(prefers-reduced-motion: reduce)");
function reduced(){return reduceMq.matches}
var initialStage=Math.max(0,Math.min(3,+ComputeDesk.params().get('rack')||0)),shownStage=-1;

function buildTabs(){
  var h="";
  STAGES.forEach(function(s,i){
    h+='<button type="button" role="tab" id="tab'+i+'" aria-controls="panel" aria-selected="'+(i===initialStage)+'" tabindex="'+(i===initialStage?'0':'-1')+'" data-i="'+i+'">'+s.tab+"</button>";
  });
  tabsEl.innerHTML=h;
  tabsEl.querySelectorAll("button").forEach(function(b){
    b.addEventListener("click",function(){gotoStage(+this.dataset.i)});
    b.addEventListener("keydown",function(e){
      var i=+this.dataset.i,n=null;
      if(e.key==="ArrowRight")n=Math.min(3,i+1);
      if(e.key==="ArrowLeft")n=Math.max(0,i-1);
      if(e.key==="Home")n=0;
      if(e.key==="End")n=3;
      if(n!==null&&n!==i){e.preventDefault();gotoStage(n);tabsEl.querySelector('[data-i="'+n+'"]').focus()}
    });
  });
}
function renderPanel(i){
  if(i===shownStage)return;
  shownStage=i;
  var s=STAGES[i];
  var put=function(){
    eyeEl.textContent=s.eyebrow;
    titleEl.textContent=s.title;
    bodyEl.textContent=s.body;
    var h="";
    s.stats.forEach(function(st){h+='<div class="stat"><span class="l">'+st[0]+'</span><span class="v '+st[2]+'">'+st[1]+"</span></div>"});
    statsEl.innerHTML=h;
    document.getElementById("an-link").hidden=(i!==3);
    panelEl.classList.remove("swap");
  };
  tabsEl.querySelectorAll("button").forEach(function(b){
    var on=+b.dataset.i===i;
    b.classList.toggle("on",on);
    b.setAttribute("aria-selected",on);
    b.tabIndex=on?0:-1;
  });
  if(reduced()){put()}
  else{panelEl.classList.add("swap");setTimeout(put,130)}
}
buildTabs();
renderPanel(initialStage);

/* gotoStage is replaced by the 3D controller when WebGL is live */
var gotoStage=function(i){ComputeDesk.setParams({rack:i});renderPanel(i)};

/* ---------- WebGL gate ---------- */
function webglOK(){
  try{
    var c=document.createElement("canvas");
    return !!(window.WebGLRenderingContext&&(c.getContext("webgl")||c.getContext("experimental-webgl")));
  }catch(e){return false}
}
if(!window.THREE||!webglOK()){
  document.body.classList.add("no3d");
  document.getElementById("rack-motion").hidden=true;
  return; // fallback figure stays; tabs still swap the same annotation copy
}
document.getElementById("fallback-fig").hidden=true;

/* ---------- constants: geometry (m) and site tokens ---------- */
/* Site palette: compute green, memory blue, network orange, warm neutrals on a white stage. */
var COMPUTE=0x1f9d6b,MEMORY=0x2a78d6,NETWORK=0xeb6834,NETWORK_DIM=0xf4b896,COOL=0x8fa9c4,
    TEAL=COMPUTE,TEALDIM=NETWORK_DIM,AMBER=MEMORY,
    INK=0x5f5b54,INK2=0x9c968a,INK3=0xb9b3a5,RULE=0xe6e2d9,
    PANEL=0xffffff,PAPER=0xfcfbf8;

var W=0.60,H=2.36,D=1.20,          // rack outer
    TW=0.50,TD=0.88,               // tray width/depth
    CAP=0.055,POST=0.048,
    SHELF_H=0.075,
    ZREAR=-0.385,                  // backplane plane (cable terminations)
    TRAY_Z=0.06;                   // tray center z (front face ~ +0.50)

var innerLo=CAP+0.02,innerHi=H-CAP-0.02;
var pitch=(innerHi-innerLo-4*SHELF_H)/27,
    trayH=pitch-0.006;

/* slot layout, bottom-up: shelf,shelf, C0..C8, S0..S8, C9..C17, shelf,shelf */
var computeY=[],switchY=[],shelfY=[];
(function(){
  var y=innerLo,i;
  for(i=0;i<2;i++){shelfY.push(y+SHELF_H/2);y+=SHELF_H}
  for(i=0;i<9;i++){computeY.push(y+pitch/2);y+=pitch}
  for(i=0;i<9;i++){switchY.push(y+pitch/2);y+=pitch}
  for(i=9;i<18;i++){computeY.push(y+pitch/2);y+=pitch}
  for(i=0;i<2;i++){shelfY.push(y+SHELF_H/2);y+=SHELF_H}
})();
var HERO=13; // 5th tray of the upper bank — comfortable presentation height
var heroY=computeY[HERO];

/* deterministic pseudo-random (stable spine between loads) */
var seed=1234567;
function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}

/* ---------- renderer / scene / camera ---------- */
var canvas=document.createElement("canvas");
canvas.setAttribute("aria-label","Interactive 3D model of a GB200 NVL72 rack. Drag to turn it, pinch or Ctrl-scroll to zoom; use the chapter buttons and the slider to take it apart. Hover or tap a part to name it.");
sceneWrap.appendChild(canvas);
var renderer;
try{
  renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
}catch(e){
  document.body.classList.add("no3d");
  document.getElementById("rack-motion").hidden=true;
  document.getElementById("fallback-fig").hidden=false;
  return;
}
renderer.setClearColor(PANEL,1);
renderer.outputEncoding=THREE.sRGBEncoding;
var scene=new THREE.Scene();
var camera=new THREE.PerspectiveCamera(38,1.5,0.05,40);
scene.add(new THREE.HemisphereLight(0xffffff,0x8d877b,1.15));
var dl=new THREE.DirectionalLight(0xffffff,1.0);
dl.position.set(2.6,4.2,3.1);
scene.add(dl);

/* ---------- materials (opacity animated per stage; polygonOffset lets ink edges win) ---------- */
function lam(color,op){
  return new THREE.MeshStandardMaterial({color:color,metalness:0.45,roughness:0.36,transparent:true,opacity:op===undefined?1:op,
    polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
}
function lin(color,op){
  return new THREE.LineBasicMaterial({color:color,transparent:true,opacity:op===undefined?0.85:op});
}
var matFrame=lam(INK2),      linFrame=lin(INK,0.9),
    matShelf=lam(0xa9a396),
    matTrayC=lam(0xd9d4c8),  linTrayC=lin(INK,0.8),
    matTrayS=lam(TEALDIM),   linTrayS=lin(NETWORK,0.85),
    matShellH=lam(0xd9d4c8), linShellH=lin(INK,0.8),
    matCable=new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:0.5}),
    matManif=lam(COOL,0),
    matBoard=lam(0x6f7d70),  linChip=lin(INK,0),
    matGrace=lam(INK3),      matGPU=lam(TEAL),   matHBM=lam(AMBER),
    linGround=lin(INK3,0.55);
[matBoard,matGrace,matGPU,matHBM].forEach(function(m){m.opacity=0});
/* stage-IV additions: LPDDR/C2C/mezzanine at module level; a focus material set
   (…F) so one B200 package can hold full ink while the GPU zoom ghosts the rest */
var matLP=lam(0xa9c6ec,0),   matC2C=lam(NETWORK,0),   matMezz=lam(INK2,0),
    matSub=lam(0xf0eee8,0),  matSubF=lam(0xf0eee8,0),
    matGPUF=lam(TEAL,0),     matHBMF=lam(AMBER,0),
    matSeam=lam(INK2,0),     matEgress=lam(NETWORK,0),
    linChipF=lin(INK,0),     linZoom=lin(INK2,0),
    linDim=lin(INK3,0);
var invisMat=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});

/* ---------- mono canvas-sprite labels (Plate II production helper) ---------- */
var LABELS=[];
function drawLabelCanvas(rec){
  var scale=2,px=26,pad=5;
  var ctx=rec.cv.getContext("2d");
  ctx.font="500 "+(px*scale)+"px Inter,system-ui,sans-serif";
  var w=Math.ceil(ctx.measureText(rec.txt).width)+pad*2*scale;
  rec.cv.width=w;rec.cv.height=Math.ceil(px*scale*1.5);
  ctx=rec.cv.getContext("2d");
  ctx.font="500 "+(px*scale)+"px Inter,system-ui,sans-serif";
  ctx.textBaseline="middle";
  ctx.fillStyle=rec.color;
  ctx.fillText(rec.txt,pad*scale,rec.cv.height/2);
  rec.sp.scale.set(rec.h*rec.cv.width/rec.cv.height,rec.h,1);
  if(rec.tex)rec.tex.needsUpdate=true;
}
function label(txt,cssColor,worldH){
  var rec={txt:txt,color:cssColor,h:worldH,cv:document.createElement("canvas")};
  var sp=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,opacity:1,depthTest:false}));
  sp.renderOrder=20;
  rec.sp=sp;
  drawLabelCanvas(rec);
  rec.tex=new THREE.CanvasTexture(rec.cv);
  rec.tex.minFilter=THREE.LinearFilter;
  sp.material.map=rec.tex;
  LABELS.push(rec);
  return sp;
}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){
  LABELS.forEach(drawLabelCanvas);needs=true;
});

/* ---------- generic timed animations (zoom fades) ---------- */
var anims=[];
function addAnim(dur,tick,done,delay){anims.push({t:-(delay||0),dur:dur,tick:tick,done:done});needs=true}
function stepAnims(dt){
  for(var i=anims.length-1;i>=0;i--){
    var a=anims[i];
    a.t+=dt;
    if(a.t<0)continue;
    var f=Math.min(a.t/a.dur,1);
    a.tick(f);
    if(f>=1){anims.splice(i,1);if(a.done)a.done()}
  }
}

/* ---------- helpers: merged ink linework ---------- */
function edgesOf(geo,dx,dy,dz){
  var e=new THREE.EdgesGeometry(geo),a=e.attributes.position.array,out=new Float32Array(a.length);
  for(var i=0;i<a.length;i+=3){out[i]=a[i]+(dx||0);out[i+1]=a[i+1]+(dy||0);out[i+2]=a[i+2]+(dz||0)}
  e.dispose();
  return out;
}
function segs(list){ // list of [x1,y1,z1,x2,y2,z2]
  var out=new Float32Array(list.length*6);
  list.forEach(function(s,i){for(var k=0;k<6;k++)out[i*6+k]=s[k]});
  return out;
}
function lineGeo(arrays){
  var n=0;arrays.forEach(function(a){n+=a.length});
  var all=new Float32Array(n),o=0;
  arrays.forEach(function(a){all.set(a,o);o+=a.length});
  var g=new THREE.BufferGeometry();
  g.setAttribute("position",new THREE.BufferAttribute(all,3));
  return g;
}
function rectXY(cx,cy,w,h,z){ // rectangle outline in tray-face plane
  var l=cx-w/2,r=cx+w/2,b=cy-h/2,t=cy+h/2;
  return [[l,b,z,r,b,z],[r,b,z,r,t,z],[r,t,z,l,t,z],[l,t,z,l,b,z]];
}

/* ---------- rack frame ---------- */
var rack=new THREE.Group();scene.add(rack);
var frameLines=[];
var postGeo=new THREE.BoxGeometry(POST,H-2*CAP,POST);
var capGeo=new THREE.BoxGeometry(W,CAP,D);
[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(p){
  var m=new THREE.Mesh(postGeo,matFrame);
  m.position.set(p[0]*(W/2-POST/2),H/2,p[1]*(D/2-POST/2));
  rack.add(m);
  frameLines.push(edgesOf(postGeo,m.position.x,m.position.y,m.position.z));
});
[CAP/2,H-CAP/2].forEach(function(y){
  var m=new THREE.Mesh(capGeo,matFrame);
  m.position.set(0,y,0);
  rack.add(m);
  frameLines.push(edgesOf(capGeo,0,y,0));
});
/* unit ticks on the front posts, one per tray pitch */
(function(){
  var t=[],x=W/2-POST-0.002,zf=D/2-0.004,y=innerLo;
  while(y<innerHi-0.01){
    t.push([x,y,zf,x+0.022,y,zf],[-x,y,zf,-x-0.022,y,zf]);
    y+=pitch;
  }
  frameLines.push(segs(t));
})();
/* power shelves (static) */
var shelfGeo=new THREE.BoxGeometry(TW,SHELF_H-0.01,TD);
shelfY.forEach(function(y){
  var m=new THREE.Mesh(shelfGeo,matShelf);
  m.position.set(0,y,TRAY_Z);
  rack.add(m);
  frameLines.push(edgesOf(shelfGeo,0,y,TRAY_Z));
  var v=[],zf=TRAY_Z+TD/2+0.001;
  for(var k=-1;k<=1;k++)v.push([-TW/2+0.06,y+k*0.016,zf,TW/2-0.06,y+k*0.016,zf]);
  frameLines.push(segs(v));
});
var frameEdge=new THREE.LineSegments(lineGeo(frameLines),linFrame);
rack.add(frameEdge);
/* ground reference: plinth rectangle in ink */
var ground=new THREE.LineSegments(lineGeo([segs([
  [-0.85,0,1.05,0.85,0,1.05],[0.85,0,1.05,0.85,0,-1.05],
  [0.85,0,-1.05,-0.85,0,-1.05],[-0.85,0,-1.05,-0.85,0,1.05]
])]),linGround);
scene.add(ground);

/* ---------- trays ---------- */
var trayGeoC=new THREE.BoxGeometry(TW,trayH,TD);
var trayGeoS=new THREE.BoxGeometry(TW,trayH,TD-0.04);
/* compute-tray faceplate: box edges + two handles + four ports + a status tick */
var faceC=(function(){
  var zf=TD/2+0.0015,d=[];
  d.push([-TW/2+0.03,0,zf,-TW/2+0.085,0,zf],[TW/2-0.085,0,zf,TW/2-0.03,0,zf]); // handles
  for(var k=0;k<4;k++)d=d.concat(rectXY(0.028+k*0.038,0,0.024,trayH*0.34,zf)); // ports
  d.push([-0.075,-trayH*0.14,zf,-0.075,trayH*0.14,zf]); // status tick
  return lineGeo([edgesOf(trayGeoC),segs(d)]);
})();
/* switch-tray faceplate: box edges + two rows of NVLink cage ticks + center latch */
var faceS=(function(){
  var zf=(TD-0.04)/2+0.0015,d=[],k;
  for(k=0;k<9;k++){
    var x=-0.2+k*0.05;
    d.push([x,trayH*0.10,zf,x+0.026,trayH*0.10,zf]);
    d.push([x,-trayH*0.22,zf,x+0.026,-trayH*0.22,zf]);
  }
  d=d.concat(rectXY(0,trayH*0.05,0.05,trayH*0.34,zf));
  return lineGeo([edgesOf(trayGeoS),segs(d)]);
})();

var EXT_C=0.22; // identical hardware explodes identically: one extension for all compute trays
var computeTrays=[],switchTrays=[],trayHits=[];
computeY.forEach(function(y,i){
  if(i===HERO)return; // hero built separately
  var g=new THREE.Group();
  g.position.set(0,y,TRAY_Z);
  var tm=new THREE.Mesh(trayGeoC,matTrayC);
  tm.userData={tip:"ctray",hl:[TW+0.02,trayH+0.012,TD+0.02]};
  g.add(tm);trayHits.push(tm);
  g.add(new THREE.LineSegments(faceC,linTrayC));
  rack.add(g);computeTrays.push(g);
});
switchY.forEach(function(y){
  var g=new THREE.Group();
  g.position.set(0,y,TRAY_Z+0.02);
  var tm=new THREE.Mesh(trayGeoS,matTrayS);
  tm.userData={tip:"stray",hl:[TW+0.02,trayH+0.012,TD-0.02]};
  g.add(tm);trayHits.push(tm);
  g.add(new THREE.LineSegments(faceS,linTrayS));
  rack.add(g);switchTrays.push(g);
});

/* ---------- hero tray: open shell + 2 GB200 superchips ---------- */
var hero=new THREE.Group();
hero.position.set(0,heroY,TRAY_Z);
scene.add(hero);
var shell=new THREE.Group();hero.add(shell);
(function(){
  var t=0.008,parts=[
    [TW,t,TD,0,-trayH/2+t/2,0],           // floor
    [TW,trayH,0.012,0,0,TD/2-0.006],      // faceplate
    [TW,trayH*0.85,0.01,0,-trayH*0.075,-TD/2+0.005],
    [t,trayH,TD,-TW/2+t/2,0,0],
    [t,trayH,TD,TW/2-t/2,0,0]
  ],lines=[];
  parts.forEach(function(p){
    var g=new THREE.BoxGeometry(p[0],p[1],p[2]),m=new THREE.Mesh(g,matShellH);
    m.position.set(p[3],p[4],p[5]);shell.add(m);
    lines.push(edgesOf(g,p[3],p[4],p[5]));
  });
  var zf=TD/2+0.0015,d=[];
  d.push([-TW/2+0.03,0,zf,-TW/2+0.085,0,zf],[TW/2-0.085,0,zf,TW/2-0.03,0,zf]);
  for(var k=0;k<4;k++)d=d.concat(rectXY(0.028+k*0.038,0,0.024,trayH*0.34,zf));
  lines.push(segs(d));
  shell.add(new THREE.LineSegments(lineGeo(lines),linShellH));
})();
/* invisible hit proxy: in the rack stages the hero is just another compute tray */
var heroProxy=new THREE.Mesh(trayGeoC,invisMat);
heroProxy.userData={tip:"ctray",hl:[TW+0.02,trayH+0.012,TD+0.02],always:true};
hero.add(heroProxy);
trayHits.push(heroProxy);

/* one GB200 superchip: board + 1 Grace + LPDDR5X + C2C links + 2 B200 packages
   (2 dies, 8 HBM, substrate each) + mezzanine strips + board linework.
   focus routes one package (gx = FOCX) to the …F materials so the stage-IV GPU
   zoom can hold it at full ink while the rest of the module ghosts. */
var BL=0.42,BW=0.195,BT=0.007; // board length (z), width (x), thickness
var FOCX=0.051,parts=[];
function superchip(focus){
  var g=new THREE.Group(),lines=[],flines=[];
  var bg=new THREE.BoxGeometry(BW,BT,BL);
  g.add(new THREE.Mesh(bg,matBoard));
  lines.push(edgesOf(bg));
  var topY=BT/2;
  var grace=new THREE.BoxGeometry(0.085,0.011,0.085);
  var gm=new THREE.Mesh(grace,matGrace);gm.position.set(0,topY+0.0055,0.125);
  gm.userData={tip:"grace",hl:[0.09,0.015,0.09]};
  g.add(gm);parts.push(gm);
  lines.push(edgesOf(grace,0,topY+0.0055,0.125));
  /* LPDDR5X: low flat soldered banks flanking Grace — CPU memory, not HBM */
  var lp=new THREE.BoxGeometry(0.032,0.005,0.042);
  [-0.0645,0.0645].forEach(function(lx){
    [0.101,0.149].forEach(function(lz){
      var lm=new THREE.Mesh(lp,matLP);lm.position.set(lx,topY+0.0025,lz);
      lm.userData={tip:"lpddr",hl:[0.036,0.008,0.046]};
      g.add(lm);parts.push(lm);
      lines.push(edgesOf(lp,lx,topY+0.0025,lz));
    });
  });
  /* NVLink-C2C: one flat link from Grace to each package */
  [-1,1].forEach(function(sgn){
    var x1=sgn*0.018,z1=0.0825,x2=sgn*FOCX,z2=-0.008;
    var len=Math.hypot(x2-x1,z2-z1);
    var cm=new THREE.Mesh(new THREE.BoxGeometry(0.014,0.0025,len),matC2C);
    cm.position.set((x1+x2)/2,topY+0.0012,(z1+z2)/2);
    cm.rotation.y=Math.atan2(x2-x1,z2-z1);
    cm.userData={tip:"c2c",hl:[0.02,0.006,len+0.01]};
    g.add(cm);parts.push(cm);
  });
  /* mezzanine strips under the board: the module ends at a connector, not at air */
  var mz=new THREE.BoxGeometry(0.012,0.006,0.36);
  [-1,1].forEach(function(sgn){
    var mm=new THREE.Mesh(mz,matMezz);
    mm.position.set(sgn*(BW/2-0.018),-BT/2-0.003,0);
    mm.userData={tip:"mezz",hl:[0.016,0.01,0.364]};
    g.add(mm);parts.push(mm);
    lines.push(edgesOf(mz,sgn*(BW/2-0.018),-BT/2-0.003,0));
  });
  var gpu=new THREE.BoxGeometry(0.058,0.011,0.058);
  var hbm=new THREE.BoxGeometry(0.0145,0.013,0.030);
  var sub=new THREE.BoxGeometry(0.104,0.003,0.180);
  var m4=new THREE.Matrix4();
  [-0.051,0.051].forEach(function(gx){
    var isF=focus&&gx===FOCX;
    var dl=isF?flines:lines;
    /* package substrate: the unit that holds the die pair and its eight stacks */
    var sm=new THREE.Mesh(sub,isF?matSubF:matSub);
    sm.position.set(gx,topY+0.0015,-0.095);
    sm.userData={tip:"pkg",hl:[0.108,0.007,0.184]};
    g.add(sm);parts.push(sm);
    dl.push(edgesOf(sub,gx,topY+0.0015,-0.095));
    var hbmMesh=new THREE.InstancedMesh(hbm,isF?matHBMF:matHBM,8),hi=0;
    hbmMesh.userData={tip:"hbm",hl:[0.018,0.016,0.034]};
    [-0.045,-0.145].forEach(function(gz){
      var gpuM=new THREE.Mesh(gpu,isF?matGPUF:matGPU);
      gpuM.position.set(gx,topY+0.0055,gz);
      gpuM.userData={tip:"die",hl:[0.062,0.015,0.062]};
      g.add(gpuM);parts.push(gpuM);
      dl.push(edgesOf(gpu,gx,topY+0.0055,gz));
      [-1,1].forEach(function(side){
        /* HBM is per-package: the center-facing row sits tight against its own die,
           leaving a stack-width seam between the two packages — two walls, never one */
        var off=side*gx<0?0.0365:0.0445;
        for(var r=0;r<2;r++){
          m4.makeTranslation(gx+side*off,topY+0.0065,gz+(r-0.5)*0.034);
          hbmMesh.setMatrixAt(hi++,m4);
        }
      });
    });
    g.add(hbmMesh);parts.push(hbmMesh);
    if(isF){
      /* NV-HBI: the seam that makes two dies present as one GPU — subject of the zoom */
      var seam=new THREE.Mesh(new THREE.BoxGeometry(0.046,0.007,0.040),matSeam);
      seam.position.set(gx,topY+0.0045,-0.095);
      seam.userData={tip:"seam",hl:[0.05,0.011,0.044]};
      g.add(seam);parts.push(seam);
      /* NVLink-5 egress: the package's path off the module toward the switch trays */
      var eg=new THREE.Mesh(new THREE.BoxGeometry(0.018,0.002,0.026),matEgress);
      eg.position.set(gx,topY+0.001,-0.196);
      eg.userData={tip:"egress",hl:[0.022,0.006,0.032]};
      g.add(eg);parts.push(eg);
      var yz=topY+0.009,ye=topY+0.002,zl=[];
      [-0.105,-0.095,-0.085].forEach(function(sz){zl.push([gx-0.017,yz,sz,gx+0.017,yz,sz])});
      zl.push([gx-0.006,ye,-0.203,gx,ye,-0.210],[gx,ye,-0.210,gx+0.006,ye,-0.203]);
      g.add(new THREE.LineSegments(lineGeo([segs(zl)]),linZoom));
    }
  });
  /* board linework: inset outline + corner mounting ticks (the old generic
     Grace->GPU traces are superseded by the explicit C2C links above).
     Segments are [x, y, z] with y the board's top surface. */
  var yb=topY+0.0008,d=[];
  var l=-(BW/2-0.009),r=BW/2-0.009,b=-(BL/2-0.009),t=BL/2-0.009;
  d.push([l,yb,b,r,yb,b],[r,yb,b,r,yb,t],[r,yb,t,l,yb,t],[l,yb,t,l,yb,b]);
  [[l+0.006,b+0.006],[r-0.006,b+0.006],[l+0.006,t-0.006],[r-0.006,t-0.006]].forEach(function(c){
    d.push([c[0]-0.004,yb,c[1],c[0]+0.004,yb,c[1]],[c[0],yb,c[1]-0.004,c[0],yb,c[1]+0.004]);
  });
  lines.push(segs(d));
  g.add(new THREE.LineSegments(lineGeo(lines),linChip));
  if(flines.length)g.add(new THREE.LineSegments(lineGeo(flines),linChipF));
  return g;
}
var chipA=superchip(false),chipB=superchip(true);
chipA.position.set(-0.118,0.012,0);
chipB.position.set(0.118,0.012,0);
hero.add(chipA);hero.add(chipB);
/* labels for the new links (sprites face the camera; opacity driven in applyP) */
var labC2C=label("NVLink-C2C","#6a665f",0.016);labC2C.position.set(0,0.030,0.037);chipB.add(labC2C);
var labSeam=label("NV-HBI · 10 TB/s","#1d1c1a",0.016);labSeam.position.set(FOCX,0.045,-0.095);chipB.add(labSeam);
var labEgr=label("NVLink-5 · 1.8 TB/s","#1d1c1a",0.015);labEgr.position.set(FOCX,0.038,-0.20);chipB.add(labEgr);
[labC2C,labSeam,labEgr].forEach(function(s){s.material.opacity=0});
/* camera anchor at the focus package's center, for the GPU-zoom key */
var focusAnchor=new THREE.Object3D();
focusAnchor.position.set(FOCX,0.01,-0.095);
chipB.add(focusAnchor);

/* ---------- the copper spine: ~5,000 cables, 378 drawn, instanced ---------- */
var CABLE_SEGS=13,cableCount=0;
var pairs=[];
for(var s=0;s<9;s++)for(var c=0;c<18;c++)pairs.push([s,c,(s*18+c)%3===0?3:2]);
pairs.forEach(function(p){cableCount+=p[2]});
var unitCyl=new THREE.CylinderGeometry(1,1,1,5,1,true);
var spine=new THREE.InstancedMesh(unitCyl,matCable,cableCount*CABLE_SEGS);
(function(){
  var m4=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),
      dir=new THREE.Vector3(),mid=new THREE.Vector3(),scl=new THREE.Vector3(),
      col=new THREE.Color(),i=0,R=0.0032;
  var curve=new THREE.CubicBezierCurve3(new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3());
  pairs.forEach(function(p){
    var sw=p[0],cp=p[1];
    for(var rep=0;rep<p[2];rep++){
      var xs=-0.20+(cp%18)*0.0235+(rnd()-0.5)*0.012;
      var xc=-0.165+(sw%4)*0.11+(rnd()-0.5)*0.05;
      var ys=switchY[sw]+(rnd()-0.5)*trayH*0.7;
      var yc=computeY[cp]+(rnd()-0.5)*trayH*0.7;
      var span=Math.abs(ys-yc)/H;
      var bow=0.13+0.50*span+rnd()*0.045;
      curve.v0.set(xs,ys,ZREAR);
      curve.v1.set(xs*1.55,ys+(yc-ys)*0.10,ZREAR-bow*0.72);
      curve.v2.set(xc*1.55,yc-(yc-ys)*0.10,ZREAR-bow);
      curve.v3.set(xc,yc,ZREAR);
      var pts=curve.getPoints(CABLE_SEGS);
      col.setHex(NETWORK).offsetHSL(0,(rnd()-0.5)*0.07,(rnd()-0.5)*0.13);
      for(var k=0;k<CABLE_SEGS;k++){
        dir.subVectors(pts[k+1],pts[k]);
        var len=dir.length();
        mid.addVectors(pts[k],pts[k+1]).multiplyScalar(0.5);
        q.setFromUnitVectors(up,dir.normalize());
        m4.compose(mid,q,scl.set(R,len,R));
        spine.setMatrixAt(i,m4);
        spine.setColorAt(i,col);
        i++;
      }
    }
  });
})();
var spineGroup=new THREE.Group();
spineGroup.add(spine);
scene.add(spineGroup);
/* invisible hit proxy around the loom (raycasting 5k cable instances is wasteful) */
var spineProxy=new THREE.Mesh(new THREE.BoxGeometry(0.86,innerHi-innerLo,0.64),invisMat);
spineProxy.position.set(0,(innerLo+innerHi)/2,ZREAR-0.32);
spineProxy.userData={tip:"spine",always:true};
spineGroup.add(spineProxy);

/* ---------- ghosted liquid-cooling manifold (stage II) ---------- */
var manifold=new THREE.InstancedMesh(unitCyl,matManif,2+computeY.length*2);
(function(){
  var m4=new THREE.Matrix4(),q=new THREE.Quaternion(),i=0,
      pos=new THREE.Vector3(),scl=new THREE.Vector3(),
      qz=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2);
  [-0.185,0.185].forEach(function(x){
    m4.compose(pos.set(x,(innerLo+innerHi)/2,-0.30),q.set(0,0,0,1),scl.set(0.015,innerHi-innerLo,0.015));
    manifold.setMatrixAt(i++,m4);
  });
  computeY.forEach(function(y){
    [-1,1].forEach(function(side){
      m4.compose(pos.set(side*0.135,y,-0.30),qz,scl.set(0.006,0.10,0.006));
      manifold.setMatrixAt(i++,m4);
    });
  });
})();
rack.add(manifold);

/* ---------- dimension callouts (utility/mono; figures already on the site) ---------- */
var labDimH=label("2.36 m","#6a665f",0.11);labDimH.position.set(-0.64,1.18,0.55);labDimH.material.opacity=0;scene.add(labDimH);
var labKW=label("~120 kW · liquid-cooled","#1d1c1a",0.095);labKW.position.set(-0.62,1.62,0.30);labKW.material.opacity=0;scene.add(labKW);
scene.add(new THREE.LineSegments(lineGeo([segs([
  [-0.46,0,0.55,-0.46,H,0.55],[-0.50,0,0.55,-0.42,0,0.55],[-0.50,H,0.55,-0.42,H,0.55]
])]),linDim));

/* ---------- choreography: master parameter p in [0,3] ---------- */
function clamp(v,a,b){return v<a?a:v>b?b:v}
function smooth(t){return t*t*(3-2*t)}
function kv(keys,p){ // keys: value at each integer stage, smooth between
  var i=Math.floor(clamp(p,0,2.999)),f=smooth(clamp(p-i,0,1));
  return keys[i]+(keys[i+1]-keys[i])*f;
}
var K={
  trayCOp:  [1,1,0.14,0.10], trayCLine:[0.8,0.8,0.10,0.06],
  traySOp:  [1,1,0.20,0.10], traySLine:[0.85,0.85,0.16,0.06],
  frameOp:  [1,1,0.30,0.12], frameLine:[0.9,0.9,0.18,0.08],
  shelfOp:  [1,1,0.25,0.10],
  cableOp:  [0.5,0.55,1,0.10],
  spineZ:   [0,0,-0.30,0],
  manifOp:  [0,0.42,0,0],
  chipOp:   [0.9,0.9,0.12,1],chipLine:[0.5,0.5,0.08,0.85],
  groundOp: [0.55,0.55,0.35,0.30],
  slideC:   [0,1,0,0],      // multiplies the uniform tray extension
  slideS:   [0,1,0,0],
  dimLine:  [0.7,0,0,0], dimLab:[0.95,0,0,0], kwLab:[0,0.9,0,0]
};
var p=0,zoom=0,zt=0,spineHot=false; // zoom: stage-IV level (0 module, 1 one GPU); zt its eased 0..1
var _v3a=new THREE.Vector3(),_v3b=new THREE.Vector3();

function applyP(){
  var t3=smooth(clamp(p-2,0,1));
  matTrayC.opacity=kv(K.trayCOp,p);   linTrayC.opacity=kv(K.trayCLine,p);
  matTrayS.opacity=kv(K.traySOp,p);   linTrayS.opacity=kv(K.traySLine,p);
  matFrame.opacity=kv(K.frameOp,p);   linFrame.opacity=kv(K.frameLine,p);
  matShelf.opacity=kv(K.shelfOp,p);
  matCable.opacity=Math.min(1,kv(K.cableOp,p)*(spineHot?1.5:1)+(spineHot?0.12:0));
  matManif.opacity=kv(K.manifOp,p);
  linGround.opacity=kv(K.groundOp,p);
  linDim.opacity=kv(K.dimLine,p);
  labDimH.material.opacity=kv(K.dimLab,p);
  labKW.material.opacity=kv(K.kwLab,p);
  spineGroup.position.z=kv(K.spineZ,p);

  var sc=kv(K.slideC,p),ss=kv(K.slideS,p);
  computeTrays.forEach(function(g){g.position.z=TRAY_Z+EXT_C*sc});
  switchTrays.forEach(function(g){g.position.z=TRAY_Z+0.02+0.34*ss});

  /* hero tray: drawer in II (open top shows the boards), recede in III,
     full extraction to a presentation position in IV.
     zt ghosts the module around the focus package at GPU zoom. */
  var chipO=kv(K.chipOp,p),chipL=kv(K.chipLine,p),gh=1-0.90*zt;
  matBoard.opacity=chipO*gh;matGrace.opacity=chipO*gh;matLP.opacity=chipO*gh;
  matMezz.opacity=chipO*gh;matSub.opacity=chipO*gh;
  matGPU.opacity=chipO*(1-0.88*zt);matHBM.opacity=chipO*(1-0.88*zt);
  matC2C.opacity=chipO*0.9*(1-zt);
  matGPUF.opacity=chipO;matHBMF.opacity=chipO;matSubF.opacity=chipO;
  matSeam.opacity=chipO*0.92*zt;matEgress.opacity=chipO*0.9*zt;
  linChip.opacity=chipL*(1-0.9*zt);linChipF.opacity=chipL;linZoom.opacity=chipL*zt;
  var pres=0;
  if(p<2){
    hero.position.set(0,heroY,TRAY_Z+0.22*sc);
    hero.rotation.set(0,0,0);
    chipA.position.set(-0.118,0.012,0);chipA.rotation.y=0;
    chipB.position.set(0.118,0.012,0);chipB.rotation.y=0;
    matShellH.opacity=kv(K.trayCOp,p);linShellH.opacity=kv(K.trayCLine,p);
  }else{
    /* extraction path: straight out of the slot, then up and to the side */
    var a=smooth(clamp(t3/0.55,0,1));            // leave the rack
    var b=smooth(clamp((t3-0.45)/0.55,0,1));     // glide to presentation
    _v3a.set(0,heroY,TRAY_Z+(TD+0.30)*a);        // rear fully clear of the rack
    _v3b.set(0.50,1.26,1.42);
    hero.position.lerpVectors(_v3a,_v3b,b);
    hero.rotation.y=-0.38*b;
    hero.rotation.x=-0.12*b;
    var wake=smooth(clamp(t3/0.30,0,1));         // subject again: back to full ink
    var ghost=smooth(clamp((t3-0.45)/0.30,0,1)); // then the shell ghosts away
    matShellH.opacity=(0.14+(1-0.14)*wake)*(1-ghost)+0.05*ghost;
    linShellH.opacity=(0.10+(0.8-0.10)*wake)*(1-ghost)+0.10*ghost;
    /* superchips lift free and separate */
    var lift=smooth(clamp((t3-0.55)/0.45,0,1));
    chipA.position.set(-0.118-0.075*lift,0.012+0.115*lift,-0.02*lift);
    chipB.position.set(0.118+0.075*lift,0.012+0.150*lift,0.06*lift);
    chipA.rotation.y=0.14*lift;chipB.rotation.y=-0.10*lift;
    pres=b;
  }
  /* link labels ride the presentation glide; level picks which set shows */
  labC2C.material.opacity=pres*(1-zt)*0.95;
  labSeam.material.opacity=pres*zt*0.95;
  labEgr.material.opacity=pres*zt*0.95;
  needs=true;
}

/* ---------- camera rig: damped orbit + designed per-stage choreography ---------- */
var cam={theta:0.55,phi:1.12,radius:4.0,target:new THREE.Vector3(0,1.18,0)};
var CAMKEYS=[
  {theta:0.55,phi:1.12,radius:4.0,target:[0,1.18,0]},
  {theta:0.30,phi:1.22,radius:3.55,target:[0,1.24,0.18]},
  {theta:2.62,phi:1.30,radius:3.5,target:[0,1.15,-0.62]},
  {theta:0.78,phi:1.18,radius:0.88,target:[0.58,1.40,1.44]} // presented superchip fills the frame
];
/* per-stage designed move: k0 is the replay start, k1 the shaping mid key;
   the resolved framing is always CAMKEYS[i] */
var CHOREO=[
  {k0:{theta:0.95,phi:1.38,radius:1.7,target:[0,1.65,0.45]},k1:{theta:0.72,phi:1.22,radius:2.9,target:[0,1.35,0.2]},dur:2600},
  {k0:{theta:-0.30,phi:1.34,radius:4.8,target:[0,0.9,0.4]},k1:{theta:0.02,phi:1.30,radius:4.2,target:[0,1.05,0.3]},dur:1600},
  {k0:{theta:1.15,phi:1.02,radius:4.9,target:[0,1.45,-0.15]},k1:{theta:1.75,phi:1.10,radius:4.5,target:[0,1.3,-0.35]},dur:1800},
  {k0:{theta:0.40,phi:0.90,radius:3.0,target:[0.1,1.6,0.7]},k1:{theta:0.62,phi:0.98,radius:2.0,target:[0.35,1.5,1.0]},dur:1600}
];
var camTween=null,camBez=null,dragging=false,vTheta=0,vPhi=0,needs=true;
var lastInteract=-1e9;

function applyCam(){
  cam.phi=clamp(cam.phi,0.15,1.55);
  cam.radius=clamp(cam.radius,0.15,7.5);
  var sp=Math.sin(cam.phi);
  camera.position.set(
    cam.target.x+cam.radius*sp*Math.sin(cam.theta),
    cam.target.y+cam.radius*Math.cos(cam.phi),
    cam.target.z+cam.radius*sp*Math.cos(cam.theta));
  camera.lookAt(cam.target);
  needs=true;
}
function setCam(key){
  cam.theta=key.theta;cam.phi=key.phi;cam.radius=key.radius;
  cam.target.set(key.target[0],key.target[1],key.target[2]);
  camTween=null;camBez=null;applyCam();
}
function cancelCamMoves(){camTween=null;camBez=null}
function tweenCam(key,dur){
  if(reduced()||dur===0){setCam(key);return}
  var dTheta=key.theta-cam.theta;
  dTheta=((dTheta+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI; // shortest arc
  camBez=null;
  camTween={t:0,dur:dur||1100,
    from:{theta:cam.theta,phi:cam.phi,radius:cam.radius,tx:cam.target.x,ty:cam.target.y,tz:cam.target.z},
    to:{theta:cam.theta+dTheta,phi:key.phi,radius:key.radius,tx:key.target[0],ty:key.target[1],tz:key.target[2]}};
}
/* one continuous designed move: quadratic bezier through a mid key (no joint pause) */
function tweenCamBezier(k0,k1,k2,dur){
  if(reduced()){setCam(k2);return}
  camTween=null;
  camBez={t:0,dur:dur,k0:k0,k1:k1,k2:k2};
  needs=true;
}
function bez(a,b,c,t){var u=1-t;return u*u*a+2*u*t*b+t*t*c}
function flyStage(i,replay){
  var c=CHOREO[i];
  if(reduced()){setCam(CAMKEYS[i]);return}
  if(replay)setCam(c.k0);
  tweenCamBezier({theta:cam.theta,phi:cam.phi,radius:cam.radius,
    target:[cam.target.x,cam.target.y,cam.target.z]},c.k1,CAMKEYS[i],c.dur);
}
function ease(t){return t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2}

/* ---------- input: orbit / zoom / pinch / hover / tap ---------- */
var pointers={},pinchD=0,lastX=0,lastY=0,downX=0,downY=0,downT=0;
canvas.style.touchAction="pan-y"; // vertical swipes still scroll the page; sideways drags turn the rack
canvas.addEventListener("pointerdown",function(e){
  canvas.setPointerCapture(e.pointerId);
  pointers[e.pointerId]=[e.clientX,e.clientY];
  var ids=Object.keys(pointers);
  if(ids.length===1){
    dragging=true;lastX=e.clientX;lastY=e.clientY;vTheta=0;vPhi=0;
    downX=e.clientX;downY=e.clientY;downT=performance.now();
    cancelCamMoves();
  }else if(ids.length===2){
    dragging=false;
    var a=pointers[ids[0]],b=pointers[ids[1]];
    pinchD=Math.hypot(a[0]-b[0],a[1]-b[1]);
  }
  interact();
});
canvas.addEventListener("pointermove",function(e){
  if(!(e.pointerId in pointers)){
    if(e.pointerType==="mouse")probe(e,false);
    return;
  }
  pointers[e.pointerId]=[e.clientX,e.clientY];
  var ids=Object.keys(pointers);
  if(ids.length===1&&dragging){
    var dx=e.clientX-lastX,dy=e.clientY-lastY;
    lastX=e.clientX;lastY=e.clientY;
    var k=0.0052;
    cam.theta-=dx*k;cam.phi-=dy*k;
    vTheta=-dx*k;vPhi=-dy*k;
    applyCam();
  }else if(ids.length===2){
    var a=pointers[ids[0]],b=pointers[ids[1]];
    var d=Math.hypot(a[0]-b[0],a[1]-b[1]);
    if(pinchD>0){cam.radius*=pinchD/d;applyCam()}
    pinchD=d;
  }
  interact();
});
function endPointer(e){
  var wasTap=dragging
    &&performance.now()-downT<300
    &&Math.hypot(e.clientX-downX,e.clientY-downY)<7;
  delete pointers[e.pointerId];
  if(Object.keys(pointers).length===0)dragging=false;
  pinchD=0;
  if(wasTap)probe(e,true);
}
canvas.addEventListener("pointerup",endPointer);
canvas.addEventListener("pointercancel",function(e){
  delete pointers[e.pointerId];
  if(Object.keys(pointers).length===0)dragging=false;
  pinchD=0;
});
canvas.addEventListener("pointerleave",function(){if(!tipSticky)clearTip()});
canvas.addEventListener("wheel",function(e){
  if(!(e.ctrlKey||e.metaKey))return; // plain scrolling moves the page; pinch and Ctrl-scroll zoom
  e.preventDefault();
  cam.radius*=Math.exp(clamp(e.deltaY,-120,120)*0.0011);
  cancelCamMoves();applyCam();interact();
},{passive:false});
function interact(){lastInteract=performance.now()}

/* ---------- tooltips + hover-highlight (facts fixed by the phase-5.2 table) ---------- */
var TIPS={
  grace:["Grace CPU","72 Arm Neoverse V2 cores; the module's host processor"],
  lpddr:["LPDDR5X","480 GB soldered CPU memory; one address space with GPU memory over C2C"],
  c2c:["NVLink-C2C","900 GB/s per GPU; CPU and GPU read each other's memory directly"],
  pkg:["B200 package","one GPU to software; two dies in silicon"],
  die:["compute die","one of two reticle-limited dies; 4NP process"],
  seam:["NV-HBI seam","10 TB/s die-to-die link; makes two dies present as one GPU"],
  hbm:["HBM3e stack","one of 8 stacks owned by this GPU alone; peer GPU reaches it only over NVLink"],
  egress:["NVLink-5 egress","1.8 TB/s to the rack fabric, via the tray board to the NVSwitch trays"],
  mezz:["mezzanine edge","the whole module mounts to the compute tray baseboard; power, cooling, and fabric routing come from the tray"],
  ctray:["compute tray","2 GB200 superchips; 1 of 18 identical drawers"],
  stray:["NVSwitch tray","1 of 9 — the rack's NVLink fabric"],
  spine:["NVLink spine","~5,000 direct copper cables; 1.8 TB/s per GPU"]
};
var raycaster=new THREE.Raycaster(),mouseNDC=new THREE.Vector2();
var tipShown=false,tipSticky=false;
var hlBox=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1)),lin(0x1d1c1a,0.9));
hlBox.matrixAutoUpdate=false;hlBox.visible=false;hlBox.renderOrder=10;
scene.add(hlBox);
var _hm=new THREE.Matrix4(),_hv=new THREE.Vector3();

function clearHL(){
  hlBox.visible=false;
  if(spineHot){spineHot=false;matCable.opacity=kv(K.cableOp,p)}
  canvas.style.cursor="grab";
  needs=true;
}
function clearTip(){tipShown=false;tipSticky=false;hovEl.style.display="none";clearHL()}
function showHL(obj,inst){
  var u=obj.userData;
  if(u.tip==="spine"){
    spineHot=true;
    matCable.opacity=Math.min(1,kv(K.cableOp,p)*1.5+0.12);
    hlBox.visible=false;
  }else{
    obj.updateWorldMatrix(true,false);
    if(obj.isInstancedMesh&&inst!==undefined){obj.getMatrixAt(inst,_hm);_hm.premultiply(obj.matrixWorld)}
    else _hm.copy(obj.matrixWorld);
    _hm.scale(_hv.set(u.hl[0],u.hl[1],u.hl[2]));
    hlBox.matrix.copy(_hm);
    hlBox.visible=true;
  }
  canvas.style.cursor="pointer";
  needs=true;
}
function showTip(t,e,r){
  hovEl.innerHTML="<b>"+t[0]+"</b> — "+t[1];
  hovEl.style.display="block";
  hovEl.style.left=Math.max(4,Math.min(e.clientX-r.left+12,r.width-292))+"px";
  hovEl.style.top=Math.max(e.clientY-r.top-34,4)+"px";
  tipShown=true;
}
function probe(e,isTap){
  var r=canvas.getBoundingClientRect();
  mouseNDC.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);
  raycaster.setFromCamera(mouseNDC,camera);
  var targets=committed===3?parts:(committed===2?[spineProxy]:trayHits.concat([spineProxy]));
  var hits=raycaster.intersectObjects(targets,false),hit=null;
  for(var i=0;i<hits.length;i++){
    var o=hits[i].object,m=o.material;
    if(!o.userData.always&&m&&m.opacity<0.05)continue; // skip parts not currently drawn
    hit=hits[i];break;
  }
  if(hit){
    var u=hit.object.userData;
    /* desktop click on the package zooms in; hover already names it */
    if(isTap&&e.pointerType==="mouse"&&committed===3&&zoom===0&&
       (u.tip==="pkg"||u.tip==="die"||u.tip==="hbm")){setZoom(1);return}
    showHL(hit.object,hit.instanceId);
    showTip(TIPS[u.tip],e,r);
    tipSticky=!!isTap&&e.pointerType!=="mouse"; // touch has no hover; its tips stay until tap-away/Esc
  }else if(isTap||!tipSticky){
    clearTip();
  }
}
window.addEventListener("keydown",function(e){
  if(e.key!=="Escape")return;
  if(tipShown){clearTip();return}
  if(zoom===1)setZoom(0);
});

/* ---------- stage-IV GPU zoom: ghost the module, settle on one package ---------- */
function setZoom(z,noCam){
  if(zoom===z)return;
  zoom=z;
  buildSubrow();updateCounts();clearTip();
  chipEl.style.display=z?"block":"none";
  if(z)chipEl.textContent="Schematic: the connections are faithful, the scale is not";
  var from=zt,to=z;
  if(reduced()){zt=to;applyP()}
  else addAnim(480,function(f){zt=from+(to-from)*smooth(f);applyP()});
  if(!noCam){
    if(z){
      focusAnchor.getWorldPosition(_v3a);
      tweenCam({theta:0.34,phi:0.66,radius:0.36,target:[_v3a.x,_v3a.y,_v3a.z]},1100);
    }else{
      tweenCam(CAMKEYS[3],1000);
    }
  }
}

/* ---------- sub-toggles (clone of the stage-button chrome) ---------- */
function buildSubrow(){
  var fid=document.activeElement&&document.activeElement.id;
  var h="";
  if(committed===3){
    h='<span class="seg-label">The superchip</span>'
     +'<button type="button" id="tg-mod" aria-pressed="'+(zoom===0)+'">The module</button>'
     +'<button type="button" id="tg-gpu" aria-pressed="'+(zoom===1)+'">Inside one GPU</button>';
  }
  subEl.innerHTML=h;
  subEl.hidden=!h;
  if(fid&&fid.indexOf("tg-")===0){var fe=document.getElementById(fid);if(fe)fe.focus()}
  var b;
  if((b=document.getElementById("tg-mod")))b.addEventListener("click",function(){setZoom(0)});
  if((b=document.getElementById("tg-gpu")))b.addEventListener("click",function(){setZoom(1)});
}

/* ---------- count footer (figures already on the site; always labeled schematic) ---------- */
function updateCounts(){
  var h="";
  if(committed===0){
    h="Acts as one machine: <b>72</b> GPUs · <b>36</b> Grace CPUs · one rack";
  }else if(committed===1){
    h="<b>18</b> compute trays · <b>9</b> NVSwitch trays · ~<b>120</b> kW, liquid-cooled";
  }else if(committed===2){
    h="Copper spine: ~<b>5,000</b> cables · <b>1.8</b> TB/s per GPU · memory sharing ends at the rack";
  }else{
    if(zoom===1)h="One B200: <b>2</b> dies · <b>1</b> NV-HBI seam · <b>8</b> HBM3e stacks";
    else h="<b>2</b> superchips per tray · each <b>1</b> Grace + <b>2</b> GPUs · <b>8</b> HBM stacks per GPU";
  }
  countsEl.innerHTML=h+'<span class="schematic">Schematic</span>';
}

/* ---------- stage / scrub driving ---------- */
var pTween=null,committed=0,camFollow=true; // camFollow: scrub drives the camera; tabs fly it themselves
function setP(v,fromScrub){
  p=clamp(v,0,3);
  if(!fromScrub)scrub.value=p;
  if(zoom===1&&p<2.995)setZoom(0,true); // leaving stage IV drops the GPU zoom
  applyP();
  var st=Math.round(p);
  if(st!==committed){
    committed=st;
    renderPanel(st);
    buildSubrow();updateCounts();clearTip();
    if(camFollow&&!dragging)tweenCam(CAMKEYS[st]);
  }
}
function animateP(to,dur){
  if(reduced()){pTween=null;setP(to);return}
  pTween={from:p,to:to,t:0,dur:dur||900};
  needs=true;
}
gotoStage=function(i){
  var replay=(i===committed&&!pTween&&Math.abs(p-i)<0.005);
  ComputeDesk.setParams({rack:i});
  camFollow=false;
  if(zoom===1)setZoom(0,true); // the stage move owns the camera
  animateP(i);
  flyStage(i,replay);
  buildSubrow();updateCounts();
  interact();
};
scrub.addEventListener("input",function(){pTween=null;camFollow=true;setP(parseFloat(this.value),true);interact()});
scrub.addEventListener("change",function(){ // release: settle on a stage
  var r=Math.round(p);
  ComputeDesk.setParams({rack:r});
  if(Math.abs(p-r)>0.002)animateP(r,420);
});
scrub.addEventListener("keydown",function(e){
  var to=null;
  if(e.key==="ArrowRight"||e.key==="ArrowUp"||e.key==="PageUp")to=Math.min(3,committed+1);
  if(e.key==="ArrowLeft"||e.key==="ArrowDown"||e.key==="PageDown")to=Math.max(0,committed-1);
  if(e.key==="Home")to=0;
  if(e.key==="End")to=3;
  if(to!==null){e.preventDefault();gotoStage(to)}
});

/* ---------- resize ---------- */
function resize(){
  var w=sceneWrap.clientWidth,h=sceneWrap.clientHeight;
  if(w===0||h===0)return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.setSize(w,h,false);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
  needs=true;
}
if(window.ResizeObserver)new ResizeObserver(resize).observe(sceneWrap);
window.addEventListener("resize",resize);

canvas.addEventListener("webglcontextlost",function(e){
  e.preventDefault();
  document.body.classList.add("no3d");
  document.getElementById("rack-motion").hidden=true;
  document.getElementById("fallback-fig").hidden=false;
});

/* ---------- frame loop: render only when something moves ---------- */
var rotationPaused=reduced(); // idle drift on unless the reader prefers reduced motion
var motionButton=document.getElementById("rack-motion");
var ICON_PAUSE='<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="2.6" height="9" rx="1"/><rect x="7.4" y="1.5" width="2.6" height="9" rx="1"/></svg>',
    ICON_PLAY='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8v8.4c0 .5.5.8.9.5l6.6-4.2c.4-.3.4-.8 0-1L3.9 1.3c-.4-.3-.9 0-.9.5z"/></svg>';
function updateMotionButton(){motionButton.innerHTML=rotationPaused?ICON_PLAY+"Play":ICON_PAUSE+"Pause";motionButton.setAttribute("aria-label",rotationPaused?"Play rotation":"Pause rotation")}
updateMotionButton();
motionButton.addEventListener("click",function(){rotationPaused=!rotationPaused;updateMotionButton()});
reduceMq.addEventListener("change",function(){rotationPaused=reduced();updateMotionButton()});
var lastT=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  var dt=Math.min(now-lastT,50);lastT=now;
  stepAnims(dt);
  if(pTween){
    pTween.t+=dt;
    var f=clamp(pTween.t/pTween.dur,0,1);
    setP(pTween.from+(pTween.to-pTween.from)*ease(f));
    if(f>=1)pTween=null;
  }
  if(camTween){
    camTween.t+=dt;
    var g=ease(clamp(camTween.t/camTween.dur,0,1));
    var a=camTween.from,b=camTween.to;
    cam.theta=a.theta+(b.theta-a.theta)*g;
    cam.phi=a.phi+(b.phi-a.phi)*g;
    cam.radius=a.radius+(b.radius-a.radius)*g;
    cam.target.set(a.tx+(b.tx-a.tx)*g,a.ty+(b.ty-a.ty)*g,a.tz+(b.tz-a.tz)*g);
    applyCam();
    if(camTween&&camTween.t>=camTween.dur)camTween=null;
  }
  if(camBez){
    camBez.t+=dt;
    var fb=ease(clamp(camBez.t/camBez.dur,0,1));
    var k0=camBez.k0,k1=camBez.k1,k2=camBez.k2;
    cam.theta=bez(k0.theta,k1.theta,k2.theta,fb);
    cam.phi=bez(k0.phi,k1.phi,k2.phi,fb);
    cam.radius=bez(k0.radius,k1.radius,k2.radius,fb);
    cam.target.set(
      bez(k0.target[0],k1.target[0],k2.target[0],fb),
      bez(k0.target[1],k1.target[1],k2.target[1],fb),
      bez(k0.target[2],k1.target[2],k2.target[2],fb));
    applyCam();
    if(camBez&&camBez.t>=camBez.dur)camBez=null;
  }
  if(!dragging&&(Math.abs(vTheta)>1e-5||Math.abs(vPhi)>1e-5)){ // inertia
    cam.theta+=vTheta;cam.phi+=vPhi;
    vTheta*=0.90;vPhi*=0.90;
    applyCam();
  }
  if(committed===0&&!rotationPaused&&!reduced()&&!document.hidden&&!dragging&&!camTween&&!camBez&&now-lastInteract>4500){
    cam.theta+=0.00035*dt/16.7; // idle drift, stage I only
    applyCam();
  }
  if(needs){renderer.render(scene,camera);needs=false}
}

/* ---------- boot ---------- */
resize();
if(initialStage){setP(initialStage)}else applyP();
applyCam();
buildSubrow();
updateCounts();
setCam(CAMKEYS[initialStage]);
requestAnimationFrame(frame);
})();
