const puppeteer = require('puppeteer');
const sql = require('mssql');
require('dotenv').config();

// Veritabanı bağlantı ayarları (mevcut projenizden)
const dbConfig = {
    user: 'staj',
    password: 'staj1234',
    server: 'localhost',
    port: 51538,
    database: 'ReviewDB',
    options: { encrypt: false, enableArithAbort: true }
};

class YelpScraper {
    constructor() {
        this.pool = null;
        this.browser = null;
    }

    // Veritabanı bağlantısı
    async initializeDatabase() {
        try {
            this.pool = await sql.connect(dbConfig);
            console.log('[SUCCESS] Veritabanına bağlanıldı.');
            await this.createReviewsTable();
        } catch (err) {
            console.error('[ERROR] Veritabanı bağlantı hatası:', err);
            throw err;
        }
    }

    // Reviews tablosu oluştur
    async createReviewsTable() {
        try {
            await this.pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='YelpReviews' AND xtype='U')
                CREATE TABLE YelpReviews (
                    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
                    RestaurantName NVARCHAR(255),
                    RestaurantURL NVARCHAR(500),
                    ReviewerName NVARCHAR(255),
                    ReviewerLocation NVARCHAR(255),
                    Rating INT,
                    ReviewText NVARCHAR(MAX),
                    ReviewDate NVARCHAR(100),
                    UsefulCount INT DEFAULT 0,
                    FunnyCount INT DEFAULT 0,
                    CoolCount INT DEFAULT 0,
                    ScrapedAt DATETIME DEFAULT GETDATE(),
                    CONSTRAINT UK_YelpReviews_Unique UNIQUE (RestaurantURL, ReviewerName, ReviewText)
                )
            `);
            console.log('[SUCCESS] YelpReviews tablosu hazır.');
        } catch (err) {
            console.error('[ERROR] Tablo oluşturma hatası:', err);
        }
    }

    // Puppeteer tarayıcısını başlat
    async initializeBrowser() {
        try {
            this.browser = await puppeteer.launch({
                headless: false, // Debugging için false, production'da true yapın
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ],
                defaultViewport: { width: 1366, height: 768 }
            });
            console.log('[SUCCESS] Tarayıcı başlatıldı.');
        } catch (err) {
            console.error('[ERROR] Tarayıcı başlatma hatası:', err);
            throw err;
        }
    }

    // Rastgele gecikme (anti-detection)
    async randomDelay(min = 1000, max = 3000) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Yelp yorumlarını çek
    async scrapeYelpReviews(restaurantUrl, maxPages = 3) {
        let page;
        try {
            page = await this.browser.newPage();
            
            // User-Agent ayarla (bot detection'dan kaçınmak için)
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // İlk sayfaya git
            console.log(`[INFO] ${restaurantUrl} adresine gidiliyor...`);
            await page.goto(restaurantUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            // Restaurant adını al
            const restaurantName = await this.getRestaurantName(page);
            console.log(`[INFO] Restoran: ${restaurantName}`);

            let allReviews = [];
            let currentPage = 1;

            while (currentPage <= maxPages) {
                console.log(`[INFO] Sayfa ${currentPage} işleniyor...`);
                
                await this.randomDelay(2000, 4000);

                // Yorumları çek
                const reviews = await this.extractReviewsFromPage(page, restaurantName, restaurantUrl);
                allReviews.push(...reviews);
                
                console.log(`[INFO] Sayfa ${currentPage}'den ${reviews.length} yorum çekildi.`);

                // Sonraki sayfaya git
                const hasNext = await this.goToNextPage(page);
                if (!hasNext || currentPage >= maxPages) {
                    break;
                }
                currentPage++;
            }

