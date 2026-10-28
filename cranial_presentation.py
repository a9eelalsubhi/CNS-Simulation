"""Teaching focus is independent of a pointer binding.

A skull bone may orient a missing foramen without becoming a false foramen
anchor. Camera choices follow anatomy, never the ordinal number of a slide.
"""
def apply_presentation(steps, inventory, routes):
    bybase = {}
    for m in inventory['meshes']:
        bybase.setdefault(m['base'], []).append(m['name'])
    def names(bases):
        return [n for b in bases for n in bybase.get(b, [])]
    gates = {
        'cribriform': (['Olfactory nerve (I)'], ['Ethmoid bone'], 'inferior'),
        'optic': (['Optic nerve (II)'], ['Sphenoid bone'], 'superior'),
        'sof': (['Oculomotor nerve (III)', 'Trochlear nerve (IV)', 'Ophthalmic nerve', 'Abducens nerve (VI)'], ['Sphenoid bone'], 'anterior'),
        'rotundum': (['Maxillary nerve'], ['Sphenoid bone'], 'anterior'),
        'ovale': (['Posterior division of mandibular nerve', 'Motor root of trigeminal nerve'], ['Sphenoid bone'], 'inferior'),
        'iam': (['Facial nerve (VII)', 'Vestibulocochlear nerve (VIII)'], ['Temporal bone'], 'posterior'),
        'jugular': (['Glossopharyngeal nerve (IX)', 'Vagus nerve (X)', 'Accessory nerve (XI)'], ['Occipital bone', 'Temporal bone'], 'inferior'),
        'hypoglossal': (['Hypoglossal nerve (XII)'], ['Occipital bone'], 'inferior'),
        'magnum': (['Accessory nerve (XI)', 'Medulla oblongata'], ['Occipital bone'], 'inferior'),
        # No invented greater-petrosal / middle-meningeal source geometry.
        'lacerum': ([], ['Sphenoid bone', 'Temporal bone'], 'inferior'),
        'spinosum': ([], ['Sphenoid bone'], 'inferior'),
    }
    optic = {'Retina':'#f6ce69','Optic nerve (II)':'#78d9e8','Optic chiasm':'#f195a7','Optic tract':'#c4a1f3','Lateral geniculate body':'#6bd9bb'}
    for s in steps:
        r = routes.get(s['route_id'])
        v = s.get('visual', {})
        focus = list(s['focus_targets'])
        context = names(s.get('context_bases', []))
        s['presentation'] = dict(extent='focus' if focus else 'route', focus_meshes=focus, context_meshes=context)
        # The repeated root / target cards obscured the literal slide and made
        # every point look identical. Retain only one named context when the
        # source does not segment the actual subject of the explanation.
        s['related'] = []
        if v.get('map') == 'gates':
            nerve, bone, view = gates[v['target']]
            s['view'] = view
            s['hemisphere'] = 'both'
            s['presentation'].update(extent='focus', focus_meshes=names(nerve + bone), context_meshes=names(bone))
            s['related'] = []
        if r and not focus and v.get('map') != 'gates':
            # Show the relevant supplied region, not every distant target of
            # the same nerve. The absent branch still receives NO 3D pointer.
            s['presentation'].update(extent='focus', focus_meshes=names(r['target_bases'] or r['nerve_bases']), context_meshes=names(r['context_bases']))
        if s['cn'] == 2:
            s['view'] = 'inferior' if s['page'] == 3 and s['source_lines'][0] in [14,15,16,17] else 'superior'
            if s['page'] == 3 and s['source_lines'][0] in [14,15]: s['hemisphere'] = 'both'
            bases = [m['base'] for m in inventory['meshes'] if m['name'] in focus]
            if bases and bases[0] in optic: s['color'] = optic[bases[0]]
            # Bilateral chiasm and adjacent tracts explain the crossing; they
            # are spatial context, with a stable color for each actual mesh.
            if s['page'] == 3 and s['source_lines'][0] in [14,15,16,17]:
                s['presentation']['context_meshes'] = names({14:['Optic nerve (II)','Optic tract'],15:['Optic chiasm','Lateral geniculate body'],16:['Optic tract'],17:['Optic tract']}[s['source_lines'][0]])
            if s['page'] == 3:
                current = {11:'Retina',13:'Optic nerve (II)',14:'Optic chiasm',15:'Optic tract',16:'Lateral geniculate body',17:'Optic radiation (not segmented)'}[s['source_lines'][0]]
                s['teaching_chain'] = [dict(label=b, active=b==current, color=optic.get(b,'#b3a4c0')) for b in list(optic)+['Optic radiation (not segmented)','Visual cortex']]
        if s['page'] == 3 and s['source_lines'][0] == 0:
            # Receptor mucosa is not the same object as olfactory filaments.
            s['focus_targets'] = names(['Mucosa of nasal cavity'])
            s['anchor_binding'] = dict(status='source-surface', label='Nasal mucosa (olfactory receptor cells are not segmented)', note='The olfactory epithelium occupies the nasal roof; this source mesh includes the wider nasal mucosa.')
            s['presentation']['focus_meshes'] = s['focus_targets']
        if s['page'] == 3 and s['source_lines'][0] in [2,3,4]:
            s['presentation']['region_radius'] = .014
        if s['page'] == 3 and s['source_lines'][0] == 17:
            s['presentation'].update(focus_meshes=names(['Lateral geniculate body','Cuneus','Lingual gyrus']),context_meshes=names(['Calcarine sulcus']))
            s['view']='medial'
            s['anchor_binding']['label']='Optic radiation is not segmented. The LGB and cortical surfaces bordering the calcarine sulcus are shown as regional context; they do not delineate area 17 exactly.'
        if focus and s['anchor_binding'].get('reference_bases') and any(w in s['title'].lower() for w in ['origin','emergence','cavernous','beside ica','sensory / small motor','between pyramid']):
            s['presentation']['region_radius'] = .022
        # Correctly use available separate branch / target meshes.
        if s['page'] == 7 and s['source_lines'][0] == 13:
            s['focus_targets'] = names(['Meningeal branch of maxillary nerve'])
            s['anchor_binding'] = dict(status='source-surface', label='Meningeal branch of maxillary nerve')
            s['presentation'].update(extent='focus', focus_meshes=s['focus_targets'])
            s['related'] = []
        if s['page'] == 11 and s['source_lines'][0] == 10:
            s['focus_targets'] = names(['Occipitalis muscle'])
            s['anchor_binding'] = dict(status='source-surface', label='Occipitalis muscle', note='Target muscle is modeled; posterior auricular nerve is not separately segmented.')
            s['presentation'].update(extent='focus', focus_meshes=s['focus_targets'])
            s['view'] = 'posterior'; s['related'] = []
        if s['page'] == 4 and s['source_lines'][0] in [16,17]:
            pupil = s['source_lines'][0] == 16
            s['focus_targets'] = names(['Iris'] if pupil else ['Lateral rectus muscle','Superior oblique muscle'])
            s['anchor_binding'] = dict(status='source-surface',label='Iris (pupillary sphincter is not segmented)' if pupil else 'Lateral rectus (VI) and superior oblique (IV)',note='The mesh is an anatomical surface; pupillary dilation is not animated.' if pupil else 'These are the spared muscles in a complete III palsy, not muscles supplied by III. The static model does not reproduce the pathological eye position.')
            s['presentation'].update(extent='focus',focus_meshes=s['focus_targets'],context_meshes=names(['Sclera','Lens']))
            s['view']='anterior';s['related']=[]
        if s['page'] == 15 and s['source_lines'][0] == 12:
            s['focus_targets'] = names(['Sternocleidomastoid muscle','Descending part of trapezius muscle'])
            s['anchor_binding'] = dict(status='source-surface',label='SCM and trapezius — spinal XI targets')
            s['presentation']['focus_meshes']=s['focus_targets']
        if s['page'] == 11 and s['source_lines'][0] in [21,23]:
            bases = ['Orbicularis oris muscle', 'Depressor anguli oris'] if s['source_lines'][0] == 21 else ['Frontalis muscle', 'Orbital part of orbicularis oculi', 'Orbicularis oris muscle']
            s['focus_targets'] = names(bases)
            s['anchor_binding'] = dict(status='source-surface', label='Lower-face muscles (forehead spared)' if s['source_lines'][0] == 21 else 'Upper- and lower-face muscles', note='Affected muscle distribution; the model does not simulate paralysis.')
            s['presentation'].update(extent='focus', focus_meshes=s['focus_targets']); s['related'] = []
        if s['page']==11 and s['source_lines'][0] in [11,13,19,21,23]:
            s['view']='anterior'
            s['presentation']['context_meshes']=names(['Maxilla','Mandible','Zygomatic bone','Frontal bone','Frontalis muscle','Zygomaticus major muscle','Orbital part of orbicularis oculi','Orbicularis oris muscle'])
        # A compact, explicitly schematic route explains missing microscopic
        # detail without replacing the 3D scene or inventing connecting tubes.
        if v.get('nodes') and not s.get('teaching_chain'):
            s['teaching_chain'] = [dict(label=n['label'], active=n['id']==v.get('target')) for n in v['nodes']]
        s['presentation']['focus_meshes'] = list(dict.fromkeys(s['presentation']['focus_meshes']))
