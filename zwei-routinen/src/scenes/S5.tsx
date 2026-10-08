import React from 'react';
import {ease, lerp, scene, settleHold} from '../theme';
import {approachFinger, BeltShot, CupShot, GrabShot, NaviShot} from '../components/Shots';
import {center, NAVI_POS} from '../components/NaviScreen';

// S5 Das Innehalten am Navi: gleicher Morgen (je 20 Frames), Finger nähert sich wie in S1, hält 30 Frames 12 px über
// „Bestätigen“ (Raster setzt aus), Pop-up „Neue Route gefunden“, erst jetzt erscheint die Gold-Route (23 min), Tipp auf Gold.
const S = scene('S5');

export const S5: React.FC<{f: number}> = ({f}) => {
  for (const [id, from, to] of S.shots as [string, number, number][]) {
    if (f < from || f >= to) continue;
    const lf = f - from;
    if (id === 'cup') return <CupShot f={lf + 40} dur={to - from + 60} full />;
    if (id === 'keys') return <GrabShot kind="key" f={lf} dur={to - from} />;
    if (id === 'belt') return <BeltShot f={lf} dur={to - from} click={12} />;
  }
  const n = S.navi;
  let finger = approachFinger(f, n.approach, n.hoverPx);
  // Innehalten: kaum merkliches Atmen
  if (f >= n.pause[0]) finger = {...finger!, ny: finger!.ny + settleHold(f, n.pause) * 1.5};
  // danach wandert der Finger zur Gold-Karte und tippt
  const [gx, gy] = center(NAVI_POS.goldCard);
  if (f >= n.tapMove[0]) {
    const u = lerp(f, n.tapMove, [0, 1], ease.inOut);
    const down = lerp(f, [n.tap - 4, n.tap], [0, 1], ease.inOut) - lerp(f, [n.tap + 5, n.tap + 12], [0, 1], ease.inOut);
    finger = {nx: finger!.nx + (gx - finger!.nx) * u, ny: finger!.ny + (gy - 40 - finger!.ny) * u + 40 * Math.max(0, down) * u, a: 1};
  }
  const pressGold = f >= n.tap && f < n.tap + 5 ? 1 : 0;
  return (
    <NaviShot
      state={{
        tealDraw: 1,
        goldExpand: lerp(f, n.goldExpand, [0, 1], ease.inOut),
        goldDraw: lerp(f, n.goldDraw, [0, 1], ease.inOut),
        // Pop-up erscheint, die Gold-Route zeichnet sich, dann tritt das Pop-up zurück und gibt die Karte frei
        popup: lerp(f, n.popup, [0, 1], ease.out) * lerp(f, n.popupOut, [1, 0], ease.inOut),
        goldVisible: lerp(f, n.popup, [0, 1], ease.out),
        selected: f >= n.tap ? 'gold' : 'teal',
        pressGold,
      }}
      finger={finger}
    />
  );
};
