const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const email = 'tokenstaj@gmail.com';
const targetUrl = 'https://www.yelp.com/biz/agora-dc-washington-8';

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

  console.log('No matching profile found for the given email. Using Profile 3 as fallback.');
  return 'Profile 3';
}

async function killAllChromeInstances() {
  return new Promise((resolve) => {
    exec('taskkill /F /IM chrome.exe /T', (err, stdout, stderr) => {
      if (err && !stderr.includes("not found")) {
        console.log('Chrome processes may not be running or already closed.');
      } else {
        console.log('All Chrome instances killed.');
      }
      setTimeout(resolve, 2000); // Chrome'un tamamen kapanması için bekle
    });
  });
}

async function applyStealth(page) {
  await page.evaluateOnNewDocument(() => {
    // Bot algılama önleyici ayarlar - daha kapsamlı
    Object.defineProperty(navigator, 'webdriver', { 
      get: () => undefined,
      configurable: true 
    });
    
    // Chrome nesnesini daha gerçekçi yap
    window.chrome = {
      runtime: {
        onConnect: null,
        onMessage: null
      },
      app: {
        isInstalled: false
      }
    };
    
    // Navigator özelliklerini gerçekçi yap
    Object.defineProperty(navigator, 'languages', { 
      get: () => ['en-US', 'en', 'tr-TR', 'tr'],
      configurable: true 
    });
    
    Object.defineProperty(navigator, 'plugins', { 
      get: () => [
        { name: 'Chrome PDF Plugin', length: 1 },
        { name: 'Chromium PDF Plugin', length: 1 },
        { name: 'Microsoft Edge PDF Plugin', length: 1 },
        { name: 'PDF Viewer', length: 1 },
        { name: 'Chrome PDF Viewer', length: 1 }
      ],
      configurable: true 
    });
    
    // User agent daha gerçekçi
    Object.defineProperty(navigator, 'userAgent', {
      get: () => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      configurable: true
    });
    
    // WebGL fingerprinting önleme
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) return 'Intel Inc.';
      if (parameter === 37446) return 'Intel(R) HD Graphics 620';
      return getParameter(parameter);
    };
    
    // Diğer navigator özellikleri
    Object.defineProperty(navigator, 'hardwareConcurrency', { 
      get: () => 4,
      configurable: true 
    });
    
    Object.defineProperty(navigator, 'deviceMemory', { 
      get: () => 8,
      configurable: true 
    });
    
    Object.defineProperty(navigator, 'platform', { 
      get: () => 'Win32',
      configurable: true 
    });
    
    // Permissions API
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
    
    // Screen boyutları gerçekçi
    Object.defineProperty(screen, 'width', { get: () => 1920 });
    Object.defineProperty(screen, 'height', { get: () => 1080 });
    
    // Date objesi
    Date.prototype.getTimezoneOffset = function() {
      return -180; // Turkey timezone
    };
  });
  
  // Extra headers ekle
  await page.setExtraHTTPHeaders({
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  });
}

async function simulateHumanActivity(page) {
  const delay = ms => new Promise(res => setTimeout(res, ms));
  
  console.log('Simulating human activity...');
  
  try {
    // Sayfa hala açık mı kontrol et
    if (page.isClosed()) {
      console.log('Page is closed, skipping human activity simulation');
      return;
    }

    // Random mouse movements - daha az agresif
    for (let i = 0; i < 5; i++) {
      try {
        if (page.isClosed()) break;
        
        const x = 300 + Math.floor(Math.random() * 680); // Daha güvenli alan
        const y = 200 + Math.floor(Math.random() * 400);
        await page.mouse.move(x, y, { steps: 5 });
        await delay(200 + Math.random() * 300);
      } catch (e) {
        console.log(`Mouse movement ${i} failed:`, e.message);
        break;
      }
    }
    
    // Random hovering on elements - daha güvenli
    try {
      if (!page.isClosed()) {
        const safeElements = await page.$('div, span, p').catch(() => []);
        if (safeElements.length > 0) {
          const randomElements = safeElements.sort(() => 0.5 - Math.random()).slice(0, 2);
          for (const el of randomElements) {
            try {
              if (page.isClosed()) break;
              await el.hover();
              await delay(500 + Math.random() * 300);
            } catch (e) {
              // Element hover edilemezse devam et
            }
          }
        }
      }
    } catch (e) {
      console.log('Error during element hovering:', e.message);
    }
    
  } catch (e) {
    console.log('Error during human activity simulation:', e.message);
  }
}

