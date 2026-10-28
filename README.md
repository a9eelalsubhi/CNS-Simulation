# CNS Simulation — Aseel & MED45

**Live website:** https://a9eelalsubhi.github.io/CNS-Simulation/

GitHub Pages publishes the interactive study atlas automatically after a push to `main`. The static Pages version includes all three lectures, models, quizzes and slide references. Owner analytics remains available only on the original Worker-hosted site.

To prepare the Pages artifact locally: `node scripts/build-pages.mjs` (output: `.pages-dist/`).

Source snapshot of the CNS Anatomy Atlas: cerebral cortex, brainstem, and cranial nerves, including the 3D models, lecture datasets, reference slide images, and owner-only analytics implementation.

## Run locally

Requires Node.js 22.13 or later.

```sh
npm ci
npm run dev
```

For a production build: `npm run build`. The local development URL is printed by Vite.

The included `.openai/hosting.json` declares local storage bindings only. It contains no deployed Site ID, hosting credentials, owner secret, analytics records, or login sessions. Existing production hosting is managed separately. See `ANALYTICS.md` and `HOSTING.md` before configuring another deployment.

This snapshot includes third-party anatomical assets and supplied educational slides. Their existing attribution and license notices remain in the project; repository access does not grant additional redistribution rights to those assets.

Snapshot date: 2026-10-28. Source revision: `d1328a8bb9428a9332d7ef494b8d5463225899d1`.

---

# CNS Atlas — Aseel & MED45

Independent CNS Site, based on the approved limb-atlas interaction principles.
The original limb project, data, hosting identity and public audience are untouched.

## Lecture 2 · Brainstem (2026-10-21)

**Sectional teaching correction (version 10):** the user showed that many
internal points still indicated the same parent surface. Four new interactive
3D schematic slabs now teach the inferior/superior collicular, pontine and
medullary levels. `section-data.js` stores source-plate contour coordinates,
named target points, simplified subdivisions and explicit shared bundles.
`brainstem-sections.js` extrudes these drawings, highlights the selected region,
and returns its own mesh-local sectional anchor. It never substitutes a common
parent-surface anchor for a sectional target. The slabs are teaching diagrams,
not histological segmentation, MRI cuts or a modified BodyParts3D model.

53 of the 84 source-ordered points automatically use these sections; the other
points retain the original surface model. Card wording/order and all 133 source
lines remain unchanged. Whole brainstem / Cross-section 3D / Tilt section are
reversible without moving the lecture cursor. The body-location inset remains;
the large skeletal background is suppressed only while studying a section.
Original plates are still explicitly opened references. Region/subdivision
precision and shared bundles are labeled. In particular, corticospinal and
corticonuclear fibers share the lecture's middle crus bundle; FIPAT identifies
anterior/ventral trigeminothalamic tract and trigeminal lemniscus as synonyms,
so they are not invented as three independent parcels.

Camera transitions now interpolate orbit direction spherically and radius
separately. The old Cartesian tween passed through the target during a 180°
view change, causing the transient giant/clipped pons seen in the user's video.
Regression checks sample 101 transition poses and exercise the real desktop/
mobile UI-fitting branch. Tests require all section endpoints to hit their own
named contours, visible active regions, semantic colors, distinct midbrain
locations except documented shared bundles, bounded section caches/disposal,
and preservation of every original source primitive/transform. Browser Next
testing covered all 84 points (53 sections across all four levels), matched
card/arrow colors, one canvas and no console errors. Tilt, whole-model return,
quiz restoration and compact toolbar/arrow layout were checked. Browser
screenshots remain unavailable; independent contour rendering was reviewed
against the user's original plates and is not browser screenshot proof.

**Teaching arrows restored:** the former `diagram_only` guard suppressed all
regional leaders after the 3D-first change. These now use actual parent-mesh
surface vertices, a dashed arrow and an explicit named-region note. They do
not imply that an unsegmented tract/nucleus has an exact 3D boundary. Exact
targets retain mesh-local anchors; when another opaque structure covers one,
the arrow stays visible with a hollow endpoint and a named-cover note rather
than disappearing on orbit. Hidden layers still hide their arrows. Long
nerve/vessel/column anchors use original vertices near the brainstem instead
of distant whole-structure box centers. `leader-projection.js` separates CSS
projection and occlusion state from card layout.

