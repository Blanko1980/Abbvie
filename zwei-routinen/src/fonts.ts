import {continueRender, delayRender, staticFile} from 'remotion';

// Schriften lokal aus /public/fonts laden und das Rendern so lange anhalten
const faces: [string, string, string][] = [
  ['SourceSans3', 'fonts/source-sans-3-latin-400-normal.woff2', '400'],
  ['SourceSans3', 'fonts/source-sans-3-latin-600-normal.woff2', '600'],
  ['SourceSans3', 'fonts/source-sans-3-latin-700-normal.woff2', '700'],
  ['Caveat', 'fonts/caveat-latin-600-normal.woff2', '600'],
  ['Caveat', 'fonts/caveat-latin-700-normal.woff2', '700'],
];

let started = false;
export const loadFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const handle = delayRender('Schriften laden');
  Promise.all(
    faces.map(([family, file, weight]) => {
      const f = new FontFace(family, `url(${staticFile(file)}) format('woff2')`, {weight});
      document.fonts.add(f);
      return f.load();
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => { console.error(e); continueRender(handle); });
};
