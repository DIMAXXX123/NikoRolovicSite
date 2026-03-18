import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: false, args: ['--window-size=390,844'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true });

// Go to gallery - will redirect to login
await page.goto('https://niko-rolovic-site.vercel.app/login', { waitUntil: 'networkidle2' });

// Login
await page.type('input[type="email"]', 'dmitrykokrok@gmail.com');
await page.type('input[type="password"]', 'admin123');
await page.click('button[type="submit"]');

await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
await new Promise(r => setTimeout(r, 3000));

// Navigate to gallery
await page.goto('https://niko-rolovic-site.vercel.app/gallery', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 2000));

// Screenshot at top
await page.screenshot({ path: 'C:\\Users\\Dimax\\Documents\\niko-rolovic-site\\test-scroll-top.png' });
console.log('Screenshot 1: top of page');

// Scroll down
await page.evaluate(() => window.scrollBy(0, 500));
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: 'C:\\Users\\Dimax\\Documents\\niko-rolovic-site\\test-scroll-mid.png' });
console.log('Screenshot 2: scrolled 500px');

// Scroll more
await page.evaluate(() => window.scrollBy(0, 800));
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: 'C:\\Users\\Dimax\\Documents\\niko-rolovic-site\\test-scroll-bottom.png' });
console.log('Screenshot 3: scrolled 1300px');

// Scroll back to top
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: 'C:\\Users\\Dimax\\Documents\\niko-rolovic-site\\test-scroll-backtop.png' });
console.log('Screenshot 4: back to top');

await browser.close();
console.log('Done - check screenshots for button position');
