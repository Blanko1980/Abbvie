// Alle Gemini-Assets für „Zwei Routinen“.
// kind: 'scene' (deckend), 'plate' (weißer Grund, Flood-Fill-Alpha), 'edit' (Bearbeitung eines anderen Assets,
// pixelgleich ausgerichtet → Differenzmaske in postprocess), 'accent'.
// refs: Referenzbilder (Pfade relativ zu zwei-routinen/), base: Asset-ID, die bearbeitet wird.

// Stilpräfix: Stil C des ersten NAVI-Films (Nutzerwunsch „im gleichen Stil“), mit den Farbregeln dieses Briefings.
export const STYLE_PREFIX = [
  'Premium flat 2D vector illustration for a calm corporate explainer film, as drawn in Adobe Illustrator:',
  'NO outlines or contour lines, every shape is a clean vector shape with smooth soft gradients, very soft paper grain,',
  'gentle rim light and soft light bloom, softly blurred backgrounds (shallow depth of field).',
  'Stylised, slightly simplified friendly faces (simple dark eyes, small nose, simple mouth, light blush), clear readable expressions,',
  'no photo realism, no 3D render, no comic line art. Calm, warm, human mood, medical but not clinical.',
  'Bright airy world with lots of white and light warm grey, generous white space.',
  'Straight, slightly elevated three-quarter camera, consistent lens and scale across all scenes. Props simple and slightly oversized.',
  'Palette: white, light warm greys, charcoal (#25282A) for dark accents, muted beige and light wood, soft muted green for plants, natural varied skin tones.',
  'Absolutely NO teal, NO blue, NO turquoise, NO gold, NO yellow anywhere in the image (not in sky, windows, glass, clothing, objects or light).',
  'Windows show soft white light only.',
  'No text, no logos, no letters, no numbers, no brand marks, no signs.',
].join(' ');

export const EDIT_SUFFIX = [
  'Keep the exact same illustration style (flat vector, no outlines, soft gradients), the same framing, camera and image size.',
  'Absolutely no teal, blue, gold or yellow. No text, no numbers, no logos.',
].join(' ');

const STYLE = ['assets/reference/stil-c-kueche.jpg', 'assets/reference/stil-c-auto.jpg'];
const DOC = 'assets/gen/A1.jpg';

const sheet = (who) =>
  `CHARACTER MODEL SHEET on a plain white background, 16:9. ${who} ` +
  'Show in a row: full body front view, three-quarter view, side view and a seated view; on the right two or three head close-ups with calm, listening and slightly smiling expressions. Even lighting, soft floor shadows only, no labels.';

const lesions = (where, tone) =>
  `Atopic dermatitis shown respectfully and matter of fact in neutral illustration terms: flat textured patches of dry skin drawn with soft shading ${where}. ${tone} Never a shock image.`;

