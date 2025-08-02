export interface UploadData {
  filename: string
  size: number
  region: string
  hbcVersion: string
  preview?: string[]
}

export interface UploadResult {
  success: boolean
  message?: string
  error?: string
  data?: UploadData
}

export interface SyscheckValidationResult {
  success: boolean
  error?: string
}
