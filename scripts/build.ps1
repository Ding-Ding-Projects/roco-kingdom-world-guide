param(
    [switch]$Silent
)

$ErrorActionPreference = "Stop"
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$silentMode = $Silent -or $env:ROCO_GUIDE_SILENT -eq "1" -or $env:SILENT -eq "1"

. (Join-Path $PSScriptRoot "download-dependencies.ps1") -InstallDependencies

Push-Location $repositoryRoot
try {
    Write-Host "Building the Squirrel.Windows desktop package."
    & $env:ROCO_GUIDE_NPM_CMD run make
    if ($LASTEXITCODE -ne 0) {
        throw "The desktop package command exited with code $LASTEXITCODE."
    }
    Write-Host "Build complete. Squirrel.Windows outputs are under out/make."
}
finally {
    Pop-Location
}

if (-not $silentMode) {
    $answer = Read-Host "Launch the built guide now? (Y/N)"
    if ($answer -match "^(Y|YES)$") {
        Push-Location $repositoryRoot
        try {
            & $env:ROCO_GUIDE_NPM_CMD start
            if ($LASTEXITCODE -ne 0) {
                throw "The desktop launch command exited with code $LASTEXITCODE."
            }
        }
        finally {
            Pop-Location
        }
    }
}
