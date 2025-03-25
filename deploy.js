const playwright = require('playwright');
const fs = require('fs');
require('dotenv').config();

const appLocation = process.env.APP_LOCATION;

let mainText, perchanceText, modified;

try {
  mainText = fs.readFileSync('filo-index.html', 'utf8');
} catch {
  mainText = false;
}

try {
  perchanceText = fs.readFileSync('perchance.txt', 'utf8');
} catch {
  perchanceText = false;
}

(async () => {
  const browser = await playwright.chromium.launch(
    {
      headless: false,
      args: [
        "--start-maximized",
        "--user-agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5615.138 Safari/537.36'",
        "--lang=en-US"
      ]
    }
  );
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage({
    bypassCSP: true,
  });

  await page.goto(appLocation);
  await page.bringToFront();

  await page.route('**/*', (route, request) => {
    route.continue({
      headers: {
        ...request.headers(),
        'X-Frame-Options': 'ALLOW',
        'Access-Control-Allow-Origin': '*',
      },
    });
  });

  page.on('dialog', async dialog => await dialog.accept());
  await page.waitForSelector('#mainOutputTemplateEditorCtn', { state: 'visible' });

  await page.evaluate(() => {
    document.documentElement.style.userSelect = 'none';
    document.querySelector('#aiHelperCtn').hidden = true;
  });

  await page.waitForTimeout(1200);

  if (mainText) {
    await page.evaluate((mainText) => {
      document.querySelector('#mainOutputTemplateEditorCtn *[role="textbox"]').innerText = '';

      setTimeout(() => {
        document.querySelector('#mainOutputTemplateEditorCtn *[role="textbox"]').innerText = mainText;
      }, 1000);
    }, mainText);
    modified = true;
  }

  if (perchanceText) {
    await page.evaluate((perchanceText) => {
      document.querySelector('#mainModelTextEditorCtn *[role="textbox"]').innerText = '';
      setTimeout(() => {
        document.querySelector('#mainModelTextEditorCtn *[role="textbox"]').innerText = perchanceText;
      }, 1000);
    }, perchanceText);
    modified = true;
  }

  if (modified) {
    await page.evaluate(() => {
      app.saveGenerator();
    });
  }

  await page.waitForFunction(() => {
    window.menuBar && window.menuBar.saveState === 'saved'
  }, { timeout: 600000 });
  await page.waitForTimeout(1200);

  await browser.close();
})();