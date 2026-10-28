"""Literal, source-ordered Lecture 2 with explicit mesh/plate provenance."""
from pathlib import Path
import json, subprocess

ROOT=Path(__file__).resolve().parent; DIST=ROOT/'public'
source=json.loads((ROOT/'brainstem-source.json').read_text(encoding='utf8'))
inventory=json.loads((DIST/'data/brainstem-structures.json').read_text(encoding='utf8'))
structures=[]; lookup={}; steps=[]

def add(id,name,bases,page,view='anterior',plate=None,kind='anatomical',note=None):
    meshes=[m['name'] for m in inventory['meshes'] if m['base'] in bases]
    assert meshes,(id,bases)
    e=dict(id=id,name=name,meshes=meshes,page=page,view=view,mode='stem',kind=kind,text=name,bullets=[],aliases=[id.replace('-',' ')],references=[],side='both')
    if plate:e['plate']=plate
    if kind=='relation':e.update(diagram_only=True,clarification='The dashed 3D arrow locates the named parent region, not a separately segmented tract or nucleus. The original lecture section shows the fine internal relationships; open Reference figure to compare.')
    if note:e['clarification']=note
    structures.append(e);lookup[id]=e
    return e

stem=['Midbrain','Pons','Medulla oblongata']
add('brainstem','Brainstem',stem,1,plate='anterior')
add('midbrain','Midbrain',['Midbrain'],2,plate='anterior')
add('pons','Pons',['Pons'],5,plate='anterior')
add('medulla','Medulla oblongata',['Medulla oblongata'],7,plate='medulla-anterior')
add('limits','Posterior commissure → pyramidal decussation',['Posterior commissure','Medulla oblongata'],1,plate='anterior',kind='relation')
nerves=['Oculomotor nerve (III)','Trochlear nerve (IV)','Trigeminal nerve (V)','Abducens nerve (VI)','Facial nerve (VII)','Vestibulocochlear nerve (VIII)','Glossopharyngeal nerve (IX)','Vagus nerve (X)','Accessory nerve (XI)','Hypoglossal nerve (XII)']
add('cranial-nerves','Cranial nerves III–XII',nerves,1,plate='anterior',note='The spinal root of XI arises from the upper cervical spinal cord. Its cranial component is traditionally described with XI in this lecture; it joins the vagus. Only the proximal portions of cranial nerves are shown around the brainstem.')
add('reticular','Reticular formation',stem,1,plate='inferior',kind='relation',note='A distributed network in the brainstem tegmentum, not one sharply bounded surface nucleus. Coma is associated with severe injury to arousal networks, often bilateral pontomesencephalic involvement; not every reticular lesion causes coma.')
add('blood-supply','Vertebrobasilar system',['Basilar artery','Vertebral artery'],1,plate='location')
for id,name,b,p,v in [('cn3','Oculomotor nerve · III',nerves[0],2,'anterior'),('cn4','Trochlear nerve · IV',nerves[1],2,'posterior'),('cn5','Trigeminal nerve · V',nerves[2],5,'anterior'),('cn6','Abducens nerve · VI',nerves[3],5,'anterior'),('cn7','Facial nerve · VII',nerves[4],5,'anterior'),('cn8','Vestibulocochlear nerve · VIII',nerves[5],5,'anterior'),('cn9','Glossopharyngeal nerve · IX',nerves[6],7,'anterior'),('cn10','Vagus nerve · X',nerves[7],7,'anterior'),('cn11','Accessory nerve · XI',nerves[8],7,'anterior'),('cn12','Hypoglossal nerve · XII',nerves[9],7,'anterior')]:
    add(id,name,[b],p,v,'posterior' if v=='posterior' else 'anterior')
