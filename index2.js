const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // Tarayıcıyı açık çalıştırmak için false
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.goto('https://bigpara.hurriyet.com.tr/', { waitUntil: 'domcontentloaded' });

  // Sayfa yüklenmesini bekle
  await page.waitForSelector('span.name');

  // Tüm "span.name" elementlerini tara
  const euroData = await page.evaluate(() => {
    const nameSpans = document.querySelectorAll('span.name');
    for (let span of nameSpans) {
      if (span.textContent.includes('EURO')) {
        // .name span'ının bir üst container'ına çık
        const container = span.closest('li');

        // O container içinde value1 sınıfına sahip elementi ara
        const valueSpan = container.querySelector('span.value1');
        if (valueSpan) {
          return valueSpan.textContent.trim();
        }
      }
    }
    return null; // Bulunamazsa null döndür
  });

  console.log('EURO kuru:', euroData ?? 'Veri bulunamadı');

  await browser.close();
})();