const { app, nativeImage, screen } = require('electron');
const { spawn, exec } = require('node:child_process');
const fsp = require('node:fs/promises');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');
const { imageSize } = require('image-size');

const execAsync = promisify(exec);

const DESKTOP_WALLPAPER_HELPER_PS = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
namespace DCW {
    public class W {
        public enum DESKTOP_WALLPAPER_POSITION { Center = 0, Tile = 1, Stretch = 2, Fit = 3, Fill = 4, Span = 5 }
        [StructLayout(LayoutKind.Sequential)]
        public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
        [ComImport, Guid("B92B56A9-8B55-4E14-9A89-0199BBB6F93B"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        public interface IDesktopWallpaper {
            void SetWallpaper([MarshalAs(UnmanagedType.LPWStr)] string monitorID, [MarshalAs(UnmanagedType.LPWStr)] string wallpaper);
            [return: MarshalAs(UnmanagedType.LPWStr)] string GetWallpaper([MarshalAs(UnmanagedType.LPWStr)] string monitorID);
            [return: MarshalAs(UnmanagedType.LPWStr)] string GetMonitorDevicePathAt(uint monitorIndex);
            [return: MarshalAs(UnmanagedType.U4)] uint GetMonitorDevicePathCount();
            void GetMonitorRECT([MarshalAs(UnmanagedType.LPWStr)] string monitorID, out RECT displayRect);
            void SetBackgroundColor(uint color);
            [return: MarshalAs(UnmanagedType.U4)] uint GetBackgroundColor();
            void SetPosition(DESKTOP_WALLPAPER_POSITION position);
            DESKTOP_WALLPAPER_POSITION GetPosition();
        }
        [ComImport, Guid("C2CF3110-460E-4fc1-B9D0-8A1C0C9CC4BD")] public class DesktopWallpaperClass { }
        public static string[] List() {
            var w = (IDesktopWallpaper)new DesktopWallpaperClass();
            uint c = w.GetMonitorDevicePathCount();
            DESKTOP_WALLPAPER_POSITION position = w.GetPosition();
            string[] result = new string[c];
            for (uint i = 0; i < c; i++) {
                string p = w.GetMonitorDevicePathAt(i);
                RECT r; w.GetMonitorRECT(p, out r);
                result[i] = p + "|" + r.Left + "|" + r.Top + "|" + (r.Right - r.Left) + "|" + (r.Bottom - r.Top) + "|" + position.ToString().ToLowerInvariant();
            }
            return result;
        }
        public static string Get(string m) { var w = (IDesktopWallpaper)new DesktopWallpaperClass(); return w.GetWallpaper(m); }
        public static void Set(string m, string p) { var w = (IDesktopWallpaper)new DesktopWallpaperClass(); w.SetWallpaper(m, p); }
    }
}
"@

if ($args[0] -eq "list") {
    [DCW.W]::List()
} elseif ($args[0] -eq "get") {
    [DCW.W]::Get($args[1])
} elseif ($args[0] -eq "set") {
    [DCW.W]::Set($args[1], $args[2])
} elseif ($args[0] -eq "disable-focus-dim") {
    $policyPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"
    $key1 = "DisableSearchBoxSuggestions"
    $key2 = "SystemPaneSuggestions"
    foreach ($pair in @(
        @("HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced", "DisableSearchBoxSuggestions", 1),
        @("HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced", "SystemPaneSuggestions", 0),
        @("HKCU:\Software\Microsoft\Windows\CurrentVersion\Search", "SearchboxTaskbarMode", 0),
        @("HKCU:\Software\Microsoft\Windows\CurrentVersion\Search", "BingSearchEnabled", 0),
        @("HKCU:\Software\Policies\Microsoft\Windows\CloudContent", "DisableWindowsSpotlightFeatures", 1),
        @("HKCU:\Software\Policies\Microsoft\Windows\CloudContent", "DisableTailoredExperiencesWithDiagnosticData", 1)
    )) {
        $p = $pair[0]; $n = $pair[1]; $v = $pair[2]
        if (-not (Test-Path $p)) { New-Item -Path $p -Force | Out-Null }
        Set-ItemProperty -Path $p -Name $n -Value $v -Type DWord -Force
    }
    $cur = [Microsoft.Win32.Registry]::CurrentUser
    $deskt = $cur.OpenSubKey("Software\Microsoft\Windows\CurrentVersion\Explorer\PolicyDescriptors", $true)
    if ($deskt) { $deskt.Close() }
    Write-Output "policy:applied"
} elseif ($args[0] -eq "compose") {
    Add-Type -AssemblyName System.Drawing
    $characterPath = $args[1]
    $width = [int]$args[2]
    $height = [int]$args[3]
    $bgColor = $args[4]
    $alignX = $args[5]
    $alignY = $args[6]
    $outputPath = $args[7]
    $gradientTop = $args[8]
    $gradientBottom = $args[9]
    $gradientLeft = $args[10]
    $gradientRight = $args[11]
    $cutTop = $args[12] -eq "1"
    $cutBottom = $args[13] -eq "1"
    $cutLeft = $args[14] -eq "1"
    $cutRight = $args[15] -eq "1"
    $contentLeft = [int]$args[16]
    $contentTop = [int]$args[17]
    $contentRight = [int]$args[18]
    $contentBottom = [int]$args[19]

    $bg = [System.Drawing.ColorTranslator]::FromHtml($bgColor)
    $bitmap = New-Object System.Drawing.Bitmap $width, $height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.Clear($bg)

    if ($bgColor -ne $gradientTop -or $bgColor -ne $gradientBottom) {
        try {
            $topC = [System.Drawing.ColorTranslator]::FromHtml($gradientTop)
            $bottomC = [System.Drawing.ColorTranslator]::FromHtml($gradientBottom)
            $rect = New-Object System.Drawing.Rectangle 0, 0, $width, $height
            $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $topC, $bottomC, [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
            $graphics.FillRectangle($brush, $rect)
            $brush.Dispose()
        } catch {}
    }

    $character = [System.Drawing.Image]::FromFile($characterPath)
    $charW = $character.Width
    $charH = $character.Height
    $padding = 0.05
    $availW = $width * (1 - 2 * $padding)
    $availH = $height * (1 - 2 * $padding)
    $scale = [Math]::Min([double]$availW / $charW, [double]$availH / $charH)
    $contentW = $contentRight - $contentLeft + 1
    $contentH = $contentBottom - $contentTop + 1
    if ($cutLeft -and $cutRight -and $contentW -gt 0) {
      $scale = [Math]::Max($scale, [double]($width + 4) / $contentW)
    }
    if ($cutTop -and $cutBottom -and $contentH -gt 0) {
      $scale = [Math]::Max($scale, [double]($height + 4) / $contentH)
    }
    $drawW = [int]($charW * $scale)
    $drawH = [int]($charH * $scale)
    if ($cutLeft -and $cutRight) {
      $contentCenterX = ($contentLeft + $contentRight + 1) / 2
      $x = [int]($width / 2 - $contentCenterX * $scale)
    } elseif ($cutLeft) {
      $x = [int](-$contentLeft * $scale - 2)
    } elseif ($cutRight) {
      $x = [int]($width - ($contentRight + 1) * $scale + 2)
    } else {
      switch ($alignX) {
        "left"   { $x = [int]($width * $padding) }
        "right"  { $x = $width - [int]($width * $padding) - $drawW }
        default  { $x = [int](($width - $drawW) / 2) }
      }
    }
    if ($cutTop -and $cutBottom) {
      $contentCenterY = ($contentTop + $contentBottom + 1) / 2
      $y = [int]($height / 2 - $contentCenterY * $scale)
    } elseif ($cutTop) {
      $y = [int](-$contentTop * $scale - 2)
    } elseif ($cutBottom) {
      $y = [int]($height - ($contentBottom + 1) * $scale + 2)
    } else {
      switch ($alignY) {
        "top"    { $y = [int]($height * $padding) }
        "bottom" { $y = $height - [int]($height * $padding) - $drawH }
        default  { $y = [int](($height - $drawH) / 2) }
      }
    }
    $graphics.DrawImage($character, $x, $y, $drawW, $drawH)
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    $character.Dispose()
    Write-Output $outputPath
}
`;

function colorFromTotals(totals, fallback = '#202428') {
  if (!totals.weight) return fallback;
  const channel = value => Math.round(value / totals.weight).toString(16).padStart(2, '0');
  return `#${channel(totals.red)}${channel(totals.green)}${channel(totals.blue)}`;
}

function analyzeCharacterBitmap(bitmap, size, options = {}) {
  const width = size.width;
  const height = size.height;
  const alphaThreshold = options.alphaThreshold ?? 30;
  const globalRatioThreshold = options.globalRatioThreshold ?? 0.2;
  const continuousThreshold = Math.max(options.minContinuousPixels ?? 30, Math.round(Math.min(width, height) * 0.03));
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;
  let hasTransparentPixel = false;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = bitmap[(y * width + x) * 4 + 3];
      if (alpha <= alphaThreshold) {
        hasTransparentPixel = true;
      } else {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }

  if (!hasTransparentPixel || right < left || bottom < top) return null;

  const lineStats = points => {
    let opaque = 0;
    let longestRun = 0;
    let run = 0;
    for (const [x, y] of points) {
      if (bitmap[(y * width + x) * 4 + 3] > alphaThreshold) {
        opaque += 1;
        run += 1;
        longestRun = Math.max(longestRun, run);
      } else {
        run = 0;
      }
    }
    const ratio = points.length ? opaque / points.length : 0;
    return { ratio, longestRun, isCut: ratio >= globalRatioThreshold || longestRun >= continuousThreshold };
  };

  const horizontal = Array.from({ length: right - left + 1 }, (_, index) => left + index);
  const vertical = Array.from({ length: bottom - top + 1 }, (_, index) => top + index);
  const edges = {
    top: lineStats(horizontal.map(x => [x, top])),
    bottom: lineStats(horizontal.map(x => [x, bottom])),
    left: lineStats(vertical.map(y => [left, y])),
    right: lineStats(vertical.map(y => [right, y]))
  };

  const totals = {
    global: { red: 0, green: 0, blue: 0, weight: 0 },
    top: { red: 0, green: 0, blue: 0, weight: 0 },
    bottom: { red: 0, green: 0, blue: 0, weight: 0 },
    left: { red: 0, green: 0, blue: 0, weight: 0 },
    right: { red: 0, green: 0, blue: 0, weight: 0 }
  };
  const edgeBand = Math.max(1, Math.round(Math.min(width, height) * 0.08));

  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const offset = (y * width + x) * 4;
      const alpha = bitmap[offset + 3];
      if (alpha <= 10) continue;
      const touchesTransparentPixel = x === 0 || y === 0 || x === width - 1 || y === height - 1 ||
        bitmap[(y * width + x - 1) * 4 + 3] <= alphaThreshold ||
        bitmap[(y * width + x + 1) * 4 + 3] <= alphaThreshold ||
        bitmap[((y - 1) * width + x) * 4 + 3] <= alphaThreshold ||
        bitmap[((y + 1) * width + x) * 4 + 3] <= alphaThreshold;
      if (alpha >= 240 && !touchesTransparentPixel) continue;
      const unpremultiply = channel => alpha < 255 ? Math.min(255, Math.round(channel * 255 / alpha)) : channel;
      const add = target => {
        target.blue += unpremultiply(bitmap[offset]) * alpha;
        target.green += unpremultiply(bitmap[offset + 1]) * alpha;
        target.red += unpremultiply(bitmap[offset + 2]) * alpha;
        target.weight += alpha;
      };
      add(totals.global);
      if (y - top < edgeBand) add(totals.top);
      if (bottom - y < edgeBand) add(totals.bottom);
      if (x - left < edgeBand) add(totals.left);
      if (right - x < edgeBand) add(totals.right);
    }
  }

