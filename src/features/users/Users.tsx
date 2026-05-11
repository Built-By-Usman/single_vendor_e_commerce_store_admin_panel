import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { toast } from 'react-toastify';
import { 
  UsersIcon, 
  NoSymbolIcon, 
  CheckCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import ConfirmationModal from '../../components/ConfirmationModal';

const userTabs = [
  { id: 'all', name: 'All Customers', icon: UsersIcon },
  { id: 'active', name: 'Active', icon: CheckCircleIcon },
  { id: 'blocked', name: 'Blocked', icon: NoSymbolIcon },
];

export default function Users() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [blockConfirm, setBlockConfirm] = useState<{ id: number, action: 'block' | 'unblock' } | null>(null);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/user/all-customers', { params: { limit: 1000 } }).then(res => res.data),
  });

  const users = usersData?.data || [];

  const blockMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'block' | 'unblock' }) => 
      apiClient.put(`/user/${action}-user/${id}`),
    onSuccess: (_, variables) => {
      toast.success(`User ${variables.action}ed successfully`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setBlockConfirm(null);
    },
    onError: () => toast.error('Failed to update user status')
  });

  const filteredUsers = users?.filter((u: any) => {
    const matchesTab = activeTab === 'all' || (activeTab === 'blocked' ? u.is_blocked : !u.is_blocked);
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) 
      || u.email?.toLowerCase().includes(search.toLowerCase())
      || u.city?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Directory</h1>
          <p className="text-sm text-slate-500 font-medium">Moderate customer accounts and manage access privileges.</p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-50 px-4 py-2 rounded-xl text-emerald-600 border border-emerald-100">
           <ShieldCheckIcon className="w-5 h-5" />
           <span className="text-xs font-bold uppercase tracking-wider">Secure Access</span>
        </div>
      </div>

      <div className="flex flex-col space-y-4">
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
          {userTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-5 py-2.5 rounded-xl border transition-all text-sm font-bold whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-brand-primary text-white border-brand-primary shadow-md shadow-brand-primary/20'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <tab.icon className={`w-4 h-4 mr-2 stroke-2 ${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`} />
              {tab.name}
            </button>
          ))}
        </div>

        <div className="relative max-w-md w-full">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 text-sm font-medium transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 text-sm font-medium">Scanning customers...</p>
          </div>
        ) : filteredUsers?.length > 0 ? (
          filteredUsers?.map((user: any) => (
            <div key={user.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col hover:border-brand-primary/20 hover:shadow-lg hover:shadow-brand-primary/5 transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mr-4 group-hover:scale-110 transition-transform ${
                    user.is_blocked ? 'bg-red-50 text-red-600' : 'bg-brand-primary-light text-brand-primary'
                  }`}>
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 truncate max-w-[120px]">{user.name || 'Anonymous'}</h3>
                    <p className="text-[10px] font-bold text-slate-500 font-medium text-slate-500">Customer #{user.id}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                  user.is_blocked ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  {user.is_blocked ? 'Blocked' : 'Active'}
                </span>
              </div>

              <div className="space-y-4 flex-1 mb-6">
                <div className="flex items-center text-sm font-medium text-slate-500">
                  <div className="p-2 bg-slate-50 rounded-lg mr-3">
                    <EnvelopeIcon className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center text-sm font-medium text-slate-500">
                  <div className="p-2 bg-slate-50 rounded-lg mr-3">
                    <PhoneIcon className="w-4 h-4 text-slate-500" />
                  </div>
                  <span>{user.phone_number || 'No phone'}</span>
                </div>
                <div className="flex items-start text-sm font-medium text-slate-500">
                  <div className="p-2 bg-slate-50 rounded-lg mr-3 mt-0.5">
                    <MapPinIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  </div>
                  <div className="flex flex-col">
                    <span className="line-clamp-1 leading-snug">{user.address || 'Address not listed'}</span>
                    <span className="text-xs text-slate-500 font-bold uppercase mt-1">{user.city || 'No City'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setBlockConfirm({ id: user.id, action: user.is_blocked ? 'unblock' : 'block' })}
                disabled={blockMutation.isPending}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center ${
                  user.is_blocked
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20'
                    : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
                } disabled:opacity-50`}
              >
                {user.is_blocked ? (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Unblock Account
                  </>
                ) : (
                  <>
                    <NoSymbolIcon className="w-4 h-4 mr-2" />
                    Block User
                  </>
                )}
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
             <UsersIcon className="w-12 h-12 text-slate-700 mx-auto mb-4" />
             <h3 className="text-slate-900 font-bold">No customers matched your criteria</h3>
          </div>
        )}
      </div>

      <ConfirmationModal 
        isOpen={!!blockConfirm}
        onClose={() => setBlockConfirm(null)}
        onConfirm={() => blockConfirm && blockMutation.mutate(blockConfirm)}
        title={blockConfirm?.action === 'block' ? 'Confirm User Block' : 'Lift Account Block'}
        message={`Are you sure you want to ${blockConfirm?.action} this user? ${blockConfirm?.action === 'block' ? 'They will lose all purchasing privileges immediately.' : 'They will regain full access to the store.'}`}
        isDanger={blockConfirm?.action === 'block'}
        isLoading={blockMutation.isPending}
      />
    </div>
  );
}
