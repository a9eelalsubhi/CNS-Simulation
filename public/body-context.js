import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {DRACOLoader} from './vendor/DRACOLoader.js';
import {loadAnatomyModel,disposeObjectTree} from './mesh-resources.js';

// A second scissored view uses the SAME renderer and source coordinate system.
// The full-body locator never becomes the camera's anatomical focus box and
// never enters picking/occlusion tests for a lecture label.
export class BodyContext {
 constructor(viewer,element,button){
  Object.assign(this,{viewer,element,button});this.enabled=true;this.expanded=false;this.opacity=viewer.module==='cranial'?.01:.06;
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(28,1,.01,12);
  this.miniMaterial=new THREE.MeshBasicMaterial({color:'#a99bb3',transparent:true,opacity:.29,depthWrite:false});
  this.ghostMaterial=new THREE.MeshBasicMaterial({color:'#c0b3cf',transparent:true,opacity:.055,depthWrite:false,side:THREE.FrontSide});
  this.brainMaterial=new THREE.MeshBasicMaterial({color:'#b9a0d0',transparent:true,opacity:.25,depthWrite:false});
  this.focusMaterial=new THREE.MeshBasicMaterial({color:viewer.module==='brainstem'?'#f3bf5b':'#e692c6',toneMapped:false});
  this.sharedMaterials=[this.miniMaterial,this.ghostMaterial,this.brainMaterial,this.focusMaterial];this.miniBrain=[];
 }
 async load(url){
  const d=new DRACOLoader();d.setDecoderPath('/vendor/');d.setDecoderConfig({type:'wasm'});
  const loader=new GLTFLoader();loader.setDRACOLoader(d);
  try{
   const gltf=await loadAnatomyModel(loader,url,this.viewer.life.signal),original=gltf.scene;original.updateMatrixWorld(true);
   // The skeleton is static context. Bake the unchanged WORLD positions into
   // one draw call rather than drawing 335 separate transparent bones twice.
   const parts=[];let count=0,indexCount=0;original.traverse(m=>{if(m.isMesh){parts.push(m);count+=m.geometry.attributes.position.count;indexCount+=m.geometry.index?.count||m.geometry.attributes.position.count;}});
   const positions=new Float32Array(count*3),indices=new Uint32Array(indexCount),p=new THREE.Vector3();let offset=0,cursor=0;
   for(const m of parts){const a=m.geometry.attributes.position,idx=m.geometry.index,reflected=m.matrixWorld.determinant()<0;for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld);p.toArray(positions,(offset+i)*3);}const n=idx?.count||a.count;
    for(let i=0;i<n;i+=3){const tri=[0,1,2].map(k=>(idx?idx.getX(i+k):i+k)+offset);if(reflected)[tri[1],tri[2]]=[tri[2],tri[1]];indices.set(tri,cursor);cursor+=3;}offset+=a.count;
   }
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setIndex(new THREE.BufferAttribute(indices,1));geometry.computeBoundingSphere();geometry.computeBoundingBox();disposeObjectTree(original);
   this.root=new THREE.Group();this.root.name='Full-body context · original subject coordinates';const skeleton=new THREE.Mesh(geometry,this.ghostMaterial);skeleton.renderOrder=-10;skeleton.raycast=()=>{};this.root.add(skeleton);
   this.mini=this.root.clone(true);this.mini.traverse(m=>{if(m.isMesh)m.material=this.miniMaterial;});this.scene.add(this.mini);this.viewer.scene.add(this.root);
   this.root.updateMatrixWorld(true);this.bounds=new THREE.Box3().setFromObject(this.root);
   for(const m of this.viewer.meshes){const g=m.userData.info.group;if(!['frontal','parietal','temporal','occipital','brainstem'].includes(g))continue;
    const focus=this.viewer.module==='brainstem'?g==='brainstem':g!=='brainstem';const c=new THREE.Mesh(m.geometry,focus?this.focusMaterial:this.brainMaterial);m.updateWorldMatrix(true,false);c.matrixAutoUpdate=false;c.matrix.copy(m.matrixWorld);this.scene.add(c);this.miniBrain.push(c);
   }
   this.ready=true;this.update();this.viewer.dirty=true;
  }finally{d.dispose();}
 }
 update(){
  if(!this.ready)return;
  this.root.visible=this.enabled&&!this.viewer.quiz&&((!this.viewer.sections?.active&&!this.viewer.cranial?.active)||this.expanded);this.element.hidden=!this.enabled||!!this.viewer.quiz;
  this.ghostMaterial.opacity=this.expanded?.24:this.opacity;this.viewer.controls.maxDistance=this.expanded?8:Math.max(4,(this.viewer.cranial?.framedDistance||0)*1.05);
  this.button.textContent=this.expanded?'↩ Return to lesson':'↗ Whole body';
  this.button.setAttribute('aria-pressed',String(this.expanded));
 }
 toggleExpanded(){this.expanded=!this.expanded;this.update();this.viewer.apply();if(this.expanded)this.frameBody();else this.viewer.frame(this.viewer.step.view);this.viewer.dirty=true;}
 frameBody(){
  if(!this.ready)return;
  const v=this.viewer,center=this.bounds.getCenter(new THREE.Vector3()),size=this.bounds.getSize(new THREE.Vector3());
  const ty=Math.tan(THREE.MathUtils.degToRad(v.camera.fov/2)),space=v.getTeachingSpace?.();
  const widthFraction=Math.max(.15,((space?.right||v.host.clientWidth)-130)/v.host.clientWidth),heightFraction=.63;
  const distance=Math.max(size.y/(2*ty*heightFraction),size.x/(2*ty*v.camera.aspect*widthFraction))+.3;
  const target=center.clone();target.y-=size.y*.06;v.camera.up.set(0,1,0);
  const position=target.clone().add(new THREE.Vector3(.12,0,distance));
  v.transition={time:performance.now(),from:v.camera.position.clone(),fromTarget:v.controls.target.clone(),to:position,target};v.dirty=true;
 }
 render(){
  if(!this.ready||!this.enabled||this.viewer.quiz||this.element.hidden)return;
  const v=this.viewer,r=this.element.querySelector('.body-inset').getBoundingClientRect(),host=v.renderer.domElement.getBoundingClientRect();
  const sx=v.host.clientWidth/host.width,sy=v.host.clientHeight/host.height,w=r.width*sx,h=r.height*sy,x=(r.left-host.left)*sx,y=(host.height-(r.bottom-host.top))*sy;if(w<=0||h<=0)return;
  this.camera.aspect=w/h;this.camera.updateProjectionMatrix();const center=this.bounds.getCenter(new THREE.Vector3()),size=this.bounds.getSize(new THREE.Vector3()),ty=Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2));
  const distance=Math.max(size.y/(2*ty),size.x/(2*ty*this.camera.aspect))*1.1;
  this.camera.position.copy(center).add(new THREE.Vector3(.05,.01,distance));this.camera.lookAt(center);this.camera.updateMatrixWorld(true);
  const renderer=v.renderer;renderer.autoClear=false;renderer.setScissorTest(true);renderer.setViewport(x,y,w,h);renderer.setScissor(x,y,w,h);renderer.clearDepth();renderer.render(this.scene,this.camera);renderer.setScissorTest(false);renderer.setViewport(0,0,v.host.clientWidth,v.host.clientHeight);renderer.autoClear=true;
 }
 dispose(){
  // Mini meshes share geometry with the main source; remove them before
  // disposing the owned root so shared GPU buffers are released exactly once.
  this.scene.clear();this.miniBrain=[];if(this.root){this.root.traverse(m=>{if(m.isMesh)m.material=[];});disposeObjectTree(this.root);}
  this.sharedMaterials.forEach(m=>m.dispose());this.element.hidden=true;
 }
}
