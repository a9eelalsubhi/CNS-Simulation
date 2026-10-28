"""Literal source ranges, exact anatomy bindings and complete ordered coverage.
Repeated ranges name multiple structures in a single slide bullet; they never
move the source cursor backwards. Source notes remain outside the slide text.
"""
from pathlib import Path
import json, re
SOURCE=json.loads(Path(__file__).with_name('lecture-source.json').read_text(encoding='utf8'))

def build_sequence(structures,inventory):
    chapters,steps=[],[]
    page=1
    def section(p,title):
        nonlocal page
        page=p; chapters.append({'id':f'page-{p}','name':f'Slide {p} · {title}','page':p})
    def add(key,start,end=None,title=None,bases=None,related=(),**options):
        end=start if end is None else end; e=structures[key]
        lines=SOURCE['pages'][page-1]['lines'][start:end+1]; assert lines
        targets=e['meshes'] if bases is None else [m['name'] for m in inventory if m['base'] in bases and m['name'] in e['meshes']]
        assert targets,(key,bases)
        label=title or re.sub(r'^[-\s]+','',lines[0]); slug=re.sub('[^a-z0-9]+','-',label.lower()).strip('-')
        point=dict(id=f's{page}-l{start}-{key}-{slug}',chapter=f'page-{page}',structure=key,title=label,name=label,page=page,printed_page=page,pins=[key],view=e['view'],mode=e['mode'],targets=targets,text=lines[0],bullets=lines[1:],source_lines=list(range(start,end+1)),source_excerpt='\n'.join(lines),related=list(related))
        point.update(options); steps.append(point)
    def ref(key,text,title=None):return dict(structure=key,name=title or structures[key]['name'],text=text,bullets=[],targets=structures[key]['meshes'],source_context=True)

    section(1,'Neuroanatomy · nervous system & cerebral hemisphere')
    add('cerebrum',0,2,'The nervous system',mode='brain-components',related=[ref('peripheral','(B) Peripheral nervous system:')])
    add('cerebrum',3,title='Central nervous system · Brain',mode='brain-components',related=[ref('brainstem','brainstem'),ref('cerebellum','cerebellum')])
    add('brainstem',3,title='Brainstem',mode='brain-components'); add('cerebellum',3,title='Cerebellum',mode='brain-components')
    add('spinal-cord',4,title='Central nervous system · Spinal cord'); add('peripheral',5,7,'Peripheral nervous system')
    add('grey',8,9,'Grey matter',related=[ref('white','(2) White matter: is composed of myelinated axons')]); add('white',10,title='White matter')
    add('nucleus',11,title='Nucleus',related=[ref('ganglion','- Ganglion: refers to a collection of neuronal cell bodies located outside the CNS')]); add('ganglion',12,title='Ganglion')
    add('cerebrum',13,15,'Cerebral hemisphere · 5 lobes')
    for line,key in [(16,'frontal'),(17,'temporal'),(18,'parietal'),(19,'occipital'),(20,'insula')]:add(key,line,title=structures[key]['name'])
    add('cerebrum',21,22,'Superolateral surface',view='lateral'); add('cerebrum',23,title='Medial surface',view='medial'); add('cerebrum',24,title='Inferior surface',view='inferior')

    section(2,'Superolateral surface · frontal lobe')
    add('cerebrum',0,title='Superolateral surface'); add('central',1,title='Central sulcus'); add('lateral',2,title='Lateral sulcus'); add('parieto-occipital',3,title='Parieto-occipital sulcus')
    add('frontal',4,title='Frontal lobe'); add('precentral-sulcus',5,title='Precentral sulcus'); add('precentral',6,7,'Precentral gyrus · area 4')
    for word in ['Superior','Inferior']:add('frontal-sulci',8,title=f'{word} frontal sulcus',bases=[f'{word} frontal sulcus'])
    for key in ['superior-frontal','middle-frontal','inferior-frontal']:add(key,9,title=structures[key]['name'])
    add('broca',10,11,"Broca's area · function"); add('broca',12,13,"Broca's area · effect of lesion"); add('frontal-eye',14,title='Frontal eye field · area 8')

    section(3,'Parietal lobe')
    add('parietal',0,title='Parietal lobe'); add('postcentral-sulcus',1,title='Postcentral sulcus'); add('postcentral',2,3,'Postcentral gyrus · function')
    for i,key in [(4,'intraparietal'),(5,'superior-parietal'),(6,'inferior-parietal'),(7,'supramarginal'),(8,'angular')]:add(key,i,title=structures[key]['name'])
    add('wernicke',9,11,"Wernicke's area · function"); add('wernicke',12,13,"Wernicke's area · effect of lesion")

    section(4,'Temporal, occipital & medial surfaces')
    add('temporal',0,title='Temporal lobe')
    for word in ['Superior','Inferior']:add('temporal-sulci',1,title=f'{word} temporal sulcus',bases=[f'{word} temporal sulcus'])
    for word,base in [('Superior','Superior temporal gyrus (Lateral part)'),('Middle','Middle temporal gyrus'),('Inferior','Inferior temporal gyrus')]:add('temporal-gyri',2,title=f'{word} temporal gyrus',bases=[base])
    add('auditory',3,title='Auditory area · hearing'); add('occipital',4,title='Occipital lobe · vision')
    add('occipital-sulci',5,title='Lateral occipital sulcus · relation',bases=['Lateral occipital gyrus (Middle occipital gyrus*)'],kind='relation')
    add('occipital-sulci',6,title='Superior & inferior occipital gyri',bases=['Superior occipital gyri','Inferior occipital gyrus and sulcus*']); add('occipital-sulci',7,title='Lunate sulcus',bases=['Lunate sulcus'])
    add('cerebrum',8,title='Medial surface',view='medial'); add('callosal-sulcus',9,title='Callosal sulcus · relation'); add('callosal-sulcus',10,title='Cingulate sulcus · relation')
    add('cingulate',11,title='Cingulate gyrus · function'); add('medial-frontal',12,title='Medial frontal gyrus'); add('central',13,title='Terminal part of central sulcus',view='medial',anchor_at={'y':.97})
    add('paracentral',14,title='Paracentral lobule · function'); add('medial-y',15,16,'Y-shaped sulcus'); add('cuneus',17,title='Cuneus'); add('precuneus',18,title='Precuneus')

    section(5,'Inferior surface · orbital & tentorial')
    add('orbital',0,1,'Inferior surface · orbital part'); add('olfactory-sulcus',2,title='Olfactory sulcus'); add('orbital-h',3,title='H-shaped orbital sulcus'); add('rectus',4,title='Gyrus rectus')
    add('orbital',5,7,'Anterior, posterior, medial & lateral orbital gyri',bases=['Orbital gyri']); add('tentorial',8,title='Tentorial surface')
    add('tentorial',9,title='Rhinal sulcus · parent-region relation',bases=['Medial occipitotemporal gyrus (Parahippocampal*)'],kind='relation'); add('collateral',10,title='Collateral sulcus')
    add('tentorial',11,title='Uncus · parent-region relation',bases=['Medial occipitotemporal gyrus (Parahippocampal*)'],kind='relation'); add('occipitotemporal',12,title='Parahippocampus',bases=['Medial occipitotemporal gyrus (Parahippocampal*)'])
    add('lingual',13,title='Lingual gyrus'); add('occipitotemporal',14,title='Occipitotemporal sulcus',bases=['Occipitotemporal sulcus (Lateral part*)'])
    add('occipitotemporal',15,title='Medial occipitotemporal gyrus',bases=['Medial occipitotemporal gyrus (Parahippocampal*)']); add('occipitotemporal',16,title='Lateral occipitotemporal gyrus',bases=['Lateral occipitotemporal gyrus'])

    section(6,'Functions of frontal lobe · primary motor area')
    add('frontal',0,2,'Frontal lobe · boundaries',related=[ref('central','Central sulcus (of Rolando)'),ref('lateral','Lateral sulcus (of Sylvius)')]); add('precentral',3,4,'Primary motor area · area 4')
    add('paracentral',5,8,'Motor somatotopy · medial side',view='medial',kind='functional'); add('precentral',9,11,'Motor somatotopy · lateral side'); add('precentral',12,title='Motor area · effect of lesion')

    section(7,'Premotor, prefrontal, eye field & Broca')
    add('premotor',0,3,'Motor association cortex · area 6'); add('prefrontal',4,9,'Prefrontal area · functions'); add('frontal-eye',10,11,'Frontal eye field · function'); add('frontal-eye',12,title='Frontal eye field · effect of lesion')
    add('broca',13,15,"Broca's area · areas 44 & 45",clarification='Slide wording is retained above. The named inferior-frontal parts are pars opercularis, pars triangularis and pars orbitalis; classical BA 44/45 corresponds to the opercular and triangular regions, not all three. The source has no exact Brodmann segmentation.')
    add('broca',16,17,"Broca's area · effect of lesion")

    section(8,'Functions of parietal lobe')
    add('postcentral',0,2,'Primary somatosensory area · 1, 2, 3'); add('paracentral',3,6,'Sensory somatotopy · medial side',view='medial',kind='functional'); add('postcentral',7,9,'Sensory somatotopy · lateral side'); add('postcentral',10,title='Somatosensory area · effect of lesion')
    add('sensory-association',11,13,'Somatosensory association cortex · function'); add('sensory-association',14,15,'Astereognosis'); add('sensory-association',16,title='Graphesthesia · slide wording'); add('sensory-association',17,title='Astatagnosis · slide wording'); add('sensory-association',18,title='Abarognosis')
    add('wernicke',19,22,"Wernicke's area · function"); add('wernicke',23,26,"Wernicke's area · effect of lesion")

    section(9,'Temporal, occipital & insular functions')
    add('auditory',0,2,'Primary auditory area · 41 & 42'); add('auditory',3,title='Primary auditory area · effect of lesion'); add('auditory-association',4,6,'Auditory association area'); add('olfactory',7,8,'Primary olfactory area'); add('olfactory',9,10,'Association olfactory area')
    add('visual',11,13,'Primary visual area · area 17'); add('visual',14,title='Primary visual area · effect of lesion'); add('visual-association',15,17,'Visual association area · areas 18 & 19'); add('visual-association',18,title='Visual association area · effect of lesion')
    add('insula',19,20,'Insula · visceral sensations'); add('insula',21,title='Insula · equilibrium'); add('gustatory',22,title='Insula · taste',mode='insula')

    section(10,'Functional organization · sensory, association & Brodmann')
    for start,end,key,title in [(0,1,'postcentral','Primary somatosensory area'),(2,2,'visual','Primary visual area'),(3,3,'auditory','Primary auditory area'),(4,4,'gustatory','Primary gustatory area'),(5,5,'olfactory','Primary olfactory area'),(6,7,'sensory-association','Somatosensory association area'),(8,8,'visual-association','Visual association area'),(9,9,'auditory-association','Auditory association area'),(10,10,'wernicke',"Wernicke's area"),(11,11,'prefrontal','Prefrontal cortex')]:add(key,start,end,title)
    for start,end,key,title in [(12,13,'visual','Area 17 · Primary visual cortex'),(14,14,'visual-association','Areas 18 & 19 · Secondary visual cortex'),(15,15,'precentral','Area 4 · Primary motor cortex'),(16,16,'premotor','Area 6 · Premotor area'),(17,17,'postcentral','Areas 3, 1 & 2 · Somatosensory cortex'),(18,18,'auditory','Areas 41 & 42 · Auditory cortex'),(19,19,'broca',"Areas 44 & 45 · Broca's area"),(20,20,'wernicke',"Areas 39 & 40 · Wernicke's area"),(21,21,'frontal-eye','Area 8 · Frontal eye field')]:add(key,start,end,title)

    section(11,'White matter · association, commissural & projection')
    add('association',0,2,'Association fibers'); add('association',3,5,'Short association fibers'); add('association',6,7,'Long association fibers'); add('commissural',8,10,'Commissural fibers'); add('callosum',11,12,'Corpus callosum')
    for name,at in [('Rostrum',{'z':.80,'y':.07}),('Genu',{'z':.96,'y':.52}),('Body',{'z':.5,'y':.93}),('Splenium',{'z':.07,'y':.57})]:add('callosum',12,title=f'Corpus callosum · {name.lower()}',anchor_at=at,anchor_label=name)
    for line,key in [(13,'anterior-commissure'),(14,'posterior-commissure'),(15,'habenular-commissure'),(16,'fornix-commissure')]:add(key,line,title=structures[key]['name'])
    add('projection',17,19,'Projection fibers')
    chapters.append({'id':'explore','name':'Lecture complete · explore every structure'})
    steps.append(dict(id='complete-slide-literal',chapter='explore',structure='cerebrum',title='Lecture complete · explore every structure',name='Lecture complete',page=11,printed_page=11,pins=['cerebrum'],view='lateral',mode='explorer',targets=structures['cerebrum']['meshes'],text='You have reached the last point of slide 11.',bullets=[],source_lines=[],source_excerpt='',related=[],utility=True))
    for point in steps:
        page_points=[s for s in steps if s['page']==point['page'] and not s.get('utility')]
        point['slide_item']=page_points.index(point)+1 if point in page_points else len(page_points); point['slide_items']=len(page_points)
    for source in SOURCE['pages']:
        covered={line for point in steps if point['page']==source['page'] for line in point['source_lines']}
        assert covered==set(range(len(source['lines']))),(source['page'],set(range(len(source['lines'])))-covered)
    for a,b in zip(steps,steps[1:]):
        assert a['page']<=b['page']
        if a['page']==b['page'] and a['source_lines'] and b['source_lines']:assert a['source_lines'][0]<=b['source_lines'][0]
    return chapters,steps
