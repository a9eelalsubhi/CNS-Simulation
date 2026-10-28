import * as THREE from 'three';
import {projectAnchor} from './annotation-layout.js';

// One reusable projector per overlay. Anchors are source-mesh LOCAL points:
// matrixWorld moves them with the anatomy, then projectAnchor converts NDC to
// canvas CSS pixels and finally to the SVG's CSS-pixel coordinate system.
// Never multiply annotation coordinates by devicePixelRatio.
export class LeaderProjector {
 constructor(){this.world=new THREE.Vector3();this.delta=new THREE.Vector3();this.scratch=new THREE.Vector3();this.ray=new THREE.Raycaster();}
 project(anchor,entry,viewer,meshes,canvasRect,overlayRect,width,height){
  if(!anchor?.mesh?.visible||anchor.mesh.material.opacity===0)return {visible:false,state:'hidden'};
  for(let node=anchor.mesh.parent;node;node=node.parent)if(!node.visible)return {visible:false,state:'hidden'};
  this.world.copy(anchor.localPosition).applyMatrix4(anchor.mesh.matrixWorld);
  const point=projectAnchor(this.world,viewer.camera,canvasRect,overlayRect,width,height,this.scratch);
  if(!point.visible)return {visible:false,state:'offscreen'};
  if(anchor.section)return {visible:true,point,occluded:false,state:'section'};
  this.delta.copy(this.world).sub(viewer.camera.position);
  const distance=this.delta.length();this.ray.set(viewer.camera.position,this.delta.normalize());this.ray.far=distance+.001;
  const hit=this.ray.intersectObjects(meshes,false).find(h=>(!viewer.isRenderedHit||viewer.isRenderedHit(h))&&!(viewer.module==='cranial'&&h.object.material.opacity<.5)&&!(viewer.module==='brainstem'&&['brainstem','stem-surface'].includes(h.object.userData.info.group)&&h.object.material.opacity<=.12));
  const occluded=!!hit&&!entry.meshes.includes(hit.object.userData.anatomyName)&&hit.distance<distance-.0003;
  // A far-side target is still the SAME anatomical point. Keep its leader,
  // but draw it dashed with a hollow endpoint and explicitly name the cover.
  // This prevents orbiting from silently deleting the teaching connection.
  return {visible:true,point,occluded,occluder:occluded?hit.object.userData.info.base:null,state:anchor.regional?'regional':occluded?'through-surface':'surface'};
 }
}
