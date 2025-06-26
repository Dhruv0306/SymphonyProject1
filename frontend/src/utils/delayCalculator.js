/**
 * Delay Calculator Utility
 * 
 * Calculates an adaptive delay for batch processing to help balance server load.
 * For large numbers of chunks, the batch size has a greater effect on the delay.
 * For smaller numbers of chunks, the chunk index has a greater effect on the delay.
 */

/**
 * Calculates the processing delay based on batch size and chunk index.
 * 
 * @param {number} batchSize - Number of items in the current batch.
 * @param {number} chunkIndex - Index of the current chunk (starting from 0).
 * @param {number} maxChunks - Total number of chunks to process.
 * @returns {number} Delay in seconds to wait before processing the next chunk.
 */
export const calculateDelay = (batchSize, chunkIndex, maxChunks) => {
    
    if (maxChunks >= 100) {
        console.log('Caluculating delay for large number of chunks.');
    }else {
        console.log('Caluculating delay for small number of chunks.');
    }

    const delay = maxChunks >= 100 
        ? 1 + (1 * batchSize) + (0.1 * chunkIndex)
        : 1 + (0.1 * batchSize) + (1 * chunkIndex);
    
    const finalDelay =  Math.max(batchSize / 10.0, delay);
    console.log('Sending chunk', (chunkIndex + 1), 'of ', maxChunks, 'with delay', finalDelay, 'seconds');
    return finalDelay;
};

/**
 * Pauses execution for a specified number of seconds.
 * 
 * @param {number} seconds - Number of seconds to wait.
 * @returns {Promise} Promise that resolves after the specified delay.
 */
export const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));
