const axios = require('axios');

/**
 * Gnani AI Timbre - Text-to-Speech (TTS) Service
 * Official base URL: https://api.vachana.ai
 * Header: X-API-Key-ID: <GNANI_API_KEY>
 */
class GnaniTimbreService {
  constructor() {
    this.apiKey = process.env.GNANI_API_KEY || '';
    this.endpoint = process.env.GNANI_TTS_ENDPOINT || 'https://api.vachana.ai/api/v1/tts/inference';
    this.timeout = parseInt(process.env.GNANI_TIMEOUT_MS || '15000', 10);
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0 && !this.apiKey.includes('your_api_key'));
  }

  /**
   * Synthesize spoken response from text
   * @param {Object} options
   * @param {string} options.text - Text to speak
   * @param {string} options.language - 'ta-IN', 'en-IN', 'hi-IN'
   * @param {string} [options.voice] - e.g. 'Kavya' or 'Pranav'
   */
  async speak({ text, language = 'ta-IN', voice = 'Kavya' }) {
    if (!text || !text.trim()) {
      throw new Error('Text is required for TTS synthesis');
    }

    if (!this.isConfigured()) {
      return this._simulateTTS({ text, language });
    }

    try {
      console.log(`[Gnani Timbre] Calling TTS endpoint for: "${text.substring(0, 40)}..."`);
      const response = await axios.post(
        this.endpoint,
        {
          text: text.trim(),
          voice: voice,
          model: 'timbre-v2.5',
          language: language,
          speed: 1.0,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key-ID': this.apiKey,
          },
          responseType: 'arraybuffer',
          timeout: this.timeout,
        }
      );

      const base64Audio = Buffer.from(response.data, 'binary').toString('base64');
      const audioDataUrl = `data:audio/wav;base64,${base64Audio}`;

      return {
        success: true,
        audioUrl: audioDataUrl,
        text,
        language,
        voice,
        isSimulated: false,
        provider: 'Gnani AI Timbre (Live API)',
      };
    } catch (err) {
      console.warn(`[Gnani Timbre] API Error: ${err.message}. Providing simulated speech payload.`);
      const sim = this._simulateTTS({ text, language });
      return {
        ...sim,
        apiError: err.response?.data?.message || err.message,
        warning: 'Gnani Timbre TTS failed or timed out. Client-side speech synthesis available.',
      };
    }
  }

  _simulateTTS({ text, language }) {
    return {
      success: true,
      audioUrl: null, // Signals frontend to use Web Speech Synthesis API
      useWebSpeech: true,
      text,
      language: language === 'ta-IN' ? 'ta-IN' : 'en-IN',
      isSimulated: true,
      provider: 'Web Speech Synthesis / Simulation Mode',
      note: 'GNANI_API_KEY is not configured or in demo mode. Running in mock demonstration mode.',
    };
  }
}

module.exports = new GnaniTimbreService();

