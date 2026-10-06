import React from 'react';
import {lerp, scene, T} from '../theme';
import {HallShot, Walker} from '../components/Shots';

// S2 Ankunft unter Zeitdruck – feste Kamera auf B4, Uhr 08:55, der Arzt eilt durch die Halle.
export const hallScene = (S: any, f: number) => {
  const flip = lerp(f, S.clockFlip, [0, 1]);
  const office = lerp(f, S.officeIn, [0, 1]);
  return {flip, office, time: T.texts[S.clock as 'clockLate' | 'clockEarly']};
};

const S = scene('S2');
export const S2: React.FC<{f: number}> = ({f}) => {
  const {flip, office, time} = hallScene(S, f);
  const w = S.walk;
  return (
    <HallShot clock={time} flip={flip} office={office}>
      {f >= w.from && f < w.to ? <Walker group="C3" f={f} range={[w.from, w.to]} x={w.x} step={w.step} flip={w.flip} /> : null}
    </HallShot>
  );
};
