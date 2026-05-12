/**
 * Media Service
 * 
 * Handles product images and videos operations for the immersive visual shop.
 * 
 * Tasks: 2.1
 * Requirements: 1.1, 2.1
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface ProductImage {
  id: string;
  tenant_id: string;
  product_id: string;
  image_url: string;
  image_type: 'primary' | 'angle' | 'lifestyle' | 'size_reference' | 'detail';
  display_order: number;
  alt_text?: string;
  width?: number;
  height?: number;
  file_size_kb?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVideo {
  id: string;
  tenant_id: string;
  product_id: string;
  video_url: string;
  video_type: 'mp4' | 'webm' | 'youtube' | 'vimeo';
  thumbnail_url?: string;
  duration_seconds?: number;
  display_order: number;
  title?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AddImageData {
  image_url: string;
  image_type: 'primary' | 'angle' | 'lifestyle' | 'size_reference' | 'detail';
  display_order?: number;
  alt_text?: string;
  width?: number;
  height?: number;
  file_size_kb?: number;
}

export interface AddVideoData {
  video_url: string;
  video_type: 'mp4' | 'webm' | 'youtube' | 'vimeo';
  thumbnail_url?: string;
  duration_seconds?: number;
  display_order?: number;
  title?: string;
  description?: string;
}

class MediaService {
  /**
   * Get all images for a product, ordered by display_order
   */
  async getProductImages(tenantId: string, productId: string): Promise<ProductImage[]> {
    try {
      // Set tenant context for RLS
      await supabase.rpc('set_config', {
        setting: 'app.current_tenant_id',
        value: tenantId
      });

      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching product images:', error);
        throw new Error(`Failed to fetch product images: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in getProductImages:', error);
      throw error;
    }
  }

  /**
   * Get all videos for a product, ordered by display_order
   */
  async getProductVideos(tenantId: string, productId: string): Promise<ProductVideo[]> {
    try {
      // Set tenant context for RLS
      await supabase.rpc('set_config', {
        setting: 'app.current_tenant_id',
        value: tenantId
      });

      const { data, error } = await supabase
        .from('product_videos')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching product videos:', error);
        throw new Error(`Failed to fetch product videos: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in getProductVideos:', error);
      throw error;
    }
  }

  /**
   * Add a new image to a product
   */
  async addProductImage(
    tenantId: string,
    productId: string,
    imageData: AddImageData
  ): Promise<ProductImage> {
    try {
      // Set tenant context for RLS
      await supabase.rpc('set_config', {
        setting: 'app.current_tenant_id',
        value: tenantId
      });

      // If no display_order provided, get the next available order
      let displayOrder = imageData.display_order;
      if (displayOrder === undefined) {
        const existingImages = await this.getProductImages(tenantId, productId);
        displayOrder = existingImages.length;
      }

      const { data, error } = await supabase
        .from('product_images')
        .insert({
          tenant_id: tenantId,
          product_id: productId,
          ...imageData,
          display_order: displayOrder,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding product image:', error);
        throw new Error(`Failed to add product image: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('Error in addProductImage:', error);
      throw error;
    }
  }

  /**
   * Add a new video to a product
   */
  async addProductVideo(
    tenantId: string,
    productId: string,
    videoData: AddVideoData
  ): Promise<ProductVideo> {
    try {
      // Set tenant context for RLS
      await supabase.rpc('set_config', {
        setting: 'app.current_tenant_id',
        value: tenantId
      });

      // If no display_order provided, get the next available order
      let displayOrder = videoData.display_order;
      if (displayOrder === undefined) {
        const existingVideos = await this.getProductVideos(tenantId, productId);
        displayOrder = existingVideos.length;
      }

      const { data, error } = await supabase
        .from('product_videos')
        .insert({
          tenant_id: tenantId,
          product_id: productId,
          ...videoData,
          display_order: displayOrder,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding product video:', error);
        throw new Error(`Failed to add product video: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('Error in addProductVideo:', error);
      throw error;
    }
  }

  /**
   * Delete a product image
   */
  async deleteProductImage(tenantId: string, imageId: string): Promise<void> {
    try {
      // Set tenant context for RLS
      await supabase.rpc('set_config', {
        setting: 'app.current_tenant_id',
        value: tenantId
      });

      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId)
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('Error deleting product image:', error);
        throw new Error(`Failed to delete product image: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error in deleteProductImage:', error);
      throw error;
    }
  }

  /**
   * Delete a product video
   */
  async deleteProductVideo(tenantId: string, videoId: string): Promise<void> {
    try {
      // Set tenant context for RLS
      await supabase.rpc('set_config', {
        setting: 'app.current_tenant_id',
        value: tenantId
      });

      const { error } = await supabase
        .from('product_videos')
        .delete()
        .eq('id', videoId)
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('Error deleting product video:', error);
        throw new Error(`Failed to delete product video: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error in deleteProductVideo:', error);
      throw error;
    }
  }

  /**
   * Reorder product images
   */
  async reorderProductImages(
    tenantId: string,
    productId: string,
    imageIds: string[]
  ): Promise<void> {
    try {
      // Set tenant context for RLS
      await supabase.rpc('set_config', {
        setting: 'app.current_tenant_id',
        value: tenantId
      });

      // Update each image with its new display_order
      const updates = imageIds.map((imageId, index) =>
        supabase
          .from('product_images')
          .update({ display_order: index, updated_at: new Date().toISOString() })
          .eq('id', imageId)
          .eq('tenant_id', tenantId)
          .eq('product_id', productId)
      );

      await Promise.all(updates);
    } catch (error: any) {
      console.error('Error in reorderProductImages:', error);
      throw error;
    }
  }

  /**
   * Get primary image for a product
   */
  async getPrimaryImage(tenantId: string, productId: string): Promise<ProductImage | null> {
    try {
      const images = await this.getProductImages(tenantId, productId);
      
      // First try to find an image with type 'primary'
      const primaryImage = images.find(img => img.image_type === 'primary');
      if (primaryImage) return primaryImage;
      
      // Otherwise return the first image
      return images.length > 0 ? images[0] : null;
    } catch (error: any) {
      console.error('Error in getPrimaryImage:', error);
      throw error;
    }
  }
}

export const mediaService = new MediaService();
export default mediaService;