async function slowScroll(page) {
  console.log('Starting slow scroll...');
  
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let totalHeight = 0;
      let scrollCount = 0;
      const maxScrolls = 20; // Maksimum scroll sayısı
      const distance = 200;
      
      function scrollStep() {
        const currentScrollHeight = document.body.scrollHeight;
        const currentScroll = window.pageYOffset;
        const windowHeight = window.innerHeight;
        
        window.scrollBy(0, distance);
        totalHeight += distance;
        scrollCount++;
        
        // Sayfanın sonuna geldik veya maksimum scroll sayısına ulaştık
        if (totalHeight >= currentScrollHeight - windowHeight - 100 || scrollCount >= maxScrolls) {
          console.log('Scroll completed');
          resolve();
        } else {
          // Random delay between scrolls
          const delay = 500 + Math.random() * 800;
          setTimeout(scrollStep, delay);
        }
      }
      
      scrollStep();
    });
  });
  
  // Scroll sonrası biraz bekle
  await new Promise(r => setTimeout(r, 2000));
}

async function extractComments(page) {
  console.log('Extracting comments...');
  
  // Sayfanın yüklenmesini bekle
  await page.waitForSelector('body', { timeout: 10000 });
  
  // Çeşitli Yelp comment selektorlarını dene
  const commentSelectors = [
    'p[class*="comment"] span',
    '.comment span',
    '[data-testid*="review"] p',
    '.review-content p',
    'p span[lang]',
    '.raw__09f24__T4Ezm span',
    'span[lang="en"]',
    'p.raw__09f24__T4Ezm span'
  ];
  
  let comments = [];
  
  for (const selector of commentSelectors) {
    try {
      const foundComments = await page.$$eval(selector, spans =>
        spans.map(el => el.innerText.trim()).filter(text => text.length > 20)
      );
      
      if (foundComments.length > 0) {
        console.log(`Found ${foundComments.length} comments with selector: ${selector}`);
        comments = foundComments;
        break;
      }
    } catch (e) {
      // Bu selector çalışmadı, devam et
    }
  }
  
  // Eğer hiçbir selector çalışmazsa, tüm span'leri kontrol et
  if (comments.length === 0) {
    console.log('Trying generic span selector...');
    try {
      const allSpans = await page.$$eval('span', spans =>
        spans.map(el => el.innerText.trim())
          .filter(text => text.length > 30 && text.length < 1000)
          .filter(text => !text.includes('★') && !text.includes('$'))
      );
      
      comments = allSpans.slice(0, 10); // İlk 10 potansiyel yorumu al
    } catch (e) {
      console.log('Error extracting generic spans:', e.message);
    }
  }
  
  return comments;
}

