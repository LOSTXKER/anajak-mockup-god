-- SAFE DATABASE SCHEMA - Only creates missing tables
-- ===================================================

-- 1. PRODUCT VIEW SETS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS product_view_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. PRODUCT VIEWS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS product_views (
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint if not exists
DO $$
BEGIN
    ALTER TABLE product_views ADD CONSTRAINT product_views_view_set_view_unique UNIQUE(view_set_id, view);
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint already exists, skipping';
END
$$;

-- 3. SIZE CHARTS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS size_charts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. SIZE CHART ENTRIES TABLE (if not exists)
CREATE TABLE IF NOT EXISTS size_chart_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  size_chart_id UUID NOT NULL REFERENCES size_charts(id) ON DELETE CASCADE,
  size VARCHAR(10) NOT NULL,
  chest_cm DECIMAL(5,2) NOT NULL,
  length_cm DECIMAL(5,2),
  shoulder_cm DECIMAL(5,2),
  sleeve_cm DECIMAL(5,2),
  measurements JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint if not exists
DO $$
BEGIN
    ALTER TABLE size_chart_entries ADD CONSTRAINT size_chart_entries_chart_size_unique UNIQUE(size_chart_id, size);
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint already exists, skipping';
END
$$;

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

-- 6. PRODUCT VARIANTS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS product_variants (
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

-- 7. ASSET UPLOADS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS asset_uploads (
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

-- 8. MOCKUP EXPORTS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS mockup_exports (
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

-- 9. APPROVAL WORKFLOW TABLE (if not exists)
CREATE TABLE IF NOT EXISTS approval_workflows (
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

-- 10. APPROVAL HISTORY TABLE (if not exists)
CREATE TABLE IF NOT EXISTS approval_history (
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

-- CREATE INDEXES (IF NOT EXISTS)
-- ===============================

CREATE INDEX IF NOT EXISTS idx_product_view_sets_product_id ON product_view_sets(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_view_set_id ON product_views(view_set_id);
CREATE INDEX IF NOT EXISTS idx_size_chart_entries_chart_id ON size_chart_entries(size_chart_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_asset_uploads_context_related ON asset_uploads(upload_context, related_id);
CREATE INDEX IF NOT EXISTS idx_mockup_exports_mockup_id ON mockup_exports(mockup_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_mockup_id ON approval_workflows(mockup_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_workflow_id ON approval_history(workflow_id);

-- CREATE UPDATE FUNCTION (IF NOT EXISTS)
-- ======================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- CREATE TRIGGERS (IF NOT EXISTS)
-- ================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_view_sets_updated_at') THEN
        CREATE TRIGGER update_product_view_sets_updated_at 
        BEFORE UPDATE ON product_view_sets 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_views_updated_at') THEN
        CREATE TRIGGER update_product_views_updated_at 
        BEFORE UPDATE ON product_views 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_size_charts_updated_at') THEN
        CREATE TRIGGER update_size_charts_updated_at 
        BEFORE UPDATE ON size_charts 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
        CREATE TRIGGER update_products_updated_at 
        BEFORE UPDATE ON products 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_approval_workflows_updated_at') THEN
        CREATE TRIGGER update_approval_workflows_updated_at 
        BEFORE UPDATE ON approval_workflows 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- ENABLE RLS (IF NOT ALREADY ENABLED)
-- ====================================

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

-- INSERT SAMPLE DATA (IF NOT EXISTS)
-- ===================================

INSERT INTO size_charts (name, description, category) 
SELECT 'Standard T-Shirt', 'มาตรฐานเสื้อยืดทั่วไป', 'apparel'
WHERE NOT EXISTS (SELECT 1 FROM size_charts WHERE name = 'Standard T-Shirt');

-- Insert size chart entries
DO $$
DECLARE 
    chart_id UUID;
BEGIN
    SELECT id INTO chart_id FROM size_charts WHERE name = 'Standard T-Shirt' LIMIT 1;
    
    IF chart_id IS NOT NULL THEN
        INSERT INTO size_chart_entries (size_chart_id, size, chest_cm, length_cm) 
        SELECT chart_id, 'S', 40, 65 WHERE NOT EXISTS (SELECT 1 FROM size_chart_entries WHERE size_chart_id = chart_id AND size = 'S');
        
        INSERT INTO size_chart_entries (size_chart_id, size, chest_cm, length_cm) 
        SELECT chart_id, 'M', 42, 67 WHERE NOT EXISTS (SELECT 1 FROM size_chart_entries WHERE size_chart_id = chart_id AND size = 'M');
        
        INSERT INTO size_chart_entries (size_chart_id, size, chest_cm, length_cm) 
        SELECT chart_id, 'L', 44, 69 WHERE NOT EXISTS (SELECT 1 FROM size_chart_entries WHERE size_chart_id = chart_id AND size = 'L');
        
        INSERT INTO size_chart_entries (size_chart_id, size, chest_cm, length_cm) 
        SELECT chart_id, 'XL', 46, 71 WHERE NOT EXISTS (SELECT 1 FROM size_chart_entries WHERE size_chart_id = chart_id AND size = 'XL');
        
        INSERT INTO size_chart_entries (size_chart_id, size, chest_cm, length_cm) 
        SELECT chart_id, 'XXL', 48, 73 WHERE NOT EXISTS (SELECT 1 FROM size_chart_entries WHERE size_chart_id = chart_id AND size = 'XXL');
    END IF;
END $$;