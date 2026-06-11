// test_render.js
import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.log('BROWSER CRASH ERROR:', err.message);
    console.log(err.stack);
  });

  try {
    console.log('Navigating to http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 5000 });
    console.log('Page loaded.');
  } catch (e) {
    console.error('Navigation failed:', e);
  }
  
  await browser.close();
}

run();
