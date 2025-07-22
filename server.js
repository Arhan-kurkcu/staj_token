require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Güvenlik middleware'leri
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // IP başına maksimum 100 istek
    message: "Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin."
});
app.use(limiter);

// Session yapılandırması
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // HTTPS kullanırken true yapın
        maxAge: 24 * 60 * 60 * 1000 // 24 saat
    }
}));

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SQL Server bağlantı ayarları
const dbConfig = {
    user: 'staj',
    password: 'staj1234',
    server: 'localhost',
    port: 51538,
    database: 'ReviewDB',
    options: { encrypt: false, enableArithAbort: true } // Burada boşluk ve karakter hatası vardı
};


let pool;

// Veritabanı bağlantısı
async function initializeDatabase() {
    try {
        pool = await sql.connect(dbConfig);
        console.log("[SUCCESS] Veritabanına başarıyla bağlanıldı.");
        
        // Eksik tabloları oluştur (Token sistemi için)
        await createTokenTables();
        
    } catch (err) {
        console.error("[ERROR] Veritabanına bağlanılamadı:", err);
        process.exit(1);
    }
}

// Token sistemi için ek tablolar
async function createTokenTables() {
    try {
        // Users tablosu (müşteri giriş sistemi için)
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
            CREATE TABLE Users (
                UserID INT IDENTITY(1,1) PRIMARY KEY,
                CustomerID INT NULL, -- Customers tablosu ile ilişki
                Name NVARCHAR(255) NOT NULL,
                Phone NVARCHAR(50) UNIQUE NOT NULL,
                PasswordHash NVARCHAR(255) DEFAULT 'temp_hash',
                CreatedAt DATETIME DEFAULT GETDATE(),
                LastLogin DATETIME NULL,
                IsActive BIT DEFAULT 1,
                CONSTRAINT FK_Users_Customers FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
            )
        `);

        // Tokens tablosu
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tokens' AND xtype='U')
            CREATE TABLE Tokens (
                TokenID INT IDENTITY(1,1) PRIMARY KEY,
                UserID INT NOT NULL,
                CustomerID INT NOT NULL,
                TokenValue DECIMAL(10,2) DEFAULT 0,
                TokenType NVARCHAR(50) DEFAULT 'REWARD', -- REWARD, LOYALTY, CASHBACK
                ExpiryDate DATETIME NULL,
                IsActive BIT DEFAULT 1,
                CreatedAt DATETIME DEFAULT GETDATE(),
                CONSTRAINT FK_Tokens_Users FOREIGN KEY (UserID) REFERENCES Users(UserID),
                CONSTRAINT FK_Tokens_Customers FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
            )
        `);

        // Token Transactions tablosu
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TokenTransactions' AND xtype='U')
            CREATE TABLE TokenTransactions (
                TransactionID INT IDENTITY(1,1) PRIMARY KEY,
                TokenID INT NOT NULL,
                TransactionType NVARCHAR(50) NOT NULL, -- EARN, SPEND, TRANSFER, EXPIRE
                Amount DECIMAL(10,2) NOT NULL,
                Description NVARCHAR(500),
                CreatedAt DATETIME DEFAULT GETDATE(),
                CONSTRAINT FK_TokenTransactions_Tokens FOREIGN KEY (TokenID) REFERENCES Tokens(TokenID)
            )
        `);

        console.log("[SUCCESS] Token tabloları oluşturuldu.");
    } catch (err) {
        console.error("[ERROR] Token tabloları oluşturulurken hata:", err);
    }
}

// Middleware: Authentication kontrolü
function requireAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Input validation
function validatePhone(phone) {
    const phoneRegex = /^[\+]?[0-9\-\s\(\)]+$/;
    return phoneRegex.test(phone) && phone.length >= 10;
}

function validateName(name) {
    return name && name.trim().length >= 2 && name.trim().length <= 100;
}

// Routes
app.get("/", (req, res) => {
    if (req.session.userId) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

app.get("/login", (req, res) => {
    if (req.session.userId) {
        res.redirect('/dashboard');
    } else {
        res.render('login', { error: null });
    }
});

app.get("/register", (req, res) => {
    res.render('register', { error: null, success: null, customers: [] });
});

app.get("/dashboard", requireAuth, async (req, res) => {
    try {
        // Kullanıcı ve token bilgilerini getir
        const userQuery = `
            SELECT u.UserID, u.Name, u.Phone, u.CreatedAt, c.Name as CustomerName
            FROM Users u
            LEFT JOIN Customers c ON u.CustomerID = c.CustomerID
            WHERE u.UserID = @userId
        `;
        
        const userResult = await pool
            .request()
            .input("userId", sql.Int, req.session.userId)
            .query(userQuery);
            
        if (userResult.recordset.length > 0) {
            const user = userResult.recordset[0];
            
            // Token bilgilerini getir
            const tokenQuery = `
                SELECT 
                    SUM(CASE WHEN IsActive = 1 THEN TokenValue ELSE 0 END) as TotalTokens,
                    COUNT(*) as TokenCount
                FROM Tokens 
                WHERE UserID = @userId
            `;
            
            const tokenResult = await pool
                .request()
                .input("userId", sql.Int, req.session.userId)
                .query(tokenQuery);
                
            const tokenStats = tokenResult.recordset[0] || { TotalTokens: 0, TokenCount: 0 };
            
            // Son işlemleri getir
            const transactionQuery = `
                SELECT TOP 5 
                    tt.TransactionType,
                    tt.Amount,
                    tt.Description,
                    tt.CreatedAt
                FROM TokenTransactions tt
                INNER JOIN Tokens t ON tt.TokenID = t.TokenID
                WHERE t.UserID = @userId
                ORDER BY tt.CreatedAt DESC
            `;
            
            const transactionResult = await pool
                .request()
                .input("userId", sql.Int, req.session.userId)
                .query(transactionQuery);
            
            res.render('dashboard', { 
                user: user,
                tokens: tokenStats,
                transactions: transactionResult.recordset
            });
        } else {
            req.session.destroy();
            res.redirect('/login');
        }
    } catch (err) {
        console.error("[ERROR] Dashboard yüklenirken hata:", err);
        res.status(500).send("Sunucu hatası!");
    }
});

// Login POST
app.post("/login", async (req, res) => {
    const { phone } = req.body;
    console.log(`[LOGIN ATTEMPT] Telefon: ${phone}`);

    // Input validation
    if (!validatePhone(phone)) {
        return res.render('login', { error: 'Geçerli bir telefon numarası girin.' });
    }

    try {
        const result = await pool
            .request()
            .input("phone", sql.NVarChar, phone)
            .query("SELECT UserID, Name, Phone FROM Users WHERE Phone = @phone AND IsActive = 1");

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            
            // Session oluştur
            req.session.userId = user.UserID;
            req.session.userName = user.Name;
            
            // Last login güncelle
            await pool
                .request()
                .input("userId", sql.Int, user.UserID)
                .query("UPDATE Users SET LastLogin = GETDATE() WHERE UserID = @userId");
            
            console.log("[LOGIN SUCCESS] Kullanıcı giriş yaptı:", user.Name);
            res.redirect('/dashboard');
        } else {
            console.warn("[LOGIN FAIL] Telefon numarası bulunamadı.");
            res.render('login', { error: 'Telefon numarası kayıtlı değil.' });
        }
    } catch (err) {
        console.error("[ERROR] Login hatası:", err);
        res.render('login', { error: 'Sunucu hatası, lütfen tekrar deneyin.' });
    }
});

// Register POST
app.post("/register", async (req, res) => {
    const { name, phone, address } = req.body;
    console.log(`[REGISTER ATTEMPT] Kullanıcı: ${name}, Telefon: ${phone}`);

    // Input validation
    if (!validateName(name)) {
        return res.render('register', { 
            error: 'Ad en az 2, en fazla 100 karakter olmalıdır.',
            success: null,
            customers: []
        });
    }

    if (!validatePhone(phone)) {
        return res.render('register', { 
            error: 'Geçerli bir telefon numarası girin.',
            success: null,
            customers: []
        });
    }

    try {
        // Telefon numarası kontrolü
        const existingUser = await pool
            .request()
            .input("phone", sql.NVarChar, phone)
            .query("SELECT UserID FROM Users WHERE Phone = @phone");

        if (existingUser.recordset.length > 0) {
            return res.render('register', { 
                error: 'Bu telefon numarası zaten kayıtlı.',
                success: null,
                customers: []
            });
        }

        // Yeni kullanıcı kaydet
        const insertResult = await pool
            .request()
            .input("name", sql.NVarChar, name.trim())
            .input("phone", sql.NVarChar, phone)
            .query(`
                INSERT INTO Users (Name, Phone, CreatedAt) 
                OUTPUT INSERTED.UserID
                VALUES (@name, @phone, GETDATE())
            `);

        const newUserId = insertResult.recordset[0].UserID;

        // Varsayılan token hesabı oluştur (eğer customer varsa)
        const customerResult = await pool.request().query("SELECT TOP 1 CustomerID FROM Customers");
        if (customerResult.recordset.length > 0) {
            const customerId = customerResult.recordset[0].CustomerID;
            
            await pool
                .request()
                .input("userId", sql.Int, newUserId)
                .input("customerId", sql.Int, customerId)
                .query(`
                    INSERT INTO Tokens (UserID, CustomerID, TokenValue, TokenType) 
                    VALUES (@userId, @customerId, 0, 'WELCOME')
                `);
        }

        console.log("[REGISTER SUCCESS] Kayıt başarıyla tamamlandı.");
        res.render('register', { 
            error: null,
            success: 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.',
            customers: []
        });
        
    } catch (err) {
        console.error("[ERROR] Kayıt hatası:", err);
        res.render('register', { 
            error: 'Kayıt sırasında bir hata oluştu.',
            success: null,
            customers: []
        });
    }
});

// Token işlemleri API
app.post("/api/tokens/add", requireAuth, async (req, res) => {
    const { amount, description } = req.body;
    
    try {
        // Kullanıcının aktif token hesabını bul
        const tokenResult = await pool
            .request()
            .input("userId", sql.Int, req.session.userId)
            .query("SELECT TOP 1 TokenID FROM Tokens WHERE UserID = @userId AND IsActive = 1");
            
        if (tokenResult.recordset.length > 0) {
            const tokenId = tokenResult.recordset[0].TokenID;
            
            // Token ekle
            await pool
                .request()
                .input("tokenId", sql.Int, tokenId)
                .input("amount", sql.Decimal, amount)
                .input("description", sql.NVarChar, description || 'Token eklendi')
                .query(`
                    BEGIN TRANSACTION;
                    
                    UPDATE Tokens 
                    SET TokenValue = TokenValue + @amount 
                    WHERE TokenID = @tokenId;
                    
                    INSERT INTO TokenTransactions (TokenID, TransactionType, Amount, Description)
                    VALUES (@tokenId, 'EARN', @amount, @description);
                    
                    COMMIT TRANSACTION;
                `);
                
            res.json({ success: true, message: 'Token başarıyla eklendi!' });
        } else {
            res.status(404).json({ success: false, message: 'Token hesabı bulunamadı!' });
        }
    } catch (err) {
        console.error("[ERROR] Token ekleme hatası:", err);
        res.status(500).json({ success: false, message: 'Sunucu hatası!' });
    }
});

// Logout
app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("[ERROR] Logout hatası:", err);
        }
        res.redirect('/login');
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('Sayfa bulunamadı!');
});

// Error handler
app.use((err, req, res, next) => {
    console.error("[ERROR] Genel hata:", err);
    res.status(500).send('Sunucu hatası!');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('[INFO] Sunucu kapatılıyor...');
    if (pool) {
        await pool.close();
    }
    process.exit(0);
});

// Sunucuyu başlat
initializeDatabase().then(() => {
    app.listen(port, () => {
        console.log(`[READY] Sunucu http://localhost:${port} adresinde çalışıyor.`);
    });
});