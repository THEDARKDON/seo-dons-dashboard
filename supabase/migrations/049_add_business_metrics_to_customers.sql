-- Add business metrics to customers table for accurate ROI calculations
-- These help Claude generate realistic revenue projections

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS average_deal_size DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS profit_per_deal DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,2);

-- Add comments explaining each field
COMMENT ON COLUMN customers.average_deal_size IS 'Average transaction value in GBP (e.g., 1200.00 for £1,200 average sale)';
COMMENT ON COLUMN customers.profit_per_deal IS 'Profit margin per deal in GBP (e.g., 400.00 for £400 profit per sale)';
COMMENT ON COLUMN customers.conversion_rate IS 'Website conversion rate as percentage (e.g., 3.50 for 3.5% conversion rate from visitors to leads/sales)';

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 049: Added business metrics columns to customers table';
  RAISE NOTICE 'Fields: average_deal_size, profit_per_deal, conversion_rate';
  RAISE NOTICE 'These enable Claude to calculate accurate ROI projections based on real business metrics';
END $$;
