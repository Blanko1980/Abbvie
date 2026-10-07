import React from 'react';
import {colors, sans, T} from '../theme';
import {matrix3d, Quad} from '../homography';

// Navigationsbildschirm, komplett im Code (SVG, 980 × 568 = Bildschirmfläche von B3 in Quellpixeln).
// Start- und Zielpin bewegen sich nie. Teal = gespeicherte Route (35 min), Gold = Alternative (23 min).
export const NAVI = {w: 980, h: 568};
export const NAVI_POS = {
  start: [112, 372],
  dest: [858, 118],
  tealCard: {x: 22, y: 444, w: 300, h: 104},
  goldCard: {x: 338, y: 444, w: 300, h: 104},
  confirm: {x: 716, y: 462, w: 244, h: 70},
};
export const TEAL_PATH = 'M112 372 C 240 418, 420 430, 600 408 C 760 388, 900 360, 918 268 C 934 186, 900 130, 858 118';
export const GOLD_PATH = 'M112 372 C 210 300, 330 236, 488 204 C 640 174, 760 150, 858 118';

export type NaviState = {
  on?: number;          // Bildschirm an (0..1)
  tealDraw?: number;    // Teal-Linie gezeichnet (0..1)
  goldDraw?: number;    // Gold-Linie gezeichnet (0..1)
  goldExpand?: number;  // Gold-Karte tritt hervor (0..1)
  goldVisible?: number; // Gold-Route und Gold-Karte überhaupt sichtbar (erst ab dem Innehalten in S5)
  popup?: number;       // Pop-up „Neue Route gefunden“ (0..1)
  selected?: 'teal' | 'gold';
  pressConfirm?: number;
  pressGold?: number;
  hover?: {x: number; y: number; a: number} | null; // Fingerspitzen-Schwebezustand (Navi-Koordinaten)
};

const Street: React.FC<{d: string; w?: number}> = ({d, w = 18}) => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} stroke={colors.streetEdge} strokeWidth={w + 4} />
    <path d={d} stroke={colors.street} strokeWidth={w} />
  </g>
);

const RouteLine: React.FC<{d: string; color: string; draw: number; width: number; opacity?: number}> = ({d, color, draw, width, opacity = 1}) =>
  draw <= 0 ? null : (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={opacity}>
      <path d={d} pathLength={1} stroke="#FFFFFF" strokeWidth={width + 8} strokeDasharray={`${draw} 1`} />
      <path d={d} pathLength={1} stroke={color} strokeWidth={width} strokeDasharray={`${draw} 1`} />
    </g>
  );

const Pin: React.FC<{x: number; y: number; dest?: boolean}> = ({x, y, dest}) =>
  dest ? (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={2} rx={12} ry={4} fill="rgba(0,0,0,0.15)" />
      <path d="M0 0 C -6 -14, -20 -22, -20 -36 A 20 20 0 1 1 20 -36 C 20 -22, 6 -14, 0 0 Z" fill={colors.charcoal} />
      <circle cx={0} cy={-36} r={8} fill="#FFFFFF" />
    </g>
  ) : (
    <g transform={`translate(${x} ${y})`}>
      <circle r={17} fill="#FFFFFF" />
      <circle r={12} fill={colors.charcoal} />
      <path d="M -5 4 L 0 -7 L 5 4 L 0 1 Z" fill="#FFFFFF" />
    </g>
  );

const Card: React.FC<{c: {x: number; y: number; w: number; h: number}; color: string; minutes: string; active: number; quiet: number; scale?: number; press?: number; saved?: boolean}> = ({c, color, minutes, active, quiet, scale = 1, press = 0, saved}) => {
  const s = scale * (1 - press * 0.04);
  return (
    <g transform={`translate(${c.x + c.w / 2} ${c.y + c.h / 2}) scale(${s}) translate(${-c.w / 2} ${-c.h / 2})`} opacity={1 - quiet * 0.45}>
      <rect width={c.w} height={c.h} rx={18} fill={press ? '#EEEDEA' : '#FFFFFF'} stroke={colors.charcoal} strokeWidth={1.5 + active * 2.5} strokeOpacity={0.25 + active * 0.75} />
      <path d={`M 24 ${c.h - 26} C 70 ${c.h - 46}, 110 ${c.h - 10}, ${c.w * 0.42} ${c.h - 30}`} fill="none" stroke={color} strokeWidth={8 + active * 4} strokeLinecap="round" />
      <text x={c.w - 22} y={c.h / 2 + 14} textAnchor="end" fontFamily={sans} fontWeight={700} fontSize={40} fill={colors.charcoal}>{minutes}</text>
      {saved ? <path d="M 24 22 h 18 v 28 l -9 -8 l -9 8 Z" fill={colors.charcoal} opacity={0.8} /> : null}
    </g>
  );
};

