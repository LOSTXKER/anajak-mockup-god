// src/types/database.ts
export interface Database {
  public: {
    Tables: {
      orgs: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          org_id: string
          role: 'admin' | 'designer' | 'reviewer' | 'client'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          org_id: string
          role?: 'admin' | 'designer' | 'reviewer' | 'client'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          org_id?: string
          role?: 'admin' | 'designer' | 'reviewer' | 'client'
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          org_id: string
          client_code: string
          client_name: string
          code: string
          name: string
          status: 'brief' | 'design' | 'client_approved' | 'handoff_erp'
          erp_ref: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          client_code: string
          client_name: string
          code: string
          name: string
          status?: 'brief' | 'design' | 'client_approved' | 'handoff_erp'
          erp_ref?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          client_code?: string
          client_name?: string
          code?: string
          name?: string
          status?: 'brief' | 'design' | 'client_approved' | 'handoff_erp'
          erp_ref?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      mockups: {
        Row: {
          id: string
          project_id: string
          product_id: string | null
          variant_id: string | null
          name: string
          status: 'draft' | 'approved' | 'locked'
          revision: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          product_id?: string | null
          variant_id?: string | null
          name: string
          status?: 'draft' | 'approved' | 'locked'
          revision?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          product_id?: string | null
          variant_id?: string | null
          name?: string
          status?: 'draft' | 'approved' | 'locked'
          revision?: number
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          org_id: string
          code: string
          name: string
          brand: string | null
          fabric: string | null
          weight_gsm: number | null
          fit: string | null
          size_chart_id: string | null
          is_published: boolean
          version: number
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          code: string
          name: string
          brand?: string | null
          fabric?: string | null
          weight_gsm?: number | null
          fit?: string | null
          size_chart_id?: string | null
          is_published?: boolean
          version?: number
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          code?: string
          name?: string
          brand?: string | null
          fabric?: string | null
          weight_gsm?: number | null
          fit?: string | null
          size_chart_id?: string | null
          is_published?: boolean
          version?: number
          created_at?: string
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          color_name: string
          color_code: string | null
          sku: string | null
          barcode: string | null
          view_mode: 'image' | 'recolor'
          view_set_id: string | null
        }
        Insert: {
          id?: string
          product_id: string
          color_name: string
          color_code?: string | null
          sku?: string | null
          barcode?: string | null
          view_mode: 'image' | 'recolor'
          view_set_id?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          color_name?: string
          color_code?: string | null
          sku?: string | null
          barcode?: string | null
          view_mode?: 'image' | 'recolor'
          view_set_id?: string | null
        }
      }
      product_view_sets: {
        Row: {
          id: string
          product_id: string
          name: string
          version: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          version?: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          version?: number
          created_at?: string
        }
      }
      product_views: {
        Row: {
          id: string
          view_set_id: string
          view: 'front' | 'back' | 'sleeveL' | 'sleeveR'
          image_path: string
          base_size: string
          px_per_cm: number | null
          centerline_x_px: number | null
          collar_y_px: number | null
          calibration_by: string | null
          calibration_at: string | null
        }
        Insert: {
          id?: string
          view_set_id: string
          view: 'front' | 'back' | 'sleeveL' | 'sleeveR'
          image_path: string
          base_size: string
          px_per_cm?: number | null
          centerline_x_px?: number | null
          collar_y_px?: number | null
          calibration_by?: string | null
          calibration_at?: string | null
        }
        Update: {
          id?: string
          view_set_id?: string
          view?: 'front' | 'back' | 'sleeveL' | 'sleeveR'
          image_path?: string
          base_size?: string
          px_per_cm?: number | null
          centerline_x_px?: number | null
          collar_y_px?: number | null
          calibration_by?: string | null
          calibration_at?: string | null
        }
      }
      size_charts: {
        Row: {
          id: string
          org_id: string
          name: string
          base_size: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          base_size: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          base_size?: string
          created_at?: string
        }
      }
      size_rows: {
        Row: {
          id: string
          size_chart_id: string
          size: string
          chest_cm: number
          body_cm: number | null
          sleeve_cm: number | null
        }
        Insert: {
          id?: string
          size_chart_id: string
          size: string
          chest_cm: number
          body_cm?: number | null
          sleeve_cm?: number | null
        }
        Update: {
          id?: string
          size_chart_id?: string
          size?: string
          chest_cm?: number
          body_cm?: number | null
          sleeve_cm?: number | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}