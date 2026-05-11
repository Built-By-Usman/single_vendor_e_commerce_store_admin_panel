import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, MagnifyingGlassIcon, TagIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function Categories() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [search, setSearch] = useState('');

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories/').then(res => res.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: { name: string }) => {
      if (editingCategory) {
        return apiClient.put(`/categories/${editingCategory.id}`, data);
      }
      return apiClient.post('/categories/create', data);
    },
    onSuccess: () => {
      toast.success(editingCategory ? 'Category updated' : 'Category created');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to save category')
  });

  const filteredCategories = categories?.filter((c: any) => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500 font-medium">Manage product groupings and taxonomies.</p>
        </div>
        <button
          onClick={() => {setEditingCategory(null); setIsModalOpen(true)}}
          className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center transition-all shadow-lg shadow-brand-primary/20"
        >
          <PlusIcon className="w-5 h-5 mr-2 stroke-2" /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg shadow-black/20 border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 text-sm font-medium transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 text-sm font-medium">Loading categories...</p>
          </div>
        ) : filteredCategories?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200 bg-slate-50/30">
                  <th className="px-6 py-4">Ref ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCategories?.map((category: any) => (
                  <tr key={category.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-500">#{category.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm font-bold text-slate-900 group-hover:text-brand-primary transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mr-3 group-hover:bg-brand-primary-light transition-colors">
                           <TagIcon className="w-4 h-4 text-slate-500 group-hover:text-brand-primary" />
                        </div>
                        {category.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {setEditingCategory(category); setIsModalOpen(true)}} 
                        className="p-2 text-slate-500 hover:text-brand-primary hover:bg-brand-primary-light rounded-lg transition-all"
                      >
                        <PencilIcon className="w-5 h-5 stroke-2" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <TagIcon className="w-8 h-8 text-slate-700" />
             </div>
             <h3 className="text-slate-900 font-bold">No categories found</h3>
             <p className="text-slate-500 text-sm">Add your first category to start organizing products.</p>
             <button
                onClick={() => {setEditingCategory(null); setIsModalOpen(true)}}
                className="mt-4 text-brand-primary font-bold text-sm hover:underline"
              >
                + Add Category
              </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-50/60 transition-opacity" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-brand-primary-light rounded-xl flex items-center justify-center mr-4">
                  <TagIcon className="w-6 h-6 text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
                  <p className="text-[10px] font-bold text-slate-500 font-medium text-slate-500">Taxonomy Management</p>
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
                saveMutation.mutate({ name: formData.get('name') as string });
              }}
              className="flex flex-col"
            >
              <div className="p-8 space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Category Name</label>
                  <input
                    required
                    name="name"
                    defaultValue={editingCategory?.name}
                    placeholder="e.g. Fruits & Vegetables"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 text-sm font-bold outline-none transition-all"
                  />
                </div>
              </div>

              <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-4 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Cancel</button>
                <button 
                  type="submit" 
                  disabled={saveMutation.isPending} 
                  className="px-10 py-3 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-dark transition-all disabled:opacity-50 min-w-[140px]"
                >
                  {saveMutation.isPending ? 'Saving...' : (editingCategory ? 'Save Changes' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
