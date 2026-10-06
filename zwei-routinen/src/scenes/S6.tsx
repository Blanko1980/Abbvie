import React from 'react';
import {A, lerp, scene} from '../theme';
import {Layer} from '../components/ParallaxImage';
import {HallShot, Walker} from '../components/Shots';
import {hallScene} from './S2';

// S6 Eine andere Ankunft: identische Kamera wie S2, Uhr 08:43, normaler Gang, Jacke an den Haken, Kittel in Ruhe.
// Kein Zoom, kein Glühen – nur Zeit und Haltung unterscheiden sich.
const S = scene('S6');
export const S6: React.FC<{f: number}> = ({f}) => {
  const {flip, office, time} = hallScene(S, f);
  const w = S.walk;
  const hook = A.C4.pose;
  // Gang endet auf Haken-Tiefe (C4 steht weiter hinten): Fußpunkt und Größe angleichen
  const bottomWalk = A.C4w.pose.C4w.y + A.C4w.pose.C4w.h, bottomHook = hook.C4.y + hook.C4.h;
  const sc = hook.C4.h / A.C4w.pose.C4w.h;
  const toHook = lerp(f, [S.hook[0] - S.blend / 2, S.hook[0] + S.blend / 2], [0, 1]);
  const toCoat = lerp(f, [S.coat[0], S.coat[0] + S.blend], [0, 1]);
  return (
    <HallShot clock={time} flip={flip} office={office}>
      {f >= w.from && toHook < 1 ? (
        <div style={{opacity: 1 - toHook}}>
          <Walker group="C4w" f={Math.min(f, w.to - 1)} range={[w.from, w.to]} x={w.x} step={w.step} flip={w.flip} dy={[0, bottomHook - bottomWalk]} scale={[1, sc]} />
        </div>
      ) : null}
      <Layer p={hook.C4} opacity={toHook * (1 - toCoat)} />
      <Layer p={hook.C5} opacity={toCoat} />
    </HallShot>
  );
};
