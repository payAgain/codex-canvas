$ErrorActionPreference = 'Stop'
$canvasProject = Split-Path -Parent $PSScriptRoot
Push-Location $canvasProject
try {
  if (-not (Test-Path -LiteralPath 'node_modules/typescript/bin/tsc')) {
    pnpm install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
  }
  pnpm build
  if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
  node dist/server.mjs --serve
} finally { Pop-Location }
