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
  await passwordInput.type('dima.iva.me1');
  
  console.log('Logging in...');
  await page.click('button[type="submit"]');
  
  // Wait for navigation or error
  await new Promise(r => setTimeout(r, 5000));
  
  await page.screenshot({ path: 'C:/Users/Dimax/.openclaw/workspace/test_login2.png' });
  console.log('Current URL:', page.url());
  
  // If we're on /news, success!
  if (page.url().includes('/news')) {
    console.log('LOGIN SUCCESS! Taking screenshots of all pages...');
    
    // News page
    await page.screenshot({ path: 'C:/Users/Dimax/.openclaw/workspace/page_news.png' });
    
    // Events
    await page.goto(`${SITE_URL}/events`, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.screenshot({ path: 'C:/Users/Dimax/.openclaw/workspace/page_events.png' });
    
    // Lectures
    await page.goto(`${SITE_URL}/lectures`, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.screenshot({ path: 'C:/Users/Dimax/.openclaw/workspace/page_lectures.png' });
    
    // Gallery
    await page.goto(`${SITE_URL}/gallery`, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.screenshot({ path: 'C:/Users/Dimax/.openclaw/workspace/page_gallery.png' });
    
    // Profile
    await page.goto(`${SITE_URL}/profile`, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.screenshot({ path: 'C:/Users/Dimax/.openclaw/workspace/page_profile.png' });
    
    console.log('All pages screenshotted!');
  } else {
    console.log('Still on login - checking error...');
  }
  
  console.log('Done!');
}

main().catch(console.error);
