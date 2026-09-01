const { exec } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const { promisify } = require('util');
const { app } = require('electron');
const { findBestMediaForDisplay } = require('./media-utils');
const {
  ACTION_APPLY_MANAGED,
  ACTION_INITIALIZE_MANAGED,
  ACTION_RESTORE_ORIGINAL,
  WallpaperFocusState
} = require('./wallpaper-focus-state');

const execAsync = promisify(exec);

const psScriptContent = `
using System;
using System.Runtime.InteropServices;
namespace WH {
    public class W {
        [StructLayout(LayoutKind.Sequential)]
        public struct RECT {
            public int Left; public int Top; public int Right; public int Bottom;
        }
        [ComImport]
        [Guid("B92B56A9-8B55-4E14-9A89-0199BBB6F93B")]
        [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        public interface IDesktopWallpaper {
            void SetWallpaper([MarshalAs(UnmanagedType.LPWStr)] string monitorID, [MarshalAs(UnmanagedType.LPWStr)] string wallpaper);
            [return: MarshalAs(UnmanagedType.LPWStr)]
            string GetWallpaper([MarshalAs(UnmanagedType.LPWStr)] string monitorID);
            [return: MarshalAs(UnmanagedType.LPWStr)]
            string GetMonitorDevicePathAt(uint monitorIndex);
            [return: MarshalAs(UnmanagedType.U4)]
            uint GetMonitorDevicePathCount();
            void GetMonitorRECT([MarshalAs(UnmanagedType.LPWStr)] string monitorID, out RECT displayRect);
        }
        [ComImport]
        [Guid("C2CF3110-460E-4fc1-B9D0-8A1C0C9CC4BD")]
        public class DesktopWallpaperClass { }
        public static string[] List() {
            var w = (IDesktopWallpaper)new DesktopWallpaperClass();
            uint c = w.GetMonitorDevicePathCount();
            string[] result = new string[c];
            for(uint i = 0; i < c; i++) {
                string p = w.GetMonitorDevicePathAt(i);
                RECT r;
                w.GetMonitorRECT(p, out r);
                result[i] = p + "|" + (r.Right - r.Left) + "|" + (r.Bottom - r.Top);
            }
            return result;
        }
        public static string Get(string m) {
            var w = (IDesktopWallpaper)new DesktopWallpaperClass();
            return w.GetWallpaper(m);
        }
        public static void Set(string m, string p) {
            var w = (IDesktopWallpaper)new DesktopWallpaperClass();
            w.SetWallpaper(m, p);
        }
    }
}
`;

class WallpaperService {
  constructor({ getConfig, getMediaLibrary, getDesktopCharacterService }) {
    this.getConfig = getConfig;
    this.getMediaLibrary = getMediaLibrary;
    this.getDesktopCharacterService = getDesktopCharacterService;
    this.timer = null;
    this.scriptPath = path.join(app.getPath('userData'), 'wallpaper-helper.ps1');
    this.initialized = false;
    // 失焦自动换回
    this.originalWallpapers = new Map(); // monitorId -> imagePath (启动时的原始壁纸)
    this.lastAppliedWallpapers = new Map(); // monitorId -> imagePath (服务最近一次设置的壁纸)
    this.focusState = new WallpaperFocusState({ desktopFocused: null });
    this.focusPollTimer = null;
    this.cachedMonitors = null;     // 缓存的显示器列表
    this.cachedMonitorsTime = 0;    // 缓存时间戳
    this._nativeFocusBuf = '';      // native host 焦点输出的缓冲区
    this._lastNativeFocus = null;   // native host 报告的最近焦点状态 (null/true/false)
    this._nativeFocusBoundHost = null;
    this._nativeFocusListenerCleanup = null;
    this._pendingFocusStatResolve = null;
    this._focusPollInFlight = false;
    this._focusSyncRequested = false;
    this._focusSyncScheduled = false;
    this._wallpaperTransition = Promise.resolve();
    this.pendingWallpapers = new Map();
  }

