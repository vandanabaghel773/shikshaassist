Write-Host "Starting Python Microservice..."

# Move to your Python microservice directory
Set-Location "C:\Users\Ashish\Desktop\new - copy\python_service"

# Activate virtual environment
& "C:\Users\Ashish\Desktop\new - copy\python_service\venv\Scripts\Activate.ps1"

# Start Uvicorn (Gunicorn is tricky on Windows, Uvicorn is easier)
Start-Process -NoNewWindow -FilePath "uvicorn" -ArgumentList "main:app --host 127.0.0.1 --port 8000"

Write-Host "Python Microservice started!"

# Move to your Node.js backend directory
Set-Location "C:\Users\Ashish\Desktop\new - copy"

Write-Host "Starting Node.js Backend..."

# Start Node.js app
Start-Process -NoNewWindow -FilePath "node" -ArgumentList "server.js"

Write-Host "Node.js Backend started!"
