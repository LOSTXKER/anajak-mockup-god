// src/components/mockups/MockupsPage.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { createClient } from '@/lib/supabase'
import { ArrowLeftIcon, PlusIcon, EyeIcon, PencilIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { Mockup, Project } from '@/types'
import { useToast } from '@/components/ui/Toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import dynamic from 'next/dynamic'

// Dynamic import เพื่อป้องกัน SSR issues กับ Konva
const EditorPage = dynamic(() => import('@/components/editor/EditorPage'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-400 animate-ping opacity-30"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">กำลังโหลด Canvas Editor...</p>
        <p className="mt-1 text-sm text-gray-500">กรุณารอสักครู่</p>
      </div>
    </div>
  )
})

interface MockupsPageProps {
  project: Project
  onBack: () => void
}

export default function MockupsPage({ project, onBack }: MockupsPageProps) {
  const { user, setLoading } = useAppStore()
  const { toast } = useToast()
  const [mockups, setMockups] = useState<Mockup[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMockup, setSelectedMockup] = useState<Mockup | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const supabase = createClient()

  // Sample mock data for testing
  const mockData: Mockup[] = [
    {
      id: '1',
      project_id: project.id,
      product_id: undefined,
      variant_id: undefined,
      name: 'เสื้อ Staff คอกลม สีดำ',
      status: 'draft',
      revision: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2', 
      project_id: project.id,
      product_id: undefined,
      variant_id: undefined,
      name: 'เสื้อ Staff คอกลม สีขาว',
      status: 'approved',
      revision: 2,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '3',
      project_id: project.id,
      product_id: undefined,
      variant_id: undefined,
      name: 'เสื้อ Staff คอกลม สีกรม',
      status: 'draft',
      revision: 1,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 172800000).toISOString()
    }
  ]

  useEffect(() => {
    fetchMockups()
  }, [project.id])

  const fetchMockups = async () => {
    if (!project.id) return

    setLoading(true, 'กำลังโหลด Mockups...')
    
    try {
      setMockups(mockData)
    } catch (error) {
      console.error('Error fetching mockups:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: Mockup['status']) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      approved: 'bg-green-100 text-green-800', 
      locked: 'bg-red-100 text-red-800'
    }
    
    const labels = {
      draft: 'Draft',
      approved: 'Approved',
      locked: 'Locked'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const handleCreateMockup = async () => {
    setIsCreating(true)
    try {
      // Create a new mockup
      const newMockup: Mockup = {
        id: Date.now().toString(),
        project_id: project.id,
        product_id: undefined,
        variant_id: undefined,
        name: `Mockup ใหม่ ${mockups.length + 1}`,
        status: 'draft',
        revision: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // In a real app, this would be an API call
      setMockups(prev => [newMockup, ...prev])
      setSelectedMockup(newMockup)
      toast.success('สร้างสำเร็จ', 'Mockup ใหม่ถูกสร้างแล้ว')
    } catch (error) {
      console.error('Error creating mockup:', error)
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถสร้าง Mockup ใหม่ได้')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteMockup = async (mockupId: string) => {
    try {
      // In a real app, this would be an API call
      setMockups(prev => prev.filter(m => m.id !== mockupId))
      toast.success('ลบสำเร็จ', 'Mockup ถูกลบแล้ว')
    } catch (error) {
      console.error('Error deleting mockup:', error)
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถลบ Mockup ได้')
    }
  }

  const filteredMockups = mockups.filter(mockup =>
    mockup.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // If a mockup is selected for editing, show the Editor
  if (selectedMockup) {
    return (
      <EditorPage
        project={project}
        mockup={selectedMockup}
        onBack={() => setSelectedMockup(null)}
      />
    )
  }

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
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">{project.name}</h2>
            <p className="text-sm text-gray-500">{project.code}</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="relative">
            <input
              type="search"
              placeholder="ค้นหา Mockups..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <button className="btn btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            สร้าง Mockup ใหม่
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {filteredMockups.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มี Mockups</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'ไม่พบ Mockup ที่ตรงกับคำค้นหา' : 'เริ่มต้นด้วยการสร้าง Mockup แรกของโปรเจกต์นี้'}
            </p>
            {!searchTerm && (
              <button 
                onClick={() => handleCreateMockup()}
                className="btn btn-primary"
                disabled={isCreating}
              >
                {isCreating ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <PlusIcon className="h-5 w-5 mr-2" />
                )}
                {isCreating ? 'กำลังสร้าง...' : 'สร้าง Mockup ใหม่'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMockups.map((mockup) => (
              <div key={mockup.id} className="card card-hover">
                {/* Preview Image */}
                <div className="aspect-square bg-gray-200 rounded-t-lg flex items-center justify-center">
                  <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">{mockup.name}</h3>
                    {getStatusBadge(mockup.status)}
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-3">
                    v{mockup.revision} • {format(new Date(mockup.updated_at), 'dd/MM/yyyy')}
                  </p>

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="ดูตัวอย่าง"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="แก้ไข"
                        onClick={() => setSelectedMockup(mockup)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="ลบ"
                        onClick={() => {
                          if (confirm(`ต้องการลบ "${mockup.name}" หรือไม่?`)) {
                            handleDeleteMockup(mockup.id)
                          }
                        }}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => setSelectedMockup(mockup)}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      แก้ไข
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}