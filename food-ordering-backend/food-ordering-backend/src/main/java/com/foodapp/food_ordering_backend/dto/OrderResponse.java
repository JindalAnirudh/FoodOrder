package com.foodapp.food_ordering_backend.dto;

import java.util.List;

public class OrderResponse {
    private Long orderId;
    private String customerName;
    private String status;
    private double totalPrice; // Total price in Indian Rupees (₹)
    private List<OrderItemResponse> items;

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public double getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(double totalPrice) {
        this.totalPrice = totalPrice;
    }

    public List<OrderItemResponse> getItems() {
        return items;
    }

    public void setItems(List<OrderItemResponse> items) {
        this.items = items;
    }

    //Nested DTO for order item response
    public static class OrderItemResponse {
        private String foodName;
        private int quantity;
        private double price; // Price in Indian Rupees (₹)

        public String getFoodName() {
            return  foodName;
        }

        public void setFoodName(String foodName) {
            this.foodName = foodName;
        }

        public int getQuantity() {
            return quantity;
        }
        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }

        public double getPrice() {
            return price;
        }
        public void setPrice(double price) {
            this.price = price;
        }


    }

}
