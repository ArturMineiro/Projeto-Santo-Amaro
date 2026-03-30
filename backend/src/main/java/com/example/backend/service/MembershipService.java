package com.example.backend.service;

import com.example.backend.dto.MembershipResponseDTO;
import com.example.backend.entity.MembershipEntity;
import com.example.backend.repository.MembershipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MembershipService {

    @Autowired
    private MembershipRepository membershipRepository;

    public List<MembershipResponseDTO> listPending() {
        return membershipRepository.findByStatus("pending")
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public MembershipResponseDTO approve(Long id) {
        MembershipEntity membership = membershipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vínculo não encontrado"));

        membership.setStatus("approved");
        membership.setApprovedAt(LocalDateTime.now());
        membership.setRejectionReason(null);

        MembershipEntity saved = membershipRepository.save(membership);
        return toResponse(saved);
    }

    public MembershipResponseDTO reject(Long id, String rejectionReason) {
        MembershipEntity membership = membershipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vínculo não encontrado"));

        membership.setStatus("rejected");
        membership.setRejectionReason(rejectionReason);
        membership.setApprovedAt(null);

        MembershipEntity saved = membershipRepository.save(membership);
        return toResponse(saved);
    }

    private MembershipResponseDTO toResponse(MembershipEntity membership) {
        MembershipResponseDTO dto = new MembershipResponseDTO();

        dto.setId(membership.getId());
        dto.setStatus(membership.getStatus());
        dto.setApprovedAt(
                membership.getApprovedAt() != null ? membership.getApprovedAt().toString() : null);
        dto.setRejectionReason(membership.getRejectionReason());

        if (membership.getUser() != null) {
            dto.setUserId(membership.getUser().getId());
            dto.setUserName(membership.getUser().getName());
            dto.setUserEmail(membership.getUser().getEmail());
        }

        if (membership.getAssociation() != null) {
            dto.setAssociationId(membership.getAssociation().getId());
            dto.setAssociationName(membership.getAssociation().getName());
        }

        return dto;
    }
}