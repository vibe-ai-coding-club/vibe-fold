const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.MZ_PREVIEW_URL || 'http://127.0.0.1:4342/prototypes/mz/';
const output = process.env.MZ_EVIDENCE_DIR || '/tmp/vibe-fold-mz-story-evidence';
await fs.mkdir(output, {recursive: true});
const browser = await chromium.launch({...(process.env.MZ_CHROMIUM_PATH ? {executablePath: process.env.MZ_CHROMIUM_PATH} : {}), args: ['--no-sandbox']});
const revelations = ['지윤도 가방을', '21:10 막차', '21:10 막차'];
const memoryCounts = [2, 2, 3];
async function exercise(width, height) {
  const context = await browser.newContext({viewport: {width, height}, hasTouch: width === 390});
  const page = await context.newPage(), errors = [], requests = [], captions = [];
  page.setDefaultTimeout(45000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  await page.goto(base + 'index.html?view=' + (width === 1440 ? 'desktop' : 'mobile'));
  assert.equal(await page.locator('body > iframe').count(), 1);
  assert.equal(await page.locator('body').evaluate(el => el.children.length), 1, 'no explanations, storyboard or review UI outside the artwork');
  const f = page.frames().find(frame => frame.url().endsWith('experience.html'));
  await f.waitForSelector('#begin'); await f.evaluate(() => document.fonts.ready);
  assert(await f.evaluate(() => {try {localStorage.getItem('probe'); return false;} catch {return true;}}), 'real opaque sandbox');
  await page.screenshot({path: `${output}/${width}-intro.png`});
  if (width === 375) await f.locator('#begin').press('Enter'); else await f.locator('#begin').click();
  const started = Date.now();
  async function readBeat(kind, chapter, beat) {
    await f.waitForFunction(({kind, chapter, beat}) => {
      const el = document.querySelector('#scene');
      return el.dataset.phase === kind && el.dataset.index === String(chapter) && el.dataset.beat === String(beat);
    }, {kind, chapter, beat});
    await f.waitForFunction(() => Number(getComputedStyle(document.querySelector('.story-copy')).opacity) > .98);
    const text = await f.locator('.story-copy').innerText();
    captions.push({kind, chapter, beat, text});
    const rangeBounds = await f.locator('.story-copy').evaluate(el => {
      const range = document.createRange(); range.selectNodeContents(el);
      return [...range.getClientRects()].map(r => ({left: r.left, right: r.right, bottom: r.bottom}));
    });
    const footer = await f.locator('footer').boundingBox();
    assert(rangeBounds.every(r => r.left >= 0 && r.right <= width && r.bottom < footer.y - 8), `readable text bounds: ${text}`);
    assert(await f.locator('.story-copy').evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 20));
    await page.screenshot({path: `${output}/${width}-${kind}-${chapter}-${beat}.png`});
    return text;
  }
  assert((await readBeat('prologue', -1, 0)).includes('문이 다시'));
  assert((await readBeat('prologue', -1, 1)).includes('처음'));
  for (let chapter = 0; chapter < 3; chapter++) {
    for (let beat = 0; beat < 2; beat++) await readBeat('observation', chapter, beat);
    await f.waitForFunction(() => document.querySelector('#scene').dataset.phase === 'waiting');
    const box = await f.locator('#label').boundingBox();
    assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= height, 'paper is inside the viewport');
    await page.screenshot({path: `${output}/${width}-${chapter + 1}-paper.png`});
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    if (chapter === 0 && width === 1440) {
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 145, y - 10, {steps: 12}); await page.mouse.up();
    } else if (chapter === 0 && width === 390) {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y}]});
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: x + 100, y: y - 15}]});
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []}); await cdp.detach();
    } else if (width === 1440 || chapter === 2) {
      await f.locator('#label').press(chapter === 2 ? 'Space' : 'Enter');
    } else if (width === 390) await f.locator('#label').tap();
    else await f.locator('#label').click();
    assert((await readBeat('memory', chapter, 0)).includes(revelations[chapter]));
    if (chapter === 0) assert((await f.locator('#art-description').innerText()).includes('3주 전'), 'the first peel returns to Ji-yoon at the same door');
    for (let beat = 1; beat < memoryCounts[chapter]; beat++) await readBeat('memory', chapter, beat);
    await f.waitForFunction(() => document.querySelector('#scene').dataset.phase === 'complete');
    assert(await f.locator('#repeat').isVisible()); await f.locator('#replay').click();
  }
  assert((await readBeat('closing', 3, 0)).includes('의자'));
  await readBeat('closing', 3, 1);
  assert((await readBeat('closing', 3, 2)).includes('MZ 같지'));
  await f.waitForSelector('.new-question', {state: 'visible'});
  assert((await f.locator('.new-question').innerText()).includes('지윤 씨'));
  assert.equal(await f.locator('.old-judgment').evaluate(el => getComputedStyle(el).textDecorationLine), 'line-through');
  await page.screenshot({path: `${output}/${width}-changed-question.png`});
  await f.waitForSelector('#ending:not([hidden])');
  assert((await f.locator('#ending').innerText()).includes('지윤 씨'));
  const elapsedSeconds = (Date.now() - started) / 1000;
  assert(elapsedSeconds >= 85 && elapsedSeconds <= 115, `the natural story keeps its quicker ~95-second pace: ${elapsedSeconds}s`);
  await page.screenshot({path: `${output}/${width}-ending.png`});
  await f.locator('#again').click();
  await f.waitForFunction(() => document.querySelector('#scene').dataset.phase === 'prologue');
  assert.equal(await f.locator('#scene').getAttribute('data-index'), '-1');
  assert.equal(errors.length, 0, JSON.stringify(errors));
  assert(requests.every(url => url.startsWith(new URL(base).origin) || url.startsWith('data:')), 'no external requests');
  assert(!requests.some(url => /\.(jpg|png|mp4)(\?|$)/.test(url)), 'no photographic media');
  await context.close();
  console.log('PASS', width, height, 'natural story, every caption, three interactions, ending, restart;', elapsedSeconds.toFixed(1), 'seconds');
  return {width, height, elapsedSeconds, captions, errors, requests, audiencePage: 'artwork only'};
}
try {
  const results = await Promise.all([[1440, 900], [390, 844], [375, 667]].map(([w, h]) => exercise(w, h)));
  await fs.writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
} finally {await browser.close();}
