package com.foodapp.food_ordering_backend.dto;

import java.util.List;

public class OrderRequest {

    private String customerName;
    private List<OrderItemRequest> items;

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public List<OrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<OrderItemRequest> items) {
        this.items = items;
    }

    //Nested DTO for order items
    public static class OrderItemRequest {
        private Long foodId;
        private int quantity;

        public Long getFoodId() {
            return foodId;
        }
        public void setFoodId(Long foodId) {
            this.foodId = foodId;
        }

        public int getQuantity() {
            return quantity;
        }

        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }
    }
}
