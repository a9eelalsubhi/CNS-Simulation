"""Lecture 3: every text line + visually transcribed image-only pages, in PDF order."""
from pathlib import Path
import json, copy
ROOT=Path(__file__).resolve().parent;P=ROOT/'public'
source=json.loads((ROOT.parent/'tmp/cranial-pdfs/source-clean.json').read_text(encoding='utf8'))
pages=source['pages']
# PDF drawing order puts this callout after the footer; restore its VISUAL order.
lines=pages[13]['lines'];pages[13]['lines']=lines[:4]+lines[22:26]+lines[4:22]
pages[1]['lines']=[
 'Cribriform plate of ethmoid bone: 1: Olfactory nerve',
 'Optic canal: 2: Optic nerve',
 'Superior orbital fissure: 3: Oculomotor nerve; 4: Trochlear nerve; 6: Abducent nerve; 5₁: branches of Ophthalmic nerve (lacrimal, frontal, nasociliary)',
 'Foramen Rotundum: 5₂: Maxillary nerve',
 'Foramen Ovale: 5₃: Mandibular nerve',
 'Internal auditory meatus: 7: facial nerve; 8: vestibulo-cochlear nerve',
 'Jugular foramen: 9: glossopharyngeal nerve; 10: vagus nerve; 11: accessory nerve',
 'Hypoglossal canal: 12: Hypoglossal nerve',
 'Foramen magnum', 'Foramen lacerum', 'Foramen spinosum',
 'Mid B: 3, 4; Pons: 5, 6, 7, 8; M.O.: 9, 10, 11, 12',
 'Cavernous sinus cross-section: lateral-wall nerves; ICA; SS; PG',
]
pages[1]['transcription']='Visually transcribed labels of the supplied skull-base, brainstem and cavernous-sinus drawings; source annotations remain in the full slide.'
pages[6]['lines']=pages[6]['lines'][:9]+['Branches:','From maxillary nerve:','1) Ganglionic branches','2) Zygomatic branch','3) Meningeal branch','4) Posterior superior alveolar nerve','From infraorbital nerve:','5) Middle superior alveolar nerve','6) Anterior superior alveolar nerve','7) terminal branches']
pages[15]['lines']=[
 'Cranial nerves & Nuclei - summary table',
 'I Olfactory - Sensory (SVA). Smell. Openings in cribriform plate of ethmoid.',
 'II Optic - Sensory (SSA). Vision. Optic canal.',
 'III Oculomotor - Motor (GSE, GVE). Raises upper eyelid, turns eyeball upward, downward, and medially; constricts pupil; accommodates eye. Superior orbital fissure.',
 'IV Trochlear - Motor (GSE). Assists in turning eyeball downward and laterally. Superior orbital fissure.',
 'V Trigeminal - Ophthalmic division: Sensory (GSA). Cornea, skin of forehead, scalp, eyelids, and nose; also mucous membrane of paranasal sinuses and nasal cavity. Superior orbital fissure.',
 'Maxillary division: Sensory (GSA). Skin of face over maxilla; teeth of upper jaw; mucous membrane of nose, the maxillary sinus, and palate. Foramen rotundum.',
 'Mandibular division: Motor (SVE). Muscles of mastication, mylohyoid, anterior belly of digastric, tensor veli palatini, and tensor of tympani. Foramen ovale.',
 'Mandibular division: Sensory (GSA). Skin of cheek, skin over mandible and side of head, teeth of lower jaw and temporomandibular joint, mucous membrane of mouth and anterior part of tongue.',
 'VI Abducent - Motor (GSE). Lateral rectus muscle turns eyeball laterally. Superior orbital fissure.',
]
pages[16]['lines']=[
 'VII Facial - Motor (SVE). Muscles of face and scalp, stapedius muscle, posterior belly of digastric, and stylohyoid muscles. Internal acoustic meatus, facial canal, stylomastoid foramen.',
 'Sensory (SVA). Taste from anterior two thirds of tongue, from floor of mouth and palate.',
 'Secretomotor (GVE) parasympathetic. Submandibular and sublingual salivary glands, the lacrimal gland, and glands of nose and palate.',
 'VIII Vestibulocochlear - Vestibular: Sensory (SSA). From utricle and saccule and semicircular canals - position and movement of head. Internal acoustic meatus.',
 'Cochlear: Sensory (SSA). Organ of Corti - hearing.',
 'IX Glossopharyngeal - Motor (SVE). Stylopharyngeus muscle - assists swallowing. Jugular foramen.',
 'Secretomotor (GVE) parasympathetic. Parotid salivary gland.',
 'Sensory (GVA, SVA, GSA). General sensation and taste from posterior one third of tongue and pharynx; carotid sinus (baroreceptor); and carotid body (chemoreceptor).',
 'X Vagus - Motor (GVE, SVE). Sensory (GVA, SVA, GSA). Heart and great thoracic blood vessels; larynx, trachea, bronchi, and lungs; alimentary tract from pharynx to splenic flexure of colon; liver, kidneys, and pancreas. Jugular foramen.',
 'XI Accessory - Cranial root: Motor (SVE). Muscles of soft palate (except tensor veli palatini), pharynx (except stylopharyngeus), and larynx (except cricothyroid) in branches of vagus. Jugular foramen.',
 'Spinal root: Motor (SVE). Sternocleidomastoid and trapezius muscles.',
 'XII Hypoglossal - Motor (GVE). Muscles of tongue (except palatoglossus) controlling its shape and movement. Hypoglossal canal.',
]
for i in [15,16]:pages[i]['transcription']='Visually transcribed row-by-row from the embedded summary table. Source wording is retained; corrections are separate reference notes.'
for p in pages:p['printed_page']=p['page']+20 if p['page']<=15 else p['page']+22
source['file']=source.pop('source_file');source['page_count']=17
(ROOT/'cranial-source.json').write_text(json.dumps(source,ensure_ascii=False,indent=2),encoding='utf8')
(P/'data/cranial-source.json').write_text(json.dumps(source,ensure_ascii=False,indent=2),encoding='utf8')
inv=json.loads((P/'data/cranial-structures.json').read_text(encoding='utf8'))
N={m['name'] for m in inv['meshes']}
def meshes(*bases):
 result=[m['name'] for m in inv['meshes'] if m['base'] in bases]
 assert result, bases
 return result
