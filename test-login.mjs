import puppeteer from 'puppeteer';

const SITE_URL = 'https://niko-rolovic-site.vercel.app';

async function main() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 430, height: 932 },
    args: ['--window-position=100,50', '--window-size=500,1000']
  });
  
  const page = await browser.newPage();
  
  console.log('Opening login page...');
  await page.goto(`${SITE_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
  
  // Fill email
  const emailInput = await page.$('input#email');
  await emailInput.click({ clickCount: 3 });
  await emailInput.type('dmitrykokrok@gmail.com');
  
  // Fill password
  const passwordInput = await page.$('input#password');
  await passwordInput.click({ clickCount: 3 });
  await passwordInput.type('NikoRolovic2026!');
  
  console.log('Logging in...');
  await page.click('button[type="submit"]');
  
  // Wait for navigation
  await page.waitForNavigation({ timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));
  
  await page.screenshot({ path: 'C:/Users/Dimax/.openclaw/workspace/test_login_result.png' });
  console.log('Current URL:', page.url());
  console.log('Done!');
}

main().catch(console.error);
