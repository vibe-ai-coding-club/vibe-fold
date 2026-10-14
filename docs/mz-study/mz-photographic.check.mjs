const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const root = process.env.MZ_PREVIEW_URL || 'http://127.0.0.1:4342/prototypes/mz-study/';
const output = '/tmp/vibe-fold-mz-evidence';
await fs.mkdir(output,{recursive:true});
const browser = await chromium.launch({headless:true, ...(process.env.MZ_CHROMIUM_PATH ? {executablePath:process.env.MZ_CHROMIUM_PATH} : {}), args:['--no-sandbox']});
const results=[];
async function run(name,fn){if(process.env.MZ_CHECK_FILTER && !name.includes(process.env.MZ_CHECK_FILTER))return;try{await fn();results.push({name,passed:true});console.log('PASS '+name);}catch(e){results.push({name,passed:false,error:String(e)});console.log('FAIL '+name+' '+e.stack);}}
async function setup(w,h,opts={}) {
 const context = await browser.newContext({viewport:{width:w,height:h},hasTouch:w<700,isMobile:w<700,...opts});
 const page = await context.newPage(), errors=[], external=[], failed=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(!r.url().startsWith(new URL(root).origin)&&!r.url().startsWith('data:'))external.push(r.url());});
 page.on('response',r=>{if(r.status()>=400)failed.push([r.status(),r.url()]);});
 await page.goto(root+'index.html?view='+(w===1440?'desktop':w===390?'mobile':'mobile-small'));
 await page.addStyleTag({content:'body>header,.intro,.section-bar,.caption,.storyboard,.sequence,main>footer{display:none!important}main{padding:0!important;max-width:none!important}#frame-stage{padding:0!important}iframe{transform:none!important}'});
 const frame = page.frames().find(f=>f.url().endsWith('experience.html'));
 await frame.waitForSelector('#scene');
 return {context,page,frame,errors,external,failed};
}
for(const [w,h] of [[1440,900],[390,844],[375,667]]) await run(`sandbox ${w}×${h} ${w<700?'touch':'drag/keyboard'}`, async()=>{
 const {context,page,frame,errors,external,failed}=await setup(w,h);
 await frame.waitForFunction(()=>document.querySelector('#scene').dataset.phase==='waiting');
 await page.screenshot({path:`${output}/${w}-paper.png`});
 assert(await frame.evaluate(()=>document.fonts.check('24px "Noto Sans KR"')));
 assert(await frame.evaluate(()=>document.querySelector('#still img').naturalWidth>0));
 const box=await frame.locator('#label').boundingBox();
 assert(box.x>=0 && box.x+box.width<=w && box.y>=0 && box.y+box.height<=h);
 if(w===1440){
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  await page.mouse.move(box.x+box.width/2+160,box.y+box.height/2-60,{steps:12});await page.mouse.up();
 } else if(w===390){
  const cdp=await context.newCDPSession(page);
  const x=box.x+box.width/2,y=box.y+box.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*16,y:y-i*4}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 } else await frame.locator('#label').tap();
 await frame.waitForFunction(()=>document.querySelector('#scene').dataset.phase==='complete');
 assert.equal(await frame.locator('#memory').evaluate(el=>getComputedStyle(el).opacity),'1');
 assert((await frame.locator('#memory').innerText()).includes('아무도 말을 안 걸어줬거든요.'));
 await page.screenshot({path:`${output}/${w}-memory.png`});
 assert.equal(external.length,0);assert.equal(errors.length,0);assert.equal(failed.length,0,JSON.stringify(failed));
 await frame.locator('#replay').click();await frame.waitForFunction(()=>document.querySelector('#scene').dataset.phase==='waiting');
 await frame.locator('#label').focus();await page.keyboard.press('Enter');
 await frame.waitForFunction(()=>document.querySelector('#scene').dataset.phase==='complete');
 await context.close();
});
await run('video failure: still + complete interaction',async()=>{
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.route('**/*.mp4',r=>r.abort());const page=await context.newPage();await page.goto(root+'index.html?view=mobile');
 const frame=page.frames().find(f=>f.url().endsWith('experience.html'));
 await frame.waitForFunction(()=>document.querySelector('#scene').dataset.phase==='waiting');
 assert.equal(await frame.locator('#film').evaluate(el=>getComputedStyle(el).opacity),'0');
 assert(await frame.evaluate(()=>document.querySelector('#still img').naturalWidth>0));
 await frame.locator('#label').click();await frame.waitForFunction(()=>document.querySelector('#scene').dataset.phase==='complete');
 await context.close();
});
await run('reduced motion: still, straight paper, Enter reveal',async()=>{
 const {context,frame,page,errors}=await setup(375,667,{reducedMotion:'reduce'});
 await frame.waitForFunction(()=>document.querySelector('#scene').dataset.phase==='waiting');
 assert.equal(await frame.locator('#film').evaluate(el=>el.paused),true);
 const transform=await frame.locator('#label').evaluate(el=>getComputedStyle(el).transform);assert(!transform.includes('0.052'));
 await frame.locator('#label').focus();await page.keyboard.press('Enter');
 await frame.waitForFunction(()=>document.querySelector('#scene').dataset.phase==='complete');
 await page.screenshot({path:output+'/reduced-motion.png'});assert.equal(errors.length,0);await context.close();
});
await run('review PC/mobile/small switching + no horizontal clipping',async()=>{
 for(const [w,h]of [[1440,900],[390,844],[375,667]]){
  const context=await browser.newContext({viewport:{width:w,height:h}}),page=await context.newPage();await page.goto(root+'index.html');
  for(const [view,dims]of Object.entries({desktop:[1440,900],mobile:[390,844],'mobile-small':[375,667]})){
   await page.locator(`[data-view="${view}"]`).click();assert.equal(await page.locator('[aria-pressed="true"]').count(),1);
   assert.deepEqual(await page.locator('iframe').evaluate(f=>[f.clientWidth,f.clientHeight]),dims);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  for(const img of await page.locator('.stories img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());assert(await img.evaluate(el=>el.naturalWidth>0));}
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${output}/${w}-review.png`,fullPage:true});await context.close();
 }
});
await fs.writeFile(output+(process.env.MZ_CHECK_FILTER?'/filtered-results.json':'/results.json'),JSON.stringify(results,null,2));await browser.close();
if(results.some(r=>!r.passed))process.exitCode=1;
