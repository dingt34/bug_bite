param(
  [string]$CredentialPath = (Join-Path $env:LOCALAPPDATA 'BugBiteRecognition\cloudbase-key.dpapi'),
  [string]$EnvironmentId = 'cloudbase-d1ggskwel61500f0e'
)

$ErrorActionPreference = 'Stop'
$workerRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $workerRoot
$startScript = Join-Path $projectRoot 'start-auto-recognition.ps1'
$stateRoot = Split-Path -Parent $CredentialPath
$logPath = Join-Path $stateRoot 'recognition.log'
$previousLogPath = Join-Path $stateRoot 'recognition.previous.log'

if (-not (Test-Path -LiteralPath $CredentialPath -PathType Leaf)) {
  throw 'Encrypted CloudBase credential was not found. Run recognition-worker\install-autostart.ps1.'
}
if (-not (Test-Path -LiteralPath $startScript -PathType Leaf)) {
  throw 'Recognition startup script was not found.'
}
if ((Test-Path -LiteralPath $logPath) -and (Get-Item -LiteralPath $logPath).Length -gt 5MB) {
  Move-Item -LiteralPath $logPath -Destination $previousLogPath -Force
}

$protectedBytes = [Convert]::FromBase64String((Get-Content -LiteralPath $CredentialPath -Raw))
$plainBytes = $null
try {
  Add-Type -AssemblyName System.Security
  $plainBytes = [Security.Cryptography.ProtectedData]::Unprotect(
    $protectedBytes,
    $null,
    [Security.Cryptography.DataProtectionScope]::CurrentUser
  )
  $cloudBaseApiKey = [Text.Encoding]::UTF8.GetString($plainBytes)
  [IO.File]::AppendAllText($logPath, "`r`n[$([DateTime]::Now.ToString('s'))] recognition autostart`r`n", [Text.Encoding]::UTF8)
  & $startScript -EnvironmentId $EnvironmentId -CloudBaseApiKey $cloudBaseApiKey *>> $logPath
} catch {
  [IO.File]::AppendAllText($logPath, "[$([DateTime]::Now.ToString('s'))] $($_.Exception.Message)`r`n", [Text.Encoding]::UTF8)
  throw
} finally {
  $cloudBaseApiKey = $null
  if ($plainBytes) { [Array]::Clear($plainBytes, 0, $plainBytes.Length) }
  if ($protectedBytes) { [Array]::Clear($protectedBytes, 0, $protectedBytes.Length) }
}
