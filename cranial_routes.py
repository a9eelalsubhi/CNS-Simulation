"""Explicit source-anatomy routes. No synthetic tube bridges missing nerves.

The atlas can combine a whole nerve and its terminal tree into one mesh. Fine
structures without an independently supported source binding are recorded as
unsegmented, not silently attached to the center of their parent nerve.
"""
import copy

CN={1:'Olfactory nerve (I)',2:'Optic nerve (II)',3:'Oculomotor nerve (III)',4:'Trochlear nerve (IV)',5:'Trigeminal nerve (V)',6:'Abducens nerve (VI)',7:'Facial nerve (VII)',8:'Vestibulocochlear nerve (VIII)',9:'Glossopharyngeal nerve (IX)',10:'Vagus nerve (X)',11:'Accessory nerve (XI)',12:'Hypoglossal nerve (XII)'}
COLOR=['#edac6f','#78d9e8','#f6ce69','#c4a1f3','#6bd9bb','#e9a0cd','#f195a7','#91cce9','#b8d67b','#c7a5ed','#f1bd77','#ea9ec8']
EYES=['Sclera','Lens'];CHEW=['Temporalis muscle','Superficial part of masseter','Medial pterygoid muscle','Inferior head of lateral pterygoid muscle']
FACE=['Frontalis muscle','Orbital part of orbicularis oculi','Zygomaticus major muscle','Orbicularis oris muscle','Depressor anguli oris']
V3=['Anterior division of mandibular nerve','Posterior division of mandibular nerve','Lingual nerve','Inferior alveolar nerve','Mental nerve','Nerve to mylohyoid muscle','Buccal nerve']

