package com.foodapp.food_ordering_backend.repository;

import com.foodapp.food_ordering_backend.model.Food;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FoodRepository extends JpaRepository<Food, Long>{
}
