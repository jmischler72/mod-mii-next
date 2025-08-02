::----------------------------------------sysCheck Analyzer-------------------------------------
:sysCheckAnalyzer
cls
echo                                        ModMii                                v%currentversion%
echo                                       by XFlak
echo.
echo Analyzing SysCheck: "%sysCheckName%"
echo.
echo Please wait...
echo.

::save a copy and translate keywords to english prior to analysis
set sysCheckCopy=temp\syscheck_.csv
copy /y "%sysCheckName%" "%sysCheckCopy%">nul

support\sfk filter "%sysCheckCopy%" -rep _"Chaine Homebrew"_"Homebrew Channel"_ -rep _"Chaine Channel"_"Homebrew Channel"_ -rep _"Canale Homebrew"_"Homebrew Channel"_ -rep _"Canal Homebrew"_"Homebrew Channel"_ -rep _"Homebrewkanal"_"Homebrew Channel"_ -write -yes>nul

support\sfk filter "%sysCheckCopy%" -rep _"utilise"_"running on"_ -rep _"appoggiato all'"_"running on "_ -rep _"ejecutandose en"_"running on"_ -rep _"benutzt"_"running on"_ -write -yes>nul

support\sfk filter "%sysCheckCopy%" -rep _"Systemmenue"_"System Menu"_ -rep _"Menu Systeme"_"System Menu"_ -rep _"Menu di sistema"_"System Menu"_ -rep _"Menu de Sistema"_"System Menu"_ -write -yes>nul

support\sfk filter "%sysCheckCopy%" -rep _"Pas de patches"_"No Patches"_ -rep _"Non patchato"_"No Patches"_ -rep _"Sin Parches"_"No Patches"_ -rep _"Keine Patches"_"No Patches"_ -write -yes>nul

support\sfk filter "%sysCheckCopy%" -rep _"Bug Trucha"_"Trucha Bug"_ -write -yes>nul

support\sfk filter "%sysCheckCopy%" -rep _"Acces NAND"_"NAND Access"_ -rep _"Accesso NAND"_"NAND Access"_ -rep _"Acceso NAND"_"NAND Access"_ -rep _"NAND Zugriff"_"NAND Access"_ -write -yes>nul

support\sfk filter "%sysCheckCopy%" -rep _"Identificazione ES"_"ES Identify"_ -write -yes>nul

support\sfk filter "%sysCheckCopy%" -rep _"Type de Console"_"Console Type"_ -rep _"Tipo Console"_"Console Type"_ -rep _"Tipo de consola"_"Console Type"_ -rep _"Konsolentyp"_"Console Type"_ -write -yes>nul

support\sfk filter "%sysCheckCopy%" -rep _"Regione"_"Region"_ -write -yes>nul


::adjust "original region" to ignore it when parsing region later
support\sfk filter "%sysCheckCopy%" -rep _"original region"_"originally"_ -rep _"region d'origine"_"originally"_ -rep _"regione originale"_"originally"_ -rep _"region de origen"_"originally"_ -write -yes>nul