  async initScript() {
    if (this.initialized) return;
    try {
      const content = `
Add-Type -TypeDefinition @"
${psScriptContent}
"@
if ($args[0] -eq "list") {
    [WH.W]::List()
} elseif ($args[0] -eq "get") {
    [WH.W]::Get($args[1])
} elseif ($args[0] -eq "set") {
    [WH.W]::Set($args[1], $args[2])
} elseif ($args[0] -eq "set-many") {
  $updates = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($args[1])) | ConvertFrom-Json
  foreach ($update in @($updates)) {
    [WH.W]::Set([string]$update.monitorId, [string]$update.imagePath)
  }
}
`;
      await fs.writeFile(this.scriptPath, content, 'utf8');
      this.initialized = true;
    } catch (error) {
      console.error('Failed to write wallpaper helper script:', error);
    }
  }

  // ── 焦点检测：复用 native host 的 WinEvent hook（毫秒级响应）──

  /**
   * 从 desktop-character-service 的 native host 获取最新焦点状态
   * native host 已通过 WinEvent hook 实时监听前台窗口变化，无需额外进程
   */
  _getNativeHost() {
    const charService = this.getDesktopCharacterService();
    if (!charService) return null;
    if ((!charService.nativeHost || charService.nativeHost.killed) && typeof charService.startNativeHost === 'function') {
      try {
        // 桌面角色服务可用时，优先确保 native host 在线，减少失焦检测降级概率
        charService.startNativeHost();
      } catch (error) {
        console.warn('[WallpaperService] Failed to start native host for focus detection:', error.message || error);
      }
    }
    return charService.nativeHost;
  }

  /**
   * 订阅 native host 的 FOCUS 输出，实时更新本地状态
   */
  _startNativeFocusListener() {
    const nh = this._getNativeHost();
    if (!nh || nh.killed) return;
    if (this._nativeFocusBoundHost === nh && this._nativeFocusListenerCleanup) return;

    if (this._nativeFocusListenerCleanup) {
      this._nativeFocusListenerCleanup();
      this._nativeFocusListenerCleanup = null;
      this._nativeFocusBoundHost = null;
      this.focusState.resetNativeHostState();
    }

    const onData = (chunk) => {
      this._nativeFocusBuf += chunk;
      const lines = this._nativeFocusBuf.split(/\r?\n/);
      this._nativeFocusBuf = lines.pop() || '';
      for (const line of lines) {
        const [event, value] = line.split('\t');
        if (event === 'FOCUS' || event === 'FOCUSSTAT') {
          const focused = value === '1';
          this._lastNativeFocus = focused;
          if (event === 'FOCUS') {
            this._handleNativeFocusEvent(focused);
          }
          if (event === 'FOCUSSTAT' && this._pendingFocusStatResolve) {
            const resolve = this._pendingFocusStatResolve;
            this._pendingFocusStatResolve = null;
            resolve(focused);
          }
        }
        if (event === 'MINIMIZE_HOLD') {
          this.focusState.setManagedWallpaperAvailable(this.lastAppliedWallpapers.size > 0);
          const action = this.focusState.handle('MINIMIZE_HOLD');
          this._runFocusAction(action, 'Window minimized').catch(error => {
            console.error('[WallpaperService] Minimize hold restore error:', error);
          });
        } else if (event === 'MINIMIZE_HOLD_END') {
          this.focusState.handle('MINIMIZE_HOLD_END');
          this._requestFocusSync();
        }
      }
    };
    const onExit = () => {
      if (this._nativeFocusBoundHost !== nh) return;
      this._lastNativeFocus = null;
      this.focusState.resetNativeHostState();
      this._requestFocusSync();
    };
    nh.stdout.on('data', onData);
    this._nativeFocusListenerCleanup = () => {
      try { nh.stdout.removeListener('data', onData); } catch (_) {}
      try { nh.removeListener('exit', onExit); } catch (_) {}
    };
    nh.on('exit', onExit);
    this._nativeFocusBoundHost = nh;
  }

