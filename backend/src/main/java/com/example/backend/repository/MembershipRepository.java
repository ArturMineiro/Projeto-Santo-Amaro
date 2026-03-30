package com.example.backend.repository;

import com.example.backend.entity.MembershipEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface MembershipRepository extends JpaRepository<MembershipEntity, Long> {
    Optional<MembershipEntity> findTopByUserIdOrderByIdDesc(Long userId);

    List<MembershipEntity> findByStatus(String status);

}