const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

if (process.platform !== 'win32') process.exit(0);

const frameworkRoot = path.join(process.env.WINDIR || 'C:\\Windows', 'Microsoft.NET');
const candidates = [
  path.join(frameworkRoot, 'Framework64', 'v4.0.30319', 'csc.exe'),
  path.join(frameworkRoot, 'Framework', 'v4.0.30319', 'csc.exe')
];
const compiler = candidates.find(fs.existsSync);
if (!compiler) {
  console.error('Windows .NET Framework C# compiler was not found.');
  process.exit(1);
}

// WPF 程序集路径（GPU 加速渲染，.NET Framework 自带）
const wpfLib = path.join(frameworkRoot, 'Framework64', 'v4.0.30319', 'WPF');
const wpfLib32 = path.join(frameworkRoot, 'Framework', 'v4.0.30319', 'WPF');
const wpfDir = fs.existsSync(wpfLib) ? wpfLib : (fs.existsSync(wpfLib32) ? wpfLib32 : '');

const source = path.join(__dirname, '..', 'src', 'native', 'desktop-host.cs');
const output = path.join(__dirname, '..', 'src', 'native', 'desktop-host.exe');
if (fs.existsSync(output) && fs.statSync(output).mtimeMs >= fs.statSync(source).mtimeMs) {
  process.exit(0);
}
const result = spawnSync(compiler, [
  '/nologo',
  '/target:winexe',
  '/platform:anycpu',
  '/optimize+',
  '/r:System.dll',
  '/r:System.Core.dll',
  '/r:System.Drawing.dll',
  '/r:System.Windows.Forms.dll',
  '/r:System.Xaml.dll',
  ...(wpfDir ? [`/lib:${wpfDir}`, '/r:PresentationCore.dll', '/r:WindowsBase.dll'] : []),
  `/out:${output}`,
  source
], { stdio: 'inherit' });

process.exit(result.status ?? 1);