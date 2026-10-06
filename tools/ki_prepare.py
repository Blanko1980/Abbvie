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


def diff_mask(base, var, split=None, thresh=22):
    d = np.abs(base - var).max(axis=2)
    d = np.asarray(Image.fromarray(d.astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)), np.float32)
    keep = d > thresh
    if split:
        keep[:, :split[0]] = False
        keep[:, split[1]:] = False
    # Rauschen entfernen (Öffnen), nur größere Bereiche bleiben
    k = Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))
    return np.asarray(k) > 0


def color_match(base, var, region):
    """Farbe/Kontrast der Variante an das Grundbild angleichen (lineare Anpassung je Kanal,
    gemessen an unveränderten Pixeln im Bereich der Ebene)."""
    same = region & (np.abs(base - var).max(axis=2) < 14)
    out = var.copy()
    if same.sum() < 500:
        return out
    for c in range(3):
        x, y = var[..., c][same], base[..., c][same]
        if x.std() < 4:  # zu wenig Spreizung für eine stabile Anpassung
            continue
        a = float(np.clip(np.cov(x, y)[0, 1] / x.var(), 0.8, 1.25))
        b = float(y.mean() - a * x.mean())
        out[..., c] = np.clip(var[..., c] * a + b, 0, 255)
    return out


