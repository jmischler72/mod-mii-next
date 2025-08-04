"use server"

import { checkD2XCios, checkExtraProtection, checkForMissingIOS, checkIfBootMiiInstalled, checkIfHBCIsOutdated, checkIfPriiloaderInstalled, translateKeywordsToEnglish, validateConsoleType, validateSyscheckData } from "@/helpers/syscheck-validation-helper"
import { z } from "zod"
import { UploadSyscheckResult } from "@/types/upload-syscheck-type"
import { getConsoleRegion, getConsoleType, getFirmware, getHBCVersion, getLatestSMVersion, getSystemMenuVersion } from "@/helpers/syscheck-info-helper"
import { CustomError } from "@/types/custom-error"
import { downloadMultipleWads } from "@/helpers/download-manager"

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

export async function uploadSyscheckFile(formData: FormData): Promise<UploadSyscheckResult> {

  const activeIOS = true; // Placeholder for active IOS check, if needed
  const extraProtection = false; // When enabled, a patched IOS60 will be installed to other system menu IOS slots to prevent bricks from users manually up\downgrading Wii's
  const cMios = false; // A cMIOS allows older non-chipped Wii's to play GameCube backup discs


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

    if (!validateSyscheckData(copyData)) {
      throw new CustomError("The CSV file is not a valid SysCheck report")
    }

    const systemInfos = handleSyscheckData(copyData, { activeIOS, extraProtection, cMios });

    console.log("Console Region:", systemInfos.region);
    console.log("Console Type:", systemInfos.consoleType);
    console.log("HBC Version:", systemInfos.hbcVersion);
    console.log("System Menu Version:", systemInfos.systemMenuVersion);
    console.log("region:", systemInfos.firmware?.SMregion, "firm:", systemInfos.firmware?.firmware, "version:", systemInfos.firmware?.firmwareVersion);
    console.log("WADs to Install:", systemInfos.wadToInstall);

    // Download all required WAD files
    const downloadSummary = await downloadMultipleWads(systemInfos.wadToInstall, {
      maxConcurrent: 2, // Download 2 files at a time to avoid overwhelming the server
      onProgress: (completed, total, current) => {
        console.log(`Download progress: ${completed}/${total} - Currently downloading: ${current}`);
      }
    });

    console.log("Download Summary:", downloadSummary);



    return {
      success: true,
      message: `CSV file "${file.name}" uploaded successfully`,
      data: {
        filename: file.name,
        size: file.size,
        region: systemInfos.region || "Unknown",
        hbcVersion: systemInfos.hbcVersion || "Unknown",
        systemMenuVersion: systemInfos.systemMenuVersion || "Unknown",
        wadToInstall: systemInfos.wadToInstall || [],
        downloadSummary: {
          downloaded: downloadSummary.downloaded,
          cached: downloadSummary.cached,
          failed: downloadSummary.failed,
          failedFiles: downloadSummary.results.filter(r => !r.success).map(r => r.wadname),
          s3Files: downloadSummary.results.filter(r => r.success && r.s3Key).map(r => ({
            wadname: r.wadname,
            s3Key: r.s3Key,
            s3Url: r.s3Url
          }))
        },
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

function handleSyscheckData(data: string, options: { activeIOS?: boolean, extraProtection?: boolean, cMios?: boolean }) {
    const region = getConsoleRegion(data);
    const hbcVersion = getHBCVersion(data);
    const systemMenuVersion = getSystemMenuVersion(data);
    const firmware = systemMenuVersion && getFirmware(systemMenuVersion);
    const consoleType = getConsoleType(data);

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

    const isBootMiiInstalled = checkIfBootMiiInstalled(data);
    if (!isBootMiiInstalled) {
      wadToInstall.push("HM");
    }else{
      if(!hbcVersion){
        wadToInstall.push("OHBC113");
        //also check if IOS58 is installed
        const isIOS58Installed = data.includes("IOS58");
        if(!isIOS58Installed && isBootMiiInstalled) wadToInstall.push("IOS58");
      }else{
        const isHbcOutdated = checkIfHBCIsOutdated(hbcVersion, consoleType);
        if(isHbcOutdated) wadToInstall.push("OHBC");
      }
    }    

    const latestFirmwareVersion = getLatestSMVersion(firmware);
    if(latestFirmwareVersion !== firmware.firmware) wadToInstall.push(`SM${latestFirmwareVersion}${firmware.SMregion}`);

    const updatePriiloader = false;
    const isPriiloaderInstalled = checkIfPriiloaderInstalled(data);
    if (!isPriiloaderInstalled || (isPriiloaderInstalled && updatePriiloader)) wadToInstall.push("pri");


    const outdatedD2XCios = checkD2XCios(data, consoleType);
    wadToInstall.push(...outdatedD2XCios);

    if(options.activeIOS){
      const missingIOS = checkForMissingIOS(data, region, consoleType);
      wadToInstall.push(...missingIOS);
    }

    if(options.extraProtection) {
      const missingExtraProtection = checkExtraProtection(data);
      wadToInstall.push(...missingExtraProtection);
    }

    if(wadToInstall.length > 0) {
      wadToInstall.push("yawm");
    }

    return {
      region,
      hbcVersion,
      systemMenuVersion,
      firmware: {
        SMregion: firmware.SMregion,
        firmware: firmware.firmware,
        firmwareVersion: firmware.firmwareVersion,
      },
      consoleType,
      wadToInstall
    }
}