  /**
   * 检查桌面是否获得焦点
   * 1. 优先查 native host 最近一次 FOCUS 事件（0 延迟）
   * 2. 若无数据，向 native host 发送 FOCUSSTAT 命令查询（~1ms）
   * 3. native host 不可用时回退到一次性 PowerShell（~500ms，仅降级）
   */
  async _isDesktopFocused({ refresh = false } = {}) {
    this._startNativeFocusListener();

    // ① native host 最近一次焦点事件（零延迟）
    if (!refresh && this._lastNativeFocus !== null) {
      return this._lastNativeFocus;
    }

    // ② 主动查询 native host FOCUSSTAT 命令
    const nh = this._getNativeHost();
    if (nh && !nh.killed && nh.stdin && nh.stdin.writable) {
      if (this._pendingFocusStatResolve) {
        return this.focusState.desktopFocused ?? true;
      }

      return new Promise((resolve) => {
        this._pendingFocusStatResolve = resolve;
        setTimeout(() => {
          if (!this._pendingFocusStatResolve) return;
          this._pendingFocusStatResolve = null;
          resolve(this.focusState.desktopFocused ?? true);
        }, 2000);

        try {
          nh.stdin.write('FOCUSSTAT\n');
        } catch (_) {
          if (this._pendingFocusStatResolve) {
            this._pendingFocusStatResolve = null;
            resolve(this.focusState.desktopFocused ?? true);
          }
        }
      });
    }

    // ③ 降级：一次性 PowerShell（只在 native host 完全不可用时用）
    try {
      const { exec } = require('child_process');
      const ps = `powershell -NoProfile -NonInteractive -Command "Add-Type @'\nusing System;\nusing System.Runtime.InteropServices;\nusing System.Text;\npublic static class FG {\n  [DllImport(\"user32.dll\")] public static extern IntPtr GetForegroundWindow();\n  [DllImport(\"user32.dll\")] [return: MarshalAs(UnmanagedType.Bool)] public static extern bool IsIconic(IntPtr hWnd);\n  [DllImport(\"user32.dll\", CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);\n}\n'@; $h=[FG]::GetForegroundWindow(); if($h -eq [IntPtr]::Zero){'1'; exit}; if([FG]::IsIconic($h)){'1'; exit}; $sb=New-Object System.Text.StringBuilder 260; [void][FG]::GetClassName($h,$sb,$sb.Capacity); $cls=$sb.ToString(); if($cls -eq 'Progman' -or $cls -eq 'WorkerW'){'1'}else{'0'}"`;
      const { stdout } = await new Promise((resolve, reject) => {
        exec(ps, { windowsHide: true, timeout: 3000 }, (err, stdout, stderr) => {
          if (err) reject(err); else resolve({ stdout });
        });
      });
      return stdout.trim() === '1';
    } catch (_) {
      return this.focusState.desktopFocused ?? true;
    }
  }

  async getMonitors() {
    try {
      const { stdout } = await execAsync(`powershell -ExecutionPolicy Bypass -File "${this.scriptPath}" list`, { windowsHide: true });
      const lines = stdout.trim().split('\n').map(l => l.trim()).filter(Boolean);
      return lines.map(line => {
        const [id, w, h] = line.split('|');
        return {
          id,
          width: Math.abs(parseInt(w, 10)),
          height: Math.abs(parseInt(h, 10))
        };
      });
    } catch (e) {
      console.error('Failed to get monitors for wallpaper:', e);
      return [];
    }
  }

  /**
   * 获取缓存的显示器列表（30 秒内有效），避免焦点切换时重复启动 PowerShell 进程
   */
  async _getCachedMonitors() {
    const now = Date.now();
    if (this.cachedMonitors && (now - this.cachedMonitorsTime) < 30000) {
      return this.cachedMonitors;
    }
    const monitors = await this.getMonitors();
    if (monitors.length > 0) {
      this.cachedMonitors = monitors;
      this.cachedMonitorsTime = now;
    }
    return monitors;
  }

