#!/usr/bin/env node

/**
 * Script para verificar que las variables de entorno necesarias están configuradas
 * antes de hacer un build de producción
 */

import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// Leer .env si existe
const envPath = join(projectRoot, '.env')
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        process.env[key] = value
      }
    }
  })
}

const requiredVars = [
  'VITE_GOOGLE_DRIVE_CLIENT_ID',
  'VITE_GOOGLE_DRIVE_CLIENT_SECRET',
  'VITE_DROPBOX_CLIENT_ID'
]

const optionalVars = [
  'VITE_GOOGLE_DRIVE_CLIENT_ID_ANDROID',
  'VITE_OAUTH_REDIRECT_URI_DEV',
  'VITE_OAUTH_REDIRECT_URI_PROD',
  'VITE_OAUTH_REDIRECT_URI_NATIVE'
]

console.log('🔍 Verificando variables de entorno...\n')

let hasErrors = false
let hasWarnings = false

// Verificar variables requeridas
console.log('📋 Variables requeridas:')
requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (!value) {
    console.log(`   ❌ ${varName}: NO CONFIGURADA`)
    hasErrors = true
  } else {
    // Mostrar solo primeros/últimos caracteres por seguridad
    const masked = value.length > 20 
      ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
      : value.substring(0, 10) + '...'
    console.log(`   ✅ ${varName}: ${masked}`)
  }
})

// Verificar variables opcionales
console.log('\n📋 Variables opcionales:')
optionalVars.forEach(varName => {
  const value = process.env[varName]
  if (!value) {
    console.log(`   ⚠️  ${varName}: No configurada (se usará cliente web para todas las plataformas)`)
    hasWarnings = true
  } else {
    const masked = value.length > 20 
      ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
      : value.substring(0, 10) + '...'
    console.log(`   ✅ ${varName}: ${masked}`)
  }
})

console.log('\n' + '='.repeat(60))

if (hasErrors) {
  console.log('\n❌ ERROR: Faltan variables requeridas')
  console.log('\n📖 Para configurarlas:')
  console.log('   1. Copia .env.example a .env')
  console.log('   2. Edita .env con tus credenciales reales')
  console.log('   3. O configúralas en tu plataforma de hosting\n')
  console.log('📚 Más información: docs/ENVIRONMENT_VARIABLES.md\n')
  process.exit(1)
}

if (hasWarnings) {
  console.log('\n⚠️  ADVERTENCIA: Algunas variables opcionales no están configuradas')
  console.log('   La aplicación funcionará pero con funcionalidad limitada.\n')
}

if (!hasErrors && !hasWarnings) {
  console.log('\n✅ Todas las variables están configuradas correctamente\n')
}

process.exit(0)
