import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {DRACOLoader} from './vendor/DRACOLoader.js';
import {prepareAnatomyModel,loadAnatomyModel,disposeObjectTree} from './mesh-resources.js';
import {meshLessonColors} from './lesson-palette.js?v=20261024-routes2';
import {interpolateCamera} from './camera-motion.js?v=20261024-routes2';

const CORTEX=new Set(['frontal','parietal','temporal','occipital','opercular','limbic','paracentral']);
const GYRI_COLORS=['#f18a97','#f6ca6c','#5ed2b4','#a9b5f1','#efab73','#62cbe3','#da9bce','#bdd786','#d8998f','#b6a2f3','#7bc9ba','#e2c294'];
export const MAP_COLORS={frontal:'#c77f96',parietal:'#c5ad73',temporal:'#6da9ac',occipital:'#a08dc0',opercular:'#a28b9c',limbic:'#9c84ba',paracentral:'#98ac7f'};
const sulcusFill=base=>/frontal|Precentral|Central sulcus/.test(base)?MAP_COLORS.frontal:/Postcentral|Intraparietal|Jensen/.test(base)?MAP_COLORS.parietal:/temporal|Lat_Fis|Collateral|collateral/.test(base)?MAP_COLORS.temporal:/Cingulate|Subparietal/.test(base)?MAP_COLORS.limbic:MAP_COLORS.occipital;
const layerOf=g=>g==='cn-vessels'?'vessels':g==='cn-bones'?'bones':g==='cn-muscles'?'muscles':g==='cn-organs'?'deep':CORTEX.has(g)?'cortex':g==='sulci'?'sulci':['deep','stem-internal','stem-csf'].includes(g)?'deep':['brainstem','cerebellum','stem-surface','stem-columns','stem-vessels'].includes(g)?'hindbrain':'cord';
export const LAYERS=[['cortex','Cerebral cortex'],['sulci','Sulcal landmarks'],['deep','Deep structures'],['hindbrain','Brainstem & cerebellum'],['cord','Spinal cord & nerves']];
const anterior=new THREE.Vector3(0,0,1),scratch=new THREE.Vector3();