CN={1:'Olfactory nerve (I)',2:'Optic nerve (II)',3:'Oculomotor nerve (III)',4:'Trochlear nerve (IV)',5:'Trigeminal nerve (V)',6:'Abducens nerve (VI)',7:'Facial nerve (VII)',8:'Vestibulocochlear nerve (VIII)',9:'Glossopharyngeal nerve (IX)',10:'Vagus nerve (X)',11:'Accessory nerve (XI)',12:'Hypoglossal nerve (XII)'}
AR=['الشمي','البصري','المحرك للعين','البكري','ثلاثي التوائم','المُبعِد','الوجهي','الدهليزي القوقعي','اللساني البلعومي','المبهم','الإضافي','تحت اللسان']
COLORS=['#edac6f','#78d9e8','#f6ce69','#c4a1f3','#6bd9bb','#e9a0cd','#f195a7','#91cce9','#b8d67b','#c7a5ed','#f1bd77','#ea9ec8']
FN={1:'smell',2:'vision',3:'eye',4:'eye',5:'chew',6:'eye',7:'face',8:'hearing',9:'swallow',10:'voice',11:'shoulder',12:'tongue'}
structures=[];S={};steps=[]
def add(id,name,bases,page,cn=0,view='anterior',visual=None,note=None):
 e=dict(id=id,name=name,meshes=meshes(*bases),page=page,view=view,mode='cranial',kind='anatomical',text=name,bullets=[],aliases=[id.replace('-',' '),AR[cn-1] if cn else name],references=[],side='both',color=COLORS[cn-1] if cn else '#9ddbcf',cn=cn,function=FN.get(cn,'overview'))
 if visual:e['visual']=visual
 if note:e['clarification']=note
 structures.append(e);S[id]=e;return e
