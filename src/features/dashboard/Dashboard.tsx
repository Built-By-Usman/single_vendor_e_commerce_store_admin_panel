import { useQuery } from '@tanstack/react-query';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { 
  UsersIcon, 
  ShoppingCartIcon, 
  BanknotesIcon, 
  ShoppingBagIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/user/all-customers', { params: { limit: 1000 } }).then(res => res.data),
  });

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => apiClient.get('/order/', { params: { limit: 1000 } }).then(res => res.data),
  });

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => apiClient.get('/products/?limit=1000').then(res => res.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories/').then(res => res.data),
  });

  const isLoading = loadingUsers || loadingOrders || loadingProducts;

  const totalUsers = usersData?.total || 0;
  const orders = ordersData?.data || [];
  const totalOrders = ordersData?.total || 0;
  
  // Only delivered orders revenue
  const revenue = orders.filter((o: any) => o.status === 'delivered')
    .reduce((acc: number, order: any) => acc + parseFloat(order.total_amount), 0);
    
  const totalProducts = productsData?.total || 0;
  const allProducts = productsData?.data || [];
  
  const categoryChartData = categories?.slice(0, 7).map((c: any) => {
    return allProducts.filter((p: any) => p.category_id === c.id).length;
  }) || [];

  const orderStats = (orders || []).reduce((acc: any, o: any) => {
    const status = o.status?.toLowerCase() || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { pending: 0, processing: 0, delivered: 0, cancelled: 0 });

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
      }
    },
    scales: {
      y: { grid: { color: '#f1f5f9' }, border: { display: false }, ticks: { font: { size: 10 } } },
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 } } }
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Overview</h1>
          <p className="text-sm text-slate-500 font-medium">Real-time insights into your online business.</p>
        </div>
        <div className="hidden sm:flex space-x-2 bg-white p-1 rounded-xl border border-slate-200">
          <span className="px-3 py-1 text-xs font-bold text-brand-primary bg-brand-primary-light rounded-lg uppercase tracking-wider">Live</span>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Preparing insights...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatCard title="Delivered Revenue" value={`Rs. ${revenue.toLocaleString()}`} icon={BanknotesIcon} color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard title="Total Customers" value={totalUsers} icon={UsersIcon} color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard title="Total Orders" value={totalOrders} icon={ShoppingCartIcon} color="text-amber-600" bg="bg-amber-50" />
            <StatCard title="In Stock Items" value={totalProducts} icon={ShoppingBagIcon} color="text-slate-500" bg="bg-white" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Order Status Distribution */}
            <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-lg shadow-black/20">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                <ClockIcon className="w-5 h-5 mr-2 text-brand-primary" />
                Order Workflow
              </h3>
              <div className="h-64 flex items-center justify-center relative">
                <Doughnut 
                  data={{
                    labels: ['Pending', 'Approved', 'Delivered', 'Rejected'],
                    datasets: [{
                      data: [orderStats.pending, orderStats.processing, orderStats.delivered, orderStats.cancelled],
                      backgroundColor: ['#f59e0b', '#4f46e5', '#10b981', '#ef4444'],
                      borderWidth: 0,
                      hoverOffset: 15
                    }]
                  }}
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    cutout: '75%',
                    plugins: { legend: { display: false } }
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-3xl font-bold text-slate-900">{totalOrders}</span>
                   <span className="text-[10px] font-bold text-slate-500 font-medium text-slate-500">Orders</span>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                 <MiniStat label="Pending" value={orderStats.pending} color="bg-amber-500" />
                 <MiniStat label="Approved" value={orderStats.processing} color="bg-brand-primary" />
                 <MiniStat label="Delivered" value={orderStats.delivered} color="bg-emerald-500" />
                 <MiniStat label="Rejected" value={orderStats.cancelled} color="bg-red-500" />
              </div>
            </div>

            {/* Inventory / Stock Types */}
            <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-lg shadow-black/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center">
                    <CircleStackIcon className="w-5 h-5 mr-2 text-brand-primary" />
                    Inventory Distribution
                  </h3>
                  <p className="text-xs text-slate-500">Products across top categories</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                   <ChartBarIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="h-80">
                <Bar 
                  data={{
                    labels: categories?.slice(0, 7).map((c: any) => c.name) || [],
                    datasets: [
                      {
                        label: 'Products',
                        data: categoryChartData,
                        backgroundColor: '#4f46e5',
                        borderRadius: 8,
                        barThickness: 32,
                      }
                    ]
                  }}
                  options={chartOptions}
                />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg shadow-black/20">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Recent System Activity</h3>
                <button 
                  onClick={() => navigate('/orders')}
                  className="text-xs font-bold text-brand-primary bg-brand-primary-light px-3 py-1.5 rounded-lg hover:bg-brand-primary hover:text-white transition-all"
                >View All Activity</button>
             </div>
             <div className="space-y-3">
                {orders?.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                        order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                        order.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'
                      }`}>
                        {order.status === 'delivered' ? <CheckCircleIcon className="w-5 h-5" /> :
                         order.status === 'cancelled' ? <XCircleIcon className="w-5 h-5" /> : <ClockIcon className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Order #{order.id} update</p>
                        <p className="text-[11px] text-slate-500 font-medium">Status changed to <span className="font-bold uppercase">{order.status}</span></p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-bold text-slate-900">Rs. {order.total_amount}</p>
                       <p className="text-[10px] text-slate-500 font-bold uppercase">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg shadow-black/20 flex items-center space-x-5 transition-all hover:border-brand-primary/20 hover:shadow-lg hover:shadow-brand-primary/5">
      <div className={`p-4 rounded-xl ${bg} ${color}`}>
        <Icon className="w-7 h-7 stroke-2" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{title}</p>
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
      <div className="flex items-center mb-1">
        <div className={`w-2 h-2 rounded-full mr-2 ${color}`}></div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold text-slate-900 leading-none">{value}</p>
    </div>
  );
}