def overlay_group(base, variants, prefix, split, thresh=22, grow=28, blur=22):
    """Mehrere Pose-Varianten einer Figur mit GEMEINSAMER weicher Maske
    (Vereinigung aller Änderungen) – so lassen sie sich sauber ineinander überblenden."""
    keep = np.zeros(base.shape[:2], bool)
    for v in variants.values():
        keep |= diff_mask(base, v, split, thresh)
    alpha = soft_mask(keep, grow, blur)
    alpha[:, :split[0]] = 0
    alpha[:, split[1]:] = 0
    x0, y0, x1, y1 = bbox(alpha > 0.004)
    region = np.zeros_like(keep)
    region[y0:y1, x0:x1] = True
    out = {}
    for key, v in variants.items():
        v = color_match(base, v, region)
        name = f"{prefix}-{key}.webp"
        save_webp(np.dstack([v, alpha * 255])[y0:y1, x0:x1], name)
        out[key] = {"src": "assets/ki/" + name, "x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0)}
    return out


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


# Einstellung: (Grundbild, {Pose: Variante}) – alle Varianten sind KI-Bearbeitungen des Grundbilds
SHOTS = {
    "cup": ("cup-a.jpg", {"greifen": "cup-b.jpg"}),
    # Anheben: Hand + Tasse als eng maskierte Ebene über der leeren Arbeitsplatte, im Code bewegt
    "cupLift": ("cup-leer.jpg", {"greifen": "cup-b.jpg"}, {"grow": 8, "blur": 4}),
    "key": ("key-a.jpg", {"greifen": "key-b.jpg", "leer": "key-c.jpg"}),
    "bag": ("bag-a.jpg", {"tragen": "bag-b.jpg"}),
    "door": ("door-a.jpg", {"einsteigen": "door-b.jpg"}),
    "belt": ("belt2-a.jpg", {"zu": "belt2-b.jpg"}),
    "beltCoat": ("belt2-coat-a.jpg", {"zu": "belt2-coat-b.jpg"}),
    "practice": ("practice-a.jpg", {"tuer": "practice-b.jpg"}),
    "greet": ("greet-a.jpg", {"hand": "greet-b.jpg"}),
    "handle": ("handle-a.jpg", {"griff": "handle-b.jpg"}),
    # Hand dreht sich nach dem Match Cut vom senkrechten Türgriff in den waagerechten Autotürgriff
    "carhandle": ("carhandle-b.jpg", {"mitte": "carhandle-mitte.jpg", "ende": "carhandle-ende.jpg"}),
    # gespiegelt: Auto zeigt nach rechts, man sieht die Beifahrerseite (passt zur Sitzordnung im Innenraum)
    "boarding": ("boarding-a.jpg", {"sitzt": "boarding-b.jpg"}, {"flip": True}),
}


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

    # --- Innenraum: Grundbild (Arzt schaut aufs Navi, Patientin nach vorn) + Pose-Ebenen je Figur
    A = rgb("cabin-a3.jpg")  # Arzt schaut mit offenen Augen aufmerksam aufs Navi
    save_jpg(A, "cabin-a.jpg")
    W = A.shape[1]
    B = rgb("cabin-b.jpg")
    meta["cabin"] = {
        "src": "assets/ki/cabin-a.jpg", "w": W, "h": A.shape[0],
        "doc": overlay_group(A, {"mitte": rgb("cabin-arzt-mitte2.jpg"), "b": B, "blinzeln": rgb("cabin-b-blink.jpg")},
                             "cabin-arzt", (W // 2, W)),
        "pat": overlay_group(A, {"mitte": rgb("cabin-patientin-mitte.jpg"), "b": B}, "cabin-patientin", (0, W // 2)),
    }

    # --- Losfahren: Straßenkulisse (breit, wird gescrollt) + Auto seitlich freigestellt mit Radpositionen
    if os.path.exists(os.path.join(RAW, "drive-car.png")):
        bg = rgb("drive-bg.jpg")
        save_jpg(bg, "drive-bg.jpg")
        a = rgb("drive-car.png")
        col, alpha = key_magenta(a)
        # Scheiben: KI malt sie halbtransparent über Magenta → lila Reste. Als neutrale, getönte Scheibe füllen.
        mg = np.minimum(a[..., 0], a[..., 2]) - a[..., 1]
        glass = (mg > 22) & (alpha > 0.02) & (alpha < 0.995)
        inner = np.asarray(Image.fromarray((alpha > 0.5).astype(np.uint8) * 255).filter(ImageFilter.MinFilter(15))) > 0
        glass &= ~inner | (mg > 22)
        lumg = a.mean(axis=2)
        tint = np.stack([lumg * 0.38 + 52, lumg * 0.38 + 56, lumg * 0.38 + 60], axis=2)
        # nur innerhalb der Karosserie-Silhouette (Löcher schließen) einfärben
        sil = Image.fromarray((alpha > 0.5).astype(np.uint8) * 255)
        for _ in range(6):
            sil = sil.filter(ImageFilter.MaxFilter(15))
        for _ in range(6):
            sil = sil.filter(ImageFilter.MinFilter(15))
        sil = np.asarray(sil) > 0
        win = sil & (alpha < 0.98)
        col[win] = tint[win] * (1 - alpha[win, None]) + col[win] * alpha[win, None]
        alpha = np.where(win, 1.0, alpha)
        # deckend lila gemalte Scheibenflächen (Magenta-Stich) ebenfalls neutral tönen
        purple = np.clip((mg - 12) / 40, 0, 1) * sil
        col = col * (1 - purple[..., None]) + tint * purple[..., None]
        x0, y0, x1, y1 = bbox(alpha > 0.5, pad=4)
        car = np.dstack([col, alpha * 255])[y0:y1, x0:x1]
        save_webp(car, "drive-car.webp")
        # Räder: Kreis robust an die dunklen Reifenpixel anpassen (algebraischer Kreisfit, Ausreißer verwerfen)
        lum = car[..., :3].mean(axis=2)
        dark = (lum < 75) & (car[..., 3] > 200)
        h, w = dark.shape
        dark[: int(h * 0.5)] = False
        def fit(xs, ys):
            A = np.c_[2 * xs, 2 * ys, np.ones(len(xs))]
            b = xs ** 2 + ys ** 2
            cx, cy, c = np.linalg.lstsq(A, b, rcond=None)[0]
            return cx, cy, np.sqrt(c + cx ** 2 + cy ** 2)
        wheels = []
        for xa, xb in ((0, w // 2), (w // 2, w)):
            ys, xs = np.where(dark[:, xa:xb])
            xs = (xs + xa).astype(float); ys = ys.astype(float)
            # nur äußerer Reifenrand: je Spalte der unterste dunkle Pixel + je Zeile äußerste
            cx, cy, r = fit(xs, ys)
            for _ in range(6):
                d = np.abs(np.hypot(xs - cx, ys - cy) - r)
                keep = d < max(8, np.percentile(d, 60))
                cx, cy, r = fit(xs[keep], ys[keep])
            wheels.append({"x": round(float(cx), 1), "y": round(float(cy), 1), "r": round(float(r), 1)})
        meta["drive"] = {"bg": {"src": "assets/ki/drive-bg.jpg", "w": bg.shape[1], "h": bg.shape[0]},
                         "car": {"src": "assets/ki/drive-car.webp", "w": int(x1 - x0), "h": int(y1 - y0), "wheels": wheels}}
    # --- Draufsicht: Auto von oben (Scheiben entsättigt: kein Blau außerhalb der vertrauten Route)
    if os.path.exists(os.path.join(RAW, "car-top.png")):
        col, alpha = key_magenta(rgb("car-top.png"))
        grey = col.mean(axis=2, keepdims=True)
        col = grey + (col - grey) * 0.15
        x0, y0, x1, y1 = bbox(alpha > 0.5, pad=4)
        save_webp(np.dstack([col, alpha * 255])[y0:y1, x0:x1], "car-top.webp")
        meta["carTop"] = {"src": "assets/ki/car-top.webp", "w": int(x1 - x0), "h": int(y1 - y0)}

    # --- Einstellungen nach dem allgemeinen Schema: Grundbild + Pose-Varianten (gemeinsame Maske)
    for key, (base, variants, *opt) in SHOTS.items():
        opt = opt[0] if opt else {}
        if not all(os.path.exists(os.path.join(RAW, f)) for f in [base, *variants.values()]):
            print("übersprungen (Bilder fehlen):", key)
            continue
        load = (lambda f: rgb(f)[:, ::-1].copy()) if opt.get("flip") else rgb
        A = load(base)
        save_jpg(A, f"{key}.jpg")
        meta[key] = {"src": f"assets/ki/{key}.jpg", "w": A.shape[1], "h": A.shape[0],
                     "pose": overlay_group(A, {k: load(f) for k, f in variants.items()}, key, (0, A.shape[1]),
                                           grow=opt.get("grow", 28), blur=opt.get("blur", 22)) if variants else {}}

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
