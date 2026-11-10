import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShoppingCart,
  Boxes,
  CreditCard,
  HelpCircle,
  Volume2,
  ChevronRight,
  User,
} from 'lucide-react';

const TransactionPreviewModal = ({
  extraction,
  onConfirm,
  onCancel,
  isConfirming,
  catalog = [],
  customers = [],
}) => {
  if (!extraction) return null;

  const [paymentMethod, setPaymentMethod] = useState(extraction.paymentMethod || 'CASH');
  const [customerName, setCustomerName] = useState(extraction.customerName || '');
  const [creditAmount, setCreditAmount] = useState(extraction.creditAmount || extraction.estimatedTotal || '');
  const [items, setItems] = useState(extraction.verifiedItems || []);

  const handleQuantityChange = (index, newQty) => {
    const updated = [...items];
    const val = parseFloat(newQty) || 0;
    updated[index].quantity = val;
    updated[index].totalPrice = Math.round(val * (updated[index].unitPrice || 0) * 100) / 100;
    setItems(updated);
  };

  const handleProductSelect = (index, selectedProductId) => {
    const product = catalog.find((p) => p._id === selectedProductId);
    if (!product) return;
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: product._id,
      productName: product.name,
      matchedCatalog: true,
      unitPrice: product.sellingPrice,
      unit: product.unit,
      totalPrice: Math.round(updated[index].quantity * product.sellingPrice * 100) / 100,
      currentStock: product.currentStock,
      warning: product.currentStock < updated[index].quantity ? 'Low stock' : null,
    };
    setItems(updated);
  };

  const totalCalculated = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  const canConfirm =
    extraction.intent === 'CREATE_CREDIT'
      ? parseFloat(creditAmount) > 0 && customerName.trim().length > 0
      : items.length > 0 && items.every((i) => i.productId && i.quantity > 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-surface-border animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-surface-border flex items-center justify-between shrink-0 bg-blue-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              {extraction.intent === 'CREATE_SALE' && <ShoppingCart className="w-5 h-5" />}
              {extraction.intent === 'ADD_STOCK' && <Boxes className="w-5 h-5" />}
              {extraction.intent === 'CREATE_CREDIT' && <CreditCard className="w-5 h-5" />}
              {!['CREATE_SALE', 'ADD_STOCK', 'CREATE_CREDIT'].includes(extraction.intent) && (
                <HelpCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Verify AI Extracted Action</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  {extraction.intent?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Please review before saving to inventory & ledger</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isConfirming}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          {/* Spoken Response Preview */}
          {extraction.spokenResponseText && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs">
              <Volume2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Spoken Voice Feedback:</span>
                <p className="mt-0.5 text-slate-600 italic">"{extraction.spokenResponseText}"</p>
              </div>
            </div>
          )}

          {/* Ambiguity / Clarification Alert */}
          {extraction.clarificationQuestion && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Clarification Needed:</span>
                <p className="mt-0.5">{extraction.clarificationQuestion}</p>
              </div>
            </div>
          )}

          {/* Warnings List */}
          {extraction.warnings && extraction.warnings.length > 0 && (
            <div className="space-y-1.5">
              {extraction.warnings.map((w, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-red-50 text-red-800 border border-red-200 text-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Items List (Sales or Stock Add) */}
          {items.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                Items to Process
              </label>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      {item.matchedCatalog ? (
                        <div className="font-semibold text-slate-800 text-sm truncate">
                          {item.productName}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-amber-700">
                            Unmatched: "{item.productName}"
                          </span>
                          <select
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            className="text-xs border border-amber-300 rounded-lg p-1.5 bg-amber-50/50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="">Select matching product from catalog...</option>
                            {catalog.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name} (₹{p.sellingPrice} / {p.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.matchedCatalog && (
                          <span>
                            Rate: ₹{item.unitPrice} / {item.unit} • Available: {item.currentStock} {item.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(idx, e.target.value)}
                          className="w-16 px-2 py-1 text-center font-bold text-slate-800 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        />
                        <span className="text-xs text-slate-500 font-medium">{item.unit}</span>
                      </div>
                      <div className="w-20 text-right font-bold text-slate-900 text-sm">
                        ₹{Math.round(item.totalPrice || 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method Selector (for Sales) */}
          {extraction.intent === 'CREATE_SALE' && (
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['CASH', 'UPI', 'CREDIT'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      paymentMethod === method
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer / Credit Input (if Credit or intent is CREATE_CREDIT) */}
          {(paymentMethod === 'CREDIT' || extraction.intent === 'CREATE_CREDIT') && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                <User className="w-3.5 h-3.5 text-amber-700" />
                <span>Customer Khata Ledger Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Customer Name:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {extraction.intent === 'CREATE_CREDIT' && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Credit Amount (₹):
                    </label>
                    <input
                      type="number"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grand Total Summary */}
          {extraction.intent === 'CREATE_SALE' && (
            <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs text-slate-300 block">Total Transaction Value</span>
                <span className="text-xs text-blue-400 font-medium">Payment Mode: {paymentMethod}</span>
              </div>
              <div className="text-xl font-extrabold text-white">₹{Math.round(totalCalculated)}</div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-surface-border bg-slate-50 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canConfirm || isConfirming}
            onClick={() =>
              onConfirm({
                intent: extraction.intent,
                items,
                paymentMethod,
                customerName,
                creditAmount: parseFloat(creditAmount) || totalCalculated,
              })
            }
            className={`px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all ${
              canConfirm && !isConfirming
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 active:scale-95'
                : 'bg-slate-300 cursor-not-allowed text-slate-500'
            }`}
          >
            {isConfirming ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving to Store...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Update Store</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionPreviewModal;

