param(
  [string]$TaskName = 'BugBite-BioCLIP-Recognition',
  [switch]$KeepLogs
)

$ErrorActionPreference = 'Stop'
$stateRoot = Join-Path $env:LOCALAPPDATA 'BugBiteRecognition'
$credentialPath = Join-Path $stateRoot 'cloudbase-key.dpapi'

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
  Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}
if (Test-Path -LiteralPath $credentialPath) {
  Remove-Item -LiteralPath $credentialPath -Force
}
if (-not $KeepLogs -and (Test-Path -LiteralPath $stateRoot)) {
  Remove-Item -LiteralPath $stateRoot -Recurse -Force
}

Write-Host "Autostart removed: $TaskName"
