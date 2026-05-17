import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../components/ConfirmationModal';
import CustomDropdown from '../../components/CustomDropdown';
import { 
  PlusIcon, 
  MinusIcon, 
  MagnifyingGlassIcon, 
  ShoppingCartIcon, 
  UserIcon, 
  PrinterIcon, 
  XCircleIcon,
  ChartBarIcon,
  Squares2X2Icon,
  ClockIcon,
  ArchiveBoxIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function POS() {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'terminal' | 'history'>('terminal');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [showConfirmSale, setShowConfirmSale] = useState(false);
  const [pendingPrint, setPendingPrint] = useState(false);
  const [salePeriod, setSalePeriod] = useState('all');
  const [showReturnConfirm, setShowReturnConfirm] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory]);

  // Fix: Added trailing slash to /products/ to avoid redirect/CORS issues
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', search, selectedCategory, page],
    queryFn: () => apiClient.get('/products/', { 
      params: { search, category_id: selectedCategory, limit, page } 
    }).then(res => res.data),
    staleTime: 0,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories/').then(res => res.data),
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['offline-sales'],
    queryFn: () => apiClient.get('/offline-sale/', { params: { period: 'all', limit: 1000 } }).then(res => res.data),
    staleTime: 0,
  });

  const allSales = salesData?.data || [];

  const stats = useMemo(() => {
    const salesArray = Array.isArray(allSales) ? allSales : [];
    const validSales = salesArray.filter((s: any) => !s.is_returned);
    const todayStr = new Date().toDateString();
    const month = new Date().getMonth();
    const year = new Date().getFullYear();

    return {
      today: validSales.filter((s: any) => new Date(s.created_at).toDateString() === todayStr)
                .reduce((acc: number, s: any) => acc + s.total_amount, 0),
      month: validSales.filter((s: any) => {
                  const d = new Date(s.created_at);
                  return d.getMonth() === month && d.getFullYear() === year;
                }).reduce((acc: number, s: any) => acc + s.total_amount, 0),
      year: validSales.filter((s: any) => new Date(s.created_at).getFullYear() === year)
               .reduce((acc: number, s: any) => acc + s.total_amount, 0),
      total: validSales.reduce((acc: number, s: any) => acc + s.total_amount, 0),
      count: validSales.length
    };
  }, [allSales]);

  const chartData = useMemo(() => {
    const salesArray = Array.isArray(allSales) ? allSales : [];
    if (salesArray.length === 0) return null;
    
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toDateString();
    }).reverse();

    const dailyRevenue = last7Days.map(dayStr => {
      return salesArray
        .filter((s: any) => !s.is_returned && new Date(s.created_at).toDateString() === dayStr)
        .reduce((acc: number, s: any) => acc + s.total_amount, 0);
    });

    const methods = salesArray.reduce((acc: any, s: any) => {
      if (!s.is_returned) {
        acc[s.payment_method] = (acc[s.payment_method] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      revenue: {
        labels: last7Days.map(d => d.split(' ').slice(0, 3).join(' ')),
        datasets: [{
          label: 'Revenue',
          data: dailyRevenue,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#10b981',
          pointBorderWidth: 2,
        }]
      },
      payments: {
        labels: Object.keys(methods),
        datasets: [{
          data: Object.values(methods),
          backgroundColor: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
          borderWidth: 0,
          hoverOffset: 15
        }]
      }
    };
  }, [allSales]);

  const filteredSales = useMemo(() => {
    if (!allSales) return [];
    return allSales.filter((sale: any) => {
      if (salePeriod === 'all') return true;
      const date = new Date(sale.created_at);
      const now = new Date();
      if (salePeriod === 'today') return date.toDateString() === now.toDateString();
      if (salePeriod === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (salePeriod === 'year') return date.getFullYear() === now.getFullYear();
      return true;
    });
  }, [allSales, salePeriod]);

  const saleMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/offline-sale/', data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['offline-sales'] });
      setCart([]);
      setCustomerName('Walk-in Customer');
      toast.success('Sale completed successfully!');
      if (pendingPrint) handlePrint(res.data);
      setShowConfirmSale(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Sale failed')
  });

  const returnSaleMutation = useMutation({
    mutationFn: (saleId: number) => apiClient.post(`/offline-sale/${saleId}/return`),
    onSuccess: () => {
      toast.success('Sale returned and stock restored');
      queryClient.invalidateQueries({ queryKey: ['offline-sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Return failed')
  });

  const addToCart = (product: any, variantStr?: string) => {
    if (!product || (!product.id && !product.product_id)) {
      toast.error('Invalid product data');
      return;
    }

    const pid = product.id || product.product_id;
    const stock = Number(product.stock || 0);

    if (stock <= 0) {
      toast.warning('Product out of stock!');
      return;
    }

    // Default variant if none selected and variants exist
    let finalVariant = variantStr;
    if (!finalVariant && product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      const variantParts = product.variants
        .filter((v: any) => v && v.type && Array.isArray(v.values) && v.values.length > 0)
        .map((v: any) => `${v.type}: ${v.values[0]}`);
      if (variantParts.length > 0) finalVariant = variantParts.join(', ');
    }

    const itemKey = `${pid}-${finalVariant || ''}`;
    const existing = cart.find(item => `${item.product_id}-${item.variant || ''}` === itemKey);

    if (existing) {
      if (existing.quantity >= stock) {
        toast.warning(`Only ${stock} available`);
        return;
      }
      setCart(prev => prev.map(item => `${item.product_id}-${item.variant || ''}` === itemKey ? { ...item, quantity: item.quantity + 1 } : item));
      toast.success(`${product.title} updated`, { autoClose: 500, position: 'bottom-left', hideProgressBar: true });
    } else {
      setCart(prev => [...prev, { 
        product_id: pid, 
        product_name: product.title, 
        quantity: 1, 
        price: Number(product.price),
        variant: finalVariant,
        image: product.images?.[0] || product.image_url,
        max_stock: stock,
        available_variants: product.variants || []
      }]);
      toast.success(`${product.title} added`, { autoClose: 500, position: 'bottom-left', hideProgressBar: true });
    }
  };

  const updateCartItemVariant = (itemIdx: number, variantType: string, newValue: string) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx !== itemIdx) return item;
      
      // Parse current variant string
      const variantsObj: Record<string, string> = {};
      if (item.variant) {
        item.variant.split(', ').forEach((v: string) => {
          const [type, val] = v.split(': ');
          if (type && val) variantsObj[type] = val;
        });
      }
      
      // Update the specific type
      variantsObj[variantType] = newValue;
      
      // Rebuild variant string
      const newVariantStr = Object.entries(variantsObj).map(([k, v]) => `${k}: ${v}`).join(', ');
      return { ...item, variant: newVariantStr };
    }));
  };

  const removeFromCart = (id: number, variant?: string) => {
    setCart(prev => prev.filter(item => !(item.product_id === id && item.variant === variant)));
  };

  const updateQuantity = (id: number, variant: string | undefined, newQty: number) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === id && item.variant === variant) {
        const finalQty = Math.max(1, Math.min(item.max_stock || 999, newQty));
        return { ...item, quantity: finalQty };
      }
      return item;
    }));
  };

  const total = parseFloat(cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2));

  const handlePrint = (sale: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Store Receipt - #${sale.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; width: 300px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px dashed #e2e8f0; margin-bottom: 15px; padding-bottom: 15px; }
            .store-name { font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
            .item { display: flex; justify-content: space-between; font-size: 13px; margin: 8px 0; font-weight: 500; }
            .total { border-top: 2px solid #1e293b; margin-top: 15px; padding-top: 10px; font-weight: 900; font-size: 18px; display: flex; justify-content: space-between; }
            .footer { text-align: center; font-size: 11px; margin-top: 20px; color: #64748b; font-weight: 600; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <div class="store-name">LUSHLOCK</div>
            <div style="font-size: 12px; margin-top: 5px; opacity: 0.7;">Receipt #${sale.id}</div>
            <div style="font-size: 11px; opacity: 0.5;">${new Date().toLocaleString()}</div>
          </div>
          <div class="items">
            ${(sale.items || []).map((item: any) => `
              <div class="item">
                <div style="flex: 1;">
                  <div>${item.product_name} x${item.quantity}</div>
                  ${item.variant ? `<div style="font-size: 10px; opacity: 0.6;">${item.variant}</div>` : ''}
                </div>
                <span>Rs. ${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <span>TOTAL</span>
            <span>Rs. ${sale.total_amount.toFixed(2)}</span>
          </div>
          <div class="footer">
            Thank you for shopping!<br>Please visit again.
            <div style="margin-top: 15px; font-size: 9px; font-weight: normal; opacity: 0.6;">
              Software by BuiltByUsman All Rights Reserved
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfcfd] overflow-hidden font-sans text-slate-900">
      {/* Top Navigation Bar */}
      <div className="px-8 py-4 flex items-center justify-between bg-white border-b border-slate-100 shadow-sm shrink-0 z-10">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <ArchiveBoxIcon className="w-5 h-5" />
            </div>
            POS <span className="text-slate-400 font-medium">Offline</span>
          </h1>
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
              { id: 'terminal', label: 'Terminal', icon: Squares2X2Icon },
              { id: 'history', label: 'History', icon: ClockIcon }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id 
                    ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
              <div className="flex items-center gap-1.5 justify-end">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-700">Online Terminal</span>
              </div>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="h-full overflow-y-auto p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                  { label: "Today's Revenue", value: stats.today, icon: ArrowPathIcon, color: "emerald" },
                  { label: "Monthly Sales", value: stats.month, icon: ChartBarIcon, color: "blue" },
                  { label: "Total Orders", value: stats.count, isCount: true, icon: ArchiveBoxIcon, color: "amber" },
                  { label: "Global Sales", value: stats.total, icon: ShoppingCartIcon, color: "indigo" }
                ].map((s, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                     <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                        <div className={`p-2 rounded-lg bg-${s.color}-50 text-${s.color}-600`}>
                           <s.icon className="w-5 h-5" />
                        </div>
                     </div>
                     <p className="text-2xl font-bold text-slate-900">
                        {s.isCount ? s.value : `Rs. ${s.value.toLocaleString()}`}
                     </p>
                  </div>
                ))}
              </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                   <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Revenue Analysis</h3>
                        <p className="text-xs text-slate-400 font-medium">Sales performance over the last 7 days</p>
                      </div>
                   </div>
                   <div className="h-[320px]">
                      {chartData && <Line data={chartData.revenue} options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { 
                          y: { beginAtZero: true, grid: { color: '#f8fafc' }, border: { display: false }, ticks: { font: { weight: 'bold', size: 10 } } },
                          x: { grid: { display: false }, border: { display: false }, ticks: { font: { weight: 'bold', size: 10 } } } 
                        }
                      }} />}
                   </div>
                </div>
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                   <h3 className="text-lg font-bold text-slate-900 mb-8">Payment Mix</h3>
                   <div className="flex-1 relative flex items-center justify-center">
                      {chartData && <Doughnut data={chartData.payments} options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: { 
                          legend: { 
                            position: 'bottom', 
                            labels: { 
                              usePointStyle: true,
                              pointStyle: 'circle',
                              font: { weight: 'bold', size: 11 }, 
                              padding: 20 
                            } 
                          } 
                        },
                        cutout: '75%'
                      }} />}
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
                   <h3 className="text-lg font-bold text-slate-900">Recent Transactions</h3>
                   <button onClick={() => setActiveTab('history')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">View All History</button>
                </div>
                <div className="divide-y divide-slate-50">
                   {filteredSales.length > 0 ? filteredSales.slice(0, 5).map((sale: any) => (
                     <div key={sale.id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                              <ArchiveBoxIcon className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-900">Order #{sale.id}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{new Date(sale.created_at).toLocaleTimeString()}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-bold text-slate-900">Rs. {sale.total_amount.toLocaleString()}</p>
                           <p className={`text-[10px] font-bold mt-0.5 ${sale.is_returned ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {sale.is_returned ? 'VOIDED' : sale.payment_method.toUpperCase()}
                           </p>
                        </div>
                     </div>
                   )) : (
                     <div className="py-12 text-center text-slate-400">
                        <ArchiveBoxIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No transactions found</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* POS Terminal View */}
        {activeTab === 'terminal' && (
          <div className="h-full flex flex-col lg:flex-row animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden">
            
            {/* Left: Product Browser */}
            <div className="flex-1 flex flex-col overflow-hidden">
               {/* Toolbar */}
               <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center bg-white">
                  <div className="relative flex-1 w-full">
                     <MagnifyingGlassIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input 
                       type="text" 
                       placeholder="Quick search products..."
                       value={search}
                       onChange={(e) => setSearch(e.target.value)}
                       className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none"
                     />
                  </div>
                  <div className="w-full sm:w-auto shrink-0">
                     <CustomDropdown
                       options={categories || []}
                       value={selectedCategory || ''}
                       onChange={(val) => setSelectedCategory(val ? Number(val) : null)}
                       placeholder="All Categories"
                     />
                  </div>
               </div>

               {/* Grid */}
               <div className="flex-1 overflow-y-auto p-6 bg-[#fcfcfd] custom-scrollbar">
                  {productsLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                       {Array(12).fill(0).map((_, i) => (
                         <div key={i} className="aspect-[3/4] bg-white rounded-2xl animate-pulse shadow-sm border border-slate-100" />
                       ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                       {productsData?.data && Array.isArray(productsData.data) && productsData.data.map((p: any) => {
                         const cartItem = cart.find(item => item.product_id == p.id);
                         return (
                           <div 
                             key={p.id} 
                             onClick={(e) => {
                               e.preventDefault();
                               e.stopPropagation();
                               addToCart(p);
                             }}
                             className={`group relative bg-white rounded-2xl border border-slate-100 transition-all cursor-pointer hover:shadow-xl hover:border-emerald-200 active:scale-[0.98] overflow-hidden ${Number(p.stock) <= 0 ? 'opacity-60 grayscale pointer-events-none' : ''}`}
                           >
                             <div className="aspect-square bg-slate-50 relative overflow-hidden">
                                <img src={p.images?.[0] || p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                {cartItem && (
                                  <div className="absolute inset-0 bg-emerald-600/20 flex items-center justify-center backdrop-blur-[1px]">
                                     <div className="bg-emerald-600 text-white px-3 py-1 rounded-full flex items-center justify-center font-black shadow-lg border-2 border-white animate-in zoom-in duration-300">
                                        {cartItem.quantity} In Cart
                                     </div>
                                  </div>
                                )}
                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
                                  <span className="text-[10px] font-bold text-slate-700">{p.stock} in stock</span>
                                </div>
                             </div>
                             <div className="p-4">
                                <h3 className="text-xs font-bold text-slate-700 mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">{p.title}</h3>
                                <div className="flex items-center justify-between mt-2">
                                   <p className="text-sm font-black text-slate-900">Rs. {Number(p.price).toLocaleString()}</p>
                                   <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                      <PlusIcon className="w-3.5 h-3.5 stroke-[3]" />
                                   </div>
                                </div>
                             </div>
                           </div>
                         );
                       })}
                    </div>
                  )}

                  {!productsLoading && productsData?.data?.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center py-20 opacity-40">
                      <ArchiveBoxIcon className="w-16 h-16 mb-4" />
                      <p className="text-sm font-bold">No products found</p>
                    </div>
                  )}
               </div>

               {/* Pagination */}
               {productsData?.total > limit && (
                 <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Page {page} of {Math.ceil(productsData.total / limit)}
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all"
                      >
                        Previous
                      </button>
                      <button 
                        onClick={() => setPage(p => p + 1)}
                        disabled={page * limit >= productsData.total}
                        className="px-4 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all"
                      >
                        Next
                      </button>
                    </div>
                 </div>
               )}
            </div>

            {/* Right: Cart Sidebar */}
            <div className="w-full lg:w-[420px] bg-white border-l border-slate-100 flex flex-col h-full shrink-0 shadow-2xl relative z-20">
               <div className="p-6 border-b border-slate-50 shrink-0">
                  <div className="flex items-center justify-between mb-6">
                     <h2 className="text-lg font-black flex items-center gap-2">
                        <ShoppingCartIcon className="w-5 h-5 text-emerald-600" />
                        Order Items
                     </h2>
                     <button onClick={() => setCart([])} className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest">Clear Cart</button>
                  </div>

                  <div className="space-y-3">
                     <div className="relative group">
                        <UserIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Customer Name"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/10 focus:bg-white outline-none transition-all"
                        />
                     </div>
                     <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
                        {['Cash', 'Card', 'Online'].map(m => (
                          <button 
                            key={m}
                            onClick={() => setPaymentMethod(m)}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${paymentMethod === m ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            {m}
                          </button>
                        ))}
                     </div>
                  </div>
               </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30">
                  {cart.length > 0 ? cart.map((item, idx) => (
                    <div key={`${item.product_id}-${item.variant || ''}-${idx}`} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-right duration-300">
                       <div className="p-4 flex gap-4">
                          <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                          <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-start mb-1">
                                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{item.product_name}</h4>
                                <button onClick={() => removeFromCart(item.product_id, item.variant)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                   <XCircleIcon className="w-4 h-4" />
                                </button>
                             </div>
                             <p className="text-sm font-black text-emerald-600 mb-2">Rs. {item.price.toLocaleString()}</p>
                             
                             <div className="flex items-center gap-2">
                                <div className="flex items-center bg-slate-50 rounded-lg p-0.5 shadow-inner">
                                   <button onClick={() => updateQuantity(item.product_id, item.variant, item.quantity - 1)} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"><MinusIcon className="w-3.5 h-3.5 stroke-[4]"/></button>
                                   <input 
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => updateQuantity(item.product_id, item.variant, parseInt(e.target.value) || 1)}
                                      className="w-10 bg-transparent border-none text-center font-bold text-xs p-0 focus:ring-0"
                                   />
                                   <button onClick={() => updateQuantity(item.product_id, item.variant, item.quantity + 1)} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"><PlusIcon className="w-3.5 h-3.5 stroke-[4]"/></button>
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 ml-auto">
                                   Total: <span className="text-slate-900">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       {/* Variants directly in the cart item */}
                       {item.available_variants && Array.isArray(item.available_variants) && item.available_variants.length > 0 && (
                         <div className="px-4 pb-4 pt-2 border-t border-slate-50 space-y-3">
                            {item.available_variants.map((v: any) => {
                               if (!v || !v.type || !Array.isArray(v.values)) return null;
                               
                               const currentVal = item.variant?.split(', ')
                                 .find((str: string) => str.startsWith(`${v.type}:`))
                                 ?.split(': ')[1];
                               
                               return (
                                 <div key={v.type}>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{v.type}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                       {v.values.map((val: string) => (
                                         <button
                                           key={val}
                                           onClick={() => updateCartItemVariant(idx, v.type, val)}
                                           className={`px-2.5 py-1 rounded-md text-[9px] font-bold transition-all border ${currentVal === val ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-emerald-200'}`}
                                         >
                                           {val}
                                         </button>
                                       ))}
                                    </div>
                                 </div>
                               );
                            })}
                         </div>
                       )}
                    </div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                       <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <ShoppingCartIcon className="w-8 h-8 text-slate-400" />
                       </div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-center">No items in current session</p>
                    </div>
                  )}
               </div>

               <div className="p-8 bg-white border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] shrink-0">
                  <div className="flex justify-between items-center mb-6">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Grand Total</p>
                     <h3 className="text-3xl font-black text-slate-900 tracking-tight">Rs. {total.toLocaleString()}</h3>
                  </div>
                  <button
                    disabled={cart.length === 0 || saleMutation.isPending}
                    onClick={() => { setPendingPrint(true); setShowConfirmSale(true); }}
                    className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-xl shadow-emerald-600/20 active:scale-[0.98]"
                  >
                    <PrinterIcon className="w-5 h-5" />
                    Complete & Print
                  </button>
                  <button
                    disabled={cart.length === 0 || saleMutation.isPending}
                    onClick={() => { setPendingPrint(false); setShowConfirmSale(true); }}
                    className="w-full mt-3 py-3 bg-white hover:bg-slate-50 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 border border-slate-200"
                  >
                    Save Without Receipt
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* History View */}
        {activeTab === 'history' && (
          <div className="h-full overflow-y-auto p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                <div>
                   <h2 className="text-2xl font-black text-slate-900">Transaction History</h2>
                   <p className="text-xs font-medium text-slate-400 mt-1">Audit and manage your past sales</p>
                </div>
                <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
                   {['all', 'today', 'month', 'year'].map(p => (
                     <button 
                       key={p}
                       onClick={() => setSalePeriod(p)}
                       className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${salePeriod === p ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                       {p}
                     </button>
                   ))}
                </div>
             </div>

             <div className="space-y-4 pb-20">
                {salesLoading ? (
                  <div className="py-20 text-center">
                    <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fetching records...</p>
                  </div>
                ) : filteredSales.length > 0 ? filteredSales.map((sale: any) => (
                  <div key={sale.id} className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-emerald-100 hover:shadow-md transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                           <span className="text-sm font-bold text-slate-900">Order #{sale.id}</span>
                           <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${sale.is_returned ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                              {sale.is_returned ? 'Returned' : 'Success'}
                           </span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
                           <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                              <p className="text-xs font-bold text-slate-700">{sale.customer_name}</p>
                           </div>
                           <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Method</p>
                              <p className="text-xs font-bold text-slate-700">{sale.payment_method}</p>
                           </div>
                           <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                              <p className="text-xs font-bold text-slate-700">{new Date(sale.created_at).toLocaleDateString()}</p>
                           </div>
                           <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Items</p>
                              <p className="text-xs font-bold text-slate-700">{(sale.items || []).length} items</p>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-6 md:border-l md:pl-6 border-slate-50">
                        <div className="text-right">
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                           <p className="text-xl font-black text-slate-900">Rs. {sale.total_amount.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => handlePrint(sale)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-slate-100">
                              <PrinterIcon className="w-5 h-5" />
                           </button>
                           {!sale.is_returned && (
                             <button 
                               onClick={() => setShowReturnConfirm(sale.id)}
                               disabled={returnSaleMutation.isPending}
                               className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-slate-100"
                             >
                                <XCircleIcon className="w-5 h-5" />
                             </button>
                           )}
                        </div>
                     </div>
                  </div>
                )) : (
                  <div className="py-32 text-center text-slate-400">
                    <ClockIcon className="w-16 h-16 mx-auto mb-4 opacity-10" />
                    <p className="text-lg font-bold">No transaction records found</p>
                    <p className="text-sm">Completed sales will appear here.</p>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>

      <ConfirmationModal 
        isOpen={showConfirmSale}
        onClose={() => setShowConfirmSale(false)}
        onConfirm={() => saleMutation.mutate({
          customer_name: customerName,
          total_amount: total,
          payment_method: paymentMethod,
          items: cart,
          print: pendingPrint
        })}
        title="Authorize Sale"
        message={`Charge Rs. ${total.toLocaleString()} from ${customerName}?`}
        isLoading={saleMutation.isPending}
      />

      <ConfirmationModal 
        isOpen={showReturnConfirm !== null}
        onClose={() => setShowReturnConfirm(null)}
        onConfirm={() => {
          if (showReturnConfirm) {
            returnSaleMutation.mutate(showReturnConfirm);
            setShowReturnConfirm(null);
          }
        }}
        title="Process Return"
        message={`Return order #${showReturnConfirm} and restore inventory?`}
        isLoading={returnSaleMutation.isPending}
      />
    </div>
  );
}
