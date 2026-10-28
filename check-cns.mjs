import assert from 'node:assert/strict';
import {readFile,writeFile,access,mkdir} from 'node:fs/promises';
import vm from 'node:vm';
import * as THREE from './public/vendor/three.module.js';
import {BrainViewer,LAYERS} from './public/scene.js';
import {overlaps,placeCards,projectAnchor} from './public/annotation-layout.js';
import {SurfaceAtlas,SURFACE_NAMES,sourceLabelPath,orientedLabelBox,labelsOverlap,nameInLesson,readableBaseline} from './public/surface-atlas.js';
import {pointEntry,pointEntries,progressKey} from './public/lecture-point.js';
import {explanationLayout} from './public/guided-explanations.js';
import {anatomyColor} from './public/lesson-palette.js';

const data=JSON.parse(await readFile('public/data/lecture-1.json')),inventory=JSON.parse(await readFile('public/data/structures.json'));
const ids=new Map(data.structures.map(s=>[s.id,s])),byMeta=new Map(inventory.meshes.map(m=>[m.name,m]));
const chapters=new Set(data.chapters.map(c=>c.id)),seen=new Set();
assert.equal(ids.size,68);assert.equal(data.steps.length,147);assert.equal(inventory.meshes.length,195);
assert.deepEqual([...new Set(data.steps.map(s=>s.page))].sort((a,b)=>a-b),data.source_pages);
for(const s of data.steps){assert(!seen.has(s.id));seen.add(s.id);assert(chapters.has(s.chapter));assert(ids.has(s.structure));for(const id of s.pins)assert(ids.has(id));}
assert.equal(data.steps[0].title,'The nervous system');assert.equal(data.steps.at(-2).structure,'projection');assert.equal(data.steps.at(-1).mode,'explorer');
assert(data.steps.every((s,i)=>!i||s.page>=data.steps[i-1].page),'Next jumps backwards through the source PDF');
for(const s of data.steps){const e=pointEntry(s,ids);assert(e.text&&Array.isArray(e.bullets));assert(e.meshes.length);assert(e.meshes.every(n=>ids.get(s.structure).meshes.includes(n)),s.id+': target is not in its source entry');assert.equal(e.page,s.page);}
for(const id of ['postcentral','visual','auditory','gustatory','olfactory','sensory-association','visual-association','auditory-association','wernicke','prefrontal'])assert(data.steps.some(s=>s.page===10&&s.structure===id),'Missing illustrated summary item '+id);
const slideSource=JSON.parse(await readFile('lecture-source.json'));
assert.equal(slideSource.page_count,11);assert.equal(data.source_line_count,213);assert.equal(data.source_sha256,slideSource.sha256);
for(const page of slideSource.pages){
 const points=data.steps.filter(s=>s.page===page.page&&!s.utility),covered=new Set();let last=-1;
 for(const s of points){assert(s.source_lines[0]>=last,'Within-slide order regressed: '+s.id);last=s.source_lines[0];const quote=s.source_lines.map(i=>page.lines[i]).join('\n');assert.equal(s.source_excerpt,quote);assert.equal([s.text,...s.bullets].join('\n'),quote,'Slide wording was replaced by a paraphrase: '+s.id);s.source_lines.forEach(i=>covered.add(i));
  for(const r of s.related||[]){assert(ids.has(r.structure));assert(r.targets.every(n=>ids.get(r.structure).meshes.includes(n)));assert(page.lines.join(' ').includes(r.text),'Context callout is not in its source slide: '+r.text);}
 }
 assert.deepEqual([...covered].sort((a,b)=>a-b),page.lines.map((_,i)=>i),'Uncovered slide lines: '+page.page);
}
for(const part of ['Rostrum','Genu','Body','Splenium'])assert(data.steps.some(s=>s.structure==='callosum'&&s.anchor_label===part&&s.anchor_at),'Missing callosum part '+part);
assert(progressKey(data).endsWith('-point-id'),'Progress must survive reordered points by ID');
for(const w of [390,768,1200]){const b=explanationLayout(w,1080,180,940,240);assert(b.left>=0&&b.left+b.width<=w);assert(b.top>=180&&b.top+240<940);}
for(const e of data.structures){for(const n of e.meshes)assert(byMeta.has(n),e.id+': missing source mesh');await access(`public/slides/lecture-${String(e.page).padStart(2,'0')}.jpg`);if(e.kind==='functional')assert(e.clarification,'Functional locator must explain unsegmented limits: '+e.id);}
for(const q of data.quiz){assert.equal(new Set(q.choices).size,4);assert(q.choices.includes(q.answer));q.choices.forEach(id=>assert(ids.has(id)));}
assert(ids.get('insula').meshes.every(n=>n.startsWith('Circular sulcus of insula')),'Combined subcentral source parcel must not be presented as insular cortex');
assert(ids.get('broca').meshes.every(n=>/Opercular|Triangular/.test(n)),'BA 44/45 wrongly includes pars orbitalis');
assert(ids.get('wernicke').meshes.some(n=>n.startsWith('Superior temporal')),'Wernicke reduced to BA 39/40 alone');
assert(ids.get('auditory').clarification.includes('bilateral'),'Unilateral cortical deafness oversimplification');

