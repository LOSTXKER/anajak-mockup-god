# Supabase Storage Setup Guide

## Required Storage Buckets

คุณต้องสร้าง Storage Buckets ต่อไปนี้ใน Supabase Dashboard:

### 1. assets bucket
- **Purpose**: เก็บรูปภาพสินค้า, โลโก้, และ assets ต่างๆ
- **Settings**:
  - Public: ✅ Yes
  - File size limit: 5MB
  - Allowed MIME types: `image/png`, `image/jpeg`, `image/jpg`, `image/webp`, `image/svg+xml`

### 2. exports bucket
- **Purpose**: เก็บไฟล์ mockup ที่ส่งออก
- **Settings**:
  - Public: ✅ Yes
  - File size limit: 10MB
  - Allowed MIME types: `image/png`, `image/jpeg`, `application/pdf`

## การสร้าง Buckets

1. เข้าไป Supabase Dashboard
2. ไปที่ **Storage** ในเมนูซ้าย
3. คลิก **Create bucket**
4. ใส่ชื่อ bucket และตั้งค่าตามด้านบน
5. สร้างทั้ง 2 buckets

## Storage Policies (RLS)

หากคุณต้องการควบคุมสิทธิ์การเข้าถึง ให้สร้าง RLS policies:

```sql
-- Allow authenticated users to upload to assets bucket
CREATE POLICY "Authenticated users can upload assets" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'assets');

-- Allow public read access to assets
CREATE POLICY "Public read access to assets" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'assets');

-- Allow authenticated users to upload to exports bucket
CREATE POLICY "Authenticated users can upload exports" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'exports');

-- Allow public read access to exports
CREATE POLICY "Public read access to exports" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'exports');
```

## การตรวจสอบ

หลังจากตั้งค่าแล้ว ระบบจะแสดง:
- ✅ Storage buckets check completed

หากยังมีปัญหา ให้ตรวจสอบ:
1. Bucket names ถูกต้อง
2. ตั้งค่า Public access
3. RLS policies (ถ้ามี)
4. Supabase URL และ API Key ถูกต้อง