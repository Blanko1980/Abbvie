import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {A, H, W, colors} from '../theme';

export type Cam = {z?: number; fx?: number; fy?: number};

// Abbildung Quellpixel → Filmpixel für ein Plattenbild mit Kamera (Zoom auf Fokuspunkt, bleibt im Bild)
export const camMap = (id: string, cam: Cam = {}) => {
  const a = A[id];
  const z = cam.z ?? 1;
  const s = Math.max(W / a.w, H / a.h) * z;
  const hw = W / 2 / s, hh = H / 2 / s;
  const cx = Math.min(Math.max(cam.fx ?? a.w / 2, hw), a.w - hw);
  const cy = Math.min(Math.max(cam.fy ?? a.h / 2, hh), a.h - hh);
  const ox = W / 2 - cx * s, oy = H / 2 - cy * s;
  return {s, ox, oy, toFilm: (x: number, y: number) => [ox + x * s, oy + y * s], toSrc: (x: number, y: number) => [(x - ox) / s, (y - oy) / s]};
};

// Standbild mit Kamerafahrt; Kinder werden in Quellpixeln dieses Bildes positioniert und fahren mit
export const ParallaxImage: React.FC<{id: string; cam?: Cam; src?: string; children?: React.ReactNode; bg?: string}> = ({id, cam, src, children, bg}) => {
  const a = A[id];
  const m = camMap(id, cam);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: bg ?? colors.white}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: a.w, height: a.h, transformOrigin: '0 0', transform: `translate(${m.ox}px, ${m.oy}px) scale(${m.s})`}}>
        <Img src={staticFile(src ?? a.src)} style={{position: 'absolute', left: 0, top: 0, width: a.w, height: a.h}} />
        {children}
      </div>
    </AbsoluteFill>
  );
};

// Freigestellte Ebene in Quellpixeln (x, y, w, h); dx/dy verschieben, flip spiegelt um die eigene Mitte,
// scale skaliert um den Fußpunkt (Mitte unten)
export const Layer: React.FC<{p: {src: string; x: number; y: number; w: number; h: number}; dx?: number; dy?: number; opacity?: number; flip?: boolean; scale?: number; style?: React.CSSProperties}> = ({p, dx = 0, dy = 0, opacity = 1, flip, scale = 1, style}) => {
  if (opacity <= 0) return null;
  return (
    <Img
      src={staticFile(p.src)}
      style={{
        position: 'absolute', left: p.x + dx, top: p.y + dy, width: p.w, height: p.h, opacity,
        transformOrigin: '50% 100%', transform: `${flip ? 'scaleX(-1) ' : ''}scale(${scale})`, ...style,
      }}
    />
  );
};
