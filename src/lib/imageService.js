import { supabase } from './supabaseClient.js';

/**
 * Simple Image Service - Supabase Storage Migration
 */

const BUCKET_NAME = 'reports';

/**
 * Helper to convert Base64 to Blob
 */
const base64ToBlob = (base64, type) => {
  try {
    const parts = base64.split(',');
    const byteString = atob(parts[parts.length - 1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type });
  } catch (e) {
    console.error('Error in base64ToBlob:', e);
    return null;
  }
};

/**
 * Helper to upload file to Supabase Storage
 */
const uploadToStorage = async (reportId, file, index) => {
  try {
    let blob;
    let fileName = (file.name || `image_${Date.now()}_${index}.png`)
      .replace(/\s+/g, '_')
      .replace(/[^\w\.-]/g, '');
    let contentType = file.type || 'image/png';

    // Si ya es una URL (Supabase o externa), no subir de nuevo
    if (typeof file.dataURL === 'string' && file.dataURL.startsWith('http')) {
      return { url: file.dataURL, path: file.storagePath || null };
    }

    if (file.isVideo || (file.type && file.type.startsWith('video/'))) {
      // Si es un Blob/File de video, subirlo
      blob = file;
      fileName = `video_${Date.now()}_${index}.mp4`;
      contentType = file.type || 'video/mp4';
    } else {
      // Es una imagen Base64 - Generar un nombre seguro sin caracteres especiales
      const extension = contentType.split('/')[1] || 'png';
      fileName = `evidence_${index}_${Date.now()}.${extension}`;
      blob = base64ToBlob(file.dataURL, contentType);
      if (!blob) throw new Error('Failed to convert base64 to blob');
    }

    const path = `${reportId}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, blob, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('DETALLE ERROR STORAGE:', error);
      if (error.message === 'Bucket not found') {
        console.error('ERROR: El bucket "reports" no existe. Por favor créalo en el dashboard de Supabase y ponlo como público.');
      }
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return { url: publicUrl, path: data.path };
  } catch (error) {
    console.error('Error uploading to storage:', error);
    return { url: file.dataURL, path: null }; // Fallback to base64 if upload fails
  }
};

/**
 * Validate and clean image/video data for API consumption
 */
export const validateAndCleanImages = (files) => {
  if (!files || !Array.isArray(files)) {
    return [];
  }

  return files.filter(file => {
    // Check if file has valid data
    if (!file || !file.dataURL) {
      console.warn('File missing dataURL, skipping');
      return false;
    }

    // Allow video files (which have http/https URLs)
    if (file.isVideo || (typeof file.dataURL === 'string' && file.dataURL.startsWith('http'))) {
      return true;
    }

    // Check if dataURL is valid base64 image
    if (!file.dataURL.startsWith('data:image/')) {
      console.warn('Invalid image format, skipping');
      return false;
    }

    // Check if base64 data exists after header
    const base64Data = file.dataURL.split(',')[1];
    if (!base64Data || base64Data.length < 100) {
      console.warn('Image data too small or corrupted, skipping');
      return false;
    }

    // Check file size (rough estimate from base64)
    const sizeInBytes = (base64Data.length * 3) / 4;
    const maxSize = 10 * 1024 * 1024; // 10MB limit for safety
    if (sizeInBytes > maxSize) {
      console.warn(`Image too large (${Math.round(sizeInBytes / 1024 / 1024)}MB), skipping`);
      return false;
    }

    return true;
  }).map(file => ({
    ...file,
    // Ensure consistent properties
    dataURL: file.dataURL,
    name: file.name || (file.isVideo ? 'video.mp4' : 'image.png'),
    type: file.type || (file.isVideo ? 'video/mp4' : 'image/png'),
    isVideo: file.isVideo || false
  }));
};

/**
 * Compress image if it's too large
 */
export const compressImageIfNeeded = async (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  // Skip compression for videos
  if (file.isVideo || (file.type && file.type.startsWith('video/'))) {
    return file;
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Enable CORS for remote images
    if (typeof file.dataURL === 'string' && file.dataURL.startsWith('http')) {
      img.crossOrigin = 'Anonymous';
    }

    // Safety timeout to prevent hanging the entire analysis
    const timeout = setTimeout(() => {
      console.warn('Compression timeout for:', file.name || 'image');
      resolve(file);
    }, 10000); // 10 seconds timeout

    img.onload = () => {
      clearTimeout(timeout);
      try {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Set canvas size and draw image
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64
        const compressedDataURL = canvas.toDataURL('image/jpeg', quality);

        resolve({
          ...file,
          dataURL: compressedDataURL,
          originalSize: file.dataURL.length,
          compressedSize: compressedDataURL.length
        });
      } catch (err) {
        console.warn('Failed to compress image due to error (possibly CORS):', err);
        resolve(file);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      console.warn('Failed to load image for compression, using original');
      resolve(file);
    };

    img.src = file.dataURL;
  });
};

/**
 * Convert File object to base64 string
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Parse image references from step data and associate with actual images
 */
/**
 * Parse image references from step data and associate with actual images
 */
const parseImageReferences = (steps, imageFiles) => {
  const associations = [];

  if (!steps || !imageFiles) return associations;

  steps.forEach(step => {
    // Check if step has image reference
    if (step.imagen_referencia && step.imagen_referencia !== 'N/A') {
      const match = step.imagen_referencia.match(/\d+/);
      if (match) {
        const imageIndex = parseInt(match[0], 10) - 1; // Convert to 0-based index
        if (imageIndex >= 0 && imageIndex < imageFiles.length) {
          associations.push({
            stepId: step.id,
            imageIndex: imageIndex,
            type: 'entrada'
          });
        }
      }
    }
  });

  return associations;
};

/**
 * Store images for a report with step associations
 */
export const storeImagesForReport = async (reportId, imageFiles, steps = null, isTemporary = false) => {
  if (!imageFiles || imageFiles.length === 0) {
    console.log('No images to store for report:', reportId);
    return [];
  }

  console.log('Starting to store images for report:', reportId, 'Images count:', imageFiles.length);
  const imageStepAssociations = steps ? parseImageReferences(steps, imageFiles) : [];

  // Prepare all image rows up-front to send a single insert request
  const imagesToInsert = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const imageFile = imageFiles[i];

    try {
      console.log(`Uploading evidence ${i + 1}/${imageFiles.length} to storage...`);
      const { url, path } = await uploadToStorage(reportId, imageFile, i);
      
      const isVideo = imageFile.isVideo || (imageFile.type && imageFile.type.startsWith('video/'));

      // Find step associations for this image
      const associations = imageStepAssociations.filter(assoc => assoc.imageIndex === i);

      const commonData = {
        report_id: reportId,
        file_name: imageFile.name || (isVideo ? `video_${i + 1}.mp4` : `imagen_${i + 1}`),
        image_data: path ? null : imageFile.dataURL, // Solo guardar Base64 si falló la subida
        image_url: url,
        storage_path: path,
        video_url: isVideo ? url : null,
        is_video: isVideo,
        from_video_frame: imageFile.fromVideoFrame || false,
        step_number: imageFile.stepNumber || null,
        file_type: imageFile.type || (isVideo ? 'video/mp4' : 'image/png'),
        file_size: imageFile.size || 0,
        image_order: i,
        is_stored_in_storage: !!path,
        is_temp: isTemporary
      };

      // If the image is associated with steps, create one record per association; otherwise create a single general record
      if (associations.length > 0) {
        associations.forEach((assoc) => {
          imagesToInsert.push({
            ...commonData,
            step_id: assoc.stepId,
            step_image_type: assoc.type,
          });
        });
      } else {
        imagesToInsert.push({
          ...commonData,
          step_image_type: 'general',
        });
      }
    } catch (error) {
      console.error('Error processing image:', error);
    }
  }

  if (imagesToInsert.length === 0) return [];

  // Insert in manageable batches to avoid oversized payloads
  const MAX_BATCH = 10;
  const savedRows = [];

  for (let i = 0; i < imagesToInsert.length; i += MAX_BATCH) {
    const batch = imagesToInsert.slice(i, i + MAX_BATCH);
    const { data, error } = await supabase
      .from('report_images')
      .insert(batch)
      .select('id, file_name, file_size, file_type, step_id, step_image_type, image_order, is_video, video_url, image_url, storage_path');

    if (error) {
      console.error('Error saving images batch:', error);
      return [];
    }

    if (data) {
      savedRows.push(...data);
    }
  }

  // Supabase preserves insertion order within each batch; batches maintain overall ordering via concatenation
  return savedRows.map((row) => {
    return {
      id: row.id,
      name: row.file_name,
      dataURL: row.image_url || row.video_url || row.image_data,
      size: row.file_size,
      type: row.file_type,
      stepId: row.step_id,
      stepNumber: row.step_number || null,
      stepImageType: row.step_image_type,
      isVideo: row.is_video,
      storagePath: row.storage_path
    };
  });
};

/**
 * Load images for a report
 */
export const loadImagesForReport = async (reportId) => {
  if (!reportId) return [];

  try {
    const { data, error } = await supabase
      .from('report_images')
      .select('*')
      .eq('report_id', reportId)
      .order('image_order');

    if (error) {
      console.error('Error loading images:', error);
      return [];
    }

    return (data || []).map(img => ({
      id: img.id,
      name: img.file_name,
      dataURL: img.image_url || img.image_data || img.video_url,
      size: img.file_size,
      type: img.file_type,
      isVideo: img.is_video,
      fromVideoFrame: img.from_video_frame || false,
      stepNumber: img.step_number || null
    }));

  } catch (error) {
    console.error('Error loading images:', error);
    return [];
  }
};

/**
 * Load images for multiple reports in a single query to minimize latency
 */
export const loadImagesForReports = async (reportIds = []) => {
  if (!Array.isArray(reportIds) || reportIds.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from('report_images')
      .select('id, report_id, file_name, file_size, file_type, image_data, image_url, video_url, is_video, from_video_frame, step_number, image_order, step_image_type')
      .in('report_id', reportIds)
      .order('image_order');

    if (error) {
      console.error('Error loading images for reports:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error loading images for reports:', error);
    return [];
  }
};

/**
 * Delete images for a report
 */
export const deleteImagesForReport = async (reportId) => {
  if (!reportId) return;

  try {
    const { error } = await supabase
      .from('report_images')
      .delete()
      .eq('report_id', reportId);

    if (error) {
      console.error('Error deleting images:', error);
    }
  } catch (error) {
    console.error('Error deleting images:', error);
  }
};