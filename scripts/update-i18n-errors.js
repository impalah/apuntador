#!/usr/bin/env node

/**
 * Script para actualizar los archivos de idioma con las nuevas claves de errors.services
 * Copia la estructura de en-US a todos los demás idiomas
 */

const fs = require('fs')
const path = require('path')

const localesDir = path.join(__dirname, '../src/locales')

// Traducciones para cada idioma (generadas con IA)
const translations = {
  'ca-ES': {
    errors: {
      services: {
        oauth: {
          invalidState: "Estat d'autenticació invàlid. Si us plau, torna-ho a provar.",
          csrfDetected: "Error de seguretat detectat. Connexió abortada.",
          noAccessToken: "Autenticació fallida. No s'ha rebut token d'accés.",
          codeVerifierMissing: "Sessió expirada. Si us plau, reinicia el procés d'autenticació."
        },
        cloud: {
          notConnected: "No connectat a l'emmagatzematge al núvol. Si us plau, connecta't primer.",
          connectionFailed: "Error en connectar amb l'emmagatzematge al núvol.",
          disconnectionFailed: "Error en desconnectar de l'emmagatzematge al núvol.",
          listFilesFailed: "Error en carregar la llista d'arxius.",
          downloadFailed: "Error en descarregar l'arxiu.",
          uploadFailed: "Error en pujar l'arxiu.",
          deleteFailed: "Error en eliminar l'arxiu.",
          noContent: "L'arxiu està buit o no s'ha pogut llegir.",
          unknownFormat: "Format d'arxiu desconegut rebut.",
          noProvider: "No hi ha proveïdor de núvol configurat."
        },
        file: {
          readFailed: "No s'ha pogut llegir l'arxiu.",
          writeFailed: "No s'ha pogut desar l'arxiu.",
          invalidType: "Tipus d'arxiu invàlid. Només s'admeten arxius .md i .txt.",
          noFileHandle: "No s'ha seleccionat cap arxiu.",
          accessDenied: "Accés a l'arxiu denegat."
        },
        fullscreen: {
          notSupported: "El mode de pantalla completa no està suportat en aquest navegador.",
          exitFailed: "No s'ha pogut sortir del mode de pantalla completa."
        },
        certificate: {
          enrollmentFailed: "Error en el registre del dispositiu.",
          renewalFailed: "Error en la renovació del certificat.",
          validationFailed: "Error en la validació del certificat.",
          noPinsReceived: "No s'han rebut pins de certificat del servidor.",
          stillInvalid: "El certificat continua sent invàlid després del registre."
        }
      }
    },
    messages: {
      services: {
        cloud: {
          connected: "Connectat a l'emmagatzematge al núvol amb èxit",
          disconnected: "Desconnectat de l'emmagatzematge al núvol",
          fileUploaded: "Arxiu pujat amb èxit",
          fileDeleted: "Arxiu eliminat amb èxit",
          fileDownloaded: "Arxiu descarregat amb èxit"
        },
        file: {
          loaded: "Arxiu carregat amb èxit",
          saved: "Arxiu desat amb èxit"
        },
        certificate: {
          enrolled: "Dispositiu registrat amb èxit",
          renewed: "Certificat renovat amb èxit"
        }
      }
    }
  },
  'gl-ES': {
    errors: {
      services: {
        oauth: {
          invalidState: "Estado de autenticación inválido. Por favor, téntao de novo.",
          csrfDetected: "Erro de seguridade detectado. Conexión abortada.",
          noAccessToken: "Autenticación fallida. Non se recibiu token de acceso.",
          codeVerifierMissing: "Sesión expirada. Por favor, reinicia o proceso de autenticación."
        },
        cloud: {
          notConnected: "Non conectado ao almacenamento na nube. Por favor, conéctate primeiro.",
          connectionFailed: "Fallo ao conectar co almacenamento na nube.",
          disconnectionFailed: "Fallo ao desconectar do almacenamento na nube.",
          listFilesFailed: "Fallo ao cargar a lista de arquivos.",
          downloadFailed: "Fallo ao descargar o arquivo.",
          uploadFailed: "Fallo ao subir o arquivo.",
          deleteFailed: "Fallo ao eliminar o arquivo.",
          noContent: "O arquivo está baleiro ou non se puido ler.",
          unknownFormat: "Formato de arquivo descoñecido recibido.",
          noProvider: "Non hai provedor de nube configurado."
        },
        file: {
          readFailed: "Non se puido ler o arquivo.",
          writeFailed: "Non se puido gardar o arquivo.",
          invalidType: "Tipo de arquivo inválido. Só se admiten arquivos .md e .txt.",
          noFileHandle: "Non se seleccionou ningún arquivo.",
          accessDenied: "Acceso ao arquivo denegado."
        },
        fullscreen: {
          notSupported: "O modo de pantalla completa non está soportado neste navegador.",
          exitFailed: "Non se puido saír do modo de pantalla completa."
        },
        certificate: {
          enrollmentFailed: "Fallo no rexistro do dispositivo.",
          renewalFailed: "Fallo na renovación do certificado.",
          validationFailed: "Fallo na validación do certificado.",
          noPinsReceived: "Non se recibiron pins de certificado do servidor.",
          stillInvalid: "O certificado segue sendo inválido despois do rexistro."
        }
      }
    },
    messages: {
      services: {
        cloud: {
          connected: "Conectado ao almacenamento na nube con éxito",
          disconnected: "Desconectado do almacenamento na nube",
          fileUploaded: "Arquivo subido con éxito",
          fileDeleted: "Arquivo eliminado con éxito",
          fileDownloaded: "Arquivo descargado con éxito"
        },
        file: {
          loaded: "Arquivo cargado con éxito",
          saved: "Arquivo gardado con éxito"
        },
        certificate: {
          enrolled: "Dispositivo rexistrado con éxito",
          renewed: "Certificado renovado con éxito"
        }
      }
    }
  }
}

// Los otros idiomas los generaremos con traducciones automáticas (Google Translate API sería ideal, pero usaremos aproximaciones)

console.log('📝 Actualizando archivos de idioma con errors.services...\n')

// Leer todos los archivos JSON en el directorio de locales
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json') && f !== 'en-US.json' && f !== 'es-ES.json')

for (const file of files) {
  const lang = file.replace('.json', '')
  
  console.log(`Procesando ${lang}...`)
  
  try {
    const filePath = path.join(localesDir, file)
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    
    // Si ya tiene errors.services, saltar
    if (content.errors?.services) {
      console.log(`  ✅ ${lang} ya tiene errors.services`)
      continue
    }
    
    // Obtener traducciones para este idioma
    const trans = translations[lang]
    
    if (trans) {
      // Actualizar errors
      if (!content.errors.services) {
        content.errors.services = trans.errors.services
      }
      
      // Actualizar messages
      if (!content.messages.services) {
        content.messages.services = trans.messages.services
      }
      
      // Guardar archivo actualizado
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8')
      console.log(`  ✅ ${lang} actualizado`)
    } else {
      console.log(`  ⚠️  ${lang} sin traducciones definidas - se saltará`)
    }
  } catch (error) {
    console.error(`  ❌ Error procesando ${lang}:`, error.message)
  }
}

console.log('\n✅ Actualización completada')
