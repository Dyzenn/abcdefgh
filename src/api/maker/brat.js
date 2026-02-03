const { createCanvas } = require('@napi-rs/canvas');
const sharp = require('sharp');

const generateImage = async (text) => {
  const size = 512;
  const padX = 35; // Margin sesuai permintaan (35px)
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background putih
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Styling font
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 100px Arial'; 
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  // Efek gepek horizontal (0.9)
  ctx.setTransform(0.9, 0, 0, 1, 0, 0); 

  const words = text.trim().split(/\s+/);
  let line = '';
  const lines = [];

  for (const w of words) {
    const test = line + w + ' ';
    // Menghitung lebar dengan mempertimbangkan transformasi
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
    ctx.fillText(l, padX / 0.9, y); // Kompensasi koordinat X karena transform
    y += lineHeight;
  }

  const png = canvas.toBuffer('image/png');

  // Blur halus 1.4 + Webp kualitas 95
  return await sharp(png)
    .resize(512, 512)
    .blur(1.4)
    .webp({ quality: 95 })
    .toBuffer();
};

module.exports = function (app) {
  // Support GET
  app.get('/api/image/brat', async (req, res) => {
    const text = req.query.text;
    if (!text) return res.status(400).json({ status: false, message: 'Gunakan ?text=isi_teks' });

    try {
      const buffer = await generateImage(text);
      res.setHeader('Content-Type', 'image/webp');
      res.send(buffer);
    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  });

  // Support POST
  app.post('/api/image/brat', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ status: false, message: 'Body "text" diperlukan' });

    try {
      const buffer = await generateImage(text);
      res.setHeader('Content-Type', 'image/webp');
      res.send(buffer);
    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  });
};
