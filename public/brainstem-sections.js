import * as THREE from 'three';
import {SECTIONS,sectionFor} from './section-data.js?v=20261021-sections1';
import {anatomyColor} from './lesson-palette.js';

export function contourShape(path,map){
 const tokens=path.match(/[MLCQZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi),shape=new THREE.Shape();let i=0;
 const point=()=>map(Number(tokens[i++]),Number(tokens[i++]));
 while(i<tokens.length){const command=tokens[i++].toUpperCase();if(command==='Z'){shape.closePath();continue;}const p=point();if(command==='M')shape.moveTo(...p);else if(command==='L')shape.lineTo(...p);else if(command==='Q')shape.quadraticCurveTo(...p,...point());else if(command==='C')shape.bezierCurveTo(...p,...point(),...point());else throw Error('Unsupported section contour '+command);}
 return shape;
}
export class BrainstemSections{
 constructor(viewer,directory=new Map()){this.viewer=viewer;this.directory=directory;this.root=new THREE.Group();this.root.name='Lecture-matched 3D schematic sections';viewer.scene.add(this.root);this.cache=new Map();this.active=false;this.meshes=[];this.orbitLimits={minAzimuthAngle:viewer.controls.minAzimuthAngle??-Infinity,maxAzimuthAngle:viewer.controls.maxAzimuthAngle??Infinity,minPolarAngle:viewer.controls.minPolarAngle??0,maxPolarAngle:viewer.controls.maxPolarAngle??Math.PI};}
 build(key){
  const spec=SECTIONS[key],group=new THREE.Group(),[x0,y0,x1,y1]=spec.crop,cx=(x0+x1)/2,cy=(y0+y1)/2,scale=.075/(x1-x0),map=(x,y)=>[(x-cx)*scale,(cy-y)*scale],records=new Map(),meshes=[];
  const slab=(shape,color,z,depth,info,mirrored=false)=>{
   const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:28}),front=new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,toneMapped:false}),side=new THREE.MeshBasicMaterial({color:'#514258',side:THREE.DoubleSide,toneMapped:false});
   const mesh=new THREE.Mesh(geometry,[front,side]);mesh.position.z=z;
   if(mirrored){mesh.scale.x=-1;mesh.position.x=(2*spec.midline-2*cx)*scale;}
   const source=[info?.id,...info?.aliases||[]].map(id=>this.directory.get(id)).find(Boolean),layer=!info?'hindbrain':source&&!source.diagram_only?this.viewer.byName.get(source.meshes[0])?.userData.layer||'deep':'deep';
   mesh.userData={sectionFeature:info,sectionId:info?.id,anatomyName:`section:${key}:${info?.id||'outline'}`,info:{base:info?.id||spec.name,group:'section'},front,baseZ:z,layer};
   const edge=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(shape.getPoints(56).map(p=>new THREE.Vector3(p.x,p.y,depth+.00003))),new THREE.LineBasicMaterial({color:'#251c30',transparent:true}));edge.raycast=()=>{};mesh.add(edge);mesh.userData.edge=edge;
   group.add(mesh);meshes.push(mesh);return mesh;
  };
  const base=slab(contourShape(spec.outline,map),'#65576f',0,.003,null);
  spec.features.forEach((f,i)=>{
   const shape=contourShape(f.path,map),z=.0031+i*.00006,mesh=slab(shape,f.color,z,.00065,f),pair=f.mirror?slab(shape,f.color,z,.00065,f,true):null;
   const [x,y]=map(...f.anchor),record={feature:f,mesh,pair,localPosition:new THREE.Vector3(x,y,.00072)};
   for(const id of [f.id,...f.aliases||[]]){if(records.has(id))throw Error('Duplicate section binding '+key+':'+id);records.set(id,record);}
  });
  group.position.set(0,1.57,0);this.root.add(group);group.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(group).expandByScalar(.002),result={spec,group,base,records,meshes,bounds};this.cache.set(key,result);return result;
 }
 configure(step,entries){
  const key=!this.viewer.quiz?sectionFor(step):null;this.active=!!key;this.key=key;this.entries=entries;
  for(const c of this.cache.values())c.group.visible=false;
  if(key){this.current=this.cache.get(key)||this.build(key);this.current.group.visible=true;this.meshes=this.current.meshes;}else{this.current=null;this.meshes=[];}
  this.root.visible=this.active;return this.active;
 }
 apply(){
  // A section is a face, not a whole organ: keep its annotated face visible
  // during orbit. Surface/whole-body mode restores unrestricted original limits.
  Object.assign(this.viewer.controls,this.active&&!this.viewer.bodyContext?.expanded?{minAzimuthAngle:-1.15,maxAzimuthAngle:1.15,minPolarAngle:.5,maxPolarAngle:Math.PI-.5}:this.orbitLimits);
  if(!this.active)return;const v=this.viewer,selected=new Map();for(const e of this.entries)selected.set(e.id,e.color||anatomyColor(e.id));
  this.root.visible=!v.bodyContext?.expanded;
  for(const mesh of this.meshes){
   const f=mesh.userData.sectionFeature,ids=f?[f.id,...f.aliases||[]]:[],id=ids.find(id=>selected.has(id)),active=!!id,layer=v.layers.get(mesh.userData.layer);
   mesh.visible=layer.enabled&&layer.opacity>0&&(!v.state.isolate||!f||active);
   mesh.position.z=mesh.userData.baseZ+(active ? .0015 : 0);
   const front=mesh.userData.front;front.color.set(active?selected.get(id):f?.color||'#65576f');front.opacity=layer.opacity*(v.state.isolate&&!f?.id ? .12 : 1);
   front.transparent=front.opacity<1;front.depthWrite=front.opacity>.99;
   for(const side of mesh.material.slice(1)){side.opacity=front.opacity;side.transparent=front.transparent;side.depthWrite=front.depthWrite;}
   mesh.userData.edge.material.opacity=front.opacity;
   mesh.userData.edge.material.color.set(active?'#fff0c8':'#21192c');
  }
  this.root.updateMatrixWorld(true);
 }
 anchor(entry){
  const r=this.current?.records.get(entry.id);if(!this.active||!r?.mesh.visible)return null;
  return {mesh:r.mesh,localPosition:r.localPosition.clone(),position:r.localPosition.clone().applyMatrix4(r.mesh.matrixWorld),section:true,sectionName:this.current.spec.name,precision:r.feature.precision,shared:r.feature.shared||null,sectionFeature:r.feature.id};
 }
 get bounds(){return this.current?.bounds;}
 get shown(){return this.root.visible?this.meshes.filter(m=>m.visible):[];}
 dispose(){Object.assign(this.viewer.controls,this.orbitLimits);const geometries=new Set(),materials=new Set();this.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.root.removeFromParent();this.root.clear();this.cache.clear();this.meshes=[];}
}
