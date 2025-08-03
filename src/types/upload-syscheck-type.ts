export interface UploadSyscheckData {
  filename: string
  size: number
  region: string
  hbcVersion: string
  systemMenuVersion: string
  preview?: string[],
  wadToInstall?: string[]
  downloadedFiles?: string[]
}

export interface UploadSyscheckResult {
  success: boolean
  message?: string
  error?: string
  data?: UploadSyscheckData
}

