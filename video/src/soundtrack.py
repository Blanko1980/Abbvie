#!/usr/bin/env python3
"""10 Jahre Alltag - soundtrack, synthesised entirely from code.

Music: a 2016 tropical-house idea (marimba plucks, finger snaps, shaker) that
"upgrades" with every scene (hats, 808, arps, supersaws, vocal chops, future-bass
wobble), cuts dead at the freeze, returns muffled and sad for the 2016 therapy
scene, builds with the rising bar and swells into a big F-major finale.
Sound design: every cue in timeline.js gets its own synthesised effect.

Usage: python3 soundtrack.py out.wav
"""
import json
import os
import sys
from functools import lru_cache

import numpy as np
from scipy import signal
from scipy.ndimage import maximum_filter1d
from scipy.io import wavfile

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.loads(open(os.path.join(HERE, 'timeline.js'), encoding='utf-8').read().rsplit('window.TL =', 1)[1].strip().rstrip(';'))
DUR = float(TL['length'])
N = int(SR * DUR)
# cues are written in story time; the picture stretches calm moments (TL.warp),
# so every cue is mapped to real time here. The music is written in real time.
_KS, _KR = np.array([k[0] for k in TL['warp']], float), np.array([k[1] for k in TL['warp']], float)


def to_real(x):
    return float(np.interp(x, _KS, _KR))


def to_story(x):
    return np.interp(x, _KR, _KS)


C_STORY = TL['cues']
C = {k: ([[to_real(a), to_real(b), g] for a, b, g in v] if k == 'scratch' else
         v if k == 'scratchFreq' else
         [to_real(x) for x in v] if isinstance(v, list) else to_real(v)) for k, v in C_STORY.items()}
BEAT = 60.0 / TL['bpm']
S16 = BEAT / 4

# ----------------------------------------------------------------- helpers
def T(n):
    return np.arange(n) / SR


def secs(d):
    return max(1, int(round(d * SR)))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


_rng = np.random.default_rng(1234)


def noise(n, seed=None):
    r = np.random.default_rng(seed) if seed is not None else _rng
    return r.standard_normal(n)


_sos = {}


def filt(x, kind, fc, order=2):
    key = (kind, tuple(np.atleast_1d(fc)), order)
    if key not in _sos:
        _sos[key] = signal.butter(order, fc, btype=kind, fs=SR, output='sos')
    return signal.sosfilt(_sos[key], x, axis=-1)


def lp(x, fc, o=2):
    return filt(x, 'lowpass', min(fc, SR * 0.45), o)


def hp(x, fc, o=2):
    return filt(x, 'highpass', fc, o)


def bp(x, lo, hi, o=2):
    return filt(x, 'bandpass', [lo, min(hi, SR * 0.45)], o)


def fade(x, fi=0.002, fo=0.01):
    x = np.array(x, dtype=np.float64)
    n = x.shape[-1]
    a, b = min(n, secs(fi)), min(n, secs(fo))
    x[..., :a] *= np.linspace(0, 1, a)
    x[..., n - b:] *= np.linspace(1, 0, b)
    return x


def bell_env(n, peak=0.5, p1=2.0, p2=1.5):
    p = np.linspace(0, 1, n)
    return np.where(p < peak, np.sin(np.pi / 2 * p / peak) ** p1, np.clip(np.cos(np.pi / 2 * np.clip(p - peak, 0, None) / (1 - peak)), 0, None) ** p2)


def stft_mask(x, maskfn, nper=2048):
    f, tt, Z = signal.stft(x, fs=SR, nperseg=nper, noverlap=nper * 3 // 4)
    Z = Z * maskfn(f[:, None], tt[None, :])
    _, y = signal.istft(Z, fs=SR, nperseg=nper, noverlap=nper * 3 // 4)
    y = y[:len(x)]
    if len(y) < len(x):
        y = np.pad(y, (0, len(x) - len(y)))
    return y


def pan2(sig, pan):
    th = (pan + 1) * np.pi / 4
    return np.vstack([sig * np.cos(th), sig * np.sin(th)]) * np.sqrt(2)


def saw(freq, n, ph0=0.0):
    f = np.full(n, float(freq)) if np.ndim(freq) == 0 else np.asarray(freq, dtype=np.float64)
    ph = (ph0 + np.cumsum(f) / SR) % 1.0
    dt = f / SR
    y = 2 * ph - 1
    m = ph < dt
    tt = ph[m] / dt[m]
    y[m] -= tt + tt - tt * tt - 1
    m = ph > 1 - dt
    tt = (ph[m] - 1) / dt[m]
    y[m] -= tt * tt + tt + tt + 1
    return y


def sine_f(freq, n, ph0=0.0):
    f = np.full(n, float(freq)) if np.ndim(freq) == 0 else np.asarray(freq, dtype=np.float64)
    return np.sin(2 * np.pi * np.cumsum(f) / SR + ph0)


# ----------------------------------------------------------------- buses
class Bus:
    def __init__(self):
        self.x = np.zeros((2, N))

    def add(self, sig, t0, gain=1.0, pan=0.0, sends=()):
        sig = np.asarray(sig, dtype=np.float64)
        st = pan2(sig, pan) if sig.ndim == 1 else sig
        i0 = int(round(t0 * SR))
        a, b = max(0, i0), min(N, i0 + st.shape[1])
        if b <= a:
            return
        seg = st[:, a - i0:b - i0] * gain
        self.x[:, a:b] += seg
        for bus, amt in sends:
            bus.x[:, a:b] += seg * amt


DRUMS, PUMP, MUSIC, MUFF, SFX = Bus(), Bus(), Bus(), Bus(), Bus()
HALL, ROOM = Bus(), Bus()

# ================================================================= instruments
@lru_cache(maxsize=None)
def marimba(m, dur=0.9):
    f = mtof(m)
    n = secs(dur)
    t = T(n)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 4.2)
    y += 0.32 * np.sin(2 * np.pi * 3.93 * f * t) * np.exp(-t * 13)
    if 9.2 * f < 18000:
        y += 0.1 * np.sin(2 * np.pi * 9.2 * f * t) * np.exp(-t * 30)
    y += 0.25 * lp(noise(n, 3), 5000) * np.exp(-t * 350)
    return fade(y, 0.0015, 0.05)


@lru_cache(maxsize=None)
def pluck(m, dur=0.45, bright=1.0, K=24):
    f = mtof(m)
    n = secs(dur)
    t = T(n)
    y = np.zeros(n)
    r = np.random.default_rng(int(m * 10))
    for k in range(1, K + 1):
        if k * f > 16000:
            break
        y += (1.0 / k) * np.sin(2 * np.pi * k * f * t * (1 + 0.0004 * k) + r.random() * 6.28) * np.exp(-t * (4 + 2.4 * k / bright))
    return fade(y * 0.8, 0.002, 0.04)


@lru_cache(maxsize=None)
def supersaw(notes, dur, voices=7, detune=22.0, cutoff=3000.0, atk=0.04, rel=0.25, seed=1):
    n = secs(dur + rel)
    out = np.zeros((2, n))
    r = np.random.default_rng(seed)
    for m in notes:
        f = mtof(m)
        for v in range(voices):
            d = (v - (voices - 1) / 2) / max(1, (voices - 1) / 2)
            fv = f * 2 ** (d * detune / 1200)
            y = saw(fv, n, r.random())
            out += pan2(y, d * 0.8) * (1.0 / voices)
    out = lp(out, cutoff, 2)
    env = np.ones(n)
    a = secs(atk)
    env[:a] = np.linspace(0, 1, a)
    k = secs(dur)
    env[k:] = np.linspace(1, 0, n - k) ** 2
    return out * env / max(1, len(notes)) ** 0.5


@lru_cache(maxsize=None)
def kick(dur=0.42, f0=160.0, f1=46.0, decay=6.5, click=0.35):
    n = secs(dur)
    t = T(n)
    f = f1 + (f0 - f1) * np.exp(-t * 32)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * decay)
    y += click * hp(noise(n, 4), 3000) * np.exp(-t * 500)
    return fade(np.tanh(1.7 * y) * 0.9, 0.0005, 0.03)


