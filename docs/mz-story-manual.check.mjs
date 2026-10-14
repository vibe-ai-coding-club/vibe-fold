const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base = process.env.MZ_PREVIEW_URL || 'http://127.0.0.1:4342/prototypes/mz/';
const output = (process.env.MZ_EVIDENCE_DIR || '/tmp/vibe-fold-mz-story-evidence') + '/final';
await fs.mkdir(output, {recursive: true});
const browser = await chromium.launch({...(process.env.MZ_CHROMIUM_PATH ? {executablePath: process.env.MZ_CHROMIUM_PATH} : {}), args: ['--no-sandbox']});
async function exercise(width, height) {
  const page = await browser.newPage({viewport: {width, height}}), errors = [];
  page.on('pageerror', error => errors.push(error.message)); await page.goto(base + 'index.html');
  const f = page.frames()[1]; await f.waitForSelector('#begin'); await f.locator('#begin').click();
  await f.waitForSelector('#pause:not([hidden])'); await f.locator('#pause').click();
  async function capture(name) {
    const copy = await f.locator('.story-copy').boundingBox(), footer = await f.locator('footer').boundingBox();
    if (await f.locator('#narrative').isVisible()) assert(copy.y + copy.height < footer.y, 'story fits above its action');
    await page.screenshot({path: `${output}/${width}-${name}.png`});
  }
  async function next() {await f.waitForSelector('#replay:not([disabled])'); await f.locator('#replay').click();}
  for (let beat = 0; beat < 2; beat++) {await capture(`prologue-${beat}`); await next();}
  for (let chapter = 0; chapter < 3; chapter++) {
    for (let beat = 0; beat < 2; beat++) {await capture(`observation-${chapter}-${beat}`); await next();}
    await f.waitForFunction(() => document.querySelector('#scene').dataset.phase === 'waiting');
    assert.equal(await f.getByRole('button', {name: /민호/}).count(), 1, 'the judgment has an accessible speaker');
    if (chapter === 1) {
      assert(!(await f.locator('#scene').getAttribute('aria-label')).includes('막차'), 'the observation does not disclose the second peel');
      assert(!(await f.locator('#art-description').innerText()).includes('막차'));
    }
    await capture(`paper-${chapter}`); await f.locator('#label').press('Enter');
    for (let beat = 0; beat < [2, 2, 3][chapter]; beat++) {await capture(`memory-${chapter}-${beat}`); await next();}
    assert.equal(await f.locator('#scene').getAttribute('data-phase'), 'complete'); await next();
  }
  await capture('closing-0');
  if (width === 390) await f.locator('#pause').click();
  await next(); await f.waitForSelector('#replay:not([disabled])'); await capture('closing-1');
  await next(); await f.waitForSelector('#replay:not([disabled])');
  if (width === 390) {
    assert.equal(await f.locator('.new-question').isVisible(), false);
    await next();
    assert.equal(await f.locator('#scene').getAttribute('data-beat'), '2', 'early continue reveals the named farewell before leaving this beat');
  }
  assert.equal(await f.locator('.new-question').isVisible(), true, 'the named farewell is present in paused/manual reading too');
  assert.equal(await f.locator('.old-judgment').evaluate(el => getComputedStyle(el).textDecorationLine), 'line-through');
  assert.equal(await f.locator('.old-judgment').getAttribute('aria-hidden'), 'true', 'the struck judgment is no longer announced');
  assert.equal(await f.locator('.new-question').getAttribute('aria-hidden'), null);
  assert.equal(await f.locator('#replacement-announcement').innerText(), '민호: 조심히 가요, 지윤 씨.');
  await capture('changed-question'); await next();
  await f.waitForSelector('#ending:not([hidden])'); await page.screenshot({path: `${output}/${width}-ending.png`});
  assert.equal(errors.length, 0, JSON.stringify(errors)); await page.close();
  console.log('PASS final manual story and every rendered state', width, height);
  return {width, height, manualStory: 'passed', replacementQuestion: 'passed', renderedScreens: 'passed', errors};
}
try {
  const results = await Promise.all([[1440, 900], [390, 844], [375, 667]].map(([w, h]) => exercise(w, h)));
  await fs.writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
} finally {await browser.close();}
