// Coordinates are fractions of the ORIGINAL lecture illustrations, measured
// at the drawn structure (not the text label). These are diagram locations,
// not invented 3D nuclei, segmentations, or histological boundary claims.
export const PLATES={
 anterior:{name:'Anterior · ventral surface',page:1,points:{brainstem:[.46,.54],midbrain:[.43,.27],pons:[.46,.43],medulla:[.46,.72],limits:[.46,.86],'cranial-nerves':[.56,.58],'cn3':[.51,.267],'cn4':[.596,.322],'cn5':[.61,.447],'cn6':[.496,.529],'cn7':[.555,.567],'cn8':[.576,.582],'cn9':[.559,.653],'cn10':[.539,.701],'cn11':[.538,.731],'cn12':[.511,.677],crus:[.37,.28],peduncle:[.37,.28],mcp:[.60,.485],'basilar-groove':[.463,.45],pyramid:[.443,.70],olive:[.535,.646]}},
 location:{name:'In situ · brain, skull & vertebrobasilar supply',page:1,points:{brainstem:[.59,.62],midbrain:[.62,.525],pons:[.62,.60],medulla:[.55,.68],'blood-supply':[.60,.70]}},
 posterior:{name:'Posterior · dorsal surface',page:2,points:{tectum:[.49,.12],'superior-colliculi':[.53,.10],'inferior-colliculi':[.54,.16],'cn4':[.59,.19],scp:[.57,.29],mcp:[.61,.39],icp:[.59,.46],'pontine-tegmentum':[.50,.42],'fourth-ventricle':[.50,.42],'sulcus-limitans':[.55,.41],'facial-colliculus':[.515,.45],gracile:[.47,.73],cuneate:[.52,.75],'vagal-trigone':[.48,.66],medulla:[.49,.73]}},
 inferior:{name:'Midbrain · inferior collicular level',page:3,section:true,points:{'inferior-colliculi':[.565,.17],aqueduct:[.486,.278],tectum:[.55,.17],peduncle:[.65,.71],crus:[.66,.76],'substantia-nigra':[.65,.69],tegmentum:[.53,.45],reticular:[.60,.56],corticospinal:[.72,.76],corticobulbar:[.70,.77],frontopontine:[.61,.85],temporopontine:[.74,.62],'mesencephalic-v':[.558,.28],mlf:[.532,.421],'trochlear-nucleus':[.508,.384],'scp-crossing':[.49,.535],'spinal-lemniscus':[.645,.42],'lateral-lemniscus':[.636,.324],'medial-lemniscus':[.636,.482],'trigeminal-lemniscus':[.653,.392]}},
 superior:{name:'Midbrain · superior collicular level',page:4,section:true,points:{'superior-colliculi':[.57,.084],aqueduct:[.492,.21],'red-nucleus':[.565,.522],'oculomotor-nucleus':[.531,.341],'mesencephalic-v':[.573,.21],mlf:[.56,.36],'substantia-nigra':[.658,.61],corticospinal:[.72,.70],corticobulbar:[.69,.73],frontopontine:[.62,.82],temporopontine:[.74,.58],'medial-lemniscus':[.644,.445],'spinal-lemniscus':[.651,.395],'trigeminal-lemniscus':[.645,.34],reticular:[.54,.405]}},
 pons:{name:'Pons · facial colliculus level',page:6,section:true,points:{pons:[.50,.55],'fourth-ventricle':[.50,.27],'facial-colliculus':[.474,.39],'abducens-nucleus':[.474,.404],'facial-nucleus':[.437,.474],'trigeminal-nuclei':[.63,.445],'vestibular-nuclei':[.61,.25],'cochlear-nuclei':[.72,.35],mcp:[.72,.45],icp:[.65,.36],scp:[.61,.25],mlf:[.473,.36],'pontine-nuclei':[.57,.69],corticospinal:[.59,.68],corticobulbar:[.58,.68],corticopontine:[.65,.61],pontocerebellar:[.66,.67],reticular:[.56,.47],'medial-lemniscus':[.56,.53],'trigeminal-lemniscus':[.63,.445],cn7:[.494,.535],cn6:[.43,.67]}},
 'medulla-anterior':{name:'Medulla · anterior relationships',page:7,points:{medulla:[.40,.69],pyramid:[.43,.70],olive:[.47,.63],icp:[.51,.61],cn9:[.52,.65],cn10:[.53,.69],cn11:[.54,.74],cn12:[.47,.73]}},
 'medulla-posterior':{name:'Medulla · dorsal landmarks',page:8,points:{medulla:[.45,.75],posteromedian:[.459,.83],gracile:[.44,.75],cuneate:[.41,.73],'vagal-trigone':[.437,.67],'fourth-ventricle':[.48,.57],icp:[.52,.62],'sulcus-limitans':[.51,.49],'facial-colliculus':[.48,.50]}},
 medulla:{name:'Medulla · pathways and sensory crossing',page:9,section:true,points:{'medial-lemniscus':[.50,.75],'internal-arcuate':[.49,.63],'spinal-lemniscus':[.70,.65],'posterior-spinocerebellar':[.74,.43],cuneocerebellar:[.63,.24],'anterior-spinocerebellar':[.72,.69],gracile:[.54,.17],cuneate:[.61,.27],pyramid:[.56,.89],olive:[.63,.79],reticular:[.63,.58]}}
};

