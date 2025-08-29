// src/components/projects/CreateProjectModal.tsx
'use client'

import { useState } from 'react'
import { XMarkIcon, PlusIcon, FolderIcon } from '@heroicons/react/24/outline'
import { CreateProjectForm } from '@/types'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateProjectForm) => Promise<void>
}

export default function CreateProjectModal({ isOpen, onClose, onSubmit }: CreateProjectModalProps) {
  const [formData, setFormData] = useState<CreateProjectForm>({
    client_code: '',
    client_name: '',
    code: '',
    name: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<CreateProjectForm>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name as keyof CreateProjectForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateProjectForm> = {}

    if (!formData.client_code.trim()) {
      newErrors.client_code = 'กรุณาใส่รหัสลูกค้า'
    }

    if (!formData.client_name.trim()) {
      newErrors.client_name = 'กรุณาใส่ชื่อลูกค้า'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'กรุณาใส่รหัสโปรเจกต์'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'กรุณาใส่ชื่อโปรเจกต์'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      // Reset form on success
      setFormData({
        client_code: '',
        client_name: '',
        code: '',
        name: '',
        notes: ''
      })
      setErrors({})
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        client_code: '',
        client_name: '',
        code: '',
        name: '',
        notes: ''
      })
      setErrors({})
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300" onClick={handleClose} />

        {/* Modal */}
        <div className="relative inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all duration-300 animate-scaleIn sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <PlusIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  สร้างโปรเจกต์ใหม่
                </h3>
                <p className="text-sm text-gray-500">
                  กรอกข้อมูลโปรเจกต์ให้ครบถ้วน
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              disabled={isSubmitting}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="client_code" className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสลูกค้า *
                </label>
                <input
                  type="text"
                  id="client_code"
                  name="client_code"
                  value={formData.client_code}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${errors.client_code ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200'} focus:outline-none`}
                  placeholder="เช่น CEN001"
                  disabled={isSubmitting}
                />
                {errors.client_code && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.client_code}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อลูกค้า *
                </label>
                <input
                  type="text"
                  id="client_name"
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${errors.client_name ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200'} focus:outline-none`}
                  placeholder="เช่น Central Group"
                  disabled={isSubmitting}
                />
                {errors.client_name && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.client_name}
                  </p>
                )}
              </div>
            </div>

            {/* Second row - Project details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสโปรเจกต์ *
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${errors.code ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200'} focus:outline-none`}
                  placeholder="เช่น ANJ-25-0001"
                  disabled={isSubmitting}
                />
                {errors.code && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.code}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อโปรเจกต์ *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200'} focus:outline-none`}
                  placeholder="เช่น เสื้อทีมงาน Event 2025"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.name}
                  </p>
                )}
              </div>
            </div>

            {/* Notes section */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                หมายเหตุ
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all duration-200 resize-none"
                placeholder="หมายเหตุเพิ่มเติม เช่น ขนาดทีม, สี, วัสดุพิเศษ..."
                disabled={isSubmitting}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200"
                disabled={isSubmitting}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="group relative px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden"
                disabled={isSubmitting}
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-500"></span>
                <span className="relative flex items-center">
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4">
                        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      กำลังสร้าง...
                    </>
                  ) : (
                    <>
                      <FolderIcon className="w-4 h-4 mr-2" />
                      สร้างโปรเจกต์
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}