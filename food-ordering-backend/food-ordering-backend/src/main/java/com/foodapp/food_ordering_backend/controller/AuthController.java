package com.foodapp.food_ordering_backend.controller;

import com.foodapp.food_ordering_backend.config.JwtUtil;
import com.foodapp.food_ordering_backend.model.User;
import com.foodapp.food_ordering_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

	@Autowired
	private UserRepository userRepository;
	@Autowired
	private JwtUtil jwtUtil;
	@Autowired
	private PasswordEncoder passwordEncoder;
	@Autowired
	private AuthenticationManager authenticationManager;

	@PostMapping("/register")
	public ResponseEntity<?> register(@RequestBody User user) {
		if (userRepository.existsByUsername(user.getUsername())) {
			return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
		}
		if (userRepository.existsByEmail(user.getEmail())) {
			return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
		}
		
		// SECURITY: Force all new registrations to be CUSTOMER role
		// Only existing admins can create new admin accounts through separate admin endpoints
		user.setRole("CUSTOMER");
		
		user.setPassword(passwordEncoder.encode(user.getPassword()));
		userRepository.save(user);
		return ResponseEntity.ok(Map.of("message", "User registered successfully"));
	}

	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
		try {
			authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(
							loginRequest.get("username"),
							loginRequest.get("password")
					)
			);
			User user = userRepository.findByUsername(loginRequest.get("username")).orElseThrow();
			String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
			Map<String, Object> response = new HashMap<>();
			response.put("token", token);
			response.put("role", user.getRole());
			response.put("username", user.getUsername());
			return ResponseEntity.ok(response);
		} catch (AuthenticationException e) {
			return ResponseEntity.status(401).body(Map.of("error", "Invalid username or password"));
		}
	}
	
	// SECURE ADMIN CREATION - Only accessible by existing admins
	@PostMapping("/create-admin")
	public ResponseEntity<?> createAdmin(@RequestBody User adminUser, @RequestHeader("Authorization") String token) {
		try {
			// Extract and validate JWT token
			String jwtToken = token.replace("Bearer ", "");
			String currentUsername = jwtUtil.extractUsername(jwtToken);
			
			// Verify the current user is an admin
			User currentUser = userRepository.findByUsername(currentUsername)
				.orElseThrow(() -> new RuntimeException("User not found"));
			
			if (!"ADMIN".equals(currentUser.getRole())) {
				return ResponseEntity.status(403).body(Map.of("error", "Only admins can create admin accounts"));
			}
			
			// Check if admin user already exists
			if (userRepository.existsByUsername(adminUser.getUsername())) {
				return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
			}
			if (userRepository.existsByEmail(adminUser.getEmail())) {
				return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
			}
			
			// Create new admin
			adminUser.setRole("ADMIN");
			adminUser.setPassword(passwordEncoder.encode(adminUser.getPassword()));
			userRepository.save(adminUser);
			
			return ResponseEntity.ok(Map.of("message", "Admin user created successfully"));
			
		} catch (Exception e) {
			return ResponseEntity.status(403).body(Map.of("error", "Unauthorized: " + e.getMessage()));
		}
	}
}
