const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Tesseract = require('tesseract.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Membuat server web sederhana agar PaaS tahu bot kita hidup
app.get('/', (req, res) => {
    res.send('Bot WhatsApp OCR sedang berjalan!');
});

app.listen(port, () => {
    console.log(`Web server berjalan di port ${port}`);
});

// Inisialisasi bot dengan penyimpanan sesi lokal
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        // Argumen ini seringkali diperlukan agar Chromium berjalan lancar di Linux
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }
});

// Menampilkan QR Code di terminal
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan QR code di atas menggunakan aplikasi WhatsApp-mu!');
});

client.on('ready', () => {
    console.log('Bot sudah siap dan terhubung!');
});

// Mendengarkan pesan masuk
client.on('message', async msg => {
    // Mengecek apakah pesan mengandung media (gambar/video/dokumen)
    if (msg.hasMedia) {
        const media = await msg.downloadMedia();
        
        // Memastikan media yang dikirim adalah gambar
        if (media.mimetype.includes('image')) {
            msg.reply('Sedang membaca teks pada gambar... ⏳');
            
            try {
                // Mengubah format base64 dari WhatsApp menjadi Buffer untuk dibaca Tesseract
                const imageBuffer = Buffer.from(media.data, 'base64');
                
                // Proses ekstraksi teks (Mendukung Bahasa Indonesia & Inggris)
                const { data: { text } } = await Tesseract.recognize(
                    imageBuffer,
                    'ind+eng' 
                );
                
                // Mengirimkan hasil jika ada teks yang terbaca
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

// Menangani proses keluar (Ctrl+C) agar aman
process.on('SIGINT', async () => {
    console.log('\nMematikan bot dengan aman...');
    await client.destroy();
    process.exit(0);
});

// Mulai jalankan bot
client.initialize();