  const globalColor = colorFromTotals(totals.global);
  return {
    bounds: { left, right, top, bottom },
    edges,
    alignment: {
      x: edges.right.isCut ? 'right' : edges.left.isCut ? 'left' : 'center',
      y: edges.bottom.isCut ? 'bottom' : edges.top.isCut ? 'top' : 'center'
    },
    colors: {
      global: globalColor,
      top: colorFromTotals(totals.top, globalColor),
      bottom: colorFromTotals(totals.bottom, globalColor),
      left: colorFromTotals(totals.left, globalColor),
      right: colorFromTotals(totals.right, globalColor)
    }
  };
}

class DesktopCharacterService {
  constructor({ getConfig }) {
    this.getConfig = getConfig;
    this.timer = null;
    this.nativeHost = null;
    this.nativeHostBuffer = '';
    this.pendingUpdates = new Map();
    this.expectedNativeHostStops = new WeakSet();
    this.wallpaperScriptPath = path.join(app.getPath('userData'), 'desktop-character-helper.ps1');
    this.wallpaperOutputDir = path.join(app.getPath('userData'), 'desktop-character-wallpapers');
    this.wallpaperScriptInitialized = false;
    this.desktopFocused = null;
    this.lastLayerMode = null;
    this.pendingComposes = new Map(); // requestId → { resolve, reject, timeout }
    this.pendingWpSets = new Map();   // requestId → { resolve, reject, timeout }

    // ── 性能计时 ──
    this._perfTimers = {};
    this._cachedImageSizes = null;   // Map<path, {width, height}>
    this._cachedAnalyses = new Map(); // Map<path, analysis> 缓存像素分析结果
  }

