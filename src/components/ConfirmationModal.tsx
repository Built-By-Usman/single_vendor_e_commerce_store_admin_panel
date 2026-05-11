

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  isLoading = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-50/60 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-fade-in">
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="p-4 bg-slate-50 flex space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 ${
              isDanger 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                : 'bg-brand-primary hover:bg-brand-primary-dark shadow-brand-primary/20'
            }`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
