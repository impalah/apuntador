// Tipos para integraciones de almacenamiento en la nube

export interface CloudFile {
  id: string
  name: string
  path: string
  size: number
  modified: Date
  isFolder: boolean
  downloadUrl?: string
}

export interface CloudProvider {
  id: string
  name: string
  isConnected: boolean
  userInfo?: {
    name: string
    email: string
  }
}

export interface CloudService {
  connect(): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
  listFiles(path?: string): Promise<CloudFile[]>
  downloadFile(fileId: string): Promise<string>
  uploadFile(path: string, content: string): Promise<CloudFile>
  deleteFile(fileId: string): Promise<void>
  getUserInfo(): Promise<{ name: string; email: string }>
}

export interface OAuthConfig {
  clientId: string
  redirectUri: string
  scope: string
}

export interface OAuthResult {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}

export interface OAuthError extends Error {
  code: string
  description?: string
}