# Wallpaper Focus Restore Guard

This file documents non-negotiable behavior for `src/main/wallpaper-service.js`.

## Required Behavior
- Unfocus: restore `originalWallpapers`.
- Refocus: reapply `lastAppliedWallpapers` only.
- Rotation: change to a new wallpaper only when scheduler interval is due.

## Forbidden Regressions
- Do not call `tick()` on refocus if `lastAppliedWallpapers` is not empty.
- Do not split `FOCUS` and `FOCUSSTAT` into separate stdout listeners.
- Do not remove native-host-first focus detection fallback chain.

## Reliability Rules
- Prefer native host focus events (`FOCUS`, `FOCUSSTAT`) first.
- If native host is available via desktop-character service, attempt to start/reuse it.
- PowerShell fallback must be deterministic and self-contained.
- `WallpaperService` is the sole owner of original/managed wallpaper state and write ordering. The native host reports focus and minimization events and accepts explicit write requests; it must not apply or restore wallpapers on its own focus transitions.
- `MINIMIZE_HOLD` keeps the managed wallpaper through the foreground change caused by minimizing. Only `MINIMIZE_HOLD_END`, emitted for real application interaction, may allow restoration of originals.
- If the native host exits or is replaced, reset cached focus and minimize-hold state, then synchronize from the native-first fallback chain. Never clear a valid hold with a fixed timeout.

## Edit Checklist (before merge)
- Verify sequence: unfocus -> restore originals; refocus -> restore last applied; timer due -> rotate.
- Verify no immediate wallpaper change occurs on refocus.
- Verify fallback still works when native host is temporarily unavailable.