export const NaviScreen: React.FC<{state: NaviState; quad?: Quad}> = ({state, quad}) => {
  const s = {on: 1, tealDraw: 1, goldDraw: 0, goldExpand: 0, goldVisible: 0, popup: 0, selected: 'teal', pressConfirm: 0, pressGold: 0, ...state};
  const goldSel = s.selected === 'gold' ? 1 : 0;
  const t = T.texts;
  return (
    <svg width={NAVI.w} height={NAVI.h} viewBox={`0 0 ${NAVI.w} ${NAVI.h}`}
      style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: quad ? matrix3d(quad, NAVI.w, NAVI.h) : undefined}}>
      <rect width={NAVI.w} height={NAVI.h} fill="#141618" />
      <g opacity={s.on}>
        {/* vereinfachter Stadtplan: weiß und charcoal */}
        <rect width={NAVI.w} height={NAVI.h} fill={colors.mapBg} />
        {[[40, 90, 150, 110], [230, 260, 170, 130], [640, 230, 200, 120], [420, 70, 150, 90], [700, 40, 120, 60]].map(([bx, by, bw, bh], i) => (
          <rect key={i} x={bx} y={by} width={bw} height={bh} rx={14} fill={colors.mapBlock} />
        ))}
        <Street d="M -20 300 C 200 280, 380 330, 560 300 S 860 250, 1000 270" />
        <Street d="M 180 -20 C 200 140, 160 300, 220 600" w={14} />
        <Street d="M 560 -20 C 540 120, 600 260, 560 600" w={14} />
        <Street d="M -20 150 C 200 170, 500 120, 1000 160" w={12} />
        <Street d="M 760 -20 C 800 200, 760 380, 840 600" w={12} />
        <RouteLine d={GOLD_PATH} color={colors.gold} draw={s.goldVisible > 0 ? s.goldDraw : 0} width={10 + goldSel * 6 + s.goldExpand * 2} />
        <RouteLine d={TEAL_PATH} color={colors.deepTeal2} draw={s.tealDraw} width={14 - goldSel * 5} opacity={1 - goldSel * 0.35} />
        <Pin x={NAVI_POS.start[0]} y={NAVI_POS.start[1]} />
        <Pin x={NAVI_POS.dest[0]} y={NAVI_POS.dest[1]} dest />

        {/* Kopfzeile */}
        <rect width={NAVI.w} height={64} fill="#FFFFFF" />
        <rect y={64} width={NAVI.w} height={2} fill="rgba(0,0,0,0.08)" />
        <text x={26} y={43} fontFamily={sans} fontWeight={700} fontSize={32} fill={colors.charcoal}>{t.naviHeader}</text>
        <text x={NAVI.w - 26} y={43} textAnchor="end" fontFamily={sans} fontWeight={600} fontSize={26} fill={colors.charcoal}>{t.departure}</text>

        {/* Routenkarten und Bestätigen */}
        <rect y={430} width={NAVI.w} height={138} fill="rgba(255,255,255,0.92)" opacity={0} />
        <Card c={NAVI_POS.tealCard} color={colors.deepTeal2} minutes={t.tealMinutes} active={1 - goldSel} quiet={0} saved />
        {s.goldVisible > 0 ? (
          <g opacity={s.goldVisible}>
            <Card c={NAVI_POS.goldCard} color={colors.gold} minutes={t.goldMinutes} active={goldSel} quiet={(1 - s.goldExpand) * (1 - goldSel)} scale={1 + s.goldExpand * 0.06} press={s.pressGold} />
          </g>
        ) : null}
        <g transform={`translate(${NAVI_POS.confirm.x + NAVI_POS.confirm.w / 2} ${NAVI_POS.confirm.y + NAVI_POS.confirm.h / 2}) scale(${1 - s.pressConfirm * 0.05})`}>
          <rect x={-NAVI_POS.confirm.w / 2} y={-NAVI_POS.confirm.h / 2} width={NAVI_POS.confirm.w} height={NAVI_POS.confirm.h} rx={35} fill={s.pressConfirm ? '#111314' : colors.charcoal} />
          <text x={0} y={11} textAnchor="middle" fontFamily={sans} fontWeight={700} fontSize={32} fill="#FFFFFF">{t.confirm}</text>
        </g>

        {/* Pop-up „Neue Route gefunden“ über den Routenkarten */}
        {s.popup > 0 ? (
          <g transform={`translate(${NAVI.w / 2} 330) scale(${0.92 + 0.08 * s.popup}) translate(${-250} ${-44})`} opacity={s.popup}>
            <rect width={500} height={88} rx={22} fill="#FFFFFF" stroke={colors.charcoal} strokeOpacity={0.3} strokeWidth={2} style={{filter: 'drop-shadow(0 6px 14px rgba(37,40,42,0.22))'}} />
            <path d="M 30 58 C 50 30, 70 62, 96 34" fill="none" stroke={colors.gold} strokeWidth={9} strokeLinecap="round" />
            <text x={118} y={56} fontFamily={sans} fontWeight={700} fontSize={34} fill={colors.charcoal}>{t.newRoute}</text>
          </g>
        ) : null}

        {/* Schwebezustand der Fingerspitze: weicher Ring */}
        {s.hover && s.hover.a > 0 ? (
          <circle cx={s.hover.x} cy={s.hover.y} r={26} fill="none" stroke={colors.charcoal} strokeOpacity={0.25 * s.hover.a} strokeWidth={3} />
        ) : null}
      </g>
      {/* Glas */}
      <rect width={NAVI.w} height={NAVI.h} fill="url(#naviGlass)" />
      <defs>
        <linearGradient id="naviGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.10" />
          <stop offset="0.4" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.05" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// Mittelpunkt einer Schaltfläche (Navi-Koordinaten)
export const center = (c: {x: number; y: number; w: number; h: number}) => [c.x + c.w / 2, c.y + c.h / 2];
