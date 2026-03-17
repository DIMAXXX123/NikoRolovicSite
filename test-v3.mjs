import puppeteer from 'puppeteer';
const SITE = 'https://niko-rolovic-site.vercel.app';
const WS = 'C:/Users/Dimax/.openclaw/workspace';

async function main() {
  const browser = await puppeteer.launch({ 
    headless: false, defaultViewport: { width: 430, height: 932 },
    args: ['--window-position=100,50', '--window-size=500,1000']
  });
  const page = await browser.newPage();
  
  // Login
  await page.goto(`${SITE}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.screenshot({ path: `${WS}/t3_login.png` });
  
  const e = await page.$('input#email');
  if (e) { await e.click({ clickCount: 3 }); await e.type('dmitrykokrok@gmail.com'); }
  const p = await page.$('input#password');
  if (p) { await p.click({ clickCount: 3 }); await p.type('dima.iva.me1'); }
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 6000));
  
  const urls = ['gallery', 'news', 'events', 'lectures', 'profile', 'about', 'schedule', 'admin'];
  for (const u of urls) {
    try {
      await page.goto(`${SITE}/${u}`, { waitUntil: 'networkidle0', timeout: 15000 });
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: `${WS}/t3_${u}.png`, fullPage: true });
      console.log(`${u} ✓`);
    } catch(err) {
      console.log(`${u} FAILED: ${err.message}`);
    }
  }
  
  await browser.close();
  console.log('DONE');
}
main().catch(console.error);
