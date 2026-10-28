import * as THREE from 'three';

// Every object is an explicitly schematic object. No coordinates from this
// teaching plane are ever advertised as measured head/foramen coordinates.
const C=['#edac6f','#78d9e8','#f6ce69','#c4a1f3','#6bd9bb','#e9a0cd','#f195a7','#91cce9','#b8d67b','#c7a5ed','#f1bd77','#ea9ec8'];
export const GATES=[['cribriform','Cribriform · I',0,.8],['optic','Optic canal · II',-.25,.49],['sof','SOF · III IV V1 VI',.32,.44],['rotundum','Rotundum · V2',.47,.12],['ovale','Ovale · V3',.49,-.14],['iam','IAM · VII VIII',-.48,-.17],['jugular','Jugular · IX X XI',-.39,-.47],['hypoglossal','Hypoglossal · XII',.32,-.48],['magnum','Foramen magnum · XI enters',0,-.55],['lacerum','Foramen lacerum',-.2,.02],['spinosum','Foramen spinosum',.67,-.25]];
export function disposeDiagram(root){const g=new Set(),m=new Set(),t=new Set();root.traverse(o=>{if(o.geometry)g.add(o.geometry);for(const mat of Array.isArray(o.material)?o.material:[o.material])if(mat){m.add(mat);if(mat.map)t.add(mat.map);}});for(const x of g)x.dispose();for(const x of m)x.dispose();for(const x of t)x.dispose();root.removeFromParent();root.clear();}

