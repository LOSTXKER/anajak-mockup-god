// src/components/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'
import { initializeStorageBuckets } from '@/lib/storage'
import { ThemeProvider } from './theme/ThemeProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          gcTime: 10 * 60 * 1000, // 10 minutes (เปลี่ยนจาก cacheTime เป็น gcTime)
          refetchOnWindowFocus: false,
        },
      },
    })
  )

  // Initialize storage buckets on app start
  useEffect(() => {
    initializeStorageBuckets()
  }, [])

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}