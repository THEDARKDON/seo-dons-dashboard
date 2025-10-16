-- Migration: Expand customers table with additional fields
-- This adds all the fields that the customer form expects

-- Add new columns to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('active', 'inactive', 'prospect', 'lead')) DEFAULT 'active';

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- Create index on company for faster searching
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company);

-- Create index on industry for analytics
CREATE INDEX IF NOT EXISTS idx_customers_industry ON customers(industry);
