"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Upload, X, FileIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { uploadSyscheckFile } from "@/actions/upload-syscheck-file"
import { UploadSyscheckResult } from "@/types/upload-syscheck-type"

const MAX_FILE_SIZE = 5000000 // 5MB
const ACCEPTED_FILE_TYPES = ["text/csv", "application/vnd.ms-excel"]

const formSchema = z.object({
  file: z
    .any()
    .refine((file): file is File => file instanceof File, "Please select a file")
    .refine((file: File) => file.size <= MAX_FILE_SIZE, "File size should be less than 5MB")
    .refine(
      (file: File) => ACCEPTED_FILE_TYPES.includes(file.type) || file.name.endsWith('.csv'),
      "Only CSV files are allowed"
    ),
})

type FormValues = z.infer<typeof formSchema>

interface FileUploadFormProps {
  onSubmit?: (data: FormValues) => void
  onUploadSuccess?: (result: UploadSyscheckResult) => void
  onUploadError?: (error: string) => void
  className?: string
}

export function SyscheckFileUploadForm({ onSubmit, onUploadSuccess, onUploadError, className }: FileUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  })

  const handleFormSubmit = async (data: FormValues) => {
    if (onSubmit) {
      onSubmit(data)
      return
    }

    // Default behavior: use server action
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append("file", data.file)
      
      const result = await uploadSyscheckFile(formData)
      
      if (result.success) {
        onUploadSuccess?.(result)
        // Reset form after successful upload
        setSelectedFile(null)
        form.reset()
        const fileInput = document.getElementById("file-input") as HTMLInputElement
        if (fileInput) {
          fileInput.value = ""
        }
      } else {
        onUploadError?.(result.error || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      onUploadError?.("An unexpected error occurred")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    form.setValue("file", file)
    form.clearErrors("file")
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    form.setValue("file", null)
    // Reset the file input
    const fileInput = document.getElementById("file-input") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="file"
            render={() => (
              <FormItem>
                <FormLabel>Upload File</FormLabel>
                <FormControl>
                  <div
                    className={cn(
                      "relative border-2 border-dashed rounded-lg p-6 transition-colors",
                      dragActive
                        ? "border-primary bg-primary/5"
                        : "border-gray-300 hover:border-gray-400",
                      selectedFile && "border-green-500 bg-green-50"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Input
                      id="file-input"
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileInputChange}
                      accept=".csv,text/csv,application/vnd.ms-excel"
                    />
                    
                    {selectedFile ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileIcon className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeFile}
                          className="text-red-500 hover:text-red-700 z-20 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-primary">Click to upload</span> or
                            drag and drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            CSV files up to 5MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Choose a CSV file to upload. Supported format: CSV (max 5MB)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            variant="outline"
            type="submit"
            className="w-full"
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload CSV File"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
