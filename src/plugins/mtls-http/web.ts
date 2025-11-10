import { WebPlugin } from '@capacitor/core'
import type { MTLSHttpPlugin, MTLSHttpRequestOptions, MTLSHttpResponse } from './index'

/**
 * Implementación web del plugin MTLSHttp
 *
 * En navegadores web, no podemos hacer certificate pinning a nivel de código,
 * pero usamos fetch() estándar con HTTPS/TLS del navegador.
 *
 * Nota: En web, la seguridad depende de las CAs del navegador.
 * Certificate pinning solo funciona en plataformas nativas (iOS/Android).
 */
export class MTLSHttpWeb extends WebPlugin implements MTLSHttpPlugin {
  async request(options: MTLSHttpRequestOptions): Promise<MTLSHttpResponse> {
    console.log('🌐 [MTLSHttp Web] Using fetch() - certificate pinning not available in browser')

    const { url, method = 'GET', headers = {}, body } = options

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? body : undefined,
      })

      const data = await response.text()

      // Convertir Headers a objeto simple
      const responseHeaders: { [key: string]: string } = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      return {
        status: response.status,
        headers: responseHeaders,
        data,
      }
    } catch (error) {
      throw new Error(`HTTP request failed: ${error}`)
    }
  }
}
