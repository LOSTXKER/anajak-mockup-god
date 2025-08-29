// src/components/library/SimpleVariantModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'

interface ProductVariant {
  id: string
  name: string
  color_code?: string
  color_hex?: string
  sku?: string
  additional_info?: any
}

interface Product {
  id: string
  name: string
  code: string
}

interface SimpleVariantModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onVariantsUpdated: (variants: ProductVariant[]) => void
}

interface VariantForm {
  name: string
  color_hex: string
  sku: string
}

export default function SimpleVariantModal({
  product,
  isOpen,
  onClose,
  onVariantsUpdated
}: SimpleVariantModalProps) {
  const { toast } = useToast()
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [formData, setFormData] = useState<VariantForm>({
    name: '',
    color_hex: '#000000',
    sku: ''
  })

  const supabase = createClient()

  useEffect(() => {
    if (isOpen && product) {
      fetchVariants()
    }
  }, [isOpen, product])

  const fetchVariants = async () => {
    if (!product) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', product.id)
        .order('name')

      if (error) throw error
      console.log('Variants fetched:', data?.length || 0)
      setVariants(data || [])
    } catch (error) {
      console.error('Error fetching variants:', error)
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลสีได้')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = () => {
    setIsAdding(true)
    setEditingVariant(null)
    setFormData({
      name: '',
      color_hex: '#000000',
      sku: ''
    })
  }

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant)
    setIsAdding(true)
    setFormData({
      name: variant.name,
      color_hex: variant.color_hex || '#000000',
      sku: variant.sku || ''
    })
  }

  const handleSave = async () => {
    if (!product || !formData.name.trim()) {
      toast.error('ข้อผิดพลาด', 'กรุณากรอกชื่อสี')
      return
    }

    setIsLoading(true)
    try {
      const variantData = {
        product_id: product.id,
        color_name: formData.name.trim(),
        color_code: formData.color_hex,
        sku: formData.sku || null,
        barcode: null,
        view_mode: 'recolor' as const,
        view_set_id: null
      }

      if (editingVariant) {
        const { error } = await supabase
          .from('product_variants')
          .update(variantData as any)
          .eq('id', editingVariant.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('product_variants')
          .insert(variantData as any)
        if (error) throw error
      }

      toast.success('สำเร็จ', editingVariant ? 'แก้ไขสีเรียบร้อย' : 'เพิ่มสีใหม่เรียบร้อย')
      setIsAdding(false)
      fetchVariants()
    } catch (error: any) {
      console.error('Error saving variant:', error)
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (variant: ProductVariant) => {
    if (!confirm(`ต้องการลบสี "${variant.name}" หรือไม่?`)) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variant.id)

      if (error) throw error
      
      toast.success('ลบสำเร็จ', 'ลบสีเรียบร้อย')
      fetchVariants()
    } catch (error) {
      console.error('Error deleting variant:', error)
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถลบสีได้')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    onVariantsUpdated(variants)
    onClose()
    setIsAdding(false)
  }

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300" onClick={handleClose} />

        <div className="relative inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all duration-300 animate-scaleIn sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">จัดการสีสินค้า</h3>
              <p className="text-sm text-gray-700">{product.name} ({product.code})</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-600 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Add Button */}
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-900">รายการสี</h4>
              <button
                onClick={handleAdd}
                className="btn btn-primary btn-sm"
                disabled={isLoading}
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                เพิ่มสี
              </button>
            </div>

            {/* Variants List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {variants.map((variant) => (
                <div key={variant.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: variant.color_hex || '#gray' }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{variant.name}</div>
                        {variant.sku && (
                          <div className="text-sm text-gray-700">SKU: {variant.sku}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(variant)}
                        className="p-1 text-gray-600 hover:text-blue-600 rounded"
                        disabled={isLoading}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(variant)}
                        className="p-1 text-gray-600 hover:text-red-600 rounded"
                        disabled={isLoading}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {variants.length === 0 && !isLoading && (
                <div className="col-span-2 text-center py-8 text-gray-700">
                  ยังไม่มีสีในสินค้านี้
                </div>
              )}
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
              <div className="border-t pt-6">
                <h5 className="font-medium text-gray-900 mb-4">
                  {editingVariant ? 'แก้ไขสี' : 'เพิ่มสีใหม่'}
                </h5>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อสี *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="เช่น สีขาว, สีดำ"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รหัสสี
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={formData.color_hex}
                        onChange={(e) => setFormData(prev => ({ ...prev, color_hex: e.target.value }))}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        disabled={isLoading}
                      />
                      <input
                        type="text"
                        value={formData.color_hex}
                        onChange={(e) => setFormData(prev => ({ ...prev, color_hex: e.target.value }))}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="#000000"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="รหัสสินค้า"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={isLoading}
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn btn-primary btn-sm"
                    disabled={isLoading || !formData.name.trim()}
                  >
                    {editingVariant ? 'บันทึก' : 'เพิ่ม'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}