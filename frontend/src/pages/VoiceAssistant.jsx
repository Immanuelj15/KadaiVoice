import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Boxes,
  ShoppingCart,
  CreditCard,
  FileText,
  TrendingUp,
} from 'lucide-react';
import AudioWaveform from '../components/voice/AudioWaveform';
import TransactionPreviewModal from '../components/voice/TransactionPreviewModal';
import { voiceAPI, productsAPI, customersAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

const VoiceAssistant = () => {
  const { language, t } = useLanguage();
  const toast = useToast();

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [extraction, setExtraction] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [lastSpokenAudio, setLastSpokenAudio] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  // Load catalog and customer context
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, custRes, statusRes] = await Promise.all([
          productsAPI.getProducts(),
          customersAPI.getCustomers(),
          voiceAPI.getAIStatus(),
        ]);
        if (prodRes.data.success) setCatalog(prodRes.data.data);
        if (custRes.data.success) setCustomers(custRes.data.data);
        if (statusRes.data.success) setAiStatus(statusRes.data.gnani);
      } catch (err) {
        console.warn('Voice context load error:', err.message);
      }
    };
    fetchData();

    // Check if browser Web Speech API is supported for live preview
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = language === 'ta' ? 'ta-IN' : 'en-IN';

      recognizer.onresult = (event) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      recognitionRef.current = recognizer;
    }
  }, [language]);

  // Start microphone recording
  const startRecording = async () => {
    setTranscript('');
    setExtraction(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processRecordedAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // ignore duplicate start
        }
      }
    } catch (err) {
      console.warn('Microphone permission blocked or unavailable:', err.message);
      toast.warning('Microphone permission needed. You can also click the quick sample commands below!');
      setIsRecording(false);
    }
  };

  // Stop recording and process through Gnani AI pipeline
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
  };

  // Send audio to backend for Gnani Prisma STT & Evon NLU
  const processRecordedAudio = async (audioBlob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice_command.webm');
      formData.append('languageCode', language === 'ta' ? 'ta-IN' : language === 'ta-en' ? 'ta-en' : 'en-IN');
      formData.append('fallbackText', transcript);

      // 1. Transcribe via Gnani Prisma
      const sttRes = await voiceAPI.transcribeAudio(formData);
      const text = sttRes.data.transcript || transcript;
      setTranscript(text);

      // 2. Interpret structured intent via Gnani Evon
      await interpretTextCommand(text);
    } catch (err) {
      console.error('Audio processing error:', err);
      toast.error('Voice processing encountered an error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process text command (used by presets or post-STT)
  const interpretTextCommand = async (textToProcess) => {
    if (!textToProcess || !textToProcess.trim()) {
      toast.warning('No speech detected. Please speak or choose a command.');
      return;
    }

    setIsProcessing(true);
    setTranscript(textToProcess);

    try {
      const res = await voiceAPI.interpretCommand({
        transcript: textToProcess,
        languageCode: language === 'ta' ? 'ta-IN' : language === 'ta-en' ? 'ta-en' : 'en-IN',
      });

      if (res.data.success) {
        const ext = res.data.extraction;
        setExtraction(ext);

        // Speak the AI summary response
        if (ext.spokenResponseText) {
          speakFeedback(ext.spokenResponseText);
        }

        // If it's an actionable transaction, show preview verification modal
        if (['CREATE_SALE', 'ADD_STOCK', 'CREATE_CREDIT'].includes(ext.intent)) {
          setShowPreviewModal(true);
        } else {
          toast.info(ext.summary || 'Command processed!');
        }
      }
    } catch (err) {
      console.error('NLU Interpretation error:', err);
      toast.error(err.response?.data?.message || 'Could not interpret voice command.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Spoken feedback helper (calls backend Gnani Timbre or browser Web Speech)
  const speakFeedback = async (text) => {
    try {
      const res = await voiceAPI.synthesizeSpeech({
        text,
        language: language === 'ta' ? 'ta-IN' : 'en-IN',
      });

      if (res.data.audioUrl) {
        setLastSpokenAudio(res.data.audioUrl);
        const audio = new Audio(res.data.audioUrl);
        audio.play();
      } else if (res.data.useWebSpeech && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn('Speech synthesis playback error:', err.message);
    }
  };

  // Confirm and save transaction to MongoDB
  const handleConfirmTransaction = async (confirmedData) => {
    setIsConfirming(true);
    try {
      const res = await voiceAPI.confirmTransaction({
        ...confirmedData,
        transcript,
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Transaction saved successfully!');
        setShowPreviewModal(false);
        setExtraction(null);
        setTranscript('');

        if (res.data.spokenConfirmation) {
          speakFeedback(res.data.spokenConfirmation);
        }

        // Refresh catalog after stock reduction
        const prodRes = await productsAPI.getProducts();
        if (prodRes.data.success) setCatalog(prodRes.data.data);
      }
    } catch (err) {
      console.error('Confirmation error:', err);
      toast.error(err.response?.data?.message || 'Failed to save confirmed transaction.');
    } finally {
      setIsConfirming(false);
    }
  };

  // Sample Preset Voice Commands for quick testing
  const sampleCommands = [
    {
      label: 'Sale (English)',
      text: 'Today I sold 5 kg rice and 10 milk packets',
      intent: 'CREATE_SALE',
      icon: ShoppingCart,
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    },
    {
      label: 'Sale (Tanglish)',
      text: 'Innaiku 5 kilo arisi, 10 packet paal vithuten',
      intent: 'CREATE_SALE',
      icon: ShoppingCart,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    },
    {
      label: 'Sale (Tamil)',
      text: 'இன்று 5 கிலோ அரிசி மற்றும் 10 பால் பாக்கெட் விற்றேன்',
      intent: 'CREATE_SALE',
      icon: ShoppingCart,
      color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
    },
    {
      label: 'Add Stock',
      text: 'Add 20 kg rice to stock',
      intent: 'ADD_STOCK',
      icon: Boxes,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    },
    {
      label: 'Customer Credit',
      text: 'Ramesh bought groceries worth 500 rupees on credit',
      intent: 'CREATE_CREDIT',
      icon: CreditCard,
      color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    },
    {
      label: 'Sales Query',
      text: 'How much did I sell today?',
      intent: 'DAILY_REPORT',
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    },
    {
      label: 'Best Sellers',
      text: 'Which product is selling the most?',
      intent: 'TOP_SELLING_PRODUCTS',
      icon: Sparkles,
      color: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
    },
    {
      label: 'Low Stock Alert',
      text: 'Which items are running low?',
      intent: 'LOW_STOCK_REPORT',
      icon: AlertCircle,
      color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                KadaiVoice AI • Voice Core
              </span>
              <span className="text-xs bg-emerald-400 text-slate-900 font-bold px-2 py-0.5 rounded-full">
                {aiStatus?.isConfigured ? 'Gnani Cloud Live' : 'Demo Mode Active'}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">Run Your Shop. Just Speak.</h1>
            <p className="text-sm text-blue-100 mt-1 max-w-xl">
              Tamil, Tanglish & English voice-driven operations for Kirana stores. Natural language sales entry, inventory restock, and khata credit.
            </p>
          </div>
          <div className="shrink-0 bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-3 text-xs text-blue-100">
            <span className="font-semibold block text-white mb-0.5">Stack:</span>
            <span>Prisma STT + Evon NLU + Timbre TTS</span>
          </div>
        </div>
      </div>

      {/* Voice Recording Control Center Card */}
      <div className="bg-white border border-surface-border rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col items-center text-center relative">
        {/* Status Chip */}
        <div className="mb-4">
          {isRecording ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              {t('listening')}
            </span>
          ) : isProcessing ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              {t('processingAI')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Ready to record voice command
            </span>
          )}
        </div>

        {/* Animated Microphone Button */}
        <div className="relative my-4">
          {isRecording && (
            <>
              <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping scale-150" />
              <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-pulse scale-125" />
            </>
          )}

          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl ${
              isRecording
                ? 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-red-500/30 scale-105'
                : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/30 hover:scale-105 active:scale-95'
            }`}
          >
            {isRecording ? (
              <>
                <MicOff className="w-10 h-10 animate-bounce" />
                <span className="text-[11px] font-bold mt-1 uppercase tracking-wider">Stop</span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10" />
                <span className="text-[11px] font-bold mt-1 uppercase tracking-wider">Speak</span>
              </>
            )}
          </button>
        </div>

        {/* Audio Waveform Canvas */}
        <div className="w-full max-w-md my-4">
          <AudioWaveform isRecording={isRecording} />
        </div>

        {/* Live Transcription Box */}
        <div className="w-full max-w-xl mt-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 text-left flex items-center justify-between">
            <span>Spoken Sentence:</span>
            {transcript && (
              <button
                onClick={() => setTranscript('')}
                className="text-slate-400 hover:text-slate-600 text-[11px] flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left min-h-[64px] flex items-center">
            {transcript ? (
              <p className="text-base font-semibold text-slate-900 leading-relaxed">{transcript}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">
                {isRecording ? 'Listening... Speak in Tamil, Tanglish, or English' : 'Your words will appear here in real-time...'}
              </p>
            )}
          </div>
        </div>

        {/* Action Button to process manually typed or edited transcript */}
        {transcript && !isRecording && !isProcessing && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => interpretTextCommand(transcript)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Process Intent with Gnani Evon</span>
            </button>
          </div>
        )}
      </div>

      {/* Preset Voice Commands for 1-Click Evaluation / Testing */}
      <div className="bg-white border border-surface-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Try Sample Kirana Voice Commands</h2>
            <p className="text-xs text-slate-500">
              Click any command below to test end-to-end NLU extraction and instant store update
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
            Tamil • Tanglish • English
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sampleCommands.map((cmd, i) => (
            <button
              key={i}
              type="button"
              onClick={() => interpretTextCommand(cmd.text)}
              className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between group hover:shadow-sm ${cmd.color}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                    {cmd.label}
                  </span>
                  <cmd.icon className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                </div>
                <p className="text-xs font-semibold leading-relaxed line-clamp-2 text-slate-800">
                  "{cmd.text}"
                </p>
              </div>
              <div className="mt-2 text-[11px] font-bold flex items-center gap-1 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                <span>Run command</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Preview Verification Modal */}
      {showPreviewModal && extraction && (
        <TransactionPreviewModal
          extraction={extraction}
          catalog={catalog}
          customers={customers}
          isConfirming={isConfirming}
          onConfirm={handleConfirmTransaction}
          onCancel={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
};

export default VoiceAssistant;

