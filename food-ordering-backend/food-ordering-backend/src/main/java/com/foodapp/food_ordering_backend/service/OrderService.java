package com.foodapp.food_ordering_backend.service;


import com.foodapp.food_ordering_backend.dto.OrderRequest;
import com.foodapp.food_ordering_backend.dto.OrderResponse;
import com.foodapp.food_ordering_backend.model.*;
import com.foodapp.food_ordering_backend.repository.FoodRepository;
import com.foodapp.food_ordering_backend.repository.OrderRepository;
import com.foodapp.food_ordering_backend.repository.OrderItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final FoodRepository foodRepository;

    public OrderService(OrderRepository orderRepository, OrderItemRepository orderItemRepository, FoodRepository foodRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.foodRepository = foodRepository;
    }

    /**
     * Checkout flow: create a new order with items and return a response DTO
     */
    @Transactional
    public OrderResponse checkoutOrder(OrderRequest orderRequest) {
        //Create new Order
        Order order = new Order();
        order.setCustomerName(orderRequest.getCustomerName());
        order.setStatus(OrderStatus.PENDING);
        order = orderRepository.save(order);

        //make a final reference for lambda
        final Order savedOrder = order;


        //Convert each item request into OrderItem
        List<OrderItem> orderItems = orderRequest.getItems().stream().map(itemReq -> {
            Food food = foodRepository.findById(itemReq.getFoodId())
                    .orElseThrow(() -> new RuntimeException("Food not found with id: " + itemReq.getFoodId()));

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setFood(food); // This will also set foodId and food details
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setPrice(food.getPrice() * itemReq.getQuantity());

            return orderItem;
        }).collect(Collectors.toList());

        //Save all order Items
        orderItemRepository.saveAll(orderItems);

        //Calculate total price
        double total = orderItems.stream().mapToDouble(OrderItem::getPrice).sum();
        order.setTotalPrice(total);
        orderRepository.save(order);

        return mapToResponse(order, orderItems);
    }
    /**
     * Return all orders as DTO
     */

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll()
                .stream()
                .map(order -> mapToResponse(order, order.getItems()))
                .collect(Collectors.toList());

    }

    public Optional<OrderResponse> getOrderById(Long id) {
        return orderRepository.findById(id)
                .map(order -> mapToResponse(order, order.getItems()));
    }

    public OrderResponse createOrder(Order order) {
        Order saved = orderRepository.save(order);
        return mapToResponse(saved, saved.getItems());
    }

    public OrderResponse updateOrder(Long id, Order updatedOrder) {
        return orderRepository.findById(id).map(order -> {
            order.setStatus(updatedOrder.getStatus());
            Order saved = orderRepository.save(order);
            return mapToResponse(saved, saved.getItems());
        }).orElseThrow(() -> new RuntimeException("Order not found"));
    }

    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }
    /**
     * Helper method: convert Order + OrderItems → DTO
     */

    private OrderResponse mapToResponse(Order order, List<OrderItem> items) {
        OrderResponse response = new OrderResponse();
        response.setOrderId(order.getId());
        response.setCustomerName(order.getCustomerName());
        response.setStatus(order.getStatus().name());
        response.setTotalPrice(order.getTotalPrice());
        response.setItems(items.stream().map(oi -> {
            OrderResponse.OrderItemResponse resp = new OrderResponse.OrderItemResponse();
            resp.setFoodName(oi.getFoodName()); // Use stored food name (works even if food is deleted)
            resp.setQuantity(oi.getQuantity());
            resp.setPrice(oi.getPrice());
            return resp;
        }).collect(Collectors.toList()));
        return response;
    }

//
//        //Build Response
//        OrderResponse response = new OrderResponse();
//        response.setOrderId(order.getId());
//        response.setStatus(order.getStatus().name());
//        response.setTotalPrice(order.getTotalPrice());
//        response.setItems(orderItems.stream().map(oi -> {
//            OrderResponse.OrderItemResponse resp = new OrderResponse.OrderItemResponse();
//            resp.setFoodName(oi.getFood().getName());
//            resp.setQuantity(oi.getQuantity());
//            resp.setPrice(oi.getPrice());
//            return resp;
//        }).collect(Collectors.toList()));
//
//        return response;
//    }
//    /**
//     * CRUD-style methods (useful for admin or debugging)
//     */
//
//    public List<Order> getAllOrders() {
//        return orderRepository.findAll();
//    }
//
//    public Optional<Order> getOrderById(Long id) {
//        return orderRepository.findById(id);
//    }
//
//    public Order createOrder(Order order) {
//        return orderRepository.save(order);
//    }
//
//    public Order updateOrder(Long id, Order updatedOrder) {
//        return orderRepository.findById(id).map(order -> {
//            order.setStatus(updatedOrder.getStatus());
//            return orderRepository.save(order);
//        }).orElseThrow(() -> new RuntimeException("Order not found"));
//    }
//
//    public void deleteOrder(Long id) {
//        orderRepository.deleteById(id);
//    }




}
