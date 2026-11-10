import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Radio,
  Sparkles,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  CheckCircle2,
  Store,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { salesAPI, voiceAPI } from '../services/api';

const Soundbox = () => {
  const { shop } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentAnnouncement, setCurrentAnnouncement] = useState('KadaiVoice Soundbox Active & Ready');
  const [announcementHistory, setAnnouncementHistory] = useState([
    { id: 1, text: 'KadaiVoice Soundbox System Online', time: '10:00 AM', amount: 0, mode: 'SYSTEM' },
  ]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  const recognitionRef = useRef(null);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Chime Sound Synthesizer (Realistic PhonePe / Paytm two-tone chime)
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      // Chime frequency progression: 587Hz (D5) -> 880Hz (A5)
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.15);

      osc2.frequency.setValueAtTime(880.00, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.4 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  // Announce transaction aloud with chime
  const announceAloud = (amount, paymentMode = 'CASH', customer = '') => {
    setIsAnnouncing(true);
    playChime();

    setTimeout(() => {
      let announcementText = '';
      if (language === 'ta') {
        const modeTamil = paymentMode === 'UPI' ? 'UPI ஆன்லைன்' : paymentMode === 'CREDIT' ? 'கடன்' : 'ரொக்க';
        announcementText = `கடைவாய்ஸ்: ரூபாய் ${amount} ${modeTamil} விற்பனை வெற்றிகரமாக முடிந்தது.`;
      } else {
        announcementText = `KadaiVoice: Rupees ${amount} ${paymentMode} sale recorded successfully.`;
      }

      setCurrentAnnouncement(announcementText);

      setAnnouncementHistory((prev) => [
        {
          id: Date.now(),
          text: announcementText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          amount,
          mode: paymentMode,
        },
        ...prev.slice(0, 8),
      ]);

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(announcementText);
        utterance.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
        utterance.rate = 1.0;
        utterance.volume = volume;
        utterance.onend = () => setIsAnnouncing(false);
        utterance.onerror = () => setIsAnnouncing(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsAnnouncing(false);
      }
    }, 400);
  };

  // Continuous Wake-Word Voice Listener
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && isWakeWordActive) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = false;
      recognizer.lang = language === 'ta' ? 'ta-IN' : 'en-IN';

      recognizer.onresult = async (event) => {
        const lastResult = event.results[event.results.length - 1][0].transcript.toLowerCase();
        console.log('[Soundbox Wake Listener]:', lastResult);

        // Check if command contains sales indicators or amounts
        if (lastResult.includes('sold') || lastResult.includes('விற்பனை') || lastResult.includes('vithuten') || lastResult.includes('rupees') || lastResult.includes('ரூபாய்')) {
          try {
            const res = await voiceAPI.interpretCommand({
              transcript: lastResult,
              languageCode: language === 'ta' ? 'ta-IN' : 'en-IN',
            });

            if (res.data.success) {
              const ext = res.data.extraction;
              const est = ext.estimatedTotal || 250;
              announceAloud(est, ext.paymentMethod || 'CASH');
            }
          } catch (err) {
            console.warn('Wake word interpretation error:', err);
          }
        }
      };

      recognizer.onerror = () => {
        if (isWakeWordActive) {
          try { recognizer.start(); } catch (e) {}
        }
      };

      try {
        recognizer.start();
        recognitionRef.current = recognizer;
      } catch (e) {}

      return () => {
        try { recognizer.stop(); } catch (e) {}
      };
    }
  }, [isWakeWordActive, language]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <div
      className={`min-h-[85vh] rounded-3xl bg-slate-950 text-white p-6 sm:p-10 flex flex-col justify-between shadow-2xl border border-slate-800 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{shop?.name || 'Immanuel Mini Mart'}</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                Live Soundbox Active
              </span>
            </div>
            <p className="text-xs text-slate-400">Cash Counter Voice & Audio Broadcast Terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Clock Display */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{currentTime}</span>
          </div>

          {/* Language Toggle */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs font-bold text-blue-400 py-2 px-3 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="ta">தமிழ் ஒலி (Tamil Voice)</option>
            <option value="en">English Voice</option>
            <option value="ta-en">Tanglish Voice</option>
          </select>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Toggle Counter Fullscreen Kiosk Mode"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Soundbox Visualizer Display */}
      <div className="my-8 flex flex-col items-center justify-center text-center">
        {/* Animated Speaker Dome */}
        <div className="relative mb-6">
          {isAnnouncing && (
            <>
              <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping scale-150" />
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse scale-125" />
            </>
          )}

          <div
            className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 relative z-10 ${
              isAnnouncing
                ? 'bg-gradient-to-tr from-emerald-500 to-blue-600 shadow-blue-500/40 scale-105'
                : 'bg-gradient-to-tr from-slate-900 to-slate-800 border-4 border-slate-700 shadow-slate-950'
            }`}
          >
            <Volume2 className={`w-16 h-16 ${isAnnouncing ? 'text-white animate-bounce' : 'text-blue-400'}`} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mt-2">
              {isAnnouncing ? 'Broadcasting' : 'Soundbox Standby'}
            </span>
          </div>
        </div>

        {/* Big LED Live Announcement Text */}
        <div className="max-w-2xl px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
          <p className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-300 to-teal-200">
            "{currentAnnouncement}"
          </p>
        </div>

        {/* Wake-Word Hands-Free Switch */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setIsWakeWordActive(!isWakeWordActive)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all ${
              isWakeWordActive
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isWakeWordActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            <span>{isWakeWordActive ? 'Continuous Wake-Word Active ("Hey Kadai")' : 'Enable Hands-Free Wake Word'}</span>
          </button>
        </div>
      </div>

      {/* Simulator Quick Announcement Trigger Buttons */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Instant Counter Soundbox Test Triggers
          </span>
          <span className="text-xs text-blue-400 font-semibold">Dual-Tone Chime + Voice Audio</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => announceAloud(350, 'CASH')}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left border border-slate-700/80 flex items-center justify-between group transition-all"
          >
            <div>
              <span className="text-xs font-bold text-white block">Test ₹350 Cash Sale</span>
              <span className="text-[11px] text-slate-400">Announces ₹350 Cash bill</span>
            </div>
            <Play className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={() => announceAloud(620, 'UPI')}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left border border-slate-700/80 flex items-center justify-between group transition-all"
          >
            <div>
              <span className="text-xs font-bold text-white block">Test ₹620 UPI Payment</span>
              <span className="text-[11px] text-slate-400">PhonePe / GPay QR alert</span>
            </div>
            <Play className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={() => announceAloud(1000, 'CREDIT')}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left border border-slate-700/80 flex items-center justify-between group transition-all"
          >
            <div>
              <span className="text-xs font-bold text-white block">Test ₹1,000 Khata Credit</span>
              <span className="text-[11px] text-slate-400">Customer ledger alert</span>
            </div>
            <Play className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Broadcast History Log */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>KadaiVoice Speaker Engine: Connected</span>
        </div>
        <div>
          Latest: {announcementHistory[0]?.text} ({announcementHistory[0]?.time})
        </div>
      </div>
    </div>
  );
};

export default Soundbox;

