'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

for (const file of ['wallpaper-service.js', 'desktop-character-service.js']) {
  test(`${file}: an unavailable display does not discard healthy displays`, { skip: process.platform !== 'win32' }, async t => {
    const source = await fs.readFile(path.join(__dirname, '../src/main', file), 'utf8');
    const start = source.indexOf('public static string[] List()');
    let end = source.indexOf('{', start) + 1;
    let depth = 1;
    while (depth) {
      if (source[end] === '{') depth++;
      if (source[end] === '}') depth--;
      end++;
    }
    const method = source.slice(start, end).replace('(IDesktopWallpaper)new DesktopWallpaperClass()', 'new Fake()');
    const code = `using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public class Probe {
  public struct RECT { public int Left, Top, Right, Bottom; }
  public enum DESKTOP_WALLPAPER_POSITION { Fill }
  class Fake {
    public uint GetMonitorDevicePathCount() { return 3; }
    public DESKTOP_WALLPAPER_POSITION GetPosition() { return DESKTOP_WALLPAPER_POSITION.Fill; }
    public string GetMonitorDevicePathAt(uint i) { return "display-" + i; }
    public void GetMonitorRECT(string id, out RECT rect) {
      if (id == "display-1") throw new COMException("Disconnected display", unchecked((int)0x80004005));
      rect = new RECT { Right = 1920, Bottom = 1080 };
    }
  }
  ${method}
}`;
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'gooner-monitor-test-'));
    t.after(() => fs.rm(dir, { recursive: true, force: true }));
    const codePath = path.join(dir, 'probe.cs');
    await fs.writeFile(codePath, code);
    const output = execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command',
      `$ErrorActionPreference = 'Stop'; Add-Type -Path '${codePath.replaceAll("'", "''")}'; [Probe]::List()`
    ], { encoding: 'utf8', windowsHide: true });
    const lines = output.trim().split(/\r?\n/);
    assert.equal(lines.length, 2);
    assert.ok(lines[0].startsWith('display-0|'));
    assert.ok(lines[1].startsWith('display-2|'));
  });
}