::edit replace "d2x-v10beta52" with "d2x-v8final" (since they're the same), and vice versa (also accept d2x-v11beta1). However, if d2x-v11beta1 is selected, it will not accept anything less even though improvements are relatively minor
if /i "%d2x-beta-rev%" EQU "10-beta52" support\sfk filter "%sysCheckCopy%" -rep _d2x-v8final_d2x-v10beta52_ -write -yes>nul
if /i "%d2x-beta-rev%" EQU "10-beta52" support\sfk filter "%sysCheckCopy%" -rep _d2x-v11beta1_d2x-v10beta52_ -write -yes>nul

if /i "%d2x-beta-rev%" EQU "8-final" support\sfk filter "%sysCheckCopy%" -rep _d2x-v10beta52_d2x-v8final_ -write -yes>nul
if /i "%d2x-beta-rev%" EQU "8-final" support\sfk filter "%sysCheckCopy%" -rep _d2x-v11beta1_d2x-v8final_ -write -yes>nul

::remove any lines ending in ": Skipped" and assume outdated, this will also prevent stubs from being listed like 249 (even though they won't be constructed) - DISABLED
::support\sfk filter "%sysCheckCopy%" -le!": Skipped" -write -yes>nul

::if /i "%d2x-beta-rev%" EQU "11-beta1" support\sfk filter "%sysCheckCopy%" -rep _d2x-v8final_d2x-v11beta1_ -write -yes>nul
::if /i "%d2x-beta-rev%" EQU "11-beta1" support\sfk filter "%sysCheckCopy%" -rep _d2x-v10beta52_d2x-v11beta1_ -write -yes>nul

::confirm SysCheck ME or SysCheck HDE
findStr /I /B /C:"SysCheck HDE" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 goto:allgood

findStr /I /B /C:"SysCheck ME" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 goto:allgood

findStr /I /B /C:"sysCheck v2.1.0b" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 goto:syscheckwarning
echo.
echo.
echo Please use SysCheck ModMii Edition (ME) or Hacksden Edition (HDE) ^& try again...
echo.
echo If SysCheck ME or HDE don't work for you try v2.1.0.b19 https://tiny.cc/syscheckb19
echo.
pause
goto:sysCheckName


:syscheckwarning
echo.
echo.
echo Please use SysCheck ModMii Edition (ME) or Hacksden Edition (HDE) ^& try again...
echo.
echo If SysCheck ME or HDE don't work for you try v2.1.0.b19 https://tiny.cc/syscheckb19
echo.
support\sfk.exe echo [%cyantext%]Would you like ModMii to try and analyze this SysCheck anyway? (Y/N)
echo.
support\sfk.exe echo [%redtext%]Warning![def] Analysis of older SysCheck logs may recommend redundant updates that are
echo not necessary, but the guide should still be safe.
echo.

:SysCheckPrompt
set SysCheckPrompt="
set /p SysCheckPrompt=Enter Selection Here: 
set "SysCheckPrompt=%SysCheckPrompt:"=%"

if /i "%SysCheckPrompt%" EQU "N" goto:sysCheckName
if /i "%SysCheckPrompt%" EQU "Y" goto:allgood

:badkey
echo You Have Entered an Incorrect Key
echo.
goto:SysCheckPrompt


:allgood


::check Console Type for vWii & Wii
copy /y "%sysCheckCopy%" temp\syscheck.txt>nul
support\sfk filter -quiet temp\syscheck.txt -ls+"Console Type: " -rep _"Console Type: "__ -write -yes
set /p consoletype= <temp\syscheck.txt
del temp\syscheck.txt>nul

if /i "%consoletype%" EQU "vWii" goto:miniskip
if /i "%consoletype%" NEQ "Wii" (echo %consoletype% Console Type not supported, aborting analysis...) & (echo.) & (@ping 127.0.0.1 -n 5 -w 1000> nul) & (goto:sysCheckName)
:miniskip

:: IM HERE ---------------------
if /i "%consoletype%" NEQ "vWii" goto:skipcheck
::if vwii mods, check if d2x is disabled and revert to default

if not exist "Support\d2x-beta\" goto:skipcheck
if not exist "Support\d2x-beta\ciosmaps_vWii.xml" goto:switch

::check ciosmaps_vWii.xml for 'base ios="38"'
findStr /I /C:"base ios=\"38\"" "Support\d2x-beta\ciosmaps_vWii.xml" >nul
IF NOT ERRORLEVEL 1 goto:skipcheck

::need to switch d2x version
:switch
echo.
echo Warning! d2x-v%d2x-beta-rev% is not fully supported for vWii, reverting to default d2x version, this can be changed again later in the Options menu
echo.
pause
echo.
set d2x-beta-rev=%d2x-bundled%
if exist support\d2x-beta rd /s /q support\d2x-beta
:skipcheck




::check if d2x version is customized and offer to revert to default
call support\subscripts\defaultd2x.bat


::-When prompting users for a syscheck, and when starting to analyze a syscheck FOR Wii\vWii display ACTIVEIOS setting, for Wii-Only also display hermes and cmios settings and info (and any other applicable settings)
support\sfk echo -spat \x20 \x20 \x20 \x20 \x20[%cyantext%]The following ModMii settings will impact how your SysCheck is analyzed:
echo.
if /i "%ACTIVEIOS%" EQU "OFF" support\sfk echo -spat \x20 \x20 \x20 \x20 \x20 - Update Active IOSs [%redtext%](Disabled)
if /i "%ACTIVEIOS%" EQU "ON" support\sfk echo -spat \x20 \x20 \x20 \x20 \x20 - Update Active IOSs [%greentext%](Enabled)



findStr /I /B /C:"Region: NTSC-U" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set Region=U
findStr /I /B /C:"Region: PAL" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set Region=E
findStr /I /B /C:"Region: JAP" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set Region=J
findStr /I /B /C:"Region: NTSC-J" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set Region=J
findStr /I /B /C:"Region: KOR" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set Region=K



if /i "%consoletype%" NEQ "vWii" goto:NOTvWii

set FIRMSTART=v

::Check for OHBC v1.1.3 or higher
findStr /I /B /R /C:"Homebrew Channel 1.1.[3-9] running on IOS58" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set OHBC113=*) else (set OHBC113=)

::check if Priiloader is installed (disabled for now as "Priiloader" not present in vWii syschecks)
::findStr /I /B /C:"Priiloader" "%sysCheckCopy%" >nul
::IF ERRORLEVEL 1 (set pri=*) else (set pri=)

::if /i "%pri%" EQU "*" goto:skip
echo.
echo Priiloader might already be installed but SysCheck cannot detect it on vWii at this time.
echo Would you like to install the latest version of Priiloader now? (Y/N)
echo.
:UpdatePri2
set UpdatePri="
set /p UpdatePri=Enter Selection Here: 
set "UpdatePri=%UpdatePri:"=%"

if /i "%UpdatePri%" EQU "N" goto:skip
if /i "%UpdatePri%" EQU "Y" (set pri=*) & (goto:skip)

:badkey
echo You Have Entered an Incorrect Key
echo.
goto:UpdatePri2
:skip


::Check for patched vIOS80
findStr /I /B /R /C:"vIOS80 (rev [0-9]*):.*NAND Access" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS80P=*) else (set vIOS80P=)


::d2x cios
set d2x-beta-rev=%d2x-bundled%
set ciosversion=65535
if exist support\d2x-beta\d2x-beta.bat call support\d2x-beta\d2x-beta.bat

echo "set cIOSversionNum=%d2x-beta-rev%">temp\cIOSrev.bat
support\sfk filter -spat temp\cIOSrev.bat -rep _\x22__ -rep _"-*"__ -write -yes>nul
call temp\cIOSrev.bat
del temp\cIOSrev.bat>nul

set string1=%cIOSversionNum%
set versionlength=1
::letter by letter loop
:loopy3
    if /i "%string1%" EQU "" goto:endloopy3
    set string1=%string1:~1%
    set /A versionlength=%versionlength%+1
    goto:loopy3
:endloopy3

echo set cIOSsubversion=@d2x-beta-rev:~%versionlength%,16@>temp\cIOSsubversion.bat
support\sfk filter temp\cIOSsubversion.bat -spat -rep _@_%%_ -write -yes>nul
call temp\cIOSsubversion.bat
del temp\cIOSsubversion.bat>nul

findStr /I /B /R /C:"vIOS248\[38\] (rev [0-9]*, Info: d2x-v%cIOSversionNum%%cIOSsubversion%" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set cIOS248[38]-d2x-vWii=*) else (set cIOS248[38]-d2x-vWii=)

findStr /I /B /R /C:"vIOS249\[56\] (rev [0-9]*, Info: d2x-v%cIOSversionNum%%cIOSsubversion%" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set cIOS249[56]-d2x-vWii=*) else (set cIOS249[56]-d2x-vWii=)

findStr /I /B /R /C:"vIOS250\[57\] (rev [0-9]*, Info: d2x-v%cIOSversionNum%%cIOSsubversion%" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set cIOS250[57]-d2x-vWii=*) else (set cIOS250[57]-d2x-vWii=)

findStr /I /B /R /C:"vIOS251\[58\] (rev [0-9]*, Info: d2x-v%cIOSversionNum%%cIOSsubversion%" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set cIOS251[58]-d2x-vWii=*) else (set cIOS251[58]-d2x-vWii=)




::check if SM version is greater than 610 (vWii 4.3E), if cSM detected reinstall stock SM
copy /y "%sysCheckCopy%" temp\syscheck.txt>nul
support\sfk filter -quiet temp\syscheck.txt -ls+"System Menu " -rep _"*(v"__ -rep _" *"__ -rep _",*"__ -rep _")*"__ -write -yes
set firmversion=
set /p firmversion= <temp\syscheck.txt
del temp\syscheck.txt>nul

if /i "%firmversion%" EQU "4609" goto:wiimini
if /i "%firmversion%" NEQ "4610" goto:skipwiimini
:wiimini
echo This SysCheck is for a Wii Mini and is not currently supported, aborting analysis...
echo.
@ping 127.0.0.1 -n 5 -w 1000> nul
goto:sysCheckName
:skipwiimini

