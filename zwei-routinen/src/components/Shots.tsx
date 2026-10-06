import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {A, colors, ease, lerp, T} from '../theme';
import {camMap, Cam, Layer, ParallaxImage} from './ParallaxImage';
import {ClockBadge, CLOCK} from './ClockBadge';
import {center, NAVI, NAVI_POS, NaviScreen, NaviState} from './NaviScreen';
import {Slip} from './Slip';

// ------------------------------------------------------------ Anker (Quellpixel, aus den Bildern gemessen)
export const SCREEN = {x: A.B3.quad[0][0], y: A.B3.quad[0][1]}; // linke obere Ecke des Bildschirms in B3
export const NAVI_CAM: Cam = {z: 1.55, fx: SCREEN.x + NAVI.w / 2, fy: SCREEN.y + NAVI.h / 2 + 20};
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
  const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
  return (
    <ParallaxImage id="B1" cam={{z, fx: 1500, fy: 900}}>
      {/* Tasse füllt sich von unten (Maske) */}
      <Layer p={p} opacity={k > 0 ? 1 : 0} style={{clipPath: `inset(${(1 - k) * 100}% 0 0 0)`}} />
      {streamOn ? <div style={{position: 'absolute', left: cx - 3, top: -20, width: 6, height: cy + 20 - p.h * 0.1, background: colors.charcoal, borderRadius: 3}} /> : null}
    </ParallaxImage>
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

// Auto, Arzt angeschnallt (B3 + C1); Gurt rastet ein: kleiner weißer Puls
export const BeltShot: React.FC<{f: number; dur: number; click?: number; screen?: NaviState}> = ({f, dur, click, screen}) => {
  const pulse = click != null ? lerp(f, [click, click + 10], [0, 1]) : 0;
  return (
    <ParallaxImage id="B3" cam={{z: lerp(f, [0, dur], [1.0, 1.03]), fx: 1700, fy: 800}}>
      <NaviScreen state={screen ?? {on: 0.25, tealDraw: 0}} x={SCREEN.x} y={SCREEN.y} />
      <Img src={staticFile(A.B3.src)} style={{position: 'absolute', left: 0, top: 0, width: A.B3.w, height: A.B3.h}} />
      <Layer p={A.C1.pose.C1} />
      {pulse > 0 && pulse < 1 ? (
        <div style={{position: 'absolute', left: 2330 - 60 * (1 + pulse), top: 1010 - 60 * (1 + pulse), width: 120 * (1 + pulse), height: 120 * (1 + pulse),
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
      <NaviScreen state={state} x={SCREEN.x} y={SCREEN.y} />
      <Img src={staticFile(A.B3.src)} style={{position: 'absolute', left: 0, top: 0, width: A.B3.w, height: A.B3.h}} />
      <Layer p={A.C1.pose.C1} />
      {finger && finger.a > 0 ? (
        <Img src={staticFile(c2.src)} style={{
          position: 'absolute', opacity: finger.a,
          left: SCREEN.x + finger.nx - FINGER.tip[0] * fs, top: SCREEN.y + finger.ny - FINGER.tip[1] * fs,
          width: c2.w * fs, height: c2.h * fs,
        }} />
      ) : null}
    </ParallaxImage>
  );
};

// Fingerweg „von rechts unten zu Bestätigen“ – identisch in S1 und S5 (gleiche Geschwindigkeit)
export const confirmTarget = () => center(NAVI_POS.confirm);
export const approachFinger = (f: number, [a, b]: number[], hoverPx: number): Finger => {
  const [tx, ty] = confirmTarget();
  const hover = hoverPx / (NAVI_CAM.z! * camMap('B3', NAVI_CAM).s / NAVI_CAM.z!); // Filmpixel → Quellpixel
  const u = lerp(f, [a, b], [0, 1], ease.inOut);
  return {nx: tx + 190 + (0 - 190) * u, ny: ty + 300 + (-hover - 300) * u, a: lerp(f, [a - 6, a], [0, 1])};
};

// ------------------------------------------------------------ Praxis-Eingangshalle
export const HallShot: React.FC<{clock?: string; flip?: number; office?: number; cam?: Cam; children?: React.ReactNode}> = ({clock, flip = 1, office = 1, cam = {z: 1}, children}) => (
  <ParallaxImage id="B4" cam={cam}>
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
  return <Layer p={p} flip={flip} dx={cx - (p.x + p.w / 2)} dy={lerp(f, range, dy) + bob} scale={lerp(f, range, scale)} />;
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
