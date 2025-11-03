-- Migration 040: Fix deal creation trigger that references non-existent contact_name field
-- The auto_create_customer_from_deal trigger tries to access NEW.contact_name
-- which doesn't exist in the deals table, causing all deal creations to fail

-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS trigger_auto_create_customer_from_deal ON deals;
DROP FUNCTION IF EXISTS auto_create_customer_from_deal();

-- Create a simpler version that doesn't rely on contact_name fields
-- This version only auto-creates customers from leads if a lead_id is provided
CREATE OR REPLACE FUNCTION auto_create_customer_from_deal()
RETURNS TRIGGER AS $$
DECLARE
    new_customer_id UUID;
    lead_data RECORD;
BEGIN
    -- Only proceed if no customer_id is provided AND a lead_id exists
    IF NEW.customer_id IS NULL AND NEW.lead_id IS NOT NULL THEN
        -- Get lead data
        SELECT * INTO lead_data
        FROM leads
        WHERE id = NEW.lead_id;

        -- Only create customer if lead exists
        IF lead_data.id IS NOT NULL THEN
            -- Create customer from lead data
            INSERT INTO customers (
                first_name,
                last_name,
                email,
                phone_number,
                company,
                industry,
                company_size,
                assigned_to,
                created_at,
                updated_at
            ) VALUES (
                lead_data.first_name,
                lead_data.last_name,
                lead_data.email,
                COALESCE(lead_data.phone, lead_data.phone_secondary),
                lead_data.company,
                lead_data.industry,
                lead_data.company_size,
                NEW.assigned_to,
                NOW(),
                NOW()
            )
            RETURNING id INTO new_customer_id;

            -- Update the deal with the new customer_id
            NEW.customer_id = new_customer_id;

            -- Update lead status to 'converted'
            UPDATE leads
            SET
                status = 'converted',
                updated_at = NOW()
            WHERE id = NEW.lead_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER trigger_auto_create_customer_from_deal
    BEFORE INSERT ON deals
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_customer_from_deal();

-- Add comment
COMMENT ON FUNCTION auto_create_customer_from_deal() IS 'Auto-creates customer from lead when deal is created with lead_id but no customer_id';