set customSMfix=
if /i %firmversion% LEQ 610 goto:noCSM
set firmwarechange=yes
set customSMfix=yes

if /i "%REGION%" EQU "U" set vSM4.3U=*
if /i "%REGION%" EQU "E" set vSM4.3E=*
if /i "%REGION%" EQU "J" set vSM4.3J=*
:noCSM



::check for missing active IOSs
if /i "%ACTIVEIOS%" EQU "OFF" goto:skipactivecheck

findStr /I /B /C:"vIOS9 (rev 1290): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS9=*) else (set vIOS9=)

findStr /I /B /C:"vIOS12 (rev 782): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS12=*) else (set vIOS12=)

findStr /I /B /C:"vIOS13 (rev 1288): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS13=*) else (set vIOS13=)

findStr /I /B /C:"vIOS14 (rev 1288): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS14=*) else (set vIOS14=)

findStr /I /B /C:"vIOS15 (rev 1288): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS15=*) else (set vIOS15=)

findStr /I /B /C:"vIOS17 (rev 1288): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS17=*) else (set vIOS17=)

findStr /I /B /C:"vIOS21 (rev 1295): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS21=*) else (set vIOS21=)

findStr /I /B /C:"vIOS22 (rev 1550): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS22=*) else (set vIOS22=)

findStr /I /B /C:"vIOS28 (rev 2063): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS28=*) else (set vIOS28=)

findStr /I /B /C:"vIOS31 (rev 3864): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS31=*) else (set vIOS31=)

findStr /I /B /C:"vIOS33 (rev 3864): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS33=*) else (set vIOS33=)

findStr /I /B /C:"vIOS34 (rev 3864): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS34=*) else (set vIOS34=)

findStr /I /B /C:"vIOS35 (rev 3864): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS35=*) else (set vIOS35=)

findStr /I /B /C:"vIOS36 (rev 3864): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS36=*) else (set vIOS36=)

findStr /I /B /C:"vIOS37 (rev 5919): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS37=*) else (set vIOS37=)

findStr /I /B /C:"vIOS38 (rev 4380): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS38=*) else (set vIOS38=)

findStr /I /B /C:"vIOS41 (rev 3863): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS41=*) else (set vIOS41=)

findStr /I /B /C:"vIOS43 (rev 3863): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS43=*) else (set vIOS43=)

findStr /I /B /C:"vIOS45 (rev 3863): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS45=*) else (set vIOS45=)

findStr /I /B /C:"vIOS46 (rev 3863): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS46=*) else (set vIOS46=)

findStr /I /B /C:"vIOS48 (rev 4380): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS48=*) else (set vIOS48=)

findStr /I /B /C:"vIOS53 (rev 5919): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS53=*) else (set vIOS53=)

findStr /I /B /C:"vIOS55 (rev 5919): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS55=*) else (set vIOS55=)

findStr /I /B /C:"vIOS56 (rev 5918): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS56=*) else (set vIOS56=)

findStr /I /B /C:"vIOS57 (rev 6175): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS57=*) else (set vIOS57=)

set vIOS58=*
findStr /I /B /C:"vIOS58 (rev 6432): No Patches" "%sysCheckCopy%" >nul
IF not ERRORLEVEL 1 set vIOS58=
findStr /I /B /C:"vIOS58 (rev 6432): USB 2.0" "%sysCheckCopy%" >nul
IF not ERRORLEVEL 1 set vIOS58=

::::IOS59 is a J exclusive, but doesn't seem to be the case for vWii
::if /i "%REGION%" NEQ "J" goto:skipvIOS59
findStr /I /B /C:"vIOS59 (rev 9249): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS59=*) else (set vIOS59=)
:::skipvIOS59

findStr /I /B /C:"vIOS61 (rev 5918)" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS61=*) else (set vIOS61=)

findStr /I /B /C:"vIOS62 (rev 6942): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set vIOS62=*) else (set vIOS62=)

findStr /I /B /C:"vIOS512 (rev 7): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set BCnand=*) else (set BCnand=)

findStr /I /B /C:"vIOS513 (rev 1): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set BCwfs=*) else (set BCwfs=)

:skipactivecheck



set yawm=
if /i "%OHBC113%" EQU "*" set yawm=*
if /i "%cIOS248[38]-d2x-vWii%" EQU "*" set yawm=*
if /i "%cIOS249[56]-d2x-vWii%" EQU "*" set yawm=*
if /i "%cIOS250[57]-d2x-vWii%" EQU "*" set yawm=*
if /i "%cIOS251[58]-d2x-vWii%" EQU "*" set yawm=*
if /i "%vIOS9%" EQU "*" set yawm=*
if /i "%vIOS12%" EQU "*" set yawm=*
if /i "%vIOS13%" EQU "*" set yawm=*
if /i "%vIOS14%" EQU "*" set yawm=*
if /i "%vIOS15%" EQU "*" set yawm=*
if /i "%vIOS17%" EQU "*" set yawm=*
if /i "%vIOS21%" EQU "*" set yawm=*
if /i "%vIOS22%" EQU "*" set yawm=*
if /i "%vIOS28%" EQU "*" set yawm=*
if /i "%vIOS31%" EQU "*" set yawm=*
if /i "%vIOS33%" EQU "*" set yawm=*
if /i "%vIOS34%" EQU "*" set yawm=*
if /i "%vIOS35%" EQU "*" set yawm=*
if /i "%vIOS36%" EQU "*" set yawm=*
if /i "%vIOS37%" EQU "*" set yawm=*
if /i "%vIOS38%" EQU "*" set yawm=*
if /i "%vIOS41%" EQU "*" set yawm=*
if /i "%vIOS43%" EQU "*" set yawm=*
if /i "%vIOS45%" EQU "*" set yawm=*
if /i "%vIOS46%" EQU "*" set yawm=*
if /i "%vIOS48%" EQU "*" set yawm=*
if /i "%vIOS53%" EQU "*" set yawm=*
if /i "%vIOS55%" EQU "*" set yawm=*
if /i "%vIOS56%" EQU "*" set yawm=*
if /i "%vIOS57%" EQU "*" set yawm=*
if /i "%vIOS58%" EQU "*" set yawm=*
if /i "%vIOS59%" EQU "*" set yawm=*
if /i "%vIOS61%" EQU "*" set yawm=*
if /i "%vIOS62%" EQU "*" set yawm=*
::if /i "%vIOS80%" EQU "*" set yawm=*
if /i "%vIOS80P%" EQU "*" set yawm=*
if /i "%BCnand%" EQU "*" set yawm=*
if /i "%BCwfs%" EQU "*" set yawm=*
::if /i "%vSM4.3U%" EQU "*" set yawm=*
::if /i "%vSM4.3E%" EQU "*" set yawm=*
::if /i "%vSM4.3J%" EQU "*" set yawm=*
::if /i "%vRSU%" EQU "*" set yawm=*
::if /i "%vRSE%" EQU "*" set yawm=*
::if /i "%vRSJ%" EQU "*" set yawm=*

