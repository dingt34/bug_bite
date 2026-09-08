param(
  [string]$Python = 'C:\Users\hwj07\AppData\Local\Programs\Python\Python311\python.exe',
  [switch]$KeepExisting
)

$ErrorActionPreference = 'Stop'
$serviceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $serviceRoot
$venvRoot = Join-Path $projectRoot '.venv-bioclip'
$venvPython = Join-Path $venvRoot 'Scripts\python.exe'
$requirements = Join-Path $serviceRoot 'requirements.txt'
$testRequirements = Join-Path $serviceRoot 'requirements-test.txt'

if (-not (Test-Path -LiteralPath $Python -PathType Leaf)) {
  throw "Python 3.11 was not found at $Python"
}
if ((Test-Path -LiteralPath $venvRoot) -and -not $KeepExisting) {
  $resolvedProject = (Resolve-Path -LiteralPath $projectRoot).Path
  $resolvedVenv = (Resolve-Path -LiteralPath $venvRoot).Path
  if (-not $resolvedVenv.StartsWith($resolvedProject + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Refusing to remove a virtual environment outside the project.'
  }
  Remove-Item -LiteralPath $resolvedVenv -Recurse -Force
}
if (-not (Test-Path -LiteralPath $venvPython -PathType Leaf)) {
  & $Python -m venv $venvRoot
}

& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install --requirement $requirements
& $venvPython -m pip install --requirement $testRequirements
& $venvPython -c "import torch, bioclip, fastapi, uvicorn, PIL; assert torch.cuda.is_available(); print('BioCLIP environment ready:', torch.__version__, torch.cuda.get_device_name(0))"
