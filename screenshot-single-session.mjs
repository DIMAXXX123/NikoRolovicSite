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

async function main() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });

  console.log('Starting Puppeteer with visible browser for debugging...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser
    args: ['--window-size=450,950'],
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();
  
  console.log('═══ LOGIN ═══\n');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Take login screenshot before logging in
  await page.screenshot({ path: join(SCREENSHOT_DIR, 'login.png') });
  console.log('✅ login.png (login page)');

  // Login
  await page.type('input#email', EMAIL);
  await page.type('input#password', PASSWORD);
  await page.click('button[type="submit"]');
  
  // Wait for success animation and redirect
  console.log('Waiting for login to complete...');
  try {
    await page.waitForFunction(
      () => window.location.href.includes('/gallery'),
      { timeout: 15000 }
    );
    console.log('✅ Login successful! Now on /gallery\n');
  } catch {
    console.log('❌ Login failed or timed out\n');
    const url = page.url();
    console.log('Current URL:', url);
    await browser.close();
    return;
  }

  // Wait for gallery to fully load
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('═══ TAKING SCREENSHOTS ═══\n');
  
  // Take gallery screenshot (we're already here)
  await page.screenshot({ path: join(SCREENSHOT_DIR, 'gallery.png') });
  console.log('✅ gallery.png');

  // List of remaining pages
  const pages = [
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
    '/admin/roles'
  ];

  for (const path of pages) {
    const filename = path.replace('/admin/', 'admin-').replace('/', '') + '.png';
    console.log(`Navigating to ${path}...`);
    
    // Use soft navigation via History API
    await page.evaluate((targetPath) => {
      // Push state and try to trigger Next.js navigation
      window.history.pushState({}, '', targetPath);
      // Force a popstate event to trigger router
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, path);
    
    // Wait for content to load
    await new Promise(r => setTimeout(r, 3000));
    
    // Check if we're still logged in
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log(`⚠️ Lost session at ${path}, stopping...`);
      break;
    }
    
    // Take screenshot
    await page.screenshot({ path: join(SCREENSHOT_DIR, filename) });
    console.log(`✅ ${filename}`);
  }

  console.log('\n═══ COMPLETE ═══');
  console.log('Keeping browser open for 10 seconds to review...');
  await new Promise(r => setTimeout(r, 10000));
  
  await browser.close();
}

main().catch(console.error);