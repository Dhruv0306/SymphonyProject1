/**
 * Delay Calculator Utility
 * 
 * Provides intelligent delay calculation for batch processing to optimize server load.
 * For large batches, batch size dominates the delay calculation.
 * For small batches, chunk index dominates the delay calculation.
 */

/**
 * Calculate processing delay based on batch size and chunk index.
 * 
 * @param {number} batchSize - Size of the current batch
 * @param {number} chunkIndex - Current chunk index (0-based)
 * @param {number} maxChunks - Total number of chunks
 * @returns {number} Delay in seconds (0.1 to 3.0)
 */
export const calculateDelay = (batchSize, chunkIndex, maxChunks) => {
    
    const delay = batchSize >= 100 
        ? 1 + (1 * batchSize) + (0.1 * chunkIndex)
        : 1 + (0.1 * batchSize) + (1 * chunkIndex);
    
    const finalDelay =  Math.max(batchSize / 10.0, delay);
    console.log('Sending chunk', (chunkIndex + 1), 'of ', maxChunks, 'with delay', finalDelay, 'seconds');
    return finalDelay;
};

/**
 * Sleep utility function
 * @param {number} seconds - Time to sleep in seconds
 * @returns {Promise} Promise that resolves after the specified time
 */
export const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));