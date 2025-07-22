const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// SQL Server bağlantı ayarları
const dbConfig = {
    user: 'arhan', // SQL kullanıcı adınız
    password: 'staj1234', // Şifreniz
    server: 'staj',
    database: 'DESKTOP-DT9A7KM\SQLEXPRESS', // master değil, sizin oluşturduğunuz veritabanı adı
    options: {
        trustServerCertificate: true
    }
};

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Giriş ekranı
app.get('/', (req, res) => {
    res.render('login');
});

// Kayıt ekranı
app.get('/register', (req, res) => {
    res.render('register');
});

// Giriş POST
app.post('/login', async (req, res) => {
    const { phone } = req.body;
    try {
        await sql.connect(dbConfig);
        const result = await sql.query`SELECT * FROM Customers WHERE Phone = ${phone}`;
        if (result.recordset.length > 0) {
            res.send(`<h2>Hoş geldiniz, ${result.recordset[0].Name}</h2>`);
        } else {
            res.send('Kullanıcı bulunamadı');
        }
    } catch (err) {
        console.error(err);
        res.send('Hata oluştu');
    }
});

// Kayıt POST
app.post('/register', async (req, res) => {
    const { name, phone, address } = req.body;
    try {
        await sql.connect(dbConfig);
        await sql.query`
            INSERT INTO Customers (Name, Address, Phone)
            VALUES (${name}, ${address}, ${phone})
        `;
        res.send('Kayıt başarılı');
    } catch (err) {
        console.error(err);
        res.send('Kayıt sırasında hata oluştu');
    }
});

app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${3000} adresinde çalışıyor.`);
});