for cn,base in CN.items():add('cn'+str(cn),base,[base],{1:3,2:3,3:4,4:5,5:6,6:5,7:10,8:12,9:13,10:14,11:15,12:15}[cn],cn,view='posterior' if cn==4 else 'anterior')
def chain(key,labels,target=None):return dict(map='chain',key=key,nodes=[dict(id=i,label=t) for i,t in labels],target=target or labels[0][0])
gates=[('cribriform','Cribriform plate','I',[1]),('optic','Optic canal','II',[2]),('sof','Superior orbital fissure','III · IV · V1 · VI',[3,4,5,6]),('rotundum','Foramen rotundum','V2',[5]),('ovale','Foramen ovale','V3',[5]),('iam','Internal acoustic meatus','VII · VIII',[7,8]),('jugular','Jugular foramen','IX · X · XI',[9,10,11]),('hypoglossal','Hypoglossal canal','XII',[12]),('magnum','Foramen magnum','XI enters',[11]),('lacerum','Foramen lacerum','Slide landmark',[]),('spinosum','Foramen spinosum','Slide landmark',[])]
for key,name,label,cns in gates:add('gate-'+key,name,[CN[c] for c in cns] or ['Sphenoid bone'],2,cns[0] if cns else 0,visual=dict(map='gates',target=key),note='The skull-base map is a simplified 3D relationship diagram. Its colored openings are diagram objects, not a measured segmentation of skull foramina.')
add('types','12 cranial nerves - sensory / motor / mixed',list(CN.values()),1,visual=dict(map='types',target='all'))
add('origins','Apparent emergence - forebrain to spinal cord',list(CN.values()),2,visual=dict(map='origins',target='pons'),note='CN V emerges from the pons; VI-VIII at the pontomedullary junction. CN XI spinal root arises in upper cervical cord. The memory group IX-XII must not be mistaken for four medullary origins.')
add('cavernous','Cavernous sinus - wall versus sinus',['Oculomotor nerve (III)','Trochlear nerve (IV)','Ophthalmic nerve','Maxillary nerve','Abducens nerve (VI)'],2,visual=dict(map='cavernous',target='vi'))
olf=chain('olfactory',[('mucosa','Olfactory mucosa'),('fibers','CN I fibers'),('bulb','Olfactory bulb'),('tract','Olfactory tract'),('stria','Lateral olfactory stria'),('cortex','Primary olfactory cortex')])
optic=chain('optic',[('retina','Retinal ganglion cells'),('nerve','Optic nerve II'),('chiasm','Optic chiasm'),('tract','Optic tract'),('lgb','Lateral geniculate body'),('radiation','Optic radiation'),('cortex','Occipital visual cortex')])
add('retina','Retina',['Retina'],3,2,view='lateral')
add('optic-chiasm','Optic chiasm',['Optic chiasm'],3,2,view='inferior')
add('optic-tract','Optic tract',['Optic tract'],3,2,view='inferior')
add('lgb','Lateral geniculate body',['Lateral geniculate body'],3,2,view='inferior')
add('eye-superior','Superior division - superior rectus + levator',['Superior rectus muscle','Levator palpebrae superioris'],4,3,view='lateral')
add('eye-inferior','Inferior division - MR / IR / IO',['Medial rectus muscle','Inferior rectus muscle','Inferior oblique muscle'],4,3,view='lateral')
add('levator','Levator palpebrae superioris',['Levator palpebrae superioris'],4,3,view='lateral')
add('superior-oblique','Superior oblique - CN IV',['Superior oblique muscle','Trochlea of superior oblique muscle'],5,4,view='lateral')
add('lateral-rectus','Lateral rectus - CN VI',['Lateral rectus muscle'],5,6,view='lateral')
add('v-motor','Small motor root of V',['Motor root of trigeminal nerve'],6,5)
add('v-sensory','Large sensory root of V',['Sensory root of trigeminal nerve'],6,5)
add('v1','V1 - Ophthalmic nerve',['Ophthalmic nerve'],6,5)
add('v2','V2 - Maxillary nerve',['Maxillary nerve'],7,5,view='lateral')
add('v3','V3 - Mandibular divisions',['Anterior division of mandibular nerve','Posterior division of mandibular nerve'],8,5,view='lateral')
add('mastication','Muscles of mastication',['Temporalis muscle','Superficial part of masseter','Medial pterygoid muscle','Inferior head of lateral pterygoid muscle'],8,5,view='lateral')
add('lingual','Lingual nerve - general sensation',['Lingual nerve'],9,5,view='lateral')
add('chorda','Chorda tympani - taste',['Chorda tympani'],9,7,view='lateral')
add('alveolar','Inferior alveolar nerve',['Inferior alveolar nerve'],9,5,view='lateral')
add('mylohyoid','Mylohyoid + anterior digastric',['Mylohyoid muscle','Anterior belly of digastric muscle'],9,5,view='inferior')
add('lacrimal','Lacrimal gland',['Lacrimal gland'],11,7,view='lateral')
add('digastric-posterior','Posterior digastric + stylohyoid',['Posterior belly of digastric muscle','Stylohyoid muscle'],11,7,view='lateral')
add('face-muscles','Facial expression muscles',['Orbicularis oris muscle','Palpebral part of orbicularis oculi','Orbital part of orbicularis oculi'],11,7)
add('cochlea','Cochlea - hearing',['Cochlea','Cochlear nerve'],12,8,view='lateral')
add('vestibule','Vestibule - balance',['Vestibule','Vestibular nerve'],12,8,view='lateral')
add('scm','Sternocleidomastoid - head turning',['Sternocleidomastoid muscle'],15,11,view='lateral')
add('trapezius','Trapezius - shoulder elevation',['Descending part of trapezius muscle'],15,11,view='posterior')
add('tongue-muscles','Tongue muscles - CN XII',['Genioglossus muscle','Hyoglossus muscle'],15,12,view='lateral',note='CN XII supplies intrinsic and most extrinsic tongue muscles. Palatoglossus is supplied through the vagus/pharyngeal plexus. The tongue summary table labels XII as GVE; standard classification is GSE (somatic motor).')
NOTES={
 'pupil':'CN III carries parasympathetic fibers to sphincter pupillae and ciliary muscle. The iris dilator is sympathetically supplied; the slide phrase “all intrinsic muscles” is too broad. Near-vision accommodation and pupillary constriction are different functions.',
 'trochlear':'CN IV axons cross before the nerve emerges dorsally, in the superior medullary velum. Superior oblique intorts and depresses the adducted eye, with an abducting component. Clinical downward testing is performed in adduction; a generic downward arrow does not describe every eye position.',
 'carotid':'The carotid sinus afferent is carried by IX. Hypersensitivity/syncope describes excessive reflex activation (and can accompany neuralgia), not the usual consequence of a destructive IX lesion.',
 'xi':'The slide uses the traditional cranial/spinal accessory description. Modern clinical anatomy assigns the cranial fibers to the vagus; spinal XI supplies SCM and trapezius. Do not infer that spinal XI supplies the palate.',
 'gag':'Gag reflex: IX is the classical afferent limb and X the efferent limb. An absent gag alone is not a diagnosis; the diagram teaches the nerve relationship.',
 'tensor':'The tensor tympani branch belongs to V3. The slide links its paralysis with partial low-frequency deafness; do not confuse this with the cochlear sensory pathway or with stapedius denervation (VII), which can cause hyperacusis.',
 'parotid':'Facial nerve VII passes through the parotid gland but does not provide its secretomotor supply. Parotid parasympathetic fibers originate with IX and reach the gland via the otic ganglion and auriculotemporal nerve (V3).',
}
def point(page,a,b,id,title=None,visual=None,function=None,note=None,context=None):
 e=S[id];lines=pages[page-1]['lines'][a:b+1];assert lines,(page,a,b)
 s=dict(id=f'cn-{page}-{a}-{id}',chapter=f'page-{page}',structure=id,title=title or e['name'],name=title or e['name'],page=page,printed_page=pages[page-1]['printed_page'],pins=[id],view=e['view'],hemisphere='both',mode='cranial',targets=e['meshes'],text=lines[0],bullets=lines[1:],source_lines=list(range(a,b+1)),source_excerpt='\n'.join(lines),function=function or e['function'],visual=copy.deepcopy(visual or e.get('visual',{})),context_bases=context or [],cn=e['cn'])
 if page==1:s['color']={'sensory':'#70c8b8','motor':'#bca4e1','mixed':'#e0b977'}.get(s['visual'].get('target'),'#70c8b8')
 if page==17 and a==8:s['scope']='body'
 if s['visual'].get('map') in ['face','facial']:s['function']='face'
 if s['visual'].get('map')=='tongue':s['function']='taste'
 if s['visual'].get('map')=='corneal':s['function']='blink'
 if s['visual'].get('map')=='gag':s['function']='swallow'
 if note:s['clarification']=NOTES.get(note,note)
 # An isolated extraocular muscle is difficult to orient without the globe.
 # Keep the original, aligned sclera/lens as translucent context, and study
 # one orbit in lateral view instead of superimposing both paired muscles.
 if not s['visual'].get('map') and id in ['retina','eye-superior','eye-inferior','levator','superior-oblique','lateral-rectus']:
  s['context_bases']=list(dict.fromkeys(s['context_bases']+['Sclera','Lens']))
  s['hemisphere']='left'
  if id=='superior-oblique' and not function:s['function']='lookdown'
 steps.append(s)
 if e['text']==e['name']:e.update(text=lines[0],bullets=lines[1:])
 return s
