param([int]$Port = 8000)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$serviceScript = Join-Path $projectRoot 'bioclip-service\run-local.ps1'

Write-Host 'Starting local BioCLIP 2 demo...'
Write-Host 'Keep this window open while demonstrating the Mini Program.'
& $serviceScript -Port $Port
