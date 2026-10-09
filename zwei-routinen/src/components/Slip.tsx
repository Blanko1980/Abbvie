import React from 'react';
import {mapPoint, matrix3d, Quad, quadToUnit} from '../homography';

// Abstrakter Zettel (kein Rezept, keine Schrift, kein Symbol): abgerundetes Papier mit Eselsohr und einer kurzen weißen Linie.
// Farbe steht vom ersten Frame an fest (Teal in S3/S4, Gold in S7). Der Zettel liegt flach auf der Tischplatte:
// Er wird über die Tisch-Ebene (vier Ecken der Platte in DESK, Fluchtpunkt Bildmitte oben) perspektivisch abgebildet.
const DESK_TOP: Quad = [[905, 600], [2005, 600], [2620, 1200], [290, 1200]];   // hinten links, hinten rechts, vorne rechts, vorne links
const DESK_ASPECT = 2;                                                        // Platte doppelt so breit wie tief
const SW = 400, SH = 264;                                                     // Zeichenfläche des Zettels

// Zettel-Viereck im Bild: Mitte (x, y) in Quellpixeln, Breite w (Bezug: 430 px ≈ 22 % der Plattenbreite), Drehung in der Ebene
const slipQuad = (x: number, y: number, w: number, rot: number): Quad => {
  const [u, v] = quadToUnit(DESK_TOP, x, y);
  const hw = 0.11 * (w / 430), hh = hw * (SH / SW) * DESK_ASPECT, a = (rot * Math.PI) / 180;
  const corner = (cx: number, cy: number) => {
    const ru = cx * Math.cos(a) - (cy / DESK_ASPECT) * Math.sin(a), rv = (cx * Math.sin(a) * DESK_ASPECT + cy * Math.cos(a));
    return mapPoint(DESK_TOP, 1, 1, u + ru, v + rv);
  };
  return [corner(-hw, -hh), corner(hw, -hh), corner(hw, hh), corner(-hw, hh)];
};

export const Slip: React.FC<{color: string; x: number; y: number; w?: number; rot?: number; opacity?: number}> = ({color, x, y, w = 420, rot = -6, opacity = 1}) => {
  const f = SW * 0.16, r = SH * 0.08;
  return (
    <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`}
      style={{position: 'absolute', left: 0, top: 0, opacity, overflow: 'visible', transformOrigin: '0 0', transform: matrix3d(slipQuad(x, y, w, rot), SW, SH)}}>
      <defs>
        <filter id="slipShadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx={SW * 0.015} dy={SW * 0.03} stdDeviation={SW * 0.02} floodColor="#25282A" floodOpacity="0.2" />
        </filter>
      </defs>
      <path d={`M ${r} 0 H ${SW - f} L ${SW} ${f} V ${SH - r} Q ${SW} ${SH} ${SW - r} ${SH} H ${r} Q 0 ${SH} 0 ${SH - r} V ${r} Q 0 0 ${r} 0 Z`} fill={color} filter="url(#slipShadow)" />
      <path d={`M ${SW - f} 0 V ${f} H ${SW} Z`} fill="#FFFFFF" opacity={0.45} />
      <rect x={SW * 0.14} y={SH * 0.26} width={SW * 0.34} height={SH * 0.07} rx={SH * 0.035} fill="#FFFFFF" />
    </svg>
  );
};
