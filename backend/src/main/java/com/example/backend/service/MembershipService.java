package com.example.backend.service;

import com.example.backend.entity.Membership;
import com.example.backend.repository.MembershipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class MembershipService {

    @Autowired
    private MembershipRepository membershipRepository;

    public Membership approve(Long id) {
        Membership membership = membershipRepository.findById(id)
                .orElseThrow();

        membership.setStatus("approved");
        membership.setApprovedAt(LocalDateTime.now());
        membership.setRejectedAt(null);
        membership.setRejectionReason(null);

        return membershipRepository.save(membership);
    }

    public Membership reject(Long id, String reason) {
        Membership membership = membershipRepository.findById(id)
                .orElseThrow();

        membership.setStatus("rejected");
        membership.setApprovedAt(null);
        membership.setRejectedAt(LocalDateTime.now());
        membership.setRejectionReason(reason);

        return membershipRepository.save(membership);
    }
}