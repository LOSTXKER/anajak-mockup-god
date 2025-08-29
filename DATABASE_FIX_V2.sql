-- DATABASE FIX V2 - Handle existing table structures
-- ===================================================

-- 1. First, let's check what columns exist in size_charts
-- ========================================================

-- Create temporary function to check table structure
CREATE OR REPLACE FUNCTION get_missing_columns()
RETURNS TABLE(missing_columns TEXT) AS $$
DECLARE
    col_names TEXT;
BEGIN
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    INTO col_names
    FROM information_schema.columns
    WHERE table_name = 'size_charts' AND table_schema = 'public';
    
    RETURN QUERY SELECT 'size_charts columns: ' || COALESCE(col_names, 'table not found');
END;
$$ LANGUAGE plpgsql;

-- Check current structure
SELECT * FROM get_missing_columns();

-- 2. Create missing tables (skip size_charts modifications for now)
-- =================================================================

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

-- Add unique constraint if not exists (safe version)
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'size_chart_entries_chart_size_unique'
    ) THEN
        ALTER TABLE size_chart_entries 
        ADD CONSTRAINT size_chart_entries_chart_size_unique UNIQUE(size_chart_id, size);
        RAISE NOTICE 'Added unique constraint to size_chart_entries';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on size_chart_entries';
    END IF;
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

-- 3. Create indexes (safe version)
-- ================================
CREATE INDEX IF NOT EXISTS idx_product_views_view_set_id ON product_views(view_set_id);
CREATE INDEX IF NOT EXISTS idx_size_chart_entries_chart_id ON size_chart_entries(size_chart_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_asset_uploads_context_related ON asset_uploads(upload_context, related_id);
CREATE INDEX IF NOT EXISTS idx_mockup_exports_mockup_id ON mockup_exports(mockup_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_mockup_id ON approval_workflows(mockup_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_workflow_id ON approval_history(workflow_id);

-- 4. Insert sample data - SAFER VERSION
-- ======================================

-- First, let's check what columns are actually in size_charts and get org_id
DO $$
DECLARE
    has_org_id BOOLEAN := FALSE;
    has_description BOOLEAN := FALSE;
    has_category BOOLEAN := FALSE;
    sample_org_id UUID;
    chart_id UUID;
BEGIN
    -- Check for columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'size_charts' AND column_name = 'org_id'
    ) INTO has_org_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'size_charts' AND column_name = 'description'
    ) INTO has_description;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'size_charts' AND column_name = 'category'
    ) INTO has_category;
    
    RAISE NOTICE 'size_charts has org_id: %, description: %, category: %', has_org_id, has_description, has_category;
    
    -- If org_id exists, get a sample value
    IF has_org_id THEN
        EXECUTE 'SELECT org_id FROM size_charts LIMIT 1' INTO sample_org_id;
        RAISE NOTICE 'Sample org_id found: %', sample_org_id;
    END IF;
    
    -- Insert sample size chart based on available columns
    IF NOT EXISTS (SELECT 1 FROM size_charts WHERE name = 'Standard T-Shirt') THEN
        IF has_org_id AND has_description AND has_category THEN
            -- Full insert with all columns
            INSERT INTO size_charts (name, description, category, org_id) 
            VALUES ('Standard T-Shirt', 'มาตรฐานเสื้อยืดทั่วไป', 'apparel', COALESCE(sample_org_id, gen_random_uuid()));
        ELSIF has_org_id AND has_description THEN
            -- Insert with org_id and description
            INSERT INTO size_charts (name, description, org_id) 
            VALUES ('Standard T-Shirt', 'มาตรฐานเสื้อยืดทั่วไป', COALESCE(sample_org_id, gen_random_uuid()));
        ELSIF has_org_id THEN
            -- Insert with just org_id
            INSERT INTO size_charts (name, org_id) 
            VALUES ('Standard T-Shirt', COALESCE(sample_org_id, gen_random_uuid()));
        ELSE
            -- Basic insert
            INSERT INTO size_charts (name) VALUES ('Standard T-Shirt');
        END IF;
        
        RAISE NOTICE 'Inserted Standard T-Shirt size chart';
    END IF;
    
    -- Get the chart ID for entries
    SELECT id INTO chart_id FROM size_charts WHERE name = 'Standard T-Shirt' LIMIT 1;
    
    -- Insert size chart entries if chart exists
    IF chart_id IS NOT NULL THEN
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
        
        RAISE NOTICE 'Inserted size chart entries successfully';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in sample data insertion: %', SQLERRM;
END
$$;

-- 5. Enable RLS on new tables
-- ============================
ALTER TABLE size_chart_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE mockup_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for new tables
-- ======================================

-- Size Chart Entries policies
DO $$
BEGIN
    -- Check if policies exist before creating
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'size_chart_entries' AND policyname = 'Users can view size_chart_entries') THEN
        CREATE POLICY "Users can view size_chart_entries" ON size_chart_entries FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'size_chart_entries' AND policyname = 'Users can insert size_chart_entries') THEN
        CREATE POLICY "Users can insert size_chart_entries" ON size_chart_entries FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'size_chart_entries' AND policyname = 'Users can update size_chart_entries') THEN
        CREATE POLICY "Users can update size_chart_entries" ON size_chart_entries FOR UPDATE TO authenticated USING (true);
    END IF;
END
$$;

-- Products policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can view products') THEN
        CREATE POLICY "Users can view products" ON products FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can insert products') THEN
        CREATE POLICY "Users can insert products" ON products FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can update their products') THEN
        CREATE POLICY "Users can update their products" ON products FOR UPDATE TO authenticated USING (created_by = auth.uid());
    END IF;
END
$$;

-- Clean up temporary function
DROP FUNCTION IF EXISTS get_missing_columns();

-- Final success message
SELECT 'Database schema setup completed successfully! All tables created and sample data inserted.' as result;