  async getCurrentWallpaper(monitorId) {
    try {
      const { stdout } = await execAsync(
        `powershell -ExecutionPolicy Bypass -File "${this.scriptPath}" get "${monitorId}"`,
        { windowsHide: true, timeout: 10000 }
      );
      return stdout.trim();
    } catch (_) {
      return '';
    }
  }

  async setWallpaper(monitorId, imagePath) {
    return this.setWallpapers([[monitorId, imagePath]]);
  }

  async setWallpapers(entries) {
    if (entries.length === 0) return false;
    try {
      const charService = this.getDesktopCharacterService();
      if (charService && typeof charService.setDesktopWallpapers === 'function') {
        try {
          await charService.setDesktopWallpapers(entries);
          return true;
        } catch (error) {
          console.warn('[WallpaperService] Native wallpaper write failed, using PowerShell fallback:', error.message || error);
        }
      }
      await this.initScript();
      const updates = entries.map(([monitorId, imagePath]) => ({ monitorId, imagePath }));
      const encodedUpdates = Buffer.from(JSON.stringify(updates), 'utf8').toString('base64');
      await execAsync(
        `powershell -ExecutionPolicy Bypass -File "${this.scriptPath}" set-many "${encodedUpdates}"`,
        { windowsHide: true, timeout: 10000 }
      );
      return true;
    } catch (e) {
      console.error('Failed to set wallpapers:', e);
      return false;
    }
  }

  async _reapplyLastAppliedWallpapers() {
    if (this.lastAppliedWallpapers.size === 0) {
      return false;
    }
    const entries = [...this.lastAppliedWallpapers];
    if (!await this.setWallpapers(entries)) {
      return false;
    }
    for (const [monitorId] of entries) {
      console.log(`[WallpaperService] Reapplied last wallpaper for ${monitorId}`);
    }
    return true;
  }

  async _applyPendingWallpapers() {
    if (this.pendingWallpapers.size === 0) return false;
    const entries = [...this.pendingWallpapers];
    if (!await this.setWallpapers(entries)) return false;
    this.pendingWallpapers.clear();
    for (const [monitorId, imagePath] of entries) {
      this.lastAppliedWallpapers.set(monitorId, imagePath);
      console.log(`[WallpaperService] Applied scheduled wallpaper for ${monitorId}`);
    }
    return true;
  }

  /**
   * 判断本次 tick 使用哪种模式: 'normal' | 'character'
   * 两者都开时随机选择。
   */
  _pickMode() {
    const cfg = this.getConfig().wallpaper;
    const hasNormal = cfg.enabled;
    // 检查新 wallpaper 子模块配置和旧独立 desktopCharacter 配置
    const charFolder = cfg.characterFolderPath || (this.getConfig().desktopCharacter && this.getConfig().desktopCharacter.folderPath) || '';
    const hasCharacter = cfg.characterEnabled && charFolder;
    if (hasNormal && hasCharacter) {
      return Math.random() < 0.5 ? 'normal' : 'character';
    }
    if (hasCharacter) return 'character';
    return 'normal';
  }

  async _restoreOriginalWallpapers() {
    if (this.originalWallpapers.size === 0) return false;
    const entries = [...this.originalWallpapers];
    if (!await this.setWallpapers(entries)) return false;
    for (const [monitorId] of entries) {
      console.log(`[WallpaperService] Restored original wallpaper for ${monitorId}`);
    }
    return true;
  }

