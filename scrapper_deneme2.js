const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const email = 'tokenstaj@gmail.com';
let profileFolder = 'Profile 3';

async function findProfileFolder(email) {
  const userHomeDir = os.homedir();
  const chromeUserDataDir = path.join(userHomeDir, 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
  
  if (!fs.existsSync(chromeUserDataDir)) {
    console.log('Chrome User Data directory not found.');
    return null;
  }
  
  const profiles = fs.readdirSync(chromeUserDataDir).filter(folder =>
    folder === 'Default' || folder.startsWith('Profile')
  );

  for (let profile of profiles) {
    const preferencesPath = path.join(chromeUserDataDir, profile, 'Preferences');
    if (fs.existsSync(preferencesPath)) {
      try {
        const preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
        if (preferences?.account_info?.[0]?.email === email) {
          console.log(`Email found in profile: ${profile}`);
          return profile;
        }
      } catch (err) {
        console.error(`Preferences parse error for ${profile}: ${err.message}`);
      }
    }
  }

  console.log('No matching profile found for the given email.');
  return null;
}

async function killAllChromeInstances() {
  return new Promise((resolve, reject) => {
    exec('taskkill /F /IM chrome.exe /T', (err, stdout, stderr) => {
      if (err && !stderr.includes("not found")) {
        console.log('Chrome processes may not be running or already closed.');
      } else {
        console.log('All Chrome instances killed.');
      }
      resolve();
    });
  });
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}

async function startProfile() {
  await killAllChromeInstances();
  await new Promise(r => setTimeout(r, 3000));

  // Basit yaklaşım - varsayılan ayarları kullan
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--start-maximized'
    ]
  });

  await startJobProcess(browser);
}

async function startJobProcess(browser) {
  let page;
  
  try {
    // Tüm sayfaları kapat ve yeni sayfa oluştur
    const pages = await browser.pages();
    console.log(`Found ${pages.length} existing pages`);
    
    for (const p of pages) {
      try { 
        await p.close(); 
        console.log('Closed existing page');
      } catch (e) { 
        console.log('Error closing page:', e.message);
      }
    }

    console.log('Creating new page...');
    page = await browser.newPage();
    
    // Viewport ayarla
    await page.setViewport({ width: 1280, height: 800 });

    // User agent ayarla
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Sayfa yüklenmeden önce URL'yi kontrol et
    console.log('Current page URL before navigation:', page.url());
    
    console.log('Navigating to Yelp page...');
    
    // Sayfaya git - daha basit yaklaşım
    const response = await page.goto('https://www.yelp.com/biz/agora-dc-washington-8', { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });

    console.log(`Navigation response status: ${response.status()}`);
    console.log(`Current page URL after navigation: ${page.url()}`);
    console.log(`Page title: ${await page.title()}`);

    // Eğer hala about:blank'teyse, farklı bir yaklaşım deneyelim
    if (page.url() === 'about:blank') {
      console.log('Still on about:blank, trying alternative approach...');
      
      // Direkt evaluate ile window.location değiştir
      await page.evaluate(() => {
        window.location.href = 'https://www.yelp.com/biz/agora-dc-washington-8';
      });
      
      // Yüklenmesini bekle
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
      console.log(`After alternative navigation: ${page.url()}`);
    }

    // Sayfada body elementinin varlığını kontrol et
    await page.waitForSelector('body', { timeout: 15000 });
    console.log('Body element found');
    
    // Biraz bekle
    await new Promise(r => setTimeout(r, 5000));

    // Sayfanın içeriğini kontrol et
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Page content length:', bodyText.length);
    console.log('First 200 characters:', bodyText.substring(0, 200));

    console.log('Starting auto scroll...');
    await autoScroll(page);

    console.log('Looking for comments...');
    
    // Yorumları bul - önce sayfada ne var kontrol edelim
    const allParagraphs = await page.$$eval('p', ps => ps.map(p => p.innerText.trim()).filter(t => t.length > 10));
    console.log('Found paragraphs:', allParagraphs.length);
    
    // Yelp spesifik selectorları deneyelim
    const comments = await page.$$eval('p[class*="comment"] span, .comment span, [data-testid*="review"] p, .review-content p', spans =>
      spans.map(el => el.innerText.trim()).filter(text => text.length > 10)
    );

    console.log('Yorum Sayısı:', comments.length);
    
    if (comments.length === 0) {
      console.log('No comments found with specific selectors. Showing first few paragraphs:');
      allParagraphs.slice(0, 5).forEach((p, i) => console.log(`P${i+1}: ${p}`));
    } else {
      comments.forEach((comment, i) => {
        console.log(`\n--- Yorum ${i + 1} ---\n${comment}`);
      });
    }

    // Sayfayı 10 saniye açık tut (debug için)
    console.log('Keeping page open for 10 seconds for inspection...');
    await new Promise(r => setTimeout(r, 10000));

  } catch (error) {
    console.error('Error during scraping:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

startProfile().catch(console.error)