package com.example.backend.service;

import com.example.backend.entity.*;
import com.example.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PackageService {

    @Autowired
    private PackageRepository packageRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    public List<PackageEntity> list(UserEntity user) {

        MembershipEntity membership = membershipRepository
                .findTopByUserIdOrderByIdDesc(user.getId())
                .orElseThrow();

        if ("resident".equals(user.getRole())) {
            return packageRepository.findByAssociationIdAndResidentId(
                    membership.getAssociation().getId(),
                    user.getId());
        }

        return packageRepository.findByAssociationId(
                membership.getAssociation().getId());
    }

    public PackageEntity create(UserEntity user, Long residentId, String description, String trackingCode) {

        MembershipEntity membership = membershipRepository
                .findTopByUserIdOrderByIdDesc(user.getId())
                .orElseThrow();

        PackageEntity pkg = new PackageEntity();
        pkg.setAssociation(membership.getAssociation());
        pkg.setResident(new UserEntity(residentId));
        pkg.setReceiver(user);
        pkg.setDescription(description);
        pkg.setTrackingCode(trackingCode);
        pkg.setStatus("pending");
        pkg.setArrivalDate(LocalDateTime.now());

        return packageRepository.save(pkg);
    }

    public PackageEntity updateStatus(Long id, String status) {

        PackageEntity pkg = packageRepository.findById(id).orElseThrow();

        pkg.setStatus(status);

        if ("notified".equals(status)) {
            pkg.setNotificationSentAt(LocalDateTime.now());
        }

        if ("picked_up".equals(status)) {
            pkg.setPickedUpAt(LocalDateTime.now());
        }

        return packageRepository.save(pkg);
    }
}