  /**
   * 普通模式：从媒体库选图片设壁纸
   */
  async _tickNormal(monitors, { apply = true } = {}) {
    const mediaLibrary = this.getMediaLibrary();
    const images = mediaLibrary.filter(m => m.type === 'image');
    if (images.length === 0) {
      return { changedCount: 0, errors: ['媒体库中没有图片'] };
    }

    const entries = [];
    const errors = [];
    const cfg = this.getConfig().wallpaper;

    for (const monitor of monitors) {
      let lastRejection = '';
      const bestImage = await findBestMediaForDisplay(images.map(i => i.path), monitor, cfg);
      if (!bestImage) {
        lastRejection = 'No suitable images found';
      }
      if (bestImage) {
        console.log(`[WallpaperService] Setting normal wallpaper for monitor ${monitor.id} to ${bestImage}`);
        entries.push([monitor.id, bestImage]);
      } else {
        console.log(`[WallpaperService] No suitable image found for monitor ${monitor.id}`);
        errors.push(`显示器 ${monitor.id} (${monitor.width}x${monitor.height}) 未找到合适图片，原因：${lastRejection}`);
      }
    }
    if (entries.length === 0) return { changedCount: 0, errors, entries };
    if (!apply) return { changedCount: entries.length, errors, entries };
    if (!await this.setWallpapers(entries)) {
      errors.push('无法应用本轮壁纸');
      return { changedCount: 0, errors, entries: [] };
    }
    for (const [monitorId, imagePath] of entries) {
      this.lastAppliedWallpapers.set(monitorId, imagePath);
    }
    return { changedCount: entries.length, errors, entries };
  }

  /**
   * 角色模式：委托 DesktopCharacterService 合成角色壁纸
   */
  async _tickCharacter(monitors, { apply = true } = {}) {
    const charService = this.getDesktopCharacterService();
    if (!charService) {
      return { changedCount: 0, errors: ['角色服务未就绪'] };
    }

    const cfg = this.getConfig().wallpaper;
    // 临时将角色配置同步给 DesktopCharacterService 使用
    const charFolder = cfg.characterFolderPath || (this.getConfig().desktopCharacter && this.getConfig().desktopCharacter.folderPath) || '';
    if (!charFolder) {
      return { changedCount: 0, errors: ['未设置角色文件夹'] };
    }
    // 临时注入角色配置到 desktopCharacter 以便 DesktopCharacterService 读取
    const fullCfg = this.getConfig();
    if (!fullCfg.desktopCharacter) fullCfg.desktopCharacter = {};
    fullCfg.desktopCharacter.folderPath = charFolder;
    fullCfg.desktopCharacter.mode = cfg.characterMode || 'diffuse';
    fullCfg.desktopCharacter.layerMode = cfg.characterLayerMode || 'system-wallpaper';

    const candidates = charService.getCandidates();
    if (candidates.length === 0) {
      return { changedCount: 0, errors: ['角色文件夹为空或无PNG文件'] };
    }

    const usedPaths = new Set();
    const entries = [];
    const errors = [];

    for (const monitor of monitors) {
      const character = charService.pickCharacter(candidates, usedPaths);
      if (!character) {
        errors.push(`显示器 ${monitor.id} 未找到合适的角色图片`);
        continue;
      }
      usedPaths.add(character.path);

      const composed = await charService.composeCharacterImage(monitor, character, character.analysis);
      if (composed) {
        console.log(`[WallpaperService] Setting character wallpaper for monitor ${monitor.id}: ${composed}`);
        entries.push([monitor.id, composed]);
      } else {
        errors.push(`显示器 ${monitor.id} 合成角色壁纸失败`);
      }
    }
    if (entries.length === 0) return { changedCount: 0, errors, entries };
    if (!apply) return { changedCount: entries.length, errors, entries };
    if (!await this.setWallpapers(entries)) {
      errors.push('无法应用本轮角色壁纸');
      return { changedCount: 0, errors, entries: [] };
    }
    for (const [monitorId, imagePath] of entries) {
      this.lastAppliedWallpapers.set(monitorId, imagePath);
    }
    return { changedCount: entries.length, errors, entries };
  }

