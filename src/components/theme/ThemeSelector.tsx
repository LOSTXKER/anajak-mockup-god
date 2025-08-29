// src/components/theme/ThemeSelector.tsx
'use client'

import { useTheme } from './ThemeProvider'
import { SwatchIcon } from '@heroicons/react/24/outline'

const themes = [
  {
    id: 'blue' as const,
    name: 'Blue Ocean',
    primary: 'bg-blue-500',
    accent: 'bg-green-500',
    description: 'เย็นสบาย เหมาะสำหรับงานทั่วไป'
  },
  {
    id: 'orange' as const,
    name: 'Sunset Orange',
    primary: 'bg-orange-500',
    accent: 'bg-teal-500',
    description: 'อบอุ่น เหมาะสำหรับงานสร้างสรรค์'
  },
  {
    id: 'purple' as const,
    name: 'Royal Purple',
    primary: 'bg-purple-500',
    accent: 'bg-pink-500',
    description: 'หรูหรา เหมาะสำหรับงานพรีเมียม'
  }
]

interface ThemeSelectorProps {
  className?: string
}

export default function ThemeSelector({ className = '' }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme()

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <SwatchIcon className="w-5 h-5 text-secondary" />
        <span className="font-medium text-primary">เลือกธีมสี</span>
      </div>
      
      <div className="grid gap-3">
        {themes.map((themeOption) => (
          <button
            key={themeOption.id}
            onClick={() => setTheme(themeOption.id)}
            className={`
              flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 text-left
              ${theme === themeOption.id 
                ? 'border-primary bg-primary/5' 
                : 'border-theme hover:border-primary/50 bg-secondary'
              }
            `}
          >
            <div className="flex gap-2">
              <div className={`w-4 h-4 rounded-full ${themeOption.primary}`} />
              <div className={`w-4 h-4 rounded-full ${themeOption.accent}`} />
            </div>
            
            <div className="flex-1">
              <div className="font-medium text-primary text-sm">
                {themeOption.name}
              </div>
              <div className="text-xs text-tertiary mt-0.5">
                {themeOption.description}
              </div>
            </div>
            
            {theme === themeOption.id && (
              <div className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-secondary rounded-lg">
        <div className="text-xs text-tertiary">
          💡 ธีมจะถูกบันทึกอัตโนมัติและใช้ทั่วทั้งแอป
        </div>
      </div>
    </div>
  )
}