def target(v,key):r=copy.deepcopy(v);r['target']=key;return r
def branch(key,labels,selected=0):return chain(key,[(str(i),label)for i,label in enumerate(labels)],str(selected))|{'map':'branches'}
point(1,0,1,'types','12 pairs - three functional groups')
for i,k in enumerate(['sensory','motor','mixed'],2):point(1,i,i,'types',k.title()+' cranial nerves',visual=dict(map='types',target=k))
for i,(key,*_)in enumerate(gates):point(2,i,i,'gate-'+key)
point(2,11,11,'origins');point(2,12,12,'cavernous')
point(3,0,1,'cn1','I - olfactory neurons',visual=target(olf,'mucosa'),function='smell')
for a,b,key in [(2,2,'fibers'),(3,3,'bulb'),(4,4,'tract'),(5,7,'cortex')]:point(3,a,b,'cn1',dict(fibers='Fibers through cribriform plate',bulb='Olfactory bulb',tract='Olfactory tract',cortex='Stria to primary olfactory cortex')[key],visual=target(olf,key))
point(3,8,10,'cn1','Olfactory injury - ipsilateral anosmia')
point(3,11,12,'retina','II - retina and visual input');point(3,13,13,'cn2','Optic nerve through optic canal')
point(3,14,14,'optic-chiasm');point(3,15,15,'optic-tract');point(3,16,16,'lgb')
point(3,17,19,'cn2','Optic radiation to primary visual cortex',visual=target(optic,'radiation'))
point(4,0,1,'cn3','III - ventral midbrain origin');point(4,2,2,'cn3','III in the cavernous sinus wall',visual=dict(map='cavernous',target='iii'))
point(4,3,4,'cn3','Two divisions through SOF',visual=dict(map='gates',target='sof'))
point(4,5,6,'cn3','Eye muscles - all except LR and SO',context=['Superior rectus muscle','Inferior rectus muscle','Medial rectus muscle','Inferior oblique muscle'])
point(4,7,7,'eye-superior');point(4,8,8,'eye-inferior')
pupil=chain('pupil',[('iii','CN III'),('ciliary','Ciliary ganglion'),('sphincter','Sphincter pupillae'),('lens','Ciliary muscle / lens')])
point(4,9,10,'cn3','Parasympathetic supply - pupil and accommodation',visual=target(pupil,'sphincter'),note='pupil')
point(4,11,12,'levator','Upper eyelid and eye movement');point(4,13,13,'cn3','Near vision and pupillary constriction',visual=target(pupil,'lens'),note='pupil')
point(4,14,15,'levator','III lesion - ptosis',function='ptosis');point(4,16,16,'cn3','III lesion - fixed dilated pupil',function='dilated',note='pupil')
point(4,17,18,'cn3','III lesion - down and out / diplopia',function='downout')
point(5,0,2,'cn4','IV - smallest nerve and dorsal exit',note='trochlear')
point(5,3,4,'cn4','IV crossing - reference correction',note='trochlear')
point(5,5,6,'cn4','IV through wall and SOF',visual=dict(map='cavernous',target='iv'))
point(5,7,8,'superior-oblique');point(5,9,12,'superior-oblique','IV lesion - looking down',function='lookdown',note='trochlear')
point(5,13,15,'cn6','VI - pontomedullary origin');point(5,16,16,'cn6','VI travels beside ICA',visual=dict(map='cavernous',target='vi'))
point(5,17,17,'cn6','VI through SOF',visual=dict(map='gates',target='sof'));point(5,18,18,'lateral-rectus')
point(5,19,21,'lateral-rectus','VI lesion - internal strabismus',function='esotropia')
point(6,0,1,'cn5','V - largest cranial nerve');point(6,2,3,'v-sensory','V - large sensory / small motor roots',context=['Motor root of trigeminal nerve'])
point(6,4,4,'cn5','Trigeminal ganglion',visual=branch('trigeminal',['Trigeminal ganglion','V1 Ophthalmic','V2 Maxillary','V3 Mandibular']))
point(6,5,5,'cn5','Three divisions of V',visual=dict(map='face',target='all'))
point(6,6,7,'v1','V1 - sensory, lateral wall',visual=dict(map='face',target='v1'))
point(6,8,9,'v1','V1 branches through SOF',visual=branch('v1',['V1 Ophthalmic','Lacrimal','Frontal','Nasociliary']))
point(7,0,1,'v2','V2 - sensory division');point(7,2,3,'v2','V2 through foramen rotundum',visual=dict(map='gates',target='rotundum'))
point(7,4,5,'v2','Pterygopalatine fossa to orbit',visual=branch('v2-route',['V2','Foramen rotundum','Pterygopalatine fossa','Inferior orbital fissure'],2))
point(7,6,7,'v2','Infraorbital nerve to face',visual=branch('infraorbital',['V2','Infraorbital nerve','Infraorbital foramen','Face'],2))
point(7,8,8,'v2','V2 sensory territory',visual=dict(map='face',target='v2'))
v2b=['Maxillary nerve','Ganglionic branches','Zygomatic branch','Meningeal branch','Posterior superior alveolar','Middle superior alveolar','Anterior superior alveolar','Terminal branches']
point(7,9,10,'v2','V2 branches',visual=branch('v2-branches',v2b))
for a in range(11,15):point(7,a,a,'v2',v2b[a-10],visual=branch('v2-branches',v2b,a-10))
point(7,15,18,'v2','Infraorbital branches',visual=branch('infraorbital-branches',v2b[4:],1))
point(8,0,2,'v3','V3 - mixed division');point(8,3,3,'v3','V3 through foramen ovale',visual=dict(map='gates',target='ovale'))
point(8,4,5,'v3','V3 trunk and divisions',visual=branch('v3',['V3 trunk','Anterior division','Posterior division']))
point(8,6,6,'v3','Nerve to medial pterygoid',visual=branch('v3-trunk',['V3 trunk','Medial pterygoid','Tensor veli palatini','Tensor tympani'],1))
point(8,7,7,'v3','Nervus spinosus - sensory meningeal branch',visual=branch('v3-meningeal',['V3','Nervus spinosus','Meninges'],1))
point(8,8,9,'mastication','Anterior division - motor branches')
point(8,10,11,'v3','Buccal nerve V3 is sensory - buccinator is VII',visual=branch('buccal',['V3 buccal nerve','Cheek sensation','VII buccal branches','Buccinator motor'],1),function='face')
point(9,0,1,'v3','Posterior division - mylohyoid exception',visual=branch('v3-posterior',['Posterior V3','Auriculotemporal','Lingual','Inferior alveolar','Mylohyoid motor branch'],4))
parotid=chain('parotid',[('ix','CN IX'),('tympanic','Tympanic plexus'),('lesser','Lesser petrosal'),('otic','Otic ganglion'),('auriculo','Auriculotemporal V3'),('gland','Parotid gland')])
point(9,2,3,'v3','Auriculotemporal carries IX fibers',visual=target(parotid,'auriculo'),note='parotid')
point(9,4,5,'lingual','Lingual nerve joined by chorda',context=['Chorda tympani'])
point(9,6,6,'lingual','Anterior 2/3 - general sensation V3',visual=dict(map='tongue',target='general'),function='taste')
point(9,7,7,'chorda','Anterior 2/3 - taste VII',visual=dict(map='tongue',target='taste'),function='taste')
point(9,8,10,'alveolar','Inferior alveolar - lower teeth');point(9,11,11,'alveolar','Incisive and mental branches',visual=branch('alveolar',['Inferior alveolar','Mandibular canal','Incisive','Mental'],2))
point(9,12,13,'mylohyoid');point(9,14,15,'cn5','V lesion - sensory loss',visual=dict(map='face',target='all'),function='face')
point(9,16,16,'v1','Corneal reflex - V1 afferent',visual=dict(map='corneal',target='v1'),function='blink')
point(9,17,18,'mastication','V lesion - weak chewing and jaw deviation',function='jawweak')
point(9,19,20,'v3','Tensor tympani lesion - slide note',visual=branch('tensor',['V3','Nerve to medial pterygoid','Tensor tympani'],2),function='hearing',note='tensor')
point(9,21,21,'cn5','Trigeminal neuralgia',visual=dict(map='face',target='all'),function='face')
point(10,0,1,'cn7','VII - mixed motor and sensory components');point(10,2,3,'cn7','VII - pontomedullary origin')
point(10,4,5,'cn7','VII + VIII through internal acoustic meatus',visual=dict(map='gates',target='iam'))
point(10,6,6,'cn7','Facial canal and geniculate ganglion',visual=branch('facial-course',['VII','Internal acoustic meatus','Facial canal','Geniculate ganglion','Stylomastoid foramen','Parotid / facial muscles'],3))
point(10,7,8,'cn7','Stylomastoid exit, then parotid',visual=branch('facial-course',['VII','Internal acoustic meatus','Facial canal','Geniculate ganglion','Stylomastoid foramen','Parotid / facial muscles'],4),note='parotid')
petrosal=chain('greater-petrosal',[('vii','CN VII'),('petrosal','Greater petrosal'),('canal','Pterygoid canal'),('ganglion','Pterygopalatine ganglion'),('glands','Lacrimal / nasal / palatal glands')])
point(11,0,3,'lacrimal','Greater petrosal - secretomotor route',visual=target(petrosal,'ganglion'))
point(11,4,4,'cn7','Stapedius branch',visual=branch('stapedius',['VII','Nerve to stapedius','Stapedius muscle'],2),function='hearing')
point(11,5,6,'chorda','Chorda tympani - taste',visual=dict(map='tongue',target='taste'),function='taste')
point(11,7,8,'chorda','Chorda - submandibular ganglion',visual=chain('salivation',[('vii','VII / chorda tympani'),('lingual','Lingual carrier'),('ganglion','Submandibular ganglion'),('glands','Submandibular + sublingual glands')],'ganglion'),function='taste')
point(11,9,9,'digastric-posterior');point(11,10,10,'cn7','Posterior auricular - occipitalis',visual=branch('auricular',['VII','Posterior auricular','Occipitalis'],2))
point(11,11,12,'face-muscles','Five terminal facial branches',visual=dict(map='facial',target='all'))
point(11,13,15,'face-muscles','VII lesion - expressionless side',function='lmn')
point(11,16,16,'cn7','Corneal reflex - VII efferent',visual=dict(map='corneal',target='vii'),function='blink')
point(11,17,17,'chorda','VII lesion - anterior tongue taste',visual=dict(map='tongue',target='taste'),function='taste')
point(11,18,18,'cn7','VII lesion - reduced salivation',visual=chain('salivation',[('vii','VII / chorda tympani'),('lingual','Lingual carrier'),('ganglion','Submandibular ganglion'),('glands','Submandibular + sublingual glands')],'glands'))
point(11,19,20,'face-muscles','Mouth pulled toward healthy side',function='lmn')
point(11,21,22,'face-muscles','UMN - lower face weakness / forehead sparing',function='umn',note='Typical unilateral supranuclear facial weakness is contralateral and predominantly lower facial. A peripheral VII lesion causes ipsilateral upper and lower facial weakness.')
point(11,23,24,'face-muscles','LMN - upper and lower face weakness',function='lmn')
point(12,0,1,'cn8','VIII - two sensory components');point(12,2,3,'cn8','VIII with VII through IAM',visual=dict(map='gates',target='iam'))
point(12,4,6,'vestibule','Vestibular receptors and ganglion',function='balance');point(12,7,8,'vestibule','Balance and vestibular lesions',function='balance')
point(12,9,11,'cochlea','Cochlear receptors and spiral ganglion');point(12,12,13,'cochlea','Hearing and cochlear lesions')
point(13,0,2,'cn9','IX - postolivary emergence');point(13,3,3,'cn9','IX through jugular foramen',visual=dict(map='gates',target='jugular'))
point(13,4,5,'cn9','Ph TMLC - pharyngeal branches',visual=branch('ix-branches',['IX','Pharyngeal','Tympanic','Muscular: stylopharyngeus','Lingual','Carotid'],1))
point(13,6,8,'cn9','IX secretomotor route to parotid',visual=target(parotid,'gland'),note='parotid')
point(13,9,10,'cn9','Stylopharyngeus motor supply',visual=branch('stylopharyngeus',['IX','Stylopharyngeus','Swallowing'],1))
point(13,11,13,'cn9','Posterior 1/3 of tongue',visual=dict(map='tongue',target='posterior'),function='taste')
point(13,14,15,'cn9','Carotid sinus afferent branch',visual=chain('carotid',[('sinus','Carotid sinus'),('ix','IX afferent'),('medulla','Medulla'),('x','Vagal efferent / heart')],'sinus'))
point(13,16,17,'cn9','Gag reflex - IX afferent',visual=dict(map='gag',target='ix'),note='gag')
point(13,18,18,'cn9','Carotid hypersensitivity - reference distinction',visual=chain('carotid',[('sinus','Carotid sinus'),('ix','IX afferent'),('medulla','Medulla'),('x','Vagal efferent / heart')],'sinus'),note='carotid')
point(13,19,20,'cn9','IX sensory and taste loss',visual=dict(map='tongue',target='posterior'),function='taste')
point(13,21,21,'cn9','Glossopharyngeal neuralgia')
point(14,0,2,'cn10','X - postolivary emergence');point(14,3,3,'cn10','X through jugular foramen',visual=dict(map='gates',target='jugular'))
point(14,4,7,'cn10','Traditional cranial XI joins X',visual=branch('vagal-motor',['Traditional cranial XI','Vagus X','Palate except tensor','Pharynx except stylopharyngeus','Larynx'],1),note='xi')
point(14,8,11,'cn10','Meningeal, auricular and pharyngeal branches',visual=branch('x-branches',['Vagus X','Meningeal','Auricular','Pharyngeal','Recurrent laryngeal','Superior laryngeal','Cardiac'],3))
point(14,12,14,'cn10','Left recurrent - aortic arch',visual=dict(map='recurrent',target='left'))
point(14,15,16,'cn10','Right recurrent - subclavian artery',visual=dict(map='recurrent',target='right'))
point(14,17,19,'cn10','Superior laryngeal - internal / external',visual=branch('superior-laryngeal',['Vagus X','Superior laryngeal','Internal laryngeal','External laryngeal'],1))
point(14,20,20,'cn10','Cardiac branches',visual=branch('cardiac',['Vagus X','Cardiac branches','Heart'],2))
point(14,21,23,'cn10','X lesion - palate, pharynx and larynx',function='voice')
point(14,24,24,'cn10','X lesion - pharyngeal / laryngeal sensory loss',function='swallow')
point(14,25,25,'cn10','Gag reflex - X efferent',visual=dict(map='gag',target='x'),note='gag')
point(15,0,5,'cn11','XI - traditional cranial root',visual=branch('vagal-motor',['Traditional cranial XI','Vagus X','Palate except tensor','Pharynx except stylopharyngeus','Larynx'],0),note='xi');point(15,6,8,'cn11','Spinal XI - upper five cervical segments')
point(15,9,11,'cn11','XI enters magnum / exits jugular',visual=chain('xi-gates',[('cord','Upper cervical spinal cord'),('magnum','Foramen magnum: enters'),('cranial','Traditional cranial root'),('jugular','Jugular foramen: exits')],'magnum'),note='xi')
point(15,12,14,'scm','SCM and trapezius',context=['Descending part of trapezius muscle'])
point(15,15,16,'scm','XI lesion - head movement');point(15,17,17,'trapezius','XI lesion - shoulder drop')
point(15,18,20,'cn12','XII - between pyramid and olive');point(15,21,21,'cn12','XII through hypoglossal canal',visual=dict(map='gates',target='hypoglossal'))
point(15,22,22,'tongue-muscles','XII - motor to tongue');point(15,23,25,'tongue-muscles','XII lesion - tongue toward weak side',function='tongueweak')
table16=[('types','Summary table - components and exits'),('cn1','I - summary'),('cn2','II - summary'),('cn3','III - summary'),('cn4','IV - summary'),('v1','V1 - summary'),('v2','V2 - summary'),('mastication','V3 motor - summary'),('lingual','V3 sensory - summary'),('lateral-rectus','VI - summary')]
for i,(id,title)in enumerate(table16):point(16,i,i,id,title,note='trochlear' if id=='cn4' else None)
table17=[('face-muscles','VII motor'),('chorda','VII taste'),('lacrimal','VII secretomotor'),('vestibule','VIII vestibular'),('cochlea','VIII cochlear'),('cn9','IX motor'),('cn9','IX parotid'),('cn9','IX sensory'),('cn10','X visceral distribution'),('cn11','XI traditional cranial root'),('scm','XI spinal root'),('tongue-muscles','XII - summary / GSE correction')]
summary_visuals={1:dict(map='tongue',target='taste'),5:branch('stylopharyngeus',['IX','Stylopharyngeus','Swallowing'],1),6:target(parotid,'gland'),7:dict(map='tongue',target='posterior'),9:branch('vagal-motor',['Traditional cranial XI','Vagus X','Palate except tensor','Pharynx except stylopharyngeus','Larynx'],0)}
for i,(id,title)in enumerate(table17):point(17,i,i,id,title,visual=summary_visuals.get(i),note='xi' if i==9 else S[id].get('clarification') if i==11 else None)
for p in pages:
 covered=[i for s in steps if s['page']==p['page'] for i in s['source_lines']]
 assert covered==list(range(len(p['lines']))),(p['page'],covered,len(p['lines']))
 here=[s for s in steps if s['page']==p['page']]
 for i,s in enumerate(here,1):s.update(slide_item=i,slide_items=len(here))
