// src/components/library/SizeChartDetailModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { XMarkIcon, PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'
import { SizeChart, SizeRow } from '@/types'

interface SizeChartDetailModalProps {
  sizeChart: SizeChart | null
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
}

interface SizeRowForm {
  size: string
  chest_cm: string
  body_cm: string
  sleeve_cm: string
}

export default function SizeChartDetailModal({ 
  sizeChart, 
  isOpen, 
  onClose, 
  onEdit 
}: SizeChartDetailModalProps) {
  const { toast } = useToast()
  const [sizes, setSizes] = useState<SizeRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingSize, setIsAddingSize] = useState(false)
  const [editingSize, setEditingSize] = useState<SizeRow | null>(null)
  const [sizeForm, setSizeForm] = useState<SizeRowForm>({
    size: '',
    chest_cm: '',
    body_cm: '',
    sleeve_cm: ''
  })

  const supabase = createClient()

  useEffect(() => {
    if (isOpen && sizeChart) {
      fetchSizes()
    }
  }, [isOpen, sizeChart])

  const fetchSizes = async () => {
    if (!sizeChart) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('size_rows')
        .select('*')
        .eq('size_chart_id', sizeChart.id)
        .order('size')

      if (error) throw error
      setSizes(data || [])
    } catch (error) {
      console.error('Error fetching sizes:', error)
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลไซส์ได้')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSize = () => {
    setIsAddingSize(true)
    setEditingSize(null)
    setSizeForm({
      size: '',
      chest_cm: '',
      body_cm: '',
      sleeve_cm: ''
    })
  }

  const handleEditSize = (size: SizeRow) => {
    setEditingSize(size)
    setIsAddingSize(true)
    setSizeForm({
      size: size.size,
      chest_cm: size.chest_cm.toString(),
      body_cm: size.body_cm?.toString() || '',
      sleeve_cm: size.sleeve_cm?.toString() || ''
    })
  }

  const handleSaveSize = async () => {
    if (!sizeChart || !sizeForm.size.trim() || !sizeForm.chest_cm) {
      toast.error('ข้อผิดพลาด', 'กรุณากรอกชื่อไซส์และขนาดอก')
      return
    }

    setIsLoading(true)
    try {
      const sizeData = {
        size_chart_id: sizeChart.id,
        size: sizeForm.size.trim(),
        chest_cm: parseFloat(sizeForm.chest_cm),
        body_cm: sizeForm.body_cm ? parseFloat(sizeForm.body_cm) : null,
        sleeve_cm: sizeForm.sleeve_cm ? parseFloat(sizeForm.sleeve_cm) : null
      }

      if (editingSize) {
        // Update existing size
        const { error } = await (supabase.from('size_rows').update(sizeData as any) as any)
          .eq('id', editingSize.id)

        if (error) throw error
        toast.success('แก้ไขสำเร็จ', 'ข้อมูลไซส์ถูกแก้ไขแล้ว')
      } else {
        // Create new size
        const { error } = await (supabase.from('size_rows').insert(sizeData as any) as any)

        if (error) throw error
        toast.success('เพิ่มสำเร็จ', 'ไซส์ใหม่ถูกเพิ่มแล้ว')
      }

      setIsAddingSize(false)
      setEditingSize(null)
      fetchSizes()
    } catch (error: unknown) {
      console.error('Error saving size:', error)
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        toast.error('ข้อผิดพลาด', 'ชื่อไซส์นี้มีอยู่แล้วในตาราง')
      } else {
        toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลไซส์ได้')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSize = async (size: SizeRow) => {
    if (!confirm(`ต้องการลบไซส์ "${size.size}" หรือไม่?`)) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('size_rows')
        .delete()
        .eq('id', size.id)

      if (error) throw error
      
      toast.success('ลบสำเร็จ', 'ไซส์ถูกลบแล้ว')
      fetchSizes()
    } catch (error) {
      console.error('Error deleting size:', error)
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถลบไซส์ได้')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !sizeChart) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300" onClick={onClose} />

        <div className="relative inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all duration-300 animate-scaleIn sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{sizeChart.name}</h3>
              <p className="text-sm text-gray-500">Base Size: {sizeChart.base_size}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onEdit}
                className="btn btn-secondary btn-sm"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                แก้ไข
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Left: Sizes Table */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">
                  ตารางไซส์ ({sizes.length})
                </h4>
                <button
                  onClick={handleAddSize}
                  className="btn btn-primary btn-sm"
                  disabled={isLoading}
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  เพิ่มไซส์
                </button>
              </div>

              {sizes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Size</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Chest (cm)</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Body (cm)</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Sleeve (cm)</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sizes.map((size) => (
                        <tr key={size.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">{size.size}</td>
                          <td className="px-4 py-2 text-gray-900">{size.chest_cm}</td>
                          <td className="px-4 py-2 text-gray-900">{size.body_cm || '-'}</td>
                          <td className="px-4 py-2 text-gray-900">{size.sleeve_cm || '-'}</td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleEditSize(size)}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                disabled={isLoading}
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSize(size)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                disabled={isLoading}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 border border-gray-200 rounded-lg">
                  <p className="text-gray-500 mb-4">ยังไม่มีไซส์ในตารางนี้</p>
                  <button
                    onClick={handleAddSize}
                    className="btn btn-primary btn-sm"
                    disabled={isLoading}
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    เพิ่มไซส์แรก
                  </button>
                </div>
              )}
            </div>

            {/* Right: Add/Edit Form */}
            {isAddingSize && (
              <div className="w-80">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    {editingSize ? 'แก้ไขไซส์' : 'เพิ่มไซส์ใหม่'}
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Size *
                      </label>
                      <input
                        type="text"
                        value={sizeForm.size}
                        onChange={(e) => setSizeForm(prev => ({ ...prev, size: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="เช่น S, M, L, XL"
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chest Width (cm) *
                      </label>
                      <input
                        type="number"
                        value={sizeForm.chest_cm}
                        onChange={(e) => setSizeForm(prev => ({ ...prev, chest_cm: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="เช่น 42"
                        step="0.1"
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Body Length (cm)
                      </label>
                      <input
                        type="number"
                        value={sizeForm.body_cm}
                        onChange={(e) => setSizeForm(prev => ({ ...prev, body_cm: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="เช่น 68"
                        step="0.1"
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sleeve Length (cm)
                      </label>
                      <input
                        type="number"
                        value={sizeForm.sleeve_cm}
                        onChange={(e) => setSizeForm(prev => ({ ...prev, sleeve_cm: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="เช่น 22"
                        step="0.1"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => setIsAddingSize(false)}
                        className="flex-1 btn btn-secondary btn-sm"
                        disabled={isLoading}
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={handleSaveSize}
                        className="flex-1 btn btn-primary btn-sm"
                        disabled={isLoading || !sizeForm.size.trim() || !sizeForm.chest_cm}
                      >
                        {editingSize ? 'บันทึก' : 'เพิ่ม'}
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