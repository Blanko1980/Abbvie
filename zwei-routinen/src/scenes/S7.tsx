import React from 'react';
import {A, colors, ease, lerp, scene} from '../theme';
import {Layer} from '../components/ParallaxImage';
import {NotesShot, PatientHandShot, patientDxFor, RoomShot, slipAt, SlipShot} from '../components/Shots';

// S7 Das Innehalten im Behandlungsraum: Patientin 4, der Arzt schreibt – und hält inne (30 Frames, wie der Finger in S5),
// schaut die Patientin an, erklärt, sie reagiert. Dann schiebt er ihr den Gold-Zettel zu (Gold ab dem ersten Frame).
const S = scene('S7');

export const S7: React.FC<{f: number}> = ({f}) => {
  const doc = A.C15doc.pose, pat = A.C15pat.pose;
  for (const s of S.shots) {
    if (f < s.from || f >= s.to) continue;
    const lf = f - s.from, dur = s.to - s.from;
    switch (s.id) {
      case 'wide': return <RoomShot id={S.patient} f={lf} dur={dur} zoom={s.zoom} />;
      case 'hand': return <PatientHandShot id="C16" f={lf} dur={dur} />;
      case 'notes': return <NotesShot f={lf} dur={dur} write={s.write} pause={s.pause} />;
      case 'look': return <RoomShot id={S.patient} f={lf} dur={dur} zoom={[1.06, 1.07]}><Layer p={doc.C10} /></RoomShot>;
      case 'explain': return (
        <RoomShot id={S.patient} f={lf + 30} dur={dur + 30} zoom={[1.06, 1.08]}>
          <Layer p={doc.C10} opacity={1 - lerp(lf, [0, s.blend], [0, 1])} />
          <Layer p={doc.C9} opacity={lerp(lf, [0, s.blend], [0, 1])} />
        </RoomShot>
      );
      case 'react': return (
        <RoomShot id={S.patient} f={lf + 85} dur={dur + 85} zoom={[1.06, 1.08]}>
          <Layer p={doc.C9} />
          <Layer p={pat.C15b} opacity={lerp(lf, [0, s.blend], [0, 1])} />
        </RoomShot>
      );
      case 'push': {
        const dx = lerp(lf, s.move, [-760, 0], ease.inOut);
        return <SlipShot color={colors.gold} handDx={dx} slipX={slipAt(dx)} moving={lerp(lf, s.move, [0, 1])} />;
      }
      case 'take': {
        const pdx = lerp(lf, s.patientIn, [1400, patientDxFor('C16', slipAt(0))], ease.out);
        return <SlipShot color={colors.gold} handDx={lerp(lf, [0, 10], [0, -1100], ease.in)} slipX={slipAt(0)} patient={{id: 'C16', dx: pdx}} moving={lerp(lf, s.patientIn, [0, 1])} />;
      }
    }
  }
  return null;
};
