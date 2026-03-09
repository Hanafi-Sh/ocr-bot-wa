const express = require('express');
const { Client, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Tesseract = require('tesseract.js');
const mongoose = require('mongoose');
const { MongoStore } = require('wwebjs-mongo');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot WhatsApp OCR sedang berjalan!');
});

app.listen(port, () => {
    console.log(`Web server berjalan di port ${port}`);
});

// GANTI DENGAN CONNECTION STRING DARI MONGODB ATLAS MILIKMU
// Ingat untuk mengganti <username> dan <password>
const MONGODB_URI = 'mongodb+srv://shipaling_db_user:uSLwjWBJMJNC2eSu@cluster0.fvkxcpa.mongodb.net/?appName=Cluster0';

// Koneksi ke MongoDB terlebih dahulu
mongoose.connect(MONGODB_URI).then(() => {
    console.log('Berhasil terhubung ke MongoDB!');
    
    // Inisialisasi penyimpanan sesi di MongoDB
    const store = new MongoStore({ mongoose: mongoose });
    
    const client = new Client({
        authStrategy: new RemoteAuth({
            clientId: 'bot-sesi-1', // ID unik untuk bot ini
            store: store,
            backupSyncIntervalMs: 300000 // Simpan cadangan sesi setiap 5 menit
        }),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        }
    });

    client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
        console.log('Scan QR code di atas menggunakan aplikasi WhatsApp-mu!');
    });

    client.on('remote_session_saved', () => {
        console.log('Sesi WhatsApp berhasil disimpan ke MongoDB!');
    });

    client.on('ready', () => {
        console.log('Bot sudah siap dan terhubung!');
    });

    client.on('message', async msg => {
        if (msg.hasMedia) {
            const media = await msg.downloadMedia();
            
            if (media.mimetype.includes('image')) {
                msg.reply('Sedang membaca teks pada gambar... ⏳');
                
                try {
                    const imageBuffer = Buffer.from(media.data, 'base64');
                    const { data: { text } } = await Tesseract.recognize(
                        imageBuffer,
                        'ind+eng' 
                    );
                    
                    if (text.trim().length > 0) {
                        msg.reply(`*Hasil Ekstraksi Teks:*\n\n${text}`);
                    } else {
                        msg.reply('Maaf, tidak ada teks yang bisa terbaca dari gambar ini.');
                    }
                } catch (error) {
                    console.error(error);
                    msg.reply('Terjadi kesalahan saat memproses gambar.');
                }
            }
        }
    });

    // Menangani proses keluar (Ctrl+C)
    process.on('SIGINT', async () => {
        console.log('\nMematikan bot dengan aman...');
        await client.destroy();
        mongoose.connection.close();
        process.exit(0);
    });

    client.initialize();
    
}).catch((err) => {
    console.error('Gagal terhubung ke MongoDB:', err);
});