  async tick(force = false, { ignoreFocus = false } = {}) {
    console.log('[WallpaperService] Tick triggered', { force, ignoreFocus });
    const config = this.getConfig();
    const wpCfg = config.wallpaper;
    const charFolder = (wpCfg && wpCfg.characterFolderPath) || (config.desktopCharacter && config.desktopCharacter.folderPath) || '';
    const hasCharacter = wpCfg && wpCfg.characterEnabled && charFolder;
    const hasNormal = wpCfg && wpCfg.enabled;

    if (!wpCfg || (!hasNormal && !hasCharacter && !force)) {
      console.log('[WallpaperService] Wallpaper disabled, skipping.');
      return '未开启自动更换壁纸';
    }

    if (!hasNormal && !hasCharacter && !force) {
      return '未开启任何壁纸模式';
    }

    let deferApply = false;
    if (!force && !ignoreFocus && wpCfg.focusRestoreEnabled) {
      const isFocusedNow = await this._isDesktopFocused();
      this.focusState.desktopFocused = isFocusedNow;
      if (!isFocusedNow) {
        deferApply = true;
      }
    }

    const mediaLibrary = this.getMediaLibrary();
    const images = mediaLibrary.filter(m => m.type === 'image');
    if (!hasCharacter && images.length === 0) {
      console.log('[WallpaperService] No images found in media library, skipping.');
      return `媒体库中有 ${mediaLibrary.length} 个媒体，但全都是视频，没有找到图片！`;
    }

    await this.initScript();
    const monitors = await this.getMonitors();
    // 更新缓存供焦点检测使用
    if (monitors.length > 0) {
      this.cachedMonitors = monitors;
      this.cachedMonitorsTime = Date.now();
    }
    if (monitors.length === 0) {
      console.log('[WallpaperService] No monitors detected, skipping.');
      return '未检测到任何显示器';
    }

    // 选择模式
    const mode = force ? 'normal' : this._pickMode();
    console.log(`[WallpaperService] Selected mode: ${mode}`);

    let result;
    if (mode === 'character') {
      result = await this._tickCharacter(monitors, { apply: !deferApply });
    } else {
      result = await this._tickNormal(monitors, { apply: !deferApply });
    }

    const { changedCount, errors, entries = [] } = result;
    if (deferApply && entries.length > 0) {
      this.pendingWallpapers = new Map(entries);
      console.log(`[WallpaperService] Desktop not focused, prepared ${entries.length} scheduled wallpaper(s).`);
      return `[${mode === 'character' ? '角色' : '普通'}] 已按设定时间准备 ${entries.length} 个显示器的下一张壁纸，将在返回桌面时应用。`;
    }
    if (changedCount > 0) {
      const modeLabel = mode === 'character' ? '角色' : '普通';
      return `[${modeLabel}] 成功为 ${changedCount} 个显示器更换了壁纸！` + (errors.length > 0 ? ` (${errors.join(', ')})` : '');
    } else {
      return `未更换任何壁纸：${errors.join(', ')}`;
    }
  }

  async tickCharacter() {
    console.log('[WallpaperService] Tick character triggered');
    await this.initScript();
    const monitors = await this.getMonitors();
    if (monitors.length === 0) {
      return '未检测到任何显示器';
    }
    const result = await this._tickCharacter(monitors);
    const { changedCount, errors } = result;
    if (changedCount > 0) {
      return `[角色] 成功为 ${changedCount} 个显示器更换了角色壁纸！` + (errors.length > 0 ? ` (${errors.join(', ')})` : '');
    }
    return `未更换角色壁纸：${errors.join(', ')}`;
  }

  scheduleNextTick() {
    clearTimeout(this.timer);
    const config = this.getConfig();
    const wpCfg = config.wallpaper;
    const hasNormal = wpCfg && wpCfg.enabled;
    const charFolder = (wpCfg && wpCfg.characterFolderPath) || (config.desktopCharacter && config.desktopCharacter.folderPath) || '';
    const hasChar = wpCfg && wpCfg.characterEnabled && charFolder;
    const hasAny = hasNormal || hasChar;
    if (!hasAny) {
      return;
    }
    const ms = Math.max(1, wpCfg.intervalMinutes) * 60 * 1000;
    this.timer = setTimeout(() => {
      this.tick().finally(() => this.scheduleNextTick());
    }, ms);
  }

  // ── 失焦自动换回 ──

  _queueWallpaperTransition(operation) {
    const transition = this._wallpaperTransition.catch(() => {}).then(operation);
    this._wallpaperTransition = transition;
    return transition;
  }

