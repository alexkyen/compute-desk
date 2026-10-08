/* A conceptual accelerator, built locally: no remote model or texture dependency. */
(function () {
  'use strict';
  const host = document.getElementById('chip-scene');
  const toggle = document.getElementById('motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!host || !window.THREE) { if(toggle) toggle.hidden = true; return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch (_) { toggle.hidden = true; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 50);
  camera.position.set(4.5, 5.3, 5.8); camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xf2f5dc, 0x2d3325, .65));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(-3, 8, 4); key.castShadow=true; key.shadow.mapSize.set(1024,1024); key.shadow.camera.left=-4; key.shadow.camera.right=4; key.shadow.camera.top=4; key.shadow.camera.bottom=-4; key.shadow.normalBias=.015; scene.add(key);
  const rim = new THREE.DirectionalLight(0xeaffad, .85); rim.position.set(4, 2, -4); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xc4d0df, .3); fill.position.set(1, 1, 6); scene.add(fill);
  const chip = new THREE.Group(); scene.add(chip); chip.rotation.y = -.25;
  const material = (color, metalness, roughness) => new THREE.MeshStandardMaterial({color, metalness, roughness});
  const board = material(0x354330, .45, .45), edge = material(0x969857, .65, .32);
  const silver = material(0xe4e7df, .65, .22), memory = material(0x20271e, .3, .45);
  const gold = material(0xc7bd77, .65, .34), trace = material(0x809352, .45, .4);
  function box(w, h, d, mat, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y,z); mesh.castShadow=true; mesh.receiveShadow=true; chip.add(mesh); return mesh;
  }
  box(3.3,.09,3.3,edge,0,-.2,0);
  box(3.2,.12,3.2,board,0,-.1,0);
  box(2.24,.08,2.24,memory,0,.015,0);
  box(1.31,.06,1.68,edge,0,.08,0);
  // Two dies, separated by a narrow physical seam.
  box(.59,.15,1.49,silver,-.315,.18,0);
  box(.59,.15,1.49,silver,.315,.18,0);
  const etch = material(0xa8b4a3,.5,.5);
  for (let k=0;k<2;k++) for(let i=0;i<15;i++) {
    box(.002,.002,1.35,etch,-.56+k*.63+i*.034,.258,0);
  }
  // Four pairs of memory packages, with metallic contacts beneath.
  [-1,1].forEach(side => {
    for(let i=0;i<4;i++) {
      const z=-.81+i*.54;
      box(.43,.045,.41,gold,side*.96,.085,z);
      box(.38,.15,.36,memory,side*.96,.17,z);
      box(.23,.002,.014,etch,side*.96,.247,z);
    }
  });
  // Dense traces and components make the substrate feel like an engineered object.
  for(let i=0;i<42;i++) {
    const v=-1.5+i*3/41;
    box(.024,.018,.095,gold,v,-.02,1.58);
    box(.024,.018,.095,gold,v,-.02,-1.58);
    box(.095,.018,.024,gold,-1.58,-.02,v);
    box(.095,.018,.024,gold,1.58,-.02,v);
    if(i%2===0) {
      box(.009,.005,.25,trace,v,-.033,1.35);
      box(.009,.005,.25,trace,v,-.033,-1.35);
      box(.25,.005,.009,trace,1.35,-.033,v);
      box(.25,.005,.009,trace,-1.35,-.033,v);
    }
  }
  for(let i=0;i<18;i++) {
    const x=-1.25+i*.145;
    [-1,1].forEach(side=>{
      box(.06,.045,.085,memory,x,.006,side*1.31);
      box(.07,.02,.018,gold,x,.008,side*1.31+.052);
      box(.07,.02,.018,gold,x,.008,side*1.31-.052);
    });
  }
  // Floating lower contact grid is visible when the user turns the package.
  const pinGeo = new THREE.SphereGeometry(.027,5,4);
  const pins = new THREE.InstancedMesh(pinGeo,gold,18*18);
  const matrix = new THREE.Matrix4(); let n=0;
  for(let x=0;x<18;x++) for(let z=0;z<18;z++) {
    matrix.makeTranslation(-1.44+x*.17,-.28,-1.44+z*.17);pins.setMatrixAt(n++,matrix);
  }
  chip.add(pins);
  renderer.domElement.setAttribute('aria-hidden','true');
  host.appendChild(renderer.domElement);host.querySelector('.chip-fallback').setAttribute('hidden','');
  toggle.hidden=false;host.parentElement.classList.add('is-live');
  let paused = reduced.matches, visible=true, dragging=false, lastX=0, targetAngle=-.25, dirty=true, raf=0, previous=0;
  function syncButton(){toggle.textContent=paused?'▷':'Ⅱ';toggle.setAttribute('aria-label',paused?'Resume chip rotation':'Pause chip rotation');toggle.setAttribute('aria-pressed',String(paused));}
  function schedule(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(frame);}
  function frame(now){
    raf=0;const dt=Math.min((now-previous)||16,40);previous=now;
    if(!paused&&!dragging){targetAngle+=dt*.00009;dirty=true;}
    if(Math.abs(chip.rotation.y-targetAngle)>.0001){chip.rotation.y += (targetAngle-chip.rotation.y)*(reduced.matches?1:.08);dirty=true;}
    if(dirty){renderer.render(scene,camera);dirty=false;}
    if((!paused&&!dragging)||Math.abs(chip.rotation.y-targetAngle)>.0001)schedule();
  }
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();dirty=true;schedule();}
  toggle.addEventListener('click',()=>{paused=!paused;syncButton();schedule();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;syncButton();schedule();});
  host.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;host.setPointerCapture(e.pointerId);});
  host.addEventListener('pointermove',e=>{if(!dragging)return;targetAngle+=(e.clientX-lastX)*.008;lastX=e.clientX;schedule();});
  function release(){dragging=false;schedule();}
  host.addEventListener('pointerup',release);host.addEventListener('pointercancel',release);
  document.addEventListener('visibilitychange',schedule);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){dirty=true;schedule();}},{rootMargin:'100px'}).observe(host);
  new ResizeObserver(resize).observe(host);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();visible=false;renderer.domElement.hidden=true;host.querySelector('.chip-fallback').removeAttribute('hidden');toggle.hidden=true;host.parentElement.classList.remove('is-live');});
  syncButton();resize();
})();
