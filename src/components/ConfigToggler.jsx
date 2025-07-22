import React from 'react';
import { useAppContext } from '../context/AppContext';

const ConfigToggler = () => {
    const { showConfigurationPanel, setShowConfigurationPanel } = useAppContext();

    return (
        <div className="text-center mb-4">
            <button 
                onClick={() => setShowConfigurationPanel(!showConfigurationPanel)}
                className="w-full md:w-auto bg-gray-200 text-gray-700 font-semibold py-2 px-6 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
                <span>⚙️ {showConfigurationPanel ? 'Ocultar' : 'Mostrar'} Paneles de Configuración y Carga</span>
            </button>
        </div>
    );
};

export default ConfigToggler;
