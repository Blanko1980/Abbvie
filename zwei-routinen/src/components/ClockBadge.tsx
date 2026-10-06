import React from 'react';
import {colors, sans, T} from '../theme';

// Praxisuhr: Zeiger auf dem leeren Zifferblatt von B4 + Plakette mit Digitalzeit (klappt um) + Hinweis „Sprechstunde 09:00“.
// Alles in Quellpixeln von B4 (Zifferblatt-Mitte 973/453, Radius ≈ 80).
export const CLOCK = {cx: 973, cy: 453, r: 78};

export const ClockBadge: React.FC<{time: string; flip: number; office: number}> = ({time, flip, office}) => {
  const [hh, mm] = time.split(':').map(Number);
  const aMin = (mm / 60) * 360, aHour = ((hh % 12) / 12) * 360 + (mm / 60) * 30;
  const {cx, cy, r} = CLOCK;
  // Plakette: klappt von oben ein (rotateX), danach steht sie
  const rot = (1 - flip) * -90;
  return (
    <>
      <svg style={{position: 'absolute', left: cx - r, top: cy - r, overflow: 'visible'}} width={r * 2} height={r * 2} viewBox={`${-r} ${-r} ${r * 2} ${r * 2}`}>
        <line x1={0} y1={0} x2={0} y2={-r * 0.5} stroke={colors.charcoal} strokeWidth={7} strokeLinecap="round" transform={`rotate(${aHour})`} />
        <line x1={0} y1={0} x2={0} y2={-r * 0.78} stroke={colors.charcoal} strokeWidth={4.5} strokeLinecap="round" transform={`rotate(${aMin})`} />
        <circle r={6} fill={colors.charcoal} />
      </svg>
      <div style={{position: 'absolute', left: cx - 260, top: cy + r + 34, width: 520, perspective: 800}}>
        <div style={{
          background: '#FFFFFF', borderRadius: 18, boxShadow: '0 10px 30px rgba(37,40,42,0.18)', textAlign: 'center',
          fontFamily: sans, fontWeight: 700, fontSize: 92, color: colors.charcoal, lineHeight: '120px', letterSpacing: 2, width: 300, margin: '0 auto',
          transform: `rotateX(${rot}deg)`, transformOrigin: '50% 0%', opacity: flip > 0 ? 1 : 0,
        }}>{time}</div>
        <div style={{marginTop: 18, textAlign: 'center', fontFamily: sans, fontWeight: 600, fontSize: 46, color: colors.charcoal, opacity: office}}>{T.texts.office}</div>
      </div>
    </>
  );
};
