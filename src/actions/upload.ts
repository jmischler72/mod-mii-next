"use server"

import { checkD2XCios, checkIfHBCIsOutdated, checkIfPriiloaderInstalled, checkPatchedVIOS80, translateKeywordsToEnglish, validateConsoleType, validateSyscheckData } from "@/lib/helpers/syscheck-validation"
import { z } from "zod"
import { UploadResult } from "@/types/upload"
import { getConsoleRegion, getConsoleType, getFirmware, getHBCVersion, getLatestSMVersion, getSystemMenuVersion } from "@/lib/helpers/syscheck-info"
import { CustomError } from "@/types/custom-error"

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
      throw new CustomError("No file provided")
    }

    // Validate the file
    const validation = uploadSchema.safeParse({ file })
    
    if (!validation.success) {
      throw new CustomError(validation.error.issues[0].message)
    }

    // Read the CSV content
    const csvContent = await file.text()
    
    // Basic CSV validation - check if it has content and at least one comma or semicolon
    if (!csvContent.trim()) {
      throw new CustomError("The CSV file appears to be empty")
    }

    // copy csv to copydata
    let copyData = csvContent;

    copyData = translateKeywordsToEnglish(copyData);
    
    if (!validateSyscheckData(csvContent)) {
      throw new CustomError("The CSV file is not a valid SysCheck report")
    }

    const region = getConsoleRegion(copyData);
    const hbcVersion = getHBCVersion(copyData);
    const systemMenuVersion = getSystemMenuVersion(copyData);
    const firmware = systemMenuVersion && getFirmware(systemMenuVersion);
    const consoleType = getConsoleType(copyData);


    if (!region  || !systemMenuVersion || !firmware || !consoleType) {
      throw new CustomError("Could not extract necessary information from the CSV file")
    }

    if(!validateConsoleType(consoleType)) {
      throw new CustomError("The CSV file does not contain a valid console type")
    }

    if( firmware.SMregion !== region ) {
      throw new CustomError(`The firmware region "${firmware.SMregion}" does not match the console region "${region}"`)
    }

    const wadToInstall = [];

    if(!hbcVersion){
      wadToInstall.push("OHBC113");
      //also check if IOS58 is installed
      const isIOS58Installed = copyData.includes("IOS58");
      if(!isIOS58Installed) wadToInstall.push("IOS58");
    }else{
      const isHbcOutdated = checkIfHBCIsOutdated(hbcVersion, consoleType);
      if(isHbcOutdated) wadToInstall.push("OHBC");
    }

    const latestFirmwareVersion = getLatestSMVersion(firmware);
    if(latestFirmwareVersion !== firmware.firmware) wadToInstall.push(`SM${latestFirmwareVersion}${firmware.SMregion}`);

    const updatePriiloader = false;
    const isPriiloaderInstalled = checkIfPriiloaderInstalled(copyData);

    if (!isPriiloaderInstalled || (isPriiloaderInstalled && updatePriiloader)) wadToInstall.push("pri");


    const isD2XCiosInstalled = checkD2XCios(copyData, consoleType);
    console.log("Is D2X cIOS installed:", isD2XCiosInstalled);




    // for vwii ==>

    // const wadToInstall = [];


    // const isPatchedVIOS80 = checkPatchedVIOS80(copyData);
    // if(isPatchedVIOS80) wadToInstall.push("vIOS80P");






    console.log("Console Region:", region);
    console.log("HBC Version:", hbcVersion);
    console.log("System Menu Version:", systemMenuVersion);
    console.log("region:", firmware?.SMregion, "firm:", firmware?.firmware, "version:", firmware?.firmwareVersion);
    console.log("Latest System Menu Version:", latestFirmwareVersion);
    console.log("Is Priiloader Installed:", isPriiloaderInstalled);
    // console.log("Is Patched vIOS80:", isPatchedVIOS80);
    console.log("WADs to Install:", wadToInstall);

    return {
      success: true,
      message: `CSV file "${file.name}" uploaded successfully`,
      data: {
        filename: file.name,
        size: file.size,
        region: region || "Unknown",
        hbcVersion: hbcVersion || "Unknown",
        systemMenuVersion: systemMenuVersion || "Unknown",
        preview: copyData.split('\n').slice(0, 5), // Preview first
      }
    }

  } catch (error) {
    console.error("Error processing CSV file:", error)
    return {
      success: false,
      error: error instanceof CustomError ? error.message : "An error occurred while getting the latest system menu version"
    }
  }
}