def apply_routes(structures,steps,inventory):
 bybase={};byid={x['id']:x for x in structures}
 for m in inventory['meshes']:bybase.setdefault(m['base'],[]).append(m['name'])
 def names(bases):
  missing=[b for b in bases if b not in bybase];assert not missing,missing
  return [n for b in bases for n in bybase[b]]
 def aux(id,name,bases,color,cn):
  if id not in byid:
   e=dict(id=id,name=name,text=name,bullets=[],meshes=names(bases),aliases=[],references=[],page=3,side='left',view='lateral',mode='cranial',kind='anatomical',color=color,cn=cn,route_auxiliary=True)
   structures.append(e);byid[id]=e
  return id
 routes={}
 def route(key,cn,nerve,origin,targets,context=None,note='',limitation=''):
  r=dict(id=str(key),cn=cn,name=CN[cn],color=COLOR[cn-1],nerve_bases=nerve,origin_bases=origin,target_bases=targets,context_bases=context or [],note=note,limitation=limitation,
   direction='Sensory: peripheral organ → CNS' if cn in [1,2,8] else 'Motor: CNS → target muscle' if cn in [3,4,6,11,12] else 'Mixed nerve: sensory input + motor / autonomic output')
  for k in ['nerve_bases','origin_bases','target_bases','context_bases']:r[k.replace('_bases','_meshes')]=names(r[k])
  routes[str(key)]=r;return r
 route(1,1,[CN[1]],[CN[1]],['Mucosa of nasal cavity'],['Straight gyrus (Gyrus rectus)'],note='Filaments, bulb and tract belong to the original combined olfactory mesh. Nasal mucosa is context; individual receptor neurons are not modeled.')
 route(2,2,[CN[2],'Optic chiasm','Optic tract'],['Lateral geniculate body'],['Retina'],EYES,note='Retina → optic nerve → chiasm → optic tract → lateral geniculate body. These are gross source surfaces; individual crossing fibers inside the chiasm and the optic radiation are not segmented in this model.')
 route(3,3,[CN[3]],['Midbrain'],['Superior rectus muscle','Medial rectus muscle','Inferior rectus muscle','Inferior oblique muscle','Levator palpebrae superioris'],EYES+['Iris'],limitation='Individual ciliary ganglion, short ciliary fibers and pupillary sphincter are not separately segmented.')
 route(4,4,[CN[4]],['Midbrain'],['Superior oblique muscle'],EYES+['Trochlea of superior oblique muscle'],note='Dorsal midbrain emergence; the source nerve follows its original course around the midbrain to superior oblique.')
 route(5,5,[CN[5],'Motor root of trigeminal nerve','Ophthalmic nerve','Maxillary nerve']+V3,['Pons'],CHEW,['Tongue','Cornea'],note='V1 / V2 sensory; V3 mixed. Named source branches are retained. Skin territories are not separate cutaneous surface meshes.')
 route('v1',5,[CN[5],'Ophthalmic nerve'],['Pons'],['Cornea'],EYES,limitation='Lacrimal, frontal and nasociliary are not independently named source meshes.')
 route('v2',5,[CN[5],'Maxillary nerve','Meningeal branch of maxillary nerve'],['Pons'],[],['Maxilla'],limitation='Fine V2 branches and infraorbital foraminal margins are not independently segmented.')
 route('v3',5,[CN[5],'Motor root of trigeminal nerve']+V3,['Pons'],CHEW,['Mandible','Tongue'],note='Lingual, inferior alveolar, mental, buccal and mylohyoid nerve meshes are shown in their original registration.')
 route(6,6,[CN[6]],['Pons'],['Lateral rectus muscle'],EYES)
 route(7,7,[CN[7]],['Pons'],FACE,['Parotid gland'],note='The facial nerve passes through the parotid gland; this does not mean it supplies parotid secretion.')
 route('7-taste',7,[CN[7],'Chorda tympani','Lingual nerve'],['Pons'],['Tongue'],['Submandibular gland','Sublingual gland'],note='VII taste fibers travel in chorda tympani and then with the lingual nerve. The lingual nerve itself is a V3 branch.',limitation='Taste receptor fields and the submandibular ganglion are not individually segmented.')
 route('7-glands',7,[CN[7],'Chorda tympani','Lingual nerve'],['Pons'],['Submandibular gland','Sublingual gland'],['Tongue'],limitation='The submandibular ganglion and microscopic postganglionic fibers are not separately segmented; no artificial bridge is drawn.')
 route('7-lacrimal',7,[CN[7]],['Pons'],['Lacrimal gland'],EYES,limitation='Greater petrosal / pterygopalatine routes are explained in the optional map; those fine fibers are not segmented here.')
 route(8,8,[CN[8],'Cochlear nerve','Vestibular nerve'],['Pons'],['Cochlea','Vestibule'],note='Sensory input runs from the inner ear to the pontomedullary region. Individual receptor cells and ganglia are not separately modeled.')
 route(9,9,[CN[9]],['Medulla oblongata'],['Stylopharyngeus muscle','Tongue','Oropharynx'],note='Postolivary emergence, original IX source nerve, and swallowing / posterior tongue targets.')
 route('9-parotid',9,[CN[9]],['Medulla oblongata'],['Parotid gland'],limitation='Tympanic / lesser petrosal fibers, otic ganglion and auriculotemporal carrier are not separately segmented. No direct IX-to-gland tube is fabricated.')
 route('9-carotid',9,[CN[9]],['Medulla oblongata'],[],['Left common carotid artery','Right common carotid artery','Internal carotid artery'],limitation='The carotid sinus branch and receptor wall are not separate source meshes.')
 route(10,10,[CN[10]],['Medulla oblongata'],['Oropharynx','Laryngopharynx','Soft palate','Posterior crico-arytenoid muscle','Lateral crico-arytenoid muscle'],['Trachea'],limitation='The original vagus mesh ends in the lower neck / upper thorax. Recurrent loops and distal visceral fibers are not separately segmented; no imaginary nerve extensions are added.')
 route('10-left',10,[CN[10]],['Medulla oblongata'],['Posterior crico-arytenoid muscle'],['Ascending aorta','Thoracic aorta','Trachea'],limitation='The left recurrent loop is not independently segmented in this source. The actual vagus, aorta and laryngeal target are shown without a fabricated connecting tube.')
 route('10-right',10,[CN[10]],['Medulla oblongata'],['Posterior crico-arytenoid muscle'],['Right subclavian artery','Trachea'],limitation='The right recurrent branch is not independently named in this source. Original nerve and neighboring artery are shown; the explanatory loop remains in the optional map.')
 route('10-heart',10,[CN[10]],['Medulla oblongata'],['Left atrium','Right atrium','Left ventricle','Right ventricle'],limitation='The model does not include a continuous segmented cardiac vagal branch. Target heart tissue is shown separately; no connection across missing geometry is implied.')
 route('10-viscera',10,[CN[10]],['Medulla oblongata'],['Oesophagus','Stomach'],['Trachea','Superior lobe of left lung','Superior lobe of right lung'],limitation='The original vagus mesh stops above these distal targets. Distal vagal trunks / plexuses are not segmented. Target locations are context, not a claim of a complete modeled nerve.')
 route(11,11,[CN[11]],[],['Sternocleidomastoid muscle','Descending part of trapezius muscle'],note='Spinal XI arises from upper cervical cord and supplies SCM / trapezius. Medulla is orientation context, not its spinal origin.',limitation='Traditional cranial XI fibers belong with X in modern clinical anatomy.')
 route(12,12,[CN[12]],['Medulla oblongata'],['Genioglossus muscle','Hyoglossus muscle'],['Tongue'],note='Preolivary emergence → original XII nerve → tongue muscles. Palatoglossus is the vagal exception.')

 # An explicit point binding is either a supported source surface / source
 # subregion, or an unavailable fine structure. Never fall back to a parent
 # nerve merely because a landmark shares its lecture structure ID.
 def bind(s,bases,label=None,reference=None,world=None,note=None):
  s['focus_targets']=names(bases);s['anchor_binding']={'status':'source-region' if world else 'source-surface','label':label or ' / '.join(bases)}
  if reference:s['anchor_binding']['reference_bases']=reference;names(reference)
  if world:s['anchor_binding']['world_hint']=world
  if note:s['anchor_binding']['note']=note
 def unavailable(s,why):
  s['focus_targets']=[];s['anchor_binding']=dict(status='unsegmented',label=why,note='No pointer is attached to a different nerve or an empty location. Use the optional relationship map for this fine structure.')
 for s in steps:
  e=byid[s['structure']];cn=s['cn'];v=s.get('visual',{});m=v.get('map');t=v.get('target');p=s['page'];a=s['source_lines'][0]
  key=str(cn) if cn else 'overview'
  if cn==5:key='v1' if s['structure']=='v1' else 'v2' if p==7 or s['structure']=='v2' else 'v3' if p in [8,9] or s['structure'] in ['v3','mastication','lingual','alveolar','mylohyoid'] else '5'
  if cn==7:
   if m=='tongue' or s['structure']=='chorda':key='7-taste'
   if v.get('key')=='salivation' or (p==11 and a==18):key='7-glands'
   if v.get('key')=='greater-petrosal' or s['structure']=='lacrimal':key='7-lacrimal'
  if cn==9:
   if v.get('key')=='parotid' or (p==17 and a==6):key='9-parotid'
   if v.get('key')=='carotid':key='9-carotid'
  if cn==10:
   if m=='recurrent':key='10-'+t
   if v.get('key')=='cardiac':key='10-heart'
   if s.get('scope')=='body':key='10-viscera'
  s['route_id']=key;s['route_extent']='full';s['hemisphere']='left' if cn else 'both'
  if m=='types':s['overview_cns']={'sensory':[1,2,8],'motor':[3,4,6,11,12],'mixed':[5,7,9,10]}.get(t,list(range(1,13)))
  if key=='10-right':s['hemisphere']='right'
  if cn and not (cn==4 and ('dorsal' in s['title'] or 'crossing' in s['title'])):s['view']='lateral'
  if not m:bind(s,list(dict.fromkeys(next(x['base']for x in inventory['meshes'] if x['name']==n)for n in s['targets'])))
  elif m=='types':unavailable(s,'Overview: actual cranial nerve pairs are shown in individual colors.')
  elif m=='origins':unavailable(s,'Emergence overview: select a named nerve to follow its actual 3D course.')
  elif m=='gates':unavailable(s,'Foraminal margins are not separately segmented; the corresponding original nerve course is displayed.')
  elif m=='cavernous':
   b={'iii':CN[3],'iv':CN[4],'vi':CN[6],'v1':'Ophthalmic nerve','v2':'Maxillary nerve'}[t]
   bind(s,[b],reference=['Internal carotid artery'],note='Arrow on the named nerve surface nearest ICA; sinus walls are not segmented.')
   s['context_bases']=list(dict.fromkeys(s['context_bases']+['Internal carotid artery','Sphenoid bone']))
  elif m=='face':bind(s,['Ophthalmic nerve'] if t=='v1' else ['Maxillary nerve'] if t=='v2' else V3 if t=='v3' else [CN[5]],note='Arrow on the actual nerve, not on a skin territory. Territories remain available in the optional map.')
  elif m=='facial':bind(s,[CN[7]],reference=['Parotid gland'],note='Actual VII branching tree; five named terminal divisions are not separate source objects.')
  elif m=='tongue':
   if t=='general':bind(s,['Lingual nerve'],reference=['Tongue'],note='Actual lingual nerve near tongue; sensory territory borders are shown only in the optional map.')
   elif t=='taste':bind(s,['Chorda tympani'],reference=['Lingual nerve'],note='Actual chorda tympani where it joins the lingual route; taste fields are not separately segmented.')
   elif t=='posterior':bind(s,[CN[9]],reference=['Tongue'],note='Actual IX surface nearest tongue; posterior taste receptors are not separate meshes.')
   else:bind(s,[CN[12]],reference=['Tongue'])
  elif m=='corneal':bind(s,['Cornea'] if t=='cornea' else ['Ophthalmic nerve'] if t=='v1' else [CN[7]] if t=='vii' else ['Orbital part of orbicularis oculi'] if t=='muscle' else ['Pons'])
  elif m=='gag':bind(s,[CN[9]] if t=='ix' else [CN[10]] if t=='x' else ['Oropharynx'] if t in ['pharynx','muscle'] else ['Medulla oblongata'])
  elif v.get('key')=='olfactory':
   hint={'mucosa':[.009,1.598,.055],'fibers':[.009,1.598,.055],'bulb':[.009,1.610,.062],'tract':[.007,1.611,.033],'stria':[.005,1.610,.024]}.get(t)
   if hint:bind(s,[CN[1]],label={'mucosa':'CN I filaments at nasal roof','fibers':'CN I filaments','bulb':'Olfactory bulb region','tract':'Olfactory tract region','stria':'Olfactory strial region'}[t],world=hint,note='Region in the original combined olfactory source mesh; individual neurons are not modeled.')
   else:unavailable(s,'Primary olfactory cortical projections are not individually segmented.')
  elif v.get('key')=='optic' and t=='radiation':unavailable(s,'Optic radiation is not segmented; retina, nerve, chiasm, tract and LGB are shown as actual source anatomy.')
  elif m=='recurrent':unavailable(s,'The recurrent laryngeal branch is not independently segmented in the source atlas.')
  elif m in ['chain','branches']:
   label=next((n['label']for n in v.get('nodes',[])if n['id']==t),'')
   aliases={'CN III':CN[3],'CN VII':CN[7],'CN IX':CN[9],'IX':CN[9],'Vagus X':CN[10],'V2':'Maxillary nerve','V1 Ophthalmic':'Ophthalmic nerve','V2 Maxillary':'Maxillary nerve','V3 Mandibular':'Posterior division of mandibular nerve','V3 trunk':'Posterior division of mandibular nerve','Posterior V3':'Posterior division of mandibular nerve','Anterior division':'Anterior division of mandibular nerve','Posterior division':'Posterior division of mandibular nerve','Lingual':'Lingual nerve','Inferior alveolar':'Inferior alveolar nerve','Mental':'Mental nerve','Mylohyoid motor branch':'Nerve to mylohyoid muscle','Medial pterygoid':'Medial pterygoid muscle','Parotid gland':'Parotid gland','Stylopharyngeus':'Stylopharyngeus muscle','Heart':'Left ventricle','Lacrimal / nasal / palatal glands':'Lacrimal gland','Submandibular + sublingual glands':'Submandibular gland','Pharyngeal response':'Oropharynx'}
   if label in bybase:bind(s,[label])
   elif label in aliases:bind(s,[aliases[label]],note='Arrow identifies this named source nerve or target organ; intervening unsegmented fine fibers are not implied.')
   else:unavailable(s,label+' is not separately segmented in this atlas.')
  else:unavailable(s,'This fine structure is not independently segmented in the source atlas.')
  # Named branches which were absent from the earlier export now have exact
  # original meshes. Bind them instead of showing only a relationship diagram.
  if p==8 and a in [10,11]:bind(s,['Buccal nerve'])
  if s['structure']=='superior-oblique':bind(s,['Superior oblique muscle'])
  if p==4 and a==5:bind(s,['Superior rectus muscle','Medial rectus muscle','Inferior rectus muscle','Inferior oblique muscle'])
  if p==5 and a==3:unavailable(s,'The intramedullary trochlear decussation is not separately segmented; the original dorsal IV nerve course remains visible.')
  if p==6 and a==2:bind(s,[CN[5]],label='V sensory root at the pons',reference=['Pons'],note='The small motor root is also visible as a separate original source mesh.')
  if p==9 and a==4:bind(s,['Lingual nerve'],reference=['Chorda tympani'],note='Actual lingual nerve surface at its closest source contact with chorda tympani.')
  if p==9 and a==11:bind(s,['Mental nerve'],note='Mental terminal branch is a separate source mesh; incisive branch is not separately segmented.')
  if p==13 and a in [9,10]:bind(s,['Stylopharyngeus muscle'])
  if p==17 and a==5:bind(s,['Stylopharyngeus muscle'])
  if p==17 and a==6:bind(s,['Parotid gland'])
  if p==17 and a==9:unavailable(s,'Traditional cranial XI is not separately segmented; vagal palate / pharyngeal targets are shown for context.');s['route_id']='10'
  if p==15 and a==0:unavailable(s,'Traditional cranial XI is not independently segmented; spinal XI must not be mistaken for vagal fibers.');s['route_id']='10'
  if p==15 and a==6:bind(s,[CN[11]],reference=['White matter of spinal cord'],note='Actual spinal XI rootlets nearest the upper cervical cord surface.')
  if 'origin' in s['title'].lower() or 'emergence' in s['title'].lower() or 'dorsal exit' in s['title'].lower():
   if cn:bind(s,[CN[cn]],reference=routes[s['route_id']]['origin_bases'],note='Arrow on the original nerve at its closest source surface to the named central connection.')
  if p==15 and a==18:bind(s,[CN[12]],reference=['Medulla oblongata'],note='Actual preolivary XII rootlets at the medullary surface, not the distal nerve in the neck.')
  if p==5 and a==0:bind(s,[CN[4]],label='IV dorsal emergence region',world=[.001,1.600,-.015],note='Named dorsal region of the original combined IV nerve mesh.')
  # Context callouts point to explicitly named actual nerves / organs. A missing
  # primary fine structure never borrows one of these anchors for its own label.
  s['related']=[]
  if s['route_id'] in routes:
   r=routes[s['route_id']];primary=set(s['focus_targets']);origin_bases=r['origin_bases'];target_bases=r['target_bases']
   root_bases=r['nerve_bases'][:1]
   root_id=aux('route-'+r['id']+'-nerve',r['name']+' · actual nerve course',root_bases,r['color'],r['cn'])
   if not primary.intersection(names(root_bases)) or s['anchor_binding']['status']=='unsegmented':
    s['related'].append(dict(structure=root_id,targets=names(root_bases),name=r['name']+' · actual nerve course',text=r['direction'],bullets=[],color=r['color'],anchor_binding=dict(status='source-surface',label=r['name'],reference_bases=origin_bases),route_context=True))
   if target_bases:
    # One useful target per point, rather than covering the entire model with
    # cards for every branch. The remaining target meshes remain in the scene.
    candidates=[b for b in target_bases if not primary.intersection(names([b]))]
    if candidates:
     b=candidates[0];target_id=aux('target-'+b.replace(' ','-').lower(),b,[b],'#78d9e8',r['cn'])
     s['related'].append(dict(structure=target_id,targets=names([b]),name=b+' · target tissue',text='Original atlas target tissue · aligned with the nerve in the same coordinate system.',bullets=[],color='#78d9e8',anchor_binding=dict(status='source-surface',label=b),route_context=True))
 return routes
