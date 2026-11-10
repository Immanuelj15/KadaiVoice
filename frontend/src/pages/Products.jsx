import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Tag,
  DollarSign,
  Filter,
} from 'lucide-react';
import { productsAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

const categories = [
  'All',
  'Groceries & Grains',
  'Dairy & Eggs',
  'Cooking Oil & Ghee',
  'Spices & Masalas',
  'Snacks & Beverages',
  'Household & Cleaning',
  'Personal Care',
  'Instant Foods',
  'Other',
];

const units = ['kg', 'g', 'liter', 'ml', 'packet', 'piece', 'box', 'can', 'bag'];

const Products = () => {
  const { t } = useLanguage();
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  // Form State
  const initialFormState = {
    name: '',
    nameTamil: '',
    category: 'Groceries & Grains',
    purchasePrice: '',
    sellingPrice: '',
    currentStock: '',
    unit: 'packet',
    minStockLevel: '5',
    supplier: '',
    barcode: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCategory !== 'All') params.category = selectedCategory;

      const res = await productsAPI.getProducts(params);
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load products list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sellingPrice || !formData.purchasePrice) {
      toast.warning('Name, purchase price, and selling price are required.');
      return;
    }

    try {
      if (editingProduct) {
        const res = await productsAPI.updateProduct(editingProduct._id, formData);
        if (res.data.success) {
          toast.success('Product updated successfully!');
          setEditingProduct(null);
        }
      } else {
        const res = await productsAPI.createProduct(formData);
        if (res.data.success) {
          toast.success('Product added to catalog!');
          setShowAddModal(false);
        }
      }
      setFormData(initialFormState);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product.');
    }
  };

  const handleEditClick = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      nameTamil: prod.nameTamil || '',
      category: prod.category,
      purchasePrice: prod.purchasePrice,
      sellingPrice: prod.sellingPrice,
      currentStock: prod.currentStock,
      unit: prod.unit,
      minStockLevel: prod.minStockLevel,
      supplier: prod.supplier || '',
      barcode: prod.barcode || '',
    });
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      const res = await productsAPI.deleteProduct(productToDelete._id);
      if (res.data.success) {
        toast.success('Product removed from catalog.');
        setProductToDelete(null);
        fetchProducts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('products')} Catalog</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage kirana store items, rates, stock levels & Tamil names
          </p>
        </div>

        <button
          onClick={() => {
            setFormData(initialFormState);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addProduct')}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, Tamil or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-700 cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-surface-border">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Tamil Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Cost Price</th>
                <th className="py-3 px-4">Selling Price</th>
                <th className="py-3 px-4">Margin</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Loading products...
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => {
                  const margin = Math.round(((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100);
                  const isLow = p.currentStock <= p.minStockLevel;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {p.name}
                        {p.sku && <div className="text-[10px] text-slate-400 font-normal">{p.sku}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {p.nameTamil || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        ₹{p.purchasePrice} / {p.unit}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        ₹{p.sellingPrice} / {p.unit}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-bold text-emerald-600">
                          {margin > 0 ? `${margin}%` : '0%'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-black px-2 py-1 rounded-md inline-flex items-center gap-1 ${
                            isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(p)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(p)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No products found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {(showAddModal || editingProduct) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-border max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              {editingProduct ? 'Edit Product' : 'Add New Kirana Product'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter details for catalog and voice matching
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Product Name (English) *</label>
                <input
                  type="text"
                  placeholder="e.g. Ponni Boiled Rice"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tamil Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. பொன்னி புழுங்கல் அரிசி"
                  value={formData.nameTamil}
                  onChange={(e) => setFormData({ ...formData, nameTamil: e.target.value })}
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none font-medium"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unit of Measure</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none font-bold"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Purchase Cost (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 52"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Selling Rate (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 60"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Current Stock Quantity</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 50"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Min Safety Stock Level</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 10"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Supplier Name</label>
                <input
                  type="text"
                  placeholder="e.g. Local Distributor"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  {editingProduct ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-surface-border text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Delete "{productToDelete.name}"?
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              This product will be archived from active sales and voice recognition.
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

