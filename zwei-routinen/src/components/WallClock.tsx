import React from 'react';
import {Img, staticFile} from 'remotion';
import {A, colors, sans, T} from '../theme';

// Praxis-Wand (Quellpixel von B4): digitale Wanduhr und Sprechzeiten-Schild aus der Bearbeitung B4d, als Ausschnitt über
// jedem Hallenbild. Anzeige (Magenta-Fläche in B4d) und Schildtext entstehen im Code. Keine Einblendung, alles hängt an der Wand.
export const CLOCK = {x: 858, y: 401, w: 225, h: 95, cx: 970, cy: 555};
const SIGN = {x: 898, y: 627, w: 154, h: 70};

export const WallClock: React.FC<{time: string; f?: number}> = ({time, f = 0}) => {
  const [hh, mm] = time.split(':');
  const colon = Math.floor(f / 15) % 2 === 0 ? 1 : 0.25; // Doppelpunkt blinkt im Sekundentakt
  const p = A.HALL.pose.B4d;
  return (
    <>
      <Img src={staticFile(p.src)} style={{position: 'absolute', left: p.x, top: p.y, width: p.w, height: p.h}} />
      <svg style={{position: 'absolute', left: CLOCK.x, top: CLOCK.y}} width={CLOCK.w} height={CLOCK.h} viewBox={`0 0 ${CLOCK.w} ${CLOCK.h}`}>
        <rect width={CLOCK.w} height={CLOCK.h} rx={6} fill="#2B2E30" />
        <rect x={4} y={4} width={CLOCK.w - 8} height={CLOCK.h * 0.45} rx={4} fill="#FFFFFF" opacity={0.04} />
        <text x={CLOCK.w / 2} y={CLOCK.h / 2 + 25} textAnchor="middle" fontFamily={sans} fontWeight={700} fontSize={70} letterSpacing={3} fill="#F4EFE6">
          {hh}<tspan opacity={colon}>:</tspan>{mm}
        </text>
      </svg>
      <svg style={{position: 'absolute', left: SIGN.x, top: SIGN.y}} width={SIGN.w} height={SIGN.h} viewBox={`0 0 ${SIGN.w} ${SIGN.h}`}>
        <text x={SIGN.w / 2} y={27} textAnchor="middle" fontFamily={sans} fontWeight={600} fontSize={22} fill={colors.charcoal}>{T.texts.officeTitle}</text>
        <text x={SIGN.w / 2} y={57} textAnchor="middle" fontFamily={sans} fontWeight={700} fontSize={28} fill={colors.charcoal}>{T.texts.officeTime}</text>
      </svg>
    </>
  );
};
