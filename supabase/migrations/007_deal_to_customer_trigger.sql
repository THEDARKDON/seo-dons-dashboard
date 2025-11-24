-- Migration: Auto-update customer status when deal is closed_won
-- This ensures customers are marked properly when deals are won

-- Add a function to check if customer should be marked as won
CREATE OR REPLACE FUNCTION update_customer_on_deal_won()
RETURNS TRIGGER AS $$
BEGIN
  -- If deal is being moved to closed_won
  IF NEW.stage = 'closed_won' AND (OLD.stage IS NULL OR OLD.stage != 'closed_won') THEN
    -- Update the customer status to 'active' if they exist
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE customers
      SET
        status = 'active',
        updated_at = NOW()
      WHERE id = NEW.customer_id;
    END IF;

    -- Set actual_close_date if not already set
    IF NEW.actual_close_date IS NULL THEN
      NEW.actual_close_date = CURRENT_DATE;
    END IF;
  END IF;

  -- If deal is being moved to closed_lost
  IF NEW.stage = 'closed_lost' AND (OLD.stage IS NULL OR OLD.stage != 'closed_lost') THEN
    -- Set actual_close_date if not already set
    IF NEW.actual_close_date IS NULL THEN
      NEW.actual_close_date = CURRENT_DATE;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for deal updates
DROP TRIGGER IF EXISTS trigger_deal_status_change ON deals;
CREATE TRIGGER trigger_deal_status_change
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_on_deal_won();

-- Add stage_position for Kanban ordering within stages
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS stage_position INTEGER DEFAULT 0;

-- Create index for efficient pipeline queries
CREATE INDEX IF NOT EXISTS idx_deals_stage_position ON deals(stage, stage_position);
