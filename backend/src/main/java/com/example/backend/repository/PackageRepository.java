package com.example.backend.repository;

import com.example.backend.entity.PackageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PackageRepository extends JpaRepository<PackageEntity, Long> {

    List<PackageEntity> findByAssociationId(Long associationId);

    List<PackageEntity> findByAssociationIdAndResidentId(Long associationId, Long residentId);
}