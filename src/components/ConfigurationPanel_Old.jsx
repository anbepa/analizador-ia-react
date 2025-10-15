import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { downloadHtmlReport } from '../lib/downloadService';
import DatabaseStatus from './DatabaseStatus';
import ImageUploader from './ImageUploader';

function ConfigurationPanel({ mode = 'full' }) {
    const {
        apiConfig,
        setApiConfig,
        handleAnalysis,
        setIsRefining,
        canGenerate,
        canRefine,
        canDownload,
        activeReport,
        reports,
        scrollToReport,
        // Refinement related states and functions
        isRefining,
        userContext,
        setUserContext,
        handleSaveAndRefine,
        loading,
        handleAddStepWithImage,
        handleStepDelete,
        setCurrentImageFiles,
        currentImageFiles
    } = useAppContext();

    // UI States
    const [activeTab, setActiveTab] = useState(isRefining ? 'refinamiento' : 'configuracion');
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        proveedor: true,
        database: false,
        evidencias: true,
        pasos: true
    });
    
    // Refinement specific states
    const [showImageUploader, setShowImageUploader] = useState(false);
    const [newStepData, setNewStepData] = useState({
        descripcion_accion_observada: '',
        dato_de_entrada_paso: '',
        resultado_esperado_paso: '',
        imagen_referencia_entrada: '',
        imagen_referencia_salida: ''
    });
    const [isAddingStep, setIsAddingStep] = useState(false);

    const geminiModels = [
        { id: "gemini-1.5-flash-latest", name: "Gemini 1.5 Flash (Latest)" },
        { id: "gemini-1.5-pro-latest", name: "Gemini 1.5 Pro (Latest)" },
        { id: "gemini-1.0-pro", name: "Gemini 1.0 Pro" },
        { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    ];

    const handleProviderChange = (e) => {
        setApiConfig(prev => ({ ...prev, provider: e.target.value }));
    };

    const handleConfigChange = (provider, field, value) => {
        setApiConfig(prev => ({
            ...prev,
            [provider]: {
                ...prev[provider],
                [field]: value
            }
        }));
    };

    const saveConfigToCache = () => {
        localStorage.setItem('qaAppApiConfig', JSON.stringify(apiConfig));
        alert('¡Configuración guardada!');
    };

    const handleEnableRefinement = () => {
        setIsRefining(true);
        scrollToReport();
    };

    // Refinement Functions
    const handleAddNewStep = () => {
        setIsAddingStep(true);
        setNewStepData({
            descripcion_accion_observada: '',
            dato_de_entrada_paso: '',
            resultado_esperado_paso: '',
            imagen_referencia_entrada: '',
            imagen_referencia_salida: ''
        });
    };

    const handleSaveNewStep = async () => {
        if (!newStepData.descripcion_accion_observada.trim()) {
            alert('Por favor, ingresa una descripción para la acción observada');
            return;
        }

        try {
            await handleAddStepWithImage(newStepData);
            setIsAddingStep(false);
            setNewStepData({
                descripcion_accion_observada: '',
                dato_de_entrada_paso: '',
                resultado_esperado_paso: '',
                imagen_referencia_entrada: '',
                imagen_referencia_salida: ''
            });
        } catch (error) {
            alert('Error al agregar el paso: ' + error.message);
        }
    };

    const handleCancelNewStep = () => {
        setIsAddingStep(false);
    };

    const handleDeleteStep = async (stepNumber) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar el paso ${stepNumber}? Esta acción no se puede deshacer.`)) {
            try {
                await handleStepDelete(stepNumber);
            } catch (error) {
                alert('Error al eliminar el paso: ' + error.message);
            }
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const tabs = [
        { id: 'configuracion', label: 'Configuración', icon: '⚙️' },
        { id: 'evidencias', label: 'Evidencias', icon: '📷' },
        ...(isRefining ? [{ id: 'refinamiento', label: 'Refinamiento', icon: '🔧' }] : []),
        ...(activeReport?.Pasos_Analizados ? [{ id: 'pasos', label: 'Pasos', icon: '📝' }] : [])
    ];

    const showConfig = mode !== 'actions';
    const showActions = mode !== 'config';

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header Fijo con Título y Acciones Rápidas */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        ⚙️ Panel de Control
                    </h2>
                    <div className="text-xs text-slate-500">
                        {loading.state && '⏳ Procesando...'}
                    </div>
                </div>
                
                {/* Barra de Acciones Rápidas */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => handleAnalysis(false)}
                        disabled={!canGenerate}
                        title={canGenerate ? 'Generar nuevo reporte' : 'Carga evidencias y clave API'}
                        className={`flex-1 min-w-[100px] px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1 ${
                            canGenerate 
                                ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <span className="text-sm">🚀</span>
                        Generar
                    </button>
                    
                    <button
                        onClick={handleEnableRefinement}
                        disabled={!canRefine}
                        title={canRefine ? 'Refinar reporte actual' : 'Genera un reporte primero'}
                        className={`flex-1 min-w-[100px] px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1 ${
                            canRefine 
                                ? 'bg-slate-600 text-white hover:bg-slate-700 shadow-sm' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <span className="text-sm">🔧</span>
                        Refinar
                    </button>
                    
                    <div className="relative">
                        <button
                            onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                            disabled={!canDownload}
                            title={canDownload ? 'Exportar reporte' : 'Genera un reporte primero'}
                            className={`px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1 ${
                                canDownload 
                                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm' 
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            <span className="text-sm">📄</span>
                            Exportar
                            <span className={`text-xs transition-transform ${showDownloadOptions ? 'rotate-180' : ''}`}>⌄</span>
                        </button>
                        {showDownloadOptions && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20">
                                <div className="py-1">
                                    <button 
                                        onClick={(e) => { e.preventDefault(); downloadHtmlReport(activeReport); setShowDownloadOptions(false); }} 
                                        className="block w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                                    >
                                        📄 Reporte Activo
                                    </button>
                                    <button 
                                        onClick={(e) => { e.preventDefault(); downloadHtmlReport(reports); setShowDownloadOptions(false); }} 
                                        className="block w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                                    >
                                        📁 Todos los Reportes
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={saveConfigToCache}
                        className="px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1"
                    >
                        <span className="text-sm">💾</span>
                        Guardar
                    </button>
                </div>
                
                {/* Tabs de Navegación */}
                <div className="flex gap-1 mt-3 bg-slate-50 p-1 rounded-lg">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-1 ${
                                activeTab === tab.id
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contenido Principal con Scroll */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                
                {/* Tab: Configuración */}
                {activeTab === 'configuracion' && (
                    <div className="space-y-3">
                        {/* Acordeón: Proveedor de IA */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => toggleSection('proveedor')}
                                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">🤖</span>
                                    <span className="font-medium text-sm text-slate-800">Proveedor de IA</span>
                                    <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                                        {apiConfig.provider.toUpperCase()}
                                    </span>
                                </div>
                                <span className={`text-slate-400 transition-transform ${expandedSections.proveedor ? 'rotate-180' : ''}`}>
                                    ⌄
                                </span>
                            </button>
                            {expandedSections.proveedor && (
                                <div className="p-4 space-y-3 bg-white">
                                    <select 
                                        value={apiConfig.provider} 
                                        onChange={handleProviderChange} 
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                    >
                                        <option value="gemini">🔮 Google Gemini</option>
                                        <option value="openai">🚀 OpenAI</option>
                                        <option value="claude">🧠 Anthropic Claude</option>
                                    </select>

                                    {apiConfig.provider === 'gemini' && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                                    🔑 Clave API
                                                </label>
                                                <input
                                                    type="password"
                                                    value={apiConfig.gemini.key}
                                                    onChange={(e) => handleConfigChange('gemini', 'key', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                    placeholder="Clave API de Gemini"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                                    🎯 Modelo
                                                </label>
                                                <select 
                                                    value={apiConfig.gemini.model} 
                                                    onChange={(e) => handleConfigChange('gemini', 'model', e.target.value)} 
                                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                >
                                                    {geminiModels.map(model => (
                                                        <option key={model.id} value={model.id}>{model.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {apiConfig.provider === 'openai' && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                                    🔑 Clave API
                                                </label>
                                                <input
                                                    type="password"
                                                    value={apiConfig.openai.key}
                                                    onChange={(e) => handleConfigChange('openai', 'key', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                    placeholder="Clave API de OpenAI"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                                    🎯 Modelo
                                                </label>
                                                <select 
                                                    value={apiConfig.openai.model} 
                                                    onChange={(e) => handleConfigChange('openai', 'model', e.target.value)} 
                                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                >
                                                    <option value="gpt-4">GPT-4</option>
                                                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {apiConfig.provider === 'claude' && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                                    🔑 Clave API
                                                </label>
                                                <input
                                                    type="password"
                                                    value={apiConfig.claude.key}
                                                    onChange={(e) => handleConfigChange('claude', 'key', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                    placeholder="Clave API de Claude"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                                    🎯 Modelo
                                                </label>
                                                <select 
                                                    value={apiConfig.claude.model} 
                                                    onChange={(e) => handleConfigChange('claude', 'model', e.target.value)} 
                                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                >
                                                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                                                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                                                    <option value="claude-3-opus">Claude 3 Opus</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Estado de la Base de Datos</h3>
                    <DatabaseStatus />
                </div>

                <button
                    onClick={saveConfigToCache}
                    className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 flex items-center justify-center gap-2"
                >
                    💾 Guardar Configuración
                </button>
            </div>
            )}

            {showActions && (
            <div id="main-actions" className={`mt-6 space-y-3 ${showConfig ? 'pt-4 border-t' : ''}`}>
                <button
                    onClick={() => handleAnalysis(false)}
                    disabled={!canGenerate}
                    title={canGenerate ? '' : 'Carga evidencias y clave API'}
                    className="w-full bg-violet-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg disabled:shadow-none"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>Generar Reporte</span>
                </button>
                <button
                    onClick={handleEnableRefinement}
                    disabled={!canRefine}
                    title={canRefine ? '' : 'Genera un reporte primero'}
                    className="w-full bg-slate-600 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Refinar Reporte</span>
                </button>
                <div className="relative">
                    <button
                        onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                        disabled={!canDownload}
                        title={canDownload ? '' : 'Genera un reporte primero'}
                        className="w-full bg-green-600 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Descargar HTML</span>
                        <svg className={`w-4 h-4 transition-transform ${showDownloadOptions ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {showDownloadOptions && (
                        <div className="absolute z-10 mt-2 w-full bg-white rounded-md shadow-lg">
                            <ul className="py-1">
                                <li>
                                    <a href="#" onClick={(e) => { e.preventDefault(); downloadHtmlReport(activeReport); setShowDownloadOptions(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Descargar Reporte Activo</a>
                                </li>
                                <li>
                                    <a href="#" onClick={(e) => { e.preventDefault(); downloadHtmlReport(reports); setShowDownloadOptions(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Descargar Todos los Reportes</a>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            )}

            {/* Refinement Controls - Show when isRefining is true */}
            {isRefining && (
                <div id="refinement-section" className="mt-6 space-y-6 pt-6 border-t border-gray-200">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                            🔧 Refinamiento de Análisis
                        </h3>
                    </div>

                    {/* Contexto Adicional */}
                    <div>
                        <h4 className="text-md font-semibold text-gray-800 mb-3">Contexto Adicional</h4>
                        <p className="text-sm text-gray-600 mb-3">
                            Añade aquí cualquier instrucción o aclaración para que la IA la considere en el re-análisis.
                        </p>
                        <textarea 
                            rows="4" 
                            className="w-full p-3 border border-gray-300 rounded-md disabled:bg-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                            value={userContext}
                            onChange={(e) => setUserContext(e.target.value)}
                            disabled={loading.state}
                            placeholder="Ej: 'las imágenes son logs', 'enfócate en el paso 3', 'considera que es un flujo de pruebas de regresión'"
                        />
                    </div>

                    {/* Gestión de Pasos */}
                    <div>
                        <h4 className="text-md font-semibold text-gray-800 mb-3">Gestión de Pasos</h4>
                        
                        {/* Agregar Nuevo Paso */}
                        {!isAddingStep ? (
                            <button 
                                onClick={handleAddNewStep}
                                disabled={loading.state}
                                className="w-full bg-green-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm mb-4 text-sm"
                            >
                                ➕ Agregar Nuevo Paso con Imagen
                            </button>
                        ) : (
                            <div className="border border-green-200 rounded-lg p-4 bg-green-50 mb-4">
                                <h5 className="font-medium text-green-800 mb-3 text-sm">Nuevo Paso</h5>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Descripción de la Acción Observada *
                                        </label>
                                        <textarea
                                            rows="2"
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                            value={newStepData.descripcion_accion_observada}
                                            onChange={(e) => setNewStepData(prev => ({...prev, descripcion_accion_observada: e.target.value}))}
                                            placeholder="Describe qué se observa en este paso"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Dato de Entrada
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                            value={newStepData.dato_de_entrada_paso}
                                            onChange={(e) => setNewStepData(prev => ({...prev, dato_de_entrada_paso: e.target.value}))}
                                            placeholder="Datos que se ingresan en este paso"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Resultado Esperado
                                        </label>
                                        <textarea
                                            rows="2"
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                            value={newStepData.resultado_esperado_paso}
                                            onChange={(e) => setNewStepData(prev => ({...prev, resultado_esperado_paso: e.target.value}))}
                                            placeholder="Qué se espera que suceda en este paso"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveNewStep}
                                            disabled={loading.state}
                                            className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
                                        >
                                            Guardar Paso
                                        </button>
                                        <button
                                            onClick={handleCancelNewStep}
                                            disabled={loading.state}
                                            className="bg-gray-500 text-white px-3 py-1.5 rounded-md hover:bg-gray-600 disabled:opacity-50 transition-colors text-sm"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Lista de Pasos Actuales */}
                        {activeReport?.Pasos_Analizados && (
                            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                <h5 className="font-medium text-gray-800 mb-3 text-sm">Pasos Actuales ({activeReport.Pasos_Analizados.length})</h5>
                                <div className="max-h-32 overflow-y-auto space-y-2">
                                    {activeReport.Pasos_Analizados.map((step) => (
                                        <div key={step.numero_paso} className="flex items-center justify-between bg-white p-2 rounded border">
                                            <div className="flex-1 min-w-0">
                                                <span className="font-medium text-xs">Paso {step.numero_paso}:</span>
                                                <span className="text-xs text-gray-600 ml-2 truncate block">
                                                    {step.descripcion_accion_observada?.substring(0, 40)}
                                                    {step.descripcion_accion_observada?.length > 40 ? '...' : ''}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteStep(step.numero_paso)}
                                                disabled={loading.state}
                                                className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs hover:bg-red-600 disabled:opacity-50 transition-colors ml-2"
                                                title="Eliminar paso"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cargar Imágenes Adicionales */}
                    <div>
                        <h4 className="text-md font-semibold text-gray-800 mb-3">Imágenes Adicionales</h4>
                        <button
                            onClick={() => setShowImageUploader(!showImageUploader)}
                            disabled={loading.state}
                            className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm mb-3 text-sm"
                        >
                            {showImageUploader ? '🔽 Ocultar' : '📷 Cargar Imágenes Adicionales'} ({currentImageFiles.length})
                        </button>
                        
                        {showImageUploader && (
                            <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                                <ImageUploader />
                            </div>
                        )}
                    </div>

                    {/* Botones de Acción Refinamiento */}
                    <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                        <button
                            onClick={handleSaveAndRefine}
                            className="w-full bg-violet-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-violet-700 disabled:bg-violet-400 transition-colors shadow-sm text-sm"
                            disabled={loading.state}
                        >
                            {loading.state ? 'Procesando...' : '🔄 Guardar y Refinar Análisis'}
                        </button>
                        <button 
                            onClick={() => setIsRefining(false)} 
                            className="w-full bg-gray-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-gray-600 disabled:bg-gray-400 transition-colors text-sm"
                            disabled={loading.state}
                        >
                            ❌ Cancelar Refinamiento
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}

export default ConfigurationPanel;
