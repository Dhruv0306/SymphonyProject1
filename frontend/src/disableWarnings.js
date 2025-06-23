// Disable React Router and MUI Grid warnings
/**
 * Stores the original implementation of `console.warn` before any overrides.
 *
 * This allows restoring or referencing the native warning behavior,
 * which is useful when temporarily disabling or customizing warning outputs,
 * especially in production environments where excessive warnings may clutter logs.
 *
 * @type {function}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/console/warn
 * @example
 * // Override console.warn and restore later
 * const originalConsoleWarn = console.warn;
 * console.warn = () => {};
 * // ... some code
 * console.warn = originalConsoleWarn;
 */
const originalConsoleWarn = console.warn;
console.warn = function filterWarnings(msg, ...args) {
  if (msg.includes('React Router Future Flag Warning') || 
      msg.includes('MUI Grid:')) {
    return;
  }
  originalConsoleWarn(msg, ...args);
};