package com.example.backend.repository;

import com.example.backend.entity.ResidentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResidentRepository extends JpaRepository<ResidentEntity, Long> {
}