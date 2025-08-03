"use client"

import { FileUploadForm } from "@/components/file-upload-form";
import { useState } from "react";
import { UploadData, UploadResult } from "@/types/upload";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function Home() {
  const [uploadMessage, setUploadMessage] = useState<string>("")
  const [uploadData, setUploadData] = useState<UploadData | null>(null)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)

  const handleUploadSuccess = (result: UploadResult) => {
    setUploadMessage(result.message || "File uploaded successfully!")
    setUploadData(result.data || null)
    console.log("Upload successful:", result)
  }

  const handleUploadError = (error: string) => {
    setUploadMessage(`Error: ${error}`)
    setUploadData(null)
    console.error("Upload error:", error)
  }

  const handleDownload = async (filename: string) => {
    setIsDownloading(filename)
    try {
      const response = await fetch(`/api/download?filename=${encodeURIComponent(filename)}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Download failed')
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      setUploadMessage(`Error downloading ${filename}: ${error}`)
    } finally {
      setIsDownloading(null)
    }
  }

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
    
        
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl font-bold text-center mb-8">CSV File Upload</h1>
          <FileUploadForm 
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            className="mx-auto" 
          />
          
          {uploadMessage && (
            <div className={`mt-4 p-4 rounded-lg ${uploadMessage.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              <p className="font-medium">{uploadMessage}</p>
            </div>
          )}
          
          {uploadData && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">File Information</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Filename:</strong> {uploadData.filename}</p>
                <p><strong>Size:</strong> {(uploadData.size / 1024).toFixed(2)} KB</p>
                <p><strong>Region:</strong> {uploadData.region}</p>
                <p><strong>HBC Version:</strong> {uploadData.hbcVersion}</p>
                <p><strong>System Menu Version:</strong> {uploadData.systemMenuVersion}</p>
              </div>
              {uploadData.preview && uploadData.preview.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium text-blue-900 mb-1">Preview:</h4>
                  <div className="bg-white p-2 rounded border text-xs overflow-x-auto text-gray-700">
                    {uploadData.preview.map((line, index) => (
                      <div key={index} className="font-mono">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {uploadData.wadToInstall && uploadData.wadToInstall.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium text-blue-900 mb-1">WADs to Install:</h4>
                  <div className="bg-white p-2 rounded border text-xs text-gray-700">
                    {uploadData.wadToInstall.join(', ')}
                  </div>
                </div>
              )}
              {uploadData.downloadedFiles && uploadData.downloadedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-blue-900 mb-2">Downloaded Files:</h4>
                  <div className="space-y-2">
                    {uploadData.downloadedFiles.map((filename, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                        <span className="text-sm text-gray-700 font-mono">{filename}</span>
                        <Button
                          onClick={() => handleDownload(filename)}
                          disabled={isDownloading === filename}
                          size="sm"
                          className="ml-2"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {isDownloading === filename ? 'Downloading...' : 'Download'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
