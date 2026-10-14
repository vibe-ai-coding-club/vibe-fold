const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base = process.env.MZ_PREVIEW_URL || 'http://127.0.0.1:4342/prototypes/mz/';
const output = process.env.MZ_EVIDENCE_DIR || '/tmp/vibe-fold-mz-story-evidence';
await fs.mkdir(output, {recursive: true});
const browser = await chromium.launch({...(process.env.MZ_CHROMIUM_PATH ? {executablePath: process.env.MZ_CHROMIUM_PATH} : {}), args: ['--no-sandbox']});
const errors = [];
const waitBeat = (f, kind, beat) => f.waitForFunction(({kind, beat}) => {
  const el = document.querySelector('#scene'); return el.dataset.phase === kind && el.dataset.beat === String(beat);
}, {kind, beat});
async function advance(f) {
  await f.waitForSelector('#replay:not([disabled])'); await f.locator('#replay').click();
}
async function pauseVisibilityAndRecovery() {
  const context = await browser.newContext({viewport: {width: 1440, height: 900}});
  await context.addInitScript(() => {
    const Original = window.AudioContext; window.__audioContexts = [];
    if (Original) window.AudioContext = class extends Original {constructor(...args) {super(...args); window.__audioContexts.push(this);}};
  });
  const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
  await page.goto(base + 'watch.html'); const f = page.frames()[1]; await f.waitForSelector('#begin'); await f.locator('#begin').click();
  await waitBeat(f, 'prologue', 0); await page.waitForTimeout(800);
  await f.waitForFunction(() => document.querySelector('#music').currentTime > .15);
  const hide = hidden => f.evaluate(value => {
    Object.defineProperty(document, 'hidden', {configurable: true, get: () => value}); document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
  const art = () => f.locator('#art').evaluate(el => el.toDataURL());
  const fill = () => f.locator('.beat-progress span').evaluate(el => el.style.width);
  await hide(true); const frozen = await art(), frozenFill = await fill(); await page.waitForTimeout(1200);
  assert.equal(await art(), frozen); assert.equal(await fill(), frozenFill);
  assert.equal(await f.evaluate(() => window.__audioContexts[0].state), 'suspended');
  assert.equal(await f.locator('#music').evaluate(el => el.paused), true, 'music pauses when the tab is hidden');
  await hide(false); await page.waitForTimeout(300); assert.notEqual(await fill(), frozenFill);
  assert.equal(await f.locator('#music').evaluate(el => el.paused), false, 'music resumes with the story');
  await f.locator('#pause').click(); const userPausedFill = await fill();
  assert.equal(await f.locator('#music').evaluate(el => el.paused), true, 'viewer pause also pauses music');
  await hide(true); await hide(false); await page.waitForTimeout(700);
  assert.equal(await fill(), userPausedFill, 'visibility must not undo the viewer pause');
  assert.equal(await f.evaluate(() => window.__audioContexts[0].state), 'suspended');
  await advance(f); await waitBeat(f, 'prologue', 1);
  assert((await f.locator('.story-copy').innerText()).includes('처음'), 'manual reading works while paused');
  await advance(f); await waitBeat(f, 'observation', 0);
  assert.equal(await f.locator('#scene').getAttribute('data-paused'), 'true');
  await advance(f); await waitBeat(f, 'observation', 1); await advance(f);
  await f.waitForFunction(() => document.querySelector('#scene').dataset.phase === 'waiting');
  const box = await f.locator('#label').boundingBox(), x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 30, y); await page.mouse.up();
  await page.waitForTimeout(100); assert.equal(await f.locator('#label').evaluate(el => el.style.marginLeft), '0px');
  assert.equal(await f.locator('#scene').getAttribute('data-phase'), 'waiting');
  await f.locator('#sound').click(); assert.equal(await f.locator('#sound').getAttribute('aria-pressed'), 'false');
  assert.equal(await f.locator('#music').evaluate(el => el.paused), true, 'mute silences the music');
  await f.locator('#label').press('Enter'); await waitBeat(f, 'memory', 0);
  assert((await f.locator('.story-copy').innerText()).includes('지윤도 가방을'), 'peeling reveals the reason even while playback is paused');
  await f.locator('#replay').evaluate(el => {el.click(); el.click(); el.click();});
  assert.equal(await f.locator('#scene').getAttribute('data-beat'), '1', 'one activation during the reading transition');
  await advance(f);
  assert.equal(await f.locator('#scene').getAttribute('data-phase'), 'complete');
  await f.locator('#repeat').click(); await waitBeat(f, 'observation', 0); assert.equal(await f.locator('#scene').getAttribute('data-index'), '0');
  await f.locator('#pause').click(); await page.waitForTimeout(800); assert.equal(await f.locator('#scene').getAttribute('data-paused'), 'false');
  assert.equal(await f.locator('#sound').getAttribute('aria-pressed'), 'false');
  assert.equal(await f.evaluate(() => window.__audioContexts[0].state), 'suspended');
  await context.close(); return 'hidden fixture, audio, viewer pause preserved, manual reading while paused, partial drag, mute, repeat';
}
async function reducedMotionAndAudienceRoutes() {
  const context = await browser.newContext({viewport: {width: 390, height: 844}, reducedMotion: 'reduce'});
  const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
  await page.goto(base + 'index.html?view=mobile'); const f = page.frames()[1]; await f.waitForSelector('#begin'); await f.locator('#begin').press('Enter');
  await waitBeat(f, 'prologue', 0); await f.waitForSelector('#replay:not([disabled])');
  const image = await f.locator('#art').evaluate(el => el.toDataURL()); await page.waitForTimeout(900);
  assert.equal(await f.locator('#art').evaluate(el => el.toDataURL()), image, 'reduced motion is still within each narrative beat');
  assert.equal(await f.evaluate(() => document.activeElement.id), 'replay');
  await f.locator('#pause').click();
  for (let i = 0; i < 4; i++) await advance(f);
  await f.waitForFunction(() => document.querySelector('#scene').dataset.phase === 'waiting');
  assert.equal(await f.locator('#label').evaluate(el => getComputedStyle(el).transform.split(',').slice(0, 4).join(',')), 'matrix(1, 0, 0, 1');
  await f.locator('#label').press('Space'); await waitBeat(f, 'memory', 0);
  await page.screenshot({path: `${output}/390-reduced.png`});
  await page.setViewportSize({width: 1440, height: 900});
  await f.waitForFunction(() => document.querySelector('#art').width === innerWidth * Math.min(devicePixelRatio, 2));
  assert(await f.locator('.story-copy').isVisible());
  for (const route of ['index.html?view=desktop', 'index.html?view=mobile', 'index.html?view=mobile-small', 'watch.html']) {
    await page.goto(base + route);
    assert.equal(await page.locator('body').evaluate(el => el.children.length), 1);
    assert.equal(await page.locator('body > iframe').count(), 1);
    assert.equal(await page.locator('iframe').getAttribute('sandbox'), 'allow-scripts');
    assert.equal(await page.locator('body').evaluate(el => el.scrollHeight <= innerHeight), true);
  }
  await context.close(); return 'reduced motion, keyboard and Space, orientation, every audience URL has only the artwork';
}
async function spokenDialogue() {
  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base + 'index.html'); const f = page.frames()[1];
  await f.locator('#begin').click();
  await waitBeat(f, 'prologue', 1);
  await f.waitForFunction(() => document.querySelector('[data-voice="seoa_intro"]').currentTime > .15);
  assert.equal(await f.locator('[data-voice="seoa_intro"]').evaluate(el => el.paused), false, 'Seo-a speaks in sync with her line');
  await f.locator('#sound').click();
  assert.equal(await f.locator('[data-voice="seoa_intro"]').evaluate(el => el.paused), true, 'mute silences speech');
  assert.equal(await f.locator('#music').evaluate(el => el.paused), true);
  await f.locator('#sound').click();
  assert.equal(await f.locator('#music').evaluate(el => el.paused), false, 'music returns after unmute');
  assert.equal(await f.locator('[data-voice="seoa_intro"]').evaluate(el => el.paused), true, 'unmute does not play stale dialogue over a later caption');
  await page.close(); return 'local music and character dialogue, mute and unmute';
}
try {
  const results = await Promise.all([pauseVisibilityAndRecovery(), reducedMotionAndAudienceRoutes(), spokenDialogue()]);
  assert.equal(errors.length, 0, JSON.stringify(errors));
  await fs.writeFile(`${output}/edge-results.json`, JSON.stringify({passed: results, errors, limits: 'document.hidden fixture; emulated Chromium mobile; own checks; no physical device'}, null, 2));
  console.log('PASS', results.join('; '));
} finally {await browser.close();}
