const puppeteer = require('puppeteer');

(async () => {
  const aryToTranslate = [
    { TurkishText: "Merhaba denizci, hangi limana gidiyorsun?" },
    { TurkishText: "Dün akşam hangi yemeği yedin?" },
    { TurkishText: "Hangi takımın taraftarısın?" }
  ];

  const aryResults = [];

  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();

  for (const item of aryToTranslate) {
    const turkishText = item.TurkishText;
    const url = `https://translate.google.com/?sl=tr&tl=en&text=${encodeURIComponent(turkishText)}&op=translate`;

    await page.goto(url, { waitUntil: 'networkidle2' });

    // Google Translate bazen çeviri kutusunu geç yükleyebilir, alternatif seçicilerle bekleyelim
    await page.waitForSelector('span.Y2IQFc, span.ryNqvb', { timeout: 15000 });

    // Birden fazla seçici ile çeviri sonucunu almayı deneyelim:
    let englishText = '';
    try {
      englishText = await page.$eval('span.Y2IQFc', el => el.innerText);
    } catch {
      // Eğer ilk seçici bulunamazsa, alternatif seçiciyi dene
      englishText = await page.$eval('span.ryNqvb', el => el.innerText);
    }

    aryResults.push({
      TurkishText: turkishText,
      EnglishText: englishText
    });

    // Her çeviri arasında kısa bir bekleme ekleyelim (isteğe bağlı)
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(aryResults);

  await browser.close();
})();