import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {A, colors, script, T} from '../theme';

// „Rethink the Routine“: Gold-Pinselstrich (D1, im Code gold eingefärbt) wischt von links herein,
// danach schreibt sich die Handschrift von links nach rechts (Maske). Dunkle Schrift auf Weiß, Gold nur im Pinsel.
export const Callout: React.FC<{brush: number; write: number}> = ({brush, write}) => {
  const d1 = A.D1;
  const bw = 1500, bh = (bw * d1.h) / d1.w;
  return (
    <AbsoluteFill style={{background: colors.white, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{
        position: 'absolute', width: bw, height: bh, left: (1920 - bw) / 2, top: 540 - bh / 2 + 10,
        background: colors.gold, WebkitMaskImage: `url(${staticFile(d1.src)})`, WebkitMaskSize: '100% 100%',
        maskImage: `url(${staticFile(d1.src)})`, maskSize: '100% 100%',
        clipPath: `inset(0 ${(1 - brush) * 100}% 0 0)`,
      }} />
      <div style={{
        position: 'relative', fontFamily: script, fontWeight: 700, fontSize: 168, color: colors.charcoal, whiteSpace: 'nowrap',
        clipPath: `inset(-20% ${(1 - write) * 100}% -20% 0)`, transform: 'rotate(-3deg)',
      }}>{T.texts.callout}</div>
    </AbsoluteFill>
  );
};
