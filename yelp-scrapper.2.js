const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { exec } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Stealth plugin'ini ekle
puppeteer.use(StealthPlugin());

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
      setTimeout(resolve, 2000);
    });
  });
}

async function applyAdvancedStealth(page) {
  console.log('Applying advanced stealth measures...');
  
  await page.evaluateOnNewDocument(() => {
    // Enhanced bot detection prevention
    Object.defineProperty(navigator, 'webdriver', { 
      get: () => undefined,
      configurable: true 
    });
    
    // Remove automation indicators
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    
    // Chrome runtime mock
    window.chrome = {
      runtime: {
        onConnect: null,
        onMessage: null,
        connect: () => {},
        sendMessage: () => {}
      },
      app: {
        isInstalled: false,
        InstallState: {
          DISABLED: 'disabled',
          INSTALLED: 'installed',
          NOT_INSTALLED: 'not_installed'
        }
      }
    };
    
    // Enhanced navigator properties
    Object.defineProperty(navigator, 'languages', { 
      get: () => ['en-US', 'en', 'tr-TR', 'tr'],
      configurable: true 
    });
    
    Object.defineProperty(navigator, 'plugins', { 
      get: () => [
        { name: 'Chrome PDF Plugin', length: 1, filename: 'internal-pdf-viewer' },
        { name: 'Chromium PDF Plugin', length: 1, filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
        { name: 'Microsoft Edge PDF Plugin', length: 1, filename: 'pdf' },
        { name: 'PDF Viewer', length: 1, filename: 'internal-pdf-viewer' },
        { name: 'Chrome PDF Viewer', length: 1, filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
        { name: 'Native Client', length: 1, filename: 'internal-nacl-plugin' }
      ],
      configurable: true 
    });
    
    // More realistic user agent
    Object.defineProperty(navigator, 'userAgent', {
      get: () => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      configurable: true
    });
    
    // WebGL fingerprinting prevention
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) return 'Intel Inc.';
      if (parameter === 37446) return 'Intel(R) UHD Graphics 620';
      if (parameter === 7936) return 'WebKit';
      if (parameter === 7937) return 'WebKit WebGL';
      return getParameter.call(this, parameter);
    };
    
    // Enhanced navigator properties
    Object.defineProperty(navigator, 'hardwareConcurrency', { 
      get: () => 8,
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
    
    Object.defineProperty(navigator, 'vendor', { 
      get: () => 'Google Inc.',
      configurable: true 
    });
    
    // Connection info
    Object.defineProperty(navigator, 'connection', {
      get: () => ({
        effectiveType: '4g',
        rtt: 100,
        downlink: 2.0
      }),
      configurable: true
    });
    
    // Permissions API enhancement
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
    
    // Screen properties
    Object.defineProperty(screen, 'width', { get: () => 1920 });
    Object.defineProperty(screen, 'height', { get: () => 1080 });
    Object.defineProperty(screen, 'availWidth', { get: () => 1920 });
    Object.defineProperty(screen, 'availHeight', { get: () => 1040 });
    Object.defineProperty(screen, 'colorDepth', { get: () => 24 });
    
    // Date and timezone
    Date.prototype.getTimezoneOffset = function() {
      return -180; // Turkey timezone
    };
    
    // Canvas fingerprinting protection
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type === '2d') {
        const context = originalGetContext.call(this, type, ...args);
        const originalFillText = context.fillText;
        context.fillText = function(text, x, y, maxWidth) {
          // Add tiny noise to prevent fingerprinting
          return originalFillText.call(this, text, x + Math.random() * 0.1, y + Math.random() * 0.1, maxWidth);
        };
        return context;
      }
      return originalGetContext.call(this, type, ...args);
    };
    
    // Battery API mock
    if ('getBattery' in navigator) {
      navigator.getBattery = () => Promise.resolve({
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 1
      });
    }
    
    // Media devices mock
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices = () => Promise.resolve([
        { deviceId: 'default', kind: 'audioinput', label: 'Default - Microphone' },
        { deviceId: 'default', kind: 'audiooutput', label: 'Default - Speaker' },
        { deviceId: 'default', kind: 'videoinput', label: 'Default - Camera' }
      ]);
    }
  });
  
  // Enhanced headers with more realistic values
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
    'Upgrade-Insecure-Requests': '1',
    'DNT': '1'
  });
  
  console.log('Advanced stealth measures applied successfully');
}

