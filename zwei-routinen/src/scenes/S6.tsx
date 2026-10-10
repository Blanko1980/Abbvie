import React from 'react';
import {A, lerp, scene} from '../theme';
import {Layer} from '../components/ParallaxImage';
import {HallShot, Walker} from '../components/Shots';
import {Counter, doorOpen, hallTime} from './S2';
import anchors from '../data/anchors.json';

// S6 Eine andere Ankunft: identische Kamera wie S2, Uhr 08:43, normaler Gang, Jacke an den Haken, Kittel in Ruhe.
// Der Kittel hängt von Anfang an an der Garderobe (B4c); am Haken steht die Tasche neben der Pflanze (B4cb).
const S = scene('S6');
export const S6: React.FC<{f: number}> = ({f}) => {
  const w = S.walk;
  const hook = A.C4.pose, walk = A.C4w.pose.C4w;
  // Gang endet genau auf Figurengröße und Fußlinie der Haken-Pose (aus den Bildern gemessen)
  const {walkFig, hookFig} = anchors;
  const sc = hookFig.h / walkFig.h;
  const bottom = walk.y + walk.h, inset = bottom - walkFig.feet;
  const dyEnd = hookFig.feet - (bottom - inset * sc);
  const toHook = lerp(f, [S.hook[0] - S.blend / 2, S.hook[0] + S.blend / 2], [0, 1]);
  const toCoat = lerp(f, [S.coat[0], S.coat[0] + S.blend], [0, 1]);
  return (
    <HallShot clock={hallTime(S)} f={f} plate={toHook > 0 ? 'B4cb' : 'B4c'} door={doorOpen(f, w.from)} front={<Counter />}>
      {f >= w.from && toHook < 1 ? (
        <div style={{opacity: 1 - toHook}}>
          <Walker group="C4w" f={Math.min(f, w.to - 1)} range={[w.from, w.to]} x={w.x} step={w.step} flip={w.flip} dy={[0, dyEnd]} scale={[1, sc]} feet={inset} fadeIn={5} />
        </div>
      ) : null}
      <Layer p={hook.C4} opacity={toHook * (1 - toCoat)} />
      <Layer p={hook.C5} opacity={toCoat} />
    </HallShot>
  );
};
