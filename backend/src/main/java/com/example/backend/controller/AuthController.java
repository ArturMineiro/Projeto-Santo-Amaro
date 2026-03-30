package com.example.backend.controller;

import com.example.backend.dto.LoginRequestDTO;
import com.example.backend.dto.LoginResponseDTO;
import com.example.backend.dto.MeResponseDTO;
import com.example.backend.dto.RegisterRequestDTO;
import com.example.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

        @Autowired
        private AuthService authService;

        @PostMapping("/register")
        public ResponseEntity<?> register(@RequestBody @Valid RegisterRequestDTO request) {
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(authService.register(request));
        }

        @PostMapping("/login")
        public ResponseEntity<LoginResponseDTO> login(@RequestBody @Valid LoginRequestDTO request) {
                return ResponseEntity.ok(authService.login(request));
        }

        @GetMapping("/me/{associationId}")
        public ResponseEntity<MeResponseDTO> me(@PathVariable Long associationId) {
                return ResponseEntity.ok(authService.me(associationId));
        }
}