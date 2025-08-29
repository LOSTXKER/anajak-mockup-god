// src/components/settings/SettingsPage.tsx
'use client'

import { useState } from 'react'
import { useAppStore } from '@/store'
import { 
  UserIcon,
  BuildingOfficeIcon,
  LinkIcon,
  BellIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const { user } = useAppStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'integrations' | 'notifications'>('profile')

  const tabs = [
    { id: 'profile', name: 'โปรไฟล์', icon: UserIcon },
    { id: 'organization', name: 'องค์กร', icon: BuildingOfficeIcon },
    { id: 'integrations', name: 'การเชื่อมต่อ', icon: LinkIcon },
    { id: 'notifications', name: 'การแจ้งเตือน', icon: BellIcon }
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-2xl font-semibold text-gray-800">ตั้งค่า</h2>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <nav className="mt-5 px-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  activeTab === tab.id
                    ? 'bg-brand-100 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon className="mr-3 h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-4xl mx-auto py-6 px-6">
            
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="card">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">ข้อมูลส่วนตัว</h3>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center space-x-6 mb-6">
                      <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                        <UserIcon className="h-10 w-10 text-gray-600" />
                      </div>
                      <div>
                        <button className="btn btn-secondary btn-sm">
                          เปลี่ยนรูปโปรไฟล์
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="form-label">ชื่อ-นามสกุล</label>
                        <input
                          type="text"
                          className="form-input"
                          defaultValue={user?.name || ''}
                        />
                      </div>
                      <div>
                        <label className="form-label">อีเมล</label>
                        <input
                          type="email"
                          className="form-input"
                          defaultValue={user?.email || ''}
                          disabled
                        />
                      </div>
                      <div>
                        <label className="form-label">บทบาท</label>
                        <input
                          type="text"
                          className="form-input"
                          value={
                            user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                            user?.role === 'designer' ? 'นักออกแบบ' : 
                            user?.role === 'reviewer' ? 'ผู้ตรวจสอบ' : 'ลูกค้า'
                          }
                          disabled
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button className="btn btn-primary">
                        บันทึกการเปลี่ยนแปลง
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">เปลี่ยนรหัสผ่าน</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="form-label">รหัสผ่านปัจจุบัน</label>
                        <input type="password" className="form-input" />
                      </div>
                      <div></div>
                      <div>
                        <label className="form-label">รหัสผ่านใหม่</label>
                        <input type="password" className="form-input" />
                      </div>
                      <div>
                        <label className="form-label">ยืนยันรหัสผ่านใหม่</label>
                        <input type="password" className="form-input" />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button className="btn btn-primary">
                        เปลี่ยนรหัสผ่าน
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Organization Tab */}
            {activeTab === 'organization' && (
              <div className="space-y-6">
                <div className="card">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">ข้อมูลองค์กร</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="form-label">ชื่อองค์กร</label>
                        <input
                          type="text"
                          className="form-input"
                          defaultValue="Anajak T-Shirt Factory"
                        />
                      </div>
                      <div>
                        <label className="form-label">เว็บไซต์</label>
                        <input
                          type="url"
                          className="form-input"
                          placeholder="https://www.example.com"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="form-label">ที่อยู่</label>
                        <textarea
                          rows={3}
                          className="form-input"
                          placeholder="ที่อยู่องค์กร"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button className="btn btn-primary">
                        บันทึกข้อมูล
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div className="card">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">ERP Integration</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="form-label">API Endpoint</label>
                        <input
                          type="url"
                          className="form-input"
                          placeholder="https://erp.company.com/api/mockup"
                        />
                      </div>
                      <div>
                        <label className="form-label">API Key</label>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="••••••••••••••••"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="form-label">Webhook URL (Optional)</label>
                        <input
                          type="url"
                          className="form-input"
                          placeholder="https://erp.company.com/webhook/mockup-updates"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center">
                        <ShieldCheckIcon className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm text-green-600">Connection Active</span>
                      </div>
                      <div className="space-x-3">
                        <button className="btn btn-secondary">
                          ทดสอบการเชื่อมต่อ
                        </button>
                        <button className="btn btn-primary">
                          บันทึกการตั้งค่า
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="card">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">การแจ้งเตือน</h3>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">อีเมลแจ้งเตือน</h4>
                        <p className="text-sm text-gray-500">รับแจ้งเตือนเมื่อมีการอัปเดต</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">การอนุมัติ Mockup</h4>
                        <p className="text-sm text-gray-500">แจ้งเตือนเมื่อ Mockup ได้รับการอนุมัติ</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Export เสร็จสิ้น</h4>
                        <p className="text-sm text-gray-500">แจ้งเตือนเมื่อ Export เสร็จสิ้น</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button className="btn btn-primary">
                        บันทึกการตั้งค่า
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}