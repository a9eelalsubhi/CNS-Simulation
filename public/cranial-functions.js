// Original, code-native human function illustrations. These illustrate a task
// or a nerve territory; they never claim to be a photograph or an MRI/atlas cut.
const face=(mouth='M78 121 Q105 136 132 121',tongue=false)=>`<path d="M60 193V159Q35 141 39 92Q35 31 102 23Q170 25 171 91Q174 138 151 159V193" fill="#806d80" stroke="#d6bdcf" stroke-width="3"/><path d="M44 95Q17 83 26 115L43 128M168 95Q192 83 184 115L170 128" fill="#806d80" stroke="#d6bdcf" stroke-width="3"/><path d="M61 83Q77 73 91 83M120 83Q137 73 151 83" fill="none" stroke="#211829" stroke-width="4"/><path d="M104 85L96 109L112 110" fill="none" stroke="#d6bdcf" stroke-width="3"/><path d="${mouth}" fill="none" stroke="#281a2a" stroke-width="5"/>${tongue?'<path d="M83 125Q102 118 126 125L129 145Q104 170 80 145Z" fill="#ed9db8" stroke="#39243d" stroke-width="2"/>':''}`;
const profile=`<path d="M82 194V160Q55 145 60 125L45 117L57 107L45 103L59 86L64 69Q61 28 112 22Q176 23 177 85Q180 138 145 157V194" fill="#806d80" stroke="#d6bdcf" stroke-width="3"/><path d="M62 82L78 82" stroke="#271b2b" stroke-width="4"/><path d="M58 111L75 112" stroke="#38233b" stroke-width="3"/>`;
const text=(s,x,y)=>`<text x="${x}" y="${y}" fill="#e8dbea" font-size="12" font-family="Arial" text-anchor="middle">${s}</text>`;
export function functionIllustration(kind,color='#f6ce69'){
 if(!/^#[0-9a-f]{6}$/i.test(color))color='#f6ce69';
 let art=face(),title='12 nerves · وظائف مرتبطة بأعضاء واضحة',caption='Function illustration · keep the 3D nerve and its target in view.';
 if(kind==='smell'){
  title='Smell · الشم';caption='Odorants reach olfactory mucosa in the roof of the nasal cavity; CN I carries smell.';
  art=profile+`<path d="M30 165V116" stroke="#87ca9c" stroke-width="4"/><g fill="#edb6d1"><circle cx="28" cy="102" r="11"/><circle cx="17" cy="111" r="10"/><circle cx="39" cy="112" r="10"/></g><circle cx="28" cy="112" r="6" fill="#f5d77b"/><path class="cn-scent" d="M33 94Q48 87 59 96M31 79Q47 69 61 85" fill="none" stroke="${color}" stroke-width="3" stroke-dasharray="3 5"/><path d="M64 68Q83 57 109 64" stroke="${color}" stroke-width="8" fill="none"/>`;
 }else if(['vision','eye','ptosis','dilated','downout','lookdown','esotropia','blink'].includes(kind)){
  title=kind==='vision'?'Vision · الإبصار':kind==='ptosis'?'Ptosis · تدلّي الجفن':kind==='dilated'?'Dilated fixed pupil · اتساع الحدقة':kind==='downout'?'III lesion · down and out':kind==='lookdown'?'IV · depress the adducted eye':kind==='esotropia'?'VI lesion · weak abduction':kind==='blink'?'Blink reflex · رمشة العين':'Eye movement · حركة العين';
  caption=kind==='blink'?'Corneal input: V1. Blink output: VII to orbicularis oculi.':kind==='lookdown'?'Superior oblique: depression is tested with the eye adducted.':kind==='vision'?'CN II carries sensory input; III, IV and VI move the eye.':'Illustrative eye position / lid / pupil; use the nerve and muscle models for anatomy.';
  const x=kind==='downout'?120:kind==='esotropia'?96:105,y=kind==='downout'?115:kind==='lookdown'?116:103,r=kind==='dilated'?18:8;
  art=`<path d="M20 103Q104 11 192 103Q106 191 20 103Z" fill="#e3dae7" stroke="#a38caf" stroke-width="4"/><circle cx="${x}" cy="${y}" r="29" fill="${color}"/><circle cx="${x}" cy="${y}" r="${r}" fill="#20172a"/><path d="M20 103Q104 11 192 103" fill="none" stroke="#c89ab6" stroke-width="8"/>${kind==='ptosis'?'<path d="M20 103Q104 11 192 103L181 115Q104 88 30 115Z" fill="#806d80"/>':''}${kind==='blink'?'<path class="cn-blink" d="M20 103Q104 11 192 103L176 120Q104 164 36 119Z" fill="#806d80"/>':''}`;
  if(kind==='eye')art+=`<path d="M104 20V4M104 187V202M18 103H3M194 103H208" stroke="${color}" stroke-width="4"/>`;
 }else if(['taste','tongue','tongueweak'].includes(kind)){
  title=kind==='tongueweak'?'XII lesion · deviation toward weak side':kind==='tongue'?'Tongue movement · حركة اللسان':'Tongue sensation and taste · اللسان';
  caption=kind==='taste'?'Anterior 2/3: general sensation V3, taste VII. Posterior 1/3: IX. These are nerve territories, not separate sweet/salt taste zones.':kind==='tongueweak'?'Example: weak right genioglossus → protruded tongue toward patient’s right (viewer’s left).':'XII supplies tongue motor function; palatoglossus is the vagal exception.';
  art=face('M77 122Q104 146 134 122',true);
  if(kind==='tongueweak')art=face('M77 122Q104 146 134 122')+'<path d="M80 126Q105 121 129 126Q123 159 72 157Q61 149 80 126Z" fill="#ed9db8" stroke="#39243d" stroke-width="2"/>';
  art+=`<path d="M84 136Q104 130 126 136" stroke="${color}" stroke-width="4" fill="none"/>`;
 }else if(['face','umn','lmn'].includes(kind)){
  title=kind==='umn'?'UMN · forehead relatively spared':kind==='lmn'?'LMN VII · whole ipsilateral face':'Facial sensation / expression · الوجه';
  caption=kind==='umn'?'Typical unilateral UMN pattern: contralateral lower facial weakness; forehead relatively spared.':kind==='lmn'?'Peripheral VII weakness affects upper and lower face on the same side. Mouth traction is toward the healthy side.':'V carries general facial sensation. VII drives facial expression.';
  art=face(kind==='face'?'M77 122Q105 145 135 122':'M75 134Q109 127 136 117');
  if(kind!=='face')art+=`<path d="M44 ${kind==='umn'?107:55}Q48 161 99 162L99 ${kind==='umn'?107:33}Z" fill="${color}" opacity=".42"/>`;
  art+=text('Patient right',45,210)+text('Patient left',164,210);
 }else if(['chew','jawweak'].includes(kind)){
  title=kind==='jawweak'?'V3 lesion · jaw toward weak side':'Mastication · المضغ';caption='Motor V3 supplies mastication; cheek sensation and facial-expression motor supply are different pathways.';
  art=face()+`<path class="cn-chew" d="M46 103L65 141L83 144L68 97ZM165 103L147 141L130 144L143 97Z" fill="${color}"/><path d="M77 164Q106 182 137 162" fill="none" stroke="${color}" stroke-width="4"/>`;
 }else if(['hearing','balance'].includes(kind)){
  title=kind==='balance'?'Balance · الاتزان':'Hearing · السمع';caption=kind==='balance'?'Vestibular receptors signal head position and movement through VIII.':'Cochlear input travels through VIII; stapedius and tensor tympani are motor pathways of VII and V3.';
  art=kind==='hearing'?`<path d="M80 161Q52 134 76 111Q48 48 97 36Q164 28 168 91Q163 121 135 127Q123 173 92 171" fill="#806d80" stroke="#d6bdcf" stroke-width="4"/><path d="M104 113Q80 71 113 61Q147 69 127 103L107 132" fill="none" stroke="${color}" stroke-width="7"/><path class="cn-scent" d="M39 66Q18 105 40 141M20 55Q-3 105 20 154" fill="none" stroke="${color}" stroke-width="4"/>`:face()+`<path d="M104 2V215" stroke="${color}" stroke-width="2" stroke-dasharray="5 5"/><path d="M27 39Q107 -2 183 43" stroke="${color}" stroke-width="5" fill="none"/>`;
 }else if(['swallow','voice'].includes(kind)){
  title=kind==='swallow'?'Swallowing · البلع':'Voice / larynx · الصوت';caption=kind==='swallow'?'IX contributes sensation and stylopharyngeus motor supply; X supplies most pharyngeal and palatal motor function.':'Vagal laryngeal branches support phonation. Left and right recurrent routes differ.';
  art=profile+`<path d="M77 116L119 121L119 183" fill="none" stroke="${color}" stroke-width="9"/><circle cx="119" cy="162" r="13" fill="${color}" opacity=".55"/>`+(kind==='voice'?`<path class="cn-scent" d="M39 112Q25 129 38 144M24 101Q4 128 23 157" fill="none" stroke="${color}" stroke-width="4"/>`:'<circle class="cn-bolus" cx="118" cy="138" r="6" fill="#fff0bd"/>');
 }else if(kind==='shoulder'){
  title='Head / shoulder movement · الرأس والكتف';caption='Spinal XI supplies sternocleidomastoid and trapezius.';
  art=face()+`<path d="M61 155L42 190L7 204M149 155L170 190L208 204" stroke="${color}" fill="none" stroke-width="14"/><path d="M29 193V160L19 170M29 160L39 170M184 193V160L174 170M184 160L194 170" stroke="${color}" stroke-width="3" fill="none"/>`;
 }
 return {title,caption,svg:`<svg viewBox="0 0 214 226" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg">${art}</svg>`};
}
