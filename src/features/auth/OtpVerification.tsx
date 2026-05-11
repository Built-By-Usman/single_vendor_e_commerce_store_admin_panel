import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import apiClient from '../../api/client';
import { toast } from 'react-toastify';
import { authUtils } from '../../utils/auth';
import { KeyIcon } from '@heroicons/react/24/outline';

export default function OtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email) {
    return <Navigate to="/signup" replace />;
  }

  const handleResendOtp = async () => {
    try {
      setResending(true);
      await apiClient.post('/auth/resend-otp', { email });
      toast.success('A new OTP has been sent to your email.');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const formik = useFormik({
    initialValues: { otp: '' },
    validationSchema: Yup.object({
      otp: Yup.string().length(6, 'OTP must be exactly 6 digits').required('Required'),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const response = await apiClient.post('/auth/email-verification', {
          email: email,
          otp: values.otp,
        });
        
        if (response.data.access_token) {
           authUtils.setToken(response.data.access_token);
           toast.success('Verification successful!');
           navigate('/dashboard');
        } else {
           toast.success('Verification successful! Please log in.');
           navigate('/login');
        }
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Verification failed');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="w-full">
      <div className="mb-6 px-4 py-3 bg-brand-primary/5 border border-brand-primary/20 rounded-xl text-center text-sm text-brand-body">
        We sent a verification code to <span className="font-bold text-brand-primary">{email}</span>
      </div>
      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-brand-title mb-1.5 text-center">Enter 6-digit OTP</label>
          <div className="relative max-w-xs mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <KeyIcon className="h-5 w-5 text-brand-muted" />
            </div>
            <input
              type="text"
              name="otp"
              maxLength={6}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.otp}
              className={`w-full pl-10 pr-4 py-3 text-center tracking-[0.5em] text-xl rounded-xl bg-slate-50 border ${formik.touched.otp && formik.errors.otp ? 'border-brand-error focus:ring-brand-error/20' : 'border-slate-200 focus:border-brand-primary focus:ring-brand-primary/20'} focus:outline-none focus:ring-4 transition-all text-brand-title placeholder-brand-muted/50 font-bold`}
              placeholder="000000"
            />
          </div>
          {formik.touched.otp && formik.errors.otp && (
            <p className="mt-2 text-center text-xs font-semibold text-brand-error">{formik.errors.otp}</p>
          )}
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
          ) : 'Verify Email'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-200 text-center text-sm font-medium text-brand-body">
        Didn't receive the code?{' '}
        <button 
          type="button" 
          onClick={handleResendOtp}
          disabled={resending}
          className="text-brand-primary hover:text-brand-primary-dark font-bold ml-1 transition-colors disabled:opacity-50"
        >
          {resending ? 'Resending...' : 'Resend OTP'}
        </button>
      </div>
    </div>
  );
}
