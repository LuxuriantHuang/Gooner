@echo off
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo Elevating...
    mshta vbscript:createobject("shell.application").shellexecute("""%~f0""","","","runas",1)(window.close)&exit /b
)
echo I am admin!
pause
