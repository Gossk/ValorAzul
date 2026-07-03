import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

import seedClientes from './seedClientes.json';
import seedHistorial from './seedHistorial.json';

export async function ensureSeedData(): Promise<void> {
  try {
    // --- Clientes de negocio ---
    const clientesSnap = await getDocs(collection(db, 'clientes_negocio'));
    if (clientesSnap.empty) {
      console.log('🌱 Colección clientes_negocio vacía — sembrando datos...');
      for (let i = 0; i < seedClientes.length; i++) {
        const cliente = seedClientes[i];
        const docId = `cliente_${String(i + 1).padStart(3, '0')}`;
        await setDoc(doc(db, 'clientes_negocio', docId), {
          ...cliente,
          creditosActivos: (cliente as any).creditosActivos ?? 0,
        });
      }
      console.log(`✅ ${seedClientes.length} clientes insertados.`);
    }

    // --- Historial ---
    const historialSnap = await getDocs(collection(db, 'historial'));
    if (historialSnap.empty) {
      console.log('🌱 Colección historial vacía — sembrando datos...');
      for (let i = 0; i < seedHistorial.length; i++) {
        const registro = seedHistorial[i];
        const docId = `hist_${String(i + 1).padStart(3, '0')}`;
        await setDoc(doc(db, 'historial', docId), registro);
      }
      console.log(`✅ ${seedHistorial.length} registros de historial insertados.`);
    }

    // --- Configuración global ---
    const configDoc = await getDoc(doc(db, 'configuracion', 'global'));
    if (!configDoc.exists()) {
      console.log('🌱 Configuración global no existe — creando...');
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
      console.log('✅ Configuración global creada.');
    }
  } catch (err) {
    console.error('Error en auto-seed:', err);
  }
}
