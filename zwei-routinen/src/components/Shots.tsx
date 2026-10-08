import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {A, colors, ease, lerp, settleHold, T} from '../theme';
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

// Schlüssel (B6) und Tasche (B7) in der Wohnung: Die Hand kommt ins Bild und greift (Bild mit Gegenstand, nur Hand),
// dann hebt sie den Gegenstand ab (leeres Bild, Hand mit Gegenstand – beim Umschalten pixelgleich). Brett und Bank bleiben stehen.
const GRAB = {
  key: {full: 'B6', empty: 'B6e', reach: 'C17', lift: 'C17k', from: [1, 0.15], up: [70, -120]},
  bag: {full: 'B7', empty: 'B7e', reach: 'C18', lift: 'C18k', from: [0.55, -1], up: [40, -170]},
};
const poseOf = (g: string) => Object.values(A[g].pose)[0] as any;
export const GrabShot: React.FC<{kind: 'key' | 'bag'; f: number; dur: number}> = ({kind, f, dur}) => {
  const g = GRAB[kind];
  const grab = Math.round(dur * 0.5);
  const cam = {z: lerp(f, [0, dur], [1.0, 1.04], ease.inOut)};
  if (f < grab) {
    const d = (1 - lerp(f, [0, grab], [0, 1], ease.out)) * 1100;
    return <ParallaxImage id={g.full} cam={cam}><Layer p={poseOf(g.reach)} dx={g.from[0] * d} dy={g.from[1] * d} /></ParallaxImage>;
  }
  const u = lerp(f, [grab + 2, dur], [0, 1], ease.inOut);
  return <ParallaxImage id={g.empty} cam={cam}><Layer p={poseOf(g.lift)} dx={g.up[0] * u} dy={g.up[1] * u} /></ParallaxImage>;
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

// Rechter Arm des Arztes (B3-Bearbeitungen C2a/C2b, am Körper angesetzt). Die Pose richtet sich nach dem Ziel:
// C2a zeigt nach rechts unten (Bestätigen), C2b in die Mitte (Gold-Karte, Routenkarten). Kurze Überblendung dazwischen.
const ARM = {a: anchors.armTips.C2a, b: anchors.armTips.C2b};
export const NaviShot: React.FC<{state: NaviState; finger?: Finger; cam?: Cam; breath?: number}> = ({state, finger, cam = NAVI_CAM}) => {
  const arm = A.C2.pose;
  return (
    <ParallaxImage id="B3" cam={cam}>
      <NaviScreen state={state} quad={QUAD} />
      <Img src={staticFile(A.B3.src)} style={{position: 'absolute', left: 0, top: 0, width: A.B3.w, height: A.B3.h}} />
      {finger && finger.a > 0 ? (() => {
        const [tx, ty] = naviToSrc(finger.nx, finger.ny);
        const wb = lerp(finger.nx, [640, 700], [1, 0]); // links der Mitte → C2b
        return (
          <>
            {wb < 1 ? <Layer p={arm.C2a} dx={tx - ARM.a[0]} dy={ty - ARM.a[1]} opacity={finger.a * (1 - wb)} /> : null}
            {wb > 0 ? <Layer p={arm.C2b} dx={tx - ARM.b[0]} dy={ty - ARM.b[1]} opacity={finger.a * wb} /> : null}
          </>
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
export const CLOCK_CAM: Cam = {z: 1.7, fx: CLOCK.cx + 40, fy: CLOCK.cy - 70};

// Gehende Figur (zwei Schrittphasen im Wechsel); feet = Abstand Fußlinie → Unterkante der Ebene
export const Walker: React.FC<{group: string; f: number; range: number[]; x: number[]; step: number; flip?: boolean; dy?: number[]; scale?: number[]; feet?: number}> = ({group, f, range, x, step, flip, dy = [0, 0], scale = [1, 1], feet = 0}) => {
  const ids = Object.keys(A[group].pose);
  const p = A[group].pose[ids[Math.floor((f - range[0]) / step) % 2 === 0 ? 0 : 1]];
  const cx = lerp(f, range, x);
  const bob = Math.abs(Math.sin(((f - range[0]) / step) * Math.PI)) * -6;
  const sc = lerp(f, range, scale), fy = p.y + p.h - feet * sc + lerp(f, range, dy);
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

// Schreiben: der Block liegt still (C7pad), nur die Hand bewegt sich in kleinen Schleifen nach rechts.
// pause: die Hand hört auf zu schreiben, hebt den Stift ein wenig und hält inne (gleiche Kurve wie der Finger in S5).
export const NotesShot: React.FC<{f: number; dur: number; write?: number[]; pause?: number[]}> = ({f, dur, write, pause}) => {
  const t = write ? Math.min(f, write[1]) : f;
  let dx = Math.sin(t * 0.22) * 16 + Math.sin(t * 1.15) * 4, dy = Math.cos(t * 1.15) * 3;
  if (pause && f >= pause[0]) dy += lerp(f, [pause[0], pause[0] + 10], [0, -16], ease.settle) + settleHold(f, pause) * 1.5;
  return (
    <ParallaxImage id="DESK" cam={{...DESK_CAM, z: lerp(f, [0, dur], [1.2, 1.24])}}>
      <Layer p={A.C7pad.pose.C7p} />
      <Layer p={A.C7.pose.C7} dx={dx} dy={dy} style={handShadow(pause && f >= pause[0] ? 0.5 : 0.2)} />
    </ParallaxImage>
  );
};

// Weicher Schatten unter Händen am Tisch (statt des mitgezogenen KI-Schattens): je höher die Hand, desto weiter und weicher
export const handShadow = (lift: number): React.CSSProperties => ({
  filter: `drop-shadow(${6 + lift * 10}px ${10 + lift * 22}px ${8 + lift * 14}px rgba(37,40,42,${0.2 - lift * 0.08}))`,
});

export const PatientHandShot: React.FC<{id: 'C12' | 'C16'; f: number; dur: number}> = ({id, f, dur}) => (
  <ParallaxImage id="DESK" cam={{...DESK_CAM, z: lerp(f, [0, dur], [1.22, 1.26])}}>
    <Layer p={A[id].pose[id]} style={handShadow(0)} />
  </ParallaxImage>
);

// Zettel-Tisch: Arzthand (C8) schiebt den Zettel, Patientenhand (C12/C16) nimmt ihn.
// handDx: Verschiebung der Arzthand (0 = Endposition), slipX: Zettel-Mitte (Quellpixel), patient: Verschiebung der Patientenhand
export const SlipShot: React.FC<{color: string; handDx: number | null; handDy?: number; slipX: number | null; slipY?: number; patient?: {id: 'C12' | 'C16'; dx: number} | null; cam?: Cam; moving?: number}> = ({color, handDx, handDy = 0, slipX, slipY, patient, cam = DESK_CAM, moving = 0}) => (
  <ParallaxImage id="DESK" cam={cam}>
    {slipX != null ? <Slip color={color} x={slipX} y={slipY ?? C8_PALM[1] + SLIP_OFF[1] + handDy} w={SLIP_W} /> : null}
    {patient ? <Layer p={A[patient.id].pose[patient.id]} dx={patient.dx} style={handShadow(patient.dx > 300 ? 0.6 : 0.6 * Math.max(0, patient.dx) / 300)} /> : null}
    {handDx != null ? <Layer p={A.C8.pose.C8} dx={handDx} dy={handDy} style={handShadow(Math.sin(Math.PI * moving) * 0.25)} /> : null}
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
