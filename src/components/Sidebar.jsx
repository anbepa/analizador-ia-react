import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const Sidebar = () => {
    const { 
        navigationState, 
        setNavigationMode,
        session,
        handleLogin,
        handleLogout
    } = useAppContext();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleNavigation = (view) => {
        setNavigationMode(view);
    };

    const isActive = (view) => navigationState.viewMode === view;

    return (
        <aside
            className={`
                relative h-screen bg-[#F9F9FB] border-r border-secondary-200/60 transition-all duration-300 ease-in-out flex flex-col z-50
                ${isCollapsed ? 'w-20' : 'w-64'}
            `}
        >
            {/* Header / Logo Area */}
            <div className="h-24 flex items-center justify-between px-6">
                {!isCollapsed && (
                    <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap animate-fade-in">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="font-bold text-secondary-900 text-lg tracking-tight">Analizador IA</span>
                    </div>
                )}
                <button
                    onClick={toggleCollapse}
                    className={`
                        p-2 rounded-lg text-secondary-400 hover:bg-white hover:shadow-sm hover:text-secondary-600 transition-all
                        ${isCollapsed ? 'mx-auto' : ''}
                    `}
                >
                    {isCollapsed ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    )}
                </button>
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
            <div className="p-4 border-t border-secondary-200/60">
                {!session ? (
                    <button
                        onClick={handleLogin}
                        className={`
                            flex items-center gap-3 w-full p-2 rounded-xl transition-all
                            bg-secondary-900 text-white hover:bg-secondary-800
                            ${isCollapsed ? 'justify-center' : ''}
                        `}
                        title="Conectar GitHub"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        {!isCollapsed && <span className="text-sm font-medium">Login GitHub</span>}
                    </button>
                ) : (
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <img 
                            src={session.user.user_metadata.avatar_url} 
                            alt="User" 
                            className="h-10 w-10 rounded-full border border-secondary-200 shadow-sm"
                        />
                        {!isCollapsed && (
                            <div className="overflow-hidden flex-1 animate-fade-in">
                                <p className="text-sm font-semibold text-secondary-900 truncate">
                                    {session.user.user_metadata.full_name || session.user.email}
                                </p>
                                <p className="text-[10px] text-green-600 font-medium truncate">Copilot Activo</p>
                            </div>
                        )}
                        {!isCollapsed && (
                            <button 
                                onClick={handleLogout}
                                className="p-1.5 rounded-lg text-secondary-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                title="Cerrar sesión"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
};

const NavItem = ({ icon, label, isActive, isCollapsed, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
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
            <div className={`${isActive ? 'text-primary' : 'text-secondary-400 group-hover:text-secondary-600'} transition-colors`}>
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
