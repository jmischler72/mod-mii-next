// Test data and utilities for upload tests

export const mockSyscheckData = {
	valid: `SysCheck ME v2.5.0 par blackb0x, JoostinOnline, Double_A, R2-D2199 et Nano
...tourne sous l'IOS58 (rev 6176).

Region: PAL
Menu Systeme 4.3E (v514)
Priiloader installe
Date de disque: 02.13.2007
Chaine Channel 1.1.2 utilise IOS58

Hollywood v0x11
Identifiant de la console: 104526876
Type de Console: Wii
Pays de la chaine boutique: France (77)
Boot2 v4
154 titres trouves.
50 IOS trouves sur cette console. 12 sont des stubs.

IOS4 (rev 65280): Stub
IOS9 (rev 1034): Trucha Bug
MIOS v10 (DIOS MIOS 2.0)
Rapport genere le 2025/07/30.`,

	ntscData: `SysCheck ME v2.5.0 by blackb0x, JoostinOnline, Double_A, R2-D2199 and Nano
...running under IOS58 (rev 6176).

Region: NTSC-U
System Menu 4.3U (v514)
Priiloader installed
Date Disc: 02.13.2007
Homebrew Channel 1.1.2 running on IOS58

Hollywood v0x11
Console ID: 104526876
Console Type: Wii
Shop Channel Country: USA (49)
Boot2 v4
154 titles found.
50 IOS found on this console. 12 are stubs.

IOS4 (rev 65280): Stub
IOS9 (rev 1034): Trucha Bug
MIOS v10 (cMIOS)
Report generated on 2025/07/30.`,

	japanData: `SysCheck ME v2.5.0 by blackb0x, JoostinOnline, Double_A, R2-D2199 and Nano
...running under IOS58 (rev 6176).

Region: NTSC-J
System Menu 4.3J (v514)
Priiloader installed
Date Disc: 02.13.2007
Homebrew Channel 1.1.2 running on IOS58

Hollywood v0x11
Console ID: 104526876
Console Type: Wii
Shop Channel Country: Japan (1)
Boot2 v4
154 titles found.
50 IOS found on this console. 12 are stubs.

IOS4 (rev 65280): Stub
IOS9 (rev 1034): Trucha Bug
MIOS v10 (cMIOS)
Report generated on 2025/07/30.`,

	invalid: `This is not a SysCheck report
Just some random text that looks like CSV
Header1,Header2,Header3
Value1,Value2,Value3
Another,Row,Here`,

	withoutRegion: `SysCheck ME v2.5.0 by blackb0x, JoostinOnline, Double_A, R2-D2199 and Nano
...running under IOS58 (rev 6176).

System Menu 4.3U (v514)
Priiloader installed
Date Disc: 02.13.2007
Homebrew Channel 1.1.2 running on IOS58

Hollywood v0x11
Console ID: 104526876
Console Type: Wii
Boot2 v4
Report generated on 2025/07/30.`,

	withoutConsoleType: `SysCheck ME v2.5.0 by blackb0x, JoostinOnline, Double_A, R2-D2199 and Nano
...running under IOS58 (rev 6176).

Region: PAL
System Menu 4.3E (v514)
Priiloader installed
Date Disc: 02.13.2007
Homebrew Channel 1.1.2 running on IOS58

Hollywood v0x11
Console ID: 104526876
Boot2 v4
Report generated on 2025/07/30.`,
};
