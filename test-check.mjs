import puppeteer from 'puppeteer';

const SITE_URL = 'https://niko-rolovic-site.vercel.app';

async function main() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 430, height: 932 },
    args: ['--window-position=100,50', '--window-size=500,1000']
  });
  
  const page = await browser.newPage();
  
  // Login
  await page.goto(`${SITE_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
  const emailInput = await page.$('input#email');
  await emailInput.click({ clickCount: 3 });
  await emailInput.type('dmitrykokrok@gmail.com');
  const passwordInput = await page.$('input#password');
  await passwordInput.click({ clickCount: 3 });
  await passwordInput.type('dima.iva.me1');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('URL after login:', page.url());
  
  if (page.url().includes('/news')) {
    // News
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'C:/Users/Dimax/.openclaw/workspace/final_news.png', fullPage: true });
    console.log('News screenshot done');
    
    // Events
    await page.goto(`${SITE_URL}/events`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'C:/Users/Dimax/.openclaw/workspace/final_events.png', fullPage: true });
    console.log('Events screenshot done');
    
    // Lectures
    await page.goto(`${SITE_URL}/lectures`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'C:/Users/Dimax/.openclaw/workspace/final_lectures.png', fullPage: true });
    console.log('Lectures screenshot done');
    
    // Gallery
    await page.goto(`${SITE_URL}/gallery`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'C:/Users/Dimax/.openclaw/workspace/final_gallery.png', fullPage: true });
    console.log('Gallery screenshot done');
    
    // Profile
    await page.goto(`${SITE_URL}/profile`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'C:/Users/Dimax/.openclaw/workspace/final_profile.png', fullPage: true });
    console.log('Profile screenshot done');

    // Admin
    await page.goto(`${SITE_URL}/admin`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'C:/Users/Dimax/.openclaw/workspace/final_admin.png', fullPage: true });
    console.log('Admin screenshot done');
  }
  
  await browser.close();
  console.log('ALL DONE!');
}

main().catch(console.error);
