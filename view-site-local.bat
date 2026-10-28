@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required to preview this site locally.
  echo Install Node.js from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)

start "Edenvale Child Welfare preview" http://127.0.0.1:8765/index.html
echo Serving the site at http://127.0.0.1:8765/index.html
echo Close this window to stop the local preview.
node "%~dp0local-server.js"

endlocal
