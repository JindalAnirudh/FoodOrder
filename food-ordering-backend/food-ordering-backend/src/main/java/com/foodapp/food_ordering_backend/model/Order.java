package com.foodapp.food_ordering_backend.model;

import com.foodapp.food_ordering_backend.model.OrderStatus;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "orders") // avoid conflict with SQL keyword "order"

public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customerName;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.PENDING;

    private double totalPrice; // Total price in Indian Rupees (₹)

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)

    private List<OrderItem> items;

    //Constructors
    public Order() {
    }

    public Order(String customerName, OrderStatus status, double totalPrice) {
        this.customerName = customerName;
        this.status = status;
        this.totalPrice = totalPrice;
    }

    //Getters & Setters
    public Long getId() {
        return id;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public double getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(double totalPrice) {
        this.totalPrice = totalPrice;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public void setItems(List<OrderItem> items) {
        this.items = items;
    }
}
