import React from 'react';

const LoadingModal = ({ show, message }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-secondary-900/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 flex flex-col items-center animate-in fade-in zoom-in duration-200">
                {/* Spinner animado */}
                <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 border-4 border-secondary-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                    {/* Icono central opcional */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-secondary-900 mb-2 text-center">
                    Procesando
                </h3>

                <p className="text-secondary-600 text-center text-sm animate-pulse">
                    {message || 'Por favor espere...'}
                </p>

                {/* Barra de progreso indeterminada */}
                <div className="w-full h-1.5 bg-secondary-100 rounded-full mt-6 overflow-hidden">
                    <div className="h-full bg-primary rounded-full w-1/2 animate-progress-indeterminate"></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingModal;
