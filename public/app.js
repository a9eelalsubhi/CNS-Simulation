import {BrainViewer,LAYERS,MAP_COLORS} from './scene.js?v=20261028-anchors3';
import {GuidedExplanations} from './guided-explanations.js?v=20261028-anchors3';
import {pointEntry,pointEntries,progressKey} from './lecture-point.js?v=20261024-routes2';
import {SurfaceAtlas} from './surface-atlas.js?v=20261028-anchors3';
import {BodyContext} from './body-context.js?v=20261024-fit1';
import {BrainstemPlates,PLATES} from './brainstem-plates.js?v=20261024-routes2';
import {brainstemScene} from './brainstem-study.js?v=20261024-routes2';
import {BrainstemSections} from './brainstem-sections.js?v=20261024-routes2';
import {sectionFeature} from './section-data.js?v=20261024-routes2';
import {CranialStudy} from './cranial-study.js?v=20261024-focus1';

const $=id=>document.getElementById(id),life=new AbortController(),signal=life.signal;
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
let viewer,data,byId,inventory,surfaceAtlas,explanations,plates,chromeObserver,index=0,inspection=null,quiz=null,raf=0,locked=false,toastTimer=0;
let chapterButtons=[],lastView='lateral';
const state={labels:true,explanations:true,pin:0};
const safeGet=key=>{try{return localStorage.getItem(key);}catch{return null;}};
const safeSet=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3000);}
function current(){return inspection||data.steps[index];}
const isStem=()=>data?.module==='brainstem';
const isCranial=()=>data?.module==='cranial';
const slidePath=page=>(data.slide_template||'/slides/lecture-{page}.jpg').replace('{page}',String(page).padStart(2,'0'))+'?v=20261024-routes2';
function setPlateMode(key,enabled){if(!plates)return;if(enabled){openFigure(PLATES[key]?.page||current().page);return;}plates.show(key,false);document.body.classList.remove('plate-active');$('plateSelect').value=plates.selected;$('show3D').setAttribute('aria-pressed','true');$('showDiagram').removeAttribute('aria-pressed');surfaceAtlas.svg.hidden=false;buildPins();fitPlate();}
function showStudyScene(step,entries,options={},focus=step.study_focus){const scene=isStem()?brainstemScene(step,entries,byId,focus):{step,entries};viewer.show(scene.step,scene.entries,options);}
function focusStudyView(key){if(!isStem()||quiz)return;plates.selected=key;$('plateSelect').value=key;const scene=brainstemScene(current(),currentEntries(),byId,key);viewer.show(scene.step,scene.entries,{hemisphere:'both'});renderPoint();buildPins();if(!viewer.sections?.active)$('sceneSubtitle').textContent='3D focus · '+PLATES[key].name+' · lecture point unchanged';}
function configurePlate(step,entries){if(!plates)return;plates.configure(step,entries);document.body.classList.toggle('plate-active',plates.enabled);$('plateSelect').value=plates.selected;$('show3D').setAttribute('aria-pressed',String(!plates.enabled));$('showDiagram').removeAttribute('aria-pressed');}
function fitPlate(){
 if(!plates)return;const host=$('viewport'),vp=host.getBoundingClientRect(),sy=vp.height/host.clientHeight,hud=document.querySelector('.camera-hud').getBoundingClientRect();
 if(host.clientWidth<900){const heading=document.querySelector('.view-heading').getBoundingClientRect(),toolbarTop=Math.max(heading.bottom,hud.height?hud.bottom:vp.top);$('stemTools').style.top=((toolbarTop-vp.top)/sy+7)+'px';$('bodyLocator').style.top=(($('stemTools').getBoundingClientRect().bottom-vp.top)/sy+10)+'px';}else{$('stemTools').style.top='';$('bodyLocator').style.top='';}
 if(!plates.enabled)return;const space=explanations?.space(),rail=$('lectureRail').getBoundingClientRect(),toolbar=$('stemTools').getBoundingClientRect();
 const top=(Math.max(toolbar.bottom,hud.bottom)-vp.top)/sy+12,left=host.clientWidth>=900?140:12,right=space?.right?host.clientWidth-space.right+8:viewer.bodyContext?.enabled?78:12,bottom=space?.bottom?host.clientHeight-space.bottom+8:(vp.bottom-rail.top)/sy+16;
 Object.assign($('brainstemPlate').style,{top:top+'px',left:left+'px',right:right+'px',bottom:Math.max(12,bottom)+'px'});plates.update();explanations?.invalidate();
}
function currentEntries(step=current()){return pointEntries(step,byId);}
function fitCranial(){
 if(!isCranial())return;const box=$('viewport').getBoundingClientRect(),heading=document.querySelector('.view-heading').getBoundingClientRect(),hud=document.querySelector('.camera-hud').getBoundingClientRect();
 const panel=$('cnFunctionPanel'),sidebar=document.querySelector('.source-preview');
 // On medium screens the human function picture belongs in the scrolling
 // sidebar, preserving the main 3D focus. Narrow phones keep the picture dialog.
 const inSidebar=box.width<1200&&innerWidth>=900;
 if(inSidebar&&panel.parentNode!==sidebar.parentNode)sidebar.before(panel);
 else if(!inSidebar&&panel.parentNode!==$('viewport'))$('viewport').append(panel);
 panel.classList.toggle('in-sidebar',inSidebar);
 $('cranialTools').style.top=(Math.max(heading.bottom,box.width<900?hud.bottom:0)-box.top+10)+'px';
 $('cnFunctionPanel').style.top=($('cranialTools').getBoundingClientRect().bottom-box.top+16)+'px';
}
function bindCranial(){
 const refresh=()=>{renderPoint();buildPins();};
 $('cnAnatomy').addEventListener('click',()=>{viewer.cranial.setMode('anatomy');refresh();},{signal});
 $('cnFocusPoint').addEventListener('click',()=>{viewer.cranial.setExtent('focus');refresh();},{signal});
 $('cnRelationship').addEventListener('click',()=>{viewer.cranial.setMode('diagram');refresh();},{signal});
 $('cnFunctionOpen').addEventListener('click',()=>{const f=functionPicture();$('cnFunctionDialogContent').replaceChildren(f);$('cnFunctionDialog').showModal();},{signal});
 function functionPicture(){const wrap=node('div');wrap.append(node('h2',$('cnFunctionTitle').textContent),$('cnFunctionPicture').firstElementChild.cloneNode(true),node('p',$('cnFunctionCaption').textContent));return wrap;}
 const memory=page=>{$('cnMemoryImage').src='/slides/cranial/memory-'+page+'.jpg';$('cnMemoryImage').alt='Supplied cranial nerve memory map · page '+page;for(const b of document.querySelectorAll('[data-memory]'))b.setAttribute('aria-pressed',String(Number(b.dataset.memory)===page));};
 $('cnMemoryOpen').addEventListener('click',()=>{memory(1);$('cnMemoryDialog').showModal();},{signal});for(const b of document.querySelectorAll('[data-memory]'))b.addEventListener('click',()=>memory(Number(b.dataset.memory)),{signal});
 const observer=new ResizeObserver(()=>{fitCranial();explanations?.invalidate();});observer.observe($('viewport'));signal.addEventListener('abort',()=>observer.disconnect(),{once:true});
}
function revealViewer(){const rect=$('viewport').getBoundingClientRect();if(rect.top<0||rect.top>innerHeight*.4)window.scrollTo({top:Math.max(0,rect.top+scrollY-document.querySelector('.topbar').getBoundingClientRect().height),behavior:'instant'});}
function validate(d,inv){
 const meshNames=new Set(inv.meshes.map(m=>m.name)),ids=new Set(),chapters=new Set(d.chapters.map(c=>c.id));
 for(const e of d.structures){if(ids.has(e.id)||!e.id||!e.name||!e.text||!e.meshes.length)throw Error('Invalid structure '+e.id);ids.add(e.id);for(const n of e.meshes)if(!meshNames.has(n))throw Error('Missing mesh '+n);}
 const steps=new Set();for(const s of d.steps){if(steps.has(s.id)||!chapters.has(s.chapter)||!ids.has(s.structure)||s.pins.some(id=>!ids.has(id)))throw Error('Invalid teaching scene '+s.id);steps.add(s.id);}
 for(const [i,s]of d.steps.entries()){const entry=d.structures.find(e=>e.id===s.structure);if(!s.text||!Array.isArray(s.bullets)||!s.targets?.length||s.targets.some(n=>!entry.meshes.includes(n))||!d.source_pages.includes(s.page)||(i&&s.page<d.steps[i-1].page)||(!s.utility&&![s.text,...s.bullets].join('\n').includes(s.source_excerpt)))throw Error('Invalid source-ordered lecture point '+s.id);for(const r of s.related||[]){const e=d.structures.find(e=>e.id===r.structure);if(!e||!r.targets.length||r.targets.some(n=>!e.meshes.includes(n)))throw Error('Invalid related callout '+s.id);}}
 for(const q of d.quiz)if(!ids.has(q.answer)||!q.choices.includes(q.answer)||new Set(q.choices).size!==4||q.choices.some(id=>!ids.has(id)))throw Error('Invalid quiz '+q.id);
 if(d.module==='cranial'){
  const bases=new Set(inv.meshes.map(m=>m.base));
  for(const s of d.steps){const b=s.anchor_binding;if(!b||!['source-surface','source-region','unsegmented'].includes(b.status)||!Array.isArray(s.focus_targets)||s.focus_targets.some(n=>!meshNames.has(n))||(b.status==='unsegmented')!==!s.focus_targets.length||(b.reference_bases||[]).some(n=>!bases.has(n))||(b.world_hint&&(!Array.isArray(b.world_hint)||b.world_hint.length!==3||b.world_hint.some(n=>!Number.isFinite(n)))))throw Error('Invalid precise anatomy binding '+s.id);}
  for(const r of Object.values(d.routes||{}))for(const k of ['nerve_meshes','origin_meshes','target_meshes','context_meshes'])if(!Array.isArray(r[k])||r[k].some(n=>!meshNames.has(n)))throw Error('Invalid original nerve route '+r.id);
 }
}

