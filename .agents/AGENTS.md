# Gooner Project Agent Rules

This file documents historical mistakes and learned rules specific to the Gooner project to prevent regressions and improve agentic reliability.

## 1. Electron Window `alwaysOnTop` (Critical)
- **Rule**: When configuring an Electron `BrowserWindow` to be strictly always-on-top on Windows, setting `alwaysOnTop: true` in the constructor is NOT enough. You MUST also explicitly call `window.setAlwaysOnTop(true, 'screen-saver')` after window creation.
- **Reasoning**: This prevents full-screen applications or other aggressive top-level windows from obscuring the media popups. This fix has been repeatedly overwritten by careless file replacements. DO NOT overwrite it.

## 2. Safe Code Replacements (Critical)
- **Rule**: When using code replacement tools (e.g. `replace_file_content`), thoroughly check the surrounding context. 
  - Ensure closing brackets (`}`) or parenthesis are not swallowed.
  - Pay attention to custom bug fixes implemented in previous turns (like the `alwaysOnTop` fix) and NEVER silently revert them when refactoring a function.
- **Reasoning**: Careless block replacements previously caused syntax errors (`Unexpected token ')'`) that completely froze the frontend UI, and also lost the `screen-saver` level fix.

## 3. Avoid Powershell String Manipulation for File Edits
- **Rule**: Do NOT use Powershell array slicing or `Get-Content`/`Set-Content` to remove lines or fix syntax errors in source files.
- **Reasoning**: Powershell string manipulation scripts frequently cause encoding issues (e.g., corrupting UTF-8 characters into mojibake), which previously resulted in corrupted strings in `main.js` and caused a fatal crash. Always use the built-in `replace_file_content` or `multi_replace_file_content` tools instead.

## 4. Career UI & Stats System Architecture
- **Rule**: Progression metrics (stamps, progress bars, grand slams) must always be calculated using **Play Time** (`playTimeSeconds`), not Uptime or Session Counts.
- **Rule**: The daily progress bar logic is progressive (aiming for the next immediate tier instead of the absolute maximum). Current established tiers: Bronze (>0s), Silver (1h), Gold (4h), Ultimate (24h).
- **Rule**: Translations and variable text options (like randomized stamp texts) are stored as pipe-delimited strings (`|`) in `src/shared/i18n.js` and split dynamically in JS.
- **Reasoning**: Maintains consistency with the established "Gooner" gamification loop and localized translation system.

## 5. Exaggerated UI / Aesthetic Preferences
- **Rule**: The user highly prefers **extreme, dramatic, and massive UI elements** for achievements and progression. When implementing visual rewards (stamps, badges, celebrations), exaggerate the sizes (e.g., 100px+ fonts), use heavy shadows, dynamic gradients (e.g., red-black-green neon), and glassmorphism.
- **Rule**: Use visual fading (`opacity`) to heavily dim non-important background elements (like dates or grids) when a major achievement is stamped over them. 
- **Reasoning**: The user explicitly requested "Bigger! Even bigger!" multiple times, demonstrating a strong preference for high visual impact over subtle minimalism.

## 6. Theming and Hardcoded Colors
- **Rule**: When adding or updating themes (e.g., `data-theme="light"`), you CANNOT rely solely on overriding global CSS variables (`--bg-0`, `--text`, etc.). You MUST proactively search for hardcoded `rgba()` or hexadecimal colors in the existing CSS (such as `.panel`, `.folder-row`, `.symbol-toggle`, `.switch-row`, `.bottom-controls`) and explicitly override them for the new theme selector.
- **Rule**: Always test UI elements with complex states (`:hover`, `:has(input:checked)`, `.active`) and pseudo-elements (`::before`, `::after`, `::-webkit-slider-thumb`) to ensure contrast and legibility, as these heavily use hardcoded gradient values in this project.
- **Rule**: Be cautious when using global resets for `input` elements in a theme (e.g., `[data-theme="light"] input { background: #fff; }`) because it will unexpectedly overwrite native components that use `appearance: none` like `input[type="range"]`. Always exclude special input types (`:not([type="range"]):not([type="checkbox"]):not([type="color"])`).
- **Reasoning**: Hardcoded colors in complex gradient backgrounds or specific UI components have repeatedly caused "invisible" or illegible elements when standard CSS variables were toggled for a light theme.

