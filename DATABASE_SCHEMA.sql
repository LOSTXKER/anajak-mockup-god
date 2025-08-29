-- DATABASE SCHEMA FOR ANAJAK MOCKUP SYSTEM
-- ===============================================

-- 1. PRODUCT VIEW SETS TABLE
CREATE TABLE product_view_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. PRODUCT VIEWS TABLE
CREATE TABLE product_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  view_set_id UUID NOT NULL REFERENCES product_view_sets(id) ON DELETE CASCADE,
  view VARCHAR(20) NOT NULL CHECK (view IN ('front', 'back', 'sleeveL', 'sleeveR')),
  image_path TEXT NOT NULL,
  base_size VARCHAR(10) NOT NULL,
  px_per_cm DECIMAL(8,2),
  centerline_x_px INTEGER,
  collar_y_px INTEGER,
  calibration_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one view type per view set
  UNIQUE(view_set_id, view)
);

-- 3. SIZE CHARTS TABLE
CREATE TABLE size_charts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. SIZE CHART ENTRIES TABLE
CREATE TABLE size_chart_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  size_chart_id UUID NOT NULL REFERENCES size_charts(id) ON DELETE CASCADE,
  size VARCHAR(10) NOT NULL,
  chest_cm DECIMAL(5,2) NOT NULL,
  length_cm DECIMAL(5,2),
  shoulder_cm DECIMAL(5,2),
  sleeve_cm DECIMAL(5,2),
  measurements JSONB, -- Additional measurements
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one entry per size per chart
  UNIQUE(size_chart_id, size)
);

-- 5. PRODUCTS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  base_size VARCHAR(10) DEFAULT 'L',
  size_chart_id UUID REFERENCES size_charts(id),
  default_view_set_id UUID REFERENCES product_view_sets(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 6. PRODUCT VARIANTS TABLE
CREATE TABLE product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  color_code VARCHAR(20),
  color_hex VARCHAR(7),
  sku VARCHAR(100),
  additional_info JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ASSET UPLOADS TABLE
CREATE TABLE asset_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  bucket_name VARCHAR(100) NOT NULL,
  public_url TEXT NOT NULL,
  upload_context VARCHAR(100), -- 'product', 'logo', 'editor', etc.
  related_id UUID, -- ID of related entity (product_id, project_id, etc.)
  metadata JSONB, -- Additional file metadata
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. MOCKUP EXPORTS TABLE
CREATE TABLE mockup_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mockup_id UUID NOT NULL,
  project_id UUID NOT NULL,
  export_type VARCHAR(50) NOT NULL, -- 'png', 'pdf', 'svg'
  file_path TEXT NOT NULL,
  file_size INTEGER,
  public_url TEXT NOT NULL,
  export_settings JSONB, -- Resolution, format settings, etc.
  status VARCHAR(20) DEFAULT 'completed', -- 'processing', 'completed', 'failed'
  exported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. APPROVAL WORKFLOW TABLE
CREATE TABLE approval_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mockup_id UUID NOT NULL,
  project_id UUID NOT NULL,
  current_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending', 'approved', 'rejected', 'revision_requested'
  assigned_to UUID REFERENCES auth.users(id),
  workflow_data JSONB, -- Approval steps, comments, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 10. APPROVAL HISTORY TABLE
CREATE TABLE approval_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'submitted', 'approved', 'rejected', 'revision_requested'
  status_from VARCHAR(50),
  status_to VARCHAR(50) NOT NULL,
  comment TEXT,
  attachments JSONB, -- File attachments or references
  action_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
-- ========================

CREATE INDEX idx_product_view_sets_product_id ON product_view_sets(product_id);
CREATE INDEX idx_product_views_view_set_id ON product_views(view_set_id);
CREATE INDEX idx_size_chart_entries_chart_id ON size_chart_entries(size_chart_id);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_asset_uploads_context_related ON asset_uploads(upload_context, related_id);
CREATE INDEX idx_mockup_exports_mockup_id ON mockup_exports(mockup_id);
CREATE INDEX idx_approval_workflows_mockup_id ON approval_workflows(mockup_id);
CREATE INDEX idx_approval_history_workflow_id ON approval_history(workflow_id);

-- UPDATE FUNCTIONS
-- ================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- TRIGGERS FOR UPDATED_AT
-- =======================

CREATE TRIGGER update_product_view_sets_updated_at BEFORE UPDATE ON product_view_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_views_updated_at BEFORE UPDATE ON product_views FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_size_charts_updated_at BEFORE UPDATE ON size_charts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approval_workflows_updated_at BEFORE UPDATE ON approval_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS POLICIES
-- ============

-- Enable RLS on all tables
ALTER TABLE product_view_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_chart_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE mockup_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (authenticated users can read/write their own data)
-- You can customize these based on your specific requirements

-- Product View Sets
CREATE POLICY "Users can view product_view_sets" ON product_view_sets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert product_view_sets" ON product_view_sets FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update their product_view_sets" ON product_view_sets FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- Product Views
CREATE POLICY "Users can view product_views" ON product_views FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert product_views" ON product_views FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update product_views" ON product_views FOR UPDATE TO authenticated USING (true);

-- Size Charts
CREATE POLICY "Users can view size_charts" ON size_charts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert size_charts" ON size_charts FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update their size_charts" ON size_charts FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- Size Chart Entries
CREATE POLICY "Users can view size_chart_entries" ON size_chart_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert size_chart_entries" ON size_chart_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update size_chart_entries" ON size_chart_entries FOR UPDATE TO authenticated USING (true);

-- Products
CREATE POLICY "Users can view products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert products" ON products FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update their products" ON products FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- Product Variants
CREATE POLICY "Users can view product_variants" ON product_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert product_variants" ON product_variants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update product_variants" ON product_variants FOR UPDATE TO authenticated USING (true);

-- Asset Uploads
CREATE POLICY "Users can view their asset_uploads" ON asset_uploads FOR SELECT TO authenticated USING (uploaded_by = auth.uid());
CREATE POLICY "Users can insert asset_uploads" ON asset_uploads FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());

