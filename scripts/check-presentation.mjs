import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'presentation', 'index.html');

const browser = await puppeteer.launch({ headless: true, args: ['--window-size=1920,1080'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });

await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 2000));

// Get total slides
const totalSlides = await page.evaluate(() => {
  return document.querySelectorAll('.slides > section').length;
});
console.log(`Total top-level slides: ${totalSlides}`);

// Navigate through each slide and screenshot
const outDir = 'C:\\Users\\Dimax\\.openclaw\\media';
let slideNum = 0;

for (let i = 0; i < 50; i++) {  // max 50 slides
  slideNum++;
  const filename = `pres-slide-${String(slideNum).padStart(2, '0')}.png`;
  await page.screenshot({ path: path.join(outDir, filename) });
  
  // Check if there's a login screenshot visible
  const hasLogin = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img[src*="login"]');
    for (const img of imgs) {
      const rect = img.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0) {
        return true;
      }
    }
    return false;
  });
  
  if (hasLogin) console.log(`  Slide ${slideNum}: *** HAS LOGIN IMAGE ***`);
  
  // Press right arrow
  await page.keyboard.press('ArrowRight');
  await new Promise(r => setTimeout(r, 300));
  
  // Check if we're at the end
  const isEnd = await page.evaluate(() => {
    const indices = Reveal.getIndices();
    const total = Reveal.getTotalSlides();
    return indices.h >= document.querySelectorAll('.slides > section').length - 1;
  });
  
  if (isEnd && i > totalSlides - 2) break;
}

console.log(`Total slides screenshotted: ${slideNum}`);
await browser.close();
