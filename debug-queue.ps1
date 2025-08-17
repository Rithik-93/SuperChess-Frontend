# Debug script to check queue and database state
Write-Host "=== SuperChess Debug Script ===" -ForegroundColor Green

# Start the API Gateway service
Write-Host "Starting API Gateway service..." -ForegroundColor Yellow
Start-Process -FilePath "go" -ArgumentList "run", ".\services\api-gateway\" -WorkingDirectory "D:\SuperChess-Backend" -NoNewWindow

Write-Host "Service started. Test your queue endpoints now." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop when done." -ForegroundColor Yellow

# Wait for user input
Read-Host "Press Enter to stop the service"