add('aqueduct','Cerebral aqueduct',['Aqueduct of midbrain'],2,plate='inferior')
add('peduncle','Cerebral peduncle',['Base of peduncle','Midbrain'],2,plate='inferior',kind='relation',note='The lecture uses cerebral peduncle for crus cerebri, substantia nigra and tegmentum together. The export separately segments only the base of the peduncle; use the original cross-section for the three divisions.')
add('crus','Crus cerebri',['Base of peduncle'],3,plate='inferior')
add('substantia-nigra','Substantia nigra',['Midbrain'],2,plate='inferior',kind='relation',note='Shown on the original section, dorsal to the crus cerebri. The source mesh does not separately segment substantia nigra. Parkinsonism relates particularly to loss of dopaminergic neurons in pars compacta; the slide wording is preserved.')
add('tegmentum','Midbrain tegmentum',['Midbrain'],2,plate='inferior',kind='relation')
add('tectum','Tectum · corpora quadrigemina',['Superior colliculus','Inferior colliculus'],2,'posterior','posterior')
add('superior-colliculi','Superior colliculi',['Superior colliculus'],2,'posterior','superior')
add('inferior-colliculi','Inferior colliculi',['Inferior colliculus'],2,'posterior','inferior')
for id,name in [('corticospinal','Corticospinal tract'),('corticobulbar','Corticobulbar tract'),('frontopontine','Frontopontine fibers'),('temporopontine','Temporopontine fibers'),('mesencephalic-v','Mesencephalic nucleus of CN V'),('mlf','Medial longitudinal fasciculus'),('spinal-lemniscus','Spinal lemniscus'),('lateral-lemniscus','Lateral lemniscus'),('medial-lemniscus','Medial lemniscus'),('trigeminal-lemniscus','Trigeminal lemniscus')]:
    add(id,name,['Base of peduncle'] if id in ['corticospinal','corticobulbar','frontopontine','temporopontine'] else ['Midbrain'],3,plate='inferior',kind='relation')
lookup['lateral-lemniscus']['clarification']='The source section shows the lateral lemniscus at the inferior collicular level. Auditory pathways have bilateral connections; this diagram is a teaching level map, not a complete auditory pathway.'
add('trochlear-nucleus','Trochlear nucleus',['Nucleus of trochlear nerve'],3,plate='inferior')
add('scp','Superior cerebellar peduncle',['Superior cerebellar peduncle'],3,'posterior','posterior')
add('scp-crossing','Decussation of superior cerebellar peduncles',['Midbrain'],3,plate='inferior',kind='relation')
add('red-nucleus','Red nucleus',['Red nucleus'],4,plate='superior')
add('oculomotor-nucleus','Oculomotor nucleus',['Nucleus of oculomotor nerve'],4,plate='superior')
for id,name,p,v,plate,bases in [
 ('mcp','Middle cerebellar peduncle',5,'anterior','anterior',['Pons']),
 ('basilar-groove','Basilar groove',5,'anterior','anterior',['Pons']),
 ('pontine-nuclei','Pontine nuclei',5,'anterior','pons',['Pons']),
 ('corticopontine','Corticopontine tract',5,'anterior','pons',['Pons']),
 ('pontocerebellar','Pontocerebellar fibers',5,'anterior','pons',['Pons']),
 ('pontine-tegmentum','Pontine tegmentum',6,'posterior','posterior',['Pons']),
 ('sulcus-limitans','Sulcus limitans',6,'posterior','posterior',['Pons']),
 ('facial-colliculus','Facial colliculus',6,'posterior','posterior',['Pons']),
 ('trigeminal-nuclei','Trigeminal nuclei',6,'posterior','pons',['Pons']),
 ('pontine-sensory','Sensory tracts of pontine tegmentum',6,'posterior','pons',['Pons']),
 ('dorsal-trigeminal','Dorsal trigeminal tract',6,'posterior','pons',['Pons']),
 ('ventral-trigeminal','Ventral trigeminal tract',6,'posterior','pons',['Pons']),
 ('anterior-trigeminothalamic','Anterior trigeminothalamic tract',6,'posterior','pons',['Pons']),
 ('central-tegmental','Central tegmental tract',6,'posterior','pons',['Pons']),
 ('pontine-motor','Motor tracts of pontine tegmentum',6,'posterior','pons',['Pons']),
 ('vestibulocerebellar','Vestibulocerebellar tract',6,'posterior','pons',['Pons']),
 ('medial-vestibulospinal','Medial vestibulospinal tract',6,'posterior','pons',['Pons']),
 ('lateral-vestibulospinal','Lateral vestibulospinal tract',6,'posterior','pons',['Pons']),
 ('icp','Inferior cerebellar peduncle',7,'posterior','posterior',['Medulla oblongata']),
 ('posteromedian','Posteromedian sulcus',8,'posterior','medulla-posterior',['Medulla oblongata']),
 ('vagal-trigone','Vagal trigone',8,'posterior','medulla-posterior',['Medulla oblongata']),
 ('internal-arcuate','Internal arcuate fibers · sensory crossing',9,'posterior','medulla',['Medulla oblongata']),
 ('posterior-spinocerebellar','Posterior spinocerebellar tract',9,'posterior','medulla',['Medulla oblongata']),
 ('cuneocerebellar','Cuneocerebellar tract',9,'posterior','medulla',['Medulla oblongata']),
 ('anterior-spinocerebellar','Anterior spinocerebellar tract',9,'posterior','medulla',['Medulla oblongata']),
]:add(id,name,bases,p,v,plate,'relation')
add('fourth-ventricle','Fourth ventricle',['Fourth ventricle'],6,'posterior','posterior')
for id,name,b in [('abducens-nucleus','Abducens nucleus','Nucleus of abducens nerve'),('facial-nucleus','Facial motor nucleus','Motor nucleus of facial nerve'),('vestibular-nuclei','Vestibular nuclei','Vestibular nuclei'),('cochlear-nuclei','Cochlear nuclei','Anterior cochlear nucleus'),('superior-salivatory','Superior salivatory nucleus','Superior salivatory nucleus'),('inferior-salivatory','Inferior salivatory nucleus','Inferior salivatory nucleus')]:
    add(id,name,[b],6,'posterior','pons')
