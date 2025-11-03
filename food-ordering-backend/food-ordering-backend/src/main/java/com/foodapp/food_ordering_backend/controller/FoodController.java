package com.foodapp.food_ordering_backend.controller;

import com.foodapp.food_ordering_backend.config.JwtUtil;
import com.foodapp.food_ordering_backend.model.Food;
import com.foodapp.food_ordering_backend.model.OrderStatus;
import com.foodapp.food_ordering_backend.model.User;
import com.foodapp.food_ordering_backend.repository.FoodRepository;
import com.foodapp.food_ordering_backend.repository.OrderItemRepository;
import com.foodapp.food_ordering_backend.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.Arrays;

@RestController
@RequestMapping("/foods")

public class FoodController {

    @Autowired
    private FoodRepository foodRepository;
    
    @Autowired
    private OrderItemRepository orderItemRepository;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private UserRepository userRepository;

    // Helper method to validate admin access
    private ResponseEntity<?> validateAdminAccess(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Authorization header required"));
        }
        
        try {
            String token = authHeader.substring(7);
            String username = jwtUtil.extractUsername(token);
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            if (!"ADMIN".equals(user.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required to manage menu items"));
            }
            
            return null; // Valid admin access
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid or expired token"));
        }
    }

    //Add a new food item - ADMIN ONLY
    @PostMapping
    public ResponseEntity<?> addFood(@Valid @RequestBody Food food, @RequestHeader("Authorization") String authHeader) {
        ResponseEntity<?> authCheck = validateAdminAccess(authHeader);
        if (authCheck != null) return authCheck;
        
        Food saved = foodRepository.save(food);
        return ResponseEntity.ok(saved);
    }

    // Get all food items
    @GetMapping
    public List<Food> getAllFoods() {
        return foodRepository.findAll();
    }

    //Get food by id
    @GetMapping("/{id}")
    public Food getFoodById(@PathVariable Long id) {
        return foodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Food not found with id " + id));
    }
    
    // Check if a food can be deleted (no active orders)
    @GetMapping("/{id}/can-delete")
    public ResponseEntity<Map<String, Object>> canDeleteFood(@PathVariable Long id) {
        if (!foodRepository.existsById(id)) {
            Map<String, Object> response = new HashMap<>();
            response.put("canDelete", false);
            response.put("reason", "Food not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        
        List<OrderStatus> activeStatuses = Arrays.asList(OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING);
        boolean hasActiveOrders = orderItemRepository.existsByFoodIdAndOrderActive(id, activeStatuses);
        boolean hasAnyOrders = orderItemRepository.existsByFoodId(id);
        
        Map<String, Object> response = new HashMap<>();
        response.put("canDelete", !hasActiveOrders);
        response.put("hasAnyOrders", hasAnyOrders);
        response.put("hasActiveOrders", hasActiveOrders);
        
        if (hasActiveOrders) {
            response.put("reason", "Has pending or active orders (PENDING, CONFIRMED, or PREPARING)");
        } else if (hasAnyOrders) {
            response.put("reason", "All orders are delivered/cancelled - safe to delete");
        } else {
            response.put("reason", "No orders found - safe to delete");
        }
        
        return ResponseEntity.ok(response);
    }
    
    // Debug endpoint to check order statuses for a food item
    @GetMapping("/{id}/order-status")
    public ResponseEntity<Map<String, Object>> getFoodOrderStatus(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        
        // Get all order items for this food
        var allOrderItems = orderItemRepository.findAll().stream()
            .filter(oi -> oi.getFood().getId().equals(id))
            .map(oi -> Map.of(
                "orderId", oi.getOrder().getId(),
                "status", oi.getOrder().getStatus().toString(),
                "customerName", oi.getOrder().getCustomerName()
            ))
            .toList();
            
        response.put("foodId", id);
        response.put("totalOrderItems", allOrderItems.size());
        response.put("orderItems", allOrderItems);
        
        return ResponseEntity.ok(response);
    }

    //Update - update food by ID - ADMIN ONLY
    @PutMapping("/{id}")
    public ResponseEntity<?> updateFood(@PathVariable Long id, @Valid @RequestBody Food updatedFood, 
                                        @RequestHeader("Authorization") String authHeader) {
        ResponseEntity<?> authCheck = validateAdminAccess(authHeader);
        if (authCheck != null) return authCheck;
        
        Optional<Food> foodOpt = foodRepository.findById(id);
        if (foodOpt.isPresent()) {
            Food food = foodOpt.get();
            food.setName(updatedFood.getName());
            food.setPrice(updatedFood.getPrice());
            food.setDescription(updatedFood.getDescription());
            Food saved = foodRepository.save(food);
            return ResponseEntity.ok(saved);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Food not found with id " + id));
        }
    }

    // Delete - delete food by id - ADMIN ONLY
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFood(@PathVariable Long id, @RequestHeader("Authorization") String authHeader) {
        ResponseEntity<?> authCheck = validateAdminAccess(authHeader);
        if (authCheck != null) return authCheck;
        if(!foodRepository.existsById(id)) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Food not found with id " + id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
        
        // Check if food is used in any active (non-delivered) orders
        Optional<Food> food = foodRepository.findById(id);
        if (food.isPresent()) {
            // Check if there are any active orders (not delivered or cancelled)
            List<OrderStatus> activeStatuses = Arrays.asList(OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING);
            boolean hasActiveOrders = orderItemRepository.existsByFoodIdAndOrderActive(id, activeStatuses);
            
            if (hasActiveOrders) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Cannot delete '" + food.get().getName() + 
                    "' because it has pending or active orders (PENDING, CONFIRMED, or PREPARING). " +
                    "Please wait until all orders are delivered or cancelled before deleting this item.");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
            }
            
            // If no active orders, we need to handle the foreign key constraint
            // by either cascading the delete or allowing deletion despite references
            try {
                foodRepository.deleteById(id);
                Map<String, String> response = new HashMap<>();
                response.put("message", "Food '" + food.get().getName() + "' deleted successfully");
                return ResponseEntity.ok(response);
            } catch (DataIntegrityViolationException e) {
                // This means there are still references, but they should be from delivered orders
                // Let's provide a more specific error message
                Map<String, String> error = new HashMap<>();
                error.put("error", "Cannot delete '" + food.get().getName() + 
                    "' due to database constraints. This might be because the item is referenced in delivered orders. " +
                    "Contact administrator to resolve this issue.");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
            }
        }
        
        Map<String, String> error = new HashMap<>();
        error.put("error", "Unexpected error occurred");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }


}
