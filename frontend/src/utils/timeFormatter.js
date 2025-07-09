/**
 * Format milliseconds into human-readable time string
 * @param {number} milliseconds - Time duration in milliseconds
 * @returns {string} - Formatted time string (e.g., "2h 30m 15.5s", "45.2s")
 */
export const formatTime = (milliseconds) => {
  if (!milliseconds || isNaN(milliseconds) || milliseconds <= 0) return '0s';
  
  const totalSeconds = milliseconds / 1000;
  const hours = totalSeconds / 3600;
  const minutes = (totalSeconds % 3600) / 60;
  const seconds = totalSeconds % 60;

  if (hours >= 1) {
    return `${Math.trunc(hours)}h ${Math.trunc(minutes)}m ${seconds.toFixed(1)}s`;
  } else if (minutes >= 1) {
    return `${Math.trunc(minutes)}m ${seconds.toFixed(1)}s`;
  } else {
    return `${seconds.toFixed(1)}s`;
  }
};