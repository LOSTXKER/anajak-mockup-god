// src/components/ui/ImageUpload.tsx
'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { PhotoIcon, ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { createClient } from '@/lib/supabase'

interface ImageUploadProps {
  onUploadComplete?: (url: string) => void
  onUploadError?: (error: string) => void
  bucket?: string
  folder?: string
  accept?: string
  maxSize?: number // in MB
  className?: string
}

export default function ImageUpload({
  onUploadComplete,
  onUploadError,
  bucket = 'assets',
  folder = 'products',
  accept = 'image/*',
  maxSize = 5,
  className = ''
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFiles(files)
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFiles(files)
    }
  }

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'กรุณาเลือกไฟล์รูปภาพเท่านั้น'
    }
    
    if (file.size > maxSize * 1024 * 1024) {
      return `ขนาดไฟล์ต้องไม่เกิน ${maxSize} MB`
    }

    return null
  }

  const handleFiles = async (files: File[]) => {
    const file = files[0] // Upload single file for now
    
    const error = validateFile(file)
    if (error) {
      onUploadError?.(error)
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Supabase
    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Generate unique filename
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()
      const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const filePath = folder ? `${folder}/${fileName}` : fileName

      // Upload with progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (error) {
        throw error
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
        onUploadComplete?.(publicUrl)
      }, 500)

    } catch (error: any) {
      setIsUploading(false)
      setUploadProgress(0)
      setPreview(null)
      
      let errorMessage = error.message || 'การอัปโหลดล้มเหลว'
      
      // Provide helpful error messages
      if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
        errorMessage = 'Storage bucket ไม่พบ - กรุณาตรวจสอบการตั้งค่า Supabase Storage'
      } else if (errorMessage.includes('row-level security')) {
        errorMessage = 'ไม่มีสิทธิ์ในการอัปโหลด - กรุณาตรวจสอบ RLS policies'
      } else if (errorMessage.includes('size')) {
        errorMessage = 'ไฟล์ใหญ่เกินไป - ขนาดสูงสุด 5MB'
      }
      
      onUploadError?.(errorMessage)
    }
  }

  const clearPreview = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={`
          relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
          ${isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
          ${isUploading ? 'pointer-events-none' : ''}
        `}
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            {!isUploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearPreview()
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="text-white text-center">
                  <ArrowUpTrayIcon className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                  <div className="text-sm">กำลังอัปโหลด... {uploadProgress}%</div>
                  <div className="w-32 bg-gray-600 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <PhotoIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">
              ลากรูปภาพมาวางที่นี่
            </div>
            <div className="text-sm text-gray-700 mb-4">
              หรือคลิกเพื่อเลือกไฟล์
            </div>
            <div className="text-xs text-gray-600">
              รองรับไฟล์ JPG, PNG, WEBP ขนาดไม่เกิน {maxSize} MB
            </div>
          </div>
        )}
      </div>
    </div>
  )
}