async function simulateHumanActivity(page) {
  const delay = ms => new Promise(res => setTimeout(res, ms));
  
  console.log('Simulating human activity...');
  
  try {
    if (page.isClosed()) {
      console.log('Page is closed, skipping human activity simulation');
      return;
    }

    // More natural mouse movements
    for (let i = 0; i < 8; i++) {
      try {
        if (page.isClosed()) break;
        
        const x = 200 + Math.floor(Math.random() * 800);
        const y = 150 + Math.floor(Math.random() * 500);
        await page.mouse.move(x, y, { steps: Math.floor(Math.random() * 10) + 5 });
        await delay(150 + Math.random() * 400);
      } catch (e) {
        console.log(`Mouse movement ${i} failed:`, e.message);
        break;
      }
    }
    
    // Random clicks on safe areas
    try {
      if (!page.isClosed()) {
        const safeElements = await page.$$('body, div, span').catch(() => []);
        if (safeElements.length > 0) {
          const randomElement = safeElements[Math.floor(Math.random() * Math.min(safeElements.length, 3))];
          try {
            await randomElement.hover();
            await delay(300 + Math.random() * 200);
          } catch (e) {
            // Element hover edilemezse devam et
          }
        }
      }
    } catch (e) {
      console.log('Error during element interaction:', e.message);
    }
    
    // Random scrolling
    try {
      if (!page.isClosed()) {
        await page.evaluate(() => {
          window.scrollBy(0, Math.floor(Math.random() * 200) + 50);
        });
        await delay(500);
        await page.evaluate(() => {
          window.scrollBy(0, -(Math.floor(Math.random() * 100) + 25));
        });
      }
    } catch (e) {
      console.log('Error during random scrolling:', e.message);
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
      const maxScrolls = 25;
      const distance = 150;
      
      function scrollStep() {
        const currentScrollHeight = document.body.scrollHeight;
        const currentScroll = window.pageYOffset;
        const windowHeight = window.innerHeight;
        
        window.scrollBy(0, distance);
        totalHeight += distance;
        scrollCount++;
        
        if (totalHeight >= currentScrollHeight - windowHeight - 100 || scrollCount >= maxScrolls) {
          console.log('Scroll completed');
          resolve();
        } else {
          // More natural scroll timing
          const delay = 400 + Math.random() * 600;
          setTimeout(scrollStep, delay);
        }
      }
      
      scrollStep();
    });
  });
  
  await new Promise(r => setTimeout(r, 3000));
}

