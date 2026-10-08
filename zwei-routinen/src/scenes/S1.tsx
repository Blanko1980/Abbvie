import React from 'react';
import {ease, lerp, scene} from '../theme';
import {approachFinger, BeltShot, confirmTarget, CupShot, GrabShot, NaviShot} from '../components/Shots';

// S1 Der erste Morgen – alles wie immer: Tasse, Schlüssel, Tasche, Gurt, Navi „Bestätigen“ auf Teal.
const S = scene('S1');
const shot = (id: string) => S.shots.find((s: any) => s.id === id);

export const naviTapState = (f: number, n: any, hoverPx = 12) => {
  // gemeinsamer Fingerweg + Tippen (S1, S4)
  const [tx, ty] = confirmTarget();
  let finger = approachFinger(f, n.approach, hoverPx);
  const press = f >= n.tap && f < n.tap + 5 ? 1 : 0;
  if (f >= n.approach[1]) {
    const down = lerp(f, [n.tap - 7, n.tap], [0, 1], ease.inOut) - lerp(f, [n.tap + 5, n.tap + 14], [0, 1], ease.inOut);
    finger = {nx: tx, ny: finger!.ny + (ty - finger!.ny) * Math.max(0, down), a: 1};
  }
  return {finger, press};
};

export const S1: React.FC<{f: number}> = ({f}) => {
  for (const s of S.shots) {
    if (f < s.from || f >= s.to) continue;
    const lf = f - s.from, dur = s.to - s.from;
    switch (s.id) {
      case 'cup': return <CupShot f={lf} dur={dur} fill={s.fill} pour={s.pour} zoom={s.zoom} />;
      case 'keys': return <GrabShot kind="key" f={lf} dur={dur} />;
      case 'bag': return <GrabShot kind="bag" f={lf} dur={dur} />;
      case 'belt': return <BeltShot f={lf} dur={dur} click={s.click - s.from} />;
      case 'naviWide': return <BeltShot f={lf + 36} dur={dur + 36} screen={{on: lerp(f, s.screenOn, [0.25, 1]), tealDraw: 0}} />;
      case 'navi': {
        const {finger, press} = naviTapState(f, s);
        return <NaviShot state={{tealDraw: lerp(f, s.routeDraw, [0, 1], ease.out), pressConfirm: press}} finger={finger} />;
      }
    }
  }
  return null;
};
