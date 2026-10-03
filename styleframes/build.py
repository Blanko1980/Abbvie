#!/usr/bin/env python3
"""Styleframes (Variante B): detaillierte, programmatisch komponierte SVG-Illustrationen.
Erzeugt 01-der-blick.svg und 02-der-morgen.svg (1920 × 1080). Keine externen Assets.
Aufruf: python3 styleframes/build.py
"""
import math
import random
from pathlib import Path

OUT = Path(__file__).parent
W, H = 1920, 1080

GOLD, CHAR, WHITE, TEAL = '#FFD100', '#25282A', '#FFFFFF', '#366B8F'


def f(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.')


def scallop_path(points, amp, closed=True, seed=1, jitter=0.35):
    """Weiche, lockige Kontur: Bögen zwischen aufeinanderfolgenden Punkten, nach außen gewölbt."""
    rnd = random.Random(seed)
    d = f'M{f(points[0][0])},{f(points[0][1])}'
    n = len(points)
    rng = range(n if closed else n - 1)
    for i in rng:
        x0, y0 = points[i]
        x1, y1 = points[(i + 1) % n]
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        dx, dy = x1 - x0, y1 - y0
        L = math.hypot(dx, dy) or 1
        nx, ny = dy / L, -dx / L  # Normale (bei Uhrzeigersinn nach außen)
        a = amp * (1 + (rnd.random() - 0.5) * 2 * jitter)
        d += f' Q{f(mx + nx * a)},{f(my + ny * a)} {f(x1)},{f(y1)}'
    return d + (' Z' if closed else '')


def taper(x1, y1, r1, x2, y2, r2):
    """Konvexe Hülle zweier Kreise als SVG-Pfad (Gliedmaßen, Finger)."""
    dx, dy = x2 - x1, y2 - y1
    d = math.hypot(dx, dy)
    a = math.atan2(dy, dx)
    phi = math.acos(max(-1, min(1, (r1 - r2) / d)))
    p1 = (x1 + r1 * math.cos(a + phi), y1 + r1 * math.sin(a + phi))
    p2 = (x1 + r1 * math.cos(a - phi), y1 + r1 * math.sin(a - phi))
    q1 = (x2 + r2 * math.cos(a - phi), y2 + r2 * math.sin(a - phi))
    q2 = (x2 + r2 * math.cos(a + phi), y2 + r2 * math.sin(a + phi))
    return (f'M{f(p1[0])},{f(p1[1])} A{f(r1)},{f(r1)} 0 1 1 {f(p2[0])},{f(p2[1])} '
            f'L{f(q1[0])},{f(q1[1])} A{f(r2)},{f(r2)} 0 0 1 {f(q2[0])},{f(q2[1])} Z')


def ellipse_pts(cx, cy, rx, ry, n, a0=0, a1=360):
    pts = []
    for i in range(n + 1 if a1 - a0 < 360 else n):
        a = math.radians(a0 + (a1 - a0) * i / (n if a1 - a0 < 360 else n))
        pts.append((cx + rx * math.cos(a), cy + ry * math.sin(a)))
    return pts


COMMON_DEFS = '''
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="table" tableValues="0 0.9"/></feComponentTransfer>
  </filter>
  <filter id="blur4" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
  <filter id="blur8" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="blur14" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="blur24" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="24"/></filter>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>
  <radialGradient id="vignette" cx="50%" cy="48%" r="75%">
    <stop offset="60%" stop-color="#000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000" stop-opacity="0.32"/>
  </radialGradient>
'''


def finish():
    return (f'<rect width="{W}" height="{H}" fill="url(#vignette)"/>'
            f'<rect width="{W}" height="{H}" filter="url(#grain)" opacity="0.10" style="mix-blend-mode:overlay"/>'
            f'<rect width="{W}" height="{H}" filter="url(#grain)" opacity="0.035"/>')


# --------------------------------------------------------------------------- Köpfe
def head_patient(gid):
    """Patientin, 3/4-Ansicht nach rechts blickend. Lokale Koordinaten, Kopfmitte (0,0)."""
    skin, skin_d, skin_l, line = '#8C5B3F', '#6F432D', '#A9744F', '#4A2A1B'
    hair, hair_l = '#1C1613', '#3A2C25'
    face = ('M30,-100 C70,-96 92,-70 94,-40 C96,-22 92,-12 96,0 C100,16 100,34 94,52 '
            'C88,72 80,96 66,114 C56,126 40,130 28,126 C0,118 -30,98 -46,72 '
            'C-56,56 -60,40 -62,20 C-70,-20 -64,-70 -30,-98 C-10,-112 10,-104 30,-100 Z')
    # Lockenvolumen hinten + Dutt
    back = ellipse_pts(-22, -46, 128, 118, 26)
    bun = ellipse_pts(-36, -150, 66, 56, 16)
    front_hair_pts = [(-80, -20), (-86, -80), (-50, -128), (10, -132), (62, -112), (96, -70),
                      (88, -60), (70, -74), (50, -82), (28, -82), (6, -76), (-14, -66), (-34, -50), (-50, -28), (-60, -6)]
    curls = ''
    rnd = random.Random(4)
    for _ in range(26):
        a = rnd.uniform(-3.0, 0.3)
        r = rnd.uniform(60, 120)
        cx, cy = -22 + math.cos(a) * r, -46 + math.sin(a) * r * 0.95
        curls += f'<path d="M{f(cx - 9)},{f(cy)} q9,-10 18,0" stroke="{hair_l}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>'
    return f'''
    <defs>
      <clipPath id="{gid}-face"><path d="{face}"/></clipPath>
      <linearGradient id="{gid}-skin" x1="0" y1="0" x2="1" y2="0.25">
        <stop offset="0" stop-color="{skin_l}"/><stop offset="0.45" stop-color="{skin}"/><stop offset="1" stop-color="{skin_d}"/>
      </linearGradient>
    </defs>
    <path d="{scallop_path(back, 16, seed=3)}" fill="{hair}"/>
    <path d="{scallop_path(bun, 12, seed=5)}" fill="{hair}"/>
    {curls}
    <path d="{face}" fill="url(#{gid}-skin)"/>
    <g clip-path="url(#{gid}-face)">
      <ellipse cx="96" cy="40" rx="40" ry="90" fill="{skin_d}" opacity="0.35" filter="url(#blur8)"/>
      <ellipse cx="30" cy="130" rx="80" ry="22" fill="{skin_d}" opacity="0.5" filter="url(#blur8)"/>
      <ellipse cx="-6" cy="30" rx="26" ry="18" fill="#B06A55" opacity="0.18" filter="url(#blur8)"/>
      <ellipse cx="-30" cy="-20" rx="30" ry="70" fill="#C98E66" opacity="0.25" filter="url(#blur8)"/>
    </g>
    <!-- Brauen -->
    <path d="M-10,-31 C4,-40 22,-40 34,-34" stroke="{hair}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M58,-36 C68,-40 78,-38 84,-33" stroke="{hair}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <!-- Augen (Blick nach rechts) -->
    <path d="M-2,-8 C6,-17 26,-18 36,-8 C26,-2 8,-1 -2,-8 Z" fill="#F3EBE2"/>
    <circle cx="24" cy="-9" r="7.5" fill="#3B2418"/><circle cx="25" cy="-9" r="3.6" fill="#140B07"/>
    <circle cx="27" cy="-12" r="1.8" fill="#FFF"/>
    <path d="M-4,-8 C6,-19 26,-20 38,-9" stroke="{line}" stroke-width="3.6" fill="none" stroke-linecap="round"/>
    <path d="M36,-10 l6,-4" stroke="{line}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M62,-9 C66,-15 76,-16 82,-9 C76,-5 68,-5 62,-9 Z" fill="#F3EBE2"/>
    <circle cx="76" cy="-10" r="5" fill="#3B2418"/><circle cx="77" cy="-10" r="2.4" fill="#140B07"/>
    <path d="M61,-9 C66,-17 77,-17 83,-10" stroke="{line}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- Nase -->
    <path d="M56,-4 C62,14 76,30 86,40 C88,47 80,51 72,49 C66,51 60,47 58,43" fill="{skin_d}" opacity="0.45"/>
    <path d="M70,46 C74,44 78,44 80,47" stroke="{line}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity="0.8"/>
    <path d="M84,38 C88,42 88,46 84,49" stroke="{skin_l}" stroke-width="3" fill="none" opacity="0.7"/>
    <!-- Mund, leichtes Lächeln -->
    <path d="M42,70 C52,66 60,68 64,69 C70,67 78,66 86,68 C80,74 70,76 62,75 C54,76 48,74 42,70 Z" fill="#6E3A2A"/>
    <path d="M46,73 C56,84 74,84 84,72 C76,76 56,78 46,73 Z" fill="#83493A"/>
    <path d="M40,69 C44,70 46,72 47,74" stroke="{line}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.7"/>
    <!-- vorderer Haaransatz -->
    <path d="{scallop_path(front_hair_pts, 9, seed=8)}" fill="{hair}"/>
    <path d="M-40,-96 q10,-10 20,0 M0,-112 q10,-9 20,0 M36,-100 q9,-9 18,0" stroke="{hair_l}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- Ohr + Ohrstecker -->
    <path d="M-50,-6 C-66,-8 -70,16 -66,30 C-62,42 -52,44 -46,36 Z" fill="{skin}"/>
    <path d="M-54,4 C-62,8 -62,22 -56,30" stroke="{skin_d}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="-58" cy="40" r="4" fill="#D9DCDF"/>
    '''


def head_doctor(gid):
    """Arzt, 3/4-Ansicht (lokal nach rechts; im Bild gespiegelt). Kopfmitte (0,0)."""
    skin, skin_d, skin_l, line = '#E7BA96', '#C8936E', '#F4D3B6', '#8E5E43'
    hair, grey = '#4F4239', '#A79F97'
    face = ('M30,-104 C72,-100 96,-74 98,-44 C100,-26 96,-16 100,-4 C104,14 102,36 98,56 '
            'C94,80 86,102 70,118 C58,130 40,134 24,130 C-6,124 -38,104 -54,80 '
            'C-64,62 -68,44 -70,22 C-76,-20 -70,-74 -34,-100 C-12,-114 10,-108 30,-104 Z')
    hair_cap = ('M-76,-14 C-90,-90 -40,-146 24,-140 C70,-136 98,-112 104,-78 C94,-84 82,-86 70,-84 '
                'C56,-96 32,-98 10,-92 C-12,-86 -30,-68 -38,-44 C-42,-26 -48,-8 -56,4 C-66,0 -74,-6 -76,-14 Z')
    return f'''
    <defs>
      <clipPath id="{gid}-face"><path d="{face}"/></clipPath>
      <linearGradient id="{gid}-skin" x1="1" y1="0" x2="0" y2="0.2">
        <stop offset="0" stop-color="{skin_l}"/><stop offset="0.5" stop-color="{skin}"/><stop offset="1" stop-color="{skin_d}"/>
      </linearGradient>
    </defs>
    <path d="{face}" fill="url(#{gid}-skin)"/>
    <g clip-path="url(#{gid}-face)">
      <path d="M-36,60 C-16,104 22,128 70,120 C88,100 96,80 98,64 C80,92 40,108 4,98 C-14,90 -28,76 -36,60 Z" fill="#8A7466" opacity="0.13"/>
      <ellipse cx="20" cy="136" rx="90" ry="22" fill="{skin_d}" opacity="0.55" filter="url(#blur8)"/>
      <ellipse cx="-50" cy="10" rx="34" ry="90" fill="{skin_d}" opacity="0.45" filter="url(#blur8)"/>
      <ellipse cx="74" cy="-20" rx="22" ry="60" fill="#FFE6D2" opacity="0.4" filter="url(#blur8)"/>
    </g>
    <!-- Brauen -->
    <path d="M-12,-34 C4,-42 24,-42 38,-36" stroke="#4A3C33" stroke-width="7.5" fill="none" stroke-linecap="round"/>
    <path d="M60,-38 C70,-42 80,-41 88,-36" stroke="#4A3C33" stroke-width="6" fill="none" stroke-linecap="round"/>
    <!-- Augen (Blick nach rechts) -->
    <path d="M0,-8 C8,-15 26,-16 36,-8 C26,-3 8,-2 0,-8 Z" fill="#F6F1EC"/>
    <circle cx="25" cy="-9" r="6.5" fill="#5A4636"/><circle cx="26" cy="-9" r="3.2" fill="#1A120D"/>
    <circle cx="28" cy="-11.5" r="1.6" fill="#FFF"/>
    <path d="M-2,-8 C8,-17 26,-18 38,-9" stroke="#3E2C22" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="M4,2 C14,6 26,6 34,1" stroke="{line}" stroke-width="1.8" fill="none" opacity="0.5"/>
    <path d="M64,-9 C68,-14 78,-14 84,-9 C78,-5 70,-5 64,-9 Z" fill="#F6F1EC"/>
    <circle cx="78" cy="-10" r="4.4" fill="#5A4636"/><circle cx="78.6" cy="-10" r="2.2" fill="#1A120D"/>
    <path d="M63,-9 C68,-16 78,-16 85,-10" stroke="#3E2C22" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <!-- Nase -->
    <path d="M56,-6 C62,16 80,34 90,44 C92,52 82,56 74,54 C68,56 62,52 60,48" fill="{skin_d}" opacity="0.5"/>
    <path d="M72,52 C76,49 81,49 83,52" stroke="{line}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <!-- Nasolabialfalte + Mund -->
    <path d="M58,58 C50,70 48,80 50,90" stroke="{line}" stroke-width="2.2" fill="none" opacity="0.45" stroke-linecap="round"/>
    <path d="M52,82 C62,80 76,79 88,80" stroke="#8A4E3C" stroke-width="3.6" fill="none" stroke-linecap="round"/>
    <path d="M60,90 C68,94 78,93 84,89" stroke="{line}" stroke-width="2.2" fill="none" opacity="0.5" stroke-linecap="round"/>
    <!-- Haare: kurz, grau meliert -->
    <path d="{hair_cap}" fill="{hair}"/>
    <path d="M-20,-134 C10,-142 50,-136 80,-116" stroke="#6E5F55" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.8"/>
    <path d="M-50,-110 c16,-14 40,-20 62,-18 M8,-122 c22,-4 44,2 62,16 M-62,-80 c10,-14 22,-22 36,-26" stroke="#6B5D53" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.75"/>
    <path d="M-62,-50 c4,14 6,30 4,44 M-54,-56 c4,14 6,28 4,42 M-46,-60 c3,12 4,24 3,36" stroke="{grey}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.85"/>
    <path d="M-70,-30 c2,-30 12,-56 30,-74" stroke="{grey}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.55"/>
    <!-- Ohr -->
    <path d="M-54,-8 C-72,-10 -76,16 -72,32 C-68,46 -56,48 -50,40 Z" fill="{skin}"/>
    <path d="M-58,2 C-66,8 -66,22 -60,32" stroke="{skin_d}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- Brille -->
    <g fill="none" stroke="#2C2622" stroke-width="3.6">
      <rect x="-10" y="-26" width="54" height="36" rx="13"/>
      <path d="M60,-24 C66,-27 84,-27 90,-23 C92,-14 90,-2 86,6 C78,9 66,9 62,5 C59,-4 59,-16 60,-24 Z"/>
      <path d="M44,-12 C50,-15 55,-15 60,-12"/>
      <path d="M-10,-16 L-56,-6"/>
    </g>
    <path d="M-4,-20 l10,0" stroke="#FFFFFF" stroke-width="2" opacity="0.5" stroke-linecap="round"/>
    '''


def neck_patient():
    return ('<path d="M-38,60 C-36,110 -40,170 -50,230 L50,230 C42,170 38,120 40,92 Z" fill="#6F432D"/>'
            '<path d="M-38,60 C-36,110 -40,170 -50,230 L-16,230 C-12,170 -8,120 -6,96 Z" fill="#8C5B3F" opacity="0.6"/>')


def neck_doctor():
    return ('<path d="M-38,60 C-36,112 -40,170 -50,232 L50,232 C42,170 38,120 40,92 Z" fill="#C8936E"/>'
            '<path d="M-38,140 C-10,160 20,160 40,140 L44,232 L-50,232 Z" fill="#B07E5C" opacity="0.5"/>')


# --------------------------------------------------------------------- Styleframe 1
def frame_cabin():
    P = (640, 462)
    D = (1302, 448)
    rnd = random.Random(11)
    # Außenwelt durch die Heckscheibe (unscharf)
    trees = ''
    for i in range(9):
        x = 300 + i * 160 + rnd.uniform(-40, 40)
        r = rnd.uniform(70, 120)
        col = rnd.choice(['#93A188', '#8A9A80', '#A2AE97'])
        trees += f'<ellipse cx="{f(x)}" cy="{f(330 + rnd.uniform(-20, 30))}" rx="{f(r)}" ry="{f(r * 0.85)}" fill="{col}"/>'
    outside = f'''
      <rect x="280" y="120" width="1360" height="420" fill="url(#sky)"/>
      <g filter="url(#blur14)">
        <rect x="900" y="210" width="380" height="260" fill="#E4DDD2"/>
        <rect x="940" y="250" width="90" height="120" fill="#C9CFD1"/>
        <rect x="1080" y="250" width="90" height="120" fill="#C9CFD1"/>
        {trees}
        <rect x="280" y="420" width="1360" height="120" fill="#B9B6AF"/>
      </g>'''
    # Arzt: erhobene rechte Hand (Bild links), Handrücken oben, Finger zum Display
    hand = '''
      <g transform="translate(1062,766) rotate(170) scale(1.4)">
        <path d="M-6,-30 C24,-38 58,-38 82,-30 L88,24 C62,34 28,36 -6,30 Z" fill="#C8936E"/>
        <path d="M-6,-34 C24,-42 58,-42 82,-34 L86,18 C60,28 28,30 -6,24 Z" fill="url(#handSkin)"/>
        <path d="M80,-30 C110,-38 138,-40 160,-38 C166,-37 167,-28 161,-26 C138,-24 110,-20 84,-14 Z" fill="#E7BA96"/>
        <path d="M84,-14 C108,-12 130,-6 142,0 C148,4 144,12 138,10 C124,6 104,4 86,4 Z" fill="#DDAE8A"/>
        <path d="M86,4 C106,8 122,14 132,20 C136,24 132,30 126,28 C114,24 100,22 86,20 Z" fill="#D3A27F"/>
        <path d="M84,18 C98,22 110,28 116,32 C118,37 114,40 110,38 C100,34 92,32 82,30 Z" fill="#C9977A"/>
        <path d="M2,-30 C22,-48 50,-60 70,-62 C78,-62 80,-54 74,-50 C56,-44 36,-34 22,-22 Z" fill="#E1B08C"/>
        <path d="M150,-37 l9,1" stroke="#F6DCC8" stroke-width="5" stroke-linecap="round"/>
        <path d="M30,-24 C44,-26 60,-26 76,-22" stroke="#F4D3B6" stroke-width="3" fill="none" opacity="0.7"/>
      </g>'''
    head_p = head_patient('pat')
    head_d = head_doctor('doc')
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>{COMMON_DEFS}
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9EEF0"/><stop offset="1" stop-color="#F6F2EA"/></linearGradient>
    <linearGradient id="interior" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B1F22"/><stop offset="1" stop-color="#2A2F33"/></linearGradient>
    <linearGradient id="seat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3D444A"/><stop offset="0.55" stop-color="#31373C"/><stop offset="1" stop-color="#262B2F"/></linearGradient>
    <linearGradient id="headrest" x1="0" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="#464D54"/><stop offset="1" stop-color="#2A2F34"/></linearGradient>
    <linearGradient id="jacket" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#868B6B"/><stop offset="0.4" stop-color="#6F7357"/><stop offset="1" stop-color="#555942"/></linearGradient>
    <linearGradient id="coat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.45" stop-color="#F1F1EE"/><stop offset="1" stop-color="#CFD2CE"/></linearGradient>
    <linearGradient id="sleeve" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FAFAF8"/><stop offset="1" stop-color="#D3D6D2"/></linearGradient>
    <linearGradient id="handSkin" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#F7DCC4"/><stop offset="1" stop-color="#E2B18E"/></linearGradient>
    <linearGradient id="dash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A2E31"/><stop offset="0.3" stop-color="#1D2023"/><stop offset="1" stop-color="#131517"/></linearGradient>
    <linearGradient id="belt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#474C51"/><stop offset="1" stop-color="#33373B"/></linearGradient>
    <radialGradient id="screenGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F2F6F7" stop-opacity="0.28"/><stop offset="1" stop-color="#F2F6F7" stop-opacity="0"/></radialGradient>
    <linearGradient id="sun" x1="0" y1="0" x2="1" y2="0.6"><stop offset="0" stop-color="#FFF4DE" stop-opacity="0.22"/><stop offset="1" stop-color="#FFF4DE" stop-opacity="0"/></linearGradient>
    <clipPath id="rearwin"><rect x="300" y="130" width="1320" height="390" rx="70"/></clipPath>
    <clipPath id="jacketClip"><path id="jacketPath" d="M452,1080 C456,900 462,760 480,700 C492,660 530,640 588,622 L600,640 L680,640 L692,622 C750,640 788,660 800,700 C818,760 822,900 826,1080 Z"/></clipPath>
    <clipPath id="coatClip"><path d="M1098,1080 C1100,900 1108,770 1124,712 C1138,668 1184,650 1248,630 L1262,650 L1356,650 L1370,630 C1436,650 1482,668 1496,712 C1512,770 1520,900 1524,1080 Z"/></clipPath>
  </defs>

  <!-- Innenraum -->
  <rect width="{W}" height="{H}" fill="url(#interior)"/>
  <g clip-path="url(#rearwin)">{outside}</g>
  <rect x="300" y="130" width="1320" height="390" rx="70" fill="none" stroke="#14171A" stroke-width="14"/>
  <path d="M260,520 L1660,520 L1700,760 L220,760 Z" fill="#2B3035"/>
  <path d="M260,520 L1660,520 L1662,534 L258,534 Z" fill="#3A4046"/>
  <!-- Lichtbahn aus dem Seitenfenster -->
  <path d="M0,120 L760,260 L620,1080 L0,1080 Z" fill="url(#sun)"/>

  <!-- Vordersitze -->
  <path d="M420,1080 L428,560 C430,500 470,470 530,466 L750,466 C810,470 850,500 852,560 L860,1080 Z" fill="url(#seat)"/>
  <path d="M1082,1080 L1090,560 C1092,500 1132,470 1192,466 L1412,466 C1472,470 1512,500 1514,560 L1522,1080 Z" fill="url(#seat)"/>
  <rect x="534" y="294" width="212" height="172" rx="56" fill="url(#headrest)"/>
  <rect x="1196" y="282" width="212" height="172" rx="56" fill="url(#headrest)"/>
  <path d="M600,438 v36 M680,438 v36 M1262,426 v44 M1342,426 v44" stroke="#22262A" stroke-width="12"/>
  <path d="M552,308 C600,300 680,300 728,308" stroke="#5A626A" stroke-width="3" fill="none" opacity="0.6"/>
  <path d="M1214,296 C1262,288 1342,288 1390,296" stroke="#5A626A" stroke-width="3" fill="none" opacity="0.6"/>

  <!-- Patientin: Oberkörper -->
  <g transform="translate({P[0]},{P[1]}) rotate(-3)">{neck_patient()}</g>
  <path d="M452,1080 C456,900 462,760 480,700 C492,660 530,640 588,622 L600,640 L680,640 L692,622 C750,640 788,660 800,700 C818,760 822,900 826,1080 Z" fill="url(#jacket)"/>
  <g clip-path="url(#jacketClip)">
    <path d="M600,628 L680,628 L640,770 Z" fill="#E6DCCB"/>
    <path d="M600,628 L640,770 L628,780 L574,700 L588,622 Z" fill="#5E6249"/>
    <path d="M680,628 L640,770 L652,780 L708,700 L692,622 Z" fill="#4E523D"/>
    <path d="M598,632 C612,700 626,740 640,770" stroke="#A39985" stroke-width="2" fill="none" opacity="0.5"/>
    <path d="M452,700 C470,690 488,690 500,700 L486,1080 L440,1080 Z" fill="#9DA27F" opacity="0.5"/>
    <path d="M540,800 C560,860 566,920 560,1000 M740,820 C730,880 732,940 742,1020" stroke="#4D5140" stroke-width="3" fill="none" opacity="0.5"/>
    <path d="M492,660 L860,1080 L812,1080 L470,690 Z" fill="url(#belt)"/>
    <path d="M490,668 L846,1080" stroke="#5B6166" stroke-width="2" opacity="0.7"/>
  </g>
  <g transform="translate({P[0]},{P[1]}) rotate(-3)">{head_p}</g>

  <!-- Arzt: Oberkörper -->
  <g transform="translate({D[0]},{D[1]}) scale(-1.04,1.04) rotate(2)">{neck_doctor()}</g>
  <path d="M1098,1080 C1100,900 1108,770 1124,712 C1138,668 1184,650 1248,630 L1262,650 L1356,650 L1370,630 C1436,650 1482,668 1496,712 C1512,770 1520,900 1524,1080 Z" fill="url(#coat)"/>
  <g clip-path="url(#coatClip)">
    <path d="M1262,636 L1356,636 L1309,800 Z" fill="#D7DBDD"/>
    <path d="M1262,636 L1240,664 L1280,690 Z M1356,636 L1378,664 L1338,690 Z" fill="#EEF0F1"/>
    <path d="M1258,634 L1309,800 L1296,814 L1222,720 L1248,630 Z" fill="#E4E6E2"/>
    <path d="M1360,634 L1309,800 L1322,814 L1396,720 L1370,630 Z" fill="#D5D8D4"/>
    <path d="M1296,814 L1290,1080 M1322,814 L1328,1080" stroke="#BFC3BF" stroke-width="3" opacity="0.7"/>
    <rect x="1404" y="760" width="74" height="32" rx="5" fill="#FFFFFF" stroke="#C8CBC8" stroke-width="2"/>
    <rect x="1414" y="770" width="40" height="5" fill="#A3A6A8"/><rect x="1414" y="780" width="26" height="4" fill="#B5B8BA"/>
    <path d="M1470,664 L1150,1080 L1206,1080 L1500,700 Z" fill="url(#belt)"/>
    <path d="M1474,670 L1160,1080" stroke="#5B6166" stroke-width="2" opacity="0.7"/>
  </g>
  <g transform="translate({D[0]},{D[1]}) scale(-1.04,1.04) rotate(2)">{head_d}</g>

  <!-- Arm des Arztes (Bild links): Oberarm hängt, Unterarm kommt nach vorn, Hand hält über dem Display inne -->
  <path d="{taper(1184, 700, 34, 1176, 822, 33)}" fill="url(#sleeve)"/>
  <path d="{taper(1176, 822, 35, 1066, 768, 31)}" fill="#EEEFEC"/>
  <path d="M1150,740 C1144,770 1146,800 1156,826" stroke="#CDD0CC" stroke-width="3" fill="none" opacity="0.9"/>
  <path d="M1128,790 C1120,806 1122,824 1132,836" stroke="#CDD0CC" stroke-width="3" fill="none" opacity="0.9"/>
  <ellipse cx="1070" cy="768" rx="20" ry="31" fill="#DADDD9"/>
  <path d="M1152,708 C1146,750 1146,790 1156,824" stroke="#BFC3BF" stroke-width="4" fill="none" opacity="0.9"/>
  {hand}
  <!-- Armaturenbrett, Display-Rückseite, Lenkrad -->
  <path d="M0,888 C520,858 1400,858 1920,888 L1920,1080 L0,1080 Z" fill="url(#dash)"/>
  <path d="M0,888 C520,858 1400,858 1920,888" stroke="#4A5055" stroke-width="3" fill="none" opacity="0.7"/>
  <rect x="842" y="818" width="276" height="96" rx="16" fill="#111315"/>
  <rect x="852" y="824" width="256" height="6" rx="3" fill="#E9EFF1" opacity="0.35"/>
  <ellipse cx="980" cy="800" rx="180" ry="56" fill="url(#screenGlow)" style="mix-blend-mode:screen"/>
  <ellipse cx="1338" cy="992" rx="262" ry="158" fill="none" stroke="#141618" stroke-width="40"/>
  <ellipse cx="1338" cy="992" rx="262" ry="158" fill="none" stroke="#3A3F44" stroke-width="4" stroke-dasharray="300 2000" stroke-dashoffset="-520" opacity="0.8"/>
  <path d="M1596,960 C1608,930 1604,904 1588,892 C1560,880 1540,912 1552,940 Z" fill="#E1B08C"/>
  <path d="M1500,700 C1560,760 1600,840 1600,900 L1560,920 C1550,860 1520,790 1470,744 Z" fill="#E4E6E2"/>

  <!-- Rückspiegel -->
  <rect x="948" y="0" width="24" height="70" fill="#15181A"/>
  <rect x="826" y="62" width="268" height="72" rx="24" fill="#16191C"/>
  <rect x="842" y="74" width="236" height="48" rx="16" fill="#2C3237"/>
  <path d="M900,74 L940,74 L910,122 L870,122 Z" fill="#FFFFFF" opacity="0.10"/>
  <rect x="842" y="74" width="236" height="4" rx="2" fill="#FFFFFF" opacity="0.12"/>

  <!-- Windschutzscheibe: Säulen, Spiegelungen -->
  <path d="M0,0 L250,0 L66,1080 L0,1080 Z" fill="#111416"/>
  <path d="M1920,0 L1670,0 L1854,1080 L1920,1080 Z" fill="#111416"/>
  <rect width="{W}" height="54" fill="#111416"/>
  <path d="M250,0 L66,1080" stroke="#2C3236" stroke-width="3"/>
  <path d="M1670,0 L1854,1080" stroke="#2C3236" stroke-width="3"/>
  <path d="M700,54 L980,54 L560,1080 L280,1080 Z" fill="#FFFFFF" opacity="0.045"/>
  <path d="M1080,54 L1180,54 L840,1080 L740,1080 Z" fill="#FFFFFF" opacity="0.03"/>
  <g opacity="0.06" filter="url(#blur24)"><ellipse cx="520" cy="110" rx="260" ry="70" fill="#FFFFFF"/><ellipse cx="1440" cy="120" rx="300" ry="80" fill="#FFFFFF"/></g>
  {finish()}
</svg>'''
    return svg


# --------------------------------------------------------------------- Styleframe 2
def frame_morning():
    rnd = random.Random(3)
    speck = ''.join(
        f'<circle cx="{f(rnd.uniform(-118, 118))}" cy="{f(rnd.uniform(-130, 140))}" r="{f(rnd.uniform(1.2, 2.6))}" fill="#9C9184" opacity="{f(rnd.uniform(0.25, 0.55))}"/>'
        for _ in range(70))
    knit = ''.join(f'<path d="M{1508 + i * 26},612 C{1504 + i * 26},650 {1504 + i * 26},700 {1510 + i * 26},748" stroke="#A8977C" stroke-width="3" fill="none" opacity="0.55"/>' for i in range(16))
    leaves = ''
    for (x, y, r, a) in [(330, 420, 120, -30), (240, 330, 100, 20), (420, 300, 90, -60), (300, 230, 80, 10)]:
        leaves += f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r * 0.55}" transform="rotate({a} {x} {y})" fill="#7F8E72"/>'
    steam = ''.join(
        f'<path d="M{x},{y0} C{x - 30},{y0 - 60} {x + 34},{y0 - 120} {x},{y0 - 190} S{x - 26},{y0 - 280} {x + 8},{y0 - 330}" stroke="#FFFFFF" stroke-width="{w}" fill="none" stroke-linecap="round" opacity="{o}" filter="url(#blur4)"/>'
        for (x, y0, w, o) in [(1050, 330, 9, 0.35), (1100, 320, 6, 0.28), (1004, 340, 5, 0.22)])
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>{COMMON_DEFS}
    <linearGradient id="wall" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stop-color="#F7EBDA"/><stop offset="0.6" stop-color="#EFE4D6"/><stop offset="1" stop-color="#DCD0C1"/></linearGradient>
    <linearGradient id="win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6E6"/><stop offset="1" stop-color="#FCE6C8"/></linearGradient>
    <linearGradient id="counterTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6DBCB"/><stop offset="1" stop-color="#D2C4B1"/></linearGradient>
    <linearGradient id="counterFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B9A68D"/><stop offset="1" stop-color="#9C8A73"/></linearGradient>
    <linearGradient id="mug" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFDF8"/><stop offset="0.35" stop-color="#F6F1E9"/><stop offset="0.8" stop-color="#DCD3C7"/><stop offset="1" stop-color="#C9BFB2"/></linearGradient>
    <linearGradient id="mugIn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D9D0C3"/><stop offset="1" stop-color="#F3EDE4"/></linearGradient>
    <radialGradient id="coffee" cx="40%" cy="40%" r="70%"><stop offset="0" stop-color="#8A5A3A"/><stop offset="0.5" stop-color="#5C3721"/><stop offset="1" stop-color="#3B2214"/></radialGradient>
    <linearGradient id="sweater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D8CAB2"/><stop offset="1" stop-color="#BBA98D"/></linearGradient>
    <linearGradient id="skinHand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2CDAE"/><stop offset="1" stop-color="#D9A47F"/></linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF3D9" stop-opacity="0.55"/><stop offset="1" stop-color="#FFF3D9" stop-opacity="0"/></linearGradient>
    <linearGradient id="shadowGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6B5A47" stop-opacity="0.45"/><stop offset="1" stop-color="#6B5A47" stop-opacity="0"/></linearGradient>
    <clipPath id="mugBody"><path d="M842,420 C842,560 850,650 878,700 C900,740 1180,740 1202,700 C1230,650 1238,560 1238,420 Z"/></clipPath>
  </defs>

  <!-- Hintergrund (unscharf): Fenster, Pflanze, Regal -->
  <rect width="{W}" height="{H}" fill="url(#wall)"/>
  <g filter="url(#blur14)">
    <rect x="90" y="40" width="640" height="560" fill="url(#win)"/>
    <rect x="90" y="40" width="640" height="560" fill="none" stroke="#FFFFFF" stroke-width="30"/>
    <rect x="398" y="40" width="22" height="560" fill="#FFFFFF"/>
    <rect x="90" y="300" width="640" height="18" fill="#FFFFFF"/>
    {leaves}
    <rect x="250" y="470" width="150" height="150" rx="20" fill="#C9B9A4"/>
    <rect x="1340" y="200" width="520" height="18" fill="#C6B49C"/>
    <rect x="1380" y="110" width="80" height="90" rx="12" fill="#D9CDBD"/>
    <rect x="1490" y="90" width="60" height="110" rx="10" fill="#B8A894"/>
    <rect x="1580" y="130" width="110" height="70" rx="14" fill="#E5DACB"/>
  </g>
  <path d="M0,0 L900,0 L1500,1080 L0,1080 Z" fill="url(#beam)"/>

  <!-- Arbeitsplatte -->
  <path d="M0,640 L1920,640 L1920,800 L0,800 Z" fill="url(#counterTop)"/>
  <path d="M0,800 L1920,800 L1920,1080 L0,1080 Z" fill="url(#counterFront)"/>
  <path d="M0,800 L1920,800" stroke="#F4EBDD" stroke-width="4" opacity="0.8"/>
  <!-- Schlagschatten der Tasse (Licht von links) -->
  <path d="M1190,700 C1300,690 1600,700 1880,730 C1880,760 1500,770 1200,744 Z" fill="url(#shadowGrad)" filter="url(#blur14)"/>
  <ellipse cx="1040" cy="710" rx="200" ry="22" fill="#5E4E3D" opacity="0.35" filter="url(#blur8)"/>

  <!-- Autoschlüssel auf der Platte (Vorgriff) -->
  <g transform="translate(560,738) rotate(-12)">
    <ellipse cx="40" cy="22" rx="120" ry="14" fill="#5E4E3D" opacity="0.25" filter="url(#blur4)"/>
    <rect x="-30" y="-20" width="110" height="44" rx="20" fill="#2A2D30"/>
    <rect x="-22" y="-14" width="94" height="10" rx="5" fill="#4A4F54"/>
    <circle cx="10" cy="10" r="7" fill="#43484D"/><circle cx="44" cy="10" r="7" fill="#43484D"/>
    <circle cx="-48" cy="2" r="20" fill="none" stroke="#BFC3C7" stroke-width="5"/>
    <path d="M-66,2 L-150,6 L-150,16 L-134,16 L-130,24 L-120,16 L-66,14 Z" fill="#C9CDD1"/>
  </g>

  <!-- Tasse -->
  <g transform="translate(1040,560) scale(0.86) translate(-1040,-560)">
  <path d="M1236,500 C1330,490 1352,600 1290,640 C1262,656 1232,650 1214,640" stroke="#E2D9CC" stroke-width="40" fill="none" stroke-linecap="round"/>
  <path d="M1236,500 C1330,490 1352,600 1290,640 C1262,656 1232,650 1214,640" stroke="#CDBFAE" stroke-width="40" fill="none" stroke-linecap="round" stroke-dasharray="1 0" opacity="0.4" transform="translate(6,6)"/>
  <path d="M842,420 C842,560 850,650 878,700 C900,740 1180,740 1202,700 C1230,650 1238,560 1238,420 Z" fill="url(#mug)"/>
  <g clip-path="url(#mugBody)">
    <g transform="translate(1040,560)">{speck}</g>
    <rect x="862" y="440" width="22" height="250" rx="11" fill="#FFFFFF" opacity="0.65"/>
    <ellipse cx="1040" cy="720" rx="200" ry="30" fill="#B9AC9C" opacity="0.4" filter="url(#blur8)"/>
  </g>
  <ellipse cx="1040" cy="420" rx="198" ry="52" fill="#FBF8F2"/>
  <ellipse cx="1040" cy="424" rx="180" ry="42" fill="url(#mugIn)"/>
  <ellipse cx="1040" cy="436" rx="170" ry="34" fill="url(#coffee)"/>
  <path d="M920,432 C960,420 1010,416 1060,418" stroke="#E9C9A6" stroke-width="7" fill="none" opacity="0.45" stroke-linecap="round" filter="url(#soft)"/>
  <path d="M930,446 C990,456 1080,456 1150,444" stroke="#2E190E" stroke-width="6" fill="none" opacity="0.35" filter="url(#soft)"/>
  {steam}
  </g>

  <!-- Hand kurz vor dem Griff + Strickärmel -->
  <ellipse cx="1430" cy="745" rx="260" ry="22" fill="#5E4E3D" opacity="0.22" filter="url(#blur14)"/>
  <g transform="translate(150,0) translate(1480,600) scale(1.35) translate(-1480,-600)">
    <path d="{taper(1352, 640, 13, 1306, 656, 11)}" fill="#C99572"/>
    <path d="{taper(1306, 656, 11, 1280, 670, 9.5)}" fill="#C99572"/>
    <path d="{taper(1350, 622, 15, 1292, 638, 13)}" fill="#D3A07D"/>
    <path d="{taper(1292, 638, 13, 1258, 657, 11)}" fill="#D3A07D"/>
    <path d="{taper(1352, 602, 16, 1286, 613, 14)}" fill="#DDAC88"/>
    <path d="{taper(1286, 613, 14, 1242, 632, 12)}" fill="#DDAC88"/>
    <path d="M1480,566 C1440,560 1390,560 1352,568 C1338,590 1338,622 1348,644 C1390,650 1440,648 1480,640 Z" fill="url(#skinHand)"/>
    <path d="{taper(1356, 580, 16, 1290, 585, 14)}" fill="#E8BC99"/>
    <path d="{taper(1290, 585, 14, 1238, 600, 12.5)}" fill="#E8BC99"/>
    <ellipse cx="1242" cy="597" rx="8" ry="5.5" fill="#F6DCC8" transform="rotate(-14 1242 597)"/>
    <path d="{taper(1446, 574, 18, 1384, 552, 15)}" fill="#EDC6A6"/>
    <path d="{taper(1384, 552, 15, 1334, 546, 12.5)}" fill="#EDC6A6"/>
    <ellipse cx="1338" cy="544" rx="7" ry="5" fill="#F8E2D0"/>
    <path d="M1300,578 q4,6 0,12 M1296,604 q4,6 0,12 M1300,628 q4,6 0,11" stroke="#B9835F" stroke-width="2.2" fill="none" opacity="0.6" stroke-linecap="round"/>
    <path d="M1360,572 C1390,566 1430,566 1466,570" stroke="#F8DEC6" stroke-width="5" fill="none" opacity="0.6" stroke-linecap="round"/>
    <path d="M1360,646 C1400,652 1440,650 1476,644" stroke="#B9835F" stroke-width="3" fill="none" opacity="0.35"/>
    <!-- Ärmel -->
    <path d="M1470,546 C1530,526 1720,496 1960,476 L1960,780 C1760,756 1580,712 1474,664 C1458,634 1458,580 1470,546 Z" fill="url(#sweater)"/>
    <path d="M1600,560 C1700,590 1800,610 1960,620 M1640,690 C1740,712 1840,726 1960,734" stroke="#A8977C" stroke-width="3" fill="none" opacity="0.45"/>
    <path d="M1470,546 C1494,538 1532,530 1566,526 C1580,580 1582,664 1572,708 C1536,694 1500,680 1474,664 C1458,634 1458,580 1470,546 Z" fill="#D9CCB5"/>
    <g opacity="0.6" stroke="#B3A288" stroke-width="3" fill="none">
      <path d="M1482,544 C1478,590 1478,630 1484,668"/><path d="M1494,540 C1490,590 1490,636 1496,674"/>
      <path d="M1506,537 C1502,590 1502,640 1508,680"/><path d="M1518,535 C1514,590 1514,644 1520,685"/>
      <path d="M1530,533 C1526,590 1526,648 1532,690"/><path d="M1542,531 C1538,590 1538,652 1544,695"/>
      <path d="M1554,529 C1550,590 1550,656 1556,700"/>
    </g>
    <path d="M1566,526 C1580,580 1582,664 1572,708" stroke="#A8977C" stroke-width="4" fill="none" opacity="0.5"/>
  </g>
  {finish()}
</svg>'''
    return svg


if __name__ == '__main__':
    (OUT / '01-der-blick.svg').write_text(frame_cabin(), encoding='utf-8')
    (OUT / '02-der-morgen.svg').write_text(frame_morning(), encoding='utf-8')
    print('ok')
