#!/usr/bin/env node
/**
 * Script para probar el servidor en un puerto libre
 */

// Configurar puerto libre para pruebas
process.env.PORT = '3000';
process.env.NODE_ENV = 'production';

console.log('🧪 Iniciando servidor de pruebas en puerto 3000...\n');

// Importar y ejecutar el servidor
import('./server.js');