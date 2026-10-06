import React from 'react';
import {AbsoluteFill, Audio, getStaticFiles, Img, staticFile, useCurrentFrame} from 'remotion';
import {A, T} from './theme';
import {loadFonts} from './fonts';
import {S1} from './scenes/S1';
import {S2} from './scenes/S2';
import {S3} from './scenes/S3';
import {S4} from './scenes/S4';
import {S5} from './scenes/S5';
import {S6} from './scenes/S6';
import {S7} from './scenes/S7';
import {S8} from './scenes/S8';

loadFonts();
const SCENES: Record<string, React.FC<{f: number}>> = {S1, S2, S3, S4, S5, S6, S7, S8};
const hasMix = () => getStaticFiles().some((f) => f.name === 'audio/mix.wav');

// Alle Szenen nach Frames aus timeline.json; darüber die Papierstruktur (D2) mit 6 % Deckkraft
export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const sc = T.scenes.find((s) => frame >= s.from && frame < s.to) ?? T.scenes[T.scenes.length - 1];
  const Scene = SCENES[sc.id];
  return (
    <AbsoluteFill style={{background: '#FFFFFF'}}>
      <Scene f={frame - sc.from} />
      <Img src={staticFile(A.D2.src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.06, mixBlendMode: 'multiply'}} />
      {hasMix() ? <Audio src={staticFile('audio/mix.wav')} /> : null}
    </AbsoluteFill>
  );
};
