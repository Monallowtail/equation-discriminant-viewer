$ErrorActionPreference = "Stop"

$project = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

if (-not (Test-Path $python)) {
  Write-Error "Bundled Python was not found: $python"
}

Set-Location $project
Write-Host "Preview server: http://127.0.0.1:8000/"
Write-Host "Press Ctrl+C to stop."
& $python -m http.server 8000 --bind 127.0.0.1
