# Gooner

A local Electron desktop app that shows images and videos from folders you choose, using configurable popup timing and display modes.

The app is intentionally user-controlled: it does not auto-start, hide itself, block system controls, or prevent windows from being closed.

## Run

```powershell
npm install
npm run dev
```

## Build for Windows

```powershell
npm run dist
```

The packaging script runs `npm ci` from `package-lock.json` before electron-builder and verifies that the runtime dependencies are present in the generated `app.asar`. Do not build the installer with a manually pruned `node_modules` directory.