import React from 'react';
import {A, scene, T} from '../theme';
import {Layer} from '../components/ParallaxImage';
import {HallShot, Walker} from '../components/Shots';

// S2 Ankunft unter Zeitdruck – feste Kamera, Digitaluhr 08:55, Schild „Sprechstunde ab 9:00 Uhr“.
// Der Arzt kommt in Alltagskleidung, rennt zur Garderobe, reißt den Kittel im Laufen vom Haken
// und hastet mit dem Kittel in der Hand hinter den Tresen und weiter – zum Anziehen bleibt keine Zeit.
export const hallTime = (S: any) => T.texts[S.clock as 'clockLate' | 'clockEarly'];
export const Counter: React.FC = () => <Layer p={A.COUNTER} />;

const S = scene('S2');
export const S2: React.FC<{f: number}> = ({f}) => {
  const {run, runCoat, grab, hookDepth: hd, behindCounter: bc} = S;
  const g = A.C3g.pose.C3g;
  return (
    <HallShot clock={hallTime(S)} f={f} plate={f >= S.plateSwap ? 'B4' : 'B4c'} front={<Counter />}>
      {f >= run.from && f < run.to ? <Walker group="C3" f={f} range={[run.from, run.to]} x={run.x} step={run.step} dy={[0, hd.dy]} scale={[1, hd.scale]} /> : null}
      {f >= grab[0] && f < grab[1] ? <Layer p={g} dx={run.x[1] - (g.x + g.w / 2)} dy={hd.dy} scale={hd.scale} /> : null}
      {f >= runCoat.from && f < runCoat.to ? <Walker group="C3c" f={f} range={[runCoat.from, runCoat.to]} x={runCoat.x} step={runCoat.step} dy={[hd.dy, bc.dy]} scale={[hd.scale, bc.scale]} /> : null}
    </HallShot>
  );
};
