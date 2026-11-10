import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  ArrowDownLeft,
  Search,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Users,
  MessageCircle,
  Send,
  ExternalLink,
} from 'lucide-react';
import { creditAPI, customersAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

const CreditManagement = () => {
  const { t } = useLanguage();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [creditOverview, setCreditOverview] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  // Repayment Modal State
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [repaymentPaymentMethod, setRepaymentPaymentMethod] = useState('CASH');
  const [repaymentNotes, setRepaymentNotes] = useState('');

  // WhatsApp Reminder Modal State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppData, setWhatsAppData] = useState(null);
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);

  const fetchCreditData = async () => {
    setLoading(true);
    try {
      const res = await creditAPI.getOverview();
      if (res.data.success) {
        setCreditOverview(res.data);
        setCustomers(res.data.customers || []);
      }
    } catch (err) {
      toast.error('Failed to load credit management data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditData();
  }, []);

  const handleOpenRepayment = (cust) => {
    setSelectedCustomer(cust);
    setRepaymentAmount(cust.outstandingCredit || '');
    setShowRepaymentModal(true);
  };

  const handleRepaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !repaymentAmount || parseFloat(repaymentAmount) <= 0) {
      toast.warning('Please enter a valid repayment amount.');
      return;
    }

    try {
      const res = await creditAPI.recordRepayment({
        customerId: selectedCustomer._id,
        amount: parseFloat(repaymentAmount),
        paymentMethod: repaymentPaymentMethod,
        notes: repaymentNotes,
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Repayment recorded successfully!');
        setShowRepaymentModal(false);
        setSelectedCustomer(null);
        setRepaymentAmount('');
        setRepaymentNotes('');
        fetchCreditData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record repayment.');
    }
  };

  // Generate WhatsApp Reminder with UPI Deep-Link
  const handleOpenWhatsAppReminder = async (cust) => {
    setLoadingWhatsApp(true);
    try {
      const res = await creditAPI.generateWhatsAppReminder(cust._id);
      if (res.data.success) {
        setWhatsAppData(res.data);
        setShowWhatsAppModal(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate WhatsApp reminder.');
    } finally {
      setLoadingWhatsApp(false);
    }
  };

  const handleSendWhatsAppNow = () => {
    if (whatsAppData?.whatsappUrl) {
      window.open(whatsAppData.whatsappUrl, '_blank');
      toast.success('WhatsApp opened with prefilled message & UPI link!');
      setShowWhatsAppModal(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t('creditManagement')} (டிஜிட்டல் காதா)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track customer udhari, send WhatsApp reminders with UPI payment links & record repayments
          </p>
        </div>
      </div>

      {/* Credit Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Total Outstanding Credit</span>
            <CreditCard className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-600">
            ₹{(creditOverview?.summary?.totalOutstanding || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Pending payments to collect</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Customers with Credit</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {creditOverview?.summary?.customersWithCreditCount || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Active ledger accounts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-surface-border shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>WhatsApp & UPI Collect</span>
            <MessageCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600">1-Click Reminders</div>
          <p className="text-[11px] text-slate-500 mt-1">GPay, PhonePe, Paytm auto-link</p>
        </div>
      </div>

      {/* Customers with Outstanding Credit Table */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Customers with Active Outstanding Balance</h2>
            <p className="text-xs text-slate-500">Send WhatsApp reminder or record cash/UPI repayment</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search debtor name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-surface-border">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">Credit Limit</th>
                <th className="py-3 px-4">Outstanding Credit</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Loading credit accounts...
                  </td>
                </tr>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((cust) => (
                  <tr key={cust._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {cust.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{cust.phone}</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{cust.address || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-500">₹{cust.creditLimit || 5000}</td>
                    <td className="py-3.5 px-4 font-black text-rose-600 text-sm">
                      ₹{cust.outstandingCredit}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* WhatsApp Reminder Button */}
                        <button
                          onClick={() => handleOpenWhatsAppReminder(cust)}
                          title="Send WhatsApp Khata Bill & UPI Link"
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-colors inline-flex items-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>

                        {/* Record Repayment Button */}
                        <button
                          onClick={() => handleOpenRepayment(cust)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>Repay</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No outstanding customer credit balances! All accounts settled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WHATSAPP REMINDER PREVIEW MODAL */}
      {showWhatsAppModal && whatsAppData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-border">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">WhatsApp Khata Reminder</h3>
                  <p className="text-xs text-slate-500">Includes direct GPay/PhonePe UPI deep-link</p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Customer:</span>
                  <span className="font-bold text-slate-900">{whatsAppData.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>WhatsApp Number:</span>
                  <span className="font-bold text-slate-900">+{whatsAppData.phone}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Due Balance:</span>
                  <span className="font-black text-rose-600 text-sm">₹{whatsAppData.amount}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Prefilled Message Preview:</label>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-mono">
                  {whatsAppData.messageText}
                </div>
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>When customer clicks the UPI link in WhatsApp, it opens GPay/PhonePe with your shop name & exact amount prefilled!</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-surface-border flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendWhatsAppNow}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Open in WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD REPAYMENT MODAL */}
      {showRepaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-border">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Record Repayment for {selectedCustomer.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Current Outstanding Balance: <strong className="text-rose-600">₹{selectedCustomer.outstandingCredit}</strong>
            </p>

            <form onSubmit={handleRepaymentSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Repayment Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {['CASH', 'UPI'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setRepaymentPaymentMethod(method)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                        repaymentPaymentMethod === method
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Notes / Receipt Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Paid in full / Part payment"
                  value={repaymentNotes}
                  onChange={(e) => setRepaymentNotes(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowRepaymentModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20"
                >
                  Confirm Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditManagement;
