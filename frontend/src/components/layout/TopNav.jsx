import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Globe,
  Mic,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { voiceAPI } from '../../services/api';

const TopNav = ({ setMobileOpen }) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, shop } = useAuth();
  const navigate = useNavigate();

  const [aiStatus, setAiStatus] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await voiceAPI.getAIStatus();
        if (res.data.success) {
          setAiStatus(res.data.gnani);
        }
      } catch (err) {
        console.warn('Could not fetch AI status:', err.message);
      }
    };
    fetchStatus();
  }, []);

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <header className="h-16 bg-white border-b border-surface-border sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
        {/* Left Section: Mobile Menu + Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative w-full hidden sm:block">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('search')}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Right Section: Date, AI Status, Language Selector, Mic Quick Action */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Date Indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{todayStr}</span>
          </div>

          {/* Gnani AI Status Pill */}
          <button
            onClick={() => setShowStatusModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              aiStatus?.isConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
            }`}
            title="Click to check Gnani AI Engine status"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span className="hidden sm:inline">
              {aiStatus?.isConfigured ? 'Gnani AI Live' : 'Gnani AI Ready'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                aiStatus?.isConfigured ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
            />
          </button>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-surface-border rounded-xl p-1">
            <Globe className="w-3.5 h-3.5 ml-1.5 text-slate-400 hidden sm:block" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 py-1 px-1.5 focus:outline-none cursor-pointer"
            >
              <option value="ta-en">Tanglish</option>
              <option value="ta">தமிழ்</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Quick Voice Assistant Trigger Button */}
          <button
            onClick={() => navigate('/voice')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl shadow-xs transition-all duration-150"
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">{t('startRecording')}</span>
          </button>
        </div>
      </header>

      {/* Gnani AI Platform Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-border relative">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Gnani AI Engine Architecture</h3>
                  <p className="text-xs text-slate-500">Official Sovereign Voice AI Platform</p>
                </div>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                  <span>1. Gnani Prisma (STT)</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                    prisma-v3.0
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Speech-to-Text with code-mixed Indic recognition (Tamil, Tanglish & Indian English).
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                  <span>2. Gnani Evon (NLU / LLM)</span>
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                    evon-v3.3
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Indic reasoning model for Kirana store structured intent extraction into strict JSON.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                  <span>3. Gnani Timbre (TTS)</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    timbre-v2.5
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Natural synthetic spoken confirmation and daily business audio report summaries.
                </p>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold mb-0.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>Deployment Mode:</span>
                </div>
                {aiStatus?.isConfigured ? (
                  <span>Connected directly to live Gnani.ai cloud APIs.</span>
                ) : (
                  <span>
                    Currently active in <strong>Explicit Mock Demonstration Mode</strong>. Audio, intent extraction, and speech synthesis are fully functional locally. To connect live Gnani cloud API keys, update <code className="bg-white px-1 py-0.5 rounded border border-blue-200 text-blue-800">GNANI_API_KEY</code> in Settings.
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-surface-border flex justify-end">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopNav;

