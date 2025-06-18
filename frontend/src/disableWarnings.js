// Disable React Router and MUI Grid warnings
const originalConsoleWarn = console.warn;
console.warn = function filterWarnings(msg, ...args) {
  if (msg.includes('React Router Future Flag Warning') || 
      msg.includes('MUI Grid:')) {
    return;
  }
  originalConsoleWarn(msg, ...args);
};