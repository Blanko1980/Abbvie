import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {A, colors, ease, lerp, T} from '../theme';
import {camMap, Cam, Layer, ParallaxImage} from './ParallaxImage';
import {ClockBadge, CLOCK} from './ClockBadge';
import {center, NAVI, NAVI_POS, NaviScreen, NaviState} from './NaviScreen';
import {Slip} from './Slip';
import {mapPoint, matrix3d} from '../homography';
import anchors from '../data/anchors.json';

// ------------------------------------------------------------ Anker (Quellpixel, aus den Bildern gemessen)
export const QUAD = A.B3.quad as number[][];                          // Bildschirm-Viereck in B3 (Schulterperspektive)
export const naviToSrc = (nx: number, ny: number) => mapPoint(QUAD, NAVI.w, NAVI.h, nx, ny);
const qc = naviToSrc(NAVI.w / 2, NAVI.h / 2);
export const NAVI_CAM: Cam = {z: 1.45, fx: qc[0], fy: qc[1] + 30};
export const DESK_CAM: Cam = {z: 1.25, fx: 1500, fy: 1000};
const FINGER = {tip: [3, 24], scale: 0.5};           // C2: Fingerspitze im freigestellten Bild
const C8_PALM = [1180, 1000];                        // Handmitte der Zettel-Hand (C8) in DESK
const SLIP_OFF = [120, 12];                          // Zettel relativ zur Handmitte
export const SLIP_W = 430;

// ------------------------------------------------------------ Morgen
export const CupShot: React.FC<{f: number; dur: number; fill?: [number, number]; pour?: [number, number]; zoom?: [number, number]; full?: boolean}> = ({f, dur, fill, pour, zoom = [1.02, 1.04], full}) => {
  const p = A.B2.pose.B2;
  const k = full ? 1 : fill ? lerp(f, fill, [0, 1], ease.inOut) : 1;
  const z = lerp(f, [0, dur], zoom, ease.inOut);
  const streamOn = pour ? f >= pour[0] && f < pour[1] : false;
  const [, cy] = anchors.cupTop;
  const [sx] = anchors.cupTop;
  // Strahl wächst aus dem Auslauf nach unten bis in die Tasse und reißt am Ende von oben ab
  const grow = pour ? lerp(f, [pour[0], pour[0] + 4], [0, 1]) : 0;
  const cut = pour ? lerp(f, [pour[1] - 5, pour[1]], [0, 1]) : 0;
  const d = A.B1.quad as number[][];
  const progress = full ? 1 : fill ? lerp(f, fill, [0, 1]) : 1;
  return (
    <ParallaxImage id="B1" cam={{z, fx: (sx + 1400) / 2, fy: 820}}>
      <MachineDisplay quad={d} progress={progress} />
      <Img src={staticFile(A.B1.src)} style={{position: 'absolute', left: 0, top: 0, width: A.B1.w, height: A.B1.h}} />
      {/* Tasse füllt sich von unten (Maske); Kaffee etwas wärmer/brauner als im Bild */}
      <Layer p={p} opacity={k > 0 ? 1 : 0} style={{clipPath: `inset(${(1 - k) * 100}% 0 0 0)`, filter: 'brightness(1.12) saturate(1.1)'}} />
      {/* zwei dünne Strahlen aus den beiden Ausläufen bis auf die Kaffeeoberfläche */}
      {streamOn ? anchors.spouts.map(([x, y], i) => {
        const top = y + (cy - y) * cut, bottom = y + (cy - y) * grow;
        return bottom > top ? <div key={i} style={{position: 'absolute', left: x - 5, top, width: 10, height: bottom - top, borderRadius: 5,
          background: `linear-gradient(90deg, ${colors.coffee}, #8A5532 45%, ${colors.coffee})`}} /> : null;
      }) : null}
    </ParallaxImage>
  );
};

// Display der Kaffeemaschine (im Code): warmes Licht, Tassen-Symbol, Fortschrittsbalken – ohne Schrift
const MachineDisplay: React.FC<{quad: number[][]; progress: number}> = ({quad, progress}) => {
  const w = 300, h = 180;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: matrix3d(quad, w, h)}}>
      <rect width={w} height={h} fill="#2A2C2E" />
      <rect x={8} y={8} width={w - 16} height={h - 16} rx={10} fill="#F4EFE6" opacity={0.95} />
      <g transform="translate(150 74)" fill="none" stroke={colors.charcoal} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round">
        <path d="M -38 -22 H 30 V 8 Q 30 34 -4 34 Q -38 34 -38 8 Z" />
        <path d="M 30 -10 Q 52 -10 52 6 Q 52 20 30 20" />
        <path d="M -20 -40 q 6 -8 0 -16 M 0 -40 q 6 -8 0 -16 M 20 -40 q 6 -8 0 -16" strokeWidth={6} opacity={0.6} />
      </g>
      <rect x={40} y={138} width={w - 80} height={14} rx={7} fill="#D9D3C8" />
      <rect x={40} y={138} width={(w - 80) * progress} height={14} rx={7} fill={colors.charcoal} />
    </svg>
  );
};

