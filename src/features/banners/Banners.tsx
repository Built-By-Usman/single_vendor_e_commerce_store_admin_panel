import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon, PhotoIcon, XCircleIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '../../components/ConfirmationModal';
import CustomDropdown from '../../components/CustomDropdown';
import ImageUpload from '../../components/ImageUpload';

export default function Banners() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isActive, setIsActive] = useState<string>('true');
  const [imageUrl, setImageUrl] = useState<string>('');

  const openModal = (banner: any = null) => {
    setEditingBanner(banner);
    setIsActive(banner?.is_active?.toString() ?? 'true');
    setImageUrl(banner?.image_url ?? '');
    setIsModalOpen(true);
  };

  const { data: banners, isLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: () => apiClient.get('/banners/').then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/banners/${id}`),
    onSuccess: () => {
      toast.success('Banner removed');
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      setDeleteConfirmId(null);
    },
    onError: () => toast.error('Failed to remove banner')
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingBanner) {
        return apiClient.put(`/banners/${editingBanner.id}`, data);
      }
      return apiClient.post('/banners/', data);
    },
    onSuccess: () => {
      toast.success(editingBanner ? 'Banner updated' : 'Banner created');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to save banner')
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaign Banners</h1>
          <p className="text-sm text-slate-500 font-medium">Manage promotional graphics for the mobile application.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center transition-all shadow-lg shadow-brand-primary/20"
        >
          <PlusIcon className="w-5 h-5 mr-2 stroke-2" /> Add Banner
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm font-medium">Loading banners...</p>
        </div>
      ) : banners?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners?.map((banner: any) => (
            <div key={banner.id} className={`bg-white rounded-xl shadow-lg shadow-black/20 border border-slate-200 overflow-hidden group transition-all hover:shadow-lg ${!banner.is_active ? 'opacity-60' : ''}`}>
              <div className="relative h-52 bg-slate-50 overflow-hidden">
                <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-slate-50/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                   <div className="flex space-x-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <button onClick={() => openModal(banner)} className="p-3 bg-white text-brand-primary rounded-xl hover:bg-brand-primary hover:text-white transition-all shadow-xl font-bold">
                        <PencilIcon className="w-5 h-5 stroke-2" />
                      </button>
                      <button onClick={() => setDeleteConfirmId(banner.id)} className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-xl font-bold">
                        <TrashIcon className="w-5 h-5 stroke-2" />
                      </button>
                   </div>
                </div>
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    banner.is_active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-500 text-white shadow-lg'
                  }`}>
                    {banner.is_active ? 'Active' : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <p className="text-brand-primary text-[10px] font-bold font-medium text-slate-500 mb-1">{banner.subtitle || 'PROMOTION'}</p>
                <h3 className="text-slate-900 font-bold text-lg truncate">{banner.title}</h3>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center flex flex-col items-center bg-white rounded-xl border border-slate-200 border-dashed">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <PhotoIcon className="w-10 h-10 text-slate-700" />
           </div>
           <h3 className="text-slate-900 font-bold text-xl">No banners found</h3>
           <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">Create beautiful promotional banners to display on your mobile application home screen.</p>
           <button
              onClick={() => openModal()}
              className="mt-6 bg-brand-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-dark transition-all"
            >
              Add Your First Banner
            </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-50/40 transition-opacity" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            <div className="h-20 flex items-center justify-between px-8 border-b border-slate-200 shrink-0">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-brand-primary-light rounded-xl flex items-center justify-center mr-4">
                  <PhotoIcon className="w-6 h-6 text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{editingBanner ? 'Edit Banner' : 'New Banner'}</h2>
                  <p className="text-[10px] font-bold text-slate-500 font-medium text-slate-500">Promotion Management</p>
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
                
                if (!imageUrl) {
                  toast.error('Please upload an image for the banner');
                  return;
                }

                saveMutation.mutate({
                  title: formData.get('title') as string,
                  subtitle: formData.get('subtitle') as string,
                  image_url: imageUrl,
                  is_active: formData.get('is_active') === 'true',
                });
              }}
              className="flex-1 overflow-y-auto"
            >
              <div className="p-8 space-y-8">
                <section className="space-y-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="w-1.5 h-6 bg-brand-primary rounded-full"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Campaign Details</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1.5 block">Banner Title</label>
                      <input required name="title" defaultValue={editingBanner?.title} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-primary/20 text-sm font-bold outline-none" placeholder="e.g. Summer Sale 2024" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1.5 block">Subtitle / Caption</label>
                      <input name="subtitle" defaultValue={editingBanner?.subtitle} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-primary/20 text-sm font-bold outline-none" placeholder="e.g. Up to 50% Off" />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="w-1.5 h-6 bg-brand-primary rounded-full"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Media & Visibility</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="sm:col-span-2">
                      <ImageUpload
                        value={imageUrl}
                        onChange={setImageUrl}
                        bucket="banners"
                        label="Banner Graphics"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1.5 block">Visibility Status</label>
                      <CustomDropdown
                        name="is_active"
                        options={[
                          { id: 'true', name: 'Active (Published)' },
                          { id: 'false', name: 'Inactive (Draft)' },
                        ]}
                        value={isActive}
                        onChange={(val) => setIsActive(val as string)}
                        placeholder="Select status"
                      />
                    </div>
                  </div>
                </section>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-4 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Cancel</button>
                <button type="submit" disabled={saveMutation.isPending} className="px-10 py-3 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-dark transition-all disabled:opacity-50 min-w-[160px]">
                  {saveMutation.isPending ? 'Saving...' : (editingBanner ? 'Save Changes' : 'Create Banner')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
        title="Delete Banner"
        message="Are you sure you want to remove this promotional banner?"
        isDanger={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
