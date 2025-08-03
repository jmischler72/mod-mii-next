"use server"

import { checkD2XCios, checkForMissingIOS, checkIfBootMiiInstalled, checkIfHBCIsOutdated, checkIfPriiloaderInstalled, translateKeywordsToEnglish, validateConsoleType, validateSyscheckData } from "@/helpers/syscheck-validation-helper"
import { z } from "zod"
import { UploadResult } from "@/types/upload-type"
import { getConsoleRegion, getConsoleType, getFirmware, getHBCVersion, getLatestSMVersion, getSystemMenuVersion } from "@/helpers/syscheck-info-helper"
import { CustomError } from "@/types/custom-error"
import { nusDownload } from "@/helpers/wiipy-wrapper"
import { getEntry } from "@/helpers/database-helper"

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

  const activeIOS = true; // Placeholder for active IOS check, if needed
  const extraProtection = false; // When enabled, a patched IOS60 will be installed to other system menu IOS slots to prevent bricks from users manually up\downgrading Wii's
  const cMios = false; // A cMIOS allows older non-chipped Wii's to play GameCube backup discs
  const active = activeIOS || extraProtection || cMios;


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

    // const downloadedFiles: string[] = [];
    
    // const entry = getEntry("SM4.1U");
    // console.log("Entry from database:", entry);
    
    // if(!entry) {
    //   throw new CustomError("No entry found in the database for SM4.1U")
    // }

    // try {
    //   const result = await nusDownload(
    //     entry.code1,
    //     entry.code2,
    //     entry.version,
    //     entry.wadname,
    //   );
    //   console.log("NUS Download Result:", result);
    //   downloadedFiles.push(entry.wadname);
    // } catch (error) {
    //   console.error("NUS Download Error:", error);
    //   throw new CustomError(`Failed to download ${entry.wadname}: ${error}`);
    // }



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
        // downloadedFiles: downloadedFiles,
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