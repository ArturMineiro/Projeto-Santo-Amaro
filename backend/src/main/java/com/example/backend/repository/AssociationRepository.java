package com.example.backend.repository;

import com.example.backend.entity.AssociationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AssociationRepository extends JpaRepository<AssociationEntity, Long> {
    Optional<AssociationEntity> findByEmail(String email);
}