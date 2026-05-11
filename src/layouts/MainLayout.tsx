import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authUtils } from '../utils/auth';
import apiClient from '../api/client';
import {
  HomeIcon,
  ShoppingBagIcon,
  TagIcon,
  PhotoIcon,
  ShoppingCartIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  BellIcon,
  Bars3Icon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

import { useWebSocket } from '../hooks/useWebSocket';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Initialize WebSocket connection
  useWebSocket();

  // Get orders count for badge
  const { data: ordersData } = useQuery({
    queryKey: ['orders-count'],
    queryFn: () => apiClient.get('/order/', { params: { limit: 1000 } }).then(res => res.data),
  });

  const orders = ordersData?.data || [];





  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiClient.get('/settings/').then(res => res.data),
  });

  const pendingOrdersCount = orders?.filter((o: any) => o.status === 'pending').length || 0;

  // const playNotificationSound = () => {
  //   const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  //   audio.play().catch(() => console.log('Sound blocked by browser'));
  // };

  const handleLogout = () => {
    authUtils.removeToken();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Products', href: '/products', icon: ShoppingBagIcon },
    { name: 'Categories', href: '/categories', icon: TagIcon },
    { name: 'Banners', href: '/banners', icon: PhotoIcon },
    { name: 'Orders', href: '/orders', icon: ShoppingCartIcon, badge: 'pending' },
    { name: 'Users', href: '/users', icon: UsersIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  // Add POS conditionally
  if (settings?.enable_pos) {
    navigation.splice(5, 0, { name: 'POS (Offline)', href: '/pos', icon: CreditCardIcon });
  }

  const isPOS = location.pathname === '/pos';

  return (
    <div className={`flex h-screen bg-brand-bg font-sans overflow-hidden ${isPOS ? 'bg-[#f8fafc]' : ''}`}>
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-50/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 transform
          lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
        <div className="h-20 flex items-center px-8 border-b border-slate-200">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20 mr-3">
             <ShoppingBagIcon className="w-6 h-6 text-white stroke-2" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-title tracking-tight">LushLock</h1>
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Management Console</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-brand-primary'
                }`
              }
            >
              <div className="flex items-center">
                <item.icon className="w-5 h-5 mr-3 stroke-2 transition-transform group-hover:scale-110" />
                <span>{item.name}</span>
              </div>
              {item.badge === 'pending' && pendingOrdersCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-error text-[10px] font-bold text-white animate-pulse">
                  {pendingOrdersCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center w-full px-4 py-3 text-sm font-semibold text-slate-500 rounded-xl hover:bg-red-50 hover:text-brand-error transition-all group"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3 stroke-2 group-hover:-translate-x-1 transition-transform" />
            Logout Account
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center">
            <button 
              className="p-2 mr-4 text-slate-500 lg:hidden hover:bg-white rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-brand-title capitalize hidden sm:block">
              {location.pathname.substring(1).replace('-', ' ') || 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-xl border border-slate-200 transition-all ${showNotifications ? 'bg-brand-primary text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-white'}`}
              >
                <BellIcon className="w-6 h-6 stroke-2" />
                {pendingOrdersCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-brand-error rounded-full border-2 border-white animate-ping"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-900">Notifications</span>
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-primary-light px-2 py-0.5 rounded-full uppercase tracking-wider">{pendingOrdersCount} New</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {pendingOrdersCount > 0 ? (
                      <div className="p-4 space-y-3">
                         <p className="text-xs font-medium text-slate-500">You have {pendingOrdersCount} pending orders waiting for approval.</p>
                         <button 
                            onClick={() => {navigate('/orders'); setShowNotifications(false)}}
                            className="w-full py-2 bg-brand-primary text-white text-xs font-bold rounded-lg shadow-lg shadow-black/20"
                          >View Orders</button>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-500">
                         <p className="text-sm">No new notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block leading-tight">
                <p className="text-sm font-bold text-slate-900">Usman Admin</p>
                <p className="text-[10px] font-bold text-brand-muted font-medium text-slate-500">Master Control</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-emerald-400 flex items-center justify-center text-white font-bold text-lg shadow-md">
                U
              </div>
            </div>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto relative scroll-smooth ${isPOS ? 'p-0' : 'p-4 lg:p-8'}`}>
          <div className={isPOS ? 'max-w-none h-full' : 'max-w-7xl mx-auto'}>
            <Outlet />
          </div>
        </main>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-50/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 animate-fade-in">
            <h3 className="text-xl font-bold text-slate-900 mb-2 text-center">Confirm Logout</h3>
            <p className="text-slate-500 text-center mb-8">Are you sure you want to exit the management console?</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-white text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
              >Cancel</button>
              <button 
                onClick={handleLogout}
                className="flex-1 py-3 bg-brand-error text-white font-bold rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
              >Yes, Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
