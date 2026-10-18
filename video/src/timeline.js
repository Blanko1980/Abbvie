// Shared timeline for picture (anim JS) and sound (soundtrack.py).
// Everything after "window.TL =" must stay strict JSON - soundtrack.py parses it.
window.TL = {
  "fps": 60,
  "duration": 60,
  "bpm": 120,
  "cues": {
    "phoneIn": 0.15,
    "notifs": [0.9, 1.5, 2.25, 3.0],
    "ticks": [5.3, 5.62, 5.88, 6.08, 6.24, 6.38, 6.52, 6.68, 6.88, 7.15],
    "cracks": [7.45, 7.62, 7.8],
    "shatter": 8.0,

    "rustle": [8.25, 9.85],
    "knotPulls": [8.55, 9.05, 9.5],
    "pop": 10.0,
    "caseIn": 10.35,
    "budClicks": [10.9, 11.15],
    "lidClose": 11.55,
    "led": 11.7,

    "pans": [13.0, 18.0, 23.0, 28.0],
    "morphs": [10.0, 16.0, 20.0, 26.0, 30.0],

    "tap": 13.88,
    "toggle": 14.0,
    "coins": [14.2, 14.31, 14.39, 14.5, 14.58, 14.68, 14.77, 14.88, 15.0, 15.12, 15.26, 15.42],
    "mapChime": 16.35,

    "stack": [18.375, 18.5, 18.625, 18.75, 18.875, 19.0, 19.125, 19.25, 19.375, 19.5],
    "drawer": 19.7,
    "shrink": [20.08, 20.16, 20.24, 20.32, 20.4, 20.48],
    "terminalIn": 20.45,
    "cardSwoosh": 20.95,
    "nfc": 21.5,
    "paid": 21.78,

    "stones": [23.4, 23.65, 23.9, 24.15],
    "newspaper": [24.3, 24.65],
    "keys": [26.25, 26.29, 26.34, 26.38, 26.43, 26.47, 26.52, 26.56, 26.61, 26.65, 26.7, 26.74],
    "enter": 26.82,
    "stream": [26.9, 27.6],

    "paperIn": 28.25,
    "scribble": [28.5, 29.0],
    "stamp": 29.2,
    "scan": [30.65, 31.05],
    "check": 31.12,

    "freeze": 32.0,
    "adIn": 35.0,
    "scratch": [[35.6, 39.8, 1.0], [41.4, 43.3, 0.45]],
    "scratchFreq": 1.6,
    "barIn": 40.15,
    "barRise1": [40.75, 41.0],
    "riser": [42.0, 44.0],
    "barRise2": [43.6, 44.0],
    "clothes": 44.06,
    "chips": [46.0, 46.5, 47.0],

    "gridIn": 50.0,
    "flips": [50.75, 51.25, 51.75, 52.25, 52.75, 53.25, 53.75],
    "revCymbal": [54.0, 55.0],
    "endHit": 55.0,
    "fadeOut": [59.2, 60.0]
  }
};
