package com.example.backend.service;

import com.example.backend.entity.AssociationEntity;
import com.example.backend.entity.PackageEntity;
import com.example.backend.entity.ResidentEntity;
import com.example.backend.repository.PackageRepository;
import com.example.backend.repository.ResidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PackageService {

    @Autowired
    private PackageRepository packageRepository;

    @Autowired
    private ResidentRepository residentRepository;

    public List<PackageEntity> list(AssociationEntity association) {
        return packageRepository.findByAssociationId(association.getId());
    }

    public List<PackageEntity> listByResident(AssociationEntity association, Long residentId) {
        return packageRepository.findByAssociationIdAndResidentId(
                association.getId(),
                residentId);
    }

    public PackageEntity create(
            AssociationEntity association,
            Long residentId,
            String receivedBy,
            String description,
            String photo) {
        ResidentEntity resident = residentRepository.findById(residentId)
                .orElseThrow(() -> new RuntimeException("Morador não encontrado"));

        if (!resident.getAssociation().getId().equals(association.getId())) {
            throw new RuntimeException("Este morador não pertence a esta associação");
        }

        PackageEntity pkg = new PackageEntity();
        pkg.setAssociation(association);
        pkg.setResident(resident);
        pkg.setReceivedBy(receivedBy);
        pkg.setDescription(description);
        pkg.setPhoto(photo);
        pkg.setStatus("received");
        pkg.setReceivedAt(LocalDateTime.now());

        return packageRepository.save(pkg);
    }

    public PackageEntity updateStatus(AssociationEntity association, Long id, String status) {
        PackageEntity pkg = packageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Encomenda não encontrada"));

        if (!pkg.getAssociation().getId().equals(association.getId())) {
            throw new RuntimeException("Esta encomenda não pertence a esta associação");
        }

        pkg.setStatus(status);

        if ("delivered".equals(status)) {
            pkg.setDeliveredAt(LocalDateTime.now());
        }

        return packageRepository.save(pkg);
    }
}