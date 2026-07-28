const fs = require('node:fs');
const path = require('node:path');
const { exec } = require('node:child_process');
const { promisify } = require('node:util');
const execAsync = promisify(exec);

const PS = String.raw`
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
namespace DCW {
    public class W {
        [StructLayout(LayoutKind.Sequential)]
        public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
        [ComImport, Guid("B92B56A9-8B55-4E14-9A89-0199BBB6F93B"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        public interface IDesktopWallpaper {
            void SetWallpaper([MarshalAs(UnmanagedType.LPWStr)] string monitorID, [MarshalAs(UnmanagedType.LPWStr)] string wallpaper);
            [return: MarshalAs(UnmanagedType.LPWStr)] string GetWallpaper([MarshalAs(UnmanagedType.LPWStr)] string monitorID);
            [return: MarshalAs(UnmanagedType.LPWStr)] string GetMonitorDevicePathAt(uint monitorIndex);
            [return: MarshalAs(UnmanagedType.U4)] uint GetMonitorDevicePathCount();
            void GetMonitorRECT([MarshalAs(UnmanagedType.LPWStr)] string monitorID, out RECT displayRect);
        }
        [ComImport, Guid("C2CF3110-460E-4fc1-B9D0-8A1C0C9CC4BD")] public class DesktopWallpaperClass { }
        public static string[] List() {
            var w = (IDesktopWallpaper)new DesktopWallpaperClass();
            uint c = w.GetMonitorDevicePathCount();
            string[] result = new string[c];
            for (uint i = 0; i < c; i++) {
                string p = w.GetMonitorDevicePathAt(i);
                RECT r; w.GetMonitorRECT(p, out r);
                result[i] = p + "|" + (r.Right - r.Left) + "|" + (r.Bottom - r.Top);
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
    $drawW = [int]($charW * $scale)
    $drawH = [int]($charH * $scale)
    switch ($alignX) {
        "left"   { $x = [int]($width * $padding) }
        "right"  { $x = $width - [int]($width * $padding) - $drawW }
        default  { $x = [int](($width - $drawW) / 2) }
    }
    switch ($alignY) {
        "top"    { $y = [int]($height * $padding) }
        "bottom" { $y = $height - [int]($height * $padding) - $drawH }
        default  { $y = [int](($height - $drawH) / 2) }
    }
    $graphics.DrawImage($character, $x, $y, $drawW, $drawH)
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    $character.Dispose()
    Write-Output $outputPath
}
`;

async function main() {
  const helperPath = path.join(process.env.APPDATA, 'gooner', 'desktop-character-helper.ps1');
  const outDir = path.join(process.env.APPDATA, 'gooner', 'desktop-character-wallpapers');
  await fs.promises.mkdir(outDir, { recursive: true });
  await fs.promises.writeFile(helperPath, PS, 'utf8');
  console.log('helper written to', helperPath);

  console.log('\n--- Listing monitors ---');
  const { stdout: listOut } = await execAsync(`powershell -ExecutionPolicy Bypass -File "${helperPath}" list`, { windowsHide: true });
  console.log(listOut);
  const monitors = listOut.trim().split(/\r?\n/).filter(Boolean).map(l => {
    const [id, w, h] = l.split('|');
    return { id, width: Math.abs(parseInt(w, 10)), height: Math.abs(parseInt(h, 10)) };
  });

  if (monitors.length === 0) {
    console.error('No monitors detected');
    return;
  }

  const characterPath = 'C:\\Users\\youdu\\Desktop\\idk\\VStudioBG\\GpgNc8ZbcAAfgcM_01-16-33.png';
  for (const monitor of monitors) {
    const safeId = String(monitor.id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const outPath = path.join(outDir, `wallpaper-${safeId}.png`);

    console.log(`\n--- Composing for ${monitor.id} (${monitor.width}x${monitor.height}) ---`);
    const { stdout: composeOut } = await execAsync(
      `powershell -ExecutionPolicy Bypass -File "${helperPath}" compose ` +
      `"${characterPath}" ${monitor.width} ${monitor.height} ` +
      `"#1a2b3c" "center" "center" ` +
      `"${outPath}" ` +
      `"#1a2b3c" "#1a2b3c"`,
      { windowsHide: true, timeout: 30000 }
    );
    console.log('compose output:', composeOut.trim());
    if (!fs.existsSync(outPath)) {
      console.error('Compose failed: file not created');
      continue;
    }
    console.log(`composed file: ${outPath} (${fs.statSync(outPath).size} bytes)`);

    console.log(`\n--- Current wallpaper for ${monitor.id} ---`);
    const { stdout: getOut } = await execAsync(
      `powershell -ExecutionPolicy Bypass -File "${helperPath}" get "${monitor.id}"`,
      { windowsHide: true }
    );
    console.log('current:', getOut.trim() || '(empty)');

    console.log(`\n--- Setting wallpaper for ${monitor.id} ---`);
    await execAsync(
      `powershell -ExecutionPolicy Bypass -File "${helperPath}" set "${monitor.id}" "${outPath}"`,
      { windowsHide: true, timeout: 15000 }
    );
    console.log('set OK');

    console.log(`\n--- Verifying ---`);
    const { stdout: verifyOut } = await execAsync(
      `powershell -ExecutionPolicy Bypass -File "${helperPath}" get "${monitor.id}"`,
      { windowsHide: true }
    );
    console.log('after set:', verifyOut.trim());
  }
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
