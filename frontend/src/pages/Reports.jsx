import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  Printer,
  Volume2,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CreditCard,
  Package,
  Sparkles,
  ShoppingBag,
  Download,
  FileCode,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { reportsAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Reports = () => {
  const { t, language } = useLanguage();
  const { shop } = useAuth();
  const toast = useToast();

  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // GST & Tally Export State
  const [gstData, setGstData] = useState(null);
  const [loadingGST, setLoadingGST] = useState(false);

  const fetchReport = async (date) => {
    setLoading(true);
    try {
      const res = await reportsAPI.getDailyReport(date);
      if (res.data.success) {
        setReport(res.data);
      }
    } catch (err) {
      toast.error('Failed to generate daily report.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGSTBreakup = async () => {
    setLoadingGST(true);
    try {
      const res = await reportsAPI.getGSTJSON({});
      if (res.data.success) {
        setGstData(res.data.gstReturnData);
      }
    } catch (err) {
      toast.error('Failed to load GST tax bifurcation.');
    } finally {
      setLoadingGST(false);
    }
  };

  useEffect(() => {
    fetchReport(reportDate);
    fetchGSTBreakup();
  }, [reportDate]);

  const handlePlayVoiceSummary = () => {
    if (!report?.aiSummary?.text) return;

    if (report.aiSummary.audioUrl) {
      const audio = new Audio(report.aiSummary.audioUrl);
      setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audio.play();
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(report.aiSummary.text);
      utterance.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Download Tally XML file
  const handleDownloadTallyXML = async () => {
    try {
      toast.info('Generating Tally ERP9 / Prime XML file...');
      const res = await reportsAPI.getTallyXML({});
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/xml' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Tally_Sales_${shop?.name || 'Kadai'}.xml`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Tally XML downloaded successfully!');
    } catch (err) {
      toast.error('Failed to export Tally XML.');
    }
  };

  // Download GSTR-1 JSON
  const handleDownloadGSTJSON = () => {
    if (!gstData) return;
    try {
      const blob = new Blob([JSON.stringify(gstData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `GSTR1_Return_${shop?.name || 'Kadai'}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('GSTR-1 JSON exported successfully for CA filing!');
    } catch (err) {
      toast.error('Failed to download GST JSON.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const metrics = report?.metrics || {
    totalSales: 0,
    cashSales: 0,
    upiSales: 0,
    creditSales: 0,
    totalItemsSold: 0,
    grossProfit: 0,
    totalExpenses: 0,
    netOperatingResult: 0,
    creditIssued: 0,
    creditCollected: 0,
    closingStockValuation: 0,
    lowStockCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">End-of-Day Business Closing Report</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Daily reconciliation of cash, UPI, credit, gross profit & AI audio debrief
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white border border-surface-border px-3 py-2 rounded-xl text-xs font-semibold shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer text-slate-700"
            />
          </div>

          <button
            onClick={() => fetchReport(reportDate)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            {t('generateReport')}
          </button>

          <button
            onClick={handlePrint}
            className="p-2.5 border border-surface-border bg-white text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-colors"
            title="Print or Export PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Report Container */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 sm:p-8 shadow-xs space-y-6 print:m-0 print:border-none print:shadow-none">
        {/* Printable Shop Letterhead */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-surface-border gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full mb-1 inline-block">
              Daily Settlement Statement
            </span>
            <h2 className="text-2xl font-black text-slate-900">{shop?.name || 'Immanuel Mini Mart'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {shop?.address?.street || '14, Bazaar Main Road'}, {shop?.address?.city || 'Chennai'} • GST/Retail
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs text-slate-400 font-semibold uppercase">Closing Statement Date</div>
            <div className="text-lg font-black text-slate-900">
              {new Date(reportDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <div className="text-[11px] text-emerald-600 font-bold mt-0.5">Audit Verified • MongoDB Verified</div>
          </div>
        </div>

        {/* AI Voice Spoken Summary Card with Audio Player */}
        {report?.aiSummary?.text && (
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-900 text-sm">Gnani AI Voice Executive Debrief</h3>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    Timbre Synthesized
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 italic font-medium leading-relaxed">
                  "{report.aiSummary.text}"
                </p>
              </div>
            </div>

            <button
              onClick={handlePlayVoiceSummary}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                isPlayingAudio
                  ? 'bg-emerald-600 hover:bg-emerald-700 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlayingAudio ? 'Speaking...' : 'Listen Audio Summary'}</span>
            </button>
          </div>
        )}

        {/* Revenue & Profit Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              1. Gross Sales Revenue
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{metrics.totalSales.toLocaleString('en-IN')}</div>
            <span className="text-[11px] text-slate-500">{metrics.totalTransactions || 0} total invoices</span>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              2. Gross Profit
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1">₹{metrics.grossProfit.toLocaleString('en-IN')}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Sales Revenue minus Cost of Goods</span>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
              3. Net Operating Result
            </span>
            <div className="text-2xl font-black text-blue-800 mt-1">₹{metrics.netOperatingResult.toLocaleString('en-IN')}</div>
            <span className="text-[11px] text-blue-600 font-medium">Gross Profit minus Expenses (₹{metrics.totalExpenses})</span>
          </div>
        </div>

        {/* Detailed Financial & Tender Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Payment Method Distribution */}
          <div className="border border-surface-border rounded-xl p-4">
            <h4 className="font-bold text-slate-900 text-sm mb-3">Tender Breakdown</h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 font-semibold">
                <span className="text-emerald-900">Cash in Hand:</span>
                <span className="text-emerald-900 font-black">₹{metrics.cashSales}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/60 font-semibold">
                <span className="text-blue-900">UPI Digital QR / PhonePe / GPay:</span>
                <span className="text-blue-900 font-black">₹{metrics.upiSales}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50/60 font-semibold">
                <span className="text-purple-900">Credit (Khata Sales Issued):</span>
                <span className="text-purple-900 font-black">₹{metrics.creditSales}</span>
              </div>
            </div>
          </div>

          {/* Credit & Inventory Settlement */}
          <div className="border border-surface-border rounded-xl p-4">
            <h4 className="font-bold text-slate-900 text-sm mb-3">Working Capital & Credit Audit</h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 font-semibold">
                <span className="text-slate-700">Credit Repayments Collected:</span>
                <span className="text-emerald-600 font-black">₹{metrics.creditCollected}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 font-semibold">
                <span className="text-slate-700">Closing Store Stock Valuation (Cost):</span>
                <span className="text-slate-900 font-black">₹{metrics.closingStockValuation}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 font-semibold">
                <span className="text-slate-700">Low Stock SKUs Requiring Reorder:</span>
                <span className="text-amber-700 font-black">{metrics.lowStockCount} items</span>
              </div>
            </div>
          </div>
        </div>

        {/* GST & TALLY COMPLIANCE SECTION */}
        <div className="pt-4 border-t border-surface-border print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">GST & Tally Compliance Export</h3>
                <p className="text-xs text-slate-500">Auto-bifurcated tax slabs for CA and Tally Prime import</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadTallyXML}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Tally XML (ERP9 / Prime)</span>
              </button>

              <button
                onClick={handleDownloadGSTJSON}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download GSTR-1 JSON</span>
              </button>
            </div>
          </div>

          {/* Tax Slabs Bifurcation Cards */}
          {gstData?.b2cs && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {gstData.b2cs.map((slab) => (
                <div key={slab.taxRate} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-slate-900">{slab.taxRate}% GST Slab</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono">
                      Taxable: ₹{slab.taxableValue}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">{slab.slabCategory}</p>
                  <div className="flex justify-between text-slate-700 font-semibold pt-1 border-t border-slate-200 text-[11px]">
                    <span>CGST + SGST:</span>
                    <span className="text-purple-700 font-bold">₹{Math.round((slab.centralTax + slab.stateTax) * 100) / 100}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Items Section */}
        {report?.lowStockItems && report.lowStockItems.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Critical Low Stock Reorder List
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {report.lowStockItems.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs">
                  <span className="font-bold text-slate-900 block truncate">{item.name}</span>
                  <span className="text-amber-800 font-semibold text-[11px]">
                    Remaining: {item.currentStock} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Signature Block */}
        <div className="pt-6 border-t border-surface-border flex items-center justify-between text-xs text-slate-400">
          <div>KadaiVoice AI • Automated Business Management</div>
          <div>Authorized Signatory: _________________________</div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