quiz=[]
for cn in range(1,13):
 choices=['cn'+str(n) for n in [cn]+[n for n in range(1,13) if n!=cn][:3]]
 quiz.append(dict(id='cn-q-'+str(cn),answer='cn'+str(cn),choices=choices,prompt={1:'Which nerve carries smell?',2:'Which nerve carries visual input?',3:'Which nerve supplies most eye muscles and pupillary constriction?',4:'Which nerve supplies superior oblique?',5:'Which nerve carries facial sensation and supplies mastication?',6:'Which nerve abducts the eye through lateral rectus?',7:'Which nerve supplies facial expression and anterior tongue taste?',8:'Which nerve carries hearing and balance?',9:'Which nerve carries the classical afferent gag limb?',10:'Which nerve carries the classical efferent gag limb?',11:'Which nerve supplies SCM and trapezius?',12:'Which nerve moves the tongue (except palatoglossus)?'}[cn],explanation=CN[cn]+'. '+{1:'Pure sensory: olfaction.',2:'Retinal ganglion cell axons form CN II.',3:'LR6, SO4, all the other extraocular muscles III.',4:'The only cranial nerve to emerge dorsally from the brainstem.',5:'V1 and V2 sensory; V3 mixed.',6:'A VI lesion weakens abduction.',7:'Taste travels with chorda tympani; parotid secretion belongs to IX.',8:'Vestibular = balance; cochlear = hearing.',9:'IX afferent, X efferent.',10:'IX afferent, X efferent.',11:'Spinal XI is the neck/shoulder motor nerve.',12:'A lower motor XII lesion can deviate the protruded tongue toward the weak side.'}[cn]))
