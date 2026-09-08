param(
  [string]$EnvironmentId = 'cloudbase-d1ggskwel61500f0e',
  [string]$CloudBaseApiKey = $env:RECOGNITION_CLOUDBASE_API_KEY,
  [string]$BioClipApiKey = $env:BIOCLIP_API_KEY,
  [string]$BioClipUrl = 'http://127.0.0.1:8000'
)

$ErrorActionPreference = 'Stop'
$workerRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $workerRoot
$python = Join-Path $projectRoot '.venv-bioclip\Scripts\python.exe'

function Read-SecretText([string]$PromptText) {
  $secureValue = Read-Host $PromptText -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

if ([string]::IsNullOrWhiteSpace($CloudBaseApiKey)) {
  $CloudBaseApiKey = Read-SecretText 'Paste the CloudBase server API key'
}
if ([string]::IsNullOrWhiteSpace($CloudBaseApiKey)) {
  throw 'CloudBase server API key is required.'
}
if ([string]::IsNullOrWhiteSpace($BioClipApiKey)) {
  $BioClipApiKey = 'local-bioclip-deployment-key'
}
if (-not (Test-Path -LiteralPath $python)) {
  throw 'BioCLIP Python environment is missing. Run bioclip-service\install-local.ps1 first.'
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js 18 or newer is required.'
}

$env:RECOGNITION_CLOUDBASE_ENV = $EnvironmentId
$env:RECOGNITION_CLOUDBASE_API_KEY = $CloudBaseApiKey
$env:BIOCLIP_API_URL = $BioClipUrl
$env:BIOCLIP_API_KEY = $BioClipApiKey

Set-Location $workerRoot
node supervisor.js
