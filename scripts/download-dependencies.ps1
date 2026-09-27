param(
    [switch]$InstallDependencies
)

$ErrorActionPreference = "Stop"
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$manifestPath = Join-Path $repositoryRoot "build-toolchain.json"
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$expectedVersion = [string]$manifest.node.version
$expectedNode = "v$expectedVersion"
$toolRoot = Join-Path $repositoryRoot ".tools"
$nodeHome = Join-Path $toolRoot "node-v$expectedVersion-win-x64"
$nodeExecutable = Join-Path $nodeHome "node.exe"
$npmCommand = Join-Path $nodeHome "npm.cmd"

if (-not (Test-Path -LiteralPath $nodeExecutable -PathType Leaf)) {
    $systemNode = Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -First 1
    $systemVersion = $null
    if ($null -ne $systemNode) {
        $systemVersion = (& $systemNode.Source --version).Trim()
    }

    if ($systemVersion -eq $expectedNode) {
        $nodeExecutable = $systemNode.Source
        $nodeHome = Split-Path -Parent $nodeExecutable
        $npmCommand = Join-Path $nodeHome "npm.cmd"
        Write-Host "Using the exact Node.js version already available: $expectedNode"
    }
    else {
        if (Test-Path -LiteralPath $nodeHome) {
            throw "The project Node.js folder exists but does not contain a usable node.exe: $nodeHome"
        }

        New-Item -ItemType Directory -Path $toolRoot -Force | Out-Null
        $tempRoot = [System.IO.Path]::GetFullPath($env:TEMP).TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
        $archivePath = Join-Path $tempRoot ("roco-node-$expectedVersion-$([guid]::NewGuid().ToString('N')).zip")
        $stagingPath = Join-Path $toolRoot (".node-download-$([guid]::NewGuid().ToString('N'))")
        $archiveUrl = [string]$manifest.node.windowsX64.url
        $expectedHash = ([string]$manifest.node.windowsX64.sha256).ToLowerInvariant()
        try {
            New-Item -ItemType Directory -Path $stagingPath | Out-Null
            Write-Host "Downloading the pinned Node.js archive from nodejs.org."
            Invoke-WebRequest -Uri $archiveUrl -OutFile $archivePath -UseBasicParsing
            $actualHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
            if ($actualHash -ne $expectedHash) {
                throw "The Node.js archive SHA-256 did not match build-toolchain.json."
            }
            Expand-Archive -LiteralPath $archivePath -DestinationPath $stagingPath
            $stagedNodeHome = Join-Path $stagingPath "node-v$expectedVersion-win-x64"
            if (-not (Test-Path -LiteralPath (Join-Path $stagedNodeHome "node.exe") -PathType Leaf) -or
                -not (Test-Path -LiteralPath (Join-Path $stagedNodeHome "npm.cmd") -PathType Leaf)) {
                throw "The pinned Node.js archive did not contain the expected executable and npm entry point."
            }
            if (Test-Path -LiteralPath $nodeHome) {
                throw "The project Node.js destination appeared during extraction; it was preserved: $nodeHome"
            }
            [System.IO.Directory]::Move($stagedNodeHome, $nodeHome)
        }
        finally {
            if (Test-Path -LiteralPath $archivePath) {
                $resolvedArchive = [System.IO.Path]::GetFullPath($archivePath)
                if (-not $resolvedArchive.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
                    throw "Refusing to remove an archive outside the temporary directory."
                }
                Remove-Item -LiteralPath $resolvedArchive -Force
            }
            if (Test-Path -LiteralPath $stagingPath) {
                $resolvedStaging = [System.IO.Path]::GetFullPath($stagingPath)
                $toolRootPrefix = [System.IO.Path]::GetFullPath($toolRoot).TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
                if (-not $resolvedStaging.StartsWith($toolRootPrefix, [System.StringComparison]::OrdinalIgnoreCase) -or
                    -not (Split-Path -Leaf $resolvedStaging).StartsWith(".node-download-", [System.StringComparison]::OrdinalIgnoreCase)) {
                    throw "Refusing to remove staging data outside this task's temporary tool folder."
                }
                Remove-Item -LiteralPath $resolvedStaging -Recurse -Force
            }
        }
    }
}

if (-not (Test-Path -LiteralPath $nodeExecutable -PathType Leaf)) {
    throw "Node.js $expectedNode is unavailable after toolchain resolution."
}
if (-not (Test-Path -LiteralPath $npmCommand -PathType Leaf)) {
    throw "The matching npm.cmd was not found beside the selected Node.js executable."
}

$actualVersion = (& $nodeExecutable --version).Trim()
if ($actualVersion -ne $expectedNode) {
    throw "Expected Node.js $expectedNode, received $actualVersion."
}

$env:ROCO_GUIDE_NODE_EXE = $nodeExecutable
$env:ROCO_GUIDE_NPM_CMD = $npmCommand
$env:PATH = "$nodeHome;$env:PATH"
Write-Host "Node.js $actualVersion is ready at $nodeHome."

if ($InstallDependencies) {
    Write-Host "Installing the exact locked project dependencies with npm ci."
    Push-Location $repositoryRoot
    try {
        & $npmCommand ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) {
            throw "npm ci exited with code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }
}
