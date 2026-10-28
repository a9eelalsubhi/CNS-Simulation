import * as THREE from 'three';

const NS='http://www.w3.org/2000/svg';
const CORTEX=new Set(['frontal','parietal','temporal','occipital','opercular','limbic','paracentral']);
const el=(name,attributes={})=>{const e=document.createElementNS(NS,name);for(const [k,v]of Object.entries(attributes))e.setAttribute(k,v);return e;};
const definition=(base,text,id,plane='lateral',short=text)=>({base,text,id,plane,short});
export const SURFACE_NAMES=[
 definition('Superior frontal gyrus','Superior frontal gyrus','superior-frontal','lateral','Sup. frontal g.'),
 definition('Middle frontal gyrus','Middle frontal gyrus','middle-frontal','lateral','Middle frontal g.'),
 definition('Opercular part of inferior frontal gyrus','Inferior frontal gyrus','inferior-frontal','lateral','Inf. frontal g.'),
 definition('Precentral gyrus','Precentral gyrus','precentral','lateral','Precentral g.'),
 definition('Postcentral gyrus','Postcentral gyrus','postcentral','lateral','Postcentral g.'),
 definition('Superior parietal lobule','Superior parietal lobule','superior-parietal','lateral','Sup. parietal lobule'),
 definition('Supramarginal gyrus','Supramarginal gyrus','supramarginal','lateral','Supramarginal g.'),
 definition('Angular gyrus','Angular gyrus','angular','lateral','Angular g.'),
 definition('Superior temporal gyrus (Lateral part)','Superior temporal gyrus','temporal-gyri','lateral','Sup. temporal g.'),
 definition('Middle temporal gyrus','Middle temporal gyrus','temporal-gyri','lateral','Middle temporal g.'),
 definition('Inferior temporal gyrus','Inferior temporal gyrus','temporal-gyri','lateral','Inf. temporal g.'),
 definition('Superior occipital gyri','Superior occipital gyri','occipital-sulci','lateral','Sup. occipital gyri'),
 definition('Lateral occipital gyrus (Middle occipital gyrus*)','Lateral occipital gyrus','occipital-sulci','lateral','Lateral occipital g.'),
 definition('Cingulate gyrus and sulcus (Middle anterior part)','Cingulate gyrus','cingulate','medial','Cingulate g.'),
 definition('Paracentral gyrus and sulcus*','Paracentral lobule','paracentral','medial'),
 definition('Precuneus','Precuneus','precuneus','medial'),
 definition('Cuneus','Cuneus','cuneus','medial'),
 definition('Lingual gyrus','Lingual gyrus','lingual','medial','Lingual g.'),
 definition('Corpus callosum','Corpus callosum','callosum','medial'),
 definition('Straight gyrus (Gyrus rectus)','Gyrus rectus','rectus','inferior'),
 definition('Orbital gyri','Orbital gyri','orbital','inferior'),
 definition('Lateral occipitotemporal gyrus','Occipitotemporal gyrus','occipitotemporal','inferior','Occipitotemporal g.'),
 definition('Medial occipitotemporal gyrus (Parahippocampal*)','Parahippocampal gyrus','olfactory','inferior','Parahippocampal g.'),
];
const SULCUS_IDS={
 'Central sulcus':'central','Superior frontal sulcus':'frontal-sulci','Inferior frontal sulcus':'frontal-sulci',
 'Precentral sulcus (Superior part)*':'precentral-sulcus','Precentral sulcus (inferior part)*':'precentral-sulcus',
 'Postcentral sulcus':'postcentral-sulcus','Intraparietal sulcus':'intraparietal',
 'Lat_Fis-post':'lateral','Lat_Fis-ant-Horizont':'lateral','Lat_Fis-ant-Vertical':'lateral',
 'Superior temporal sulcus':'temporal-sulci','Inferior temporal sulcus':'temporal-sulci',
 'Parieto-occipital sulcus':'parieto-occipital','Calcarine sulcus':'medial-y',
 'Cingulate sulcus (Marginal part*)':'medial-y','Collateral sulcus':'collateral',
 'Olfactory sulcus':'olfactory-sulcus','Orbital sulci (H-shaped orbital sulci*)':'orbital-h',
 'Lunate sulcus':'occipital-sulci','Transverse occipital sulcus':'occipital-sulci',
};
const SULCUS_TEXT={'Lat_Fis-post':'Lateral sulcus','Lat_Fis-ant-Horizont':'Anterior ramus','Lat_Fis-ant-Vertical':'Ascending ramus','Precentral sulcus (Superior part)*':'Precentral sulcus','Precentral sulcus (inferior part)*':'Precentral sulcus','Cingulate sulcus (Marginal part*)':'Marginal sulcus','Orbital sulci (H-shaped orbital sulci*)':'H-shaped orbital sulci'};
const MAJOR_SULCI=new Set(['Central sulcus','Superior frontal sulcus','Intraparietal sulcus','Lat_Fis-post','Superior temporal sulcus']);
const NEIGHBORS={central:['precentral','postcentral'],precentral:['postcentral','central'],postcentral:['precentral','central'],'precentral-sulcus':['precentral','superior-frontal','middle-frontal'],'postcentral-sulcus':['postcentral','superior-parietal'],'frontal-sulci':['superior-frontal','middle-frontal','inferior-frontal'],intraparietal:['superior-parietal','supramarginal','angular'],'temporal-sulci':['temporal-gyri'],lateral:['inferior-frontal','temporal-gyri'],angular:['supramarginal'],supramarginal:['angular'],cuneus:['lingual','medial-y'],lingual:['cuneus','medial-y']};
export function nameInLesson(name,step,entry,scope='focus'){
 if(scope==='all'||step?.mode==='explorer')return true;
 if(['brain-components','cord','grey-white'].includes(step?.mode))return false;
 return name.id===step?.structure||entry?.meshes.includes(name.mesh.userData.anatomyName)||NEIGHBORS[step?.structure]?.includes(name.id)||false;
}
// A straight baseline, sized by its chord rather than the folded projected
// arc, keeps letters upright. Curving a single quadratic through three points
// can overshoot the actual parcel and invalidates its collision rectangle.
export function readableBaseline(points){
 const a=points[0],b=points.at(-1),center=points[Math.floor(points.length/2)];
 let dx=b.x-a.x,dy=b.y-a.y;if(dx<0||(Math.abs(dx)<.01&&dy>0)){dx=-dx;dy=-dy;}
 const span=Math.hypot(dx,dy);return {center,span,angle:Math.atan2(dy,dx),ux:dx/(span||1),uy:dy/(span||1)};
}
const axisFor=plane=>plane==='inferior'?new THREE.Vector3(0,-1,0):new THREE.Vector3(1,0,0);
const length=points=>points.slice(1).reduce((sum,p,i)=>sum+p.distanceTo(points[i]),0);
export function orientedLabelBox(center,start,end,width,height){
 const d=new THREE.Vector2(end.x-start.x,end.y-start.y).normalize(),n=new THREE.Vector2(-d.y,d.x);
 return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>({x:center.x+d.x*x*width/2+n.x*y*height/2,y:center.y+d.y*x*width/2+n.y*y*height/2}));
}
export function labelsOverlap(a,b){
 // Separating-axis test for rotated text rectangles. Axis-aligned boxes
 // unnecessarily suppress parallel precentral/postcentral strip labels.
 for(const poly of [a,b])for(let i=0;i<2;i++){
  const edge={x:poly[i+1].x-poly[i].x,y:poly[i+1].y-poly[i].y},axis={x:-edge.y,y:edge.x};
  const pa=a.map(p=>p.x*axis.x+p.y*axis.y),pb=b.map(p=>p.x*axis.x+p.y*axis.y);
  if(Math.max(...pa)<Math.min(...pb)||Math.max(...pb)<Math.min(...pa))return false;
 }return true;
}

