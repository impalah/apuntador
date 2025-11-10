import { registerPlugin } from '@capacitor/core'

export interface MTLSClientPlugin {
  /**
   * Verifica si el cliente mTLS está listo (tiene certificado válido).
   */
  isReady(): Promise<{
    isReady: boolean
    certificateInfo?: {
      subject: string
      issuer: string
      serial: string
      notBefore: string
      notAfter: string
    }
  }>

  /**
   * Realiza un request HTTP GET con mTLS.
   * 
   * @param options - Opciones del request
   * @returns Response del servidor
   */
  get(options: { url: string }): Promise<{ data: string; statusCode: number }>

  /**
   * Realiza un request HTTP POST con mTLS.
   * 
   * @param options - Opciones del request
   * @returns Response del servidor
   */
  post(options: { url: string; body?: string | object }): Promise<{ data: string; statusCode: number }>

  /**
   * Realiza un request HTTP PUT con mTLS.
   * 
   * @param options - Opciones del request
   * @returns Response del servidor
   */
  put(options: { url: string; body?: string | object }): Promise<{ data: string; statusCode: number }>

  /**
   * Realiza un request HTTP DELETE con mTLS.
   * 
   * @param options - Opciones del request
   * @returns Response del servidor
   */
  delete(options: { url: string }): Promise<{ data: string; statusCode: number }>

  /**
   * Inicia el servicio de renovación automática de certificados.
   * 
   * @param options - Opciones del servicio
   * @returns Resultado de la operación
   */
  startRenewalService(options: { backendUrl: string }): Promise<{ success: boolean }>

  /**
   * Detiene el servicio de renovación automática de certificados.
   * 
   * @returns Resultado de la operación
   */
  stopRenewalService(): Promise<{ success: boolean }>

  /**
   * Resetea el cliente mTLS (útil después de renovar certificado).
   * 
   * @returns Resultado de la operación
   */
  reset(): Promise<{ success: boolean }>
}

const MTLSClient = registerPlugin<MTLSClientPlugin>('MTLSClient', {
  web: () => import('./web').then(m => new m.MTLSClientWeb()),
})

export default MTLSClient
