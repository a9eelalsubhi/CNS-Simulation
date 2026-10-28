"""Retain original CNS/cranial geometry; copy only the supplied lecture figures."""
from pathlib import Path
from pypdf import PdfReader
import copy, json, re, shutil, struct

ROOT=Path(__file__).resolve().parent
WORK=ROOT.parent
PUBLIC=ROOT/'public'
old=json.loads((PUBLIC/'data/brainstem-structures.json').read_text(encoding='utf8'))
known={m['name']:m for m in old['meshes']}
extra_nerves=['Olfactory nerve (I)','Optic nerve (II)','Optic chiasm','Optic tract','Motor root of trigeminal nerve','Sensory root of trigeminal nerve','Ophthalmic nerve','Maxillary nerve','Anterior division of mandibular nerve','Posterior division of mandibular nerve','Meningeal branch of maxillary nerve','Inferior alveolar nerve','Lingual nerve','Chorda tympani','Cochlear nerve','Vestibular nerve']
extra_nerves+=['Buccal nerve','Mental nerve','Nerve to mylohyoid muscle']
organs=['Retina','Sclera','Lens','Iris','Cornea','Cochlea','Vestibule','Lacrimal gland','Lateral geniculate body']
muscles=['Superior rectus muscle','Inferior rectus muscle','Medial rectus muscle','Lateral rectus muscle','Superior oblique muscle','Inferior oblique muscle','Levator palpebrae superioris','Trochlea of superior oblique muscle','Temporalis muscle','Superficial part of masseter','Deep part of masseter','Medial pterygoid muscle','Superior head of lateral pterygoid muscle','Inferior head of lateral pterygoid muscle','Buccinator muscle','Orbicularis oris muscle','Orbital part of orbicularis oculi','Palpebral part of orbicularis oculi','Genioglossus muscle','Hyoglossus muscle','Styloglossus muscle','Mylohyoid muscle','Anterior belly of digastric muscle','Posterior belly of digastric muscle','Stylohyoid muscle','Stylopharyngeus muscle','Sternocleidomastoid muscle','Descending part of trapezius muscle','Transverse part of trapezius muscle','Ascending part of trapezius muscle']
muscles+=['Frontalis muscle','Occipitalis muscle','Zygomaticus major muscle','Zygomaticus minor muscle','Risorius muscle','Depressor anguli oris','Depressor labii inferioris','Mentalis muscle','Levator anguli oris','Levator labii superioris','Superior pharyngeal constrictor','Middle pharyngeal constrictor','Inferior pharyngeal constrictor','Palatopharyngeus muscle','Posterior crico-arytenoid muscle','Lateral crico-arytenoid muscle','Oblique part of cricothyroid muscle','Straight part of cricothyroid muscle']
viscera=['Tongue','Mucosa of nasal cavity','Parotid gland','Submandibular gland','Sublingual gland','Soft palate','Uvula of palate','Nasopharynx','Oropharynx','Laryngopharynx','Epiglottis','Trachea','Oesophagus','Stomach','Superior lobe of left lung','Superior lobe of right lung']
vessels=['Internal carotid artery','Left common carotid artery','Right common carotid artery','Ascending aorta','Thoracic aorta','Left subclavian artery','Right subclavian artery','Right atrium','Left atrium','Right ventricle','Left ventricle']
bones=['Frontal bone','Parietal bone','Temporal bone','Sphenoid bone','Ethmoid bone','Occipital bone','Maxilla','Mandible','Zygomatic bone','Nasal bone','Hyoid bone']
colors={'cn-nerves':'#efc66b','cn-organs':'#82cfd8','cn-muscles':'#d77f9e','cn-bones':'#c5becd','cn-vessels':'#e78098'}
def base(n):return re.sub(r'\.[lr]$','',n)
out={'asset':{'version':'2.0','generator':'CNS Atlas: original licensed source subsets, transforms unchanged'},'extensionsUsed':['KHR_draco_mesh_compression'],'extensionsRequired':['KHR_draco_mesh_compression'],'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'accessors':[],'bufferViews':[],'buffers':[{'byteLength':0}]}
binary=bytearray();items=[];seen=set()
for system in ['nervous','muscular','skeletal','visceral','cardiovascular']:
    raw=(WORK/f'tmp/{system}_male.glb').read_bytes();size=struct.unpack_from('<I',raw,12)[0]
    j=json.loads(raw[20:20+size]);blob=raw[28+size:];views={};accessors={}
    def view(i):
        if i not in views:
            v=copy.deepcopy(j['bufferViews'][i]);start=v.get('byteOffset',0)
            binary.extend(b'\0'*((-len(binary))%4));v.update(buffer=0,byteOffset=len(binary))
            binary.extend(blob[start:start+v['byteLength']]);views[i]=len(out['bufferViews']);out['bufferViews'].append(v)
        return views[i]
    def accessor(i):
        if i not in accessors:
            a=copy.deepcopy(j['accessors'][i]);assert not a.get('sparse')
            if 'bufferView'in a:a['bufferView']=view(a['bufferView'])
            accessors[i]=len(out['accessors']);out['accessors'].append(a)
        return accessors[i]
    for n in j['nodes']:
        name=n.get('name','');b=base(name);group=None
        if system=='nervous':
            if name in known:meta=copy.deepcopy(known[name])
            elif b in extra_nerves:group='cn-nerves'
            elif b in organs or 'semicircular' in b.lower():group='cn-organs'
            else:continue
        elif system=='muscular':
            if b not in muscles:continue
            group='cn-muscles'
        elif system=='skeletal':
            if b not in bones:continue
            group='cn-bones'
        elif system=='visceral':
            if b not in viscera:continue
            group='cn-organs'
        else:
            if b not in vessels:continue
            group='cn-organs' if b.endswith(('atrium','ventricle')) else 'cn-vessels'
        if name in seen:continue
        seen.add(name)
        if group:meta=dict(name=name,base=b,group=group,side='left' if name.endswith('.l') else 'right' if name.endswith('.r') else 'midline',color=colors[group])
        if meta['group']=='stem-nerves':meta['group']='cn-nerves'
        # Upstream omits '.r' on this ONE unilateral node. Decoded source
        # vertices are x=-.0405..-.0188 m; its .l counterpart is x>0.
        # Treating it as midline left a floating right nerve in left-ear views.
        if name=='Cochlear nerve':meta['side']='right'
        meta['source_system']=system
        assert 'mesh'in n and not n.get('children')
        node=copy.deepcopy(n);mesh=copy.deepcopy(j['meshes'][n['mesh']])
        for p in mesh['primitives']:
            p.pop('material',None);p['attributes']={k:accessor(v) for k,v in p['attributes'].items()}
            if 'indices'in p:p['indices']=accessor(p['indices'])
            p['extensions']['KHR_draco_mesh_compression']['bufferView']=view(p['extensions']['KHR_draco_mesh_compression']['bufferView'])
        node['mesh']=len(out['meshes']);node.setdefault('extras',{})['anatomyName']=name
        out['meshes'].append(mesh);out['scenes'][0]['nodes'].append(len(out['nodes']));out['nodes'].append(node);items.append(meta)
out['buffers'][0]['byteLength']=len(binary);binary.extend(b'\0'*((-len(binary))%4))
encoded=json.dumps(out,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
(PUBLIC/'models/cranial.glb').write_bytes(struct.pack('<III',0x46546c67,2,28+len(encoded)+len(binary))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(binary),0x004e4942)+binary)
(PUBLIC/'data/cranial-structures.json').write_text(json.dumps({'groups':old['groups'],'colors':old['colors'],'meshes':items},indent=2),encoding='utf8')
slides=PUBLIC/'slides/cranial';slides.mkdir(exist_ok=True)
for i in range(1,18):shutil.copy2(WORK/f'tmp/cranial-pdfs/lecture-{i:02d}.jpg',slides/f'slide-{i:02d}.jpg')
for i in range(1,5):shutil.copy2(WORK/f'tmp/cranial-pdfs/memory-{i}.jpg',slides/f'memory-{i}.jpg')
print(f'Cranial atlas: {len(items)} unchanged source meshes; 17 lecture pages + 4 memory-map pages.')
