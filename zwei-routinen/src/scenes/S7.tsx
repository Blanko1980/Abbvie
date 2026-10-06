import React from 'react';
import {A, colors, ease, lerp, scene, settleHold} from '../theme';
import {Layer} from '../components/ParallaxImage';
import {NotesShot, PatientHandShot, patientDxFor, RoomShot, slipAt, SlipShot} from '../components/Shots';

// S7 Das Innehalten im Behandlungsraum: Patientin 4, Notizen, der Gold-Zettel (Gold ab dem ersten Frame) wird
// angeschoben, Pause 30 Frames (wie der Finger in S5), Begegnung (Blick, Erklären, Reaktion), dann Übergabe.
const S = scene('S7');
const sh = (id: string) => S.shots.find((s: any) => s.id === id);
const HALF = -380; // Position der Hand während der Pause

export const S7: React.FC<{f: number}> = ({f}) => {
  const doc = A.C15doc.pose, pat = A.C15pat.pose;
  for (const s of S.shots) {
    if (f < s.from || f >= s.to) continue;
    const lf = f - s.from, dur = s.to - s.from;
    switch (s.id) {
      case 'wide': return <RoomShot id={S.patient} f={lf} dur={dur} zoom={s.zoom} />;
      case 'hand': return <PatientHandShot id="C16" f={lf} dur={dur} />;
      case 'notes': return <NotesShot f={lf} dur={dur} />;
      case 'push': {
        const dx = lerp(lf, s.move, [-760, HALF], ease.inOut) + settleHold(lf, s.pause) * 1.5;
        return <SlipShot color={colors.gold} handDx={dx} slipX={slipAt(dx)} />;
      }
      case 'hesitate': return <RoomShot id={S.patient} f={lf} dur={dur} zoom={[1.06, 1.07]}><Layer p={doc.C10} /></RoomShot>;
      case 'explain': return (
        <RoomShot id={S.patient} f={lf + 25} dur={dur + 25} zoom={[1.06, 1.08]}>
          <Layer p={doc.C10} opacity={1 - lerp(lf, [0, s.blend], [0, 1])} />
          <Layer p={doc.C9} opacity={lerp(lf, [0, s.blend], [0, 1])} />
        </RoomShot>
      );
      case 'react': return (
        <RoomShot id={S.patient} f={lf + 80} dur={dur + 80} zoom={[1.06, 1.08]}>
          <Layer p={doc.C9} />
          <Layer p={pat.C15b} opacity={lerp(lf, [0, s.blend], [0, 1])} />
        </RoomShot>
      );
      case 'complete': {
        const dx = lerp(lf, s.move, [HALF, 0], ease.inOut);
        return <SlipShot color={colors.gold} handDx={dx} slipX={slipAt(dx)} />;
      }
      case 'take': {
        const pdx = lerp(lf, s.patientIn, [1400, patientDxFor('C16', slipAt(0))], ease.out);
        return <SlipShot color={colors.gold} handDx={lerp(lf, [0, 10], [0, -1100], ease.in)} slipX={slipAt(0)} patient={{id: 'C16', dx: pdx}} />;
      }
    }
  }
  return null;
};