            console.log(`[SUCCESS] Toplam ${allReviews.length} yorum çekildi.`);
            return allReviews;

        } catch (err) {
            console.error('[ERROR] Scraping hatası:', err);
            return [];
        } finally {
            if (page) await page.close();
        }
    }

    // Restaurant adını al
    async getRestaurantName(page) {
        try {
            const restaurantName = await page.evaluate(() => {
                const nameElement = document.querySelector('h1[data-testid="page-title"]') || 
                                  document.querySelector('h1.y-css-olzveb') ||
                                  document.querySelector('h1');
                return nameElement ? nameElement.innerText.trim() : 'Unknown Restaurant';
            });
            return restaurantName;
        } catch (err) {
            console.warn('[WARN] Restaurant adı alınamadı:', err.message);
            return 'Unknown Restaurant';
        }
    }

    // Sayfadaki yorumları çek
    async extractReviewsFromPage(page, restaurantName, restaurantUrl) {
        try {
            // Sayfanın yüklenmesini bekle
            await page.waitForSelector('[data-testid="reviews-list"]', { timeout: 10000 });
            
            const reviews = await page.evaluate(() => {
                const reviewElements = document.querySelectorAll('[data-testid="reviews-list"] > li');
                const extractedReviews = [];

                reviewElements.forEach(reviewElement => {
                    try {
                        // Reviewer adı
                        const reviewerNameEl = reviewElement.querySelector('a[href*="/user_details"] span') ||
                                             reviewElement.querySelector('[data-testid="reviewer-name"]');
                        const reviewerName = reviewerNameEl ? reviewerNameEl.innerText.trim() : 'Anonymous';

                        // Reviewer lokasyonu
                        const reviewerLocationEl = reviewElement.querySelector('[data-testid="reviewer-location"]') ||
                                                 reviewElement.querySelector('span[class*="user-location"]');
                        const reviewerLocation = reviewerLocationEl ? reviewerLocationEl.innerText.trim() : '';

                        // Rating (yıldız sayısı)
                        const ratingEl = reviewElement.querySelector('[role="img"][aria-label*="star rating"]');
                        let rating = 0;
                        if (ratingEl) {
                            const ariaLabel = ratingEl.getAttribute('aria-label');
                            const ratingMatch = ariaLabel.match(/(\d+)\s*star/);
                            rating = ratingMatch ? parseInt(ratingMatch[1]) : 0;
                        }

                        // Yorum metni
                        const reviewTextEl = reviewElement.querySelector('[data-testid="review-text"] span') ||
                                           reviewElement.querySelector('.raw__09f24__T4Ezm') ||
                                           reviewElement.querySelector('p[data-testid="review-text"]');
                        const reviewText = reviewTextEl ? reviewTextEl.innerText.trim() : '';

                        // Tarih
                        const reviewDateEl = reviewElement.querySelector('[data-testid="review-date"]') ||
                                           reviewElement.querySelector('time') ||
                                           reviewElement.querySelector('span[class*="date"]');
                        const reviewDate = reviewDateEl ? reviewDateEl.innerText.trim() : '';

                        // Useful/Funny/Cool counts
                        const usefulEl = reviewElement.querySelector('[aria-label*="Useful"]');
                        const funnyEl = reviewElement.querySelector('[aria-label*="Funny"]');
                        const coolEl = reviewElement.querySelector('[aria-label*="Cool"]');

                        const usefulCount = usefulEl ? parseInt(usefulEl.innerText.match(/\d+/)?.[0] || '0') : 0;
                        const funnyCount = funnyEl ? parseInt(funnyEl.innerText.match(/\d+/)?.[0] || '0') : 0;
                        const coolCount = coolEl ? parseInt(coolEl.innerText.match(/\d+/)?.[0] || '0') : 0;

                        // Sadece geçerli yorumları ekle
                        if (reviewerName && reviewText && rating > 0) {
                            extractedReviews.push({
                                reviewerName,
                                reviewerLocation,
                                rating,
                                reviewText,
                                reviewDate,
                                usefulCount,
                                funnyCount,
                                coolCount
                            });
                        }
                    } catch (err) {
                        console.warn('Yorum çıkarma hatası:', err);
                    }
                });

                return extractedReviews;
            });

            return reviews.map(review => ({
                ...review,
                restaurantName,
                restaurantUrl
            }));

        } catch (err) {
            console.error('[ERROR] Sayfa yorumları çıkarılamadı:', err);
            return [];
        }
    }

    // Sonraki sayfaya git
    async goToNextPage(page) {
        try {
            // "Next" butonunu bul ve tıkla
            const nextButton = await page.$('a[aria-label="Next"]') || 
                             await page.$('a[class*="next"]') ||
                             await page.$('a[href*="start="]');

            if (nextButton) {
                await nextButton.click();
                await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
                await this.randomDelay(3000, 5000);
                return true;
            } else {
                console.log('[INFO] Sonraki sayfa bulunamadı.');
                return false;
            }
        } catch (err) {
            console.warn('[WARN] Sonraki sayfaya geçilemedi:', err.message);
            return false;
        }
    }

    // Yorumları veritabanına kaydet
    async saveReviewsToDatabase(reviews) {
        let savedCount = 0;
        let duplicateCount = 0;

        for (const review of reviews) {
            try {
                await this.pool
                    .request()
                    .input('restaurantName', sql.NVarChar, review.restaurantName)
                    .input('restaurantUrl', sql.NVarChar, review.restaurantUrl)
                    .input('reviewerName', sql.NVarChar, review.reviewerName)
                    .input('reviewerLocation', sql.NVarChar, review.reviewerLocation)
                    .input('rating', sql.Int, review.rating)
                    .input('reviewText', sql.NVarChar, review.reviewText)
                    .input('reviewDate', sql.NVarChar, review.reviewDate)
                    .input('usefulCount', sql.Int, review.usefulCount)
                    .input('funnyCount', sql.Int, review.funnyCount)
                    .input('coolCount', sql.Int, review.coolCount)
                    .query(`
                        INSERT INTO YelpReviews 
                        (RestaurantName, RestaurantURL, ReviewerName, ReviewerLocation, 
                         Rating, ReviewText, ReviewDate, UsefulCount, FunnyCount, CoolCount)
                        VALUES 
                        (@restaurantName, @restaurantUrl, @reviewerName, @reviewerLocation,
                         @rating, @reviewText, @reviewDate, @usefulCount, @funnyCount, @coolCount)
                    `);
                savedCount++;
            } catch (err) {
                if (err.message.includes('UNIQUE constraint') || err.message.includes('duplicate')) {
                    duplicateCount++;
                } else {
                    console.error('[ERROR] Yorum kaydetme hatası:', err.message);
                }
            }
        }

        console.log(`[SUCCESS] ${savedCount} yeni yorum kaydedildi, ${duplicateCount} duplicate atlandı.`);
        return { savedCount, duplicateCount };
    }

    // Cleanup
    async cleanup() {
        try {
            if (this.browser) {
                await this.browser.close();
                console.log('[INFO] Tarayıcı kapatıldı.');
            }
            if (this.pool) {
                await this.pool.close();
                console.log('[INFO] Veritabanı bağlantısı kapatıldı.');
            }
        } catch (err) {
            console.error('[ERROR] Cleanup hatası:', err);
        }
    }

    // Ana çalıştırma fonksiyonu
    async run(restaurantUrl, maxPages = 3) {
        console.log('[INFO] Yelp Scraper başlatılıyor...');
        
        try {
            // Initialization
            await this.initializeDatabase();
            await this.initializeBrowser();

            // Scrape reviews
            const reviews = await this.scrapeYelpReviews(restaurantUrl, maxPages);

            if (reviews.length > 0) {
                // Save to database
                const result = await this.saveReviewsToDatabase(reviews);
                console.log(`[FINAL] İşlem tamamlandı. ${result.savedCount} yeni yorum, ${result.duplicateCount} duplicate.`);
            } else {
                console.log('[WARN] Hiç yorum çekilemedi.');
            }

        } catch (err) {
            console.error('[ERROR] Ana işlem hatası:', err);
        } finally {
            await this.cleanup();
        }
    }
}

// Kullanım örneği
async function main() {
    const scraper = new YelpScraper();
    
    // Yelp restaurant URL'i
    const restaurantUrl = 'https://www.yelp.com/biz/agora-dc-washington-8';
    
    // Maksimum sayfa sayısı (dikkatli olun, çok fazla istek göndermeyin)
    const maxPages = 2;
    
    await scraper.run(restaurantUrl, maxPages);
}

// Script'i çalıştır
if (require.main === module) {
    main().catch(console.error);
}

module.exports = YelpScraper;