const NS='http://www.w3.org/2000/svg';
export class BrainstemPlates{
 constructor(viewer,host,onOpen){
  Object.assign(this,{viewer,host,onOpen});this.life=new AbortController();this.enabled=false;this.selected='anterior';
  this.image=host.querySelector('img');this.svg=host.querySelector('svg');this.caption=host.querySelector('[data-plate-caption]');
  this.image.addEventListener('load',()=>{this.update();viewer.dirty=true;viewer.onChange?.();},{signal:this.life.signal});
  host.querySelector('[data-enlarge-plate]').addEventListener('click',()=>onOpen(PLATES[this.selected].page),{signal:this.life.signal});
  this.observer=new ResizeObserver(()=>{this.update();viewer.dirty=true;viewer.onChange?.();});this.observer.observe(host);
  viewer.getDiagramAnchor=entry=>this.enabled&&this.pointFor(entry.id)?{diagram:true,id:entry.id}:null;
  viewer.projectDiagramAnchor=(id,overlay)=>this.project(id,overlay);
 }
 configure(step,entries){this.step=step;this.entries=entries;this.show(step.plate||'anterior',false);}
 show(key,enabled=true){
  this.selected=PLATES[key]?key:'anterior';this.enabled=enabled;this.host.hidden=!enabled;
  const p=PLATES[this.selected];const path=`/slides/brainstem/${this.selected}.jpg?v=20261021-sections1`;
  if(enabled&&this.image.getAttribute('src')!==path)this.image.src=path;this.image.alt=p.name+' · original lecture illustration';
  this.caption.textContent=p.name+' · original lecture diagram · '+(p.section?'Dorsal ↑ / Ventral ↓':'');
  this.viewer.plateActive=enabled;this.update();this.viewer.dirty=true;
 }
 pointFor(id){return PLATES[this.selected].points[id];}
 imageRect(){
  const box=this.image.getBoundingClientRect(),aspect=(this.image.naturalWidth||1)/(this.image.naturalHeight||1),w=Math.min(box.width,box.height*aspect),h=w/aspect;
  return {left:box.left+(box.width-w)/2,top:box.top+(box.height-h)/2,width:w,height:h};
 }
 project(id,overlay){
  const at=this.pointFor(id);if(!this.enabled||!at)return null;
  const r=this.imageRect(),o=overlay.getBoundingClientRect();
  return {visible:r.width>0&&r.height>0,x:(r.left+at[0]*r.width-o.left)*overlay.clientWidth/o.width,y:(r.top+at[1]*r.height-o.top)*overlay.clientHeight/o.height};
 }
 update(){
  if(!this.enabled)return;
  const root=this.host.getBoundingClientRect(),r=this.imageRect();this.svg.setAttribute('viewBox',`0 0 ${root.width} ${root.height}`);this.svg.replaceChildren();
  // All available points remain keyboard-accessible in the directory. Only
  // the current colored location is drawn to keep the source plate readable.
  for(const entry of this.entries||[]){const at=this.pointFor(entry.id);if(!at)continue;const circle=document.createElementNS(NS,'circle');circle.setAttribute('cx',r.left-root.left+at[0]*r.width);circle.setAttribute('cy',r.top-root.top+at[1]*r.height);circle.setAttribute('r',Math.max(7,Math.min(15,r.width*.018)));circle.setAttribute('fill',entry.color+'35');circle.setAttribute('stroke',entry.color);circle.setAttribute('stroke-width','3');this.svg.append(circle);}
 }
 dispose(){this.life.abort();this.observer.disconnect();this.host.hidden=true;this.svg.replaceChildren();delete this.viewer.getDiagramAnchor;delete this.viewer.projectDiagramAnchor;}
}
