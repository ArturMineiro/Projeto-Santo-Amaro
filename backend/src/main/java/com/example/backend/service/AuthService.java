package com.example.backend.service;

import com.example.backend.dto.RegisterRequest;
import com.example.backend.entity.Membership;
import com.example.backend.entity.User;
import com.example.backend.repository.MembershipRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Map<String, Object> register(RegisterRequest request) {

        if (!request.getPassword().equals(request.getPassword_confirmation())) {
            throw new RuntimeException("As senhas não coincidem");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Já existe um usuário com esse email");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("association_admin");
        user.setIsActive(true);

        userRepository.save(user);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Usuário criado com sucesso");
        response.put("user", user);

        return response;
    }

    public Map<String, Object> login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Credenciais inválidas"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Credenciais inválidas");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new RuntimeException("Usuário inativo");
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("token", "TOKEN_FAKE");
        response.put("user", user);

        return response;
    }

    public Map<String, Object> me(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        Membership membership = membershipRepository
                .findTopByUserIdOrderByIdDesc(user.getId())
                .orElse(null);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("user", user);
        response.put("membership", membership);
        response.put("association", membership != null ? membership.getAssociation() : null);

        return response;
    }
}