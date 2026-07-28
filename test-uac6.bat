@echo off
net session >nul 2>&1
if %errorlevel% EQU 0 goto :runScript

echo Elevating...
mshta vbscript:createobject("shell.application").shellexecute("%~s0","","","runas",1)(window.close)
exit /B

:runScript
echo I am admin!
pause
