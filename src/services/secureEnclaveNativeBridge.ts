/**
 * Cliente TypeScript para el puente WKWebView nativo de Secure Enclave
 * 
 * Este NO usa Capacitor plugins, sino WKWebView message handlers directamente.
 * Es una solución alternativa cuando los plugins de Capacitor no funcionan.
 */

interface SecureEnclaveCall {
  callId: string
  resolve: (value: any) => void
  reject: (error: Error) => void
}

class SecureEnclaveNativeBridge {
  private readonly pendingCalls: Map<string, SecureEnclaveCall> = new Map()
  private nextCallId = 1
  private isReady = false

  constructor() {
    // Registrar callback global
    ;(window as any)._secureEnclaveCallback = this.handleCallback.bind(this)
    
    // Verificar si el bridge está disponible
    if ((window as any).webkit?.messageHandlers?.secureEnclave) {
      this.isReady = true
      console.log('✅ [Native Bridge] Secure Enclave WebKit bridge available')
    } else {
      console.warn('⚠️ [Native Bridge] WebKit message handlers not found')
    }
  }

  private handleCallback(response: any) {
    const { callId, success, result, error } = response
    const call = this.pendingCalls.get(callId)
    
    if (!call) {
      console.warn(`⚠️ [Native Bridge] Received response for unknown callId: ${callId}`)
      return
    }

    this.pendingCalls.delete(callId)

    if (success) {
      call.resolve(result)
    } else {
      call.reject(new Error(error || 'Unknown error'))
    }
  }

  private sendMessage(action: string, options?: any): Promise<any> {
    if (!this.isReady) {
      return Promise.reject(new Error('Native bridge not available'))
    }

    const callId = `call_${this.nextCallId++}`

    return new Promise((resolve, reject) => {
      this.pendingCalls.set(callId, { callId, resolve, reject })

      const message: any = { action, callId }
      if (options) {
        message.options = options
      }

      try {
        ;(window as any).webkit.messageHandlers.secureEnclave.postMessage(message)
      } catch (err) {
        this.pendingCalls.delete(callId)
        reject(err)
      }
    })
  }

  // API Methods

  async isSecureEnclaveAvailable(): Promise<{
    available: boolean
    deviceModel: string
    osVersion: string
  }> {
    return this.sendMessage('isSecureEnclaveAvailable')
  }

  async generateKeyPair(): Promise<{
    success: boolean
    publicKey: string
    keySize: number
    algorithm: string
    secureEnclave: boolean
  }> {
    return this.sendMessage('generateKeyPair')
  }

  async generateCSR(options: {
    commonName: string
    organization?: string
    country?: string
  }): Promise<{
    success: boolean
    csr: string
    csrSize: number
  }> {
    return this.sendMessage('generateCSR', options)
  }

  async storeCertificate(options: {
    certificate: string
  }): Promise<{
    success: boolean
    size: number
  }> {
    return this.sendMessage('storeCertificate', options)
  }

  async getCertificate(): Promise<{
    success: boolean
    certificate?: string
    size?: number
    message?: string
  }> {
    return this.sendMessage('getCertificate')
  }

  async deleteCertificate(): Promise<{
    success: boolean
  }> {
    return this.sendMessage('deleteCertificate')
  }
}

// Singleton instance
let nativeBridge: SecureEnclaveNativeBridge | null = null

export function getSecureEnclaveNativeBridge(): SecureEnclaveNativeBridge {
  nativeBridge ??= new SecureEnclaveNativeBridge()
  return nativeBridge
}
