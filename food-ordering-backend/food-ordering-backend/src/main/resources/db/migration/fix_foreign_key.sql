-- Drop the foreign key constraint that prevents food deletion
-- This allows food items to be deleted while preserving order history

-- First, set food_id to NULL for all existing order items to avoid constraint errors
UPDATE order_item SET food_id = NULL WHERE food_id IS NOT NULL;

-- Drop the foreign key constraint
ALTER TABLE order_item DROP FOREIGN KEY FK4fcv9bk14o2k04wghr09jmy3b;

-- Add food detail columns if they don't exist (for safety)
ALTER TABLE order_item 
ADD COLUMN IF NOT EXISTS food_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS food_description TEXT,
ADD COLUMN IF NOT EXISTS food_price DOUBLE;

-- Update existing order items to populate food details from current food items
UPDATE order_item oi 
JOIN food f ON oi.food_id = f.id 
SET oi.food_name = f.name, 
    oi.food_description = f.description, 
    oi.food_price = f.price
WHERE oi.food_name IS NULL;

-- Now set food_id back for existing records (maintaining the relationship but without constraint)
UPDATE order_item oi 
JOIN food f ON oi.food_name = f.name AND oi.food_price = f.price
SET oi.food_id = f.id 
WHERE oi.food_id IS NULL;
