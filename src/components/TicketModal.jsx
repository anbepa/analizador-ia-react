import React from 'react';




function TicketModal({ show, title, content, onClose }) {
    if (!show) return null;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(content)
            .then(() => alert('¡Copiado al portapapeles!'))
            .catch(() => alert('Oops, no se pudo copiar.'));
    };

    return (
        <div className="fixed inset-0 bg-surface-overlay backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="apple-card w-full max-w-3xl max-h-[90vh] flex flex-col transform animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-secondary-100">
                    <h3 className="text-xl font-semibold text-secondary-900">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-secondary-100 rounded-apple-lg transition-colors duration-200 text-secondary-500 hover:text-secondary-700"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="modal-content prose max-w-none">{content}</div>
                </div>
                
                {/* Footer */}
                <div className="border-t border-secondary-100 px-6 py-4 flex justify-end space-x-3">
                    <button 
                        onClick={onClose} 
                        className="apple-button-secondary"
                    >
                        Cerrar
                    </button>
                    <button 
                        onClick={copyToClipboard} 
                        className="apple-button-primary"
                    >
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copiar al Portapapeles
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TicketModal;