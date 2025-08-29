// src/components/library/CreateEditProductModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAppStore } from '@/store'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface CreateEditProductModalProps {
  product?: any // null for create, product object for edit
  isOpen: boolean
  onClose: () => void
  onSave: (product: any) => void
}

interface ProductForm {
  code: string
  name: string
  brand: string
  fabric: string
  weight_gsm: string
  fit: string
  size_chart_id: string
  is_published: boolean
}

interface SizeChart {
  id: string
  name: string
}

export default function CreateEditProductModal({ 
  product, 
  isOpen, 
  onClose, 
  onSave 
}: CreateEditProductModalProps) {
  const { user } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [sizeCharts, setSizeCharts] = useState<SizeChart[]>([])
  const [errors, setErrors] = useState<Partial<ProductForm>>({})
  const [formData, setFormData] = useState<ProductForm>({
    code: '',
    name: '',
    brand: '',
    fabric: '',
    weight_gsm: '',
    fit: '',
    size_chart_id: '',
    is_published: true
  })

  const supabase = createClient()
  const isEditing = !!product

  useEffect(() => {
    if (isOpen) {
      fetchSizeCharts()
      if (product) {
        // Populate form with existing product data
        setFormData({
          code: product.code || '',
          name: product.name || '',
          brand: product.brand || '',
          fabric: product.fabric || '',
          weight_gsm: product.weight_gsm?.toString() || '',
          fit: product.fit || '',
          size_chart_id: product.size_chart_id || '',
          is_published: product.is_published ?? true
        })
      } else {
        // Reset form for new product
        setFormData({
          code: '',
          name: '',
          brand: '',
          fabric: '',
          weight_gsm: '',
          fit: '',
          size_chart_id: '',
          is_published: true
        })
      }
      setErrors({})
    }
  }, [isOpen, product])

  const fetchSizeCharts = async () => {
    if (!user?.org_id) return

    try {
      const { data, error } = await supabase
        .from('size_charts')
        .select('id, name')
        .eq('org_id', user.org_id)
        .order('name')

      if (error) throw error
      setSizeCharts(data || [])
    } catch (error) {
      console.error('Error fetching size charts:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Clear error when user starts typing
    if (errors[name as keyof ProductForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ProductForm> = {}

    if (!formData.code.trim()) {
      newErrors.code = 'กรุณาใส่รหัสสินค้า'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'กรุณาใส่ชื่อสินค้า'
    }

    if (formData.weight_gsm && isNaN(Number(formData.weight_gsm))) {
      newErrors.weight_gsm = 'น้ำหนักต้องเป็นตัวเลข'
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
      const productData = {
        ...formData,
        weight_gsm: formData.weight_gsm ? parseInt(formData.weight_gsm) : null,
        size_chart_id: formData.size_chart_id || null,
        org_id: user.org_id
      }

      if (isEditing) {
        // Update existing product
        const { data, error } = await supabase
          .from('products')
          .update(productData as any)
          .eq('id', product.id)
          .select(`
            *,
            size_chart:size_charts(id, name),
            variants:product_variants(id, color_name, color_code)
          `)
          .single()

        if (error) throw error
        onSave(data)
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert(productData as any)
          .select(`
            *,
            size_chart:size_charts(id, name),
            variants:product_variants(id, color_name, color_code)
          `)
          .single()

        if (error) throw error
        onSave(data)
      }

      onClose()
    } catch (error: unknown) {
      console.error('Error saving product:', error)
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        setErrors({ code: 'รหัสสินค้านี้มีอยู่แล้ว' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {isEditing ? 'แก้ไขผลิตภัณฑ์' : 'เพิ่มผลิตภัณฑ์ใหม่'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                  disabled={isLoading}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white px-6 py-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Code */}
                <div>
                  <label htmlFor="code" className="form-label">
                    รหัสสินค้า *
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className={`form-input ${errors.code ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="เช่น PO100"
                    disabled={isLoading}
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                  )}
                </div>

                {/* Product Name */}
                <div>
                  <label htmlFor="name" className="form-label">
                    ชื่อสินค้า *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`form-input ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="เช่น เสื้อยืดคอกลม"
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Brand */}
                <div>
                  <label htmlFor="brand" className="form-label">
                    แบรนด์
                  </label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="เช่น Anajak"
                    disabled={isLoading}
                  />
                </div>

                {/* Fabric */}
                <div>
                  <label htmlFor="fabric" className="form-label">
                    เนื้อผ้า
                  </label>
                  <input
                    type="text"
                    id="fabric"
                    name="fabric"
                    value={formData.fabric}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="เช่น Cotton 100%"
                    disabled={isLoading}
                  />
                </div>

                {/* Weight */}
                <div>
                  <label htmlFor="weight_gsm" className="form-label">
                    น้ำหนัก (GSM)
                  </label>
                  <input
                    type="number"
                    id="weight_gsm"
                    name="weight_gsm"
                    value={formData.weight_gsm}
                    onChange={handleChange}
                    className={`form-input ${errors.weight_gsm ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="เช่น 180"
                    disabled={isLoading}
                  />
                  {errors.weight_gsm && (
                    <p className="mt-1 text-sm text-red-600">{errors.weight_gsm}</p>
                  )}
                </div>

                {/* Fit */}
                <div>
                  <label htmlFor="fit" className="form-label">
                    ทรง
                  </label>
                  <select
                    id="fit"
                    name="fit"
                    value={formData.fit}
                    onChange={handleChange}
                    className="form-input"
                    disabled={isLoading}
                  >
                    <option value="">เลือกทรง</option>
                    <option value="Regular">Regular</option>
                    <option value="Slim">Slim</option>
                    <option value="Oversized">Oversized</option>
                    <option value="Fitted">Fitted</option>
                  </select>
                </div>

                {/* Size Chart */}
                <div className="md:col-span-2">
                  <label htmlFor="size_chart_id" className="form-label">
                    Size Chart
                  </label>
                  <select
                    id="size_chart_id"
                    name="size_chart_id"
                    value={formData.size_chart_id}
                    onChange={handleChange}
                    className="form-input"
                    disabled={isLoading}
                  >
                    <option value="">เลือก Size Chart</option>
                    {sizeCharts.map((chart) => (
                      <option key={chart.id} value={chart.id}>
                        {chart.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Published Status */}
                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_published"
                      name="is_published"
                      checked={formData.is_published}
                      onChange={handleChange}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                      disabled={isLoading}
                    />
                    <label htmlFor="is_published" className="ml-2 text-sm text-gray-700">
                      เผยแพร่ผลิตภัณฑ์นี้ (สามารถใช้ใน Mockup ได้)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
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
                  : (isEditing ? 'บันทึกการเปลี่ยนแปลง' : 'สร้างผลิตภัณฑ์')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}