lookup['inferior-salivatory']['clarification']='Source correction: the slide lists this under pontine nuclei, but the inferior salivatory nucleus is associated with CN IX in the rostral medulla. The original, correctly located medullary mesh is shown; it is not moved into the pons.'
lookup['icp']['clarification']='The inferior cerebellar peduncle connects the medulla with the cerebellum and contains multiple fiber pathways. The slide later calls an item "inferior cerebellar tract"; the plate identifies the peduncle region without inventing a separate tract boundary.'
lookup['cuneocerebellar']['clarification']='The original medullary section labels the accessory cuneate nucleus. The marker identifies that relay associated with the upper-limb proprioceptive pathway; it is not a separately segmented cuneocerebellar fiber bundle.'
add('pyramid','Pyramid',['Pyramid of medulla oblongata'],7,plate='medulla-anterior')
add('olive','Olive',['Olive'],7,plate='medulla-anterior')
add('gracile','Gracile fasciculus',['Gracile fasciculus'],8,'posterior','medulla-posterior',note='The source column mesh extends caudally in the spinal cord. Its upper medullary relationship and tubercle are shown on the original posterior plate; the tubercle is not a separately segmented nucleus in this export.')
add('cuneate','Cuneate fasciculus',['Cuneate fasciculus'],8,'posterior','medulla-posterior',note='The fasciculus is present in the source model; the cuneate tubercle/nucleus relationship is shown on the original posterior and sectional plates.')

def point(page,a,b,id,title=None,plate=None,diagram=False,internal=False):
    e=lookup[id]; lines=source['pages'][page-1]['lines'][a:b+1]
    focus=plate or e.get('plate','anterior')
    s=dict(id=f'bs-{page}-{a}-{id}',chapter=f'page-{page}',structure=id,title=title or e['name'],name=title or e['name'],page=page,printed_page=page+11,pins=[id],view=e['view'],hemisphere='both',mode='stem',targets=e['meshes'],text=lines[0],bullets=lines[1:],source_lines=list(range(a,b+1)),source_excerpt='\n'.join(lines),plate=focus,diagram=False,study_focus=focus if diagram or e['kind']=='relation' or internal else None,internal=internal)
    steps.append(s)
    if e['text']==e['name']:e.update(text=lines[0],bullets=lines[1:])
    return s

