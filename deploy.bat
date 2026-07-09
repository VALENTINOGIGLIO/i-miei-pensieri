@echo off
chcp 65001 >nul
echo ╔══════════════════════════════════════════════╗
echo ║   I Miei Pensieri - Deploy Pipeline          ║
echo ╚══════════════════════════════════════════════╝

echo.
echo [0/3] Backup automatico (LIFO max 5)...
python manage_backups.py

echo.
echo [1/3] Build Web (Vite)...
call npm run build
if errorlevel 1 ( echo ERRORE nella build. & exit /b 1 )

echo.
echo [2/3] Anteprima locale avviata su http://localhost:4173
echo Premi un tasto dopo aver controllato il sito nel browser...
start "" "http://localhost:4173"
npx vite preview --port 4173
echo.
set /p CONFIRM="Vuoi procedere con il deploy su Firebase? [s/N] "
if /i not "%CONFIRM%"=="s" (
  echo Deploy annullato.
  exit /b 0
)

echo.
echo [3/3] Deploy su Firebase Hosting...
npx firebase-tools deploy --only hosting
echo.
echo ✅ Deploy completato! https://i-miei-pensieri.web.app
pause
