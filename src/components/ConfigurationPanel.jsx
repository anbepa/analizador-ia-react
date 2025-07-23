import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { downloadHtmlReport } from '../lib/downloadService';

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
        reports, // Get all reports
        scrollToReport
    } = useAppContext();

    const [showDownloadOptions, setShowDownloadOptions] = useState(false);

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

    const showConfig = mode !== 'actions';
    const showActions = mode !== 'config';

    return (
        <div className="bg-white rounded-xl shadow-md p-6 glassmorphism">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                {showConfig && showActions ? 'Configuración y Acciones' : showConfig ? 'Configuración' : 'Acciones'}
            </h2>

            {showConfig && (
            <div className="space-y-4">
                <div>
                    <label htmlFor="ai-provider-select" className="block text-sm font-medium text-gray-700 mb-1">Proveedor de IA
                        <span className="ml-1 text-gray-400" title="Selecciona el servicio de IA a utilizar">ⓘ</span>
                    </label>
                    <select id="ai-provider-select" value={apiConfig.provider} onChange={handleProviderChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                        <option value="gemini">Gemini (Google)</option>
                        <option value="openai">OpenAI (ChatGPT)</option>
                        <option value="claude">Anthropic (Claude)</option>
                    </select>
                </div>

                {apiConfig.provider === 'gemini' && (
                     <div id="gemini-settings" className="space-y-4">
                        <div>
                            <label htmlFor="gemini-key" className="block text-sm font-medium text-gray-700 mb-1">Clave API de Gemini
                                <span className="ml-1 text-gray-400" title="Tu clave secreta de la API">ⓘ</span>
                            </label>
                            <input
                                type="password"
                                id="gemini-key"
                                title="Introduce tu clave de Gemini"
                                value={apiConfig.gemini.key}
                                onChange={(e) => handleConfigChange('gemini', 'key', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                placeholder="Introduce tu clave de Gemini"
                            />
                        </div>
                        <div>
                            <label htmlFor="gemini-model-select" className="block text-sm font-medium text-gray-700 mb-1">Modelo de Gemini
                                <span className="ml-1 text-gray-400" title="Versión del modelo IA">ⓘ</span>
                            </label>
                            <select 
                                id="gemini-model-select" 
                                value={apiConfig.gemini.model} 
                                onChange={(e) => handleConfigChange('gemini', 'model', e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            >
                                {geminiModels.map(model => (
                                    <option key={model.id} value={model.id}>{model.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {apiConfig.provider === 'openai' && (
                     <div id="openai-settings" className="space-y-4">
                        <div>
                            <label htmlFor="openai-key" className="block text-sm font-medium text-gray-700 mb-1">Clave API de OpenAI
                                <span className="ml-1 text-gray-400" title="Tu clave secreta de la API">ⓘ</span>
                            </label>
                            <input
                                type="password"
                                id="openai-key"
                                title="Introduce tu clave de OpenAI"
                                value={apiConfig.openai.key}
                                onChange={(e) => handleConfigChange('openai', 'key', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                placeholder="Introduce tu clave de OpenAI"
                            />
                        </div>
                        <div>
                            <label htmlFor="openai-model-select" className="block text-sm font-medium text-gray-700 mb-1">Modelo de OpenAI
                                <span className="ml-1 text-gray-400" title="Versión del modelo IA">ⓘ</span>
                            </label>
                            <select id="openai-model-select" value={apiConfig.openai.model} onChange={(e) => handleConfigChange('openai', 'model', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                                <option value="gpt-4o">GPT-4o</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            </select>
                        </div>
                    </div>
                )}
               
                {apiConfig.provider === 'claude' && (
                    <div id="claude-settings" className="space-y-4">
                        <div>
                            <label htmlFor="claude-key" className="block text-sm font-medium text-gray-700 mb-1">Clave API de Claude
                                <span className="ml-1 text-gray-400" title="Tu clave secreta de la API">ⓘ</span>
                            </label>
                            <input
                                type="password"
                                id="claude-key"
                                title="Introduce tu clave de Anthropic"
                                value={apiConfig.claude.key}
                                onChange={(e) => handleConfigChange('claude', 'key', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                placeholder="Introduce tu clave de Anthropic"
                            />
                        </div>
                        <div>
                            <label htmlFor="claude-model-select" className="block text-sm font-medium text-gray-700 mb-1">Modelo de Claude
                                <span className="ml-1 text-gray-400" title="Versión del modelo IA">ⓘ</span>
                            </label>
                            <select id="claude-model-select" value={apiConfig.claude.model} onChange={(e) => handleConfigChange('claude', 'model', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                                <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                                <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                                <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                            </select>
                        </div>
                    </div>
                )}

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
                    className="w-full bg-primary text-white font-semibold py-2 px-6 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                    <span>🧠 Generar Reporte</span>
                </button>
                <button
                    onClick={handleEnableRefinement}
                    disabled={!canRefine}
                    title={canRefine ? '' : 'Genera un reporte primero'}
                    className="w-full bg-primary text-white font-semibold py-2 px-6 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                    <span>🔍 Habilitar Refinamiento</span>
                </button>
                <div className="relative">
                    <button
                        onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                        disabled={!canDownload}
                        title={canDownload ? '' : 'Genera un reporte primero'}
                        className="w-full bg-highlight text-black font-semibold py-2 px-6 rounded-md hover:bg-highlight/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-highlight transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                        <span>⬇️ Descargar HTML</span>
                        <svg className={`w-4 h-4 transition-transform ${showDownloadOptions ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
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
        </div>
    );
}

export default ConfigurationPanel;
