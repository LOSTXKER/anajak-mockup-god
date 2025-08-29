// src/components/library/LibraryPage.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAppStore } from '@/store'
import { 
  MagnifyingGlassIcon, 
  PlusIcon,
  SwatchIcon,
  PhotoIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import ProductDetailModal from './ProductDetailModal'
import CreateEditProductModal from './CreateEditProductModal'

interface Product {
  id: string
  code: string
  name: string
  description?: string
  category?: string
  base_size?: string
  is_active?: boolean
  created_at: string
  updated_at?: string
  size_chart?: {
    id: string
    name: string
  }
  variants?: {
    id: string
    name: string
    color_code?: string
  }[]
}

export default function LibraryPage() {
  const { user, setLoading } = useAppStore()
  const [activeTab, setActiveTab] = useState<'products' | 'assets'>('products')
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const supabase = createClient()

  const tabs = [
    { id: 'products', name: 'Products', icon: SwatchIcon },
    { id: 'assets', name: 'Assets', icon: PhotoIcon }
  ]

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts()
    }
  }, [activeTab])

  const fetchProducts = async () => {
    setLoading(true, 'กำลังโหลดผลิตภัณฑ์...')
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          size_chart:size_charts(id, name),
          variants:product_variants(id, name, color_code)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Products fetched successfully:', data?.length || 0, 'items')
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedProduct(null)
  }

  const handleCreateProduct = () => {
    setIsCreateModalOpen(true)
  }

  const handleEditProductFromDetail = () => {
    setIsDetailModalOpen(false)
    if (selectedProduct) {
      setEditingProduct(selectedProduct)
      setIsEditModalOpen(true)
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setIsEditModalOpen(true)
  }

  const handleSaveProduct = async (savedProduct: Product) => {
    if (editingProduct) {
      // Update existing product in list
      setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p))
      setIsEditModalOpen(false)
      setEditingProduct(null)
    } else {
      // Add new product to list
      setProducts([savedProduct, ...products])
      setIsCreateModalOpen(false)
    }
    
    // Refresh products to get latest data
    fetchProducts()
  }

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`คุณต้องการลบ "${product.name}" หรือไม่?`)) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)

      if (error) throw error

      setProducts(products.filter(p => p.id !== product.id))
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('เกิดข้อผิดพลาดในการลบผลิตภัณฑ์')
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800">ห้องสมุด</h2>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-600" />
              </div>
              <input
                type="search"
                placeholder="ค้นหา..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Add Button */}
            <button 
              onClick={activeTab === 'products' ? handleCreateProduct : () => console.log('Upload files')}
              className="btn btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              {activeTab === 'products' ? 'เพิ่มผลิตภัณฑ์' : 'อัปโหลดไฟล์'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-100 text-brand-700'
                  : 'text-gray-700 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {activeTab === 'products' ? (
          <div>
            {/* Stats */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{products.length}</div>
                <div className="text-sm text-gray-700">Total Products</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                  {products.filter(p => p.is_published).length}
                </div>
                <div className="text-sm text-gray-700">Published</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">
                  {products.reduce((sum, p) => sum + (p.variants?.length || 0), 0)}
                </div>
                <div className="text-sm text-gray-700">Total Variants</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(products.map(p => p.brand).filter(Boolean)).size}
                </div>
                <div className="text-sm text-gray-700">Brands</div>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <SwatchIcon className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'ไม่พบผลิตภัณฑ์' : 'ยังไม่มีผลิตภัณฑ์'}
                </h3>
                <p className="text-gray-700 mb-6">
                  {searchTerm ? 'ไม่พบผลิตภัณฑ์ที่ตรงกับคำค้นหา' : 'เริ่มต้นด้วยการเพิ่มผลิตภัณฑ์แรกของคุณ'}
                </p>
                {!searchTerm && (
                  <button 
                    onClick={handleCreateProduct}
                    className="btn btn-primary"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    เพิ่มผลิตภัณฑ์
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="card card-hover">
                    <div className="aspect-square bg-gray-200 rounded-t-lg flex items-center justify-center">
                      <SwatchIcon className="h-16 w-16 text-gray-600" />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                          <p className="text-sm text-gray-700">{product.code}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          product.is_published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        {product.brand && <div>Brand: {product.brand}</div>}
                        {product.fabric && <div>Fabric: {product.fabric}</div>}
                        {product.weight_gsm && <div>Weight: {product.weight_gsm} GSM</div>}
                      </div>

                      {/* Variants */}
                      {product.variants && product.variants.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs text-gray-700 mb-1">Colors:</div>
                          <div className="flex flex-wrap gap-1">
                            {product.variants.slice(0, 4).map((variant) => (
                              <div
                                key={variant.id}
                                className="w-4 h-4 rounded-full border border-gray-200"
                                style={{ backgroundColor: variant.color_code || '#gray' }}
                                title={variant.color_name}
                              />
                            ))}
                            {product.variants.length > 4 && (
                              <div className="text-xs text-gray-700">+{product.variants.length - 4}</div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewProduct(product)}
                            className="p-1 text-gray-600 hover:text-gray-600 hover:bg-gray-100 rounded"
                            title="ดูรายละเอียด"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-1 text-gray-600 hover:text-gray-600 hover:bg-gray-100 rounded"
                            title="แก้ไข"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                            title="ลบ"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => handleViewProduct(product)}
                          className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          จัดการ
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Assets Grid - ยังเป็น placeholder */}
            <div className="text-center py-12">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีไฟล์</h3>
              <p className="text-gray-700 mb-6">
                อัปโหลดภาพหรือไฟล์สำหรับใช้ในการออกแบบ
              </p>
              <button className="btn btn-primary">
                <PlusIcon className="h-5 w-5 mr-2" />
                อัปโหลดไฟล์
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        onEdit={handleEditProductFromDetail}
      />

      {/* Create/Edit Product Modals */}
      <CreateEditProductModal
        product={null}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveProduct}
      />

      <CreateEditProductModal
        product={editingProduct}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingProduct(null)
        }}
        onSave={handleSaveProduct}
      />
    </div>
  )
}