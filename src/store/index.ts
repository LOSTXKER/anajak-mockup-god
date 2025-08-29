// src/store/index.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { User, Project, Mockup, Product, ViewportState } from '@/types'

interface AppState {
  // User state
  user: User | null
  isAuthenticated: boolean
  
  // UI State
  sidebarCollapsed: boolean
  currentPage: string
  
  // Project state
  selectedProject: Project | null
  projects: Project[]
  
  // Mockup state
  selectedMockup: Mockup | null
  mockups: Mockup[]
  
  // Editor state
  selectedProduct: Product | null
  viewport: ViewportState
  isCalibrating: boolean
  showGrid: boolean
  showGuides: boolean
  snapToGrid: boolean
  
  // Loading states
  isLoading: boolean
  loadingMessage: string
  
  // Actions
  setUser: (user: User | null) => void
  setAuthenticated: (authenticated: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setCurrentPage: (page: string) => void
  setSelectedProject: (project: Project | null) => void
  setProjects: (projects: Project[]) => void
  setSelectedMockup: (mockup: Mockup | null) => void
  setMockups: (mockups: Mockup[]) => void
  setSelectedProduct: (product: Product | null) => void
  setViewport: (viewport: ViewportState) => void
  setIsCalibrating: (calibrating: boolean) => void
  setShowGrid: (show: boolean) => void
  setShowGuides: (show: boolean) => void
  setSnapToGrid: (snap: boolean) => void
  setLoading: (loading: boolean, message?: string) => void
  reset: () => void
}

const initialViewport: ViewportState = {
  zoom: 1,
  pan: { x: 0, y: 0 }
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      sidebarCollapsed: false,
      currentPage: 'projects',
      selectedProject: null,
      projects: [],
      selectedMockup: null,
      mockups: [],
      selectedProduct: null,
      viewport: initialViewport,
      isCalibrating: false,
      showGrid: true,
      showGuides: true,
      snapToGrid: true,
      isLoading: false,
      loadingMessage: '',
      
      // Actions
      setUser: (user) => {
        console.log('Store: Setting user:', user?.email || 'null')
        console.log('Store: Setting isAuthenticated to:', !!user)
        set({ user, isAuthenticated: !!user })
      },
      setAuthenticated: (authenticated) => {
        console.log('Store: Setting authenticated:', authenticated)
        set({ isAuthenticated: authenticated })
      },
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setSelectedProject: (project) => set({ selectedProject: project }),
      setProjects: (projects) => set({ projects }),
      setSelectedMockup: (mockup) => set({ selectedMockup: mockup }),
      setMockups: (mockups) => set({ mockups }),
      setSelectedProduct: (product) => set({ selectedProduct: product }),
      setViewport: (viewport) => set({ viewport }),
      setIsCalibrating: (calibrating) => set({ isCalibrating: calibrating }),
      setShowGrid: (show) => set({ showGrid: show }),
      setShowGuides: (show) => set({ showGuides: show }),
      setSnapToGrid: (snap) => set({ snapToGrid: snap }),
      setLoading: (loading, message = '') => {
        console.log('Store: Setting loading:', loading, message)
        set({ isLoading: loading, loadingMessage: message })
      },
      reset: () => set({
        user: null,
        isAuthenticated: false,
        selectedProject: null,
        projects: [],
        selectedMockup: null,
        mockups: [],
        selectedProduct: null,
        viewport: initialViewport,
        isCalibrating: false,
        currentPage: 'projects'
      })
    }),
    { name: 'anajak-store' }
  )
)