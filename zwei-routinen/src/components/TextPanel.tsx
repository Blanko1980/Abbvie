import React from 'react';
import {AbsoluteFill} from 'remotion';
import {colors, sans} from '../theme';

// Vollbild-Texttafel: Charcoal auf Weiß, darunter eine Unterstreichung im Stil einer Routenlinie, die sich zeichnet.
export type PanelLine = {text: string; size: number; appear: number; underline?: {color: string; draw: number}};

const Underline: React.FC<{color: string; draw: number}> = ({color, draw}) => (
  <svg viewBox="0 0 100 10" preserveAspectRatio="none"
    style={{position: 'absolute', left: '-1%', width: '102%', bottom: '-0.34em', height: '0.32em', overflow: 'visible', clipPath: `inset(-50% ${(1 - draw) * 100}% -50% 0)`}}>
    <path d="M1 6 C 20 2, 35 9, 52 5 S 82 2, 99 5" fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
  </svg>
);

export const TextPanel: React.FC<{lines: PanelLine[]; gap?: number}> = ({lines, gap = 70}) => (
  <AbsoluteFill style={{background: colors.white, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap}}>
    {lines.map((l, i) => (
      <div key={i} style={{opacity: l.appear, transform: `translateY(${(1 - l.appear) * 14}px)`}}>
        <span style={{position: 'relative', display: 'inline-block', fontFamily: sans, fontWeight: 700, fontSize: l.size, color: colors.charcoal, letterSpacing: -0.5, whiteSpace: 'nowrap'}}>
          {l.text}
          {l.underline && l.underline.draw > 0 ? <Underline {...l.underline} /> : null}
        </span>
      </div>
    ))}
  </AbsoluteFill>
);
