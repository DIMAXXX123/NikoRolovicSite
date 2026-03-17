import puppeteer from 'puppeteer';
const SITE_URL = 'https://niko-rolovic-site.vercel.app';
async function main() {
  const browser = await puppeteer.launch({ 
    headless: false, defaultViewport: { width: 430, height: 932 },
    args: ['--window-position=100,50', '--window-size=500,1000']
  });
  const page = await browser.newPage();
  await page.goto(`${SITE_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
  const e = await page.$('input#email'); await e.click({ clickCount: 3 }); await e.type('dmitrykokrok@gmail.com');
  const p = await page.$('input#password'); await p.click({ clickCount: 3 }); await p.type('dima.iva.me1');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 5000));
  
  // News with content
  await page.goto(`${SITE_URL}/news`, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: 'C:/Users/Dimax/.openclaw/workspace/check_news.png', fullPage: true });
  console.log('News done');
  
  await browser.close();
}
main().catch(console.error);
