import React from 'react';
import { useAppContext } from '../../context/AppContext';

const LoginView = () => {
    const { handleLogin } = useAppContext();

    return (
        <div className="min-h-screen bg-[#F9F9FB] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px]" />
            
            {/* Login Card */}
            <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl shadow-secondary-200/50 p-10 relative z-10 border border-secondary-100/50 animate-fade-in">
                <div className="flex flex-col items-center text-center space-y-6">
                    {/* Logo Icon */}
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-primary/30 mb-2 transform hover:scale-105 transition-transform duration-300">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-secondary-900 tracking-tight">
                            Analizador <span className="text-primary">IA</span>
                        </h1>
                        <p className="text-secondary-500 text-sm font-medium max-w-[280px]">
                            Genera planes de prueba y analiza evidencias con el poder de la Inteligencia Artificial.
                        </p>
                    </div>

                    <div className="w-full pt-6 space-y-4">
                        <button
                            onClick={handleLogin}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-secondary-900 text-white rounded-2xl font-bold hover:bg-secondary-800 transform hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-secondary-900/20 active:scale-95 group"
                        >
                            <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            Continuar con GitHub
                        </button>
                        
                        <p className="text-[10px] text-secondary-400 uppercase tracking-widest font-bold">
                            Acceso seguro vía Supabase
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer Text */}
            <div className="mt-8 text-secondary-400 text-xs font-medium">
                © 2026 Analizador IA. Todos los derechos reservados.
            </div>
        </div>
    );
};

export default LoginView;
