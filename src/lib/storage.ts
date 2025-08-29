// src/lib/storage.ts
import { createClient } from '@/lib/supabase'

export interface UploadOptions {
  bucket?: string
  folder?: string
  upsert?: boolean
  cacheControl?: string
}

export interface UploadResult {
  url: string
  path: string
  fileName: string
}

export class StorageService {
  private supabase = createClient()
  private defaultBucket = 'assets'

  async uploadFile(
    file: File, 
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      bucket = this.defaultBucket,
      folder = 'uploads',
      upsert = false,
      cacheControl = '3600'
    } = options

    // Generate unique filename
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
    const filePath = folder ? `${folder}/${fileName}` : fileName

    // Ensure bucket exists before upload
    await this.createBucketIfNotExists(bucket)

    // Upload file
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl,
        upsert
      })

    if (error) {
      // If bucket doesn't exist, provide helpful error
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        throw new Error(`Storage bucket '${bucket}' not found. Please create it in your Supabase Dashboard first.`)
      }
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      url: publicUrl,
      path: filePath,
      fileName
    }
  }

  async uploadMultipleFiles(
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, options))
    return Promise.all(uploadPromises)
  }

  async deleteFile(path: string, bucket = this.defaultBucket): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  }

  async createBucketIfNotExists(bucketName: string): Promise<void> {
    try {
      console.log(`🔍 Checking bucket: ${bucketName}`)
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets()
      
      if (listError) {
        console.warn(`❌ Cannot list buckets:`, listError.message)
        console.warn(`📝 Make sure your Supabase URL and API key are correct`)
        return
      }

      console.log(`📋 Available buckets:`, buckets?.map(b => b.name) || [])
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName)

      if (bucketExists) {
        console.log(`✅ Bucket '${bucketName}' already exists`)
        return
      }

      console.log(`🔨 Creating bucket: ${bucketName}`)
      const { error } = await this.supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'],
        fileSizeLimit: 5242880 // 5MB
      })

      if (error) {
        console.warn(`⚠️ Bucket '${bucketName}' creation failed:`, error.message)
        
        // Double-check if bucket exists (might be created by admin or RLS issue)
        const { data: recheckBuckets, error: recheckError } = await this.supabase.storage.listBuckets()
        
        if (!recheckError) {
          const nowExists = recheckBuckets?.some(bucket => bucket.name === bucketName)
          if (nowExists) {
            console.log(`✅ Bucket '${bucketName}' is available (probably created manually)`)
          } else {
            console.error(`❌ Storage bucket '${bucketName}' still unavailable`)
            console.info(`📝 Please create bucket '${bucketName}' manually in Supabase Dashboard`)
          }
        }
      } else {
        console.log(`✅ Bucket '${bucketName}' created successfully`)
      }
    } catch (error: any) {
      console.warn(`⚠️ Storage bucket check failed:`, error.message)
      console.info(`📝 This might be a permissions issue. Check your Supabase settings.`)
    }
  }

  getPublicUrl(path: string, bucket = this.defaultBucket): string {
    const { data: { publicUrl } } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return publicUrl
  }

  // Product-specific upload methods
  async uploadProductImage(
    file: File,
    productId: string,
    viewType: 'front' | 'back' | 'sleeve' = 'front'
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      bucket: 'assets',
      folder: `products/${productId}/${viewType}`
    })
  }

  async uploadLogoAsset(file: File, projectId: string): Promise<UploadResult> {
    return this.uploadFile(file, {
      bucket: 'assets',
      folder: `logos/${projectId}`
    })
  }

  async uploadMockupExport(file: Blob, mockupId: string): Promise<UploadResult> {
    const mockupFile = new File([file], `mockup-${mockupId}.png`, {
      type: 'image/png'
    })

    return this.uploadFile(mockupFile, {
      bucket: 'exports',
      folder: `mockups/${mockupId}`
    })
  }
}

// Export singleton instance
export const storageService = new StorageService()

// Bucket initialization
export const initializeStorageBuckets = async (): Promise<void> => {
  try {
    console.log('🔄 Initializing storage buckets...')
    await storageService.createBucketIfNotExists('assets')
    await storageService.createBucketIfNotExists('exports')
    console.log('✅ Storage buckets check completed')
  } catch (error) {
    console.warn('⚠️ Storage bucket initialization completed with warnings:', error)
  }
}