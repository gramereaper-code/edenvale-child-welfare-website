@echo off
setlocal
cd /d "%~dp0"
start "Edenvale website" cmd /k "node local-server.js"
start "Pinocchio backend" cmd /k "node pinocchio-server\server.js"
start "Edenvale local preview" http://127.0.0.1:8765/index.html
echo Website: http://127.0.0.1:8765/index.html
echo Pinocchio backend: http://127.0.0.1:3001
echo Close both command windows to stop the local services.
endlocal
