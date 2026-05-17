import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { toast } from 'react-toastify';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import ConfirmationModal from '../../components/ConfirmationModal';
import CustomDropdown from '../../components/CustomDropdown';

const statusTabs = [
  { id: 'all', name: 'All Orders', icon: ClipboardDocumentListIcon },
  { id: 'pending', name: 'Pending', icon: ClockIcon },
  { id: 'processing', name: 'Approved', icon: CheckCircleIcon },
  { id: 'shipped', name: 'In Transit', icon: TruckIcon },
  { id: 'delivered', name: 'Success', icon: CheckCircleIcon },
  { id: 'cancelled', name: 'Rejected', icon: XCircleIcon },
  { id: 'returned', name: 'Returned', icon: XCircleIcon },
];

export default function Orders() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [statusConfirm, setStatusConfirm] = useState<{ id: number, status: string } | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const [page, setPage] = useState(1);
  const limit = 15;

  const { data: paginatedOrders, isLoading } = useQuery({
    queryKey: ['orders', page, limit],
    queryFn: () => apiClient.get('/order/', { params: { page, limit } }).then(res => res.data),
  });

  const orders = paginatedOrders?.data || [];
  const total = paginatedOrders?.total || 0;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiClient.patch(`/order/${id}/status`, null, { params: { new_status: status } }),
    onSuccess: () => {
      toast.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setStatusConfirm(null);
      setSelectedOrder(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Update failed')
  });

  const handlePrint = (e: React.MouseEvent, order: any) => {
    e.stopPropagation();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Order Receipt - #${order.id}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            .receipt { border: 2px solid #000; padding: 20px; max-width: 400px; margin: auto; }
            .header { text-align: center; border-bottom: 2px solid #000; margin-bottom: 20px; padding-bottom: 10px; }
            .field { margin: 10px 0; font-size: 14px; }
            .label { font-weight: bold; width: 120px; display: inline-block; }
            .items { margin-top: 15px; border-top: 1px dashed #999; padding-top: 10px; }
            .item { display: flex; justify-content: space-between; font-size: 13px; margin: 5px 0; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; font-style: italic; }
            .price { font-size: 20px; font-weight: bold; margin-top: 20px; text-align: right; border-top: 2px solid #000; padding-top: 10px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="receipt">
            <div class="header">
              <h2>COURIER LABEL</h2>
              <div style="text-align: left; margin: 15px 0; padding: 10px; background: #f8f9fa; border: 1px dashed #ccc; border-radius: 4px; font-size: 13px;">
                <strong>Sender:</strong> LushLock Store<br>
                <strong>Contact:</strong> support@lushlock.com
              </div>
              <p>Order #${order.id}</p>
              <p>${new Date(order.created_at).toLocaleString()}</p>
            </div>
            <div class="field"><span class="label">Customer:</span> ${order.user_name || 'N/A'}</div>
            <div class="field"><span class="label">Phone:</span> ${order.phone_no}</div>
            <div class="field"><span class="label">Address:</span> ${order.address}</div>
            <div class="field"><span class="label">City:</span> ${order.city || 'N/A'}</div>
            <div class="items">
              <strong>Items:</strong>
              ${order.items.map((item: any) => `
                <div class="item">
                  <div style="flex: 1;">
                    <div>${item.product_name} x${item.quantity}</div>
                    ${item.variant ? `<div style="font-size: 11px; opacity: 0.6; font-style: italic;">${item.variant}</div>` : ''}
                  </div>
                  <span>Rs. ${(item.price_at_time_of_order * item.quantity).toFixed(0)}</span>
                </div>
              `).join('')}
            </div>
            <div class="price">Total: Rs. ${order.total_amount}</div>
            <div class="footer">
              Thank you for shopping with us!
              <div style="margin-top: 20px; font-size: 10px; color: #666; font-style: normal;">
                Software by BuiltByUsman All Rights Reserved
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'processing': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      case 'returned': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const filteredOrders = orders?.filter((o: any) => {
    const matchesTab = activeTab === 'all' || o.status?.toLowerCase() === activeTab;
    const matchesSearch = o.id.toString().includes(search)
      || o.phone_no?.includes(search)
      || o.user_name?.toLowerCase().includes(search.toLowerCase())
      || o.city?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orders Management</h1>
          <p className="text-sm text-slate-500 font-medium">Track, process and manage customer orders.</p>
        </div>
      </div>

      <div className="flex flex-col space-y-4">
        <div className="flex overflow-x-auto pb-2 scrollbar-hide space-x-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-5 py-3 rounded-xl border transition-all whitespace-nowrap text-xs font-bold font-medium text-slate-500 ${activeTab === tab.id
                  ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              <tab.icon className={`w-4 h-4 mr-2.5 stroke-[2.5] ${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`} />
              {tab.name}
            </button>
          ))}
        </div>

        <div className="relative max-w-xl w-full group">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by ID, Phone, Name, or City..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 text-sm font-medium transition-all shadow-lg shadow-black/20 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-32 text-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-slate-500 text-sm font-bold font-medium text-slate-500">Loading orders data...</p>
          </div>
        ) : filteredOrders?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.15em] border-b border-slate-50 bg-slate-50/30">
                  <th className="px-8 py-5">Order Info</th>
                  <th className="px-8 py-5">Customer Details</th>
                  <th className="px-8 py-5">City</th>
                  <th className="px-8 py-5">Order Total</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders?.map((order: any) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="group hover:bg-slate-50/50 transition-all cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-brand-primary transition-colors">#{order.id}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">
                          {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{order.user_name || `Guest User`}</span>
                        <span className="text-[11px] text-slate-500 font-bold mt-0.5 tracking-tight">{order.phone_no}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">{order.city || '—'}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-md font-bold text-slate-900">Rs. {order.total_amount}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold font-medium text-slate-500 border shadow-lg shadow-black/20 ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => handlePrint(e, order)}
                          className="p-3 text-slate-500 hover:text-brand-primary hover:bg-brand-primary-light rounded-xl transition-all border border-transparent hover:border-brand-primary/10"
                          title="Print Receipt"
                        >
                          <PrinterIcon className="w-5 h-5" />
                        </button>
                        <div className="w-40 relative">
                          <CustomDropdown
                            options={[
                              { id: 'pending', name: 'Pending' },
                              { id: 'processing', name: 'Approve' },
                              { id: 'shipped', name: 'Ship' },
                              { id: 'delivered', name: 'Deliver' },
                              { id: 'cancelled', name: 'Reject' },
                            ]}
                            value={order.status}
                            onChange={(val) => setStatusConfirm({ id: order.id, status: val as string })}
                            placeholder="Status"
                          />
                        </div>
                        {order.status !== 'returned' && (
                          <button
                            onClick={() => setStatusConfirm({ id: order.id, status: 'returned' })}
                            className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                            title="Mark as Returned"
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-32 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
              <ClipboardDocumentListIcon className="w-12 h-12 text-slate-800" />
            </div>
            <h3 className="text-slate-900 font-bold text-2xl tracking-tight">No orders matched</h3>
            <p className="text-slate-500 text-sm mt-2 font-medium">Try adjusting your filters or search terms.</p>
          </div>
        )}

        {/* Pagination Controls */}
        {total > limit && (
          <div className="px-8 py-6 bg-slate-50/50 flex items-center justify-between border-t border-slate-200">
            <div className="flex flex-col">
              <p className="text-xs font-bold text-slate-500">
                Showing {orders.length} of {total} orders
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">
                Page {page} of {Math.ceil(total / limit)}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-6 py-2.5 text-xs font-bold bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= total}
                className="px-6 py-2.5 text-xs font-bold bg-brand-primary text-white rounded-xl shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-dark disabled:opacity-30 transition-all"
              >
                Next Page
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/60">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-10 border-b border-slate-200 flex justify-between items-start bg-slate-50/50">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-slate-900">Order Details</h2>
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] border ${getStatusStyle(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-bold font-medium text-slate-500">Order ID: #{selectedOrder.id} • {new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <XCircleIcon className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 font-medium text-slate-500 mb-3">Customer Information</h4>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">{selectedOrder.user_name || 'Guest User'}</p>
                    <p className="text-sm font-medium text-slate-500">{selectedOrder.phone_no}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 font-medium text-slate-500 mb-3">Delivery Address</h4>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">{selectedOrder.address}</p>
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-wider">{selectedOrder.city}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-500 font-medium text-slate-500 mb-4">Order Summary</h4>
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.product_name}</p>
                          {item.variant && (
                            <p className="text-[10px] font-bold text-brand-primary font-medium text-slate-500 mt-0.5">{item.variant}</p>
                          )}
                          <p className="text-xs text-slate-500 font-bold mt-1">Rs. {item.price_at_time_of_order} × {item.quantity}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-900">Rs. {item.price_at_time_of_order * item.quantity}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 bg-slate-50/50 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 font-medium text-slate-500">Total Payble Amount</span>
                    <span className="text-xl font-bold text-brand-primary">Rs. {selectedOrder.total_amount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                Close
              </button>
              <button
                onClick={(e) => handlePrint(e, selectedOrder)}
                className="px-8 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-sm font-bold font-medium text-slate-500 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-lg shadow-black/20"
              >
                <PrinterIcon className="w-4 h-4" />
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!statusConfirm}
        onClose={() => setStatusConfirm(null)}
        onConfirm={() => statusConfirm && updateStatusMutation.mutate(statusConfirm)}
        title="Confirm Status Change"
        message={`Confirm changing Order #${statusConfirm?.id} status to ${statusConfirm?.status?.toUpperCase()}? This will update stock records accordingly.`}
        isLoading={updateStatusMutation.isPending}
      />
    </div>
  );
}
