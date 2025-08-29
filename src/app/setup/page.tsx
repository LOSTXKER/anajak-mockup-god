// src/app/setup/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store'

interface Organization {
  id: string
  name: string
  created_at: string
}

export default function SetupPage() {
  const [formData, setFormData] = useState({
    name: '',
    org_id: '',
    role: 'designer' as 'admin' | 'designer' | 'reviewer' | 'client'
  })
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const { setUser } = useAppStore()

  useEffect(() => {
    checkUserAndLoadData()
  }, [])

  const checkUserAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Error checking profile:', profileError)
      }

      if (profile && (profile as any).org_id) {
        setUser(profile as any)
        router.push('/')
        return
      }

      setFormData(prev => ({
        ...prev,
        name: session.user.user_metadata?.name || session.user.email || ''
      }))

      await loadOrganizations()

    } catch (error) {
      console.error('Error checking user:', error)
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setIsLoadingOrgs(false)
    }
  }

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('orgs')
        .select('*')
        .order('name')

      if (error) throw error
      setOrgs(data || [])
    } catch (error) {
      console.error('Error loading organizations:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        throw new Error('ไม่พบข้อมูลผู้ใช้')
      }

      const userData = {
        id: session.user.id,
        email: session.user.email!,
        name: formData.name,
        org_id: formData.org_id,
        role: formData.role
      }

      const { data, error } = await supabase
        .from('users')
        .upsert(userData as any)
        .select()
        .single()

      if (error) throw error

      setUser(data as any)
      router.push('/')

    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingOrgs) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg mb-6">
            <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">กำลังโหลดข้อมูล</h3>
          <p className="text-gray-600">กรุณารอสักครู่...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg mb-6">
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            ตั้งค่าโปรไฟล์
          </h2>
          <p className="text-gray-600">
            กรอกข้อมูลเพื่อเริ่มใช้งาน <span className="font-semibold text-blue-600">Anajak Mockup System</span>
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 bg-gray-50 focus:bg-white"
                  placeholder="กรอกชื่อ-นามสกุลของคุณ"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              {/* Organization Field */}
              <div>
                <label htmlFor="org_id" className="block text-sm font-medium text-gray-700 mb-2">
                  องค์กร *
                </label>
                <select
                  id="org_id"
                  name="org_id"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 bg-gray-50 focus:bg-white"
                  value={formData.org_id}
                  onChange={handleChange}
                >
                  <option value="">เลือกองค์กรของคุณ</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Field */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  บทบาท *
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 bg-gray-50 focus:bg-white"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="designer">นักออกแบบ</option>
                  <option value="reviewer">ผู้ตรวจสอบ</option>
                  <option value="admin">ผู้ดูแลระบบ</option>
                  <option value="client">ลูกค้า</option>
                </select>
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังบันทึก...
                </div>
              ) : (
                'เข้าใช้งานระบบ'
              )}
            </button>
          </form>
        </div>

        {/* Steps indicator */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}