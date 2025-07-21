import React from 'react';
import { useAppContext } from '../context/AppContext';
import { downloadHtmlReport } from '../lib/downloadService';

function ConfigurationPanel() {
    const {
        apiConfig,
        setApiConfig,
        handleAnalysis,
        setIsRefining,
        canGenerate,
        canRefine,
        canDownload,
        reportJson,
        imageFiles,
        scrollToReport // Obtener la función del contexto
    } = useAppContext();

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
        scrollToReport(); // Llamar a la función de desplazamiento
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6 glassmorphism">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Configuración y Acciones</h2>
            
            <div className="space-y-4">
                <div>
                    <label htmlFor="ai-provider-select" className="block text-sm font-medium text-gray-700 mb-1">Proveedor de IA</label>
                    <select id="ai-provider-select" value={apiConfig.provider} onChange={handleProviderChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="gemini">Gemini (Google)</option>
                        <option value="openai">OpenAI (ChatGPT)</option>
                        <option value="claude">Anthropic (Claude)</option>
                    </select>
                </div>

                {apiConfig.provider === 'gemini' && (
                     <div id="gemini-settings" className="space-y-4">
                        <div>
                            <label htmlFor="gemini-key" className="block text-sm font-medium text-gray-700 mb-1">Clave API de Gemini</label>
                            <input type="password" id="gemini-key" value={apiConfig.gemini.key} onChange={(e) => handleConfigChange('gemini', 'key', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="Introduce tu clave de Gemini" />
                        </div>
                        <div>
                            <label htmlFor="gemini-model-select" className="block text-sm font-medium text-gray-700 mb-1">Modelo de Gemini</label>
                            <select id="gemini-model-select" value={apiConfig.gemini.model} onChange={(e) => handleConfigChange('gemini', 'model', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                                <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Latest)</option>
                                <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro (Latest)</option>
                            </select>
                        </div>
                    </div>
                )}

                {apiConfig.provider === 'openai' && (
                     <div id="openai-settings" className="space-y-4">
                        <div>
                            <label htmlFor="openai-key" className="block text-sm font-medium text-gray-700 mb-1">Clave API de OpenAI</label>
                            <input type="password" id="openai-key" value={apiConfig.openai.key} onChange={(e) => handleConfigChange('openai', 'key', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="Introduce tu clave de OpenAI" />
                        </div>
                        <div>
                            <label htmlFor="openai-model-select" className="block text-sm font-medium text-gray-700 mb-1">Modelo de OpenAI</label>
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
                            <label htmlFor="claude-key" className="block text-sm font-medium text-gray-700 mb-1">Clave API de Claude</label>
                            <input type="password" id="claude-key" value={apiConfig.claude.key} onChange={(e) => handleConfigChange('claude', 'key', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="Introduce tu clave de Anthropic" />
                        </div>
                        <div>
                            <label htmlFor="claude-model-select" className="block text-sm font-medium text-gray-700 mb-1">Modelo de Claude</label>
                            <select id="claude-model-select" value={apiConfig.claude.model} onChange={(e) => handleConfigChange('claude', 'model', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                                <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                                <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                                <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                            </select>
                        </div>
                    </div>
                )}

                <button onClick={saveConfigToCache} className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">Guardar Configuración</button>
            </div>

            <div id="main-actions" className="mt-6 pt-4 border-t space-y-3">
                <button onClick={() => handleAnalysis(false)} disabled={!canGenerate} className="w-full bg-green-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                    <span>1. Generar Reporte</span>
                </button>
                <button onClick={handleEnableRefinement} disabled={!canRefine} className="w-full bg-blue-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                    <span>2. Habilitar Refinamiento</span>
                </button>
                <button onClick={() => downloadHtmlReport(reportJson, imageFiles)} disabled={!canDownload} className="w-full bg-orange-500 text-white font-semibold py-2 px-6 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                    <span>📥 Descargar HTML</span>
                </button>
            </div>
        </div>
    );
}

export default ConfigurationPanel;