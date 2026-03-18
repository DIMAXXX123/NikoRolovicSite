import puppeteer from 'puppeteer';
const SITE = 'https://niko-rolovic-site.vercel.app';
const WS = 'C:/Users/Dimax/.openclaw/workspace';

async function main() {
  const browser = await puppeteer.launch({ 
    headless: true, defaultViewport: { width: 430, height: 932 }
  });
  const page = await browser.newPage();
  
  await page.goto(`${SITE}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
  const e = await page.$('input#email');
  if (e) { await e.click({ clickCount: 3 }); await e.type('dmitrykokrok@gmail.com'); }
  const p = await page.$('input#password');
  if (p) { await p.click({ clickCount: 3 }); await p.type('dima.iva.me1'); }
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 5000));
  
  // Schedule
  await page.goto(`${SITE}/schedule`, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: `${WS}/morning_schedule.png`, fullPage: true });
  console.log('Schedule ✓');
  
  // Gallery
  await page.goto(`${SITE}/gallery`, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: `${WS}/morning_gallery.png`, fullPage: true });
  console.log('Gallery ✓');
  
  await browser.close();
  console.log('DONE');
}
main().catch(console.error);
