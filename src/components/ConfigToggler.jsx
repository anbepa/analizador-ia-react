import React from 'react';
import { useAppContext } from '../context/AppContext';

const ConfigToggler = () => {
    const { showConfigurationPanel, setShowConfigurationPanel } = useAppContext();

    return (
        <button
            onClick={() => setShowConfigurationPanel(!showConfigurationPanel)}
            className="bg-primary text-white font-semibold py-2 px-4 rounded shadow-md hover:bg-primary/90 transition-colors"
        >
            {showConfigurationPanel ? 'Ocultar Configuración' : 'Mostrar Configuración'}
        </button>
    );
};

export default ConfigToggler;
