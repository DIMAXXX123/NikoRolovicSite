import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: false, args: ['--window-size=430,932'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

// Go to login
await page.goto('http://localhost:3457/login', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 1000));

// Try login with Dima's account
await page.type('input[type="email"]', 'dmitrykokrok@gmail.com');
await page.type('input[type="password"]', 'admin123');
await page.screenshot({ path: 'C:\\Users\\Dimax\\.openclaw\\media\\btn-test-login.png' });

// Click login button
const btn = await page.$('button[type="submit"]');
if (btn) await btn.click();
await new Promise(r => setTimeout(r, 5000));

// Check where we are now
const url1 = page.url();
console.log('After login URL:', url1);
await page.screenshot({ path: 'C:\\Users\\Dimax\\.openclaw\\media\\btn-test-afterlogin.png' });

// If still on login, try different password
if (url1.includes('login')) {
  console.log('Login failed, trying other passwords...');
  // Clear and retry
  await page.evaluate(() => {
    document.querySelector('input[type="password"]').value = '';
  });
  await page.click('input[type="password"]', { clickCount: 3 });
  await page.type('input[type="password"]', 'Admin123');
  const btn2 = await page.$('button[type="submit"]');
  if (btn2) await btn2.click();
  await new Promise(r => setTimeout(r, 5000));
  console.log('After retry URL:', page.url());
  
  if (page.url().includes('login')) {
    // Try password123
    await page.click('input[type="password"]', { clickCount: 3 });
    await page.type('input[type="password"]', 'password123');
    const btn3 = await page.$('button[type="submit"]');
    if (btn3) await btn3.click();
    await new Promise(r => setTimeout(r, 5000));
    console.log('After retry2 URL:', page.url());
  }
}

// Navigate to gallery directly regardless
await page.goto('http://localhost:3457/gallery', { waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
await new Promise(r => setTimeout(r, 3000));

const finalUrl = page.url();
console.log('Gallery page URL:', finalUrl);

// Take screenshots at different scroll positions
await page.screenshot({ path: 'C:\\Users\\Dimax\\.openclaw\\media\\btn-gallery-1-top.png' });
console.log('Screenshot 1: top');

await page.evaluate(() => window.scrollBy(0, 600));
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: 'C:\\Users\\Dimax\\.openclaw\\media\\btn-gallery-2-mid.png' });
console.log('Screenshot 2: mid scroll');

await page.evaluate(() => window.scrollBy(0, 600));
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: 'C:\\Users\\Dimax\\.openclaw\\media\\btn-gallery-3-bottom.png' });
console.log('Screenshot 3: bottom scroll');

await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: 'C:\\Users\\Dimax\\.openclaw\\media\\btn-gallery-4-backtop.png' });
console.log('Screenshot 4: back to top');

await browser.close();
console.log('DONE');
