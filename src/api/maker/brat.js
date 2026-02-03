const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// 1. Registrasi Font secara Lokal
// __dirname akan merujuk ke folder 'src/api/maker' secara otomatis
const fontPath = path.join(__dirname, 'bratfont.ttf');

if (fs.existsSync(fontPath)) {
    GlobalFonts.registerFromPath(fontPath, 'bratFont');
} else {
    // Log ini akan muncul di dashboard Vercel jika file tidak ter-push
    console.warn("⚠️ Warning: File bratfont.ttf tidak ditemukan di path: " + fontPath);
}

/**
 * Fungsi untuk generate gambar stiker Brat
 * @param {string} text - Teks yang akan dimasukkan ke gambar
 */
const generateImage = async (text) => {
    const size = 512;
    const padX = 35;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background Putih Bersih
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Styling Teks
    ctx.fillStyle = '#000000';
    // Menggunakan font yang diregistrasikan atau fallback ke sans-serif
    ctx.font = 'bold 95px BratFont, sans-serif'; 
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Efek Transformasi (Gepeng Horizontal khas Brat)
    ctx.setTransform(0.9, 0, 0, 1, 0, 0); 

    const words = text.trim().split(/\s+/);
    let line = '';
    const lines = [];

    // Algoritma Wrap Teks (Max 2-3 baris agar proporsional)
    for (const w of words) {
        const test = line + w + ' ';
        if (ctx.measureText(test).width > (size - padX * 2) / 0.9) {
            lines.push(line.trim());
            line = w + ' ';
            if (lines.length === 2) break; 
        } else {
            line = test;
        }
    }
    if (line) lines.push(line.trim());

    const lineHeight = 110;
    let y = 60; 
    for (const l of lines) {
        ctx.fillText(l, padX / 0.9, y); 
        y += lineHeight;
    }

    const pngBuffer = canvas.toBuffer('image/png');

    // 2. Optimasi Gambar dengan Sharp (Konversi ke WebP)
    // Blur ditambahkan sedikit agar teks terlihat halus (anti-aliasing)
    return await sharp(pngBuffer)
        .resize(512, 512)
        .blur(1.1)
        .webp({ quality: 85 }) // Kualitas 85 seimbang antara size dan ketajaman
        .toBuffer();
};

module.exports = function (app) {
    // Handler untuk endpoint /maker/brat
    app.get('/maker/brat', async (req, res) => {
        const { text } = req.query;

        if (!text) {
            return res.status(400).json({ 
                status: false, 
                message: 'Parameter "text" wajib diisi!' 
            });
        }

        try {
            const buffer = await generateImage(text);
            
            // Set header agar browser/aplikasi tahu ini adalah gambar
            res.setHeader('Content-Type', 'image/webp');
            // Cache selama 1 hari agar server tidak memproses teks yang sama berkali-kali
            res.setHeader('Cache-Control', 'public, max-age=86400'); 
            
            res.send(buffer);
        } catch (error) {
            console.error("Error Brat Generator:", error);
            res.status(500).json({ 
                status: false, 
                error: 'Gagal memproses gambar. Pastikan dependencies terinstall.' 
            });
        }
    });
};
