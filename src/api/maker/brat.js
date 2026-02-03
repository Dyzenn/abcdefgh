const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const sharp = require('sharp');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Fungsi untuk memastikan font terdaftar
const setupFont = async () => {
  // Kita coba pakai font sistem yang biasanya ada di serverless atau 
  // Jika kamu punya file .ttf di folder project, bisa di-register di sini
  // GlobalFonts.registerFromPath(path.join(__dirname, 'font.ttf'), 'BratFont');
};

const generateImage = async (text) => {
  const size = 512;
  const padX = 35;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fill Background Putih
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Penentuan Font - Pakai sans-serif sebagai fallback universal
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 90px sans-serif'; 
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  // Efek Gepeng Horizontal
  ctx.setTransform(0.9, 0, 0, 1, 0, 0); 

  const words = text.trim().split(/\s+/);
  let line = '';
  const lines = [];

  for (const w of words) {
    const test = line + w + ' ';
    // 0.9 adalah faktor transformasi
    if (ctx.measureText(test).width > (size - padX * 2) / 0.9) {
      lines.push(line.trim());
      line = w + ' ';
      if (lines.length === 3) break; // Support sampai 3 baris biar gak kosong
    } else {
      line = test;
    }
  }
  if (line) lines.push(line.trim());

  const lineHeight = 100;
  let y = 50;
  for (const l of lines) {
    // X dikali kompensasi transform
    ctx.fillText(l, padX / 0.9, y); 
    y += lineHeight;
  }

  const png = canvas.toBuffer('image/png');

  // Tambahkan Blur Halus + Convert Webp
  return await sharp(png)
    .resize(512, 512)
    .blur(1.2)
    .webp({ quality: 90 })
    .toBuffer();
};

module.exports = function (app) {
  app.get('/maker/brat', async (req, res) => {
    const { text } = req.query;
    if (!text) return res.status(400).json({ status: false, message: 'Teks kosong!' });

    try {
      const buffer = await generateImage(text);
      res.setHeader('Content-Type', 'image/webp');
      res.send(buffer);
    } catch (e) {
      console.error(e);
      res.status(500).json({ status: false, error: "Gagal generate teks. Cek log server." });
    }
  });
};

