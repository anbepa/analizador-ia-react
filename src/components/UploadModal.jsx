import React from 'react';
import ImageUploader from './ImageUploader';

function UploadModal({ show, onClose }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="glass-panel w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-100 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-secondary-100 bg-white/50">
                    <div>
                        <h3 className="text-xl font-bold text-secondary-900">Gestión de Evidencias</h3>
                        <p className="text-sm text-secondary-500">Carga imágenes y añade contexto para el análisis</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary-100 rounded-xl transition-colors duration-200 text-secondary-500 hover:text-secondary-700"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white/30 custom-scrollbar">
                    <ImageUploader />
                </div>

                {/* Footer */}
                <div className="border-t border-secondary-100 px-6 py-4 flex justify-end space-x-3 bg-white/50">
                    <button
                        onClick={onClose}
                        className="apple-button apple-button-primary flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Listo
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UploadModal;
