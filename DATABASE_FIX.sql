-- DATABASE FIX - Check existing tables and add missing columns
-- ============================================================

-- Check current structure and add missing columns if needed
-- =========================================================

-- 1. Check and fix size_charts table
DO $$
BEGIN
    -- Add description column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'size_charts' AND column_name = 'description') THEN
        ALTER TABLE size_charts ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to size_charts';
    END IF;

    -- Add category column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'size_charts' AND column_name = 'category') THEN
        ALTER TABLE size_charts ADD COLUMN category VARCHAR(100);
        RAISE NOTICE 'Added category column to size_charts';
    END IF;

    -- Add is_active column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'size_charts' AND column_name = 'is_active') THEN
        ALTER TABLE size_charts ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to size_charts';
    END IF;

    -- Add created_by column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'size_charts' AND column_name = 'created_by') THEN
        ALTER TABLE size_charts ADD COLUMN created_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added created_by column to size_charts';
    END IF;
END
$$;

-- 2. Create missing tables (only ones that don't exist)
-- =====================================================

-- SIZE CHART ENTRIES TABLE
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

-- PRODUCTS TABLE
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

-- PRODUCT VARIANTS TABLE
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

-- ASSET UPLOADS TABLE
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

-- MOCKUP EXPORTS TABLE
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

-- APPROVAL WORKFLOW TABLE
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

-- APPROVAL HISTORY TABLE
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

-- 3. Create indexes
-- =================
CREATE INDEX IF NOT EXISTS idx_product_views_view_set_id ON product_views(view_set_id);
CREATE INDEX IF NOT EXISTS idx_size_chart_entries_chart_id ON size_chart_entries(size_chart_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_asset_uploads_context_related ON asset_uploads(upload_context, related_id);
CREATE INDEX IF NOT EXISTS idx_mockup_exports_mockup_id ON mockup_exports(mockup_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_mockup_id ON approval_workflows(mockup_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_workflow_id ON approval_history(workflow_id);

-- 4. Insert sample data (safe version)
-- =====================================

-- Insert sample size chart if not exists
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
        -- Insert each size if not exists
        INSERT INTO size_chart_entries (size_chart_id, size, chest_cm, length_cm) 
        SELECT chart_id, 'S', 40, 65 
        WHERE NOT EXISTS (SELECT 1 FROM size_chart_entries WHERE size_chart_id = chart_id AND size = 'S');
        
        INSERT INTO size_chart_entries (size_chart_id, size, chest_cm, length_cm) 
        SELECT chart_id, 'M', 42, 67 
        WHERE NOT EXISTS (SELECT 1 FROM size_chart_entries WHERE size_chart_id = chart_id AND size = 'M');
        
        INSERT INTO size_chart_entries (size_chart_id, size, chest_cm, length_cm) 
        SELECT chart_id, 'L', 44, 69 
        WHERE NOT EXISTS (SELECT 1 FROM size_chart_entries WHERE size_chart_id = chart_id AND size = 'L');
        
        INSERT INTO size_chart_entries (size_chart_id, size, chest_cm, length_cm) 
        SELECT chart_id, 'XL', 46, 71 
        WHERE NOT EXISTS (SELECT 1 FROM size_chart_entries WHERE size_chart_id = chart_id AND size = 'XL');
        
        INSERT INTO size_chart_entries (size_chart_id, size, chest_cm, length_cm) 
        SELECT chart_id, 'XXL', 48, 73 
        WHERE NOT EXISTS (SELECT 1 FROM size_chart_entries WHERE size_chart_id = chart_id AND size = 'XXL');

        RAISE NOTICE 'Sample size chart data inserted successfully';
    END IF;
END $$;

-- 5. Enable RLS on new tables
-- ============================
ALTER TABLE size_chart_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE mockup_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;

-- 6. Create basic RLS policies for new tables
-- ============================================

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

SELECT 'Database schema fix completed successfully!' as result;