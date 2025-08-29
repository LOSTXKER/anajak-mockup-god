// src/components/exports/ExportsPage.tsx
'use client'

import { useState } from 'react'
import { 
  ArrowDownTrayIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  BuildingOfficeIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ExportsPage() {
  const [activeTab, setActiveTab] = useState<'exports' | 'handoffs'>('exports')
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const tabs = [
    { id: 'exports', name: 'Batch Exports', icon: DocumentArrowDownIcon, count: 15 },
    { id: 'handoffs', name: 'ERP Handoffs', icon: BuildingOfficeIcon, count: 8 }
  ]

  const handleCreateExport = async () => {
    setIsCreating(true)
    try {
      // Simulate export creation
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('สร้าง Export สำเร็จ', 'งาน Export ใหม่ถูกเพิ่มในคิว')
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถสร้าง Export ได้')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDownload = (jobId: string) => {
    toast.info('กำลังเตรียมไฟล์', 'กำลังสร้างลิงก์ดาวน์โหลด...')
    setTimeout(() => {
      toast.success('พร้อมดาวน์โหลด', 'ไฟล์พร้อมให้ดาวน์โหลดแล้ว')
    }, 1500)
  }

  const handleRetry = (jobId: string) => {
    toast.info('กำลังลองใหม่', 'เริ่มประมวลผลงานใหม่อีกครั้ง')
  }

  // Sample data
  const exportJobs = [
    {
      id: '1',
      projectName: 'เสื้อทีมงาน Event',
      mockupName: 'เสื้อ Staff คอกลม สีดำ',
      status: 'completed' as const,
      progress: 100,
      filesCount: 24,
      createdAt: '2024-12-28 14:30',
      downloadUrl: '#'
    },
    {
      id: '2',
      projectName: 'เสื้อ Staff วิ่งมาราธอน',
      mockupName: 'เสื้อกีฬา DryFit',
      status: 'processing' as const,
      progress: 45,
      filesCount: 18,
      createdAt: '2024-12-28 15:15',
      downloadUrl: null
    },
    {
      id: '3',
      projectName: 'เสื้อ Corporate SCG',
      mockupName: 'เสื้อโปโล Premium',
      status: 'failed' as const,
      progress: 0,
      filesCount: 0,
      createdAt: '2024-12-28 13:45',
      downloadUrl: null
    }
  ]

  const handoffJobs = [
    {
      id: '1',
      projectCode: 'ANJ-24-0078',
      mockupName: 'เสื้อ Staff คอกลม',
      status: 'success' as const,
      erpRef: 'SO-2024-001234',
      createdAt: '2024-12-28 10:30',
      response: 'Order created successfully'
    },
    {
      id: '2',
      projectCode: 'ANJ-24-0079',
      mockupName: 'เสื้อกีฬา DryFit',
      status: 'pending' as const,
      erpRef: null,
      createdAt: '2024-12-28 15:00',
      response: null
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'processing':
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    const statusMap = {
      completed: 'เสร็จสิ้น',
      processing: 'กำลังประมวลผล',
      failed: 'ล้มเหลว',
      success: 'สำเร็จ',
      pending: 'รอดำเนินการ'
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800">ส่งออก</h2>
          
          <button 
            onClick={handleCreateExport}
            className="btn btn-primary"
            disabled={isCreating}
          >
            {isCreating ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            )}
            {isCreating ? 'กำลังสร้าง...' : 'Export ใหม่'}
          </button>
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
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                activeTab === tab.id
                  ? 'bg-brand-200 text-brand-800'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {activeTab === 'exports' ? (
          <div className="space-y-4">
            {exportJobs.map((job) => (
              <div key={job.id} className="card">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        {getStatusIcon(job.status)}
                        <div className="ml-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {job.projectName}
                          </h3>
                          <p className="text-sm text-gray-600">{job.mockupName}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                        <span>{job.filesCount} ไฟล์</span>
                        <span>{job.createdAt}</span>
                        <span className={`font-medium ${
                          job.status === 'completed' ? 'text-green-600' :
                          job.status === 'processing' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {getStatusText(job.status)}
                        </span>
                      </div>

                      {job.status === 'processing' && (
                        <div className="mt-3">
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{job.progress}% เสร็จสิ้น</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="btn btn-ghost btn-sm">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        ดูรายละเอียด
                      </button>
                      {job.status === 'completed' && job.downloadUrl && (
                        <button 
                          onClick={() => handleDownload(job.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                          ดาวน์โหลด
                        </button>
                      )}
                      {job.status === 'failed' && (
                        <button 
                          onClick={() => handleRetry(job.id)}
                          className="btn btn-ghost btn-sm"
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          ลองใหม่
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {handoffJobs.map((job) => (
              <div key={job.id} className="card">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        {getStatusIcon(job.status)}
                        <div className="ml-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {job.projectCode}
                          </h3>
                          <p className="text-sm text-gray-600">{job.mockupName}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                        <span>{job.createdAt}</span>
                        {job.erpRef && (
                          <span className="text-blue-600 font-medium">ERP: {job.erpRef}</span>
                        )}
                        <span className={`font-medium ${
                          job.status === 'success' ? 'text-green-600' :
                          job.status === 'pending' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {getStatusText(job.status)}
                        </span>
                      </div>

                      {job.response && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">{job.response}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="btn btn-ghost btn-sm">
                        ดูรายละเอียด
                      </button>
                      {job.status === 'success' && (
                        <button className="btn btn-secondary btn-sm">
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          ส่งใหม่
                        </button>
                      )}
                    </div>
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