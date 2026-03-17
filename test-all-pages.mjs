import puppeteer from 'puppeteer';
const SITE_URL = 'https://niko-rolovic-site.vercel.app';
const WS = 'C:/Users/Dimax/.openclaw/workspace';

async function main() {
  const browser = await puppeteer.launch({ 
    headless: false, defaultViewport: { width: 430, height: 932 },
    args: ['--window-position=100,50', '--window-size=500,1000']
  });
  const page = await browser.newPage();
  
  // Screenshot login page first
  await page.goto(`${SITE_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: `${WS}/v2_login.png`, fullPage: true });
  console.log('Login page captured');

  // Login
  const e = await page.$('input#email'); await e.click({ clickCount: 3 }); await e.type('dmitrykokrok@gmail.com');
  const p = await page.$('input#password'); await p.click({ clickCount: 3 }); await p.type('dima.iva.me1');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 6000));
  
  // Check for success animation
  await page.screenshot({ path: `${WS}/v2_login_success.png` });
  console.log('Login result captured');
  
  // Wait a bit more for redirect
  await new Promise(r => setTimeout(r, 3000));
  
  const pages_to_check = ['news', 'events', 'lectures', 'gallery', 'profile', 'admin'];
  for (const pg of pages_to_check) {
    await page.goto(`${SITE_URL}/${pg}`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: `${WS}/v2_${pg}.png`, fullPage: true });
    console.log(`${pg} captured`);
  }
  
  await browser.close();
  console.log('ALL DONE');
}
main().catch(console.error);
