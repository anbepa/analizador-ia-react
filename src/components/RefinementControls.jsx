import React from 'react';
import { useAppContext } from '../context/AppContext';

function RefinementControls() {
    const { 
        userContext, 
        setUserContext, 
        setIsRefining, 
        handleSaveAndRefine 
    } = useAppContext();

    return (
        <div className="bg-white rounded-xl shadow-md p-6 glassmorphism">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Contexto Adicional para Refinamiento</h2>
            <p className="text-sm text-gray-600 mb-3">Añade aquí cualquier instrucción o aclaración para que la IA la considere en el re-análisis (ej: "las imágenes son logs", "enfócate en el paso 3").</p>
            <textarea 
                rows="4" 
                className="w-full p-2 border border-gray-300 rounded-md"
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
            />
            <div className="mt-4 flex justify-end space-x-3">
                <button onClick={() => setIsRefining(false)} className="bg-gray-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-600">Cancelar</button>
                <button onClick={handleSaveAndRefine} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700">Guardar y Refinar</button>
            </div>
        </div>
    );
}

export default RefinementControls;
