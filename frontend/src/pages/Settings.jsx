import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  Sparkles,
  Key,
  Shield,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Save,
  Globe,
  Database,
  Info,
} from 'lucide-react';
import { settingsAPI, voiceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

const Settings = () => {
  const { shop, updateShop, user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);

  // Shop Profile State
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [businessType, setBusinessType] = useState('Kirana Store');
  const [allowNegativeInventory, setAllowNegativeInventory] = useState(false);

  // AI Status
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    if (shop) {
      setShopName(shop.name || '');
      setOwnerName(shop.ownerName || '');
      setPhone(shop.phone || '');
      setStreet(shop.address?.street || '');
      setCity(shop.address?.city || 'Chennai');
      setBusinessType(shop.businessType || 'Kirana Store');
      setAllowNegativeInventory(Boolean(shop.allowNegativeInventory));
    }

    const loadAI = async () => {
      try {
        const res = await voiceAPI.getAIStatus();
        if (res.data.success) {
          setAiStatus(res.data.gnani);
        }
      } catch (err) {
        console.warn('Could not load AI status:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadAI();
  }, [shop]);

  const handleSaveShop = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await settingsAPI.updateShop({
        name: shopName,
        ownerName,
        phone,
        address: { street, city, state: 'Tamil Nadu' },
        businessType,
        allowNegativeInventory,
        preferredLanguage: language,
      });

      if (res.data.success) {
        toast.success('Shop settings updated successfully!');
        updateShop(res.data.shop);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update shop settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('Are you sure you want to refresh the demo store? This resets 20 sample products and 10 customers for Immanuel Mini Mart.')) {
      return;
    }

    setResettingDemo(true);
    try {
      const res = await settingsAPI.resetDemo();
      if (res.data.success) {
        toast.success(res.data.message || 'Demo data refreshed!');
        window.location.reload();
      }
    } catch (err) {
      toast.error('Failed to reset demo data.');
    } finally {
      setResettingDemo(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('settings')} & Store Profile</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure shop details, sovereign Gnani AI speech keys, and operational preferences
        </p>
      </div>

      {/* Shop Information Card */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-surface-border mb-4">
          <Store className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-900 text-base">Store Identity & Details</h2>
        </div>

        <form onSubmit={handleSaveShop} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Shop Name *</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Owner Name *</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Store Category</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none font-semibold text-slate-700"
              >
                <option value="Kirana Store">Kirana Store</option>
                <option value="Grocery Shop">Grocery Shop</option>
                <option value="Petty Shop">Petty Shop</option>
                <option value="Provision Store">Provision Store</option>
                <option value="Supermarket">Supermarket</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Preferred Spoken Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none font-bold text-blue-700"
              >
                <option value="ta-en">Tanglish (Tamil + English)</option>
                <option value="ta">தமிழ் (Pure Tamil)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Street Address</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="e.g. 14, Bazaar Main Road"
                className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">City / Town</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Negative Stock Policy */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={allowNegativeInventory}
                onChange={(e) => setAllowNegativeInventory(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Allow Negative Stock Selling</span>
                <span className="text-[11px] text-slate-500 block">
                  Permit sales even if system stock reaches 0 (standard practice in busy Kirana counters)
                </span>
              </div>
            </label>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Store Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Gnani AI Integration Architecture Card */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-bold text-slate-900 text-base">Gnani AI Configuration & Diagnostics</h2>
              <p className="text-xs text-slate-500">Official sovereign Indic AI stack (api.vachana.ai)</p>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              aiStatus?.isConfigured
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {aiStatus?.isConfigured ? 'Live Cloud Connected' : 'Mock Demonstration Mode'}
          </span>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-slate-700">
            <div className="font-bold text-slate-900 font-sans mb-1 text-xs">Active Endpoint URLs:</div>
            <div>Prisma STT : {aiStatus?.prismaSTT?.endpoint || 'https://api.vachana.ai/stt/v3'}</div>
            <div>Evon LLM   : {aiStatus?.evonLLM?.endpoint || 'Built-in Indic NLU (Local Hybrid)'}</div>
            <div>Timbre TTS : {aiStatus?.timbreTTS?.endpoint || 'https://api.vachana.ai/api/v1/tts/inference'}</div>
          </div>

          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Diagnostic Information:</span>
            </div>
            {aiStatus?.description}
          </div>
        </div>
      </div>

      {/* Demo Reset Card */}
      <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-rose-900 text-base mb-1">Reset Demo Kirana Store Data</h3>
            <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
              Resets "Immanuel Mini Mart" with 20 fresh sample grocery items (rice, milk, dal, oil, ghee, soaps), 10 customers, and historical sales trends.
            </p>
          </div>
          <button
            onClick={handleResetDemoData}
            disabled={resettingDemo}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 shrink-0"
          >
            {resettingDemo ? 'Resetting...' : 'Reset Demo Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;

