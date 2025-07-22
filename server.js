require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const path = require("path");
const app = express();
const port = 3000;

// Log: Başlangıç
console.log("[INFO] Sunucu başlatılıyor...");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// SQL Server bağlantı ayarları
const dbConfig = {
    user: 'staj',
    password: 'staj1234',
    server: 'localhost',
    port: 51538,
    database: 'ReviewDB',
    options: { encrypt: false, enableArithAbort: true } // Burada boşluk ve karakter hatası vardı
};

// Veritabanı bağlantısı
sql.connect(dbConfig).then(pool => {
    if (pool.connected) {
        console.log("[SUCCESS] Veritabanına başarıyla bağlanıldı.");
    }

    // Giriş POST isteği
    app.post("/login", async (req, res) => {
        const { username, password } = req.body;
        console.log(`[LOGIN ATTEMPT] Kullanıcı: ${username}`);

        try {
            const result = await pool
                .request()
                .input("username", sql.NVarChar, username)
                .input("password", sql.NVarChar, password)
                .query("SELECT * FROM Customers WHERE Name = @username AND Phone = @password");

            if (result.recordset.length > 0) {
                console.log("[LOGIN SUCCESS] Kullanıcı bulundu.");
                res.send(`<h2>Hoşgeldiniz, ${username}!</h2>`);
            } else {
                console.warn("[LOGIN FAIL] Kullanıcı adı veya şifre hatalı.");
                res.send("<h2>Hatalı giriş!</h2>");
            }
        } catch (err) {
            console.error("[ERROR] SQL Sorgu Hatası:", err);
            res.status(500).send("Sunucu hatası!");
        }
    });

    // Sunucuyu başlat
    app.listen(port, () => {
        console.log(`[READY] Sunucu http://localhost:${3000} adresinde çalışıyor.`);
    });
}).catch(err => {
    console.error("[ERROR] Veritabanına bağlanılamadı:", err);
});