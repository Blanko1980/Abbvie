#!/usr/bin/env python3
"""Bereitet die KI-Rohbilder (assets/ki/roh) für den Film auf (assets/ki).

- Platten (deckende Hintergründe) → JPEG
- Magenta-Flächen (#FF00FF) → transparent (Freistellen, Bildschirm-Aussparung) → WebP mit Alpha
- Pose-Varianten (KI-Bearbeitungen desselben Bildes) → nur die veränderten Bereiche
  als weich maskierte Ebenen, die im Film überblendet werden
- Koordinaten → assets/ki/meta.js (window.FILM_KI), damit der Film ohne Server läuft

Aufruf: python3 tools/ki_prepare.py
"""
import json, os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), "..")
RAW = os.path.join(ROOT, "assets/ki/roh")
OUT = os.path.join(ROOT, "assets/ki")
MAGENTA = np.array([255, 0, 255], np.float32)


def rgb(name):
    return np.asarray(Image.open(os.path.join(RAW, name)).convert("RGB"), np.float32)


def save_jpg(arr, name, q=90):
    Image.fromarray(arr.astype(np.uint8)).save(os.path.join(OUT, name), "JPEG", quality=q)


def save_webp(arr_rgba, name, q=90):
    Image.fromarray(arr_rgba.astype(np.uint8), "RGBA").save(os.path.join(OUT, name), "WEBP", quality=q, method=6)


def key_magenta(a):
    """Alpha aus dem Abstand zu Magenta; Randfarben von Magenta befreien."""
    # Magenta: R und B hoch, G niedrig. Maß: wie viel „Magenta-Anteil“ steckt im Pixel
    m = np.minimum(a[..., 0], a[..., 2]) - a[..., 1]          # 255 bei reinem Magenta
    bg = np.clip((m - 60) / (200 - 60), 0, 1)                   # 0 = Vordergrund, 1 = Hintergrund
    alpha = 1 - bg
    # Farbe zurückrechnen: I = α·C + (1-α)·M  →  C = (I - (1-α)·M) / α
    am = np.maximum(alpha, 1e-3)[..., None]
    col = np.clip((a - (1 - alpha)[..., None] * MAGENTA) / am, 0, 255)
    return col, alpha


def bbox(mask, pad=0):
    ys, xs = np.where(mask)
    h, w = mask.shape
    return (max(0, xs.min() - pad), max(0, ys.min() - pad), min(w, xs.max() + 1 + pad), min(h, ys.max() + 1 + pad))


