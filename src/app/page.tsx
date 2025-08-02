"use client"

import Image from "next/image";
import { FileUploadForm } from "@/components/file-upload-form";
import { useState } from "react";

type UploadData = {
  filename: string
  size: number
  rows: number
  columns: number
  separator: string
  preview: string[]
}

export default function Home() {
  const [uploadMessage, setUploadMessage] = useState<string>("")
  const [uploadData, setUploadData] = useState<UploadData | null>(null)

  const handleUploadSuccess = (result: { success: boolean; message?: string; data?: UploadData }) => {
    setUploadMessage(result.message || "File uploaded successfully!")
    setUploadData(result.data || null)
    console.log("Upload successful:", result)
  }

  const handleUploadError = (error: string) => {
    setUploadMessage(`Error: ${error}`)
    setUploadData(null)
    console.error("Upload error:", error)
  }

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        
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
                <p><strong>Rows:</strong> {uploadData.rows}</p>
                <p><strong>Columns:</strong> {uploadData.columns}</p>
                <p><strong>Separator:</strong> {uploadData.separator}</p>
              </div>
              {uploadData.preview && uploadData.preview.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium text-blue-900 mb-1">Preview:</h4>
                  <div className="bg-white p-2 rounded border text-xs overflow-x-auto">
                    {uploadData.preview.map((line, index) => (
                      <div key={index} className="font-mono">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            Upload a CSV file using the form above
          </li>
          <li className="tracking-[-.01em]">
            Supports CSV files up to 5MB with comma or semicolon separators
          </li>
        </ol>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
