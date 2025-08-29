// src/components/library/ViewSetManagementModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAppStore } from '@/store'
import { XMarkIcon, PlusIcon, PhotoIcon, TrashIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'
import { Product, ProductViewSet, ProductView } from '@/types'
import ImageUpload from '@/components/ui/ImageUpload'
import { storageService } from '@/lib/storage'

interface ViewSetManagementModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onViewSetsUpdated: (viewSets: ProductViewSet[]) => void
}

interface ViewSetForm {
  name: string
  version: number
}

interface ViewForm {
  view: 'front' | 'back' | 'sleeveL' | 'sleeveR'
  image_path: string
  base_size: string
  px_per_cm?: number
  centerline_x_px?: number
  collar_y_px?: number
}

export default function ViewSetManagementModal({
  product,
  isOpen,
  onClose,
  onViewSetsUpdated
}: ViewSetManagementModalProps) {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [viewSets, setViewSets] = useState<ProductViewSet[]>([])
  const [selectedViewSet, setSelectedViewSet] = useState<ProductViewSet | null>(null)
  const [views, setViews] = useState<ProductView[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingViewSet, setIsCreatingViewSet] = useState(false)
  const [isAddingView, setIsAddingView] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [viewSetForm, setViewSetForm] = useState<ViewSetForm>({
    name: '',
    version: 1
  })
  const [viewForm, setViewForm] = useState<ViewForm>({
    view: 'front',
    image_path: '',
    base_size: 'L',
    px_per_cm: undefined,
    centerline_x_px: undefined,
    collar_y_px: undefined
  })

  const supabase = createClient()

  const viewOptions = [
    { value: 'front', label: 'ด้านหน้า (Front)', required: true },
    { value: 'back', label: 'ด้านหลัง (Back)', required: false },
    { value: 'sleeveL', label: 'แขนซ้าย (Left Sleeve)', required: false },
    { value: 'sleeveR', label: 'แขนขวา (Right Sleeve)', required: false }
  ]

  useEffect(() => {
    if (isOpen && product) {
      fetchViewSets()
    }
  }, [isOpen, product])

  useEffect(() => {
    if (selectedViewSet) {
      fetchViews(selectedViewSet.id)
    }
  }, [selectedViewSet])

  const fetchViewSets = async () => {
    if (!product) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('product_view_sets')
        .select('*')
        .eq('product_id', product.id)
        .order('version', { ascending: false })

      if (error) throw error
      setViewSets(data || [])
      
      // Auto-select first view set
      if (data && data.length > 0) {
        setSelectedViewSet(data[0])
      }
    } catch (error) {
      console.error('Error fetching view sets:', error)
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถโหลด View Sets ได้')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchViews = async (viewSetId: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('product_views')
        .select('*')
        .eq('view_set_id', viewSetId)
        .order('view')

      if (error) throw error
      setViews(data || [])
    } catch (error) {
      console.error('Error fetching views:', error)
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถโหลด Views ได้')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateViewSet = async () => {
    if (!product || !viewSetForm.name.trim()) {
      toast.error('ข้อผิดพลาด', 'กรุณากรอกชื่อ View Set')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('product_view_sets')
        .insert({
          product_id: product.id,
          name: viewSetForm.name.trim(),
          version: viewSetForm.version
        })
        .select()
        .single()

      if (error) throw error
      
      toast.success('สร้างสำเร็จ', 'View Set ใหม่ถูกสร้างแล้ว')
      setIsCreatingViewSet(false)
      setViewSetForm({ name: '', version: 1 })
      fetchViewSets()
      setSelectedViewSet(data)
    } catch (error) {
      console.error('Error creating view set:', error)
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถสร้าง View Set ได้')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddView = async () => {
    if (!selectedViewSet || !viewForm.image_path.trim()) {
      toast.error('ข้อผิดพลาด', 'กรุณาเลือกรูปภาพ')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('product_views')
        .insert({
          view_set_id: selectedViewSet.id,
          view: viewForm.view,
          image_path: viewForm.image_path.trim(),
          base_size: viewForm.base_size,
          px_per_cm: viewForm.px_per_cm,
          centerline_x_px: viewForm.centerline_x_px,
          collar_y_px: viewForm.collar_y_px
        } as any)

      if (error) throw error
      
      toast.success('เพิ่มสำเร็จ', 'View ใหม่ถูกเพิ่มแล้ว')
      setIsAddingView(false)
      setViewForm({
        view: 'front',
        image_path: '',
        base_size: 'L',
        px_per_cm: undefined,
        centerline_x_px: undefined,
        collar_y_px: undefined
      })
      fetchViews(selectedViewSet.id)
    } catch (error: any) {
      console.error('Error adding view:', error)
      if (error.code === '23505') {
        toast.error('ข้อผิดพลาด', 'View นี้มีอยู่แล้วใน View Set')
      } else {
        toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถเพิ่ม View ได้')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteView = async (view: ProductView) => {
    if (!confirm(`ต้องการลบ View "${view.view}" หรือไม่?`)) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('product_views')
        .delete()
        .eq('id', view.id)

      if (error) throw error
      
      toast.success('ลบสำเร็จ', 'View ถูกลบแล้ว')
      if (selectedViewSet) {
        fetchViews(selectedViewSet.id)
      }
    } catch (error) {
      console.error('Error deleting view:', error)
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถลบ View ได้')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (url: string) => {
    setViewForm(prev => ({ ...prev, image_path: url }))
    toast.success('อัปโหลดสำเร็จ', 'รูปภาพถูกอัปโหลดเรียบร้อยแล้ว')
  }

  const handleImageUploadError = (error: string) => {
    toast.error('เกิดข้อผิดพลาด', error)
  }

  const getViewStatus = (viewType: string) => {
    const view = views.find(v => v.view === viewType)
    if (!view) return 'missing'
    if (!view.px_per_cm && viewType === 'front') return 'uncalibrated'
    return 'complete'
  }

  const handleClose = () => {
    onViewSetsUpdated(viewSets)
    onClose()
    setIsCreatingViewSet(false)
    setIsAddingView(false)
  }

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300" onClick={handleClose} />

        <div className="relative inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all duration-300 animate-scaleIn sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl shadow-lg">
                <PhotoIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  จัดการ View Sets
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

          <div className="flex gap-6 h-96">
            {/* Left: View Sets List */}
            <div className="w-64 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">View Sets</h4>
                <button
                  onClick={() => setIsCreatingViewSet(true)}
                  className="btn btn-primary btn-sm"
                  disabled={isLoading}
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  สร้าง
                </button>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto">
                {viewSets.map((viewSet) => (
                  <button
                    key={viewSet.id}
                    onClick={() => setSelectedViewSet(viewSet)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedViewSet?.id === viewSet.id
                        ? 'bg-blue-100 text-blue-900 border-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    disabled={isLoading}
                  >
                    <div className="font-medium">{viewSet.name}</div>
                    <div className="text-sm text-gray-500">v{viewSet.version}</div>
                  </button>
                ))}

                {viewSets.length === 0 && (
                  <div className="text-center py-8">
                    <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">ยังไม่มี View Sets</p>
                    <button
                      onClick={() => setIsCreatingViewSet(true)}
                      className="btn btn-primary btn-sm"
                      disabled={isLoading}
                    >
                      <PlusIcon className="w-4 h-4 mr-1" />
                      สร้างแรก
                    </button>
                  </div>
                )}
              </div>

              {/* Create View Set Form */}
              {isCreatingViewSet && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-3">สร้าง View Set ใหม่</h5>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={viewSetForm.name}
                      onChange={(e) => setViewSetForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ชื่อ View Set"
                      disabled={isLoading}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsCreatingViewSet(false)}
                        className="flex-1 btn btn-secondary btn-sm"
                        disabled={isLoading}
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={handleCreateViewSet}
                        className="flex-1 btn btn-primary btn-sm"
                        disabled={isLoading || !viewSetForm.name.trim()}
                      >
                        สร้าง
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Views Management */}
            <div className="flex-1 flex flex-col">
              {selectedViewSet ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">
                      Views in {selectedViewSet.name}
                    </h4>
                    <button
                      onClick={() => setIsAddingView(true)}
                      className="btn btn-primary btn-sm"
                      disabled={isLoading || views.length >= 4}
                    >
                      <PlusIcon className="w-4 h-4 mr-1" />
                      เพิ่ม View
                    </button>
                  </div>

                  {/* Views Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {viewOptions.map((option) => {
                      const view = views.find(v => v.view === option.value)
                      const status = getViewStatus(option.value)
                      
                      return (
                        <div
                          key={option.value}
                          className={`p-4 border-2 rounded-lg ${
                            view
                              ? status === 'complete'
                                ? 'border-green-200 bg-green-50'
                                : 'border-yellow-200 bg-yellow-50'
                              : option.required
                              ? 'border-red-200 bg-red-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">
                                {option.label}
                              </span>
                              {option.required && (
                                <span className="text-red-500 text-xs">*</span>
                              )}
                            </div>
                            <div className="flex space-x-1">
                              {view ? (
                                <>
                                  {status === 'complete' ? (
                                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
                                  )}
                                  <button
                                    onClick={() => handleDeleteView(view)}
                                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                                    disabled={isLoading}
                                  >
                                    <TrashIcon className="w-3 h-3" />
                                  </button>
                                </>
                              ) : (
                                <div className="w-4 h-4 border-2 border-gray-300 border-dashed rounded" />
                              )}
                            </div>
                          </div>
                          
                          {view && (
                            <div className="text-xs text-gray-600">
                              <div>Base Size: {view.base_size}</div>
                              {view.px_per_cm && (
                                <div>px/cm: {view.px_per_cm.toFixed(2)}</div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Add View Form */}
                  {isAddingView && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-3">เพิ่ม View ใหม่</h5>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            View Type
                          </label>
                          <select
                            value={viewForm.view}
                            onChange={(e) => setViewForm(prev => ({ ...prev, view: e.target.value as any }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                          >
                            {viewOptions
                              .filter(option => !views.find(v => v.view === option.value))
                              .map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Base Size
                          </label>
                          <select
                            value={viewForm.base_size}
                            onChange={(e) => setViewForm(prev => ({ ...prev, base_size: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                          >
                            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            รูปภาพสินค้า *
                          </label>
                          
                          {!viewForm.image_path ? (
                            <ImageUpload
                              onUploadComplete={handleImageUpload}
                              onUploadError={handleImageUploadError}
                              bucket="assets"
                              folder={`products/${product?.code}/${viewForm.view}`}
                              accept="image/*"
                              maxSize={5}
                              className="mb-4"
                            />
                          ) : (
                            <div className="mb-4">
                              <div className="relative">
                                <img
                                  src={viewForm.image_path}
                                  alt={`${viewForm.view} view`}
                                  className="w-full h-32 object-cover rounded-lg border"
                                />
                                <button
                                  onClick={() => setViewForm(prev => ({ ...prev, image_path: '' }))}
                                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-sm text-gray-500 mt-2 truncate">
                                {viewForm.image_path}
                              </p>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-400">
                            หรือใส่ URL รูปภาพโดยตรง:
                          </div>
                          <input
                            type="text"
                            value={viewForm.image_path}
                            onChange={(e) => setViewForm(prev => ({ ...prev, image_path: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/image.jpg"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="col-span-2 flex space-x-2">
                          <button
                            onClick={() => setIsAddingView(false)}
                            className="flex-1 btn btn-secondary btn-sm"
                            disabled={isLoading}
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={handleAddView}
                            className="flex-1 btn btn-primary btn-sm"
                            disabled={isLoading || !viewForm.image_path.trim()}
                          >
                            เพิ่ม View
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">เลือก View Set เพื่อจัดการ Views</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}