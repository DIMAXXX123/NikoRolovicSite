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

const allPages = [
  { path: '/gallery', name: 'gallery' },
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
  { path: '/admin/roles', name: 'admin-roles' },
];

async function main() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

  // 1. Screenshot live login + register
  console.log('═══ LIVE SITE SCREENSHOTS ═══\n');
  
  await page.goto(`${LIVE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: join(SCREENSHOT_DIR, 'login.png') });
  console.log('✅ login.png');

  await page.goto(`${LIVE_URL}/register`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: join(SCREENSHOT_DIR, 'register.png') });
  console.log('✅ register.png');

  // 2. Login via form on local dev server
  console.log('\n═══ LOGGING IN ═══\n');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  await page.click('input#email');
  await page.type('input#email', EMAIL, { delay: 30 });
  await page.click('input#password');
  await page.type('input#password', PASSWORD, { delay: 30 });

  await page.click('button[type="submit"]');

  // Wait for redirect after success animation
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (!page.url().includes('/login')) break;
  }
  console.log(`Landed on: ${page.url()}`);
  await new Promise(r => setTimeout(r, 2000));

  // Check cookies after login
  let cookies = await page.cookies();
  console.log(`Cookies after login: ${cookies.map(c => c.name).join(', ') || 'NONE'}`);

  // The issue is the middleware runs server-side. The client-side supabase login 
  // stores the session but the middleware cookie refresh hasn't happened yet.
  // After login, we're on /gallery via client-side navigation. 
  // We need to reload to let the middleware set the cookies.
  
  // Reload current page to trigger middleware to set cookies
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  cookies = await page.cookies();
  console.log(`Cookies after reload: ${cookies.map(c => c.name).join(', ') || 'NONE'}`);
  console.log(`Current URL after reload: ${page.url()}`);

  // If still no cookies, the session might be in localStorage only
  // Let's check localStorage
  const storageKeys = await page.evaluate(() => Object.keys(localStorage));
  console.log(`localStorage keys: ${storageKeys.join(', ') || 'NONE'}`);
  
  // If we got redirected to login on reload, we need a different strategy
  if (page.url().includes('/login')) {
    console.log('\n⚠️ Server-side auth not persisting. Using client-side navigation strategy...\n');
    
    // Re-login
    await page.click('input#email');
    await page.type('input#email', EMAIL, { delay: 30 });
    await page.click('input#password');
    await page.type('input#password', PASSWORD, { delay: 30 });
    await page.click('button[type="submit"]');
    
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 500));
      if (!page.url().includes('/login')) break;
    }
    await new Promise(r => setTimeout(r, 2000));
    
    // Now use client-side navigation via Next.js router (no full page reload)
    console.log('═══ SCREENSHOTS VIA CLIENT-SIDE NAV ═══\n');
    
    for (const { path, name } of allPages) {
      console.log(`📸 ${name}: ${path}`);
      
      // Use Next.js client-side navigation
      await page.evaluate((targetPath) => {
        window.history.pushState({}, '', targetPath);
        // Trigger Next.js route change
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, path);
      
      // Better: use the actual Next.js router
      const navigated = await page.evaluate(async (targetPath) => {
        // Try using Next.js navigation
        const nextRouter = window.__NEXT_DATA__?.props?.pageProps;
        // Direct approach: click a link or use location
        window.location.href = targetPath;
        return true;
      }, path);
      
      await new Promise(r => setTimeout(r, 3000));
      
      const curUrl = page.url();
      if (curUrl.includes('/login') && !name.includes('login')) {
        console.log(`   ⚠️ Redirected to login`);
        // Save anyway but label it
        await page.screenshot({ path: join(SCREENSHOT_DIR, `${name}.png`) });
      } else {
        await page.screenshot({ path: join(SCREENSHOT_DIR, `${name}.png`) });
        console.log(`   ✅ ${name}.png`);
      }
    }
  } else {
    // Cookies are working, do normal navigation
    console.log('\n═══ PAGE SCREENSHOTS ═══\n');
    for (const { path, name } of allPages) {
      console.log(`📸 ${name}: ${path}`);
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2500));
      await page.screenshot({ path: join(SCREENSHOT_DIR, `${name}.png`) });
      console.log(`   ✅ ${name}.png`);
    }
  }

  await browser.close();
  console.log('\n🎉 Done!');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
