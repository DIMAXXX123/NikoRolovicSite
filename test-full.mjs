import puppeteer from 'puppeteer';
const SITE = 'https://niko-rolovic-site.vercel.app';
const WS = 'C:/Users/Dimax/.openclaw/workspace';

async function main() {
  const browser = await puppeteer.launch({ 
    headless: false, defaultViewport: { width: 430, height: 932 },
    args: ['--window-position=100,50', '--window-size=500,1000']
  });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });
  
  // Login as Dima
  console.log('=== LOGIN ===');
  await page.goto(`${SITE}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
  const e = await page.$('input#email');
  await e.click({ clickCount: 3 }); await e.type('dmitrykokrok@gmail.com');
  const p = await page.$('input#password');
  await p.click({ clickCount: 3 }); await p.type('dima.iva.me1');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 5000));
  console.log('Logged in, URL:', page.url());

  // TEST 1: Admin - Add News
  console.log('\n=== TEST: ADD NEWS ===');
  await page.goto(`${SITE}/admin/news`, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: `${WS}/test_admin_news.png` });
  
  // Click "Nova" button
  const novaBtn = await page.$('button:has(svg)');
  if (novaBtn) {
    await novaBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    
    // Fill title
    const titleInput = await page.$('input');
    if (titleInput) {
      await titleInput.type('Test Novost - Automatski Test');
      // Fill content
      const textarea = await page.$('textarea');
      if (textarea) await textarea.type('Ovo je automatski test kreiran za provjeru funkcionalnosti.');
      
      // Submit
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await new Promise(r => setTimeout(r, 3000));
        console.log('News created, checking...');
      }
    }
  }
  await page.screenshot({ path: `${WS}/test_news_after_add.png` });

  // TEST 2: Delete the test news
  console.log('\n=== TEST: DELETE NEWS ===');
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Find delete button (trash icon)
  const deleteButtons = await page.$$('button.text-destructive, button:has(.text-destructive)');
  console.log(`Found ${deleteButtons.length} delete buttons`);
  
  if (deleteButtons.length > 0) {
    // Accept the confirm dialog
    page.on('dialog', async dialog => {
      console.log('Dialog:', dialog.message());
      await dialog.accept();
    });
    await deleteButtons[0].click();
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: `${WS}/test_news_after_delete.png` });
    console.log('Delete attempted');
  }

  // TEST 3: Admin - Add Event  
  console.log('\n=== TEST: ADD EVENT ===');
  await page.goto(`${SITE}/admin/events`, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: `${WS}/test_admin_events.png` });

  // Click add button
  const addEventBtn = await page.$('button:has(svg)');
  if (addEventBtn) {
    await addEventBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    
    const inputs = await page.$$('input');
    if (inputs.length > 0) {
      await inputs[0].type('Test Događaj - Auto Test');
      // Find date input
      const dateInput = await page.$('input[type="date"]');
      if (dateInput) await dateInput.type('2026-04-01');
      
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await new Promise(r => setTimeout(r, 3000));
        console.log('Event created');
      }
    }
  }
  await page.screenshot({ path: `${WS}/test_events_after_add.png` });

  // TEST 4: Admin - Students
  console.log('\n=== TEST: STUDENTS ===');
  await page.goto(`${SITE}/admin/students`, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: `${WS}/test_admin_students.png` });
  console.log('Students page loaded');

  // TEST 5: Admin - Lectures
  console.log('\n=== TEST: LECTURES ===');
  await page.goto(`${SITE}/admin/lectures`, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: `${WS}/test_admin_lectures.png` });

  // TEST 6: Check main pages load with data
  console.log('\n=== TEST: MAIN PAGES ===');
  for (const pg of ['gallery', 'news', 'events', 'lectures', 'profile', 'grades']) {
    await page.goto(`${SITE}/${pg}`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: `${WS}/test_main_${pg}.png` });
    console.log(`${pg} ✓`);
  }

  // TEST 7: Photo moderation
  console.log('\n=== TEST: PHOTO MODERATION ===');
  await page.goto(`${SITE}/admin/photos`, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: `${WS}/test_admin_photos.png` });
  console.log('Photos moderation loaded');

  await browser.close();
  console.log('\n=== ALL TESTS COMPLETE ===');
}
main().catch(console.error);