// Hand-Platten auf Weiß (C17 Schlüssel, C18 Tasche): Hand hebt das Objekt leicht an
export const HandPlateShot: React.FC<{id: 'C17' | 'C18'; f: number; dur: number}> = ({id, f, dur}) => {
  const a = A[id];
  const lift = lerp(f, [dur * 0.2, dur * 0.8], [0, -70], ease.inOut);
  const s = 1920 / a.full.w;
  return (
    <AbsoluteFill style={{background: colors.white}}>
      <Img src={staticFile(a.src)} style={{position: 'absolute', left: a.full.x * s, top: (a.full.y + lift) * s, width: a.w * s, height: a.h * s}} />
    </AbsoluteFill>
  );
};

// Auto aus der Fahrerperspektive über die Schulter (B3); Gurt rastet ein: kleiner weißer Puls
export const BeltShot: React.FC<{f: number; dur: number; click?: number; screen?: NaviState}> = ({f, dur, click, screen}) => {
  const pulse = click != null ? lerp(f, [click, click + 10], [0, 1]) : 0;
  const [bx, by] = anchors.beltPulse;
  return (
    <ParallaxImage id="B3" cam={{z: lerp(f, [0, dur], [1.0, 1.03])}}>
      <NaviScreen state={screen ?? {on: 0.25, tealDraw: 0}} quad={QUAD} />
      <Img src={staticFile(A.B3.src)} style={{position: 'absolute', left: 0, top: 0, width: A.B3.w, height: A.B3.h}} />
      {pulse > 0 && pulse < 1 ? (
        <div style={{position: 'absolute', left: bx - 60 * (1 + pulse), top: by - 60 * (1 + pulse), width: 120 * (1 + pulse), height: 120 * (1 + pulse),
          borderRadius: '50%', border: '6px solid #FFFFFF', opacity: 1 - pulse, boxShadow: '0 0 30px rgba(255,255,255,0.8)'}} />
      ) : null}
    </ParallaxImage>
  );
};

// ------------------------------------------------------------ Navi
export type Finger = {nx: number; ny: number; a: number} | null; // Fingerspitze in Navi-Koordinaten

export const NaviShot: React.FC<{state: NaviState; finger?: Finger; cam?: Cam; breath?: number}> = ({state, finger, cam = NAVI_CAM}) => {
  const c2 = A.C2;
  const fs = FINGER.scale;
  return (
    <ParallaxImage id="B3" cam={cam}>
      <NaviScreen state={state} quad={QUAD} />
      <Img src={staticFile(A.B3.src)} style={{position: 'absolute', left: 0, top: 0, width: A.B3.w, height: A.B3.h}} />
      {finger && finger.a > 0 ? (() => {
        // Hand des Fahrers kommt aus der Schulterperspektive von links unten: Platte C2 gespiegelt
        const [tx, ty] = naviToSrc(finger.nx, finger.ny);
        const flip = anchors.fingerFlip;
        const tipX = flip ? c2.w - FINGER.tip[0] : FINGER.tip[0];
        return (
          <Img src={staticFile(c2.src)} style={{
            position: 'absolute', opacity: finger.a, left: tx - tipX * fs, top: ty - FINGER.tip[1] * fs,
            width: c2.w * fs, height: c2.h * fs, transform: flip ? 'scaleX(-1)' : undefined,
          }} />
        );
      })() : null}
    </ParallaxImage>
  );
};

// Fingerweg „von rechts unten zu Bestätigen“ – identisch in S1 und S5 (gleiche Geschwindigkeit)
export const confirmTarget = () => center(NAVI_POS.confirm);
export const approachFinger = (f: number, [a, b]: number[], hoverPx: number): Finger => {
  const [tx, ty] = confirmTarget();
  const hover = hoverPx / (NAVI_CAM.z! * camMap('B3', NAVI_CAM).s / NAVI_CAM.z!); // Filmpixel → Quellpixel
  const u = lerp(f, [a, b], [0, 1], ease.inOut);
  // Fingerweg von links unten (Fahrerhand in der Schulterperspektive) zu „Bestätigen“
  return {nx: tx - 260 + 260 * u, ny: ty + 300 + (-hover - 300) * u, a: lerp(f, [a - 6, a], [0, 1])};
};

