"""The lecture's printed order, separate from the anatomical directory.

Repeated structures have point-specific text: an early surface-identification
point must not jump ahead to later somatotopy/lesion material. Targets are
explicit subsets of already validated source meshes, never fuzzy matches.
"""
import re

def build_sequence(structures, inventory):
    chapters, steps = [], []
    page = None
    def section(p, name):
        nonlocal page
        page = p
        chapters.append({'id':f'page-{p}', 'name':name, 'page':p})
    def add(key, title=None, text=None, bullets=None, bases=None, **options):
        e = structures[key]
        targets = e['meshes'] if bases is None else [m['name'] for m in inventory if m['base'] in bases and m['name'] in e['meshes']]
        assert targets, (key,bases)
        if bases:
            assert all(any(m['base']==base and m['name'] in targets for m in inventory) for base in bases), (key,bases)
        label = options.pop('label', title or e['name'])
        slug = re.sub(r'[^a-z0-9]+','-',(title or e['name']).lower()).strip('-')
        point = dict(id=f'p{page}-{key}-{slug}',chapter=f'page-{page}',structure=key,title=title or e['name'],name=label,page=page,pins=[key],view=e['view'],mode=e['mode'],targets=targets,text=e['text'] if text is None else text,bullets=e['bullets'] if bullets is None and text is None else (bullets or []))
        point.update(options)
        steps.append(point)

    section(2,'Nervous system · lobes & surfaces')
    add('cerebrum','Central nervous system','The CNS consists of the brain and spinal cord.',['The brain includes the cerebrum, brainstem and cerebellum.'],mode='brain-components')
    add('cerebrum','Brain · cerebrum','The cerebrum is one of the three brain components named in the lecture.',mode='brain-components')
    add('brainstem','Brain · brainstem',mode='brain-components')
    add('cerebellum','Brain · cerebellum',mode='brain-components')
    add('spinal-cord')
    add('peripheral','Peripheral nervous system')
    add('grey','Grey matter','Grey matter consists mainly of neuronal cell bodies.')
    add('white','White matter','White matter is composed predominantly of myelinated axons.')
    add('nucleus')
    add('ganglion')
    for key in ['frontal','temporal','parietal','occipital']:
        add(key, text=f'The {key} lobe is one of the five cerebral lobes listed in the lecture.')
    add('insula','The fifth lobe · insula','The insula lies deep within the lateral sulcus, covered by the opercula.',['The circular sulcus locates its boundary in this model.'])
    for title,view in [('Superolateral','lateral'),('Medial','medial'),('Inferior','inferior')]:
        add('cerebrum',f'Three surfaces · {title.lower()}',f'The {title.lower()} surface is one of the three cerebral surfaces named in the lecture.',view=view)

    section(3,'Superolateral surface · frontal lobe')
    for key in ['central','lateral','parieto-occipital','precentral-sulcus']:
        add(key)
    add('precentral','Precentral gyrus · area 4','Primary motor cortex supplies voluntary motor control to the body.',['Identify it between the precentral sulcus in front and the central sulcus behind.'])
    add('frontal-sulci','Superior frontal sulcus','Separates the superior and middle frontal gyri.',bases=['Superior frontal sulcus'])
    add('frontal-sulci','Inferior frontal sulcus','Separates the middle and inferior frontal gyri.',bases=['Inferior frontal sulcus'])
    add('superior-frontal')
    add('middle-frontal')
    add('inferior-frontal','Inferior frontal gyrus','The inferior frontal gyrus lies below the inferior frontal sulcus.')
    add('broca','Broca’s area · speech production','Motor speech area responsible for speech.',['A lesion can cause expressive aphasia: speech output is impaired while comprehension is relatively preserved.'])
    add('frontal-eye','Frontal eye field · area 8','Responsible for conjugate voluntary eye movements.')

    section(4,'Superolateral surface · parietal lobe')
    add('postcentral-sulcus')
    add('postcentral','Postcentral gyrus · sensory cortex','Primary sensory cortex receives somatic sensory information from the body.')
    for key in ['intraparietal','superior-parietal','inferior-parietal','supramarginal','angular']:
        add(key)
    add('wernicke','Wernicke’s area · understanding language','Interprets spoken and written language.',['A lesion can cause receptive aphasia, with difficulty understanding spoken and written words.'])

    section(5,'Temporal, occipital & medial surfaces')
    for word in ['Superior','Inferior']:
        add('temporal-sulci',f'{word} temporal sulcus',f'Identify the {word.lower()} temporal sulcus on the lateral temporal surface.',bases=[f'{word} temporal sulcus'])
    for word,base in [('Superior','Superior temporal gyrus (Lateral part)'),('Middle','Middle temporal gyrus'),('Inferior','Inferior temporal gyrus')]:
        add('temporal-gyri',f'{word} temporal gyrus',f'Identify the {word.lower()} of the three temporal gyri listed on this page.',bases=[base])
    add('auditory','Auditory area · hearing','The auditory area is concerned with hearing.')
    add('occipital','Occipital lobe · vision','The occipital lobe is related to vision.')
    add('occipital-sulci','Occipital sulci & gyri',bullets=['Find the superior and inferior occipital gyri and the lunate sulcus.','The original figure also names the lateral occipital sulcus.'])
    add('callosal-sulcus','Medial surface · callosal & cingulate sulci')
    add('cingulate')
    add('medial-frontal')
    add('central','Terminal part of the central sulcus','Follow the superior end of the central sulcus onto the medial margin.',view='medial',anchor_at={'y':.97})
    add('paracentral')
    add('medial-y')
    add('cuneus')
    add('precuneus')

    section(6,'Inferior surface · orbital & tentorial')
    for key in ['orbital','olfactory-sulcus','orbital-h','rectus']:
        add(key)
    add('orbital','Four orbital gyri','The lecture names anterior, posterior, medial and lateral orbital gyri.',['Use the original figure to distinguish these subdivisions; the source model combines them in one orbital parcel.'],bases=['Orbital gyri'])
    add('tentorial','Tentorial surface · rhinal sulcus & uncus','The lecture names the rhinal sulcus and uncus on the tentorial surface.',['Their relation is taught using the original figure and the adjacent parahippocampal region.'],kind='relation',anchor_label='Parahippocampal region · anatomical relation',bases=['Medial occipitotemporal gyrus (Parahippocampal*)'])
    add('collateral')
    add('occipitotemporal','Parahippocampal region','Identify the medial temporal region beside the collateral sulcus.',bases=['Medial occipitotemporal gyrus (Parahippocampal*)'])
    add('lingual')
    add('occipitotemporal','Occipitotemporal sulcus','Separates the medial and lateral occipitotemporal regions.',bases=['Occipitotemporal sulcus (Lateral part*)'])
    for word,base in [('Medial','Medial occipitotemporal gyrus (Parahippocampal*)'),('Lateral','Lateral occipitotemporal gyrus')]:
        add('occipitotemporal',f'{word} occipitotemporal gyrus',f'Identify the {word.lower()} occipitotemporal region on the inferior surface.',bases=[base])

    section(7,'Frontal functions · primary motor cortex')
    add('frontal','Frontal lobe · boundaries','Relate the frontal lobe to the central sulcus behind and lateral sulcus below.')
    add('precentral','Primary motor cortex · area 4','Controls voluntary movement on the opposite side of the body.')
    add('paracentral','Motor somatotopy · medial side','Genitalia, hip, leg, foot and toes are represented medially.',['The lecture assigns anterior cerebral artery supply to the medial territory.'],view='medial')
    add('precentral','Motor somatotopy · lateral side','Head, neck, upper limb and face are represented laterally.',['The lecture assigns middle cerebral artery supply to the lateral territory.'])
    add('precentral','Motor cortex lesion','A lesion may cause contralateral hemiplegia: weakness/paralysis on the opposite body side.')

    section(8,'Frontal association, gaze & speech')
    add('premotor',bullets=['Planning movement.','Sequencing movement.','Helping organize execution of movement.'])
    add('prefrontal',bullets=['Personality and behavior.','Working memory and cognition.','Decision making and motor planning.'])
    add('frontal-eye')
    add('broca')
    add('inferior-frontal','Inferior frontal gyrus · named parts')

    section(9,'Somatic sensation & language')
    add('postcentral','Primary somatosensory cortex · areas 3, 1, 2','Receives somatic sensory information from the opposite body side.')
    add('paracentral','Sensory somatotopy · medial side','Genitalia, hip, leg, foot and toes are represented medially.',['The lecture assigns ACA supply to this medial territory.'],view='medial')
    add('postcentral','Sensory somatotopy · lateral side','Head, neck, upper limb and face are represented laterally.',['The lecture assigns MCA supply to this lateral territory.'])
    add('postcentral','Sensory cortex lesion','A lesion can produce contralateral hemi-hypoesthesia: reduced sensation on the opposite side.')
    add('sensory-association','Somatosensory association cortex','Analyzes weight, position in three dimensions and size, and supports recognition of sensory meaning.')
    for title,text in [('Astereognosis','Inability to recognize an object by touch.'),('Agraphesthesia','Inability to recognize a symbol traced on the skin. The slide calls the ability “Graphesthesia”.'),('Position recognition deficit','Impaired recognition of body-part position; the lecture labels this “Astatagnosis”.'),('Abarognosis','Impaired discrimination of differences in weight.')]:
        add('sensory-association',title,text)
    add('wernicke')

    section(10,'Hearing, smell, vision & insula')
    add('auditory')
    add('auditory-association')
    add('olfactory','Primary olfactory cortex','Awareness of smell stimuli.')
    add('olfactory','Olfactory association function','Recognition and storage of smell-related memories.')
    add('visual')
    add('visual-association')
    add('insula','Insular functions','The lecture associates the insula with visceral sensations, equilibrium-related input and taste.',['Visceral input from cardiac, pulmonary and gastrointestinal structures.','Input from the inner ear related to equilibrium.','Tongue input related to taste.'])

    section(11,'Cortical organization · lecture summary')
    for key,title,text in [
        ('postcentral','Primary somatosensory area','Postcentral gyrus.'),('visual','Primary visual area','Occipital lobe.'),('auditory','Primary auditory area','Temporal lobe.'),('gustatory','Primary gustatory area','The slide places taste near the base of the postcentral region; relate it to the insular/opercular region.'),('olfactory','Primary olfactory area','Temporal lobe.'),
        ('sensory-association','Somatosensory association area','Posterior to the primary somatosensory area.'),('visual-association','Visual association area','Occipital lobe.'),('auditory-association','Auditory association area','Temporal lobe.'),('wernicke','Wernicke’s region','Language-dominant temporal and parietal regions.'),('prefrontal','Prefrontal cortex','Anterior portion of the frontal lobe.')]:
        add(key,title,text)
    for key,title in [('visual','Area 17 · primary visual'),('visual-association','Areas 18 & 19 · visual association'),('precentral','Area 4 · primary motor'),('premotor','Area 6 · premotor'),('postcentral','Areas 3, 1 & 2 · somatosensory'),('auditory','Areas 41 & 42 · auditory'),('broca','Areas 44 & 45 · Broca'),('wernicke','Areas 39 & 40 · lecture language labels'),('frontal-eye','Area 8 · frontal eye field')]:
        add(key,title,'Match the lecture’s area number to this named cortical region.',bullets=['This is a regional anatomical locator, not an independently segmented Brodmann map.'])

    section(12,'White matter · connections & commissures')
    add('association','Association fibers','Connect areas within the same cerebral hemisphere.')
    add('association','Short association fibers','Connect adjacent gyri within the same hemisphere.')
    add('association','Long association fibers','Connect more widely separated gyri or lobes within the same hemisphere.')
    add('commissural')
    add('callosum')
    for name,at in [('Rostrum',{'z':.80,'y':.07}),('Genu',{'z':.96,'y':.52}),('Body',{'z':.5,'y':.93}),('Splenium',{'z':.07,'y':.57})]:
        add('callosum',f'Corpus callosum · {name.lower()}',f'Identify the {name.lower()}, one of the four corpus-callosum parts listed in the lecture.',anchor_at=at,anchor_label=name)
    for key in ['anterior-commissure','posterior-commissure','habenular-commissure','fornix-commissure','projection']:
        add(key)
    chapters.append({'id':'explore','name':'Full lecture explorer'})
    add('cerebrum','Lecture complete · explore every structure','You have reached the end of the lecture. Revisit a named structure or restart the guided tour.',mode='explorer',chapter='explore',view='lateral')
    assert all(a['page']<=b['page'] for a,b in zip(steps,steps[1:]))
    return chapters,steps
