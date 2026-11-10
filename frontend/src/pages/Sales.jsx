import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Printer,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Mic,
  DollarSign,
  User,
  Trash2,
  Barcode,
} from 'lucide-react';
import { salesAPI, productsAPI, customersAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BarcodeScannerModal from '../components/sales/BarcodeScannerModal';

const Sales = () => {
  const { t } = useLanguage();
  const { shop } = useAuth();
  const toast = useToast();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [reverseReason, setReverseReason] = useState('');
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [saleToReverse, setSaleToReverse] = useState(null);

  // Catalog & Customer lists
  const [catalog, setCatalog] = useState([]);
  const [customerList, setCustomerList] = useState([]);

  // New Sale Form State
  const [newSaleItems, setNewSaleItems] = useState([
    { productId: '', quantity: 1, unitPrice: 0, totalPrice: 0 },
  ]);
  const [newSalePayment, setNewSalePayment] = useState('CASH');
  const [newSaleCustomer, setNewSaleCustomer] = useState('');
  const [newSaleCustomerPhone, setNewSaleCustomerPhone] = useState('');
  const [newSaleDiscount, setNewSaleDiscount] = useState(0);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (paymentFilter !== 'All') params.paymentMethod = paymentFilter;
      if (dateFilter) params.startDate = dateFilter;

      const res = await salesAPI.getSales(params);
      if (res.data.success) {
        setSales(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load sales list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    const loadContext = async () => {
      try {
        const [prodRes, custRes] = await Promise.all([
          productsAPI.getProducts(),
          customersAPI.getCustomers(),
        ]);
        if (prodRes.data.success) setCatalog(prodRes.data.data);
        if (custRes.data.success) setCustomerList(custRes.data.data);
      } catch (err) {
        console.warn('Sales context error:', err);
      }
    };
    loadContext();
  }, [paymentFilter, dateFilter]);

  const handleAddItemRow = () => {
    setNewSaleItems([
      ...newSaleItems,
      { productId: '', quantity: 1, unitPrice: 0, totalPrice: 0 },
    ]);
  };

  const handleRemoveItemRow = (idx) => {
    if (newSaleItems.length === 1) return;
    setNewSaleItems(newSaleItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...newSaleItems];
    if (field === 'productId') {
      const prod = catalog.find((p) => p._id === value);
      updated[idx].productId = value;
      updated[idx].unitPrice = prod ? prod.sellingPrice : 0;
      updated[idx].unit = prod ? prod.unit : 'unit';
      updated[idx].productName = prod ? prod.name : '';
      updated[idx].totalPrice = Math.round(updated[idx].quantity * (prod ? prod.sellingPrice : 0) * 100) / 100;
    } else if (field === 'quantity') {
      const qty = parseFloat(value) || 0;
      updated[idx].quantity = qty;
      updated[idx].totalPrice = Math.round(qty * (updated[idx].unitPrice || 0) * 100) / 100;
    } else if (field === 'unitPrice') {
      const price = parseFloat(value) || 0;
      updated[idx].unitPrice = price;
      updated[idx].totalPrice = Math.round((updated[idx].quantity || 1) * price * 100) / 100;
    }
    setNewSaleItems(updated);
  };

  // Callback from Barcode scanner
  const handleProductScanned = (product, quantity) => {
    const existingIdx = newSaleItems.findIndex((i) => i.productId === product._id);
    if (existingIdx >= 0) {
      const updated = [...newSaleItems];
      updated[existingIdx].quantity += quantity;
      updated[existingIdx].totalPrice = Math.round(updated[existingIdx].quantity * updated[existingIdx].unitPrice * 100) / 100;
      setNewSaleItems(updated);
    } else {
      // If the first row is empty, fill it
      if (newSaleItems.length === 1 && !newSaleItems[0].productId) {
        setNewSaleItems([{
          productId: product._id,
          productName: product.name,
          quantity,
          unit: product.unit,
          unitPrice: product.sellingPrice,
          totalPrice: Math.round(quantity * product.sellingPrice * 100) / 100,
        }]);
      } else {
        setNewSaleItems([
          ...newSaleItems,
          {
            productId: product._id,
            productName: product.name,
            quantity,
            unit: product.unit,
            unitPrice: product.sellingPrice,
            totalPrice: Math.round(quantity * product.sellingPrice * 100) / 100,
          },
        ]);
      }
    }
    toast.success(`Scanned: ${quantity} ${product.unit} ${product.name}`);
    setShowNewSaleModal(true);
  };

  const subtotalNewSale = newSaleItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const totalNewSale = Math.max(0, subtotalNewSale - (parseFloat(newSaleDiscount) || 0));

  const handleCreateSaleSubmit = async (e) => {
    e.preventDefault();
    if (newSaleItems.some((i) => !i.productId || i.quantity <= 0)) {
      toast.warning('Please select valid products and quantities for all items.');
      return;
    }

    try {
      const payload = {
        items: newSaleItems,
        paymentMethod: newSalePayment,
        customerName: newSaleCustomer || 'Walk-in Customer',
        customerPhone: newSaleCustomerPhone,
        discount: parseFloat(newSaleDiscount) || 0,
      };

      const res = await salesAPI.createSale(payload);
      if (res.data.success) {
        toast.success(res.data.message || 'Sale created successfully!');
        setShowNewSaleModal(false);
        setNewSaleItems([{ productId: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
        setNewSaleCustomer('');
        setNewSaleCustomerPhone('');
        setNewSaleDiscount(0);
        fetchSales();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create sale.');
    }
  };

  const handleReverseSale = async () => {
    if (!saleToReverse) return;
    try {
      const res = await salesAPI.reverseSale(saleToReverse._id, { reason: reverseReason || 'Cancelled by shop owner' });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowReverseModal(false);
        setSaleToReverse(null);
        setReverseReason('');
        fetchSales();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reverse sale.');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('sales')} Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Billing counter, barcode quick-scanner, transaction audit & printable receipts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBarcodeScanner(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Barcode className="w-4 h-4 text-blue-400" />
            <span>Scan Barcode + Voice</span>
          </button>

          <button
            onClick={() => setShowNewSaleModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newSale')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchSales()}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Payment Method Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs">
            {['All', 'CASH', 'UPI', 'CREDIT'].map((method) => (
              <button
                key={method}
                onClick={() => setPaymentFilter(method)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  paymentFilter === method
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            />
            {dateFilter && (
              <button onClick={() => setDateFilter('')} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sales Transactions Table */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-surface-border">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Count</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Gross Profit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    Loading sales records...
                  </td>
                </tr>
              ) : sales.length > 0 ? (
                sales.map((sale) => (
                  <tr
                    key={sale._id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      sale.isReversed ? 'bg-red-50/40 opacity-75' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{sale.invoiceNumber}</span>
                      {sale.voiceCommandOrigin && (
                        <span title="Voice-recorded" className="text-blue-600">
                          <Mic className="w-3.5 h-3.5 inline" />
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(sale.createdAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {sale.customerName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {sale.items?.length || 0} items
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          sale.paymentMethod === 'UPI'
                            ? 'bg-blue-100 text-blue-800'
                            : sale.paymentMethod === 'CREDIT'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      ₹{Math.round(sale.total)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      +₹{Math.round(sale.grossProfit)}
                    </td>
                    <td className="py-3.5 px-4">
                      {sale.isReversed ? (
                        <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                          Cancelled
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          title="View Receipt"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {!sale.isReversed && (
                          <button
                            onClick={() => {
                              setSaleToReverse(sale);
                              setShowReverseModal(true);
                            }}
                            title="Cancel / Reverse Transaction"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    No sales matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW SALE MODAL */}
      {showNewSaleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-surface-border">
            <div className="p-5 border-b border-surface-border flex items-center justify-between shrink-0 bg-slate-50/70 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">New Sale Billing Counter</h3>
                  <p className="text-xs text-slate-500">Record retail sale and automatically deduct stock</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewSaleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSaleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    placeholder="Walk-in Customer"
                    value={newSaleCustomer}
                    onChange={(e) => setNewSaleCustomer(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Customer Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 9840123456"
                    value={newSaleCustomerPhone}
                    onChange={(e) => setNewSaleCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Sale Items
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowBarcodeScanner(true)}
                      className="text-xs font-bold text-slate-800 hover:text-blue-600 flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg"
                    >
                      <Barcode className="w-3.5 h-3.5 text-blue-600" /> Scan Barcode
                    </button>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Another Item
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {newSaleItems.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex-1">
                        <select
                          value={row.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                          required
                        >
                          <option value="">Select Product...</option>
                          {catalog.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name} (Stock: {p.currentStock} {p.unit} • ₹{p.sellingPrice})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={row.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="w-full p-2 text-center bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          value={row.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          placeholder="Price"
                          className="w-full p-2 text-right bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="w-20 text-right font-black text-slate-900 text-sm">
                        ₹{Math.round(row.totalPrice || 0)}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        disabled={newSaleItems.length === 1}
                        className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['CASH', 'UPI', 'CREDIT'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setNewSalePayment(mode)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        newSalePayment === mode
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Total Payable</span>
                  <span className="text-xs text-blue-400 font-semibold">Payment: {newSalePayment}</span>
                </div>
                <div className="text-2xl font-black text-white">₹{Math.round(totalNewSale)}</div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-surface-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewSaleModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20"
                >
                  Confirm & Print Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onProductScanned={handleProductScanned}
        catalog={catalog}
      />

      {/* PRINTABLE RECEIPT MODAL */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-border print:m-0 print:p-0 print:border-none print:shadow-none">
            <div id="printable-receipt" className="text-slate-900">
              <div className="text-center pb-4 border-b border-dashed border-slate-300">
                <h2 className="font-black text-xl tracking-tight">{shop?.name || 'KadaiVoice Store'}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {shop?.address?.street || 'Market Road'}, {shop?.address?.city || 'Chennai'}
                </p>
                <p className="text-xs text-slate-500">Ph: {shop?.phone || '9840123456'}</p>
                <div className="mt-2 text-xs font-bold text-slate-700">
                  INVOICE: {selectedSale.invoiceNumber}
                </div>
                <div className="text-[11px] text-slate-400">
                  {new Date(selectedSale.createdAt).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-300 text-xs">
                <div>Customer: <span className="font-bold">{selectedSale.customerName}</span></div>
                <div>Payment Mode: <span className="font-bold">{selectedSale.paymentMethod}</span></div>
              </div>

              <div className="py-3 border-b border-dashed border-slate-300">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="text-left pb-1">Item</th>
                      <th className="text-center pb-1">Qty</th>
                      <th className="text-right pb-1">Price</th>
                      <th className="text-right pb-1">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSale.items?.map((item, i) => (
                      <tr key={i}>
                        <td className="py-1.5 font-medium">{item.productName}</td>
                        <td className="py-1.5 text-center">{item.quantity} {item.unit}</td>
                        <td className="py-1.5 text-right">₹{item.unitPrice}</td>
                        <td className="py-1.5 text-right font-bold">₹{Math.round(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="py-3 border-b border-dashed border-slate-300 text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold">₹{Math.round(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-₹{Math.round(selectedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black pt-1">
                  <span>Grand Total:</span>
                  <span>₹{Math.round(selectedSale.total)}</span>
                </div>
              </div>

              <div className="text-center pt-4 text-[11px] text-slate-400">
                Thank you! Please visit again 🙏
                <div className="text-[9px] mt-1 text-slate-300">KadaiVoice AI POS</div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-surface-border flex justify-end gap-2.5 print:hidden">
              <button
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={handlePrintReceipt}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVERSE SALE CONFIRMATION MODAL */}
      {showReverseModal && saleToReverse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-border">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Cancel & Reverse Sale {saleToReverse.invoiceNumber}?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              This will automatically restore product inventory levels in MongoDB and write an audit record.
            </p>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Reason for cancellation:
              </label>
              <input
                type="text"
                placeholder="e.g. Customer returned items"
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowReverseModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReverseSale}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
              >
                Confirm Reversal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