async function extractCommentsFromCurrentPage(page) {
  console.log('Extracting comments from current page...');
  
  await page.waitForSelector('body', { timeout: 10000 });
  
  const commentSelectors = [
    'p[class*="comment"] span',
    '.comment span',
    '[data-testid*="review"] p',
    '.review-content p',
    'p span[lang]',
    '.raw__09f24__T4Ezm span',
    'span[lang="en"]',
    'p.raw__09f24__T4Ezm span',
    '[class*="reviewText"] span',
    '[class*="review-text"] span',
    '.user-review span'
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
  
  if (comments.length === 0) {
    console.log('Trying generic span selector...');
    try {
      const allSpans = await page.$$eval('span', spans =>
        spans.map(el => el.innerText.trim())
          .filter(text => text.length > 30 && text.length < 1000)
          .filter(text => !text.includes('★') && !text.includes('stars'))
          .filter(text => !/^\d+\/\d+\/\d+$/.test(text))
          .filter(text => !text.match(/^(Elite|Yelping|Member)/))
      );
      
      comments = allSpans.slice(0, 10);
    } catch (e) {
      console.log('Error extracting generic spans:', e.message);
    }
  }
  
  return comments;
}

// Missing extractComments function - wrapper for single page extraction
async function extractComments(page) {
  return await extractCommentsFromCurrentPage(page);
}

async function getNextPageUrl(page, currentPage) {
  try {
    // Sayfalama linklerini ara
    const paginationLinks = await page.$$eval('.pagination-link-component__09f24__JRiQO', links => {
      return links.map(link => ({
        href: link.href,
        text: link.textContent.trim(),
        pageNumber: parseInt(link.querySelector('div')?.textContent?.trim() || '0')
      }));
    });
    
    console.log(`Found pagination links:`, paginationLinks.map(l => `Page ${l.pageNumber}: ${l.href}`));
    
    // Bir sonraki sayfayı bul
    const nextPageLink = paginationLinks.find(link => link.pageNumber === currentPage + 1);
    
    if (nextPageLink) {
      console.log(`Next page found: ${nextPageLink.href}`);
      return nextPageLink.href;
    }
    
    // Alternatif olarak "Next" buttonunu ara
    const nextButton = await page.$('a[aria-label*="Next"]');
    if (nextButton) {
      const nextUrl = await page.evaluate(btn => btn.href, nextButton);
      console.log(`Next button found: ${nextUrl}`);
      return nextUrl;
    }
    
    console.log('No next page found');
    return null;
    
  } catch (error) {
    console.log('Error finding next page:', error.message);
    return null;
  }
}

async function extractAllComments(page, baseUrl) {
  console.log('Starting to extract all comments from all pages...');
  
  let allComments = [];
  let currentPage = 1;
  let maxPages = 50; // Güvenlik için maksimum sayfa limiti
  
  while (currentPage <= maxPages) {
    console.log(`\n=== SAYFA ${currentPage} İŞLENİYOR ===`);
    
    try {
      // Mevcut sayfadaki yorumları çek
      await slowScroll(page);
      await new Promise(r => setTimeout(r, 3000));
      
      const pageComments = await extractCommentsFromCurrentPage(page);
      console.log(`Sayfa ${currentPage}'de ${pageComments.length} yorum bulundu`);
      
      if (pageComments.length > 0) {
        // Yorumları numara ile ekle
        const numberedComments = pageComments.map((comment, index) => ({
          page: currentPage,
          commentNumber: (currentPage - 1) * 10 + index + 1,
          text: comment
        }));
        
        allComments.push(...numberedComments);
        console.log(`Toplam yorum sayısı: ${allComments.length}`);
      } else {
        console.log(`Sayfa ${currentPage}'de yorum bulunamadı`);
        
        // Eğer ilk sayfada yorum yoksa dur
        if (currentPage === 1) {
          console.log('İlk sayfada yorum bulunamadı, işlem durduruluyor');
          break;
        }
      }
      
      // Bir sonraki sayfa URL'ini bul
      const nextPageUrl = await getNextPageUrl(page, currentPage);
      
      if (!nextPageUrl) {
        console.log(`Son sayfaya ulaşıldı (Sayfa ${currentPage})`);
        break;
      }
      
      // Bir sonraki sayfaya git
      console.log(`Sayfa ${currentPage + 1}'e geçiliyor: ${nextPageUrl}`);
      
      // İnsan gibi aktivite simüle et
      await simulateHumanActivity(page);
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
      
      try {
        const response = await page.goto(nextPageUrl, { 
          waitUntil: 'networkidle0', 
          timeout: 45000 
        });
        
        const statusCode = response.status();
        console.log(`Sayfa ${currentPage + 1} yüklendi, status: ${statusCode}`);
        
        if (statusCode >= 400) {
          console.log(`Sayfa ${currentPage + 1} yüklenemedi, işlem durduruluyor`);
          break;
        }
        
        // Sayfa yüklenme bekleme
        await page.waitForSelector('body', { timeout: 10000 });
        await new Promise(r => setTimeout(r, 3000));
        
        currentPage++;
        
      } catch (navError) {
        console.log(`Sayfa ${currentPage + 1}'e geçiş hatası: ${navError.message}`);
        break;
      }
      
    } catch (pageError) {
      console.log(`Sayfa ${currentPage} işleme hatası: ${pageError.message}`);
      currentPage++;
      continue;
    }
  }
  
  console.log(`\n=== TÜM SAYFALAR TAMAMLANDI ===`);
  console.log(`Toplam işlenen sayfa: ${currentPage - 1}`);
  console.log(`Toplam çekilen yorum: ${allComments.length}`);
  
  return allComments;
}

async function copyProfileData(sourceProfile, tempDir) {
  if (!sourceProfile) return false;
  
  try {
    const sourcePath = path.join('C:\\Users\\Lenovo\\AppData\\Local\\Google\\Chrome\\User Data', sourceProfile);
    const targetPath = path.join(tempDir, 'Default');
    
    const importantFiles = ['Cookies', 'Login Data', 'Preferences', 'Local Storage'];
    
    if (!fs.existsSync(sourcePath)) {
      console.log('Source profile not found');
      return false;
    }
    
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    
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
    await killAllChromeInstances();
    
    const profileFolder = await findProfileFolder(email);
    
    console.log('Launching browser with profile support and stealth...');
    
    if (!profileFolder) {
      console.log('Profile not found, falling back to simple version');
      return await startScraping();
    }
    
    const userDataDir = 'C:\\Users\\Lenovo\\AppData\\Local\\Google\\Chrome\\User Data';
    
    console.log(`Using profile: ${profileFolder} from ${userDataDir}`);
    
    // Enhanced browser launch with stealth
    browser = await puppeteer.launch({
      headless: false,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      userDataDir: userDataDir,
      defaultViewport: null,
      args: [
        `--profile-directory=${profileFolder}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--start-maximized',
        '--disable-features=VizDisplayCompositor',
        '--disable-features=TranslateUI',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps',
        '--disable-web-security',
        '--disable-features=site-per-process',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-component-update',
        '--disable-client-side-phishing-detection',
        '--disable-sync',
        '--metrics-recording-only',
        '--no-report-upload',
        '--allow-running-insecure-content',
        '--disable-component-extensions-with-background-pages',
        '--disable-extensions',
        '--mute-audio'
      ]
    });
    
    return await performScrapingWithProfile(browser);
    
  } catch (error) {
    console.error('Profile scraping failed:', error.message);
    if (browser) await browser.close();
    
    console.log('Falling back to simple version...');
    return await startScraping();
  }
}

async function performScrapingWithProfile(browser) {
  try {
    const pages = await browser.pages();
    console.log(`Found ${pages.length} existing pages from profile`);
    
    console.log('Creating new page for scraping...');
    const page = await browser.newPage();
    
    // Apply enhanced stealth even with profile
    await applyAdvancedStealth(page);
    
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('Navigating directly to Yelp (using logged-in profile)...');
    
    let navigationSuccess = false;
    const maxRetries = 3;
    
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
          await new Promise(r => setTimeout(r, 5000));
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
    
    console.log('Waiting for profile page to load...');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 5000));
    
    const initialContent = await page.evaluate(() => document.body.innerText);
    console.log(`Profile initial content length: ${initialContent.length}`);
    
    if (initialContent.length < 100) {
      console.log('Profile content seems empty, waiting more...');
      await new Promise(r => setTimeout(r, 8000));
      
      await page.evaluate(() => {
        window.scrollTo(0, 200);
        window.scrollTo(0, 0);
      });
      await new Promise(r => setTimeout(r, 3000));
    }
    
    console.log('Profile: enhanced human activity...');
    await simulateHumanActivity(page);
    
    await slowScroll(page);
    
    console.log('Profile: waiting for dynamic content...');
    await new Promise(r => setTimeout(r, 3000));
    
    const allComments = await extractAllComments(page, targetUrl);
    
    console.log(`\n=== PROFİL VERSİYONU SONUÇLARI (STEALTH ENHANCED) ===`);
    console.log(`Toplam yorum sayısı: ${allComments.length}`);
    
    if (allComments.length > 0) {
      allComments.forEach((commentObj, i) => {
        console.log(`\n--- Sayfa ${commentObj.page}, Yorum ${commentObj.commentNumber} ---`);
        console.log(commentObj.text);
      });
    } else {
      console.log('Profil versiyonunda yorum bulunamadı. Sayfa detayları:');
      
      const pageContent = await page.evaluate(() => document.body.innerText);
      console.log('Sayfa içeriği uzunluğu:', pageContent.length);
      console.log('İlk 300 karakter:', pageContent.substring(0, 300));
      
      const isLoggedIn = await page.evaluate(() => {
        return document.querySelector('[data-testid="user-avatar"]') || 
               document.querySelector('.user-account') ||
               document.querySelector('[aria-label*="Profile"]') ? 'Logged in' : 'Not logged in';
      });
      console.log('Login durumu:', isLoggedIn);
    }
    
    console.log('\nProfil sayfası 45 saniye açık kalacak - giriş durumunu kontrol edin...');
    await new Promise(r => setTimeout(r, 45000));
    
    return allComments;
    
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
    const pages = await browser.pages();
    console.log(`Closing ${pages.length} existing pages...`);
    
    for (const p of pages) {
      try {
        await p.close();
      } catch (e) {
        // Sayfa kapatılamazsa devam et
      }
    }
    
    console.log('Creating new page with stealth...');
    const page = await browser.newPage();
    
    // Apply enhanced stealth measures
    await applyAdvancedStealth(page);
    
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('Navigating to target URL with stealth...');
    
    // First navigate to Google for more natural browsing
    console.log('First navigating to Google...');
    await page.goto('https://www.google.com', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    
    // Add some human-like activity on Google
    await simulateHumanActivity(page);
    
    console.log('Now navigating to Yelp with referrer...');
    await page.setExtraHTTPHeaders({
      'Referer': 'https://www.google.com/'
    });
    
    let navigationSuccess = false;
    const maxRetries = 4;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Navigation attempt ${attempt}/${maxRetries} with stealth...`);
        
        const response = await page.goto(targetUrl, { 
          waitUntil: 'networkidle0',
          timeout: 60000 
        });
        
        const statusCode = response.status();
        console.log(`Navigation response status: ${statusCode}`);
        console.log(`Current URL: ${page.url()}`);
        
        if (statusCode === 403 || statusCode === 429) {
          console.log(`${statusCode} detected - Bot blocking. Applying additional stealth measures...`);
          
          if (attempt < maxRetries) {
            // Wait longer and apply more stealth
            await new Promise(r => setTimeout(r, 8000 + Math.random() * 5000));
            
            // Rotate user agent
            const userAgents = [
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ];
            
            const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
            await page.setUserAgent(randomUA);
            console.log(`Switching to user agent: ${randomUA.substring(0, 50)}...`);
            continue;
          }
        } else if (statusCode >= 200 && statusCode < 300) {
          navigationSuccess = true;
          console.log(`Stealth navigation successful! Current URL: ${page.url()}`);
          break;
        }
        
      } catch (error) {
        console.log(`Navigation attempt ${attempt} failed:`, error.message);
        if (attempt < maxRetries) {
          console.log('Retrying with longer delay...');
          await new Promise(r => setTimeout(r, 5000 + Math.random() * 3000));
        }
      }
    }
    
    if (!navigationSuccess) {
      console.log('Navigation failed after all attempts. Checking if page loaded anyway...');
      
      try {
        await page.waitForSelector('body', { timeout: 8000 });
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
      throw new Error('Failed to navigate to target URL after multiple stealth attempts');
    }
    
    console.log(`Final page title: ${await page.title()}`);
    
    console.log('Waiting for page to fully load with stealth...');
    await page.waitForSelector('body', { timeout: 15000 });
    
    await new Promise(r => setTimeout(r, 8000));
    
    const initialContent = await page.evaluate(() => document.body.innerText);
    console.log(`Initial content length: ${initialContent.length}`);
    
    if (initialContent.length < 100) {
      console.log('Content seems empty, waiting more for JavaScript to load...');
      await new Promise(r => setTimeout(r, 12000));
      
      console.log('Trying to trigger content load with natural scroll...');
      try {
        await page.evaluate(() => {
          window.scrollTo(0, 150);
          setTimeout(() => window.scrollTo(0, 0), 1000);
        });
        await new Promise(r => setTimeout(r, 5000));
      } catch (e) {
        console.log('Scroll trigger failed:', e.message);
      }
    }
    
    // Enhanced human activity simulation
    await simulateHumanActivity(page);
    
    await slowScroll(page);
    
    console.log('Waiting for dynamic content with stealth...');
    await new Promise(r => setTimeout(r, 5000));
    
    const allComments = await extractAllComments(page, targetUrl);
    
    console.log(`\n=== SONUÇLAR (STEALTH ENHANCED) ===`);
    console.log(`Toplam yorum sayısı: ${allComments.length}`);
    
    if (allComments.length > 0) {
      allComments.forEach((commentObj, i) => {
        console.log(`\n--- Sayfa ${commentObj.page}, Yorum ${commentObj.commentNumber} ---`);
        console.log(commentObj.text);
      });
      
      // Özet bilgi
      const pageStats = {};
      allComments.forEach(comment => {
        pageStats[comment.page] = (pageStats[comment.page] || 0) + 1;
      });
      
      console.log(`\n=== SAYFA ÖZETİ ===`);
      Object.keys(pageStats).forEach(pageNum => {
        console.log(`Sayfa ${pageNum}: ${pageStats[pageNum]} yorum`);
      });
      
    } else {
      console.log('Hiç yorum bulunamadı. Sayfa içeriğini kontrol ediliyor...');
      
      const pageContent = await page.evaluate(() => document.body.innerText);
      console.log('Sayfa içeriği uzunluğu:', pageContent.length);
      console.log('İlk 500 karakter:', pageContent.substring(0, 500));
      
      const pageHTML = await page.content();
      console.log('HTML uzunluğu:', pageHTML.length);
      
      console.log('Checking for JavaScript errors...');
      const errors = await page.evaluate(() => {
        return window.console.error ? 'Console errors may exist' : 'No console errors detected';
      });
      console.log('JS Error check:', errors);
    }
    
    console.log('\nSayfa 30 saniye açık kalacak - manuel kontrol için...');
    await new Promise(r => setTimeout(r, 30000));
    
    return allComments;
    
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
    await killAllChromeInstances();
    
    console.log('Launching browser (simple version - no profile) with enhanced stealth...');
    
    const tempUserDataDir = path.join(os.tmpdir(), `puppeteer_scraper_${Date.now()}`);
    console.log(`Using temporary directory: ${tempUserDataDir}`);
    
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
        '--disable-features=TranslateUI',
        '--disable-features=site-per-process',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-component-update',
        '--disable-client-side-phishing-detection',
        '--disable-sync',
        '--metrics-recording-only',
        '--no-report-upload',
        '--allow-running-insecure-content',
        '--disable-component-extensions-with-background-pages',
        '--mute-audio'
      ]
    });
    
    return await performScraping(browser);
    
  } catch (error) {
    console.error('Simple scraping sırasında hata:', error.message);
    console.error('Stack trace:', error.stack);
    if (browser) await browser.close();
  }
}

