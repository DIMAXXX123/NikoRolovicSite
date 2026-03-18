import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:\\Users\\Dimax\\AppData\\Roaming\\npm\\node_modules\\puppeteer');
import { mkdir } from 'fs/promises';
import { join } from 'path';

const BASE_URL = 'http://localhost:3457';
const LIVE_URL = 'https://niko-rolovic-site.vercel.app';
const SCREENSHOT_DIR = 'C:/Users/Dimax/Documents/niko-rolovic-site/presentation/screenshots';
const EMAIL = 'dmitrykokrok@gmail.com';
const PASSWORD = 'ScreenshotTemp2026!';

const WIDTH = 390;
const HEIGHT = 844;

async function loginAndScreenshot(browser, pagePath, fileName) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  
  try {
    // Login
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.type('input#email', EMAIL);
    await page.type('input#password', PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for redirect after login
    await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));
    
    // Navigate to target page
    if (pagePath !== '/gallery') { // We're already on gallery after login
      await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 2000));
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: join(SCREENSHOT_DIR, `${fileName}.png`),
      fullPage: false,
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT }
    });
    
    console.log(`✅ ${fileName}.png - ${pagePath}`);
    return true;
  } catch (e) {
    console.log(`❌ ${fileName}.png - ${e.message}`);
    return false;
  } finally {
    await context.close();
  }
}

async function main() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 },
  });

  console.log('═══ TAKING SCREENSHOTS ═══\n');
  
  // Live site screenshots (no login needed)
  const page = await browser.newPage();
  await page.goto(`${LIVE_URL}/login`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: join(SCREENSHOT_DIR, 'login.png') });
  console.log('✅ login.png');
  
  await page.goto(`${LIVE_URL}/register`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: join(SCREENSHOT_DIR, 'register.png') });
  console.log('✅ register.png');
  await page.close();
  
  console.log('\n═══ AUTHENTICATED PAGES (separate sessions) ═══\n');
  
  // Process each page in its own browser context to avoid session issues
  const pages = [
    { path: '/gallery', name: 'gallery' },
    { path: '/news', name: 'news' },
    { path: '/events', name: 'events' },
    { path: '/lectures', name: 'lectures' },
    { path: '/schedule', name: 'schedule' },
    { path: '/grades', name: 'grades' },
    { path: '/profile', name: 'profile' },
    { path: '/admin/news', name: 'admin-news' },
    { path: '/admin/events', name: 'admin-calendar' }, // rename to match requirement
    { path: '/admin/lectures', name: 'admin-lectures' },
    { path: '/admin/photos', name: 'admin-photos' },
    { path: '/admin/students', name: 'admin-students' },
    { path: '/admin/roles', name: 'admin-roles' },
  ];
  
  // Process in batches to avoid overload
  for (const { path, name } of pages) {
    await loginAndScreenshot(browser, path, name);
    await new Promise(r => setTimeout(r, 500)); // Small delay between pages
  }

  await browser.close();
  
  console.log('\n🎉 Complete! All screenshots saved to:');
  console.log(SCREENSHOT_DIR);
}

main().catch(e => { 
  console.error('Fatal:', e); 
  process.exit(1); 
});