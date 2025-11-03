package com.foodapp.food_ordering_backend.repository;

import com.foodapp.food_ordering_backend.model.OrderItem;
import com.foodapp.food_ordering_backend.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    

    
    // Check if a food item exists in any order (simple approach)
    @Query("SELECT COUNT(oi) > 0 FROM OrderItem oi WHERE oi.foodId = :foodId")
    boolean existsByFoodId(@Param("foodId") Long foodId);
    
    // Check if a food item exists in any NON-DELIVERED orders (active orders)
    @Query("SELECT COUNT(oi) > 0 FROM OrderItem oi WHERE oi.foodId = :foodId AND oi.order.status != :deliveredStatus")
    boolean existsByFoodIdAndOrderNotDelivered(@Param("foodId") Long foodId, @Param("deliveredStatus") OrderStatus deliveredStatus);
    
    // Check if a food item exists in any pending/active orders (not delivered or cancelled)
    @Query("SELECT CASE WHEN COUNT(oi) > 0 THEN true ELSE false END FROM OrderItem oi WHERE oi.foodId = :foodId AND oi.order.status IN (:activeStatuses)")
    boolean existsByFoodIdAndOrderActive(@Param("foodId") Long foodId, @Param("activeStatuses") java.util.List<OrderStatus> activeStatuses);
}