// Veri kaydetme fonksiyonları
async function saveCommentsToFile(comments, filename = 'yelp_comments.json') {
  try {
    const data = {
      timestamp: new Date().toISOString(),
      url: targetUrl,
      totalComments: comments.length,
      extractedAt: new Date().toLocaleString('tr-TR'),
      comments: comments
    };
    
    const filePath = path.join(__dirname, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`\n=== VERİ KAYDETME ===`);
    console.log(`Yorumlar başarıyla kaydedildi: ${filePath}`);
    console.log(`Toplam kayıt: ${comments.length} yorum`);
    
    return filePath;
  } catch (error) {
    console.error('Dosya kaydetme hatası:', error.message);
    return null;
  }
}

async function saveCommentsToCSV(comments, filename = 'yelp_comments.csv') {
  try {
    const csvHeaders = 'Page,Comment Number,Comment Text,Length,Extracted At\n';
    let csvContent = csvHeaders;
    
    comments.forEach(comment => {
      const escapedText = comment.text.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, ' ');
      csvContent += `${comment.page},"${comment.commentNumber}","${escapedText}",${comment.text.length},"${new Date().toLocaleString('tr-TR')}"\n`;
    });
    
    const filePath = path.join(__dirname, filename);
    fs.writeFileSync(filePath, csvContent, 'utf8');
    console.log(`CSV dosyası başarıyla kaydedildi: ${filePath}`);
    
    return filePath;
  } catch (error) {
    console.error('CSV kaydetme hatası:', error.message);
    return null;
  }
}

