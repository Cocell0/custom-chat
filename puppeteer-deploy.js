const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();

const appLocation = process.env.APP_LOCATION;

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const [page] = await browser.pages();

  await page.goto(appLocation);

  await page.waitForSelector('#mainOutputTemplateEditorCtn', { visible: true });

  await page.evaluate(() => {
    document.querySelector('#aiHelperCtn').hidden = true;
  });

  await page.click('#mainOutputTemplateEditorCtn');
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');

  await page.keyboard.sendCharacter(fs.readFileSync('index.html', 'utf8'));


  await page.evaluate(() => {
    app.saveGenerator();
  })


  await browser.close();
})();
