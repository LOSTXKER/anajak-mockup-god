// src/components/layout/DashboardLayout.tsx
'use client'

import { useAppStore } from '@/store'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { 
  FolderIcon, 
  BookOpenIcon, 
  ArrowDownTrayIcon, 
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline'

// Import page components
import LibraryPage from '@/components/library/LibraryPage'
import ExportsPage from '@/components/exports/ExportsPage'
import SettingsPage from '@/components/settings/SettingsPage'

const navigation = [
  { name: 'โปรเจกต์', href: 'projects', icon: FolderIcon, current: true },
  { name: 'ห้องสมุด', href: 'library', icon: BookOpenIcon, current: false },
  { name: 'ส่งออก', href: 'exports', icon: ArrowDownTrayIcon, current: false },
  { name: 'ตั้งค่า', href: 'settings', icon: CogIcon, current: false },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, sidebarCollapsed, setSidebarCollapsed, currentPage, setCurrentPage } = useAppStore()
  const { toasts, removeToast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState([])
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleNavigationClick = (item: typeof navigation[0]) => {
    setCurrentPage(item.href)
    setMobileMenuOpen(false)
  }

  // Function to render the current page content
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'library':
        return <LibraryPage />
      case 'exports':
        return <ExportsPage />
      case 'settings':
        return <SettingsPage />
      case 'projects':
      default:
        return children
    }
  }

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} overflow-hidden transition-colors duration-200`}>
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between p-4">
              <h1 className="text-xl font-bold text-gray-900">Anajak Mockup</h1>
              <button onClick={() => setMobileMenuOpen(false)}>
                <XMarkIcon className="h-6 w-6 text-gray-400" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigationClick(item)}
                  className={`
                    group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium
                    ${currentPage === item.href
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon className="mr-3 h-6 w-6" />
                  {item.name}
                </button>
              ))}
            </nav>
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.name || user?.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                     user?.role === 'designer' ? 'นักออกแบบ' : 
                     user?.role === 'reviewer' ? 'ผู้ตรวจสอบ' : 'ลูกค้า'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="mt-4 flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} hidden lg:flex lg:flex-col lg:flex-shrink-0 transition-all duration-300`}>
        <div className={`flex flex-col flex-grow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg border-r transition-colors duration-200`}>
          {/* Header with logo and controls */}
          <div className="flex items-center justify-between flex-shrink-0 px-4 py-6">
            <div className="flex items-center">
              {!sidebarCollapsed && (
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">A</span>
                  </div>
                  <div className="ml-3">
                    <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Anajak</h1>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Mockup System</p>
                  </div>
                </div>
              )}
              {sidebarCollapsed && (
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
              )}
            </div>
            
            {/* Collapse button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} ${sidebarCollapsed ? 'mx-auto' : ''}`}
              title={sidebarCollapsed ? 'ขยายแถบด้านข้าง' : 'ย่อแถบด้านข้าง'}
            >
              {sidebarCollapsed ? (
                <ChevronDoubleRightIcon className="h-5 w-5" />
              ) : (
                <ChevronDoubleLeftIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          <nav className="flex-1 flex flex-col px-3 pb-4 space-y-2">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigationClick(item)}
                className={`
                  group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden
                  ${currentPage === item.href 
                    ? `${darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border border-blue-200'}` 
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
                  }
                `}
                title={sidebarCollapsed ? item.name : undefined}
              >
                {/* Active indicator */}
                {currentPage === item.href && !sidebarCollapsed && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"></div>
                )}
                
                <item.icon className={`${sidebarCollapsed ? 'h-6 w-6 mx-auto' : 'mr-3 h-5 w-5'} flex-shrink-0 transition-transform group-hover:scale-110`} />
                {!sidebarCollapsed && (
                  <span className="transition-all duration-200">{item.name}</span>
                )}

                {/* Hover effect */}
                {currentPage !== item.href && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl"></div>
                )}
              </button>
            ))}
          </nav>

          <div className={`flex-shrink-0 p-4 border-t border-gray-200 ${sidebarCollapsed ? 'px-2' : ''}`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                <UserIcon className="h-6 w-6 text-gray-600" />
              </div>
              {!sidebarCollapsed && (
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || user?.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                     user?.role === 'designer' ? 'นักออกแบบ' : 
                     user?.role === 'reviewer' ? 'ผู้ตรวจสอบ' : 'ลูกค้า'}
                  </div>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <button
                onClick={handleSignOut}
                className="mt-3 flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                ออกจากระบบ
              </button>
            )}
            
            {sidebarCollapsed && (
              <button
                onClick={handleSignOut}
                className="mt-3 p-2 rounded-md text-gray-600 hover:bg-gray-100 w-full flex justify-center"
                title="ออกจากระบบ"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b transition-colors duration-200`}>
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'} transition-colors`}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className={`ml-3 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Anajak Mockup
              </h1>
            </div>

            {/* Desktop header info */}
            <div className="hidden lg:flex items-center">
              <div>
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} capitalize`}>
                  {currentPage === 'projects' ? 'โปรเจกต์' :
                   currentPage === 'library' ? 'ห้องสมุด' :
                   currentPage === 'exports' ? 'ส่งออก' :
                   currentPage === 'settings' ? 'ตั้งค่า' : 'หน้าหลัก'}
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {new Date().toLocaleDateString('th-TH', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-2">
              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
                title={darkMode ? 'เปิดโหมดสว่าง' : 'เปิดโหมดมืด'}
              >
                {darkMode ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>

              {/* Notifications */}
              <button
                className={`p-2 rounded-lg transition-colors relative ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
                title="การแจ้งเตือน"
              >
                <BellIcon className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* User menu */}
              <div className={`hidden sm:flex items-center space-x-3 pl-3 border-l ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {(user?.name || user?.email || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user?.name || user?.email}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user?.role === 'admin' ? 'ผู้ดูแลระบบ' :
                     user?.role === 'designer' ? 'นักออกแบบ' :
                     user?.role === 'reviewer' ? 'ผู้ตรวจสอบ' : 'ลูกค้า'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop toggle button */}
        <div className="hidden lg:block absolute top-6 left-3 z-10">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-white shadow-sm"
          >
            {sidebarCollapsed ? (
              <Bars3Icon className="h-5 w-5" />
            ) : (
              <XMarkIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Main content */}
        <main className={`flex-1 overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
          <div className="h-full animate-fadeIn">
            {renderCurrentPage()}
          </div>
        </main>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}