## 7. image-size Dependency Versioning (Critical)
- **Rule**: NEVER upgrade the `image-size` npm package to version `2.x` in this project. You MUST stick to `^1.1.1`.
- **Reasoning**: In Node.js 24 and the current Electron environment, `image-size@2.x` combined with `util.promisify` throws a fatal synchronous `TypeError: The "list" argument must be an instance of SharedArrayBuffer...` when reading images. This breaks image dimension extraction entirely, causing the wallpaper engine and window resizer to silently fail or skip all media.

## 8. Electron Hardware Acceleration & Video Crashes (Critical)
- **Rule**: To fix video playback crashes in Electron (e.g. mp4 files causing the app to crash on play), you MUST use `app.commandLine.appendSwitch('disable-accelerated-video-decode');` instead of `app.disableHardwareAcceleration();`.
- **Reasoning**: Disabling hardware acceleration globally entirely breaks the `alwaysOnTop` and `transparent` window capabilities on Windows Desktop Window Manager (DWM). Using the specific video decode switch fixes the Chromium media crash while preserving the necessary GPU compositing for frameless transparent popups to stay on top.

## 9. UI Space Utilization & Compactness
- **Rule**: The user prefers high space efficiency for numeric configurations (like times and intervals). Use compact layouts like parallel grid columns (`.field-row`) and digital-clock style inputs (`<input type="number">` styled compactly) instead of large, isolated range sliders when there are many related time inputs.
- **Reasoning**: The configuration interface frequently becomes too tall, requiring excessive scrolling. Compactness groups related fields together logically.

## 10. Randomized Parameter Boundaries (Jitter)
- **Rule**: When adding random variations ("jitter") to important parameters like `popupLifetime`, NEVER hardcode a bi-directional or purely negative offset. Always provide a **Jitter Direction Mode** selector (`-`, `+`, `±`) so the user can prevent edge cases.
- **Reasoning**: Purely negative random offsets previously caused popups to calculate a lifetime of `0` and immediately close, creating a jarring UX.

## 11. Synchronized Audio and Visual Fades
- **Rule**: When implementing fade-out animations for media popups in Electron, modifying the `BrowserWindow`'s opacity does NOT affect its audio volume. You MUST manually send an IPC event (e.g. `webContents.send('viewer:setOpacity', opacity)`) to the renderer to interpolate the `<video>` element's `volume` synchronously with the visual fade.
- **Reasoning**: Prevents the jarring effect of an invisible window still playing full-volume audio ("Chaos Video" fade bug).

## 12. Privacy Masking (Developer/Streamer Mode)
- **Rule**: When hiding sensitive information (like absolute folder paths or API keys), use visual obfuscation (`***\\basename` for paths, `type="password"` for inputs) rather than removing the elements from the DOM.
- **Reasoning**: Keeps the UI structure intact and allows the user to continue interacting with the elements (e.g., removing a specific masked folder, typing a new API key) without exposing the sensitive data.

## 13. Post-Modification Build Verification (Critical)
- **Rule**: After making changes to the project's codebase, you MUST always run the build/packaging command (e.g., `npm run dist` or `npm run dist:cn`) to verify that the application builds successfully and to confirm the correctness of your changes.
- **Reasoning**: Ensures that modifications do not introduce syntax errors or break the Electron builder process, guaranteeing that a stable executable can always be generated.
## 14. Electron Network Requests & Proxies (Critical)
- **Rule**: When making HTTP requests in the Electron Main process (especially for remote domains like GitHub), NEVER use the global Node.js `fetch()`. You MUST use Electron's `net.fetch()` (e.g., `const { net } = require('electron'); await net.fetch(url)`).
- **Reasoning**: Global Node.js `fetch` ignores Windows system proxy settings (like Clash/V2Ray), causing `fetch failed` (DNS poisoning/connection refused) for users in restricted network environments (like China) when accessing raw GitHub URLs. Electron's `net.fetch` leverages the Chromium network stack and correctly respects system proxies.

## 15. Media Popup Stealth Loading (Anti-Flicker)
- **Rule**: When creating new transparent frameless windows for media popups, waiting for the `BrowserWindow`'s `ready-to-show` event is NOT enough. You must implement a "Stealth Loading" pattern:
  1. The renderer must listen for the media element's `load`, `loadedmetadata`, or `error` events.
  2. The renderer sends an IPC message (e.g., `mediaLoaded`) to the main process.
  3. The main process only calls `popup.show()` when BOTH `ready-to-show` AND the IPC message have been received (with a reasonable fallback timeout, e.g., 5 seconds).
- **Reasoning**: Prevents the user from seeing an empty black/transparent box flashing on the screen while the network media is still downloading or decoding.

