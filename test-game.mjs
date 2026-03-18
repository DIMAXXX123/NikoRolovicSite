import puppeteer from 'puppeteer';

const SUPA_URL = 'https://ydcbxqrnmnbceyzqgbui.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3Mzg0NjYsImV4cCI6MjA4OTMxNDQ2Nn0.y-lauFU8c9eTP0RJL_zveEF4JE96KiTvJ46FrvYZmfY';

const loginRes = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'apikey': ANON },
  body: JSON.stringify({ email: 'dmitrykokrok@gmail.com', password: 'dmitrykokrok' })
});
const loginData = await loginRes.json();
if (!loginData.access_token) { console.error('Login failed'); process.exit(1); }

const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true });

await page.goto('http://localhost:3461/login', { waitUntil: 'networkidle2' });

// Login via form
await page.type('input[type="email"]', 'dmitrykokrok@gmail.com');
await page.type('input[type="password"]', 'dmitrykokrok');
const btn = await page.$('button[type="submit"]');
if (btn) await btn.click();
await new Promise(r => setTimeout(r, 5000));

// Go to game
await page.goto('http://localhost:3461/game', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 3000));

const url = page.url();
console.log('Game URL:', url);

// Check for errors in console
page.on('console', msg => {
  if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
});

await page.screenshot({ path: 'C:\\Users\\Dimax\\.openclaw\\media\\test-game.png' });

// Check if page has content
const content = await page.evaluate(() => document.body.innerText.substring(0, 200));
console.log('Page content:', content);

const errors = await page.evaluate(() => {
  const errs = [];
  // Check if game component rendered
  if (!document.querySelector('[class*="grid"]')) errs.push('No grid found');
  if (document.querySelector('[class*="Block"]') || document.body.innerText.includes('Block Blast')) errs.push('Block Blast text found');
  return errs;
});
console.log('Checks:', errors);

await browser.close();
