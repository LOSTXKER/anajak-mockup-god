// src/components/projects/ProjectCard.tsx
'use client'

import { Project } from '@/types'
import { EyeIcon, PencilIcon, TrashIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

interface ProjectCardProps {
  project: Project
  onView: (project: Project) => void
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

export default function ProjectCard({ project, onView, onEdit, onDelete }: ProjectCardProps) {
  const getStatusBadge = (status: Project['status']) => {
    const badges = {
      brief: 'status-draft',
      design: 'status-design', 
      client_approved: 'status-approved',
      handoff_erp: 'status-locked'
    }
    
    const labels = {
      brief: 'รับบรีฟ',
      design: 'กำลังออกแบบ',
      client_approved: 'ลูกค้าอนุมัติ',
      handoff_erp: 'ส่งมอบ ERP'
    }

    return (
      <span className={`status-badge ${badges[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="card hover-lift cursor-pointer group">
      {/* Gradient accent bar */}
      <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <p className="text-sm font-mono text-gray-500 truncate">{project.code}</p>
              <div className="h-1 w-1 rounded-full bg-gray-300"></div>
              <span className="text-xs text-gray-400 capitalize">{project.client_code}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {project.name}
            </h3>
          </div>
          {getStatusBadge(project.status)}
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <UserIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="text-gray-500">ลูกค้า:</span>
            <span className="font-medium ml-1 truncate">{project.client_name}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="text-gray-500">อัปเดต:</span>
            <span className="ml-1">{format(new Date(project.updated_at), 'dd/MM/yyyy')}</span>
          </div>

          {project.notes && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {project.notes}
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
              title="แก้ไข"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project);
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
              title="ลบ"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
          
          <button
            onClick={() => onView(project)}
            className="btn btn-primary btn-sm btn-hover group/btn"
          >
            <EyeIcon className="h-4 w-4 mr-1 group-hover/btn:scale-110 transition-transform" />
            ดู Mockups
          </button>
        </div>
      </div>
    </div>
  )
}