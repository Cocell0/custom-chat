const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();

const appLocation = process.env.APP_LOCATION;

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const [page] = await browser.pages();

  await page.goto(appLocation);

  await page.waitForSelector('#mainOutputTemplateEditorCtn', { visible: true });

  // await new Promise(resolve => setTimeout(resolve, 600));

  await page.evaluate(() => {
    document.querySelector('#aiHelperCtn').hidden = true;
  });

  await page.click('#f');
  
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');

  await page.keyboard.sendCharacter(fs.readFileSync('index.html', 'utf8'));


  await page.evaluate(() => {
    app.saveGenerator();
  });

  await page.waitForFunction(
    'document.querySelector("#menuBarEl span.menu-item-label[data-ref=saveText]").textContent.includes("saved")'
  );

  await new Promise(resolve => setTimeout(resolve, 5000));

  await browser.close();
})();
