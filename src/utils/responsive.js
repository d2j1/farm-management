import { Dimensions } from 'react-native';
import { rem } from 'nativewind';

// Design baseline: the font sizes in tailwind.config.js are authored
// assuming a ~375pt-wide screen (iPhone SE / iPhone 8 class).
const BASE_WIDTH = 375;

// Default rem size used by NativeWind on native (14)
const DEFAULT_REM = 14;

/**
 * Initialises the NativeWind rem value so that all rem-based sizes
 * scale proportionally with the device's screen width.
 *
 * Call this once at app startup (before the first render ideally).
 */
export function initResponsiveFontScaling() {
  const { width } = Dimensions.get('window');

  // Scale factor relative to the design baseline.
  // Clamp between 0.85 and 1.25 so text never gets too tiny or too huge.
  const scale = Math.min(Math.max(width / BASE_WIDTH, 0.85), 1.25);

  rem.set(DEFAULT_REM * scale);
}