refs=[dict(name='Supplied L3 - Crainal Nerves.pdf',role='Primary syllabus, all 17 supplied pages, including the visually transcribed figures and final tables.'),dict(name='Supplied Cranial_Nerves memory map.pdf',role='Four supplementary learning maps. Memory groups are distinguished from exact nerve emergence.'),dict(name='Loyola University - Cranial Nerve Summary',url='https://www.meddean.luc.edu/lumen/meded/grossanatomy/h_n/cn/cn1/table1.htm',role='Checked nerve functions and target-organ relationships.'),dict(name='UAMS - Nerves of the Head and Neck',url='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/nerve-tables/nerves-of-the-head-and-neck/',role='Checked branches, carriers, targets and foramina.'),dict(name='Clinical Methods - Eye-movement nerves III, IV and VI',url='https://www.ncbi.nlm.nih.gov/books/NBK406/',role='Checked trochlear crossing and position-dependent eye movements.'),dict(name='Clinical Methods - The Pupils',url='https://www.ncbi.nlm.nih.gov/books/NBK381/',role='Distinguishes III parasympathetic constriction from sympathetic dilation.'),dict(name='Johns Hopkins - Carotid sinus hypersensitivity',url='https://www.hopkinsmedicine.org/health/conditions-and-diseases/carotid-hypersensitivity',role='Clarifies that hypersensitivity is excessive reflex activation, not the usual IX destructive deficit.'),dict(name='UBC Functional Neuroanatomy - Cranial nerves',url='https://www.neuroanatomy.ca/interactive/CNbrain.html',role='Reference for linking apparent emergence to peripheral targets; no third-party atlas plate copied.')]
data=dict(id='3',module='cranial',title='Cranial nerves',tour_revision='cranial-source-1',model='/models/cranial.glb',slide_template='/slides/cranial/slide-{page}.jpg',source_pages=list(range(1,18)),chapters=[dict(id=f'page-{p}',name=f'Slide {p} · '+['Types of cranial nerves','Skull exits & cavernous sinus','I Olfactory / II Optic','III Oculomotor','IV Trochlear / VI Abducent','V roots / V1 Ophthalmic','V2 Maxillary','V3 anterior division','V3 posterior / lesions','VII course','VII branches / lesions','VIII hearing & balance','IX Glossopharyngeal','X Vagus','XI Accessory / XII Hypoglossal','Summary I-VI','Summary VII-XII'][p-1])for p in range(1,18)],structures=structures,steps=steps,quiz=quiz,references=refs,layers=[['cortex','Cerebral context'],['sulci','Sulcal landmarks'],['deep','Nuclei / sensory organs'],['hindbrain','Brainstem'],['cord','Cranial nerves'],['bones','Skull bones'],['muscles','Target muscles']])
from cranial_routes import apply_routes
data['routes']=apply_routes(structures,steps,inv)
from cranial_presentation import apply_presentation
apply_presentation(steps,inv,data['routes'])
data['references'].append(dict(name='UTHealth Neuroanatomy Online — Visual pathway',url='https://nba.uth.tmc.edu/neuroanatomy/L8/Lab08p14_index.html',role='Retina, optic nerve, chiasm, tract and lateral geniculate relationships; inferior / sectional orientation.'))
data['route_revision']='source-routes-1'
data['model']+='?v=source-routes-1'
data['layers'].append(['vessels','Vascular landmarks'])
(P/'data/lecture-3.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')
registry=json.loads((P/'data/lectures.json').read_text());registry=[x for x in registry if x['id']!='3'];registry.append(dict(id='3',title='Lecture 3 · Cranial nerves',path='/data/lecture-3.json',inventory='/data/cranial-structures.json'))
for item in registry:item['title']=item['title'].replace('\u00c2\u00b7','·')
(P/'data/lectures.json').write_text(json.dumps(registry,indent=2)+'\n')
print(f'Lecture 3: {len(steps)} ordered points / {sum(len(p["lines"])for p in pages)} source lines, {len(structures)} structures, 12 recall questions. Every source line covered exactly once.')
