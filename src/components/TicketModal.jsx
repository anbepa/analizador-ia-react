import React from 'react';

function TicketModal({ show, title, content, onClose }) {
    if (!show) return null;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(content)
            .then(() => alert('¡Copiado al portapapeles!'))
            .catch(() => alert('Oops, no se pudo copiar.'));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-secondary-900/40 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white rounded-[32px] shadow-2xl border border-secondary-100 w-full max-w-3xl max-h-[90vh] flex flex-col transform transition-all overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)]">
                {/* Header */}
                <div className="flex justify-between items-center p-8 border-b border-secondary-50">
                    <div>
                        <h3 className="text-2xl font-bold text-secondary-900 leading-tight">{title}</h3>
                        <p className="text-xs text-secondary-400 mt-1 font-medium">Contenido generado automáticamente por el Analizador IA</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center hover:bg-secondary-100 rounded-full transition-all text-secondary-400 hover:text-secondary-600 active:scale-90"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-secondary-50/30 custom-scrollbar">
                    <div className="prose max-w-none text-secondary-700 whitespace-pre-wrap font-mono text-sm bg-white p-6 rounded-2xl border border-secondary-200 shadow-inner leading-relaxed">
                        {content}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 flex justify-end items-center gap-4 bg-white border-t border-secondary-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-sm font-bold text-secondary-500 hover:text-secondary-700 transition-colors"
                    >
                        Cerrar
                    </button>
                    <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copiar contenido
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TicketModal;