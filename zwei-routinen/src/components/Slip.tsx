import React from 'react';

// Abstrakter Zettel (kein Rezept, keine Schrift, kein Symbol): abgerundetes Papier mit Eselsohr und einer kurzen weißen Linie.
// Farbe steht vom ersten Frame an fest (Teal in S3/S4, Gold in S7).
export const Slip: React.FC<{color: string; x: number; y: number; w?: number; rot?: number; opacity?: number}> = ({color, x, y, w = 420, rot = -6, opacity = 1}) => {
  const h = w * 0.66, f = w * 0.16;
  return (
    <svg
      width={w * 1.2} height={h * 1.5} viewBox={`${-w * 0.1} ${-h * 0.2} ${w * 1.2} ${h * 1.5}`}
      style={{position: 'absolute', left: x - w * 0.6, top: y - h * 0.75, opacity, overflow: 'visible',
        transform: `rotate(${rot}deg) skewX(-14deg) scaleY(0.72)`, transformOrigin: '50% 50%'}}
    >
      <defs>
        <filter id="slipShadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx={w * 0.02} dy={w * 0.04} stdDeviation={w * 0.03} floodColor="#25282A" floodOpacity="0.22" />
        </filter>
      </defs>
      <path d={`M ${h * 0.08} 0 H ${w - f} L ${w} ${f} V ${h - h * 0.08} Q ${w} ${h} ${w - h * 0.08} ${h} H ${h * 0.08} Q 0 ${h} 0 ${h - h * 0.08} V ${h * 0.08} Q 0 0 ${h * 0.08} 0 Z`} fill={color} filter="url(#slipShadow)" />
      <path d={`M ${w - f} 0 V ${f} H ${w} Z`} fill="#FFFFFF" opacity={0.45} />
      <rect x={w * 0.14} y={h * 0.26} width={w * 0.34} height={h * 0.07} rx={h * 0.035} fill="#FFFFFF" />
    </svg>
  );
};
