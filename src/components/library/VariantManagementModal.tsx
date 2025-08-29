// src/components/library/VariantManagementModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { XMarkIcon, PlusIcon, TrashIcon, SwatchIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'
import { ProductVariant, Product } from '@/types'

interface VariantManagementModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onVariantsUpdated: (variants: ProductVariant[]) => void
}

interface VariantForm {
  color_name: string
  color_code: string
  sku: string
  barcode?: string
  view_mode: 'image' | 'recolor'
  view_set_id?: string
}

export default function VariantManagementModal({
  product,
  isOpen,
  onClose,
  onVariantsUpdated
}: VariantManagementModalProps) {
  const { toast } = useToast()
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingVariant, setIsAddingVariant] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [formData, setFormData] = useState<VariantForm>({
    color_name: '',
    color_code: '#000000',
    sku: '',
    barcode: '',
    view_mode: 'recolor',
    view_set_id: ''
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
      setVariants(data || [])
    } catch (error) {
      console.error('Error fetching variants:', error)
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลสีได้')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddVariant = () => {
    setIsAddingVariant(true)
    setEditingVariant(null)
    setFormData({
      color_name: '',
      color_code: '#000000',
      sku: '',
      barcode: '',
      view_mode: 'recolor',
      view_set_id: ''
    })
  }

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant)
    setIsAddingVariant(true)
    setFormData({
      color_name: variant.color_name,
      color_code: variant.color_code || '#000000',
      sku: variant.sku || '',
      barcode: variant.barcode || '',
      view_mode: variant.view_mode,
      view_set_id: variant.view_set_id || ''
    })
  }

  const handleSaveVariant = async () => {
    if (!product || !formData.color_name.trim()) {
      toast.error('ข้อผิดพลาด', 'กรุณากรอกชื่อสี')
      return
    }

    setIsLoading(true)
    try {
      const variantData = {
        product_id: product.id,
        color_name: formData.color_name.trim(),
        color_code: formData.color_code,
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        view_mode: formData.view_mode,
        view_set_id: formData.view_set_id || null
      }

      if (editingVariant) {
        // Update existing variant
        const { error } = await (supabase.from('product_variants').update(variantData as any) as any)
          .eq('id', editingVariant.id)

        if (error) throw error
        toast.success('แก้ไขสำเร็จ', 'ข้อมูลสีถูกแก้ไขแล้ว')
      } else {
        // Create new variant
        const { error } = await (supabase.from('product_variants').insert(variantData as any) as any)

        if (error) throw error
        toast.success('เพิ่มสำเร็จ', 'สีใหม่ถูกเพิ่มแล้ว')
      }

      setIsAddingVariant(false)
      setEditingVariant(null)
      fetchVariants()
    } catch (error: unknown) {
      console.error('Error saving variant:', error)
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        toast.error('ข้อผิดพลาด', 'ชื่อสีนี้มีอยู่แล้วในผลิตภัณฑ์')
      } else {
        toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลสีได้')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteVariant = async (variant: ProductVariant) => {
    if (!confirm(`ต้องการลบสี "${variant.color_name}" หรือไม่?`)) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variant.id)

      if (error) throw error
      
      toast.success('ลบสำเร็จ', 'สีถูกลบแล้ว')
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
    setIsAddingVariant(false)
    setEditingVariant(null)
  }

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300" onClick={handleClose} />

        <div className="relative inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all duration-300 animate-scaleIn sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <SwatchIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  จัดการสีและตัวแปร
                </h3>
                <p className="text-sm text-gray-500">
                  {product.name} ({product.code})
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-6">
            {/* Left: Variants List */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">
                  สีที่มี ({variants.length})
                </h4>
                <button
                  onClick={handleAddVariant}
                  className="btn btn-primary btn-sm"
                  disabled={isLoading}
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  เพิ่มสี
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {variants.map((variant) => (
                  <div key={variant.id} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div
                      className="w-10 h-10 rounded-full border-2 border-gray-200 mr-4 flex-shrink-0"
                      style={{ backgroundColor: variant.color_code || '#6b7280' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{variant.color_name}</div>
                      <div className="text-sm text-gray-500">
                        {variant.color_code} • {variant.view_mode === 'image' ? 'Image Mode' : 'Recolor Mode'}
                      </div>
                      {variant.sku && (
                        <div className="text-xs text-gray-400">SKU: {variant.sku}</div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditVariant(variant)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                        disabled={isLoading}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteVariant(variant)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        disabled={isLoading}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {variants.length === 0 && (
                  <div className="text-center py-8">
                    <SwatchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">ยังไม่มีสีที่กำหนด</p>
                    <button
                      onClick={handleAddVariant}
                      className="btn btn-primary btn-sm"
                      disabled={isLoading}
                    >
                      <PlusIcon className="w-4 h-4 mr-1" />
                      เพิ่มสีแรก
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Add/Edit Form */}
            {isAddingVariant && (
              <div className="w-80">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    {editingVariant ? 'แก้ไขสี' : 'เพิ่มสีใหม่'}
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ชื่อสี *
                      </label>
                      <input
                        type="text"
                        value={formData.color_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, color_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="เช่น สีดำ, สีขาว"
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
                          value={formData.color_code}
                          onChange={(e) => setFormData(prev => ({ ...prev, color_code: e.target.value }))}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                          disabled={isLoading}
                        />
                        <input
                          type="text"
                          value={formData.color_code}
                          onChange={(e) => setFormData(prev => ({ ...prev, color_code: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="เช่น PO100-BLK"
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        View Mode
                      </label>
                      <select
                        value={formData.view_mode}
                        onChange={(e) => setFormData(prev => ({ ...prev, view_mode: e.target.value as 'image' | 'recolor' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                      >
                        <option value="recolor">Recolor Mode (ใช้การเปลี่ยนสี)</option>
                        <option value="image">Image Mode (ใช้รูปภาพแยก)</option>
                      </select>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => setIsAddingVariant(false)}
                        className="flex-1 btn btn-secondary btn-sm"
                        disabled={isLoading}
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={handleSaveVariant}
                        className="flex-1 btn btn-primary btn-sm"
                        disabled={isLoading || !formData.color_name.trim()}
                      >
                        {editingVariant ? 'บันทึก' : 'เพิ่ม'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}