// Veri analizi fonksiyonları
function analyzeComments(comments) {
  console.log(`\n=== YORUM ANALİZİ ===`);
  
  if (comments.length === 0) {
    console.log('Analiz için yorum bulunamadı');
    return;
  }
  
  // Temel istatistikler
  const totalComments = comments.length;
  const avgLength = Math.round(comments.reduce((sum, c) => sum + c.text.length, 0) / totalComments);
  const maxLength = Math.max(...comments.map(c => c.text.length));
  const minLength = Math.min(...comments.map(c => c.text.length));
  
  console.log(`Toplam yorum: ${totalComments}`);
  console.log(`Ortalama uzunluk: ${avgLength} karakter`);
  console.log(`En uzun yorum: ${maxLength} karakter`);
  console.log(`En kısa yorum: ${minLength} karakter`);
  
  // Sayfa dağılımı
  const pageDistribution = {};
  comments.forEach(comment => {
    pageDistribution[comment.page] = (pageDistribution[comment.page] || 0) + 1;
  });
  
  console.log(`\nSayfa dağılımı:`);
  Object.keys(pageDistribution).forEach(page => {
    console.log(`  Sayfa ${page}: ${pageDistribution[page]} yorum`);
  });
  
  // Uzunluk kategorileri
  const shortComments = comments.filter(c => c.text.length < 100).length;
  const mediumComments = comments.filter(c => c.text.length >= 100 && c.text.length < 300).length;
  const longComments = comments.filter(c => c.text.length >= 300).length;
  
  console.log(`\nUzunluk dağılımı:`);
  console.log(`  Kısa (0-99 kar.): ${shortComments} yorum`);
  console.log(`  Orta (100-299 kar.): ${mediumComments} yorum`);
  console.log(`  Uzun (300+ kar.): ${longComments} yorum`);
  
  // En uzun ve en kısa yorumları göster
  const longestComment = comments.reduce((prev, current) => 
    prev.text.length > current.text.length ? prev : current
  );
  const shortestComment = comments.reduce((prev, current) => 
    prev.text.length < current.text.length ? prev : current
  );
  
  console.log(`\nEn uzun yorum (${longestComment.text.length} karakter):`);
  console.log(`"${longestComment.text.substring(0, 150)}..."`);
  
  console.log(`\nEn kısa yorum (${shortestComment.text.length} karakter):`);
  console.log(`"${shortestComment.text}"`);
}

