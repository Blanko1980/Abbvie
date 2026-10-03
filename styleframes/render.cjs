// Rendert die SVG-Styleframes als PNG (1920 × 1080) mit lokalem Headless-Chromium.
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
let pw; try { pw = require('playwright'); } catch (e) { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
(async () => {
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  for (const f of fs.readdirSync(__dirname).filter((n) => n.endsWith('.svg'))) {
    await page.goto('file://' + path.join(__dirname, f));
    await page.screenshot({ path: path.join(__dirname, f.replace('.svg', '.png')) });
    console.log('→', f.replace('.svg', '.png'));
  }
  await browser.close();
})();