const bytes=await readFile('public/models/cns.glb'),jsonLength=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+jsonLength)),bin=bytes.subarray(28+jsonLength);
assert.equal(bytes.readUInt32LE(8),bytes.length);assert.equal(gltf.nodes.length,inventory.meshes.length);assert(!gltf.skins&&!gltf.animations);
const original=await readFile('../tmp/nervous_male.glb'),sourceLength=original.readUInt32LE(12),source=JSON.parse(original.subarray(20,20+sourceLength)),sourceBin=original.subarray(28+sourceLength);
const sourceNodes=new Map(source.nodes.map(n=>[n.name,n]));
const context=vm.createContext({console,WebAssembly,TextDecoder,TextEncoder,setTimeout,clearTimeout});vm.runInContext(await readFile('public/vendor/draco_wasm_wrapper.js','utf8'),context);
const draco=await context.DracoDecoderModule({wasmBinary:await readFile('public/vendor/draco_decoder.wasm')}),decoder=new draco.Decoder();
const scene=new THREE.Scene(),byName=new Map(),positions=new Map(),matrices=new Map();
for(const n of gltf.nodes){
 const p=gltf.meshes[n.mesh].primitives[0],old=sourceNodes.get(n.name),oldp=source.meshes[old.mesh].primitives[0];
 for(const key of ['translation','rotation','scale','matrix'])assert.deepEqual(n[key],old[key],n.name+': world pose changed');
 for(const semantic of ['POSITION','NORMAL'])assert.deepEqual(gltf.accessors[p.attributes[semantic]],source.accessors[oldp.attributes[semantic]],n.name+': attribute definition changed');
 const ext=p.extensions.KHR_draco_mesh_compression,v=gltf.bufferViews[ext.bufferView],oldv=source.bufferViews[oldp.extensions.KHR_draco_mesh_compression.bufferView];
 const compressed=bin.subarray(v.byteOffset,v.byteOffset+v.byteLength);assert.deepEqual(compressed,sourceBin.subarray(oldv.byteOffset,oldv.byteOffset+oldv.byteLength),'Source compressed geometry changed');
 const buffer=new draco.DecoderBuffer();buffer.Init(compressed,compressed.length);const decoded=new draco.Mesh(),status=decoder.DecodeBufferToMesh(buffer,decoded);assert(status.ok());
 const geometry=new THREE.BufferGeometry();
 for(const [semantic,key]of [['POSITION','position'],['NORMAL','normal']]){
  const attr=decoder.GetAttributeByUniqueId(decoded,ext.attributes[semantic]),array=new draco.DracoFloat32Array();decoder.GetAttributeFloatForAllPoints(decoded,attr,array);const out=new Float32Array(array.size());for(let i=0;i<out.length;i++)out[i]=array.GetValue(i);assert(out.every(Number.isFinite));geometry.setAttribute(key,new THREE.BufferAttribute(out,attr.num_components()));draco.destroy(array);
 }
 const face=new draco.DracoInt32Array(),indices=[];for(let i=0;i<decoded.num_faces();i++){decoder.GetFaceFromMesh(decoded,i,face);indices.push(face.GetValue(0),face.GetValue(1),face.GetValue(2));}geometry.setIndex(indices);geometry.computeBoundingBox();
 draco.destroy(face);draco.destroy(decoded);draco.destroy(buffer);draco.destroy(status);
 const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial());if(n.translation)mesh.position.fromArray(n.translation);if(n.rotation)mesh.quaternion.fromArray(n.rotation);if(n.scale)mesh.scale.fromArray(n.scale);
 mesh.userData={anatomyName:n.name,info:byMeta.get(n.name),layer:byMeta.get(n.name).group==='sulci'?'sulci':byMeta.get(n.name).group==='deep'?'deep':['brainstem','cerebellum'].includes(byMeta.get(n.name).group)?'hindbrain':['cord','peripheral'].includes(byMeta.get(n.name).group)?'cord':'cortex',gyrusColor:'#52cbbc'};
 scene.add(mesh);byName.set(n.name,mesh);positions.set(mesh,geometry.attributes.position.array.slice());
}
scene.updateMatrixWorld(true);for(const m of byName.values())matrices.set(m,m.matrixWorld.clone());
globalThis.matchMedia=()=>({matches:true});
const viewer=Object.create(BrainViewer.prototype);Object.assign(viewer,{ready:true,scene,byName,meshes:[...byName.values()],inventory,layers:new Map(LAYERS.map(([key])=>[key,{enabled:true,opacity:1,manual:false}])),state:{hemisphere:'left',palette:'lobes',borders:true,isolate:false,view:'lateral'},camera:new THREE.PerspectiveCamera(34,1.55,.002,8),traceGroup:new THREE.Group(),dirty:true});
viewer.controls={target:new THREE.Vector3(),minDistance:.035,maxDistance:4,update(){viewer.camera.lookAt(this.target);viewer.camera.updateMatrixWorld(true);return false;}};
for(const s of data.steps){
 const entries=pointEntries(s,ids);viewer.show(s,entries,{hemisphere:entries[0].side||s.hemisphere||(s.view==='medial'?'left':'left')});
 assert(viewer.visibleMeshes.length>0,s.title+': empty scene');
 for(const e of entries){assert.equal(e.color,anatomyColor(e.id));for(const n of e.meshes){const m=viewer.byName.get(n);if(m.visible&&viewer.studyColors.get(n)===e.color)assert.equal(m.material.color.getHexString(),e.color.slice(1),'Callout color does not match target '+s.id);}}
 for(const entry of entries){const anchor=viewer.anchor(entry,entry.id===s.structure?s.anchor_at:undefined);assert(anchor,s.title+': missing anchor for '+entry.id);const p=anchor.mesh.geometry.attributes.position;let nearest=Infinity;for(let i=0;i<p.count;i++)nearest=Math.min(nearest,new THREE.Vector3().fromBufferAttribute(p,i).distanceToSquared(anchor.localPosition));assert(nearest<1e-16,'Anchor does not lie on source geometry');}
 const initial=viewer.layers.get('cortex');viewer.setLayer('cortex',false);assert(viewer.meshes.filter(m=>m.userData.layer==='cortex').every(m=>!m.visible),'Layer off leaves orphan cortex');initial.enabled=true;initial.manual=false;viewer.apply();
 for(const m of viewer.visibleMeshes)assert.equal(m.material.opacity,1,'A default scene fades anatomy');
}
viewer.show(data.steps[0],[ids.get('cerebrum'),ids.get('frontal'),ids.get('parietal'),ids.get('temporal')],{hemisphere:'both'});viewer.frame('medial',true);assert.equal(viewer.state.hemisphere,'left');assert(viewer.meshes.filter(m=>m.userData.info.side==='right').every(m=>!m.visible),'Medial view obstructed by opposite hemisphere');
for(const aspect of [1.9,1.1,.45])for(const view of ['lateral','medial','superior','inferior','anterior','posterior']){
 viewer.camera.aspect=aspect;viewer.camera.updateProjectionMatrix();viewer.frame(view,true);const box=viewer.focusBox();
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
  const p=new THREE.Vector3(x,y,z).project(viewer.camera);assert(Math.abs(p.x)<1&&Math.abs(p.y)<1,`${view}/${aspect}: focus clipped`);
 }
}
for(const kind of ['association','commissural','projection']){viewer.show(data.steps.find(s=>s.structure===kind),[ids.get(kind)],{hemisphere:'both'});assert(viewer.toggleTrace(kind));assert.equal(viewer.traceGroup.children.length,2);viewer.stopTrace();assert.equal(viewer.traceGroup.children.length,0);}
for(const m of byName.values()){assert.deepEqual(m.geometry.attributes.position.array,positions.get(m));assert.deepEqual(m.matrixWorld.elements,matrices.get(m).elements,'Presentation moved original anatomy');}
// CSS-coordinate projection is invariant to DPR and canvas CSS scaling.
const camera=new THREE.PerspectiveCamera(40,1,.1,10);camera.position.z=2;camera.updateMatrixWorld(true);const p=new THREE.Vector3(),projected=projectAnchor(p,camera,{left:20,top:40,width:400,height:400},{left:20,top:40,width:400,height:400},400,400,new THREE.Vector3());assert.equal(projected.x,200);assert.equal(projected.y,200);assert(projected.visible);
const boxes=placeCards([{id:0,width:195,height:65,y:190},{id:1,width:195,height:65,y:330}],900,700,[{left:15,top:15,width:300,height:100}],{left:330,top:220,width:230,height:200});assert(boxes);assert(!overlaps(boxes[0],boxes[1]));
// Actual source bindings and derived surface guides, not placeholder boxes.
const guides=JSON.parse(await readFile('public/data/sulcal-map.json'));
for(const g of guides.guides){const m=byName.get(g.mesh);assert(m&&m.userData.info.group==='sulci',g.mesh);assert(g.paths.length);for(const path of g.paths){assert(path.length>=3);assert(path.flat().every(Number.isFinite));}}
for(const d of SURFACE_NAMES){assert(ids.has(d.id),d.id);const m=[...byName.values()].find(m=>m.userData.info.base===d.base);assert(m,d.base);const {points,normal}=sourceLabelPath(m,d.plane);assert(points.length>=3,d.base+': no surface label path');for(const point of points){assert(point.toArray().every(Number.isFinite));const ray=new THREE.Raycaster(point.clone().addScaledVector(normal,.01),normal.clone().negate());const hit=ray.intersectObject(m,false)[0];assert(hit&&hit.distance<.011,d.base+': label left its source surface');}}
const diagonal=orientedLabelBox({x:100,y:100},{x:0,y:0},{x:1,y:1},120,15),parallel=orientedLabelBox({x:100,y:130},{x:0,y:0},{x:1,y:1},120,15);
assert(!labelsOverlap(diagonal,parallel),'Parallel strip labels incorrectly collide');assert(labelsOverlap(diagonal,diagonal));
const testName={id:'precentral',mesh:{userData:{anatomyName:'Precentral gyrus.l'}}};
assert(nameInLesson(testName,{structure:'central',mode:'sulci'},{meshes:[]}),'A central-sulcus lesson loses its neighboring motor strip');
assert(!nameInLesson(testName,{structure:'olfactory',mode:'inferior'},{meshes:[]}),'Unrelated motor name clutters the inferior lesson');
assert(nameInLesson(testName,{structure:'olfactory',mode:'inferior'},{meshes:[]},'all'));
const folded=readableBaseline([{x:50,y:20},{x:100,y:100},{x:10,y:40}]);
assert.equal(folded.span,Math.hypot(40,20));assert(folded.ux>0,'Rotated name reads backwards');
const fakeElement=()=>({children:[],style:{},setAttribute(){},append(...children){this.children.push(...children);},replaceChildren(){this.children=[];},addEventListener(){},classList:{toggle(){}}});
globalThis.document={createElementNS:fakeElement};viewer.pickExtras=[];
const svg=fakeElement(),surface=new SurfaceAtlas(viewer,svg,guides,data,()=>{});
assert(surface.guides.length===guides.guides.length);assert(surface.names.every(n=>typeof n.text==='string'),'DOM text overwrote anatomical name');
const centralPoint=data.steps.find(s=>s.structure==='central');viewer.show(centralPoint,pointEntries(centralPoint,ids),{hemisphere:'left'});viewer.frame('lateral',true);
const tracedAnchor=surface.anchorFor(pointEntry(centralPoint,ids));assert(tracedAnchor?.surfaceGuide,'A sulcus explanation targets its buried wall instead of the visible guide');
assert(tracedAnchor.mesh.userData.anatomyName.startsWith('Central sulcus'));
assert(surface.guides.filter(g=>g.source===tracedAnchor.mesh).some(g=>g.paths.some(path=>path.points.some(p=>p.distanceToSquared(tracedAnchor.position)<1e-16))),'Explanation anchor is detached from its trace');
assert.equal(surface.anchorFor(ids.get('callosum'),{z:.9,y:.5}),null,'Part-specific anchors must retain their explicit source position');
assert(surface.guides.every(g=>g.paths.length),'A named sulcus lost all supported surface strokes');for(const g of surface.guides)for(const path of g.paths)for(let i=1;i<path.points.length;i++)assert(path.points[i].distanceTo(path.points[i-1])<=.003001,'Sulcal stroke bridged a remote cortical bank');let disposedGuides=0;
const terminal=data.steps.find(s=>s.title==='Terminal part of central sulcus');viewer.show(terminal,pointEntries(terminal,ids),{hemisphere:'left'});viewer.frame(terminal.view,true);const endpoint=viewer.anchor(pointEntry(terminal,ids),terminal.anchor_at);const rayCheck=new THREE.Raycaster(viewer.camera.position,endpoint.position.clone().sub(viewer.camera.position).normalize());const cover=rayCheck.intersectObjects(viewer.visibleMeshes,false)[0];assert.equal(cover?.object,endpoint.mesh,'Terminal sulcus arrow is still covered by a different gyrus');assert(cover.point.distanceTo(endpoint.position)<.001,'Terminal arrow left the visible source endpoint');viewer.module='cortex';viewer.state.presentation='map';const audit=[];for(const s of data.steps){const es=pointEntries(s,ids);viewer.show(s,es,{hemisphere:es[0].side||'left'});viewer.frame(s.view,true);const a=surface.anchorFor(es[0],s.anchor_at)||viewer.anchor(es[0],s.anchor_at);if(!a)continue;const delta=a.position.clone().sub(viewer.camera.position),dist=delta.length();const ray=new THREE.Raycaster(viewer.camera.position,delta.normalize(),0,dist+.001);const h=ray.intersectObjects(viewer.visibleMeshes,false)[0];if(h&&!es[0].meshes.includes(h.object.userData.anatomyName)&&h.distance<dist-.001)audit.push({id:s.id,title:s.title,cover:h.object.userData.info.base});}assert.deepEqual(audit,[],'Default lesson pointer is covered by unrelated anatomy');const guideCount=surface.group.children.length;for(const guide of surface.group.children){guide.geometry.addEventListener('dispose',()=>disposedGuides++);guide.material.addEventListener('dispose',()=>disposedGuides++);}
assert(surface.group.children.every(m=>m.geometry.parameters.radius>=.0005),'Sulcal traces reverted to an unreadably thin radius');
viewer.module='cortex';viewer.state.presentation='map';viewer.controls.maxDistance=4;for(const l of viewer.layers.values())l.manual=false;
const visualPoint=data.steps.find(s=>s.structure==='visual');viewer.show(visualPoint,pointEntries(visualPoint,ids),{hemisphere:'left'});viewer.frame('medial',true);
assert(!byName.get('Corpus callosum').visible,'Unrequested callosum obstructed the medial cortical lesson');
viewer.zoom(.00001);assert(viewer.camera.position.distanceTo(viewer.controls.target)>=viewer.controls.minDistance-1e-10,'Zoom entered the teaching surface');assert(viewer.controls.minDistance>.035,'Cortical zoom retained its fixed unsafe limit');
surface.dispose();assert.equal(disposedGuides,guideCount*2);assert.equal(viewer.pickExtras.length,0);assert(!scene.children.includes(surface.group));
assert.equal(viewer.getSurfaceAnchor,null);
// Export actual source geometry for a separate scientific shape/color review,
// never as a substitute for a browser screenshot or a new anatomy asset.
if(process.argv.includes('--review')){
 viewer.camera.aspect=1.45;viewer.state.hemisphere='both';viewer.show(data.steps[0],[ids.get('cerebrum'),ids.get('frontal'),ids.get('parietal'),ids.get('temporal')],{hemisphere:'both'});viewer.frame('lateral',true);
 const records=viewer.visibleMeshes.map(m=>({name:m.userData.anatomyName,group:m.userData.info.group,color:m.userData.info.color,world:m.matrixWorld.toArray(),positions:Array.from(m.geometry.attributes.position.array),indices:Array.from(m.geometry.index.array)}));
 await mkdir('../tmp/cns',{recursive:true});await writeFile('../tmp/cns/model-review.json',JSON.stringify(records));
}
for(const m of byName.values()){m.geometry.dispose();m.material.dispose();}draco.destroy(decoder);
console.log(`PASS: ${data.steps.length} scenes / ${ids.size} structures / ${inventory.meshes.length} actual Draco meshes; all pages, quiz links, source geometry, colors, anchors, view framing, layer isolation and trace disposal verified.`);