# Non-overlapping, monotonically increasing source ranges cover all 133 lines.
point(1,0,1,'midbrain','Midbrain · three continuous parts')['related']=[{'structure':'pons','name':'Pons','text':'pons','bullets':[],'targets':lookup['pons']['meshes']},{'structure':'medulla','name':'Medulla oblongata','text':'medulla oblongata','bullets':[],'targets':lookup['medulla']['meshes']}]
point(1,2,2,'limits');point(1,3,3,'cranial-nerves');point(1,4,4,'reticular',internal=True);point(1,5,6,'blood-supply')
point(2,0,1,'midbrain','Midbrain · cranial nerves III & IV')['related']=[{'structure':'cn3','name':'Oculomotor · III','text':'oculomotor nerve (3)','bullets':[],'targets':lookup['cn3']['meshes']},{'structure':'cn4','name':'Trochlear · IV','text':'trochlear nerve (4)','bullets':[],'targets':lookup['cn4']['meshes']}]
point(2,2,3,'aqueduct',diagram=True,internal=True)
point(2,4,6,'peduncle',diagram=True);point(2,7,9,'tectum');point(2,10,11,'superior-colliculi','Colliculi · visual & auditory reflexes')['related']=[{'structure':'inferior-colliculi','name':'Inferior colliculi','text':'auditory reflexes','bullets':[],'targets':lookup['inferior-colliculi']['meshes']}]
point(2,12,13,'cn3');point(2,14,15,'substantia-nigra');point(2,16,17,'reticular',internal=True)
point(3,0,0,'inferior-colliculi','Inferior collicular level',plate='inferior',diagram=True)
point(3,1,2,'corticospinal');point(3,3,3,'corticobulbar');point(3,4,4,'frontopontine');point(3,5,5,'temporopontine');point(3,6,7,'mesencephalic-v');point(3,8,8,'mlf');point(3,9,9,'trochlear-nucleus',diagram=True,internal=True);point(3,10,10,'scp-crossing')
point(3,11,12,'spinal-lemniscus');point(3,13,13,'lateral-lemniscus');point(3,14,14,'medial-lemniscus');point(3,15,15,'trigeminal-lemniscus')
point(4,0,2,'spinal-lemniscus');point(4,3,5,'lateral-lemniscus');point(4,6,8,'medial-lemniscus');point(4,9,10,'trigeminal-lemniscus');point(4,11,12,'red-nucleus',plate='superior',diagram=True,internal=True);point(4,13,13,'oculomotor-nucleus',plate='superior',diagram=True,internal=True);point(4,14,14,'superior-colliculi','Compare the two midbrain levels',plate='superior',diagram=True)
point(5,0,1,'pons','Pons · anterior (basilar) surface');point(5,2,2,'mcp');point(5,3,3,'basilar-groove');point(5,4,6,'cn5');point(5,7,8,'cn6','Pontomedullary junction · VI, VII & VIII')['related']=[{'structure':id,'name':lookup[id]['name'],'text':text,'bullets':[],'targets':lookup[id]['meshes']} for id,text in [('cn7','facial (7)'),('cn8','vestibulocochlear nerves (8)')]]
point(5,9,10,'pontine-nuclei');point(5,11,12,'corticospinal',plate='pons');point(5,13,13,'corticobulbar',plate='pons');point(5,14,14,'corticopontine');point(5,15,15,'pontocerebellar');point(5,16,16,'mcp',plate='pons')
point(6,0,1,'pontine-tegmentum');point(6,2,2,'sulcus-limitans');point(6,3,5,'facial-colliculus')
point(6,6,7,'trigeminal-nuclei');point(6,8,8,'abducens-nucleus',diagram=True,internal=True);point(6,9,9,'facial-nucleus',diagram=True,internal=True);point(6,10,10,'vestibular-nuclei',diagram=True,internal=True);point(6,11,11,'cochlear-nuclei',internal=True);point(6,12,12,'superior-salivatory',internal=True);point(6,13,13,'inferior-salivatory',internal=True)
point(6,14,16,'trigeminal-lemniscus',plate='pons');point(6,17,17,'dorsal-trigeminal');point(6,18,18,'ventral-trigeminal');point(6,19,19,'anterior-trigeminothalamic');point(6,20,20,'central-tegmental');point(6,21,21,'medial-lemniscus',plate='pons');point(6,22,22,'lateral-lemniscus',plate='pons');point(6,23,24,'vestibulocerebellar');point(6,25,25,'medial-vestibulospinal');point(6,26,26,'lateral-vestibulospinal');point(6,27,27,'mlf',plate='pons');point(6,28,28,'icp',plate='pons')
point(7,0,1,'medulla','Medulla · anterior surface');point(7,2,2,'icp',plate='medulla-anterior');point(7,3,3,'pyramid');point(7,4,4,'olive');point(7,5,6,'cn9','Postolivary nerves · IX, X & XI')['related']=[{'structure':id,'name':lookup[id]['name'],'text':text,'bullets':[],'targets':lookup[id]['meshes']} for id,text in [('cn10','Vagus (10)'),('cn11','Cranial accessory nerve (11)')]]
point(7,7,8,'cn12')
point(8,0,1,'medulla','Medulla · posterior surface',plate='medulla-posterior',diagram=True)['view']='posterior'
point(8,2,2,'posteromedian');point(8,3,3,'gracile',diagram=True);point(8,4,4,'cuneate',diagram=True);point(8,5,5,'vagal-trigone')
point(9,0,3,'medial-lemniscus',plate='medulla');point(9,4,6,'internal-arcuate');point(9,7,9,'spinal-lemniscus',plate='medulla');point(9,10,11,'posterior-spinocerebellar');point(9,12,13,'cuneocerebellar');point(9,14,15,'anterior-spinocerebellar')
steps.append(dict(id='brainstem-explorer',chapter='explore',structure='brainstem',title='Complete brainstem · explore & isolate',name='Brainstem explorer',page=9,printed_page=20,pins=['brainstem'],view='anterior',hemisphere='both',mode='stem',targets=lookup['brainstem']['meshes'],text='Explore every lecture structure. Switch between anterior, posterior and the original sectional levels.',bullets=['Select a structure to isolate it or see its exact location on the source diagram.'],utility=True,plate='anterior'))
directory_ranges={'brainstem':(1,0,1),'cn4':(2,0,1),'cn7':(5,7,8),'cn8':(5,7,8),'cn10':(7,5,6),'cn11':(7,5,6),'crus':(3,1,5),'tegmentum':(2,4,6),'scp':(3,10,10),'fourth-ventricle':(6,0,1),'pontine-sensory':(6,14,22),'pontine-motor':(6,23,28)}
for id,(page,a,b) in directory_ranges.items():
    e=lookup[id]
    if e['text']==e['name']:
        lines=source['pages'][page-1]['lines'][a:b+1];e.update(page=page,text=lines[0],bullets=lines[1:])