  _requestFocusSync() {
    this._focusSyncRequested = true;
    if (this._focusPollInFlight || this._focusSyncScheduled) return;
    this._focusSyncScheduled = true;
    queueMicrotask(() => {
      this._focusSyncScheduled = false;
      this._focusPollTick().catch(error => console.error('[WallpaperService] Focus sync error:', error));
    });
  }

  _handleNativeFocusEvent(isFocused) {
    const wpCfg = this.getConfig().wallpaper;
    if (!wpCfg || !wpCfg.focusRestoreEnabled) return;
    this.focusState.setManagedWallpaperAvailable(this.lastAppliedWallpapers.size > 0);
    this._runFocusAction(this.focusState.handle('FOCUS', isFocused), 'Desktop focus changed')
      .catch(error => console.error('[WallpaperService] Native focus action error:', error));
  }

  async _runFocusAction(action, reason) {
    if (action === ACTION_RESTORE_ORIGINAL) {
      console.log(`[WallpaperService] ${reason}, restoring original wallpapers...`);
      await this._queueWallpaperTransition(() => this._restoreOriginalWallpapers());
      return;
    }

    if (action === ACTION_APPLY_MANAGED) {
      console.log(`[WallpaperService] ${reason}, reapplying last managed wallpapers...`);
      await this._queueWallpaperTransition(async () => {
        if (!await this._applyPendingWallpapers()) {
          await this._reapplyLastAppliedWallpapers();
        }
      });
      return;
    }

    if (action === ACTION_INITIALIZE_MANAGED) {
      console.log(`[WallpaperService] ${reason}, initializing managed wallpapers...`);
      if (this.pendingWallpapers.size > 0) {
        this._queueWallpaperTransition(() => this._applyPendingWallpapers());
      } else {
        this.tick().finally(() => this.scheduleNextTick());
      }
    }
  }

  async _focusPollTick() {
    // REGRESSION GUARD:
    // 1) Unfocus => restore original wallpapers.
    // 2) Refocus => reapply last applied wallpapers only (no immediate rotate).
    // 3) Rotate to a new wallpaper only when scheduler tick is due.
    // See: .github/wallpaper-focus-restore-guard.md
    if (this._focusPollInFlight) {
      this._focusSyncRequested = true;
      return;
    }

    this._focusPollInFlight = true;
    this._focusSyncRequested = false;
    try {
      const wpCfg = this.getConfig().wallpaper;
      if (!wpCfg || !wpCfg.focusRestoreEnabled) return;

      const isFocused = await this._isDesktopFocused({ refresh: true });
      this.focusState.setManagedWallpaperAvailable(this.lastAppliedWallpapers.size > 0);
      await this._runFocusAction(this.focusState.handle('FOCUS', isFocused), 'Desktop focus changed');
    } finally {
      this._focusPollInFlight = false;
      if (this._focusSyncRequested) {
        this._focusSyncRequested = false;
        this._requestFocusSync();
      }
    }
  }

  _startFocusPolling() {
    this._stopFocusPolling();
    const wpCfg = this.getConfig().wallpaper;
    if (!wpCfg || !wpCfg.focusRestoreEnabled) return;

    // 订阅 native host 的 FOCUS 输出（零开销，复用已有 WinEvent hook）
    this._startNativeFocusListener();

    this.focusPollTimer = setInterval(() => {
      this._focusPollTick().catch(e => console.error('[WallpaperService] Focus poll error:', e));
    }, 1500);
  }

  _stopFocusPolling() {
    if (this.focusPollTimer) {
      clearInterval(this.focusPollTimer);
      this.focusPollTimer = null;
    }
    if (this._nativeFocusListenerCleanup) {
      this._nativeFocusListenerCleanup();
      this._nativeFocusListenerCleanup = null;
    }
    this._nativeFocusBoundHost = null;
    this._pendingFocusStatResolve = null;
    this._nativeFocusBuf = '';
    this._lastNativeFocus = null;
  }

  // ── 生命周期 ──