export function createCranialDiagram(v,color='#f6ce69',{labels=true}={}){
 const root=new THREE.Group(),nodes=new Map(),shown=[];
 // Schematic fills encode categories. Keep their exact sRGB colors independent
 // of the bright anatomical lighting; source anatomical meshes remain shaded.
 const material=(c,opacity=1)=>new THREE.MeshBasicMaterial({color:c,toneMapped:false,transparent:opacity<1,opacity,side:THREE.DoubleSide});
 const foreground=c=>{const rgb=new THREE.Color(c);return .2126*rgb.r+.7152*rgb.g+.0722*rgb.b>.25?'#211829':'#f4edf8';};
 const label=(text,x,y,size=.034,width=.52,ink='#f4edf8',height=size*3.1)=>{
  if(!labels)return;
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=Math.ceil(768*height/width);const ctx=canvas.getContext('2d');
  // Match the texture aspect ratio to the physical plane. The previous fixed
  // 128px canvas squeezed 40px glyphs into microscopic world-space labels.
  // Fit measured words in the available box without stretching or truncation.
  const words=text.split(' ');let lines,font=100;
  do {ctx.font=`600 ${font}px Arial`;lines=[''];for(const w of words){let i=lines.length-1;if(ctx.measureText(lines[i]+' '+w).width>740&&lines[i])lines.push(w);else lines[i]+=(lines[i]?' ':'')+w;}if(lines.length*font*1.15<=canvas.height-8&&words.every(w=>ctx.measureText(w).width<=740))break;font-=2;}while(font>20);
  ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';
  for(let i=0;i<lines.length;i++)ctx.fillText(lines[i],384,canvas.height/2+(i-(lines.length-1)/2)*font*1.15);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));mesh.position.set(x,y,.074);mesh.renderOrder=4;mesh.raycast=()=>{};mesh.userData.info={group:'cranial-schematic',base:text};root.add(mesh);shown.push(mesh);
 };
 const node=(id,text,x,y,w=.55,h=.16,c=color)=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,.045),material(c));mesh.position.set(x,y,0);mesh.userData={anatomyName:'cnmap:'+id,info:{name:id,base:text,group:'cranial-schematic'},anchorLocal:new THREE.Vector3(0,0,.0225),nodeId:id};root.add(mesh);nodes.set(id,mesh);shown.push(mesh);label(text,x,y,.029,w*.94,foreground(c),h*.84);return mesh;
 };
 const curve=(id,points,c=color,r=.012)=>{
  const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),mesh=new THREE.Mesh(new THREE.TubeGeometry(path,40,r,7,false),material(c));mesh.userData={anatomyName:'cnmap:'+id,info:{name:id,base:id,group:'cranial-schematic'},anchorLocal:path.getPoint(.5).add(new THREE.Vector3(0,0,r)),nodeId:id};root.add(mesh);shown.push(mesh);nodes.set(id,mesh);return mesh;
 };
 const plate=(shape,c='#57485e',depth=.035)=>{const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:24}),material(c));root.add(mesh);shown.push(mesh);mesh.userData={info:{group:'cranial-schematic',base:'Schematic backdrop'},anatomyName:'cnmap:backdrop'};mesh.raycast=()=>{};return mesh;};
 const ellipse=(cx,cy,rx,ry)=>{const s=new THREE.Shape();s.absellipse(cx,cy,rx,ry,0,Math.PI*2,false);return s;};
 const connect=(a,b,c='#a995b4')=>{const x=nodes.get(a).position,y=nodes.get(b).position;curve('edge-'+a+'-'+b,[[x.x,x.y,-.03],[(x.x+y.x)/2,(x.y+y.y)/2,-.03],[y.x,y.y,-.03]],c,.007);};
 let title='Relationship diagram';
 if(v.map==='gates'){
  title='Skull exits · schematic superior view';plate(ellipse(0,.03,.82,1),'#5a4d62');
  for(const [id,text,x,y]of GATES){const mesh=new THREE.Mesh(new THREE.TorusGeometry(id==='magnum'?.14:.052,.012,10,32),material(id===v.target?color:'#8d7f9b'));mesh.position.set(x,y,.07);mesh.userData={nodeId:id,anatomyName:'cnmap:'+id,info:{name:id,base:text,group:'cranial-schematic'},anchorLocal:new THREE.Vector3(0,id==='magnum'?.14:.052,.012)};root.add(mesh);nodes.set(id,mesh);shown.push(mesh);}
  // Give the current gate one readable caption instead of eleven collisions.
  const gate=GATES.find(x=>x[0]===v.target);label(gate?.[1]||'Skull exits',0,-1.15,.04,1.45);label('ANTERIOR',0,1.18,.03,.5);label('POSTERIOR',0,-.98,.03,.5);
 }else if(v.map==='cavernous'){
  title='Cavernous sinus · coronal relationship';
  node('wall','Lateral wall',-.55,.87,.64,.16,'#514063');
  for(const [id,t,y]of [['iii','III',.57],['iv','IV',.23],['v1','V1',-.11],['v2','V2',-.45]])node(id,t,-.55,y,.32,.21,id===v.target?color:'#80718e');
  const artery=new THREE.Mesh(new THREE.TorusGeometry(.22,.07,12,36),material('#e37c90'));artery.position.set(.19,.03,.01);root.add(artery);shown.push(artery);artery.userData={anatomyName:'cnmap:ica',info:{base:'Internal carotid artery',group:'cranial-schematic'},anchorLocal:new THREE.Vector3(.22,0,.07)};nodes.set('ica',artery);
  node('vi','VI',.59,.15,.23,.19,v.target==='vi'?color:'#91c8d0');label('ICA',.19,.03,.035,.23);label('VI lies beside ICA',.35,-.39,.03,.8);label('Within sinus',.32,.86,.035,.8);node('ss','Sphenoid sinus',0,-.83,.9,.2,'#5f5866');node('pg','Pituitary',0,1.17,.55,.17,'#75667d');
 }else if(v.map==='types'){
  title='Sensory / motor / mixed · three groups';
  const groups=[['sensory','SENSORY',[1,2,8],-.72,'#70c8b8'],['motor','MOTOR',[3,4,6,11,12],0,'#bca4e1'],['mixed','MIXED',[5,7,9,10],.72,'#e0b977']];
  const names=['Olfactory','Optic','Oculomotor','Trochlear','Trigeminal','Abducens','Facial','Vestibulocochlear','Glossopharyngeal','Vagus','Accessory','Hypoglossal'];
  node('all','12 cranial nerves',0,1.27,1.3,.18,color);
  for(const [id,t,nums,x,c]of groups){node(id,t,x,.9,.66,.19,id===v.target?color:'#473a51');for(const [i,n]of nums.entries())node('cn'+n,n+' · '+names[n-1],x,.53-i*.31,.65,.23,C[n-1]);}
 }else if(v.map==='origins'){
  title='Emergence groups · XI spinal exception';
  for(const [id,t,y,c]of [['forebrain','Forebrain · I II',.82,C[0]],['midbrain','Midbrain · III IV',.37,C[2]],['pons','Pons · V / VI VII VIII at lower border',-.1,C[4]],['medulla','Medulla · IX X XII',-.57,C[8]],['cord','Upper cervical cord · spinal XI',-1.03,C[10]]])node(id,t,0,y,1.25,.32,id===v.target?color:c);
 }else if(v.map==='tongue'){
  title='Tongue · nerve territories, not taste-quality zones';
  const front=new THREE.Shape();front.moveTo(-.5,.12);front.bezierCurveTo(-.62,-.25,-.48,-.92,0,-.94);front.bezierCurveTo(.48,-.92,.62,-.25,.5,.12);front.lineTo(-.5,.12);
  const back=new THREE.Shape();back.moveTo(-.5,.12);back.bezierCurveTo(-.52,.62,-.26,.91,0,.94);back.bezierCurveTo(.26,.91,.52,.62,.5,.12);back.lineTo(-.5,.12);
  const a=plate(front,['general','taste','motor'].includes(v.target)?color:'#785364'),b=plate(back,v.target==='posterior'?color:'#6c596a');
  a.raycast=b.raycast=THREE.Mesh.prototype.raycast;
  for(const [id,m,p]of [['general',a,[0,-.35,.035]],['taste',a,[.21,-.35,.035]],['posterior',b,[0,.48,.035]],['motor',a,[-.22,-.48,.035]]]){nodes.set(id,m);m.userData={...m.userData,nodeId:id,anatomyName:'cnmap:'+id,anchorLocal:new THREE.Vector3(...p)};}
  const anchors={general:[0,-.35,.035],taste:[.21,-.35,.035],posterior:[0,.48,.035],motor:[-.22,-.48,.035]};nodes.get(v.target).userData.anchorLocal.set(...anchors[v.target]);
  label('POSTERIOR 1/3 · IX',0,.52,.03,.95,foreground(b.material.color));label('ANTERIOR 2/3',0,-.4,.03,.9,foreground(a.material.color));label(v.target==='general'?'General sensation: lingual V3':v.target==='taste'?'Taste: chorda tympani VII':v.target==='posterior'?'General sensation + taste: IX':'Tongue movement: XII',0,-1.13,.035,1.7);
 }else if(v.map==='face'||v.map==='facial'){
  title=v.map==='face'?'Trigeminal sensory territories · schematic':'Five terminal VII branches · schematic';plate(ellipse(0,0,.65,.9),'#796674');
  if(v.map==='face'){
   for(const [id,t,y,c]of [['v1','V1 · forehead / cornea',.55,C[2]],['v2','V2 · cheek / upper jaw',.05,C[4]],['v3','V3 · lower jaw / chin',-.48,C[6]]])node(id,t,0,y,1.06,.38,v.target===id?color:v.target==='all'?c:'#67586c');
   node('all','Trigeminal V · 3 territories',0,1.13,1.18,.17,color);
   label('Angle of mandible: C2-C3',0,-1.09,.028,1.45);
  }else{
   const branches=[['temporal','Temporal',[-.05,.73,.06]],['zygomatic','Zygomatic',[.4,.35,.06]],['buccal','Buccal',[.52,-.02,.06]],['mandibular','Marginal mandibular',[.3,-.57,.06]],['cervical','Cervical',[.05,-.94,.06]]];
   for(const [i,[id,t,p]]of branches.entries()){curve(id,[[-.48,.02,.065],[-.15,p[1]*.5,.065],p],C[i+2],.014);label(t,p[0]+.42,p[1],.025,.68);}
   node('all','VII',-.86,.02,.35,.19,color);
  }
  // Familiar eye/nose/mouth landmarks make the silhouette a human face.
  for(const x of [-.24,.24])curve('eye'+x,[[x-.09,.28,.08],[x,.32,.08],[x+.09,.28,.08]],'#211b2a',.009);
  curve('nose',[[0,.22,.08],[.04,-.08,.08],[-.04,-.1,.08]],'#342638',.009);curve('mouth',[[-.18,-.42,.08],[0,-.45,.08],[.18,-.42,.08]],'#342638',.012);
 }else if(v.map==='recurrent'){
  title='Recurrent laryngeal loops · patient left / right';
  curve('aorta',[[.57,-.45,0],[.34,-.03,0],[.1,-.04,0],[-.05,-.4,0]],'#df7e92',.055);
  curve('subclavian',[[-.1,.35,0],[-.45,.38,0],[-.75,.2,0]],'#df7e92',.045);
  curve('left',[[.6,.98,.07],[.58,-.36,.07],[.33,-.48,.07],[.18,-.32,.07],[.14,.89,.07]],v.target==='left'?color:'#847087',.017);
  curve('right',[[-.59,.98,.07],[-.58,.2,.07],[-.38,.13,.07],[-.19,.32,.07],[-.14,.89,.07]],v.target==='right'?color:'#847087',.017);
  label('PATIENT LEFT',.48,1.16,.026,.75);label('PATIENT RIGHT',-.48,1.16,.026,.75);label('Aortic arch',.52,-.73,.028,.8);label('Subclavian artery',-.62,-.02,.026,.9);
 }else{
  const reflex=v.map==='corneal'||v.map==='gag';
  const list=reflex?(v.map==='corneal'?[{id:'cornea',label:'Cornea stimulus'},{id:'v1',label:'V1 · AFFERENT'},{id:'stem',label:'Brainstem relay'},{id:'vii',label:'VII · EFFERENT'},{id:'muscle',label:'Orbicularis oculi · blink'}]:[{id:'pharynx',label:'Pharyngeal stimulus'},{id:'ix',label:'IX · AFFERENT'},{id:'stem',label:'Medullary relay'},{id:'x',label:'X · EFFERENT'},{id:'muscle',label:'Pharyngeal response'}]):v.nodes||[];
  title=reflex?(v.map==='corneal'?'Corneal reflex · input versus output':'Gag reflex · input versus output'):v.map==='branches'?'Named branches · connection schematic':'Named pathway · connection schematic';
  const branches=v.map==='branches',columns=branches?2:1,spacing=list.length>6?.27:.35;
  for(const [i,item]of list.entries()){
   const x=branches?(i? .48:-.55):0,y=branches?(i? .78-(i-1)*spacing:0):((list.length-1)/2-i)*spacing;
   node(item.id,item.label,x,y,branches?(i?.98:.7):1.45,.21,item.id===v.target?color:'#5d506b');
  }
  for(let i=1;i<list.length;i++)connect(branches?list[0].id:list[i-1].id,list[i].id);
 }
 // Configure can never silently fall back to a generic center or another node.
 if(!nodes.has(v.target))throw Error('Unknown cranial diagram target: '+v.map+'/'+v.target);
 root.position.set(0,1.6,0);root.scale.setScalar(.15);root.updateMatrixWorld(true);
 return {root,nodes,shown,title,bounds:new THREE.Box3().setFromObject(root)};
}
