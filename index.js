const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1920,1080']
  });
  const page = await browser.newPage();
  await page.goto('https://sibertenis.com/', { waitUntil: 'networkidle2' });

  await page.type('#username', 'admin@ts');
  console.log('Kullanıcı adı girildi.');
  await new Promise(r => setTimeout(r, 500));

  await page.type('#password', '!demo!');
  console.log('Şifre girildi.');
  await new Promise(r => setTimeout(r, 500));

  await Promise.all([
    page.click('#login'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);
  console.log('Giriş yapıldı.');

await page.goto('https://sibertenis.com/Trainers', { waitUntil: 'networkidle2' });
  console.log('Antrenörler sayfası yüklendi.');

  await page.waitForSelector('img.img-responsive');

  const imgUrls = await page.$$eval('img.img-responsive', imgs => imgs.map(img => img.src));
  const downloadDir = path.resolve(__dirname, 'downloadedImages');
  fs.mkdirSync(downloadDir, { recursive: true });

  for (const imgUrl of imgUrls) {
    const absoluteUrl = new URL(imgUrl, page.url()).href;
    const response = await axios.get(absoluteUrl, { responseType: 'arraybuffer' });
    const fileName = path.basename(new URL(absoluteUrl).pathname);
    fs.writeFileSync(path.join(downloadDir, fileName), response.data);
    console.log(`Downloaded ${fileName}`);
  }

  // await browser.close();
})();