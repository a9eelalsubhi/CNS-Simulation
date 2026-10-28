// Point-specific wording/targets are separate from the reusable anatomy
// directory. Next follows source order; inspection never rewrites that cursor.
import {anatomyColor} from './lesson-palette.js?v=20261024-routes2';
export function pointEntry(step,byId){
 const source=byId.get(step.structure);if(!source)throw Error('Unknown lecture structure '+step.structure);
 return {...source,page:step.page,name:step.name||source.name,text:step.text??source.text,bullets:step.bullets??source.bullets,meshes:step.focus_targets??step.targets??source.meshes,anchor_binding:step.anchor_binding,kind:step.kind||source.kind,anchor_label:step.anchor_label||source.anchor_label,clarification:step.clarification??source.clarification,color:step.color||source.color||anatomyColor(source.id),source_excerpt:step.source_excerpt};
}
export function pointEntries(step,byId){return [pointEntry(step,byId),...(step.related||[]).map(r=>{const s=byId.get(r.structure);if(!s)throw Error('Unknown related structure '+r.structure);return {...s,...r,id:r.structure,meshes:r.targets||s.meshes,color:r.color||anatomyColor(r.structure),clarification:null};}),...[...new Set(step.pins||[])].filter(id=>id!==step.structure).map(id=>({...byId.get(id),color:anatomyColor(id)}))];}
export function progressKey(lecture){return `cns-lecture${lecture.id}-${lecture.tour_revision||'source-order-1'}-point-id`;}
