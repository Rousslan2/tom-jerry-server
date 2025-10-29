// Global font helpers to prevent runtime errors when scenes
// call window.getGameFont() and window.getResponsiveFontSize()

export function registerFontHelpers() {
  // Preferred font stack: Google fonts loaded in index.html, then fallbacks
  const defaultFontStack = "'Lilita One', 'Bangers', Arial, sans-serif"

  if (typeof window.getGameFont !== 'function') {
    window.getGameFont = function () {
      return defaultFontStack
    }
  }

  if (typeof window.getResponsiveFontSize !== 'function') {
    window.getResponsiveFontSize = function (base) {
      const w = typeof window.innerWidth === 'number' ? window.innerWidth : 800
      const h = typeof window.innerHeight === 'number' ? window.innerHeight : 600
      // Scale based on viewport compared to a 800x600 baseline, clamp for sanity
      const scaleW = Math.min(Math.max(w / 800, 0.75), 1.5)
      const scaleH = Math.min(Math.max(h / 600, 0.75), 1.5)
      const scale = Math.min(scaleW, scaleH)
      const size = Math.round(base * scale)
      return size
    }
  }
}