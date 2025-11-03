package com.foodapp.food_ordering_backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;



@Entity
public class Food {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Food name cannot be empty")
    @Size(min = 2, max = 50, message = "Food name must be between 2 and 50 characters")
    private String name;

    @Min(value = 1, message = "Price must be greater than 0")
    private double price; // Price in Indian Rupees (₹)


    @NotBlank(message = "Description is required and cannot be empty")
    @Size(min = 5, max = 200, message = "Description must be between 5 and 200 characters")
    private String description;

    private String category = "main-course"; // Default category

    //Contructors
    public Food() {}

    public Food(String name, double price, String description) {
        this.name = name;
        this.price = price;
        this.description = description;
        this.category = "main-course";
    }
    
    public Food(String name, double price, String description, String category) {
        this.name = name;
        this.price = price;
        this.description = description;
        this.category = category;
    }

    //Getters and setters
    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
    }
}
