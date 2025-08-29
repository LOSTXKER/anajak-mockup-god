-- DATABASE RESET - Drop all tables and recreate fresh schema
-- ===========================================================
-- ⚠️  WARNING: This will DELETE ALL DATA in these tables!
-- ⚠️  Only run this in development environment!
-- ===========================================================

-- 1. DROP EXISTING TABLES (CASCADE will drop all policies and constraints)
-- ========================================================================

-- Drop tables with CASCADE to automatically drop all dependent objects
-- (indexes, constraints, policies, triggers, etc.)
DROP TABLE IF EXISTS approval_history CASCADE;
DROP TABLE IF EXISTS approval_workflows CASCADE;
DROP TABLE IF EXISTS mockup_exports CASCADE;
DROP TABLE IF EXISTS asset_uploads CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS size_chart_entries CASCADE;
DROP TABLE IF EXISTS size_charts CASCADE;
DROP TABLE IF EXISTS product_views CASCADE;
DROP TABLE IF EXISTS product_view_sets CASCADE;

-- Drop function if exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 2. CREATE FRESH SCHEMA
-- ======================

-- SIZE CHARTS TABLE
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

-- SIZE CHART ENTRIES TABLE
CREATE TABLE size_chart_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  size_chart_id UUID NOT NULL REFERENCES size_charts(id) ON DELETE CASCADE,
  size VARCHAR(10) NOT NULL,
  chest_cm DECIMAL(5,2) NOT NULL,
  length_cm DECIMAL(5,2),
  shoulder_cm DECIMAL(5,2),
  sleeve_cm DECIMAL(5,2),
  measurements JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(size_chart_id, size)
);

-- PRODUCT VIEW SETS TABLE
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

-- PRODUCT VIEWS TABLE
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
  
  UNIQUE(view_set_id, view)
);

-- PRODUCTS TABLE
CREATE TABLE products (
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

-- PRODUCT VARIANTS TABLE
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

-- ASSET UPLOADS TABLE
CREATE TABLE asset_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  bucket_name VARCHAR(100) NOT NULL,
  public_url TEXT NOT NULL,
  upload_context VARCHAR(100),
  related_id UUID,
  metadata JSONB,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MOCKUP EXPORTS TABLE
CREATE TABLE mockup_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mockup_id UUID NOT NULL,
  project_id UUID NOT NULL,
  export_type VARCHAR(50) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  public_url TEXT NOT NULL,
  export_settings JSONB,
  status VARCHAR(20) DEFAULT 'completed',
  exported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- APPROVAL WORKFLOW TABLE
CREATE TABLE approval_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mockup_id UUID NOT NULL,
  project_id UUID NOT NULL,
  current_status VARCHAR(50) DEFAULT 'draft',
  assigned_to UUID REFERENCES auth.users(id),
  workflow_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- APPROVAL HISTORY TABLE
CREATE TABLE approval_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  status_from VARCHAR(50),
  status_to VARCHAR(50) NOT NULL,
  comment TEXT,
  attachments JSONB,
  action_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE INDEXES
-- =================

CREATE INDEX idx_product_view_sets_product_id ON product_view_sets(product_id);
CREATE INDEX idx_product_views_view_set_id ON product_views(view_set_id);
CREATE INDEX idx_size_chart_entries_chart_id ON size_chart_entries(size_chart_id);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_asset_uploads_context_related ON asset_uploads(upload_context, related_id);
CREATE INDEX idx_mockup_exports_mockup_id ON mockup_exports(mockup_id);
CREATE INDEX idx_approval_workflows_mockup_id ON approval_workflows(mockup_id);
CREATE INDEX idx_approval_history_workflow_id ON approval_history(workflow_id);

-- 4. CREATE UPDATE FUNCTION AND TRIGGERS
-- =======================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_size_charts_updated_at 
    BEFORE UPDATE ON size_charts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_view_sets_updated_at 
    BEFORE UPDATE ON product_view_sets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_views_updated_at 
    BEFORE UPDATE ON product_views 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at 
    BEFORE UPDATE ON approval_workflows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. ENABLE ROW LEVEL SECURITY
-- =============================

ALTER TABLE size_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_chart_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_view_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE mockup_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS POLICIES
-- =======================

-- Size Charts
CREATE POLICY "Users can view size_charts" ON size_charts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert size_charts" ON size_charts FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update their size_charts" ON size_charts FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- Size Chart Entries
CREATE POLICY "Users can view size_chart_entries" ON size_chart_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert size_chart_entries" ON size_chart_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update size_chart_entries" ON size_chart_entries FOR UPDATE TO authenticated USING (true);

-- Product View Sets
CREATE POLICY "Users can view product_view_sets" ON product_view_sets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert product_view_sets" ON product_view_sets FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update their product_view_sets" ON product_view_sets FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- Product Views
CREATE POLICY "Users can view product_views" ON product_views FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert product_views" ON product_views FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update product_views" ON product_views FOR UPDATE TO authenticated USING (true);

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

-- 7. INSERT SAMPLE DATA
-- =====================

-- Insert sample size chart
INSERT INTO size_charts (name, description, category) VALUES 
('Standard T-Shirt', 'มาตรฐานเสื้อยืดทั่วไป', 'apparel');

-- Get chart ID and insert entries
DO $$
DECLARE 
    chart_id UUID;
BEGIN
    SELECT id INTO chart_id FROM size_charts WHERE name = 'Standard T-Shirt' LIMIT 1;
    
    INSERT INTO size_chart_entries (size_chart_id, size, chest_cm, length_cm) VALUES
    (chart_id, 'S', 40, 65),
    (chart_id, 'M', 42, 67),
    (chart_id, 'L', 44, 69),
    (chart_id, 'XL', 46, 71),
    (chart_id, 'XXL', 48, 73);
END $$;

-- Insert sample product
INSERT INTO products (code, name, description, category) VALUES
('TS001', 'เสื้อยืดคอกลม', 'เสื้อยืดคอกลมสำหรับงาน mockup', 'apparel');

-- Insert sample product variants
DO $$
DECLARE 
    product_id UUID;
BEGIN
    SELECT id INTO product_id FROM products WHERE code = 'TS001' LIMIT 1;
    
    INSERT INTO product_variants (product_id, name, color_code, color_hex) VALUES
    (product_id, 'สีขาว', 'WHITE', '#FFFFFF'),
    (product_id, 'สีดำ', 'BLACK', '#000000'),
    (product_id, 'สีเทา', 'GRAY', '#808080'),
    (product_id, 'สีกรมท่า', 'NAVY', '#000080');
END $$;

-- Success message
SELECT 'Database reset completed successfully! All tables recreated with fresh schema and sample data.' as result;