@lru_cache(maxsize=None)
def clap(seed=5):
    n = secs(0.4)
    t = T(n)
    x = bp(noise(n, seed), 900, 3800)
    env = np.zeros(n)
    for d in (0.0, 0.011, 0.022):
        env += np.where(t >= d, np.exp(-(t - d) * 220), 0)
    env += np.where(t >= 0.03, 0.55 * np.exp(-(t - 0.03) * 15), 0)
    return fade(x * env * 1.4, 0.0005, 0.03)


@lru_cache(maxsize=None)
def snap(seed=6):
    n = secs(0.2)
    t = T(n)
    y = bp(noise(n, seed), 1800, 6000) * np.exp(-t * 85) + 0.4 * np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 120)
    return fade(y, 0.0005, 0.02)


@lru_cache(maxsize=None)
def hat(open_=False, seed=7):
    n = secs(0.5 if open_ else 0.09)
    t = T(n)
    metal = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (3140, 4560, 5310, 6820, 7930)) / 5
    y = hp(noise(n, seed) * 0.8 + metal * 0.35, 6500) * np.exp(-t * (8 if open_ else 55))
    return fade(y, 0.0004, 0.02)


@lru_cache(maxsize=None)
def shaker(seed=8):
    n = secs(0.12)
    t = T(n)
    env = np.minimum(1, t / 0.012) * np.exp(-t * 32)
    return fade(bp(noise(n, seed), 4500, 11000) * env, 0.001, 0.02)


@lru_cache(maxsize=None)
def snare(seed=9, tone=1.0):
    n = secs(0.3)
    t = T(n)
    y = bp(noise(n, seed), 1200, 9000) * np.exp(-t * 22) * 0.9 + tone * 0.5 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    return fade(y, 0.0005, 0.02)


@lru_cache(maxsize=None)
def crash(dur=2.4, seed=10):
    n = secs(dur)
    t = T(n)
    st = np.vstack([noise(n, seed), noise(n, seed + 1)])
    metal = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate((3420, 4710, 5930, 7150, 8380, 9620))) / 6
    y = hp(st * 0.7 + metal * 0.25, 3500) * np.exp(-t * 1.9)
    y += bp(st, 600, 3000) * np.exp(-t * 6) * 0.25
    return fade(y, 0.0008, 0.3)


def rev_crash(dur=1.0, seed=11):
    y = crash(2.0, seed)[:, :secs(dur)][:, ::-1]
    return fade(y, 0.05, 0.004)


@lru_cache(maxsize=None)
def sub(m, dur, drive=1.5):
    f = mtof(m)
    n = secs(dur)
    t = T(n)
    y = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return fade(np.tanh(drive * y) / np.tanh(drive), 0.004, 0.03)


@lru_cache(maxsize=None)
def bass808(m, dur, glide=0.0):
    f = mtof(m)
    n = secs(dur)
    t = T(n)
    fr = f * 2 ** (glide / 12 * np.exp(-t * 18))
    y = np.sin(2 * np.pi * np.cumsum(fr) / SR) * (0.35 + 0.65 * np.exp(-t * 1.6))
    y += 0.4 * hp(noise(n, 12), 2500) * np.exp(-t * 300)
    return fade(np.tanh(2.2 * y) * 0.8, 0.002, 0.04)


@lru_cache(maxsize=None)
def pluck_bass(m, dur=0.22):
    f = mtof(m)
    n = secs(dur)
    t = T(n)
    y = np.zeros(n)
    for k in range(1, 9):
        y += (1 / k) * np.sin(2 * np.pi * k * f * t) * np.exp(-t * (6 + 5 * k))
    return fade(np.tanh(1.4 * y), 0.002, 0.03)


@lru_cache(maxsize=None)
def piano(m, dur=2.5, vel=0.8):
    f = mtof(m)
    n = secs(dur)
    t = T(n)
    y = np.zeros(n)
    B = 0.00035
    for k in range(1, 13):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 15000:
            break
        a = vel ** (1 + 0.15 * k) / k ** 1.25
        y += a * (np.sin(2 * np.pi * fk * t) + 0.6 * np.sin(2 * np.pi * fk * 1.0006 * t + 1.0)) * np.exp(-t * (0.9 + 0.55 * k))
    y += 0.08 * vel * lp(noise(n, 13), 2500) * np.exp(-t * 90)
    return fade(y * 0.55, 0.002, 0.3)


@lru_cache(maxsize=None)
def bell(m, dur=1.6, bright=1.0):
    f = mtof(m)
    n = secs(dur)
    t = T(n)
    y = np.zeros(n)
    for r, a, d in ((1, 1, 2.8), (2.0, 0.45, 4.5), (2.76, 0.35 * bright, 6.5), (4.07, 0.2 * bright, 9), (5.4, 0.14 * bright, 12)):
        if f * r < 18000:
            y += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d)
    return fade(y * 0.5, 0.001, 0.2)


@lru_cache(maxsize=None)
def vox(m, dur=0.22, bend=-2.0, vowel='a'):
    """formant 'vocal chop' - modern pop/future-bass ear candy"""
    f = mtof(m)
    n = secs(dur)
    t = T(n)
    fr = f * 2 ** ((bend * np.exp(-t * 30)) / 12) * (1 + 0.006 * np.sin(2 * np.pi * 5.5 * t))
    src = saw(fr, n)
    forms = {'a': ((800, 1.0), (1150, 0.6), (2900, 0.25)), 'o': ((450, 1.0), (800, 0.5), (2830, 0.15)), 'e': ((400, 1.0), (2000, 0.5), (2600, 0.3))}[vowel]
    y = sum(g * bp(src, fo * 0.88, fo * 1.12, 2) for fo, g in forms)
    env = np.minimum(1, t / 0.008) * np.exp(-t * 6)
    return fade(y * env * 2.2, 0.002, 0.03)


# ================================================================= SFX
def whoosh(dur, f0, f1, width=0.8, peak=0.6, seed=0, pans=(-0.6, 0.6)):
    n = secs(dur)
    x = noise(n, seed)

    def m(F, TT):
        p = np.clip(TT / dur, 0, 1)
        fc = f0 * (f1 / f0) ** p
        lf = np.log2(np.maximum(F, 20) / fc)
        return np.exp(-(lf / width) ** 2)
    y = stft_mask(x, m) * bell_env(n, peak)
    th = (np.linspace(pans[0], pans[1], n) + 1) * np.pi / 4
    return fade(np.vstack([y * np.cos(th), y * np.sin(th)]) * np.sqrt(2) * 1.6, 0.003, 0.02)