def soft_mask(diff_bool, grow=28, blur=22):
    im = Image.fromarray((diff_bool * 255).astype(np.uint8))
    im = im.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(4))
    im = im.point(lambda v: 255 if v > 40 else 0)
    for _ in range(grow // 8):
        im = im.filter(ImageFilter.MaxFilter(17))
    im = im.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(im, np.float32) / 255


def overlay(base, var, name, split=None, thresh=22):
    """Ebene mit den Bereichen, in denen sich var von base unterscheidet."""
    d = np.abs(base - var).max(axis=2)
    d = np.asarray(Image.fromarray(d.astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)), np.float32)
    keep = d > thresh
    if split:
        x0, x1 = split
        keep[:, :x0] = False
        keep[:, x1:] = False
    # Rauschen entfernen: nur zusammenhängende größere Bereiche behalten (grob über Öffnen)
    k = Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))
    keep = np.asarray(k) > 0
    alpha = soft_mask(keep)
    if split:
        alpha[:, :split[0]] = 0
        alpha[:, split[1]:] = 0
    x0, y0, x1, y1 = bbox(alpha > 0.004)
    rgba = np.dstack([var, alpha * 255])[y0:y1, x0:x1]
    save_webp(rgba, name)
    return {"src": "assets/ki/" + name, "x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0)}


def hand(raw, name):
    a = rgb(raw)[:, ::-1]
    col, alpha = key_magenta(a)
    x0, y0, x1, y1 = bbox(alpha > 0.02, pad=2)
    save_webp(np.dstack([col, alpha * 255])[y0:y1, x0:x1], name)
    ys, xs = np.where((alpha > 0.5)[y0:y1, x0:x1])
    i = np.argmax(xs)  # Fingerspitze = am weitesten rechts
    tip = [int(xs[i]) - 6, int(ys[i])]
    # Richtung des Zeigefingers: Mitte des obersten Pixellaufs 220 px hinter der Spitze
    colm = (alpha > 0.5)[y0:y1, x0:x1][:, tip[0] - 220]
    top = int(np.argmax(colm))
    run = top
    while run < len(colm) and colm[run]:
        run += 1
    cy = (top + run) / 2
    ang = float(np.arctan2(tip[1] - cy, 220))
    return {"src": "assets/ki/" + name, "w": int(x1 - x0), "h": int(y1 - y0), "tip": tip, "angle": round(ang, 4)}


def main():
    meta = {}

    # --- Navi: Armaturenbrett mit ausgestanztem Bildschirm
    a = rgb("navi-plate.png")
    col, alpha = key_magenta(a)
    scr = alpha < 0.5
    # nur die große zusammenhängende Fläche in der Bildmitte zählt als Bildschirm
    x0, y0, x1, y1 = bbox(scr)
    save_webp(np.dstack([col, alpha * 255]), "navi-plate.webp", q=92)
    # Trapez des Bildschirms: Kanten aus zwei Zeilen abseits der Rundungen, auf Ober-/Unterkante extrapoliert
    def ext(y):
        xs = np.where(scr[y])[0]
        return xs.min(), xs.max() + 1
    ya, yb = y0 + int((y1 - y0) * 0.2), y0 + int((y1 - y0) * 0.8)
    (la, ra), (lb, rb) = ext(ya), ext(yb)
    lx = lambda y: la + (lb - la) * (y - ya) / (yb - ya)
    rx = lambda y: ra + (rb - ra) * (y - ya) / (yb - ya)
    quad = [[lx(y0), y0], [rx(y0), y0], [rx(y1), y1], [lx(y1), y1]]  # TL, TR, BR, BL
    meta["navi"] = {"src": "assets/ki/navi-plate.webp", "w": a.shape[1], "h": a.shape[0],
                    "screen": {"x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0)},
                    "quad": [[round(float(x), 1), int(y)] for x, y in quad]}

    # --- Navi: Hände des Arztes (gespiegelt: Unterarm kommt von links unten)
    for key, raw in (("handCoat", "navi-hand.png"), ("handSweater", "navi-hand-pulli.png")):
        if os.path.exists(os.path.join(RAW, raw)):
            meta[key] = hand(raw, raw.replace(".png", ".webp"))

    # --- Innenraum: Grundbild A (Blick aufs Navi) + Kopf-Ebenen B (Blickkontakt) + Blinzeln
    A, B, BL = rgb("cabin-a.jpg"), rgb("cabin-b.jpg"), rgb("cabin-b-blink.jpg")
    save_jpg(A, "cabin-a.jpg")
    W = A.shape[1]
    meta["cabin"] = {
        "src": "assets/ki/cabin-a.jpg", "w": W, "h": A.shape[0],
        "patB": overlay(A, B, "cabin-b-patientin.webp", split=(0, W // 2)),
        "docB": overlay(A, B, "cabin-b-arzt.webp", split=(W // 2, W)),
        "docBlink": overlay(B, BL, "cabin-b-arzt-blinzeln.webp", split=(W // 2, W), thresh=18),
    }

    # Bilddaten einbetten: Bilder per file:// würden den Canvas für Export/Render sperren
    import base64
    srcs = []
    def collect(o):
        for k, v in o.items():
            if isinstance(v, dict):
                collect(v)
            elif k == "src":
                srcs.append(v)
    collect(meta)
    mime = {".jpg": "image/jpeg", ".webp": "image/webp", ".png": "image/png"}
    with open(os.path.join(OUT, "bilder.js"), "w") as fh:
        fh.write("/* automatisch erzeugt von tools/ki_prepare.py – eingebettete Bilddaten */\nwindow.FILM_KI_DATA = {\n")
        for sname in srcs:
            with open(os.path.join(ROOT, sname), "rb") as im:
                b64 = base64.b64encode(im.read()).decode()
            fh.write(f' "{sname}": "data:{mime[os.path.splitext(sname)[1]]};base64,{b64}",\n')
        fh.write("};\n")

    with open(os.path.join(OUT, "meta.js"), "w") as fh:
        fh.write("/* automatisch erzeugt von tools/ki_prepare.py */\nwindow.FILM_KI = " + json.dumps(meta, indent=1) + ";\n")
    print(json.dumps(meta, indent=1))


if __name__ == "__main__":
    main()
