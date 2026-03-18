import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:\\Users\\Dimax\\AppData\\Roaming\\npm\\node_modules\\puppeteer');
import { mkdir } from 'fs/promises';
import { join } from 'path';

const BASE_URL = 'http://localhost:3457';
const SCREENSHOT_DIR = 'C:/Users/Dimax/Documents/niko-rolovic-site/presentation/screenshots';
const EMAIL = 'dmitrykokrok@gmail.com';
const PASSWORD = 'ScreenshotTemp2026!';

const WIDTH = 390;
const HEIGHT = 844;

const pages = [
  '/gallery',
  '/news', 
  '/events',
  '/lectures',
  '/schedule',
  '/grades',
  '/profile',
  '/admin/news',
  '/admin/events',
  '/admin/lectures',
  '/admin/photos',
  '/admin/students',
  '/admin/roles',
];

async function main() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: false, // Show browser to debug
    args: ['--window-size=420,900'],
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();
  
  console.log('═══ LOGGING IN ═══\n');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Fill login form
  await page.type('input#email', EMAIL);
  await page.type('input#password', PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for successful login - should redirect to /gallery after animation
  console.log('Waiting for login success...');
  await page.waitForFunction(
    () => !window.location.href.includes('/login'),
    { timeout: 15000 }
  );
  
  console.log(`✅ Logged in! Now at: ${page.url()}`);
  await new Promise(r => setTimeout(r, 3000));

  // Take first screenshot of where we landed (gallery)
  await page.screenshot({ path: join(SCREENSHOT_DIR, 'gallery.png') });
  console.log('📸 gallery.png');

  // Now navigate to each page using browser navigation (not page.goto which loses session)
  for (const path of pages.slice(1)) { // Skip gallery, we already did it
    const name = path.replace('/admin/', 'admin-').replace('/', '');
    console.log(`📸 ${name}: ${BASE_URL}${path}`);
    
    // Navigate using page.evaluate to keep session
    await page.evaluate((url) => {
      window.location.href = url;
    }, `${BASE_URL}${path}`);
    
    // Wait for navigation
    await new Promise(r => setTimeout(r, 3000));
    
    // Check if we got redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log(`   ⚠️ Lost session, re-logging in...`);
      
      // Re-login
      await page.type('input#email', EMAIL);
      await page.type('input#password', PASSWORD); 
      await page.click('button[type="submit"]');
      
      // Wait for redirect
      await page.waitForFunction(
        () => !window.location.href.includes('/login'),
        { timeout: 10000 }
      );
      
      // Navigate to target page again
      await page.evaluate((url) => {
        window.location.href = url;
      }, `${BASE_URL}${path}`);
      
      await new Promise(r => setTimeout(r, 3000));
    }
    
    // Take screenshot
    await page.screenshot({ path: join(SCREENSHOT_DIR, `${name}.png`) });
    console.log(`   ✅ ${name}.png`);
  }

  console.log('\n🎉 Done! Check screenshots.');
  
  // Keep browser open for 5 seconds to review
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
}

main().catch(console.error);