export const ASSETS = [
  // ---------------------------------------------------------------- Gruppe A: Figurenblätter
  {
    id: 'A1', group: 'A', kind: 'scene', refs: STYLE,
    prompt: sheet('The DOCTOR: a man in his late 40s, short greying hair (dark grey with lighter grey at the temples), clean-shaven, kind attentive face, slim build. He wears a charcoal crew-neck jumper over a light grey shirt collar and dark grey trousers; in two of the views he also wears an open light grey-white doctor\'s coat over the jumper.') +
      ' Additionally, below the heads: two hand studies of his right hand (index finger extended to tap a screen; palm down pushing something flat across a table).',
  },
  {
    id: 'A2', group: 'A', kind: 'scene', refs: [...STYLE, DOC],
    prompt: sheet('PATIENT 1: an adult man in his 30s, short dark hair, light-medium skin tone, average build, wearing a muted warm-grey sweater and dark trousers.') + ' ' +
      lesions('mainly on the backs of both hands and on the sides of the neck', 'Slightly reddish-brown, dry, rough patches on light-medium skin.') +
      ' Match the rendering style of the attached doctor sheet exactly.',
  },
  {
    id: 'A3', group: 'A', kind: 'scene', refs: [...STYLE, DOC],
    prompt: sheet('PATIENT 2: an adult woman in her 40s, lighter (ash-blonde) shoulder-length hair, fair skin, slim build, wearing a soft off-white blouse and a muted beige cardigan.') + ' ' +
      lesions('on the neck and on one side of the face near the jaw', 'Pinkish, dry, slightly rough patches on fair skin.') +
      ' Match the rendering style of the attached doctor sheet exactly.',
  },
  {
    id: 'A4', group: 'A', kind: 'scene', refs: [...STYLE, DOC],
    prompt: sheet('PATIENT 3: an adult man in his 50s with a broader, sturdy build, very short black hair with a little grey, deep brown skin tone, wearing a charcoal-brown cardigan over a light shirt.') + ' ' +
      lesions('on the backs of the hands and a few small spots on the face', 'On deep brown skin the patches are darker, drier and greyish-brown (ashy), not simply red.') +
      ' Match the rendering style of the attached doctor sheet exactly.',
  },
  {
    id: 'A5', group: 'A', kind: 'scene', refs: [...STYLE, DOC],
    prompt: sheet('PATIENT 4: an adult woman in her 30s, medium-brown skin, dark curly hair tied in a loose bun, wearing a muted olive-grey jacket over a cream top.') + ' ' +
      lesions('on the neck, the backs of the hands and on the face (cheek)', 'On medium-brown skin the patches are darker brown-grey, dry and slightly rough.') +
      ' Match the rendering style of the attached doctor sheet exactly.',
  },

  // ---------------------------------------------------------------- Gruppe B: Umgebungen (leer)
  {
    id: 'B1', group: 'B', kind: 'scene', refs: ['assets/reference/stil-c-kueche.jpg'],
    prompt: 'SCENE, 16:9: close-up of a bright kitchen counter in the morning. A simple light grey espresso machine stands right of centre; it has ONE small rectangular display on its front whose surface is a perfectly flat uniform pure magenta colour (#FF00FF, code will place the display content), and a clearly visible coffee spout pointing down. A large plain white ceramic cup that is EMPTY stands directly UNDER the spout on the drip tray (we can look slightly into the clean white inside of the cup). Behind: a window with soft white morning light, a softly blurred plant. No people, no hands, no text. Camera locked.',
  },

  {
    id: 'B2', group: 'B', kind: 'edit', base: 'B1',
    prompt: 'Edit the attached image. Keep EVERYTHING identical, pixel for pixel. Change ONLY the inside of the cup: it is now filled with dark coffee up to just below the rim. Nothing else changes.',
  },
  {
    id: 'B3', group: 'B', kind: 'scene', refs: ['assets/reference/stil-c-auto.jpg', DOC],
    prompt: 'SCENE, 16:9, over-the-shoulder view from the driver: the camera is just behind and slightly to the right of the DOCTOR sitting in the driver\'s seat of a light grey car, looking over his right shoulder toward the dashboard. In the LEFT foreground the back of his head (short greying hair, the temple of his glasses visible) and his right shoulder in a charcoal knitted jumper, the dark seatbelt running over his shoulder. In the centre-right the large landscape navigation screen of the centre console, facing the driver and the camera almost straight on, occupying about 45% of the image width; the screen surface is ONE perfectly flat uniform pure magenta colour (#FF00FF), no reflection, no interface (code will place the screen content). The steering wheel partly visible at the left edge, the windshield with soft white morning light and a blurred street. Charcoal and light warm-grey interior with soft gradients. His hands are not visible.',
  },

  {
    id: 'B4', group: 'B', kind: 'scene', refs: ['assets/reference/stil-c-praxis.jpg'],
    prompt: 'SCENE, 16:9: the entrance hall of a friendly medical practice, wide and calm, straight slightly elevated camera. On the LEFT a closed entrance door (light wood, frosted glass with white light). Above the door a plain round wall clock face that is completely BLANK (white face, thin charcoal rim, no numbers, no hands). A short corridor leads to the back; on the right a coat hook rail on the wall and a light wood reception counter. White walls, light warm-grey floor, one plant. Plenty of empty floor space in the middle for a person walking. No people, no signs, no text.',
  },
  {
    id: 'B5', group: 'B', kind: 'scene', refs: ['assets/reference/stil-c-praxis.jpg'],
    prompt: 'SCENE, 16:9: a calm consultation room at eye level. In the centre a light wood desk seen from the side, with two chairs facing each other across it: the doctor\'s chair on the LEFT, the patient\'s chair on the RIGHT. A window with soft white light in the back, a plain white wall, a shelf with a plant. The desk surface is empty (no paper). No people.',
  },

  // ---------------------------------------------------------------- Gruppe C: Figuren

  {
    id: 'C2', group: 'C', kind: 'plate', refs: [DOC],
    prompt: 'PLATE on a flat pure white background (#FFFFFF), soft contact shadow only: close-up of the DOCTOR\'s right hand, index finger extended forward as if about to tap a touch screen, other fingers loosely curled, neutral pose. The forearm in a charcoal knitted jumper sleeve enters from the lower RIGHT edge of the image; the fingertip points toward the upper LEFT. Light skin as on the attached model sheet. Nothing else in the image.',
  },
  {
    id: 'C3', group: 'C', kind: 'edit', base: 'B4', refs: [DOC],
    prompt: 'Edit the first attached image (the practice entrance hall). Keep the room and the camera EXACTLY identical. ADD the DOCTOR from the attached model sheet walking FAST from the door on the left toward the right through the middle of the hall: hurried long stride, leaning forward, bag in one hand, one arm only half inside a light grey-white doctor\'s coat that flaps behind him; charcoal jumper underneath. Full figure, scale matching the room.',
  },
  {
    id: 'C3b', group: 'C', kind: 'edit', base: 'C3',
    prompt: 'Edit the attached image. Keep EVERYTHING identical (room, camera, the doctor\'s position, size, clothing, bag, coat, face). Change ONLY his stride to the opposite phase of the walk cycle: the other leg is now in front and the arms swing the other way. Same hurried forward lean.',
  },
  {
    id: 'C4w', group: 'C', kind: 'edit', base: 'B4', refs: [DOC],
    prompt: 'Edit the first attached image (the practice entrance hall). Keep the room and the camera EXACTLY identical. ADD the DOCTOR from the attached model sheet (charcoal jumper, short greying hair, a dark grey jacket over his arm, bag in hand) walking calmly at a normal pace through the middle of the hall from the door on the left toward the right, upright relaxed posture, calm face. Full figure, scale matching the room.',
  },
  {
    id: 'C4wb', group: 'C', kind: 'edit', base: 'C4w',
    prompt: 'Edit the attached image. Keep EVERYTHING identical (room, camera, the doctor\'s position, size, clothing, face, the bag in his hand and the dark grey jacket draped over his arm exactly as it is). Change ONLY his legs to the opposite phase of the walk cycle: the other leg is now in front. The jacket over the arm must stay fully visible and unchanged.',
  },

  {
    id: 'B4c', group: 'B', kind: 'edit', base: 'B4',
    prompt: 'Edit the attached image (the empty practice entrance hall). Keep the room and the camera EXACTLY identical. ADD only a light grey-white doctor\'s coat hanging neatly on one hook of the coat hook rail on the right wall. Nothing else changes, no people.',
  },
  {
    id: 'C4', group: 'C', kind: 'edit', base: 'B4c', refs: [DOC],
    prompt: 'Edit the first attached image (the practice entrance hall with a white coat on the hook). Keep the room, the camera and the white coat hanging on its hook EXACTLY identical. ADD the DOCTOR from the attached model sheet (charcoal jumper, short greying hair) standing relaxed at the coat hook rail, calmly hanging his dark grey jacket on the hook next to the white coat, upright relaxed posture, calm face, facing right toward the rail. Full figure, same scale as a person in this room.',
  },

  {
    id: 'C5', group: 'C', kind: 'edit', base: 'B4c', refs: [DOC],
    prompt: 'Edit the first attached image (the practice entrance hall with a white coat on the hook). Keep the room and the camera EXACTLY identical. The white coat is no longer on its hook because the DOCTOR from the attached model sheet now calmly slips it on over his charcoal jumper, standing at the coat hook rail, relaxed shoulders, calm content expression; his dark grey jacket now hangs on the hook instead. Full figure, same scale as a person in this room.',
  },

  {
    id: 'C6C11', group: 'C', kind: 'edit', base: 'B5', refs: [DOC, 'assets/gen/A2.jpg'],
    prompt: 'Edit the first attached image (the empty consultation room). Keep the room and the camera EXACTLY identical. ADD two people: on the LEFT chair the DOCTOR from the first model sheet (light grey-white coat over a charcoal jumper, short greying hair) seated, leaning slightly forward, open attentive posture, eye level; on the RIGHT chair PATIENT 1 from the second model sheet (adult man, short dark hair, light-medium skin, warm-grey sweater) seated, listening, eye contact with the doctor. The patient\'s hands rest on the desk edge and the patches of dry skin on his hands and neck are visible. The desk stays empty.',
  },
  {
    id: 'C13', group: 'C', kind: 'edit', base: 'B5', refs: [DOC, 'assets/gen/A3.jpg'],
    prompt: 'Edit the first attached image (the empty consultation room). Keep the room and the camera EXACTLY identical. ADD on the LEFT chair the DOCTOR from the first model sheet (light grey-white coat over a charcoal jumper) seated, attentive; on the RIGHT chair PATIENT 2 from the second model sheet (woman, ash-blonde shoulder-length hair, fair skin, off-white blouse, beige cardigan) seated, glancing up at the doctor. The dry skin patches on her neck and the side of her face are visible. The desk stays empty.',
  },
  {
    id: 'C14', group: 'C', kind: 'edit', base: 'B5', refs: [DOC, 'assets/gen/A4.jpg'],
    prompt: 'Edit the first attached image (the empty consultation room). Keep the room and the camera EXACTLY identical. ADD on the LEFT chair the DOCTOR from the first model sheet (light grey-white coat over a charcoal jumper) seated, attentive; on the RIGHT chair PATIENT 3 from the second model sheet (broad sturdy man, very short black hair with a little grey, deep brown skin, charcoal-brown cardigan) seated, giving a small nod, eye contact. The darker, greyish dry skin patches on his hands and face are visible. The desk stays empty. No motion lines, no comic symbols.',
  },
  {
    id: 'C15', group: 'C', kind: 'edit', base: 'B5', refs: [DOC, 'assets/gen/A5.jpg'],
    prompt: 'Edit the first attached image (the empty consultation room). Keep the room and the camera EXACTLY identical. ADD on the LEFT chair the DOCTOR from the first model sheet (light grey-white coat over a charcoal jumper) seated, leaning slightly forward, listening attentively, eye level, open posture; on the RIGHT chair PATIENT 4 from the second model sheet (woman, medium-brown skin, dark curly hair in a loose bun, olive-grey jacket over a cream top) seated, talking calmly and listening; her hands rest on the desk. The dry skin patches on her neck, hands and cheek are visible. The desk stays empty.',
  },
  {
    id: 'C15b', group: 'C', kind: 'edit', base: 'C15',
    prompt: 'Edit the attached image. Keep EVERYTHING identical (room, doctor, the patient\'s body, clothing, hands and all the dry skin patches). Change ONLY the PATIENT\'s face: she reacts with a small, relieved, hopeful expression (soft smile, relaxed eyebrows), still looking at the doctor.',
  },
  {
    id: 'C10', group: 'C', kind: 'edit', base: 'C15',
    prompt: 'Edit the attached image. Keep EVERYTHING identical (room, patient, clothing, all dry skin patches). Change ONLY the DOCTOR: his right hand hovers in mid-air over the desk, palm down, holding still, while his eyes are lifted toward the patient, thoughtful and attentive.',
  },
  {
    id: 'C9', group: 'C', kind: 'edit', base: 'C15',
    prompt: 'Edit the attached image. Keep EVERYTHING identical (room, patient, clothing, all dry skin patches). Change ONLY the DOCTOR: he is turned toward the patient and explains something with one open hand gesture (palm up), warm, engaged expression.',
  },
  {
    id: 'DESK', group: 'C', kind: 'scene', refs: ['assets/gen/B5.jpg'],
    prompt: 'SCENE, 16:9: close-up looking down at the empty light wood desk surface of the attached consultation room, slightly elevated three-quarter view; the desk fills most of the image, soft window light from the back, a softly blurred chair edge at the left and at the right edge. Empty desk, no objects, no paper, no people.',
  },
  {
    id: 'C8', group: 'C', kind: 'edit', base: 'DESK', refs: [DOC],
    prompt: 'Edit the first attached image (the empty desk close-up). Keep the desk and camera EXACTLY identical. ADD the DOCTOR\'s right hand (light skin, light grey-white coat sleeve over a charcoal jumper cuff) entering from the LEFT edge, palm DOWN, flat on the desk, fingers together and extended, as if pushing a flat object across the desk toward the right. Do not draw any object under the hand. Nothing else.',
  },
  {
    id: 'C12', group: 'C', kind: 'edit', base: 'DESK', refs: ['assets/gen/A2.jpg'],
    prompt: 'Edit the first attached image (the empty desk close-up). Keep the desk and camera EXACTLY identical. ADD PATIENT 1\'s right hand (light-medium skin, warm-grey sweater sleeve) entering from the RIGHT edge and resting on the desk, palm down, held out openly. The patches of dry skin on the back of the hand are clearly visible, drawn with soft shading. Nothing else.',
  },
  {
    id: 'C16', group: 'C', kind: 'edit', base: 'DESK', refs: ['assets/gen/A5.jpg'],
    prompt: 'Edit the first attached image (the empty desk close-up). Keep the desk and camera EXACTLY identical. ADD PATIENT 4\'s right hand (medium-brown skin, olive-grey jacket sleeve over a cream cuff) entering from the RIGHT edge and resting on the desk, palm down, held out openly. The darker brown-grey patches of dry skin on the back of the hand are clearly visible. Nothing else.',
  },
  {
    id: 'C7', group: 'C', kind: 'edit', base: 'DESK', refs: [DOC],
    prompt: 'Edit the first attached image (the empty desk close-up). Keep the desk and camera EXACTLY identical. ADD a blank white notepad lying on the desk and the DOCTOR\'s right hand (light skin, light grey-white coat sleeve) entering from the LEFT edge of the image (the doctor sits on the left side of the desk), holding a plain charcoal pen and writing on the pad (no visible writing, only a few faint grey squiggle lines, no letters, no numbers). Nothing else.',
  },

  {
    id: 'C17', group: 'C', kind: 'plate', refs: [DOC],
    prompt: 'PLATE on a flat pure white background (#FFFFFF), soft contact shadow only: a sturdy wall key rack drawn as an isolated object (a light wood board with three strong, clearly visible dark metal hooks), a house key hanging on the left hook; the DOCTOR\'s right hand (light skin, charcoal knitted jumper sleeve entering from the right edge) lifts a simple car key (plain dark fob without any logo, a silver key) off the middle hook. Nothing else in the image.',
  },

  {
    id: 'C18', group: 'C', kind: 'plate', refs: [DOC],
    prompt: 'PLATE on a flat pure white background (#FFFFFF), soft contact shadow only: close-up of the DOCTOR\'s right hand (light skin, charcoal knitted jumper sleeve entering from the top right) lifting a dark brown leather bag by its strap. Nothing else in the image.',
  },

  // ---------------------------------------------------------------- Gruppe D: Akzente
  {
    id: 'D1', group: 'D', kind: 'accent', refs: [],
    prompt: 'One single broad horizontal brush stroke painted with a dry brush, solid mid-grey (#808080) on a pure white background, with expressive dry-brush edges and bristle texture at the start and end, centred, about 80% of the image width and 25% of its height. Nothing else, no text.',
    noStyle: true,
  },
  {
    id: 'D2', group: 'D', kind: 'accent', refs: [], aspect: '1:1',
    prompt: 'An abstract, almost white, very light surface with an extremely subtle mottled grain and a few fine fibres, like plain handmade paper seen very close, evenly lit, very low contrast, no objects, no shadows, no vignette, no text.',
    noStyle: true,
  },
];