## 16. UI Configuration Binding Triad
- **Rule**: When adding new configuration fields to the settings UI (`index.html`), you MUST complete the "Binding Triad" in `app.js`:
  1. **Read**: Extract the value from the DOM in the `saveConfig()` function.
  2. **Restore**: Set the DOM element's value/checked state inside the `applyConfig()` (or `updateState()`) function.
  3. **Listen**: Add an event listener (`'change'` for checkboxes/selects, `'input'` for text fields) to trigger `markUnsaved()`.
- **Reasoning**: Forgetting step 2 prevents the UI from reflecting the saved state on restart. Forgetting step 3 prevents the app from knowing the setting was modified, thus ignoring it during save.

## 17. GBK Text Decoding Fallback on Windows
- **Rule**: When reading unknown `.txt` files on Windows (such as user-provided corpus), Node.js `utf8` might read GBK as garbled text (containing `\uFFFD`). Use `powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Content -Path '...' -Encoding Default -Raw"` via `execSync` as a fallback to correctly decode ANSI/GBK text without needing the `iconv-lite` dependency.
- **Reasoning**: Many local text files on Windows (especially in China) default to GBK. Naive UTF-8 reading corrupts them.

## 18. Scrub Inputs and Native Number Inputs
- **Rule**: In the Gooner renderer (`app.js`), `initNumericScrubbers()` targets ALL `input[type="number"]` and wraps them in a `.scrub-control` div, drastically changing their DOM structure and width. When adding new numeric inputs that must behave natively (e.g., standard type-in inputs), you MUST add the class `no-scrub` (`class="no-scrub"`) and ensure `initNumericScrubbers()` skips it (`if (input.classList.contains('no-scrub')) continue;`).
- **Reasoning**: Unprotected new numeric inputs are forcibly wrapped by the scrub component, crushing their width and rendering text invisible/uneditable.

## 19. Label Wrapping Pitfalls
- **Rule**: When adding multiple related inputs (e.g., Min and Max values), NEVER wrap both inputs inside a single `<label>`. This causes the browser to implicitly focus only the first input when the container is clicked, rendering the second input inaccessible. Use a `<div>` wrapper instead.
- **Reasoning**: Browser-native accessibility rules enforce that a `<label>` delegates clicks to its *first* valid input control.

## 20. Button Default Submit Reload
- **Rule**: When adding any new interactive buttons in the `index.html` configuration panel (e.g., "Choose Folder", "Apply"), you MUST explicitly declare `type="button"`.
- **Reasoning**: The default type for a `<button>` inside or near form-like structures is `submit`, which accidentally triggers a page reload in Electron when clicked, causing the user to lose unsaved configuration states.

## 21. Settings Tab Architecture (`settings-shell`)
- **Rule**: When adding new complex configuration pages or refactoring long scrolling pages in `index.html`, use the `.settings-shell` tab structure instead of a single long page.
- **Implementation**: Wrap the content in `<div class="settings-shell">`. Create an `<aside class="panel section-sidebar">` containing buttons with `class="section-nav-item" data-section-target="TARGET_ID"`. Place the panels inside `<div class="section-content">` using `<section class="section-panel" data-section-panel="TARGET_ID">`. 
- **Reasoning**: The user explicitly dislikes long vertical scrolling pages. The renderer `app.js` automatically binds `data-section-target` logic on load, so no additional JavaScript is required to make the tabs work.

## 22. Strict Localization Enforcement (`i18n.js`)
- **Rule**: Whenever adding new UI elements (buttons, labels, dialogs) to `index.html`, you MUST add a `data-i18n="key.name"` attribute and explicitly add the key to both the `zh-CN` and `en-US` language objects in `src/shared/i18n.js`.
- **CRITICAL**: After ANY modification to `index.html` that involves text or `data-i18n`, you MUST run `npm run lint:i18n` in the terminal to automatically verify that no keys are missing. Do not skip this step!
- **Reasoning**: Hardcoded Chinese/English text in HTML or missing translation keys have caused multiple localization bugs and user complaints. The localization must be comprehensive and maintained synchronously with UI changes.

