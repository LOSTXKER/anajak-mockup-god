// src/components/library/CreateEditSizeChartModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAppStore } from '@/store'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'
import { SizeChart } from '@/types'

interface CreateEditSizeChartModalProps {
  sizeChart?: SizeChart | null
  isOpen: boolean
  onClose: () => void
  onSave: (sizeChart: SizeChart) => void
}

interface SizeChartForm {
  name: string
  base_size: string
}

export default function CreateEditSizeChartModal({ 
  sizeChart, 
  isOpen, 
  onClose, 
  onSave 
}: CreateEditSizeChartModalProps) {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<SizeChartForm>>({})
  const [formData, setFormData] = useState<SizeChartForm>({
    name: '',
    base_size: 'L'
  })

  const supabase = createClient()
  const isEditing = !!sizeChart

  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

  useEffect(() => {
    if (isOpen) {
      if (sizeChart) {
        // Populate form with existing size chart data
        setFormData({
          name: sizeChart.name || '',
          base_size: sizeChart.base_size || 'L'
        })
      } else {
        // Reset form for new size chart
        setFormData({
          name: '',
          base_size: 'L'
        })
      }
      setErrors({})
    }
  }, [isOpen, sizeChart])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user starts typing
    if (errors[name as keyof SizeChartForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<SizeChartForm> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'กรุณาใส่ชื่อ Size Chart'
    }

    if (!formData.base_size.trim()) {
      newErrors.base_size = 'กรุณาเลือก Base Size'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    if (!user?.org_id) return

    setIsLoading(true)

    try {
      const sizeChartData = {
        ...formData,
        org_id: user.org_id
      }

      if (isEditing) {
        // Update existing size chart
        const { data, error } = await (supabase.from('size_charts').update(sizeChartData as any) as any)
          .eq('id', sizeChart.id)
          .select(`
            *,
            sizes:size_rows(*)
          `)
          .single()

        if (error) throw error
        onSave(data)
        toast.success('แก้ไขสำเร็จ', 'Size Chart ถูกแก้ไขแล้ว')
      } else {
        // Create new size chart
        const { data, error } = await (supabase.from('size_charts').insert(sizeChartData as any) as any)
          .select(`
            *,
            sizes:size_rows(*)
          `)
          .single()

        if (error) throw error
        onSave(data)
        toast.success('สร้างสำเร็จ', 'Size Chart ใหม่ถูกสร้างแล้ว')
      }

      onClose()
    } catch (error: unknown) {
      console.error('Error saving size chart:', error)
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        setErrors({ name: 'ชื่อ Size Chart นี้มีอยู่แล้ว' })
        toast.error('ข้อผิดพลาด', 'ชื่อ Size Chart นี้มีอยู่แล้ว')
      } else {
        toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึก Size Chart ได้')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300" onClick={onClose} />

        <div className="relative inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all duration-300 animate-scaleIn sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {isEditing ? 'แก้ไข Size Chart' : 'สร้าง Size Chart ใหม่'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                disabled={isLoading}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อ Size Chart *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  placeholder="เช่น Standard T-Shirt, Premium Polo"
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="base_size" className="block text-sm font-medium text-gray-700 mb-2">
                  Base Size *
                </label>
                <select
                  id="base_size"
                  name="base_size"
                  value={formData.base_size}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.base_size ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                >
                  {sizeOptions.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                {errors.base_size && (
                  <p className="mt-1 text-sm text-red-600">{errors.base_size}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Base Size ใช้เป็นมาตรฐานสำหรับการวัดและ calibration
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">เกี่ยวกับ Size Chart</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• ใช้สำหรับเก็บขนาดของผลิตภัณฑ์ในแต่ละไซส์</li>
                  <li>• Base Size จะใช้เป็นมาตรฐานสำหรับการ calibration</li>
                  <li>• สามารถเพิ่มไซส์อื่นๆ ได้หลังจากสร้าง Size Chart แล้ว</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading 
                  ? (isEditing ? 'กำลังบันทึก...' : 'กำลังสร้าง...') 
                  : (isEditing ? 'บันทึกการเปลี่ยนแปลง' : 'สร้าง Size Chart')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}