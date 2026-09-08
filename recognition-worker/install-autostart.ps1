param(
  [string]$TaskName = 'BugBite-BioCLIP-Recognition',
  [string]$EnvironmentId = 'cloudbase-d1ggskwel61500f0e',
  [switch]$ReuseCredential
)

$ErrorActionPreference = 'Stop'
$workerRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$runner = Join-Path $workerRoot 'autostart-recognition.ps1'
$stateRoot = Join-Path $env:LOCALAPPDATA 'BugBiteRecognition'
$credentialPath = Join-Path $stateRoot 'cloudbase-key.dpapi'
$bootstrapPath = Join-Path $stateRoot 'autostart-bootstrap.ps1'
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$powershellPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$systemWorkingDirectory = Join-Path $env:SystemRoot 'System32'

if (-not (Test-Path -LiteralPath $runner -PathType Leaf)) {
  throw 'Autostart runner was not found.'
}

$encryptedKey = $null
if ($ReuseCredential) {
  if (-not (Test-Path -LiteralPath $credentialPath -PathType Leaf)) {
    throw 'There is no encrypted credential to reuse.'
  }
  $encryptedKey = Get-Content -LiteralPath $credentialPath -Raw
} else {
  $secureKey = Read-Host 'Paste the CloudBase server API key to encrypt for Windows autostart' -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
  $plainBytes = $null
  $protectedBytes = $null
  try {
    Add-Type -AssemblyName System.Security
    $plainText = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    if ([string]::IsNullOrWhiteSpace($plainText)) {
      throw 'CloudBase server API key is required.'
    }
    $plainBytes = [Text.Encoding]::UTF8.GetBytes($plainText)
    $protectedBytes = [Security.Cryptography.ProtectedData]::Protect(
      $plainBytes,
      $null,
      [Security.Cryptography.DataProtectionScope]::CurrentUser
    )
    $encryptedKey = [Convert]::ToBase64String($protectedBytes)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    $plainText = $null
    if ($plainBytes) { [Array]::Clear($plainBytes, 0, $plainBytes.Length) }
    if ($protectedBytes) { [Array]::Clear($protectedBytes, 0, $protectedBytes.Length) }
  }
}

New-Item -ItemType Directory -Path $stateRoot -Force | Out-Null
Set-Content -LiteralPath $credentialPath -Value $encryptedKey -Encoding Ascii -NoNewline

$runnerLiteral = $runner.Replace("'", "''")
$credentialLiteral = $credentialPath.Replace("'", "''")
$environmentLiteral = $EnvironmentId.Replace("'", "''")
$bootstrap = "& '$runnerLiteral' -CredentialPath '$credentialLiteral' -EnvironmentId '$environmentLiteral'"
Set-Content -LiteralPath $bootstrapPath -Value $bootstrap -Encoding Unicode

$arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$bootstrapPath`""
$action = New-ScheduledTaskAction -Execute $powershellPath -Argument $arguments -WorkingDirectory $systemWorkingDirectory
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
$principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -RestartCount 999 `
  -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit ([TimeSpan]::Zero) `
  -MultipleInstances IgnoreNew

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Principal $principal `
  -Settings $settings `
  -Description 'Starts and supervises Bug Bite BioCLIP recognition after Windows sign-in.' `
  -Force | Out-Null

Write-Host "Autostart installed: $TaskName"
Write-Host "Encrypted credential: $credentialPath"
Write-Host "ASCII bootstrap: $bootstrapPath"
Write-Host 'The task will start automatically at the next Windows sign-in.'
