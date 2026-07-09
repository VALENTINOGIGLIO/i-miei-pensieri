@echo off
chcp 65001 >nul
echo ⚠️  Questo disabiliterà il sito su Firebase Hosting.
set /p CONFIRM="Sei sicuro? [s/N] "
if /i not "%CONFIRM%"=="s" (
  echo Operazione annullata.
  exit /b 0
)
npx firebase-tools hosting:disable
echo ❌ Sito disabilitato. Per riabilitarlo esegui deploy.bat
pause
