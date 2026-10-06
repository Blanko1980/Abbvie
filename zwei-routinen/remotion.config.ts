import {Config} from '@remotion/cli/config';

// Vorinstallierter Headless-Chromium der Umgebung (kein Download nötig)
Config.setBrowserExecutable('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setConcurrency(4);
