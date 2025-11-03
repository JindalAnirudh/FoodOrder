package com.foodapp.food_ordering_backend.controller;

import com.foodapp.food_ordering_backend.dto.OrderRequest;
import com.foodapp.food_ordering_backend.dto.OrderResponse;
//import com.foodapp.food_ordering_backend.model.Order;
import com.foodapp.food_ordering_backend.model.OrderItem;
import com.foodapp.food_ordering_backend.service.OrderService;
import jakarta.persistence.GeneratedValue;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")

public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    //Get all orders as DTOs
    @GetMapping
//    public List<Order> getAllOrders() {
//        return orderService.getAllOrders();
//    }

    public List<OrderResponse> getAllOrders() {
        return orderService.getAllOrders();
    }


    @GetMapping("/{id}")
//    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
//        return orderService.getOrderById(id)
//                .map(ResponseEntity::ok)
//                .orElse(ResponseEntity.notFound().build());
//    }

    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        return orderService.getOrderById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


    //  Create a new order (rarely used directly, checkout is preferred)

    @PostMapping
//    public ResponseEntity<Order> createOrder(@RequestBody Order order) {
//        Order saved = orderService.createOrder(order);
//        return ResponseEntity.ok(saved);
//    }

    public ResponseEntity<OrderResponse> createOrder(@RequestBody com.foodapp.food_ordering_backend.model.Order order) {
        return ResponseEntity.ok(orderService.createOrder(order));
    }


    //Update Order status
    @PutMapping("/{id}")
//    public ResponseEntity<Order> updateOrder(@PathVariable Long id,@RequestBody Order updateOrder) {
//        try{
//            return ResponseEntity.ok(orderService.updateOrder(id, updateOrder));
//        }
//        catch (RuntimeException e) {
//            return ResponseEntity.notFound().build();
//        }
//    }

    public ResponseEntity<OrderResponse> updateOrder(@PathVariable Long id, @RequestBody com.foodapp.food_ordering_backend.model.Order updateOrder) {
        try {
            return ResponseEntity.ok(orderService.updateOrder(id, updateOrder));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }


    //Delete Order
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }

    //  Checkout (main order flow with items + DTO response)
    @PostMapping("/checkout")
    public ResponseEntity<OrderResponse> checkoutOrder(@RequestBody OrderRequest orderRequest) {
        return ResponseEntity.ok(orderService.checkoutOrder(orderRequest));
    }
}
