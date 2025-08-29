// src/app/page.tsx
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProjectsPage from '@/components/projects/ProjectsPage'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { User } from '@/types'

export default function HomePage() {
  const supabase = createClient()
  const router = useRouter()
  const { user, isAuthenticated, setLoading, setUser } = useAppStore()

  useEffect(() => {
    console.log('🔄 Starting auth check...')
    const checkAuth = async () => {
      setLoading(true, 'กำลังตรวจสอบการเข้าสู่ระบบ...')
      
      try {
        console.log('📡 Getting session...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('📝 Session result:', session?.user?.email || 'No session')
        
        if (!session?.user) {
          console.log('❌ No session, redirecting to login')
          router.push('/login')
          return
        }

        console.log('👤 Checking user profile...')
        // ตรวจสอบว่าผู้ใช้มีข้อมูลใน users table หรือไม่
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        console.log('📋 Profile result:', profile ? `Found: ${(profile as User).name || (profile as User).email}` : 'No profile')
        
        if (profileError) {
          console.log('⚠️ Profile error:', profileError.message)
        }

        if (!profile) {
          console.log('⚠️ No profile, redirecting to setup')
          router.push('/setup')
          return
        }

        // Set user in store
        const userProfile = profile as User
        setUser(userProfile)
        console.log('✅ Auth check completed successfully for:', userProfile.email)
        
      } catch (error) {
        console.error('💥 Auth check error:', error)
        router.push('/login')
      } finally {
        console.log('🏁 Setting loading to false')
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase, setLoading, setUser])

  console.log('🎯 Current state - isAuthenticated:', isAuthenticated, 'user:', user?.email || 'no user')

  if (!isAuthenticated) {
    console.log('🔴 Not authenticated, showing loading screen')
    return (
      <LoadingSpinner 
        size="xl" 
        message="กำลังตรวจสอบการเข้าสู่ระบบ..."
        fullScreen 
      />
    )
  }

  console.log('🟢 Authenticated, rendering dashboard')

  return (
    <DashboardLayout>
      <ProjectsPage />
    </DashboardLayout>
  )
}