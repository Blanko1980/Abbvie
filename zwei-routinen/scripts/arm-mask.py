#!/usr/bin/env python3
"""Masken für Arme, deren Ärmel dem Hintergrund gleicht (C2a/C2b: dunkler Ärmel vor dunkler Konsole,
C7: weißer Kittelärmel vor hellem Tisch) – per Differenz allein nicht sauber zu trennen. GrabCut, initialisiert aus der Differenz zu B3 (Hand = sicher Vordergrund, weit entfernte
unveränderte Bereiche = sicher Hintergrund). Ergebnis: assets/masks/<id>.png (Graustufen, volle Auflösung)."""
import sys, cv2, numpy as np
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
# Unterarm-Achse (volle Auflösung): vom unteren Bildrand zum Handgelenk. Der Oberarm liegt außerhalb des Navi-Ausschnitts.
AXIS = {'C2a': [(1610, 1650), (1770, 1320)], 'C2b': [(1400, 1650), (1500, 1330)], 'C7': [(-60, 700), (780, 830)]}
BASE = {'C2a': 'B3', 'C2b': 'B3', 'C7': 'C7p'}
RADIUS = {'C7': (200, 330, 90)}   # (wahrscheinlich Arm, äußerste Grenze, sicher Arm)
# Konsolenteile direkt neben dem Ärmel (gleich dunkel) sicher ausschließen
EXCLUDE = {'C2a': [[(1858, 1607), (1892, 1380), (2100, 1380), (2100, 1607)]], 'C2b': [[(1250, 1230), (1418, 1230), (1406, 1430), (1404, 1607), (1250, 1607)]]}
for id_ in sys.argv[1:] or ['C2a', 'C2b', 'C7']:
    base = cv2.imread(str(ROOT / f'assets/gen/{BASE[id_]}.jpg'))
    rin, rout, rcore = RADIUS.get(id_, (110, 260, 35))
    img = cv2.imread(str(ROOT / f'assets/gen/{id_}.jpg'))
    img = cv2.resize(img, (base.shape[1], base.shape[0]))
    s = 0.5
    b2, i2 = cv2.resize(base, None, fx=s, fy=s), cv2.resize(img, None, fx=s, fy=s)
    d = np.abs(b2.astype(int) - i2.astype(int)).max(2).astype(np.float32)
    dl = cv2.GaussianBlur(d, (0, 0), 6)
    # Bildschirm (Magenta) gehört nie zum Arm
    hsv = cv2.cvtColor(i2, cv2.COLOR_BGR2HSV)
    magenta = (hsv[..., 0] > 135) & (hsv[..., 0] < 165) & (hsv[..., 1] > 120)
    hand = ((d > 45) & ~magenta).astype(np.uint8)
    seg = np.zeros(d.shape, np.uint8)
    (x0, y0), (x1, y1) = [(int(x * s), int(y * s)) for x, y in AXIS[id_]]
    dist = lambda r: cv2.line(seg.copy(), (x0, y0), (x1, y1), 1, int(2 * r * s)).astype(bool)
    near = lambda r: cv2.dilate(hand, np.ones((int(r * s) * 2 + 1,) * 2, np.uint8)).astype(bool)
    m = np.full(d.shape, cv2.GC_BGD, np.uint8)
    m[dist(rout) | near(60)] = cv2.GC_PR_BGD
    m[dist(rin) & (dl > 2)] = cv2.GC_PR_FGD
    m[hand.astype(bool) | dist(rcore)] = cv2.GC_FGD
    m[magenta] = cv2.GC_BGD
    for poly in EXCLUDE.get(id_, []):
        cv2.fillPoly(m, [np.array([(int(x * s), int(y * s)) for x, y in poly], np.int32)], cv2.GC_BGD)
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(i2, m, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    fg = np.where((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))   # dünne Linien (Bildschirmrand) weg
    fg[cv2.morphologyEx(hand, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)] = 255   # Stift und Finger sicher behalten
    # größte Komponente (der Arm), Löcher schließen
    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg)
    if n > 1:
        # größte Komponente plus alles, was sicher zur Hand gehört (z. B. der Stift über den Fingern)
        k = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        nearMain = cv2.dilate((lab == k).astype(np.uint8), np.ones((41, 41), np.uint8)).astype(bool)
        keep = {k} | {int(c) for c in np.unique(lab[hand.astype(bool) & nearMain]) if c and stats[c, cv2.CC_STAT_AREA] > 150}
        fg = np.where(np.isin(lab, list(keep)), 255, 0).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    fg = cv2.resize(fg, (base.shape[1], base.shape[0]), interpolation=cv2.INTER_LINEAR)
    cv2.imwrite(str(ROOT / f'assets/masks/{id_}.png'), fg)
    print(id_, 'Maske', int((fg > 127).sum()), 'px')
