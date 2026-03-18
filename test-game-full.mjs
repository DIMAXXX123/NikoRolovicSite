import puppeteer from 'puppeteer';
const SUPA = 'https://ydcbxqrnmnbceyzqgbui.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3Mzg0NjYsImV4cCI6MjA4OTMxNDQ2Nn0.y-lauFU8c9eTP0RJL_zveEF4JE96KiTvJ46FrvYZmfY';

const browser = await puppeteer.launch({ headless: false, args: ['--window-size=430,900'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

// Login
await page.goto('http://localhost:3463/login', { waitUntil: 'networkidle2' });
await page.type('input[type="email"]', 'dmitrykokrok@gmail.com');
await page.type('input[type="password"]', 'dmitrykokrok');
await page.click('button[type="submit"]');
await new Promise(r => setTimeout(r, 5000));

// Go to game
await page.goto('http://localhost:3463/game', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 3000));

// Screenshot full page
await page.screenshot({ path: 'C:\\Users\\Dimax\\.openclaw\\media\\game-full.png', fullPage: true });

// Check grid visibility
const gridInfo = await page.evaluate(() => {
  const grids = document.querySelectorAll('[class*="grid"]');
  const results = [];
  grids.forEach(g => {
    const rect = g.getBoundingClientRect();
    const style = window.getComputedStyle(g);
    results.push({
      classes: g.className.substring(0, 80),
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      display: style.display,
      visibility: style.visibility,
      overflow: style.overflow,
      children: g.children.length,
    });
  });
  return results;
});
console.log('Grid elements:', JSON.stringify(gridInfo, null, 2));

// Check container height
const containerInfo = await page.evaluate(() => {
  const container = document.querySelector('[class*="overflow-hidden"]');
  if (!container) return 'No container found';
  const rect = container.getBoundingClientRect();
  const style = window.getComputedStyle(container);
  return { height: rect.height, maxHeight: style.maxHeight, overflow: style.overflow, classList: container.className.substring(0, 100) };
});
console.log('Container:', JSON.stringify(containerInfo));

await browser.close();
