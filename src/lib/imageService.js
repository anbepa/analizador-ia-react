import { supabase } from './supabaseClient.js';

/**
 * Simple Image Service - Only Base64 storage
 */

/**
 * Validate and clean image data for API consumption
 */
export const validateAndCleanImages = (imageFiles) => {
  if (!imageFiles || !Array.isArray(imageFiles)) {
    return [];
  }

  return imageFiles.filter(image => {
    // Check if image has valid data
    if (!image || !image.dataURL) {
      console.warn('Image missing dataURL, skipping');
      return false;
    }

    // Check if dataURL is valid base64 image
    if (!image.dataURL.startsWith('data:image/')) {
      console.warn('Invalid image format, skipping');
      return false;
    }

    // Check if base64 data exists after header
    const base64Data = image.dataURL.split(',')[1];
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
  }).map(image => ({
    ...image,
    // Ensure consistent properties
    dataURL: image.dataURL,
    name: image.name || 'image.png',
    type: image.type || 'image/png'
  }));
};

/**
 * Compress image if it's too large
 */
export const compressImageIfNeeded = async (imageFile, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
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
        ...imageFile,
        dataURL: compressedDataURL,
        originalSize: imageFile.dataURL.length,
        compressedSize: compressedDataURL.length
      });
    };
    
    img.onerror = () => {
      console.warn('Failed to compress image, using original');
      resolve(imageFile);
    };
    
    img.src = imageFile.dataURL;
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
const parseImageReferences = (steps, imageFiles) => {
  const associations = [];
  
  if (!steps || !imageFiles) return associations;

  steps.forEach(step => {
    // Parse entrada image reference
    if (step.imagen_referencia_entrada && step.imagen_referencia_entrada !== 'N/A') {
      const match = step.imagen_referencia_entrada.match(/\d+/);
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

    // Parse salida image reference
    if (step.imagen_referencia_salida && step.imagen_referencia_salida !== 'N/A') {
      const match = step.imagen_referencia_salida.match(/\d+/);
      if (match) {
        const imageIndex = parseInt(match[0], 10) - 1; // Convert to 0-based index
        if (imageIndex >= 0 && imageIndex < imageFiles.length) {
          associations.push({
            stepId: step.id,
            imageIndex: imageIndex,
            type: 'salida'
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
  const savedImages = [];
  const imageStepAssociations = steps ? parseImageReferences(steps, imageFiles) : [];

  for (let i = 0; i < imageFiles.length; i++) {
    const imageFile = imageFiles[i];
    
    try {
      // Convert to base64 if it's a File object
      let base64Data;
      if (imageFile instanceof File) {
        base64Data = await fileToBase64(imageFile);
      } else if (imageFile.dataURL) {
        base64Data = imageFile.dataURL;
      } else if (imageFile.dataUrl) {
        base64Data = imageFile.dataUrl;
      } else {
        console.warn('Skipping invalid image file:', imageFile);
        continue;
      }

      // Find step associations for this image
      const associations = imageStepAssociations.filter(assoc => assoc.imageIndex === i);
      
      // If image is associated with steps, create one record per association
      if (associations.length > 0) {
        for (const assoc of associations) {
          const imageData = {
            report_id: reportId,
            step_id: assoc.stepId,
            file_name: imageFile.name || `imagen_${i + 1}`,
            image_data: base64Data,
            file_type: imageFile.type || 'image/png',
            file_size: imageFile.size || 0,
            image_order: i,
            step_image_type: assoc.type,
            is_stored_in_storage: false,
            is_temp: isTemporary
          };

          const { data, error } = await supabase
            .from('report_images')
            .insert(imageData)
            .select()
            .single();

          if (error) {
            console.error('Error saving step-associated image:', error);
            continue;
          }

          savedImages.push({
            id: data.id,
            name: data.file_name,
            dataURL: data.image_data,
            size: data.file_size,
            type: data.file_type,
            stepId: data.step_id,
            stepImageType: data.step_image_type
          });
        }
      } else {
        // Save as general image (not associated with specific step)
        const imageData = {
          report_id: reportId,
          file_name: imageFile.name || `imagen_${i + 1}`,
          image_data: base64Data,
          file_type: imageFile.type || 'image/png',
          file_size: imageFile.size || 0,
          image_order: i,
          step_image_type: 'general',
          is_stored_in_storage: false,
          is_temp: isTemporary
        };

        const { data, error } = await supabase
          .from('report_images')
          .insert(imageData)
          .select()
          .single();

        if (error) {
          console.error('Error saving general image:', error);
          continue;
        }

        savedImages.push({
          id: data.id,
          name: data.file_name,
          dataURL: data.image_data,
          size: data.file_size,
          type: data.file_type,
          stepId: null,
          stepImageType: 'general'
        });
      }

    } catch (error) {
      console.error('Error processing image:', error);
    }
  }

  return savedImages;
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
      dataURL: img.image_data,
      size: img.file_size,
      type: img.file_type
    }));

  } catch (error) {
    console.error('Error loading images:', error);
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