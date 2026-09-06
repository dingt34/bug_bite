param(
  [string]$ApiKey = $env:BIOCLIP_API_KEY,
  [int]$Port = 8000
)

$ErrorActionPreference = 'Stop'
$serviceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $serviceRoot
$python = Join-Path $projectRoot '.venv-bioclip\Scripts\python.exe'

if (-not (Test-Path -LiteralPath $python)) {
  throw '.venv-bioclip was not found. Install the BioCLIP Python environment first.'
}
if ([string]::IsNullOrWhiteSpace($ApiKey)) {
  throw 'Provide the service key with -ApiKey or BIOCLIP_API_KEY.'
}

$env:BIOCLIP_API_KEY = $ApiKey
$env:BIOCLIP_DEVICE = 'cuda'
Set-Location $serviceRoot
& $python -m uvicorn app:app --host 127.0.0.1 --port $Port --workers 1
