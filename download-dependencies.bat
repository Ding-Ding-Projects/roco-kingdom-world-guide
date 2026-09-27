@echo off
setlocal
set "ROOT=%~dp0"

if not "%~1"=="" (
  echo Usage: download-dependencies.bat
  exit /b 2
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\download-dependencies.ps1" -InstallDependencies
exit /b %ERRORLEVEL%
