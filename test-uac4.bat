@echo off
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo Elevating...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', '\"\"\"%~f0\"\"\"' -Verb RunAs"
    exit /b
)
echo I am admin!
pause
