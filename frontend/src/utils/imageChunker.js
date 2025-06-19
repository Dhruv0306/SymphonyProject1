/**
 * Image Processing Utilities Module
 * 
 * Provides utilities for handling large batches of images:
 * - Splitting images into manageable chunks
 * - Processing chunks sequentially
 * - Progress tracking and time estimation
 * - Human-readable time formatting
 */

/**
 * Splits an array of images into chunks of specified size.
 * Used to prevent overwhelming the server with too many simultaneous uploads.
 * 
 * @param {Array} images - Array of images to be chunked
 * @param {number} chunkSize - Maximum size of each chunk
 * @returns {Array} Array of image chunks
 */
export const chunkImages = (images, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < images.length; i += chunkSize) {
        chunks.push(images.slice(i, i + chunkSize));
    }
    return chunks;
};

/**
 * Format time duration in a human-readable format.
 * Includes milliseconds for better precision.
 * 
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} Formatted time string (e.g., "2h 30m 45.123s", "5m 30.456s", "45.789s")
 */
const formatTime = (milliseconds) => {
    const totalSeconds = milliseconds / 1000;
    const hours = totalSeconds / 3600;
    const minutes = (totalSeconds % 3600) / 60;
    const seconds = totalSeconds % 60;

    if (hours >= 1) {
        return `${Math.trunc(hours)}h ${Math.trunc(minutes)}m ${seconds.toFixed(3)}s`;
    } else if (minutes >= 1) {
        return `${Math.trunc(minutes)}m ${seconds.toFixed(3)}s`;
    } else {
        return `${seconds.toFixed(3)}s`;
    }
};

/**
 * Calculate estimated time remaining based on current progress.
 * Uses precise calculations without rounding for better accuracy.
 * 
 * @param {number} processedImages - Number of processed images
 * @param {number} totalImages - Total number of images to process
 * @param {number} elapsedTime - Time elapsed in milliseconds
 * @returns {string} Formatted time remaining with millisecond precision
 */
const calculateTimeRemaining = (processedImages, totalImages, elapsedTime) => {
    if (processedImages === 0) return 'Calculating...';
    
    const imagesPerMs = processedImages / elapsedTime;
    const remainingImages = totalImages - processedImages;
    const estimatedTimeRemaining = remainingImages / imagesPerMs;
    
    return formatTime(estimatedTimeRemaining);
};

/**
 * Processes image chunks sequentially with progress tracking and retry logic.
 * Provides detailed progress information including:
 * - Number of processed images
 * - Current chunk progress
 * - Time elapsed and remaining
 * - Completion percentage
 * - Failed chunk tracking for retry
 * 
 * @param {Array} chunks - Array of image chunks to process
 * @param {Function} processChunk - Function to process each chunk
 * @param {Function} onProgress - Callback for progress updates
 * @param {Function} onChunkFailed - Callback for failed chunks (optional)
 * @returns {Promise<Array>} Combined results from all chunks
 */
export const processImageChunks = async (chunks, processChunk, onProgress, onChunkFailed) => {
    const results = [];
    const failedChunks = [];
    let processedImages = 0;
    const totalImages = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const startTime = Date.now();

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
            const chunkResults = await processChunk(chunk, i);
            results.push(...chunkResults);
            
            processedImages += chunk.length;
            if (onProgress) {
                const currentTime = Date.now();
                const elapsedTime = currentTime - startTime;
                
                onProgress({
                    processedImages,
                    totalImages,
                    currentChunk: i + 1,
                    totalChunks: chunks.length,
                    percentComplete: (processedImages / totalImages) * 100,
                    elapsedTime: formatTime(elapsedTime),
                    estimatedTimeRemaining: calculateTimeRemaining(processedImages, totalImages, elapsedTime),
                    startTime,
                    failedChunks: failedChunks.length
                });
            }
        } catch (error) {
            console.error(`Error processing chunk ${i + 1}:`, error);
            
            // Track failed chunk
            const failedChunk = {
                index: i,
                chunk: chunk,
                error: error.message || 'Unknown error',
                timestamp: Date.now()
            };
            failedChunks.push(failedChunk);
            
            // Notify about failed chunk
            if (onChunkFailed) {
                onChunkFailed(failedChunk);
            }
            
            // Continue processing other chunks instead of stopping
            console.log(`Continuing with remaining chunks after chunk ${i + 1} failed`);
        }
    }

    return { results, failedChunks };
};

/**
 * Retry processing of failed chunks
 * 
 * @param {Array} failedChunks - Array of failed chunk objects
 * @param {Function} processChunk - Function to process each chunk
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Object>} Results and remaining failed chunks
 */
export const retryFailedChunks = async (failedChunks, processChunk, onProgress) => {
    const results = [];
    const stillFailedChunks = [];
    let processedChunks = 0;
    const totalChunks = failedChunks.length;

    for (const failedChunk of failedChunks) {
        try {
            console.log(`Retrying chunk ${failedChunk.index + 1}...`);
            const chunkResults = await processChunk(failedChunk.chunk, failedChunk.index);
            results.push(...chunkResults);
            
            processedChunks++;
            if (onProgress) {
                onProgress({
                    processedChunks,
                    totalChunks,
                    currentChunk: failedChunk.index + 1,
                    percentComplete: (processedChunks / totalChunks) * 100,
                    isRetry: true
                });
            }
        } catch (error) {
            console.error(`Retry failed for chunk ${failedChunk.index + 1}:`, error);
            stillFailedChunks.push({
                ...failedChunk,
                retryError: error.message || 'Retry failed',
                retryTimestamp: Date.now()
            });
        }
    }

    return { results, failedChunks: stillFailedChunks };
}; 