import { supabase } from './supabaseClient';

/**
 * Service to handle video processing and upload
 */

/**
 * Uploads a video file to Supabase Storage
 * @param {File} videoFile - The video file to upload
 * @returns {Promise<string>} - The public URL of the uploaded video
 */
export const uploadVideoToSupabase = async (videoFile) => {
    try {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${videoFile.name.replace(/\s+/g, '_')}`;
        const filePath = `uploads/${fileName}`;

        const { data, error } = await supabase.storage
            .from('evidence-videos')
            .upload(filePath, videoFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('evidence-videos')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading video to Supabase:', error);
        throw error;
    }
};

/**
 * Validates if the file is a supported video format
 * @param {File} file - The file to validate
 * @returns {boolean}
 */
export const isVideoFile = (file) => {
    return file.type.startsWith('video/');
};
