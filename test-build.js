#!/usr/bin/env node
/**
 * Script para probar el build de producción localmente
 * Simula el proceso de build de Render.com
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🧪 Probando build de producción...\n');

// Función para ejecutar comandos
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`▶️  Ejecutando: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, { 
      stdio: 'inherit', 
      shell: true,
      ...options 
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Comando falló con código ${code}`));
      }
    });
  });
}

async function testBuild() {
  try {
    // 1. Limpiar build anterior
    console.log('🧹 Limpiando build anterior...');
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }

    // 2. Instalar dependencias
    console.log('📦 Instalando dependencias...');
    await runCommand('npm', ['install']);

    // 3. Build del frontend
    console.log('🏗️  Building frontend...');
    await runCommand('npm', ['run', 'build']);

    // 4. Instalar dependencias del backend

    // 5. Verificar archivos generados
    console.log('✅ Verificando archivos generados...');
    
    const distExists = fs.existsSync('dist');
    const indexExists = fs.existsSync('dist/index.html');
    const serverExists = fs.existsSync('server.js');
    console.log(`📁 dist/: ${distExists ? '✅' : '❌'}`);
    console.log(`📄 dist/index.html: ${indexExists ? '✅' : '❌'}`);
    console.log(`🖥️  server.js: ${serverExists ? '✅' : '❌'}`);

    if (distExists && indexExists && serverExists) {
      console.log('\n🎉 ¡Build de producción exitoso!');
      console.log('\n📋 Para probar localmente:');
      console.log('   NODE_ENV=production npm start');
      console.log('\n🚀 Listo para desplegar en Render.com');
    } else {
      throw new Error('Build incompleto - faltan archivos');
    }

  } catch (error) {
    console.error('\n❌ Error en el build:', error.message);
    process.exit(1);
  }
}

testBuild();