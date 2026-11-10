const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

/**
 * Gnani AI Prisma - Speech-to-Text (STT) Service
 * Official base URL: https://api.vachana.ai
 * Header: X-API-Key-ID: <GNANI_API_KEY>
 */
class GnaniPrismaService {
  constructor() {
    this.apiKey = process.env.GNANI_API_KEY || '';
    this.endpoint = process.env.GNANI_STT_ENDPOINT || 'https://api.vachana.ai/stt/v3';
    this.timeout = parseInt(process.env.GNANI_TIMEOUT_MS || '15000', 10);
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0 && !this.apiKey.includes('your_api_key'));
  }

  /**
   * Transcribe an audio file buffer or path
   * @param {Object} options
   * @param {string|Buffer} options.audio - File path or Buffer
   * @param {string} options.languageCode - e.g. 'ta-IN', 'en-IN', 'hi-IN'
   * @param {string} [options.encoding] - e.g. 'AUDIO_ENCODING_UNSPECIFIED' or 'LINEAR16'
   * @param {string} [options.fallbackText] - Optional fallback text passed from browser preview
   */
  async transcribe({ audio, languageCode = 'ta-IN', filename = 'audio.webm', fallbackText = '' }) {
    if (!this.isConfigured()) {
      return this._simulateTranscription({ audio, languageCode, fallbackText });
    }

    try {
      console.log(`[Gnani Prisma] Calling STT endpoint: ${this.endpoint} with language: ${languageCode}`);
      const form = new FormData();
      
      if (Buffer.isBuffer(audio)) {
        form.append('audio', audio, { filename });
      } else if (typeof audio === 'string' && fs.existsSync(audio)) {
        form.append('audio', fs.createReadStream(audio));
      } else {
        throw new Error('Invalid audio data supplied to Prisma STT');
      }

      form.append('language_code', languageCode);
      form.append('model', 'prisma-v3.0');

      const response = await axios.post(this.endpoint, form, {
        headers: {
          ...form.getHeaders(),
          'X-API-Key-ID': this.apiKey,
        },
        timeout: this.timeout,
      });

      const transcript = response.data?.transcript || response.data?.text || '';

      return {
        success: true,
        transcript: transcript.trim(),
        languageCode,
        confidence: response.data?.confidence || 0.96,
        isSimulated: false,
        provider: 'Gnani AI Prisma (Live API)',
        raw: response.data,
      };
    } catch (err) {
      console.warn(`[Gnani Prisma] API Error: ${err.message}. Falling back to simulated mode with diagnostic notice.`);
      const simulated = this._simulateTranscription({ audio, languageCode, fallbackText });
      return {
        ...simulated,
        apiError: err.response?.data?.message || err.message,
        warning: 'Gnani API call failed or timed out. Handled gracefully via simulated pipeline.',
      };
    }
  }

  _simulateTranscription({ languageCode, fallbackText }) {
    if (fallbackText && fallbackText.trim()) {
      return {
        success: true,
        transcript: fallbackText.trim(),
        languageCode,
        confidence: 0.94,
        isSimulated: true,
        provider: 'Simulated Mode (Web Speech / Preset Input)',
        note: 'GNANI_API_KEY is not configured or in demo mode. Running in mock demonstration mode.',
      };
    }

    // Default sample Tamil/Tanglish phrases based on language code
    const samplePhrases = {
      'ta-IN': 'இன்று 5 கிலோ அரிசி மற்றும் 10 பால் பாக்கெட் விற்றேன்',
      'ta-en': 'Innaiku 5 kilo arisi, 10 packet paal vithuten',
      'en-IN': 'Today I sold 5 kg rice and 10 milk packets',
    };

    const phrase = samplePhrases[languageCode] || samplePhrases['en-IN'];

    return {
      success: true,
      transcript: phrase,
      languageCode,
      confidence: 0.92,
      isSimulated: true,
      provider: 'Simulated Mode (Fallback Test Input)',
      note: 'GNANI_API_KEY is not configured or in demo mode. Running in mock demonstration mode.',
    };
  }
}

module.exports = new GnaniPrismaService();