set BACKB4QUEUE=sysCheckName
goto:STUBScheck

:NOTvWii




::Continued from above-When prompting users for a syscheck, and when starting to analyze a syscheck FOR Wii\vWii display ACTIVEIOS setting, for Wii-Only also display hermes and cmios settings and info (and any other applicable settings)
echo.
if /i "%ExtraProtectionOPTION%" EQU "OFF" support\sfk echo -spat \x20 \x20 \x20 \x20 \x20            - Extra Brick Protection [%redtext%](Disabled)
if /i "%ExtraProtectionOPTION%" EQU "ON" support\sfk echo -spat \x20 \x20 \x20 \x20 \x20            - Extra Brick Protection [%greentext%](Enabled)
echo               * When enabled, a patched IOS60 will be installed to other system menu
echo                 IOS slots to prevent bricks from users manually up\downgrading Wii's
echo.
if /i "%hermesOPTION%" EQU "OFF" support\sfk echo -spat \x20 \x20 \x20 \x20 \x20 - Hermes cIOSs (202 ^& 222-224) [%redtext%](Disabled)
if /i "%hermesOPTION%" EQU "ON" support\sfk echo -spat \x20 \x20 \x20 \x20 \x20 - Hermes cIOSs (202 ^& 222-224) [%greentext%](Enabled)
echo               * Generally no longer necessary but may still be useful in some cases
echo.
if /i "%CMIOSOPTION%" EQU "OFF" support\sfk echo -spat \x20 \x20 \x20 \x20 \x20 - cMIOS [%redtext%](Disabled)
if /i "%CMIOSOPTION%" EQU "ON" support\sfk echo -spat \x20 \x20 \x20 \x20 \x20 - cMIOS [%greentext%](Enabled)
echo               * A cMIOS allows older non-chipped Wii's to play GameCube backup discs









::get HBC version (ie. "Homebrew Channel 1.1.2 running on IOS58")
set HBCversion=0.0.1
copy /y "%sysCheckCopy%" temp\syscheck.txt>nul
support\sfk filter -quiet temp\syscheck.txt -ls+"Homebrew Channel " -rep _"Homebrew Channel "__ -rep _" *"__ -write -yes
set /p HBCversion= <temp\syscheck.txt


::get System Menu info (ie. "System Menu 4.3E")
copy /y "%sysCheckCopy%" temp\syscheck.txt>nul
support\sfk filter -quiet temp\syscheck.txt -ls+"System Menu " -rep _"*System Menu "__ -rep _" *"__ -rep _",*"__ -write -yes
set /p firmstart= <temp\syscheck.txt
del temp\syscheck.txt>nul


set SMregion=%firmstart:~-1%

set firmstart=%firmstart:~0,-1%
if /i "%firmstart:~0,1%" EQU "3" set firmstart=3.X
if /i "%firmstart:~0,1%" EQU "2" set firmstart=o
if /i "%firmstart:~0,1%" EQU "1" set firmstart=o

set firm=%firmstart%




if /i "%SMregion%" EQU "%Region%" goto:NoMismatch
cls
echo                                        ModMii                                v%currentversion%
echo                                       by XFlak
echo.
echo     WARNING! Incomplete region change detected!
echo.
echo     You should first complete ModMii's Region Change Wizard to fully install
echo     your desired region and System Menu, then generate a new SysCheck.csv
echo     before continuing the SysCheck Updater Wizard.
echo.
echo     Press any key to return to the Main Menu.
echo.
pause>nul
set MENU1=
set cmdlinemode=
set one=
set two=
goto:MENU
:NoMismatch


::check if SM version is greater than 518 (4.3K), if cSM detected reinstall stock SM
copy /y "%sysCheckCopy%" temp\syscheck.txt>nul
support\sfk filter -quiet temp\syscheck.txt -ls+"System Menu " -rep _"*(v"__ -rep _" *"__ -rep _",*"__ -rep _")*"__ -write -yes
set firmversion=
set /p firmversion= <temp\syscheck.txt
del temp\syscheck.txt>nul


if /i "%firmversion%" EQU "4609" goto:wiimini
if /i "%firmversion%" NEQ "4610" goto:skipwiimini
:wiimini
echo This SysCheck is for a Wii Mini and is not currently supported, aborting analysis...
echo.
@ping 127.0.0.1 -n 5 -w 1000> nul
goto:sysCheckName
:skipwiimini

set customSMfix=
if /i %firmversion% LEQ 518 goto:noCSM
set firmwarechange=yes
set customSMfix=yes


if /i "%firmstart%" NEQ "4.2" goto:not42
if /i "%REGION%" EQU "U" set SM4.2U=*
if /i "%REGION%" EQU "E" set SM4.2E=*
if /i "%REGION%" EQU "J" set SM4.2J=*
if /i "%REGION%" EQU "K" set SM4.2K=*
goto:noSM
:not42

if /i "%firmstart%" NEQ "4.1" goto:not41
if /i "%REGION%" EQU "U" set SM4.1U=*
if /i "%REGION%" EQU "E" set SM4.1E=*
if /i "%REGION%" EQU "J" set SM4.1J=*
if /i "%REGION%" EQU "K" set SM4.1K=*
goto:noSM
:not41


set firm=4.3
if /i "%REGION%" EQU "U" set SM4.3U=*
if /i "%REGION%" EQU "E" set SM4.3E=*
if /i "%REGION%" EQU "J" set SM4.3J=*
if /i "%REGION%" EQU "K" set SM4.3K=*
goto:noSM
:noCSM

set firmwarechange=no
if /i "%firmstart%" EQU "4.0" set firmwarechange=yes
if /i "%firmstart%" EQU "3.x" set firmwarechange=yes
if /i "%firmstart%" EQU "o" set firmwarechange=yes