// Use the long axis of a SOURCE parcel, then cast each sample onto that same
// mesh. Labels follow the anatomical surface rather than a screen-space box.
// No vertices, material identities, or anatomical boundaries are changed.
export function sourceLabelPath(mesh,plane){
 const positions=mesh.geometry.attributes.position,all=[];
 const axes=plane==='inferior'?[0,2]:[2,1];
 for(let i=0;i<positions.count;i++)all.push(new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld));
 const direction=axisFor(plane);if(plane!=='inferior'){direction.x=mesh.userData.info.side==='right'?-1:1;if(plane==='medial')direction.negate();}
 // A cortical parcel contains buried banks and often a medial extension.
 // Estimate the label axis from its outward-facing depth band, so those
 // buried vertices cannot pull a label into a neighboring visible gyrus.
 const depths=all.map(p=>p.dot(direction)),minDepth=Math.min(...depths),maxDepth=Math.max(...depths),threshold=maxDepth-(maxDepth-minDepth)*.4;
 const world=all.filter((p,i)=>depths[i]>=threshold);
 const uv=world.map(p=>[p.getComponent(axes[0]),p.getComponent(axes[1])]);
 const mean=uv.reduce((a,p)=>[a[0]+p[0]/uv.length,a[1]+p[1]/uv.length],[0,0]);
 let xx=0,xy=0,yy=0;for(const p of uv){const x=p[0]-mean[0],y=p[1]-mean[1];xx+=x*x;xy+=x*y;yy+=y*y;}
 const angle=.5*Math.atan2(2*xy,xx-yy),u=[Math.cos(angle),Math.sin(angle)],v=[-u[1],u[0]];
 const longitudinal=uv.map(p=>(p[0]-mean[0])*u[0]+(p[1]-mean[1])*u[1]).sort((a,b)=>a-b);
 const lo=longitudinal[Math.floor(longitudinal.length*.14)],hi=longitudinal[Math.floor(longitudinal.length*.86)];
 const ray=new THREE.Raycaster(),box=new THREE.Box3().setFromBufferAttribute(positions).applyMatrix4(mesh.matrixWorld),center=box.getCenter(new THREE.Vector3()),points=[];
 for(let i=0;i<15;i++){
  const t=THREE.MathUtils.lerp(lo,hi,i/14),band=Math.max((hi-lo)*.12,.0006);
  let across=0,count=0;
  for(const p of uv){const along=(p[0]-mean[0])*u[0]+(p[1]-mean[1])*u[1];if(Math.abs(along-t)<band){across+=(p[0]-mean[0])*v[0]+(p[1]-mean[1])*v[1];count++;}}
  across=count?across/count:0;
  const point=center.clone().setComponent(axes[0],mean[0]+u[0]*t+v[0]*across).setComponent(axes[1],mean[1]+u[1]*t+v[1]*across);
  const origin=point.clone();const normalAxis=plane==='inferior'?1:0;
  origin.setComponent(normalAxis,center.getComponent(normalAxis)+direction.getComponent(normalAxis)*.35);
  ray.set(origin,direction.clone().negate());
  const hit=ray.intersectObject(mesh,false)[0];
  if(hit)points.push(hit.point.clone().addScaledVector(direction,.0007));
 }
 return {points,normal:direction};
}