async function copyProfileData(sourceProfile, tempDir) {
  if (!sourceProfile) return false;
  
  try {
    const sourcePath = path.join('C:\\Users\\Lenovo\\AppData\\Local\\Google\\Chrome\\User Data', sourceProfile);
    const targetPath = path.join(tempDir, 'Default');
    
    // Sadece önemli dosyaları kopyala
    const importantFiles = ['Cookies', 'Login Data', 'Preferences', 'Local Storage'];
    
    if (!fs.existsSync(sourcePath)) {
      console.log('Source profile not found');
      return false;
    }
    
    // Target directory oluştur
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    
    // Önemli dosyaları kopyala
    for (const file of importantFiles) {
      const sourceFile = path.join(sourcePath, file);
      const targetFile = path.join(targetPath, file);
      
      if (fs.existsSync(sourceFile)) {
        try {
          fs.copyFileSync(sourceFile, targetFile);
          console.log(`Copied ${file}`);
        } catch (e) {
          console.log(`Could not copy ${file}: ${e.message}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.log('Error copying profile data:', error.message);
    return false;
  }
}

async function startScrapingWithProfile() {
  let browser;
  
  try {
    // Chrome instance'larını kapat
    await killAllChromeInstances();
    
    // Profil klasörünü bul
    const profileFolder = await findProfileFolder(email);
    
    console.log('Launching browser with profile support...');
    
    if (!profileFolder) {
      console.log('Profile not found, falling back to simple version');
      return await startScraping();
    }
    
    // Gerçek profil dizinini kullan - kopyalama yapmadan
    const userDataDir = 'C:\\Users\\Lenovo\\AppData\\Local\\Google\\Chrome\\User Data';
    
    console.log(`Using profile: ${profileFolder} from ${userDataDir}`);
    
    // Browser'ı profil ile başlat
    browser = await puppeteer.launch({
      headless: false,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      userDataDir: userDataDir, // Gerçek Chrome User Data dizini
      defaultViewport: null,
      args: [
        `--profile-directory=${profileFolder}`, // Doğru profil
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--start-maximized',
        '--disable-features=VizDisplayCompositor',
        '--disable-features=TranslateUI',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps'
      ]
    });
    
    return await performScrapingWithProfile(browser);
    
  } catch (error) {
    console.error('Profile scraping failed:', error.message);
    if (browser) await browser.close();
    
    // Hata durumunda basit versiyona geç
    console.log('Falling back to simple version...');
    return await startScraping();
  }
}

// Profil için özelleştirilmiş scraping fonksiyonu
async function performScrapingWithProfile(browser) {
  try {
    // Tüm mevcut sayfaları al (profile'dan açık olanlar dahil)
    const pages = await browser.pages();
    console.log(`Found ${pages.length} existing pages from profile`);
    
    // Yeni sayfa oluştur (mevcut sayfaları kapatmadan)
    console.log('Creating new page for scraping...');
    const page = await browser.newPage();
    
    // Minimal stealth - profil zaten gerçek
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    
    // Viewport ayarla
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('Navigating directly to Yelp (using logged-in profile)...');
    
    // Profil ile direkt Yelp'e git - Google'a gerek yok
    let navigationSuccess = false;
    const maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Profile navigation attempt ${attempt}/${maxRetries}...`);
        
        const response = await page.goto(targetUrl, { 
          waitUntil: 'networkidle0',
          timeout: 45000 
        });
        
        const statusCode = response.status();
        console.log(`Navigation response status: ${statusCode}`);
        console.log(`Current URL: ${page.url()}`);
        
        if (statusCode >= 200 && statusCode < 400) {
          navigationSuccess = true;
          console.log(`Profile navigation successful!`);
          break;
        } else {
          console.log(`Status ${statusCode} - retrying...`);
        }
        
      } catch (error) {
        console.log(`Profile navigation attempt ${attempt} failed:`, error.message);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    }
    
    if (!navigationSuccess) {
      console.log('Profile navigation failed, checking if page loaded...');
      
      try {
        await page.waitForSelector('body', { timeout: 5000 });
        const title = await page.title();
        const url = page.url();
        
        if (title && url.includes('yelp.com')) {
          console.log('Page loaded despite navigation issues');
          navigationSuccess = true;
        }
      } catch (e) {
        throw new Error('Profile navigation completely failed');
      }
    }
    
    console.log(`Final page title: ${await page.title()}`);
    
    // Profil ile sayfa yüklenme bekleme süresi daha kısa
    console.log('Waiting for profile page to load...');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 3000));
    
    // İçerik kontrolü
    const initialContent = await page.evaluate(() => document.body.innerText);
    console.log(`Profile initial content length: ${initialContent.length}`);
    
    if (initialContent.length < 100) {
      console.log('Profile content seems empty, waiting more...');
      await new Promise(r => setTimeout(r, 5000));
      
      // Scroll tetikle
      await page.evaluate(() => {
        window.scrollTo(0, 200);
        window.scrollTo(0, 0);
      });
      await new Promise(r => setTimeout(r, 3000));
    }
    
    // Hafif human activity
    console.log('Profile: light human activity...');
    try {
      await page.mouse.move(640, 400, { steps: 3 });
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.log('Mouse movement failed:', e.message);
    }
    
    // Scroll
    await slowScroll(page);
    
    // Dinamik içerik bekleme
    console.log('Profile: waiting for dynamic content...');
    await new Promise(r => setTimeout(r, 2000));
    
    // Yorum çıkarma
    const comments = await extractComments(page);
    
    console.log(`\n=== PROFİL VERSİYONU SONUÇLARI ===`);
    console.log(`Toplam yorum sayısı: ${comments.length}`);
    
    if (comments.length > 0) {
      comments.forEach((comment, i) => {
        console.log(`\n--- Yorum ${i + 1} ---`);
        console.log(comment);
      });
    } else {
      console.log('Profil versiyonunda yorum bulunamadı. Sayfa detayları:');
      
      const pageContent = await page.evaluate(() => document.body.innerText);
      console.log('Sayfa içeriği uzunluğu:', pageContent.length);
      console.log('İlk 300 karakter:', pageContent.substring(0, 300));
      
      // Sayfada login durumunu kontrol et
      const isLoggedIn = await page.evaluate(() => {
        return document.querySelector('[data-testid="user-avatar"]') || 
               document.querySelector('.user-account') ||
               document.querySelector('[aria-label*="Profile"]') ? 'Logged in' : 'Not logged in';
      });
      console.log('Login durumu:', isLoggedIn);
    }
    
    // Profil versiyonunda daha uzun inceleme süresi
    console.log('\nProfil sayfası 45 saniye açık kalacak - giriş durumunu kontrol edin...');
    await new Promise(r => setTimeout(r, 45000));
    
  } catch (error) {
    console.error('Profile scraping error:', error.message);
    throw error;
  } finally {
    if (browser) {
      console.log('Profile browser kapatılıyor...');
      await browser.close();
    }
  }
}


