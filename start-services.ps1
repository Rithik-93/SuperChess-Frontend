# SuperChess Backend Services Startup Script

Write-Host "=== SuperChess Backend Services ===" -ForegroundColor Green

# Build both services first
Write-Host "Building API Gateway..." -ForegroundColor Yellow
go build .\services\api-gateway\
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build API Gateway" -ForegroundColor Red
    exit 1
}

Write-Host "Building Game Arena..." -ForegroundColor Yellow
go build .\services\game-arena\
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build Game Arena" -ForegroundColor Red
    exit 1
}

Write-Host "Starting API Gateway on port 3000..." -ForegroundColor Green
Start-Process -FilePath "go" -ArgumentList "run", ".\services\api-gateway\" -WorkingDirectory $PWD -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "Starting Game Arena WebSocket server on port 8080..." -ForegroundColor Green
Start-Process -FilePath "go" -ArgumentList "run", ".\services\game-arena\" -WorkingDirectory $PWD -WindowStyle Normal

Write-Host ""
Write-Host "Services started!" -ForegroundColor Green
Write-Host "API Gateway: http://localhost:3000" -ForegroundColor Cyan
Write-Host "WebSocket Server: ws://localhost:8080/ws" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to stop services..." -ForegroundColor Yellow
Read-Host

# Kill the processes (you might need to do this manually)
Write-Host "Please manually close the service windows or use Ctrl+C in each terminal" -ForegroundColor Yellow