Regression checks cover all 84 primary leaders on desktop/mobile, source
vertices, regional vs exact semantics, opaque covers, hidden layers, and
CSS scaling. Browser Next testing confirmed all 84 primary arrows, matching
card/line colors, one 3D canvas, no automatic image overlay and no console
errors. The six view buttons and compact layout were checked. Browser
screenshot capture was unavailable; these are DOM/geometry checks, not a
claim of pixel screenshot review.

**3D-first correction:** every guided point and directory inspection stays in
the interactive anatomical model. Images never open automatically or replace
the canvas. **Reference figure** opens a separate, dismissible original-slide
dialog only after the learner requests it. `brainstem-study.js` provides 3D
focus presets using existing source colliculi, nuclei and peduncles; it does
not fabricate missing tract meshes. Switching levels preserves the guided
cursor and stays in 3D. Regional-context notes distinguish unavailable fine
segmentations. Saved points from the earlier image-based revision also open
in 3D. The full-body locator and both-lecture context remain available.

The camera's UI-fitting branch formerly applied a cortex-only filter after
selecting brainstem surfaces. For a colliculus/nucleus point it discarded all
gross stem vertices, leaving the camera just .085 m away and cropping the
model. The filter is now scoped to cortex lectures. Regression checks project
actual brainstem vertices inside the free canvas at desktop and mobile sizes,
including the teaching cards and viewport controls.

The existing public CNS Site now includes **Lecture 2**, selected with
`?lecture=2`. `brainstem-source.json` records all **133 source lines** from the
user's nine-page **L2 - Brain Stem.pdf** (printed pages 12–20).
`build_brainstem.py` generates **84 source-ordered points**, **77 directory
entries**, and **12 recall questions**. Primary teaching cards retain the
literal slide wording. Source corrections stay in separate reference notes,
including the inferior salivatory nucleus's medullary location.

`prepare_brainstem.py` repacks **264 original source meshes** with unchanged
Draco payloads and transforms: the original CNS context, real external
brainstem subdivisions, colliculi, pyramids, olives, available nuclei, cranial
nerves III–XII, and vertebral/basilar arteries. The anterior/posterior presets
expose both sides. Cranial-nerve displays and arrow anchors use their proximal
roots; clipped distal branches cannot be picked or hide a pointer. Selected
internal structures ghost the enclosing shell, unless the user overrides its
opacity. Isolate and layer switches retain their original behavior.

`brainstem-plates.js` retains reference metadata for the embedded lecture
illustrations (anterior, posterior, in situ, midbrain levels, pons and medulla).
Its former inline display is disabled, including for legacy point flags. The
toolbar selects 3D focus, and its explicit reference action opens that source
slide in the separate figure dialog. Quiz exit restores the selected 3D focus.
The original highlighted whole slides are retained as optional references.

