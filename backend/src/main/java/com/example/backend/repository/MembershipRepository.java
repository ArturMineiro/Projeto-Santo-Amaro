package com.example.backend.repository;

import com.example.backend.entity.MembershipEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MembershipRepository extends JpaRepository<MembershipEntity, Long> {
    Optional<MembershipEntity> findTopByUserIdOrderByIdDesc(Long userId);
}