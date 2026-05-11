import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { authUtils } from '../../utils/auth';
import apiClient from '../../api/client';
import { toast } from 'react-toastify';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Required'),
      password: Yup.string().required('Required'),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        // Backend expects OAuth2PasswordRequestForm (form data)
        const formData = new URLSearchParams();
        formData.append('username', values.email); // FastAPI OAuth2 uses 'username'
        formData.append('password', values.password);

        const response = await apiClient.post('/auth/login', formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        authUtils.setToken(response.data.access_token);
        toast.success('Logged in successfully');
        navigate('/dashboard');
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Login failed');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="w-full">
      <form onSubmit={formik.handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-brand-title mb-1.5">Email address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-brand-muted" />
            </div>
            <input
              type="email"
              name="email"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.email}
              className={`w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border ${formik.touched.email && formik.errors.email ? 'border-brand-error focus:ring-brand-error/20' : 'border-slate-200 focus:border-brand-primary focus:ring-brand-primary/20'} focus:outline-none focus:ring-4 transition-all text-brand-title placeholder-brand-muted font-medium`}
              placeholder="admin@example.com"
            />
          </div>
          {formik.touched.email && formik.errors.email && (
            <p className="mt-1.5 text-xs font-semibold text-brand-error">{formik.errors.email}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-brand-title mb-1.5">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-brand-muted" />
            </div>
            <input
              type="password"
              name="password"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.password}
              className={`w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border ${formik.touched.password && formik.errors.password ? 'border-brand-error focus:ring-brand-error/20' : 'border-slate-200 focus:border-brand-primary focus:ring-brand-primary/20'} focus:outline-none focus:ring-4 transition-all text-brand-title placeholder-brand-muted font-medium`}
              placeholder="••••••••"
            />
          </div>
          {formik.touched.password && formik.errors.password && (
            <p className="mt-1.5 text-xs font-semibold text-brand-error">{formik.errors.password}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-slate-300 rounded cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-brand-body font-medium cursor-pointer">
              Remember me
            </label>
          </div>
          <div className="text-sm">
            <a href="#" className="font-semibold text-brand-primary hover:text-brand-primary-dark transition-colors">
              Forgot password?
            </a>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 mt-2 text-white bg-brand-primary hover:bg-brand-primary-dark rounded-xl font-bold shadow-lg shadow-brand-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center"
        >
          {loading ? (
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : 'Sign In'}
        </button>
      </form>
      
      <div className="mt-8 pt-6 border-t border-slate-200 text-center text-sm font-medium text-brand-body">
        Don't have an account? <Link to="/signup" className="text-brand-primary hover:text-brand-primary-dark font-bold ml-1 transition-colors">Sign up for free</Link>
      </div>
    </div>
  );
}
