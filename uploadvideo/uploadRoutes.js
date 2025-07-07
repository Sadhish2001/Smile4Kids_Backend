const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const VideoModel = require('./videoModel');
const PaidVideoModel = require('../payment/paidVideoModel'); 
const authenticate = require('../authMiddleware');

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;

    if (file.fieldname === 'video') {
      uploadPath = path.join(__dirname, '../uploads/videos');
    } else if (file.fieldname === 'thumbnail') {
      uploadPath = path.join(__dirname, '../uploads/thumbnails');
    } else {
      return cb(new Error('Invalid field name'), null);
    }

    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

/**
 * POST /videos/upload (Protected)
 */
router.post(
  '/upload',
  authenticate,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { language, level, title, description } = req.body;
      const videoFile = req.files?.video?.[0];
      const thumbnailFile = req.files?.thumbnail?.[0];

      if (!language || !level || !videoFile) {
        return res.status(400).json({ message: 'Language, level, and video are required' });
      }

      const videoPath = path.join('uploads/videos', videoFile.filename);
      const thumbnailPath = thumbnailFile
        ? path.join('uploads/thumbnails', thumbnailFile.filename)
        : null;

      const videoId = await VideoModel.save({
        filename: videoFile.filename,
        language,
        level,
        path: videoPath,
        title: title || videoFile.originalname,
        description: description || '',
        thumbnailUrl: thumbnailPath
      });

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      res.status(200).json({
        _id: videoId,
        title: title || videoFile.originalname,
        videoUrl: `${baseUrl}/${videoPath.replace(/\\/g, '/')}`,
        thumbnailUrl: thumbnailPath ? `${baseUrl}/${thumbnailPath.replace(/\\/g, '/')}` : null,
        description: description || ''
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Upload failed', error: err.message });
    }
  }
);

/**
 * GET /videos - All videos
 */
router.get('/', async (req, res) => {
  try {
    const videos = await VideoModel.getAll();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const result = videos.map(video => ({
      _id: video.id,
      title: video.title || video.filename,
      videoUrl: `${baseUrl}/${video.path.replace(/\\/g, '/')}`,
      thumbnailUrl: video.thumbnailUrl
        ? (video.thumbnailUrl.startsWith('http') ? video.thumbnailUrl : `${baseUrl}/${video.thumbnailUrl.replace(/\\/g, '/')}`)
        : null,
      description: video.description || ''
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

/**
 * GET /videos/by-category?language=Gujarati&level=junior
 */
router.get('/by-category', async (req, res) => {
  const { language, level } = req.query;
  if (!language || !level) {
    return res.status(400).json({ message: 'language and level are required' });
  }

  try {
    const videos = await VideoModel.getByCategory(language, level);
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const result = videos.map(video => ({
      _id: video.id,
      title: video.title || video.filename,
      videoUrl: `${baseUrl}/${video.path.replace(/\\/g, '/')}`,
      thumbnailUrl: video.thumbnailUrl
        ? (video.thumbnailUrl.startsWith('http') ? video.thumbnailUrl : `${baseUrl}/${video.thumbnailUrl.replace(/\\/g, '/')}`)
        : null,
      description: video.description || ''
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

router.get('/user-list', authenticate, async (req, res) => {
  try {
    const user_id = req.user?.users_id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    const paid = await PaidVideoModel.getPaidVideos(user_id);
    const paidSet = new Set(paid.map(p => `${p.language}-${p.level}`));
    const videos = await VideoModel.getAll();
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const result = videos.map(video => {
      const key = `${video.language}-${video.level}`;
      return {
        _id: video.id,
        title: video.title || video.filename,
        videoUrl: `${baseUrl}/${video.path.replace(/\\/g, '/')}`,
        thumbnailUrl: video.thumbnailUrl
          ? (video.thumbnailUrl.startsWith('http') ? video.thumbnailUrl : `${baseUrl}/${video.thumbnailUrl.replace(/\\/g, '/')}`)
          : null,
        description: video.description || '',
        paid: paidSet.has(key),
        language: video.language,
        level: video.level
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user video list', error: err.message });
  }
});

module.exports = router;
