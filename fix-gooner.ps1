
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$host.UI.RawUI.WindowTitle = 'Gooner Fix Script'

Write-Host "========================================" -Fore Cyan
Write-Host "  Gooner Ultimate Fix Script v5" -Fore Cyan
Write-Host "========================================" -Fore Cyan
Write-Host ""

# --- 1. Kill ---
Write-Host "[1/4] Killing Gooner processes..." -Fore Yellow
Get-Process -EA SilentlyContinue |
    Where-Object { $_.Name -match 'Gooner|electron' } |
    Stop-Process -Force -EA SilentlyContinue
Start-Sleep 1

# --- 2. Paths ---
$gdir  = Join-Path $env:APPDATA "gooner"
$cfg   = Join-Path $gdir "config.json"
$pdir  = Join-Path $gdir "profiles"
$pfile = Join-Path $gdir "profiles.json"
$exe   = Join-Path $PSScriptRoot "Gooner.exe"

if (-not (Test-Path $pfile)) {
    Write-Host "[2/4] First run detected, generating config..." -Fore Yellow
    if (Test-Path $exe) {
        Start-Process $exe
        Start-Sleep 5
        Get-Process -EA SilentlyContinue |
            Where-Object { $_.Name -match 'Gooner|electron' } |
            Stop-Process -Force -EA SilentlyContinue
        Start-Sleep 1
    } else {
        Write-Host "ERROR: Gooner.exe not found next to this script!" -Fore Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "[2/4] Config directory found." -Fore Green
}

# --- 3. Patch ---
Write-Host "[3/4] Patching config files..." -Fore Yellow

function Patch-JsonFile($filePath) {
    if (-not (Test-Path $filePath)) { return }
    $content = [IO.File]::ReadAllText($filePath)
    $changed = $false

    if ($content -match '"silentMode"\s*:\s*true') {
        $content = $content -replace '"silentMode"\s*:\s*true', '"silentMode": false'
        $changed = $true
    }
    if ($content -match '"hardcoreMode"\s*:\s*true') {
        $content = $content -replace '"hardcoreMode"\s*:\s*true', '"hardcoreMode": false'
        $changed = $true
    }
    if ($content -match '"x"\s*:\s*-\d+') {
        $content = $content -replace '"x"\s*:\s*-\d+', '"x": 100'
        $changed = $true
    }
    if ($content -match '"y"\s*:\s*-\d+') {
        $content = $content -replace '"y"\s*:\s*-\d+', '"y": 100'
        $changed = $true
    }

    if ($changed) {
        $utf8 = New-Object Text.UTF8Encoding($false)
        [IO.File]::WriteAllText($filePath, $content, $utf8)
        Write-Host "    Fixed: $(Split-Path $filePath -Leaf)" -Fore Green
    }
}

Patch-JsonFile $cfg
if (Test-Path $pdir) {
    Get-ChildItem $pdir -Filter "*.json" | ForEach-Object {
        Patch-JsonFile $_.FullName
    }
}

# --- 4. Restart ---
Write-Host "[4/4] Restarting Gooner..." -Fore Yellow
if (Test-Path $exe) {
    Start-Process $exe
    Write-Host "    Gooner launched!" -Fore Green
} else {
    Write-Host "    Done. Please launch Gooner.exe manually." -Fore Yellow
}

Write-Host ""
Write-Host "========================================" -Fore Cyan
Write-Host "  All done! Closing in 3 seconds..." -Fore Cyan
Write-Host "========================================" -Fore Cyan
Start-Sleep 3