## 23. Independent Asset Storage (Anti-Link Rot)
- **Rule**: When allowing the user to select local files (like avatars or custom images), DO NOT save the original absolute path directly to the `config`. Instead, process/copy the file (e.g., using Electron's `ipcMain`) into a dedicated folder inside the application's `userData` directory (e.g., `path.join(app.getPath('userData'), 'avatars')`), and save that internal path.
- **Reasoning**: Users frequently move, rename, or delete their original images. Relying on the original absolute path causes broken images. Creating an independent copy ensures the application's assets remain intact regardless of external file system changes.

## 24. Standard UI Layout for Multiple Numeric Inputs
- **Rule**: When adding multiple related numeric inputs to the settings UI (`index.html`), NEVER wrap them in raw `<div>` tags. You MUST use the standard compact parallel grid layout: wrap the entire group in `<div class="field-row">`, and wrap each individual input and its span in `<label class="field">`.
- **Implementation**:
  ```html
  <div class="field-row">
    <label class="field">
      <span data-i18n="key1">Label 1</span>
      <input type="number" ... />
    </label>
    <label class="field">
      <span data-i18n="key2">Label 2</span>
      <input type="number" ... />
    </label>
  </div>
  ```
- **Reasoning**: The user extremely prioritizes UI compactness and established design patterns. The `field` class correctly aligns inputs horizontally and vertically without requiring inline styles, while raw `<div>` wrappers waste vertical space and create inconsistent spacing compared to older modules.

## 25. Multi-Monitor Transparent Overlays (Bounds & Scaling)
- **Rule**: When creating a transparent frameless `BrowserWindow` intended to cover a specific monitor (especially a secondary vertical or DPI-scaled monitor), you MUST explicitly set `enableLargerThanScreen: true` in the `BrowserWindow` options. Furthermore, you MUST explicitly call `window.setBounds(display.bounds)` after the window is shown.
- **Reasoning**: Without these, Electron and Windows frequently clip the overlay window's dimensions to the primary display's bounds, leaving large portions of secondary/vertical screens uncovered.

## 26. Aspect Ratio Filtering & `minResolution` Pitfall
- **Rule**: When filtering images to match a screen's aspect ratio (`findBestMediaForDisplay`), NEVER enforce a strict fallback `minResolution` (like `0.9 * monitor.height`) for visual overlays. `minResolution` MUST default to `0` unless explicitly provided.
- **Reasoning**: Strict pixel resolution checks cause the vast majority of standard (720p/1080p) media to be rejected. When all candidates are rejected, the algorithm panics and falls back to a completely random image, which completely breaks the aspect-ratio matching logic and causes severe black bars or cropping.

## 27. Background Sizing for Character Art (Ghost / X-Ray)
- **Rule**: When rendering full-screen visual interventions (Ghost mode, X-Ray) that display character art, ALWAYS use `background-size: contain; background-repeat: no-repeat; background-position: center;` instead of `background-size: cover`.
- **Reasoning**: `cover` aggressively crops the edges of an image if its aspect ratio deviates even slightly from the screen, frequently chopping off the heads or feet of characters. `contain` ensures the entire subject remains visible.

## 28. Multi-Pool Media IPC Architecture
- **Rule**: When sending a media pool to a multi-purpose renderer window via IPC, you MUST send TWO separate arrays if filtering is applied: `mediaFiles` (filtered for perfect aspect-ratio matching, used for backgrounds like Ghost/X-Ray) and `allMediaFiles` (unfiltered, used for free-floating elements like Waterfall items).
- **Reasoning**: Filtering the global media pool to fix background aspect ratios inadvertently destroys the visual variety of floating items (Waterfall), forcing all floating items to share the same aspect ratio as the screen.

## 29. Continuous Staggered Waterfall Physics
- **Rule**: When implementing a continuous falling "waterfall" of DOM elements, NEVER spawn or respawn them at a fixed vertical coordinate (e.g., `-window.innerHeight`). 
  - **Initial Spawn**: Distribute them wildly across a massive vertical space (e.g., from `-200%` to `100%` of `innerHeight`).
  - **Respawn**: Stagger them randomly just above the screen (e.g., `-size - Math.random() * innerHeight * 1.5`).
- **Reasoning**: Fixed or tightly bounded spawn coordinates cause the items to fall and respawn in visible "clumps" or "batches" rather than a continuous, organic stream.

## 30. Popup Off-Screen Overflow Preference
- **Rule**: When calculating random bounds or coordinates for media and AI text popup windows (`BrowserWindow`), allow up to **30%** of the window's width and height to overflow beyond the screen edges (e.g., `overflowX = Math.floor(width * 0.3)`).
- **Reasoning**: The user prefers the popup windows to spawn partially off-screen, as this enhances the feeling of visual randomness and unpredictability, rather than strictly confining them within the visible screen boundaries.
