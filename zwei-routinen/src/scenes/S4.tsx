import React from 'react';
import {colors, ease, lerp, scene, T} from '../theme';
import {camMap} from '../components/ParallaxImage';
import {center, NAVI_POS} from '../components/NaviScreen';
import {
  CLOCK_CAM, confirmTarget, CupShot, DESK_CAM, HallShot, HandPlateShot, NAVI_CAM, NaviShot, NotesShot, PALM, RoomShot, SCREEN, slipAt, SlipShot, Walker,
} from '../components/Shots';
import {TextPanel} from '../components/TextPanel';

// S4 Die Routinen wiederholen sich: Tag 2 und 3 in schnellen Schnitten, Match Cut Finger → Zettel-Hand, Texttafel.
const S = scene('S4');

// Kurzer Navi-Tipp auf „Bestätigen“ (Teal)
const QuickNavi: React.FC<{lf: number; dur: number}> = ({lf, dur}) => {
  const [tx, ty] = confirmTarget();
  const t = dur * 0.5;
  const down = lerp(lf, [0, t], [0, 1], ease.inOut) - lerp(lf, [t + 2, dur], [0, 0.6], ease.inOut);
  return <NaviShot state={{tealDraw: 1, pressConfirm: lf >= t && lf < t + 3 ? 1 : 0}} finger={{nx: tx + 40 * (1 - down), ny: ty + 60 * (1 - down), a: 1}} />;
};

// Match Cut: ein gemeinsamer Bewegungsverlauf in Filmkoordinaten – erst Fingerspitze, nach dem Schnitt Handmitte
const mc = S.matchCut;
// Tisch-Kamera für den Match Cut: links bündig, damit die Ärmelkante der Hand (C8) außerhalb des Bildes bleibt

const A_ = [center(NAVI_POS.tealCard)[0], center(NAVI_POS.tealCard)[1] - 30];
const B_ = center(NAVI_POS.confirm);
const motion = [mc.cut - 30, mc.cut + 30]; // Spitzen-Geschwindigkeit genau beim Schnitt (Mitte der S-Kurve)
const fingerNavi = (f: number) => {
  const u = lerp(f, motion, [0, 1], ease.inOut);
  return [A_[0] + (B_[0] - A_[0]) * u, A_[1] + (B_[1] - A_[1]) * u];
};
const filmPos = (f: number) => {
  const [nx, ny] = fingerNavi(f);
  return camMap('B3', NAVI_CAM).toFilm(SCREEN.x + nx, SCREEN.y + ny);
};
// Tisch-Kamera für den Match Cut so gewählt, dass die Handmitte beim Schnitt ohne Versatz auf der Fingerspitze liegt
// und die Ärmelkante links außerhalb des Bildes bleibt.
const MC_CAM = (() => {
  const [px, py] = filmPos(mc.cut);
  const z = 1.3, s = camMap('DESK', {z}).s;
  return {z, fx: (960 - (px - (PALM[0] - 60) * s)) / s, fy: (540 - (py - PALM[1] * s)) / s};
})();
export const matchCutCheck = () => {
  const p0 = filmPos(mc.cut - 1), p1 = filmPos(mc.cut);
  return {pos: p1, vel: [p1[0] - p0[0], p1[1] - p0[1]]};
};

const MatchCut: React.FC<{f: number}> = ({f}) => {
  if (f < mc.cut) {
    const [nx, ny] = fingerNavi(f);
    return <NaviShot state={{tealDraw: 1}} finger={{nx, ny, a: lerp(f, [mc.from, mc.from + 4], [0, 1])}} />;
  }
  const [x, y] = filmPos(f);
  const [sx, sy] = camMap('DESK', MC_CAM).toSrc(x, y);
  const dx = sx - PALM[0], dy = sy - PALM[1];
  return <SlipShot color={colors.deepTeal2} handDx={dx} handDy={dy} slipX={slipAt(dx)} cam={MC_CAM} />;
};

const Day: React.FC<{day: any; f: number}> = ({day, f}) => {
  for (const [id, from, to] of day.shots as [string, number, number][]) {
    if (f < from || f >= to) continue;
    const lf = f - from, dur = to - from;
    switch (id) {
      case 'cup': return <CupShot f={lf} dur={dur} full zoom={[1.04, 1.06]} />;
      case 'keys': return <HandPlateShot id="C17" f={lf + 10} dur={dur + 20} />;
      case 'navi': return <QuickNavi lf={lf} dur={dur} />;
      case 'clock': return <HallShot clock={T.texts.clockLate} cam={CLOCK_CAM} />;
      case 'coat': return (
        <HallShot clock={T.texts.clockLate}>
          <Walker group="C3" f={from + lf} range={[from, to + 10]} x={[1300, 2000]} step={4} flip />
        </HallShot>
      );
      case 'patient': return <RoomShot id={day.patient} f={lf} dur={dur} zoom={[1.08, 1.1]} />;
      case 'notes': return <NotesShot f={lf} dur={dur} />;
      case 'slip': {
        const dx = lerp(lf, [0, dur * 0.7], [-700, 0], ease.inOut);
        return <SlipShot color={colors.deepTeal2} handDx={dx} slipX={slipAt(dx)} />;
      }
    }
  }
  return null;
};

export const S4: React.FC<{f: number}> = ({f}) => {
  for (const d of S.days) {
    const last = d.shots[d.shots.length - 1][2];
    if (f >= d.shots[0][1] && f < last) return <Day day={d} f={f} />;
  }
  if (f >= mc.from && f < mc.to) return <MatchCut f={f} />;
  const p = S.panel;
  const lf = f - p.from;
  return <TextPanel lines={[{text: T.texts.panel1, size: 96, appear: lerp(lf, [0, 6], [0.4, 1]), underline: {color: colors.deepTeal2, draw: lerp(lf, p.underline, [0, 1], ease.inOut)}}]} />;
};
