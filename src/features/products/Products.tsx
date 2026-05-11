import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, MagnifyingGlassIcon, CubeIcon, ArchiveBoxIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import CustomDropdown from '../../components/CustomDropdown';
import MultiImageUpload from '../../components/MultiImageUpload';

export default function Products() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'out_of_stock'>('all');
  
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, limit, search, activeTab],
    queryFn: () => {
      const params: any = { page, limit, search };
      if (activeTab === 'out_of_stock') params.out_of_stock = true;
      return apiClient.get('/products/', { params }).then(res => res.data);
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories/').then(res => res.data),
  });

  const [newCategoryName, setNewCategoryName] = useState('');

  const saveMutation = useMutation({
    mutationFn: (productData: any) => {
      if (editingProduct) {
        return apiClient.put(`/products/${editingProduct.id}`, productData);
      }
      return apiClient.post('/products/', productData);
    },
    onSuccess: () => {
      toast.success(editingProduct ? 'Product updated' : 'Product added');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to save product')
  });

  const addCategoryMutation = useMutation({
    mutationFn: (name: string) => apiClient.post('/categories/create', { name }).then(res => res.data),
    onSuccess: () => {
      toast.success('Category created');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setNewCategoryName('');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to create category')
  });

  const [productImages, setProductImages] = useState<string[]>([]);
  const [productType, setProductType] = useState<'simple' | 'variable'>('simple');
  const [attributes, setAttributes] = useState<{type: string, valuesStr: string}[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | number>('');

  const generateCombinations = (attrs: any[]) => {
    const validAttrs = attrs.filter(a => a.type && a.valuesStr);
    if (validAttrs.length === 0) return [];

    const attrValues = validAttrs.map(a => a.valuesStr.split(',').map((v: string) => v.trim()).filter((v: string) => v));
    
    const combine = (list: any[][], n = 0, result: any[] = [], current: any = {}) => {
      if (n === list.length) {
        result.push({ combination: { ...current }, price: 0, stock: 0 });
        return result;
      }
      for (let i = 0; i < list[n].length; i++) {
        current[validAttrs[n].type] = list[n][i];
        combine(list, n + 1, result, current);
      }
      return result;
    };

    return combine(attrValues);
  };

  const openModal = (product: any = null) => {
    setEditingProduct(product);
    setProductImages(product?.images || []);
    setProductType(product?.attributes?.length > 0 ? 'variable' : 'simple');
    setAttributes((product?.attributes || []).map((a: any) => ({ type: a.type, valuesStr: a.values?.join(', ') || '' })));
    setVariants(product?.variants || []);
    setSelectedCategoryId(product?.category_id || '');
    setIsModalOpen(true);
    setNewCategoryName('');
  };





  const displayedProducts = activeTab === 'out_of_stock' 
    ? data?.data?.filter((p: any) => p.stock <= 0) 
    : data?.data;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Management</h1>
          <p className="text-sm text-slate-500 font-medium">Add and edit products in your store inventory.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center transition-all shadow-lg shadow-brand-primary/20"
        >
          <PlusIcon className="w-5 h-5 mr-2 stroke-2" /> Add Product
        </button>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'all' ? 'bg-brand-primary text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
        >
          All Inventory
        </button>
        <button
          onClick={() => setActiveTab('out_of_stock')}
          className={`flex items-center px-5 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'out_of_stock' ? 'bg-red-500 text-white shadow-md' : 'bg-white text-red-500 border border-red-200 hover:bg-red-50'}`}
        >
          <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
          Out of Stock
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg shadow-black/20 border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 text-sm font-medium transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 text-sm font-medium">Loading products...</p>
          </div>
        ) : displayedProducts?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4">Product Info</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayedProducts?.map((product: any) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img src={product.images?.[0] || 'https://placehold.co/100x100?text=No+Image'} alt={product.title} className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200" />
                        <div className="ml-4">
                           <h4 className="text-sm font-bold text-slate-900">{product.title}</h4>
                           <p className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded-md">
                          {categories?.find((c: any) => c.id === product.category_id)?.name || 'General'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-sm font-bold text-slate-900">Rs. {product.price}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        product.stock > 10 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                        product.stock > 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {product.stock > 10 ? 'Available' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'} ({product.stock})
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openModal(product)} 
                        className="p-2 text-slate-500 hover:text-brand-primary hover:bg-brand-primary-light rounded-lg transition-all"
                      >
                        <PencilIcon className="w-5 h-5 stroke-2" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <ArchiveBoxIcon className="w-8 h-8 text-slate-700" />
             </div>
             <h3 className="text-slate-900 font-bold">No products found</h3>
             <p className="text-slate-500 text-sm">Either everything is in stock or your search returned nothing.</p>
          </div>
        )}

        <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-200">
          <div className="flex flex-col">
            <p className="text-xs font-bold text-slate-500 font-medium text-slate-500">
              Showing {displayedProducts?.length || 0} of {data?.total || 0}
            </p>
            <p className="text-[10px] text-slate-500 font-bold mt-1">
              Page {page} of {Math.ceil((data?.total || 0) / limit) || 1}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-all"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * limit >= (data?.total || 0)}
              className="px-4 py-2 text-xs font-bold bg-brand-primary text-white rounded-lg shadow-lg shadow-black/20 hover:bg-brand-primary-dark disabled:opacity-30 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="fixed inset-0 bg-slate-50/60 transition-opacity" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-brand-primary-light rounded-xl flex items-center justify-center mr-4">
                  <CubeIcon className="w-6 h-6 text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
                  <p className="text-[10px] font-bold text-slate-500 font-medium text-slate-500">Inventory Management</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-lg text-slate-500 transition-colors">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                
                const categoryId = parseInt(selectedCategoryId as string);
                if (isNaN(categoryId)) {
                  toast.error('Please select a category');
                  return;
                }

                let finalVariants = [];
                if (productType === 'simple') {
                  const p = parseFloat(formData.get('price') as string);
                  const s = parseInt(formData.get('stock') as string);
                  if (isNaN(p) || isNaN(s)) {
                    toast.error('Please enter valid price and stock');
                    return;
                  }
                  finalVariants = [{
                    combination: {},
                    price: p,
                    stock: s
                  }];
                } else {
                  if (variants.length === 0) {
                    toast.error('Please generate variant combinations first');
                    return;
                  }
                  finalVariants = variants.map(v => ({
                    ...v,
                    price: parseFloat(v.price),
                    stock: parseInt(v.stock)
                  }));
                }

                if (finalVariants.some(v => isNaN(v.price) || isNaN(v.stock))) {
                  toast.error('Please enter valid prices and stock for all variants');
                  return;
                }

                saveMutation.mutate({
                  title: formData.get('title'),
                  description: formData.get('description'),
                  price: finalVariants[0]?.price || 0,
                  stock: finalVariants.reduce((sum, v) => sum + v.stock, 0),
                  category_id: categoryId,
                  images: productImages.filter(img => img.trim()),
                  attributes: productType === 'variable' 
                    ? attributes.map(a => ({ type: a.type, values: a.valuesStr.split(',').map(x => x.trim()).filter(x => x) })).filter(a => a.type && a.values.length > 0)
                    : [],
                  variants: finalVariants,
                });
              }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                <section className="space-y-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="w-1.5 h-6 bg-brand-primary rounded-full"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">General Information</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1.5 block">Product Title</label>
                      <input required name="title" defaultValue={editingProduct?.title} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 text-sm font-medium transition-all outline-none" placeholder="Enter product name..." />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1.5 block">Description</label>
                      <textarea required name="description" defaultValue={editingProduct?.description} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 text-sm font-medium transition-all outline-none resize-none" rows={3} placeholder="Describe the product details..." />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="w-1.5 h-6 bg-brand-primary rounded-full"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Category & Pricing</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-500 mb-1.5 block">Category Selection</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <CustomDropdown
                          name="category_id"
                          options={categories || []}
                          value={selectedCategoryId}
                          onChange={setSelectedCategoryId}
                          placeholder="Choose category"
                        />
                        <div className="flex bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                           <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="w-32 px-3 bg-transparent text-xs font-medium focus:outline-none" placeholder="Quick Add..." />
                           <button type="button" disabled={!newCategoryName || addCategoryMutation.isPending} onClick={() => addCategoryMutation.mutate(newCategoryName)} className="px-3 bg-brand-primary text-white hover:bg-brand-primary-dark transition-colors disabled:opacity-50">
                             <PlusIcon className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="w-1.5 h-6 bg-brand-primary rounded-full"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Product Media</h3>
                  </div>
                  <MultiImageUpload
                    values={productImages}
                    onChange={setProductImages}
                    bucket="products"
                  />
                  <p className="text-[10px] text-slate-500 font-bold">Tip: You can select multiple images at once. All images will be automatically resized to 800x800 for optimal performance.</p>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="w-1.5 h-6 bg-brand-primary rounded-full"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Inventory Mode</h3>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                    <button
                      type="button"
                      onClick={() => setProductType('simple')}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${productType === 'simple' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Simple Product
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductType('variable')}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${productType === 'variable' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Variable Product
                    </button>
                  </div>
                </section>

                {productType === 'simple' ? (
                  <section className="space-y-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="w-1.5 h-6 bg-brand-primary rounded-full"></span>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Pricing & Stock</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">Price (Rs.)</label>
                        <input required name="price" type="number" step="0.01" defaultValue={editingProduct?.variants?.[0]?.price || editingProduct?.price} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 text-sm font-medium outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">Stock Quantity</label>
                        <input required name="stock" type="number" defaultValue={editingProduct?.variants?.[0]?.stock || editingProduct?.stock} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 text-sm font-medium outline-none" />
                      </div>
                    </div>
                  </section>
                ) : (
                  <>
                    <section className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-6 bg-brand-primary rounded-full"></span>
                          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Define Attributes</h3>
                        </div>
                        <button type="button" onClick={() => setAttributes([...attributes, { type: '', valuesStr: '' }])} className="text-xs font-bold text-brand-primary hover:underline flex items-center">
                          <PlusIcon className="w-3 h-3 mr-1" /> Add Attribute
                        </button>
                      </div>
                      <div className="space-y-4">
                        {attributes.map((attr, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                            <button type="button" onClick={() => setAttributes(attributes.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 p-1.5 bg-white shadow-md border border-slate-200 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-500 mb-1 block">Attribute Name (e.g. Size)</label>
                              <input 
                                value={attr.type} 
                                onChange={(e) => {
                                  const newAttrs = [...attributes];
                                  newAttrs[idx].type = e.target.value;
                                  setAttributes(newAttrs);
                                }}
                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none" 
                                placeholder="Color, Size, Material..."
                              />
                            </div>
                            <div className="flex-[2]">
                              <label className="text-[10px] font-bold text-slate-500 mb-1 block">Values (Comma separated)</label>
                              <input 
                                value={attr.valuesStr} 
                                onChange={(e) => {
                                  const newAttrs = [...attributes];
                                  newAttrs[idx].valuesStr = e.target.value;
                                  setAttributes(newAttrs);
                                }}
                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none" 
                                placeholder="Red, Blue, Green..."
                              />
                            </div>
                          </div>
                        ))}
                        <button 
                          type="button" 
                          onClick={() => setVariants(generateCombinations(attributes))}
                          className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all"
                        >
                          Generate Variant Combinations
                        </button>
                      </div>
                    </section>

                    {variants.length > 0 && (
                      <section className="space-y-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="w-1.5 h-6 bg-brand-primary rounded-full"></span>
                          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Variant Pricing</h3>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                              <tr>
                                <th className="px-4 py-3">Combination</th>
                                <th className="px-4 py-3">Price (Rs)</th>
                                <th className="px-4 py-3">Stock</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {variants.map((v, idx) => (
                                <tr key={idx} className="text-xs">
                                  <td className="px-4 py-3 font-bold text-slate-700 bg-slate-50/30">
                                    {Object.entries(v.combination).map(([key, val]) => `${key}: ${val}`).join(' / ')}
                                  </td>
                                  <td className="px-4 py-3">
                                    <input 
                                      type="number" 
                                      value={v.price} 
                                      onChange={(e) => {
                                        const newVariants = [...variants];
                                        newVariants[idx].price = e.target.value;
                                        setVariants(newVariants);
                                      }}
                                      className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary/20 outline-none font-bold"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input 
                                      type="number" 
                                      value={v.stock} 
                                      onChange={(e) => {
                                        const newVariants = [...variants];
                                        newVariants[idx].stock = e.target.value;
                                        setVariants(newVariants);
                                      }}
                                      className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary/20 outline-none font-bold"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-4 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Cancel</button>
                <button type="submit" disabled={saveMutation.isPending} className="px-10 py-3 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-dark transition-all disabled:opacity-50 text-sm min-w-[160px]">
                  {saveMutation.isPending ? 'Saving...' : (editingProduct ? 'Save Changes' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
