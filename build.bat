@echo off
setlocal
set "ROOT=%~dp0"
set "SILENT_ARGUMENT="

if /i "%~1"=="/s" set "SILENT_ARGUMENT=-Silent"
if /i "%~1"=="--silent" set "SILENT_ARGUMENT=-Silent"
if not "%~1"=="" if not defined SILENT_ARGUMENT (
  echo Usage: build.bat [/s^|--silent]
  exit /b 2
)
if not "%~2"=="" (
  echo Usage: build.bat [/s^|--silent]
  exit /b 2
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\build.ps1" %SILENT_ARGUMENT%
exit /b %ERRORLEVEL%
