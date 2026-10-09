import React from 'react';
import {colors, ease, lerp, scene} from '../theme';
import {NotesShot, PatientHandShot, patientDxFor, RoomShot, slipAt, SlipShot} from '../components/Shots';

// S3 Die zweite Routine – Patient 1, Notizen, der Teal-Zettel wird über den Tisch geschoben.
const S = scene('S3');

// Zettel-Ablauf (lokal im Slip-Shot): schieben, Hand zurück, Patientenhand nimmt ihn und zieht ihn aus dem Bild
export const slipHandover = (lf: number, s: any, color: string, patient: 'C12' | 'C16') => {
  const handDx = lerp(lf, s.push, [-760, 0], ease.inOut) + lerp(lf, s.withdraw, [0, -1100], ease.in);
  const restX = slipAt(0);
  const target = patientDxFor(patient, restX);
  const pIn = lerp(lf, s.patientIn, [1400, target], ease.out);
  const out = lerp(lf, s.takeOut, [0, 1700], ease.in);
  const slipX = lf < s.push[1] ? slipAt(handDx) : restX + out;
  return <SlipShot color={color} handDx={handDx > -1090 ? handDx : null} slipX={slipX} patient={lf >= s.patientIn[0] ? {id: patient, dx: pIn + out} : null} />;
};

export const S3: React.FC<{f: number}> = ({f}) => {
  for (const s of S.shots) {
    if (f < s.from || f >= s.to) continue;
    const lf = f - s.from, dur = s.to - s.from;
    switch (s.id) {
      case 'wide': return <RoomShot id={S.patient} f={lf} dur={dur} zoom={s.zoom} />;
      case 'hand': return <PatientHandShot id={S.patientHand} f={lf} dur={dur} />;
      case 'notes': return <NotesShot f={lf} dur={dur} ink={0.7} />;
      case 'look': return <RoomShot id={S.patient} f={lf + 90} dur={dur + 90} zoom={[1.06, 1.08]} />;
      case 'slip': return slipHandover(lf, s, colors.deepTeal2, 'C12');
    }
  }
  return null;
};
