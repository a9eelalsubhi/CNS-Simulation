import * as THREE from 'three';
const start=new THREE.Vector3(),end=new THREE.Vector3(),direction=new THREE.Vector3(),rotation=new THREE.Quaternion(),identity=new THREE.Quaternion();
// Cartesian interpolation from posterior to anterior crosses the orbit target
// and temporarily places the camera INSIDE the brain. Interpolate direction on
// a sphere and radius separately, while moving OrbitControls.target in sync.
export function interpolateCamera(t,s,position,target){
 start.copy(t.from).sub(t.fromTarget);end.copy(t.to).sub(t.target);
 const a=start.length(),b=end.length();start.normalize();end.normalize();
 rotation.setFromUnitVectors(start,end);identity.identity().slerp(rotation,s);
 direction.copy(start).applyQuaternion(identity);
 target.lerpVectors(t.fromTarget,t.target,s);
 position.copy(target).addScaledVector(direction,THREE.MathUtils.lerp(a,b,s));
}
