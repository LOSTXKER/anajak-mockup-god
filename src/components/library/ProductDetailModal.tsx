// src/components/library/ProductDetailModal.tsx
'use client'

import { useState } from 'react'
import { XMarkIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline'
import VariantManagementModal from './VariantManagementModal'
import ViewSetManagementModal from './ViewSetManagementModal'

interface ProductDetailModalProps {
  product: any
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
}

export default function ProductDetailModal({ product, isOpen, onClose, onEdit }: ProductDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'variants' | 'views'>('info')
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const [isViewSetModalOpen, setIsViewSetModalOpen] = useState(false)
  const [productVariants, setProductVariants] = useState(product?.variants || [])
  const [productViewSets, setProductViewSets] = useState(product?.view_sets || [])

  if (!isOpen || !product) return null

  const tabs = [
    { id: 'info', name: 'ข้อมูลทั่วไป' },
    { id: 'variants', name: `สีและตัวแปร (${productVariants?.length || 0})` },
    { id: 'views', name: `View Sets (${productViewSets?.length || 0})` }
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500">รหัส: {product.code}</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={onEdit}
                  className="btn btn-secondary btn-sm"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  แก้ไข
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mt-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand-100 text-brand-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4 max-h-96 overflow-y-auto">
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">ข้อมูลผลิตภัณฑ์</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-500">ชื่อ</dt>
                      <dd className="text-sm text-gray-900">{product.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">รหัสสินค้า</dt>
                      <dd className="text-sm text-gray-900">{product.code}</dd>
                    </div>
                    {product.brand && (
                      <div>
                        <dt className="text-sm text-gray-500">แบรนด์</dt>
                        <dd className="text-sm text-gray-900">{product.brand}</dd>
                      </div>
                    )}
                    {product.fabric && (
                      <div>
                        <dt className="text-sm text-gray-500">เนื้อผ้า</dt>
                        <dd className="text-sm text-gray-900">{product.fabric}</dd>
                      </div>
                    )}
                    {product.weight_gsm && (
                      <div>
                        <dt className="text-sm text-gray-500">น้ำหนัก</dt>
                        <dd className="text-sm text-gray-900">{product.weight_gsm} GSM</dd>
                      </div>
                    )}
                    {product.fit && (
                      <div>
                        <dt className="text-sm text-gray-500">ทรง</dt>
                        <dd className="text-sm text-gray-900">{product.fit}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">สถานะและข้อมูลอื่น</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-500">สถานะ</dt>
                      <dd>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.is_published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.is_published ? 'Published' : 'Draft'}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Version</dt>
                      <dd className="text-sm text-gray-900">v{product.version}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Size Chart</dt>
                      <dd className="text-sm text-gray-900">
                        {product.size_chart?.name || 'ไม่ได้กำหนด'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">จำนวนสี</dt>
                      <dd className="text-sm text-gray-900">{productVariants?.length || 0} สี</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">วันที่สร้าง</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(product.created_at).toLocaleDateString('th-TH')}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {activeTab === 'variants' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-900">สีและตัวแปร</h4>
                  <button 
                    onClick={() => setIsVariantModalOpen(true)}
                    className="btn btn-primary btn-sm"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    จัดการสี
                  </button>
                </div>
                
                {productVariants && productVariants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {productVariants.map((variant: any) => (
                      <div key={variant.id} className="flex items-center p-3 border border-gray-200 rounded-lg">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-gray-200 mr-3 flex-shrink-0"
                          style={{ backgroundColor: variant.color_code || '#6b7280' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{variant.color_name}</div>
                          <div className="text-sm text-gray-500">
                            {variant.color_code} • {variant.view_mode === 'image' ? 'Image Mode' : 'Recolor Mode'}
                          </div>
                          {variant.sku && (
                            <div className="text-xs text-gray-400">SKU: {variant.sku}</div>
                          )}
                        </div>
                        <button 
                          onClick={() => setIsVariantModalOpen(true)}
                          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <PlusIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">ยังไม่มีสีที่กำหนด</p>
                    <button 
                      onClick={() => setIsVariantModalOpen(true)}
                      className="btn btn-primary btn-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      เพิ่มสีแรก
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'views' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-900">View Sets & Calibration</h4>
                  <button 
                    onClick={() => setIsViewSetModalOpen(true)}
                    className="btn btn-primary btn-sm"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    จัดการ View Sets
                  </button>
                </div>
                
                {productViewSets && productViewSets.length > 0 ? (
                  <div className="space-y-4">
                    {productViewSets.map((viewSet: any) => (
                      <div key={viewSet.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{viewSet.name}</h5>
                          <span className="text-sm text-gray-500">v{viewSet.version}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>Views: {viewSet.views?.length || 0}/4</div>
                          <div>Created: {new Date(viewSet.created_at).toLocaleDateString('th-TH')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-2">ยังไม่มี View Sets ที่กำหนด</p>
                    <p className="text-sm text-gray-400 mb-4">
                      View Sets ใช้สำหรับเก็บภาพเสื้อในมุมมองต่างๆ และข้อมูล calibration สำหรับ Editor
                    </p>
                    <div className="space-y-2 text-xs text-gray-400 mb-4">
                      <p>• Front view: ภาพด้านหน้า + การวัด px_per_cm</p>
                      <p>• Back view: ภาพด้านหลัง</p>
                      <p>• Sleeve views: ภาพแขนซ้าย/ขวา</p>
                      <p>• Safe Areas: พื้นที่ที่สามารถพิมพ์ได้</p>
                    </div>
                    <button 
                      onClick={() => setIsViewSetModalOpen(true)}
                      className="btn btn-primary btn-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      สร้าง View Set แรก
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>

      {/* Variant Management Modal */}
      <VariantManagementModal
        product={product}
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        onVariantsUpdated={setProductVariants}
      />

      {/* View Set Management Modal */}
      <ViewSetManagementModal
        product={product}
        isOpen={isViewSetModalOpen}
        onClose={() => setIsViewSetModalOpen(false)}
        onViewSetsUpdated={setProductViewSets}
      />
    </div>
  )
}