param(
  [string]$ApiKey = 'local-bioclip-deployment-key',
  [int]$Port = 8000
)

$ErrorActionPreference = 'Stop'
$serviceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $serviceRoot
$python = Join-Path $projectRoot '.venv-bioclip\Scripts\python.exe'

if (-not (Test-Path -LiteralPath $python)) {
  throw '.venv-bioclip was not found. Run bioclip-service\install-local.ps1 first.'
}
$env:BIOCLIP_API_KEY = $ApiKey
$env:BIOCLIP_DEVICE = 'cuda'
Set-Location $serviceRoot
& $python -m uvicorn app:app --host 127.0.0.1 --port $Port --workers 1
