const express = require('express');
const multer = require('multer');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Detect OS for binary name
const isWin = process.platform === 'win32';
const vtracerBin = isWin ? 'vtracer.exe' : 'vtracer';
const VTRACER_PATH = path.resolve(__dirname, 'bin', vtracerBin);
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const CONVERTED_DIR = path.join(__dirname, 'converted');

// Ensure directories exist
[UPLOADS_DIR, CONVERTED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Verify vtracer exists
if (!fs.existsSync(VTRACER_PATH)) {
  console.error('ERROR: vtracer no encontrado en', VTRACER_PATH);
  process.exit(1);
}
console.log('vtracer encontrado:', VTRACER_PATH);

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|bmp|gif|webp|tiff|tif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype.split('/')[1] || '');
    cb(null, ext || mime);
  }
});

app.use(express.static(path.join(__dirname, 'public')));

// Single endpoint for conversion
app.post('/api/convert', upload.single('image'), async (req, res) => {
  console.log('[CONVERT] Request received');

  if (!req.file) {
    console.log('[CONVERT] No file in request');
    return res.status(400).json({ error: 'No se proporcionó imagen' });
  }

  console.log('[CONVERT] File:', req.file.originalname, '| Size:', req.file.size, 'bytes');

  const inputPath = req.file.path;
  const baseName = path.basename(req.file.filename, path.extname(req.file.filename));

  // Convert to PNG first if needed (vtracer accepts jpg/png/bmp)
  let processPath = inputPath;
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (['.webp', '.gif', '.tiff', '.tif'].includes(ext)) {
    try {
      const sharp = require('sharp');
      const pngPath = path.join(UPLOADS_DIR, baseName + '.png');
      await sharp(inputPath).png().toFile(pngPath);
      processPath = pngPath;
      console.log('[CONVERT] Converted to PNG:', pngPath);
    } catch (e) {
      cleanup(inputPath);
      console.error('[CONVERT] Sharp error:', e.message);
      return res.status(500).json({ error: 'Error convirtiendo formato: ' + e.message });
    }
  }

  // Parse params from form data
  let params = {};
  if (req.body && req.body.params) {
    try {
      params = JSON.parse(req.body.params);
    } catch (_) {
      console.log('[CONVERT] Could not parse params, using defaults');
    }
  }

  const outputPath = path.join(CONVERTED_DIR, baseName + '.svg');

  // Build vtracer args
  const args = ['-i', processPath, '-o', outputPath];

  // Only add preset OR individual params, not both
  if (params.preset) {
    args.push('--preset', params.preset);
  } else {
    if (params.colormode) args.push('--colormode', params.colormode);
    if (params.color_precision) args.push('-p', String(params.color_precision));
    if (params.filter_speckle) args.push('-f', String(params.filter_speckle));
    if (params.gradient_step) args.push('-g', String(params.gradient_step));
    if (params.corner_threshold) args.push('-c', String(params.corner_threshold));
    if (params.segment_length) args.push('-l', String(params.segment_length));
    if (params.splice_threshold) args.push('-s', String(params.splice_threshold));
    if (params.mode) args.push('-m', params.mode);
    if (params.hierarchical) args.push('--hierarchical', params.hierarchical);
  }

  console.log('[CONVERT] Running vtracer with args:', args.join(' '));

  execFile(VTRACER_PATH, args, { timeout: 120000 }, (error, stdout, stderr) => {
    // Cleanup uploads
    cleanup(inputPath);
    if (processPath !== inputPath) cleanup(processPath);

    if (error) {
      console.error('[CONVERT] vtracer error:', error.message);
      if (stderr) console.error('[CONVERT] stderr:', stderr);
      return res.status(500).json({
        error: 'Error en conversión vectorial: ' + (stderr || error.message)
      });
    }

    console.log('[CONVERT] vtracer completed successfully');
    if (stdout) console.log('[CONVERT] stdout:', stdout);

    try {
      const svgContent = fs.readFileSync(outputPath, 'utf-8');
      cleanup(outputPath);
      console.log('[CONVERT] SVG size:', svgContent.length, 'chars');
      res.json({ svg: svgContent });
    } catch (e) {
      console.error('[CONVERT] Error reading SVG:', e.message);
      res.status(500).json({ error: 'Error leyendo SVG generado: ' + e.message });
    }
  });
});

function cleanup(filePath) {
  try { fs.unlinkSync(filePath); } catch (_) {}
}

app.listen(PORT, () => {
  console.log(`\n  AnimateLogo corriendo en http://localhost:${PORT}\n`);
});