async function performScraping(browser) {
  try {
    // Mevcut sayfaları kapat
    const pages = await browser.pages();
    console.log(`Closing ${pages.length} existing pages...`);
    
    for (const p of pages) {
      try {
        await p.close();
      } catch (e) {
        // Sayfa kapatılamazsa devam et
      }
    }
    
    // Yeni sayfa oluştur
    console.log('Creating new page...');
    const page = await browser.newPage();
    
    // Stealth ayarlarını uygula
    await applyStealth(page);
    
    // Viewport ayarla
    await page.setViewport({ width: 1280, height: 800 });
    
    // User agent ayarla
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('Navigating to target URL...');
    
    // İlk olarak Google'a git - daha doğal
    console.log('First navigating to Google...');
    await page.goto('https://www.google.com', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    
    // Referrer ayarla ve Yelp'e git
    console.log('Now navigating to Yelp with referrer...');
    await page.setExtraHTTPHeaders({
      'Referer': 'https://www.google.com/'
    });
    
    // Ana sayfaya git - birkaç farklı yöntem deneyelim
    let navigationSuccess = false;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Navigation attempt ${attempt}/${maxRetries}...`);
        
        const response = await page.goto(targetUrl, { 
          waitUntil: 'networkidle0', // networkidle0 ile daha fazla bekle
          timeout: 45000 
        });
        
        const statusCode = response.status();
        console.log(`Navigation response status: ${statusCode}`);
        console.log(`Current URL: ${page.url()}`);
        
        // Status kod kontrolü
        if (statusCode === 403) {
          console.log('403 Forbidden - Bot detected. Trying alternative approach...');
          
          if (attempt < maxRetries) {
            // Biraz bekle ve user agent değiştir
            await new Promise(r => setTimeout(r, 5000));
            
            const userAgents = [
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ];
            
            const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
            await page.setUserAgent(randomUA);
            console.log(`Trying with different user agent: ${randomUA.substring(0, 50)}...`);
            continue;
          }
        } else if (statusCode >= 200 && statusCode < 300) {
          // Başarılı response
          navigationSuccess = true;
          console.log(`Navigation successful! Current URL: ${page.url()}`);
          break;
        }
        
      } catch (error) {
        console.log(`Navigation attempt ${attempt} failed:`, error.message);
        if (attempt < maxRetries) {
          console.log('Retrying navigation...');
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    }
    
    if (!navigationSuccess) {
      console.log('Navigation failed after all attempts. Checking if page loaded anyway...');
      
      // Sayfa yüklendi mi kontrol et
      try {
        await page.waitForSelector('body', { timeout: 5000 });
        const title = await page.title();
        const url = page.url();
        
        if (title && title !== 'about:blank' && url.includes('yelp.com')) {
          console.log('Page seems to have loaded despite navigation issues');
          console.log(`Page title: ${title}`);
          navigationSuccess = true;
        }
      } catch (e) {
        console.log('Page did not load properly');
      }
    }
    
    if (!navigationSuccess) {
      throw new Error('Failed to navigate to target URL after multiple attempts');
    }
    
    console.log(`Final page title: ${await page.title()}`);
    
    // Sayfa yüklenmesini bekle - JavaScript içeriği için daha uzun bekle
    console.log('Waiting for page to fully load...');
    await page.waitForSelector('body', { timeout: 15000 });
    
    // JavaScript içeriğinin yüklenmesi için bekle
    await new Promise(r => setTimeout(r, 5000));
    
    // Sayfa içeriğini kontrol et
    const initialContent = await page.evaluate(() => document.body.innerText);
    console.log(`Initial content length: ${initialContent.length}`);
    
    if (initialContent.length < 100) {
      console.log('Content seems empty, waiting more for JavaScript to load...');
      await new Promise(r => setTimeout(r, 10000));
      
      // Sayfayı refresh etmek yerine, sadece biraz daha bekleyelim
      console.log('Trying to trigger content load with scroll...');
      try {
        await page.evaluate(() => {
          window.scrollTo(0, 100);
          window.scrollTo(0, 0);
        });
        await new Promise(r => setTimeout(r, 5000));
      } catch (e) {
        console.log('Scroll trigger failed:', e.message);
      }
    }
    
    // İnsan gibi aktivite simüle et
    await simulateHumanActivity(page);
    
    // Yavaş scroll yap
    await slowScroll(page);
    
    // JavaScript yüklenmesi için ek bekleme
    console.log('Waiting for dynamic content...');
    await new Promise(r => setTimeout(r, 3000));
    
    // Yorumları çıkar
    const comments = await extractComments(page);
    
    console.log(`\n=== SONUÇLAR ===`);
    console.log(`Toplam yorum sayısı: ${comments.length}`);
    
    if (comments.length > 0) {
      comments.forEach((comment, i) => {
        console.log(`\n--- Yorum ${i + 1} ---`);
        console.log(comment);
      });
    } else {
      console.log('Hiç yorum bulunamadı. Sayfa içeriğini kontrol ediliyor...');
      
      // Debug için sayfa içeriğinin bir kısmını göster
      const pageContent = await page.evaluate(() => document.body.innerText);
      console.log('Sayfa içeriği uzunluğu:', pageContent.length);
      console.log('İlk 500 karakter:', pageContent.substring(0, 500));
      
      // Sayfa HTML'ini de kontrol edelim
      const pageHTML = await page.content();
      console.log('HTML uzunluğu:', pageHTML.length);
      
      // Sayfada JavaScript hataları var mı kontrol et
      console.log('Checking for JavaScript errors...');
      const errors = await page.evaluate(() => {
        return window.console.error ? 'Console errors may exist' : 'No console errors detected';
      });
      console.log('JS Error check:', errors);
    }
    
    // Sayfayı uzun süre açık bırak (manual inspection için)
    console.log('\nSayfa 30 saniye açık kalacak - manuel kontrol için...');
    await new Promise(r => setTimeout(r, 30000));
    
  } catch (error) {
    console.error('Scraping sırasında hata:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (browser) {
      console.log('Browser kapatılıyor...');
      await browser.close();
    }
  }
}

// Basit versiyon - profil olmadan
async function startScraping() {
  let browser;
  
  try {
    // Chrome instance'larını kapat
    await killAllChromeInstances();
    
    console.log('Launching browser (simple version - no profile)...');
    
    // Geçici user data directory oluştur
    const tempUserDataDir = path.join(os.tmpdir(), `puppeteer_scraper_${Date.now()}`);
    console.log(`Using temporary directory: ${tempUserDataDir}`);
    
    // Browser'ı başlat
    browser = await puppeteer.launch({
      headless: false,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      userDataDir: tempUserDataDir,
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--start-maximized',
        '--disable-features=VizDisplayCompositor',
        '--disable-web-security',
        '--disable-features=TranslateUI'
      ]
    });
    
    return await performScraping(browser);
    
  } catch (error) {
    console.error('Simple scraping sırasında hata:', error.message);
    console.error('Stack trace:', error.stack);
    if (browser) await browser.close();
  }
}

// Ana fonksiyonu çalıştır
console.log('Yelp scraper başlatılıyor...');
console.log('Profil versiyonu (giriş yapmış hesap ile) çalıştırılıyor...');

// Profil versiyonunu çalıştır - captcha ve blokları aşmak için
startScrapingWithProfile().catch(console.error);

// NOT: Basit versiyonu denemek için yukarıdaki satırı comment yapıp aşağıdakini açın:
// startScraping().catch(console.error);