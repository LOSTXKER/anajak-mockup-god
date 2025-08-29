// src/components/ui/LoadingSpinner.tsx
'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'white' | 'gray'
  message?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

const colorClasses = {
  primary: 'text-blue-600',
  white: 'text-white',
  gray: 'text-gray-400'
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary', 
  message,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center">
      {/* Modern Spinner */}
      <div className="relative">
        <div className={`${sizeClasses[size]} animate-spin`}>
          <div className={`absolute inset-0 rounded-full border-2 border-transparent border-t-current ${colorClasses[color]} opacity-75`}></div>
          <div className={`absolute inset-1 rounded-full border-2 border-transparent border-t-current ${colorClasses[color]} opacity-50 animate-spin`} style={{ animationDuration: '0.8s', animationDirection: 'reverse' }}></div>
        </div>
        
        {/* Pulse effect */}
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full ${color === 'primary' ? 'bg-blue-600' : color === 'white' ? 'bg-white' : 'bg-gray-400'} opacity-20 animate-ping`}></div>
      </div>
      
      {message && (
        <p className={`mt-3 text-sm font-medium ${color === 'white' ? 'text-white' : 'text-gray-600'} animate-pulse`}>
          {message}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="text-center">
          {spinner}
        </div>
      </div>
    )
  }

  return spinner
}

// Skeleton loading components
export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className || 'h-4 w-full'}`} />
  )
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-4">
        <div className="rounded-full bg-gray-200 h-12 w-12"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  )
}

export function ProjectCardSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      </div>
      
      {/* Content */}
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="h-3 bg-gray-200 rounded w-20"></div>
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-200 rounded w-8"></div>
          <div className="h-8 bg-gray-200 rounded w-8"></div>
        </div>
      </div>
    </div>
  )
}