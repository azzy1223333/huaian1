@echo off
setlocal
cd /d "%~dp0"
title HuaiAnLi Launcher
chcp 65001 >nul 2>nul

echo.
echo   Huai'anli: The Unmailed Family Photo
echo   Local archive launcher
echo.

where py >nul 2>nul
if %errorlevel%==0 (
  echo Starting local server at http://127.0.0.1:8765/
  start "HuaiAnLi Local Server" /min cmd /c "py -m http.server 8765 --bind 127.0.0.1"
  timeout /t 2 /nobreak >nul
  start "" "http://127.0.0.1:8765/"
  echo.
  echo If the page did not open, visit http://127.0.0.1:8765/ manually.
  echo Close the minimized server window to stop the server.
  timeout /t 4 /nobreak >nul
  exit /b
)

where python >nul 2>nul
if %errorlevel%==0 (
  echo Starting local server at http://127.0.0.1:8765/
  start "HuaiAnLi Local Server" /min cmd /c "python -m http.server 8765 --bind 127.0.0.1"
  timeout /t 2 /nobreak >nul
  start "" "http://127.0.0.1:8765/"
  echo.
  echo If the page did not open, visit http://127.0.0.1:8765/ manually.
  echo Close the minimized server window to stop the server.
  timeout /t 4 /nobreak >nul
  exit /b
)

echo Python was not found. Opening index.html directly.
echo If the game reports that local saving is unavailable, install Python or serve this folder with any local web server.
start "" "%~dp0index.html"
timeout /t 4 /nobreak >nul
