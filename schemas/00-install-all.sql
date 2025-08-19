-- ============================================================================
-- 00. MASTER INSTALLATION SCRIPT
-- ============================================================================
-- This file installs all schema components in the correct order
-- Run this file to set up your complete database

-- ============================================================================
-- PREREQUISITES
-- ============================================================================
-- Ensure you have the required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- INSTALLATION ORDER
-- ============================================================================
-- 1. Profiles & Authentication (01-profiles.sql)
-- 2. Addresses (02-addresses.sql) 
-- 3. Materials (03-materials.sql)
-- 4. Pickups (04-pickups.sql)
-- 5. Pickup Items (05-pickup-items.sql)
-- 6. Photos (06-pickup-photos.sql)
-- 7. Payments (07-payments.sql)
-- 8. Views & Seed Data (08-views-and-seed-data.sql)

-- ============================================================================
-- STEP 1: PROFILES & AUTHENTICATION
-- ============================================================================
\echo 'Installing Profiles & Authentication Schema...'

-- Create profiles table
CREATE TABLE profiles (
  id uuid primary key default auth.uid(),
  email text unique not null,
  full_name text,
  phone text unique,
  role text not null check (role in ('customer','collector','admin')),
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- Create indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_active ON profiles(is_active);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (auth_role() = 'admin');

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (auth_role() = 'admin');

-- Admins can insert new profiles
CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (auth_role() = 'admin');

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (auth_role() = 'admin');

-- Function to get current user's role for RLS policies
CREATE OR REPLACE FUNCTION auth_role() 
RETURNS text 
LANGUAGE sql 
STABLE 
AS $$ 
  SELECT role FROM profiles WHERE id = auth.uid() 
$$;

-- Additional admin profiles policy
CREATE POLICY "admin_profiles" ON profiles
  FOR ALL USING (auth_role() = 'admin') WITH CHECK (auth_role() = 'admin');

-- Additional customer read policy
CREATE POLICY "customer_read_profile" ON profiles
  FOR SELECT USING (id = auth.uid());

\echo '✓ Profiles & Authentication Schema installed'

-- ============================================================================
-- STEP 2: ADDRESSES
-- ============================================================================
\echo 'Installing Addresses Schema...'

-- Create addresses table
CREATE TABLE addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  line1 text not null,
  suburb text not null,
  city text not null,
  postal_code text,
  lat double precision,
  lng double precision,
  is_primary boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes
CREATE INDEX idx_addresses_profile_id ON addresses(profile_id);
CREATE INDEX idx_addresses_city ON addresses(city);
CREATE INDEX idx_addresses_suburb ON addresses(suburb);
CREATE INDEX idx_addresses_primary ON addresses(is_primary);
CREATE INDEX idx_addresses_location ON addresses(lat, lng);

-- Create constraints
CREATE UNIQUE INDEX idx_addresses_one_primary_per_profile 
  ON addresses(profile_id) 
  WHERE is_primary = true;

-- Enable RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own addresses" ON addresses
  FOR ALL USING (auth.uid() = profile_id);

-- Additional customer read policy
CREATE POLICY "customer_read_addresses" ON addresses
  FOR SELECT USING (profile_id = auth.uid());

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_addresses_updated_at 
  BEFORE UPDATE ON addresses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create addresses when new users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data ? 'street_address' THEN
    INSERT INTO public.addresses (
      profile_id,
      line1,
      suburb,
      city,
      postal_code,
      is_primary
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'street_address',
      NEW.raw_user_meta_data->>'suburb',
      NEW.raw_user_meta_data->>'city',
      NEW.raw_user_meta_data->>'postal_code',
      true
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_address_created ON auth.users;

-- Create trigger to automatically create addresses for new users
CREATE TRIGGER on_auth_user_address_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_address();

\echo '✓ Addresses Schema installed'

-- ============================================================================
-- STEP 3: MATERIALS
-- ============================================================================
\echo 'Installing Materials Schema...'

-- Create materials table
CREATE TABLE materials (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  unit text not null default 'kg',
  rate_per_kg numeric(10,2) not null default 0,
  is_active boolean not null default true,
  description text,
  category text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes
CREATE INDEX idx_materials_name ON materials(name);
CREATE INDEX idx_materials_active ON materials(is_active);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_rate ON materials(rate_per_kg);

-- Create constraints
ALTER TABLE materials ADD CONSTRAINT chk_materials_rate_positive 
  CHECK (rate_per_kg >= 0);

-- Enable RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active materials" ON materials
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can modify materials" ON materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create trigger
CREATE TRIGGER update_materials_updated_at 
  BEFORE UPDATE ON materials 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample materials
INSERT INTO materials (name, unit, rate_per_kg, is_active, description, category) VALUES
  ('PET', 'kg', 1.50, true, 'Polyethylene terephthalate bottles and containers', 'Plastic'),
  ('Aluminium Cans', 'kg', 18.55, true, 'Aluminum beverage and food cans', 'Metal'),
  ('HDPE', 'kg', 2.00, true, 'High-density polyethylene containers', 'Plastic'),
  ('Glass', 'kg', 1.20, true, 'Glass bottles and containers', 'Glass'),
  ('Paper', 'kg', 0.80, true, 'Mixed paper and cardboard', 'Paper'),
  ('Cardboard', 'kg', 0.60, true, 'Corrugated cardboard boxes', 'Paper');

\echo '✓ Materials Schema installed'

-- ============================================================================
-- STEP 4: PICKUPS
-- ============================================================================
\echo 'Installing Pickups Schema...'

-- Create pickups table
CREATE TABLE pickups (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id),
  collector_id uuid references profiles(id),
  address_id uuid references addresses(id),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  lat double precision,
  lng double precision,
  status text not null default 'submitted' check (status in ('submitted','approved','rejected')),
  approval_note text,
  total_kg numeric(10,3) default 0,
  total_value numeric(10,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes
CREATE INDEX idx_pickups_customer_id ON pickups(customer_id);
CREATE INDEX idx_pickups_collector_id ON pickups(collector_id);
CREATE INDEX idx_pickups_address_id ON pickups(address_id);
CREATE INDEX idx_pickups_status ON pickups(status);
CREATE INDEX idx_pickups_started_at ON pickups(started_at);
CREATE INDEX idx_pickups_submitted_at ON pickups(submitted_at);
CREATE INDEX idx_pickups_location ON pickups(lat, lng);

-- Create constraints
ALTER TABLE pickups ADD CONSTRAINT chk_pickups_positive_values 
  CHECK (total_kg >= 0 AND total_value >= 0);

-- Enable RLS
ALTER TABLE pickups ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view related pickups" ON pickups
  FOR SELECT USING (
    auth.uid() = customer_id OR 
    auth.uid() = collector_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Collectors can manage pickups" ON pickups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'collector'
    )
  );

CREATE POLICY "Collectors can update pickups" ON pickups
  FOR UPDATE USING (
    auth.uid() = collector_id
  );

CREATE POLICY "Admins can approve pickups" ON pickups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Additional customer read policy
CREATE POLICY "customer_read_pickups" ON pickups
  FOR SELECT USING (customer_id = auth.uid());

-- Additional collector policies
CREATE POLICY "collector_insert_pickups" ON pickups
  FOR INSERT WITH CHECK (auth_role() = 'collector' AND collector_id = auth.uid());

CREATE POLICY "collector_read_own_pickups" ON pickups
  FOR SELECT USING (collector_id = auth.uid());

-- Additional admin pickups policy
CREATE POLICY "admin_pickups" ON pickups
  FOR ALL USING (auth_role() = 'admin') WITH CHECK (auth_role() = 'admin');

-- Comprehensive admin view for pickup management
CREATE OR REPLACE VIEW public.pickup_admin_view AS
SELECT
  p.id AS pickup_id,
  cu.full_name AS customer_name,
  cu.email AS customer_email,
  co.full_name AS collector_name,
  p.status,
  p.started_at,
  p.submitted_at,
  SUM(pi.kilograms) AS total_kg,
  SUM(pi.kilograms * m.rate_per_kg) AS total_value,
  COUNT(DISTINCT ph.id) AS photo_count
FROM pickups p
LEFT JOIN profiles cu ON cu.id = p.customer_id
LEFT JOIN profiles co ON co.id = p.collector_id
LEFT JOIN pickup_items pi ON pi.pickup_id = p.id
LEFT JOIN materials m ON m.id = pi.material_id
LEFT JOIN pickup_photos ph ON ph.pickup_id = p.id
GROUP BY p.id, cu.full_name, cu.email, co.full_name;

-- Create trigger
CREATE TRIGGER update_pickups_updated_at 
  BEFORE UPDATE ON pickups 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

\echo '✓ Pickups Schema installed'

-- ============================================================================
-- STEP 5: PICKUP ITEMS
-- ============================================================================
\echo 'Installing Pickup Items Schema...'

-- Create pickup_items table
CREATE TABLE pickup_items (
  id uuid primary key default gen_random_uuid(),
  pickup_id uuid references pickups(id) on delete cascade,
  material_id uuid references materials(id),
  kilograms numeric(10,3) check (kilograms >= 0),
  contamination_pct numeric(5,2) check (contamination_pct between 0 and 100),
  notes text,
  created_at timestamptz default now()
);

-- Create indexes
CREATE INDEX idx_pickup_items_pickup_id ON pickup_items(pickup_id);
CREATE INDEX idx_pickup_items_material_id ON pickup_items(material_id);
CREATE INDEX idx_pickup_items_kilograms ON pickup_items(kilograms);

-- Create constraints
ALTER TABLE pickup_items ADD CONSTRAINT chk_pickup_items_positive_weight 
  CHECK (kilograms > 0);

-- Enable RLS
ALTER TABLE pickup_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view pickup items" ON pickup_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pickups 
      WHERE pickups.id = pickup_items.pickup_id
      AND (
        pickups.customer_id = auth.uid() OR 
        pickups.collector_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Collectors can add items" ON pickup_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pickups 
      WHERE pickups.id = pickup_items.pickup_id
      AND pickups.collector_id = auth.uid()
    )
  );

-- Additional collector items insert policy
CREATE POLICY "collector_items_insert" ON pickup_items
  FOR INSERT WITH CHECK (
    auth_role() = 'collector' AND
    pickup_id IN (SELECT id FROM pickups WHERE collector_id = auth.uid())
  );

-- Additional admin items policy
CREATE POLICY "admin_items" ON pickup_items
  FOR ALL USING (auth_role() = 'admin') WITH CHECK (auth_role() = 'admin');

-- Create automatic calculation function
CREATE OR REPLACE FUNCTION update_pickup_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE pickups 
    SET 
        total_kg = (
            SELECT COALESCE(SUM(kilograms), 0) 
            FROM pickup_items 
            WHERE pickup_id = COALESCE(NEW.pickup_id, OLD.pickup_id)
        ),
        total_value = (
            SELECT COALESCE(SUM(pi.kilograms * m.rate_per_kg), 0)
            FROM pickup_items pi
            JOIN materials m ON pi.material_id = m.id
            WHERE pi.pickup_id = COALESCE(NEW.pickup_id, OLD.pickup_id)
        )
    WHERE id = COALESCE(NEW.pickup_id, OLD.pickup_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_pickup_totals_insert
    AFTER INSERT ON pickup_items
    FOR EACH ROW
    EXECUTE FUNCTION update_pickup_totals();

CREATE TRIGGER trigger_update_pickup_totals_update
    AFTER UPDATE ON pickup_items
    FOR EACH ROW
    EXECUTE FUNCTION update_pickup_totals();

CREATE TRIGGER trigger_update_pickup_totals_delete
    AFTER DELETE ON pickup_items
    FOR EACH ROW
    EXECUTE FUNCTION update_pickup_totals();

\echo '✓ Pickup Items Schema installed'

-- ============================================================================
-- STEP 6: PHOTOS
-- ============================================================================
\echo 'Installing Photos Schema...'

-- Create pickup_photos table
CREATE TABLE pickup_photos (
  id uuid primary key default gen_random_uuid(),
  pickup_id uuid references pickups(id) on delete cascade,
  url text not null,
  taken_at timestamptz not null default now(),
  lat double precision,
  lng double precision,
  type text check (type in ('scale','bags','other')),
  description text,
  file_size integer,
  mime_type text,
  created_at timestamptz default now()
);

-- Create indexes
CREATE INDEX idx_pickup_photos_pickup_id ON pickup_photos(pickup_id);
CREATE INDEX idx_pickup_photos_type ON pickup_photos(type);
CREATE INDEX idx_pickup_photos_taken_at ON pickup_photos(taken_at);
CREATE INDEX idx_pickup_photos_location ON pickup_photos(lat, lng);

-- Create constraints
ALTER TABLE pickup_photos ADD CONSTRAINT chk_pickup_photos_valid_url 
  CHECK (url ~ '^https?://');

ALTER TABLE pickup_photos ADD CONSTRAINT chk_pickup_photos_file_size 
  CHECK (file_size > 0);

-- Enable RLS
ALTER TABLE pickup_photos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view pickup photos" ON pickup_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pickups 
      WHERE pickups.id = pickup_photos.pickup_id
      AND (
        pickups.customer_id = auth.uid() OR 
        pickups.collector_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Collectors can add photos" ON pickup_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pickups 
      WHERE pickups.id = pickup_photos.pickup_id
      AND pickups.collector_id = auth.uid()
    )
  );

-- Additional collector photos insert policy
CREATE POLICY "collector_photos_insert" ON pickup_photos
  FOR INSERT WITH CHECK (
    auth_role() = 'collector' AND
    pickup_id IN (SELECT id FROM pickups WHERE collector_id = auth.uid())
  );

-- Additional admin photos policy
CREATE POLICY "admin_photos" ON pickup_photos
  FOR ALL USING (auth_role() = 'admin') WITH CHECK (auth_role() = 'admin');

-- Create mime type function
CREATE OR REPLACE FUNCTION set_default_mime_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.mime_type IS NULL THEN
        CASE 
            WHEN NEW.url LIKE '%.jpg' OR NEW.url LIKE '%.jpeg' THEN
                NEW.mime_type := 'image/jpeg';
            WHEN NEW.url LIKE '%.png' THEN
                NEW.mime_type := 'image/png';
            WHEN NEW.url LIKE '%.gif' THEN
                NEW.mime_type := 'image/gif';
            WHEN NEW.url LIKE '%.webp' THEN
                NEW.mime_type := 'image/webp';
            ELSE
                NEW.mime_type := 'image/jpeg';
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_set_mime_type
    BEFORE INSERT ON pickup_photos
    FOR EACH ROW
    EXECUTE FUNCTION set_default_mime_type();

\echo '✓ Photos Schema installed'

-- ============================================================================
-- STEP 7: PAYMENTS
-- ============================================================================
\echo 'Installing Payments Schema...'

-- Create payments table
CREATE TABLE payments (
  id uuid primary key default gen_random_uuid(),
  pickup_id uuid unique references pickups(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'ZAR',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  processed_at timestamptz,
  method text check (method in ('wallet','bank_transfer','cash','mobile_money')),
  reference_number text,
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes
CREATE INDEX idx_payments_pickup_id ON payments(pickup_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_method ON payments(method);
CREATE INDEX idx_payments_processed_at ON payments(processed_at);
CREATE INDEX idx_payments_reference ON payments(reference_number);

-- Create constraints
ALTER TABLE payments ADD CONSTRAINT chk_payments_positive_amount 
  CHECK (amount > 0);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pickups 
      WHERE pickups.id = payments.pickup_id
      AND (
        pickups.customer_id = auth.uid() OR 
        pickups.collector_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Only admins can modify payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Additional admin policies
CREATE POLICY "admin_payments" ON payments
  FOR ALL USING (auth_role() = 'admin') WITH CHECK (auth_role() = 'admin');

-- Create automatic payment creation function
CREATE OR REPLACE FUNCTION create_payment_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        INSERT INTO payments (pickup_id, amount, currency, status, method)
        VALUES (NEW.id, NEW.total_value, 'ZAR', 'pending', 'wallet');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_create_payment_on_approval
    AFTER UPDATE ON pickups
    FOR EACH ROW
    EXECUTE FUNCTION create_payment_on_approval();

-- Create payment processing function
CREATE OR REPLACE FUNCTION update_payment_processed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        NEW.processed_at := now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_payment_processed_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_processed_at();

-- Create trigger
CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

\echo '✓ Payments Schema installed'

-- ============================================================================
-- STEP 8: VIEWS & SEED DATA
-- ============================================================================
\echo 'Installing Views & Seed Data...'

-- Include the complete views and seed data file
\i schemas/08-views-and-seed-data.sql

\echo '✓ Views & Seed Data installed'

-- ============================================================================
-- INSTALLATION COMPLETE
-- ============================================================================
\echo ''
\echo '🎉 DATABASE SCHEMA INSTALLATION COMPLETE! 🎉'
\echo ''
\echo 'Your recycling management system is now ready with:'
\echo '✅ User profiles with role-based access'
\echo '✅ Address management with geolocation'
\echo '✅ Materials with dynamic pricing'
\echo '✅ Pickup workflow management'
\echo '✅ Material tracking with contamination'
\echo '✅ Photo management with GPS'
\echo '✅ Payment processing automation'
\echo ''
\echo 'Next steps:'
\echo '1. Set up Supabase authentication'
\echo '2. Configure your environment variables'
\echo '3. Test the system with your application'
\echo ''
\echo 'For detailed setup instructions, see SUPABASE_SETUP.md'
