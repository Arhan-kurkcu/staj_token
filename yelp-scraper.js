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

async function extractComments(page) {
  console.log('Extracting comments...');
  
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
          .filter(text => !text.includes('★') && !text.includes('$'))
      );
      
      comments = allSpans.slice(0, 10);
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
    
    const comments = await extractComments(page);
    
    console.log(`\n=== PROFİL VERSİYONU SONUÇLARI (STEALTH ENHANCED) ===`);
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
      
      const isLoggedIn = await page.evaluate(() => {
        return document.querySelector('[data-testid="user-avatar"]') || 
               document.querySelector('.user-account') ||
               document.querySelector('[aria-label*="Profile"]') ? 'Logged in' : 'Not logged in';
      });
      console.log('Login durumu:', isLoggedIn);
    }
    
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
//startScrapingWithProfile().catch(console.error);

// NOT: Basit versiyonu denemek için yukarıdaki satırı comment yapıp aşağıdakini açın:
startScraping().catch(console.error);