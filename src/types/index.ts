// src/types/index.ts
export interface User {
  id: string
  email: string
  name?: string
  org_id: string
  role: 'admin' | 'designer' | 'reviewer' | 'client'
  created_at: string
}

export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface Project {
  id: string
  org_id: string
  client_code: string
  client_name: string
  code: string
  name: string
  status: 'brief' | 'design' | 'client_approved' | 'handoff_erp'
  erp_ref?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Mockup {
  id: string
  project_id: string
  product_id?: null
  variant_id?: null
  name: string
  status: 'draft' | 'approved' | 'locked'
  revision: number
  created_at: string
  updated_at: string
  // Relations
  project?: Project
  product?: Product
  variant?: ProductVariant
  placements?: Placement[]
}

export interface Product {
  id: string
  org_id: string
  code: string
  name: string
  brand?: string
  fabric?: string
  weight_gsm?: number
  fit?: string
  size_chart_id?: string
  is_published: boolean
  version: number
  created_at: string
  // Relations
  variants?: ProductVariant[]
  view_sets?: ProductViewSet[]
  size_chart?: SizeChart
}

export interface ProductVariant {
  id: string
  product_id: string
  color_name: string
  color_code?: string
  sku?: string
  barcode?: string
  view_mode: 'image' | 'recolor'
  view_set_id?: string
}

export interface ProductViewSet {
  id: string
  product_id: string
  name: string
  version: number
  created_at: string
  // Relations
  views?: ProductView[]
}

export interface ProductView {
  id: string
  view_set_id: string
  view: 'front' | 'back' | 'sleeveL' | 'sleeveR'
  image_path: string
  base_size: string
  px_per_cm?: number
  centerline_x_px?: number
  collar_y_px?: number
  calibration_by?: string
  calibration_at?: string
  // Relations
  safe_areas?: ProductSafeArea[]
}

export interface ProductSafeArea {
  id: string
  product_view_id: string
  name: string
  x_cm: number
  y_cm: number
  w_cm: number
  h_cm: number
}

export interface SizeChart {
  id: string
  org_id: string
  name: string
  base_size: string
  created_at: string
  // Relations
  sizes?: SizeRow[]
}

export interface SizeRow {
  id: string
  size_chart_id: string
  size: string
  chest_cm: number
  body_cm?: number
  sleeve_cm?: number
}

export interface Asset {
  id: string
  org_id: string
  path: string
  original_name?: string
  w_px?: number
  h_px?: number
  file_size?: number
  meta_json?: Record<string, unknown>
  created_at: string
}

export interface Placement {
  id: string
  mockup_id: string
  view: 'front' | 'back' | 'sleeveL' | 'sleeveR'
  mode: 'fixed' | 'proportional'
  x_cm: number
  y_cm: number
  w_cm: number
  h_cm: number
  asset_id?: string
  z_index: number
  rotation?: number
  opacity?: number
  // Relations
  asset?: Asset
}

export interface PlacementRecipe {
  id: string
  mockup_id?: string
  name: string
  rules_json: Record<string, unknown>
  created_at: string
}

export interface Approval {
  id: string
  mockup_id: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  url_token: string
  comments?: string
  created_at: string
}

export interface HandoffJob {
  id: string
  project_id?: string
  mockup_id?: string
  payload_json: Record<string, unknown>
  files_manifest_json?: Record<string, unknown>
  target: 'webhook' | 'sftp' | 'manual'
  status: 'pending' | 'processing' | 'success' | 'failed'
  response_text?: string
  retry_count: number
  created_at: string
}

// Canvas and Editor Types
export interface CanvasPoint {
  x: number
  y: number
}

export interface CanvasBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface ViewportState {
  zoom: number
  pan: CanvasPoint
}

export interface CalibrationData {
  px_measured: number
  cm_real: number
  px_per_cm: number
  centerline_x_px?: number
  collar_y_px?: number
  isCalibrated?: boolean
}

// Preset configurations
export interface PlacementPreset {
  name: string
  view: 'front' | 'back' | 'sleeveL' | 'sleeveR'
  x_cm: number
  y_cm: number
  w_cm: number
  h_cm: number
  mode: 'fixed' | 'proportional'
  description?: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Form types
export interface CreateProjectForm {
  client_code: string
  client_name: string
  code: string
  name: string
  notes?: string
}

export interface CreateMockupForm {
  project_id: string
  name: string
  product_id?: string
  variant_id?: string
}