if /i "%firmwarechange%" EQU "no" goto:noSM
set firm=4.3
if /i "%REGION%" EQU "U" set SM4.3U=*
if /i "%REGION%" EQU "E" set SM4.3E=*
if /i "%REGION%" EQU "J" set SM4.3J=*
if /i "%REGION%" EQU "K" set SM4.3K=*
:noSM


::check if Priiloader is installed
set pri=*
set UpdatePri=
::since yawmME can retain priloader, no need to reinstall even if a new SM is installed
::if /i "%firmwarechange%" EQU "yes" (set pri=*) & (goto:skipprianalysis)

findStr /I /B /C:"Priiloader" "%sysCheckCopy%" >nul
IF not ERRORLEVEL 1 set pri=
:::skipprianalysis


if /i "%pri%" EQU "*" goto:skip
echo.
echo Priiloader is already installed but SysCheck is unable to determine its version.
echo Would you like to install the latest version of Priiloader now? (Y/N)
echo.
:UpdatePri
set UpdatePri="
set /p UpdatePri=Enter Selection Here: 
set "UpdatePri=%UpdatePri:"=%"

if /i "%UpdatePri%" EQU "N" goto:skip
if /i "%UpdatePri%" EQU "Y" (set pri=*) & (goto:skip)

:badkey
echo You Have Entered an Incorrect Key
echo.
goto:UpdatePri
:skip


set d2x-beta-rev=%d2x-bundled%
set ciosversion=65535
if exist support\d2x-beta\d2x-beta.bat call support\d2x-beta\d2x-beta.bat

echo "set cIOSversionNum=%d2x-beta-rev%">temp\cIOSrev.bat
support\sfk filter -spat temp\cIOSrev.bat -rep _\x22__ -rep _"-*"__ -write -yes>nul
call temp\cIOSrev.bat
del temp\cIOSrev.bat>nul


set string1=%cIOSversionNum%
set versionlength=1
::letter by letter loop
:loopy2
    if /i "%string1%" EQU "" goto:endloopy2
    set string1=%string1:~1%
    set /A versionlength=%versionlength%+1
    goto:loopy2
:endloopy2


echo set cIOSsubversion=@d2x-beta-rev:~%versionlength%,16@>temp\cIOSsubversion.bat
support\sfk filter temp\cIOSsubversion.bat -spat -rep _@_%%_ -write -yes>nul
call temp\cIOSsubversion.bat
del temp\cIOSsubversion.bat>nul




::check for recommended cIOSs and HBC

set HM=*
findStr /I /B /R /C:"Homebrew Channel 1.1.[2-9] running on IOS58" "%sysCheckCopy%" >nul
IF not ERRORLEVEL 1 (set HM=) & (goto:no58check)
if /i %HBCversion% GEQ 1.1.0 (set OHBC=*) & (set HM=)

::check for any version of IOS58
if /i "%HM%" NEQ "*" goto:no58check
findStr /I /B /C:"IOS58 " "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS58=*) else (set IOS58=)
:no58check


if /i "%hermesOPTION%" EQU "OFF" goto:skipHERMEScheck
findStr /I /B /R /C:"IOS202\[60\] (rev [0-9]*, Info: hermesrodries-v6" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set cIOS202[60]-v5.1R=*) else (set cIOS202[60]-v5.1R=)
findStr /I /B /R /C:"IOS202\[60\] (rev [0-9]*, Info: hermesrodries-v5.1" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set cIOS202[60]-v5.1R=
findStr /I /B /R /C:"IOS202\[60\] (rev [0-9]*, Info: hermesrodries-5.1" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set cIOS202[60]-v5.1R=
findStr /I /B /R /C:"IOS202\[60\] (rev [0-9]*, Info: hermes-v5.1" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set cIOS202[60]-v5.1R=

findStr /I /B /R /C:"IOS222\[38\] (rev [0-9]*, Info: hermes-v4" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set cIOS222[38]-v4=*) else (set cIOS222[38]-v4=)

set cIOS223[37-38]-v4=*
findStr /I /B /R /C:"IOS223\[38+37\] (rev [0-9]*, Info: hermes-v4" "%sysCheckCopy%" >nul
IF not ERRORLEVEL 1 set cIOS223[37-38]-v4=

findStr /I /B /R /C:"IOS224\[57\] (rev [0-9]*, Info: hermesrodries-v6" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set cIOS224[57]-v5.1R=*) else (set cIOS224[57]-v5.1R=)
findStr /I /B /R /C:"IOS224\[57\] (rev [0-9]*, Info: hermesrodries-v5.1" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set cIOS224[57]-v5.1R=
findStr /I /B /R /C:"IOS224\[57\] (rev [0-9]*, Info: hermesrodries-5.1" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set cIOS224[57]-v5.1R=
findStr /I /B /R /C:"IOS224\[57\] (rev [0-9]*, Info: hermes-v5.1" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set cIOS224[57]-v5.1R=
:skipHERMEScheck


::set IOS236=*
::findStr /I /B /R /C:"IOS236\[36\] (rev [0-9]*, Info: rev 3351" "%sysCheckCopy%" >nul
::IF NOT ERRORLEVEL 1 set IOS236=
::findStr /I /B /R /C:"IOS236 (rev [0-9]*): Trucha Bug, ES Identify, NAND Access" "%sysCheckCopy%" >nul
::IF NOT ERRORLEVEL 1 set IOS236=


findStr /I /B /R /C:"IOS248\[38\] (rev [0-9]*, Info: d2x-v%cIOSversionNum%%cIOSsubversion%" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set cIOS248[38]-d2x-v10-beta52=*) else (set cIOS248[38]-d2x-v10-beta52=)

findStr /I /B /R /C:"IOS249\[56\] (rev [0-9]*, Info: d2x-v%cIOSversionNum%%cIOSsubversion%" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set cIOS249[56]-d2x-v10-beta52=*) else (set cIOS249[56]-d2x-v10-beta52=)

findStr /I /B /R /C:"IOS250\[57\] (rev [0-9]*, Info: d2x-v%cIOSversionNum%%cIOSsubversion%" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set cIOS250[57]-d2x-v10-beta52=*) else (set cIOS250[57]-d2x-v10-beta52=)

findStr /I /B /R /C:"IOS251\[58\] (rev [0-9]*, Info: d2x-v%cIOSversionNum%%cIOSsubversion%" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set cIOS251[58]-d2x-v10-beta52=*) else (set cIOS251[58]-d2x-v10-beta52=)

::also accept 249/250 reversed - DISABLED