-- Mockup Exports
CREATE POLICY "Users can view their mockup_exports" ON mockup_exports FOR SELECT TO authenticated USING (exported_by = auth.uid());
CREATE POLICY "Users can insert mockup_exports" ON mockup_exports FOR INSERT TO authenticated WITH CHECK (exported_by = auth.uid());

-- Approval Workflows
CREATE POLICY "Users can view approval_workflows" ON approval_workflows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert approval_workflows" ON approval_workflows FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update approval_workflows" ON approval_workflows FOR UPDATE TO authenticated USING (created_by = auth.uid() OR assigned_to = auth.uid());

-- Approval History
CREATE POLICY "Users can view approval_history" ON approval_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert approval_history" ON approval_history FOR INSERT TO authenticated WITH CHECK (action_by = auth.uid());

-- SAMPLE DATA (Optional)
-- ======================

-- Insert sample size chart
INSERT INTO size_charts (name, description, category) VALUES 
('Standard T-Shirt', 'มาตรฐานเสื้อยืดทั่วไป', 'apparel');

-- Get the size chart ID for sample data
DO $$
DECLARE 
    chart_id UUID;
BEGIN
    SELECT id INTO chart_id FROM size_charts WHERE name = 'Standard T-Shirt' LIMIT 1;
    
    IF chart_id IS NOT NULL THEN
        -- Insert size chart entries
        INSERT INTO size_chart_entries (size_chart_id, size, chest_cm, length_cm) VALUES
        (chart_id, 'S', 40, 65),
        (chart_id, 'M', 42, 67),
        (chart_id, 'L', 44, 69),
        (chart_id, 'XL', 46, 71),
        (chart_id, 'XXL', 48, 73);
    END IF;
END $$;