export class BrainViewer{
 constructor(host,inventory,onPick,onChange){
  this.host=host;this.inventory=inventory;this.onPick=onPick;this.onChange=onChange;
  this.life=new AbortController();this.scene=new THREE.Scene();this.byName=new Map();this.meshes=[];this.pickExtras=[];this.pins=[];this.transition=null;this.dirty=true;this.disposed=false;
  this.state={hemisphere:'left',palette:'lobes',presentation:'map',borders:true,isolate:false,view:'lateral'};
  this.layers=new Map((inventory.layers||LAYERS).map(([key])=>[key,{enabled:true,opacity:1,manual:false}]));
  this.camera=new THREE.PerspectiveCamera(34,1,.002,8);this.camera.position.set(.5,1.64,0);
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.04;
  this.renderer.localClippingEnabled=true;
  this.renderer.domElement.setAttribute('aria-label','Interactive 3D CNS anatomy. Drag to rotate; pinch or use the wheel to zoom.');host.append(this.renderer.domElement);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.dampingFactor=.09;this.controls.minDistance=.035;this.controls.maxDistance=4;
  this.controls.touches.ONE=THREE.TOUCH.ROTATE;this.controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;this.controls.target.set(0,1.64,0);
  this.controlChange=()=>{this.dirty=true;onChange?.();};this.controlStart=()=>{this.transition=null;};this.controls.addEventListener('change',this.controlChange);this.controls.addEventListener('start',this.controlStart);
  this.scene.add(new THREE.HemisphereLight(0xe0f5ff,0x243649,2));
  const key=new THREE.DirectionalLight(0xfff4e3,2.3);key.position.set(2,3,4);this.scene.add(key);
  const fill=new THREE.DirectionalLight(0x97d6ea,.9);fill.position.set(-2,2,-3);this.scene.add(fill);
  this.scene.add(new THREE.AmbientLight(0xffffff,.35));
  this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.press=null;
  const signal=this.life.signal,canvas=this.renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{this.press={x:e.clientX,y:e.clientY};},{signal});
  canvas.addEventListener('pointerup',e=>{if(!this.press||Math.hypot(e.clientX-this.press.x,e.clientY-this.press.y)>6)return;const rect=canvas.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const hit=this.raycaster.intersectObjects([...this.meshes,...this.pickExtras,...(this.sections?.shown||[]),...(this.cranial?.current?.shown||[])].filter(m=>m.visible&&(!m.parent||m.parent.visible)),false).find(h=>this.isRenderedHit(h)&&!(this.module==='brainstem'&&h.object.userData.info?.group==='brainstem'&&h.object.material.opacity<=.12));if(hit)onPick(hit.object.userData.anatomyName);},{signal});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();onChange?.('contextlost');},{signal});
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);
  window.addEventListener('orientationchange',()=>this.resize(),{signal});document.addEventListener('fullscreenchange',()=>this.resize(),{signal});
  document.addEventListener('visibilitychange',()=>{this.dirty=true;},{signal});
  this.traceGroup=new THREE.Group();this.traceGroup.visible=false;this.scene.add(this.traceGroup);this.tracePlaying=false;
  this.resize();
 }
 async load(url){
  const draco=new DRACOLoader();draco.setDecoderPath('/vendor/');draco.setDecoderConfig({type:'wasm'});
  const loader=new GLTFLoader();loader.setDRACOLoader(draco);
  try{
   const model=await loadAnatomyModel(loader,url,this.life.signal);this.model=model.scene;this.scene.add(model.scene);
   this.meshes=prepareAnatomyModel(model.scene,'nervous');
   const meta=new Map(this.inventory.meshes.map(m=>[m.name,m]));
   const bases=[...new Set(this.inventory.meshes.map(m=>m.base))];
   for(const mesh of this.meshes){
    const name=mesh.userData.anatomyName,info=meta.get(name);if(!info||this.byName.has(name))throw Error('Invalid or duplicate anatomical mesh '+name);
    this.byName.set(name,mesh);mesh.userData.info=info;mesh.userData.layer=layerOf(info.group);mesh.userData.gyrusColor=GYRI_COLORS[bases.indexOf(info.base)%GYRI_COLORS.length];
    mesh.material.roughness=.85;mesh.material.metalness=0;mesh.material.polygonOffset=true;mesh.material.polygonOffsetFactor=1;mesh.material.polygonOffsetUnits=1;
    mesh.material.color.set(info.color);
    mesh.userData.shadedMaterial=mesh.material;
    // Preserve parcel colors and illuminate source normals to reveal folds.
    if(CORTEX.has(info.group)||info.group==='sulci')mesh.userData.mapMaterial=new THREE.MeshStandardMaterial({color:info.color,side:THREE.DoubleSide,roughness:.82,metalness:0,emissiveIntensity:.10,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
    if(CORTEX.has(info.group)){
     // 179 degrees emits source open-boundary edges, not a triangle wireframe.
     // These are categorical parcel edges; no color interpolation is used.
     const edges=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry,179),new THREE.LineBasicMaterial({color:'#162439',depthWrite:false}));edges.renderOrder=2;
     const hull=new THREE.Mesh(mesh.geometry,new THREE.MeshBasicMaterial({color:'#142133',side:THREE.BackSide,depthWrite:false}));hull.scale.setScalar(1.006);hull.renderOrder=-1;
     mesh.add(hull,edges);mesh.userData.outlines=[edges,hull];
    }
   }
   if(this.byName.size!==this.inventory.meshes.length)throw Error('Incomplete CNS model');
   this.scene.updateMatrixWorld(true);this.ready=true;this.dirty=true;
  }finally{draco.dispose();}
 }
 resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h||this.disposed)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();if(this.ready&&this.step&&(this.sections?.active||this.cranial)){if(this.bodyContext?.expanded)this.bodyContext.frameBody();else this.frame(this.state.view,true);}this.dirty=true;this.onChange?.();}
 show(step,entries,{hemisphere,quiz=false,identify=false}={}){
  this.step=step;this.entries=entries;this.activeNames=new Set(entries.flatMap(e=>e.meshes));this.preciseNames=new Set(entries.filter(e=>!e.diagram_only).flatMap(e=>e.meshes));this.studyColors=meshLessonColors(entries);this.quiz=quiz;this.identify=identify;this.state.isolate=false;this.pulseState=null;
  if(hemisphere)this.state.hemisphere=hemisphere;
  this.sections?.configure(step,entries);this.cranial?.configure(step,entries);
  if(this.bodyContext){this.bodyContext.expanded=false;this.bodyContext.returnPlate=null;this.bodyContext.update();}
  // Cranial points can switch from a millimetric source nerve to a teaching
  // diagram with its own scale. Fit immediately, avoiding a transient giant
  // board or a camera inside the newly selected structure during the tween.
  this.stopTrace();this.apply();if(this.module!=='cortex')this.frame(step.view||'lateral',!this.focus||!!this.cranial);else this.state.view=step.view||'lateral';
 }
 sideVisible(info){return this.state.hemisphere==='both'||info.side==='midline'||info.side===this.state.hemisphere;}
 apply(){
  if(!this.ready||!this.step)return;
  const mode=this.step.mode,insula=mode==='insula',auditory=mode==='auditory',medial=this.state.view==='medial';
  const peeled=['Opercular part of inferior frontal gyrus','Triangular part of inferior frontal gyrus','Superior temporal gyrus (Lateral part)','Supramarginal gyrus','Temporal plane','Insula (Subcentral gyrus and ant. and post. sulci*)'];
  const shown=[];
  for(const mesh of this.meshes){
   const info=mesh.userData.info,g=info.group,layer=this.layers.get(mesh.userData.layer),selected=this.activeNames.has(info.name);
   let visible=CORTEX.has(g)||g==='sulci'||g==='cerebellum'||g==='brainstem';
   if(mode==='deep')visible=selected||g==='brainstem';
   if(mode==='grey-white')visible=selected&&!(g==='cord');
   if(mode==='cord')visible=selected||g==='cord'||g==='peripheral'||g==='brainstem';
   if(mode==='brain-components')visible=CORTEX.has(g)||['cerebellum','brainstem'].includes(g)||(this.state.presentation==='map'&&g==='sulci');
   if(mode==='inferior')visible=CORTEX.has(g)||g==='sulci';
   if(medial&&info.name==='Corpus callosum')visible=selected||mode==='deep';
   if((insula||auditory)&&peeled.includes(info.base))visible=false;
   if(auditory&&['Transverse temporal gyri','Temporal plane'].includes(info.base))visible=true;
   if(selected)visible=true;
   // Sulcal meshes are deep ribbon walls, not an extra cortical skin.
   // In the illustrated map the draped strokes depict unselected grooves;
   // drawing all their walls over the gyri hid legitimate gyrus pointers.
   if(this.module==='cortex'&&this.state.presentation==='map'&&g==='sulci'&&!selected)visible=false;
   if(this.step.reveal_bases?.includes(info.base)&&!selected)visible=false;
   if(this.state.presentation==='map'&&!selected&&!['brain-components','deep','grey-white','cord'].includes(mode)&&['brainstem','cerebellum'].includes(g))visible=false;
   if(layer.manual&&layer.enabled)visible=true;
   if(this.module==='brainstem'){
    // Whole brain/cerebellum remain available through their layer switches,
    // but the default teaching view exposes BOTH sides of the brainstem.
    visible=['brainstem','stem-surface','stem-nerves'].includes(g)||selected;
    if(layer.manual&&layer.enabled)visible=true;
    if(g==='stem-vessels')visible=selected;
    if(g==='stem-internal'||g==='stem-csf'||g==='stem-columns')visible=selected;
   }
   if(this.tracePlaying){visible=['brainstem'].includes(g)||['Middle frontal gyrus','Angular gyrus','Corpus callosum'].includes(info.base);}
   if(this.state.isolate)visible=selected;
   if(this.sections?.active&&!this.bodyContext?.expanded)visible=false;
   mesh.visible=visible&&this.sideVisible(info)&&layer.enabled&&layer.opacity>0;
   const map=this.state.presentation==='map';
   mesh.material=(map?mesh.userData.mapMaterial:mesh.userData.shadedMaterial)||mesh.material;
   const mat=mesh.material;
   let color=info.color;
   if(map&&CORTEX.has(g))color=MAP_COLORS[g];
   if(this.state.palette==='gyri'&&CORTEX.has(g))color=mesh.userData.gyrusColor;
   // A narrow selected gyrus is a colored strip BETWEEN its actual sulci.
   // Functional parcels remain regional locators, as stated in the data.
   if(map&&selected&&CORTEX.has(g)&&this.activeNames.size<=6)color=info.base==='Postcentral gyrus'?'#d39ab1':'#b8a0d5';
   // Sulcus meshes include the deep ribbon walls. Fill those softly, then
   // draw a thin surface centerline; darkening the whole ribbon makes holes.
   if(map&&g==='sulci')color=sulcusFill(info.base);
   if(g==='sulci'&&selected)color=info.base==='Circular sulcus of insula'?'#f5a064':'#f8df8b';
   if(mode==='grey-white')color=info.group==='deep'?'#e8e7de':'#dca6b0';
   if(this.module==='brainstem'){
    const stemColors={Midbrain:'#ed9c93',Pons:'#b9a0e5','Medulla oblongata':'#63c9ca','Base of peduncle':'#e7a895','Superior colliculus':'#efc15c','Inferior colliculus':'#88d2a4','Pyramid of medulla oblongata':'#e8bc67',Olive:'#ed9aca'};
    color=stemColors[info.base]||info.color;
   }
   if(selected&&!this.quiz&&(this.module!=='brainstem'||this.preciseNames.has(info.name)))color=this.studyColors.get(info.name)||color;
   if(this.quiz&&this.identify&&selected)color='#f4c85b';
   const internal=this.module==='brainstem'&&(this.step.internal||this.entries?.some(e=>e.meshes.some(n=>['stem-internal','stem-csf','stem-surface'].includes(this.byName.get(n)?.userData.info.group))));
   mat.color.set(color);mat.opacity=layer.opacity*(internal&&!layer.opacityManual&&['brainstem','stem-surface'].includes(g)&&(!selected||!this.preciseNames.has(info.name)) ? .1 : 1);mat.transparent=mat.opacity<1;mat.depthWrite=mat.opacity>.99;mat.vertexColors=false;
   if(this.module==='brainstem'&&g==='stem-nerves'){
    // Keep the actual nerve roots. Distal facial/neck branches do not make
    // a giant focus box or obscure the small root exit being taught.
    this.stemClipPlanes||=this.makeStemClipPlanes();mat.clippingPlanes=this.stemClipPlanes;
   }
   mat.emissive?.set((map||selected)&&!this.quiz?color:'#000000');if(mat.emissive)mat.emissiveIntensity=map&&!this.quiz?.10:selected&&!this.quiz?.045:0;mat.needsUpdate=true;
   for(const outline of mesh.userData.outlines||[]){outline.visible=this.state.borders&&!map;outline.material.opacity=layer.opacity;outline.material.transparent=layer.opacity<1;}
   if(mesh.visible)shown.push(mesh);
  }
  this.sections?.apply();this.visibleMeshes=this.sections?.active&&!this.bodyContext?.expanded?this.sections.shown:shown;this.cranial?.apply();this.scene.updateMatrixWorld(true);this.dirty=true;
 }
 setLayer(key,enabled,opacity){const layer=this.layers.get(key);if(enabled!==undefined){layer.enabled=enabled;layer.manual=true;}if(opacity!==undefined){layer.opacity=opacity;layer.opacityManual=true;}this.apply();}
 stemBox(){const box=new THREE.Box3();for(const m of this.meshes)if(m.userData.info.group==='brainstem')box.union(new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position).applyMatrix4(m.matrixWorld));return box;}
 makeStemClipPlanes(){const b=this.stemBox().expandByScalar(.02);return [new THREE.Plane(new THREE.Vector3(1,0,0),-b.min.x),new THREE.Plane(new THREE.Vector3(-1,0,0),b.max.x),new THREE.Plane(new THREE.Vector3(0,1,0),-b.min.y),new THREE.Plane(new THREE.Vector3(0,-1,0),b.max.y),new THREE.Plane(new THREE.Vector3(0,0,1),-b.min.z),new THREE.Plane(new THREE.Vector3(0,0,-1),b.max.z)];}
 isRenderedHit(hit){return !(hit.object.material.clippingPlanes||[]).some(p=>p.distanceToPoint(hit.point)<0);}
 focusBox(){
  if(this.cranial)return this.cranial.focusBox();
  if(this.sections?.active&&!this.bodyContext?.expanded)return this.sections.bounds.clone();
  if(this.module==='brainstem'&&!this.state.isolate)return this.stemBox().expandByScalar(.008);
  if(this.step?.mode==='brain-components'&&!this.state.isolate&&!this.quiz){const box=new THREE.Box3();for(const m of this.visibleMeshes||[])box.union(new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position).applyMatrix4(m.matrixWorld));return box;}
  // The illustrated map teaches the relationship to neighboring gyri. Keep
  // the hemisphere in frame until the learner explicitly chooses Isolate.
  if(this.state.presentation==='map'&&!this.state.isolate&&!this.quiz&&!['cord','brain-components'].includes(this.step?.mode)&&this.entries?.some(e=>e.meshes.some(n=>CORTEX.has(this.byName.get(n)?.userData.info.group)||this.byName.get(n)?.userData.info.group==='sulci'))){
   const context=new THREE.Box3();for(const m of this.meshes)if(m.visible&&CORTEX.has(m.userData.info.group))context.union(new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position).applyMatrix4(m.matrixWorld));if(!context.isEmpty())return context;
  }
  const box=new THREE.Box3();for(const mesh of this.meshes)if(mesh.visible&&(this.activeNames.has(mesh.userData.anatomyName)||(this.quiz&&!this.identify&&CORTEX.has(mesh.userData.info.group))))box.union(new THREE.Box3().setFromBufferAttribute(mesh.geometry.attributes.position).applyMatrix4(mesh.matrixWorld));
  if(box.isEmpty())for(const mesh of this.visibleMeshes||[])box.union(new THREE.Box3().setFromBufferAttribute(mesh.geometry.attributes.position).applyMatrix4(mesh.matrixWorld));
  return box;
 }
 frame(view=this.state.view,immediate=false){
  if(!this.ready||!this.step)return;if(this.bodyContext?.expanded){this.bodyContext.frameBody();return;}this.state.view=view;
  // A medial view requires the opposite hemisphere to be removed, rather
  // than leaving an opaque hemisphere between the learner and the midline.
  if(view==='medial'&&this.state.hemisphere==='both')this.state.hemisphere='left';
  this.apply();
  const box=this.focusBox();if(box.isEmpty())return;
  const center=box.getCenter(new THREE.Vector3()),sphere=box.getBoundingSphere(new THREE.Sphere()),left=this.state.hemisphere!=='right';
  const sectional=this.sections?.active||this.cranial?.active;
  const directions=sectional?{anterior:[0,0,1],lateral:[.55,.3,1],medial:[-.55,.3,1],posterior:[0,0,1],superior:[0,.55,1],inferior:[0,-.55,1]}:{lateral:[left?1:-1,.08,.06],medial:[left?-1:1,.04,.01],superior:[.001,1,.001],inferior:[.001,-1,.001],anterior:[0,.04,1],posterior:[0,.04,-1]};
  const direction=new THREE.Vector3(...directions[view]).normalize();
  this.camera.up.set(...(!sectional&&['superior','inferior'].includes(view)?[0,0,1]:[0,1,0]));
  const half=Math.min(THREE.MathUtils.degToRad(this.camera.fov/2),Math.atan(Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))*this.camera.aspect));
  let distance=Math.max(.085,sphere.radius/Math.sin(half)*1.36);
  // The rail reserves the bottom of the viewport. Looking slightly below the
  // anatomical center moves the model UP, leaving the teaching surface clear.
  const target=center.clone().addScaledVector(this.camera.up,-sphere.radius*.42);
  if((this.state.presentation==='map'||this.getTeachingSpace)&&this.host){
   // Fit the actual box in the free canvas rectangle, rather than shrinking
   // the brain with a bounding-sphere factor intended for peripheral cards.
   const viewport=this.host.parentElement,rect=this.host.getBoundingClientRect(),w=this.host.clientWidth,h=this.host.clientHeight;
   const tops=(this.quiz?['.quiz-panel']:['.view-heading','.camera-hud','.stem-tools','.cranial-tools','.legend','.map-caption']).map(s=>viewport.querySelector(s)).filter(e=>e&&!e.hidden&&e.getClientRects().length).map(e=>e.getBoundingClientRect().bottom-rect.top);
   const top=Math.max(32,...tops)+18,rail=viewport.querySelector('.tour-rail'),railBottom=rail&&!rail.hidden&&rail.getClientRects().length?rail.getBoundingClientRect().top-rect.top-18:h-30;
   const teaching=this.getTeachingSpace?.(),bottom=Math.min(railBottom,teaching?.bottom??h),leftEdge=this.cranial&&w>=1200?250:this.bodyContext?.enabled&&w>=900?130:16,rightEdge=teaching?.right??w-24;
   const available=Math.max(40,bottom-top),right=new THREE.Vector3().crossVectors(this.camera.up,direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize();
   const ty=Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2)),tx=ty*this.camera.aspect;
   const halfX=(rightEdge-leftEdge)/w*.94,halfY=available/h*.95;
   const qx=(leftEdge+rightEdge)/w-1,qy=1-(top+bottom)/h;
   distance=.085;
   // An eight-corner world box invents near-camera corners above the crown
   // that no brain vertex occupies. Fit the real visible source vertices.
   const p=new THREE.Vector3();
   for(const mesh of this.visibleMeshes){
    if(this.cranial&&!this.cranial.shouldFrame(mesh))continue;
    if(!sectional&&this.module==='brainstem'&&mesh.userData.info.group!=='brainstem'&&!this.state.isolate)continue;
    // Cortical-map filtering must NOT discard every brainstem surface when
    // a small colliculus/nucleus is selected. That left distance at .085 m
    // and enlarged/cropped the entire stem behind the former image overlay.
    // CranialStudy already selected the complete route, origin and targets.
    // Reapplying the cortical filter discards every overview nerve when no
    // primary mesh is selected, leaving distance at .085 m and zooming inside
    // the model. Do not filter a cranial route a second time.
    if(!this.cranial&&!sectional&&this.module!=='brainstem'&&this.step.mode!=='brain-components'&&!this.state.isolate&&!CORTEX.has(mesh.userData.info.group)&&!this.activeNames.has(mesh.userData.anatomyName)&&!this.step.context_bases?.includes(mesh.userData.info.base))continue;
    const positions=mesh.geometry.attributes.position;
    for(let i=0;i<positions.count;i++){
     p.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);if(this.cranial&&!sectional&&(!this.cranial.includePoint(p)||!this.cranial.includeFocusPoint(p)))continue;p.sub(center);const depth=p.dot(direction);
     if(this.cranial){
      // Solve each perspective inequality in the OFFSET teaching rectangle.
      // x_ndc=(x+qx*D*tx)/(tx*(D-depth)); its left/right bounds have different
      // depth terms. The symmetric abs(x)+depth approximation can crop a long
      // nerve after the camera shifts sideways/up to make space for cards.
      const x=p.dot(right)/tx,y=p.dot(up)/ty;
      distance=Math.max(distance,depth+.01,(x+(qx+halfX)*depth)/halfX,(-x-(qx-halfX)*depth)/halfX,(y+(qy+halfY)*depth)/halfY,(-y-(qy-halfY)*depth)/halfY);
     }else distance=Math.max(distance,Math.abs(p.dot(right))/(tx*((rightEdge-leftEdge)/w)*.94)+depth,Math.abs(p.dot(up))/(ty*(available/h)*.95)+depth);
    }
   }
   target.copy(center).addScaledVector(up,((top+bottom)/2/h-.5)*2*distance*ty).addScaledVector(right,(.5-(leftEdge+rightEdge)/2/w)*2*distance*tx);
  }
  const position=target.clone().addScaledVector(direction,distance);
  // Prevent orbit zoom from entering and clipping away the teaching surface.
  if(this.module==='cortex')this.controls.minDistance=Math.max(.035,sphere.radius*1.08);
  if(this.cranial){this.cranial.framedDistance=distance;this.controls.maxDistance=Math.max(4,distance*1.05);}
  if(immediate||globalThis.document?.hidden||matchMedia('(prefers-reduced-motion:reduce)').matches){this.camera.position.copy(position);this.controls.target.copy(target);this.controls.update();this.transition=null;}
  else this.transition={time:performance.now(),from:this.camera.position.clone(),fromTarget:this.controls.target.clone(),to:position,target};
  this.focus=center;this.dirty=true;this.onChange?.('view');
 }
 zoom(factor){if(!this.ready)return;this.transition=null;this.camera.position.sub(this.controls.target).multiplyScalar(factor).clampLength(this.controls.minDistance,this.controls.maxDistance).add(this.controls.target);this.controls.update();this.dirty=true;}
 meshFor(entry){
  const preferred={grey:'Precentral gyrus',frontal:'Middle frontal gyrus',parietal:'Superior parietal lobule',temporal:'Middle temporal gyrus',occipital:'Lateral occipital gyrus (Middle occipital gyrus*)',cerebrum:'Middle frontal gyrus',brainstem:'Pons',cerebellum:'Superior semilunar lobule',grey:'Precentral gyrus',white:'White matter of telencephalon',insula:'Circular sulcus of insula'}[entry.id];
  const candidates=entry.meshes.map(n=>this.byName.get(n)).filter(m=>m?.visible);
  return candidates.find(m=>m.userData.info.base===preferred)||candidates[0];
 }
 anchor(entry,at){
   if(this.cranial)return this.cranial.anchor(entry)||this.cranial.surfaceAnchor(entry);
   if(this.sections?.active)return this.sections.anchor(entry);
   // An unavailable fine segmentation still has a valid parent-region mesh.
   // Return an explicitly REGIONAL source anchor; do not silently lose its
   // teaching arrow, or pretend the parent surface is a segmented tract.
   if(entry.diagram_only&&this.module!=='brainstem')return null;
  let mesh=this.meshFor(entry);if(!mesh)return null;
   if(this.module==='brainstem'&&['stem-nerves','stem-vessels','stem-columns'].includes(mesh.userData.info.group)){
    // Whole nerve/vessel/column centers can be in the face, neck or cord.
    // Pin the actual proximal/upper source vertices near the displayed stem,
    // never the off-screen center of a long structure. No geometry is moved.
   const b=this.stemBox(),crop=b.clone().expandByScalar(.02),center=b.getCenter(new THREE.Vector3()),a=mesh.geometry.attributes.position,candidates=[],p=new THREE.Vector3();
   for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld);if(crop.containsPoint(p))candidates.push({index:i,d:p.distanceToSquared(center)});}
   candidates.sort((a,b)=>a.d-b.d);if(candidates.length){
    const origin=this.transition?.to||this.camera.position,ray=new THREE.Raycaster(),shell=this.visibleMeshes.filter(m=>['brainstem','stem-surface'].includes(m.userData.info.group));let index=candidates[0].index;
    for(const c of candidates.slice(0,90)){p.fromBufferAttribute(a,c.index).applyMatrix4(mesh.matrixWorld);const delta=p.clone().sub(origin),distance=delta.length();ray.set(origin,delta.normalize());const hit=ray.intersectObjects(shell,false)[0];if(!hit||hit.distance>=distance-.0015){index=c.index;break;}}
    const localPosition=new THREE.Vector3().fromBufferAttribute(a,index);return {mesh,localPosition,position:localPosition.clone().applyMatrix4(mesh.matrixWorld)};
   }
  }
  let surfaceHit=null;
  if(!at){
   // A grouped structure (for example brainstem) may have its preferred
   // mesh covered by another component. Use a visible surface of another
   // actual member, rather than pinning an invisible center behind it.
   const origin=this.transition?.to||this.camera.position,ray=new THREE.Raycaster(),visible=this.meshes.filter(m=>m.visible&&m.userData.info.group!=='sulci');
   const candidates=[mesh,...entry.meshes.map(n=>this.byName.get(n)).filter(m=>m?.visible&&m!==mesh)];
   for(const candidate of candidates){
    const center=new THREE.Box3().setFromBufferAttribute(candidate.geometry.attributes.position).applyMatrix4(candidate.matrixWorld).getCenter(new THREE.Vector3());
    ray.set(origin,center.clone().sub(origin).normalize());const hit=ray.intersectObjects(visible,false)[0];
    if(hit&&entry.meshes.includes(hit.object.userData.anatomyName)){mesh=hit.object;surfaceHit=mesh.worldToLocal(hit.point.clone());break;}
   }
  }
  mesh.updateWorldMatrix(true,false);const box=mesh.geometry.boundingBox||new THREE.Box3().setFromBufferAttribute(mesh.geometry.attributes.position),point=box.getCenter(new THREE.Vector3());
  if(at){
   // Anatomical superior/anterior fractions live in WORLD coordinates.
   // Source GLB nodes can rotate/scale their local buffer axes.
   const bounds=new THREE.Box3().setFromBufferAttribute(mesh.geometry.attributes.position).applyMatrix4(mesh.matrixWorld),target=bounds.getCenter(new THREE.Vector3());
   for(const [axis,fraction]of Object.entries(at))target[axis]=THREE.MathUtils.lerp(bounds.min[axis],bounds.max[axis],axis==='x'&&this.state.hemisphere==='right'?1-fraction:fraction);
   const a=mesh.geometry.attributes.position,q=new THREE.Vector3();let best=Infinity,index=0;
   for(let i=0;i<a.count;i++){q.fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld);const d=q.distanceToSquared(target);if(d<best){best=d;index=i;}}
   const localPosition=new THREE.Vector3().fromBufferAttribute(a,index);return {mesh,localPosition,position:localPosition.clone().applyMatrix4(mesh.matrixWorld)};
  }
  const direction=(this.transition?.to||this.camera.position).clone().sub(this.transition?.target||this.controls.target).normalize().transformDirection(mesh.matrixWorld.clone().invert());
  const size=box.getSize(new THREE.Vector3());point.addScaledVector(direction,size.length()*.28);
  if(surfaceHit)point.copy(surfaceHit);
  if(at)for(const [axis,fraction]of Object.entries(at))point[axis]=THREE.MathUtils.lerp(box.min[axis],box.max[axis],fraction);
  const positions=mesh.geometry.attributes.position;let best=Infinity,index=0;
  // Snap to an ACTUAL source surface vertex, not an empty box center.
  for(let i=0;i<positions.count;i++){scratch.fromBufferAttribute(positions,i);const d=scratch.distanceToSquared(point);if(d<best){best=d;index=i;}}
  const localPosition=new THREE.Vector3().fromBufferAttribute(positions,index),position=localPosition.clone().applyMatrix4(mesh.matrixWorld);
   return {mesh,localPosition,position,color:mesh.userData.info.group==='sulci'?'#f8df8b':mesh.userData.info.color,regional:!!entry.diagram_only,region:entry.diagram_only?mesh.userData.info.base:null};
 }
 lock(locked){this.controls.enabled=!locked;this.renderer.domElement.style.touchAction=locked?'pan-y':'none';}
 pulse(names,color){this.pulseState={names:new Set(names),color:new THREE.Color(color),start:performance.now()};this.dirty=true;}
 stopTrace(){this.tracePlaying=false;while(this.traceGroup.children.length){const o=this.traceGroup.children[0];this.traceGroup.remove(o);o.geometry?.dispose();o.material?.dispose();}this.traceGroup.visible=false;this.traceCurve=null;this.traceMarker=null;}
 toggleTrace(kind){
  if(this.tracePlaying){this.stopTrace();this.apply();return false;}
  this.stopTrace();
  const point=base=>{const side=this.state.hemisphere==='right'?'.r':'.l',m=this.byName.get(base+side)||this.byName.get(base);return new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position).applyMatrix4(m.matrixWorld).getCenter(new THREE.Vector3());};
  const left=point('Middle frontal gyrus'),back=point('Angular gyrus'),callosum=point('Corpus callosum'),pons=point('Pons');
  let points,color;
  if(kind==='association'){points=[left,left.clone().lerp(back,.5).add(new THREE.Vector3(.015,.07,0)),back];color='#f0be68';}
  else if(kind==='commissural'){const a=left.clone();a.x=Math.abs(a.x);const b=a.clone();b.x=-b.x;points=[a,a.clone().lerp(callosum,.6),callosum,callosum.clone().lerp(b,.4),b];color='#e190c0';}
  else {points=[left,left.clone().lerp(pons,.4),pons];color='#67d4e6';}
  this.traceCurve=new THREE.CatmullRomCurve3(points);const tube=new THREE.Mesh(new THREE.TubeGeometry(this.traceCurve,70,.0009,7,false),new THREE.MeshBasicMaterial({color}));
  const marker=new THREE.Mesh(new THREE.SphereGeometry(.002,12,8),new THREE.MeshBasicMaterial({color:'#fff6bc'}));this.traceGroup.add(tube,marker);this.traceMarker=marker;this.traceStart=performance.now();this.tracePlaying=true;this.traceGroup.visible=true;this.apply();this.frame(this.step.view);return true;
 }
 tick(now){
  if(this.disposed)return false;let changed=this.dirty;
  if(this.transition){const t=Math.min(1,(now-this.transition.time)/650),s=t*t*(3-2*t);interpolateCamera(this.transition,s,this.camera.position,this.controls.target);if(t===1)this.transition=null;changed=true;}
  if(this.controls.update())changed=true;
  if(this.tracePlaying&&this.traceCurve&&!globalThis.document?.hidden){this.traceCurve.getPoint(((now-this.traceStart)/2600)%1,this.traceMarker.position);changed=true;}
  if(this.pulseState){const t=(now-this.pulseState.start)/900;for(const mesh of this.meshes)if(this.pulseState.names.has(mesh.userData.anatomyName)){if(mesh.material.emissive){mesh.material.emissive.copy(this.pulseState.color);mesh.material.emissiveIntensity=Math.max(0,.7*(1-t));}else mesh.material.color.lerp(this.pulseState.color,.15);}if(t>=1){this.pulseState=null;this.apply();}changed=true;}
  if(changed){this.scene.updateMatrixWorld(true);this.renderer.render(this.scene,this.camera);this.bodyContext?.render();this.dirty=false;}
  return changed;
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.life.abort();this.resizeObserver.disconnect();this.stopTrace();this.sections?.dispose();this.cranial?.dispose();this.bodyContext?.dispose();this.controls.removeEventListener('change',this.controlChange);this.controls.removeEventListener('start',this.controlStart);this.controls.dispose();for(const m of this.meshes){const other=m.material===m.userData.mapMaterial?m.userData.shadedMaterial:m.userData.mapMaterial;other?.dispose();}if(this.model)disposeObjectTree(this.model);this.byName.clear();this.meshes.length=0;this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();}
}