The visual progression follows primary university teaching resources from
[Duke](https://brain.oit.duke.edu/lab03/lab03.html),
[Tel Aviv University](https://www.neuroanatomy.sites.tau.ac.il/brainstem), and
[UTHealth](https://nba.uth.tmc.edu/neuroanatomy/L9/Lab09p12_index.html).
No third-party atlas plates were copied.

## Human-body context · both lectures

`body-context.js` adds the complete same-subject skeleton in original world
coordinates to Lectures 1 and 2, transparent by default with an independent
opacity control. A full-body locator remains visible while studying a close-up;
**Whole body / Return to lesson** provides a reversible body-scale view without
changing the lecture point. The static skeleton's world geometry is merged
once into a single draw call. The locator reuses the same WebGL renderer with
a scissored second camera, rather than creating another renderer or another
copy of the brain's GPU geometry. Context bones never enter label occlusion,
anatomical picking or the lesson focus box. Resource cleanup handles the shared
geometry exactly once. History restoration recreates a disposed WebGL document.

Validation: both `check-cns.mjs` and `check-brainstem.mjs` pass. The browser's
Next control was used through **all 84 Lecture 2 points** with all nine source
slides reached, one canvas, no missing card text, and no console errors. The
3D-first regression walk also checked every point: zero inline images, zero
automatically opened figure dialogs, and 3D active throughout all 84 points.
Mobile layout, body/diagram separation, comparison without cursor movement,
whole-body return, quiz feedback/restoration and correct source-figure paging
were checked through the browser. Browser screenshot capture was unavailable
in this session; source figures and original geometry were inspected separately,
and DOM/layout checks do not substitute for a final visual browser review.

## Content and display

The default view is now **Illustrated 3D**, responding to the lecture-diagram
reference: muted categorical region fills, dark continuous sulcal guides,
names following the gyri, and compact lavender leaders naming sulci. Names are
projected from the source surfaces, occluded on the far side, and packed with
rotated rectangles so adjacent strip labels can coexist. Choose Gyri, Sulci,
or both. The default **Current lesson · focused** label detail names only the
current structure and relevant neighbors (at most three names in compact
windows, five on desktop). **Full study map** restores the broader directory.
Names use straight, upright projected baselines with real text measurements;
all names, including active names sharing an ID, obey the collision rule.
Controls, explanation cards and navigation are reserved obstacles. Far-side
names are occlusion-tested as the camera moves, without the old 160ms lag.
Click an on-surface name or groove to inspect it without changing the
saved lecture cursor; **Continue lecture** restores that point.
The CNS identity uses a charcoal-plum canvas with crimson and lavender controls;
both rendering modes stay dark. The MED45 emblem receives a matching CSS
alpha-mask color treatment, preserving its original asset and shape.
Shaded 3D remains available.

The guided tour combines this map with color-matched external explanations.
`lecture-source.json` records the supplied **L1 - Functional areas of cerebral
cortex.pdf** (SHA-256 recorded). All 213 ordered source lines are covered by
`slide_sequence.py`, which builds 147 teaching points across slides 1–11.
The image-only summary on slide 10 has a visually checked transcription.
Every point stores its literal source range and excerpt; primary text and
bullets must equal that excerpt. Punctuation is normalized; slide medical
wording remains in the main card and accuracy notes remain separately labeled.
The previous `lecture_sequence.py` is retained only as historical source.
`lesson-palette.js` gives each structure a stable semantic color shared by the
card border/title, leader, endpoint and selected source meshes/sulcal guides.
Related same-slide structures get separate colors and callouts (three on wide
screens; selectable color tabs on compact screens). The source slide thumbnail
and Slide / Item indicators update together. Camera fitting reserves all cards.
The new progress revision starts on slide 1 instead of restoring an old cursor.
**Next** follows the original PDF from top to bottom, including the illustrated
summary, every commissural example, and all four corpus-callosum parts.
`slide_sequence.py` defines 147 source-ordered points across PDF pages 1–11;
each point has its own text, bullets and explicit subset of source targets.
The 68-entry anatomy directory and quiz remain independent of that sequence.
Progress is saved by a stable point ID under a versioned key, so old numeric
positions cannot silently open a different point after this reordering.

`guided-explanations.js` projects mesh-local anchors through the tested CSS-pixel
projection helper. It targets the visible source-derived sulcal guide rather
than a buried groove wall. Special corpus-part positions keep their explicit
source anchors. The camera reserves a side gutter on wide canvases, or space
above a lower explanation card on compact screens. Compact view height follows
the available window minus the measured header, replacing the fixed 1080px
canvas that pushed the explanation and Next below the fold. Compact controls
and navigation remove duplicate headings; long teaching text scrolls inside
its card without shrinking the model below its real free rectangle. Selecting
a chapter/search result below the mobile viewer returns to that viewer.
Surface names avoid the
card. Text and bullets are visible automatically; source clarifications and
the duplicate lecture notes remain available. Explanation arrows and surface
names have independent toggles; both hide during quizzes and restore afterward.

`build_surface_map.py` thins the projected source sulcal ribbons into 50
named-hemisphere guides (77 branches). `dist/surface-atlas.js` drapes those
centerline graphics over the original hemisphere, keeping real depth testing.
These are teaching traces derived from the source geometry, not new sulci,
patient-specific boundaries, or a replacement segmentation. The source meshes
and transforms remain unchanged. Traces, pick targets, and DOM listeners are
disposed together. Camera fitting uses actual vertices and the final free
canvas rectangle after the notes panel changes, rather than an oversized
sphere intended for peripheral cards.

- Lecture 1: 11 slide chapters plus explorer, 147 scenes, 68 structure/concept entries, 20 recall questions.
- All 11 pages of the latest supplied Dr Ibrahim Amr PDF are included.
- 195 CNS-only source meshes are repackaged from the original licensed atlas.
- Region colors are categorical and opaque by default; actual source geometry
  supplies the boundaries. No distance/fade painting or invented cortical mesh.
- Presets, reset, two-finger navigation, touch scroll lock, directory/search,
  independent layers/opacity, label packing, figure references and quiz mode.
- `data/lectures.json` is the small lecture registry. Only the selected dataset
  and its model are fetched. Lecture changes replace the document after explicit
  resource cleanup, rather than keeping multiple renderers alive.

The insular/subcentral source parcel is not reliable as isolated insular
cortex. It is colored as a neutral opercular parcel. The genuine circular
sulcus identifies the insular boundary after the surrounding opercula are
removed; this is a parent/boundary relation, not a fabricated insular fill.
Unavailable fine structures remain explained with their related anatomy and
the original lecture page. Functional regions without independent segmentation
are marked **Regional locator**. Source-specific notes explain merged parcels,
language localization, and clinical simplifications. Schematic connection routes
are labeled as such and are not tractography.

## Source organization

`public/` contains the authored atlas application and assets. The Vinext/Worker
wrapper serves it and the private analytics routes; `dist/` is generated output.
`build_lecture.py` creates the lecture JSON from explicit teaching records.
`prepare_assets.py` selects the CNS meshes from `../tmp/nervous_male.glb` and
reuses the old atlas's Three.js vendor files, transparent logos and tested
annotation/resource utilities. It preserves original compressed primitives,
accessors and node transforms; the full source asset is not redeployed.

Lecture JPEGs were rendered with bundled Poppler at 1450-pixel maximum size:

    pdftoppm -f 2 -l 12 -scale-to 1450 -jpeg -jpegopt quality=87 <supplied-PDF> dist/slides/lecture

Rebuilding the data/model:

    python prepare_assets.py
    python build_lecture.py
    node --experimental-loader ./local-loader.mjs check-cns.mjs

## Verification

The test decodes actual Draco geometry and checks all scene/page/quiz links,
every copied source primitive/transform, anchors on real surface vertices,
opaque defaults, independent cortex removal, all anatomical camera presets at
desktop/tablet/phone aspects, opposite-hemisphere removal for medial views,
and creation/disposal of connection guides. Presentation never changes the
source mesh vertices or matrices. Projection/packing use CSS pixels, including
canvas scaling, and use one navigable label when space is constrained.

The browser review covers search, original figure loading, quiz feedback and
restoration, schematic route controls, one canvas, view/hemisphere state,
phone-width overflow and label rectangles. Pixel screenshots may be unavailable
in a hidden preview; a separate source-geometry rendering is explicitly labeled
as a geometry review rather than a browser screenshot.

Reference links and model/software credits are included in the Site's Sources
dialog and `public/models/ATTRIBUTION.txt`. Netter and Haines publisher overviews
are recommended atlas references; access to their full books is not claimed,
and their copyrighted plates have not been copied.

## Extending to another CNS lecture

Add an explicit lecture dataset and registry entry, with that lecture's own
source pages, exact mesh bindings, references and functional-locator notes.
Do not guess cytoarchitectonic or vascular boundaries from a gyrus bounding box.
Run the same source/scene checks and add lecture-specific clinical validations.
Keep one renderer, dispose pending loads and geometry on exit, and preserve
source attribution and the newly registered CNS hosting identity.

## Lecture 3: Cranial nerves

`build_cranial.py` produces 167 source-ordered points spanning all 286 source
lines on the 17 supplied pages, including manually checked image-only tables.
The four supplied memory-map pages remain accessible as supplementary references.
Literal slide text is preserved; medical corrections are separate reference notes.

`prepare_cranial.py` exports 450 original BodyParts3D meshes with their compressed
geometry and transforms unchanged. Named nerves, sensory organs and target
muscles use source surface vertices for leaders. Unsegmented branches, ganglia,
foramina and functional relationships use explicitly labeled, not-to-scale 3D
teaching diagrams. These are not claimed to be measured atlas segmentations.
Original anatomy is now the default on every lecture point. `cranial_routes.py`
binds 24 routes to actual nerve, central connection and target-tissue meshes.
The optional relationship map never silently replaces the nerve. Full-route
and focused-explanation camera modes share the same unchanged source geometry.

Precise arrows use explicit `focus_targets` and `anchor_binding` records.
Proximal anchors query a KD tree of registered central-connection vertices;
distal/context anchors identify a named source organ or source nerve. Olfactory
subregions have reviewed world-space hints snapped to the combined source mesh.
No pointer is substituted for an absent fine branch. Its explanation remains
in source order, with separate, accurately named nerve/target context callouts.

Source limitations are displayed in the interface. In particular, the supplied
vagus mesh ends in the lower neck / upper thorax: recurrent loops, distal vagal
trunks, cardiac plexuses, fine ganglia and microscopic terminal fibers are not
invented as 3D tubes. The optional diagram can explain relationships missing
from the mesh. This is an educational atlas, not clinically validated imaging.

Human function pictures are original SVG illustrations (smell, eye, tongue,
face, hearing, swallowing and shoulder). They are not anatomical sections.
The application retains a single renderer, independent anatomy layers,
source slides, color-matched leaders, point search, 12 recall questions and
owner-only analytics. Published analytics accepts lecture 3.

Validation commands:

    node --loader ./local-loader.mjs check-cns.mjs
    node --loader ./local-loader.mjs check-brainstem.mjs
    node --loader ./local-loader.mjs check-cranial.mjs
    node --test test-analytics.mjs

The cranial check verifies every source line once in order, original mesh bytes
and matrices, all dataset links, 708 desktop/mobile anatomy endpoints, surface hits,
colors, camera framing, explicit diagram targets and stable resource reuse.
Browser QA additionally checks actual text readability and the function pictures;
geometry tests alone do not establish visual readability or clinical validation.

The route revision also verifies emergence landmarks (rather than merely a hit
somewhere on a long nerve), deliberate absence of false fine-structure anchors,
optional-map endpoints, original source transforms, and diagram/source disposal.

Nerve readability: nerve surfaces use their exact semantic colors without
lighting washout. A backface silhouette adds 1.15 CSS pixels in clip space for
small screens. This is a rendering emphasis only: the original source vertices,
world transforms, raycast geometry and anatomical anchor points stay unchanged.
The extra materials are removed and disposed when the lecture unloads.

Video regression (2026-10-24): overview points with no primary mesh were
wrongly discarded by the cortical camera filter, leaving a minimum 85 mm
camera distance and cropping the nerves. Cranial routes now use their own
complete framing set, with exact perspective bounds for the offset teaching
rectangle. Every framed source vertex is checked on desktop and phone, including
overview / deliberately unsegmented points. The camera distance limit follows
the fitted route instead of clamping a correctly fitted long route afterward.

General cranial overviews use a named head/upper-neck window (world y >= 1.48 m)
to avoid letting a long vagal/neck extension dominate the introductory view.
The same world-space cut is applied to both the source surface and its screen
outline. Single-nerve route scenes remain uncut; tests enforce that distinction.