  _perfStart(label) { this._perfTimers[label] = Date.now(); }
  _perfEnd(label) {
    if (!this._perfTimers[label]) return;
    const ms = Date.now() - this._perfTimers[label];
    delete this._perfTimers[label];
    console.log(`[DesktopCharacter::perf] ${label}: ${ms}ms`);
    return ms;
  }
  _perfLog(label, ms) { console.log(`[DesktopCharacter::perf] ${label}: ${ms}ms`); }

  getCandidates() {
    this._perfStart('getCandidates');
    const folderPath = this.getConfig().desktopCharacter.folderPath;
    if (!folderPath || !fs.existsSync(folderPath)) return [];

    const candidates = [];
    const pending = [folderPath];
    while (pending.length > 0) {
      const currentPath = pending.pop();
      let entries;
      try {
        entries = fs.readdirSync(currentPath, { withFileTypes: true });
      } catch (_error) {
        continue;
      }
      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) pending.push(entryPath);
        else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.png') candidates.push(entryPath);
      }
    }
    this._perfEnd('getCandidates');
    return candidates;
  }

  pickCharacter(candidates, excludedPaths) {
    this._perfStart('pickCharacter');
    const unused = candidates.filter(candidate => !excludedPaths.has(candidate));
    const pool = unused.length > 0 ? unused : candidates;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    for (const candidate of shuffled) {
      // 优先走缓存 — 分析过的 PNG 不重新计算
      let analysis = this._cachedAnalyses.get(candidate);
      if (!analysis) {
        const image = nativeImage.createFromPath(candidate);
        if (image.isEmpty()) continue;
        const size = image.getSize();
        // Bounds are passed to the wallpaper compositor, which draws the original image.
        // Keep them in the source pixel coordinate space even for large PNGs.
        analysis = analyzeCharacterBitmap(image.toBitmap(), size);
        if (analysis) this._cachedAnalyses.set(candidate, analysis);
      }
      if (analysis) {
        this._perfEnd('pickCharacter');
        return { path: candidate, analysis };
      }
    }
    this._perfEnd('pickCharacter');
    return null;
  }

  // 提前批量预热缓存 — 带异步 yield，不阻塞主事件循环
  async _ensureImageSizeCache(candidates) {
    if (this._cachedImageSizes && this._cachedImageSizes.has(candidates[0])) return;
    const cache = new Map();
    for (let i = 0; i < candidates.length; i++) {
      if (i % 5 === 0) await new Promise(r => setTimeout(r, 0)); // 每 5 文件 yield 一次
      const p = candidates[i];
      try {
        const info = imageSize(p);
        if (info && info.width && info.height) cache.set(p, info);
      } catch (_) { /* skip */ }
    }
    this._cachedImageSizes = cache;
    return cache;
  }

  _getImageSize(path) {
    if (this._cachedImageSizes) return this._cachedImageSizes.get(path) || null;
    try { return imageSize(path); } catch (_) { return null; }
  }

  getNativeHostPath() {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'app.asar.unpacked', 'src', 'native', 'desktop-host.exe');
    }
    return path.join(__dirname, '..', 'native', 'desktop-host.exe');
  }

  startNativeHost() {
    if (this.nativeHost && !this.nativeHost.killed) return;
    this.nativeHostBuffer = '';
    const nativeHost = spawn(this.getNativeHostPath(), [], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    this.nativeHost = nativeHost;
    nativeHost.stdout.setEncoding('utf8');
    nativeHost.stdout.on('data', chunk => {
      if (this.nativeHost === nativeHost) this.handleNativeHostOutput(chunk);
    });
    nativeHost.stderr.setEncoding('utf8');
    nativeHost.stderr.on('data', chunk => {
      if (this.nativeHost === nativeHost) console.error('Desktop native host:', chunk.trim());
    });
    nativeHost.on('error', error => {
      if (this.nativeHost === nativeHost) console.error('Desktop native host failed:', error);
    });
    nativeHost.on('exit', code => {
      if (!this.expectedNativeHostStops.has(nativeHost)) console.error(`Desktop native host exited unexpectedly with code ${code}`);
      if (this.nativeHost === nativeHost) {
        this.nativeHost = null;
        this._rejectPendingNativeRequests('Native host stopped');
      }
    });
  }

  handleNativeHostOutput(chunk) {
    this.nativeHostBuffer += chunk;
    const lines = this.nativeHostBuffer.split(/\r?\n/);
    this.nativeHostBuffer = lines.pop() || '';
    for (const line of lines) {
      const [event, value, nativeDetail] = line.split('\t');
      if (event === 'READY') {
        const updateDetail = this.pendingUpdates.get(value);
        if (updateDetail) console.log(`[DesktopCharacter] Native host updated ${updateDetail} display ${value}; layer ${nativeDetail || 'unknown'}`);
        this.pendingUpdates.delete(value);
      } else if (event === 'FOCUS') {
        const active = value === '1';
        this.desktopFocused = active;
        console.log(`[DesktopCharacter] Desktop focus ${active ? 'active' : 'inactive'}; visible native windows: ${nativeDetail || 0}`);
      } else if (event === 'COMPOSED') {
        const pending = this.pendingComposes.get(value);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingComposes.delete(value);
          const resultPath = nativeDetail
            ? Buffer.from(nativeDetail, 'base64').toString('utf8')
            : null;
          pending.resolve(resultPath);
        }
      } else if (event === 'SETWP_OK' || event === 'SETWPS_OK') {
        const pending = this.pendingWpSets.get(value);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingWpSets.delete(value);
          pending.resolve();
        }
      } else if (event === 'MONITOR') {
        if (this._pendingMonitors) {
          const parts = line.split('\t');
          const extended = parts.length >= 7;
          const x = extended ? parseInt(parts[2], 10) : 0;
          const y = extended ? parseInt(parts[3], 10) : 0;
          const w = parseInt(parts[extended ? 4 : 2], 10);
          const h = parseInt(parts[extended ? 5 : 3], 10);
          if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
            this._pendingMonitors.monitors.push({
              id: parts[1],
              x,
              y,
              width: w,
              height: h,
              position: extended ? parts[6] : 'fill'
            });
          }
        }
      } else if (event === 'MONITORS_END') {
        if (this._pendingMonitors) {
          const p = this._pendingMonitors;
          this._pendingMonitors = null;
          clearTimeout(p.timeout);
          p.resolve(p.monitors);
        }
      } else if (event === 'MINIMIZE_HOLD') {
        console.log(`[DesktopCharacter] Minimized-window wallpaper hold active (${value || 1} window(s)).`);
      } else if (event === 'MINIMIZE_HOLD_END') {
        console.log('[DesktopCharacter] Minimized-window wallpaper hold ended.');
      }
    }
  }

  async initWallpaperScript() {
    if (this.wallpaperScriptInitialized) return;
    try {
      await fsp.mkdir(this.wallpaperOutputDir, { recursive: true });
      await fsp.writeFile(this.wallpaperScriptPath, DESKTOP_WALLPAPER_HELPER_PS, 'utf8');
      this.wallpaperScriptInitialized = true;
    } catch (error) {
      console.error('Failed to write desktop character wallpaper helper script:', error);
    }
  }

  async listDesktopMonitors() {
    // 优先走 native host，避免 spawn PowerShell（~800ms → ~5ms）
    if (this.nativeHost && !this.nativeHost.killed && this.nativeHost.stdin.writable) {
      return new Promise((resolve) => {
        this._pendingMonitors = {
          resolve,
          monitors: [],
          timeout: setTimeout(() => {
            this._pendingMonitors = null;
            resolve([]);
          }, 3000)
        };
        this.nativeHost.stdin.write('MONITORS\n');
      });
    }

    // 兜底：native host 不可用时用 PowerShell
    await this.initWallpaperScript();
    try {
      const { stdout } = await execAsync(
        `powershell -ExecutionPolicy Bypass -File "${this.wallpaperScriptPath}" list`,
        { windowsHide: true, timeout: 15000 }
      );
      return stdout
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
          const [id, x, y, w, h, position] = line.split('|');
          return {
            id,
            x: parseInt(x, 10),
            y: parseInt(y, 10),
            width: Math.abs(parseInt(w, 10)),
            height: Math.abs(parseInt(h, 10)),
            position: position || 'fill'
          };
        })
        .filter(m => Number.isFinite(m.width) && Number.isFinite(m.height) && m.width > 0 && m.height > 0);
    } catch (error) {
      console.error('Failed to enumerate desktop monitors:', error);
      return [];
    }
  }

  async getDesktopWallpaper(monitorId) {
    await this.initWallpaperScript();
    try {
      const { stdout } = await execAsync(
        `powershell -ExecutionPolicy Bypass -File "${this.wallpaperScriptPath}" get "${monitorId}"`,
        { windowsHide: true, timeout: 15000 }
      );
      return stdout.trim();
    } catch (_error) {
      return '';
    }
  }

  async setDesktopWallpapers(entries) {
    if (!Array.isArray(entries) || entries.length === 0) return;
    if (this.nativeHost && !this.nativeHost.killed && this.nativeHost.stdin.writable) {
      const requestId = `wp${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      const fields = ['SETWPS', requestId, String(entries.length)];
      for (const [monitorId, imagePath] of entries) {
        fields.push(
          Buffer.from(monitorId, 'utf8').toString('base64'),
          Buffer.from(imagePath, 'utf8').toString('base64')
        );
      }
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingWpSets.delete(requestId);
          reject(new Error('SETWPS timed out'));
        }, 15000);
        this.pendingWpSets.set(requestId, { resolve, reject, timeout });
        this.nativeHost.stdin.write(`${fields.join('\t')}\n`);
      });
    }

    throw new Error('Native wallpaper host is unavailable');
  }

  async setDesktopWallpaper(monitorId, imagePath) {
    try {
      await this.setDesktopWallpapers([[monitorId, imagePath]]);
      return;
    } catch (nativeError) {
      if (this.nativeHost && !this.nativeHost.killed) throw nativeError;
    }

    // 兜底：native host 不可用时用 PowerShell
    await this.initWallpaperScript();
    try {
      await execAsync(
        `powershell -ExecutionPolicy Bypass -File "${this.wallpaperScriptPath}" set "${monitorId}" "${imagePath}"`,
        { windowsHide: true, timeout: 15000 }
      );
    } catch (error) {
      console.error(`Failed to set wallpaper for ${monitorId}:`, error);
    }
  }

  async disableFocusDim() {
    await this.initWallpaperScript();
    try {
      const { stdout } = await execAsync(
        `powershell -ExecutionPolicy Bypass -File "${this.wallpaperScriptPath}" disable-focus-dim`,
        { windowsHide: true, timeout: 15000 }
      );
      console.log('[DesktopCharacter] Focus dim policy applied:', stdout.trim());
    } catch (error) {
      console.error('Failed to apply focus-dim policy:', error);
    }
  }

  async composeCharacterImage(monitor, character, analysis) {
    const label = `compose(${monitor.width}x${monitor.height})`;
    this._perfStart(label);
    this.startNativeHost();
    if (!this.nativeHost || this.nativeHost.killed) {
      this._perfEnd(label);
      console.error('[DesktopCharacter] Native host not available for compose');
      return null;
    }

    const requestId = `c${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const safeId = String(monitor.id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const outputPath = path.join(this.wallpaperOutputDir, `wallpaper-${safeId}.png`);

    const fields = [
      'COMPOSE',
      requestId,
      Buffer.from(character.path, 'utf8').toString('base64'),
      String(monitor.width), String(monitor.height),
      analysis.colors.global,
      analysis.alignment.x, analysis.alignment.y,
      Buffer.from(outputPath, 'utf8').toString('base64'),
      analysis.colors.top, analysis.colors.bottom, analysis.colors.left, analysis.colors.right,
      analysis.edges.top.isCut ? '1' : '0',
      analysis.edges.bottom.isCut ? '1' : '0',
      analysis.edges.left.isCut ? '1' : '0',
      analysis.edges.right.isCut ? '1' : '0',
      String(analysis.bounds.left), String(analysis.bounds.top),
      String(analysis.bounds.right), String(analysis.bounds.bottom)
    ];

    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingComposes.delete(requestId);
        reject(new Error('Compose timed out'));
      }, 30000);

      this.pendingComposes.set(requestId, { resolve, reject, timeout });
      this.nativeHost.stdin.write(`${fields.join('\t')}\n`);
    });
    this._perfEnd(label);
    return result;
  }

  pickCharacterForMonitor(candidates, usedPaths, monitor) {
    const unused = candidates.filter(c => !usedPaths.has(c));
    const pool = unused.length > 0 ? unused : candidates;
    const targetRatio = monitor.width / monitor.height;
    const scored = pool
    .map(candidate => {
      const size = this._getImageSize(candidate);
      if (!size || !size.width || !size.height) return null;
      const ratio = size.width / size.height;
      const deviation = Math.abs(Math.log(ratio / targetRatio));
      return { path: candidate, deviation };
    })
    .filter(Boolean)
    .sort((a, b) => a.deviation - b.deviation);
    const top = scored.slice(0, Math.max(1, Math.ceil(scored.length / 3)));
    const choice = top[Math.floor(Math.random() * top.length)];
    if (!choice) return null;
    // 优先查缓存，避免重复 analyzeCharacterBitmap 阻塞主线程
    let analysis = this._cachedAnalyses.get(choice.path);
    if (!analysis) {
      const image = nativeImage.createFromPath(choice.path);
      if (image.isEmpty()) return null;
      const size = image.getSize();
      analysis = analyzeCharacterBitmap(image.toBitmap(), size);
      if (analysis) this._cachedAnalyses.set(choice.path, analysis);
    }
    if (!analysis) return null;
    return { path: choice.path, analysis };
  }

  async updateWallpapers() {
    this._perfStart('updateWallpapers(total)');
    const config = this.getConfig().desktopCharacter;
    if (!config.enabled) { this._perfEnd('updateWallpapers(total)'); return; }
    this.startNativeHost();

    this._perfStart('listDesktopMonitors');
    const monitors = await this.listDesktopMonitors();
    this._perfEnd('listDesktopMonitors');
    if (monitors.length === 0) {
      console.log('[DesktopCharacter] No desktop monitors detected; wallpaper mode skipped.');
      this._perfEnd('updateWallpapers(total)');
      return;
    }

    const candidates = this.getCandidates();
    if (candidates.length === 0) {
      console.log('[DesktopCharacter] No character PNGs found; wallpaper mode skipped.');
      this._perfEnd('updateWallpapers(total)');
      return;
    }

    // 提前批量预热缓存，带 yield 不阻塞主线程
    this._perfStart('warmSizeCache');
    await this._ensureImageSizeCache(candidates);
    this._perfEnd('warmSizeCache');

    const usedPaths = new Set();
    const STAGGER_MS = 200;
    let isFirst = true;
    for (const monitor of monitors) {
      if (!isFirst) {
        await new Promise(r => setTimeout(r, STAGGER_MS));
      }
      isFirst = false;

      const pickLabel = `pickForMonitor(${monitor.width}x${monitor.height})`;
      this._perfStart(pickLabel);
      const character = this.pickCharacterForMonitor(candidates, usedPaths, monitor);
      this._perfEnd(pickLabel);
      if (!character) continue;
      usedPaths.add(character.path);

      const composed = await this.composeCharacterImage(monitor, character, character.analysis);
      if (composed) {
        const setLabel = `setWallpaper(${monitor.id.slice(-20)})`;
        this._perfStart(setLabel);
        await this.setDesktopWallpapers([[monitor.id, composed]]);
        console.log(`[DesktopCharacter] Wallpaper prepared for ${monitor.id} (${monitor.width}x${monitor.height}) using ${path.basename(character.path)}`);
        this._perfEnd(setLabel);
      }
    }
    this._perfEnd('updateWallpapers(total)');
  }

  async updateBackgrounds() {
    this._perfStart('updateBackgrounds(total)');
    if (this.getConfig().desktopCharacter.layerMode === 'system-wallpaper') {
      await this.updateWallpapers();
      this._perfEnd('updateBackgrounds(total)');
      return;
    }
    this._perfStart('startNativeHost');
    this.startNativeHost();
    this._perfEnd('startNativeHost');

    const config = this.getConfig().desktopCharacter;
    const candidates = this.getCandidates();
    const usedPaths = new Set();
    const displays = screen.getAllDisplays();
    this._perfLog('displayCount', displays.length);

    for (let di = 0; di < displays.length; di++) {
      const display = displays[di];
      const charLabel = `pickCharacter(display${di})`;
      this._perfStart(charLabel);
      const character = this.pickCharacter(candidates, usedPaths);
      this._perfEnd(charLabel);
      if (!character) continue;
      usedPaths.add(character.path);

      const setLabel = `nativeSET(display${di}_${display.bounds.width}x${display.bounds.height})`;
      this._perfStart(setLabel);
      const bounds = screen.dipToScreenRect(null, display.bounds);
      const { colors, alignment } = character.analysis;
      const fields = [
        'SET', String(display.id), String(bounds.x), String(bounds.y), String(bounds.width), String(bounds.height),
        Buffer.from(character.path, 'utf8').toString('base64'), config.mode,
        colors.global, colors.top, colors.bottom, colors.left, colors.right, alignment.x, alignment.y,
        config.layerMode
      ];
      this.pendingUpdates.set(String(display.id), `${path.basename(character.path)} for ${bounds.width}x${bounds.height}`);
      this.nativeHost.stdin.write(`${fields.join('\t')}\n`);
      this._perfEnd(setLabel);
    }
    this._perfEnd('updateBackgrounds(total)');
  }

  schedule() {
    clearTimeout(this.timer);
    const config = this.getConfig().desktopCharacter;
    if (!config.enabled) return;
    this.timer = setTimeout(() => {
      this.updateBackgrounds()
        .catch(error => console.error('Failed to update desktop character background:', error))
        .finally(() => this.schedule());
    }, config.intervalMinutes * 60 * 1000);
  }

  start() {
    if (!this.getConfig().desktopCharacter.enabled) {
      console.log('[DesktopCharacter] Disabled in config, skipping start.');
      return;
    }
    this.lastLayerMode = this.getConfig().desktopCharacter.layerMode;
    console.log(`[DesktopCharacter] Starting with layerMode=${this.lastLayerMode}, folder=${this.getConfig().desktopCharacter.folderPath}`);
    this.startNativeHost();
    this.updateBackgrounds()
      .catch(error => console.error('Failed to start desktop character background:', error))
      .finally(() => this.schedule());
  }

  async refreshNow() {
    if (!this.getConfig().desktopCharacter.enabled) return null;
    return this.updateBackgrounds();
  }

  async onConfigChange() {
    const cfg = this.getConfig().desktopCharacter;
    const newLayerMode = cfg.layerMode;
    const layerChanged = this.lastLayerMode !== newLayerMode;
    this.lastLayerMode = newLayerMode;

    if (!cfg.enabled) {
      await this.stop();
      return;
    }

    // Only restart the native host when layer mode actually changed,
    // or when the service hasn't been started yet.
    // Avoid losing wallpaper state on every config save.
    if (layerChanged || !this.nativeHost || this.nativeHost.killed) {
      await this.stop();
      this.start();
    } else {
      // Just refresh backgrounds without killing the native host
      this.updateBackgrounds()
        .catch(error => console.error('Failed to update desktop character background:', error));
      // Reschedule rotation interval
      this.schedule();
    }
  }

  _rejectPendingNativeRequests(message) {
    this.pendingUpdates.clear();
    for (const [id, pending] of this.pendingComposes) {
      clearTimeout(pending.timeout);
      pending.reject(new Error(message));
    }
    this.pendingComposes.clear();
    for (const [id, pending] of this.pendingWpSets) {
      clearTimeout(pending.timeout);
      pending.reject(new Error(message));
    }
    this.pendingWpSets.clear();
  }

  stopNativeHost() {
    if (!this.nativeHost) return;
    const nativeHost = this.nativeHost;
    this.expectedNativeHostStops.add(nativeHost);
    if (nativeHost.stdin.writable) {
      nativeHost.stdin.write('EXIT\n');
      nativeHost.stdin.end();
    }
    setTimeout(() => {
      if (nativeHost.exitCode === null && !nativeHost.killed) nativeHost.kill();
    }, 1000).unref();
    this.nativeHost = null;
    this._rejectPendingNativeRequests('Native host stopped');
  }

  async stop() {
    clearTimeout(this.timer);
    this.timer = null;
    this.stopNativeHost();
  }
}

module.exports = { DesktopCharacterService, analyzeCharacterBitmap };
