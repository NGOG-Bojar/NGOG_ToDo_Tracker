/*
  # Default Event Checklist Setup

  1. Function to create standard event checklist
    - Creates the default checklist items for events
    - Matches the current application's checklist structure

  2. Trigger to auto-populate checklist for new events
    - Ensures all events have the standard checklist items
    - Maintains consistency with current application behavior
*/

-- Function to create default event checklist
CREATE OR REPLACE FUNCTION create_default_event_checklist()
RETURNS JSONB AS $$
BEGIN
  RETURN '[
    {"id": "registration", "label": "Registration completed", "completed": false},
    {"id": "invoice_received", "label": "Invoice received", "completed": false},
    {"id": "invoice_paid", "label": "Invoice paid", "completed": false},
    {"id": "hotel_booked", "label": "Hotel booked", "completed": false},
    {"id": "rental_car_booked", "label": "Rental car booked", "completed": false},
    {"id": "insurance_arranged", "label": "Insurance arranged", "completed": false}
  ]'::JSONB;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure event has default checklist
CREATE OR REPLACE FUNCTION ensure_event_checklist()
RETURNS TRIGGER AS $$
BEGIN
  -- If checklist is empty or null, set default checklist
  IF NEW.checklist IS NULL OR NEW.checklist = '[]'::JSONB THEN
    NEW.checklist = create_default_event_checklist();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-populate checklist for new events
CREATE TRIGGER ensure_event_checklist_trigger
  BEFORE INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION ensure_event_checklist();

-- Function to toggle checklist item completion
CREATE OR REPLACE FUNCTION toggle_event_checklist_item(
  event_uuid UUID, 
  item_id TEXT
)
RETURNS VOID AS $$
DECLARE
  current_checklist JSONB;
  updated_checklist JSONB;
  item JSONB;
BEGIN
  -- Get current checklist
  SELECT checklist INTO current_checklist 
  FROM events 
  WHERE id = event_uuid AND user_id = auth.uid();
  
  -- Update the specific item
  SELECT jsonb_agg(
    CASE 
      WHEN item->>'id' = item_id THEN 
        jsonb_set(item, '{completed}', (NOT (item->>'completed')::boolean)::text::jsonb)
      ELSE item
    END
  ) INTO updated_checklist
  FROM jsonb_array_elements(current_checklist) AS item;
  
  -- Update the event
  UPDATE events 
  SET checklist = updated_checklist 
  WHERE id = event_uuid AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;