package com.foodapp.food_ordering_backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

// @Component - Migration completed, disabled to avoid running on every startup
public class DatabaseMigration implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            // Check if foreign key constraint exists and drop it
            dropForeignKeyConstraintIfExists();
            
            // Ensure food detail columns exist
            addFoodDetailColumns();
            
            // Update existing order items with food details
            updateExistingOrderItems();
            
            System.out.println("Database migration completed successfully!");
        } catch (Exception e) {
            System.err.println("Database migration failed: " + e.getMessage());
        }
    }

    private void dropForeignKeyConstraintIfExists() {
        try {
            // First set food_id to NULL to avoid constraint errors
            jdbcTemplate.update("UPDATE order_item SET food_id = NULL WHERE food_id IS NOT NULL");
            
            // Drop the foreign key constraint
            jdbcTemplate.execute("ALTER TABLE order_item DROP FOREIGN KEY FK4fcv9bk14o2k04wghr09jmy3b");
            System.out.println("Foreign key constraint dropped successfully");
        } catch (DataAccessException e) {
            System.out.println("Foreign key constraint might not exist or already dropped: " + e.getMessage());
        }
    }

    private void addFoodDetailColumns() {
        try {
            // Add food detail columns if they don't exist
            jdbcTemplate.execute("ALTER TABLE order_item ADD COLUMN IF NOT EXISTS food_name VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE order_item ADD COLUMN IF NOT EXISTS food_description TEXT");
            jdbcTemplate.execute("ALTER TABLE order_item ADD COLUMN IF NOT EXISTS food_price DOUBLE");
            System.out.println("Food detail columns added successfully");
        } catch (DataAccessException e) {
            System.out.println("Food detail columns might already exist: " + e.getMessage());
        }
    }

    private void updateExistingOrderItems() {
        try {
            // Update existing order items to populate food details from current food items
            int updated = jdbcTemplate.update(
                "UPDATE order_item oi JOIN food f ON oi.food_id = f.id " +
                "SET oi.food_name = f.name, oi.food_description = f.description, oi.food_price = f.price " +
                "WHERE oi.food_name IS NULL"
            );
            System.out.println("Updated " + updated + " order items with food details");
            
            // Now set food_id back for existing records (maintaining the relationship but without constraint)
            int restored = jdbcTemplate.update(
                "UPDATE order_item oi JOIN food f ON oi.food_name = f.name AND oi.food_price = f.price " +
                "SET oi.food_id = f.id WHERE oi.food_id IS NULL"
            );
            System.out.println("Restored food_id for " + restored + " order items");
        } catch (DataAccessException e) {
            System.out.println("Error updating existing order items: " + e.getMessage());
        }
    }
}
