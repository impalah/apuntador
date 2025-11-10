import { registerPlugin } from '@capacitor/core'

/**
 * Opciones para peticiones HTTP con mTLS y Certificate Pinning
 */
export interface MTLSHttpRequestOptions {
  /**
   * URL completa del endpoint
   */
  url: string

  /**
   * Método HTTP (GET, POST, PUT, DELETE, etc.)
   * @default "GET"
   */
  method?: string

  /**
   * Headers de la petición
   */
  headers?: { [key: string]: string }

  /**
   * Cuerpo de la petición (como string JSON)
   */
  body?: string

  /**
   * Si debe usar certificado de cliente (mTLS)
   * - true: Usa certificado de cliente para autenticación (después de enrollment)
   * - false: Solo certificate pinning, sin certificado de cliente (para enrollment)
   * @default false
   */
  useMTLS?: boolean
}

/**
 * Respuesta de petición HTTP
 */
export interface MTLSHttpResponse {
  /**
   * Código de estado HTTP
   */
  status: number

  /**
   * Headers de respuesta
   */
  headers: { [key: string]: string }

  /**
   * Cuerpo de respuesta (string)
   */
  data: string
}

/**
 * Plugin de Capacitor para peticiones HTTP con Certificate Pinning y mTLS
 *
 * Este plugin proporciona:
 * - Certificate Pinning: Valida el certificado del servidor contra pins SHA-256
 * - mTLS opcional: Envía certificado de cliente cuando está disponible
 * - Protección contra MITM incluso durante enrollment
 *
 * @example Enrollment sin mTLS (solo certificate pinning)
 * ```typescript
 * const response = await MTLSHttp.request({
 *   url: 'https://api.example.com/device/enroll',
 *   method: 'POST',
 *   body: JSON.stringify({ csr: '...' }),
 *   useMTLS: false  // Solo pinning, sin certificado de cliente
 * })
 * ```
 *
 * @example Petición autenticada con mTLS
 * ```typescript
 * const response = await MTLSHttp.request({
 *   url: 'https://api.example.com/protected',
 *   method: 'GET',
 *   useMTLS: true  // Usa certificado de cliente
 * })
 * ```
 */
export interface MTLSHttpPlugin {
  /**
   * Realiza una petición HTTP con certificate pinning y mTLS opcional
   *
   * @param options - Opciones de la petición
   * @returns Promesa con la respuesta HTTP
   */
  request(options: MTLSHttpRequestOptions): Promise<MTLSHttpResponse>
}

const MTLSHttp = registerPlugin<MTLSHttpPlugin>('MTLSHttp')

export { MTLSHttp }
