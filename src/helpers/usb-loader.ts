export enum USBLoader {
	ConfigurableUSBLoader = 'ConfigurableUSBLoader',
	USBLoaderGX = 'USBLoaderGX',
	WiiFlow = 'WiiFlow',
}

export async function getLoaderWads(loader: USBLoader): Promise<string[]> {
	const wad_to_install = ['Nintendont', 'CleanRip'];

	switch (loader) {
		case USBLoader.ConfigurableUSBLoader:
			wad_to_install.push('usbfolder');
			break;
		case USBLoader.WiiFlow:
			wad_to_install.push('FLOW');
			break;
		case USBLoader.USBLoaderGX:
			wad_to_install.push('usbgx');
			break;
	}

	return wad_to_install;
}

export const loaderDescriptions = {
	[USBLoader.ConfigurableUSBLoader]: {
		name: 'Configurable USB Loader',
		description: 'A highly configurable USB loader with many customization options.',
		features: ['Highly customizable', 'Cover flow interface', 'Game artwork support', 'Plugin system'],
		wadId: 'usbfolder',
	},
	[USBLoader.USBLoaderGX]: {
		name: 'USB Loader GX',
		description: 'Popular and user-friendly USB loader with excellent compatibility.',
		features: ['Great game compatibility', 'User-friendly interface', 'Parental controls', 'Online updates'],
		wadId: 'usbgx',
	},
	[USBLoader.WiiFlow]: {
		name: 'WiiFlow',
		description: 'Modern USB loader with a sleek interface and advanced features.',
		features: ['Beautiful interface', 'Plugin support', 'GameCube support', 'Real NAND emulation'],
		wadId: 'FLOW',
	},
};
