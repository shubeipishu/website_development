@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0..\..\"
set "APP_URL=http://127.0.0.1:8080/apps/graph-platform/index.html"

:: Set Title and Color
title Graph Platform Server
color 0B
cls

echo.
echo  ==========================================================================
echo.
echo    ________  ________  ________  ________  ___  ___      
echo   ^|\   ____\^|\   __  \^|\   __  \^|\   __  \^|\  \^|\  \     
echo   \ \  \___^|\ \  \^|\  \ \  \^|\  \ \  \^|\  \ \  \\\  \    
echo    \ \  \  __\ \   _  _\ \   __  \ \   ____\ \   __  \   
echo     \ \  \^|\  \ \  \\  \\ \  \ \  \ \  \___^|\ \  \ \  \  
echo      \ \______\ \__\\ _\\ \__\ \__\ \__\    \ \__\ \__\ 
echo       ^|_______^|^|__^|^|__^|^|__^|^|__^|^|__^|     ^|__^|^|__^| 
echo.


echo                       PLATFORM v6.1
echo.

echo  ==========================================================================
echo.

:: ---------------------------------------------------------
:: 1. Try Virtual Environment Python (..\.venv)
:: ---------------------------------------------------------
if not exist ".\.venv\Scripts\python.exe" goto CheckNode
echo.

echo  [+] Found local virtual environment (.venv).
echo  [+] Starting http.server...
echo  [+] Launching in 3 seconds...
timeout /t 3 /nobreak >nul
echo  [+] Opening browser at %APP_URL%
echo.
start %APP_URL%
"..\.venv\Scripts\python.exe" -m http.server 8080
goto End

:: ---------------------------------------------------------
:: 2. Try Global Node.js
:: ---------------------------------------------------------
:CheckNode
where node >nul 2>nul
if %errorlevel% neq 0 goto CheckPython
echo.

echo  [+] Node.js detected.
echo  [+] Starting http-server...
echo  [+] Launching in 3 seconds...
timeout /t 3 /nobreak >nul
echo  [+] Opening browser at %APP_URL%
echo.
start %APP_URL%
call npx http-server . -p 8080 -c-1 --cors
goto End

:: ---------------------------------------------------------
:: 3. Try Global Python
:: ---------------------------------------------------------
:CheckPython
where python >nul 2>nul
if %errorlevel% neq 0 goto FallbackPS
echo.

echo  [+] Global Python detected.
echo  [+] Starting http.server...
echo  [+] Launching in 3 seconds...
timeout /t 3 /nobreak >nul
echo  [+] Opening browser at %APP_URL%
echo.
start %APP_URL%
python -m http.server 8080
goto End

:: ---------------------------------------------------------
:: 4. Fallback: PowerShell
:: ---------------------------------------------------------
:FallbackPS
echo.

echo  [!] Neither Node.js nor Python was found.
echo  [+] Starting built-in Windows PowerShell server...
echo  [+] Opening browser at %APP_URL%
echo.

echo  (Close this window to stop the server)
echo.

set "PS_SCRIPT=%TEMP%\simple_server_%RANDOM%.ps1"
if exist "%PS_SCRIPT%" del "%PS_SCRIPT%"

:: Write PS script line by line (Safest method)
echo $port = 8080 >> "%PS_SCRIPT%"
echo $root = Get-Location >> "%PS_SCRIPT%"
echo $listener = New-Object System.Net.HttpListener >> "%PS_SCRIPT%"
echo $listener.Prefixes.Add("http://+:$port/") >> "%PS_SCRIPT%"
echo $listener.Start() >> "%PS_SCRIPT%"
echo Write-Host "Server listening on http://localhost:$port" >> "%PS_SCRIPT%"
echo Start-Process "http://localhost:$port/apps/graph-platform/index.html" >> "%PS_SCRIPT%"
echo while ($listener.IsListening) { >> "%PS_SCRIPT%"
echo     $context = $listener.GetContext() >> "%PS_SCRIPT%"
echo     $response = $context.Response >> "%PS_SCRIPT%"
echo     $path = $root.Path + $context.Request.Url.LocalPath.Replace('/', '\') >> "%PS_SCRIPT%"
echo     if (Test-Path $path -PathType Container) { $path = Join-Path $path "index.html" } >> "%PS_SCRIPT%"
echo     if (Test-Path $path -PathType Leaf) { >> "%PS_SCRIPT%"
echo         $bytes = [System.IO.File]::ReadAllBytes($path) >> "%PS_SCRIPT%"
echo         $response.ContentLength64 = $bytes.Length >> "%PS_SCRIPT%"
echo         $response.OutputStream.Write($bytes, 0, $bytes.Length) >> "%PS_SCRIPT%"
echo     } else { $response.StatusCode = 404 } >> "%PS_SCRIPT%"
echo     $response.Close() >> "%PS_SCRIPT%"
echo } >> "%PS_SCRIPT%"

PowerShell -ExecutionPolicy Bypass -File "%PS_SCRIPT%"
if exist "%PS_SCRIPT%" del "%PS_SCRIPT%"
goto End

:End
pause
