"""Prepare a CNS-only export of the same licensed atlas used by the limb site.

No vertex positions, topology or node transforms are changed. The original
compressed primitives are repacked; anatomical regions use source parcels,
not distance-based painting or fabricated brain geometry.
"""
from pathlib import Path
import copy, json, struct, shutil

ROOT=Path(__file__).resolve().parent
WORK=ROOT.parent
DIST=ROOT/'public'
DIST.mkdir(exist_ok=True)
for folder in ['vendor','branding']:
    shutil.copytree(WORK/'anatomy-explorer/public'/folder,DIST/folder,dirs_exist_ok=True)
for file in ['annotation-layout.js','annotation-manager.js','mesh-resources.js']:
    shutil.copy2(WORK/'anatomy-explorer/public'/file,DIST/file)
annotation=DIST/'annotation-manager.js'
annotation.write_text(annotation.read_text(encoding='utf8').replace('compact?Math.min(310,width-24)','compact?Math.min(195,width-24)').replace('annotation-layout.js?v=20261003-audit4','annotation-layout.js?v=20261016-cns1'),encoding='utf8')

GROUPS={
 'frontal': ['Precentral gyrus','Superior frontal gyrus','Middle frontal gyrus','Opercular part of inferior frontal gyrus','Triangular part of inferior frontal gyrus','Orbital part of  inferior frontal gyrus','Orbital gyri','Orbital gyri (Frontomarginal gyrus and sulcus*)','Straight gyrus (Gyrus rectus)','Transverse frontopolar gyrus and sulcus*'],
 'parietal':['Postcentral gyrus','Superior parietal lobule','Supramarginal gyrus','Angular gyrus','Precuneus'],
 'temporal':['Superior temporal gyrus (Lateral part)','Middle temporal gyrus','Inferior temporal gyrus','Temporal plane','Temporal pole','Transverse temporal gyri','Lateral occipitotemporal gyrus','Medial occipitotemporal gyrus (Parahippocampal*)'],
 'occipital':['Superior occipital gyri','Lateral occipital gyrus (Middle occipital gyrus*)','Inferior occipital gyrus and sulcus*','Occipital pole','Cuneus','Lingual gyrus'],
 'opercular':['Insula (Subcentral gyrus and ant. and post. sulci*)'],
 'limbic':['Cingulate gyrus (Posteroventral part*)','Cingulate gyrus and sulcus (Middle anterior part)','Cingulate gyrus and sulcus (Middle posterior part)','Cingulate gyrus and sulcus (Posterior dorsal part)'],
 'paracentral':['Paracentral gyrus and sulcus*'],
 'sulci':['Central sulcus','Lat_Fis-ant-Horizont','Lat_Fis-ant-Vertical','Lat_Fis-post','Precentral sulcus (inferior part)*','Precentral sulcus (Superior part)*','Postcentral sulcus','Superior frontal sulcus','Inferior frontal sulcus','Intraparietal sulcus','Parieto-occipital sulcus','Superior temporal sulcus','Inferior temporal sulcus','Lunate sulcus','Transverse occipital sulcus','Anterior occipital sulcus*','Calcarine sulcus','Cingulate sulcus (Marginal part*)','Subparietal sulcus','Circular sulcus of insula','Olfactory sulcus','Orbital sulci (H-shaped orbital sulci*)','Orbital sulci (Lateral Orbital sulcus*)','Collateral sulcus','Occipitotemporal sulcus (Lateral part*)',' Posterior transverse collateral sulcus','Sulcus interm_prim-Jensen'],
 'deep':['White matter of telencephalon','Corpus callosum','Anterior commissure','Posterior commissure','Hippocampal commissure','Fornix','Thalamus','Caudate nucleus','Lentiform nucleus','Hypothalamus','Hippocampus','Habenula','Septum pellucidum'],
 'brainstem':['Midbrain','Pons','Medulla oblongata'],
 'cerebellum':['Anterior quadrangular lobule','Posterior quadrangular lobule','Superior semilunar lobule','Inferior semilunar lobule','Gracile lobule','Biventral lobule','Tonsil of cerebellum','Flocculus','Peduncle of flocculus','Lingula of cerebellum','Central lobule','Wing of central lobule','Culmen','Declive','Folium of vermis','Tuber of vermis','Pyramis of vermis','Uvula of vermis','Nodule of vermis'],
 'cord':['White matter of spinal cord','Anterior horn of spinal cord','Posterior horn of spinal cord','Intermediolateral nucleus','Intermediomedial nucleus'],
 'peripheral':['Spinal ganglion','Anterior root of spinal nerve','Posterior root of spinal nerve','Trigeminal nerve (V)','Oculomotor nerve (III)','Optic nerve (II)']
}
COLORS={'frontal':'#ef7381','parietal':'#edc95c','temporal':'#52cbbc','occipital':'#a697e1','insula':'#f5a064','opercular':'#bdada2','limbic':'#d490c7','paracentral':'#e9ac73','sulci':'#25344a','deep':'#c5d9ee','brainstem':'#e7aa70','cerebellum':'#8daab9','cord':'#d3c7ed','peripheral':'#f0c869'}
raw=(WORK/'tmp/nervous_male.glb').read_bytes()
length=struct.unpack_from('<I',raw,12)[0]
source=json.loads(raw[20:20+length]);source_bin=raw[28+length:]
assert not source.get('skins') and not source.get('animations')
def base(name):return name.removesuffix('.l').removesuffix('.r')
by_base={}
for n in source['nodes']:by_base.setdefault(base(n.get('name','')),[]).append(n)
group_by_name={}
missing=[]
for group,names in GROUPS.items():
    for name in names:
        if name not in by_base:missing.append(name)
        for node in by_base.get(name,[]):group_by_name[node['name']]=group
