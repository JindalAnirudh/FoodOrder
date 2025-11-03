package com.foodapp.food_ordering_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;


@Entity

public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int quantity;

    private double price; // calculated = food.price * quantity (in Indian Rupees ₹)

    // Store food details for order history (in case food item is deleted)
    private String foodName;
    private String foodDescription;
    private double foodPrice; // Original price per unit

    @Column(name = "food_id", nullable = true)
    private Long foodId; // Store just the ID instead of full relationship

    @Transient
    private Food food; // Temporary field for compatibility

    @ManyToOne
    @JoinColumn(name = "order_id")
//    @JsonIgnore
    private Order order;

    //Constructors
    public OrderItem() {}

    public OrderItem(int quantity, double price, Food food, Order order) {
        this.quantity = quantity;
        this.price = price;
        this.setFood(food); // Use setter to populate food details
        this.order = order;
    }

    // Getters & Setters
    public Long getId() { return id; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public Food getFood() { return food; }
    public void setFood(Food food) { 
        this.food = food;
        // Store food details for history and ID
        if (food != null) {
            this.foodId = food.getId();
            this.foodName = food.getName();
            this.foodDescription = food.getDescription();
            this.foodPrice = food.getPrice();
        }
    }

    public Long getFoodId() { return foodId; }
    public void setFoodId(Long foodId) { this.foodId = foodId; }

    public String getFoodName() { return foodName != null ? foodName : (food != null ? food.getName() : "Unknown Food"); }
    public void setFoodName(String foodName) { this.foodName = foodName; }

    public String getFoodDescription() { return foodDescription != null ? foodDescription : (food != null ? food.getDescription() : ""); }
    public void setFoodDescription(String foodDescription) { this.foodDescription = foodDescription; }

    public double getFoodPrice() { return foodPrice > 0 ? foodPrice : (food != null ? food.getPrice() : 0); }
    public void setFoodPrice(double foodPrice) { this.foodPrice = foodPrice; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
}
