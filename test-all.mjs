import puppeteer from 'puppeteer';

const URL_BASE = 'http://localhost:3460';
const SUPA_URL = 'https://ydcbxqrnmnbceyzqgbui.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzczODQ2NiwiZXhwIjoyMDg5MzE0NDY2fQ.uAN6Ng7D-2XqgRLm3PbORRzaVjK0_lMEKPGf2pgYxyg';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY2J4cXJubW5iY2V5enFnYnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3Mzg0NjYsImV4cCI6MjA4OTMxNDQ2Nn0.y-lauFU8c9eTP0RJL_zveEF4JE96KiTvJ46FrvYZmfY';

// Login via Supabase API
const loginRes = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'apikey': ANON },
  body: JSON.stringify({ email: 'dmitrykokrok@gmail.com', password: 'dmitrykokrok' })
});
const loginData = await loginRes.json();

if (!loginData.access_token) {
  console.error('Login failed:', loginData);
  process.exit(1);
}
console.log('✅ Logged in');

const browser = await puppeteer.launch({ headless: false, args: ['--window-size=430,932'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true });

// Set Supabase cookies
await page.goto(URL_BASE + '/login', { waitUntil: 'networkidle2' });

// Inject auth token
await page.evaluate((token, refresh) => {
  const key = 'sb-ydcbxqrnmnbceyzqgbui-auth-token';
  const session = JSON.stringify({
    access_token: token,
    refresh_token: refresh,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now()/1000) + 3600,
  });
  localStorage.setItem(key, session);
  // Also set as cookie chunks
  document.cookie = `${key}=${encodeURIComponent(session)};path=/;max-age=3600`;
}, loginData.access_token, loginData.refresh_token);

// Navigate to lectures to test quiz
await page.goto(URL_BASE + '/lectures', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 2000));
const lectUrl = page.url();
console.log('Lectures page:', lectUrl);
await page.screenshot({ path: 'C:\\Users\\Dimax\\.openclaw\\media\\test-lectures.png' });

// Navigate to gallery
await page.goto(URL_BASE + '/gallery', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 2000));
const galUrl = page.url();
console.log('Gallery page:', galUrl);
await page.screenshot({ path: 'C:\\Users\\Dimax\\.openclaw\\media\\test-gallery.png' });

// Navigate to schedule
await page.goto(URL_BASE + '/schedule', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 2000));
console.log('Schedule page:', page.url());
await page.screenshot({ path: 'C:\\Users\\Dimax\\.openclaw\\media\\test-schedule.png' });

// Navigate to events
await page.goto(URL_BASE + '/events', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 2000));
console.log('Events page:', page.url());
await page.screenshot({ path: 'C:\\Users\\Dimax\\.openclaw\\media\\test-events.png' });

// Check news
await page.goto(URL_BASE + '/news', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 2000));
console.log('News page:', page.url());
await page.screenshot({ path: 'C:\\Users\\Dimax\\.openclaw\\media\\test-news.png' });

await browser.close();
console.log('✅ All tests done');
