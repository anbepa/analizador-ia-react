-- SQL Migration: Add video frame tracking columns to report_images table
-- Date: 2025-11-23
-- Purpose: Store metadata for extracted video frames including step association

-- Add columns for video frame metadata
ALTER TABLE report_images 
ADD COLUMN IF NOT EXISTS from_video_frame BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS step_number INTEGER DEFAULT NULL;

-- Add index for faster queries on video frames
CREATE INDEX IF NOT EXISTS idx_report_images_video_frames 
ON report_images(report_id, from_video_frame, step_number) 
WHERE from_video_frame = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN report_images.from_video_frame IS 'Indicates if this image was extracted from a video';
COMMENT ON COLUMN report_images.step_number IS 'The step number this video frame corresponds to';
