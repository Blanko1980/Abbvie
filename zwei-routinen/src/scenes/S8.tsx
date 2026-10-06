import React from 'react';
import {colors, ease, lerp, scene, T} from '../theme';
import {TextPanel} from '../components/TextPanel';
import {Callout} from '../components/Callout';

// S8 Abschluss: Texttafel mit Teal- und Gold-Unterstreichung, dann „Rethink the Routine“.
const S = scene('S8');
export const S8: React.FC<{f: number}> = ({f}) => {
  const p = S.panel;
  if (f < p.to) {
    return (
      <TextPanel gap={64} lines={[
        {text: T.texts.panel2a, size: 76, appear: lerp(f, [p.line1, p.line1 + 6], [0.4, 1]), underline: {color: colors.deepTeal2, draw: lerp(f, p.underline1, [0, 1], ease.inOut)}},
        {text: T.texts.panel2b, size: 62, appear: lerp(f, [p.line2, p.line2 + 8], [0, 1]), underline: {color: colors.gold, draw: lerp(f, p.underline2, [0, 1], ease.inOut)}},
      ]} />
    );
  }
  return <Callout brush={lerp(f, S.brush, [0, 1], ease.out)} write={lerp(f, S.write, [0, 1], ease.inOut)} />;
};
