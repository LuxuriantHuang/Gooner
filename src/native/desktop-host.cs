using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using WpfMedia = System.Windows.Media;
using WpfImaging = System.Windows.Media.Imaging;
using WpfDrawing = System.Windows.Media.DrawingContext;

internal static class NativeMethods
{
    internal enum DESKTOP_WALLPAPER_POSITION
    {
        Center = 0,
        Tile = 1,
        Stretch = 2,
        Fit = 3,
        Fill = 4,
        Span = 5
    }

    internal delegate bool EnumWindowsProc(IntPtr hwnd, IntPtr lParam);
    internal delegate void WinEventDelegate(IntPtr hook, uint eventType, IntPtr hwnd, int objectId, int childId, uint threadId, uint time);
    internal delegate IntPtr MouseHookDelegate(int code, IntPtr wParam, IntPtr lParam);
    internal delegate IntPtr KeyboardHookDelegate(int code, IntPtr wParam, IntPtr lParam);
    [ComImport, Guid("B92B56A9-8B55-4E14-9A89-0199BBB6F93B"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IDesktopWallpaper
    {
        void SetWallpaper([MarshalAs(UnmanagedType.LPWStr)] string monitorId, [MarshalAs(UnmanagedType.LPWStr)] string wallpaper);
        [return: MarshalAs(UnmanagedType.LPWStr)] string GetWallpaper([MarshalAs(UnmanagedType.LPWStr)] string monitorId);
        [return: MarshalAs(UnmanagedType.LPWStr)] string GetMonitorDevicePathAt(uint monitorIndex);
        [return: MarshalAs(UnmanagedType.U4)] uint GetMonitorDevicePathCount();
        void GetMonitorRECT([MarshalAs(UnmanagedType.LPWStr)] string monitorId, out RECT displayRect);
        void SetBackgroundColor(uint color);
        [return: MarshalAs(UnmanagedType.U4)] uint GetBackgroundColor();
        void SetPosition(DESKTOP_WALLPAPER_POSITION position);
        DESKTOP_WALLPAPER_POSITION GetPosition();
    }

    [ComImport, Guid("C2CF3110-460E-4FC1-B9D0-8A1C0C9CC4BD")]
    internal class DesktopWallpaperClass { }

    internal const int HWND_BOTTOM = 1;
    internal const int HWND_TOP = 0;
    internal const int SW_SHOWNOACTIVATE = 4;
    internal const uint SWP_NOACTIVATE = 0x0010;
    internal const uint SWP_NOZORDER = 0x0004;
    internal const uint MONITOR_DEFAULTTONEAREST = 0x00000002;
    internal const uint SPI_SETDESKWALLPAPER = 0x0014;
    internal const uint SPIF_UPDATEINIFILE = 0x01;
    internal const uint SPIF_SENDCHANGE = 0x02;
    internal const uint EVENT_SYSTEM_FOREGROUND = 3;
    internal const uint EVENT_SYSTEM_MINIMIZESTART = 0x0016;
    internal const uint EVENT_SYSTEM_MINIMIZEEND = 0x0017;
    internal const uint WINEVENT_OUTOFCONTEXT = 0;
    internal const int WH_MOUSE_LL = 14;
    internal const int WH_KEYBOARD_LL = 13;
    internal const int WM_LBUTTONDOWN = 0x0201;
    internal const int WM_RBUTTONDOWN = 0x0204;
    internal const int WM_MBUTTONDOWN = 0x0207;
    internal const int WM_KEYDOWN = 0x0100;
    internal const int VK_TAB = 0x09;
    internal const uint LLKHF_ALTDOWN = 0x20;
    internal const uint GA_ROOT = 2;
    internal const int GWL_STYLE = -16;
    internal const long WS_CHILD = 0x40000000L;
    internal const long WS_POPUP = 0x80000000L;
    internal const uint PROCESS_VM_OPERATION = 0x0008;
    internal const uint PROCESS_VM_READ = 0x0010;
    internal const uint PROCESS_VM_WRITE = 0x0020;
    internal const uint MEM_COMMIT = 0x1000;
    internal const uint MEM_RESERVE = 0x2000;
    internal const uint MEM_RELEASE = 0x8000;
    internal const uint PAGE_READWRITE = 0x04;
    internal const uint LVM_GETITEMCOUNT = 0x1004;
    internal const uint LVM_GETITEMRECT = 0x100E;
    internal const int RGN_DIFF = 4;

    [DllImport("user32.dll")] internal static extern bool EnumWindows(EnumWindowsProc callback, IntPtr lParam);
    [DllImport("user32.dll")] internal static extern IntPtr FindWindow(string className, string windowName);
    [DllImport("user32.dll")] internal static extern IntPtr FindWindowEx(IntPtr parent, IntPtr after, string className, string windowName);
    [DllImport("user32.dll")] internal static extern int GetClassName(IntPtr hwnd, StringBuilder className, int count);
    [DllImport("user32.dll")] internal static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] internal static extern bool IsIconic(IntPtr hwnd);
    [DllImport("user32.dll")] internal static extern IntPtr WindowFromPoint(POINT point);
    [DllImport("user32.dll")] internal static extern IntPtr GetAncestor(IntPtr hwnd, uint flags);
    [DllImport("user32.dll")] internal static extern IntPtr GetParent(IntPtr hwnd);
    [DllImport("user32.dll")] internal static extern bool GetWindowRect(IntPtr hwnd, out RECT rect);
    [DllImport("user32.dll", SetLastError = true)] internal static extern IntPtr SetParent(IntPtr child, IntPtr parent);
    [DllImport("user32.dll", EntryPoint = "GetWindowLong")] private static extern int GetWindowLong32(IntPtr hwnd, int index);
    [DllImport("user32.dll", EntryPoint = "GetWindowLongPtr")] private static extern IntPtr GetWindowLong64(IntPtr hwnd, int index);
    [DllImport("user32.dll", EntryPoint = "SetWindowLong")] private static extern int SetWindowLong32(IntPtr hwnd, int index, int value);
    [DllImport("user32.dll", EntryPoint = "SetWindowLongPtr")] private static extern IntPtr SetWindowLong64(IntPtr hwnd, int index, IntPtr value);
    [DllImport("user32.dll")] internal static extern bool SetProcessDpiAwarenessContext(IntPtr value);
    [DllImport("user32.dll")] internal static extern bool SetWindowPos(IntPtr hwnd, IntPtr after, int x, int y, int width, int height, uint flags);
    [DllImport("user32.dll")] internal static extern bool ShowWindow(IntPtr hwnd, int command);
    [DllImport("user32.dll")] internal static extern IntPtr SendMessage(IntPtr hwnd, uint message, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")] internal static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint processId);
    [DllImport("user32.dll")] internal static extern bool ClientToScreen(IntPtr hwnd, ref POINT point);
    [DllImport("user32.dll")] internal static extern int SetWindowRgn(IntPtr hwnd, IntPtr region, bool redraw);
    [DllImport("user32.dll")] internal static extern IntPtr MonitorFromPoint(POINT point, uint flags);
    [DllImport("user32.dll")] internal static extern bool GetMonitorInfo(IntPtr monitor, ref MONITORINFO info);
    [DllImport("kernel32.dll")] internal static extern IntPtr OpenProcess(uint access, bool inheritHandle, uint processId);
    [DllImport("kernel32.dll")] internal static extern bool CloseHandle(IntPtr handle);
    [DllImport("kernel32.dll")] internal static extern IntPtr VirtualAllocEx(IntPtr process, IntPtr address, UIntPtr size, uint allocationType, uint protection);
    [DllImport("kernel32.dll")] internal static extern bool VirtualFreeEx(IntPtr process, IntPtr address, UIntPtr size, uint freeType);
    [DllImport("kernel32.dll")] internal static extern bool WriteProcessMemory(IntPtr process, IntPtr address, ref RECT buffer, UIntPtr size, out UIntPtr written);
    [DllImport("kernel32.dll")] internal static extern bool ReadProcessMemory(IntPtr process, IntPtr address, out RECT buffer, UIntPtr size, out UIntPtr read);
    [DllImport("gdi32.dll")] internal static extern IntPtr CreateRectRgn(int left, int top, int right, int bottom);
    [DllImport("gdi32.dll")] internal static extern int CombineRgn(IntPtr destination, IntPtr source1, IntPtr source2, int mode);
    [DllImport("gdi32.dll")] internal static extern bool DeleteObject(IntPtr value);
    [DllImport("user32.dll")] internal static extern IntPtr SetWinEventHook(uint min, uint max, IntPtr module, WinEventDelegate callback, uint processId, uint threadId, uint flags);
    [DllImport("user32.dll")] internal static extern bool UnhookWinEvent(IntPtr hook);
    [DllImport("user32.dll")] internal static extern IntPtr SetWindowsHookEx(int hookId, MouseHookDelegate callback, IntPtr module, uint threadId);
    [DllImport("user32.dll", EntryPoint = "SetWindowsHookEx")] internal static extern IntPtr SetWindowsHookExKeyboard(int hookId, KeyboardHookDelegate callback, IntPtr module, uint threadId);
    [DllImport("user32.dll")] internal static extern bool UnhookWindowsHookEx(IntPtr hook);
    [DllImport("user32.dll")] internal static extern IntPtr CallNextHookEx(IntPtr hook, int code, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] internal static extern bool SystemParametersInfo(uint action, uint param, string value, uint winIni);

    [StructLayout(LayoutKind.Sequential)]
    internal struct RECT { internal int Left; internal int Top; internal int Right; internal int Bottom; }
    [StructLayout(LayoutKind.Sequential)] internal struct POINT { internal int X; internal int Y; }
    [StructLayout(LayoutKind.Sequential)]
    internal struct MONITORINFO
    {
        internal uint cbSize;
        internal RECT rcMonitor;
        internal RECT rcWork;
        internal uint dwFlags;
    }
    [StructLayout(LayoutKind.Sequential)]
    internal struct MSLLHOOKSTRUCT
    {
        internal POINT point;
        internal uint mouseData;
        internal uint flags;
        internal uint time;
        internal UIntPtr extraInfo;
    }
    [StructLayout(LayoutKind.Sequential)]
    internal struct KBDLLHOOKSTRUCT
    {
        internal uint vkCode;
        internal uint scanCode;
        internal uint flags;
        internal uint time;
        internal UIntPtr extraInfo;
    }

    internal static long GetWindowStyle(IntPtr hwnd)
    {
        return IntPtr.Size == 8 ? GetWindowLong64(hwnd, GWL_STYLE).ToInt64() : GetWindowLong32(hwnd, GWL_STYLE);
    }

    internal static void SetWindowStyle(IntPtr hwnd, long style)
    {
        if (IntPtr.Size == 8) SetWindowLong64(hwnd, GWL_STYLE, new IntPtr(style));
        else SetWindowLong32(hwnd, GWL_STYLE, unchecked((int)style));
    }
}

internal sealed class DesktopWindow : Form
{
    private Image image;
    private Color globalColor;
    private Color topColor;
    private Color bottomColor;
    private Color leftColor;
    private Color rightColor;
    private string alignmentX = "center";
    private string alignmentY = "center";
    private string mode = "diffuse";

    internal DesktopWindow()
    {
        FormBorderStyle = FormBorderStyle.None;
        ShowInTaskbar = false;
        StartPosition = FormStartPosition.Manual;
        DoubleBuffered = true;
    }

    protected override bool ShowWithoutActivation { get { return true; } }

    protected override CreateParams CreateParams
    {
        get
        {
            CreateParams parameters = base.CreateParams;
            parameters.ExStyle |= 0x00000020 | 0x00000080 | 0x08000000;
            return parameters;
        }
    }

    internal void UpdateContent(string imagePath, string nextMode, Color global, Color top, Color bottom, Color left, Color right, string alignX, string alignY)
    {
        Image nextImage;
        using (FileStream stream = new FileStream(imagePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
        using (Image source = Image.FromStream(stream))
        {
            nextImage = new Bitmap(source);
        }
        ApplyImageAndColors(nextImage, nextMode, global, top, bottom, left, right, alignX, alignY);
    }

    // 线程安全：只加载图片，不调用 WinForms 方法，适合后台线程
    internal static Bitmap LoadImageFromFile(string imagePath)
    {
        using (FileStream stream = new FileStream(imagePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
        using (Image source = Image.FromStream(stream))
        {
            return new Bitmap(source);
        }
    }

    // UI 线程：设置已加载的图片 + 触发重绘
    internal void ApplyImageAndColors(Image nextImage, string nextMode, Color global, Color top, Color bottom, Color left, Color right, string alignX, string alignY)
    {
        Image previous = image;
        image = nextImage;
        if (previous != null) previous.Dispose();
        mode = nextMode;
        globalColor = global;
        topColor = top;
        bottomColor = bottom;
        leftColor = left;
        rightColor = right;
        alignmentX = alignX;
        alignmentY = alignY;
        Invalidate();
    }

    protected override void OnPaintBackground(PaintEventArgs eventArgs)
    {
        Graphics graphics = eventArgs.Graphics;
        graphics.Clear(globalColor);
        if (mode == "directional")
        {
            DrawGradient(graphics, ClientRectangle, topColor, Color.Transparent, LinearGradientMode.Vertical);
            DrawGradient(graphics, ClientRectangle, bottomColor, Color.Transparent, LinearGradientMode.Vertical, true);
            DrawGradient(graphics, ClientRectangle, leftColor, Color.Transparent, LinearGradientMode.Horizontal);
            DrawGradient(graphics, ClientRectangle, rightColor, Color.Transparent, LinearGradientMode.Horizontal, true);
        }
    }

    private static void DrawGradient(Graphics graphics, Rectangle bounds, Color edge, Color transparent, LinearGradientMode direction, bool reverse = false)
    {
        Color start = reverse ? transparent : Color.FromArgb(190, edge);
        Color end = reverse ? Color.FromArgb(190, edge) : transparent;
        using (LinearGradientBrush brush = new LinearGradientBrush(bounds, start, end, direction))
        {
            Blend blend = new Blend();
            blend.Positions = new float[] { 0f, 0.45f, 1f };
            blend.Factors = reverse ? new float[] { 0f, 0f, 1f } : new float[] { 1f, 0f, 0f };
            brush.Blend = blend;
            graphics.FillRectangle(brush, bounds);
        }
    }

    protected override void OnPaint(PaintEventArgs eventArgs)
    {
        base.OnPaint(eventArgs);
        if (image == null) return;
        Graphics graphics = eventArgs.Graphics;
        graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
        graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;

        if (mode == "diffuse")
        {
            Rectangle cover = GetCoverBounds(image.Size, ClientSize);
            ColorMatrix matrix = new ColorMatrix();
            matrix.Matrix33 = 0.42f;
            using (System.Drawing.Imaging.ImageAttributes attributes = new System.Drawing.Imaging.ImageAttributes())
            {
                attributes.SetColorMatrix(matrix);
                graphics.DrawImage(image, cover, 0, 0, image.Width, image.Height, GraphicsUnit.Pixel, attributes);
            }
        }

        Rectangle target = GetContainBounds(image.Size, ClientSize, alignmentX, alignmentY);
        graphics.DrawImage(image, target);
    }

    private static Rectangle GetCoverBounds(Size source, Size target)
    {
        double scale = Math.Max((double)target.Width / source.Width, (double)target.Height / source.Height);
        int width = (int)Math.Ceiling(source.Width * scale);
        int height = (int)Math.Ceiling(source.Height * scale);
        return new Rectangle((target.Width - width) / 2, (target.Height - height) / 2, width, height);
    }

    private static Rectangle GetContainBounds(Size source, Size target, string alignX, string alignY)
    {
        double scale = Math.Min((double)target.Width / source.Width, (double)target.Height / source.Height);
        int width = Math.Max(1, (int)Math.Round(source.Width * scale));
        int height = Math.Max(1, (int)Math.Round(source.Height * scale));
        int x = alignX == "left" ? 0 : alignX == "right" ? target.Width - width : (target.Width - width) / 2;
        int y = alignY == "top" ? 0 : alignY == "bottom" ? target.Height - height : (target.Height - height) / 2;
        return new Rectangle(x, y, width, height);
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing && image != null) image.Dispose();
        base.Dispose(disposing);
    }
}

internal sealed class DesktopHostContext : ApplicationContext
{
    private readonly Dictionary<string, DesktopWindow> windows = new Dictionary<string, DesktopWindow>();
    private readonly Dictionary<DesktopWindow, WindowPlacement> placements = new Dictionary<DesktopWindow, WindowPlacement>();
    private readonly HashSet<IntPtr> minimizedWallpaperHolds = new HashSet<IntPtr>();
    private readonly NativeMethods.WinEventDelegate foregroundCallback;
    private readonly NativeMethods.WinEventDelegate minimizeCallback;
    private readonly NativeMethods.MouseHookDelegate mouseCallback;
    private readonly NativeMethods.KeyboardHookDelegate keyboardCallback;
    private readonly Control dispatcher;
    private readonly System.Windows.Forms.Timer focusRefreshTimer;
    private IntPtr foregroundHook;
    private IntPtr minimizeHook;
    private IntPtr mouseHook;
    private IntPtr keyboardHook;
    private bool desktopFocused;
    private bool foregroundChanged;
    private bool minimizeStateChanged;
    private bool ignoreMinimizeForeground;
    private bool altTabRequested;
    private NativeMethods.IDesktopWallpaper desktopWallpaper;
    private readonly StaWorker composeWorker = new StaWorker();

    internal DesktopHostContext()
    {
        // 降低进程优先级：只在 CPU 空闲碎片时间运行，不抢前台应用资源
        try { Process.GetCurrentProcess().PriorityClass = ProcessPriorityClass.BelowNormal; }
        catch { }

        dispatcher = new Control();
        dispatcher.CreateControl();
        focusRefreshTimer = new System.Windows.Forms.Timer();
        focusRefreshTimer.Interval = 60;
        focusRefreshTimer.Tick += delegate
        {
            focusRefreshTimer.Stop();
            RefreshDesktopFocus();
        };
        foregroundCallback = OnWindowEvent;
        minimizeCallback = OnWindowEvent;
        mouseCallback = OnMouseEvent;
        keyboardCallback = OnKeyboardEvent;
        foregroundHook = NativeMethods.SetWinEventHook(NativeMethods.EVENT_SYSTEM_FOREGROUND, NativeMethods.EVENT_SYSTEM_FOREGROUND, IntPtr.Zero, foregroundCallback, 0, 0, NativeMethods.WINEVENT_OUTOFCONTEXT);
        minimizeHook = NativeMethods.SetWinEventHook(NativeMethods.EVENT_SYSTEM_MINIMIZESTART, NativeMethods.EVENT_SYSTEM_MINIMIZEEND, IntPtr.Zero, minimizeCallback, 0, 0, NativeMethods.WINEVENT_OUTOFCONTEXT);
        mouseHook = NativeMethods.SetWindowsHookEx(NativeMethods.WH_MOUSE_LL, mouseCallback, IntPtr.Zero, 0);
        keyboardHook = NativeMethods.SetWindowsHookExKeyboard(NativeMethods.WH_KEYBOARD_LL, keyboardCallback, IntPtr.Zero, 0);
        desktopFocused = IsDesktopForeground(NativeMethods.GetForegroundWindow());
        Console.WriteLine("FOCUS\t" + (desktopFocused ? "1" : "0") + "\t0");
        Console.Out.Flush();
        Thread inputThread = new Thread(ReadCommands);
        inputThread.IsBackground = true;
        inputThread.Start();
    }

    private void ReadCommands()
    {
        string line;
        while ((line = Console.ReadLine()) != null)
        {
            string command = line;
            dispatcher.BeginInvoke(new Action(delegate { HandleCommand(command); }));
        }
        dispatcher.BeginInvoke(new Action(ExitThread));
    }

    private void HandleCommand(string line)
    {
        string[] parts = line.Split('\t');
        if (parts.Length == 0) return;
        if (parts[0] == "EXIT") { ExitThread(); return; }
        if (parts[0] == "FOCUSSTAT")
        {
            // 返回当前桌面焦点状态（供 wallpaper-service 查询，复用同一套 WinEvent 检测）
            RefreshDesktopFocus();
            Console.WriteLine("FOCUSSTAT\t" + (desktopFocused ? "1" : "0"));
            Console.Out.Flush();
            return;
        }
        if (parts[0] == "MONITORS")
        {
            ListMonitors();
            return;
        }
        if (parts[0] == "SETWP" && parts.Length >= 4)
        {
            SetWallpaperDirect(
                parts[1],
                Encoding.UTF8.GetString(Convert.FromBase64String(parts[2])),
                Encoding.UTF8.GetString(Convert.FromBase64String(parts[3])));
            return;
        }
        if (parts[0] == "SETWPS" && parts.Length >= 4)
        {
            string requestId = parts[1];
            int count;
            if (!int.TryParse(parts[2], out count) || count < 1 || parts.Length != 3 + count * 2)
            {
                Console.Error.WriteLine("SETWPS_ERROR: invalid request");
                return;
            }
            List<KeyValuePair<string, string>> updates = new List<KeyValuePair<string, string>>();
            for (int index = 0; index < count; index++)
            {
                int field = 3 + index * 2;
                updates.Add(new KeyValuePair<string, string>(
                    Encoding.UTF8.GetString(Convert.FromBase64String(parts[field])),
                    Encoding.UTF8.GetString(Convert.FromBase64String(parts[field + 1]))));
            }
            SetWallpapersDirect(requestId, updates);
            return;
        }
        if (parts[0] == "COMPOSE" && parts.Length >= 21)
        {
            string requestId = parts[1];
            string characterPath = Encoding.UTF8.GetString(Convert.FromBase64String(parts[2]));
            int composeW = int.Parse(parts[3]);
            int composeH = int.Parse(parts[4]);
            Color composeBg = ParseColor(parts[5]);
            string alignX = parts[6];
            string alignY = parts[7];
            string outputPath = Encoding.UTF8.GetString(Convert.FromBase64String(parts[8]));
            Color gradientTop = ParseColor(parts[9]);
            Color gradientBottom = ParseColor(parts[10]);
            Color gradientLeft = ParseColor(parts[11]);
            Color gradientRight = ParseColor(parts[12]);
            bool cutTop = parts[13] == "1";
            bool cutBottom = parts[14] == "1";
            bool cutLeft = parts[15] == "1";
            bool cutRight = parts[16] == "1";
            int contentLeft = int.Parse(parts[17]);
            int contentTop = int.Parse(parts[18]);
            int contentRight = int.Parse(parts[19]);
            int contentBottom = int.Parse(parts[20]);

            // 长驻 STA 线程处理合成（零线程创建开销 + WPF Dispatcher 就绪）
            composeWorker.Queue(() =>
            {
                string resultPath = ComposeWallpaperImage(characterPath, composeW, composeH, composeBg,
                    alignX, alignY, outputPath,
                    gradientTop, gradientBottom, gradientLeft, gradientRight,
                    cutTop, cutBottom, cutLeft, cutRight,
                    contentLeft, contentTop, contentRight, contentBottom);
                Console.WriteLine("COMPOSED\t" + requestId + "\t" + Convert.ToBase64String(Encoding.UTF8.GetBytes(resultPath ?? "")));
                Console.Out.Flush();
            });
            return;
        }
        if (parts[0] != "SET" || parts.Length < 16) return;

        string id = parts[1];
        int x = int.Parse(parts[2]);
        int y = int.Parse(parts[3]);
        int width = int.Parse(parts[4]);
        int height = int.Parse(parts[5]);
        string imagePath = Encoding.UTF8.GetString(Convert.FromBase64String(parts[6]));
        DesktopWindow window;
        if (!windows.TryGetValue(id, out window))
        {
            window = new DesktopWindow();
            windows.Add(id, window);
            IntPtr unused = window.Handle;
        }
        string layerMode = parts[15];
        WindowPlacement placement = new WindowPlacement(x, y, width, height, layerMode);
        placements[window] = placement;

        // 捕获参数给后台线程 — 图片加载不能阻塞 UI 消息泵
        var win = window;
        var imgPath = imagePath;
        var mode = parts[7];
        var c8 = ParseColor(parts[8]);
        var c9 = ParseColor(parts[9]);
        var c10 = ParseColor(parts[10]);
        var c11 = ParseColor(parts[11]);
        var c12 = ParseColor(parts[12]);
        var aX = parts[13];
        var aY = parts[14];
        var visible = ShouldShowWindow(placement, desktopFocused);
        var sw = Stopwatch.StartNew();

        composeWorker.Queue(() =>
        {
            try
            {
                // 后台线程加载图片，不阻塞 UI 消息泵
                var loaded = DesktopWindow.LoadImageFromFile(imgPath);
                dispatcher.BeginInvoke(new Action(() =>
                {
                    win.ApplyImageAndColors(loaded, mode, c8, c9, c10, c11, c12, aX, aY);
                    SetWindowVisible(win, visible);
                    string layerResult = ApplyPlacement(win, placement, visible);
                    sw.Stop();
                    Console.Error.WriteLine(string.Format("PERF\tSET({2}x{3})\tload={0}ms\ttotal={1}ms\tlayer={4}",
                        sw.ElapsedMilliseconds - (sw.ElapsedMilliseconds > 0 ? 0 : 0), sw.ElapsedMilliseconds, width, height, layerResult));
                    Console.WriteLine("READY\t" + id + "\t" + layerResult);
                    Console.Out.Flush();
                }));
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("SET_ERROR: " + ex.Message);
                dispatcher.BeginInvoke(new Action(() =>
                {
                    Console.WriteLine("READY\t" + id + "\terror");
                    Console.Out.Flush();
                }));
            }
        });
        Console.Out.Flush();
    }

    private static Color ParseColor(string value)
    {
        return ColorTranslator.FromHtml(value);
    }

    private static string ComposeWallpaperImage(string characterPath, int width, int height, Color bgColor,
        string alignX, string alignY, string outputPath,
        Color gradientTop, Color gradientBottom, Color gradientLeft, Color gradientRight,
        bool cutTop, bool cutBottom, bool cutLeft, bool cutRight,
        int contentLeft, int contentTop, int contentRight, int contentBottom)
    {
        var totalSw = Stopwatch.StartNew();
        var stepSw = Stopwatch.StartNew();
        try
        {
            string outDir = Path.GetDirectoryName(outputPath);
            if (!string.IsNullOrEmpty(outDir) && !Directory.Exists(outDir))
                Directory.CreateDirectory(outDir);

            // ① WIC 解码角色 PNG → GPU 纹理
            stepSw.Restart();
            var decoder = WpfImaging.BitmapDecoder.Create(
                new Uri(characterPath),
                WpfImaging.BitmapCreateOptions.PreservePixelFormat,
                WpfImaging.BitmapCacheOption.OnLoad);
            var charSrc = decoder.Frames[0];
            charSrc.Freeze();
            long tDecode = stepSw.ElapsedMilliseconds;

            double charW = charSrc.PixelWidth;
            double charH = charSrc.PixelHeight;

            double padding = 0.05;
            double availW = width * (1 - 2 * padding);
            double availH = height * (1 - 2 * padding);
            double scale = Math.Min(availW / charW, availH / charH);
            int contentW = contentRight - contentLeft + 1;
            int contentH = contentBottom - contentTop + 1;

            if (cutLeft && cutRight && contentW > 0)
                scale = Math.Max(scale, (double)(width + 4) / contentW);
            if (cutTop && cutBottom && contentH > 0)
                scale = Math.Max(scale, (double)(height + 4) / contentH);

            double drawW = Math.Max(1, charW * scale);
            double drawH = Math.Max(1, charH * scale);

            double x, y;
            if (cutLeft && cutRight) { double cx = (contentLeft + contentRight + 1) / 2.0; x = width / 2.0 - cx * scale; }
            else if (cutLeft) x = -contentLeft * scale - 2;
            else if (cutRight) x = width - (contentRight + 1) * scale + 2;
            else if (alignX == "left") x = width * padding;
            else if (alignX == "right") x = width - width * padding - drawW;
            else x = (width - drawW) / 2.0;

            if (cutTop && cutBottom) { double cy = (contentTop + contentBottom + 1) / 2.0; y = height / 2.0 - cy * scale; }
            else if (cutTop) y = -contentTop * scale - 2;
            else if (cutBottom) y = height - (contentBottom + 1) * scale + 2;
            else if (alignY == "top") y = height * padding;
            else if (alignY == "bottom") y = height - height * padding - drawH;
            else y = (height - drawH) / 2.0;

            // ② DrawingVisual RenderOpen → GPU 管线发出绘制命令
            stepSw.Restart();
            var visual = new WpfMedia.DrawingVisual();
            using (var dc = visual.RenderOpen())
            {
                var cBg = System.Windows.Media.Color.FromRgb(bgColor.R, bgColor.G, bgColor.B);
                dc.DrawRectangle(new WpfMedia.SolidColorBrush(cBg), null,
                    new System.Windows.Rect(0, 0, width, height));

                if (bgColor.ToArgb() != gradientTop.ToArgb() || bgColor.ToArgb() != gradientBottom.ToArgb())
                {
                    var cTop = System.Windows.Media.Color.FromRgb(gradientTop.R, gradientTop.G, gradientTop.B);
                    var cBot = System.Windows.Media.Color.FromRgb(gradientBottom.R, gradientBottom.G, gradientBottom.B);
                    var gb = new WpfMedia.LinearGradientBrush(cTop, cBot,
                        new System.Windows.Point(0, 0), new System.Windows.Point(0, 1));
                    gb.Freeze();
                    dc.DrawRectangle(gb, null, new System.Windows.Rect(0, 0, width, height));
                }

                dc.DrawImage(charSrc, new System.Windows.Rect(x, y, drawW, drawH));
            }
            long tDrawCommands = stepSw.ElapsedMilliseconds;

            // ③ RenderTargetBitmap → GPU 渲染到纹理 → GPU→CPU 读回
            stepSw.Restart();
            var rtb = new WpfImaging.RenderTargetBitmap(width, height, 96, 96,
                WpfMedia.PixelFormats.Pbgra32);
            rtb.Render(visual);
            long tGpuRender = stepSw.ElapsedMilliseconds;

            // ④ PNG 编码（CPU）
            stepSw.Restart();
            var encoder = new WpfImaging.PngBitmapEncoder();
            encoder.Frames.Add(WpfImaging.BitmapFrame.Create(rtb));
            using (var fs = new FileStream(outputPath, FileMode.Create))
                encoder.Save(fs);
            long tPngEncode = stepSw.ElapsedMilliseconds;

            totalSw.Stop();
            Console.Error.WriteLine(string.Format("PERF\t{0}x{1}\tdecode={2}ms\tdraw={3}ms\tgpu={4}ms\tpng={5}ms\ttotal={6}ms",
                width, height, tDecode, tDrawCommands, tGpuRender, tPngEncode, totalSw.ElapsedMilliseconds));
            return outputPath;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("COMPOSE_ERROR: " + ex.Message);
            return outputPath;
        }
    }

    private NativeMethods.IDesktopWallpaper GetDesktopWallpaper()
    {
        if (desktopWallpaper == null) desktopWallpaper = (NativeMethods.IDesktopWallpaper)new NativeMethods.DesktopWallpaperClass();
        return desktopWallpaper;
    }

    private void ListMonitors()
    {
        try
        {
            NativeMethods.IDesktopWallpaper wallpaper = GetDesktopWallpaper();
            uint count = wallpaper.GetMonitorDevicePathCount();
            NativeMethods.DESKTOP_WALLPAPER_POSITION position = wallpaper.GetPosition();
            for (uint i = 0; i < count; i++)
            {
                string monitorId = wallpaper.GetMonitorDevicePathAt(i);
                NativeMethods.RECT rect;
                wallpaper.GetMonitorRECT(monitorId, out rect);
                Console.WriteLine(
                    "MONITOR\t" + monitorId
                    + "\t" + rect.Left
                    + "\t" + rect.Top
                    + "\t" + (rect.Right - rect.Left)
                    + "\t" + (rect.Bottom - rect.Top)
                    + "\t" + position.ToString().ToLowerInvariant());
            }
            Console.WriteLine("MONITORS_END\t" + count);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("MONITORS_ERROR: " + ex.Message);
        }
        Console.Out.Flush();
    }

    private void SetWallpaperDirect(string requestId, string monitorId, string imagePath)
    {
        composeWorker.Queue(() =>
        {
            try
            {
                var wp = (NativeMethods.IDesktopWallpaper)new NativeMethods.DesktopWallpaperClass();
                wp.SetWallpaper(monitorId, imagePath);
                Console.WriteLine("SETWP_OK\t" + requestId);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("SETWP_ERROR\t" + requestId + "\t" + ex.Message);
            }
            Console.Out.Flush();
        });
    }

    private void SetWallpapersDirect(string requestId, List<KeyValuePair<string, string>> updates)
    {
        composeWorker.Queue(() =>
        {
            try
            {
                var wp = (NativeMethods.IDesktopWallpaper)new NativeMethods.DesktopWallpaperClass();
                foreach (KeyValuePair<string, string> update in updates)
                    wp.SetWallpaper(update.Key, update.Value);
                Console.WriteLine("SETWPS_OK\t" + requestId);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("SETWPS_ERROR\t" + requestId + "\t" + ex.Message);
            }
            Console.Out.Flush();
        });
    }

    private static bool ShouldShowWindow(WindowPlacement placement, bool isDesktopFocused)
    {
        return !placement.LayerMode.StartsWith("top-level-") || isDesktopFocused;
    }

    private static void SetWindowVisible(DesktopWindow window, bool visible)
    {
        if (visible)
        {
            if (!window.Visible) window.Show();
            window.Invalidate();
            window.Update();
        }
        else if (window.Visible)
        {
            window.Hide();
        }
    }

    private sealed class DesktopWindows
    {
        internal IntPtr IconHost;
        internal IntPtr DesktopView;
        internal IntPtr ProgmanWorker;
        internal readonly List<IntPtr> TopLevelWorkers = new List<IntPtr>();
    }

    private static readonly object wallpaperLock = new object();
    private static string clearedWallpaperPath = null;

    private static void ClearSystemWallpaper()
    {
        lock (wallpaperLock)
        {
            if (clearedWallpaperPath != null) return;
            try
            {
                using (Microsoft.Win32.RegistryKey key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Control Panel\Desktop"))
                {
                    if (key != null)
                    {
                        object value = key.GetValue("Wallpaper");
                        string previous = value as string;
                        if (!string.IsNullOrEmpty(previous))
                        {
                            clearedWallpaperPath = previous;
                        }
                    }
                }
            }
            catch { }
            NativeMethods.SystemParametersInfo(NativeMethods.SPI_SETDESKWALLPAPER, 0, "", 0);
        }
    }

    private static void RestoreSystemWallpaper()
    {
        lock (wallpaperLock)
        {
            if (clearedWallpaperPath == null) return;
            try
            {
                NativeMethods.SystemParametersInfo(NativeMethods.SPI_SETDESKWALLPAPER, 0, clearedWallpaperPath, 0);
            }
            catch { }
            clearedWallpaperPath = null;
        }
    }

    private static void ApplyIconCutouts(DesktopWindow window, DesktopWindows desktop, WindowPlacement placement)
    {
        IntPtr listView = NativeMethods.FindWindowEx(desktop.DesktopView, IntPtr.Zero, "SysListView32", null);
        if (listView == IntPtr.Zero) return;
        uint processId;
        NativeMethods.GetWindowThreadProcessId(listView, out processId);
        IntPtr process = NativeMethods.OpenProcess(
            NativeMethods.PROCESS_VM_OPERATION | NativeMethods.PROCESS_VM_READ | NativeMethods.PROCESS_VM_WRITE,
            false,
            processId);
        if (process == IntPtr.Zero) return;

        int rectSize = Marshal.SizeOf(typeof(NativeMethods.RECT));
        IntPtr remoteRect = NativeMethods.VirtualAllocEx(
            process,
            IntPtr.Zero,
            new UIntPtr((uint)rectSize),
            NativeMethods.MEM_COMMIT | NativeMethods.MEM_RESERVE,
            NativeMethods.PAGE_READWRITE);
        IntPtr windowRegion = NativeMethods.CreateRectRgn(0, 0, placement.Width, placement.Height);
        try
        {
            if (remoteRect == IntPtr.Zero || windowRegion == IntPtr.Zero) return;
            NativeMethods.POINT listOrigin = new NativeMethods.POINT();
            NativeMethods.ClientToScreen(listView, ref listOrigin);
            int itemCount = NativeMethods.SendMessage(listView, NativeMethods.LVM_GETITEMCOUNT, IntPtr.Zero, IntPtr.Zero).ToInt32();
            for (int index = 0; index < itemCount; index++)
            {
                NativeMethods.RECT request = new NativeMethods.RECT();
                request.Left = 0;
                UIntPtr transferred;
                if (!NativeMethods.WriteProcessMemory(process, remoteRect, ref request, new UIntPtr((uint)rectSize), out transferred)) continue;
                if (NativeMethods.SendMessage(listView, NativeMethods.LVM_GETITEMRECT, new IntPtr(index), remoteRect) == IntPtr.Zero) continue;
                NativeMethods.RECT iconRect;
                if (!NativeMethods.ReadProcessMemory(process, remoteRect, out iconRect, new UIntPtr((uint)rectSize), out transferred)) continue;
                int left = listOrigin.X + iconRect.Left - placement.X - 8;
                int top = listOrigin.Y + iconRect.Top - placement.Y - 6;
                int right = listOrigin.X + iconRect.Right - placement.X + 8;
                int bottom = listOrigin.Y + iconRect.Bottom - placement.Y + 6;
                IntPtr iconRegion = NativeMethods.CreateRectRgn(left, top, right, bottom);
                if (iconRegion == IntPtr.Zero) continue;
                NativeMethods.CombineRgn(windowRegion, windowRegion, iconRegion, NativeMethods.RGN_DIFF);
                NativeMethods.DeleteObject(iconRegion);
            }
            if (NativeMethods.SetWindowRgn(window.Handle, windowRegion, true) != 0) windowRegion = IntPtr.Zero;
        }
        finally
        {
            if (windowRegion != IntPtr.Zero) NativeMethods.DeleteObject(windowRegion);
            if (remoteRect != IntPtr.Zero) NativeMethods.VirtualFreeEx(process, remoteRect, UIntPtr.Zero, NativeMethods.MEM_RELEASE);
            NativeMethods.CloseHandle(process);
        }
    }

    private static void ClipToWorkArea(ref int x, ref int y, ref int width, ref int height)
    {
        NativeMethods.POINT center = new NativeMethods.POINT();
        center.X = x + width / 2;
        center.Y = y + height / 2;
        IntPtr monitor = NativeMethods.MonitorFromPoint(center, NativeMethods.MONITOR_DEFAULTTONEAREST);
        if (monitor == IntPtr.Zero) return;
        NativeMethods.MONITORINFO info = new NativeMethods.MONITORINFO();
        info.cbSize = (uint)Marshal.SizeOf(typeof(NativeMethods.MONITORINFO));
        if (!NativeMethods.GetMonitorInfo(monitor, ref info)) return;
        int newLeft = Math.Max(x, info.rcWork.Left);
        int newTop = Math.Max(y, info.rcWork.Top);
        int newRight = Math.Min(x + width, info.rcWork.Right);
        int newBottom = Math.Min(y + height, info.rcWork.Bottom);
        if (newRight > newLeft && newBottom > newTop)
        {
            x = newLeft;
            y = newTop;
            width = newRight - newLeft;
            height = newBottom - newTop;
        }
    }

    private sealed class WindowPlacement
    {
        internal readonly int X;
        internal readonly int Y;
        internal readonly int Width;
        internal readonly int Height;
        internal readonly string LayerMode;

        internal WindowPlacement(int x, int y, int width, int height, string layerMode)
        {
            X = x;
            Y = y;
            Width = width;
            Height = height;
            LayerMode = layerMode;
        }
    }

    private static DesktopWindows FindDesktopWindows()
    {
        DesktopWindows result = new DesktopWindows();
        NativeMethods.EnumWindows(delegate(IntPtr top, IntPtr unused)
        {
            StringBuilder className = new StringBuilder(128);
            NativeMethods.GetClassName(top, className, className.Capacity);
            if (className.ToString() == "WorkerW") result.TopLevelWorkers.Add(top);

            IntPtr view = NativeMethods.FindWindowEx(top, IntPtr.Zero, "SHELLDLL_DefView", null);
            if (view != IntPtr.Zero)
            {
                result.IconHost = top;
                result.DesktopView = view;
                result.ProgmanWorker = NativeMethods.FindWindowEx(top, IntPtr.Zero, "WorkerW", null);
            }
            return true;
        }, IntPtr.Zero);
        if (result.IconHost == IntPtr.Zero) result.IconHost = NativeMethods.FindWindow("Progman", null);
        return result;
    }

    private static string ApplyPlacement(DesktopWindow window, WindowPlacement placement, bool visible)
    {
        int x = placement.X;
        int y = placement.Y;
        int width = placement.Width;
        int height = placement.Height;
        string layerMode = placement.LayerMode;
        DesktopWindows desktop = FindDesktopWindows();
        IntPtr parent = desktop.IconHost;
        IntPtr insertAfter = new IntPtr(NativeMethods.HWND_BOTTOM);
        bool childMode = true;

        if (layerMode == "progman-worker")
        {
            parent = desktop.ProgmanWorker != IntPtr.Zero ? desktop.ProgmanWorker : desktop.IconHost;
        }
        else if (layerMode == "progman-behind-icons")
        {
            insertAfter = desktop.DesktopView;
        }
        else if (layerMode == "progman-front")
        {
            insertAfter = new IntPtr(NativeMethods.HWND_TOP);
        }
        else if (layerMode == "top-level-behind-icons")
        {
            childMode = false;
            parent = IntPtr.Zero;
            insertAfter = desktop.IconHost;
            ClipToWorkArea(ref x, ref y, ref width, ref height);
        }
        else if (layerMode == "top-level-bottom")
        {
            parent = desktop.DesktopView;
            insertAfter = new IntPtr(NativeMethods.HWND_BOTTOM);
        }
        else if (layerMode == "top-level-front")
        {
            childMode = false;
            parent = IntPtr.Zero;
            insertAfter = new IntPtr(NativeMethods.HWND_TOP);
            ClipToWorkArea(ref x, ref y, ref width, ref height);
        }
        else if (layerMode == "top-level-icon-cutouts")
        {
            childMode = false;
            parent = IntPtr.Zero;
            insertAfter = new IntPtr(NativeMethods.HWND_TOP);
            ClipToWorkArea(ref x, ref y, ref width, ref height);
        }
        else if (layerMode.StartsWith("worker-"))
        {
            int workerIndex;
            if (!int.TryParse(layerMode.Substring(7), out workerIndex) || workerIndex < 0 || workerIndex >= desktop.TopLevelWorkers.Count)
                throw new InvalidOperationException("Requested top-level WorkerW is unavailable: " + layerMode);
            parent = desktop.TopLevelWorkers[workerIndex];
        }

        if (childMode && parent == IntPtr.Zero) throw new InvalidOperationException("Desktop host not found for mode: " + layerMode);
        long style = NativeMethods.GetWindowStyle(window.Handle);
        if (childMode)
        {
            NativeMethods.SetWindowStyle(window.Handle, (style & ~NativeMethods.WS_POPUP) | NativeMethods.WS_CHILD);
            NativeMethods.SetParent(window.Handle, parent);
            if (NativeMethods.GetParent(window.Handle) != parent)
                throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error(), "Failed to attach native window to desktop host");
        }
        else
        {
            NativeMethods.SetWindowStyle(window.Handle, (style & ~NativeMethods.WS_CHILD) | NativeMethods.WS_POPUP);
            NativeMethods.SetParent(window.Handle, IntPtr.Zero);
        }

        int targetX = x;
        int targetY = y;
        if (childMode)
        {
            NativeMethods.RECT hostRect;
            if (!NativeMethods.GetWindowRect(parent, out hostRect)) throw new InvalidOperationException("Desktop host bounds unavailable");
            targetX -= hostRect.Left;
            targetY -= hostRect.Top;
        }
        if (visible) NativeMethods.ShowWindow(window.Handle, NativeMethods.SW_SHOWNOACTIVATE);
        if (!NativeMethods.SetWindowPos(window.Handle, insertAfter, targetX, targetY, width, height, NativeMethods.SWP_NOACTIVATE))
            throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error(), "Failed to position native desktop window");
        if (childMode)
        {
            // Reassert the absolute size on the child window itself. Without this, some Windows builds
            // collapse the WS_CHILD child back to the host's 6x6 working area after SetParent.
            window.Size = new Size(width, height);
            if (!NativeMethods.SetWindowPos(window.Handle, IntPtr.Zero, targetX, targetY, width, height, NativeMethods.SWP_NOZORDER | NativeMethods.SWP_NOACTIVATE))
                throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error(), "Failed to enforce child window bounds");
        }
        if (layerMode == "top-level-icon-cutouts") ApplyIconCutouts(window, desktop, placement);
        else NativeMethods.SetWindowRgn(window.Handle, IntPtr.Zero, true);
        return layerMode + ":parent=" + parent.ToInt64() + ":after=" + insertAfter.ToInt64();
    }

    private bool IsDesktopWindow(IntPtr window)
    {
        if (window == IntPtr.Zero) return false;
        foreach (DesktopWindow desktopWindow in windows.Values)
        {
            if (desktopWindow.Handle == window) return true;
        }
        StringBuilder className = new StringBuilder(128);
        NativeMethods.GetClassName(window, className, className.Capacity);
        string value = className.ToString();
        return value == "Progman" || value == "WorkerW";
    }

    private bool IsDesktopForeground(IntPtr window)
    {
        return window == IntPtr.Zero || IsDesktopWindow(window) || NativeMethods.IsIconic(window);
    }

    private bool IsTaskbarWindow(IntPtr window)
    {
        if (window == IntPtr.Zero) return false;
        StringBuilder className = new StringBuilder(128);
        NativeMethods.GetClassName(window, className, className.Capacity);
        string value = className.ToString();
        return value == "Shell_TrayWnd" || value == "Shell_SecondaryTrayWnd";
    }

    private IntPtr OnMouseEvent(int code, IntPtr wParam, IntPtr lParam)
    {
        int message = wParam.ToInt32();
        if (code >= 0 && (message == NativeMethods.WM_LBUTTONDOWN || message == NativeMethods.WM_RBUTTONDOWN || message == NativeMethods.WM_MBUTTONDOWN))
        {
            NativeMethods.MSLLHOOKSTRUCT mouse = (NativeMethods.MSLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(NativeMethods.MSLLHOOKSTRUCT));
            IntPtr clickedWindow = NativeMethods.GetAncestor(NativeMethods.WindowFromPoint(mouse.point), NativeMethods.GA_ROOT);
            dispatcher.BeginInvoke(new Action(delegate { EndMinimizeHoldForClick(clickedWindow); }));
        }
        return NativeMethods.CallNextHookEx(mouseHook, code, wParam, lParam);
    }

    private IntPtr OnKeyboardEvent(int code, IntPtr wParam, IntPtr lParam)
    {
        if (code >= 0 && wParam.ToInt32() == NativeMethods.WM_KEYDOWN)
        {
            NativeMethods.KBDLLHOOKSTRUCT keyboard = (NativeMethods.KBDLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(NativeMethods.KBDLLHOOKSTRUCT));
            if (keyboard.vkCode == NativeMethods.VK_TAB && (keyboard.flags & NativeMethods.LLKHF_ALTDOWN) != 0)
            {
                dispatcher.BeginInvoke(new Action(delegate
                {
                    if (minimizedWallpaperHolds.Count > 0) altTabRequested = true;
                }));
            }
        }
        return NativeMethods.CallNextHookEx(keyboardHook, code, wParam, lParam);
    }

    private void EndMinimizeHoldForClick(IntPtr clickedWindow)
    {
        if (minimizedWallpaperHolds.Count == 0 || clickedWindow == IntPtr.Zero) return;
        if (IsDesktopWindow(clickedWindow) || IsTaskbarWindow(clickedWindow)) return;
        minimizedWallpaperHolds.Clear();
        ignoreMinimizeForeground = false;
        altTabRequested = false;
        Console.WriteLine("MINIMIZE_HOLD_END\tclick");
        Console.Out.Flush();
    }

    private void OnWindowEvent(IntPtr hook, uint eventType, IntPtr hwnd, int objectId, int childId, uint threadId, uint time)
    {
        if (eventType == NativeMethods.EVENT_SYSTEM_MINIMIZESTART)
        {
            if (hwnd != IntPtr.Zero) minimizedWallpaperHolds.Add(hwnd);
            minimizeStateChanged = true;
            ignoreMinimizeForeground = true;
            altTabRequested = false;
        }
        else if (eventType == NativeMethods.EVENT_SYSTEM_MINIMIZEEND)
        {
            minimizedWallpaperHolds.Remove(hwnd);
            minimizeStateChanged = true;
        }
        else if (eventType == NativeMethods.EVENT_SYSTEM_FOREGROUND)
        {
            foregroundChanged = true;
        }
        focusRefreshTimer.Stop();
        focusRefreshTimer.Start();
    }

    private void RefreshDesktopFocus()
    {
        bool visible = IsDesktopForeground(NativeMethods.GetForegroundWindow());
        bool changedForeground = foregroundChanged;
        bool minimizationChanged = minimizeStateChanged;
        foregroundChanged = false;
        minimizeStateChanged = false;
        if (minimizedWallpaperHolds.Count > 0)
        {
            if (minimizationChanged)
            {
                Console.WriteLine("MINIMIZE_HOLD\t" + minimizedWallpaperHolds.Count);
                Console.Out.Flush();
            }
            if (changedForeground && ignoreMinimizeForeground)
            {
                ignoreMinimizeForeground = false;
                if (altTabRequested && !visible)
                {
                    minimizedWallpaperHolds.Clear();
                    altTabRequested = false;
                    Console.WriteLine("MINIMIZE_HOLD_END\talt-tab");
                    Console.Out.Flush();
                }
            }
            else if (changedForeground && !visible)
            {
                minimizedWallpaperHolds.Clear();
                altTabRequested = false;
                Console.WriteLine("MINIMIZE_HOLD_END");
                Console.Out.Flush();
            }
        }
        else if (!visible && minimizationChanged)
        {
            altTabRequested = false;
            Console.WriteLine("MINIMIZE_HOLD_END");
            Console.Out.Flush();
        }
        else
        {
            UpdateDesktopFocus(visible);
        }
    }

    private void UpdateDesktopFocus(bool visible)
    {
        if (visible == desktopFocused) return;
        desktopFocused = visible;
        int visibleCount = 0;
        foreach (DesktopWindow window in windows.Values)
        {
            WindowPlacement placement;
            if (!placements.TryGetValue(window, out placement)) continue;
            bool shouldShow = ShouldShowWindow(placement, visible);
            SetWindowVisible(window, shouldShow);
            if (shouldShow) ApplyPlacement(window, placement, true);
            if (window.Visible) visibleCount++;
        }
        Console.WriteLine("FOCUS\t" + (visible ? "1" : "0") + "\t" + visibleCount);
        Console.Out.Flush();
    }

    protected override void ExitThreadCore()
    {
        RestoreSystemWallpaper();
        if (foregroundHook != IntPtr.Zero) NativeMethods.UnhookWinEvent(foregroundHook);
        if (minimizeHook != IntPtr.Zero) NativeMethods.UnhookWinEvent(minimizeHook);
        if (mouseHook != IntPtr.Zero) NativeMethods.UnhookWindowsHookEx(mouseHook);
        focusRefreshTimer.Stop();
        focusRefreshTimer.Dispose();
        foreach (DesktopWindow window in windows.Values) window.Dispose();
        windows.Clear();
        placements.Clear();
            minimizedWallpaperHolds.Clear();
            if (desktopWallpaper != null) Marshal.FinalReleaseComObject(desktopWallpaper);
            desktopWallpaper = null;
        if (keyboardHook != IntPtr.Zero) NativeMethods.UnhookWindowsHookEx(keyboardHook);
        composeWorker.Dispose();
        dispatcher.Dispose();
        base.ExitThreadCore();
    }
}

// 长驻 STA 后台线程 + WPF Dispatcher，处理 COMPOSE 和 SETWP 请求
// 避免每次创建新线程的开销（5-20ms/次），同时确保 COM 和 WPF 都有正确的线程模型
internal sealed class StaWorker : IDisposable
{
    private readonly Thread thread;
    private readonly AutoResetEvent signal = new AutoResetEvent(false);
    private readonly object lockObj = new object();
    private readonly Queue<Action> queue = new Queue<Action>();
    private volatile bool disposed;
    private System.Windows.Threading.Dispatcher wpfDispatcher;

    public StaWorker()
    {
        thread = new Thread(Run);
        thread.SetApartmentState(ApartmentState.STA);
        thread.IsBackground = true;
        thread.Start();
    }

    public void Queue(Action action)
    {
        if (disposed) return;
        lock (lockObj)
        {
            queue.Enqueue(action);
        }
        signal.Set();
    }

    private void Run()
    {
        // 初始化 WPF Dispatcher 供 ComposeWallpaperImage 使用
        wpfDispatcher = System.Windows.Threading.Dispatcher.CurrentDispatcher;

        while (!disposed)
        {
            signal.WaitOne();
            if (disposed) break;

            Action action = null;
            lock (lockObj)
            {
                if (queue.Count > 0)
                    action = queue.Dequeue();
            }

            if (action != null)
            {
                try { action(); }
                catch (Exception ex)
                {
                    Console.Error.WriteLine("STA_WORKER_ERROR: " + ex.Message);
                }
            }
        }
    }

    public void Dispose()
    {
        disposed = true;
        signal.Set();
        // 线程退出时 WPF Dispatcher 会自动关闭
        if (!thread.Join(1000))
            try { thread.Abort(); } catch { }
        signal.Dispose();
    }
}

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        NativeMethods.SetProcessDpiAwarenessContext(new IntPtr(-4));
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new DesktopHostContext());
    }
}