::findStr /I /B /R /C:"IOS250\[56\] (rev [0-9]*, Info: d2x-v%cIOSversionNum%%cIOSsubversion%" "%sysCheckCopy%" >nul
::IF ERRORLEVEL 1 goto:skip
::findStr /I /B /R /C:"IOS249\[57\] (rev [0-9]*, Info: d2x-v%cIOSversionNum%%cIOSsubversion%" "%sysCheckCopy%" >nul
::IF ERRORLEVEL 1 goto:skip
::::found both 249[56] and 250[57]
::set cIOS249[56]-d2x-v10-beta52=
::set cIOS250[57]-d2x-v10-beta52=
:::skip




::bootmii check
set bootmii_missing=
::findStr /I /C:"bootmii" "%sysCheckCopy%" >nul
findStr /I /B /R /C:"IOS254 (rev [0-9]*): BootMii" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 set bootmii_missing=Y
::IF ERRORLEVEL 1 (set HM=*) & (set bootmiisd=*)
if /i "%bootmii_missing%" EQU "Y" set HM=*


::check for missing active IOSs
if /i "%ACTIVEIOS%" EQU "OFF" goto:skipactivecheck

findStr /I /B /C:"IOS9 (rev 1034): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS9=*) else (set IOS9=)

findStr /I /B /C:"IOS12 (rev 526): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS12=*) else (set IOS12=)

findStr /I /B /C:"IOS13 (rev 1032): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS13=*) else (set IOS13=)

findStr /I /B /C:"IOS14 (rev 1032): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS14=*) else (set IOS14=)

findStr /I /B /C:"IOS15 (rev 1032): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS15=*) else (set IOS15=)

findStr /I /B /C:"IOS17 (rev 1032): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS17=*) else (set IOS17=)

findStr /I /B /C:"IOS21 (rev 1039): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS21=*) else (set IOS21=)

findStr /I /B /C:"IOS22 (rev 1294): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS22=*) else (set IOS22=)

findStr /I /B /C:"IOS28 (rev 1807): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS28=*) else (set IOS28=)

findStr /I /B /C:"IOS31 (rev 3608): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS31=*) else (set IOS31=)

findStr /I /B /C:"IOS33 (rev 3608): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS33=*) else (set IOS33=)

findStr /I /B /C:"IOS34 (rev 3608): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS34=*) else (set IOS34=)

findStr /I /B /C:"IOS35 (rev 3608): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS35=*) else (set IOS35=)

findStr /I /B /C:"IOS36 (rev 3608): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS36v3608=*) else (set IOS36v3608=)

findStr /I /B /C:"IOS37 (rev 5663): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS37=*) else (set IOS37=)

findStr /I /B /C:"IOS38 (rev 4124): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS38=*) else (set IOS38=)

findStr /I /B /C:"IOS41 (rev 3607): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS41=*) else (set IOS41=)

findStr /I /B /C:"IOS43 (rev 3607): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS43=*) else (set IOS43=)

findStr /I /B /C:"IOS45 (rev 3607): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS45=*) else (set IOS45=)

findStr /I /B /C:"IOS46 (rev 3607): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS46=*) else (set IOS46=)

findStr /I /B /C:"IOS48 (rev 4124): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS48v4124=*) else (set IOS48v4124=)

findStr /I /B /C:"IOS53 (rev 5663): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS53=*) else (set IOS53=)

findStr /I /B /C:"IOS55 (rev 5663): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS55=*) else (set IOS55=)

findStr /I /B /C:"IOS56 (rev 5662): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS56=*) else (set IOS56=)

findStr /I /B /C:"IOS57 (rev 5919): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS57=*) else (set IOS57=)

set IOS58=*
findStr /I /B /C:"IOS58 (rev 6176): No Patches" "%sysCheckCopy%" >nul
IF not ERRORLEVEL 1 set IOS58=
findStr /I /B /C:"IOS58 (rev 6176): USB 2.0" "%sysCheckCopy%" >nul
IF not ERRORLEVEL 1 set IOS58=

::IOS59 is a J exclusive
if /i "%REGION%" NEQ "J" goto:skipIOS59
findStr /I /B /C:"IOS59 (rev 9249): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS59=*) else (set IOS59=)
:skipIOS59

findStr /I /B /C:"IOS61 (rev 5662): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS61=*) else (set IOS61=)

findStr /I /B /C:"IOS62 (rev 6430): No Patches" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set IOS62=*) else (set IOS62=)

findStr /I /B /C:"BC v6" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set BC=*) else (set BC=)

:skipactivecheck


::if HBC is <1.1.0 AND IOS58 is already installed, no need to download OHBC wad, will be running hackmii installer anyway
if /i %HBCversion% GEQ 1.1.0 goto:skip
if not "%IOS58%"=="" (set OHBC=*) & (set HM=*)
if "%IOS58%"=="" (set OHBC=) & (set HM=*)
:skip

::if IOS58 is already installed and will be running the HackMii installer to update bootmii anyway, no need to download OHBC wad
if /i "%bootmii_missing%" NEQ "Y" goto:skip
if "%IOS58%"=="" (set OHBC=) & (set HM=*)
:skip



::patched IOS check
if /i "%FIRM%" EQU "4.1" goto:forcecheck
if /i "%ExtraProtectionOPTION%" EQU "off" goto:smallskip
:forcecheck
set IOS60P=*
findStr /I /B /C:"IOS60 (rev 16174): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS60P=
findStr /I /B /C:"IOS60 (rev 65535): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS60P=
findStr /I /B /R /C:"IOS60 (rev [0-9]*, Info: ModMii-IOS60-v6174)" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS60P=
:smallskip


if /i "%FIRM%" EQU "4.2" goto:forcecheck
if /i "%ExtraProtectionOPTION%" EQU "off" goto:smallskip
:forcecheck
set IOS70K=*
findStr /I /B /C:"IOS70 (rev 16174): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS70K=
findStr /I /B /C:"IOS70 (rev 65535): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS70K=
findStr /I /B /R /C:"IOS70\[60\] (rev [0-9]*, Info: ModMii-IOS60-v6174)" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS70K=
:smallskip

if /i "%FIRM%" EQU "4.3" goto:forcecheck
if /i "%ExtraProtectionOPTION%" EQU "off" goto:smallskip
:forcecheck
set IOS80K=*
findStr /I /B /C:"IOS80 (rev 16174): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS80K=
findStr /I /B /C:"IOS80 (rev 65535): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS80K=
findStr /I /B /R /C:"IOS80\[60\] (rev [0-9]*, Info: ModMii-IOS60-v6174)" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS80K=
:smallskip


if /i "%ExtraProtectionOPTION%" EQU "off" goto:smallskip
set IOS11P60=*
set IOS20P60=*
set IOS30P60=*
set IOS40P60=*
set IOS50P=*
set IOS52P=*