  async start() {
    // 启动时先保存用户原始壁纸（在任何 tick 之前），用于失焦恢复和退出恢复
    // 无论 focusRestoreEnabled 是否开启都保存，因为用户可能后来才开启
    const wpCfg = this.getConfig().wallpaper;
    if (wpCfg && (wpCfg.enabled || wpCfg.characterEnabled)) {
      try {
        await this.initScript();
        const monitors = await this.getMonitors();
        if (monitors.length > 0) {
          this.cachedMonitors = monitors;
          this.cachedMonitorsTime = Date.now();
          const results = await Promise.allSettled(
            monitors.map(async (m) => {
              const current = await this.getCurrentWallpaper(m.id);
              return { id: m.id, path: current };
            })
          );
          for (const r of results) {
            if (r.status === 'fulfilled' && r.value.path) {
              this.originalWallpapers.set(r.value.id, r.value.path);
            }
          }
          console.log(`[WallpaperService] Saved ${this.originalWallpapers.size} original wallpapers on start.`);
        }
      } catch (e) {
        console.error('[WallpaperService] Failed to save original wallpapers on start:', e);
      }
    }
    // 首轮只在桌面当前可见时应用，避免普通应用前台时短暂闪现软件壁纸。
    let isDesktopFocused = false;
    try {
      isDesktopFocused = await this._isDesktopFocused({ refresh: true });
      this.focusState.desktopFocused = isDesktopFocused;
      if (isDesktopFocused) {
        await this.tick(false, { ignoreFocus: true });
      }
    } catch (error) {
      console.error('[WallpaperService] Initial wallpaper tick failed:', error);
    } finally {
      this.scheduleNextTick();
      this._startFocusPolling();
    }
  }

  async stop() {
    clearTimeout(this.timer);
    this.timer = null;
    this._stopFocusPolling();
    // 退出时恢复用户原始壁纸
    if (this.originalWallpapers.size > 0) {
      try {
        await this.initScript();
        await this._restoreOriginalWallpapers();
      } catch (e) {
        console.error('[WallpaperService] Failed to restore original wallpapers on stop:', e);
      }
    }
    this.originalWallpapers.clear();
    this.lastAppliedWallpapers.clear();
    this.pendingWallpapers.clear();
    this.focusState.resetNativeHostState();
    this.cachedMonitors = null;
    this.cachedMonitorsTime = 0;
  }

  onConfigChange(oldConfig, newConfig) {
    const oldWp = oldConfig.wallpaper || {};
    const newWp = newConfig.wallpaper || {};
    const oldCharFolder = oldWp.characterFolderPath || (oldConfig.desktopCharacter && oldConfig.desktopCharacter.folderPath) || '';
    const newCharFolder = newWp.characterFolderPath || (newConfig.desktopCharacter && newConfig.desktopCharacter.folderPath) || '';
    const wasAnyActive = oldWp.enabled || (oldWp.characterEnabled && oldCharFolder);
    const isAnyActive = newWp.enabled || (newWp.characterEnabled && newCharFolder);

    if (isAnyActive && !wasAnyActive) {
      if (this.originalWallpapers.size === 0) {
        this.initScript().then(async () => {
          const monitors = await this.getMonitors();
          if (monitors.length > 0) {
            const results = await Promise.allSettled(
              monitors.map(async (m) => {
                const current = await this.getCurrentWallpaper(m.id);
                return { id: m.id, path: current };
              })
            );
            for (const r of results) {
              if (r.status === 'fulfilled' && r.value.path) {
                this.originalWallpapers.set(r.value.id, r.value.path);
              }
            }
          }
          this.tick().finally(() => this.scheduleNextTick());
        });
      } else {
        this.tick().finally(() => this.scheduleNextTick());
      }
    } else if (!isAnyActive) {
      this.stop();
    } else {
      this.scheduleNextTick();
    }

    if (newWp.focusRestoreEnabled !== oldWp.focusRestoreEnabled) {
      if (newWp.focusRestoreEnabled) {
        this._startFocusPolling();
        this._isDesktopFocused().then(f => { this.focusState.desktopFocused = f; });
      } else {
        this._stopFocusPolling();
        this.focusState.resetNativeHostState();
      }
    }
  }
}

module.exports = {
  WallpaperService
};
