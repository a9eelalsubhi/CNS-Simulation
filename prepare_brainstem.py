"""Source-preserving brainstem export and extraction of the user's own plates.

The atlas uses the same BodyParts3D subject for brain and skeleton. We copy
original compressed primitives and node transforms, never fit a brain into a
separately scaled skull. Small internal structures absent from the export are
taught using the actual lecture sections, not fabricated surface patches.
"""
from pathlib import Path
import copy, hashlib, json, re, shutil, struct
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parent
WORK=ROOT.parent
DIST=ROOT/'public'
PDF=Path('C:/3. Study - دراسة/ANATOMY/L2 - Brain Stem.pdf')

def read_glb(path):
    raw=path.read_bytes(); length=struct.unpack_from('<I',raw,12)[0]
    return json.loads(raw[20:20+length]),raw[28+length:]

def base(name): return name.removesuffix('.l').removesuffix('.r')

old=json.loads((DIST/'data/structures.json').read_text(encoding='utf8'))
inventory={m['name']:m for m in old['meshes']}
EXTRA={
 'stem-surface':['Base of peduncle','Interpeduncular fossa','Superior colliculus','Inferior colliculus','Olive','Pyramid of medulla oblongata','Superior cerebellar peduncle'],
 'stem-internal':['Red nucleus','Nucleus of oculomotor nerve','Accessory nucleus of oculomotor nerve','Nucleus of trochlear nerve','Nucleus of abducens nerve','Motor nucleus of facial nerve','Vestibular nuclei','Anterior cochlear nucleus','Posterior cochlear nucleus','Superior salivatory nucleus','Inferior salivatory nucleus','Posterior nucleus of vagus nerve','Nucleus of hypoglossal nerve','Nucleus ambiguus'],
 'stem-csf':['Aqueduct of midbrain','Fourth ventricle'],
 'stem-nerves':['Oculomotor nerve (III)','Trochlear nerve (IV)','Trigeminal nerve (V)','Abducens nerve (VI)','Facial nerve (VII)','Vestibulocochlear nerve (VIII)','Glossopharyngeal nerve (IX)','Vagus nerve (X)','Accessory nerve (XI)','Hypoglossal nerve (XII)','Optic chiasm','Optic tract'],
 'stem-columns':['Gracile fasciculus','Cuneate fasciculus'],
}
colors={'stem-surface':'#66d2cb','stem-internal':'#f3d278','stem-csf':'#7bbcf2','stem-nerves':'#edb8ec','stem-columns':'#98d7ad','stem-vessels':'#f08d96'}
sources=[(WORK/'tmp/nervous_male.glb',None),(WORK/'tmp/cardiovascular_male.glb','stem-vessels')]
out={'asset':{'version':'2.0','generator':'CNS Atlas source-preserving subset'},'extensionsUsed':['KHR_draco_mesh_compression'],'extensionsRequired':['KHR_draco_mesh_compression'],'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'accessors':[],'bufferViews':[],'buffers':[{'byteLength':0}]}
binary=bytearray(); items=[]
for path,system in sources:
    source,blob=read_glb(path)
    view_map={}; acc_map={}
    def view(index):
        if index not in view_map:
            v=source['bufferViews'][index]; binary.extend(b'\0'*((-len(binary))%4))
            new=copy.deepcopy(v);new.update(buffer=0,byteOffset=len(binary))
            binary.extend(blob[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']])
            view_map[index]=len(out['bufferViews']);out['bufferViews'].append(new)
        return view_map[index]
    def accessor(index):
        if index not in acc_map:
            a=copy.deepcopy(source['accessors'][index]); assert not a.get('sparse')
            if 'bufferView' in a:a['bufferView']=view(a['bufferView'])
            acc_map[index]=len(out['accessors']);out['accessors'].append(a)
        return acc_map[index]
    for n in source['nodes']:
        name=n.get('name',''); b=base(name)
        group=next((g for g,names in EXTRA.items() if b in names),None)
        if system:
            if b not in ['Basilar artery','Vertebral artery']:continue
            group=system
        elif name not in inventory and not group:continue
        meta=copy.deepcopy(inventory.get(name,{}))
        if group:meta.update(name=name,base=b,group=group,side='left' if name.endswith('.l') else 'right' if name.endswith('.r') else 'midline',color=colors[group])
        assert 'mesh' in n and not n.get('children')
        new=copy.deepcopy(n); mesh=copy.deepcopy(source['meshes'][n['mesh']])
        for p in mesh['primitives']:
            p.pop('material',None)
            p['attributes']={k:accessor(v) for k,v in p['attributes'].items()}
            if 'indices' in p:p['indices']=accessor(p['indices'])
            p['extensions']['KHR_draco_mesh_compression']['bufferView']=view(p['extensions']['KHR_draco_mesh_compression']['bufferView'])
        new['mesh']=len(out['meshes']);new.setdefault('extras',{}).update(anatomyName=name,group=meta['group'])
        out['meshes'].append(mesh);out['scenes'][0]['nodes'].append(len(out['nodes']));out['nodes'].append(new);items.append(meta)
out['buffers'][0]['byteLength']=len(binary);binary.extend(b'\0'*((-len(binary))%4))
encoded=json.dumps(out,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
(DIST/'models/brainstem.glb').write_bytes(struct.pack('<III',0x46546c67,2,28+len(encoded)+len(binary))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(binary),0x004e4942)+binary)
(DIST/'data/brainstem-structures.json').write_text(json.dumps({'groups':{**old['groups'],**EXTRA},'colors':{**old['colors'],**colors},'meshes':items},indent=2),encoding='utf8')
shutil.copy2(WORK/'anatomy-explorer/public/models/skeletal.glb',DIST/'models/body-context.glb')

r=PdfReader(PDF);pages=[];slides=DIST/'slides/brainstem';slides.mkdir(exist_ok=True)
for i,page in enumerate(r.pages,1):
    lines=[re.sub(r'\s+',' ',s.strip()) for s in (page.extract_text() or '').splitlines()]
    lines=[s for s in lines if s and not s.startswith('ARTIST OF ANATOMY') and not re.fullmatch(r'\d+',s)]
    pages.append({'page':i,'printed_page':i+11,'lines':lines})
    shutil.copy2(WORK/f'tmp/brainstem-page-{i}.jpg',slides/f'slide-{i:02d}.jpg')

# These are the embedded, unaltered lecture illustrations. The enlarged full
# slide retains every highlight and handwritten annotation from the PDF.
plates={'anterior':(1,'Image120.jpg'),'location':(1,'Image119.jpg'),'posterior':(2,'Image127.jpg'),'inferior':(3,'Image130.jpg'),'superior':(4,'Image135.jpg'),'pons':(6,'Image148.jpg'),'medulla-anterior':(7,'Image153.jpg'),'medulla-posterior':(8,'Image160.jpg'),'medulla':(9,'Image163.jpg')}
for key,(p,name) in plates.items():
    im=next(im for im in r.pages[p-1].images if im.name==name)
    im.image.convert('RGB').save(slides/f'{key}.jpg',quality=95)
source={'file':PDF.name,'sha256':hashlib.sha256(PDF.read_bytes()).hexdigest(),'page_count':len(pages),'pages':pages}
(ROOT/'brainstem-source.json').write_text(json.dumps(source,ensure_ascii=False,indent=2),encoding='utf8')
(DIST/'data/brainstem-source.json').write_text(json.dumps(source,ensure_ascii=False,indent=2),encoding='utf8')
print(f'Brainstem: {len(items)} original meshes, {len(pages)} lecture slides, {sum(len(p["lines"]) for p in pages)} source lines. Source transforms preserved.')
