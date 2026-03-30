package com.example.backend.service;

import com.example.backend.dto.ResidentRequestDTO;
import com.example.backend.entity.AssociationEntity;
import com.example.backend.entity.ResidentEntity;
import com.example.backend.repository.AssociationRepository;
import com.example.backend.repository.ResidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ResidentService {

    @Autowired
    private ResidentRepository residentRepository;

    @Autowired
    private AssociationRepository associationRepository;

    public ResidentEntity create(Long associationId, ResidentRequestDTO dto) {
        AssociationEntity association = associationRepository.findById(associationId)
                .orElseThrow(() -> new RuntimeException("Associação não encontrada"));

        ResidentEntity resident = new ResidentEntity();
        resident.setAssociation(association);
        resident.setName(dto.name);
        resident.setEmail(dto.email);
        resident.setPhone(dto.phone);
        resident.setZipCode(dto.zipCode);
        resident.setStreet(dto.street);
        resident.setNumber(dto.number);
        resident.setComplement(dto.complement);
        resident.setNeighborhood(dto.neighborhood);
        resident.setCity(dto.city);
        resident.setState(dto.state);

        return residentRepository.save(resident);
    }
}