import React from 'react';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Eliminar", 
    cancelText = "Cancelar",
    variant = "danger" // danger, primary
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-secondary-900/40 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white rounded-[28px] shadow-2xl border border-secondary-100 max-w-md w-full overflow-hidden transform transition-all animate-scale-in">
                <div className="p-8 text-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto ${
                        variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-primary/10 text-primary'
                    }`}>
                        {variant === 'danger' ? (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        ) : (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-secondary-900 mb-2 tracking-tight">{title}</h3>
                    <p className="text-sm text-secondary-500 mb-8 leading-relaxed">
                        {message}
                    </p>
                    
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onConfirm}
                            className={`w-full py-4 font-bold rounded-2xl transition-all shadow-lg active:scale-95 ${
                                variant === 'danger' 
                                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-200' 
                                    : 'bg-primary text-white hover:bg-primary-600 shadow-primary/20'
                            }`}
                        >
                            {confirmText}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 text-sm font-bold text-secondary-500 hover:text-secondary-700 transition-colors"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
