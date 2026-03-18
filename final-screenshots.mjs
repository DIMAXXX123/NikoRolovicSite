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

async function main() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=450,950'],
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 },
  });

  // First get live site screenshots
  console.log('═══ LIVE SITE ═══\n');
  const livePage = await browser.newPage();
  
  await livePage.goto(`${LIVE_URL}/login`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await livePage.screenshot({ path: join(SCREENSHOT_DIR, 'login.png') });
  console.log('✅ login.png');
  
  await livePage.goto(`${LIVE_URL}/register`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await livePage.screenshot({ path: join(SCREENSHOT_DIR, 'register.png') });
  console.log('✅ register.png');
  
  await livePage.close();

  // Now login and capture pages
  console.log('\n═══ LOGGING IN ═══\n');
  const page = await browser.newPage();
  
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  
  await page.type('input#email', EMAIL);
  await page.type('input#password', PASSWORD);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to gallery
  await page.waitForFunction(
    () => window.location.href.includes('/gallery'),
    { timeout: 15000 }
  );
  console.log('✅ Logged in!\n');
  await new Promise(r => setTimeout(r, 3000));
  
  // Screenshot gallery (we're already here)
  await page.screenshot({ path: join(SCREENSHOT_DIR, 'gallery.png') });
  console.log('✅ gallery.png');

  // Get the cookies from this session
  const cookies = await page.cookies();
  
  // Pages to capture
  const pages = [
    { path: '/news', name: 'news' },
    { path: '/events', name: 'events' },
    { path: '/lectures', name: 'lectures' },
    { path: '/schedule', name: 'schedule' },
    { path: '/grades', name: 'grades' },
    { path: '/profile', name: 'profile' },
    { path: '/admin/news', name: 'admin-news' },
    { path: '/admin/events', name: 'admin-events' },
    { path: '/admin/lectures', name: 'admin-lectures' },
    { path: '/admin/photos', name: 'admin-photos' },
    { path: '/admin/students', name: 'admin-students' },
    { path: '/admin/roles', name: 'admin-roles' }
  ];

  // Open each page in a new tab with the same cookies
  for (const { path, name } of pages) {
    const newPage = await browser.newPage();
    
    // Set the cookies from our logged-in session
    await newPage.setCookie(...cookies);
    
    // Navigate to the page
    await newPage.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2500));
    
    // Check if we got redirected to login
    const url = newPage.url();
    if (url.includes('/login')) {
      console.log(`⚠️ ${name} - redirected to login`);
    } else {
      console.log(`✅ ${name}.png`);
    }
    
    // Take screenshot regardless
    await newPage.screenshot({ path: join(SCREENSHOT_DIR, `${name}.png`) });
    
    // Close this tab
    await newPage.close();
  }

  console.log('\n🎉 Done! Check screenshots.');
  console.log('Browser will close in 5 seconds...');
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
}

main().catch(console.error);