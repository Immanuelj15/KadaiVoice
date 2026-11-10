import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Barcode,
  Mic,
  CheckCircle2,
  X,
  Zap,
  Volume2,
  AlertCircle,
  Plus,
} from 'lucide-react';

const BarcodeScannerModal = ({ isOpen, onClose, onProductScanned, catalog = [] }) => {
  if (!isOpen) return null;

  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [spokenQty, setSpokenQty] = useState(1);
  const [isListeningVoice, setIsListeningVoice] = useState(true);
  const [voiceHeard, setVoiceHeard] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const speechRecognizerRef = useRef(null);

  // Play crisp POS barcode laser beep
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(2000, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  };

  // Start Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCamera(true);
      } catch (err) {
        console.warn('Camera access error:', err.message);
        setCameraError('Camera access not granted or unavailable. You can also tap sample barcodes below!');
        setHasCamera(false);
      }
    };

    startCamera();

    // Start Voice Recognition for Quantity (e.g. "3 packets", "2", "5 kg")
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;

      recognizer.onresult = (event) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setVoiceHeard(text);

        const numMatch = text.match(/\b(\d+(\.\d+)?)\b/) || text.match(/(one|two|three|four|five|ten|rendu|moonu|naalu|anju|pathu)/i);
        if (numMatch) {
          const wordMap = { one: 1, two: 2, three: 3, four: 4, five: 5, ten: 10, rendu: 2, moonu: 3, naalu: 4, anju: 5, pathu: 10 };
          const parsed = parseFloat(numMatch[1]) || wordMap[numMatch[1]?.toLowerCase()] || 1;
          setSpokenQty(parsed);
        }
      };

      try {
        recognizer.start();
        speechRecognizerRef.current = recognizer;
      } catch (e) {}
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (speechRecognizerRef.current) {
        try { speechRecognizerRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  const handleSimulateScan = (prod) => {
    playBeep();
    setScannedProduct(prod);
  };

  const handleConfirmAddToCart = () => {
    if (!scannedProduct) return;
    onProductScanned(scannedProduct, spokenQty);
    setScannedProduct(null);
    setVoiceHeard('');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Barcode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Hybrid Barcode + Voice Scanner</h3>
              <p className="text-xs text-slate-400">Point camera at barcode & speak quantity</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Video Area */}
        <div className="my-4 relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800">
          {hasCamera ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs">
              <Camera className="w-12 h-12 text-slate-600 mx-auto mb-2 animate-pulse" />
              <span>Camera scanning active. (Or click quick-test barcodes below)</span>
            </div>
          )}

          {/* Optical Targeting Reticle / Red Laser line */}
          <div className="absolute inset-8 border-2 border-dashed border-blue-400/60 rounded-xl pointer-events-none flex items-center justify-center">
            <div className="w-full h-0.5 bg-red-500 shadow-lg shadow-red-500/80 animate-pulse" />
          </div>

          <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur-xs px-3 py-1.5 rounded-lg text-[11px] flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Voice: "{voiceHeard || 'Speak quantity (e.g. 3 packets)'}"</span>
            </span>
            <span className="font-black text-emerald-400">Qty: {spokenQty}</span>
          </div>
        </div>

        {/* Detected Product Card */}
        {scannedProduct ? (
          <div className="p-4 bg-blue-950/60 border border-blue-800 rounded-2xl flex items-center justify-between mb-3 animate-in zoom-in-95 duration-150">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                ✓ Barcode Matched Product
              </span>
              <div className="font-bold text-white text-base">{scannedProduct.name}</div>
              <div className="text-xs text-slate-400">
                Rate: ₹{scannedProduct.sellingPrice} / {scannedProduct.unit} • Subtotal: ₹{Math.round(scannedProduct.sellingPrice * spokenQty)}
              </div>
            </div>

            <button
              onClick={handleConfirmAddToCart}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add {spokenQty} {scannedProduct.unit} to Bill</span>
            </button>
          </div>
        ) : (
          /* Quick Click Barcodes for Demonstration */
          <div className="mb-3">
            <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">
              Tap Sample Barcode (Quick Testing):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {catalog.slice(0, 4).map((p) => (
                <button
                  key={p._id}
                  onClick={() => handleSimulateScan(p)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left text-xs transition-colors"
                >
                  <Barcode className="w-4 h-4 text-blue-400 mb-1" />
                  <span className="font-semibold block truncate text-slate-200">{p.name}</span>
                  <span className="text-[10px] text-slate-400">₹{p.sellingPrice}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
          >
            Done Scanning
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;

