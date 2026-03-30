package com.example.backend.service;

import com.example.backend.dto.AssociationResponseDTO;
import com.example.backend.dto.LoginRequestDTO;
import com.example.backend.dto.LoginResponseDTO;
import com.example.backend.dto.MeResponseDTO;
import com.example.backend.dto.RegisterRequestDTO;
import com.example.backend.entity.AssociationEntity;
import com.example.backend.repository.AssociationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AuthService {

    @Autowired
    private AssociationRepository associationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Map<String, Object> register(RegisterRequestDTO request) {

        if (!request.getPassword().equals(request.getPasswordConfirmation())) {
            throw new RuntimeException("As senhas não coincidem");
        }

        if (associationRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Já existe uma associação com esse email");
        }

        AssociationEntity association = new AssociationEntity();
        association.setName(request.getName());
        association.setDocumentNumber(request.getDocumentNumber());
        association.setEmail(request.getEmail());
        association.setPhone(request.getPhone());
        association.setPassword(passwordEncoder.encode(request.getPassword()));
        association.setZipCode(request.getZipCode());
        association.setStreet(request.getStreet());
        association.setNumber(request.getNumber());
        association.setComplement(request.getComplement());
        association.setNeighborhood(request.getNeighborhood());
        association.setCity(request.getCity());
        association.setState(request.getState());
        association.setApprovalStatus("pending");
        association.setIsActive(true);

        associationRepository.save(association);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Associação cadastrada com sucesso");
        response.put("association", toAssociationResponse(association));

        return response;
    }

    public LoginResponseDTO login(LoginRequestDTO request) {
        AssociationEntity association = associationRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Credenciais inválidas"));

        if (!passwordEncoder.matches(request.getPassword(), association.getPassword())) {
            throw new RuntimeException("Credenciais inválidas");
        }

        if (!Boolean.TRUE.equals(association.getIsActive())) {
            throw new RuntimeException("Associação inativa");
        }

        return new LoginResponseDTO("TOKEN_FAKE", toAssociationResponse(association));
    }

    public MeResponseDTO me(Long associationId) {
        AssociationEntity association = associationRepository.findById(associationId)
                .orElseThrow(() -> new RuntimeException("Associação não encontrada"));

        return new MeResponseDTO(toAssociationResponse(association));
    }

    private AssociationResponseDTO toAssociationResponse(AssociationEntity association) {
        AssociationResponseDTO dto = new AssociationResponseDTO();
        dto.setId(association.getId());
        dto.setName(association.getName());
        dto.setDocumentNumber(association.getDocumentNumber());
        dto.setEmail(association.getEmail());
        dto.setPhone(association.getPhone());
        dto.setZipCode(association.getZipCode());
        dto.setStreet(association.getStreet());
        dto.setNumber(association.getNumber());
        dto.setComplement(association.getComplement());
        dto.setNeighborhood(association.getNeighborhood());
        dto.setCity(association.getCity());
        dto.setState(association.getState());
        dto.setApprovalStatus(association.getApprovalStatus());
        dto.setIsActive(association.getIsActive());
        dto.setCreatedAt(association.getCreatedAt());
        dto.setUpdatedAt(association.getUpdatedAt());
        return dto;
    }
}