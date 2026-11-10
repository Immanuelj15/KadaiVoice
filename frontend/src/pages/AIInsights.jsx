import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Boxes,
  ShoppingBag,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { aiAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

const AIInsights = () => {
  const { t } = useLanguage();
  const toast = useToast();

  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.getInsights();
      if (res.data.success) {
        setInsights(res.data);
      }
    } catch (err) {
      toast.error('Failed to load AI business insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
              Predictive Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Store Insights & Velocity</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Data-backed inventory optimization, cross-merchandising & working capital protection
          </p>
        </div>

        <button
          onClick={fetchInsights}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-border bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Strategic AI Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights?.strategicInsights?.map((card) => (
          <div
            key={card.id}
            className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${
              card.urgency === 'HIGH'
                ? 'bg-gradient-to-br from-amber-50 to-orange-50/40 border-amber-200'
                : 'bg-white border-surface-border'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {card.type.replace('_', ' ')}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    card.urgency === 'HIGH'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {card.urgency} Priority
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">{card.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Reorder Recommendations */}
      <div className="bg-white rounded-2xl border border-surface-border p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-slate-900 text-base">Restocking & Reorder Recommendations</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Calculated from 14-day sales velocity
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-surface-border">
              <tr>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">Current Stock</th>
                <th className="py-2.5 px-3">Safety Min</th>
                <th className="py-2.5 px-3">Suggested Reorder</th>
                <th className="py-2.5 px-3">Est. Reorder Capital</th>
                <th className="py-2.5 px-3">Urgency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {insights?.restockingAdvice && insights.restockingAdvice.length > 0 ? (
                insights.restockingAdvice.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3 px-3 text-amber-700 font-bold">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{item.minStockLevel} {item.unit}</td>
                    <td className="py-3 px-3 font-bold text-blue-600">
                      +{item.suggestedReorderQuantity} {item.unit}
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900">
                      ₹{item.estimatedReorderCost}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.urgency === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.urgency}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-emerald-600 font-medium">
                    ✓ All inventory stocks are adequately cushioned.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Basket Bundles & Slow Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basket Analysis: Frequently Bought Together */}
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-base">Frequently Purchased Together</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Pairs appearing frequently in same transaction bills
          </p>

          <div className="space-y-3">
            {insights?.topBundles && insights.topBundles.length > 0 ? (
              insights.topBundles.map((b, i) => (
                <div key={i} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs">
                  <div className="flex items-center justify-between font-bold text-indigo-900 mb-1">
                    <span>{b.combination}</span>
                    <span className="text-[10px] bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full">
                      {b.coOccurrenceCount} times
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{b.suggestion}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                Record more multi-item sales to uncover customer bundle patterns.
              </div>
            )}
          </div>
        </div>

        {/* Slow Moving Items (Capital Protection) */}
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h2 className="font-bold text-slate-900 text-base">Slow-Moving SKUs (Capital Tied Up)</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            High stock volume but minimal sales turnover in past 14 days
          </p>

          <div className="space-y-3">
            {insights?.slowMoving && insights.slowMoving.length > 0 ? (
              insights.slowMoving.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{s.name}</span>
                    <span className="text-[11px] text-slate-500">
                      In Stock: {s.currentStock} {s.unit} • Sold (14d): {s.soldPast14Days}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-600 block">
                      ₹{s.capitalTiedUp} tied up
                    </span>
                    <span className="text-[10px] text-slate-400">Clear with discount</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-emerald-600 font-medium">
                ✓ Inventory turnover is healthy. No stagnant working capital detected.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;

