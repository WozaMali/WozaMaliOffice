-- Idempotent schema additions for scholars and disbursements used by Office App Green Scholar Fund page

do $$ begin
  if not exists (
    select 1 from information_schema.tables where table_schema='public' and table_name='scholars'
  ) then
    create table public.scholars (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      school text,
      grade text,
      region text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  end if;
exception when others then
  perform 1;
end $$;

do $$ begin
  if not exists (
    select 1 from information_schema.tables where table_schema='public' and table_name='green_scholar_disbursements'
  ) then
    create table public.green_scholar_disbursements (
      id uuid primary key default gen_random_uuid(),
      scholar_id uuid not null,
      amount numeric(12,2) not null check (amount >= 0),
      purpose text,
      created_at timestamptz not null default now()
    );
  end if;
exception when others then
  perform 1;
end $$;

-- Optional helper view join
create or replace view public.green_scholar_disbursements_view as
select d.*, s.name as scholar_name
from public.green_scholar_disbursements d
left join public.scholars s on s.id = d.scholar_id;

-- Template for adding schools
-- Replace the placeholder values with actual school information

-- Example structure (DO NOT RUN - this is just a template):
/*
INSERT INTO schools (
    name,
    school_code,
    address,
    city,
    province,
    contact_person,
    contact_phone,
    contact_email,
    school_type,
    student_count,
    is_active
) VALUES (
    'School Name Here',
    'SCH001',
    'School Address',
    'City',
    'Province',
    'Contact Person Name',
    'Phone Number',
    'email@school.com',
    'primary', -- or 'secondary', 'combined', 'special_needs'
    500, -- student count
    true
);
*/

-- To add a school, use this format:
-- INSERT INTO schools (name, school_code, address, city, province, contact_person, contact_phone, contact_email, school_type, student_count, is_active) VALUES ('Your School Name', 'SCH001', 'Address', 'City', 'Province', 'Contact', 'Phone', 'email@school.com', 'primary', 100, true);