titles=['Brainstem · parts, nerves & supply','Midbrain · external organization','Inferior collicular level','Lemnisci & superior collicular level','Pons · anterior surface','Pons · posterior surface & internal structures','Medulla · anterior surface','Medulla · posterior surface','Medulla · internal pathways']
for page in source['pages']:
    ps=[s for s in steps if s['page']==page['page'] and not s.get('utility')]
    for i,s in enumerate(ps,1):s.update(slide_item=i,slide_items=len(ps))
    covered={i for s in ps for i in s['source_lines']}
    assert covered==set(range(len(page['lines']))),page['page']

quiz=[]
def q(answer,prompt,others,explanation):quiz.append(dict(id='bs-q'+str(len(quiz)+1),answer=answer,prompt=prompt,choices=[answer]+others,explanation=explanation))
q('pyramid','Identify the highlighted medullary elevation.',['olive','pons','inferior-colliculi'],'The pyramid is formed by descending corticospinal fibers before their pyramidal decussation.')
q('olive','Which highlighted structure is produced by the inferior olivary nuclear complex?',['pyramid','superior-colliculi','crus'],'The olive lies lateral to the pyramid. CN XII emerges between them.')
q('cn12','Which nerve emerges between the pyramid and olive?',['cn9','cn10','cn5'],'Hypoglossal rootlets emerge in the preolivary sulcus. IX, X and cranial XI emerge posterior to the olive.')
q('cn5','Which nerve emerges from the mid-pons near the middle cerebellar peduncle?',['cn3','cn6','cn12'],'The trigeminal nerve exits from the lateral mid-pons; VI, VII and VIII emerge at the pontomedullary junction.')
q('cn4','Which cranial nerve has a dorsal brainstem exit?',['cn3','cn7','cn10'],'The trochlear nerve emerges dorsally below the inferior colliculus and wraps around the midbrain.')
q('inferior-colliculi','Identify the caudal pair of tectal elevations.',['superior-colliculi','red-nucleus','pyramid'],'Inferior colliculi are associated with auditory reflex pathways; superior colliculi with visual orienting reflexes.')
q('superior-colliculi','Identify the rostral pair of tectal elevations.',['inferior-colliculi','olive','pons'],'These are the superior colliculi of the tectum, involved in visual orienting reflexes.')
q('red-nucleus','Which nucleus characterizes the superior collicular midbrain level?',['trochlear-nucleus','facial-nucleus','inferior-salivatory'],'The red nucleus is seen at the superior collicular level and is related to motor coordination.')
q('aqueduct','Identify the narrow CSF channel through the midbrain.',['fourth-ventricle','crus','scp'],'The cerebral aqueduct connects the third and fourth ventricles.')
q('cn6','Which highlighted nerve exits near the midline at the pontomedullary junction?',['cn5','cn3','cn12'],'The abducens nerve exits medially; VII and VIII emerge more laterally at this junction.')
q('blood-supply','Identify the arterial system supplying the brainstem.',['cn9','crus','pyramid'],'The vertebral arteries unite to form the basilar artery, which runs along the ventral pons.')
q('trochlear-nucleus','Which nucleus is associated with the inferior collicular level?',['oculomotor-nucleus','red-nucleus','abducens-nucleus'],'The trochlear nucleus is at the inferior collicular level; the oculomotor nucleus is at the superior level.')
pick_prompts={'pyramid':'Tap the medullary elevation formed by descending corticospinal fibers.','olive':'Tap the medullary elevation lateral to the pyramid.','cn5':'Tap the cranial nerve emerging from the lateral middle part of the pons.','cn4':'Tap the cranial nerve emerging dorsally below the inferior colliculus.','cn12':'Tap the cranial nerve emerging between the pyramid and olive.','inferior-colliculi':'Tap the tectal elevations related to auditory reflexes.','superior-colliculi':'Tap the tectal elevations related to visual orienting reflexes.'}
for item in quiz:
    if item['answer'] in pick_prompts:item['pick_prompt']=pick_prompts[item['answer']]
