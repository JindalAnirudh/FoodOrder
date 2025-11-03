package com.foodapp.food_ordering_backend.config;

import com.foodapp.food_ordering_backend.model.Food;
import com.foodapp.food_ordering_backend.model.User;
import com.foodapp.food_ordering_backend.repository.FoodRepository;
import com.foodapp.food_ordering_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private FoodRepository foodRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Force reload professional menu - clear existing food data
        foodRepository.deleteAll();
        
        // Initialize with professional menu - categorized food items (prices in Indian Rupees)
        
        // Main Course
        foodRepository.save(new Food("Butter Chicken", 349.00, "Tender chicken in rich tomato and butter curry sauce", "main-course"));
        foodRepository.save(new Food("Tandoori Chicken", 459.00, "Marinated chicken grilled in traditional tandoor oven", "main-course"));
        foodRepository.save(new Food("Fish Curry", 359.00, "Fresh fish cooked in coconut and spice curry", "main-course"));
        foodRepository.save(new Food("Lamb Rogan Josh", 429.00, "Slow-cooked lamb in aromatic Kashmiri spices", "main-course"));
        foodRepository.save(new Food("Classic Burger", 299.00, "Juicy beef patty with lettuce, tomato, onion, and special sauce", "main-course"));
        foodRepository.save(new Food("Margherita Pizza", 399.00, "Fresh mozzarella, tomato sauce, and basil on thin crust", "main-course"));
        foodRepository.save(new Food("BBQ Ribs", 499.00, "Slow-cooked pork ribs with smoky BBQ sauce", "main-course"));
        foodRepository.save(new Food("Grilled Salmon", 549.00, "Fresh Atlantic salmon with herbs and lemon", "main-course"));
            
            // Rice Dishes
            foodRepository.save(new Food("Chicken Biryani", 389.00, "Aromatic basmati rice with spiced chicken and saffron", "rice-dishes"));
            foodRepository.save(new Food("Mutton Biryani", 449.00, "Fragrant basmati rice with tender mutton pieces", "rice-dishes"));
            foodRepository.save(new Food("Vegetable Biryani", 299.00, "Mixed vegetables with basmati rice and aromatic spices", "rice-dishes"));
            foodRepository.save(new Food("Hyderabadi Dum Biryani", 529.00, "Royal style slow-cooked biryani with authentic spices", "rice-dishes"));
            foodRepository.save(new Food("Rajma Rice", 199.00, "Kidney bean curry served with steamed basmati rice", "rice-dishes"));
            
            // Curries & Gravies
            foodRepository.save(new Food("Dal Makhani", 259.00, "Rich black lentils cooked in butter and cream", "curries"));
            foodRepository.save(new Food("Palak Paneer", 279.00, "Cottage cheese cubes in creamy spinach curry", "curries"));
            foodRepository.save(new Food("Aloo Gobi", 189.00, "Dry curry of potatoes and cauliflower with spices", "curries"));
            foodRepository.save(new Food("Paneer Butter Masala", 319.00, "Cottage cheese in rich tomato-based gravy", "curries"));
            foodRepository.save(new Food("Chole Bhature", 179.00, "Spicy chickpeas with fluffy fried bread", "curries"));
            
            // Appetizers
            foodRepository.save(new Food("Paneer Tikka", 299.00, "Grilled cottage cheese cubes with Indian spices", "appetizers"));
            foodRepository.save(new Food("Chicken Wings", 279.00, "Spicy buffalo wings served with blue cheese dip", "appetizers"));
            foodRepository.save(new Food("Samosa (4 pcs)", 119.00, "Crispy triangular pastry with spiced potato filling", "appetizers"));
            foodRepository.save(new Food("Spring Rolls (6 pcs)", 159.00, "Crispy vegetable spring rolls with sweet chili sauce", "appetizers"));
            foodRepository.save(new Food("Chicken Caesar Salad", 249.00, "Crisp romaine lettuce with grilled chicken and parmesan", "appetizers"));
            foodRepository.save(new Food("Masala Dosa", 149.00, "Crispy crepe with spiced potato filling", "appetizers"));
            
            // Beverages
            foodRepository.save(new Food("Fresh Lime Soda", 79.00, "Refreshing lime drink with mint and soda", "beverages"));
            foodRepository.save(new Food("Mango Lassi", 89.00, "Sweet yogurt drink with fresh mango", "beverages"));
            foodRepository.save(new Food("Masala Chai", 49.00, "Traditional spiced tea with milk", "beverages"));
            foodRepository.save(new Food("Cold Coffee", 99.00, "Iced coffee with milk and ice cream", "beverages"));
            foodRepository.save(new Food("Fresh Juice", 79.00, "Seasonal fresh fruit juice", "beverages"));
            
            // Desserts
            foodRepository.save(new Food("Gulab Jamun (4 pcs)", 129.00, "Sweet milk dumplings in sugar syrup", "desserts"));
            foodRepository.save(new Food("Chocolate Brownie", 149.00, "Rich chocolate brownie with vanilla ice cream", "desserts"));
            foodRepository.save(new Food("Ras Malai (3 pcs)", 159.00, "Soft cottage cheese dumplings in sweetened milk", "desserts"));
            foodRepository.save(new Food("Ice Cream Sundae", 119.00, "Three scoops with chocolate sauce and nuts", "desserts"));
            foodRepository.save(new Food("Kulfi Falooda", 139.00, "Traditional ice cream with vermicelli and rose syrup", "desserts"));
            
            System.out.println("Professional menu initialized successfully with 32+ categorized dishes!");
        
        // Create default admin user if no admin exists
        if (userRepository.findByRole("ADMIN").isEmpty()) {
            User adminUser = new User();
            adminUser.setUsername("admin");
            adminUser.setEmail("admin@foodorder.com");
            adminUser.setPassword(passwordEncoder.encode("admin123"));
            adminUser.setRole("ADMIN");
            
            userRepository.save(adminUser);
            System.out.println("✅ Default admin user created successfully!");
            System.out.println("📋 Admin Credentials:");
            System.out.println("   Username: admin");
            System.out.println("   Password: admin123");
            System.out.println("   Email: admin@foodorder.com");
            System.out.println("🔒 Please change these credentials after first login!");
        } else {
            System.out.println("ℹ️  Admin user already exists, skipping creation.");
        }
    }
}
