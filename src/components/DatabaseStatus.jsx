import React, { useState } from 'react';
import { testDatabaseConnection, getDatabaseStats } from '../lib/databaseService';

const DatabaseStatus = () => {
  const [status, setStatus] = useState('checking');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const checkConnection = async () => {
    try {
      setStatus('checking');
      setError(null);
      
      const isConnected = await testDatabaseConnection();
      if (isConnected) {
        const dbStats = await getDatabaseStats();
        setStats(dbStats);
        setStatus('connected');
      } else {
        setStatus('disconnected');
        setError('No se pudo conectar a la base de datos. Verifica la configuración de Supabase.');
      }
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };

  React.useEffect(() => {
    checkConnection();
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50 border-green-200';
      case 'disconnected': return 'text-red-600 bg-red-50 border-red-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'checking': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'disconnected':
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'checking':
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'connected': return 'Conectado a Supabase';
      case 'disconnected': return 'Desconectado de la base de datos';
      case 'error': return 'Error de conexión';
      case 'checking': return 'Verificando conexión...';
      default: return 'Estado desconocido';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-medium">{getStatusMessage()}</h3>
            {stats && (
              <p className="text-sm opacity-75">
                {stats.reports} reportes • {stats.bugs} bugs • {stats.refinements} refinamientos
              </p>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={checkConnection}
            disabled={status === 'checking'}
            className="px-3 py-1 text-sm border border-current rounded hover:bg-current hover:bg-opacity-10 transition-colors disabled:opacity-50"
          >
            Verificar
          </button>
          

        </div>
      </div>

      {error && (
        <div className="mt-3 text-sm">
          <p className="font-medium">Error:</p>
          <p className="opacity-75">{error}</p>
        </div>
      )}

      {status === 'disconnected' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-medium text-yellow-800 mb-2">Configuración de Base de Datos</h4>
          <div className="text-sm text-yellow-700 space-y-2">
            <p>Para configurar la base de datos, ejecuta el script SQL en tu proyecto de Supabase:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Ve a tu proyecto de Supabase</li>
              <li>Abre el Editor SQL</li>
              <li>Ejecuta el contenido del archivo <code className="bg-yellow-100 px-1 rounded">database_schema.sql</code></li>
              <li>Verifica que las tablas se hayan creado correctamente</li>
            </ol>
          </div>
        </div>
      )}


    </div>
  );
};

export default DatabaseStatus;