section_bindings=json.loads(subprocess.check_output(['node',str(ROOT/'section-bindings.mjs')],cwd=ROOT,text=True))
for s in steps:
    key=s.get('plate')
    if s['structure'] in section_bindings.get(key,[]) and (s.get('study_focus') or s['page'] in [3,4,9]):
        s['section_key']=key
for e in structures:
    key=e.get('plate')
    if e['id'] in section_bindings.get(key,[]) and (e.get('diagram_only') or e['page'] in [3,4,9]):e['section_key']=key
    if e.get('section_key') and e.get('clarification','').startswith('The dashed 3D arrow'):
        e['clarification']='Shown on a simplified 3D teaching section based on the supplied lecture. Its colored contours and internal subdivisions illustrate topography; they are not a new histological segmentation. Open Reference figure to compare the original source.'

data=dict(id='2',title='Brain stem',source=source['file'],source_pages=list(range(1,10)),source_sha256=source['sha256'],source_line_count=133,source_path='/data/brainstem-source.json',slide_template='/slides/brainstem/slide-{page}.jpg',chapters=[dict(id=f'page-{i}',name=f'Slide {i} · {t}') for i,t in enumerate(titles,1)]+[dict(id='explore',name='Complete brainstem explorer')],steps=steps,structures=structures,quiz=quiz,references=[dict(id='lecture',name='L2 - Brain Stem · Dr Ibrahim Amr',url=None,role='All 9 supplied PDF pages, printed pages 12–20. Literal source text and the original lecture illustrations; full highlighted slides remain available.'),dict(id='duke',name='Duke Neurosciences · Surface and sectional brainstem anatomy',url='https://brain.oit.duke.edu/lab03/lab03.html',role='External landmarks, cranial nerve exits, and the relationship between surface anatomy and serial cross-sections. The teaching progression follows this surface-to-section approach.'),dict(id='tau',name='Tel Aviv University · Brainstem dissection guide',url='https://www.neuroanatomy.sites.tau.ac.il/brainstem',role='Anterior/posterior orientation and the inferior/superior collicular, pontine and medullary section levels. External images are not copied.'),dict(id='ut-ix',name='UTHealth · CN IX and inferior salivatory nucleus',url='https://nba.uth.tmc.edu/neuroanatomy/L9/Lab09p12_index.html',role='Checks the inferior salivatory nucleus in the medulla; the lecture’s pontine list is retained with a separate correction.'),dict(id='duke-sections',name='Duke · Internal brainstem and serial levels',url='https://brain.oit.duke.edu/lab04/lab05.html',role='Cross-check of section levels and nucleus/tract relationships. The interactive slab contours are simplified teaching drawings based on the supplied lecture, not histological segmentations.'),dict(id='fipat',name='FIPAT · Terminologia Neuroanatomica',url='https://cdn.dal.ca/content/dam/dalhousie/pdf/library/FIPAT/TNA/FIPAT-TNA-Ch1.pdf',role='Terminology 1322: anterior/ventral trigeminothalamic tract and trigeminal lemniscus refer to the same pathway; they are not three independent parcels.')],model='/models/brainstem.glb',schema_version=4,tour_revision='brainstem-literal-1',module='brainstem',default_hemisphere='both')
(DIST/'data/lecture-2.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')
registry=json.loads((DIST/'data/lectures.json').read_text(encoding='utf8'))
registry=[l for l in registry if l['id']!='2']+[dict(id='2',title='Lecture 2 · Brainstem',path='/data/lecture-2.json',inventory='/data/brainstem-structures.json')]
(DIST/'data/lectures.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2),encoding='utf8')
print(f'Lecture 2: {len(steps)} ordered points, {len(structures)} structures, {len(quiz)} quiz questions; 133/133 source lines covered.')
