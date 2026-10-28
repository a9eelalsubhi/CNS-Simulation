import assert from 'node:assert/strict';
import {readFile,access,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as THREE from './public/vendor/three.module.js';
import {BrainViewer,LAYERS} from './public/scene.js';
import {pointEntries,pointEntry,progressKey} from './public/lecture-point.js';
import {PLATES,BrainstemPlates} from './public/brainstem-plates.js';
import {BodyContext} from './public/body-context.js';
import {brainstemScene,FOCUS_3D} from './public/brainstem-study.js';
import {LeaderProjector} from './public/leader-projection.js';
import {BrainstemSections} from './public/brainstem-sections.js';
import {SECTIONS,sectionFeature} from './public/section-data.js';
import {interpolateCamera} from './public/camera-motion.js';

const json=async p=>JSON.parse(await readFile(p,'utf8'));
const data=await json('public/data/lecture-2.json'),inv=await json('public/data/brainstem-structures.json'),sourceText=await json('brainstem-source.json');
const ids=new Map(data.structures.map(e=>[e.id,e])),meta=new Map(inv.meshes.map(e=>[e.name,e]));
assert.equal(data.steps.length,84);assert.equal(ids.size,77);assert.equal(meta.size,264);assert.equal(data.source_line_count,133);assert.equal(data.source_sha256,sourceText.sha256);
assert.equal(new Set(data.steps.map(s=>s.id)).size,data.steps.length);assert.equal(new Set(data.chapters.map(c=>c.id)).size,data.chapters.length);
for(const page of sourceText.pages){let last=-1;const covered=new Set();for(const s of data.steps.filter(s=>s.page===page.page&&!s.utility)){assert(s.source_lines[0]>=last);last=s.source_lines[0];assert.equal([s.text,...s.bullets].join('\n'),s.source_excerpt);assert.equal(s.source_excerpt,s.source_lines.map(i=>page.lines[i]).join('\n'));s.source_lines.forEach(i=>covered.add(i));}assert.deepEqual([...covered].sort((a,b)=>a-b),page.lines.map((_,i)=>i));await access(`public/slides/brainstem/slide-${String(page.page).padStart(2,'0')}.jpg`);}
for(const [key,p]of Object.entries(PLATES)){await access(`public/slides/brainstem/${key}.jpg`);for(const [id,xy]of Object.entries(p.points)){assert(ids.has(id),key+': orphan diagram target '+id);assert(xy.length===2&&xy.every(v=>v>=0&&v<=1),key+': invalid diagram fraction');}}
for(const e of data.structures){assert(e.meshes.length);assert(e.meshes.every(n=>meta.has(n)),e.id);if(e.diagram_only)assert(e.clarification&&e.kind==='relation');}
for(const s of data.steps){assert(ids.has(s.structure));assert(s.targets.every(n=>ids.get(s.structure).meshes.includes(n)));assert(PLATES[s.plate]);assert(data.chapters.some(c=>c.id===s.chapter));for(const e of pointEntries(s,ids))assert(e.meshes.every(n=>meta.has(n)));}
for(const q of data.quiz){assert(!ids.get(q.answer).diagram_only,'Quiz invents an unsegmented 3D target');assert.equal(new Set(q.choices).size,4);assert(q.choices.includes(q.answer));q.choices.forEach(id=>assert(ids.has(id)));}
assert.notEqual(progressKey(data),progressKey(await json('public/data/lecture-1.json')));
assert(data.steps.every(s=>!s.diagram),'Next must never replace 3D with a lecture image');
for(const [key,focus]of Object.entries(FOCUS_3D))for(const id of focus.ids)assert(ids.has(id)&&!ids.get(id).diagram_only,key+': focus is not actual segmented anatomy');
const legacyPlate=Object.create(BrainstemPlates.prototype);let inlineRequested;legacyPlate.show=(key,enabled)=>{inlineRequested=enabled;};legacyPlate.configure({plate:'inferior',diagram:true},[]);assert.equal(inlineRequested,false,'Legacy saved points can reopen the rejected image overlay');
assert(ids.get('inferior-salivatory').clarification.includes('medulla'));

function glb(raw){const n=raw.readUInt32LE(12);return {j:JSON.parse(raw.subarray(20,20+n)),bin:raw.subarray(28+n)};}
const originals=[];for(const f of ['nervous_male','cardiovascular_male'])originals.push(glb(await readFile(`../tmp/${f}.glb`)));
const originalNodes=new Map();for(const o of originals)for(const n of o.j.nodes)originalNodes.set(n.name,{o,n});
const {j,bin}=glb(await readFile('public/models/brainstem.glb'));
const context=vm.createContext({console,WebAssembly,TextDecoder,TextEncoder,setTimeout,clearTimeout});vm.runInContext(await readFile('public/vendor/draco_wasm_wrapper.js','utf8'),context);
const draco=await context.DracoDecoderModule({wasmBinary:await readFile('public/vendor/draco_decoder.wasm')}),decoder=new draco.Decoder();
const scene=new THREE.Scene(),byName=new Map(),positions=new Map(),matrices=new Map();
for(const n of j.nodes){
 const old=originalNodes.get(n.name);assert(old,n.name);const p=j.meshes[n.mesh].primitives[0],oldp=old.o.j.meshes[old.n.mesh].primitives[0];
 for(const k of ['translation','rotation','scale','matrix'])assert.deepEqual(n[k],old.n[k],n.name+': moved original anatomy');
 const ext=p.extensions.KHR_draco_mesh_compression,v=j.bufferViews[ext.bufferView],oldv=old.o.j.bufferViews[oldp.extensions.KHR_draco_mesh_compression.bufferView],compressed=bin.subarray(v.byteOffset,v.byteOffset+v.byteLength);
 assert.deepEqual(compressed,old.o.bin.subarray(oldv.byteOffset,oldv.byteOffset+oldv.byteLength),n.name+': modified source geometry');
 const b=new draco.DecoderBuffer();b.Init(compressed,compressed.length);const decoded=new draco.Mesh(),status=decoder.DecodeBufferToMesh(b,decoded);assert(status.ok());const geometry=new THREE.BufferGeometry();
 for(const [semantic,key]of [['POSITION','position'],['NORMAL','normal']]){const attr=decoder.GetAttributeByUniqueId(decoded,ext.attributes[semantic]),a=new draco.DracoFloat32Array();decoder.GetAttributeFloatForAllPoints(decoded,attr,a);const values=new Float32Array(a.size());for(let i=0;i<values.length;i++)values[i]=a.GetValue(i);assert(values.every(Number.isFinite));geometry.setAttribute(key,new THREE.BufferAttribute(values,attr.num_components()));draco.destroy(a);}
 const face=new draco.DracoInt32Array(),indices=[];for(let i=0;i<decoded.num_faces();i++){decoder.GetFaceFromMesh(decoded,i,face);indices.push(face.GetValue(0),face.GetValue(1),face.GetValue(2));}geometry.setIndex(indices);geometry.computeBoundingBox();
 for(const o of [face,decoded,b,status])draco.destroy(o);
 const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({side:THREE.DoubleSide}));if(n.translation)mesh.position.fromArray(n.translation);if(n.rotation)mesh.quaternion.fromArray(n.rotation);if(n.scale)mesh.scale.fromArray(n.scale);
 const info=meta.get(n.name),g=info.group,layer=['deep','stem-internal','stem-csf'].includes(g)?'deep':['brainstem','cerebellum','stem-surface','stem-columns','stem-vessels'].includes(g)?'hindbrain':g==='sulci'?'sulci':['cord','peripheral','stem-nerves'].includes(g)?'cord':'cortex';
 mesh.userData={anatomyName:n.name,info,layer,gyrusColor:'#dd99bb'};scene.add(mesh);byName.set(n.name,mesh);positions.set(mesh,geometry.attributes.position.array.slice());
}
scene.updateMatrixWorld(true);for(const m of byName.values())matrices.set(m,m.matrixWorld.clone());
globalThis.matchMedia=()=>({matches:true});const viewer=Object.create(BrainViewer.prototype);Object.assign(viewer,{module:'brainstem',ready:true,scene,byName,meshes:[...byName.values()],inventory:inv,layers:new Map(LAYERS.map(([key])=>[key,{enabled:true,opacity:1,manual:false}])),state:{hemisphere:'both',palette:'lobes',presentation:'shaded',borders:true,isolate:false,view:'anterior'},camera:new THREE.PerspectiveCamera(34,1.5,.002,8),traceGroup:new THREE.Group(),dirty:true});
viewer.controls={target:new THREE.Vector3(),minDistance:.035,maxDistance:4,update(){viewer.camera.lookAt(this.target);viewer.camera.updateMatrixWorld(true);return false;}};
for(const s of data.steps){viewer.show(s,pointEntries(s,ids),{hemisphere:'both'});assert(viewer.visibleMeshes.length);assert(viewer.visibleMeshes.every(m=>m.geometry.attributes.position.count>0));assert(viewer.visibleMeshes.filter(m=>m.userData.info.group==='brainstem').every(m=>m.visible),'A hemisphere hid half the stem');
 for(const e of pointEntries(s,ids)){
  const a=viewer.anchor(e);assert(a,'Missing teaching anchor '+e.id);
  assert(e.meshes.includes(a.mesh.userData.anatomyName),'Leader points to another structure');
  if(e.diagram_only)assert(a.regional&&a.region===a.mesh.userData.info.base,'Parent anchor masquerades as a segmented fine structure');else assert(!a.regional);
  const positions=a.mesh.geometry.attributes.position;let nearest=Infinity;for(let i=0;i<positions.count;i++)nearest=Math.min(nearest,new THREE.Vector3().fromBufferAttribute(positions,i).distanceToSquared(a.localPosition));assert(nearest<1e-16,'Leader is detached from original source geometry');
  if(['stem-nerves','stem-vessels'].includes(a.mesh.userData.info.group))assert(viewer.stemBox().expandByScalar(.02001).containsPoint(a.position),'Root/vessel arrow targets a distal branch outside the lesson');
 }
 for(const [key]of LAYERS){const l=viewer.layers.get(key);viewer.setLayer(key,false);assert(viewer.meshes.filter(m=>m.userData.layer===key).every(m=>!m.visible),key+': orphan layer');l.manual=false;l.enabled=true;viewer.apply();}
}
for(const aspect of [.43,1,1.8])for(const view of ['anterior','posterior','lateral','medial','superior','inferior']){viewer.camera.aspect=aspect;viewer.camera.updateProjectionMatrix();viewer.show(data.steps[0],pointEntries(data.steps[0],ids),{hemisphere:'both'});viewer.frame(view,true);const box=viewer.focusBox();for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(viewer.camera);assert(Math.abs(p.x)<1&&Math.abs(p.y)<1,view+': brainstem clipped');}}
// Regression for the actual UI camera branch: previous tests had no host,
// so they missed a cortex-only filter discarding all gross stem vertices.
const projector=new LeaderProjector();let projectedPoints=0;
for(const [width,height]of [[1360,900],[470,820]]){
 viewer.bodyContext={enabled:true,expanded:false,update(){}};
 const rect=(left,top,w,h)=>({left,top,right:left+w,bottom:top+h,width:w,height:h}),chrome={'.view-heading':{hidden:false,getClientRects:()=>[1],getBoundingClientRect:()=>rect(10,10,250,85)},'.camera-hud':{hidden:false,getClientRects:()=>[1],getBoundingClientRect:()=>rect(0,95,width,30)},'.stem-tools':{hidden:false,getClientRects:()=>[1],getBoundingClientRect:()=>rect(0,135,width,30)},'.legend':{hidden:false,getClientRects:()=>[1],getBoundingClientRect:()=>rect(0,175,200,25)},'.tour-rail':{hidden:false,getClientRects:()=>[1],getBoundingClientRect:()=>rect(10,height-100,width-20,90)}};
 viewer.host={clientWidth:width,clientHeight:height,getBoundingClientRect:()=>rect(0,0,width,height),parentElement:{querySelector:s=>chrome[s]}};viewer.getTeachingSpace=()=>width>=900?{right:width-365}:{bottom:height-280};viewer.camera.aspect=width/height;viewer.camera.updateProjectionMatrix();
 for(const s of data.steps){
  const id=s.structure,entries=pointEntries(s,ids),study=brainstemScene(s,entries,ids);viewer.show(study.step,study.entries,{hemisphere:'both'});viewer.frame(study.step.view,true);
  const anchor=viewer.anchor(entries[0]),canvasRect=rect(20,30,width,height),projection=projector.project(anchor,entries[0],viewer,viewer.visibleMeshes,canvasRect,canvasRect,width,height);
  assert(projection.visible,`${s.id}/${width}: primary teaching arrow disappears (${projection.state})`);assert(Number.isFinite(projection.point.x)&&Number.isFinite(projection.point.y));projectedPoints++;
  if(anchor.regional)assert.equal(projection.state,'regional');
  const scaled=projector.project(anchor,entries[0],viewer,viewer.visibleMeshes,rect(20,30,width*2,height*2),rect(20,30,width*2,height*2),width,height);assert(Math.abs(scaled.point.x-projection.point.x)<1e-7&&Math.abs(scaled.point.y-projection.point.y)<1e-7,'CSS scaling displaces arrow endpoint');
  const right=width>=900?width-365:width-24,bottom=width>=900?height-118:height-280;
  for(const m of viewer.visibleMeshes.filter(m=>m.userData.info.group==='brainstem')){const pos=m.geometry.attributes.position;for(let i=0;i<pos.count;i++){const p=new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(m.matrixWorld).project(viewer.camera),x=(p.x+1)*width/2,y=(1-p.y)*height/2;assert(x>=(width>=900?129:15)&&x<=right+1&&y>=210&&y<=bottom+1,`${id}/${width}: actual 3D anatomy clipped by UI chrome`);}}
 }
}
delete viewer.host;delete viewer.getTeachingSpace;delete viewer.bodyContext;
// A visible opaque cover must produce an explicit through-surface leader,
// not silently delete an otherwise valid anatomical teaching connection.
const entry=ids.get('inferior-colliculi');viewer.show(data.steps.find(s=>s.structure===entry.id),[entry],{hemisphere:'both'});viewer.frame('posterior',true);
const anchor=viewer.anchor(entry),cover=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));cover.userData={anatomyName:'test-cover',info:{base:'Test cover',group:'test'}};cover.position.lerpVectors(viewer.camera.position,anchor.position,.5);cover.lookAt(viewer.camera.position);cover.updateMatrixWorld(true);
const viewportRect={left:0,top:0,width:800,height:800},through=projector.project(anchor,entry,viewer,[cover,anchor.mesh],viewportRect,viewportRect,800,800);assert(through.visible&&through.occluded&&through.state==='through-surface');assert.equal(through.occluder,'Test cover');
anchor.mesh.visible=false;assert.equal(projector.project(anchor,entry,viewer,[cover],viewportRect,viewportRect,800,800).state,'hidden');anchor.mesh.visible=true;cover.geometry.dispose();cover.material.dispose();
// Exercise the REAL section manager: an arrow existing is insufficient. Its
// source-plate point must lie inside its named colored contour, and different
// named parcels must not collapse onto a common parent-surface coordinate.
viewer.sections=new BrainstemSections(viewer,ids);const sectionEndpoints=[],sectionRay=new THREE.Raycaster();let sectionalPoints=0;
for(const s of data.steps){
 const entries=pointEntries(s,ids),study=brainstemScene(s,entries,ids);viewer.show(study.step,study.entries,{hemisphere:'both'});viewer.frame(study.step.view,true);
 if(!study.step.section_key){assert(!viewer.sections.active);continue;}
 const a=viewer.anchor(entries[0]);assert(a?.section,`${s.id}: section target fell back to a common parent surface`);assert.equal(a.sectionFeature,sectionFeature(study.step.section_key,s.structure).id);
 const projection=projector.project(a,entries[0],viewer,viewer.sections.shown,viewportRect,viewportRect,800,800);assert(projection.visible&&projection.state==='section',s.id+': section leader missing');
 sectionRay.set(a.position.clone().add(new THREE.Vector3(0,0,.02)),new THREE.Vector3(0,0,-1));const hit=sectionRay.intersectObject(a.mesh,false)[0];assert(hit,`${s.id}: arrow endpoint is outside the named section contour`);
 const top=sectionRay.intersectObjects(viewer.sections.shown,false)[0];assert.equal(top?.object,a.mesh,`${s.id}: active colored target is covered by another section feature`);
 assert.equal(a.mesh.userData.front.color.getHexString(),new THREE.Color(entries[0].color).getHexString(),s.id+': card/region color mismatch');
 assert(viewer.meshes.every(m=>!m.visible),s.id+': original surface obscures the section');sectionEndpoints.push({id:s.id,key:study.step.section_key,feature:a.sectionFeature,p:a.position.clone()});sectionalPoints++;
}
assert(sectionalPoints>=40,'Internal teaching points were not assigned section geometry');assert.equal(viewer.sections.cache.size,4);
const inferior=sectionEndpoints.filter(e=>e.id.startsWith('bs-3-'));
for(let i=0;i<inferior.length;i++)for(let j=i+1;j<inferior.length;j++)if(inferior[i].feature!==inferior[j].feature)assert(inferior[i].p.distanceTo(inferior[j].p)>.0005,'Different midbrain structures reuse the same endpoint');
// Terminological synonyms intentionally share a pathway; they must not be
// drawn as three invented independent bundles.
assert.equal(sectionFeature('pons','ventral-trigeminal'),sectionFeature('pons','anterior-trigeminothalamic'));
assert.equal(sectionFeature('pons','trigeminal-lemniscus'),sectionFeature('pons','ventral-trigeminal'));
for(const [width,height]of [[1360,900],[470,820]]){
 const rect=(x,y,w,h)=>({left:x,top:y,right:x+w,bottom:y+h,width:w,height:h}),chrome={'.view-heading':[10,10,300,85],'.stem-tools':[10,125,width-20,30],'.legend':[10,175,300,25],'.tour-rail':[10,height-100,width-20,90]};
 viewer.host={clientWidth:width,clientHeight:height,getBoundingClientRect:()=>rect(0,0,width,height),parentElement:{querySelector:s=>chrome[s]?{hidden:false,getClientRects:()=>[1],getBoundingClientRect:()=>rect(...chrome[s])}:null}};viewer.getTeachingSpace=()=>width>=900?{right:width-365}:{bottom:height-290};viewer.bodyContext={enabled:true,expanded:false,update(){}};viewer.camera.aspect=width/height;viewer.camera.updateProjectionMatrix();
 for(const s of data.steps.filter(s=>s.section_key)){
  const entries=pointEntries(s,ids),study=brainstemScene(s,entries,ids);viewer.show(study.step,study.entries,{hemisphere:'both'});viewer.frame(study.step.view,true);
  const a=viewer.anchor(entries[0]),p=a.position.clone().project(viewer.camera),x=(p.x+1)*width/2,y=(1-p.y)*height/2;
  assert(x>=(width>=900?129:15)&&x<=(width>=900?width-365:width-24)+1&&y>=215&&y<=(width>=900?height-118:height-290)+1,`${s.id}/${width}: section target is behind a control or card`);
 }
}
delete viewer.host;delete viewer.getTeachingSpace;delete viewer.bodyContext;
const start=new THREE.Vector3(0,1.57,-.3),end=new THREE.Vector3(0,1.57,.3),target=new THREE.Vector3(0,1.57,0),pose={from:start,to:end,fromTarget:target.clone(),target:target.clone()},position=new THREE.Vector3(),aim=new THREE.Vector3();
for(let i=0;i<=100;i++){interpolateCamera(pose,i/100,position,aim);assert(Math.abs(position.distanceTo(aim)-.3)<1e-8,'Camera transition passes through the brainstem');}
interpolateCamera(pose,0,position,aim);assert(position.distanceTo(start)<1e-8);interpolateCamera(pose,1,position,aim);assert(position.distanceTo(end)<1e-8);
if(process.argv.includes('--sections-review')){const render=Object.fromEntries([...viewer.sections.cache].map(([k,c])=>[k,{name:c.spec.name,bounds:c.spec.crop,features:c.meshes.filter(m=>m.scale.x>0).map(m=>({color:m.userData.sectionFeature?.color||'#65576f',mirror:!!m.userData.sectionFeature?.mirror,midline:c.spec.midline,points:m.geometry.parameters.shapes.getPoints(70).map(p=>[p.x,p.y])}))}]));await writeFile('../tmp/section-contours-review.json',JSON.stringify(render));}
viewer.sections.dispose();assert.equal(viewer.sections.cache.size,0);delete viewer.sections;
console.log(`PASS: ${sectionalPoints} source-ordered 3D section points, unique midbrain parcels, contour-contained endpoints, active target visibility/colors, shared-tract synonyms, section disposal and 101 safe camera transition samples.`);
for(const m of byName.values()){assert.deepEqual(m.geometry.attributes.position.array,positions.get(m));assert.deepEqual(m.matrixWorld.elements,matrices.get(m).elements);}
// Diagram projection must account for contain-letterboxing and CSS scaling.
const plate=Object.create(BrainstemPlates.prototype);Object.assign(plate,{enabled:true,selected:'inferior',image:{naturalWidth:1293,naturalHeight:778,getBoundingClientRect:()=>({left:20,top:50,width:600,height:600})}});
const overlay={clientWidth:800,clientHeight:700,getBoundingClientRect:()=>({left:10,top:20,width:1600,height:1400})},projected=plate.project('aqueduct',overlay),r=plate.imageRect();assert(Math.abs(projected.x-(r.left+.486*r.width-10)/2)<1e-8);assert(Math.abs(projected.y-(r.top+.278*r.height-20)/2)<1e-8);assert(plate.project('not-an-id',overlay)===null);
// Root and skull bounds remain in original metres, not a separate guessed fit.
const skeleton=glb(await readFile('public/models/body-context.glb'));const skull=skeleton.j.nodes.filter(n=>/Frontal bone|Occipital bone|Parietal bone/.test(n.name));assert(skull.length>=3);assert(viewer.stemBox().min.y>1.3&&viewer.stemBox().max.y<1.8,'Brainstem is outside the original head coordinate range');
if(process.argv.includes('--review')){viewer.show(data.steps[0],pointEntries(data.steps[0],ids),{hemisphere:'both'});const review=viewer.visibleMeshes.map(m=>({name:m.userData.anatomyName,group:m.userData.info.group,color:'#'+m.material.color.getHexString(),matrix:m.matrixWorld.toArray(),positions:Array.from(m.geometry.attributes.position.array),indices:Array.from(m.geometry.index.array)}));await writeFile('../tmp/brainstem-model-review.json',JSON.stringify(review));}
for(const m of byName.values()){m.geometry.dispose();m.material.dispose();}draco.destroy(decoder);
console.log(`PASS: Lecture 2 · 84 ordered points, 133/133 source lines, 77 structures, 264 source-preserved meshes; ${projectedPoints} desktop/mobile primary leaders, explicit regional/occluded/hidden states, source-vertex anchors, CSS scaling, quiz/layers and camera framing.`);
