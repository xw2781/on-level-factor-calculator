Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$pythonExe = Join-Path $repoRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
    throw "Missing .venv\Scripts\python.exe. Create the virtual environment and install requirements first."
}

$nodeCandidates = New-Object System.Collections.Generic.List[string]

if ($env:NODE_EXE) {
    $nodeCandidates.Add($env:NODE_EXE)
}

$nodeOnPath = Get-Command node.exe -ErrorAction SilentlyContinue
if ($nodeOnPath) {
    $nodeCandidates.Add($nodeOnPath.Source)
}

$nodeOnPathFallback = Get-Command node -ErrorAction SilentlyContinue
if ($nodeOnPathFallback) {
    $nodeCandidates.Add($nodeOnPathFallback.Source)
}

$nodeCandidates.Add((Join-Path $repoRoot "node-portable\node.exe"))
$nodeCandidates.Add((Join-Path $repoRoot "frontend\node-portable\node.exe"))
$nodeCandidates.Add((Join-Path $env:USERPROFILE "Documents\Web UI\node-portable\node.exe"))
$nodeCandidates.Add((Join-Path ([Environment]::GetFolderPath("MyDocuments")) "Web UI\node-portable\node.exe"))

$nodeExe = $null
foreach ($candidate in $nodeCandidates) {
    if (Test-Path $candidate) {
        $nodeExe = $candidate
        break
    }
}

if (-not $nodeExe) {
    throw "Could not find node.exe. Set NODE_EXE or install a Node runtime before building a release."
}

$viteEntry = Join-Path $repoRoot "frontend\node_modules\vite\bin\vite.js"
$tscEntry = Join-Path $repoRoot "frontend\node_modules\typescript\bin\tsc"
$frontendDir = Join-Path $repoRoot "frontend"

if (-not (Test-Path $viteEntry) -or -not (Test-Path $tscEntry)) {
    throw "Missing frontend build dependencies. Run 'npm install' inside the frontend directory first."
}

Push-Location $frontendDir
try {
    & $nodeExe $tscEntry -b
    if ($LASTEXITCODE -ne 0) {
        throw "TypeScript build failed."
    }

    & $nodeExe $viteEntry build
    if ($LASTEXITCODE -ne 0) {
        throw "Vite build failed."
    }
}
finally {
    Pop-Location
}

& $pythonExe -m PyInstaller --noconfirm --clean olep_calculator.spec
if ($LASTEXITCODE -ne 0) {
    throw "PyInstaller build failed."
}

$version = & $pythonExe -c "from backend.version import __version__; print(__version__)"
if ($LASTEXITCODE -ne 0) {
    throw "Could not read backend version."
}

$releaseRoot = Join-Path $repoRoot "dist\release"
$releaseFolder = Join-Path $releaseRoot "OLEP-Calculator-$version-windows"
$zipPath = Join-Path $releaseRoot "OLEP-Calculator-$version-windows.zip"

if (Test-Path $releaseFolder) {
    Remove-Item -LiteralPath $releaseFolder -Recurse -Force
}
if (Test-Path $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}

New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null
New-Item -ItemType Directory -Path $releaseFolder -Force | Out-Null
Copy-Item -Path (Join-Path $repoRoot "dist\OLEP Calculator\*") -Destination $releaseFolder -Recurse
Copy-Item -Path (Join-Path $repoRoot "README.md") -Destination (Join-Path $releaseFolder "README.md")

Compress-Archive -Path (Join-Path $releaseFolder "*") -DestinationPath $zipPath -Force

Write-Host "Release package created:"
Write-Host $zipPath
