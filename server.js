const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Cloudinary config — reads CLOUDINARY_URL or the three discrete env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

function uploadBufferToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'robotics-data-collection',
        public_id: publicId,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video file uploaded' });
    }

    const { userID, name, email, environmentType, consentGiven } = req.body;

    if (!userID || !name || !email || !environmentType) {
      return res.status(400).json({ success: false, error: 'Missing required metadata' });
    }

    const safeUserID = String(userID).replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = Date.now();
    const publicId = `${safeUserID}_${timestamp}`;

    const result = await uploadBufferToCloudinary(req.file.buffer, publicId);

    const entry = {
      userID,
      name,
      email,
      environmentType,
      videoUrl: result.secure_url,
      publicId: result.public_id,
      fileSize: req.file.size,
      uploadedAt: new Date().toISOString(),
      consentGiven: consentGiven === 'true' || consentGiven === true,
    };

    let data = [];
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      data = JSON.parse(raw);
      if (!Array.isArray(data)) data = [];
    } catch (e) {
      data = [];
    }

    data.push(entry);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');

    res.json({ success: true, entry });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/admin/data', (req, res) => {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
