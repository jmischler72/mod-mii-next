export interface DownloadSummary {
	downloaded: number;
	cached: number;
	failed: number;
	failedFiles: string[];
	s3Files: Array<{
		wadname: string;
		s3Key?: string;
		s3Url?: string;
	}>;
}

export interface UploadSyscheckData {
	filename: string;
	size: number;
	region: string;
	hbcVersion: string;
	systemMenuVersion: string;
	wadsInfos: {
		wadname: string;
		wadId: string;
	}[];
}

export interface UploadSyscheckResult {
	success: boolean;
	message?: string;
	error?: string;
	data?: UploadSyscheckData;
}
