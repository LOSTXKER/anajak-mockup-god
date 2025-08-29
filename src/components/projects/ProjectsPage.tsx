// src/components/projects/ProjectsPage.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAppStore } from '@/store'
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Project } from '@/types'
import ProjectCard from './ProjectCard'
import CreateProjectModal from './CreateProjectModal'
import MockupsPage from '@/components/mockups/MockupsPage'
import { ProjectCardSkeleton } from '@/components/ui/LoadingSpinner'

export default function ProjectsPage() {
  const { user, setProjects, projects, setLoading, isLoading } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    // Filter projects based on search term
    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.code.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredProjects(filtered)
  }, [projects, searchTerm])

  const fetchProjects = async () => {
    if (!user?.org_id) return

    setLoading(true, 'กำลังโหลดโปรเจกต์...')
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('org_id', user.org_id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (projectData: any) => {
    if (!user?.org_id) return

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          org_id: user.org_id
        })
        .select()
        .single()

      if (error) throw error

      // Add new project to state
      setProjects([data, ...projects])
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  // If a project is selected, show the MockupsPage
  if (selectedProject) {
    return (
      <MockupsPage
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">โปรเจกต์</h2>
            <p className="text-sm text-gray-500 mt-1">
              จัดการโปรเจกต์และ mockup ทั้งหมดของคุณ
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="search"
                placeholder="ค้นหาโปรเจกต์..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Create Project Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary btn-hover whitespace-nowrap"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">สร้างโปรเจกต์ใหม่</span>
              <span className="sm:hidden">สร้างใหม่</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div>
            <p className="text-sm text-gray-600">
              แสดง <span className="font-semibold text-gray-800">{filteredProjects.length}</span> โปรเจกต์จากทั้งหมด <span className="font-semibold text-gray-800">{projects.length}</span> โปรเจกต์
            </p>
          </div>
          <div>
            <select className="form-input text-sm min-w-0">
              <option>เรียงตาม: อัปเดตล่าสุด</option>
              <option>เรียงตาม: วันที่สร้าง</option>
              <option>เรียงตาม: ชื่อโปรเจกต์</option>
              <option>เรียงตาม: สถานะ</option>
            </select>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProjectCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 text-gray-400 mb-6">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {searchTerm ? 'ไม่พบโปรเจกต์' : 'ยังไม่มีโปรเจกต์'}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {searchTerm ? 'ไม่พบโปรเจกต์ที่ตรงกับคำค้นหา ลองเปลี่ยนคำค้นหาใหม่' : 'เริ่มต้นการจัดการโปรเจกต์ด้วยการสร้างโปรเจกต์แรกของคุณ'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-primary inline-flex items-center px-6 py-3 text-base"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                สร้างโปรเจกต์ใหม่
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
            {filteredProjects.map((project, index) => (
              <div 
                key={project.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ProjectCard
                  project={project}
                  onView={(project) => setSelectedProject(project)}
                  onEdit={(project) => {
                    // TODO: Open edit modal
                    console.log('Edit project:', project)
                  }}
                  onDelete={(project) => {
                    // TODO: Open delete confirmation
                    console.log('Delete project:', project)
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  )
}