import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';
import * as THREE from './public/vendor/three.module.js';
import {BrainViewer} from './public/scene.js';
import {CranialStudy} from './public/cranial-study.js';
import {createCranialDiagram,disposeDiagram} from './public/cranial-diagrams.js';
import {pointEntries} from './public/lecture-point.js';
import {LeaderProjector} from './public/leader-projection.js';
import {functionIllustration} from './public/cranial-functions.js';
import config from './worker/site-config.mjs';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const d=await json('public/data/lecture-3.json'),source=await json('cranial-source.json'),inv=await json('public/data/cranial-structures.json'),byId=new Map(d.structures.map(e=>[e.id,e])),meta=new Map(inv.meshes.map(e=>[e.name,e]));
assert.equal(d.source_pages.length,17);assert.equal(meta.size,450);assert(config.lectures['3']);assert(d.routes);
assert.equal(new Set(d.steps.map(s=>s.id)).size,d.steps.length);
for(const page of source.pages){
 const covered=[];for(const step of d.steps.filter(s=>s.page===page.page)){assert.equal([step.text,...step.bullets].join('\n'),step.source_excerpt);assert.equal(step.source_lines.map(i=>page.lines[i]).join('\n'),step.source_excerpt);covered.push(...step.source_lines);}
 assert.deepEqual(covered,page.lines.map((_,i)=>i));await access('public/slides/cranial/slide-'+String(page.page).padStart(2,'0')+'.jpg');
}
for(let i=1;i<=4;i++)await access('public/slides/cranial/memory-'+i+'.jpg');
for(const step of d.steps){assert(byId.has(step.structure));assert(step.targets.length);assert(step.targets.every(n=>byId.get(step.structure).meshes.includes(n)&&meta.has(n)));assert(d.chapters.some(c=>c.id===step.chapter));assert(step.anchor_binding);for(const n of step.focus_targets)assert(meta.has(n));for(const e of pointEntries(step,byId)){for(const n of e.meshes)assert(meta.has(n));for(const b of e.anchor_binding?.reference_bases||[])assert(inv.meshes.some(m=>m.base===b));}if(step.anchor_binding.status==='unsegmented')assert.equal(step.focus_targets.length,0);}
for(const r of Object.values(d.routes))for(const k of ['nerve_meshes','origin_meshes','target_meshes','context_meshes'])for(const n of r[k])assert(meta.has(n));
for(const q of d.quiz){assert.equal(new Set(q.choices).size,4);assert(q.choices.includes(q.answer));q.choices.forEach(x=>assert(byId.has(x)));}
assert(d.steps.filter(s=>s.page===14).findIndex(s=>s.title.includes('Traditional'))<d.steps.filter(s=>s.page===14).findIndex(s=>s.title.includes('Meningeal')),'Drawing order replaced visual reading order');
const glb=raw=>{const n=raw.readUInt32LE(12);return {j:JSON.parse(raw.subarray(20,20+n)),bin:raw.subarray(28+n)};};
const originals={};for(const sys of ['nervous','muscular','skeletal','visceral','cardiovascular'])originals[sys]=glb(await readFile('../tmp/'+sys+'_male.glb'));
const {j,bin}=glb(await readFile('public/models/cranial.glb'));
const context=vm.createContext({console,WebAssembly,TextDecoder,TextEncoder,setTimeout,clearTimeout});vm.runInContext(await readFile('public/vendor/draco_wasm_wrapper.js','utf8'),context);
const draco=await context.DracoDecoderModule({wasmBinary:await readFile('public/vendor/draco_decoder.wasm')}),decoder=new draco.Decoder();
const scene=new THREE.Scene(),meshes=[],byName=new Map(),originalMatrices=new Map();
for(const n of j.nodes){
 const info=meta.get(n.name),o=originals[info.source_system],old=o.j.nodes.find(x=>x.name===n.name);assert(old,n.name);
 for(const k of ['translation','rotation','scale','matrix'])assert.deepEqual(n[k],old[k],n.name+': transform changed');
 const p=j.meshes[n.mesh].primitives[0],oldP=o.j.meshes[old.mesh].primitives[0],ext=p.extensions.KHR_draco_mesh_compression,v=j.bufferViews[ext.bufferView],oldV=o.j.bufferViews[oldP.extensions.KHR_draco_mesh_compression.bufferView],compressed=bin.subarray(v.byteOffset,v.byteOffset+v.byteLength);
 assert.deepEqual(compressed,o.bin.subarray(oldV.byteOffset,oldV.byteOffset+oldV.byteLength),n.name+': geometry changed');
 const b=new draco.DecoderBuffer();b.Init(compressed,compressed.length);const decoded=new draco.Mesh(),status=decoder.DecodeBufferToMesh(b,decoded);assert(status.ok());const geometry=new THREE.BufferGeometry();
 for(const [semantic,key]of [['POSITION','position'],['NORMAL','normal']]){const attr=decoder.GetAttributeByUniqueId(decoded,ext.attributes[semantic]),a=new draco.DracoFloat32Array();decoder.GetAttributeFloatForAllPoints(decoded,attr,a);const values=new Float32Array(a.size());for(let i=0;i<values.length;i++)values[i]=a.GetValue(i);assert(values.every(Number.isFinite));geometry.setAttribute(key,new THREE.BufferAttribute(values,attr.num_components()));draco.destroy(a);}
 const face=new draco.DracoInt32Array(),indices=[];for(let i=0;i<decoded.num_faces();i++){decoder.GetFaceFromMesh(decoded,i,face);indices.push(face.GetValue(0),face.GetValue(1),face.GetValue(2));}geometry.setIndex(indices);geometry.computeBoundingBox();for(const o of [face,decoded,b,status])draco.destroy(o);
 const m=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({side:THREE.DoubleSide}));if(n.translation)m.position.fromArray(n.translation);if(n.rotation)m.quaternion.fromArray(n.rotation);if(n.scale)m.scale.fromArray(n.scale);
 const g=info.group,layer=g==='cn-vessels'?'vessels':g==='cn-bones'?'bones':g==='cn-muscles'?'muscles':g==='cn-organs'||['deep','stem-internal','stem-csf'].includes(g)?'deep':['brainstem','cerebellum','stem-surface','stem-columns','stem-vessels'].includes(g)?'hindbrain':g==='sulci'?'sulci':['cn-nerves','cord','peripheral'].includes(g)?'cord':'cortex';
 m.userData={anatomyName:n.name,info,layer,shadedMaterial:m.material};scene.add(m);meshes.push(m);byName.set(n.name,m);
}
scene.updateMatrixWorld(true);for(const m of meshes)originalMatrices.set(m,m.matrixWorld.clone());
globalThis.matchMedia=()=>({matches:true});globalThis.document={hidden:false,getElementById:()=>null,createElement:()=>({width:768,height:128,getContext:()=>({clearRect(){},fillText(){},measureText:s=>({width:s.length*22})})})};
const viewer=Object.create(BrainViewer.prototype);Object.assign(viewer,{module:'cranial',ready:true,scene,meshes,byName,inventory:inv,layers:new Map(d.layers.map(([k])=>[k,{enabled:true,opacity:1,manual:false}])),state:{hemisphere:'both',presentation:'shaded',view:'anterior',borders:true,isolate:false,palette:'lobes'},camera:new THREE.PerspectiveCamera(34,1.5,.002,8),traceGroup:new THREE.Group(),dirty:true});
viewer.controls={target:new THREE.Vector3(),update(){viewer.camera.lookAt(this.target);viewer.camera.updateMatrixWorld(true);return false;}};viewer.cranial=new CranialStudy(viewer,d.routes);
const projector=new LeaderProjector();let count=0,maps=0,unsegmented=0;
assert.equal(meta.get('Cochlear nerve').side,'right','Unsuffixed right cochlear nerve leaked into the left ear');
for(const s of d.steps){assert(s.presentation);assert(s.presentation.focus_meshes.every(n=>meta.has(n)));assert(s.presentation.context_meshes.every(n=>meta.has(n)));assert.equal(s.related.length,0,'Repeated whole-route cards returned');if(s.teaching_chain)assert.equal(s.teaching_chain.filter(n=>n.active).length,1,s.id+': missing / ambiguous active teaching node');}
// Distinct source structures, colors and bilateral crossing are part of the
// lesson contract; passing surface-hit tests alone cannot catch a repeated
// scene with only different text.
const visualSteps=d.steps.filter(s=>s.page===3&&[11,13,14,15,16].includes(s.source_lines[0]));
assert.equal(new Set(visualSteps.map(s=>s.presentation.focus_meshes.join('|'))).size,5);
assert.equal(new Set(visualSteps.map(s=>s.color)).size,5);
assert.equal(visualSteps.find(s=>s.title==='Optic chiasm').hemisphere,'both');
const centers=[];
for(const s of d.steps.filter(s=>s.page===3&&[2,3,4].includes(s.source_lines[0]))){viewer.show(s,pointEntries(s,byId),{hemisphere:s.hemisphere});assert.equal(viewer.cranial.extent,'focus');assert(viewer.cranial.regionBox,s.id+': combined mesh lost region focus');centers.push(viewer.cranial.focusBox().getCenter(new THREE.Vector3()));}
assert(centers[0].distanceTo(centers[1])>.004&&centers[1].distanceTo(centers[2])>.004,'Olfactory filaments, bulb and tract repeat the same camera focus');
viewer.cranial.setMode('anatomy');assert.equal(viewer.cranial.extent,'route');
viewer.show(visualSteps[0],pointEntries(visualSteps[0],byId),{hemisphere:'left'});assert.equal(viewer.cranial.extent,'focus','Full-course override leaked into Next');
assert(byName.get('Optic nerve (II).l').material.isMeshStandardMaterial,'Unlit nerve material flattened the anatomical surface');
for(const [width,height]of [[1450,900],[470,820]]){
 const rect=(l,t,w,h)=>({left:l,top:t,width:w,height:h,right:l+w,bottom:t+h});
 const chrome={'.view-heading':[12,15,400,72],'.camera-hud':[12,90,400,34],'.cranial-tools':[12,130,400,55],'.tour-rail':[12,height-100,width-24,90]};
 viewer.host={clientWidth:width,clientHeight:height,getBoundingClientRect:()=>rect(0,0,width,height),parentElement:{querySelector:s=>chrome[s]?{hidden:false,getClientRects:()=>[1],getBoundingClientRect:()=>rect(...chrome[s])}:null}};
 viewer.getTeachingSpace=()=>width>=900?{right:width-350}:{bottom:height-290};viewer.camera.aspect=width/height;viewer.camera.updateProjectionMatrix();
 for(const step of d.steps){
  const entries=pointEntries(step,byId);viewer.show(step,entries,{hemisphere:step.hemisphere||'both'});viewer.frame(step.view,true);
  // A valid label anchor can be visible while the rest of a long nerve is
  // catastrophically enlarged. Fit-test EVERY framed source vertex, including
  // overview / unsegmented points which deliberately have no primary arrow.
  const frameLeft=width>=1200?250:16,frameRight=width>=900?width-350:width-24,frameTop=203,frameBottom=width>=900?height-118:height-290,clipPoint=new THREE.Vector3();
  for(const m of viewer.visibleMeshes.filter(m=>viewer.cranial.shouldFrame(m))){const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){clipPoint.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);if(!viewer.cranial.includePoint(clipPoint)||!viewer.cranial.includeFocusPoint(clipPoint))continue;clipPoint.project(viewer.camera);const x=(clipPoint.x+1)*width/2,y=(1-clipPoint.y)*height/2;assert(clipPoint.z>=-1&&clipPoint.z<=1&&x>=frameLeft-1&&x<=frameRight+1&&y>=frameTop-1&&y<=frameBottom+1,step.id+' / '+m.userData.anatomyName+': source route cropped at '+width+' ('+x.toFixed(1)+', '+y.toFixed(1)+')');}}
  assert.equal(viewer.cranial.active,false,'A relationship map replaced the source anatomy without an explicit request');
  assert.equal(viewer.cranial.includePoint(new THREE.Vector3(0,1.1,0)),!!viewer.cranial.route,'The overview crop leaked into an individual nerve route');
  for(const entry of entries){
   const a=viewer.anchor(entry);
   if(entry.anchor_binding?.status==='unsegmented'){assert.equal(a,null,step.id+': missing fine structure borrowed a parent anchor');unsegmented++;continue;}
   assert(a,step.id+' / '+entry.name+': no target');assert(a.mesh.visible,step.id+': hidden target');assert(Number.isFinite(a.position.x));
   assert(entry.meshes.includes(a.mesh.userData.anatomyName));const p=a.mesh.geometry.attributes.position;let distance=Infinity;for(let i=0;i<p.count;i++)distance=Math.min(distance,new THREE.Vector3().fromBufferAttribute(p,i).distanceToSquared(a.localPosition));assert(distance<1e-16,step.id+': endpoint detached from source');
   assert.equal('#'+a.mesh.material.color.getHexString(),entry.color,step.id+': arrow/target color mismatch');
   const projection=projector.project(a,entry,viewer,viewer.visibleMeshes,rect(0,0,width,height),rect(0,0,width,height),width,height);assert(projection.visible,step.id+' / '+entry.name+': arrow offscreen at '+width);
   assert(projection.point.x>=0&&projection.point.x<=width&&projection.point.y>=0&&projection.point.y<=height);count++;
   const same=viewer.anchor(entry);assert(same.localPosition.distanceTo(a.localPosition)<1e-15,'Anchor changed without a target change');
  }
  if(step.visual?.map){
   viewer.cranial.setMode('diagram');const a=viewer.anchor(entries[0]);assert(a?.section);maps++;
   const ray=new THREE.Raycaster(a.position.clone().add(new THREE.Vector3(0,0,.15)),new THREE.Vector3(0,0,-1)),hit=ray.intersectObject(a.mesh,false)[0];assert(hit&&hit.point.distanceTo(a.position)<.0005,step.id+': optional diagram pointer is empty');
   if(entries[1])assert.equal(viewer.cranial.anchor(entries[1]),null,'Diagram reused the same anchor for a different anatomical context label');
   viewer.cranial.setMode('anatomy');assert.equal(viewer.cranial.active,false);
  }
  assert(functionIllustration(step.function).svg.includes('<svg'));
 }
}
// Repeat configuration preserves the current objects, rather than leaking a new
// set of label textures on every layout, resize or opacity update.
// A surface hit alone cannot prove the intended LANDMARK. These regressions
// distinguish central emergence from an arbitrary point on the distal trunk.
for(const [page,line,minY,maxY,maxZ]of [[4,0,1.59,1.62,.02],[5,0,1.59,1.61,-.01],[5,13,1.57,1.59,.005],[10,2,1.57,1.59,.005],[13,0,1.55,1.59,.005],[14,0,1.55,1.59,.005],[15,18,1.55,1.59,.005]]){
 const s=d.steps.find(s=>s.page===page&&s.source_lines[0]===line),entries=pointEntries(s,byId);viewer.show(s,entries,{hemisphere:'left'});const a=viewer.anchor(entries[0]);assert(a,s.id);assert(a.position.y>=minY&&a.position.y<=maxY&&a.position.z<maxZ,s.id+': emergence pointer moved onto the distal nerve');
}
const first=d.steps.find(s=>s.visual?.map==='gates');viewer.show(first,pointEntries(first,byId),{hemisphere:'both'});viewer.cranial.setMode('diagram');const same=viewer.cranial.current;viewer.apply();viewer.apply();assert.equal(same,viewer.cranial.current);
for(const m of meshes)assert.deepEqual(m.matrixWorld.elements,originalMatrices.get(m).elements,'Source geometry moved');
viewer.cranial.dispose();for(const m of meshes){m.geometry.dispose();m.material.dispose();}draco.destroy(decoder);
console.log(`PASS: ${d.steps.length} ordered points / 286 source lines / 17 pages; ${meta.size} unchanged source meshes, ${Object.keys(d.routes).length} source routes, ${count} exact desktop/mobile anatomy anchors; ${unsegmented/2} missing fine structures explicitly unbound; ${maps} optional map surface checks, colors, framing and resource reuse.`);
