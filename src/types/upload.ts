export interface UploadData {
  filename: string
  size: number
  region: string
  hbcVersion: string
  systemMenuVersion: string
  preview?: string[],
  wadToInstall?: string[]
  downloadedFiles?: string[]
}

export interface UploadResult {
  success: boolean
  message?: string
  error?: string
  data?: UploadData
}

