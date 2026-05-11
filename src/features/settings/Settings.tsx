import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import apiClient from '../../api/client';
import { toast } from 'react-toastify';
import { ShieldCheckIcon, AdjustmentsHorizontalIcon, SparklesIcon, TicketIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function Settings() {
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiClient.get('/settings/').then(res => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.put('/settings/', data),
    onSuccess: () => {
      toast.success('System settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowConfirm(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Update failed')
  });

  const formik = useFormik({
    initialValues: {
      app_version: settings?.app_version || '',
      delivery_charges: settings?.delivery_charges || 0,
      min_order_amount: settings?.min_order_amount || 0,
      enable_pos: settings?.enable_pos || false,
      store_name: settings?.store_name || 'LushLock',
      store_slogan: settings?.store_slogan || 'Freshness delivered to your doorstep',
      is_sale_active: settings?.is_sale_active || false,
      discount_percent: settings?.discount_percent || 0,
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      app_version: Yup.string().required('Required'),
      delivery_charges: Yup.number().min(0, 'Must be positive').required('Required'),
      min_order_amount: Yup.number().min(0, 'Must be positive').required('Required'),
      enable_pos: Yup.boolean(),
      store_name: Yup.string().required('Required'),
      store_slogan: Yup.string().required('Required'),
      is_sale_active: Yup.boolean(),
      discount_percent: Yup.number().min(0).max(100, 'Max 100%'),
    }),
    onSubmit: () => {
      setShowConfirm(true);
    },
  });

  return (
    <div className="max-w-4xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500 font-medium">Configure global application parameters, branding and pricing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center">
                <TicketIcon className="w-5 h-5 mr-3 text-orange-500" />
                <span className="font-bold text-slate-900 text-sm">Global Sale System</span>
              </div>
              <button
                type="button"
                onClick={() => formik.setFieldValue('is_sale_active', !formik.values.is_sale_active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formik.values.is_sale_active ? 'bg-orange-500' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formik.values.is_sale_active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className={!formik.values.is_sale_active ? 'opacity-40 grayscale pointer-events-none' : ''}>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Discount Percentage</label>
                  <span className="text-xl font-black text-orange-600">{formik.values.discount_percent}%</span>
                </div>
                <input
                  name="discount_percent"
                  type="range"
                  min="0"
                  max="90"
                  step="5"
                  onChange={formik.handleChange}
                  value={formik.values.discount_percent}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <p className="mt-4 text-xs text-slate-500 font-medium italic">This discount will be applied to all products across the store instantly.</p>
              </div>

              {formik.values.is_sale_active && (
                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <SparklesIcon className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-black text-orange-700 uppercase tracking-tighter">Sale Live: {formik.values.discount_percent}% OFF</span>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-orange-600"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/30 flex items-center">
               <AdjustmentsHorizontalIcon className="w-5 h-5 mr-3 text-slate-500" />
               <span className="font-bold text-slate-900 text-sm">System Config</span>
            </div>
            
            <form onSubmit={formik.handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">App Version</label>
                <input
                  name="app_version"
                  type="text"
                  onChange={formik.handleChange}
                  value={formik.values.app_version}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-primary text-xs font-bold transition-all outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Delivery Fee</label>
                <input
                  name="delivery_charges"
                  type="number"
                  onChange={formik.handleChange}
                  value={formik.values.delivery_charges}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-primary text-xs font-bold transition-all outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Min Order Amount</label>
                <input
                  name="min_order_amount"
                  type="number"
                  onChange={formik.handleChange}
                  value={formik.values.min_order_amount}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-primary text-xs font-bold transition-all outline-none"
                />
                <p className="mt-1 text-[9px] text-slate-400 font-medium italic">* Excludes delivery charges.</p>
              </div>

              <div className="flex items-center justify-between py-4 border-y border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Enable POS</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Enable offline billing.</p>
                </div>
                <button
                  type="button"
                  onClick={() => formik.setFieldValue('enable_pos', !formik.values.enable_pos)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${formik.values.enable_pos ? 'bg-brand-primary' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formik.values.enable_pos ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-black transition-all disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Syncing...' : 'Save Configuration'}
              </button>

              <div className="flex items-center justify-center text-emerald-600">
                 <ShieldCheckIcon className="w-4 h-4 mr-2" />
                 <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Encryption</span>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => updateMutation.mutate(formik.values)}
        title="Apply New Global Settings"
        message="This action will instantly update the branding, slogans, and global pricing across all customer apps and the web platform. Are you sure?"
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
