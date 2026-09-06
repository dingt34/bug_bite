param(
  [string]$EnvironmentId = 'cloudbase-d1ggskwel61500f0e',
  [string]$CloudBaseApiKey = $env:RECOGNITION_CLOUDBASE_API_KEY,
  [string]$BioClipApiKey = $env:BIOCLIP_API_KEY,
  [string]$BioClipUrl = 'http://127.0.0.1:8000'
)

$ErrorActionPreference = 'Stop'

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

$env:RECOGNITION_CLOUDBASE_ENV = $EnvironmentId
$env:RECOGNITION_CLOUDBASE_API_KEY = $CloudBaseApiKey
$env:BIOCLIP_API_URL = $BioClipUrl
$env:BIOCLIP_API_KEY = $BioClipApiKey

Set-Location $PSScriptRoot
node worker.js