def riser(dur, f0=200, f1=9000, seed=0):
    n = secs(dur)
    t = T(n)
    p = t / dur
    x = noise(n, seed)

    def m(F, TT):
        pp = np.clip(TT / dur, 0, 1)
        fc = f0 * (f1 / f0) ** (pp ** 1.6)
        return np.exp(-(np.log2(np.maximum(F, 20) / fc) / 1.1) ** 2)
    y = stft_mask(x, m)
    tone = sum(np.sin(2 * np.pi * np.cumsum(fb * 2 ** (3 * p ** 2)) / SR) for fb in (220, 330.5, 440.7)) / 3
    y = (y + 0.25 * tone) * p ** 2.2
    return fade(pan2(y, 0) * 1.5, 0.01, 0.005)


def impact(big=1.0, seed=0):
    n = secs(2.8)
    t = T(n)
    f = 30 + 55 * np.exp(-t * 7)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (1.6 / big))
    crack = lp(noise(n, seed), 4000) * np.exp(-t * 14) * 0.6
    y = np.tanh(1.8 * (boom + crack)) * 0.9
    return fade(y, 0.0005, 0.5)


def click(freq=2500, decay=180, noise_amt=0.6, body=0.0, body_f=180, seed=0, dur=0.12):
    n = secs(dur)
    t = T(n)
    y = noise_amt * hp(noise(n, seed), 1500) * np.exp(-t * 900) + np.sin(2 * np.pi * freq * t) * np.exp(-t * decay)
    if body:
        y += body * np.sin(2 * np.pi * body_f * t) * np.exp(-t * 60)
    return fade(y, 0.0003, 0.01)


def clink(seed, base=3200, dur=0.5):
    r = np.random.default_rng(seed)
    n = secs(dur)
    t = T(n)
    f = base * (0.85 + 0.3 * r.random())
    y = sum(a * np.sin(2 * np.pi * f * k * t + r.random() * 6) * np.exp(-t * d) for k, a, d in ((1, 1, 18), (1.58, 0.7, 26), (2.35, 0.5, 34), (3.1, 0.35, 45)))
    y += 0.5 * hp(noise(n, seed), 3000) * np.exp(-t * 700)
    return fade(y * 0.6, 0.0003, 0.05)


