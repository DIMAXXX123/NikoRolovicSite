/** Short vibration on devices that support it; silently no-op elsewhere. */
export function haptic(ms = 10) {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  try {
    navigator.vibrate(ms)
  } catch {
    // Some browsers throw when vibrate is blocked (no user gesture / iframe) — ignore.
  }
}
