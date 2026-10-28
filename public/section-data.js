// Teaching sections drawn from the supplied lecture plates (image-pixel units).
// These are extruded SCHEMATICS, not new BodyParts3D segmentations or MRI cuts.
// Closed contours preserve the plate's topology. Subdivisions of a shared
// lemniscal ribbon are schematic positions, not claimed histological borders.
const feature=(id,path,anchor,color,extra={})=>({id,path,anchor,color,mirror:true,precision:'lecture-contour',...extra});
const ellipse=(x,y,rx,ry)=>`M ${x-rx} ${y} C ${x-rx} ${y-ry*.552} ${x-rx*.552} ${y-ry} ${x} ${y-ry} C ${x+rx*.552} ${y-ry} ${x+rx} ${y-ry*.552} ${x+rx} ${y} C ${x+rx} ${y+ry*.552} ${x+rx*.552} ${y+ry} ${x} ${y+ry} C ${x-rx*.552} ${y+ry} ${x-rx} ${y+ry*.552} ${x-rx} ${y} Z`;
const midbrainCommon=(upper=false)=>{
 return [
  feature('aqueduct',upper?'M697 137 Q684 145 687 159 Q676 170 690 182 Q689 208 699 200 Q710 191 704 174 Q720 163 705 155 Q709 134 697 137 Z':'M628 198 Q615 202 621 216 Q602 223 619 237 Q620 261 630 251 Q640 245 636 233 Q654 222 638 214 Q641 194 628 198 Z',upper?[699,170]:[629,225],'#71c4ef',{mirror:false}),
  feature('mesencephalic-v',ellipse(...(upper?[810,163]:[722,219]),8,18),upper?[810,163]:[722,219],'#e8d978'),
  feature('mlf',ellipse(...(upper?[794,281]:[687,327]),12,13),upper?[794,281]:[687,327],'#a6bce9'),
  feature('reticular',ellipse(...(upper?[865,305]:[741,447]),upper?18:22,upper?26:42),upper?[865,305]:[741,447],'#af9c85',{precision:'schematic-region'}),
 ];
};
export const SECTIONS={
 inferior:{name:'Inferior collicular midbrain',source:'inferior',page:3,crop:[225,80,1030,715],midline:630,
 outline:'M630 114 C582 76 497 76 472 135 C462 179 423 203 395 248 L331 333 C284 348 245 362 238 414 C235 454 252 474 270 507 C299 557 329 608 373 653 C407 687 449 699 476 700 C528 706 541 643 559 602 C584 554 609 524 630 497 C653 528 677 558 700 610 C716 655 732 703 772 701 C840 699 889 655 935 609 C983 551 1020 485 1017 432 C1016 384 993 363 946 347 C911 337 891 313 865 277 L805 195 C784 173 785 130 759 110 C724 81 673 89 630 114 Z',
 features:[
  feature('tegmentum','M630 126 C687 107 760 147 793 193 L868 307 L916 374 Q815 486 693 520 L630 487 L567 520 Q445 486 344 374 L392 307 L467 193 C500 147 573 107 630 126 Z',[742,393],'#927d9f',{mirror:false,precision:'schematic-region',aliases:['peduncle']}),
  feature('central-gray',ellipse(630,230,107,74),[683,199],'#85768e',{mirror:false}),
  feature('inferior-colliculi',ellipse(732,135,36,29),[732,135],'#88d2a4',{aliases:['tectum']}),
  ...midbrainCommon(),
  feature('trochlear-nucleus',ellipse(658,299,13,13),[658,299],'#efd878'),
  feature('lateral-lemniscus','M808 228 Q819 218 833 245 L849 281 L817 283 Q809 258 808 228 Z',[824,253],'#73cce4',{precision:'schematic-subdivision'}),
  feature('trigeminal-lemniscus','M817 283 L849 281 Q858 301 850 320 L814 322 Q820 304 817 283 Z',[837,302],'#b4a2e7',{precision:'schematic-subdivision'}),
  feature('spinal-lemniscus','M814 322 L850 320 L847 357 L798 358 Q800 339 814 322 Z',[826,340],'#72c99a',{precision:'schematic-subdivision'}),
  feature('medial-lemniscus','M798 358 L847 357 Q850 391 830 410 Q807 424 797 398 Q789 381 798 358 Z',[820,382],'#68c8d6',{precision:'schematic-subdivision'}),
  feature('scp-crossing','M552 369 L630 409 L708 369 L720 391 L652 438 L714 481 L698 497 L630 455 L562 497 L546 481 L608 438 L540 391 Z',[635,438],'#9acb88',{mirror:false,aliases:['scp']}),
  feature('substantia-nigra','M649 503 Q723 548 790 559 Q868 565 927 485 L936 507 Q866 585 791 583 Q708 569 662 528 Z',[799,571],'#5b536a'),
  feature('frontopontine','M649 528 Q689 552 722 565 L775 692 Q735 719 710 658 Q685 592 649 528 Z',[729,635],'#e8ba6d'),
  feature('cortical-bundle','M722 565 Q838 617 914 538 L951 588 Q884 667 813 690 L775 692 Z',[853,630],'#dc8495',{aliases:['corticospinal','corticobulbar','crus'],shared:'Corticospinal + corticonuclear fibers occupy the shared middle portion of crus cerebri.'}),
  feature('temporopontine','M927 485 L1003 442 Q1018 505 951 588 L914 538 Z',[974,504],'#b7a0e1'),
 ]},
 superior:{name:'Superior collicular midbrain',source:'superior',page:4,crop:[250,10,1130,705],midline:700,
 outline:'M700 49 C660 49 643 15 597 23 C546 28 528 51 511 98 C487 148 451 181 414 237 C377 287 333 303 301 326 C264 354 258 390 270 423 C278 489 316 548 355 593 C393 642 455 680 513 690 C549 698 574 661 590 624 C620 553 656 519 700 478 C742 519 780 558 806 624 C822 661 847 698 883 690 C945 680 1004 642 1048 593 C1086 548 1118 486 1118 422 C1130 381 1111 347 1080 327 C1044 303 1004 286 967 237 C930 181 894 148 870 98 C853 51 835 28 784 23 C738 15 724 49 700 49 Z',
 features:[
  feature('tegmentum','M700 58 Q820 29 873 142 L968 270 L1020 345 Q925 521 805 535 L700 477 L595 535 Q475 521 380 345 L432 270 L527 142 Q580 29 700 58 Z',[859,316],'#927d9f',{mirror:false,precision:'schematic-region',aliases:['peduncle']}),
  feature('central-gray',ellipse(700,195,119,99),[756,130],'#85768e',{mirror:false}),
  feature('superior-colliculi',ellipse(811,66,40,32),[811,66],'#efc15c',{aliases:['tectum']}),
  ...midbrainCommon(true),
  feature('oculomotor-nucleus','M749 237 Q771 229 774 257 Q765 289 746 284 Q722 279 733 257 Z',[752,260],'#f0d879'),
  feature('red-nucleus',ellipse(799,407,76,73),[799,407],'#ef89b4'),
  feature('trigeminal-lemniscus','M894 174 Q908 165 919 191 L940 245 L907 254 Q905 217 894 174 Z',[918,224],'#b4a2e7',{precision:'schematic-subdivision'}),
  feature('spinal-lemniscus','M907 254 L940 245 L953 287 L915 297 Z',[932,273],'#72c99a',{precision:'schematic-subdivision'}),
  feature('medial-lemniscus','M915 297 L953 287 Q957 342 928 383 Q901 400 881 366 Q872 348 892 328 Z',[916,347],'#68c8d6',{precision:'schematic-subdivision'}),
  feature('substantia-nigra','M723 495 Q804 531 866 524 Q930 507 966 432 L978 448 Q943 535 866 548 Q783 550 733 517 Z',[868,538],'#5b536a'),
  feature('frontopontine','M733 517 L791 541 L833 684 Q812 695 793 652 Q763 583 733 517 Z',[795,613],'#e8ba6d'),
  feature('cortical-bundle','M791 541 Q890 569 971 487 L1049 589 Q974 670 889 685 L833 684 Z',[934,599],'#dc8495',{aliases:['corticospinal','corticobulbar','crus'],shared:'Corticospinal + corticonuclear fibers share the middle crus cerebri; the lecture does not separate their boundaries.'}),
  feature('temporopontine','M966 432 L1115 421 Q1123 500 1049 589 L971 487 Z',[1063,483],'#b7a0e1'),
 ]},
 pons:{name:'Pons · facial colliculus level',source:'pons',page:6,crop:[155,68,615,420],midline:384,
 outline:'M289 80 Q322 102 384 101 Q444 102 487 82 L598 177 Q601 236 573 286 Q533 355 467 385 Q422 405 397 408 L384 397 L371 408 Q346 405 301 385 Q235 355 195 286 Q167 236 169 177 Z',
 features:[
  feature('pontine-tegmentum','M289 80 Q334 109 384 101 Q434 109 487 82 L598 177 L588 235 Q486 301 384 302 Q282 301 179 235 L169 177 Z',[429,232],'#9a88b1',{mirror:false,precision:'schematic-region',aliases:['pontine-sensory','pontine-motor']}),
  feature('fourth-ventricle','M322 106 L438 106 Q450 111 457 145 Q481 198 434 189 Q407 176 384 201 Q361 176 334 189 Q287 198 311 145 Z',[384,143],'#75c8e7',{mirror:false}),
  feature('scp','M438 106 Q454 88 472 106 Q495 135 478 151 Q463 161 453 145 Z',[465,127],'#8acdaa'),
  feature('icp',ellipse(498,182,11,23),[498,182],'#74c9a3',{aliases:['vestibulocerebellar'],shared:'Vestibulocerebellar fibers are shown with the inferior cerebellar peduncle, not as a separately bounded nucleus.'}),
  feature('vestibular-nuclei','M473 164 Q487 151 486 177 Q477 198 466 197 Q476 185 473 164 Z',[477,182],'#ddc876'),
  feature('mlf',ellipse(397,200,6,8),[397,200],'#8bb9e4',{aliases:['medial-vestibulospinal'],shared:'The medial vestibulospinal pathway descends with the MLF; the marker identifies this shared medial route.'}),
  feature('abducens-nucleus',ellipse(408,204,8,8),[408,204],'#edcb72'),
  feature('facial-colliculus','M398 189 Q420 184 431 207 L425 219 Q412 194 400 201 Z',[415,196],'#df99c2'),
  feature('facial-nucleus',ellipse(439,241,8,7),[439,241],'#e997b7'),
  feature('trigeminal-nuclei',ellipse(484,225,10,9),[484,225],'#c9d58c',{precision:'schematic-region'}),
  feature('reticular',ellipse(426,229,13,14),[426,229],'#b5a28d',{precision:'schematic-region'}),
  feature('medial-lemniscus','M394 255 Q421 246 442 251 Q462 269 436 280 Q409 288 394 273 Z',[425,266],'#6bc9d4'),
  feature('trigeminal-lemniscus',ellipse(463,261,8,11),[463,261],'#b4a2e7',{precision:'schematic-location',aliases:['ventral-trigeminal','anterior-trigeminothalamic'],shared:'Trigeminal lemniscus, ventral trigeminothalamic tract and anterior trigeminothalamic tract are names for the same ascending pathway (FIPAT TNA).'}),
  feature('dorsal-trigeminal',ellipse(460,224,5,7),[460,224],'#92b9df',{precision:'schematic-location'}),
  feature('central-tegmental',ellipse(436,218,6,10),[436,218],'#e5b579',{precision:'schematic-location'}),
  feature('lateral-lemniscus',ellipse(506,250,6,12),[506,250],'#88c4e1',{precision:'schematic-location'}),
  feature('lateral-vestibulospinal',ellipse(491,209,5,9),[491,209],'#d8b1dc',{precision:'schematic-location'}),
  feature('mcp','M578 187 L598 177 Q603 221 582 256 L559 242 Z',[585,216],'#86c8b1'),
  feature('pontocerebellar','M184 282 Q276 342 384 344 Q492 342 584 282 L573 300 Q485 366 384 361 Q283 366 195 300 Z',[487,339],'#b9a3dd',{mirror:false,precision:'schematic-region'}),
  feature('corticopontine','M455 306 L463 304 L467 319 L461 330 L455 326 Z',[461,316],'#81b6dc',{precision:'schematic-route'}),
  feature('pontine-nuclei',ellipse(433,346,25,19),[433,346],'#e2bf73',{precision:'schematic-region'}),
  feature('cortical-bundle','M415 318 L427 315 L433 326 L424 337 L414 330 Z',[423,325],'#df8da7',{aliases:['corticospinal','corticobulbar'],shared:'Descending corticospinal and corticonuclear bundles are interspersed with pontine nuclei and transverse fibers.'}),
 ]},
 medulla:{name:'Medulla · sensory crossing schematic',source:'medulla',page:9,crop:[143,22,556,361],midline:350,
 outline:'M350 51 Q326 23 299 30 Q278 31 259 46 Q229 31 208 46 Q170 62 158 103 Q144 164 159 218 Q178 280 218 316 Q257 358 313 358 Q337 356 350 345 Q365 356 389 358 Q443 358 482 316 Q522 280 541 218 Q556 164 542 103 Q530 62 492 46 Q472 31 441 46 Q422 31 401 30 Q374 23 350 51 Z',
 features:[
  feature('central-gray',ellipse(350,147,49,31),[374,138],'#9291a3',{mirror:false}),
  feature('gracile',ellipse(391,78,17,37),[391,78],'#e2c77b',{shared:'Dorsal-column/gracile nuclear relationship, schematic: the lower caudal column and upper nucleus are not the same structure.'}),
  feature('cuneate','M426 88 Q436 70 446 84 L433 135 Q414 147 414 129 Z',[433,101],'#dfbb78'),
  feature('cuneocerebellar',ellipse(467,81,12,5),[467,81],'#aad28b',{shared:'Accessory cuneate relay of the cuneocerebellar pathway; the original plate marks the relay, not the entire tract.'}),
  feature('posterior-spinocerebellar','M538 117 Q552 130 547 159 L541 196 L528 196 Q535 163 530 138 Z',[540,160],'#90cf96',{precision:'schematic-subdivision'}),
  feature('anterior-spinocerebellar','M528 204 L540 205 Q531 247 507 277 Q490 280 496 260 Z',[519,243],'#bfd98b',{precision:'schematic-subdivision'}),
  feature('spinal-lemniscus',ellipse(497,212,8,13),[497,212],'#7abddc'),
  feature('medial-lemniscus','M359 230 Q370 232 371 252 L371 281 Q360 289 354 279 Z',[362,264],'#8dd5c3'),
  feature('pyramid','M357 298 Q389 284 421 299 Q443 316 445 348 Q414 366 389 357 Q365 352 357 324 Z',[399,329],'#e7b66f'),
  feature('olive','M441 252 Q452 250 452 260 Q476 253 479 272 Q497 281 481 295 Q485 314 463 310 Q438 320 431 301 Q443 302 449 304 Q469 312 472 299 Q487 291 476 284 Q462 269 451 275 Q430 269 441 252 Z',[462,281],'#bba0d9'),
  feature('reticular',ellipse(444,209,19,21),[444,209],'#b6a58d',{precision:'schematic-region'}),
  feature('internal-arcuate','M394 91 Q418 187 376 238 L337 272 L333 267 L370 233 Q412 187 387 93 Z',[381,227],'#ec819a',{mirror:true,precision:'schematic-route'}),
 ]}
};

// Resolve by POINT, not by a structure's first appearance in another page.
// For example, the same medial lemniscus has a different position in medulla,
// pons and midbrain. No common parent-surface fallback is allowed here.
export function sectionFor(step){
 if(step.section_key)return step.section_key;
 return null;
}
export function sectionFeature(key,id){return SECTIONS[key]?.features.find(f=>f.id===id||f.aliases?.includes(id));}
