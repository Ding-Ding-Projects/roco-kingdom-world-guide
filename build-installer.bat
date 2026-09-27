@echo off
setlocal
set "ROOT=%~dp0"

if not "%~1"=="" if /i not "%~1"=="/s" if /i not "%~1"=="--silent" (
  echo Usage: build-installer.bat [/s^|--silent]
  exit /b 2
)
if not "%~2"=="" (
  echo Usage: build-installer.bat [/s^|--silent]
  exit /b 2
)

call "%ROOT%build.bat" %1
exit /b %ERRORLEVEL%
