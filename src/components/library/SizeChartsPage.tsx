// src/components/library/SizeChartsPage.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAppStore } from '@/store'
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowLeftIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'
import { SizeChart, SizeRow } from '@/types'
import SizeChartDetailModal from './SizeChartDetailModal'
import CreateEditSizeChartModal from './CreateEditSizeChartModal'

interface SizeChartsPageProps {
  onBack: () => void
}

export default function SizeChartsPage({ onBack }: SizeChartsPageProps) {
  const { user, setLoading } = useAppStore()
  const { toast } = useToast()
  const [sizeCharts, setSizeCharts] = useState<SizeChart[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSizeChart, setSelectedSizeChart] = useState<SizeChart | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingSizeChart, setEditingSizeChart] = useState<SizeChart | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchSizeCharts()
  }, [user?.org_id])

  const fetchSizeCharts = async () => {
    if (!user?.org_id) return

    setLoading(true, 'กำลังโหลด Size Charts...')
    
    try {
      const { data, error } = await supabase
        .from('size_charts')
        .select(`
          *,
          sizes:size_rows(*)
        `)
        .eq('org_id', user.org_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSizeCharts(data || [])
    } catch (error) {
      console.error('Error fetching size charts:', error)
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถโหลด Size Charts ได้')
    } finally {
      setLoading(false)
    }
  }

  const handleViewSizeChart = (sizeChart: SizeChart) => {
    setSelectedSizeChart(sizeChart)
    setIsDetailModalOpen(true)
  }

  const handleCreateSizeChart = () => {
    setIsCreateModalOpen(true)
  }

  const handleEditSizeChart = (sizeChart: SizeChart) => {
    setEditingSizeChart(sizeChart)
    setIsEditModalOpen(true)
  }

  const handleEditSizeChartFromDetail = () => {
    setIsDetailModalOpen(false)
    if (selectedSizeChart) {
      setEditingSizeChart(selectedSizeChart)
      setIsEditModalOpen(true)
    }
  }

  const handleSaveSizeChart = async (savedSizeChart: SizeChart) => {
    if (editingSizeChart) {
      // Update existing size chart in list
      setSizeCharts(sizeCharts.map(sc => sc.id === savedSizeChart.id ? savedSizeChart : sc))
      setIsEditModalOpen(false)
      setEditingSizeChart(null)
    } else {
      // Add new size chart to list
      setSizeCharts([savedSizeChart, ...sizeCharts])
      setIsCreateModalOpen(false)
    }
    
    // Refresh size charts to get latest data
    fetchSizeCharts()
  }

  const handleDeleteSizeChart = async (sizeChart: SizeChart) => {
    if (!confirm(`คุณต้องการลบ Size Chart "${sizeChart.name}" หรือไม่?`)) return

    try {
      const { error } = await supabase
        .from('size_charts')
        .delete()
        .eq('id', sizeChart.id)

      if (error) throw error

      setSizeCharts(sizeCharts.filter(sc => sc.id !== sizeChart.id))
      toast.success('ลบสำเร็จ', 'Size Chart ถูกลบแล้ว')
    } catch (error) {
      console.error('Error deleting size chart:', error)
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถลบ Size Chart ได้')
    }
  }

  const filteredSizeCharts = sizeCharts.filter(sizeChart =>
    sizeChart.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sizeChart.base_size.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center mb-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 mr-4"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
              <TableCellsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Size Charts</h2>
              <p className="text-sm text-gray-500">จัดการตารางไซส์สำหรับผลิตภัณฑ์</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder="ค้นหา Size Charts..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={handleCreateSizeChart}
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            สร้าง Size Chart ใหม่
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{sizeCharts.length}</div>
            <div className="text-sm text-gray-500">Total Size Charts</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {sizeCharts.reduce((sum, sc) => sum + (sc.sizes?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Total Sizes</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(sizeCharts.map(sc => sc.base_size)).size}
            </div>
            <div className="text-sm text-gray-500">Base Sizes</div>
          </div>
        </div>

        {/* Size Charts Grid */}
        {filteredSizeCharts.length === 0 ? (
          <div className="text-center py-12">
            <TableCellsIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'ไม่พบ Size Charts' : 'ยังไม่มี Size Charts'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'ไม่พบ Size Chart ที่ตรงกับคำค้นหา' : 'เริ่มต้นด้วยการสร้าง Size Chart แรกของคุณ'}
            </p>
            {!searchTerm && (
              <button 
                onClick={handleCreateSizeChart}
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                สร้าง Size Chart ใหม่
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSizeCharts.map((sizeChart) => (
              <div key={sizeChart.id} className="card card-hover">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{sizeChart.name}</h3>
                      <p className="text-sm text-gray-500">Base Size: {sizeChart.base_size}</p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    <div>Sizes: {sizeChart.sizes?.length || 0}</div>
                    <div>Created: {new Date(sizeChart.created_at).toLocaleDateString('th-TH')}</div>
                  </div>

                  {/* Size Preview */}
                  {sizeChart.sizes && sizeChart.sizes.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 mb-2">Sizes:</div>
                      <div className="flex flex-wrap gap-1">
                        {sizeChart.sizes.slice(0, 6).map((size) => (
                          <span
                            key={size.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {size.size}
                          </span>
                        ))}
                        {sizeChart.sizes.length > 6 && (
                          <span className="text-xs text-gray-500">+{sizeChart.sizes.length - 6}</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewSizeChart(sizeChart)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="ดูรายละเอียด"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditSizeChart(sizeChart)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="แก้ไข"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSizeChart(sizeChart)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="ลบ"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => handleViewSizeChart(sizeChart)}
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
      </main>

      {/* Size Chart Detail Modal */}
      <SizeChartDetailModal
        sizeChart={selectedSizeChart}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedSizeChart(null)
        }}
        onEdit={handleEditSizeChartFromDetail}
      />

      {/* Create/Edit Size Chart Modals */}
      <CreateEditSizeChartModal
        sizeChart={null}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveSizeChart}
      />

      <CreateEditSizeChartModal
        sizeChart={editingSizeChart}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingSizeChart(null)
        }}
        onSave={handleSaveSizeChart}
      />
    </div>
  )
}