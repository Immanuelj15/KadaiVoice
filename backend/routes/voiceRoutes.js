const express = require('express');
const router = express.Router();
const multer = require('multer');
const voiceController = require('../controllers/voiceController');
const { protect } = require('../middleware/auth');

// Multer in-memory storage for audio
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB audio limit
});

router.use(protect);

router.get('/status', voiceController.getAIStatus);
router.post('/transcribe', upload.single('audio'), voiceController.transcribeAudio);
router.post('/interpret', voiceController.interpretCommand);
router.post('/confirm', voiceController.confirmVoiceTransaction);
router.post('/speak', voiceController.synthesizeSpeech);

module.exports = router;

