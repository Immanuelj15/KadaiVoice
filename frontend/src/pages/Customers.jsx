import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  CreditCard,
  Eye,
  History,
  CheckCircle2,
} from 'lucide-react';
import { customersAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

const Customers = () => {
  const { t } = useLanguage();
  const toast = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);

  // New Customer Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    creditLimit: '5000',
    notes: '',
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customersAPI.getCustomers({ search });
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.warning('Name and phone number are required.');
      return;
    }

    try {
      const res = await customersAPI.createCustomer(formData);
      if (res.data.success) {
        toast.success(res.data.message || 'Customer added successfully!');
        setShowAddModal(false);
        setFormData({ name: '', phone: '', address: '', creditLimit: '5000', notes: '' });
        fetchCustomers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create customer.');
    }
  };

  const handleViewCustomer = async (cust) => {
    setSelectedCustomer(cust);
    try {
      const res = await customersAPI.getCustomerDetails(cust._id);
      if (res.data.success) {
        setCustomerDetails(res.data);
      }
    } catch (err) {
      toast.error('Failed to load customer profile.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('customers')} Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Loyal buyers, contact numbers, and personal khata profiles
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addCustomer')}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold hidden sm:block">
          Total Customers: {customers.length}
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-10 text-slate-400">Loading customers...</div>
        ) : customers.length > 0 ? (
          customers.map((c) => (
            <div
              key={c._id}
              className="bg-white p-5 rounded-2xl border border-surface-border shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-extrabold flex items-center justify-center text-sm shadow-xs">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                    </div>
                  </div>

                  {c.outstandingCredit > 0 ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      ₹{c.outstandingCredit} Credit
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Settled
                    </span>
                  )}
                </div>

                {c.address && (
                  <div className="text-xs text-slate-600 flex items-start gap-1.5 mt-2 p-2 bg-slate-50 rounded-xl">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{c.address}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Purchases</span>
                  <span className="font-black text-slate-800">₹{Math.round(c.totalPurchases || 0)}</span>
                </div>

                <button
                  onClick={() => handleViewCustomer(c)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ledger</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-10 text-slate-400">
            No customers found matching search.
          </div>
        )}
      </div>

      {/* ADD CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-border">
            <h3 className="font-bold text-slate-900 text-base mb-1">Add New Customer</h3>
            <p className="text-xs text-slate-500 mb-4">Register customer to maintain udhari credit and sales history</p>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Sundaram"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  placeholder="e.g. 9840123456"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Address / Landmark (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 12, South Mada Street"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER PROFILE & KHATA LEDGER MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-surface-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-surface-border">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-500">Phone: {selectedCustomer.phone}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Outstanding Credit</span>
                <span className="text-xl font-black text-rose-600">₹{selectedCustomer.outstandingCredit}</span>
              </div>
            </div>

            {/* Credit Ledger History */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Credit & Repayment Ledger
              </h4>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {customerDetails?.creditHistory && customerDetails.creditHistory.length > 0 ? (
                  customerDetails.creditHistory.map((tx) => (
                    <div
                      key={tx._id}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold block text-slate-800">
                          {tx.type === 'CREDIT_SALE' ? 'Credit Purchase' : 'Repayment Collected'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString('en-IN')} • Balance After: ₹{tx.balanceAfter}
                        </span>
                      </div>
                      <div
                        className={`font-black text-sm ${
                          tx.type === 'CREDIT_SALE' ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {tx.type === 'CREDIT_SALE' ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400">No credit history recorded.</div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-surface-border flex justify-end">
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerDetails(null);
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;

