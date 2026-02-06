Param(
  [string]$Branch = "main",
  [string]$Remote = "origin"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "[1/7] Checking Git working tree..."
$hasUnstaged = (git status --porcelain)
if ($hasUnstaged) {
  Write-Error "Working tree is not clean. Commit or stash changes before deploying."
}

Write-Host "[2/7] Pulling latest code..."
git pull --ff-only $Remote $Branch

Write-Host "[3/7] Installing frontend dependencies..."
Push-Location frontend
npm ci --include=dev

Write-Host "[4/7] Building frontend..."
npm run build
Pop-Location

Write-Host "[5/7] Checking Docker Compose command..."
$composeCmd = $null
try {
  docker compose version | Out-Null
  $composeCmd = "docker compose"
} catch {
  try {
    docker-compose version | Out-Null
    $composeCmd = "docker-compose"
  } catch {
    Write-Error "Neither 'docker compose' nor 'docker-compose' is available."
  }
}

Write-Host "[6/7] Rebuilding and starting services..."
if ($composeCmd -eq "docker compose") {
  docker compose up -d --build
  docker compose ps
} else {
  docker-compose up -d --build
  docker-compose ps
}

Write-Host "[7/7] Health check..."
try {
  $resp = Invoke-WebRequest -Uri "http://127.0.0.1/api/health" -UseBasicParsing -TimeoutSec 10
  Write-Host "Health check status: $($resp.StatusCode)"
} catch {
  Write-Warning "Health check failed. Check container logs."
}

Write-Host "Local deploy finished."