export class SurfaceAtlas{
 constructor(viewer,svg,guideData,data,onSelect){
  this.viewer=viewer;this.svg=svg;this.data=data;this.enabled=true;this.labels=true;this.nameMode='both';this.nameScope='focus';this.life=new AbortController();this.group=new THREE.Group();this.group.name='Anatomical sulcal surface guides';viewer.scene.add(this.group);this.guides=[];this.names=[];this.occlusionTime=0;this.lastSignature='';this.selectedId='';
  this.defs=el('defs');svg.append(this.defs);
  const cortex=viewer.meshes.filter(m=>CORTEX.has(m.userData.info.group));
  const cast=new THREE.Raycaster();
  for(const guide of guideData.guides){
   const source=viewer.byName.get(guide.mesh);if(!source)throw Error('Unbound surface guide '+guide.mesh);
   const side=source.userData.info.side,normal=axisFor(guide.plane);if(guide.plane!=='inferior'){normal.x=side==='right'?-1:1;if(guide.plane==='medial')normal.negate();}
   const skin=cortex.filter(m=>m.userData.info.side===side),paths=[];
   for(const path of guide.paths){
    let points=[];const segments=[];const flush=()=>{if(points.length>=3)segments.push(points);points=[];};
    for(const xyz of path){
     const point=new THREE.Vector3(...xyz),origin=point.clone().addScaledVector(normal,.35);cast.set(origin,normal.clone().negate());
     // Drape only onto this hemisphere's original cortical surface. Real
     // depth testing remains ON: a trace cannot shine through another lobe.
     const hit=cast.intersectObjects(skin,false)[0];
     // A ray can hit a remote bank through a medial cavity. Such a hit is
     // not a surface continuation of this sulcus. Break the stroke instead
     // of drawing a long rod across the brain or reusing a floating point.
     if(!hit){flush();continue;}
     const draped=hit.point.clone().addScaledVector(normal,.00065);
     if(points.length&&points.at(-1).distanceTo(draped)>.003)flush();
     points.push(draped);
    }
    flush();for(const points of segments){
    if(points.length<3||length(points)<.003)continue;
    const curve=new THREE.CatmullRomCurve3(points,false,'centripetal');
    const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(12,points.length*2),.00055,7,false),new THREE.MeshBasicMaterial({color:'#253041',depthWrite:false,toneMapped:false}));
    tube.userData.anatomyName=guide.mesh;tube.renderOrder=3;this.group.add(tube);viewer.pickExtras.push(tube);paths.push({points,tube});
    }
   }
   this.guides.push({source,plane:guide.plane,normal,paths});
   const base=source.userData.info.base,id=SULCUS_IDS[base],longest=[...paths].sort((a,b)=>length(b.points)-length(a.points))[0];
   if(id&&longest&&!base.includes('inferior part')&&!base.startsWith('Lat_Fis-ant'))this.addName({base,text:SULCUS_TEXT[base]||base,short:SULCUS_TEXT[base]||base.replace('Superior','Sup.').replace('Inferior','Inf.'),id,plane:guide.plane,sulcus:true},source,longest.points,normal,onSelect);
  }
  for(const d of SURFACE_NAMES)for(const side of ['left','right','midline']){
   if(!data.structures.some(entry=>entry.id===d.id))continue;
   const mesh=viewer.meshes.find(m=>m.userData.info.base===d.base&&m.userData.info.side===side);if(!mesh)continue;
   const {points,normal}=sourceLabelPath(mesh,d.plane);if(points.length>2)this.addName(d,mesh,points,normal,onSelect);
  }
  // Non-cortical scenes still get a direct name on the selected structure.
  this.fallback=el('text',{'class':'surface-name selected','text-anchor':'middle'});svg.append(this.fallback);
  viewer.getSurfaceAnchor=(entry,at)=>this.anchorFor(entry,at);
 }
 anchorFor(entry,at){
  if(at)return null;
  const v=this.viewer,source=v.meshFor(entry);if(!source)return null;
  const direction=(v.transition?.to||v.camera.position).clone().sub(v.transition?.target||v.controls.target).normalize();
  const guide=this.guides.find(g=>g.source===source&&g.normal.dot(direction)>.2);
  let position,points;
  if(guide){const path=[...guide.paths].sort((a,b)=>length(b.points)-length(a.points))[0];if(path)points=path.points;}
  if(!points){const label=this.names.find(n=>n.mesh===source&&!n.sulcus&&n.normal.dot(direction)>.2);if(label)points=label.points;}
  if(points){
   // The midpoint of a name path can be hidden by the neighboring gyrus.
   // Prefer an exposed point ON THE SAME anatomical path, never the cover.
   const origin=v.transition?.to||v.camera.position,ray=new THREE.Raycaster(),skin=v.meshes.filter(m=>m.visible&&m.userData.info.group!=='sulci');
   for(const p of [...points].sort((a,b)=>a.distanceToSquared(points[points.length>>1])-b.distanceToSquared(points[points.length>>1]))){const delta=p.clone().sub(origin),distance=delta.length();ray.set(origin,delta.normalize());const hit=ray.intersectObjects(skin,false)[0];if(!hit||entry.meshes.includes(hit.object.userData.anatomyName)||hit.distance>=distance-.001){position=p.clone();break;}}
  }
  if(!position)return null;
  // For a groove, target its visible draped teaching trace instead of the
  // buried wall of the source sulcal ribbon. The logical source ID remains
  // unchanged, so layer state and lecture mapping still refer to that sulcus.
  return {mesh:source,position,localPosition:source.worldToLocal(position.clone()),surfaceGuide:!!guide};
 }
 addName(d,mesh,points,normal,onSelect){
  const id='surface-name-'+this.names.length,path=el('path',{id}),group=el('g',{'class':'surface-name'+(d.sulcus?' sulcus-name':''),role:'button',tabindex:'0','aria-label':d.text+' — show lecture point'}),text=el('text',{'text-anchor':'middle',dy:'4'}),textPath=el('textPath',{href:'#'+id,startOffset:'50%'}),title=el('title'),leader=el('path',{'class':'surface-leader'});
  textPath.textContent=d.text;title.textContent=d.text;group.append(title,leader,text);text.append(textPath);this.defs.append(path);this.svg.append(group);
  const choose=()=>onSelect(d.id);group.addEventListener('click',choose,{signal:this.life.signal});group.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}},{signal:this.life.signal});
  this.names.push({...d,mesh,points,normal,path,group,leader,textElement:text,textPath,visible:true});
 }
 configure(step,entries,{labels=true,quiz=false}={}){
  this.step=step;this.entries=entries;this.labels=labels;this.quiz=quiz;this.selectedId=step.structure;this.lastSignature='';this.sync();
 }
 sync(){
  const v=this.viewer;this.group.visible=v.state.borders&&!v.tracePlaying;
  for(const g of this.guides){
   const active=v.activeNames?.has(g.source.userData.anatomyName),layer=v.layers.get('sulci');
   for(const p of g.paths){p.tube.visible=this.guideVisible(g);p.tube.material.color.set(active?(v.quiz&&v.identify?'#f4c85b':v.studyColors?.get(g.source.userData.anatomyName)||'#f3bf5b'):'#302638');p.tube.material.opacity=layer.opacity;p.tube.material.transparent=layer.opacity<1;}
  }
  this.lastSignature='';
 }
 guideVisible(g){const v=this.viewer,layer=v.layers.get('sulci');return layer.enabled&&layer.opacity>0&&v.sideVisible(g.source.userData.info)&&(g.source.visible||(!v.state.isolate&&v.visibleMeshes.some(m=>CORTEX.has(m.userData.info.group)&&m.userData.info.side===g.source.userData.info.side)));}
 invalidate(){this.lastSignature='';}
 update(force=false){
  const v=this.viewer,rect=v.host.getBoundingClientRect(),w=v.host.clientWidth,h=v.host.clientHeight;
  if(!w||!h)return;
  const signature=[...v.camera.matrixWorld.elements,...v.camera.projectionMatrix.elements,w,h,this.labels,this.quiz,this.nameScope,this.nameMode,v.state.presentation,v.state.isolate].join(',');
  if(!force&&signature===this.lastSignature)return;this.lastSignature=signature;
  this.svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const enabled=this.labels&&!this.quiz&&!v.tracePlaying;
  const cameraDirection=v.camera.position.clone().sub(v.controls.target).normalize(),project=p=>{const q=p.clone().project(v.camera);return {x:(q.x+1)*w/2,y:(1-q.y)*h/2,z:q.z};};
  // A lateral teaching stroke is not an anatomical medial sulcus. Hide
  // strokes facing away even if a source cortical opening exposes them.
  for(const g of this.guides)for(const p of g.paths)p.tube.visible=this.guideVisible(g)&&g.normal.dot(cameraDirection)>.12;
  const rail=this.svg.parentElement.querySelector('.tour-rail'),railTop=rail?rail.getBoundingClientRect().top-rect.top:h;
  const orientation=this.svg.parentElement.querySelector('.orientation-badge');if(orientation){orientation.style.bottom='auto';orientation.style.top=Math.max(0,railTop-18)+'px';}
  const blockers=[...this.svg.parentElement.querySelectorAll('.guided-explanation,.view-heading,.camera-hud,.legend,.orbit-lock,.view-tools,.tour-rail,.trace-control')].filter(e=>e.getClientRects().length&&!e.closest('[hidden]')).map(e=>{const r=e.getBoundingClientRect(),x=(r.left-rect.left)*w/rect.width,y=(r.top-rect.top)*h/rect.height;return [{x:x-6,y:y-6},{x:x+r.width*w/rect.width+6,y:y-6},{x:x+r.width*w/rect.width+6,y:y+r.height*h/rect.height+6},{x:x-6,y:y+r.height*h/rect.height+6}];});
  const ray=new THREE.Raycaster(),visible=v.meshes.filter(m=>m.visible&&m.userData.info.group!=='sulci'),accepted=[...blockers];
  const primary=this.entries?.[0],related=n=>primary?.meshes.includes(n.mesh.userData.anatomyName),full=this.nameScope==='all'||this.step?.mode==='explorer',budget=full?(w<700?7:12):(w<700?3:5);
  const priority=n=>n.id===this.selectedId?100:related(n)?80:NEIGHBORS[this.selectedId]?.includes(n.id)?50:n.sulcus?0:20;
  const names=[...this.names].sort((a,b)=>priority(b)-priority(a));
  let count=0;
  for(const n of names){
   const active=n.id===this.selectedId||related(n),face=n.normal.dot(cameraDirection);
   let show=enabled&&(n.mesh.visible||n.sulcus&&this.guides.some(g=>g.source===n.mesh&&g.paths.some(p=>p.tube.visible)))&&face>.48&&count<budget&&nameInLesson(n,this.step,primary,this.nameScope);
   // Context starts with the gyri, like a printed atlas. Sulcal names appear
   // in a sulcus lesson or on close inspection, keeping the full map legible.
   const sulcusLesson=this.entries?.some(e=>e.meshes.some(name=>v.byName.get(name)?.userData.info.group==='sulci'));
   if(n.sulcus&&!active&&this.nameMode==='gyri'&&!sulcusLesson)show=false;
   if(n.sulcus&&!active&&this.nameMode==='both'&&!MAJOR_SULCI.has(n.base)&&!sulcusLesson)show=false;
   if(!n.sulcus&&!active&&this.nameMode==='sulci')show=false;
   if(n.sulcus&&!active&&names.filter(x=>x.sulcus&&x.id===this.selectedId).length)show=false;
   const screen=n.points.map(project),mid=screen[Math.floor(screen.length/2)],end=screen.at(-1),start=screen[0];
   if(!mid||mid.z<-1||mid.z>1||mid.x<20||mid.x>w-20||mid.y<120||mid.y>railTop-13)show=false;
   if(show){
    const center=n.points[Math.floor(n.points.length/2)],delta=center.clone().sub(v.camera.position),distance=delta.length();ray.set(v.camera.position,delta.normalize());
    const hit=ray.intersectObjects(visible,false)[0];n.visible=!hit||hit.object===n.mesh||hit.distance>=distance-.002;
   }
   if(!n.visible)show=false;
   const baseline=readableBaseline(screen),span=baseline.span*.86;
   let label=n.text,font=w<700?11:13;
   if(label.length*font*.57>span)label=n.short;
   const measureLabel=()=>{n.textPath.textContent=label;n.textElement.style.fontSize=font+'px';return n.textElement.getComputedTextLength?.()||label.length*font*.57;};
   let measured=measureLabel();
   const shortActive=(active||NEIGHBORS[this.selectedId]?.includes(n.id))&&!n.sulcus&&(measured>span||Math.abs(baseline.angle)>1.18);
   if(!n.sulcus&&!shortActive&&(measured>span||Math.abs(baseline.angle)>1.18))show=false;
   let box=orientedLabelBox(mid,{x:0,y:0},{x:baseline.ux,y:baseline.uy},measured+12,font*1.7+6),external=null;
   if((n.sulcus||shortActive)&&show){
    font=w<700?11:12;label=n.short;measured=measureLabel();
    const anchor=mid,textWidth=measured;
    // Printed-atlas convention: gyri are named INSIDE their colored strips;
    // short cyan leaders name the actual traced sulci at the periphery.
    // These are plain text, without cards, numbers, or detached arrowheads.
    outer:for(const dy of [-26,-48,28,50])for(const dx of [0,-55,55,-100,100]){
     const p={x:anchor.x+dx,y:anchor.y+dy};if(p.x-textWidth/2<14||p.x+textWidth/2>w-25||p.y<125||p.y>railTop-20)continue;
     const candidate=orientedLabelBox(p,{x:0,y:0},{x:1,y:0},textWidth+12,font*1.5+5);
     if(accepted.some(b=>labelsOverlap(candidate,b)))continue;
     box=candidate;external={p,anchor,textWidth};break outer;
    }
    if(!external)show=false;
   }
   // Active names obey the same collision rule as context names. Previously
   // every temporal gyrus shared the active ID and bypassed collision checks.
   if(accepted.some(b=>labelsOverlap(box,b))||box.some(p=>p.x<12||p.x>w-16||p.y<15||p.y>h-15))show=false;
   n.group.style.display=show?'':'none';n.group.setAttribute('aria-hidden',String(!show));n.group.setAttribute('tabindex',show?'0':'-1');
   if(show){
    const half=measured/2+8;
    n.path.setAttribute('d',external?`M${external.p.x-external.textWidth/2-4} ${external.p.y} L${external.p.x+external.textWidth/2+4} ${external.p.y}`:`M${mid.x-baseline.ux*half} ${mid.y-baseline.uy*half} L${mid.x+baseline.ux*half} ${mid.y+baseline.uy*half}`);
    n.leader.setAttribute('d',external?`M${external.p.x} ${external.p.y+(external.p.y<external.anchor.y?9:-9)} L${external.anchor.x} ${external.anchor.y}`:'');
    n.textPath.textContent=label;n.textElement.style.fontSize=font.toFixed(1)+'px';n.group.classList.toggle('selected',active);accepted.push(box);count++;
   }
  }
  const selected=this.entries?.find(e=>e.id===this.selectedId),hasDirect=this.names.some(n=>(n.id===this.selectedId||(selected?.kind!=='functional'&&selected?.meshes.includes(n.mesh.userData.anatomyName)))&&n.group.style.display!=='none');
  this.fallback.style.display='none';
  if(enabled&&!v.explanationActive&&!hasDirect&&selected){
   const anchor=v.anchor(selected),p=anchor&&project(anchor.position);
   if(p&&p.z>-1&&p.z<1&&p.y>140&&p.y<railTop-18&&p.x>80&&p.x<w-80){
     const text=anchor.regional?`Region: ${anchor.region}`:selected.anchor_label||selected.name.replace(/ —.*/,''),font=w<700?12:15,box=orientedLabelBox({x:p.x,y:p.y-6},{x:0,y:0},{x:1,y:0},text.length*font*.55,font*1.7);
    if(!accepted.some(b=>labelsOverlap(box,b))){this.fallback.textContent=text;this.fallback.setAttribute('x',p.x);this.fallback.setAttribute('y',p.y-6);this.fallback.style.display='';this.fallback.style.fontSize=font+'px';}
   }
  }
  this.svg.dataset.visibleNames=count+(this.fallback.style.display===''?1:0);
 }
 dispose(){this.life.abort();this.viewer.getSurfaceAnchor=null;this.viewer.pickExtras=this.viewer.pickExtras.filter(m=>m.parent!==this.group);for(const g of this.group.children){g.geometry.dispose();g.material.dispose();}this.group.clear();this.group.removeFromParent();this.svg.replaceChildren();this.guides=[];this.names=[];}
}
