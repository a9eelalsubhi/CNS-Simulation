import {localRect,cardEdge} from './annotation-layout.js';
import {LeaderProjector} from './leader-projection.js';
import {anatomyColor} from './lesson-palette.js?v=20261024-routes2';

const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function explanationLayout(width,height,top,railTop,cardHeight){
 const side=width>=900,cardWidth=side?Math.min(320,width*.29):Math.min(430,width-32);
 return {side,width:cardWidth,left:side?width-cardWidth-62:(width-cardWidth)/2,top:side?clamp(top+20,top,Math.max(top,railTop-cardHeight-12)):Math.max(top,railTop-cardHeight-8)};
}
export class GuidedExplanations{
 constructor({viewer,viewport,overlay,svg,onLayout}){
  Object.assign(this,{viewer,viewport,overlay,svg,onLayout});this.life=new AbortController();this.records=[];this.enabled=false;this.dirty=true;this.key='';this.signature='';this.selected=0;
  this.projector=new LeaderProjector();
  this.observer=new ResizeObserver(()=>{this.invalidate();if(this.enabled&&viewer.ready)onLayout?.();});this.observer.observe(viewport);
  window.addEventListener('scroll',()=>this.invalidate(),{passive:true,signal:this.life.signal});window.visualViewport?.addEventListener('resize',()=>this.invalidate(),{signal:this.life.signal});
  viewer.getTeachingSpace=()=>this.space();
 }
 clear(){this.pointLife?.abort();for(const r of this.records)this.observer.unobserve(r.card);this.records=[];this.overlay.replaceChildren();this.svg.replaceChildren();}
 setPoint(step,entries,{enabled=true,quiz=false}={}){
  const was=this.enabled;this.enabled=enabled&&!quiz;this.viewer.explanationActive=this.enabled;this.overlay.hidden=!this.enabled;this.svg.style.display=this.enabled?'':'none';document.body.classList.toggle('with-explanations',this.enabled);
  this.step=step;entries=Array.isArray(entries)?entries:[entries];
  const key=JSON.stringify([step.id,step.page,...entries.map(e=>[e.id,e.name,e.text,e.bullets,e.clarification,e.meshes])]);const changed=key!==this.key||was!==this.enabled;
  if(key!==this.key){
   this.clear();this.pointLife=new AbortController();this.selected=0;this.tabs=make('nav',null,'explanation-tabs');this.tabs.setAttribute('aria-label','Color-matched explanations');this.overlay.append(this.tabs);
   const ns='http://www.w3.org/2000/svg',element=(tag,attrs={})=>{const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;},defs=element('defs');this.svg.append(defs);
   entries.forEach((entry,i)=>{
    const color=entry.color||anatomyColor(entry.id),card=make('section',null,'anatomy-pin guided-explanation'+(i?' context-callout':''));card.style.setProperty('--pin-color',color);card.dataset.structure=entry.id;card.dataset.color=color;card.setAttribute('aria-label',entry.name+' - slide explanation');card.setAttribute('aria-live',i?'off':'polite');
    card.append(make('span',entry.route_context?'3D ROUTE · NAMED SOURCE ANATOMY':`SLIDE ${step.page} · ${i?'SAME-SLIDE CONTEXT':step.source_excerpt?'SLIDE TEXT':'STRUCTURE EXPLORER'}`,'callout-source'),make('strong',entry.name),make('p',entry.text));
    const anchorNote=make('span',null,'regional-context-note');anchorNote.hidden=true;card.append(anchorNote);
    if(entry.bullets.length){const ul=make('ul');for(const text of entry.bullets)ul.append(make('li',text));card.append(ul);}
    if(!i&&step.teaching_chain?.length){const chain=make('ol',null,'cn-teaching-chain');chain.setAttribute('aria-label','Schematic sequence — not a segmented 3D nerve');for(const n of step.teaching_chain){const item=make('li',n.label);if(n.color){item.style.borderColor=n.color;item.style.color=n.color;}if(n.active)item.setAttribute('aria-current','step');chain.append(item);}card.append(make('small','SCHEMATIC SEQUENCE · highlighted part of this explanation'),chain);}
    if(entry.clarification){if(this.viewer.module==='cortex'&&(entry.kind==='functional'||step.reveal_bases?.length)){card.append(make('p',entry.clarification,'regional-context-note'));}else{const details=make('details'),summary=make('summary','Anatomical reference note');details.append(summary,make('p',entry.clarification));card.append(details);}}
    this.overlay.append(card);this.observer.observe(card);
    const marker=element('marker',{id:'lecture-arrow-'+i,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto'});marker.append(element('path',{d:'M0 0 L10 5 L0 10 Z',fill:color}));defs.append(marker);
    const line=element('line',{stroke:color,'stroke-width':2.3,'marker-end':`url(#lecture-arrow-${i})`,'data-structure':entry.id}),dot=element('circle',{r:5,fill:color,stroke:'#211525','stroke-width':1.5});this.svg.append(line,dot);
    const button=make('button',`${i+1} · ${entry.name}`);button.style.setProperty('--pin-color',color);button.addEventListener('click',()=>{this.selected=i;this.invalidate();this.layout();this.viewer.frame(this.viewer.state.view);this.onLayout?.();},{signal:this.pointLife.signal});this.tabs.append(button);
    this.records.push({entry,card,line,dot,button,color,anchorNote});
   });this.key=key;
  }
  for(const [i,r]of this.records.entries()){
   r.anchor=this.viewer.plateActive?this.viewer.getDiagramAnchor?.(r.entry):this.viewer.getSurfaceAnchor?.(r.entry,i?undefined:step.anchor_at)||this.viewer.anchor(r.entry,i?undefined:step.anchor_at);
   this.anchorNote(r);
  }
  if(!this.enabled){delete this.viewport.dataset.calloutLayout;this.invalidate();return changed;}
  this.invalidate();this.layout();return changed;
 }
 invalidate(){this.dirty=true;this.signature='';this.viewer.dirty=true;}
 anchorNote(r,projection){
  const sectionNote=r.anchor?.shared||(r.anchor?.precision==='schematic-subdivision'?'Schematic subdivision of the lecture’s lemniscal ribbon':r.anchor?.precision==='schematic-location'?'Schematic pathway location · borders are approximate':r.anchor?.precision==='schematic-route'?'Schematic fiber route · compare the original section':r.anchor?.precision==='schematic-region'?'Schematic regional extent · not a discrete nucleus':'Lecture contour · simplified 3D section');
  const binding=r.entry.anchor_binding,unavailable=binding?.status==='unsegmented'&&!this.viewer.cranial?.active;
  const text=this.viewer.bodyContext?.expanded?'Whole-body context · return to lesson':unavailable?binding.label+' '+(binding.note||''):!r.anchor||projection?.state==='hidden'?'Target layer hidden · enable its anatomy layer':projection?.state==='offscreen'?'Target outside view · press Reset':r.anchor?.section?sectionNote:binding?('Arrow: '+(r.anchor?.bindingLabel||binding.label)+(binding.note?' · '+binding.note:'')+(projection?.occluded?' · behind '+projection.occluder:'')):r.anchor?.regional?`Region: ${r.anchor.region} · fine structure not separately segmented`:projection?.occluded?`Target behind ${projection.occluder} · rotate or isolate`:'';
  if(r.anchorNote.textContent!==text){r.anchorNote.textContent=text;r.anchorNote.hidden=!text;this.dirty=true;}
 }
 layout(){
  if(!this.enabled)return;
  const w=this.overlay.clientWidth,h=this.overlay.clientHeight,side=w>=900,rect=this.overlay.getBoundingClientRect(),rail=this.viewport.querySelector('.tour-rail');this.viewport.dataset.calloutLayout=side?'side':'stacked';
  const railTop=rail?.getClientRects().length?localRect(rail.getBoundingClientRect(),rect,w,h).top:h-20,hud=this.viewport.querySelector('.camera-hud'),heading=this.viewport.querySelector('.view-heading');
  if(hud&&heading){if(side)hud.style.top='';else{const r=localRect(heading.getBoundingClientRect(),rect,w,h);hud.style.top=(r.top+r.height+5)+'px';}}
  const tops=['.view-heading','.camera-hud','.stem-tools','.cranial-tools','.legend'].map(s=>this.viewport.querySelector(s)).filter(e=>e&&e.getClientRects().length).map(e=>{const r=localRect(e.getBoundingClientRect(),rect,w,h);return r.top+r.height;});
  const top=Math.max(side?100:50,...tops)+14,pre=explanationLayout(w,h,top,railTop,0),free=railTop-top-25;
  this.paged=!side||free<this.records.length*120;const visible=this.paged?[this.records[this.selected]]:this.records;this.tabs.hidden=!this.paged||this.records.length<2;
  const maximum=side?Math.max(75,Math.min(440,(free-(visible.length-1)*10)/visible.length)):Math.max(75,Math.min(190,h*.24,railTop-top-110));
  for(const r of this.records){r.card.hidden=!visible.includes(r);r.button.setAttribute('aria-pressed',String(this.records[this.selected]===r));r.card.style.width=pre.width+'px';r.card.style.maxHeight=maximum+'px';}
  if(side&&visible.length>1){
   // Short comparison cards must not steal the reading space from the
   // literal slide paragraph. Measure them first, then give the main card
   // all remaining height, while keeping the whole stack above navigation.
   for(const r of visible.slice(1))r.card.style.maxHeight=Math.min(this.viewer.cranial?160:110,maximum)+'px';
   const otherHeight=visible.slice(1).reduce((sum,r)=>sum+r.card.offsetHeight+10,0);
   visible[0].card.style.maxHeight=Math.max(80,Math.min(440,free-otherHeight))+'px';
  }
  let y=top+20;
  for(const r of visible){const box=explanationLayout(w,h,top,railTop,r.card.offsetHeight);if(side)box.top=y;box.height=r.card.offsetHeight;r.box=box;r.card.style.left=box.left+'px';r.card.style.top=box.top+'px';r.card.style.bottom='auto';r.card.tabIndex=r.card.scrollHeight>r.card.clientHeight?0:-1;y=box.top+box.height+10;}
  const first=visible[0]?.box;this.box=first;
  if(first&&!this.tabs.hidden){this.tabs.style.width=first.width+'px';this.tabs.style.left=first.left+'px';this.tabs.style.top=(first.top-31)+'px';}
  this.svg.setAttribute('viewBox',`0 0 ${w} ${h}`);this.dirty=false;
 }
 space(){if(!this.enabled)return null;this.layout();return this.box?.side?{right:this.box.left-28}:{bottom:(this.box?.top||0)-(this.tabs.hidden?8:40)};}
 update(){
  if(!this.enabled)return;const v=this.viewer;
  const signature=[...v.camera.matrixWorld.elements,...v.camera.projectionMatrix.elements,this.overlay.clientWidth,this.overlay.clientHeight,this.selected].join(',');
  if(this.dirty)this.layout();else if(signature===this.signature)return;this.signature=signature;
  const meshes=(v.sections?.active?v.sections.meshes:v.meshes).filter(m=>m.visible&&m.userData.info.group!=='sulci'),canvasRect=v.renderer.domElement.getBoundingClientRect(),overlayRect=this.overlay.getBoundingClientRect();
  for(const r of this.records){
   const anchor=r.anchor;if(r.card.hidden){r.line.style.display=r.dot.style.display='none';r.line.dataset.visibility='inactive-card';continue;}
   if(anchor?.diagram){
    const p=v.projectDiagramAnchor?.(anchor.id,this.overlay);r.line.style.display=r.dot.style.display=p?.visible?'':'none';if(!p?.visible)continue;
    const start=cardEdge(p,r.box);for(const [k,value]of Object.entries({x1:start.x,y1:start.y,x2:p.x,y2:p.y}))r.line.setAttribute(k,value.toFixed(2));r.dot.setAttribute('cx',p.x);r.dot.setAttribute('cy',p.y);continue;
   }
   const projection=this.projector.project(anchor,r.entry,v,meshes,canvasRect,overlayRect,this.overlay.clientWidth,this.overlay.clientHeight);
   this.anchorNote(r,projection);r.line.dataset.visibility=!anchor&&r.entry.anchor_binding?.status==='unsegmented'?'unsegmented':projection.state;r.line.dataset.anchorKind=anchor?.section?'section':anchor?.regional?'regional':'anatomical';r.line.dataset.sectionFeature=anchor?.sectionFeature||'';
   r.line.style.display=r.dot.style.display=projection.visible?'':'none';if(!projection.visible)continue;
   const p=projection.point,dashed=anchor.regional||projection.occluded;
   r.line.setAttribute('stroke-dasharray',dashed?'6 4':'none');r.dot.setAttribute('fill',dashed?'#211525':r.color);r.dot.setAttribute('stroke',dashed?r.color:'#211525');
   const start=cardEdge(p,r.box);for(const [k,value]of Object.entries({x1:start.x,y1:start.y,x2:p.x,y2:p.y}))r.line.setAttribute(k,value.toFixed(2));r.dot.setAttribute('cx',p.x);r.dot.setAttribute('cy',p.y);
  }
  // Projection may add an occlusion / precise-target note and grow a card.
  // ResizeObserver is asynchronous; repack in this same paint cycle instead
  // of briefly drawing the enlarged card over the next explanation.
  if(this.dirty){this.layout();for(const r of this.records){if(r.card.hidden||r.line.style.display==='none')continue;const x=Number(r.line.getAttribute('x2')),y=Number(r.line.getAttribute('y2'));if(!Number.isFinite(x)||!Number.isFinite(y))continue;const start=cardEdge({x,y},r.box);r.line.setAttribute('x1',start.x.toFixed(2));r.line.setAttribute('y1',start.y.toFixed(2));}this.signature='';v.dirty=true;}
 }
 dispose(){this.life.abort();this.observer.disconnect();this.clear();delete this.viewport.dataset.calloutLayout;document.body.classList.remove('with-explanations');this.viewer.getTeachingSpace=null;this.viewer.explanationActive=false;}
}