// ------------------------------------------------------------ Praxis-Eingangshalle
export const HallShot: React.FC<{clock?: string; flip?: number; office?: number; cam?: Cam; plate?: string; children?: React.ReactNode}> = ({clock, flip = 1, office = 1, cam = {z: 1}, plate = 'B4c', children}) => (
  <ParallaxImage id={plate} cam={cam}>
    {clock ? <ClockBadge time={clock} flip={flip} office={office} part="hands" /> : null}
    {children}
    {/* Plakette als Einblendung vor der Figur – Uhrzeit bleibt immer lesbar */}
    {clock ? <ClockBadge time={clock} flip={flip} office={office} part="badge" /> : null}
  </ParallaxImage>
);
export const CLOCK_CAM: Cam = {z: 1.7, fx: CLOCK.cx + 40, fy: CLOCK.cy + 170};

// Gehende Figur (zwei Schrittphasen im Wechsel), gespiegelt nach rechts laufend
export const Walker: React.FC<{group: string; f: number; range: number[]; x: number[]; step: number; flip?: boolean; dy?: number[]; scale?: number[]}> = ({group, f, range, x, step, flip, dy = [0, 0], scale = [1, 1]}) => {
  const ids = Object.keys(A[group].pose);
  const p = A[group].pose[ids[Math.floor((f - range[0]) / step) % 2 === 0 ? 0 : 1]];
  const cx = lerp(f, range, x);
  const bob = Math.abs(Math.sin(((f - range[0]) / step) * Math.PI)) * -6;
  const sc = lerp(f, range, scale), fy = p.y + p.h + lerp(f, range, dy);
  // weicher Bodenschatten (im Code, wandert mit; der KI-Schatten ist aus der Ebene entfernt)
  return (
    <>
      <div style={{position: 'absolute', left: cx - 170 * sc, top: fy - 26 * sc, width: 340 * sc, height: 46 * sc, borderRadius: '50%',
        background: 'radial-gradient(closest-side, rgba(37,40,42,0.24), rgba(37,40,42,0))'}} />
      <Layer p={p} flip={flip} dx={cx - (p.x + p.w / 2)} dy={lerp(f, range, dy) + bob} scale={sc} />
    </>
  );
};

// ------------------------------------------------------------ Behandlungsraum
export const RoomShot: React.FC<{id: string; f: number; dur: number; zoom?: [number, number]; children?: React.ReactNode}> = ({id, f, dur, zoom = [1.02, 1.04], children}) => (
  <ParallaxImage id={id} cam={{z: lerp(f, [0, dur], zoom, ease.inOut), fx: 1440, fy: 760}}>{children}</ParallaxImage>
);

export const NotesShot: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <ParallaxImage id="DESK" cam={{...DESK_CAM, z: lerp(f, [0, dur], [1.2, 1.24])}}>
    <Layer p={A.C7.pose.C7} dx={Math.sin(f * 0.9) * 4} />
  </ParallaxImage>
);

export const PatientHandShot: React.FC<{id: 'C12' | 'C16'; f: number; dur: number}> = ({id, f, dur}) => (
  <ParallaxImage id="DESK" cam={{...DESK_CAM, z: lerp(f, [0, dur], [1.22, 1.26])}}>
    <Layer p={A[id].pose[id]} />
  </ParallaxImage>
);

// Zettel-Tisch: Arzthand (C8) schiebt den Zettel, Patientenhand (C12/C16) nimmt ihn.
// handDx: Verschiebung der Arzthand (0 = Endposition), slipX: Zettel-Mitte (Quellpixel), patient: Verschiebung der Patientenhand
export const SlipShot: React.FC<{color: string; handDx: number | null; handDy?: number; slipX: number | null; slipY?: number; patient?: {id: 'C12' | 'C16'; dx: number} | null; cam?: Cam}> = ({color, handDx, handDy = 0, slipX, slipY, patient, cam = DESK_CAM}) => (
  <ParallaxImage id="DESK" cam={cam}>
    {slipX != null ? <Slip color={color} x={slipX} y={slipY ?? C8_PALM[1] + SLIP_OFF[1] + handDy} w={SLIP_W} /> : null}
    {patient ? <Layer p={A[patient.id].pose[patient.id]} dx={patient.dx} /> : null}
    {handDx != null ? <Layer p={A.C8.pose.C8} dx={handDx} dy={handDy} /> : null}
  </ParallaxImage>
);
export const slipAt = (handDx: number) => C8_PALM[0] + SLIP_OFF[0] + handDx;
export const PALM = C8_PALM;
// Patientenhand so verschieben, dass ihre Fingerspitze den Zettel am rechten Rand fasst
export const patientDxFor = (id: 'C12' | 'C16', slipX: number) => {
  const tip = id === 'C12' ? 1665 : 1686;
  return slipX + SLIP_W * 0.32 - tip;
};

export {T};
