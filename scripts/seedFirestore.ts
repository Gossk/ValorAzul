import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const firebaseConfig = {
  apiKey: "AIzaSyDAgm-5yrkAq-3vvHM2tMdFCflMzSdRQvc",
  authDomain: "valor-azul.firebaseapp.com",
  projectId: "valor-azul",
  storageBucket: "valor-azul.firebasestorage.app",
  messagingSenderId: "646024367342",
  appId: "1:646024367342:web:1db03b87991623e98877ff",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log('🌱 Iniciando seed de Firestore...\n');

  // --- SEED CLIENTES ---
  const clientesJson = JSON.parse(
    readFileSync(resolve(__dirname, '../src/data/seedClientes.json'), 'utf-8')
  );
  console.log(`📋 Cargando ${clientesJson.length} clientes...`);

  for (let i = 0; i < clientesJson.length; i++) {
    const cliente = clientesJson[i];
    const docId = `cliente_${String(i + 1).padStart(3, '0')}`;
    await setDoc(doc(db, 'clientes_negocio', docId), {
      ...cliente,
      creditosActivos: cliente.creditosActivos ?? 0,
    });
  }
  console.log(`✅ ${clientesJson.length} clientes insertados en "clientes_negocio"\n`);

  // --- SEED HISTORIAL ---
  const historialJson = JSON.parse(
    readFileSync(resolve(__dirname, '../src/data/seedHistorial.json'), 'utf-8')
  );
  console.log(`📋 Cargando ${historialJson.length} registros de historial...`);

  for (let i = 0; i < historialJson.length; i++) {
    const registro = historialJson[i];
    const docId = `hist_${String(i + 1).padStart(3, '0')}`;
    await setDoc(doc(db, 'historial', docId), registro);
  }
  console.log(`✅ ${historialJson.length} registros insertados en "historial"\n`);

  // --- SEED CONFIGURACIÓN GLOBAL ---
  console.log('⚙️  Creando configuración global...');
  await setDoc(doc(db, 'configuracion', 'global'), {
    empresa: {
      nombre: 'Valor Azul S.A.C.',
      ruc: '20458963214',
      direccion: 'Av. Javier Prado 1234, San Isidro, Lima',
    },
    notificaciones: {
      'nuevos-clientes': true,
      'simulaciones': true,
      'creditos-aprobados': true,
      'reportes': false,
      'alertas-seguridad': true,
    },
  });
  console.log('✅ Configuración global creada en "configuracion/global"\n');

  // --- Verificación ---
  const clientesSnap = await getDocs(collection(db, 'clientes_negocio'));
  const historialSnap = await getDocs(collection(db, 'historial'));
  console.log('📊 Verificación:');
  console.log(`   clientes_negocio: ${clientesSnap.size} documentos`);
  console.log(`   historial: ${historialSnap.size} documentos`);
  console.log('\n🎉 ¡Seed completado!');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});