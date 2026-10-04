#!/usr/bin/env python3
"""Prüft, wie genau KI-Bildvarianten (Bearbeitungen) auf dem Ausgangsbild liegen.
Aufruf: python3 tools/ki_align.py basis.jpg variante.jpg [diff.png]
Gibt den Versatz (Phasenkorrelation) und die mittlere Abweichung aus;
optional eine Differenzkarte, die zeigt, wo sich das Bild verändert hat."""
import sys
import numpy as np
from PIL import Image


def load(p, size=None):
    im = Image.open(p).convert("L")
    if size:
        im = im.resize(size, Image.LANCZOS)
    return np.asarray(im, dtype=np.float32)


def shift(a, b):
    fa, fb = np.fft.fft2(a), np.fft.fft2(b)
    r = fa * np.conj(fb)
    r /= np.abs(r) + 1e-9
    c = np.abs(np.fft.ifft2(r))
    y, x = np.unravel_index(np.argmax(c), c.shape)
    h, w = a.shape
    return (x if x <= w // 2 else x - w), (y if y <= h // 2 else y - h)


def main():
    a = load(sys.argv[1])
    b = load(sys.argv[2], (a.shape[1], a.shape[0]))
    dx, dy = shift(a, b)
    d = np.abs(a - b)
    print(f"Versatz dx={dx} dy={dy} px, mittlere Abweichung {d.mean():.2f}, Anteil >24: {(d > 24).mean() * 100:.1f} %")
    if len(sys.argv) > 3:
        Image.fromarray(np.clip(d * 4, 0, 255).astype(np.uint8)).save(sys.argv[3])


if __name__ == "__main__":
    main()
