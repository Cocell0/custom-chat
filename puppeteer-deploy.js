const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();

const appLocation = process.env.APP_LOCATION;

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 60, defaultViewport: null, args: ['--disable-notifications', '--disable-infobars', '--start-maximized', '--disable-popup-blocking'] });
  const page = await browser.newPage();

  await page.goto(appLocation);
  await page.bringToFront();

  page.on('dialog', dialog => dialog.accept());
  await page.waitForSelector('#mainOutputTemplateEditorCtn', { visible: true });

  await page.evaluate(() => {
    document.documentElement.style.userSelect = 'none';
    document.querySelector('#aiHelperCtn').hidden = true;
  });

  await new Promise(resolve => setTimeout(resolve, 200));

  await page.click('#mainOutputTemplateEditorCtn *[role="textbox"]');

  await page.evaluate(() => {
    const element = document.querySelector(mainEditor);
    if (element) {
      element.innerText = 'Setting contents...';
    }
  });

  await new Promise(resolve => setTimeout(resolve, 200));

  await page.evaluate(() => {
    app.saveGenerator();
  });

  await new Promise(resolve => setTimeout(resolve, 200));

  await page.waitForFunction(
    'window.menuBar && window.menuBar.saveState === "saved"'
  );

  await browser.close();
})();
