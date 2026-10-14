const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({...(process.env.MZ_CHROMIUM_PATH ? {executablePath:process.env.MZ_CHROMIUM_PATH} : {}),args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:900}});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto((process.env.MZ_PREVIEW_URL || 'http://127.0.0.1:4342/prototypes/mz-study/')+'index.html');const f=page.frames().find(f=>f.url().endsWith('experience.html'));await f.waitForSelector('#scene');const inspectionStyle=await page.addStyleTag({content:'body>header,.intro,.section-bar,.caption,.storyboard,.sequence,main>footer{display:none!important}main{padding:0!important;max-width:none!important}#frame-stage{padding:0!important}iframe{transform:none!important}'});
const phase=()=>f.locator('#scene').getAttribute('data-phase');
// Visibility fixture: pause actual media and timeline while document is reported hidden.
await page.waitForTimeout(1400);
await f.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
const before=await f.locator('#film').evaluate(v=>v.currentTime);await page.waitForTimeout(3300);
assert.equal(await phase(),'observation');assert.equal(await f.locator('#film').evaluate(v=>v.paused),true);
assert(Math.abs(await f.locator('#film').evaluate(v=>v.currentTime)-before)<.1);
await f.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
await f.waitForFunction(()=>document.querySelector('#scene').dataset.phase==='waiting');
assert(await f.locator('#film').evaluate(v=>v.currentTime>2));assert(await f.locator('#film').evaluate(v=>v.paused));
await page.waitForTimeout(1500);assert.equal(await phase(),'waiting');
// Partial drag returns the paper, explicit mute stays selected after participation.
await f.locator('#sound').click();await f.locator('#sound').click();assert.equal(await f.locator('#sound').getAttribute('aria-pressed'),'false');
const box=await f.locator('#label').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+30,y);await page.mouse.up();await page.waitForTimeout(450);
assert.equal(await phase(),'waiting');assert.equal(await f.locator('#label').evaluate(b=>b.style.marginLeft),'0px');
await f.locator('#label').click();await f.locator('#label').evaluate(el=>{el.click();el.click();});
await page.waitForTimeout(500);
await f.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
await page.waitForTimeout(2500);assert.equal(await phase(),'peeling');
await f.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
await f.waitForFunction(()=>document.querySelector('#scene').dataset.phase==='complete');
assert.equal(await f.locator('#sound').getAttribute('aria-pressed'),'false');assert.equal(await f.locator('#film').evaluate(v=>v.ended),true);
// Opaque origin is real, storage is unavailable; resizing selects the portrait movie.
assert(await f.evaluate(()=>{try{localStorage.getItem('test');return false}catch{return true}}));
await inspectionStyle.evaluate(el=>el.remove());await page.locator('[data-view="mobile"]').click();await f.waitForFunction(()=>document.querySelector('video').videoWidth===1080);
assert((await f.locator('#film').evaluate(v=>v.src)).endsWith('care-portrait.mp4'));assert.equal(await f.locator('#film').evaluate(v=>v.videoWidth),1080);
assert.equal(errors.length,0,JSON.stringify(errors));
await fs.writeFile('/tmp/vibe-fold-mz-evidence/edge-results.json',JSON.stringify({visibility:'passed with document.hidden fixture',partialDrag:'passed',explicitMute:'passed',rapidRepeatedActivation:'passed',videoPlaybackAndHold:'passed',opaqueOrigin:'passed',orientationChange:'passed',pageErrors:errors},null,2));
console.log('PASS visibility fixture, partial drag, explicit mute, rapid activation, real video playback, opaque origin, orientation switch');await browser.close();
