import {anatomyColor} from './lesson-palette.js?v=20261021-sections1';
import {SECTIONS,sectionFeature} from './section-data.js?v=20261021-sections1';

// These are focus presets for ORIGINAL segmented anatomy, not image planes
// or newly fabricated nuclei/tract meshes. Source figures remain a separate,
// explicitly opened reference. Each preset reveals available nearby anatomy.
export const FOCUS_3D={
 anterior:{view:'anterior',ids:[]},posterior:{view:'posterior',ids:[]},location:{view:'lateral',ids:[]},
 inferior:{view:'posterior',ids:['inferior-colliculi','trochlear-nucleus','scp'],internal:true},
 superior:{view:'posterior',ids:['superior-colliculi','red-nucleus','oculomotor-nucleus'],internal:true},
 pons:{view:'posterior',ids:['abducens-nucleus','facial-nucleus','vestibular-nuclei'],internal:true},
 medulla:{view:'anterior',ids:['pyramid','olive'],internal:true},
 'medulla-anterior':{view:'anterior',ids:[]},'medulla-posterior':{view:'posterior',ids:[]}
};
export function brainstemScene(step,entries,byId,focus=step.study_focus){
 const section=SECTIONS[focus]&&sectionFeature(focus,step.structure)?focus:null;
 if(section)return {step:{...step,section_key:section,view:'anterior',internal:true,diagram:false},entries};
 step={...step,section_key:null};
 if(!focus||!FOCUS_3D[focus])return {step,entries};
 const preset=FOCUS_3D[focus],ids=new Set(entries.map(e=>e.id));
 const context=preset.ids.filter(id=>!ids.has(id)).map(id=>byId.get(id)).filter(Boolean).map(e=>({...e,color:anatomyColor(e.id)}));
 return {step:{...step,view:preset.view,internal:step.internal||!!preset.internal,diagram:false},entries:[...entries,...context]};
}