findStr /I /B /C:"IOS11 (rev 16174): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS11P60=
findStr /I /B /C:"IOS11 (rev 65535): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS11P60=
findStr /I /B /R /C:"IOS11\[60\] (rev [0-9]*, Info: ModMii-IOS60-v6174)" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS11P60=

findStr /I /B /C:"IOS20 (rev 16174): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS20P60=
findStr /I /B /C:"IOS20 (rev 65535): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS20P60=
findStr /I /B /R /C:"IOS20\[60\] (rev [0-9]*, Info: ModMii-IOS60-v6174)" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS20P60=

findStr /I /B /C:"IOS30 (rev 16174): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS30P60=
findStr /I /B /C:"IOS30 (rev 65535): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS30P60=
findStr /I /B /R /C:"IOS30\[60\] (rev [0-9]*, Info: ModMii-IOS60-v6174)" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS30P60=

findStr /I /B /C:"IOS40 (rev 16174): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS40P60=
findStr /I /B /C:"IOS40 (rev 65535): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS40P60=
findStr /I /B /R /C:"IOS40\[60\] (rev [0-9]*, Info: ModMii-IOS60-v6174)" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS40P60=

findStr /I /B /C:"IOS50 (rev 16174): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS50P=
findStr /I /B /C:"IOS50 (rev 65535): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS50P=
findStr /I /B /R /C:"IOS50\[60\] (rev [0-9]*, Info: ModMii-IOS60-v6174)" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS50P=

findStr /I /B /C:"IOS52 (rev 16174): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS52P=
findStr /I /B /C:"IOS52 (rev 65535): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS52P=
findStr /I /B /R /C:"IOS52\[60\] (rev [0-9]*, Info: ModMii-IOS60-v6174)" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS52P=
:smallskip


::cMIOS
if /i "%CMIOSOPTION%" EQU "OFF" goto:skipcMIOScheck
::set RVL-cMIOS-v65535(v10)_WiiGator_WiiPower_v0.2=
::findStr /I /B /E /C:"MIOS v65535" "%sysCheckCopy%" >nul
::IF ERRORLEVEL 1 set RVL-cMIOS-v65535(v10)_WiiGator_WiiPower_v0.2=*

set Swiss_cMIOS=
findStr /I /B /E /C:"MIOS v1788" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 set Swiss_cMIOS=*
:skipcMIOScheck

::MIOSv10
if /i "%CMIOSOPTION%" EQU "ON" goto:skipMIOScheck
findStr /I /B /E /C:"MIOS v10" "%sysCheckCopy%" >nul
IF ERRORLEVEL 1 (set M10=*) else (set M10=)
:skipMIOScheck

::removed IOS236 effective 6.5.2
::::IOS236
::findStr /I /B /C:"IOS236" "%sysCheckCopy%" >nul
::IF ERRORLEVEL 1 (set IOS236Installer=*) else (set IOS236Installer=)
::if /i "%IOS236Installer%" EQU "*" (set SIP=*) else (set SIP=)
::if /i "%IOS236Installer%" EQU "*" (set IOS36=*) else (set IOS36=)



::stubs!
:STUBScheck
set STUBS=
copy /y "%sysCheckCopy%" temp\stubs.txt>nul
support\sfk filter -quiet temp\stubs.txt -!"(rev 404): Stub" -write -yes
support\sfk filter -quiet temp\stubs.txt -ls+IOS -ls+vIOS -rep _vIOS_a_ -rep _IOS_a_ -rep _"["*_z_ -rep _" "*_z_ -rep _:__ -write -yes
::filter out good stuff, intentionally skipping stubbed SM IOSs, etc.
support\sfk filter -quiet temp\stubs.txt -!a0z -!a1z -!a2z -!a9z -!a11z -!a12z -!a13z -!a14z -!a15z -!a17z -!a20z -!a21z -!a22z -!a28z -!a30z -!a31z -!a33z -!a34z -!a35z -!a36z -!a37z -!a38z -!a40z -!a41z -!a43z -!a45z -!a46z -!a48z -!a50z -!a52z -!a53z -!a55z -!a56z -!a57z -!a58z -!a60z -!a61z -!a62z -!a70z -!a80z -!a248z -!a249z -!a250z -!a251z -!a512z -!a513z -write -yes

::removed the following whitelisted slots from suggesting they optionally be stubbed in the syscheck updater wizard
::-!a236z -!a240z -!a241z -!a242z -!a243z -!a244z -!a245z -!a246z -!a247z 

::for vWii don't filter out hermes or bootmii ios254
if /i "%FIRMSTART%" EQU "v" goto:skip
if /i "%hermesOPTION%" EQU "on" support\sfk filter -quiet temp\stubs.txt -!a202z -!a222z -!a223z -!a224z -write -yes
support\sfk filter -quiet temp\stubs.txt -!a254z -write -yes
:skip

::filter out IOS59 only for J region (and vWii just in case)
if /i "%REGION%" EQU "J" support\sfk filter -quiet temp\stubs.txt -!a59z -write -yes
if /i "%FIRMSTART%" EQU "v" support\sfk filter -quiet temp\stubs.txt -!a59z -write -yes

support\sfk filter -quiet temp\stubs.txt -rep _a__ -rep _z__ -write -yes

::delete temp stubs if file is empty
>nul findstr "^" "temp\stubs.txt" || del "temp\stubs.txt"

if not exist temp\stubs.txt goto:nostubs
set STUBS=*
set yawm=*
set STUBSlist=
::get stubs list

::Loop through the following once for EACH line in *.txt
for /F "tokens=*" %%A in (temp\stubs.txt) do call :processSTUBSlist %%A
goto:quickskip
:processSTUBSlist
set STUBSlist=%STUBSlist%%*,
goto:EOF
:quickskip
set "STUBSlist=%STUBSlist:~0,-1%"
::echo (%STUBSlist%)

:nostubs
if /i "%FIRMSTART%" EQU "v" goto:DOWNLOADQUEUE

::disable RiiConnect24 check as it no longer requires a patched IOS31 or system menu IOS
goto:NoRiiConnect24Check

::check for RiiConnect24 IOS31 and IOS80
set RiiConnect24Detected=
if /i "%IOS31%" EQU "*" goto:RiiConnect24Check
if /i "%IOS80K%" EQU "*" goto:RiiConnect24Check
goto:NoRiiConnect24Check

