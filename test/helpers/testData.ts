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
Report generated on 2025/07/30.`
};

export class MockFile implements Partial<File> {
  name: string;
  size: number;
  type: string;
  content: string;
  lastModified: number = Date.now();
  webkitRelativePath: string = '';

  constructor(content: string, filename: string, options: { type?: string } = {}) {
    this.name = filename;
    this.content = content;
    this.size = content.length;
    this.type = options.type || 'text/csv';
  }

  async text() {
    return this.content;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const buffer = new ArrayBuffer(this.content.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < this.content.length; i++) {
      view[i] = this.content.charCodeAt(i);
    }
    return buffer;
  }

  async bytes(): Promise<Uint8Array> {
    return new TextEncoder().encode(this.content);
  }

  stream(): ReadableStream {
    throw new Error('Not implemented');
  }

  slice(): Blob {
    throw new Error('Not implemented');
  }
}

export class MockFormData {
  private data = new Map<string, File | string>();

  append(key: string, value: File | string) {
    this.data.set(key, value);
  }

  get(key: string) {
    return this.data.get(key);
  }

  delete(key: string) {
    this.data.delete(key);
  }

  has(key: string) {
    return this.data.has(key);
  }

  set(key: string, value: File | string) {
    this.data.set(key, value);
  }

  getAll(key: string) {
    const value = this.data.get(key);
    return value ? [value] : [];
  }

  keys() {
    return this.data.keys();
  }

  values() {
    return this.data.values();
  }

  entries() {
    return this.data.entries();
  }

  forEach(callback: (value: File | string, key: string) => void) {
    this.data.forEach(callback);
  }
}
