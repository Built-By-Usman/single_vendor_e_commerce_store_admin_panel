import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import { authUtils } from '../utils/auth';

const Login = lazy(() => import('../features/auth/Login'));
const Signup = lazy(() => import('../features/auth/Signup'));
const Dashboard = lazy(() => import('../features/dashboard/Dashboard'));
const Products = lazy(() => import('../features/products/Products'));
const Categories = lazy(() => import('../features/categories/Categories'));
const Banners = lazy(() => import('../features/banners/Banners'));
const Orders = lazy(() => import('../features/orders/Orders'));
const Users = lazy(() => import('../features/users/Users'));
const Settings = lazy(() => import('../features/settings/Settings'));
const POS = lazy(() => import('../features/pos/POS'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = authUtils.getToken();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const LoadingScreen = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin"></div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Suspense fallback={<LoadingScreen />}><Login /></Suspense> },
      { path: 'signup', element: <Suspense fallback={<LoadingScreen />}><Signup /></Suspense> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <Suspense fallback={<LoadingScreen />}><Dashboard /></Suspense> },
      { path: 'products', element: <Suspense fallback={<LoadingScreen />}><Products /></Suspense> },
      { path: 'categories', element: <Suspense fallback={<LoadingScreen />}><Categories /></Suspense> },
      { path: 'banners', element: <Suspense fallback={<LoadingScreen />}><Banners /></Suspense> },
      { path: 'orders', element: <Suspense fallback={<LoadingScreen />}><Orders /></Suspense> },
      { path: 'users', element: <Suspense fallback={<LoadingScreen />}><Users /></Suspense> },
      { path: 'settings', element: <Suspense fallback={<LoadingScreen />}><Settings /></Suspense> },
      { path: 'pos', element: <Suspense fallback={<LoadingScreen />}><POS /></Suspense> },
    ],
  },
]);
