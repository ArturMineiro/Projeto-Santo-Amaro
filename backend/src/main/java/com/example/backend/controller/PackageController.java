package com.example.backend.controller;

import com.example.backend.entity.AssociationEntity;
import com.example.backend.entity.PackageEntity;
import com.example.backend.repository.AssociationRepository;
import com.example.backend.service.PackageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/packages")
public class PackageController {

    @Autowired
    private PackageService packageService;

    @Autowired
    private AssociationRepository associationRepository;

    private AssociationEntity getFakeAssociation() {
        return associationRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Associação não encontrada"));
    }

    @GetMapping
    public List<PackageEntity> index(
            @RequestParam(required = false) Long residentId) {
        AssociationEntity association = getFakeAssociation();

        if (residentId != null) {
            return packageService.listByResident(association, residentId);
        }

        return packageService.list(association);
    }

    @PostMapping
    public PackageEntity store(@RequestBody Map<String, String> body) {
        AssociationEntity association = getFakeAssociation();

        return packageService.create(
                association,
                Long.parseLong(body.get("resident_id")),
                body.get("received_by"),
                body.get("description"),
                body.get("photo"));
    }

    @PatchMapping("/{id}/status")
    public PackageEntity updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        AssociationEntity association = getFakeAssociation();

        return packageService.updateStatus(
                association,
                id,
                body.get("status"));
    }
}