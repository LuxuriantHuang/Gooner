@echo off
setlocal
cd /d "%~dp0"
title Gooner Fix

net session >nul 2>&1
if %errorlevel% EQU 0 goto :hasAdmin
mshta vbscript:createobject("shell.application").shellexecute("%~s0","","","runas",1)(window.close)
exit /B

:hasAdmin
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix-gooner.ps1"
if %errorlevel% NEQ 0 pause
