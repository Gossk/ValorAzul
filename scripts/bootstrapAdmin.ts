/**
 * bootstrapAdmin.ts
 * ─────────────────────────────────────────────────────────────────────
 *  Crea (o promueve) el PRIMER administrador de Valor Azul.
 *
 *  Ejecución (una sola vez, desde la raíz del proyecto):
 *
 *      # 1) Descarga el service account JSON desde:
 *      #    Firebase Console → ⚙ Project settings → Service accounts → Generate new private key
 *      #    y guárdalo como serviceAccountKey.json (está en .gitignore por seguridad).
 *
 *      # 2) Ejecuta:
 *      $ npx tsx scripts/bootstrapAdmin.ts <email> <password> "<Nombre Apellido>"
 *
 *  El script:
 *    - Crea el usuario en Firebase Auth si no existe (o lo reutiliza si ya existe).
 *    - Escribe `usuarios/{uid}` con `rol: 'Administrador'` y `activo: true`.
 *
 *  Requiere:  npm i -D firebase-admin
 *  (No forma parte de las dependencias de producción.)
 * ─────────────────────────────────────────────────────────────────────
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

async function main() {
  const [email, password, ...nombreParts] = process.argv.slice(2)
  const nombre = nombreParts.join(' ').trim()

  if (!email || !password || !nombre) {
    console.error('❌ Uso: npx tsx scripts/bootstrapAdmin.ts <email> <password> "<Nombre>"')
    process.exit(1)
  }

  const keyPath = resolve(process.cwd(), 'serviceAccountKey.json')
  if (!existsSync(keyPath)) {
    console.error(`❌ No se encontró ${keyPath}`)
    console.error('   Descárgalo desde Firebase Console → Service accounts → Generate new private key')
    process.exit(1)
  }

  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))

  // Importación dinámica para no forzar firebase-admin en producción
  let admin: any
  try {
    admin = await import('firebase-admin')
  } catch {
    console.error('❌ Falta la dependencia firebase-admin. Instálala con:')
    console.error('   npm i -D firebase-admin')
    process.exit(1)
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
  const auth = admin.auth(app)
  const db   = admin.firestore(app)

  console.log(`🔐 Bootstrapping admin: ${email} (${nombre})`)

  // 1) Buscar o crear usuario en Auth
  let userRecord: any
  try {
    userRecord = await auth.getUserByEmail(email)
    console.log(`   ↪ Usuario ya existe en Auth (${userRecord.uid}). Actualizando contraseña...`)
    await auth.updateUser(userRecord.uid, { password, displayName: nombre })
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found') {
      userRecord = await auth.createUser({ email, password, displayName: nombre })
      console.log(`   ✅ Usuario creado en Auth (${userRecord.uid})`)
    } else {
      throw err
    }
  }

  // 2) Escribir el documento en Firestore con rol Administrador
  const ref = db.collection('usuarios').doc(userRecord.uid)
  await ref.set({
    uid:            userRecord.uid,
    nombre,
    email,
    rol:            'Administrador',
    activo:         true,
    fechaRegistro:  new Date().toLocaleDateString('es-PE'),
    creadoEnServer: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })

  console.log('   ✅ usuarios/' + userRecord.uid + ' escrito con rol Administrador')
  console.log('\n🎉 Listo. Ahora puedes iniciar sesión con ' + email + ' y verás el panel de admin.\n')
}

main().catch((err) => {
  console.error('❌ Error en el bootstrap:', err)
  process.exit(1)
})