:RiiConnect24Check
cls
findStr /I /B /C:"IOS31 (rev 3608): Trucha Bug, ES Identify, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set RiiConnect24Detected=Y

::ModMii's IOS80 is compatible with RiiConnect24, so only check for RC24's IOS31
::findStr /I /B /C:"IOS80 (rev 6944): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
::IF NOT ERRORLEVEL 1 set RiiConnect24Detected=Y

if /i "%RiiConnect24Detected%" NEQ "Y" goto:NoRiiConnect24Check

cls
echo                                        ModMii                                v%currentversion%
echo                                       by XFlak
echo.
echo     ModMii's SysCheck Updater has detected RiiConnect24 in IOS31.
echo     Would you like to remove\overwrite it?
echo.
echo     Y = Yes, remove\overwrite RiiConnect24
echo     N = No, keep RiiConnect24
echo.
set RiiConnect24Check="
set /p RiiConnect24Check=Enter Selection Here: 
set "RiiConnect24Check=%RiiConnect24Check:"=%"

if "%RiiConnect24Check%"=="" goto:badkey
if /i "%RiiConnect24Check%" EQU "Y" goto:NoRiiConnect24Check
if /i "%RiiConnect24Check%" EQU "N" goto:KeepRiiConnect24

:badkey
echo You Have Entered an Incorrect Key
@ping 127.0.0.1 -n 2 -w 1000> nul
goto:RiiConnect24Check

:KeepRiiConnect24
findStr /I /B /C:"IOS31 (rev 3608): Trucha Bug, ES Identify, NAND Access" "%sysCheckCopy%" >nul
IF NOT ERRORLEVEL 1 set IOS31=
::findStr /I /B /C:"IOS80 (rev 6944): Trucha Bug, NAND Access" "%sysCheckCopy%" >nul
::IF NOT ERRORLEVEL 1 set IOS80K=
:NoRiiConnect24Check



set yawm=
set RECCIOS=
if /i "%cIOS202[60]-v5.1R%" EQU "*" (set yawm=*) & (set RECCIOS=Y)
if /i "%cIOS222[38]-v4%" EQU "*" (set yawm=*) & (set RECCIOS=Y)
if /i "%cIOS223[37-38]-v4%" EQU "*" (set yawm=*) & (set RECCIOS=Y)
if /i "%cIOS224[57]-v5.1R%" EQU "*" (set yawm=*) & (set RECCIOS=Y)
if /i "%cIOS248[38]-d2x-v10-beta52%" EQU "*" (set yawm=*) & (set RECCIOS=Y)
if /i "%cIOS249[56]-d2x-v10-beta52%" EQU "*" (set yawm=*) & (set RECCIOS=Y)
if /i "%cIOS250[57]-d2x-v10-beta52%" EQU "*" (set yawm=*) & (set RECCIOS=Y)
if /i "%cIOS251[58]-d2x-v10-beta52%" EQU "*" (set yawm=*) & (set RECCIOS=Y)
if /i "%IOS9%" EQU "*" set yawm=*
if /i "%IOS12%" EQU "*" set yawm=*
if /i "%IOS13%" EQU "*" set yawm=*
if /i "%IOS14%" EQU "*" set yawm=*
if /i "%IOS15%" EQU "*" set yawm=*
if /i "%IOS17%" EQU "*" set yawm=*
if /i "%IOS21%" EQU "*" set yawm=*
if /i "%IOS22%" EQU "*" set yawm=*
if /i "%IOS28%" EQU "*" set yawm=*
if /i "%IOS31%" EQU "*" set yawm=*
if /i "%IOS33%" EQU "*" set yawm=*
if /i "%IOS34%" EQU "*" set yawm=*
if /i "%IOS35%" EQU "*" set yawm=*
if /i "%IOS36v3608%" EQU "*" set yawm=*
if /i "%IOS37%" EQU "*" set yawm=*
if /i "%IOS38%" EQU "*" set yawm=*
if /i "%IOS41%" EQU "*" set yawm=*
if /i "%IOS48v4124%" EQU "*" set yawm=*
if /i "%IOS43%" EQU "*" set yawm=*
if /i "%IOS45%" EQU "*" set yawm=*
if /i "%IOS46%" EQU "*" set yawm=*
if /i "%IOS53%" EQU "*" set yawm=*
if /i "%IOS55%" EQU "*" set yawm=*
if /i "%IOS56%" EQU "*" set yawm=*
if /i "%IOS57%" EQU "*" set yawm=*
if /i "%IOS58%" EQU "*" set yawm=*
if /i "%IOS59%" EQU "*" set yawm=*
if /i "%IOS61%" EQU "*" set yawm=*
if /i "%IOS62%" EQU "*" set yawm=*
if /i "%IOS60P%" EQU "*" set yawm=*
if /i "%IOS70K%" EQU "*" set yawm=*
if /i "%IOS80K%" EQU "*" set yawm=*
if /i "%IOS236%" EQU "*" set yawm=*
::if /i "%RVL-cMIOS-v65535(v10)_WiiGator_WiiPower_v0.2%" EQU "*" set yawm=*
if /i "%Swiss_cMIOS%" EQU "*" set yawm=*
if /i "%M10%" EQU "*" set yawm=*
if /i "%IOS11P60%" EQU "*" set yawm=*
if /i "%IOS20P60%" EQU "*" set yawm=*
if /i "%IOS30P60%" EQU "*" set yawm=*
if /i "%IOS40P60%" EQU "*" set yawm=*
if /i "%IOS50P%" EQU "*" set yawm=*
if /i "%IOS52P%" EQU "*" set yawm=*
if /i "%OHBC%" EQU "*" set yawm=*
if /i "%STUBS%" EQU "*" set yawm=*
if /i "%BC%" EQU "*" set yawm=*

if /i "%SM4.1U%" EQU "*" set yawm=*
if /i "%SM4.1E%" EQU "*" set yawm=*
if /i "%SM4.1J%" EQU "*" set yawm=*
if /i "%SM4.1K%" EQU "*" set yawm=*
if /i "%SM4.2U%" EQU "*" set yawm=*
if /i "%SM4.2E%" EQU "*" set yawm=*
if /i "%SM4.2J%" EQU "*" set yawm=*
if /i "%SM4.2K%" EQU "*" set yawm=*
if /i "%SM4.3U%" EQU "*" set yawm=*
if /i "%SM4.3E%" EQU "*" set yawm=*
if /i "%SM4.3J%" EQU "*" set yawm=*
if /i "%SM4.3K%" EQU "*" set yawm=*


set BACKB4QUEUE=sysCheckName
goto:DOWNLOADQUEUE