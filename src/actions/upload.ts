"use server"

import { getConsoleRegion, getHBCVersion, translateKeywordsToEnglish, validateConsoleType, validateSyscheckData } from "@/lib/helpers/syscheck-validation"
import { z } from "zod"
import { UploadResult, SyscheckValidationResult } from "@/types/upload"

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

export async function uploadCsvFile(formData: FormData): Promise<UploadResult> {
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

    const syscheckValidationResult = validateUploadedSyscheck(copyData);
    if (!syscheckValidationResult.success) {
      return {
      success: false,
      error: syscheckValidationResult.error
      }
    }

    const region = getConsoleRegion(copyData);
    const hbcVersion = getHBCVersion(copyData);

    console.log("Console Region:", region);
    console.log("HBC Version:", hbcVersion);

    return {
      success: true,
      message: `CSV file "${file.name}" uploaded successfully`,
      data: {
        filename: file.name,
        size: file.size,
        region: region || "Unknown",
        hbcVersion: hbcVersion || "Unknown",
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

function validateUploadedSyscheck(csvContent: string): SyscheckValidationResult {
  // Validate the SysCheck data
  if (!validateSyscheckData(csvContent)) {
    return {
      success: false,
      error: "The CSV file is not a valid SysCheck report"
    }
  }

  // Validate console type
  if (!validateConsoleType(csvContent)) {
    return {
      success: false,
      error: `The CSV file does not contain a valid console type`
    }
  }

  

  // If all validations pass
  return { success: true };
}
