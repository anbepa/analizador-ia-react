import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

function GeminiChat() {
    const { setCurrentImageFiles, apiConfig } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error

    // Función para optimizar prompts y hacerlos menos conversacionales
    const optimizePrompt = (userPrompt) => {
        // Agregar instrucciones específicas para hacer el comportamiento menos conversacional
        const optimizedPrompt = `${userPrompt}

INSTRUCCIONES CRÍTICAS - SEGUIR ESTRICTAMENTE:
1. Ejecuta ÚNICAMENTE la acción específica solicitada
2. NO inventes datos personales (nombres, emails, teléfonos, etc.)
3. NO llenes formularios automáticamente con información ficticia
4. NO realices pasos adicionales que no se pidieron explícitamente
5. Si encuentras un formulario que requiere datos, DETENTE y reporta qué información se necesita
6. Si necesitas información específica, PREGUNTA antes de continuar
7. Sé directo y conciso en tus respuestas
8. Proporciona el contenido obtenido de forma clara y estructurada
9. NO asumas intenciones más allá de lo que se pidió literalmente`;

        return optimizedPrompt;
    };

    const sendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        // Validar que la configuración de Gemini esté disponible
        if (!apiConfig.gemini.key) {
            const errorMessage = { type: 'error', content: 'Error: Configura tu API key de Gemini en el panel de configuración primero.' };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }

        const userMessage = { type: 'user', content: inputValue };
        setMessages(prev => [...prev, userMessage]);
        const originalPrompt = inputValue;
        const optimizedPrompt = optimizePrompt(originalPrompt);
        setInputValue('');
        setIsLoading(true);
        setConnectionStatus('connecting');

        try {
            // Usar URL relativa en producción, localhost en desarrollo
            const apiUrl = import.meta.env.PROD ? '/api/chat' : 'http://localhost:3000/api/chat';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: optimizedPrompt,
                    apiKey: apiConfig.gemini.key,
                    model: apiConfig.gemini.model
                })
            });

            if (!response.ok) {
                throw new Error('Error en la comunicación con el backend');
            }

            const data = await response.json();

            const botMessage = { type: 'bot', content: data.response };
            setMessages(prev => [...prev, botMessage]);

            setConnectionStatus('connected');

        } catch (error) {
            const errorMessage = { type: 'error', content: `Error: ${error.message}` };
            setMessages(prev => [...prev, errorMessage]);
            setConnectionStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
    };



    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 flex items-center justify-center gap-2"
                title="Abrir chat con Gemini MCP"
            >
                💬 Chat con Gemini
            </button>
        );
    }

    return (
        <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-blue-50 rounded-t-lg">
                <h3 className="text-sm font-medium text-gray-800 flex items-center gap-2">
                    💬 Chat con Gemini MCP
                    <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' :
                        connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                            connectionStatus === 'error' ? 'bg-red-500' :
                                'bg-gray-400'
                        }`} title={
                            connectionStatus === 'connected' ? 'Conectado' :
                                connectionStatus === 'connecting' ? 'Conectando...' :
                                    connectionStatus === 'error' ? 'Error de conexión' :
                                        'Desconectado'
                        }></span>
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={clearChat}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
                        title="Limpiar chat"
                    >
                        🗑️
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
                        title="Cerrar chat"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="h-48 overflow-y-auto p-3 space-y-2 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                        <p>💡 Pregúntale a Gemini sobre automatización web</p>
                        <p className="text-xs mt-1">Ejemplo: "Abre la página https://example.com y haz clic en el botón Login"</p>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div
                            key={index}
                            className={`p-2 rounded-lg text-sm max-w-[85%] ${message.type === 'user'
                                ? 'bg-blue-500 text-white ml-auto'
                                : message.type === 'error'
                                    ? 'bg-red-100 text-red-800 border border-red-200'
    
                                        : message.type === 'info'
                                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                            : message.type === 'success'
                                                ? 'bg-green-50 text-green-800 border border-green-200'
                                                : 'bg-white text-gray-800 border border-gray-200'
                                }`}
                        >
                            <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="bg-white text-gray-800 border border-gray-200 p-2 rounded-lg text-sm max-w-[85%]">
                        <div className="flex items-center gap-2">
                            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            Procesando...
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-200">
                <div className="flex gap-2">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Escribe tu consulta para Gemini..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="2"
                        disabled={isLoading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    >
                        📤
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Presiona Enter para enviar, Shift+Enter para nueva línea
                </p>


            </div>
        </div>
    );
}

export default GeminiChat;