function renderChapters(){
 $('chapters').replaceChildren();chapterButtons=[];
 for(const [i,c]of data.chapters.entries()){
  const wrap=node('section',null,'chapter'),button=node('button');button.append(node('span',String(i+1).padStart(2,'0'),'chapter-num'),node('span',c.name));button.dataset.chapter=c.id;
  const sub=node('div',null,'chapter-steps');sub.hidden=true;
  const entries=data.steps.map((s,i)=>({s,i})).filter(o=>o.s.chapter===c.id);
  button.addEventListener('click',()=>{if(quiz)exitQuiz();selectStep(entries[0].i);revealViewer();},{signal});
  for(const {s,i:stepIndex}of entries){const b=node('button',s.title);b.dataset.step=stepIndex;b.addEventListener('click',()=>{if(quiz)exitQuiz();selectStep(stepIndex);revealViewer();},{signal});sub.append(b);}
  wrap.append(button,sub);$('chapters').append(wrap);chapterButtons.push({chapter:c.id,button,sub});
 }
}
function updateChapterState(){
 for(const item of chapterButtons){const active=item.chapter===current().chapter;item.button.classList.toggle('active',active);item.button.setAttribute('aria-current',active?'step':'false');item.sub.hidden=!active;for(const b of item.sub.children)b.classList.toggle('active',!inspection&&Number(b.dataset.step)===index);}
}
function populateLayers(){
 for(const [key,title]of data.layers||LAYERS){
  const section=node('div',null,'layer'),row=node('label',null,'switch-row'),toggle=node('input');toggle.type='checkbox';toggle.checked=true;toggle.role='switch';toggle.id='layer-'+key;toggle.setAttribute('aria-label',title);row.append(node('span',title),toggle);
  const range=node('input'),opacity=node('label',null,'opacity-label'),output=node('output','100%');range.id='opacity-'+key;range.type='range';range.min=0;range.max=100;range.step=1;range.value=100;range.setAttribute('aria-label',title+' opacity');opacity.htmlFor=range.id;opacity.append(node('span','Opacity'),output);
  toggle.addEventListener('change',()=>{viewer.setLayer(key,toggle.checked);buildPins();},{signal});range.addEventListener('input',()=>{output.value=range.value+'%';viewer.setLayer(key,undefined,Number(range.value)/100);buildPins();},{signal});section.append(row,opacity,range);$('layers').append(section);
 }
}
function showLegend(){
 if(isCranial()){$('legend').replaceChildren();return;}
 if(state.explanations&&!quiz){$('legend').replaceChildren();for(const entry of isStem()?viewer.entries:currentEntries()){const button=node('button'),chip=node('i',null,'color-chip');chip.style.background=entry.color;button.append(chip,node('span',entry.name));button.addEventListener('click',()=>selectStructure(entry.id),{signal});$('legend').append(button);}return;}
 const colors=viewer.state.presentation==='map'?{...inventory.colors,...MAP_COLORS}:inventory.colors,labels={frontal:'Frontal',parietal:'Parietal',temporal:'Temporal',occipital:'Occipital',insula:'Insula'};
 if(viewer.state.view==='medial'){labels.limbic='Cingulate';labels.paracentral='Paracentral';}
 $('legend').replaceChildren();
 for(const [id,name]of Object.entries(labels)){const button=node('button'),chip=node('i',null,'color-chip');chip.style.background=colors[id];button.append(chip,node('span',name));button.addEventListener('click',()=>selectStructure(id==='limbic'?'cingulate':id),{signal});$('legend').append(button);}
}
function updateOrientation(){
 $('hemisphere').value=viewer.state.hemisphere;
 const hemi=viewer.state.hemisphere==='both'?(isStem()||isCranial()?'BOTH SIDES':'BOTH HEMISPHERES'):viewer.state.hemisphere.toUpperCase()+(isStem()||isCranial()?' SIDE':' HEMISPHERE');
 $('orientationBadge').textContent=viewer.cranial?.active?'SCHEMATIC 3D · RELATIONSHIPS / NOT TO SCALE':viewer.sections?.active?'SCHEMATIC SECTION · DORSAL ↑ / VENTRAL ↓':hemi+' · '+viewer.state.view.toUpperCase()+' VIEW';
 for(const button of document.querySelectorAll('[data-view]'))button.classList.toggle('active',button.dataset.view===viewer.state.view);
 lastView=viewer.state.view;showLegend();surfaceAtlas?.invalidate();
}
function selectStep(next){
 if(!viewer.ready||quiz)return;inspection=null;index=Math.max(0,Math.min(data.steps.length-1,next));state.pin=0;
 const step=current(),entry=pointEntry(step,byId),side=(isCranial()?step.hemisphere:entry.side)||entry.side||step.hemisphere||(step.view==='medial'?'left':viewer.state.hemisphere);
 showStudyScene(step,currentEntries(step),{hemisphere:side});configurePlate(step,currentEntries(step));renderPoint();buildPins();safeSet(progressKey(data),step.id);
}
function selectStructure(id,focus){
 if(quiz)return;
 const entry=byId.get(id);if(!entry)return;
 const sectionKey=focus||(viewer.sections?.active&&sectionFeature(viewer.sections.key,id)?viewer.sections.key:entry.section_key);
 inspection={id:'inspect-'+id,chapter:'explore',structure:id,title:entry.name,pins:[id],page:entry.page,view:entry.view,mode:entry.mode,plate:sectionKey||entry.plate,diagram:false,section_key:sectionKey,study_focus:sectionKey||(entry.diagram_only?entry.plate:undefined),internal:entry.meshes.some(n=>['stem-internal','stem-csf'].includes(viewer.byName.get(n)?.userData.info.group))};state.pin=0;
 showStudyScene(inspection,[entry],{hemisphere:entry.side||(entry.view==='medial'?'left':viewer.state.hemisphere)});configurePlate(inspection,pointEntries(inspection,byId));renderPoint();buildPins();revealViewer();
}
function renderPoint(){
 $('lessonNotes').hidden=true;$('toggleNotes').setAttribute('aria-expanded','false');$('toggleNotes').textContent='Lecture notes +';
 const step=current(),entry=pointEntry(step,byId),chapter=data.chapters.find(c=>c.id===step.chapter);
 $('sceneTitle').textContent=step.mode==='overview'&&index===0?step.title:entry.name;
 $('chapterLabel').textContent='CNS / '+(chapter?.name||'STRUCTURE EXPLORER').toUpperCase();
 const sectional=!!viewer.sections?.active,sectionKey=step.section_key||step.study_focus||entry.section_key||entry.plate;
 document.body.classList.toggle('section-active',sectional);$('viewport').dataset.section=sectional?viewer.sections.key:'';
 $('sectionFace').hidden=!isStem()||!sectionFeature(sectionKey,step.structure);$('sectionFace').setAttribute('aria-pressed',String(sectional));$('sectionTilt').hidden=!sectional;
 $('show3D').textContent=sectional?'Whole brainstem 3D':'3D anatomy';$('show3D').setAttribute('aria-pressed',String(!sectional));
 $('sceneSubtitle').textContent=sectional?viewer.sections.current.spec.name+' · schematic 3D cut · dorsal ↑ / ventral ↓':step.utility?'Every lecture structure · select to isolate':isStem()?'Interactive 3D anatomy · rotate, reveal and isolate':entry.kind==='functional'?'Cortical function · regional anatomical locator':viewer.state.presentation==='map'?'Names on the cortex · source sulci traced in 3D':'Surface names · original shaded anatomy';
 if(isCranial()){$('sceneSubtitle').textContent=viewer.cranial.active?viewer.cranial.current.title:viewer.cranial.route?.direction||'Original 3D nerve routes · central connection and target tissues';$('accuracyBadge').hidden=false;$('accuracyBadge').textContent=viewer.cranial.active?'Relationship diagram':'Source geometry';fitCranial();}
 $('sourceBadge').textContent=`Slide ${step.page} / ${data.source_pages.length} · item ${step.slide_item||1} / ${step.slide_items||1}`;
 $('accuracyBadge').hidden=entry.kind==='anatomical'&&!entry.clarification;
 $('accuracyBadge').textContent=sectional?'3D section · schematic':entry.kind==='functional'?'Regional locator':entry.kind==='relation'?'Lecture diagram · regional locator':'Reference note';
 if(isCranial()){$('accuracyBadge').hidden=false;$('accuracyBadge').textContent=viewer.cranial.active?'Relationship diagram':'Source geometry';}
 $('tourFlow').textContent=inspection?'Exploring · Continue lecture returns to your saved point.':`Slide text in order · ${step.page} / ${data.source_pages.length} · ${step.slide_item} / ${step.slide_items}`;
 $('pointTitle').textContent=step.title;$('pointText').textContent=entry.text;
 $('pointBullets').replaceChildren(...entry.bullets.map(text=>node('li',text)));
 $('clarification').hidden=!entry.clarification;$('clarification').open=false;$('clarification').querySelector('p').textContent=entry.clarification||'';
 $('stepCount').textContent=inspection?'Structure inspection':`${index+1} / ${data.steps.length}`;$('tourProgress').max=data.steps.length;$('tourProgress').value=index+1;$('previous').disabled=!inspection&&index===0;
 $('next').textContent=inspection?'Continue lecture →':index===data.steps.length-1?'Restart tour ↺':'Next →';
 $('explorerDirectory').hidden=step.mode!=='explorer'&&!step.utility;
 $('isolate').setAttribute('aria-pressed',String(viewer.state.isolate));$('isolate').textContent=viewer.state.isolate?'Show surrounding anatomy':'Isolate selected structure';
 $('traceControl').hidden=!entry.trace;$('tracePlay').textContent='▶ Trace connection';$('tracePlay').setAttribute('aria-pressed','false');
 updateChapterState();updateOrientation();
 // Measure the FINAL teaching rail, not the previous point's text. Otherwise
 // a longer explanation can grow over an already-framed hemisphere.
 fitPlate();
}
function buildPins(){
 if(!surfaceAtlas||!explanations)return;
 const pinEntries=isCranial()&&(viewer.cranial.active||viewer.cranial.extent==='focus'&&currentEntries()[0].meshes.length)?currentEntries().slice(0,1):currentEntries();
 const changed=explanations.setPoint(current(),pinEntries,{enabled:state.explanations,quiz:!!quiz});
 surfaceAtlas.configure(current(),currentEntries(),{labels:state.labels&&!isCranial(),quiz:!!quiz});
 if(isCranial()){fitCranial();explanations.invalidate();explanations.layout();}
 $('pinNavigation').hidden=true;
 if(changed||quiz){viewer.frame(viewer.state.view,isCranial()||!viewer.focus);explanations.setPoint(current(),pinEntries,{enabled:state.explanations,quiz:!!quiz});}
 viewer.tick(performance.now());explanations.update();surfaceAtlas.update(true);
 if(plates?.enabled){surfaceAtlas.svg.hidden=true;fitPlate();}
}
function next(){if(quiz)return;if(inspection){inspection=null;selectStep(index);return;}selectStep(index===data.steps.length-1?0:index+1);}
function previous(){if(quiz)return;if(inspection){inspection=null;selectStep(index);return;}selectStep(index-1);}
function openFigure(page=current().page){$('figurePage').value=String(page);updateFigure();if(!$('figuresDialog').open)$('figuresDialog').showModal();}
function updateFigure(){const p=Number($('figurePage').value);$('lectureImage').src=slidePath(p);$('lectureImage').alt=`Original ${data.title}, slide ${p}`;$('figureCaption').textContent=`Dr Ibrahim Amr · Slide ${p} / ${data.source_pages.length}`+(isStem()?` · printed page ${p+11}`:isCranial()?` · printed page ${p<=15?p+20:p+22}`:'');}
// The new reference PDFs have a different page order from the guided tour.
// Keep their cursor independent instead of claiming a false page match.
let referencePage=1;
function updateReference(){const total={1:52,2:38,3:61}[data.id];referencePage=Math.max(1,Math.min(total,referencePage));const path=`/slides/references/${data.id}/page-${String(referencePage).padStart(3,'0')}.jpg`;$('currentSlideLabel').textContent='Reference slides · Lecture '+data.id;$('referenceCount').textContent=`${referencePage} / ${total}`;$('currentSlidePreview').src=path;$('currentSlidePreview').alt=`Reference slide ${referencePage} of ${total}`;$('referenceImage').src=path;$('referenceImage').alt=$('currentSlidePreview').alt;$('referencePage').value=String(referencePage);for(const id of ['referencePrevious','referenceDialogPrevious'])$(id).disabled=referencePage===1;for(const id of ['referenceNext','referenceDialogNext'])$(id).disabled=referencePage===total;}
function searchResults(){
 const query=$('search').value.trim().toLocaleLowerCase(),list=$('searchResults');list.replaceChildren();
 if(!query){list.hidden=true;$('search').setAttribute('aria-expanded','false');return;}
 const matches=isCranial()?data.steps.map((s,i)=>({...s,pointIndex:i})).filter(s=>[s.title,s.text,...s.bullets,...(byId.get(s.structure)?.aliases||[])].join(' ').toLocaleLowerCase().includes(query)).slice(0,9):data.structures.filter(s=>[s.name,s.text,...s.aliases].join(' ').toLocaleLowerCase().includes(query)).slice(0,9);
 if(!matches.length)list.append(node('li','No matching lecture structures.'));
 for(const entry of matches){const title=entry.pointIndex===undefined?entry.name:entry.title+' · Slide '+entry.page,li=node('li'),b=node('button',title);li.role='option';b.addEventListener('click',()=>{if(quiz)exitQuiz();if(entry.pointIndex===undefined)selectStructure(entry.id);else selectStep(entry.pointIndex);list.hidden=true;$('search').setAttribute('aria-expanded','false');$('search').value=entry.title||entry.name;},{signal});li.append(b);list.append(li);}
 $('searchStatus').textContent=`${matches.length} matching structures`;list.hidden=false;$('search').setAttribute('aria-expanded','true');
}
function populateDialogs(){
 for(const page of data.source_pages){const option=node('option',`Slide ${page}`);option.value=page;$('figurePage').append(option);}
 for(let page=1;page<={1:52,2:38,3:61}[data.id];page++){const option=node('option',`Page ${page}`);option.value=page;$('referencePage').append(option);}updateReference();
 for(const ref of data.references){const item=node('div',null,'reference-item'),title=ref.url?node('a',ref.name):node('strong',ref.name);if(ref.url){title.href=ref.url;title.target='_blank';title.rel='noreferrer';}item.append(title,node('p',ref.role));$('referenceList').append(item);}
 const grid=node('div',null,'directory-grid');for(const s of data.structures){const b=node('button',s.name);b.addEventListener('click',()=>selectStructure(s.id),{signal});grid.append(b);}$('explorerDirectory').append(grid);
}
function shuffle(values){const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
function enterQuiz(){
 if(!viewer.ready)return;
 document.body.classList.remove('section-active');$('viewport').dataset.section='';
 quiz={questions:shuffle(data.quiz),position:0,score:0,answered:false,saved:{index,inspection,hemisphere:viewer.state.hemisphere,view:viewer.state.view,isolate:viewer.state.isolate,plate:plates?{key:plates.selected,enabled:plates.enabled}:null},pick:false};
 document.body.classList.add('quiz-active');$('quizPanel').hidden=false;$('quizToggle').textContent='Exit Quiz Mode';$('quizToggle').setAttribute('aria-pressed','true');question();
 if(plates)setPlateMode(plates.selected,false);viewer.bodyContext?.update();
}
function question(){
 const q=quiz.questions[quiz.position],entry=byId.get(q.answer);quiz.answered=false;
 const pickIds=new Set(['central','precentral','postcentral','angular','supramarginal']);quiz.pick=(pickIds.has(q.answer)||!!q.pick_prompt)&&quiz.position%2===1;
 const step={structure:q.answer,pins:[],view:entry.view,mode:quiz.pick?'overview':entry.mode};
 viewer.show(step,[entry],{hemisphere:entry.side||(entry.view==='medial'?'left':'left'),quiz:true,identify:!quiz.pick});
 $('quizCounter').textContent=`ACTIVE RECALL · ${quiz.position+1} / ${quiz.questions.length} · ${quiz.score} correct`;
 $('quizPrompt').textContent=quiz.pick?(q.pick_prompt||q.prompt):q.prompt;$('quizInstruction').textContent=quiz.pick?'Tap the correct structure directly on the 3D model.':'The relevant structure is highlighted in amber. Choose one answer.';
 $('quizOptions').replaceChildren();$('quizFeedback').textContent='';$('nextQuestion').hidden=true;
 if(!quiz.pick)for(const id of shuffle(q.choices)){const b=node('button',byId.get(id).name);b.addEventListener('click',()=>answer(id,b),{signal});$('quizOptions').append(b);}
 state.pin=0;buildPins();updateOrientation();
}
function answer(id,button,clickedName){
 if(!quiz||quiz.answered)return;quiz.answered=true;
 const q=quiz.questions[quiz.position],correct=id===q.answer;if(correct)quiz.score++;
 $('quizCounter').textContent=`ACTIVE RECALL · ${quiz.position+1} / ${quiz.questions.length} · ${quiz.score} correct`;
 const entry=byId.get(correct?q.answer:id)||byId.get(q.answer);viewer.pulse(clickedName?[clickedName]:entry.meshes,correct?'#38df8b':'#ff365c');
 if(button)button.classList.add(correct?'correct':'incorrect');for(const b of $('quizOptions').children)b.disabled=true;
 $('quizFeedback').textContent=(correct?'Correct. ':'Not quite. '+byId.get(q.answer).name+'. ')+q.explanation;
 $('nextQuestion').hidden=false;$('nextQuestion').textContent=quiz.position===quiz.questions.length-1?'Finish review →':'Next question →';
}
function exitQuiz(){
 if(!quiz)return;const saved=quiz.saved;quiz=null;viewer.quiz=false;viewer.identify=false;viewer.pulseState=null;document.body.classList.remove('quiz-active');$('quizPanel').hidden=true;$('quizToggle').textContent='Enter Quiz Mode';$('quizToggle').setAttribute('aria-pressed','false');
 index=saved.index;inspection=saved.inspection;showStudyScene(current(),currentEntries(),{hemisphere:saved.hemisphere},saved.plate?.key);configurePlate(current(),currentEntries());if(saved.plate?.key){plates.selected=saved.plate.key;$('plateSelect').value=saved.plate.key;}viewer.state.isolate=saved.isolate;viewer.apply();viewer.frame(saved.view);renderPoint();buildPins();
}
function pick(name){
 if(name.startsWith('cnmap:'))return;
 if(name.startsWith('section:')){const [,key,id]=name.split(':'),f=sectionFeature(key,id),target=[id,...f?.aliases||[]].find(id=>byId.has(id));if(target)selectStructure(target,key);return;}
 if(quiz){if(!quiz.pick||quiz.answered)return;const correct=byId.get(quiz.questions[quiz.position].answer).meshes.includes(name);answer(correct?quiz.questions[quiz.position].answer:'__wrong',null,name);return;}
 const matches=data.structures.filter(e=>e.meshes.includes(name));
 matches.sort((a,b)=>(a.meshes.length-b.meshes.length)||(a.kind==='anatomical'?-1:1));if(matches[0])selectStructure(matches[0].id);
}
function lock(value){locked=value;viewer.lock(value);$('orbitLock').setAttribute('aria-pressed',String(value));$('orbitLock').textContent=value?'🔒 Scroll page · unlock 3D':'↻ Rotate 3D · lock to scroll';}

function bind(){
 $('bodyContextToggle').addEventListener('change',()=>{viewer.bodyContext.enabled=$('bodyContextToggle').checked;if(!viewer.bodyContext.enabled)viewer.bodyContext.expanded=false;viewer.bodyContext.update();viewer.frame();buildPins();},{signal});
 $('bodyOpacity').addEventListener('input',()=>{viewer.bodyContext.opacity=Number($('bodyOpacity').value)/100;viewer.bodyContext.update();viewer.dirty=true;$('bodyOpacityValue').value=$('bodyOpacity').value+'%';},{signal});
 $('wholeBody').addEventListener('click',()=>{const body=viewer.bodyContext,expanding=!body.expanded;if(expanding&&plates?.enabled){body.returnPlate=plates.selected;setPlateMode(plates.selected,false);}body.toggleExpanded();if(!expanding&&body.returnPlate){setPlateMode(body.returnPlate,true);body.returnPlate=null;}explanations.invalidate();surfaceAtlas.invalidate();},{signal});
 $('show3D').addEventListener('click',()=>{if(quiz)return;focusStudyView('anterior');},{signal});$('showDiagram').addEventListener('click',()=>setPlateMode(plates?.selected,true),{signal});
 $('sectionFace').addEventListener('click',()=>{if(quiz)return;const step=current(),entry=byId.get(step.structure);focusStudyView(step.section_key||step.study_focus||entry.section_key||entry.plate);viewer.frame('anterior');},{signal});
 $('sectionTilt').addEventListener('click',()=>{if(!quiz){viewer.frame('lateral');updateOrientation();buildPins();}},{signal});
 $('plateSelect').addEventListener('change',()=>focusStudyView($('plateSelect').value),{signal});
 $('compareLevels').addEventListener('click',()=>focusStudyView(plates.selected==='inferior'?'superior':'inferior'),{signal});
 $('openSlidePreview').addEventListener('click',()=>{updateReference();$('referenceDialog').showModal();},{signal});
 for(const id of ['referencePrevious','referenceDialogPrevious'])$(id).addEventListener('click',()=>{referencePage--;updateReference();},{signal});
 for(const id of ['referenceNext','referenceDialogNext'])$(id).addEventListener('click',()=>{referencePage++;updateReference();},{signal});
 $('referencePage').addEventListener('change',()=>{referencePage=Number($('referencePage').value);updateReference();},{signal});
 $('labelScope').addEventListener('change',()=>{surfaceAtlas.nameScope=$('labelScope').value;surfaceAtlas.invalidate();surfaceAtlas.update(true);},{signal});
 $('explanations').addEventListener('change',()=>{state.explanations=$('explanations').checked;buildPins();},{signal});
 $('toggleNotes').addEventListener('click',()=>{const open=$('lessonNotes').hidden;$('lessonNotes').hidden=!open;$('toggleNotes').setAttribute('aria-expanded',String(open));$('toggleNotes').textContent=open?'Lecture notes −':'Lecture notes +';viewer.frame(viewer.state.view);buildPins();},{signal});
 $('mapNames').addEventListener('change',()=>{surfaceAtlas.nameMode=$('mapNames').value;surfaceAtlas.update(true);},{signal});
 $('next').addEventListener('click',next,{signal});$('previous').addEventListener('click',previous,{signal});$('restart').addEventListener('click',()=>{if(quiz)exitQuiz();selectStep(0);},{signal});
 
 $('presentation').addEventListener('change',()=>{viewer.state.presentation=$('presentation').value;viewer.apply();viewer.frame();document.body.classList.toggle('shaded-mode',viewer.state.presentation==='shaded');renderPoint();buildPins();},{signal});
 $('hemisphere').addEventListener('change',()=>{viewer.state.hemisphere=$('hemisphere').value;viewer.apply();viewer.frame(viewer.state.hemisphere==='both'&&lastView==='medial'?'lateral':lastView);updateOrientation();buildPins();},{signal});
 $('palette').addEventListener('change',()=>{viewer.state.palette=$('palette').value;viewer.apply();surfaceAtlas.sync();surfaceAtlas.update(true);safeSet('cns-palette',viewer.state.palette);},{signal});
 $('borders').addEventListener('change',()=>{viewer.state.borders=$('borders').checked;viewer.apply();surfaceAtlas.sync();surfaceAtlas.update(true);},{signal});
 $('labels').addEventListener('change',()=>{state.labels=$('labels').checked;buildPins();},{signal});
 $('isolate').addEventListener('click',()=>{if(quiz)return;viewer.state.isolate=!viewer.state.isolate;viewer.apply();viewer.frame();renderPoint();buildPins();},{signal});
 $('resetView').addEventListener('click',()=>{viewer.frame(current().view);updateOrientation();buildPins();},{signal});
 for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>{if(plates?.enabled)setPlateMode(['posterior','medial'].includes(b.dataset.view)?'posterior':'anterior',false);viewer.frame(b.dataset.view);updateOrientation();buildPins();},{signal});
 $('zoomIn').addEventListener('click',()=>viewer.zoom(.8),{signal});$('zoomOut').addEventListener('click',()=>viewer.zoom(1.25),{signal});
 $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('viewport').requestFullscreen();}catch{toast('Full screen is unavailable in this browser.');}},{signal});
 $('orbitLock').addEventListener('click',()=>lock(!locked),{signal});$('dismissHint').addEventListener('click',()=>$('gestureHint').classList.add('faded'),{signal});
 viewer.renderer.domElement.addEventListener('pointerdown',()=>$('gestureHint').classList.add('faded'),{signal,once:true});setTimeout(()=>$('gestureHint').classList.add('faded'),3000);
 $('figures').addEventListener('click',()=>openFigure(),{signal});$('openCurrentFigure').addEventListener('click',()=>openFigure(),{signal});$('figurePage').addEventListener('change',updateFigure,{signal});
 $('sources').addEventListener('click',()=>$('sourcesDialog').showModal(),{signal});for(const b of document.querySelectorAll('[data-close]'))b.addEventListener('click',()=>b.closest('dialog').close(),{signal});
 $('search').addEventListener('input',searchResults,{signal});$('search').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){$('searchResults').querySelector('button')?.focus();e.preventDefault();}if(e.key==='Escape'){$('searchResults').hidden=true;$('search').setAttribute('aria-expanded','false');}},{signal});
 document.addEventListener('click',e=>{if(!e.target.closest('.search-wrap')){$('searchResults').hidden=true;$('search').setAttribute('aria-expanded','false');}},{signal});
 $('tracePlay').addEventListener('click',()=>{const active=viewer.toggleTrace(byId.get(current().structure).trace);$('tracePlay').setAttribute('aria-pressed',String(active));$('tracePlay').textContent=active?'❚❚ Stop connection guide':'▶ Trace connection';buildPins();},{signal});
 $('quizToggle').addEventListener('click',()=>quiz?exitQuiz():enterQuiz(),{signal});$('exitQuiz').addEventListener('click',exitQuiz,{signal});
 $('nextQuestion').addEventListener('click',()=>{if(!quiz?.answered)return;if(quiz.position===quiz.questions.length-1){const score=quiz.score,total=quiz.questions.length;exitQuiz();toast(`Review complete · ${score} / ${total} correct`);}else{quiz.position++;question();}},{signal});
 document.addEventListener('keydown',e=>{if(e.target.closest('input,select,button,dialog')||quiz)return;if(e.key==='ArrowRight')next();else if(e.key==='ArrowLeft')previous();},{signal});
 $('lectureSelect').addEventListener('change',()=>{location.search='?lecture='+encodeURIComponent($('lectureSelect').value);},{signal});
}
function animate(now){if(signal.aborted)return;const changed=viewer.tick(now);if(changed){explanations.update();surfaceAtlas.update();}raf=requestAnimationFrame(animate);}
function dispose(){if(signal.aborted)return;cancelAnimationFrame(raf);clearTimeout(toastTimer);life.abort();chromeObserver?.disconnect();plates?.dispose();explanations?.dispose();surfaceAtlas?.dispose();viewer?.dispose();}
window.addEventListener('pagehide',dispose,{once:true});
// A cached history document contains a disposed WebGL context after pagehide.
// Recreate it from the lecture's saved point instead of restoring a blank view.
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
async function initialize(){
 const header=document.querySelector('.topbar'),measureChrome=()=>document.documentElement.style.setProperty('--atlas-header-height',header.getBoundingClientRect().height+'px');
 measureChrome();chromeObserver=new ResizeObserver(measureChrome);chromeObserver.observe(header);
 const fetchJSON=path=>fetch(path,{signal,cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Lecture source unavailable');return r.json();});
 const registry=await fetchJSON('/data/lectures.json');
 const requested=new URLSearchParams(location.search).get('lecture'),selected=registry.find(l=>l.id===requested)||registry[0];
 if(!selected||!selected.path.startsWith('/data/'))throw Error('Invalid lecture registry');
 const [d,inv,guides]=await Promise.all([selected.path,selected.inventory,'/data/sulcal-map.json'].map(fetchJSON));
 validate(d,inv);data=d;inventory=inv;byId=new Map(d.structures.map(s=>[s.id,s]));
 if(isCranial())inventory.layers=data.layers;
 if(requested!==selected.id)history.replaceState(null,'','?lecture='+encodeURIComponent(selected.id));
 $('lectureSelect').replaceChildren(...registry.map(l=>{const option=node('option',l.title);option.value=l.id;return option;}));$('lectureSelect').value=selected.id;
 document.querySelector('.sidebar h1').textContent='Lecture '+data.id;document.title='CNS · '+selected.title+' | Aseel & MED45';
 document.body.classList.toggle('brainstem-lecture',isStem());$('stemTools').hidden=!isStem();document.querySelector('.sidebar-intro').textContent=isStem()?'Brainstem · surface to section\nMidbrain · pons · medulla':'Cerebral hemispheres · surfaces, function & connections';
 document.body.classList.toggle('cranial-lecture',isCranial());if(isCranial()){document.querySelector('.sidebar-intro').textContent='Cranial nerves · I–XII\nCourse · target · function · lesion';$('search').placeholder='Nerve, branch, muscle or skull exit…';}
 if(isStem()||isCranial()){$('hemisphere').parentElement.firstChild.textContent='Side';for(const option of $('hemisphere').options)option.textContent=option.value==='both'?'Both sides':option.value==='left'?'Left side':'Right side';}
 $('search').placeholder=isCranial()?'Nerve, branch, muscle or skull exit…':isStem()?'Nerve, nucleus, landmark or tract…':'Gyrus, sulcus, function or BA…';
 $('sourceDescription').textContent=`The study tour follows the supplied ${data.title} lecture by Dr Ibrahim Amr, in slide order. External references check anatomical locations and explain source limitations without adding another syllabus.`;
 viewer=new BrainViewer($('canvasHost'),inventory,pick,event=>{surfaceAtlas?.invalidate();explanations?.invalidate();if(event==='contextlost'){dispose();$('loading').hidden=false;$('loading').replaceChildren(node('strong','The 3D viewer needs to reload'));const b=node('button','Reload atlas');b.onclick=()=>location.reload();$('loading').append(b);}});
 viewer.module=data.module||'cortex';if(isStem()||isCranial()){viewer.state.hemisphere='both';viewer.state.presentation='shaded';$('presentation').value='shaded';document.body.classList.add('shaded-mode');}
 await viewer.load(data.model);signal.throwIfAborted();
 if(isCranial())viewer.cranial=new CranialStudy(viewer,data.routes);
 if(isStem())viewer.sections=new BrainstemSections(viewer,byId);
 viewer.bodyContext=new BodyContext(viewer,$('bodyLocator'),$('wholeBody'));$('bodyOpacity').value=String(viewer.bodyContext.opacity*100);$('bodyOpacityValue').value=$('bodyOpacity').value+'%';await viewer.bodyContext.load('/models/body-context.glb');signal.throwIfAborted();
 explanations=new GuidedExplanations({viewer,viewport:$('viewport'),overlay:$('annotations'),svg:$('pinLines'),onLayout:()=>{if(viewer.ready&&viewer.step&&(isStem()||isCranial()))viewer.frame(viewer.state.view,isCranial());surfaceAtlas?.invalidate();fitPlate();}});
 surfaceAtlas=new SurfaceAtlas(viewer,$('surfaceMap'),isStem()||isCranial()?{guides:[]}:guides,data,selectStructure);
 if(isStem()){plates=new BrainstemPlates(viewer,$('brainstemPlate'),openFigure);for(const [key,p]of Object.entries(PLATES)){const option=node('option',p.name);option.value=key;$('plateSelect').append(option);}}
 const palette=safeGet('cns-palette');if(['lobes','gyri'].includes(palette)){viewer.state.palette=palette;$('palette').value=palette;}
 renderChapters();populateLayers();populateDialogs();bind();if(isCranial())bindCranial();lock(matchMedia('(pointer:coarse)').matches);$('loading').hidden=true;
 const savedId=safeGet(progressKey(data)),saved=data.steps.findIndex(s=>s.id===savedId);selectStep(saved>=0?saved:0);raf=requestAnimationFrame(animate);
 if(navigator.modelContext?.registerTool){try{navigator.modelContext.registerTool({name:'show_cns_lecture_point',description:'Show a visual CNS lecture point with its anatomical source references.',inputSchema:{type:'object',properties:{point:{type:'integer',minimum:1,maximum:data.steps.length}},required:['point'],additionalProperties:false},async execute({point}){if(!Number.isInteger(point)||point<1||point>data.steps.length)throw Error('Invalid lecture point');if(quiz)exitQuiz();selectStep(point-1);return {point,title:current().title};}},{signal});}catch{}}
}
initialize().catch(error=>{if(signal.aborted||error.name==='AbortError')return;console.error(error);explanations?.dispose();surfaceAtlas?.dispose();viewer?.dispose();$('loading').hidden=false;$('loading').replaceChildren(node('strong','The atlas could not load'),node('span','Reload the page to retry the anatomy model.'));const b=node('button','Try again');b.onclick=()=>location.reload();$('loading').append(b);});
