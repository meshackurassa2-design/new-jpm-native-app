const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request =>
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText)
  );

  console.log('Navigating to jpmtz.online...');
  await new Promise(r => setTimeout(r, 1000));
  await page.goto('https://jpmtz.online', { waitUntil: 'networkidle2' });
  console.log('Navigation complete. Waiting 2 seconds...');
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
