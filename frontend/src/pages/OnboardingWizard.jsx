import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  CheckCircle2,
  Package,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Boxes,
} from 'lucide-react';
import { authAPI, productsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const { shop, updateShop } = useAuth();
  const { setLanguage } = useLanguage();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Details
  const [shopName, setShopName] = useState(shop?.name || '');
  const [ownerName, setOwnerName] = useState(shop?.ownerName || '');
  const [businessType, setBusinessType] = useState(shop?.businessType || 'Kirana Store');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Chennai');
  const [prefLang, setPrefLang] = useState('ta-en');
  const [currency, setCurrency] = useState('INR');

  // Step 2: Preferences
  const [allowNegative, setAllowNegative] = useState(false);

  // Step 3: Opening Inventory selection
  const [loadDemoProducts, setLoadDemoProducts] = useState(true);

  const sampleOpeningProducts = [
    { name: 'Ponni Boiled Rice', nameTamil: 'பொன்னி அரிசி', category: 'Groceries & Grains', purchasePrice: 52, sellingPrice: 60, currentStock: 50, unit: 'kg' },
    { name: 'Aavin Green Milk', nameTamil: 'ஆவின் பால்', category: 'Dairy & Eggs', purchasePrice: 22, sellingPrice: 25, currentStock: 20, unit: 'packet' },
    { name: 'Gold Winner Sunflower Oil', nameTamil: 'சன்ஃபிளவர் எண்ணெய்', category: 'Cooking Oil & Ghee', purchasePrice: 135, sellingPrice: 150, currentStock: 15, unit: 'liter' },
    { name: 'Toor Dal First Quality', nameTamil: 'துவரம் பருப்பு', category: 'Groceries & Grains', purchasePrice: 140, sellingPrice: 160, currentStock: 20, unit: 'kg' },
    { name: 'Farm Fresh Eggs', nameTamil: 'முட்டை', category: 'Dairy & Eggs', purchasePrice: 5.5, sellingPrice: 7, currentStock: 60, unit: 'piece' },
  ];

  const handleFinishSetup = async () => {
    setLoading(true);
    try {
      // 1. Update Shop Configuration
      const res = await authAPI.setup({
        shopName,
        ownerName,
        businessType,
        address: { street, city, state: 'Tamil Nadu' },
        preferredLanguage: prefLang,
        currency,
        allowNegativeInventory: allowNegative,
      });

      if (res.data.success) {
        updateShop(res.data.shop);
        setLanguage(prefLang);

        // 2. Bulk load opening inventory if chosen
        if (loadDemoProducts) {
          await productsAPI.bulkAdd(sampleOpeningProducts);
        }

        toast.success('Shop setup completed! Welcome to your KadaiVoice dashboard.');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/20 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto">
        {/* Step Indicator Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome to KadaiVoice AI Setup Wizard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Step {step} of 3: {step === 1 ? 'Store Details' : step === 2 ? 'Store Preferences' : 'Opening Inventory'}
          </p>

          <div className="flex items-center justify-center gap-2 mt-4 max-w-xs mx-auto">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Wizard Card Body */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-surface-border shadow-xl">
          {/* STEP 1: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">Confirm Your Store Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Shop Name</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 14, Bazaar Main Road"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Business Type</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="Kirana Store">Kirana Store</option>
                    <option value="Grocery Shop">Grocery Shop</option>
                    <option value="Petty Shop">Petty Shop</option>
                    <option value="Provision Store">Provision Store</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Preferred Language</label>
                  <select
                    value={prefLang}
                    onChange={(e) => setPrefLang(e.target.value)}
                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold text-blue-700"
                  >
                    <option value="ta-en">Tanglish (Tamil + English)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Preferences */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">Store Accounting & Currency Rules</h2>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Currency</span>
                  <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-md border border-slate-300">
                    INR (₹) Indian Rupee
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Financial Reporting Year</span>
                  <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-md border border-slate-300">
                    Standard (April 1 – March 31)
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer p-3.5 bg-blue-50/60 rounded-xl border border-blue-200">
                  <input
                    type="checkbox"
                    checked={allowNegative}
                    onChange={(e) => setAllowNegative(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Allow Negative Stock Selling</span>
                    <span className="text-[11px] text-slate-500 block">
                      Permit sales when physical stock is available in counter even before entering supplier invoices
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: Opening Inventory */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">Add Opening Store Inventory</h2>
              <p className="text-xs text-slate-500">
                You can preload starter sample products for testing voice sales immediately, or start completely empty.
              </p>

              <label className="flex items-start gap-3 p-4 bg-blue-50/70 border border-blue-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={loadDemoProducts}
                  onChange={(e) => setLoadDemoProducts(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-md mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Preload Popular Kirana Items (Rice, Milk, Oil, Dal, Eggs)
                  </span>
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    Recommended for instant voice command testing in Tamil & English.
                  </span>
                </div>
              </label>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <span className="font-bold text-slate-800 block mb-1">Items included:</span>
                • Ponni Boiled Rice (50 kg) • Aavin Green Milk (20 packets) • Sunflower Oil (15 liters) • Toor Dal (20 kg) • Farm Fresh Eggs (60 pcs)
              </div>
            </div>
          )}

          {/* Footer Navigation Buttons */}
          <div className="mt-8 pt-4 border-t border-surface-border flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleFinishSetup}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Finalizing Setup...' : 'Launch KadaiVoice AI'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;

