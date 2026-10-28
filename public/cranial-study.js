import * as THREE from 'three';
import {createCranialDiagram,disposeDiagram} from './cranial-diagrams.js';
import {functionIllustration} from './cranial-functions.js';

const C=['#edac6f','#78d9e8','#f6ce69','#c4a1f3','#6bd9bb','#e9a0cd','#f195a7','#91cce9','#b8d67b','#c7a5ed','#f1bd77','#ea9ec8'];
const CN=['Olfactory','Optic nerve','Oculomotor nerve','Trochlear nerve','Trigeminal nerve','Abducens nerve','Facial nerve','Vestibulocochlear nerve','Glossopharyngeal nerve','Vagus nerve','Accessory nerve','Hypoglossal nerve'];
const nerveColor=name=>{const n=CN.findIndex(x=>name.startsWith(x));return n<0?'#e2c17b':C[n];};

// The reference KD tree queries registered SOURCE vertices. A proximal arrow
// is tied to the nerve surface nearest its actual central connection, rather
// than a bounding-box center or a guessed 2D screen coordinate.
function tree(points,depth=0){if(!points.length)return null;const axis=depth%3;points.sort((a,b)=>a[axis]-b[axis]);const i=points.length>>1;return {p:points[i],axis,left:tree(points.slice(0,i),depth+1),right:tree(points.slice(i+1),depth+1)};}
function nearestSquared(node,p,best=Infinity){if(!node)return best;const q=node.p,dx=p.x-q[0],dy=p.y-q[1],dz=p.z-q[2];best=Math.min(best,dx*dx+dy*dy+dz*dz);const delta=[dx,dy,dz][node.axis],near=delta<0?node.left:node.right,far=delta<0?node.right:node.left;best=nearestSquared(near,p,best);return delta*delta<best?nearestSquared(far,p,best):best;}

