import { Outlet, useLocation } from 'react-router-dom';
import { ShoppingBagIcon } from '@heroicons/react/24/solid';

export default function AuthLayout() {
  const location = useLocation();
  const isLogin = location.pathname === '/login';
  const isSignup = location.pathname === '/signup';
  const isOtp = location.pathname === '/verify-otp';

  let title = 'Welcome back';
  let subtitle = 'Enter your details to access your dashboard.';

  if (isSignup) {
    title = 'Create an account';
    subtitle = 'Sign up to start managing your store.';
  } else if (isOtp) {
    title = 'Verify your email';
    subtitle = 'Please enter the verification code we sent you.';
  }

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Left Panel - Branding/Marketing */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-brand-primary overflow-hidden items-center justify-center">
        {/* Abstract background shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-[30rem] h-[30rem] rounded-full bg-white blur-[100px]"></div>
          <div className="absolute bottom-10 right-10 w-[20rem] h-[20rem] rounded-full bg-emerald-300 blur-[80px]"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 px-12 max-w-xl text-center">
          <div className="mb-10 inline-flex items-center justify-center w-24 h-24 bg-white/10 rounded-[2rem] border border-white/20 shadow-2xl backdrop-blur-md">
            <ShoppingBagIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-[1.2]">
            Streamline your E-commerce business
          </h1>
          <p className="text-lg text-emerald-100/90 font-medium leading-relaxed">
            Manage inventory, process orders, and grow your customer base with our comprehensive admin platform.
          </p>
          
          <div className="mt-12 flex items-center justify-center space-x-4">
             <div className="h-2 w-2 rounded-full bg-white"></div>
             <div className="h-2 w-2 rounded-full bg-white/30"></div>
             <div className="h-2 w-2 rounded-full bg-white/30"></div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white relative">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden mb-6 inline-flex items-center justify-center w-16 h-16 bg-brand-primary-light rounded-xl">
              <ShoppingBagIcon className="w-8 h-8 text-brand-primary" />
            </div>
            <h2 className="text-3xl font-bold text-brand-title mb-2 tracking-tight">
              {title}
            </h2>
            <p className="text-brand-body text-sm font-medium">
              {subtitle}
            </p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
