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
  ClockIcon
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'terminal' | 'history'>('dashboard');
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

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', search, selectedCategory, page],
    queryFn: () => apiClient.get('/products', { 
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
          label: 'Daily Revenue',
          data: dailyRevenue,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
          backgroundColor: ['#10b981', '#059669', '#f59e0b', '#ef4444'],
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
      if (res.data.print) handlePrint(res.data);
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

  const [selectingProduct, setSelectingProduct] = useState<any>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const addToCart = (product: any, variantStr?: string) => {
    if (product.stock <= 0) {
      toast.warning('Product out of stock!');
      return;
    }

    if (product.variants && product.variants.length > 0 && !variantStr) {
      setSelectingProduct(product);
      setSelectedVariants({});
      return;
    }

    const itemKey = `${product.id}-${variantStr || ''}`;
    const existing = cart.find(item => `${item.product_id}-${item.variant || ''}` === itemKey);
    
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.warning('Cannot exceed available stock!');
        return;
      }
      setCart(cart.map(item => `${item.product_id}-${item.variant || ''}` === itemKey ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { 
        product_id: product.id, 
        product_name: product.title, 
        quantity: 1, 
        price: product.price,
        variant: variantStr
      }]);
    }
    setSelectingProduct(null);
  };

  const removeFromCart = (id: number, variant?: string) => {
    setCart(cart.filter(item => !(item.product_id === id && item.variant === variant)));
  };

  const updateQuantity = (id: number, variant: string | undefined, delta: number) => {
    setCart(cart.map(item => {
      if (item.product_id === id && item.variant === variant) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
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
          <div class="footer">Thank you for shopping!<br>Please visit again.</div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      <div className="px-6 py-4 flex items-center gap-2 bg-white border-b border-slate-200 shadow-sm  shrink-0">
        {[
          { id: 'dashboard', label: 'Store Analytics', icon: ChartBarIcon },
          { id: 'terminal', label: 'POS Terminal', icon: Squares2X2Icon },
          { id: 'history', label: 'Transaction History', icon: ClockIcon }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeTab === tab.id 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <tab.icon className="w-5 h-5 stroke-2" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'dashboard' && (
          <div className="h-full overflow-y-auto p-8 lg:p-12 space-y-10 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                  { label: "Today's Revenue", value: stats.today, color: "emerald" },
                  { label: "Monthly Sales", value: stats.month, color: "emerald" },
                  { label: "Yearly Revenue", value: stats.year, color: "emerald" },
                  { label: "Total Sales", value: stats.count, isCount: true, color: "slate" }
                ].map((s, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                     <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{s.label}</p>
                     <p className="text-3xl font-black text-slate-900">
                        {s.isCount ? s.value : `Rs. ${s.value.toLocaleString()}`}
                     </p>
                     <div className={`h-1.5 w-12 bg-${s.color}-500 mt-6 rounded-full group-hover:w-full transition-all duration-500`} />
                  </div>
                ))}
              </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-10 rounded-lg border border-slate-200 shadow-sm  min-h-[450px]">
                   <div className="flex items-center justify-between mb-10">
                      <h3 className="text-xl font-medium text-slate-900 tracking-tight">Revenue Trends</h3>
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg text-[10px] font-medium text-slate-600 tracking-wide text-slate-600">
                         Last 7 Days Activity
                      </div>
                   </div>
                   <div className="h-[300px]">
                      {chartData && <Line data={chartData.revenue} options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { 
                          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { weight: 'bold' } } },
                          x: { grid: { display: false }, ticks: { font: { weight: 'bold' } } } 
                        }
                      }} />}
                   </div>
                </div>
                <div className="bg-white p-10 rounded-lg border border-slate-200 shadow-sm  flex flex-col min-h-[450px]">
                   <h3 className="text-xl font-medium text-slate-900 tracking-tight mb-10">Payment Methods</h3>
                   <div className="flex-1 relative flex items-center justify-center">
                      {chartData && <Doughnut data={chartData.payments} options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 11 }, padding: 20 } } },
                        cutout: '70%'
                      }} />}
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-lg border border-slate-200 shadow-sm  overflow-hidden mb-10">
                <div className="p-10 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                   <div>
                      <h3 className="text-xl font-medium text-slate-900 tracking-tight">Recent Activity</h3>
                      <p className="text-[10px] font-medium text-slate-600 tracking-wide text-slate-600 mt-1">Live Transaction Stream</p>
                   </div>
                   <button onClick={() => setActiveTab('history')} className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-[10px] font-medium text-slate-900 tracking-wide text-slate-600 hover:bg-white transition-all shadow-sm ">View Transaction Log</button>
                </div>
                <div className="divide-y divide-slate-100">
                   {filteredSales.slice(0, 5).map((sale: any) => (
                     <div key={sale.id} className="p-6 flex items-center justify-between hover:bg-slate-50/80 transition-all group">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                              <PrinterIcon className="w-6 h-6" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-900">Transaction #{sale.id}</p>
                              <p className="text-[11px] font-bold text-slate-500 mt-1">{new Date(sale.created_at).toLocaleString()}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-base font-black text-slate-900">Rs. {sale.total_amount.toFixed(2)}</p>
                           <p className={`text-[10px] font-bold mt-1 ${sale.is_returned ? 'text-red-500' : 'text-emerald-500'}`}>
                              {sale.is_returned ? 'VOIDED / RETURNED' : `PAID VIA ${sale.payment_method.toUpperCase()}`}
                           </p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="h-full flex flex-col lg:flex-row animate-fade-in overflow-hidden gap-6 p-6">
            
            {/* Product Selection Area (Middle) */}
            <div className="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm  overflow-hidden">
               <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center bg-slate-50/50 shrink-0">
                  <div className="relative flex-1 w-full group">
                     <MagnifyingGlassIcon className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-slate-900 transition-colors" />
                     <input 
                       type="text" 
                       placeholder="Scan barcode or search products..."
                       value={search}
                       onChange={(e) => setSearch(e.target.value)}
                       className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-lg text-sm font-medium placeholder:text-slate-600 focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all shadow-sm "
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

               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/20">
                  {productsLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                       {Array(12).fill(0).map((_, i) => <div key={i} className="aspect-[4/5] bg-white rounded-lg animate-pulse" />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                       {productsData?.data?.map((p: any) => (
                         <div 
                           key={p.id} 
                           onClick={() => addToCart(p)}
                           className={`group relative bg-white rounded-lg border transition-all cursor-pointer hover:shadow-sm hover:-translate-y-1 active:scale-[0.98] overflow-hidden ${p.stock <= 0 ? 'opacity-60 grayscale border-slate-200' : 'border-slate-200 hover:border-slate-900/30'}`}
                         >
                           <div className="aspect-[5/4] bg-slate-50 relative overflow-hidden">
                              <img src={p.images?.[0] || p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-slate-50/0 group-hover:bg-slate-50/5 transition-colors duration-300" />
                              {p.stock <= 5 && p.stock > 0 && (
                                <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-medium uppercase px-2.5 py-1 rounded-lg shadow-sm ">Low Stock</div>
                              )}
                              <div className="absolute top-3 right-3 bg-white/95  px-3 py-1.5 rounded-lg shadow-sm ">
                                <span className="text-[10px] font-medium text-slate-700">{p.stock} Left</span>
                              </div>
                           </div>
                           <div className="p-4 bg-white border-t border-slate-50">
                              <h3 className="text-sm font-medium text-slate-900 mb-1 line-clamp-1">{p.title}</h3>
                              <p className="text-base font-medium text-slate-900">Rs. {p.price.toLocaleString()}</p>
                           </div>
                         </div>
                       ))}
                    </div>
                  )}
               </div>

               {/* Pagination Controls */}
               {productsData?.total > limit && (
                 <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-white shrink-0">
                    <p className="text-xs font-medium text-slate-600">
                      Showing <span className="text-slate-900">{(page - 1) * limit + 1}</span> to <span className="text-slate-900">{Math.min(page * limit, productsData.total)}</span> of <span className="text-slate-900">{productsData.total}</span> items
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                      >
                        Prev
                      </button>
                      <button 
                        onClick={() => setPage(p => p + 1)}
                        disabled={page * limit >= productsData.total}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                 </div>
               )}
            </div>

            {/* Cart Panel (Right) */}
            <div className="w-full lg:w-[400px] bg-white rounded-lg border border-slate-200 flex flex-col h-full shrink-0 shadow-sm  overflow-hidden">
               <div className="p-6 border-b border-slate-200 bg-slate-50/50 shrink-0">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                        <ShoppingCartIcon className="w-6 h-6 text-slate-900" />
                     </div>
                     <div>
                        <h2 className="text-lg font-medium text-slate-900">Current Order</h2>
                        <p className="text-[11px] font-medium text-slate-600 uppercase tracking-wider">{cart.length} items selected</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="relative">
                        <UserIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                        <input 
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-medium outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
                        />
                     </div>
                     <div className="flex p-1 bg-slate-50 rounded-lg border border-slate-200">
                        {['Cash', 'Card', 'Other'].map(m => (
                          <button 
                            key={m}
                            onClick={() => setPaymentMethod(m)}
                            className={`flex-1 py-2 rounded-lg text-[11px] font-medium uppercase tracking-wider transition-all ${paymentMethod === m ? 'bg-white text-slate-900 shadow-sm  border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                          >
                            {m}
                          </button>
                        ))}
                     </div>
                  </div>
               </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 custom-scrollbar">
                  {cart.length > 0 ? cart.map((item, idx) => (
                    <div key={`${item.product_id}-${item.variant || ''}-${idx}`} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm  hover:border-emerald-200 transition-colors group">
                       <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-medium text-slate-900 line-clamp-1 pr-4">{item.product_name}</p>
                          <button onClick={() => removeFromCart(item.product_id, item.variant)} className="text-slate-700 hover:text-rose-500 transition-colors">
                             <XCircleIcon className="w-5 h-5" />
                          </button>
                       </div>
                       {item.variant && (
                         <p className="text-[10px] font-medium text-slate-600 tracking-wide text-slate-600 mb-3">{item.variant}</p>
                       )}
                       <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-900">Rs. {(item.price * item.quantity).toFixed(2)}</p>
                          <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-0.5">
                             <button onClick={() => updateQuantity(item.product_id, item.variant, -1)} className="p-1.5 text-slate-600 hover:text-slate-900 transition-colors"><MinusIcon className="w-3 h-3 stroke-[3]"/></button>
                             <span className="text-xs font-medium w-6 text-center">{item.quantity}</span>
                             <button onClick={() => updateQuantity(item.product_id, item.variant, 1)} className="p-1.5 text-slate-600 hover:text-slate-900 transition-colors"><PlusIcon className="w-3 h-3 stroke-[3]"/></button>
                          </div>
                       </div>
                    </div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                       <ShoppingCartIcon className="w-16 h-16 text-slate-600 mb-4" />
                       <p className="text-xs font-medium text-slate-600 tracking-wide text-slate-600">Cart is empty</p>
                    </div>
                  )}
               </div>

               <div className="p-6 bg-slate-900 text-white shrink-0">
                  <div className="flex justify-between items-end mb-6">
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Bill</p>
                        <h3 className="text-4xl font-black tracking-tight text-white">Rs. {total.toFixed(2)}</h3>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <button
                       disabled={cart.length === 0 || saleMutation.isPending}
                       onClick={() => { setPendingPrint(false); setShowConfirmSale(true); }}
                       className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest text-white transition-all disabled:opacity-50 border border-slate-700"
                     >
                       Record
                     </button>
                     <button
                       disabled={cart.length === 0 || saleMutation.isPending}
                       onClick={() => { setPendingPrint(true); setShowConfirmSale(true); }}
                       className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-xs uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20"
                     >
                       <PrinterIcon className="w-5 h-5" />
                       Pay & Print
                     </button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="h-full overflow-y-auto p-10 lg:p-16 space-y-10 animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Transaction Log</h2>
                   <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-3 leading-none">Archived Sales Records</p>
                </div>
                <div className="flex p-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                   {['all', 'today', 'month', 'year'].map(p => (
                     <button 
                       key={p}
                       onClick={() => setSalePeriod(p)}
                       className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${salePeriod === p ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                     >
                       {p}
                     </button>
                   ))}
                </div>
             </div>

             <div className="grid gap-6 pb-20">
                {salesLoading ? (
                  <div className="py-32 text-center">
                  <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin mx-auto mb-6" />
                     <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Loading Secured Log...</p>
                  </div>
                ) : filteredSales?.map((sale: any) => (
                  <div key={sale.id} className="bg-white p-10 rounded-xl border border-slate-200 shadow-sm flex flex-col xl:flex-row justify-between gap-10 hover:shadow-lg transition-all group">
                     <div className="flex-1">
                        <div className="flex items-center gap-4 mb-8">
                           <span className="text-lg font-black text-slate-900">Transaction ID: #{sale.id}</span>
                           <span className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${sale.is_returned ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                              {sale.is_returned ? 'Voided / Returned' : 'Successful Payment'}
                           </span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 leading-none">Payer</p>
                              <p className="text-base font-bold text-slate-900 leading-none">{sale.customer_name}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 leading-none">Mechanism</p>
                              <p className="text-base font-bold text-slate-900 leading-none">{sale.payment_method}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 leading-none">Timestamp</p>
                              <p className="text-base font-bold text-slate-900 leading-none">{new Date(sale.created_at).toLocaleString()}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 leading-none">Itemization</p>
                              <p className="text-base font-bold text-slate-900 leading-none">{(sale.items || []).length} Categories</p>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-8 border-t xl:border-t-0 xl:border-l border-slate-100 pt-10 xl:pt-0 xl:pl-10 shrink-0">
                        <div className="text-right mr-6">
                           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 leading-none">Bill Amount</p>
                           <p className="text-4xl font-black text-emerald-600 tracking-tighter leading-none">Rs. {sale.total_amount.toFixed(2)}</p>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={() => handlePrint(sale)} className="p-5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-slate-100 shadow-sm">
                              <PrinterIcon className="w-7 h-7" />
                           </button>
                           {!sale.is_returned && (
                             <button 
                               onClick={() => setShowReturnConfirm(sale.id)}
                               disabled={returnSaleMutation.isPending}
                               className="p-5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-slate-100 shadow-sm"
                             >
                                <XCircleIcon className="w-7 h-7" />
                             </button>
                           )}
                        </div>
                     </div>
                  </div>
                ))}
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
        title="Authorize Terminal Transaction"
        message={`Authorize this transaction for Rs. ${total.toFixed(2)}? This action will permanently update local inventory levels.`}
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
        title="Confirm Return & Void"
        message={`Are you sure you want to return transaction #${showReturnConfirm}? This will restore all items back to the local inventory stock. This action cannot be undone.`}
        isLoading={returnSaleMutation.isPending}
      />

      {selectingProduct && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setSelectingProduct(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-fade-in">
             <div className="flex items-center gap-4 mb-8">
                <img src={selectingProduct.images?.[0] || selectingProduct.image_url} className="w-16 h-16 rounded-lg object-cover" />
                <div>
                   <h3 className="text-xl font-black text-slate-900">{selectingProduct.title}</h3>
                   <p className="text-sm font-bold text-emerald-600">Rs. {selectingProduct.price}</p>
                </div>
             </div>

             <div className="space-y-6 mb-8">
                {(selectingProduct.variants || []).map((v: any) => (
                  <div key={v.type}>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">{v.type}</label>
                     <div className="flex flex-wrap gap-2">
                        {(v.values || []).map((val: string) => (
                          <button
                            key={val}
                            onClick={() => setSelectedVariants({ ...selectedVariants, [v.type]: val })}
                            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${selectedVariants[v.type] === val ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-600'}`}
                          >
                            {val}
                          </button>
                        ))}
                     </div>
                  </div>
                ))}
             </div>

             <button
                onClick={() => {
                  const variantStr = Object.entries(selectedVariants).map(([k, v]) => `${k}: ${v}`).join(', ');
                  addToCart(selectingProduct, variantStr);
                }}
                disabled={Object.keys(selectedVariants).length < (selectingProduct.variants?.length || 0)}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-sm tracking-widest uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                Add to Order
              </button>
          </div>
        </div>
      )}
    </div>
  );
}
