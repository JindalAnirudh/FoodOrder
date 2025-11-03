package com.foodapp.food_ordering_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.validator.constraints.ISBN;

@Entity
@Table(name = "users")
@Data //Lombok: generates getters, setters , toString
@NoArgsConstructor
@AllArgsConstructor

public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; //CUSTOMER OR ADMIN
}
