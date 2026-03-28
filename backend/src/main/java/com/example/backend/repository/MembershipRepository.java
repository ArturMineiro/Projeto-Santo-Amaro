package com.example.backend.repository;

import com.example.backend.entity.Membership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MembershipRepository extends JpaRepository<Membership, Long> {
    Optional<Membership> findTopByUserIdOrderByIdDesc(Long userId);
}