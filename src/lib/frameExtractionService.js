/**
 * Service to extract frames from videos at specific timestamps
 * This runs on the backend via the local-api-server
 */

/**
 * Converts timestamp string to seconds
 * @param {string} timestamp - Format: "MM:SS" or "HH:MM:SS"
 * @returns {number} - Seconds
 */
export const timestampToSeconds = (timestamp) => {
    if (!timestamp) return 0;

    const parts = timestamp.split(':').map(p => parseInt(p, 10));

    if (parts.length === 2) {
        // MM:SS
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
        // HH:MM:SS
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return 0;
};

/**
 * Request frame extraction from the backend
 * @param {string} videoUrl - URL of the video in Supabase
 * @param {Array} timestamps - Array of timestamp objects with step info
 * @returns {Promise<Array>} - Array of frame URLs
 */
export const requestFrameExtraction = async (videoUrl, timestamps) => {
    try {
        const response = await fetch('/api/extract-frames', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoUrl,
                timestamps
            })
        });

        if (!response.ok) {
            throw new Error(`Frame extraction failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.frames;
    } catch (error) {
        console.error('Error requesting frame extraction:', error);
        throw error;
    }
};

/**
 * Process report steps to extract frames from video
 * @param {string} videoUrl - URL of the video
 * @param {Array} steps - Report steps with video_timestamp field
 * @returns {Promise<Array>} - Steps with frame URLs added
 */
export const processVideoSteps = async (videoUrl, steps) => {
    if (!videoUrl || !steps || steps.length === 0) {
        return steps;
    }

    // Extract timestamps from steps
    const timestamps = steps
        .filter(step => step.video_timestamp)
        .map(step => ({
            stepNumber: step.numero_paso,
            timestamp: step.video_timestamp,
            seconds: timestampToSeconds(step.video_timestamp)
        }));

    if (timestamps.length === 0) {
        console.log('No timestamps found in steps, skipping frame extraction');
        return steps;
    }

    try {
        // Request frame extraction from backend
        const frames = await requestFrameExtraction(videoUrl, timestamps);

        // Associate frames with steps
        const stepsWithFrames = steps.map(step => {
            const frameData = frames.find(f => f.stepNumber === step.numero_paso);
            if (frameData) {
                return {
                    ...step,
                    frame_url: frameData.url,
                    frame_timestamp: frameData.timestamp
                };
            }
            return step;
        });

        return stepsWithFrames;
    } catch (error) {
        console.error('Error processing video steps:', error);
        // Return original steps if frame extraction fails
        return steps;
    }
};
