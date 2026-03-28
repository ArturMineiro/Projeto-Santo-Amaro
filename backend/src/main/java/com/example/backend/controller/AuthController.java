package com.example.backend.controller;

import com.example.backend.dto.RegisterRequest;
import com.example.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

        @Autowired
        private AuthService authService;

        @PostMapping("/register")
        public ResponseEntity<?> register(@RequestBody @Valid RegisterRequest request) {
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(authService.register(request));
        }

        @PostMapping("/login")
        public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
                return ResponseEntity.ok(
                                authService.login(
                                                request.get("email"),
                                                request.get("password")));
        }

        @GetMapping("/me/{userId}")
        public ResponseEntity<?> me(@PathVariable Long userId) {
                return ResponseEntity.ok(authService.me(userId));
        }
}