// Gelişmiş hata yönetimi
async function handleScrapingError(error, page, attempt = 1) {
  console.error(`\n=== HATA YÖNETİMİ (Deneme ${attempt}) ===`);
  console.error(`Hata türü: ${error.name}`);
  console.error(`Hata mesajı: ${error.message}`);
  
  if (page && !page.isClosed()) {
    try {
      const url = page.url();
      const title = await page.title();
      console.log(`Mevcut URL: ${url}`);
      console.log(`Sayfa başlığı: ${title}`);
      
      // Sayfa screenshot al (hata ayıklama için)
      const screenshotPath = path.join(__dirname, `error_screenshot_${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`Hata screenshot kaydedildi: ${screenshotPath}`);
      
    } catch (debugError) {
      console.log('Debug bilgileri alınamadı:', debugError.message);
    }
  }
  
  // Yeniden deneme stratejisi
  if (attempt < 3) {
    const waitTime = attempt * 5000; // Her denemede daha uzun bekle
    console.log(`${waitTime/1000} saniye bekleyip yeniden denenecek...`);
    await new Promise(r => setTimeout(r, waitTime));
    return true; // Yeniden dene
  }
  
  return false; // Artık deneme
}

// Proxy desteği (gelişmiş)
async function setupProxy(page, proxyConfig = null) {
  if (!proxyConfig) return;
  
  try {
    console.log('Proxy ayarları uygulanıyor...');
    
    await page.authenticate({
      username: proxyConfig.username || '',
      password: proxyConfig.password || ''
    });
    
    console.log(`Proxy kuruldu: ${proxyConfig.host}:${proxyConfig.port}`);
  } catch (error) {
    console.error('Proxy kurulum hatası:', error.message);
  }
}

// Ana execution fonksiyonu
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('🚀 YELP SCRAPER BAŞLATILIYOR (ENHANCED VERSION)');
  console.log(`${'='.repeat(60)}`);
  console.log(`Hedef URL: ${targetUrl}`);
  console.log(`Email: ${email}`);
  console.log(`Başlangıç zamanı: ${new Date().toLocaleString('tr-TR')}`);
  console.log(`${'='.repeat(60)}\n`);
  
  const startTime = Date.now();
  let allComments = [];
  
  try {
    // Profil versiyonunu dene
    console.log('🔑 Profil versiyonu deneniyor...');
    allComments = await startScrapingWithProfile();
    
    if (!allComments || allComments.length === 0) {
      console.log('⚠️ Profil versiyonu başarısız, basit versiyon deneniyor...');
      allComments = await startScraping();
    }
    
  } catch (error) {
    console.error('❌ Ana scraping hatası:', error.message);
    
    // Son çare olarak basit versiyonu dene
    try {
      console.log('🔄 Son çare: Basit versiyon deneniyor...');
      allComments = await startScraping();
    } catch (fallbackError) {
      console.error('❌ Tüm yöntemler başarısız:', fallbackError.message);
    }
  }
  
  // Sonuçları işle
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 İŞLEM TAMAMLANDI');
  console.log(`${'='.repeat(60)}`);
  console.log(`Süre: ${duration} saniye`);
  console.log(`Toplam yorum: ${allComments ? allComments.length : 0}`);
  
  if (allComments && allComments.length > 0) {
    // Analiz yap
    analyzeComments(allComments);
    
    // Dosyalara kaydet
    const jsonPath = await saveCommentsToFile(allComments, `yelp_comments_${Date.now()}.json`);
    const csvPath = await saveCommentsToCSV(allComments, `yelp_comments_${Date.now()}.csv`);
    
    console.log(`\n✅ Veriler başarıyla kaydedildi:`);
    console.log(`📄 JSON: ${jsonPath}`);
    console.log(`📊 CSV: ${csvPath}`);
    
    // Özet rapor
    console.log(`\n${'='.repeat(60)}`);
    console.log('📋 ÖZET RAPOR');
    console.log(`${'='.repeat(60)}`);
    console.log(`🎯 Hedef: ${targetUrl}`);
    console.log(`⏱️ Süre: ${duration} saniye (${Math.round(duration/60)} dakika)`);
    console.log(`💬 Toplam Yorum: ${allComments.length}`);
    console.log(`📄 Ortalama Uzunluk: ${Math.round(allComments.reduce((sum, c) => sum + c.text.length, 0) / allComments.length)} karakter`);
    console.log(`🏆 Başarı Oranı: ${allComments.length > 0 ? '100%' : '0%'}`);
    console.log(`${'='.repeat(60)}\n`);
    
  } else {
    console.log(`\n❌ Hiç yorum çekilemedi. Olası sebepler:`);
    console.log(`   • Bot algılama sistemleri`);
    console.log(`   • Sayfa yapısı değişikliği`);
    console.log(`   • Network/bağlantı sorunları`);
    console.log(`   • Profil/authentication sorunları`);
  }
  
  console.log(`\n🎉 Scraper kapatılıyor...`);
}

// Global hata yakalayıcılar
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Scraper'ı başlat
if (require.main === module) {
  main().catch(console.error);
}

// Export fonksiyonlar (module olarak kullanım için)
module.exports = {
  startScrapingWithProfile,
  startScraping,
  extractAllComments,
  saveCommentsToFile,
  saveCommentsToCSV,
  analyzeComments,
  main
};m