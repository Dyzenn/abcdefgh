kconst { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const sharp = require('sharp');
const axios = require('axios');

// URL Font Arial Rounded Bold (Hosted)
const FONT_URL = 'https://github.com/the-m-v-p/Font-Style-for-Brat/raw/main/Arial%20Rounded%20Bold.ttf';
let fontLoaded = false;

const loadFont = async () => {
  if (fontLoaded) return;
  try {
    const response = await axios.get(FONT_URL, { responseType: 'arraybuffer' });
    const fontBuffer = Buffer.from(response.data);
    GlobalFonts.register(fontBuffer, 'BratFont');
    fontLoaded = true;
    console.log('✅ Font Brat Berhasil Dimuat');
  } catch (e) {
    console.error('❌ Gagal muat font:', e.message);
  }
};

const generateImage = async (text) => {
  await loadFont(); // Pastikan font siap sebelum gambar dibuat
  
  const size = 512;
  const padX = 35;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background Putih
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Styling Teks
  ctx.fillStyle = '#000000';
  // Pakai 'BratFont' yang sudah kita register di atas
  ctx.font = `bold 100px ${fontLoaded ? 'BratFont' : 'sans-serif'}`; 
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  // Efek Gepek khas Brat
  ctx.setTransform(0.9, 0, 0, 1, 0, 0); 

  const words = text.trim().split(/\s+/);
  let line = '';
  const lines = [];

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

  const lineHeight = 115;
  let y = 50; 
  for (const l of lines) {
    ctx.fillText(l, padX / 0.9, y); 
    y += lineHeight;
  }

  const png = canvas.toBuffer('image/png');

  // Blur halus agar tidak pecah + format WebP
  return await sharp(png)
    .resize(512, 512)
    .blur(1.1)
    .webp({ quality: 95 })
    .toBuffer();
};

module.exports = function (app) {
  app.get('/maker/brat', async (req, res) => {
    const { text } = req.query;
    if (!text) return res.status(400).json({ status: false, message: 'Isi parameternya, contoh: ?text=Anjay' });

    try {
      const buffer = await generateImage(text);
      res.setHeader('Content-Type', 'image/webp');
      res.send(buffer);
    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  });
};

