/**
 * Measures and reports web vitals metrics for the application.
 *
 * This function dynamically imports the 'web-vitals' library and invokes
 * the provided callback with various performance metrics, such as CLS, FID,
 * FCP, LCP, and TTFB. Intended for use in production to monitor and analyze
 * real user performance.
 *
 * @param {Function} onPerfEntry - Callback function to handle each web vital metric.
 *   Should accept a metric object as its argument.
 *
 * @remarks
 * - Only runs if a valid function is provided.
 * - Metrics are reported asynchronously after the 'web-vitals' library is loaded.
 * - In production, use this to send metrics to analytics endpoints or logging services.
 *
 * @example
 * reportWebVitals(metric => {
 *   // Send metric to analytics endpoint
 *   fetch('/analytics', { method: 'POST', body: JSON.stringify(metric) });
 * });
 */
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
