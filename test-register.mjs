import puppeteer from 'puppeteer';

const SITE_URL = 'https://niko-rolovic-site.vercel.app';

async function main() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 430, height: 932 }, // iPhone-like
    args: ['--window-position=100,50', '--window-size=500,1000']
  });
  
  const page = await browser.newPage();
  
  // Go to register
  console.log('Opening register page...');
  await page.goto(`${SITE_URL}/register`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.screenshot({ path: 'C:/Users/Dimax/.openclaw/workspace/test_register.png' });
  console.log('Register page loaded, screenshot taken');
  
  // Fill in registration form
  console.log('Filling form...');
  
  // Clear and fill first name
  const firstNameInput = await page.$('input#firstName');
  await firstNameInput.click({ clickCount: 3 });
  await firstNameInput.type('Dmitrij');
  
  // Clear and fill last name
  const lastNameInput = await page.$('input#lastName');
  await lastNameInput.click({ clickCount: 3 });
  await lastNameInput.type('Ivascenko');
  
  // Select class 2
  await page.select('select#class', '2');
  
  // Select section 1  
  await page.select('select#section', '1');
  
  // Clear and fill email
  const emailInput = await page.$('input#email');
  await emailInput.click({ clickCount: 3 });
  await emailInput.type('dmitrykokrok@gmail.com');
  
  // Clear and fill password
  const passwordInput = await page.$('input#password');
  await passwordInput.click({ clickCount: 3 });
  await passwordInput.type('NikoRolovic2026!');
  
  await page.screenshot({ path: 'C:/Users/Dimax/.openclaw/workspace/test_filled.png' });
  console.log('Form filled, screenshot taken');
  
  // Click submit
  console.log('Submitting...');
  await page.click('button[type="submit"]');
  
  // Wait for navigation or error
  await page.waitForNavigation({ timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));
  
  await page.screenshot({ path: 'C:/Users/Dimax/.openclaw/workspace/test_result.png' });
  console.log('Result screenshot taken');
  console.log('Current URL:', page.url());
  
  // Don't close browser so we can see
  // await browser.close();
  console.log('Done! Browser left open for inspection.');
}

main().catch(console.error);
