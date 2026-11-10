import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  CreditCard,
  Mic,
  ShoppingCart,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowRight,
  Boxes,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { dashboardAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Dashboard = () => {
  const { t } = useLanguage();
  const { shop } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [salesChart, setSalesChart] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, chartRes] = await Promise.all([
        dashboardAPI.getSummary(),
        dashboardAPI.getSalesChart(),
      ]);

      if (sumRes.data.success) {
        setSummary(sumRes.data);
      }
      if (chartRes.data.success) {
        setSalesChart(chartRes.data.chartData);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      toast.error('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-200 rounded-2xl" />
          <div className="h-80 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const kpis = summary?.kpis || {
    todaySales: 0,
    todayGrossProfit: 0,
    totalProducts: 0,
    lowStockCount: 0,
    pendingCustomerCredit: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            வணக்கம், {shop?.ownerName || 'Shop Owner'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {shop?.name || 'Local Store'} • Business Overview & Real-Time Performance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-2.5 rounded-xl border border-surface-border bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/voice')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Mic className="w-4 h-4" />
            <span>Voice Command</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('todaySales')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">₹{kpis.todaySales.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>{kpis.todayTransactionsCount || 0} bills today</span>
            </div>
          </div>
        </div>

        {/* Today's Gross Profit */}
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('todayProfit')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600">₹{kpis.todayGrossProfit.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              Gross margin before expenses
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('totalProducts')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{kpis.totalProducts}</div>
            <div className="text-[11px] text-slate-500 mt-1">Active items in store</div>
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('lowStock')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600">{kpis.lowStockCount}</div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">
              {kpis.lowStockCount > 0 ? 'Needs reordering' : 'Stock levels healthy'}
            </div>
          </div>
        </div>

        {/* Pending Customer Credit */}
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('pendingCredit')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-700">₹{kpis.pendingCustomerCredit.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-slate-500 mt-1">Total customer udhari</div>
          </div>
        </div>
      </div>

      {/* AI Business Summary Card */}
      {summary?.aiSummary && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-slate-900 text-sm">{t('aiSummary')}</h2>
              <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                Live Insights
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              "{summary.aiSummary}"
            </p>
          </div>
        </div>
      )}

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart (7 Days) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-surface-border shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-base">{t('salesOverview')}</h2>
              <p className="text-xs text-slate-500">Past 7 days revenue & gross profit trajectory</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Sales (₹)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Gross Profit (₹)
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="profit" stroke="#16A34A" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-900 text-base">{t('topSelling')}</h2>
              <button
                onClick={() => navigate('/products')}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                View all
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Highest volume items sold in last 30 days</p>

            <div className="space-y-3">
              {summary?.topSellingProducts && summary.topSellingProducts.length > 0 ? (
                summary.topSellingProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-800 text-xs sm:text-sm truncate max-w-[140px]">
                          {p._id}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Total Revenue: ₹{Math.round(p.totalRevenue)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 block">
                        {p.totalQuantity} {p.unit}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  No sales recorded yet. Speak a voice command to record your first sale!
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-surface-border">
            <button
              onClick={() => navigate('/voice')}
              className="w-full py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Record Sale with Voice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lower Row: Low Stock Alerts + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-slate-900 text-base">{t('lowStockAlerts')}</h2>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
              {summary?.lowStockAlerts?.length || 0} Critical
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Items below minimum safety threshold</p>

          <div className="space-y-2.5">
            {summary?.lowStockAlerts && summary.lowStockAlerts.length > 0 ? (
              summary.lowStockAlerts.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-800 text-xs sm:text-sm">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {item.category} • Min Level: {item.minStockLevel} {item.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-800 px-2 py-1 bg-amber-100 rounded-md">
                      {item.currentStock} {item.unit} left
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-emerald-600 font-medium">
                ✓ All product stocks are well stocked.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-surface-border">
            <button
              onClick={() => navigate('/inventory')}
              className="w-full py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
            >
              <span>Manage Store Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-surface-border shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-bold text-slate-900 text-base">{t('recentTransactions')}</h2>
              <p className="text-xs text-slate-500">Latest orders recorded via voice and manual counter</p>
            </div>
            <button
              onClick={() => navigate('/sales')}
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <span>View all sales</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-surface-border">
                <tr>
                  <th className="py-2.5 px-3">Invoice</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
                  summary.recentTransactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {tx.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium truncate max-w-[120px]">
                        {tx.customerName}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {tx.items?.length || 0} item(s)
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tx.paymentMethod === 'UPI'
                              ? 'bg-blue-100 text-blue-800'
                              : tx.paymentMethod === 'CREDIT'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">
                        ₹{Math.round(tx.total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      No sales recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