def sparkle(seed=0, n_pings=12, spread=0.45, lo=84, notes=(0, 2, 4, 7, 9), up=True):
    out = np.zeros((2, secs(spread + 1.0)))
    r = np.random.default_rng(seed)
    for i in range(n_pings):
        d = (i / n_pings) * spread if up else r.random() * spread
        m = lo + notes[i % len(notes)] + 12 * (i // len(notes))
        y = bell(m + 0.0, 0.8, 1.3) * (0.6 + 0.4 * r.random())
        k = secs(d)
        out[:, k:k + len(y)] += pan2(y, r.uniform(-0.8, 0.8))[:, :out.shape[1] - k]
    return out * 0.35


def glass_shatter(seed=3):
    n = secs(2.0)
    t = T(n)
    r = np.random.default_rng(seed)
    out = np.zeros((2, n))
    burst_ = hp(noise(n, seed), 1800) * np.exp(-t * 22) * 0.9
    out += pan2(burst_, 0)
    for i in range(110):
        d = r.exponential(0.22)
        if d > 1.4:
            continue
        k = secs(d)
        m = secs(0.25)
        tt = T(m)
        f = r.uniform(2400, 9500)
        g = (np.sin(2 * np.pi * f * tt) + 0.6 * np.sin(2 * np.pi * f * 1.53 * tt)) * np.exp(-tt * r.uniform(35, 90)) * r.uniform(0.15, 0.5) * np.exp(-d * 1.5)
        out[:, k:k + m] += pan2(g, r.uniform(-0.9, 0.9))[:, :n - k]
    thud = np.sin(2 * np.pi * np.cumsum(60 + 80 * np.exp(-t * 20)) / SR) * np.exp(-t * 8) * 0.8
    out += pan2(thud, 0)
    return fade(out, 0.0003, 0.2)


def rustle(dur, seed=0, density=60):
    n = secs(dur)
    t = T(n)
    r = np.random.default_rng(seed)
    x = bp(noise(n, seed), 1200, 7000)
    am = np.zeros(n)
    for _ in range(int(density * dur)):
        c = r.uniform(0, dur)
        w = r.uniform(0.01, 0.05)
        am += r.uniform(0.3, 1.0) * np.exp(-((t - c) / w) ** 2)
    return x * np.minimum(am, 1.4)


# ================================================================= MUSIC
CHORDS_A = {  # name: (bass root, pad voicing)
    'Dm': (38, (57, 62, 65, 69)), 'Bb': (34, (58, 62, 65, 70)),
    'F': (41, (57, 60, 65, 69)), 'C': (36, (55, 60, 64, 67)),
    'Gm': (43, (55, 58, 62, 67)),
}
PROG_A = ['Dm', 'Bb', 'F', 'C']
DROP = None  # set in music_intro_and_drop
MEL_A = {
    'Dm': {0: 69, 3: 74, 6: 77, 8: 76, 10: 74, 12: 69, 14: 72},
    'Bb': {0: 70, 3: 74, 6: 77, 8: 74, 10: 72, 12: 70, 14: 69},
    'F': {0: 69, 3: 72, 6: 77, 8: 79, 10: 77, 12: 72, 14: 69},
    'C': {0: 67, 3: 72, 6: 76, 8: 79, 10: 76, 12: 74, 14: 72},
}
TROP = [0, 3, 6, 8, 11, 14]  # tropical 3-3-2 feel

kicks = []


def bar_chord(b):
    return PROG_A[(b - 1) % 4]


def kick_at(t, gain=1.0, **kw):
    DRUMS.add(kick(**kw), t, gain)
    kicks.append(t)


def music_intro_and_drop():
    hs = [(HALL, 0.25)]
    # notification "plings" are part of the music: pitched in D minor
    for t, (a, b) in zip(C['notifs'], [(81, 86), (77, 81), (86, 89), (84, 89)]):
        SFX.add(bell(a, 1.2, 1.4), t, 0.33, -0.2, [(ROOM, 0.3), (HALL, 0.3)])
        SFX.add(bell(b, 1.4, 1.4), t + 0.085, 0.3, 0.2, [(ROOM, 0.3), (HALL, 0.3)])
    drop = C['shatter']
    stop = drop - 0.25
    # 2016 pluck beat from bar 1 until just before the drop
    for b in range(1, int(drop // 2)):
        ch = bar_chord(b)
        tones = CHORDS_A[ch][1]
        for i, s in enumerate(TROP):
            t = b * 2 + s * S16
            if t >= stop:
                continue
            m = tones[(i + b) % 4] + (12 if i % 3 == 2 else 0)
            MUSIC.add(marimba(m), t, 0.34, (-0.3, 0.3)[i % 2], hs)
        for k in range(16):
            t = b * 2 + k * S16
            if stop > t >= 2.5:
                DRUMS.add(shaker(), t, 0.10 * (1.0 if k % 2 else 0.6), 0.35)
        for k in (1, 3):
            t = b * 2 + k * BEAT
            if t < stop:
                DRUMS.add(snap(), t, 0.33, -0.1, [(HALL, 0.2)])
    for k in range(int(4.0 / BEAT), int((drop - 0.5) / BEAT)):
        kick_at(k * BEAT, 0.5, decay=9, click=0.15)
    t = 4.0
    while t < stop:
        PUMP.add(pluck_bass(CHORDS_A[bar_chord(int(t // 2))][0] + 12), t, 0.28)
        t += BEAT
    # build under "Ist aber zehn Jahre her.": snare roll 8ths -> 16ths -> 32nds + riser
    rs = drop - 2.0
    t, k = rs, 0
    while t < stop:
        DRUMS.add(snare(), t, 0.06 + 0.27 * (t - rs) / 2.0, 0, [(HALL, 0.2)])
        t += BEAT / 2 if t < rs + 1.0 else (S16 if t < rs + 1.5 else S16 / 2)
    SFX.add(riser(2.0, seed=21), drop - 2.25, 0.22)


def music_upgrades():
    hs = [(HALL, 0.22)]
    end = C['freeze']
    for b in range(int(C['shatter'] // 2), int(end // 2)):
        t0 = b * 2
        ch = bar_chord(b)
        root, voicing = CHORDS_A[ch]
        # drums
        for k in range(4):
            kick_at(t0 + k * BEAT, 0.95)
        for k in (1, 3):
            DRUMS.add(clap(), t0 + k * BEAT, 0.45, 0, [(HALL, 0.25)])
            if t0 < C['morphs'][2]:
                DRUMS.add(snap(), t0 + k * BEAT + 0.004, 0.25, 0.15)
        for k in range(16):
            t = t0 + k * S16
            DRUMS.add(shaker(), t, 0.09 * (1.0 if k % 2 else 0.55), 0.4)
            if t >= C['morphs'][0]:
                acc = 1.0 if k % 4 == 2 else 0.45
                DRUMS.add(hat(), t + (0.012 if k % 2 else 0), 0.16 * acc, -0.35)
            if t >= C['morphs'][2] and k % 4 == 2:
                DRUMS.add(hat(True), t, 0.07, 0.3)
        # marimba lead = the 2016 identity, played throughout
        for s, m in MEL_A[ch].items():
            t = t0 + s * S16
            MUSIC.add(marimba(m), t, 0.36, -0.15, hs)
            if t >= C['morphs'][2]:
                PUMP.add(pluck(m + 12, 0.35, 1.6), t, 0.12, 0.25, hs)
            if t >= C['morphs'][3] and s in (0, 6, 10):
                MUSIC.add(vox(m, 0.24, -2.0, 'aoe'[s % 3]), t, 0.11, (-0.3, 0.3)[s % 2], [(HALL, 0.35)])
        # pad (gets bigger with every upgrade)
        lvl = 0 if t0 < C['morphs'][1] else (1 if t0 < C['morphs'][3] else 2)
        cutoff, voices, g = [(1400, 3, 0.10), (2600, 5, 0.12), (4200, 7, 0.14)][lvl]
        pad = supersaw(tuple(voicing), 2.0, voices, 20.0 + 6 * lvl, float(cutoff), 0.02, 0.15, seed=b % 4)
        PUMP.add(pad, t0, g, 0, [(HALL, 0.3)])
        # bass: 2016 pluck bass -> 808 from the roaming upgrade on
        if t0 < C['morphs'][1]:
            for k in range(8):
                PUMP.add(pluck_bass(root + 12 if k % 2 else root), t0 + k * BEAT / 2 + BEAT / 4 * (k % 2), 0.3)
        else:
            for s, d in ((0, 0.7), (6, 0.45), (10, 0.9)):
                PUMP.add(bass808(root, d, 5.0 if s == 0 else 0.0), t0 + s * S16, 0.36)
        # arp
        if t0 >= C['morphs'][1]:
            arp = [voicing[i % 4] + 12 * (1 + (i // 4) % 2) for i in (0, 1, 2, 3, 2, 1, 4, 5, 6, 7, 6, 5, 2, 3, 1, 2)]
            for k, m in enumerate(arp):
                PUMP.add(pluck(m, 0.25, 2.2), t0 + k * S16, 0.075, (-0.6, 0.6)[k % 2], [(HALL, 0.3)])
        # offbeat supersaw stabs
        if t0 >= C['morphs'][2]:
            for k in range(4):
                PUMP.add(supersaw(tuple(v + 12 for v in voicing), 0.12, 5, 28.0, 5000.0, 0.003, 0.08, seed=7), t0 + k * BEAT + BEAT / 2, 0.07)
    # future-bass wobble after the last everyday upgrade
    tm = C['morphs'][4]
    for b0, ch in ((tm, 'F'), (tm + 1.0, 'C'), (tm + 2.0, 'Dm')):
        if b0 >= end:
            break
        v = CHORDS_A[ch][1]
        pad = supersaw(tuple(x + 12 for x in v), 1.0, 7, 30.0, 6000.0, 0.005, 0.05, seed=3)
        tt = T(pad.shape[1])
        lfo = 0.35 + 0.65 * (0.5 + 0.5 * np.cos(2 * np.pi * tt / (BEAT / 3)))
        PUMP.add(pad * lfo, b0, 0.12, 0, [(HALL, 0.25)])
    # crashes on the drop and every upgrade
    for t in [C['shatter']] + C['morphs']:
        DRUMS.add(crash(), t, 0.16 if t != C['shatter'] else 0.24, 0, [(HALL, 0.2)])
    return end


def music_therapy():
    """muffled, sad piano after the freeze; the filter opens and the build starts with the bar"""
    a0, hit = C['adIn'], C['barRise2'][1]          # 48 / 58 s real time
    seq = [(a0 + 0.5, 'Dm'), (a0 + 1.0, 'Dm'), (a0 + 3.5, 'Bb'), (hit - 4.0, 'Gm'), (hit - 2.0, 'C')]
    arps = {'Dm': (62, 69, 65, 69), 'Bb': (58, 65, 62, 65), 'Gm': (55, 62, 58, 62), 'C': (55, 64, 60, 67)}
    for i, (t0, ch) in enumerate(seq):
        dur = (seq[i + 1][0] if i + 1 < len(seq) else hit) - t0
        root, voicing = CHORDS_A[ch]
        MUFF.add(piano(root + 12, 3.0, 0.6), t0, 0.5, -0.1)
        step = BEAT if t0 < hit - 2.0 else BEAT / 2
        k = 0
        while t0 + k * step < t0 + dur - 0.01:
            m = arps[ch][k % 4] + (12 if (t0 >= hit - 2.0 and k >= 4) else 0)
            MUFF.add(piano(m, 2.0, 0.55), t0 + k * step, 0.36, (-0.25, 0.25)[k % 2])
            k += 1
        pad = supersaw(tuple(voicing), dur, 5, 14.0, 1800.0, 0.6, 0.6, seed=11)
        MUFF.add(pad, t0, 0.13)
    MUFF.add(sub(38, hit - a0 + 0.4, 1.0), a0 - 0.4, 0.2)
    # heartbeat-like soft kicks under the 2017 part, then a proper build
    k0 = hit - 4.0
    for k in range(int(4.0 / BEAT)):
        t = k0 + k * BEAT
        kick_at(t, 0.25 + 0.5 * (t - k0) / 4, decay=9, click=0.1)
    roll = []
    t = hit - 2.0
    while t < hit - 0.02:
        roll.append(t)
        t += S16 * 2 if t < hit - 1.0 else (S16 if t < hit - 0.5 else S16 / 2)
    for t in roll:
        DRUMS.add(snare(seed=31, tone=0.6), t, 0.05 + 0.3 * ((t - hit + 2) / 2) ** 1.5, 0, [(HALL, 0.25)])
    a, b = C['riser']
    SFX.add(riser(b - a, 150, 10000, seed=33), a, 0.42)
    DRUMS.add(rev_crash(1.0), hit - 1.0, 0.3)


LEAD_D = [  # (chord, {8th-step: midi})
    ('F', {0: 72, 2: 77, 3: 79, 4: 81, 6: 79}),
    ('C', {0: 79, 2: 76, 3: 74, 4: 76, 6: 72}),
    ('Dm', {0: 74, 2: 77, 3: 79, 4: 81, 6: 84}),
    ('Bb', {0: 82, 2: 81, 3: 79, 4: 77, 6: 74}),
    ('F', {0: 72, 2: 77, 3: 79, 4: 81, 5: 84, 6: 81, 7: 79}),
    ('C', {0: 79, 2: 76, 3: 74, 4: 76, 5: 79, 6: 84}),
]


def music_finale():
    hs = [(HALL, 0.25)]
    t_end = C['endHit']
    start = C['barRise2'][1]
    build = t_end - 2.0
    for i, (ch, mel) in enumerate(LEAD_D):
        t0 = start + 2 * i
        if t0 >= build:
            break
        root, voicing = CHORDS_A[ch]
        for k in range(4):
            kick_at(t0 + k * BEAT, 1.0)
        for k in (1, 3):
            DRUMS.add(clap(), t0 + k * BEAT, 0.5, 0, [(HALL, 0.3)])
        for k in range(16):
            t = t0 + k * S16
            DRUMS.add(hat(), t + (0.01 if k % 2 else 0), 0.15 * (1.0 if k % 4 == 2 else 0.5), -0.35)
            DRUMS.add(shaker(), t, 0.08 * (1.0 if k % 2 else 0.5), 0.4)
            if k % 4 == 2:
                DRUMS.add(hat(True), t, 0.08, 0.3)
        big = supersaw(tuple(voicing) + (voicing[0] + 12,), 2.0, 7, 32.0, 5500.0, 0.01, 0.2, seed=20 + i)
        PUMP.add(big, t0, 0.2 if t0 < C['gridIn'] else 0.16, 0, [(HALL, 0.35)])
        for s, d in ((0, 0.7), (6, 0.45), (10, 0.9)):
            PUMP.add(bass808(root, d, 5.0 if s == 0 else 0.0), t0 + s * S16, 0.4)
        for s, m in mel.items():
            t = t0 + s * BEAT / 2
            PUMP.add(pluck(m + 12, 0.5, 2.5), t, 0.14, 0.15, [(HALL, 0.4)])
            MUSIC.add(supersaw((m,), 0.22, 5, 18.0, 6000.0, 0.005, 0.15, seed=40), t, 0.1, -0.1, [(HALL, 0.4)])
            MUSIC.add(marimba(m), t, 0.3, -0.25, hs)
            if s in (0, 4):
                MUSIC.add(vox(m + 12, 0.3, -3.0, 'ao'[s // 4]), t + BEAT / 4, 0.08, 0.3, [(HALL, 0.4)])
        arp = [voicing[j % 4] + 12 * (1 + (j // 4) % 2) for j in (0, 1, 2, 3, 2, 1, 4, 5, 6, 7, 6, 5, 2, 3, 1, 2)]
        for k, m in enumerate(arp):
            PUMP.add(pluck(m, 0.25, 2.2), t0 + k * S16, 0.06, (-0.6, 0.6)[k % 2], [(HALL, 0.3)])
    # last bar: C build into the final hit
    t0 = build
    PUMP.add(supersaw((55, 60, 64, 67, 72), 2.0, 7, 30.0, 6500.0, 0.5, 0.05, seed=50), t0, 0.18, 0, [(HALL, 0.35)])
    for k in range(3):
        kick_at(t0 + k * BEAT, 0.9)
    t, k = t0 + 1.0, 0
    while t < t_end - 0.02:
        DRUMS.add(snare(seed=51), t, 0.12 + 0.3 * (t - t0 - 1.0), 0, [(HALL, 0.2)])
        t += S16 if t < t_end - 0.5 else S16 / 2
    PUMP.add(bass808(36, 1.9, 7.0), t0, 0.4)
    a, b = C['revCymbal']
    DRUMS.add(rev_crash(b - a), a, 0.42)
    SFX.add(riser(b - a, 400, 12000, seed=52), a, 0.3)
    # final chord
    for m in (41, 53, 57, 60, 65, 69, 72, 77):
        MUSIC.add(piano(m, 4.5, 0.85), t_end, 0.32 if m > 50 else 0.5, (m - 60) / 30, [(HALL, 0.45)])
    MUSIC.add(supersaw((53, 57, 60, 65, 69, 72), 3.6, 7, 26.0, 5000.0, 0.005, 1.4, seed=60), t_end, 0.32, 0, [(HALL, 0.5)])
    MUSIC.add(sub(29, 4.0, 1.2) * np.exp(-T(secs(4.0)) * 0.6), t_end, 0.55)
    for i, m in enumerate((89, 93, 96, 101)):
        MUSIC.add(bell(m, 2.5, 1.2), t_end + 0.06 * i, 0.12, (-0.5, -0.2, 0.2, 0.5)[i], [(HALL, 0.6)])
    DRUMS.add(crash(3.5, 61), t_end, 0.35, 0, [(HALL, 0.3)])
    kick_at(t_end, 1.0)


# ================================================================= SOUND DESIGN
def sound_design():
    rm = [(ROOM, 0.35)]
    rmh = [(ROOM, 0.3), (HALL, 0.2)]
    SFX.add(whoosh(0.7, 200, 1400, seed=1, pans=(0.6, 0.2)), C['phoneIn'] - 0.05, 0.22, sends=rm)
    # odometer ticks
    for i, t in enumerate(C['ticks']):
        SFX.add(click(2100 + 90 * i, 160, 0.5, 0.5, 420, seed=i), t, 0.35, 0.1, rm)
        SFX.add(click(5200, 400, 0.8, 0, seed=i + 50, dur=0.05), t + 0.03, 0.12, 0.25)
    t = C['ticks'][-1]
    SFX.add(impact(0.6, seed=2), t, 0.35, sends=rmh)
    SFX.add(bell(86, 1.6, 1.5), t, 0.18, 0, [(HALL, 0.5)])
    for i, t in enumerate(C['cracks']):
        SFX.add(click(3800 + 900 * i, 120, 1.0, 0.3, 140, seed=70 + i, dur=0.25), t, 0.42 + 0.1 * i, (-0.3, 0.2, 0)[i], rmh)
        SFX.add(hp(rustle(0.18, 70 + i, 120), 3000) * 0.5, t, 0.3, 0)
    SFX.add(glass_shatter(), C['shatter'], 0.62, sends=rmh)
    SFX.add(impact(1.2, seed=3), C['shatter'], 0.62, sends=[(HALL, 0.25)])

    # headphones
    a, b = C['rustle']
    r = rustle(b - a, 80, 70) * np.linspace(0.4, 1.0, secs(b - a))
    SFX.add(r, a, 0.26, -0.1, rm)
    for i, t in enumerate(C['knotPulls']):
        SFX.add(whoosh(0.25, 1500, 4000, 0.6, 0.3, seed=90 + i, pans=(-0.2, 0.2)), t - 0.05, 0.3, sends=rm)
    t = C['pop']
    n = secs(0.25)
    tt = T(n)
    pop = np.sin(2 * np.pi * np.cumsum(300 + 900 * (1 - np.exp(-tt * 40))) / SR) * np.exp(-tt * 22)
    SFX.add(fade(pop, 0.001, 0.02), t, 0.4, sends=rmh)
    SFX.add(whoosh(0.6, 300, 1200, seed=95, pans=(0.4, 0)), C['caseIn'] - 0.15, 0.18, sends=rm)
    for i, t in enumerate(C['budClicks']):
        SFX.add(whoosh(0.3, 2000, 600, 0.6, 0.8, seed=100 + i, pans=((-0.5, -0.3), (0.5, 0.3))[i]), t - 0.28, 0.2)
        SFX.add(click(2600, 260, 0.7, 0.8, 140, seed=110 + i), t, 0.5, (-0.3, 0.3)[i], rm)
        SFX.add(click(3400, 300, 0.4, 0, seed=112 + i), t + 0.022, 0.25, (-0.3, 0.3)[i])
    SFX.add(click(900, 90, 0.5, 1.0, 110, seed=120, dur=0.2), C['lidClose'], 0.55, 0, rm)
    SFX.add(bell(96, 1.0, 0.6), C['led'], 0.1, 0.1, [(HALL, 0.5)])

    # roaming
    SFX.add(click(1500, 400, 0.3, 0.6, 200, seed=130), C['tap'], 0.2, 0.3, rm)
    SFX.add(click(3100, 220, 0.9, 0.5, 260, seed=131), C['toggle'], 0.45, 0.3, rm)
    for i, t in enumerate(C['coins']):
        p = ((i * 37) % 10) / 10 * 1.4 - 0.7
        SFX.add(clink(140 + i), t, 0.4, p, rm)
        SFX.add(clink(160 + i, 2800, 0.3), t + 0.07 + 0.02 * (i % 3), 0.16, p, rm)
        SFX.add(click(700, 70, 0.2, 0.7, 120, seed=170 + i), t, 0.18, p)
    SFX.add(whoosh(0.5, 500, 5000, seed=180), C['morphs'][1] - 0.45, 0.25)
    SFX.add(sparkle(181, 10, 0.45, 89, (0, 4, 7, 12, 16)), C['mapChime'], 0.9, sends=[(HALL, 0.5)])

    # cash
    for i, t in enumerate(C['stack']):
        SFX.add(clink(200 + i, 2600 + 120 * i, 0.4), t, 0.34, -0.25, rm)
        SFX.add(click(500, 60, 0.15, 0.5, 160, seed=220 + i), t, 0.15, -0.25)
    t = C['drawer']
    SFX.add(whoosh(0.28, 300, 900, 0.9, 0.7, seed=230, pans=(-0.2, -0.2)), t - 0.05, 0.35)
    SFX.add(click(400, 50, 0.4, 1.0, 90, seed=231, dur=0.2), t + 0.2, 0.4, -0.2, rm)
    SFX.add(bell(91, 1.5, 1.6), t + 0.02, 0.32, -0.1, [(HALL, 0.4)])
    SFX.add(bell(95, 1.5, 1.6), t + 0.08, 0.28, 0.1, [(HALL, 0.4)])
    for i, t in enumerate(C['shrink']):
        SFX.add(bell(96 - i, 0.4, 0.8), t, 0.08, -0.3)
    SFX.add(whoosh(0.5, 400, 2000, seed=240, pans=(0.6, 0.3)), C['terminalIn'] - 0.1, 0.18)
    SFX.add(whoosh(0.55, 600, 4500, seed=241, pans=(0.9, 0.3)), C['cardSwoosh'], 0.32)
    n = secs(0.14)
    tt = T(n)
    beep = (np.sin(2 * np.pi * 1850 * tt) + 0.2 * np.sin(2 * np.pi * 5550 * tt)) * np.minimum(1, tt / 0.004)
    SFX.add(fade(beep, 0.003, 0.02), C['nfc'], 0.2, 0.4, rm)
    SFX.add(click(1200, 200, 0.4, 0.3, 200, seed=242), C['nfc'], 0.25, 0.4)
    for i, f in enumerate((1318.5, 1760.0)):
        nn = secs(0.12)
        g = np.sin(2 * np.pi * f * T(nn)) * np.exp(-T(nn) * 8)
        SFX.add(fade(g, 0.003, 0.03), C['paid'] + 0.1 * i, 0.18, 0.4, rm)

    # AI
    for i, t in enumerate(C['stones']):
        SFX.add(click(1900 + 150 * i, 95, 1.2, 0.8, 230, seed=250 + i, dur=0.2), t, 0.5, -0.2 + 0.1 * i, rm)
        SFX.add(click(3300, 140, 0.0, 0, seed=255 + i), t, 0.12, -0.1)
    a, b = C['newspaper']
    SFX.add(whoosh(b - a + 0.1, 400, 2400, 0.9, 0.7, seed=260, pans=(0.7, 0.3)), a - 0.05, 0.4)
    SFX.add(rustle(0.7, 261, 90) * np.exp(-T(secs(0.7)) * 5), b - 0.02, 0.5, 0.3, rm)
    SFX.add(click(300, 40, 0.8, 0.8, 120, seed=262, dur=0.15), b, 0.35, 0.3)
    SFX.add(whoosh(0.4, 300, 3000, seed=263, pans=(0.3, 1.0)), C['morphs'][3], 0.25)
    for i, t in enumerate(C['keys']):
        SFX.add(click(1100 + 160 * (i % 5), 140, 0.5, 0.4, 330, seed=270 + i, dur=0.08), t, 0.24, (-0.1, 0.1)[i % 2])
    SFX.add(click(800, 90, 0.6, 0.8, 200, seed=290, dur=0.12), C['enter'], 0.36, 0, rm)
    SFX.add(sparkle(291, 9, 0.5, 91, (0, 2, 4, 7, 9)), C['enter'] + 0.03, 0.7, sends=[(HALL, 0.5)])
    a, b = C['stream']
    r = np.random.default_rng(292)
    for k in range(26):
        t = a + (b - a) * k / 26
        SFX.add(bell(100 + int(r.integers(0, 5)) * 2, 0.25, 0.4), t, 0.03, r.uniform(-0.5, 0.5))

    # prescription
    SFX.add(whoosh(0.45, 900, 4000, 0.8, 0.5, seed=300, pans=(0, 0)), C['paperIn'] - 0.3, 0.32, sends=rm)
    a, b = C['scribble']
    n = secs(b - a)
    tt = T(n)
    am = np.abs(np.sin(2 * np.pi * 6.5 * tt)) ** 1.5 * (0.6 + 0.4 * noise(n, 301).clip(-1, 1) ** 2)
    SFX.add(bp(noise(n, 302), 2500, 8000) * am, a, 0.16, 0.1, rm)
    t = C['stamp']
    SFX.add(whoosh(0.22, 500, 1500, 0.8, 0.8, seed=303, pans=(0, 0)), t - 0.22, 0.2)
    n = secs(0.6)
    tt = T(n)
    thump = np.sin(2 * np.pi * np.cumsum(55 + 70 * np.exp(-tt * 25)) / SR) * np.exp(-tt * 12) + 0.6 * lp(noise(n, 304), 1800) * np.exp(-tt * 45)
    SFX.add(fade(np.tanh(2 * thump), 0.0005, 0.05), t, 0.62, 0, rmh)
    SFX.add(whoosh(0.5, 3000, 300, 0.9, 0.3, seed=305), C['morphs'][4] - 0.05, 0.22)
    a, b = C['scan']
    n = secs(b - a)
    tt = T(n)
    sw = np.sin(2 * np.pi * np.cumsum(700 + 900 * tt / (b - a)) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 30 * tt)) * 0.3
    SFX.add(fade(sw, 0.02, 0.02), a, 0.1, 0)
    n = secs(0.13)
    beep = np.sign(np.sin(2 * np.pi * 1760 * T(n))) * 0.5
    SFX.add(fade(lp(beep, 6000), 0.003, 0.01), b, 0.16, 0, rm)
    SFX.add(sparkle(310, 7, 0.3, 89, (0, 4, 7, 12)), C['check'], 0.6, sends=[(HALL, 0.4)])

    # upgrade "shwing" on every morph
    for i, t in enumerate(C['morphs']):
        SFX.add(whoosh(0.55, 600, 9000, 0.9, 0.92, seed=320 + i, pans=(-0.3, 0.3)), t - 0.5, 0.26)
        SFX.add(sparkle(330 + i, 6, 0.18, 84 + (0, 2, 4, 5, 7)[i], (0, 4, 7, 12, 16, 19)), t, 0.75, sends=[(HALL, 0.6)])
        SFX.add(impact(0.5, seed=340 + i) * 0.5, t, 0.32)

    # whip pans
    for i, t in enumerate(C['pans']):
        SFX.add(whoosh(0.5, 400, 2600, 0.9, 0.55, seed=350 + i, pans=(0.8, -0.8)), t - 0.27, 0.32)

    # FREEZE: dead stop, a low "thoom", a frozen shimmer and room tone
    t = C['freeze']
    SFX.add(impact(1.6, seed=360), t, 0.5, sends=[(HALL, 0.2)])
    n = secs(3.0)
    tt = T(n)
    shimmer = sum(np.sin(2 * np.pi * f * tt + i) for i, f in enumerate((2637, 3136, 3951, 5274))) * np.exp(-tt * 1.4) * 0.07
    SFX.add(pan2(shimmer, 0), t, 1.0, sends=[(HALL, 0.4)])
    n = secs(C['adIn'] - t + 0.4)
    tt = T(n)
    room = lp(noise(n, 361), 700) * 0.03 + 0.004 * np.sin(2 * np.pi * 50 * tt)
    SFX.add(fade(np.vstack([room, lp(noise(n, 362), 700) * 0.03]), 0.05, 0.8), t, 1.0)

    # therapy 2016: scratching, in sync with the animated hand
    for a, b, g in C['scratch']:
        n = secs(b - a + 0.4)
        tt = T(n) + a - 0.2
        st = to_story(tt)                       # the hand moves in story time
        ph = 2 * np.pi * C['scratchFreq'] * (st - C_STORY['scratch'][0][0])
        env = np.clip((tt - (a - 0.2)) / 0.3, 0, 1) * np.clip((b + 0.2 - tt) / 0.3, 0, 1)
        vel = np.abs(np.cos(ph)) ** 1.6
        grit = bp(noise(n, 400), 1800, 6500) * (0.7 + 0.6 * (np.abs(noise(n, 401)) > 1.6))
        SFX.add(grit * vel * env * g, a - 0.2, 0.15, 0.15, rm)

    # the bar
    SFX.add(whoosh(0.5, 300, 1500, seed=410, pans=(0.5, 0.4)), C['barIn'], 0.22, sends=rm)
    for i, (a, b) in enumerate((C['barRise1'], C['barRise2'])):
        SFX.add(whoosh(b - a + 0.15, 400, 2500, 0.8, 0.85, seed=420 + i, pans=(0.4, 0.5)), a - 0.05, 0.3 + 0.1 * i)
        n = secs(1.2)
        tt = T(n)
        thunk = sum(a_ * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a_, d in ((182, 1.0, 9), (410, 0.6, 14), (690, 0.35, 18), (1050, 0.2, 25)))
        thunk += 0.5 * lp(noise(n, 430 + i), 3000) * np.exp(-tt * 70)
        SFX.add(fade(np.tanh(1.5 * thunk) * (0.8 + 0.4 * i), 0.0005, 0.1), b, 0.5, 0.45, rmh)
    t = C['barRise2'][1]
    SFX.add(impact(1.5, seed=440), t, 0.7, sends=[(HALL, 0.3)])
    # clothes flying off
    t = C['clothes']
    for i in range(5):
        n = secs(0.6)
        tt = T(n)
        flap = lp(noise(n, 450 + i), 2500) * (0.6 + 0.4 * np.sin(2 * np.pi * (18 + 4 * i) * tt)) * bell_env(n, 0.25)
        SFX.add(flap, t + 0.03 * i, 0.22, (-0.8, 0.8, -0.4, 0.4, 0)[i], rm)
    SFX.add(whoosh(0.7, 250, 3000, 0.9, 0.3, seed=460, pans=(0, 0)), t, 0.3, sends=rm)
    for i, t in enumerate(C['chips']):
        SFX.add(click(1400, 200, 0.2, 0.3, 300, seed=470 + i), t, 0.18, 0.45)
        SFX.add(bell((88, 91, 96)[i], 1.4, 1.2), t, 0.2, 0.45, [(HALL, 0.5)])

    # grid flips - rhythmic clicks on the beat
    for i, t in enumerate(C['flips']):
        last = i == len(C['flips']) - 1
        SFX.add(whoosh(0.18, 800, 4000, 0.7, 0.5, seed=480 + i, pans=(0.3, -0.3)), t, 0.22)
        SFX.add(click(2400 + 100 * i, 220, 0.8, 0.6, 260, seed=490 + i), t, 0.4, (i - 3) / 4, rm)
        SFX.add(bell(84 + (0, 2, 4, 5, 7, 9, 12)[i], 1.0, 1.0), t + 0.15, 0.13 if not last else 0.24, (i - 3) / 4, [(HALL, 0.5)])
        if last:
            SFX.add(sparkle(499, 10, 0.4, 89, (0, 4, 7, 12, 16)), t + 0.15, 0.7, sends=[(HALL, 0.6)])

    # final hit
    SFX.add(impact(2.0, seed=500), C['endHit'], 0.8, sends=[(HALL, 0.3)])


# ================================================================= mix & master
def make_ir(rt, length, seed, damp_hz, predelay=0.012):
    n = secs(length)
    t = T(n)
    r = np.random.default_rng(seed)
    ir = r.standard_normal((2, n)) * np.exp(-6.91 * t / rt)
    for ch in range(2):
        ir[ch] = stft_mask(ir[ch], lambda F, TT: np.exp(-TT * F / damp_hz), 1024)
    ir *= np.minimum(1, t / 0.008)
    pd = secs(predelay)
    ir = np.pad(ir, ((0, 0), (pd, 0)))[:, :n]
    for d, g in ((0.017, 0.5), (0.023, 0.4), (0.031, 0.35), (0.041, 0.3)):
        ir[0, secs(d)] += g * 0.2
        ir[1, secs(d * 1.13)] += g * 0.2
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def convolve(x, ir):
    return np.vstack([signal.fftconvolve(x[c], ir[c])[:N] for c in range(2)])


def pump_env():
    g = np.ones(N)
    t = T(N)
    for k in sorted(kicks):
        i0 = int(k * SR)
        seg = slice(i0, min(N, i0 + secs(0.45)))
        tt = t[seg] - k
        g[seg] = np.minimum(g[seg], 1 - 0.6 * np.exp(-tt / 0.11) * np.minimum(1, tt / 0.004 + 0.2))
    return g


def time_mask(spans, ramp=0.01):
    """1 inside spans, 0 outside, with short linear ramps"""
    t = T(N)
    m = np.zeros(N)
    for a, b in spans:
        m = np.maximum(m, np.clip((t - a) / ramp + 1, 0, 1) * np.clip((b - t) / ramp, 0, 1))
    return m


def lufs(x):
    sos1 = np.array([[1.53512485958697, -2.69169618940638, 1.19839281085285, 1.0, -1.69065929318241, 0.73248077421585]])
    sos2 = np.array([[1.0, -2.0, 1.0, 1.0, -1.99004745483398, 0.99007225036621]])
    y = signal.sosfilt(sos2, signal.sosfilt(sos1, x, axis=-1), axis=-1)
    blk, hop = secs(0.4), secs(0.1)
    ms = np.array([np.sum(np.mean(y[:, i:i + blk] ** 2, axis=1)) for i in range(0, y.shape[1] - blk, hop)])
    L = -0.691 + 10 * np.log10(ms + 1e-12)
    g = L > -70
    rel = -0.691 + 10 * np.log10(np.mean(ms[g])) - 10
    g &= L > rel
    return -0.691 + 10 * np.log10(np.mean(ms[g]))


def master(x, target=-14.5, ceiling=-1.0):
    t = T(N)
    # glue compression
    env = np.sqrt(signal.lfilter([1 - np.exp(-1 / (0.05 * SR))], [1, -np.exp(-1 / (0.05 * SR))], np.max(x ** 2, axis=0)))
    thr = 10 ** (-16 / 20)
    gr = np.minimum(1, (thr / np.maximum(env, 1e-9)) ** (1 - 1 / 1.6))
    x = x * gr * 1.25
    for _ in range(3):
        L = lufs(x)
        x = x * 10 ** ((target - L) / 20)
        # limiter: instant attack, 80 ms release, then soft clip
        pk = np.max(np.abs(x), axis=0)
        c = 10 ** (ceiling / 20)
        need = np.maximum(1, pk / (c * 0.92))
        rel = np.exp(-1 / (0.08 * SR))
        g = signal.lfilter([1 - rel], [1, -rel], need)
        g = np.maximum(g, need)
        # smooth attack (2 ms look-back max filter)
        g = maximum_filter1d(g, size=2 * secs(0.002) + 1)
        x = x / g
        x = np.tanh(x / c) * c
    return x, lufs(x)


def main(out):
    music_intro_and_drop()
    music_upgrades()
    music_therapy()
    music_finale()
    sound_design()

    hall = make_ir(2.4, 3.2, 7, 5000)
    room = make_ir(0.7, 1.0, 8, 7000, 0.006)
    pump = pump_env()
    music = PUMP.x * pump + MUSIC.x + DRUMS.x
    # the 2016 therapy part is heard through a wall; the wall opens with the rising bar
    t = T(N)
    m0, hit = C['adIn'] - 1.0, C['barRise2'][1]
    open0 = hit - 4.0 - m0
    fc_of = lambda TT: np.where(TT < open0, 650.0, 650.0 * (14000 / 650.0) ** np.clip((TT - open0) / 4.0, 0, 1) ** 2)
    muff = np.vstack([stft_mask(MUFF.x[c, secs(m0):], lambda F, TT: 1 / np.sqrt(1 + (F / fc_of(TT)) ** 4)) for c in range(2)])
    music[:, secs(m0):] += muff * 1.1
    # dead stop at the freeze
    back = C['adIn'] - 0.4
    cut = 1 - time_mask([(C['freeze'], back)], 0.006)
    music *= cut
    HALL.x[:, :] *= np.where(t < C['freeze'], 1.0, np.where(t < back, 0.0, 1.0))
    rv = convolve(HALL.x, hall) * 0.55
    rv *= np.where((t >= C['freeze']) & (t < back), np.exp(-np.maximum(0, t - C['freeze']) / 0.18), 1.0)
    rv += convolve(ROOM.x, room) * 0.35
    # musical arc: every upgrade makes the track a little bigger
    mo = C['morphs']
    arc = np.interp(t, [0, C['shatter'], mo[0] - 0.1, mo[0] + 0.1, mo[1] - 0.1, mo[1] + 0.1, mo[2] - 0.1, mo[2] + 0.1, mo[3] - 0.1, mo[3] + 0.1,
                        C['freeze'], C['barRise2'][1], C['endHit'], DUR],
                    [1, 0.78, 0.78, 0.84, 0.84, 0.9, 0.9, 0.95, 0.95, 1.0, 1.0, 1.06, 1.06, 1.06])
    # sound design ducks the music (trailer-style sidechain)
    sfx = SFX.x * 1.8
    lvl = np.max(np.abs(sfx), axis=0)
    att, rel = np.exp(-1 / (0.004 * SR)), np.exp(-1 / (0.18 * SR))
    env = signal.lfilter([1 - rel], [1, -rel], lvl)
    env = np.maximum(env, signal.lfilter([1 - att], [1, -att], lvl))
    duck = 1 - 0.42 * np.clip(env / 0.25, 0, 1)
    mix = music * 0.9 * arc * duck + sfx + rv
    mix = hp(mix, 25, 2)
    # global fades
    mix *= np.clip(t / 0.05, 0, 1)
    a, b = C['fadeOut']
    mix *= np.clip((b - t) / (b - a), 0, 1) ** 1.5
    if os.environ.get('STEMS'):
        for name, x in (('music', music * 0.9 * arc * duck), ('sfx', sfx), ('rv', rv)):
            wavfile.write(os.path.join(os.environ['STEMS'], name + '.wav'), SR, x.T.astype(np.float32))
    out_x, L = master(mix)
    print(f'integrated loudness ~ {L:.1f} LUFS, peak {20 * np.log10(np.max(np.abs(out_x))):.2f} dBFS')
    wavfile.write(out, SR, out_x.T.astype(np.float32))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav')