export class CranialStudy {
 constructor(viewer,routes={}){Object.assign(this,{viewer,routes,current:null,active:false,override:null,key:'',extent:'route'});this.anchorCache=new Map();this.referenceTrees=new Map();this.worldClouds=new Map();this.nerveResources=new Map();this.renderSize=new THREE.Vector2();this.overviewPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-1.48);}
 configure(step,entries){
  const key=step.id||'inspect-'+step.structure;if(key!==this.key){this.override=null;this.extent=step.presentation?.extent||'focus';this.key=key;}
  this.step=step;this.entries=entries;this.visual=step.visual||entries[0]?.visual||{};this.route=this.routes[step.route_id||String(entries[0]?.cn)];
  // Actual anatomy is the default. Relationship objects are an explicit,
  // secondary view; they never replace the original nerve automatically.
  const active=!!this.visual.map&&this.override==='diagram'&&!this.viewer.quiz;
  const signature=JSON.stringify([key,this.visual,active,entries[0]?.color]);
  if(signature!==this.signature){if(this.current)disposeDiagram(this.current.root);this.current=null;this.signature=signature;if(active){this.current=createCranialDiagram(this.visual,entries[0]?.color);this.viewer.scene.add(this.current.root);}}
  this.active=active;
  const r=this.route;this.routeNames=new Set(r?.nerve_meshes||[]);this.originNames=new Set(r?.origin_meshes||[]);this.targetNames=new Set(r?.target_meshes||[]);this.contextNames=new Set([...(r?.context_meshes||[]),...this.namesForBases(step.context_bases||[])]);
  this.focusNames=new Set(step.presentation?.focus_meshes||entries[0]?.meshes||[]);
  this.lessonContext=new Set(step.presentation?.context_meshes||[]);
  // A combined source mesh may contain filaments, bulb and tract. Zoom to
  // the explicitly bound anatomical region without moving or cutting it.
  this.regionBox=null;
  if(this.extent==='focus'&&step.presentation?.region_radius){const a=this.surfaceAnchor(entries[0],true);if(a)this.regionBox=new THREE.Box3().setFromCenterAndSize(a.position,new THREE.Vector3().setScalar(step.presentation.region_radius*2));}
  if(!r&&!this.viewer.quiz&&!this.focusNames.size){const roman=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'],wanted=step.overview_cns||roman.map((_,i)=>i+1);for(const m of this.viewer.meshes)if(m.userData.info.group==='cn-nerves'&&wanted.some(n=>m.userData.info.name.includes('('+roman[n-1]+')')))this.routeNames.add(m.userData.info.name);}
  this.syncUI();
 }
 namesForBases(bases){const wanted=new Set(bases);return this.viewer.meshes.filter(m=>wanted.has(m.userData.info.base)).map(m=>m.userData.anatomyName);}
 syncUI(){
  if(!globalThis.document?.getElementById)return;const tools=document.getElementById('cranialTools');if(!tools)return;
  document.getElementById('viewport').dataset.cranialMode=this.active?'diagram':'anatomy';document.getElementById('viewport').dataset.cranialExtent=this.extent;tools.hidden=!!this.viewer.quiz;
  document.getElementById('cnAnatomy').setAttribute('aria-pressed',String(!this.active&&this.extent==='route'));document.getElementById('cnAnatomy').textContent=this.route?'Full nerve route · 3D':'Head & upper neck · 3D';
  document.getElementById('cnFocusPoint')?.setAttribute('aria-pressed',String(!this.active&&this.extent==='focus'));
  const map=document.getElementById('cnRelationship');map.hidden=!this.visual.map;map.setAttribute('aria-pressed',String(this.active));
  document.getElementById('cranialPrecision').textContent=this.active?'OPTIONAL RELATIONSHIP DIAGRAM · NOT TO SCALE':this.extent==='focus'?'CURRENT EXPLANATION IN COLOR · SURROUNDING ANATOMY DIMMED · 3D':'FULL NERVE COURSE · ORIGINAL SOURCE GEOMETRY';
  const kind=this.step.function||this.entries[0]?.function||'overview',illustration=functionIllustration(kind,this.entries[0]?.color),picture=document.getElementById('cnFunctionPicture');
  if(picture.dataset.kind!==kind){picture.innerHTML=illustration.svg;picture.dataset.kind=kind;}document.getElementById('cnFunctionTitle').textContent=illustration.title;document.getElementById('cnFunctionCaption').textContent=illustration.caption;
  const note=document.getElementById('cnRouteNote');if(note){note.textContent=this.route?[this.route.direction,this.route.note,this.route.limitation].filter(Boolean).join(' '):'Original nerve surfaces remain registered to the brainstem and skull. Select a named nerve to see its supplied tissues.';note.closest('details').open=!!this.route?.limitation;}
 }
 returnToLesson(){this.viewer.state.isolate=false;if(this.viewer.bodyContext){this.viewer.bodyContext.expanded=false;this.viewer.bodyContext.update();}}
 setMode(mode){this.returnToLesson();this.override=mode;if(mode==='anatomy')this.extent='route';this.configure(this.step,this.entries);this.viewer.apply();this.viewer.frame(this.active?'anterior':this.step.view,true);}
 setExtent(extent){this.returnToLesson();this.extent=extent;this.override='anatomy';this.configure(this.step,this.entries);this.viewer.apply();this.viewer.frame(this.step.view,true);}
 isHeadOverview(){return !this.route&&!this.viewer.quiz&&!this.viewer.bodyContext?.expanded;}
 includePoint(p){return !this.isHeadOverview()||p.y>=1.48;} // Individual nerve routes remain uncut.
 nerveMaterial(mesh){
  let resource=this.nerveResources.get(mesh);if(resource)return resource;
  // An unlit surface erases curvature and makes a real tract look like a
  // flat ribbon. Restore normals / lighting, keeping a small color emission.
  const surface=new THREE.MeshStandardMaterial({color:'#f6ce69',side:THREE.DoubleSide,roughness:.65,metalness:0,emissiveIntensity:.12});
  // A millimetric nerve can fall below one pixel in a whole-head view. Expand
  // only its BACKFACE SILHOUETTE in clip space by 1.15 CSS pixels. Source vertex
  // positions, world transforms, anatomical diameters and picking geometry are
  // unchanged; annotation anchors continue to use the original source surface.
  const edge=new THREE.ShaderMaterial({uniforms:{ink:{value:new THREE.Color()},alpha:{value:1},cropY:{value:-1000},inverseSize:{value:new THREE.Vector2(1/1000,1/800)}},vertexShader:'uniform vec2 inverseSize; varying float sourceWorldY; void main(){sourceWorldY=(modelMatrix*vec4(position,1.0)).y;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.0);vec2 n=(projectionMatrix*vec4(normalMatrix*normal,0.0)).xy;float len=length(n);if(len>0.00001)p.xy+=n/len*inverseSize*2.3*p.w;p.z+=0.00001*p.w;gl_Position=p;}',fragmentShader:'uniform vec3 ink; uniform float alpha; uniform float cropY; varying float sourceWorldY; void main(){if(sourceWorldY<cropY)discard;gl_FragColor=vec4(ink,alpha);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',side:THREE.BackSide,transparent:true,depthWrite:false,toneMapped:false});
  const outline=new THREE.Mesh(mesh.geometry,edge);outline.name='Source nerve · screen emphasis';outline.raycast=()=>{};outline.renderOrder=1;outline.onBeforeRender=renderer=>{renderer.getSize(this.renderSize);edge.uniforms.inverseSize.value.set(1/this.renderSize.x,1/this.renderSize.y);};mesh.add(outline);
  resource={surface,edge,outline};this.nerveResources.set(mesh,resource);return resource;
 }
 apply(){
  const v=this.viewer,selected=v.activeNames,allOverview=!this.route&&!v.quiz;
  if(this.current)this.current.root.visible=this.active&&!v.bodyContext?.expanded&&!v.quiz;
  if(this.active){for(const m of v.meshes)m.visible=false;v.visibleMeshes=this.current.shown;return;}
  const shown=[];
  for(const m of v.meshes){
   const info=m.userData.info,name=info.name,g=info.group,layer=v.layers.get(m.userData.layer),chosen=selected.has(name),nerve=g==='cn-nerves',skull=g==='cn-bones',focus=this.focusNames.has(name),localContext=this.lessonContext.has(name);
   const route=this.routeNames.has(name),origin=this.originNames.has(name),target=this.targetNames.has(name),context=this.contextNames.has(name);
   let visible=chosen||focus||localContext||route||origin||target||context||g==='brainstem';
   if(layer?.manual&&layer.enabled)visible=true;if(v.state.isolate)visible=chosen;
   if(v.quiz)visible=chosen||g==='brainstem';
   m.visible=visible&&v.sideVisible(info)&&!!layer?.enabled&&layer.opacity>0;const nerveResource=nerve?this.nerveMaterial(m):null;m.material=nerveResource?.surface||m.userData.shadedMaterial;
   const mat=m.material;
   let color=chosen?v.studyColors.get(name)||info.color:route?(allOverview?nerveColor(info.base):this.route.color):target?'#78d9e8':origin?'#b89bde':nerve?nerveColor(info.base):skull?'#a99db9':g==='brainstem'?'#8d7eaa':info.color;
   const optic={'Retina':'#f6ce69','Optic nerve (II)':'#78d9e8','Optic chiasm':'#f195a7','Optic tract':'#c4a1f3','Lateral geniculate body':'#6bd9bb'};
   if(!chosen&&this.route?.cn===2&&optic[info.base])color=optic[info.base];
   if(this.extent==='focus'&&!chosen&&!focus&&!localContext)color='#998ba7';
   if(v.quiz&&v.identify&&chosen)color='#f4c85b';
   // In route view, supplied tissues remain translucent so a superficial
   // muscle cannot hide the actual nerve being followed underneath it.
   // Focus mode restores the selected tissue's opaque surface detail.
   const tissue=['cn-muscles','cn-organs'].includes(g),chosenOpacity=tissue&&this.extent==='route'&&!v.quiz?.42:1;
   mat.color.set(color);mat.opacity=layer.opacity*(chosen?chosenOpacity:route?1:target?.42:origin?.22:skull?.018:g==='brainstem'?.10:context?.16:.3);if(layer.opacityManual)mat.opacity=layer.opacity;
   if(this.extent==='focus'&&!v.quiz&&!layer.opacityManual)mat.opacity=layer.opacity*(chosen?1:skull&&localContext?.12:focus?1:localContext?.27:route?.19:target?.08:origin?.09:.035);
   mat.transparent=mat.opacity<.99;mat.depthWrite=!mat.transparent;mat.clippingPlanes=this.isHeadOverview()?[this.overviewPlane]:[];
   if(nerveResource){nerveResource.edge.uniforms.ink.value.copy(mat.color);nerveResource.edge.uniforms.alpha.value=mat.opacity;nerveResource.edge.uniforms.cropY.value=this.isHeadOverview()?1.48:-1000;nerveResource.outline.visible=mat.opacity>0;}
   mat.emissive?.set(nerve&&route||chosen?color:'#000000');if(mat.emissive)mat.emissiveIntensity=nerve?.12:chosen?.06:0;
   for(const o of m.userData.outlines||[])o.visible=false;if(m.visible)shown.push(m);
  }
  v.visibleMeshes=shown;
 }
 shouldFrame(m){
  if(this.active)return true;if(this.viewer.quiz)return this.viewer.activeNames.has(m.userData.anatomyName);
  const n=m.userData.anatomyName;if(this.extent==='focus'&&this.focusNames.size)return this.focusNames.has(n)||this.lessonContext.has(n);
  return this.viewer.activeNames.has(n)||this.routeNames.has(n)||this.originNames.has(n)||this.targetNames.has(n)||this.contextNames.has(n);
 }
 focusBox(){
  if(this.active)return this.current.bounds.clone();if(this.regionBox)return this.regionBox.clone();const box=new THREE.Box3(),p=new THREE.Vector3();for(const m of this.viewer.meshes)if(m.visible&&this.shouldFrame(m)){if(this.isHeadOverview()){for(const xyz of this.cloud(m)){p.fromArray(xyz);if(this.includePoint(p))box.expandByPoint(p);}}else box.union(new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position).applyMatrix4(m.matrixWorld));}return box;
 }
 includeFocusPoint(p){return !this.regionBox||this.regionBox.containsPoint(p);}
 anchor(entry){
  if(!this.active||entry.id!==this.entries[0]?.id)return null;const mesh=this.current.nodes.get(this.visual.target);if(!mesh)return null;const localPosition=mesh.userData.anchorLocal.clone();
  return {mesh,localPosition,position:localPosition.clone().applyMatrix4(mesh.matrixWorld),section:true,precision:'cranial-schematic',shared:'Optional named teaching object · schematic relationship, not measured anatomy'};
 }
 cloud(mesh){let points=this.worldClouds.get(mesh);if(!points){const a=mesh.geometry.attributes.position,p=new THREE.Vector3();points=[];for(let i=0;i<a.count;i++)points.push(p.fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld).toArray());this.worldClouds.set(mesh,points);}return points;}
 surfaceAnchor(entry,allowHidden=false){
  const v=this.viewer,binding=entry.anchor_binding||{},side=v.state.hemisphere;if(binding.status==='unsegmented')return null;
  const candidates=entry.meshes.map(n=>v.byName.get(n)).filter(m=>m&&v.sideVisible(m.userData.info)&&(allowHidden||m.visible));if(!candidates.length)return null;
  const key=JSON.stringify([entry.meshes,binding,side]),cached=this.anchorCache.get(key);if(cached&&cached.mesh.visible)return {...cached,position:cached.localPosition.clone().applyMatrix4(cached.mesh.matrixWorld)};
  let references=null;
  if(binding.reference_bases?.length){const refs=this.namesForBases(binding.reference_bases).map(n=>v.byName.get(n)).filter(m=>v.sideVisible(m.userData.info)),refKey=refs.map(m=>m.userData.anatomyName).join('|');references=this.referenceTrees.get(refKey);if(!references){references=tree(refs.flatMap(m=>this.cloud(m)));this.referenceTrees.set(refKey,references);}}
  const box=new THREE.Box3();for(const m of candidates)box.union(new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position).applyMatrix4(m.matrixWorld));
  const center=binding.world_hint?new THREE.Vector3(...binding.world_hint):box.getCenter(new THREE.Vector3());if(binding.world_hint&&side==='right')center.x=-center.x;
  const origin=v.transition?.to||v.camera.position,p=new THREE.Vector3();let best=null,score=Infinity;
  for(const mesh of candidates){const points=this.cloud(mesh);for(let i=0;i<points.length;i++){p.fromArray(points[i]);const d=references?nearestSquared(references,p):p.distanceToSquared(center)+(!binding.world_hint?p.distanceToSquared(origin)*.008:0);if(d<score){score=d;best={mesh,index:i};}}}
  if(!best)return null;const localPosition=new THREE.Vector3().fromBufferAttribute(best.mesh.geometry.attributes.position,best.index);
  const anchor={mesh:best.mesh,localPosition,precision:'source-vertex',bindingLabel:binding.label||best.mesh.userData.info.base,bindingNote:binding.note,regional:binding.status==='source-region',region:binding.label};this.anchorCache.set(key,anchor);
  return {...anchor,position:localPosition.clone().applyMatrix4(best.mesh.matrixWorld)};
 }
 dispose(){if(this.current)disposeDiagram(this.current.root);for(const [mesh,r]of this.nerveResources){r.outline.removeFromParent();r.edge.dispose();r.surface.dispose();mesh.material=mesh.userData.shadedMaterial;}this.nerveResources.clear();this.current=null;this.active=false;this.anchorCache.clear();this.referenceTrees.clear();this.worldClouds.clear();}
}