# Fine spinal root names differ between source revisions. A ganglion and the
# source cranial nerves suffice for the lecture's CNS/PNS distinction.
assert set(missing)<= {'Anterior root of spinal nerve','Posterior root of spinal nerve'},missing
out={k:copy.deepcopy(source[k]) for k in ['asset','extensionsUsed','extensionsRequired'] if k in source}
out.update(scene=0,scenes=[{'nodes':[]}],nodes=[],meshes=[],accessors=[],bufferViews=[],buffers=[{'byteLength':0}])
binary=bytearray();views={};accessors={}
def view(i):
    if i not in views:
        v=source['bufferViews'][i];binary.extend(b'\0'*((-len(binary))%4));new=copy.deepcopy(v);new['buffer']=0;new['byteOffset']=len(binary)
        start=v.get('byteOffset',0);binary.extend(source_bin[start:start+v['byteLength']]);views[i]=len(out['bufferViews']);out['bufferViews'].append(new)
    return views[i]
def accessor(i):
    if i not in accessors:
        a=copy.deepcopy(source['accessors'][i]);assert not a.get('sparse')
        if 'bufferView' in a:a['bufferView']=view(a['bufferView'])
        accessors[i]=len(out['accessors']);out['accessors'].append(a)
    return accessors[i]
inventory=[]
for node in source['nodes']:
    name=node.get('name','')
    if name not in group_by_name:continue
    assert 'mesh' in node and not node.get('children') and source['nodes'].index(node) in source['scenes'][source.get('scene',0)]['nodes']
    new=copy.deepcopy(node);mesh=copy.deepcopy(source['meshes'][node['mesh']])
    for p in mesh['primitives']:
        assert 'material' not in p and not p.get('targets')
        p['attributes']={k:accessor(v) for k,v in p['attributes'].items()}
        if 'indices' in p:p['indices']=accessor(p['indices'])
        p['extensions']['KHR_draco_mesh_compression']['bufferView']=view(p['extensions']['KHR_draco_mesh_compression']['bufferView'])
    new['mesh']=len(out['meshes']);new.setdefault('extras',{}).update(anatomyName=name,group=group_by_name[name])
    out['meshes'].append(mesh);out['scenes'][0]['nodes'].append(len(out['nodes']));out['nodes'].append(new)
    inventory.append({'name':name,'base':base(name),'group':group_by_name[name],'side':'left' if name.endswith('.l') else 'right' if name.endswith('.r') else 'midline','color':COLORS[group_by_name[name]]})
out['buffers'][0]['byteLength']=len(binary);binary.extend(b'\0'*((-len(binary))%4))
encoded=json.dumps(out,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
models=DIST/'models';models.mkdir(exist_ok=True)
(models/'cns.glb').write_bytes(struct.pack('<III',0x46546c67,2,28+len(encoded)+len(binary))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(binary),0x004e4942)+binary)
data=DIST/'data';data.mkdir(exist_ok=True)
(data/'structures.json').write_text(json.dumps({'groups':GROUPS,'colors':COLORS,'meshes':inventory},indent=2),encoding='utf8')
(models/'ATTRIBUTION.txt').write_text('''CNS anatomical geometry: Z-Anatomy / BodyParts3D, exported by Anatria3D.
DBCLS / Kousaku Okubo; Gauthier Kervyn and Z-Anatomy contributors; Anatria3D contributors.
Sources: https://github.com/Z-Anatomy/Models-of-human-anatomy
https://github.com/Nurkan1/Anatria-3D/tree/main/public/anatomy
License: CC BY-SA 4.0; upstream BodyParts3D CC BY-SA 2.1 Japan.
https://creativecommons.org/licenses/by-sa/4.0/
Adaptation: CNS teaching subset repackaged from the original nervous_male.glb.
Compressed geometry, vertex positions and original node transforms preserved.
Categorical opaque region colors and boundary lines applied at runtime.
Source parcels can combine structures. They are not a subject-specific
Brodmann, vascular-territory or tractography segmentation.
Repackaged model adaptations remain under CC BY-SA 4.0.
Lecture: Dr Ibrahim Amr, Neuro-Anatomy lecture 1, user-supplied PDF.
''',encoding='utf8')
print(f'CNS export: {len(inventory)} original anatomical meshes; {(models/"cns.glb").stat().st_size:,} bytes. Missing optional roots: {missing}')
