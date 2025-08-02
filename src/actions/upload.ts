"use server"

import { translateKeywordsToEnglish, validateConsoleType, validateSyscheckData } from "@/lib/helpers/syscheck-validation"
import { z } from "zod"

const MAX_FILE_SIZE = 5000000 // 5MB
const ACCEPTED_FILE_TYPES = ["text/csv", "application/vnd.ms-excel"]

// Schema for validating the uploaded file
const uploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, "File size should be less than 5MB")
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type) || file.name.endsWith('.csv'),
      "Only CSV files are allowed"
    ),
})

export async function uploadCsvFile(formData: FormData) {
  try {
    const file = formData.get("file") as File
    
    if (!file) {
      return {
        success: false,
        error: "No file provided"
      }
    }

    // Validate the file
    const validation = uploadSchema.safeParse({ file })
    
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0].message
      }
    }

    // Read the CSV content
    const csvContent = await file.text()
    
    // Basic CSV validation - check if it has content and at least one comma or semicolon
    if (!csvContent.trim()) {
      return {
        success: false,
        error: "The CSV file appears to be empty"
      }
    }

    // copy csv to copydata
    let copyData = csvContent;

    copyData = translateKeywordsToEnglish(copyData);

    if (!validateSyscheckData(copyData)) {
      return {
        success: false,
        error: "The CSV file is not a valid SysCheck report"
      }
    }

    if(!validateConsoleType(copyData)) {
      return {
        success: false,
        error: "The CSV file does not contain a valid console type"
      }
    }

    // Here you can add more specific CSV validation logic based on your requirements
    // For example, checking specific column names, data types, etc.

    console.log("CSV file processed successfully:", {
      filename: file.name,
      size: file.size,
    })

    // You can process the CSV data here
    // For example: parse it, validate business rules, save to database, etc.

    return {
      success: true,
      message: `CSV file "${file.name}" uploaded successfully`,
      data: {
        filename: file.name,
        size: file.size,
      }
    }

  } catch (error) {
    
    console.error("Error processing CSV file:", error)
    return {
      success: false,
      error: "An error occurred while processing the file"
    }
  }
}
