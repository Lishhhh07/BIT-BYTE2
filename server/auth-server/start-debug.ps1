# PowerShell script to start server with debug mode (Windows)
$env:DEBUG = "express:*,mongo*"
Write-Host "🔍 Debug mode enabled: $env:DEBUG" -ForegroundColor Green
Write-Host "Starting server with Express and MongoDB debug logs..." -ForegroundColor Yellow
node server.js

