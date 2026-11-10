import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  History,
  Truck,
  RotateCw,
  Search,
  CheckCircle2,
  Package,
  MessageCircle,
  Send,
  FileText,
} from 'lucide-react';
import { inventoryAPI, productsAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

const Inventory = () => {
  const { t } = useLanguage();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);

  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSupplierIndentModal, setShowSupplierIndentModal] = useState(false);
  const [supplierIndents, setSupplierIndents] = useState([]);
  const [generatingIndent, setGeneratingIndent] = useState(false);

  // Stock Adjustment Form State
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustType, setAdjustType] = useState('ADJUSTMENT_IN');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Purchase Entry Form State
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([
    { productId: '', quantity: 10, costPrice: 0 },
  ]);
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState('CASH');

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const [overRes, movRes, prodRes] = await Promise.all([
        inventoryAPI.getOverview(),
        inventoryAPI.getMovements({ limit: 40 }),
        productsAPI.getProducts(),
      ]);

      if (overRes.data.success) setOverview(overRes.data);
      if (movRes.data.success) setMovements(movRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
    } catch (err) {
      toast.error('Failed to load inventory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustProductId || !adjustQty || parseFloat(adjustQty) <= 0) {
      toast.warning('Please enter valid product and adjustment quantity.');
      return;
    }

    try {
      const res = await inventoryAPI.adjustStock({
        productId: adjustProductId,
        type: adjustType,
        quantity: parseFloat(adjustQty),
        reason: adjustReason,
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Stock adjusted!');
        setShowAdjustModal(false);
        setAdjustProductId('');
        setAdjustQty('');
        setAdjustReason('');
        fetchInventoryData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Stock adjustment failed.');
    }
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!supplierName.trim() || purchaseItems.some((i) => !i.productId || i.quantity <= 0)) {
      toast.warning('Please fill in supplier name and valid items.');
      return;
    }

    try {
      const res = await inventoryAPI.recordPurchase({
        supplierName,
        supplierContact,
        items: purchaseItems,
        paymentMethod: purchasePaymentMethod,
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Purchase entry recorded!');
        setShowPurchaseModal(false);
        setSupplierName('');
        setSupplierContact('');
        setPurchaseItems([{ productId: '', quantity: 10, costPrice: 0 }]);
        fetchInventoryData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purchase recording failed.');
    }
  };

  // Generate Wholesale Purchase Indent for WhatsApp
  const handleGenerateSupplierIndent = async () => {
    setGeneratingIndent(true);
    try {
      const res = await inventoryAPI.generateSupplierIndent({});
      if (res.data.success) {
        if (res.data.indents.length === 0) {
          toast.info(res.data.message || 'No items running low on stock.');
        } else {
          setSupplierIndents(res.data.indents);
          setShowSupplierIndentModal(true);
        }
      }
    } catch (err) {
      toast.error('Failed to generate supplier indent.');
    } finally {
      setGeneratingIndent(false);
    }
  };

  const handleOpenWhatsAppIndent = (url) => {
    window.open(url, '_blank');
    toast.success('Wholesale Purchase Order opened in WhatsApp!');
  };

  const summary = overview?.summary || {
    totalProducts: 0,
    totalStockValue: 0,
    totalRetailValue: 0,
    potentialProfit: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('inventory')} Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time stock valuation, wholesale supplier reordering & stock movement audit log
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Supplier Wholesale WhatsApp Indent Button */}
          <button
            onClick={handleGenerateSupplierIndent}
            disabled={generatingIndent}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold shadow-xs transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>{generatingIndent ? 'Drafting...' : 'Supplier Wholesale Order (WhatsApp)'}</span>
          </button>

          <button
            onClick={() => setShowAdjustModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-surface-border bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors"
          >
            <RotateCw className="w-4 h-4 text-slate-500" />
            <span>Stock Adjustment</span>
          </button>

          <button
            onClick={() => setShowPurchaseModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Truck className="w-4 h-4" />
            <span>Receive Inward Goods</span>
          </button>
        </div>
      </div>

      {/* Inventory Valuation KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Total Stock Cost</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">₹{summary.totalStockValue.toLocaleString('en-IN')}</div>
          <p className="text-[11px] text-slate-500 mt-1">Capital invested at cost price</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Retail Valuation</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">₹{summary.totalRetailValue.toLocaleString('en-IN')}</div>
          <p className="text-[11px] text-slate-500 mt-1">Expected retail sale revenue</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Potential Profit</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">₹{summary.potentialProfit.toLocaleString('en-IN')}</div>
          <p className="text-[11px] text-slate-500 mt-1">Gross margin when cleared</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Low / Depleted Items</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{summary.lowStockCount} items</div>
          <p className="text-[11px] text-amber-700 mt-1 font-semibold">Below min safety stock</p>
        </div>
      </div>

      {/* Stock Movement History Ledger */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-base">Stock Movement Audit Ledger</h2>
          </div>
          <span className="text-xs text-slate-500">Atomic inventory changes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-surface-border">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Quantity Change</th>
                <th className="py-3 px-4">Stock Before</th>
                <th className="py-3 px-4">Stock After</th>
                <th className="py-3 px-4">Reason / Ref</th>
                <th className="py-3 px-4">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Loading stock movements...
                  </td>
                </tr>
              ) : movements.length > 0 ? (
                movements.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {m.productName}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          m.type.includes('IN') || m.type === 'PURCHASE' || m.type === 'INITIAL_STOCK'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.type === 'REVERSAL'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black">
                      <span
                        className={
                          m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{m.balanceBefore}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{m.balanceAfter}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {m.reason || m.referenceId || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {m.performedBy}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No stock movements recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WHOLESALE SUPPLIER ORDER INDENT MODAL */}
      {showSupplierIndentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Wholesale Supplier Order Indents</h3>
                  <p className="text-xs text-slate-500">Grouped by distributor with dispatch instructions</p>
                </div>
              </div>
              <button
                onClick={() => setShowSupplierIndentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {supplierIndents.map((indent, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-sm">
                      Distributor: {indent.supplierName}
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                      {indent.itemsCount} SKUs
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-line font-mono mb-3 leading-relaxed">
                    {indent.messageText}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleOpenWhatsAppIndent(indent.whatsappUrl)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to {indent.supplierName} on WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-2 border-t border-surface-border flex justify-end">
              <button
                onClick={() => setShowSupplierIndentModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-border">
            <h3 className="font-bold text-slate-900 text-base mb-1">Manual Stock Adjustment</h3>
            <p className="text-xs text-slate-500 mb-4">Correct inventory for spoilage, theft, or physical recount</p>

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Product</label>
                <select
                  value={adjustProductId}
                  onChange={(e) => setAdjustProductId(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                >
                  <option value="">Choose item...</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (Current: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('ADJUSTMENT_IN')}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                      adjustType === 'ADJUSTMENT_IN'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" /> Stock In (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('ADJUSTMENT_OUT')}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                      adjustType === 'ADJUSTMENT_OUT'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" /> Stock Out (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Quantity</label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Physical inventory recount / damaged"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIVE INWARD GOODS (PURCHASE ENTRY) MODAL */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-border max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 text-base mb-1">Receive Inward Goods from Supplier</h3>
            <p className="text-xs text-slate-500 mb-4">Stock will be automatically increased upon confirmation</p>

            <form onSubmit={handlePurchaseSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Supplier / Distributor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Aavin Co-op Depot / Thanjavur Mills"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Supplier Contact Phone (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 9840123456"
                  value={supplierContact}
                  onChange={(e) => setSupplierContact(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Items Received
                </label>
                <div className="space-y-2">
                  {purchaseItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const updated = [...purchaseItems];
                          const prod = products.find((p) => p._id === e.target.value);
                          updated[idx].productId = e.target.value;
                          if (prod) updated[idx].costPrice = prod.purchasePrice;
                          setPurchaseItems(updated);
                        }}
                        className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
                        required
                      >
                        <option value="">Select product...</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...purchaseItems];
                          updated[idx].quantity = parseFloat(e.target.value) || 0;
                          setPurchaseItems(updated);
                        }}
                        placeholder="Qty"
                        className="w-20 p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center"
                        required
                      />

                      <input
                        type="number"
                        value={item.costPrice}
                        onChange={(e) => {
                          const updated = [...purchaseItems];
                          updated[idx].costPrice = parseFloat(e.target.value) || 0;
                          setPurchaseItems(updated);
                        }}
                        placeholder="Cost ₹"
                        className="w-24 p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Confirm Goods Inward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
