import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const Sidebar = () => {
    const { navigationState, setNavigationMode, resetAnalysisState } = useAppContext();
    const [isCollapsed, setIsCollapsed] = useState(true);

    const handleNavigation = (view) => {
        if (view === 'home') {
            resetAnalysisState();
        }
        setNavigationMode(view);
    };

    const isActive = (view) => navigationState.viewMode === view;

    return (
        <aside
            className={`
                relative h-screen bg-[#F9F9FB] border-r border-secondary-200/60 transition-all duration-300 ease-in-out flex flex-col z-50
                ${isCollapsed ? 'w-20' : 'w-64'}
            `}
            onMouseEnter={() => setIsCollapsed(false)}
            onMouseLeave={() => setIsCollapsed(true)}
        >
            {/* Header / Logo Area */}
            <div className="h-24 flex items-center justify-between px-6">
                <div className={`flex items-center gap-3 overflow-hidden whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="font-bold text-secondary-900 text-lg tracking-tight">Analizador IA</span>
                </div>

                {/* Logo icon visible when collapsed */}
                {isCollapsed && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-8">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 py-4 px-4 space-y-3">
                <NavItem
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                    label="Inicio"
                    isActive={isActive('home')}
                    isCollapsed={isCollapsed}
                    onClick={() => handleNavigation('home')}
                />

                <NavItem
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                    label="Análisis de Evidencias"
                    isActive={isActive('analysis')}
                    isCollapsed={isCollapsed}
                    onClick={() => handleNavigation('analysis')}
                />

                <NavItem
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                    label="Escenarios de Prueba"
                    isActive={isActive('reports')}
                    isCollapsed={isCollapsed}
                    onClick={() => handleNavigation('reports')}
                />
            </nav>

            {/* Footer / User Profile */}
            <div className="p-6 border-t border-secondary-200/60">
                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="h-10 w-10 rounded-full bg-white border border-secondary-200 flex items-center justify-center text-secondary-400 shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden animate-fade-in">
                            <p className="text-sm font-semibold text-secondary-900 truncate">Usuario QA</p>
                            <p className="text-xs text-secondary-500 truncate">qa@example.com</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

const NavItem = ({ icon, label, isActive, isCollapsed, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                ${isActive
                    ? 'bg-[#EAF2FF] text-[#007AFF] font-medium'
                    : 'text-secondary-500 hover:bg-secondary-100/50 hover:text-secondary-900'
                }
                ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? label : ''}
        >
            {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />
            )}
            <div className={`${isActive ? 'text-primary' : 'text-secondary-400 group-hover:text-secondary-600'} transition-colors [&>svg]:w-[18px] [&>svg]:h-[18px]`}>
                {icon}
            </div>
            {!isCollapsed && (
                <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                    {label}
                </span>
            )}
        </button>
    );
};

export default Sidebar;
